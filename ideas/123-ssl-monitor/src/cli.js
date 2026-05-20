#!/usr/bin/env node
// CLI: ssl-monitor <host...> [--json]
import { fetchCert } from "./fetch.js";
import { monitor } from "./monitor.js";

async function main(argv) {
  const args = argv.slice(2);
  const json = args.includes("--json");
  const hosts = args.filter((a) => !a.startsWith("--"));
  if (hosts.length === 0) {
    console.error("Usage: ssl-monitor <host...> [--json]");
    process.exit(2);
  }
  const entries = [];
  for (const host of hosts) {
    try {
      const cert = await fetchCert(host);
      entries.push({ host, cert });
    } catch (err) {
      console.error(`! ${host}: ${err.message}`);
    }
  }
  const report = monitor(entries);
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    for (const r of report.results) {
      const tag = r.issues.length ? ` issues=${r.issues.join(",")}` : "";
      console.log(`[${r.status.toUpperCase()}] ${r.host} — ${r.daysRemaining}일 남음 (만료 ${r.validTo})${tag}`);
    }
  }
  process.exit(report.alerts.length > 0 ? 1 : 0);
}

main(process.argv);
