import { test } from "node:test";
import assert from "node:assert/strict";
import { RelayHub, makeTunnelId, resolveTarget } from "../src/relay.js";

test("makeTunnelId produces 10-char slug from rng", () => {
  let i = 0;
  const seq = [0, 0.5, 0.99, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8];
  const id = makeTunnelId(() => seq[i++]);
  assert.equal(id.length, 10);
  assert.match(id, /^[a-z0-9]+$/);
});

test("ingest fans out to all subscribers", () => {
  const hub = new RelayHub();
  hub.createTunnel("abc");
  const got = [];
  hub.subscribe("abc", (m) => got.push(["a", m.body]));
  hub.subscribe("abc", (m) => got.push(["b", m.body]));
  const r = hub.ingest("abc", { body: "hello" });
  assert.equal(r.delivered, 2);
  assert.deepEqual(got, [["a", "hello"], ["b", "hello"]]);
});

test("ingest to unknown tunnel reports error", () => {
  const hub = new RelayHub();
  assert.deepEqual(hub.ingest("nope", {}), { delivered: 0, error: "unknown-tunnel" });
});

test("a throwing subscriber does not block others", () => {
  const hub = new RelayHub();
  hub.createTunnel("t");
  hub.subscribe("t", () => {
    throw new Error("boom");
  });
  let ok = false;
  hub.subscribe("t", () => {
    ok = true;
  });
  const r = hub.ingest("t", { body: "x" });
  assert.equal(ok, true);
  assert.equal(r.delivered, 1); // only the healthy one counts
});

test("buffer enables replay after a sequence number", () => {
  const hub = new RelayHub({ bufferSize: 10 });
  hub.createTunnel("t");
  hub.ingest("t", { body: "1" });
  hub.ingest("t", { body: "2" });
  hub.ingest("t", { body: "3" });
  const missed = hub.replay("t", 1);
  assert.deepEqual(missed.map((m) => m.body), ["2", "3"]);
});

test("ring buffer evicts oldest beyond bufferSize", () => {
  const hub = new RelayHub({ bufferSize: 2 });
  hub.createTunnel("t");
  for (const b of ["1", "2", "3"]) hub.ingest("t", { body: b });
  assert.deepEqual(
    hub.replay("t", 0).map((m) => m.body),
    ["2", "3"]
  );
  assert.equal(hub.stats("t").lastSeq, 3);
});

test("unsubscribe stops delivery", () => {
  const hub = new RelayHub();
  hub.createTunnel("t");
  let count = 0;
  const off = hub.subscribe("t", () => count++);
  hub.ingest("t", { body: "a" });
  off();
  hub.ingest("t", { body: "b" });
  assert.equal(count, 1);
});

test("resolveTarget matches prefix and regex with rewrite", () => {
  const rules = [
    { match: "/stripe", target: "http://localhost:3000", rewrite: (p) => p.replace("/stripe", "/hooks") },
    { match: /^\/gh\//, target: "http://localhost:3001" },
  ];
  assert.deepEqual(resolveTarget(rules, { path: "/stripe/x" }), {
    target: "http://localhost:3000",
    path: "/hooks/x",
  });
  assert.deepEqual(resolveTarget(rules, { path: "/gh/push" }), {
    target: "http://localhost:3001",
    path: "/gh/push",
  });
  assert.equal(resolveTarget(rules, { path: "/other" }), null);
});

test("createTunnel rejects duplicates, closeTunnel removes", () => {
  const hub = new RelayHub();
  hub.createTunnel("dup");
  assert.throws(() => hub.createTunnel("dup"));
  assert.equal(hub.closeTunnel("dup"), true);
  assert.equal(hub.hasTunnel("dup"), false);
});
