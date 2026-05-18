import { describe, it, expect } from "vitest";
import {
  generateSlots,
  canBook,
  applyBooking,
  evaluateRefund,
  reminderJobs,
  revenue,
} from "../src/booking.js";

const classDef = {
  id: "yoga-101",
  durationMin: 60,
  capacity: 6,
  priceCents: 25_000,
  recurrence: [
    { weekday: "tue", time: "19:00" },
    { weekday: "thu", time: "19:00" },
  ],
};

describe("generateSlots", () => {
  it("produces weekly slots over the requested window", () => {
    const slots = generateSlots(classDef, { startDate: "2025-01-01T00:00:00Z", weeks: 4 });
    expect(slots).toHaveLength(2 * 4);
    for (const s of slots) {
      expect(s.classId).toBe("yoga-101");
      expect(s.capacity).toBe(6);
    }
  });
  it("rejects bad weekday", () => {
    const bad = { ...classDef, recurrence: [{ weekday: "blursday", time: "10:00" }] };
    expect(() => generateSlots(bad)).toThrow();
  });
});

describe("canBook / applyBooking", () => {
  it("respects capacity", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const slot = { startAt: future, capacity: 2, booked: 1 };
    expect(canBook(slot, 1).ok).toBe(true);
    expect(canBook(slot, 2).ok).toBe(false);
    const updated = applyBooking(slot);
    expect(updated.booked).toBe(2);
  });
  it("rejects past slots", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const slot = { startAt: past, capacity: 5, booked: 0 };
    expect(canBook(slot).ok).toBe(false);
  });
});

describe("evaluateRefund", () => {
  const policy = { fullRefundHoursBefore: 24, partialRefundHoursBefore: 4, partialPercent: 50 };
  it("returns full refund well before start", () => {
    const slot = { startAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString() };
    expect(evaluateRefund(slot, policy).refundPercent).toBe(100);
  });
  it("returns partial refund inside partial window", () => {
    const slot = { startAt: new Date(Date.now() + 6 * 3600 * 1000).toISOString() };
    expect(evaluateRefund(slot, policy).refundPercent).toBe(50);
  });
  it("returns no refund near start", () => {
    const slot = { startAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() };
    expect(evaluateRefund(slot, policy).refundPercent).toBe(0);
  });
});

describe("reminderJobs", () => {
  it("flags 24h and 1h reminders", () => {
    const now = Date.now();
    const slots = [
      { startAt: new Date(now + 24 * 3600 * 1000).toISOString() },
      { startAt: new Date(now + 60 * 60 * 1000).toISOString() },
      { startAt: new Date(now + 5 * 3600 * 1000).toISOString() },
    ];
    const jobs = reminderJobs(slots, now);
    expect(jobs.map((j) => j.type).sort()).toEqual(["1h", "24h"]);
  });
});

describe("revenue", () => {
  it("sums gross, refunded, net", () => {
    const r = revenue([
      { amountCents: 25_000 },
      { amountCents: 25_000, refundCents: 25_000 },
      { amountCents: 30_000, refundCents: 15_000 },
    ]);
    expect(r.gross).toBe(80_000);
    expect(r.refunded).toBe(40_000);
    expect(r.net).toBe(40_000);
    expect(r.count).toBe(3);
  });
});
