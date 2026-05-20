// Next.js App Router client component. All decoding happens in-browser.
"use client";
import { useMemo, useState } from "react";
import { decodeJwt, inspectClaims } from "../jwt.js";

export default function JwtDebugger() {
  const [token, setToken] = useState("");
  const decoded = useMemo(() => decodeJwt(token.trim()), [token]);

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", fontFamily: "monospace" }}>
      <h1>JWT Debugger</h1>
      <p>토큰은 브라우저에서만 처리되며 서버로 전송되지 않습니다.</p>
      <textarea
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="paste a JWT here"
        rows={4}
        style={{ width: "100%" }}
      />
      {decoded.error && <p style={{ color: "crimson" }}>{decoded.error}</p>}
      {decoded.payload && (
        <>
          <h2>Header</h2>
          <pre>{JSON.stringify(decoded.header, null, 2)}</pre>
          <h2>Payload</h2>
          <pre>{JSON.stringify(decoded.payload, null, 2)}</pre>
          <h2>Claims</h2>
          <pre>{JSON.stringify(inspectClaims(decoded.payload), null, 2)}</pre>
        </>
      )}
    </main>
  );
}
