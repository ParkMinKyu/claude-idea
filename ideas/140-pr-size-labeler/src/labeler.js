// PR size labeler core: parse unified diff -> stats -> size label decision.
// Pure, dependency-free. Mirrors GitHub's additions/deletions counting.

/** Default size buckets by total changed lines (additions + deletions). */
export const DEFAULT_THRESHOLDS = [
  { label: "size/XS", max: 9 },
  { label: "size/S", max: 49 },
  { label: "size/M", max: 199 },
  { label: "size/L", max: 499 },
  { label: "size/XL", max: 999 },
  { label: "size/XXL", max: Infinity },
];

// Paths that should not count toward "meaningful" size (lockfiles, generated, vendored).
const DEFAULT_IGNORE = [
  /(^|\/)package-lock\.json$/,
  /(^|\/)yarn\.lock$/,
  /(^|\/)pnpm-lock\.yaml$/,
  /(^|\/)poetry\.lock$/,
  /(^|\/)go\.sum$/,
  /(^|\/)dist\//,
  /(^|\/)build\//,
  /\.min\.(js|css)$/,
  /(^|\/)vendor\//,
  /\.snap$/,
];

function isIgnored(path, patterns) {
  return patterns.some((re) => re.test(path));
}

/**
 * Parse a unified diff (git diff output) into per-file stats.
 * @returns {Array<{file:string, additions:number, deletions:number}>}
 */
export function parseDiff(diffText) {
  const files = [];
  let cur = null;
  const lines = String(diffText).split("\n");
  for (const line of lines) {
    if (line.startsWith("diff --git ")) {
      // "diff --git a/path b/path"
      const m = /^diff --git a\/(.+?) b\/(.+)$/.exec(line);
      cur = { file: m ? m[2] : "unknown", additions: 0, deletions: 0 };
      files.push(cur);
    } else if (line.startsWith("rename to ")) {
      if (cur) cur.file = line.slice("rename to ".length).trim();
    } else if (cur) {
      // count content lines, skip the +++/--- file headers
      if (line.startsWith("+++") || line.startsWith("---")) continue;
      if (line.startsWith("+")) cur.additions++;
      else if (line.startsWith("-")) cur.deletions++;
    }
  }
  return files;
}

/**
 * Aggregate stats, excluding ignored files from the "effective" total.
 */
export function aggregate(fileStats, { ignore = DEFAULT_IGNORE } = {}) {
  let additions = 0,
    deletions = 0,
    effective = 0,
    ignored = 0;
  for (const f of fileStats) {
    additions += f.additions;
    deletions += f.deletions;
    const changed = f.additions + f.deletions;
    if (isIgnored(f.file, ignore)) ignored += changed;
    else effective += changed;
  }
  return {
    files: fileStats.length,
    additions,
    deletions,
    total: additions + deletions,
    effective, // total minus ignored (lockfiles, generated, etc.)
    ignored,
  };
}

/** Decide a size label from an effective changed-line count. */
export function decideLabel(effectiveChanged, thresholds = DEFAULT_THRESHOLDS) {
  for (const t of thresholds) {
    if (effectiveChanged <= t.max) return t.label;
  }
  return thresholds[thresholds.length - 1].label;
}

/**
 * End-to-end: diff text -> { label, stats }. Also flags very large PRs.
 */
export function labelDiff(diffText, options = {}) {
  const { thresholds = DEFAULT_THRESHOLDS, ignore = DEFAULT_IGNORE, warnOver = 500 } = options;
  const stats = aggregate(parseDiff(diffText), { ignore });
  const label = decideLabel(stats.effective, thresholds);
  return {
    label,
    needsReviewSplit: stats.effective > warnOver,
    stats,
  };
}
