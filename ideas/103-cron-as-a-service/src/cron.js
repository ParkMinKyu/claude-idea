// Cron expression parser + next-run calculator. Pure, dependency-free, UTC-based.
// Supports 5-field crontab: minute hour day-of-month month day-of-week.
// Fields: number, *, a-b range, */step, a,b,c lists, and step on ranges (a-b/step).

const BOUNDS = [
  [0, 59], // minute
  [0, 23], // hour
  [1, 31], // day of month
  [1, 12], // month
  [0, 6], // day of week (0 = Sunday)
];

const NAMES = {
  3: { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 },
  4: { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 },
};

function parseField(field, idx) {
  const [lo, hi] = BOUNDS[idx];
  const names = NAMES[idx] ?? {};
  const allowed = new Set();
  for (const part of field.split(",")) {
    let [rangePart, stepPart] = part.split("/");
    const step = stepPart ? Number(stepPart) : 1;
    if (!Number.isInteger(step) || step < 1) throw new Error(`bad step in "${part}"`);
    let start, end;
    if (rangePart === "*") {
      start = lo;
      end = hi;
    } else if (rangePart.includes("-")) {
      const [a, b] = rangePart.split("-").map((x) => resolve(x, names));
      start = a;
      end = b;
    } else {
      start = end = resolve(rangePart, names);
    }
    if (start < lo || end > hi || start > end) throw new Error(`out of range: "${part}"`);
    for (let v = start; v <= end; v += step) allowed.add(v);
  }
  return allowed;
}

function resolve(token, names) {
  const lower = token.toLowerCase();
  if (lower in names) return names[lower];
  const n = Number(token);
  if (!Number.isInteger(n)) throw new Error(`invalid token: "${token}"`);
  return n;
}

/** Parse a 5-field cron expression into matcher sets. Throws on invalid input. */
export function parseCron(expr) {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) throw new Error(`expected 5 fields, got ${fields.length}`);
  return {
    minute: parseField(fields[0], 0),
    hour: parseField(fields[1], 1),
    dom: parseField(fields[2], 2),
    month: parseField(fields[3], 3),
    dow: parseField(fields[4], 4),
    raw: expr.trim(),
  };
}

function matches(parsed, d) {
  // crontab semantics: if both DOM and DOW are restricted, either may match.
  const domRestricted = parsed.dom.size !== 31;
  const dowRestricted = parsed.dow.size !== 7;
  const domOk = parsed.dom.has(d.getUTCDate());
  const dowOk = parsed.dow.has(d.getUTCDay());
  const dayOk =
    domRestricted && dowRestricted ? domOk || dowOk : domOk && dowOk;
  return (
    parsed.minute.has(d.getUTCMinutes()) &&
    parsed.hour.has(d.getUTCHours()) &&
    parsed.month.has(d.getUTCMonth() + 1) &&
    dayOk
  );
}

/** Next fire time strictly after `from` (Date). Returns Date or null within 4 years. */
export function nextRun(parsed, from = new Date()) {
  const d = new Date(from.getTime());
  d.setUTCSeconds(0, 0);
  d.setUTCMinutes(d.getUTCMinutes() + 1);
  const limit = 4 * 366 * 24 * 60; // minutes to scan
  for (let i = 0; i < limit; i++) {
    if (matches(parsed, d)) return new Date(d.getTime());
    d.setUTCMinutes(d.getUTCMinutes() + 1);
  }
  return null;
}

/** Return the next N fire times. */
export function nextRuns(expr, count = 5, from = new Date()) {
  const parsed = parseCron(expr);
  const out = [];
  let cursor = from;
  for (let i = 0; i < count; i++) {
    const n = nextRun(parsed, cursor);
    if (!n) break;
    out.push(n);
    cursor = n;
  }
  return out;
}
