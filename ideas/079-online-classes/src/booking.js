// Online classes booking MVP — recurring slot generation, capacity
// management, refund policy evaluation.

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_TO_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

export function generateSlots(classDef, opts = {}) {
  if (!classDef.recurrence) throw new Error("recurrence required");
  const startDate = opts.startDate ? new Date(opts.startDate) : new Date();
  const weeks = opts.weeks ?? 8;
  const slots = [];
  for (let w = 0; w < weeks; w++) {
    for (const rule of classDef.recurrence) {
      const targetDow = WEEKDAY_TO_INDEX[rule.weekday];
      if (targetDow == null) throw new Error(`bad weekday ${rule.weekday}`);
      const base = new Date(startDate.getTime() + w * 7 * DAY_MS);
      const diff = (targetDow - base.getUTCDay() + 7) % 7;
      const day = new Date(base.getTime() + diff * DAY_MS);
      const [h, m] = rule.time.split(":").map(Number);
      day.setUTCHours(h, m, 0, 0);
      slots.push({
        classId: classDef.id,
        startAt: day.toISOString(),
        durationMin: classDef.durationMin,
        capacity: classDef.capacity,
        booked: 0,
        priceCents: classDef.priceCents,
      });
    }
  }
  return slots;
}

export function canBook(slot, partySize = 1) {
  if (slot.booked + partySize > slot.capacity) {
    return { ok: false, reason: "slot_full" };
  }
  if (new Date(slot.startAt).getTime() < Date.now()) {
    return { ok: false, reason: "in_past" };
  }
  return { ok: true };
}

export function applyBooking(slot, partySize = 1) {
  const c = canBook(slot, partySize);
  if (!c.ok) throw new Error(c.reason);
  return { ...slot, booked: slot.booked + partySize };
}

// Refund policy supports two parameters:
//   - fullRefundHoursBefore: full refund if cancel ≥ N hours before start
//   - partialRefundHoursBefore + partialPercent: partial refund window
export function evaluateRefund(slot, policy, nowMs = Date.now()) {
  const start = new Date(slot.startAt).getTime();
  const hoursToStart = (start - nowMs) / (60 * 60 * 1000);
  if (hoursToStart >= (policy.fullRefundHoursBefore ?? Infinity)) {
    return { refundPercent: 100, note: "full_refund" };
  }
  if (
    policy.partialRefundHoursBefore != null &&
    hoursToStart >= policy.partialRefundHoursBefore
  ) {
    return { refundPercent: policy.partialPercent ?? 50, note: "partial_refund" };
  }
  return { refundPercent: 0, note: "no_refund" };
}

export function reminderJobs(slots, nowMs = Date.now()) {
  // Determine which slots need a reminder right now (24h or 1h before).
  const jobs = [];
  const HOUR = 60 * 60 * 1000;
  for (const s of slots) {
    const start = new Date(s.startAt).getTime();
    const delta = start - nowMs;
    if (Math.abs(delta - 24 * HOUR) < 5 * 60 * 1000) jobs.push({ slot: s, type: "24h" });
    if (Math.abs(delta - 1 * HOUR) < 5 * 60 * 1000) jobs.push({ slot: s, type: "1h" });
  }
  return jobs;
}

export function revenue(bookings) {
  let gross = 0;
  let refunded = 0;
  for (const b of bookings) {
    gross += b.amountCents;
    if (b.refundCents) refunded += b.refundCents;
  }
  const net = gross - refunded;
  return { gross, refunded, net, count: bookings.length };
}
