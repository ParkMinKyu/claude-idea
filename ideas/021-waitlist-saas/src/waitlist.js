// Waitlist primitives: ref code generation, rank computation with referral boost,
// disposable email detection, invite selection.

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const DISPOSABLE = new Set(["mailinator.com", "10minutemail.com", "tempmail.io", "guerrillamail.com"]);

export function generateRefCode(seed) {
  // Deterministic when seed provided (tests), random otherwise.
  let s = seed != null ? Number(seed) : Math.floor(Math.random() * 2 ** 32);
  let out = "";
  for (let i = 0; i < 8; i++) {
    s = (s * 1103515245 + 12345) >>> 0;
    out += ALPHABET[s % ALPHABET.length];
  }
  return out;
}

export function isDisposableEmail(email) {
  if (typeof email !== "string") return false;
  const at = email.lastIndexOf("@");
  if (at === -1) return false;
  return DISPOSABLE.has(email.slice(at + 1).toLowerCase());
}

export function validateEmail(email) {
  if (typeof email !== "string") return "email required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "invalid email";
  if (isDisposableEmail(email)) return "disposable email";
  return null;
}

// Each entry has { id, email, joinedAt(ms), referrals }. Score = joinedAt - referrals * BOOST_MS.
// Lower score = higher position (front of queue).
export const BOOST_MS = 60 * 60 * 1000; // 1h forward per referral

export function rankEntries(entries) {
  const scored = entries.map((e) => ({
    ...e,
    score: new Date(e.joinedAt).getTime() - (e.referrals ?? 0) * BOOST_MS,
  }));
  scored.sort((a, b) => a.score - b.score || a.id.localeCompare(b.id));
  return scored.map((e, i) => ({ ...e, rank: i + 1 }));
}

export function positionFor(entries, id) {
  const ranked = rankEntries(entries);
  const me = ranked.find((e) => e.id === id);
  return me ? { rank: me.rank, total: ranked.length } : null;
}

export function selectInvitees(entries, { count, alreadyInvited = new Set() }) {
  const ranked = rankEntries(entries);
  const picks = [];
  for (const e of ranked) {
    if (alreadyInvited.has(e.id)) continue;
    picks.push(e);
    if (picks.length >= count) break;
  }
  return picks;
}

export function applyReferral(entries, refCode) {
  return entries.map((e) => (e.refCode === refCode ? { ...e, referrals: (e.referrals ?? 0) + 1 } : e));
}
