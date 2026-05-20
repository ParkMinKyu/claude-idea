// UUID + ULID generation & inspection. Pure TypeScript, dependency-free.
import { randomBytes } from "node:crypto";

export type UuidVersion = 4 | 7;

const HEX = "0123456789abcdef";
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // ULID base32

function bytesToUuid(b: Uint8Array): string {
  const h = Array.from(b, (x) => HEX[x >> 4] + HEX[x & 15]).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** RFC 4122 v4 (random) UUID. */
export function uuidV4(rng: (n: number) => Uint8Array = randomBytes): string {
  const b = Uint8Array.from(rng(16));
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // RFC variant
  return bytesToUuid(b);
}

/** UUID v7 (time-ordered, draft RFC 9562). 48-bit ms timestamp + random. */
export function uuidV7(now = Date.now(), rng: (n: number) => Uint8Array = randomBytes): string {
  const b = Uint8Array.from(rng(16));
  b[0] = (now / 2 ** 40) & 0xff;
  b[1] = (now / 2 ** 32) & 0xff;
  b[2] = (now / 2 ** 24) & 0xff;
  b[3] = (now / 2 ** 16) & 0xff;
  b[4] = (now / 2 ** 8) & 0xff;
  b[5] = now & 0xff;
  b[6] = (b[6] & 0x0f) | 0x70; // version 7
  b[8] = (b[8] & 0x3f) | 0x80; // RFC variant
  return bytesToUuid(b);
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-([1-8])[0-9a-f]{3}-([89ab])[0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface UuidInfo {
  valid: boolean;
  version: number | null;
  variant: string | null;
  reason?: string;
  timestampMs?: number;
}

/** Validate a UUID and extract version/variant (and v7 timestamp). */
export function inspectUuid(s: string): UuidInfo {
  const m = UUID_RE.exec(s);
  if (!m) return { valid: false, version: null, variant: null, reason: "not an RFC 4122 UUID" };
  const version = Number(m[1]);
  const info: UuidInfo = { valid: true, version, variant: "RFC 4122" };
  if (version === 7) {
    const hex = s.replace(/-/g, "").slice(0, 12);
    info.timestampMs = parseInt(hex, 16);
  }
  return info;
}

/** Crockford base32 ULID: 48-bit time + 80-bit random. */
export function ulid(now = Date.now(), rng: (n: number) => Uint8Array = randomBytes): string {
  let time = "";
  let t = now;
  for (let i = 0; i < 10; i++) {
    time = CROCKFORD[t % 32] + time;
    t = Math.floor(t / 32);
  }
  const rand = rng(10);
  let body = "";
  for (let i = 0; i < 16; i++) {
    body += CROCKFORD[(rand[i % 10] + i * 7) % 32];
  }
  return time + body;
}

const ULID_RE = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

/** Validate a ULID and decode its embedded timestamp. */
export function inspectUlid(s: string): { valid: boolean; timestampMs?: number; reason?: string } {
  if (!ULID_RE.test(s)) return { valid: false, reason: "not a 26-char Crockford base32 ULID" };
  let ts = 0;
  for (const ch of s.slice(0, 10)) ts = ts * 32 + CROCKFORD.indexOf(ch);
  return { valid: true, timestampMs: ts };
}
