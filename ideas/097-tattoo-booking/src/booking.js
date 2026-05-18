// Booking domain — slot search, deposit quoting, cancellation refunds.
// Stripe and Prisma are kept outside this module; pass functions in for tests.

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function parseISO(s) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error(`invalid date: ${s}`);
  return d;
}

export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// Returns slots between rangeStart/end that don't collide with existing bookings.
export function findAvailableSlots({ rangeStart, rangeEnd, durationMinutes, bookings, workingHours }) {
  const start = parseISO(rangeStart);
  const end = parseISO(rangeEnd);
  const step = durationMinutes * MINUTE;
  const slots = [];
  for (let t = start.getTime(); t + step <= end.getTime(); t += step) {
    const s = new Date(t);
    const e = new Date(t + step);
    const hour = s.getUTCHours();
    if (hour < workingHours.start || hour >= workingHours.end) continue;
    const collision = bookings.some((b) =>
      b.status !== "cancelled" && overlaps(s, e, parseISO(b.startsAt), parseISO(b.endsAt))
    );
    if (!collision) slots.push({ startsAt: s.toISOString(), endsAt: e.toISOString() });
  }
  return slots;
}

// Deposit amount = max(min deposit, percentage of estimated total).
export function quoteDeposit({ estimatedTotalCents, percentage = 30, minDepositCents = 5000 }) {
  if (estimatedTotalCents <= 0) throw new Error("estimatedTotalCents must be positive");
  const pct = Math.round((estimatedTotalCents * percentage) / 100);
  return Math.max(pct, minDepositCents);
}

// Refund according to cancellation policy.
// policy = [{ hoursBefore: 168, refundPct: 100 }, { hoursBefore: 48, refundPct: 50 }, ...]
export function refundForCancellation({ depositCents, scheduledAt, cancelledAt, policy }) {
  const scheduled = parseISO(scheduledAt);
  const cancelled = parseISO(cancelledAt);
  if (cancelled > scheduled) return 0;
  const hoursBefore = Math.max(0, (scheduled.getTime() - cancelled.getTime()) / HOUR);
  const sorted = [...policy].sort((a, b) => b.hoursBefore - a.hoursBefore);
  const tier = sorted.find((p) => hoursBefore >= p.hoursBefore);
  const pct = tier ? tier.refundPct : 0;
  return Math.round((depositCents * pct) / 100);
}

// Lock a slot (pending payment). Returns next bookings list or throws on conflict.
export function lockSlot({ bookings, artistId, customerId, startsAt, endsAt, depositCents }) {
  const s = parseISO(startsAt);
  const e = parseISO(endsAt);
  if (e <= s) throw new Error("endsAt must be after startsAt");
  const conflict = bookings.some(
    (b) => b.artistId === artistId && b.status !== "cancelled" && overlaps(s, e, parseISO(b.startsAt), parseISO(b.endsAt))
  );
  if (conflict) throw new Error("slot already taken");
  const booking = {
    id: `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    artistId,
    customerId,
    startsAt,
    endsAt,
    depositCents,
    status: "pending_payment",
    createdAt: new Date().toISOString(),
  };
  return { booking, bookings: [...bookings, booking] };
}

export function confirmBooking(booking) {
  if (booking.status !== "pending_payment") throw new Error("not in pending_payment state");
  return { ...booking, status: "confirmed", confirmedAt: new Date().toISOString() };
}

export function cancelBooking(booking, { at = new Date(), policy = [] } = {}) {
  if (booking.status === "cancelled") throw new Error("already cancelled");
  const refundCents = booking.status === "confirmed"
    ? refundForCancellation({
        depositCents: booking.depositCents,
        scheduledAt: booking.startsAt,
        cancelledAt: at.toISOString(),
        policy,
      })
    : booking.depositCents;
  return {
    booking: { ...booking, status: "cancelled", cancelledAt: at.toISOString(), refundCents },
    refundCents,
  };
}
