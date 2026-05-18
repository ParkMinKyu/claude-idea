import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Request, applyVars } from './collection';

function App() {
  const [req, setReq] = useState<Request>({
    name: 'Get user',
    method: 'GET',
    url: 'https://api.example.com/users/{{userId}}',
    headers: { Authorization: 'Bearer {{token}}' },
  });
  const [vars] = useState<Record<string, string>>({ userId: '42', token: 'demo-token' });
  const resolved = applyVars(req, vars);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 16 }}>
      <h1>papi</h1>
      <select value={req.method} onChange={(e) => setReq({ ...req, method: e.target.value as Request['method'] })}>
        {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => <option key={m}>{m}</option>)}
      </select>
      <input value={req.url} onChange={(e) => setReq({ ...req, url: e.target.value })} style={{ width: '70%', marginLeft: 8 }} />
      <h3>Resolved</h3>
      <pre>{JSON.stringify(resolved, null, 2)}</pre>
    </div>
  );
}

const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);
