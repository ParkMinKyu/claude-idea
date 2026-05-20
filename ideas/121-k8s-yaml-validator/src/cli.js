#!/usr/bin/env node
// CLI: k8s-validate <file.yaml> [--json]
import { readFileSync } from "node:fs";
import { validateManifest, isPassing } from "./validate.js";

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes("--json");
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("Usage: k8s-validate <file.yaml> [--json]");
    process.exit(2);
  }
  const text = readFileSync(file, "utf8");
  const report = validateManifest(text);

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`점수: ${report.score}/100  (리소스 ${report.resourceCount}개)`);
    console.log(`error=${report.summary.error} warning=${report.summary.warning} info=${report.summary.info}`);
    for (const it of report.items) {
      console.log(`  [${it.severity.toUpperCase()}] ${it.resource} :: ${it.rule} — ${it.message}`);
    }
  }
  process.exit(isPassing(report) ? 0 : 1);
}

main(process.argv);
