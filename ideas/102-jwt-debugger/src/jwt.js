// JWT decode + verify core. Pure functions; decoding never requires a secret.
// UI runs entirely client-side so tokens never leave the browser.
import { jwtVerify, importJWK, importSPKI } from "jose";

function b64urlToString(seg) {
  const pad = seg.length % 4 === 0 ? "" : "=".repeat(4 - (seg.length % 4));
  const b64 = seg.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64").toString("utf8");
}

/** Decode header + payload WITHOUT verifying the signature. */
export function decodeJwt(token) {
  if (typeof token !== "string") return { error: "token must be a string" };
  const parts = token.split(".");
  if (parts.length !== 3) return { error: "expected 3 dot-separated segments" };
  try {
    const header = JSON.parse(b64urlToString(parts[0]));
    const payload = JSON.parse(b64urlToString(parts[1]));
    return { header, payload, signature: parts[2] };
  } catch {
    return { error: "invalid base64url or JSON in token segments" };
  }
}

/** Inspect standard registered claims against `now` (seconds since epoch). */
export function inspectClaims(payload, now = Math.floor(Date.now() / 1000)) {
  const notes = [];
  const expired = typeof payload.exp === "number" && payload.exp < now;
  const notYetValid = typeof payload.nbf === "number" && payload.nbf > now;
  if (expired) notes.push(`expired ${now - payload.exp}s ago`);
  if (notYetValid) notes.push(`not valid for ${payload.nbf - now}s`);
  if (typeof payload.iat === "number" && payload.iat > now + 60)
    notes.push("iat is in the future");
  return {
    expired,
    notYetValid,
    active: !expired && !notYetValid,
    expiresInSec: typeof payload.exp === "number" ? payload.exp - now : null,
    issuer: payload.iss ?? null,
    audience: payload.aud ?? null,
    subject: payload.sub ?? null,
    notes,
  };
}

/**
 * Verify signature with jose.
 * key: { kind: "secret", secret } | { kind: "jwk", jwk } | { kind: "spki", pem, alg }
 */
export async function verifyJwt(token, key, opts = {}) {
  try {
    let cryptoKey;
    if (key.kind === "secret") {
      cryptoKey = new TextEncoder().encode(key.secret);
    } else if (key.kind === "jwk") {
      cryptoKey = await importJWK(key.jwk, key.jwk.alg);
    } else if (key.kind === "spki") {
      cryptoKey = await importSPKI(key.pem, key.alg);
    } else {
      return { valid: false, reason: `unknown key kind: ${key.kind}` };
    }
    const { payload, protectedHeader } = await jwtVerify(token, cryptoKey, opts);
    return { valid: true, payload, protectedHeader };
  } catch (err) {
    return { valid: false, reason: err.code ?? err.message };
  }
}
