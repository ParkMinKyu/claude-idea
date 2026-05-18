import { findAvailableSlots, quoteDeposit, lockSlot, confirmBooking, cancelBooking } from "./booking.js";

const existing = [
  { artistId: "A1", status: "confirmed", startsAt: "2026-06-01T13:00:00Z", endsAt: "2026-06-01T15:00:00Z" },
];

const slots = findAvailableSlots({
  rangeStart: "2026-06-01T10:00:00Z",
  rangeEnd: "2026-06-01T18:00:00Z",
  durationMinutes: 120,
  bookings: existing,
  workingHours: { start: 10, end: 18 },
});
console.log("available:", slots);

const deposit = quoteDeposit({ estimatedTotalCents: 30000 });
console.log("deposit cents:", deposit);

const { booking } = lockSlot({
  bookings: existing,
  artistId: "A1",
  customerId: "C9",
  startsAt: slots[0].startsAt,
  endsAt: slots[0].endsAt,
  depositCents: deposit,
});
const confirmed = confirmBooking(booking);
console.log("confirmed:", confirmed);

const cancelled = cancelBooking(confirmed, {
  at: new Date("2026-05-25T00:00:00Z"),
  policy: [
    { hoursBefore: 168, refundPct: 100 },
    { hoursBefore: 48, refundPct: 50 },
  ],
});
console.log("cancelled:", cancelled);
