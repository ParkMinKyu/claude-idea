#!/usr/bin/env node
// CLI: schema-viz <schema.sql> [--dot]  -> JSON model or Graphviz DOT
import { readFileSync } from "node:fs";
import { parseDDL, toDot } from "./parser.js";

export function visualize(sql, format = "json") {
  const model = parseDDL(sql);
  return format === "dot" ? toDot(model) : JSON.stringify(model, null, 2);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const path = process.argv[2];
  if (!path) {
    console.error("usage: schema-viz <schema.sql> [--dot]");
    process.exit(2);
  }
  const sql = readFileSync(path, "utf8");
  console.log(visualize(sql, process.argv.includes("--dot") ? "dot" : "json"));
}
