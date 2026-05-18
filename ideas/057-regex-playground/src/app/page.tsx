'use client';
import { useState } from 'react';
import { testPattern, toPython } from '../lib/regex';

export default function Page() {
  const [pattern, setPattern] = useState('\\b\\w+@\\w+\\.\\w+\\b');
  const [flags, setFlags] = useState('g');
  const [input, setInput] = useState('ping me at alice@example.com or bob@test.io');
  const r = testPattern(pattern, flags, input);

  return (
    <main style={{ fontFamily: 'sans-serif', padding: 24, maxWidth: 800 }}>
      <h1>Regex Playground</h1>
      <input value={pattern} onChange={(e) => setPattern(e.target.value)} style={{ width: '70%' }} />
      <input value={flags} onChange={(e) => setFlags(e.target.value)} style={{ width: '15%', marginLeft: 8 }} />
      <textarea value={input} onChange={(e) => setInput(e.target.value)} style={{ width: '100%', height: 100, marginTop: 8 }} />
      <h3>{r.valid ? `${r.matches.length} matches` : `Error: ${r.error}`}</h3>
      <ul>{r.matches.map((m, i) => <li key={i}>{m.index}: {m.value}</li>)}</ul>
      <h3>Python</h3>
      <pre style={{ background: '#f4f4f4', padding: 8 }}>{toPython(pattern, flags)}</pre>
    </main>
  );
}
