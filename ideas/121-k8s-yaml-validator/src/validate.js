// Orchestrates parsing + rules into a scored report.
import { parseManifests, resourceLabel } from "./parser.js";
import { runRules } from "./rules.js";

const SEVERITY_WEIGHT = { error: 15, warning: 5, info: 1 };

/**
 * Validate a manifest YAML string.
 * @returns {{ score:number, summary:object, items:object[], parseErrors:object[] }}
 */
export function validateManifest(yamlText) {
  const { resources, errors } = parseManifests(yamlText);
  const items = [];
  const summary = { error: 0, warning: 0, info: 0 };

  // Parse errors count as errors against the score.
  for (const e of errors) {
    summary.error++;
    items.push({ resource: `<document #${e.doc}>`, rule: "yaml-parse-error", severity: "error", message: e.message });
  }

  for (const resource of resources) {
    const label = resourceLabel(resource);
    for (const diag of runRules(resource)) {
      summary[diag.severity] = (summary[diag.severity] ?? 0) + 1;
      items.push({ resource: label, ...diag });
    }
  }

  const penalty =
    summary.error * SEVERITY_WEIGHT.error +
    summary.warning * SEVERITY_WEIGHT.warning +
    summary.info * SEVERITY_WEIGHT.info;
  const score = Math.max(0, 100 - penalty);

  return { score, summary, items, parseErrors: errors, resourceCount: resources.length };
}

/** True when no error-severity diagnostics exist (used for CI exit code). */
export function isPassing(report) {
  return report.summary.error === 0;
}
