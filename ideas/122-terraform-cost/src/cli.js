#!/usr/bin/env node
// CLI: tf-cost <plan.json> [--threshold N] [--json]
import { readFileSync } from "node:fs";
import { estimatePlan, exceedsThreshold } from "./estimate.js";
import { toMarkdown } from "./report.js";

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes("--json");
  const tIdx = args.indexOf("--threshold");
  const threshold = tIdx >= 0 ? Number(args[tIdx + 1]) : Infinity;
  const file = args.find((a) => !a.startsWith("--") && a !== String(threshold));
  if (!file) {
    console.error("Usage: tf-cost <plan.json> [--threshold N] [--json]");
    process.exit(2);
  }
  const planJson = JSON.parse(readFileSync(file, "utf8"));
  const estimate = estimatePlan(planJson);

  if (json) {
    console.log(JSON.stringify(estimate, null, 2));
  } else {
    console.log(toMarkdown(estimate));
    console.log(`\n월간 증감: ${estimate.delta >= 0 ? "+" : ""}${estimate.delta} USD`);
  }

  process.exit(exceedsThreshold(estimate, threshold) ? 1 : 0);
}

main(process.argv);
