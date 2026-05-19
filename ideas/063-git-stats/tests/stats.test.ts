import { describe, it, expect } from 'vitest';
import { byContributor, hotspots, busFactor, heatmap, Commit } from '../src/lib/stats';

const commits: Commit[] = [
  { hash: '1', author: 'Alice', email: 'a@a', date: '2026-05-01T10:00:00Z', filesChanged: ['a.ts', 'b.ts'], additions: 10, deletions: 1 },
  { hash: '2', author: 'Alice', email: 'a@a', date: '2026-05-02T11:00:00Z', filesChanged: ['a.ts'], additions: 4, deletions: 0 },
  { hash: '3', author: 'Bob', email: 'b@b', date: '2026-05-03T18:00:00Z', filesChanged: ['c.ts'], additions: 2, deletions: 0 },
];

describe('byContributor', () => {
  it('aggregates commits and lines per email', () => {
    const cs = byContributor(commits);
    expect(cs[0].author).toBe('Alice');
    expect(cs[0].email).toBe('a@a');
    expect(cs[0].commits).toBe(2);
    expect(cs[0].additions).toBe(14);
    expect(cs[0].deletions).toBe(1);
    expect(cs[1].author).toBe('Bob');
  });

  it('tracks last/first commit and most-touched file per contributor', () => {
    const cs = byContributor(commits);
    expect(cs[0].lastCommit).toBe('2026-05-02T11:00:00Z');
    expect(cs[0].firstCommit).toBe('2026-05-01T10:00:00Z');
    expect(cs[0].topFile).toBe('a.ts');
    expect(cs[0].topFileCount).toBe(2);
  });

  it('builds a per-contributor 7×24 heatmap in KST', () => {
    const cs = byContributor(commits);
    const alice = cs.find((c) => c.email === 'a@a')!;
    expect(alice.heatmap).toHaveLength(7);
    expect(alice.heatmap[0]).toHaveLength(24);
    // 2026-05-01T10:00:00Z = UTC Fri 10 → KST Fri 19 (day 5, hour 19)
    // 2026-05-02T11:00:00Z = UTC Sat 11 → KST Sat 20 (day 6, hour 20)
    expect(alice.heatmap[5][19]).toBe(1);
    expect(alice.heatmap[6][20]).toBe(1);
  });

  it('merges same email under different display names (case-insensitive)', () => {
    const mixed: Commit[] = [
      { hash: '1', author: 'Alice', email: 'a@a', date: '2026-05-01T10:00:00Z', filesChanged: ['x.ts'], additions: 1, deletions: 0 },
      { hash: '2', author: 'alice@laptop', email: 'A@A', date: '2026-05-02T10:00:00Z', filesChanged: ['y.ts'], additions: 1, deletions: 0 },
    ];
    const cs = byContributor(mixed);
    expect(cs).toHaveLength(1);
    expect(cs[0].commits).toBe(2);
  });
});

describe('hotspots', () => {
  it('finds most-touched files', () => {
    const h = hotspots(commits, 3);
    expect(h[0]).toEqual({ file: 'a.ts', touches: 2 });
  });
});

describe('busFactor', () => {
  it('returns 1 when one author dominates', () => {
    expect(busFactor(commits)).toBe(1);
  });

  it('handles empty input', () => {
    expect(busFactor([])).toBe(0);
  });
});

describe('heatmap', () => {
  it('produces a 7x24 grid', () => {
    const g = heatmap(commits);
    expect(g).toHaveLength(7);
    expect(g[0]).toHaveLength(24);
  });
});
