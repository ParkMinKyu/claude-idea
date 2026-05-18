'use client';
import { useState, useMemo } from 'react';
import { diff, summarize, changedOnly } from '../lib/diff';

export default function Page() {
  const [left, setLeft] = useState('{\n  "name": "alice",\n  "age": 30\n}');
  const [right, setRight] = useState('{\n  "name": "alice",\n  "age": 31,\n  "city": "Seoul"\n}');

  const result = useMemo(() => {
    try {
      const changes = diff(JSON.parse(left), JSON.parse(right));
      return { ok: true as const, changes, summary: summarize(changes) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [left, right]);

  return (
    <main style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h1>JSON Diff</h1>
      <div style={{ display: 'flex', gap: 12 }}>
        <textarea value={left} onChange={(e) => setLeft(e.target.value)} style={{ flex: 1, height: 200 }} />
        <textarea value={right} onChange={(e) => setRight(e.target.value)} style={{ flex: 1, height: 200 }} />
      </div>
      {result.ok ? (
        <>
          <p>added {result.summary.added} · removed {result.summary.removed} · changed {result.summary.changed}</p>
          <ul>
            {changedOnly(result.changes).map((c, i) => (
              <li key={i}><b>{c.kind}</b> {c.path} — {JSON.stringify(c.left)} → {JSON.stringify(c.right)}</li>
            ))}
          </ul>
        </>
      ) : (
        <p style={{ color: 'crimson' }}>Parse error: {result.error}</p>
      )}
    </main>
  );
}
