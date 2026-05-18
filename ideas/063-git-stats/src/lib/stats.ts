export interface Commit {
  hash: string;
  author: string;
  email: string;
  date: string; // ISO
  filesChanged: string[];
  additions?: number;
  deletions?: number;
}

export interface ContributorStat {
  author: string;
  commits: number;
  additions: number;
  deletions: number;
}

export function byContributor(commits: Commit[]): ContributorStat[] {
  const m = new Map<string, ContributorStat>();
  for (const c of commits) {
    const cur =
      m.get(c.author) ?? { author: c.author, commits: 0, additions: 0, deletions: 0 };
    cur.commits += 1;
    cur.additions += c.additions ?? 0;
    cur.deletions += c.deletions ?? 0;
    m.set(c.author, cur);
  }
  return [...m.values()].sort((a, b) => b.commits - a.commits);
}

/** files modified most often -> refactoring candidates */
export function hotspots(commits: Commit[], top = 10): { file: string; touches: number }[] {
  const m = new Map<string, number>();
  for (const c of commits) for (const f of c.filesChanged) m.set(f, (m.get(f) ?? 0) + 1);
  return [...m.entries()]
    .map(([file, touches]) => ({ file, touches }))
    .sort((a, b) => b.touches - a.touches)
    .slice(0, top);
}

/**
 * Bus factor: minimum number of contributors who together account for
 * `threshold` (default 0.5) of the work, file-weighted.
 */
export function busFactor(commits: Commit[], threshold = 0.5): number {
  const m = new Map<string, number>();
  for (const c of commits) m.set(c.author, (m.get(c.author) ?? 0) + c.filesChanged.length);
  const total = [...m.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const sorted = [...m.values()].sort((a, b) => b - a);
  let acc = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    acc += sorted[i];
    if (acc / total >= threshold) return i + 1;
  }
  return sorted.length;
}

/** weekly heatmap: [dayOfWeek 0..6][hourOfDay 0..23] */
export function heatmap(commits: Commit[]): number[][] {
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const c of commits) {
    const d = new Date(c.date);
    grid[d.getUTCDay()][d.getUTCHours()] += 1;
  }
  return grid;
}
