#!/usr/bin/env node
// CLI: headers-analyze <url> [--json]
import { fetchHeaders } from "./fetch.js";
import { analyzeHeaders } from "./analyze.js";

async function main(argv) {
  const args = argv.slice(2);
  const json = args.includes("--json");
  const url = args.find((a) => !a.startsWith("--"));
  if (!url) {
    console.error("Usage: headers-analyze <url> [--json]");
    process.exit(2);
  }
  const headers = await fetchHeaders(url);
  const report = analyzeHeaders(headers);
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`${url} — ${report.score}/100 등급 ${report.grade}`);
    for (const f of report.findings) {
      const mark = f.present && f.severity === "ok" ? "✓" : "✗";
      console.log(`  ${mark} ${f.header}: ${f.message} (${f.points}/${f.max})`);
    }
    for (const d of report.disclosures) console.log(`  ! ${d.message}`);
  }
  process.exit(report.grade === "A" || report.grade === "B" ? 0 : 1);
}

main(process.argv);
