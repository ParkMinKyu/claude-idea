import { describe, it, expect } from "vitest";
import {
  createEvent,
  purchaseTicket,
  signTicketPayload,
  verifyTicketPayload,
  scanTicket,
  eventStats,
  createStore,
} from "../src/tickets.js";

const SECRET = "test-hmac-secret";

function buildEvent(store) {
  return createEvent(store, {
    id: "evt-1",
    name: "Indie Book Talk",
    ticketTypes: [
      { id: "early", priceCents: 1000, capacity: 2 },
      { id: "regular", priceCents: 2000, capacity: 10 },
    ],
  });
}

describe("createEvent + purchaseTicket", () => {
  it("issues tickets and enforces capacity", () => {
    const store = createStore();
    buildEvent(store);
    purchaseTicket(store, "evt-1", "early", { email: "a@x.com" });
    purchaseTicket(store, "evt-1", "early", { email: "b@x.com" });
    expect(() => purchaseTicket(store, "evt-1", "early", { email: "c@x.com" })).toThrow(/sold out/);
  });
  it("requires email", () => {
    const store = createStore();
    buildEvent(store);
    expect(() => purchaseTicket(store, "evt-1", "early", {})).toThrow();
  });
});

describe("sign/verify ticket payload", () => {
  it("round trips", () => {
    const ticket = { id: "tid", eventId: "evt-1", ticketTypeId: "early" };
    const payload = signTicketPayload(ticket, SECRET);
    const claim = verifyTicketPayload(payload, SECRET);
    expect(claim.ticketId).toBe("tid");
    expect(claim.eventId).toBe("evt-1");
  });
  it("rejects tampered payload", () => {
    const ticket = { id: "tid", eventId: "evt-1", ticketTypeId: "early" };
    const payload = signTicketPayload(ticket, SECRET);
    const [body, sig] = payload.split(".");
    const tampered = `${body}x.${sig}`;
    expect(() => verifyTicketPayload(tampered, SECRET)).toThrow();
  });
});

describe("scanTicket", () => {
  it("accepts first scan, rejects duplicate scan", () => {
    const store = createStore();
    buildEvent(store);
    const ticket = purchaseTicket(store, "evt-1", "regular", { email: "x@y.com" });
    const payload = signTicketPayload(ticket, SECRET);
    const a = scanTicket(store, payload, SECRET, "evt-1");
    expect(a.ok).toBe(true);
    const b = scanTicket(store, payload, SECRET, "evt-1");
    expect(b.ok).toBe(false);
    expect(b.reason).toBe("already_scanned");
  });
  it("rejects wrong event scanner", () => {
    const store = createStore();
    buildEvent(store);
    const ticket = purchaseTicket(store, "evt-1", "regular", { email: "x@y.com" });
    const payload = signTicketPayload(ticket, SECRET);
    expect(scanTicket(store, payload, SECRET, "evt-OTHER").reason).toBe("wrong_event");
  });
  it("rejects bad signature", () => {
    const store = createStore();
    buildEvent(store);
    expect(scanTicket(store, "garbage.payload", SECRET, "evt-1").reason).toBe("invalid_signature");
  });
});

describe("eventStats", () => {
  it("reports sold/scanned/remaining + revenue", () => {
    const store = createStore();
    buildEvent(store);
    const t1 = purchaseTicket(store, "evt-1", "early", { email: "a@x" });
    purchaseTicket(store, "evt-1", "regular", { email: "b@x" });
    scanTicket(store, signTicketPayload(t1, SECRET), SECRET, "evt-1");
    const stats = eventStats(store, "evt-1");
    expect(stats.issued).toBe(2);
    expect(stats.scanned).toBe(1);
    expect(stats.byType.early.sold).toBe(1);
    expect(stats.byType.regular.revenueCents).toBe(2000);
  });
});
