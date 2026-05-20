// Aggregate evaluations across many domains and pick alert targets.
import { evaluateCert } from "./cert.js";

const ALERT_STATUSES = new Set(["warning", "critical", "expired"]);

/**
 * Evaluate a list of { host, cert } entries.
 * @returns {{ results:object[], alerts:object[], summary:object }}
 */
export function monitor(entries, opts = {}) {
  const results = entries.map(({ host, cert }) => evaluateCert(cert, host, opts));
  const alerts = results.filter((r) => ALERT_STATUSES.has(r.status) || r.issues.length > 0);
  const summary = { ok: 0, warning: 0, critical: 0, expired: 0 };
  for (const r of results) summary[r.status] = (summary[r.status] ?? 0) + 1;
  return { results, alerts, summary };
}
