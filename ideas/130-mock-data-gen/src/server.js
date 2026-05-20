#!/usr/bin/env node
// Minimal HTTP API: POST /generate { schema, count, seed } -> JSON array.
import http from "node:http";
import { generate } from "./schema.js";

export function handleGenerate(body) {
  const { schema, count = 10, seed = 1 } = body ?? {};
  if (!schema || typeof schema !== "object") {
    return { status: 400, payload: { error: "schema is required" } };
  }
  try {
    return { status: 200, payload: generate(schema, { count, seed }) };
  } catch (err) {
    return { status: 400, payload: { error: err.message } };
  }
}

export function createServer() {
  return http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/generate") {
      let raw = "";
      req.on("data", (c) => (raw += c));
      req.on("end", () => {
        let body;
        try {
          body = JSON.parse(raw || "{}");
        } catch {
          res.writeHead(400, { "content-type": "application/json" });
          return res.end(JSON.stringify({ error: "invalid json" }));
        }
        const { status, payload } = handleGenerate(body);
        res.writeHead(status, { "content-type": "application/json" });
        res.end(JSON.stringify(payload));
      });
    } else {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "not found" }));
    }
  });
}

// Run when invoked directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT ?? 3000;
  createServer().listen(port, () => console.error(`mock-data-gen API on :${port}`));
}
