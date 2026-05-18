// Audio watermark seed generator. We don't actually mix audio here (that's
// FFmpeg's job) but we derive a deterministic PRNG seed per (userId, bookId)
// that the FFmpeg sidecar uses to place sub-audible markers.
//
// We also expose helpers to convert chapter seconds to MP4 chapter-marker
// "HH:MM:SS.mmm" strings used in the M4B container.

import { createHmac } from 'node:crypto';

const SECRET = process.env.WATERMARK_SECRET || 'dev-watermark-secret';

export function watermarkSeed(userId, bookId) {
  if (!userId || !bookId) throw new Error('userId and bookId required');
  const h = createHmac('sha256', SECRET);
  h.update(`${userId}|${bookId}`);
  // Use first 8 bytes as little-endian unsigned 64-bit -> number (lossy ok, just seed)
  const buf = h.digest();
  return Number(buf.readBigUInt64LE(0) % BigInt(Number.MAX_SAFE_INTEGER));
}

// Place positions in seconds where we insert the watermark, given duration.
// Returns ascending unique-ish offsets, never within 5s of start/end.
export function watermarkPositions({ seed, durationSeconds, count = 6 }) {
  if (!(durationSeconds > 30)) return [];
  let s = seed >>> 0 || 1;
  const next = () => {
    // xorshift32
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
  const start = 5;
  const end = durationSeconds - 5;
  const span = end - start;
  const set = new Set();
  while (set.size < count) {
    const pos = start + Math.floor(next() * span);
    set.add(pos);
  }
  return [...set].sort((a, b) => a - b);
}

export function formatChapterTime(seconds) {
  const n = Math.max(0, Number(seconds) || 0);
  const ms = Math.floor((n - Math.floor(n)) * 1000);
  const total = Math.floor(n);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (x, w = 2) => String(x).padStart(w, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms, 3)}`;
}
