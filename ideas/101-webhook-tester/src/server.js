// Fastify capture endpoint. Run: node src/server.js
// Captures any incoming webhook, verifies its signature, and stores it in memory.
import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import { verifySignature, inspectRequest } from "./verify.js";

export function buildServer(store = new Map()) {
  const app = Fastify({ logger: false });

  // Keep the raw body so signatures can be verified byte-for-byte.
  app.addContentTypeParser("*", { parseAs: "string" }, (_req, body, done) => done(null, body));

  app.post("/hooks/:bin", async (req, reply) => {
    const provider = req.headers["x-wt-provider"] ?? "generic";
    const secret = process.env.WT_SECRET ?? "test-secret";
    const rawBody = typeof req.body === "string" ? req.body : "";
    const sig = verifySignature(provider, { rawBody, headers: req.headers, secret });
    const captured = {
      id: randomUUID(),
      bin: req.params.bin,
      signature: sig,
      ...inspectRequest({ method: req.method, headers: req.headers, rawBody }),
    };
    const list = store.get(req.params.bin) ?? [];
    list.unshift(captured);
    store.set(req.params.bin, list.slice(0, 100));
    return reply.code(200).send({ ok: true, id: captured.id, verified: sig.valid });
  });

  app.get("/bins/:bin", async (req) => store.get(req.params.bin) ?? []);
  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = buildServer();
  app.listen({ port: Number(process.env.PORT ?? 3000) }, (err, addr) => {
    if (err) throw err;
    console.log(`webhook-tester listening at ${addr}`);
  });
}
