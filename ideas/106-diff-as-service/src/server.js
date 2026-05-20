// Diff API. POST /diff { old, new, format? } -> ops/unified/stats. Run: node src/server.js
import { createServer } from "node:http";
import { diffLines, toUnified, diffStats } from "./myers.js";

export function handleDiff(body) {
  const { old: oldText = "", new: newText = "", format = "ops" } = body;
  const ops = diffLines(String(oldText), String(newText));
  const stats = diffStats(ops);
  if (format === "unified") return { unified: toUnified(ops), stats };
  return { ops, stats };
}

export function buildServer() {
  return createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/diff") {
      res.writeHead(404).end(JSON.stringify({ error: "POST /diff" }));
      return;
    }
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try {
        const result = handleDiff(JSON.parse(raw || "{}"));
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildServer().listen(Number(process.env.PORT ?? 3000), () =>
    console.log("diff-as-service listening")
  );
}
