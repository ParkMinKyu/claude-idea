// I/O layer: query a specific resolver for a record type.
import dns from "node:dns";

export const PUBLIC_RESOLVERS = [
  { name: "Google", ip: "8.8.8.8" },
  { name: "Cloudflare", ip: "1.1.1.1" },
  { name: "Quad9", ip: "9.9.9.9" },
  { name: "OpenDNS", ip: "208.67.222.222" },
];

const METHODS = {
  A: "resolve4",
  AAAA: "resolve6",
  CNAME: "resolveCname",
  MX: "resolveMx",
  TXT: "resolveTxt",
  NS: "resolveNs",
};

/** Query one resolver. Returns a result object compatible with compare.js. */
export async function queryResolver(domain, type, resolverIp, name = resolverIp) {
  const method = METHODS[type];
  if (!method) throw new Error(`unsupported record type: ${type}`);
  const resolver = new dns.promises.Resolver({ timeout: 5000, tries: 2 });
  resolver.setServers([resolverIp]);
  const start = Date.now();
  try {
    let records = await resolver[method](domain);
    if (type === "MX") records = records.map((m) => `${m.priority} ${m.exchange}`);
    return { resolver: name, records, latencyMs: Date.now() - start };
  } catch (err) {
    return { resolver: name, records: null, error: err.code ?? err.message, latencyMs: Date.now() - start };
  }
}
