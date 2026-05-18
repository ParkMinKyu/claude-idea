import { describe, it, expect } from "vitest";
import {
  priceForCycle,
  makeReservation,
  isReservationExpired,
  reserveMachine,
  buildCheckoutSession,
  handlePaymentSucceeded,
  rollupRevenue,
} from "../src/pos.js";

const machine = {
  id: "M-1",
  label: "세탁기 #1",
  currency: "krw",
  pricing: { wash: 4000, dry: 3000 },
};

describe("priceForCycle", () => {
  it("returns price for valid cycle", () => {
    expect(priceForCycle(machine, "wash")).toBe(4000);
  });
  it("throws for unknown cycle", () => {
    expect(() => priceForCycle(machine, "bogus")).toThrow(/unknown cycle/);
  });
});

describe("reservation TTL", () => {
  it("expires after ttlMinutes", () => {
    const now = new Date("2026-05-18T10:00:00Z");
    const r = makeReservation({ machineId: "M-1", userId: "U1", now, ttlMinutes: 5 });
    expect(isReservationExpired(r, new Date("2026-05-18T10:04:59Z"))).toBe(false);
    expect(isReservationExpired(r, new Date("2026-05-18T10:05:00Z"))).toBe(true);
  });

  it("reserveMachine returns existing active reservation for same user", () => {
    const now = new Date();
    const existing = makeReservation({ machineId: "M-1", userId: "U1", now });
    const r = reserveMachine({ reservations: [existing], machineId: "M-1", userId: "U1", now });
    expect(r.id).toBe(existing.id);
  });

  it("reserveMachine rejects when held by another user", () => {
    const now = new Date();
    const existing = makeReservation({ machineId: "M-1", userId: "U1", now });
    expect(() => reserveMachine({ reservations: [existing], machineId: "M-1", userId: "U2", now })).toThrow(/already reserved/);
  });

  it("reserveMachine creates new when previous expired", () => {
    const old = makeReservation({ machineId: "M-1", userId: "U1", now: new Date("2026-01-01T00:00:00Z") });
    const r = reserveMachine({ reservations: [old], machineId: "M-1", userId: "U2", now: new Date() });
    expect(r.userId).toBe("U2");
  });
});

describe("buildCheckoutSession", () => {
  it("uses cycle price and metadata", () => {
    const s = buildCheckoutSession({ machine, cycle: "dry", userId: "U1", successUrl: "s", cancelUrl: "c" });
    expect(s.line_items[0].price_data.unit_amount).toBe(3000);
    expect(s.metadata.cycle).toBe("dry");
    expect(s.metadata.userId).toBe("U1");
  });
});

describe("handlePaymentSucceeded", () => {
  const event = {
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_1",
        amount_total: 4000,
        metadata: { machineId: "M-1", cycle: "wash", userId: "U9" },
      },
    },
  };

  it("issues unlock and records ok status", async () => {
    const calls = [];
    const adapter = { unlock: async (m, ctx) => calls.push({ id: m.id, ctx }) };
    const { transaction } = await handlePaymentSucceeded({ event, machinesById: { "M-1": machine }, unlockAdapter: adapter });
    expect(transaction.unlockStatus).toBe("ok");
    expect(calls).toHaveLength(1);
  });

  it("records failure when unlock throws", async () => {
    const adapter = { unlock: async () => { throw new Error("offline"); } };
    const { transaction } = await handlePaymentSucceeded({ event, machinesById: { "M-1": machine }, unlockAdapter: adapter });
    expect(transaction.unlockStatus).toBe("failed");
    expect(transaction.unlockError).toBe("offline");
  });

  it("ignores unrelated webhook events", async () => {
    const out = await handlePaymentSucceeded({ event: { type: "charge.succeeded" }, machinesById: {}, unlockAdapter: {} });
    expect(out.ignored).toBe(true);
  });
});

describe("rollupRevenue", () => {
  it("sums only successful unlocks", () => {
    const txs = [
      { machineId: "M-1", amountCents: 4000, paidAt: "2026-05-18T10:00:00Z", unlockStatus: "ok" },
      { machineId: "M-1", amountCents: 4000, paidAt: "2026-05-18T11:00:00Z", unlockStatus: "failed" },
      { machineId: "M-2", amountCents: 3000, paidAt: "2026-05-18T12:00:00Z", unlockStatus: "ok" },
    ];
    const out = rollupRevenue(txs);
    expect(out.totalCents).toBe(7000);
    expect(out.count).toBe(2);
    expect(out.byMachine["M-1"]).toBe(4000);
    expect(out.byMachine["M-2"]).toBe(3000);
  });
});
