import { describe, it, expect } from "vitest";
import {
  transitionLocker,
  assignLocker,
  openRental,
  closeRental,
  outstandingRentals,
  consumePass,
  checkin,
  shiftReport,
} from "../src/lockers.js";

describe("locker state machine", () => {
  it("transitions idle -> in_use with member", () => {
    const l = { id: "L1", state: "idle", memberId: null };
    const next = transitionLocker(l, "in_use", { memberId: "M1" });
    expect(next.state).toBe("in_use");
    expect(next.memberId).toBe("M1");
  });

  it("rejects illegal transition idle -> dirty", () => {
    const l = { id: "L1", state: "idle", memberId: null };
    expect(() => transitionLocker(l, "dirty")).toThrow(/invalid transition/);
  });

  it("requires memberId when going in_use", () => {
    const l = { id: "L1", state: "idle", memberId: null };
    expect(() => transitionLocker(l, "in_use")).toThrow(/memberId required/);
  });
});

describe("assignLocker", () => {
  it("picks first idle locker", () => {
    const lockers = [
      { id: "L1", state: "in_use", memberId: "X" },
      { id: "L2", state: "idle", memberId: null },
    ];
    const out = assignLocker(lockers, "M1");
    expect(out.id).toBe("L2");
  });

  it("throws when no idle lockers available", () => {
    const lockers = [{ id: "L1", state: "in_use", memberId: "X" }];
    expect(() => assignLocker(lockers, "M1")).toThrow(/no idle lockers/);
  });
});

describe("rentals", () => {
  it("opens and closes a rental", () => {
    const r = openRental("M1", "towel");
    expect(r.returnedAt).toBeNull();
    const closed = closeRental(r);
    expect(closed.returnedAt).not.toBeNull();
  });

  it("lists outstanding rentals per member", () => {
    const rs = [openRental("M1", "towel"), closeRental(openRental("M1", "gown")), openRental("M2", "towel")];
    expect(outstandingRentals(rs, "M1")).toHaveLength(1);
  });
});

describe("pass consumption", () => {
  it("decrements count pass", () => {
    const out = consumePass({ kind: "count", remaining: 5 });
    expect(out.remaining).toBe(4);
  });

  it("rejects when insufficient balance", () => {
    expect(() => consumePass({ kind: "count", remaining: 0 })).toThrow(/insufficient/);
  });

  it("allows unlimited until expiry", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(consumePass({ kind: "unlimited", expiresAt: future }).kind).toBe("unlimited");
  });
});

describe("checkin atomic flow", () => {
  it("assigns locker, opens rental, decrements pass in one shot", () => {
    const lockers = [{ id: "L1", state: "idle", memberId: null }];
    const result = checkin({
      member: { id: "M9" },
      lockers,
      pass: { kind: "count", remaining: 3 },
    });
    expect(result.locker.memberId).toBe("M9");
    expect(result.pass.remaining).toBe(2);
    expect(result.rentals).toHaveLength(1);
  });
});

describe("shiftReport", () => {
  it("summarizes locker and rental state", () => {
    const lockers = [
      { id: "L1", state: "dirty", memberId: null },
      { id: "L2", state: "in_use", memberId: "M1" },
      { id: "L3", state: "idle", memberId: null },
    ];
    const rentals = [openRental("M1", "towel")];
    const report = shiftReport(lockers, rentals);
    expect(report.dirtyCount).toBe(1);
    expect(report.inUseCount).toBe(1);
    expect(report.unreturnedCount).toBe(1);
  });
});
