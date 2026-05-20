// Next.js client UI for the encode/decode multitool. Runs in-browser.
"use client";
import { useState } from "react";
import { encode, decode, detectFormat } from "../codec.js";

const FORMATS = ["base64", "base64url", "hex", "url"];

export default function Base64Toolkit() {
  const [text, setText] = useState("");
  const [format, setFormat] = useState("base64");
  const [mode, setMode] = useState("encode");
  let output = "";
  let error = null;
  try {
    output = mode === "encode" ? encode(format, text) : decode(format, text);
  } catch (e) {
    error = e.message;
  }

  return (
    <main style={{ maxWidth: 680, margin: "2rem auto", fontFamily: "system-ui" }}>
      <h1>Base64 / Hex / URL Toolkit</h1>
      <div>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="encode">Encode</option>
          <option value="decode">Decode</option>
        </select>
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          {FORMATS.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        {text && <span> detected: {detectFormat(text)}</span>}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} style={{ width: "100%" }} />
      <h2>Output</h2>
      {error ? <pre style={{ color: "crimson" }}>{error}</pre> : <pre>{output}</pre>}
    </main>
  );
}
