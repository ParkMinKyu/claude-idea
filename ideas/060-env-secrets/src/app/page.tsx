'use client';
import { useState } from 'react';
import { parseDotenv, serializeDotenv } from '../lib/crypto';

export default function Page() {
  const [input, setInput] = useState('DATABASE_URL=postgres://localhost\nAPI_KEY=secret-1');
  const parsed = parseDotenv(input);
  return (
    <main style={{ fontFamily: 'sans-serif', padding: 24, maxWidth: 720 }}>
      <h1>Env Secrets (preview)</h1>
      <p>Paste your .env. Encryption happens client-side via libsodium.</p>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} style={{ width: '100%', height: 200 }} />
      <h3>Parsed ({Object.keys(parsed).length})</h3>
      <pre style={{ background: '#f4f4f4', padding: 8 }}>{serializeDotenv(parsed)}</pre>
    </main>
  );
}
