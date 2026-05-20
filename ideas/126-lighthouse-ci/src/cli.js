#!/usr/bin/env node
// CLI: perf-assert <lhr.json> --config <config.json> [--baseline <base.json>] [--json]
import { readFileSync } from "node:fs";
import { extractMetrics } from "./metrics.js";
import { evaluate } from "./assert.js";
import { toMarkdown } from "./report.js";

function arg(args, flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes("--json");
  const lhrFile = args.find((a) => !a.startsWith("--") && a !== arg(args, "--config") && a !== arg(args, "--baseline"));
  if (!lhrFile) {
    console.error("Usage: perf-assert <lhr.json> --config <config.json> [--baseline <base.json>] [--json]");
    process.exit(2);
  }
  const lhr = JSON.parse(readFileSync(lhrFile, "utf8"));
  const metrics = extractMetrics(lhr);
  const configFile = arg(args, "--config");
  const config = configFile ? JSON.parse(readFileSync(configFile, "utf8")) : { budgets: [] };
  const baselineFile = arg(args, "--baseline");
  if (baselineFile) config.baseline = extractMetrics(JSON.parse(readFileSync(baselineFile, "utf8")));

  const result = evaluate(metrics, config);
  console.log(json ? JSON.stringify(result, null, 2) : toMarkdown(result));
  process.exit(result.passed ? 0 : 1);
}

main(process.argv);
