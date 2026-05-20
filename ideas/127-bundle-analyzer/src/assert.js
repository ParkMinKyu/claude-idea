// Budget + regression gates over a diff result. Pure.

/** Glob-ish match: supports a single trailing/leading `*`. */
export function matchPattern(name, pattern) {
  if (pattern === "*" || pattern === name) return true;
  if (pattern.startsWith("*")) return name.endsWith(pattern.slice(1));
  if (pattern.endsWith("*")) return name.startsWith(pattern.slice(0, -1));
  return false;
}

/**
 * @param current - asset map { name -> {size,gzip} }
 * @param diff - result of diffAssets
 * @param config - { budgets:[{pattern,maxBytes}], regression:{maxIncreaseBytes?,maxIncreasePct?} }
 */
export function assertBundle(current, diff, config = {}) {
  const violations = [];

  for (const b of config.budgets ?? []) {
    for (const [name, asset] of Object.entries(current)) {
      if (matchPattern(name, b.pattern) && asset.size > b.maxBytes) {
        violations.push({
          type: "budget",
          name,
          size: asset.size,
          limit: b.maxBytes,
          message: `${name} (${asset.size}B) 이(가) 버짓 ${b.maxBytes}B 초과`,
        });
      }
    }
  }

  const reg = config.regression;
  if (reg) {
    for (const a of diff.assets) {
      if (a.delta <= 0) continue;
      const overBytes = reg.maxIncreaseBytes != null && a.delta > reg.maxIncreaseBytes;
      const pct = a.baselineSize > 0 ? a.delta / a.baselineSize : Infinity;
      const overPct = reg.maxIncreasePct != null && pct > reg.maxIncreasePct;
      if (overBytes || overPct) {
        violations.push({
          type: "regression",
          name: a.name,
          delta: a.delta,
          pct: a.baselineSize > 0 ? Math.round(pct * 1000) / 10 : null,
          message: `${a.name} 증가 +${a.delta}B (${a.baselineSize > 0 ? (pct * 100).toFixed(1) + "%" : "신규"})`,
        });
      }
    }
  }

  return { passed: violations.length === 0, violations, diff };
}
