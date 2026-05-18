// Aggregate raw activity events into focus score, time buckets, and weekly report.

const FOCUS_CATEGORIES = new Set(["code", "writing", "design", "research"]);
const DISTRACT_CATEGORIES = new Set(["distract", "social"]);

export function focusScore(events) {
  let focus = 0;
  let active = 0;
  for (const e of events) {
    if (e.idle) continue;
    active += e.durationMs;
    if (FOCUS_CATEGORIES.has(e.category)) focus += e.durationMs;
  }
  if (active === 0) return 0;
  return Math.round((focus / active) * 100);
}

export function bucketBy(events, bucketMs = 30 * 60 * 1000, dayStart = startOfDay(new Date())) {
  const dayStartMs = +dayStart;
  const buckets = new Map(); // bucketIndex -> { category -> ms }
  for (const e of events) {
    if (e.idle) continue;
    const idx = Math.floor((e.at - dayStartMs) / bucketMs);
    if (!buckets.has(idx)) buckets.set(idx, {});
    const b = buckets.get(idx);
    b[e.category] = (b[e.category] ?? 0) + e.durationMs;
  }
  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([idx, byCat]) => ({
      startMs: dayStartMs + idx * bucketMs,
      byCategory: byCat,
    }));
}

export function blockerImpact(blockEvents) {
  // blockEvents: [{ url, at, blockedDurationMs }]
  let attempts = 0;
  let savedMs = 0;
  const byHost = {};
  for (const e of blockEvents) {
    attempts++;
    savedMs += e.blockedDurationMs ?? 0;
    const host = safeHost(e.url);
    byHost[host] = (byHost[host] ?? 0) + 1;
  }
  return { attempts, savedMs, topHosts: Object.entries(byHost).sort((a, b) => b[1] - a[1]).slice(0, 5) };
}

export function weeklyReport({ events = [], blocks = [], goalsMinutes = {} } = {}) {
  const byDay = {};
  for (const e of events) {
    if (e.idle) continue;
    const day = new Date(e.at).toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(e);
  }
  const days = Object.entries(byDay).map(([day, evs]) => ({
    day,
    score: focusScore(evs),
    totalMs: evs.reduce((s, e) => s + (e.idle ? 0 : e.durationMs), 0),
  }));
  const totalFocusMs = events
    .filter((e) => !e.idle && FOCUS_CATEGORIES.has(e.category))
    .reduce((s, e) => s + e.durationMs, 0);
  const goalProgress = {};
  for (const [cat, mins] of Object.entries(goalsMinutes)) {
    const actual = events
      .filter((e) => !e.idle && e.category === cat)
      .reduce((s, e) => s + e.durationMs, 0) / 60000;
    goalProgress[cat] = { goal: mins, actual: Math.round(actual), pct: Math.min(100, Math.round((actual / mins) * 100)) };
  }
  return {
    days,
    totalFocusMs,
    blockerImpact: blockerImpact(blocks),
    goalProgress,
  };
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function safeHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}
