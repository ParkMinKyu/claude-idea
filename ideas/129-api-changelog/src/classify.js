// Classify changes as breaking / non-breaking / info. Pure.

const BREAKING_KINDS = new Set([
  "path-removed",
  "operation-removed",
  "param-removed",
  "param-required-added",
]);

const INFO_KINDS = new Set(["response-added"]);

/** Classify a single change. */
export function classifyChange(change) {
  if (change.kind === "param-added" && change.required) return "breaking";
  if (change.kind === "response-removed") {
    // Removing a success (2xx) response is breaking; others are non-breaking.
    return /^2/.test(String(change.name)) ? "breaking" : "non-breaking";
  }
  if (BREAKING_KINDS.has(change.kind)) return "breaking";
  if (INFO_KINDS.has(change.kind)) return "info";
  return "non-breaking";
}

/** Annotate and bucket all changes. */
export function classifyAll(changes) {
  const annotated = changes.map((c) => ({ ...c, severity: classifyChange(c) }));
  const buckets = { breaking: [], "non-breaking": [], info: [] };
  for (const c of annotated) buckets[c.severity].push(c);
  return { annotated, buckets, hasBreaking: buckets.breaking.length > 0 };
}

/** Suggest a semver bump level from the classification. */
export function suggestBump(result) {
  if (result.hasBreaking) return "major";
  if (result.buckets["non-breaking"].some((c) => c.kind.endsWith("added"))) return "minor";
  return "patch";
}
