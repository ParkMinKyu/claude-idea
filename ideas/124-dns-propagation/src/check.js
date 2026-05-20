// Orchestrate multi-resolver queries + comparison.
import { PUBLIC_RESOLVERS, queryResolver } from "./resolvers.js";
import { propagation } from "./compare.js";

/**
 * Check propagation across resolvers.
 * @param queryImpl - injectable for tests; defaults to real DNS.
 */
export async function checkPropagation(domain, type = "A", opts = {}) {
  const resolvers = opts.resolvers ?? PUBLIC_RESOLVERS;
  const queryImpl = opts.queryImpl ?? ((d, t, ip, name) => queryResolver(d, t, ip, name));
  const results = await Promise.all(resolvers.map((r) => queryImpl(domain, type, r.ip, r.name)));
  return { domain, type, results, ...propagation(results, opts.expected ?? null) };
}
