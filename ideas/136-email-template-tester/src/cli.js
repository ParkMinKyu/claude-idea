#!/usr/bin/env node
// CLI: node src/cli.js path/to/email.html  -> prints report, exit 1 if errors.
import { readFileSync } from "node:fs";
import { report } from "./lint.js";

const file = process.argv[2];
if (!file) {
  console.error("usage: cli.js <email.html>");
  process.exit(2);
}
const html = readFileSync(file, "utf8");
const r = report(html);
console.log(JSON.stringify(r, null, 2));
process.exit(r.passed ? 0 : 1);
