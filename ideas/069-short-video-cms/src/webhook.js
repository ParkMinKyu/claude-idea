// Mux-style HMAC SHA-256 webhook signature verification.
// Header format: "t=<unix>,v1=<hex>"   signed payload = "<unix>.<rawBody>"

import { createHmac, timingSafeEqual } from 'node:crypto';

export function parseSignatureHeader(header) {
  if (!header || typeof header !== 'string') return null;
  const parts = header.split(',').reduce((acc, p) => {
    const [k, v] = p.trim().split('=');
    if (k && v) acc[k] = v;
    return acc;
  }, {});
  if (!parts.t || !parts.v1) return null;
  const ts = Number(parts.t);
  if (!Number.isFinite(ts)) return null;
  return { ts, signature: parts.v1 };
}

export function verifyWebhook({ rawBody, header, secret, toleranceSeconds = 300, now = Date.now() }) {
  const parsed = parseSignatureHeader(header);
  if (!parsed) return { ok: false, reason: 'bad_header' };
  const ageSec = Math.abs(Math.floor(now / 1000) - parsed.ts);
  if (ageSec > toleranceSeconds) return { ok: false, reason: 'stale' };
  const expected = createHmac('sha256', secret)
    .update(`${parsed.ts}.${rawBody}`)
    .digest('hex');
  if (expected.length !== parsed.signature.length) {
    return { ok: false, reason: 'mismatch' };
  }
  const same = timingSafeEqual(Buffer.from(expected), Buffer.from(parsed.signature));
  return same ? { ok: true } : { ok: false, reason: 'mismatch' };
}

// Map Mux asset state -> our internal state.
export function mapAssetEvent(event) {
  if (!event || typeof event !== 'object') return null;
  switch (event.type) {
    case 'video.asset.ready':
      return {
        kind: 'ready',
        assetId: event?.data?.id,
        playbackId: event?.data?.playback_ids?.[0]?.id,
        durationSeconds: event?.data?.duration,
      };
    case 'video.asset.errored':
      return {
        kind: 'errored',
        assetId: event?.data?.id,
        errorMessage: event?.data?.errors?.messages?.[0] || 'unknown',
      };
    default:
      return { kind: 'ignored', type: event.type };
  }
}
