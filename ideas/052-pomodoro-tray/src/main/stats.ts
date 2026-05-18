export interface FocusEntry {
  label: string;
  startedAt: number;
  endedAt: number;
}

export function focusMinutes(entries: FocusEntry[]): number {
  return entries.reduce((sum, e) => sum + (e.endedAt - e.startedAt) / 60_000, 0);
}

export function groupByDay(entries: FocusEntry[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of entries) {
    const key = new Date(e.startedAt).toISOString().slice(0, 10);
    out[key] = (out[key] ?? 0) + (e.endedAt - e.startedAt) / 60_000;
  }
  return out;
}

export function groupByLabel(entries: FocusEntry[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of entries) {
    const k = e.label || "(no label)";
    out[k] = (out[k] ?? 0) + (e.endedAt - e.startedAt) / 60_000;
  }
  return out;
}

export function filterRange(
  entries: FocusEntry[],
  fromMs: number,
  toMs: number
): FocusEntry[] {
  return entries.filter((e) => e.startedAt >= fromMs && e.startedAt < toMs);
}

export function trimForFree(entries: FocusEntry[], maxAgeDays = 7, now = Date.now()): FocusEntry[] {
  const cutoff = now - maxAgeDays * 86400_000;
  return entries.filter((e) => e.startedAt >= cutoff);
}
