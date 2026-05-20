#!/usr/bin/env node
// CLI: git diff origin/main...HEAD | node src/cli.js
// Reads a unified diff from stdin and prints the size label (and JSON stats).
import { labelDiff } from "./labeler.js";

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  const r = labelDiff(input);
  console.error(JSON.stringify(r, null, 2));
  // print just the label to stdout so it's easy to capture in CI:
  console.log(r.label);
});
