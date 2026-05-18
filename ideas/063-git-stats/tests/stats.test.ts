import { describe, it, expect } from 'vitest';
import { byContributor, hotspots, busFactor, heatmap, Commit } from '../src/lib/stats';

const commits: Commit[] = [
  { hash: '1', author: 'Alice', email: 'a@a', date: '2026-05-01T10:00:00Z', filesChanged: ['a.ts', 'b.ts'], additions: 10, deletions: 1 },
  { hash: '2', author: 'Alice', email: 'a@a', date: '2026-05-02T11:00:00Z', filesChanged: ['a.ts'], additions: 4, deletions: 0 },
  { hash: '3', author: 'Bob', email: 'b@b', date: '2026-05-03T18:00:00Z', filesChanged: ['c.ts'], additions: 2, deletions: 0 },
];

describe('byContributor', () => {
  it('aggregates commits and lines per author', () => {
    const cs = byContributor(commits);
    expect(cs[0]).toEqual({ author: 'Alice', commits: 2, additions: 14, deletions: 1 });
    expect(cs[1].author).toBe('Bob');
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
