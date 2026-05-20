#!/usr/bin/env node
// CLI: mockgen <schema.json> [--count N] [--seed N]
import { readFileSync } from "node:fs";
import { generate } from "./schema.js";

function arg(args, flag, def) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : def;
}

function main(argv) {
  const args = argv.slice(2);
  const count = Number(arg(args, "--count", "10"));
  const seed = Number(arg(args, "--seed", "1"));
  const reserved = [String(count), String(seed)];
  const file = args.find((a) => !a.startsWith("--") && !reserved.includes(a));
  if (!file) {
    console.error("Usage: mockgen <schema.json> [--count N] [--seed N]");
    process.exit(2);
  }
  const schema = JSON.parse(readFileSync(file, "utf8"));
  console.log(JSON.stringify(generate(schema, { count, seed }), null, 2));
}

main(process.argv);
