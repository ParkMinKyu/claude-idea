// Tag normalization + block filter.
//
// We map common aliases to a canonical tag id. In production this dictionary
// is editable by mods; for the MVP we ship a small built-in dictionary.

const ALIASES = new Map([
  ['지민', 'jimin'],
  ['박지민', 'jimin'],
  ['bts jimin', 'jimin'],
  ['뷔', 'taehyung'],
  ['김태형', 'taehyung'],
  ['v', 'taehyung'],
  ['로미오', 'romeo'],
  ['romeo', 'romeo'],
]);

export function canonicalize(rawTag) {
  if (typeof rawTag !== 'string') return null;
  const t = rawTag.trim().toLowerCase().replace(/\s+/g, ' ');
  if (t.length === 0) return null;
  return ALIASES.get(t) || t;
}

export function normalizeTags(rawTags) {
  if (!Array.isArray(rawTags)) return [];
  const set = new Set();
  for (const t of rawTags) {
    const c = canonicalize(t);
    if (c) set.add(c);
  }
  return [...set];
}

// Relationship pairings use "/" between two character tags. Always sort
// alphabetically so "jimin/taehyung" == "taehyung/jimin".
export function canonicalRelationship(pair) {
  if (typeof pair !== 'string' || !pair.includes('/')) return null;
  const [a, b] = pair.split('/', 2).map((s) => canonicalize(s));
  if (!a || !b) return null;
  return [a, b].sort().join('/');
}

// Filter a candidate work by user's required + blocked tags.
export function passesFilters(work, { required = [], blocked = [] } = {}) {
  const w = new Set(normalizeTags(work.tags));
  for (const r of normalizeTags(required)) if (!w.has(r)) return false;
  for (const b of normalizeTags(blocked)) if (w.has(b)) return false;
  return true;
}

// Required trigger warnings. We never let an "explicit"/"violence" work
// show up without an explicit warning tag from the author.
const REQUIRES_WARNING = new Set(['explicit', '19', 'noncon', 'gore', 'suicide']);
const VALID_WARNINGS = new Set(['18+', '폭력', '자살', '비동의', '근친', '약물']);

export function missingWarnings(work) {
  const tags = new Set(normalizeTags(work.tags));
  const warnings = new Set((work.warnings || []).map((w) => String(w).trim()));
  const missing = [];
  for (const t of tags) {
    if (REQUIRES_WARNING.has(t) && warnings.size === 0) missing.push(t);
  }
  if (warnings.size > 0) {
    for (const w of warnings) {
      if (!VALID_WARNINGS.has(w)) missing.push(`invalid_warning:${w}`);
    }
  }
  return missing;
}
