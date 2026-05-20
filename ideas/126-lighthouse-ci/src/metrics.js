// Extract normalized metrics from a Lighthouse-style result JSON.

// dir: "lower" = lower is better, "higher" = higher is better.
export const METRIC_META = {
  performance: { dir: "higher", label: "Performance Score" },
  lcp: { dir: "lower", label: "Largest Contentful Paint (ms)" },
  cls: { dir: "lower", label: "Cumulative Layout Shift" },
  tbt: { dir: "lower", label: "Total Blocking Time (ms)" },
  fcp: { dir: "lower", label: "First Contentful Paint (ms)" },
};

/**
 * Extract metrics from a Lighthouse JSON (categories + audits) into a flat map.
 * Falls back gracefully when fields are missing.
 */
export function extractMetrics(lhr) {
  const audits = lhr?.audits ?? {};
  const num = (id) => audits[id]?.numericValue;
  return {
    performance: lhr?.categories?.performance?.score ?? null,
    lcp: num("largest-contentful-paint") ?? null,
    cls: num("cumulative-layout-shift") ?? null,
    tbt: num("total-blocking-time") ?? null,
    fcp: num("first-contentful-paint") ?? null,
  };
}

/** Is `value` a violation of a max/min budget given metric direction? */
export function violatesBudget(metric, value, { max, min } = {}) {
  if (value == null) return false;
  if (max != null && value > max) return true;
  if (min != null && value < min) return true;
  return false;
}
