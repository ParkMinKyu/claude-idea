// Compute free slots inside a working window and schedule deep work blocks.

export function freeSlots(window, events) {
  // window: { start: Date, end: Date }
  // events: [{ start: Date, end: Date }] sorted by start
  const sorted = [...events].sort((a, b) => +a.start - +b.start);
  const slots = [];
  let cursor = new Date(window.start);
  for (const ev of sorted) {
    if (ev.end <= cursor || ev.start >= window.end) continue;
    if (ev.start > cursor) {
      slots.push({ start: new Date(cursor), end: new Date(ev.start) });
    }
    if (ev.end > cursor) cursor = new Date(Math.min(+ev.end, +window.end));
  }
  if (cursor < window.end) {
    slots.push({ start: new Date(cursor), end: new Date(window.end) });
  }
  return slots;
}

export function scheduleBlocks(slots, { targetMinutes, minBlockMinutes = 60, preferStart }) {
  // Greedy: prefer larger slots closer to preferStart hour (0-23).
  const ranked = slots
    .map((s) => {
      const len = (s.end - s.start) / 60000;
      const hourDist = preferStart != null ? Math.abs(s.start.getHours() - preferStart) : 0;
      return { ...s, len, score: len - hourDist * 30 };
    })
    .filter((s) => s.len >= minBlockMinutes)
    .sort((a, b) => b.score - a.score);

  const blocks = [];
  let remaining = targetMinutes;
  for (const s of ranked) {
    if (remaining <= 0) break;
    const take = Math.min(s.len, remaining);
    blocks.push({
      start: new Date(s.start),
      end: new Date(+s.start + take * 60000),
      minutes: take,
    });
    remaining -= take;
  }
  return { blocks, scheduledMinutes: targetMinutes - remaining, shortfall: Math.max(0, remaining) };
}

export function detectIntrusion(blocks, newEvent) {
  // Return blocks that overlap with the new event.
  return blocks.filter((b) => +b.start < +newEvent.end && +b.end > +newEvent.start);
}

export function suggestAction(intrusion, rules) {
  // rules: { allowAttendees: string[], maxDurationMin: number }
  if (!intrusion) return "accept";
  if (rules.allowAttendees?.some((a) => intrusion.attendees?.includes(a))) return "accept";
  const minutes = (intrusion.end - intrusion.start) / 60000;
  if (minutes <= (rules.maxDurationMin ?? 15)) return "accept";
  return "propose-move";
}
