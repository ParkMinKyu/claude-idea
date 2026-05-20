#!/usr/bin/env node
// CLI (commit-msg hook): node src/cli.js .git/COMMIT_EDITMSG
import { readFileSync } from "node:fs";
import { lintCommit } from "./lint.js";

const file = process.argv[2];
if (!file) {
  console.error("usage: cli.js <commit-msg-file>");
  process.exit(2);
}
const msg = readFileSync(file, "utf8");
const r = lintCommit(msg);
for (const e of r.errors) console.error("✖ " + e);
for (const w of r.warnings) console.warn("⚠ " + w);
if (r.valid) console.log("✔ commit message ok");
process.exit(r.valid ? 0 : 1);
