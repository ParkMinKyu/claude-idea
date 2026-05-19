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
  email: string;
  author: string;
  commits: number;
  additions: number;
  deletions: number;
  lastCommit: string;
  firstCommit: string;
  topFile: string;
  topFileCount: number;
  /** 7×24 grid (dayOfWeek × hourOfDay, UTC) of this contributor's commits */
  heatmap: number[][];
}

// KST = UTC+9. Convert an ISO timestamp to KST day-of-week and hour-of-day.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
function kstParts(iso: string): { day: number; hour: number } {
  const t = new Date(iso).getTime() + KST_OFFSET_MS;
  const k = new Date(t);
  return { day: k.getUTCDay(), hour: k.getUTCHours() };
}

interface ContribAcc {
  email: string;
  author: string;
  commits: number;
  additions: number;
  deletions: number;
  lastCommit: string;
  firstCommit: string;
  fileCounts: Map<string, number>;
  heatmap: number[][];
}

/**
 * Aggregate commits by email (lowercased) so the same person under
 * different display names is merged into one row.
 */
export function byContributor(commits: Commit[]): ContributorStat[] {
  const m = new Map<string, ContribAcc>();
  for (const c of commits) {
    const key = (c.email || c.author || '').toLowerCase();
    const cur: ContribAcc = m.get(key) ?? {
      email: c.email ?? '',
      author: c.author ?? '',
      commits: 0,
      additions: 0,
      deletions: 0,
      lastCommit: c.date,
      firstCommit: c.date,
      fileCounts: new Map(),
      heatmap: Array.from({ length: 7 }, () => Array(24).fill(0)),
    };
    cur.commits += 1;
    cur.additions += c.additions ?? 0;
    cur.deletions += c.deletions ?? 0;
    if (new Date(c.date) > new Date(cur.lastCommit)) cur.lastCommit = c.date;
    if (new Date(c.date) < new Date(cur.firstCommit)) cur.firstCommit = c.date;
    const { day, hour } = kstParts(c.date);
    cur.heatmap[day][hour] += 1;
    for (const f of c.filesChanged) {
      cur.fileCounts.set(f, (cur.fileCounts.get(f) ?? 0) + 1);
    }
    m.set(key, cur);
  }
  return [...m.values()]
    .map((c) => {
      let topFile = '';
      let topFileCount = 0;
      for (const [f, n] of c.fileCounts) {
        if (n > topFileCount) { topFile = f; topFileCount = n; }
      }
      return {
        email: c.email,
        author: c.author,
        commits: c.commits,
        additions: c.additions,
        deletions: c.deletions,
        lastCommit: c.lastCommit,
        firstCommit: c.firstCommit,
        topFile,
        topFileCount,
        heatmap: c.heatmap,
      };
    })
    .sort((a, b) => b.commits - a.commits);
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

/** weekly heatmap (KST): [dayOfWeek 0..6][hourOfDay 0..23] */
export function heatmap(commits: Commit[]): number[][] {
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const c of commits) {
    const { day, hour } = kstParts(c.date);
    grid[day][hour] += 1;
  }
  return grid;
}
