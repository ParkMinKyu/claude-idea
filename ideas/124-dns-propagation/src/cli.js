#!/usr/bin/env node
// CLI: dns-prop <domain> [type] [--json]
import { checkPropagation } from "./check.js";

async function main(argv) {
  const args = argv.slice(2);
  const json = args.includes("--json");
  const positional = args.filter((a) => !a.startsWith("--"));
  const domain = positional[0];
  const type = (positional[1] ?? "A").toUpperCase();
  if (!domain) {
    console.error("Usage: dns-prop <domain> [A|AAAA|CNAME|MX|TXT|NS] [--json]");
    process.exit(2);
  }
  const report = await checkPropagation(domain, type);
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`${domain} ${type} — 전파율 ${(report.rate * 100).toFixed(0)}% (${report.consistent ? "일관됨" : "불일치"})`);
    for (const r of report.results) {
      const val = r.error ? `ERR ${r.error}` : (r.records ?? []).join(", ");
      console.log(`  ${r.resolver.padEnd(12)} ${val}`);
    }
  }
  process.exit(report.consistent && report.rate === 1 ? 0 : 1);
}

main(process.argv);
