// Pure comparison logic for DNS resolver responses.
// A resolver result: { resolver, records:string[]|null, error?:string, latencyMs?:number }

/** Normalize a record set: flatten, trim, lowercase, sort, dedupe. */
export function normalizeRecords(records) {
  if (!Array.isArray(records)) return [];
  const flat = records.map((r) => (Array.isArray(r) ? r.join("") : String(r)).trim().toLowerCase());
  return [...new Set(flat)].sort();
}

/** Stable signature string for a record set (used to group resolvers). */
export function signature(records) {
  return normalizeRecords(records).join("|");
}

/** Group resolver results by their normalized signature. */
export function groupBySignature(results) {
  const groups = new Map();
  for (const r of results) {
    if (r.error || r.records == null) continue;
    const sig = signature(r.records);
    if (!groups.has(sig)) groups.set(sig, { signature: sig, records: normalizeRecords(r.records), resolvers: [] });
    groups.get(sig).resolvers.push(r.resolver);
  }
  return [...groups.values()].sort((a, b) => b.resolvers.length - a.resolvers.length);
}

/** Majority record set across successful resolvers, or null. */
export function majoritySignature(results) {
  const groups = groupBySignature(results);
  return groups.length ? groups[0] : null;
}

/**
 * Compute propagation status.
 * @param {object[]} results
 * @param {string[]|null} expected - expected records, or null to use majority
 */
export function propagation(results, expected = null) {
  const successful = results.filter((r) => !r.error && r.records != null);
  const groups = groupBySignature(results);
  const target = expected != null ? signature(expected) : groups[0]?.signature ?? null;

  const matching = successful.filter((r) => signature(r.records) === target);
  const rate = successful.length === 0 ? 0 : matching.length / successful.length;

  return {
    expected: target == null ? [] : (target === "" ? [] : target.split("|")),
    rate, // 0..1
    matched: matching.map((r) => r.resolver),
    mismatched: successful.filter((r) => signature(r.records) !== target).map((r) => r.resolver),
    errored: results.filter((r) => r.error).map((r) => r.resolver),
    consistent: groups.length <= 1,
    groups,
  };
}
