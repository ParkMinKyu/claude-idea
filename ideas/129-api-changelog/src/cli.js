#!/usr/bin/env node
// CLI: api-diff <old.yaml|json> <new.yaml|json> [--json]
import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { diffSpecs } from "./diff.js";
import { classifyAll } from "./classify.js";
import { toChangelog } from "./changelog.js";

function loadSpec(file) {
  const text = readFileSync(file, "utf8");
  // yaml.parse handles JSON too.
  return parseYaml(text);
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes("--json");
  const [oldFile, newFile] = args.filter((a) => !a.startsWith("--"));
  if (!oldFile || !newFile) {
    console.error("Usage: api-diff <old> <new> [--json]");
    process.exit(2);
  }
  const changes = diffSpecs(loadSpec(oldFile), loadSpec(newFile));
  const result = classifyAll(changes);
  console.log(json ? JSON.stringify(result, null, 2) : toChangelog(result));
  process.exit(result.hasBreaking ? 1 : 0);
}

main(process.argv);
