#!/usr/bin/env node
// CLI: bundle-diff <stats.json> --baseline <base.json> [--config <c.json>] [--json]
import { readFileSync } from "node:fs";
import { parseStats } from "./parser.js";
import { diffAssets } from "./diff.js";
import { assertBundle } from "./assert.js";
import { toMarkdown } from "./report.js";

function arg(args, flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes("--json");
  const reserved = [arg(args, "--baseline"), arg(args, "--config")];
  const statsFile = args.find((a) => !a.startsWith("--") && !reserved.includes(a));
  if (!statsFile) {
    console.error("Usage: bundle-diff <stats.json> --baseline <base.json> [--config <c.json>] [--json]");
    process.exit(2);
  }
  const current = parseStats(JSON.parse(readFileSync(statsFile, "utf8")));
  const baseFile = arg(args, "--baseline");
  const baseline = baseFile ? parseStats(JSON.parse(readFileSync(baseFile, "utf8"))) : {};
  const configFile = arg(args, "--config");
  const config = configFile ? JSON.parse(readFileSync(configFile, "utf8")) : {};

  const diff = diffAssets(baseline, current);
  const result = assertBundle(current, diff, config);
  console.log(json ? JSON.stringify(result, null, 2) : toMarkdown(result));
  process.exit(result.passed ? 0 : 1);
}

main(process.argv);
