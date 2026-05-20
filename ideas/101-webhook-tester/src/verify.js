// Webhook signature verification + payload inspection — pure functions.
// Real product persists captured requests to Postgres and streams them to a live UI.

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify an HMAC signature the way major providers do.
 * provider: "github" | "stripe" | "generic"
 */
export function verifySignature(provider, { rawBody, headers, secret }) {
  switch (provider) {
    case "github":
      return verifyGithub(rawBody, headers, secret);
    case "stripe":
      return verifyStripe(rawBody, headers, secret);
    case "generic":
      return verifyGeneric(rawBody, headers, secret);
    default:
      return { valid: false, reason: `unknown provider: ${provider}` };
  }
}

function safeEqual(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// GitHub: X-Hub-Signature-256: sha256=<hex(hmac)>
function verifyGithub(rawBody, headers, secret) {
  const header = headers["x-hub-signature-256"];
  if (!header) return { valid: false, reason: "missing x-hub-signature-256" };
  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
  return { valid: safeEqual(header, expected), expected, provider: "github" };
}

// Stripe: Stripe-Signature: t=<ts>,v1=<hex(hmac(`${t}.${body}`))>
function verifyStripe(rawBody, headers, secret, toleranceSec = 300, now = Date.now()) {
  const header = headers["stripe-signature"];
  if (!header) return { valid: false, reason: "missing stripe-signature" };
  const parts = Object.fromEntries(
    header.split(",").map((kv) => kv.split("=").map((s) => s.trim()))
  );
  if (!parts.t || !parts.v1) return { valid: false, reason: "malformed stripe-signature" };
  const ageSec = Math.abs(now / 1000 - Number(parts.t));
  if (ageSec > toleranceSec) return { valid: false, reason: "timestamp outside tolerance" };
  const signedPayload = `${parts.t}.${rawBody}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");
  return { valid: safeEqual(parts.v1, expected), expected, provider: "stripe" };
}

// Generic: X-Signature: <hex(hmac-sha256)>
function verifyGeneric(rawBody, headers, secret) {
  const header = headers["x-signature"];
  if (!header) return { valid: false, reason: "missing x-signature" };
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return { valid: safeEqual(header, expected), expected, provider: "generic" };
}

/** Inspect a captured request for the live viewer. */
export function inspectRequest({ method, headers, rawBody }) {
  const contentType = headers["content-type"] ?? "";
  let parsedBody = null;
  let bodyKind = "raw";
  if (contentType.includes("application/json")) {
    try {
      parsedBody = JSON.parse(rawBody || "null");
      bodyKind = "json";
    } catch {
      bodyKind = "invalid-json";
    }
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    parsedBody = Object.fromEntries(new URLSearchParams(rawBody));
    bodyKind = "form";
  }
  return {
    method,
    bodyKind,
    parsedBody,
    sizeBytes: Buffer.byteLength(rawBody ?? ""),
    headerCount: Object.keys(headers).length,
    receivedAt: new Date().toISOString(),
  };
}

/** Compute the signature a user should send (for the "test sender" tool). */
export function signPayload(provider, rawBody, secret, ts = Math.floor(Date.now() / 1000)) {
  if (provider === "stripe") {
    const sig = createHmac("sha256", secret).update(`${ts}.${rawBody}`).digest("hex");
    return `t=${ts},v1=${sig}`;
  }
  const hex = createHmac("sha256", secret).update(rawBody).digest("hex");
  return provider === "github" ? `sha256=${hex}` : hex;
}
