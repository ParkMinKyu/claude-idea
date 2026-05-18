'use client';
import { useState } from 'react';
import { parseCron, encodeShare } from '../lib/cron';

export default function Page() {
  const [expr, setExpr] = useState('*/15 * * * 1-5');
  const [tz, setTz] = useState('Asia/Seoul');
  const result = parseCron(expr, { tz, count: 10 });
  const share = encodeShare(expr, tz);

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 720 }}>
      <h1>Cron Debugger</h1>
      <input
        value={expr}
        onChange={(e) => setExpr(e.target.value)}
        style={{ width: '100%', fontSize: 18, padding: 8 }}
      />
      <select value={tz} onChange={(e) => setTz(e.target.value)} style={{ marginTop: 8 }}>
        <option>UTC</option>
        <option>Asia/Seoul</option>
        <option>America/Los_Angeles</option>
      </select>
      {result.valid ? (
        <>
          <p><strong>EN:</strong> {result.description}</p>
          <p><strong>KO:</strong> {result.descriptionKo}</p>
          <h3>Next runs ({tz})</h3>
          <ol>{result.nextRuns?.map((r) => <li key={r}>{r}</li>)}</ol>
          <p>Share: <code>/c/{share}</code></p>
        </>
      ) : (
        <p style={{ color: 'crimson' }}>Error: {result.error}</p>
      )}
    </main>
  );
}
