'use client';
import { useMemo } from 'react';
import { byContributor, hotspots, busFactor, Commit } from '../lib/stats';

const sample: Commit[] = [
  { hash: 'a', author: 'Alice', email: 'a@a', date: '2026-05-01T10:00:00Z', filesChanged: ['app.ts'], additions: 30, deletions: 2 },
  { hash: 'b', author: 'Bob', email: 'b@b', date: '2026-05-02T14:00:00Z', filesChanged: ['app.ts', 'util.ts'], additions: 12, deletions: 1 },
  { hash: 'c', author: 'Alice', email: 'a@a', date: '2026-05-03T09:00:00Z', filesChanged: ['readme.md'], additions: 5, deletions: 0 },
];

export default function Page() {
  const stats = useMemo(() => ({
    contribs: byContributor(sample),
    spots: hotspots(sample, 3),
    bf: busFactor(sample),
  }), []);
  return (
    <main style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h1>Git Stats (sample)</h1>
      <h3>Contributors</h3>
      <ul>{stats.contribs.map((c) => <li key={c.author}>{c.author}: {c.commits} commits, +{c.additions}/-{c.deletions}</li>)}</ul>
      <h3>Hotspots</h3>
      <ul>{stats.spots.map((s) => <li key={s.file}>{s.file} ({s.touches})</li>)}</ul>
      <p>Bus factor: <b>{stats.bf}</b></p>
    </main>
  );
}
