// Combine parser + pricing to produce a before/after cost diff.
import { parsePlan, classifyAction } from "./parser.js";
import { monthlyCost, round2 } from "./pricing.js";

/**
 * Estimate monthly cost delta for a parsed plan JSON.
 * @returns {{ items:object[], totalBefore:number, totalAfter:number, delta:number }}
 */
export function estimatePlan(planJson) {
  const changes = parsePlan(planJson);
  const items = [];
  let totalBefore = 0;
  let totalAfter = 0;

  for (const c of changes) {
    const action = classifyAction(c.actions);
    if (action === "no-op") continue;

    const beforeCost = c.before ? monthlyCost(c.type, c.before) : { monthly: 0, supported: true, basis: "(none)" };
    const afterCost = c.after ? monthlyCost(c.type, c.after) : { monthly: 0, supported: true, basis: "(none)" };

    totalBefore += beforeCost.monthly;
    totalAfter += afterCost.monthly;

    items.push({
      address: c.address,
      type: c.type,
      action,
      monthlyBefore: round2(beforeCost.monthly),
      monthlyAfter: round2(afterCost.monthly),
      delta: round2(afterCost.monthly - beforeCost.monthly),
      supported: beforeCost.supported && afterCost.supported,
      basis: afterCost.basis,
    });
  }

  return {
    items,
    totalBefore: round2(totalBefore),
    totalAfter: round2(totalAfter),
    delta: round2(totalAfter - totalBefore),
  };
}

/** True when the monthly delta exceeds the threshold (USD). */
export function exceedsThreshold(estimate, threshold) {
  return estimate.delta > threshold;
}
