// Minimal semver utilities sufficient for vulnerability range matching.
// Pure functions, zero runtime dependencies.

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

export function parse(version: string): SemVer | null {
  const cleaned = version.trim().replace(/^[v=]/, '');
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(cleaned);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

export function compare(a: SemVer, b: SemVer): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

// Strip common range operators (^, ~, >=, etc.) to get a concrete version.
export function coerce(range: string): SemVer | null {
  const m = /(\d+)\.(\d+)\.(\d+)/.exec(range);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

// Check whether version satisfies a simple comparator like ">=1.2.0 <2.0.0".
// Supports a space-separated AND of comparators using <, <=, >, >=, =.
export function satisfies(version: string, range: string): boolean {
  const v = parse(version) ?? coerce(version);
  if (!v) return false;
  const comparators = range.trim().split(/\s+/).filter(Boolean);
  return comparators.every((cmp) => {
    const m = /^(>=|<=|>|<|=)?\s*(.+)$/.exec(cmp);
    if (!m) return false;
    const op = m[1] ?? '=';
    const target = coerce(m[2]);
    if (!target) return false;
    const c = compare(v, target);
    switch (op) {
      case '>=': return c >= 0;
      case '<=': return c <= 0;
      case '>': return c > 0;
      case '<': return c < 0;
      case '=': return c === 0;
      default: return false;
    }
  });
}
