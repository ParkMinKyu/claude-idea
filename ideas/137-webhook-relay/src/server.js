// Minimal relay server: public ingest endpoint + SSE subscribe for local agents.
// POST /t/:id  -> ingest webhook ; GET /t/:id/events -> SSE stream to agent.
import { createServer } from "node:http";
import { RelayHub } from "./relay.js";

export function buildServer(hub = new RelayHub()) {
  return createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    const parts = url.pathname.split("/").filter(Boolean); // ["t", id, ...]

    if (parts[0] === "t" && parts[1] && parts[2] === "events") {
      // agent subscribes via SSE
      if (!hub.hasTunnel(parts[1])) hub.createTunnel(parts[1]);
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      const unsub = hub.subscribe(parts[1], (msg) => {
        res.write(`data: ${JSON.stringify(msg)}\n\n`);
      });
      req.on("close", unsub);
      return;
    }

    if (parts[0] === "t" && parts[1]) {
      // public webhook ingest
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        if (!hub.hasTunnel(parts[1])) hub.createTunnel(parts[1]);
        const result = hub.ingest(parts[1], {
          method: req.method,
          path: "/" + parts.slice(2).join("/"),
          headers: req.headers,
          body: Buffer.concat(chunks).toString("utf8"),
        });
        res.writeHead(202, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, delivered: result.delivered }));
      });
      return;
    }

    res.writeHead(404);
    res.end("not found");
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildServer().listen(Number(process.env.PORT) || 4000, () =>
    console.log("relay hub on :" + (process.env.PORT || 4000))
  );
}
