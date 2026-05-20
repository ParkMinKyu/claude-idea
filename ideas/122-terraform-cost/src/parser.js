// Parse `terraform show -json` plan output into normalized changes.

/**
 * @param {object} planJson - parsed terraform plan JSON
 * @returns {{ address:string, type:string, actions:string[], before:object|null, after:object|null }[]}
 */
export function parsePlan(planJson) {
  const changes = planJson?.resource_changes ?? [];
  return changes.map((rc) => ({
    address: rc.address,
    type: rc.type,
    actions: rc.change?.actions ?? [],
    before: rc.change?.before ?? null,
    after: rc.change?.after ?? null,
  }));
}

/** Classify a terraform action list into a single verb. */
export function classifyAction(actions) {
  const set = new Set(actions);
  if (set.has("create") && set.has("delete")) return "replace";
  if (set.has("create")) return "create";
  if (set.has("delete")) return "delete";
  if (set.has("update")) return "update";
  return "no-op";
}
