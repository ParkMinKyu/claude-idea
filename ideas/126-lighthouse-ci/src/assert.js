// Budget assertions + baseline regression checks (pure).
import { METRIC_META, violatesBudget } from "./metrics.js";

/**
 * Run budget assertions.
 * @param metrics - { metric: value }
 * @param budgets - [{ metric, max?, min? }]
 * @returns violation objects
 */
export function assertBudgets(metrics, budgets = []) {
  const violations = [];
  for (const b of budgets) {
    const value = metrics[b.metric];
    if (value == null) continue;
    if (violatesBudget(b.metric, value, b)) {
      violations.push({
        type: "budget",
        metric: b.metric,
        value,
        limit: b.max ?? b.min,
        bound: b.max != null ? "max" : "min",
        message: `${b.metric}=${value} 이(가) 버짓 ${b.max ?? b.min}을(를) 위반`,
      });
    }
  }
  return violations;
}

/**
 * Compare metrics to a baseline. A regression is a change in the "bad" direction
 * exceeding tolerance (%).
 * @param tolerance - fractional allowed change, e.g. 0.05 = 5%
 */
export function assertRegression(metrics, baseline, tolerance = 0.05) {
  const violations = [];
  if (!baseline) return violations;
  for (const [metric, value] of Object.entries(metrics)) {
    const base = baseline[metric];
    if (value == null || base == null || base === 0) continue;
    const dir = METRIC_META[metric]?.dir ?? "lower";
    const change = (value - base) / Math.abs(base); // signed
    const worse = dir === "lower" ? change > tolerance : -change > tolerance;
    if (worse) {
      violations.push({
        type: "regression",
        metric,
        value,
        baseline: base,
        changePct: Math.round(change * 1000) / 10,
        message: `${metric} 회귀: ${base} → ${value} (${(change * 100).toFixed(1)}%, 허용 ${tolerance * 100}%)`,
      });
    }
  }
  return violations;
}

/** Combined evaluation. */
export function evaluate(metrics, { budgets = [], baseline = null, tolerance = 0.05 } = {}) {
  const violations = [...assertBudgets(metrics, budgets), ...assertRegression(metrics, baseline, tolerance)];
  return { passed: violations.length === 0, violations, metrics };
}
