// Webhook relay core: tunnel registry + message routing + ring buffer for replay.
// Transport-agnostic (works over WebSocket/SSE/HTTP). Pure logic, dependency-free.

import { randomUUID } from "node:crypto";

/** Generate a short tunnel id (subdomain-friendly). */
export function makeTunnelId(rng = Math.random) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += alphabet[Math.floor(rng() * alphabet.length)];
  return s;
}

/**
 * The relay hub. Public webhooks hit `ingest(tunnelId, request)`; local agents
 * subscribe with `subscribe(tunnelId, deliver)`. Messages are buffered so a
 * reconnecting agent can replay what it missed.
 */
export class RelayHub {
  constructor({ bufferSize = 100 } = {}) {
    this.bufferSize = bufferSize;
    this.tunnels = new Map(); // id -> { buffer: [], subscribers: Set<fn>, seq }
  }

  createTunnel(id = makeTunnelId()) {
    if (this.tunnels.has(id)) throw new Error(`tunnel exists: ${id}`);
    this.tunnels.set(id, { buffer: [], subscribers: new Set(), seq: 0 });
    return id;
  }

  hasTunnel(id) {
    return this.tunnels.has(id);
  }

  closeTunnel(id) {
    return this.tunnels.delete(id);
  }

  subscribe(id, deliver) {
    const t = this.tunnels.get(id);
    if (!t) throw new Error(`no tunnel: ${id}`);
    if (typeof deliver !== "function") throw new TypeError("deliver must be a function");
    t.subscribers.add(deliver);
    return () => t.subscribers.delete(deliver); // unsubscribe
  }

  /** Accept an inbound webhook; fan out to subscribers; buffer for replay. */
  ingest(id, request) {
    const t = this.tunnels.get(id);
    if (!t) return { delivered: 0, error: "unknown-tunnel" };
    const msg = {
      id: randomUUID(),
      seq: ++t.seq,
      receivedAt: Date.now(),
      method: request.method || "POST",
      path: request.path || "/",
      headers: request.headers || {},
      body: request.body ?? null,
    };
    t.buffer.push(msg);
    if (t.buffer.length > this.bufferSize) t.buffer.shift();

    let delivered = 0;
    for (const deliver of t.subscribers) {
      try {
        deliver(msg);
        delivered++;
      } catch {
        // a failing subscriber must not break fan-out to others
      }
    }
    return { delivered, message: msg };
  }

  /** Messages buffered after a given sequence number (for replay on reconnect). */
  replay(id, afterSeq = 0) {
    const t = this.tunnels.get(id);
    if (!t) return [];
    return t.buffer.filter((m) => m.seq > afterSeq);
  }

  stats(id) {
    const t = this.tunnels.get(id);
    if (!t) return null;
    return { buffered: t.buffer.length, subscribers: t.subscribers.size, lastSeq: t.seq };
  }
}

/** Pick the inbound route -> which local target path to forward to. */
export function resolveTarget(rules, request) {
  // rules: [{ match: RegExp|string, rewrite?: (path)=>string, target: string }]
  for (const rule of rules) {
    const m = rule.match;
    const matched = m instanceof RegExp ? m.test(request.path) : request.path.startsWith(m);
    if (matched) {
      const path = rule.rewrite ? rule.rewrite(request.path) : request.path;
      return { target: rule.target, path };
    }
  }
  return null;
}
