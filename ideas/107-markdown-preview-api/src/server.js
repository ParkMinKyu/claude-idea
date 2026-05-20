// Markdown render API. POST /render { markdown, toc? } -> { html, toc, excerpt }
import { createServer } from "node:http";
import { renderMarkdown, extractToc, toPlainText } from "./render.js";

export function handleRender(body) {
  const md = String(body.markdown ?? "");
  return {
    html: renderMarkdown(md),
    toc: body.toc ? extractToc(md) : undefined,
    excerpt: toPlainText(md),
  };
}

export function buildServer() {
  return createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/render") {
      res.writeHead(404).end(JSON.stringify({ error: "POST /render" }));
      return;
    }
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try {
        const result = handleRender(JSON.parse(raw || "{}"));
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
    console.log("markdown-preview-api listening")
  );
}
