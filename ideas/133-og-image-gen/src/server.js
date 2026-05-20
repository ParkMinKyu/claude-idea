// Minimal HTTP server: GET /og?title=...&bg=... -> SVG (or PNG via sharp if installed).
import { createServer } from "node:http";
import { generate } from "./og.js";

export function handle(url) {
  const params = Object.fromEntries(new URL(url, "http://x").searchParams);
  const svg = generate(params);
  return { status: 200, contentType: "image/svg+xml", body: svg };
}

export function start(port = 3000) {
  const server = createServer((req, res) => {
    try {
      const { status, contentType, body } = handle(req.url);
      res.writeHead(status, { "Content-Type": contentType, "Cache-Control": "public, max-age=86400" });
      res.end(body);
    } catch (e) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("error: " + e.message);
    }
  });
  server.listen(port, () => console.log(`og-image-gen on :${port}  try /og?title=Hello`));
  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) start(Number(process.env.PORT) || 3000);
