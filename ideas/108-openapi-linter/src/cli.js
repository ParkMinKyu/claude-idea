#!/usr/bin/env node
// CLI: openapi-lint <spec.json>  (exits 1 if errors found)
import { readFileSync } from "node:fs";
import { lint, summarize } from "./rules.js";

export function lintFile(path, readFile = readFileSync) {
  const spec = JSON.parse(readFile(path, "utf8"));
  const issues = lint(spec);
  return { issues, summary: summarize(issues) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const path = process.argv[2];
  if (!path) {
    console.error("usage: openapi-lint <spec.json>");
    process.exit(2);
  }
  const { issues, summary } = lintFile(path);
  for (const i of issues) {
    console.log(`${i.severity.toUpperCase().padEnd(5)} [${i.ruleId}] ${i.path}: ${i.message}`);
  }
  console.log(`\n${summary.errors} error(s), ${summary.warnings} warning(s)`);
  process.exit(summary.ok ? 0 : 1);
}
