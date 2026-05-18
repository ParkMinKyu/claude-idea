import { describe, it, expect } from "vitest";
import {
  findAvailableSlots,
  quoteDeposit,
  refundForCancellation,
  lockSlot,
  confirmBooking,
  cancelBooking,
  overlaps,
} from "../src/booking.js";

describe("overlaps", () => {
  it("detects overlapping intervals", () => {
    expect(overlaps(new Date("2026-06-01T10:00Z"), new Date("2026-06-01T12:00Z"), new Date("2026-06-01T11:00Z"), new Date("2026-06-01T13:00Z"))).toBe(true);
  });
  it("treats touching intervals as non-overlapping", () => {
    expect(overlaps(new Date("2026-06-01T10:00Z"), new Date("2026-06-01T12:00Z"), new Date("2026-06-01T12:00Z"), new Date("2026-06-01T14:00Z"))).toBe(false);
  });
});

describe("findAvailableSlots", () => {
  it("skips slots that collide with existing bookings", () => {
    const bookings = [{ status: "confirmed", startsAt: "2026-06-01T12:00:00Z", endsAt: "2026-06-01T14:00:00Z" }];
    const slots = findAvailableSlots({
      rangeStart: "2026-06-01T10:00:00Z",
      rangeEnd: "2026-06-01T16:00:00Z",
      durationMinutes: 120,
      bookings,
      workingHours: { start: 10, end: 18 },
    });
    const starts = slots.map((s) => s.startsAt);
    expect(starts).toContain("2026-06-01T10:00:00.000Z");
    expect(starts).toContain("2026-06-01T14:00:00.000Z");
    expect(starts).not.toContain("2026-06-01T12:00:00.000Z");
  });

  it("respects working hours", () => {
    const slots = findAvailableSlots({
      rangeStart: "2026-06-01T00:00:00Z",
      rangeEnd: "2026-06-02T00:00:00Z",
      durationMinutes: 60,
      bookings: [],
      workingHours: { start: 10, end: 18 },
    });
    expect(slots.every((s) => {
      const h = new Date(s.startsAt).getUTCHours();
      return h >= 10 && h < 18;
    })).toBe(true);
  });
});

describe("quoteDeposit", () => {
  it("uses percentage when above minimum", () => {
    expect(quoteDeposit({ estimatedTotalCents: 100000, percentage: 30 })).toBe(30000);
  });
  it("floors at minimum deposit", () => {
    expect(quoteDeposit({ estimatedTotalCents: 5000, percentage: 30, minDepositCents: 3000 })).toBe(3000);
  });
});

describe("refundForCancellation", () => {
  const policy = [
    { hoursBefore: 168, refundPct: 100 },
    { hoursBefore: 48, refundPct: 50 },
  ];
  it("returns full refund when far in advance", () => {
    expect(
      refundForCancellation({
        depositCents: 10000,
        scheduledAt: "2026-06-15T00:00:00Z",
        cancelledAt: "2026-06-01T00:00:00Z",
        policy,
      })
    ).toBe(10000);
  });
  it("returns 50% within 168h but >=48h", () => {
    expect(
      refundForCancellation({
        depositCents: 10000,
        scheduledAt: "2026-06-15T00:00:00Z",
        cancelledAt: "2026-06-10T00:00:00Z",
        policy,
      })
    ).toBe(5000);
  });
  it("returns 0 when within 48h", () => {
    expect(
      refundForCancellation({
        depositCents: 10000,
        scheduledAt: "2026-06-15T00:00:00Z",
        cancelledAt: "2026-06-14T12:00:00Z",
        policy,
      })
    ).toBe(0);
  });
});

describe("lockSlot + confirm + cancel flow", () => {
  it("locks an available slot", () => {
    const { booking, bookings } = lockSlot({
      bookings: [],
      artistId: "A1",
      customerId: "C1",
      startsAt: "2026-06-01T10:00:00Z",
      endsAt: "2026-06-01T12:00:00Z",
      depositCents: 5000,
    });
    expect(booking.status).toBe("pending_payment");
    expect(bookings).toHaveLength(1);
  });

  it("rejects when slot conflicts", () => {
    const existing = [{ artistId: "A1", status: "pending_payment", startsAt: "2026-06-01T10:00:00Z", endsAt: "2026-06-01T12:00:00Z" }];
    expect(() =>
      lockSlot({
        bookings: existing,
        artistId: "A1",
        customerId: "C2",
        startsAt: "2026-06-01T11:00:00Z",
        endsAt: "2026-06-01T13:00:00Z",
        depositCents: 5000,
      })
    ).toThrow(/slot already taken/);
  });

  it("confirms pending booking", () => {
    const { booking } = lockSlot({
      bookings: [],
      artistId: "A1",
      customerId: "C1",
      startsAt: "2026-06-01T10:00:00Z",
      endsAt: "2026-06-01T12:00:00Z",
      depositCents: 5000,
    });
    expect(confirmBooking(booking).status).toBe("confirmed");
  });

  it("refunds full deposit when pending payment cancelled", () => {
    const { booking } = lockSlot({
      bookings: [],
      artistId: "A1",
      customerId: "C1",
      startsAt: "2026-06-01T10:00:00Z",
      endsAt: "2026-06-01T12:00:00Z",
      depositCents: 5000,
    });
    const { refundCents } = cancelBooking(booking);
    expect(refundCents).toBe(5000);
  });
});
