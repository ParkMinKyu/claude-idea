#!/usr/bin/env node
// CLI: code-img <file> [--theme dark|light] [--no-lines] [--out file.svg]
import { readFileSync, writeFileSync } from "node:fs";
import { renderSvg } from "./render.js";

function arg(args, flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

function main(argv) {
  const args = argv.slice(2);
  const out = arg(args, "--out");
  const theme = arg(args, "--theme") ?? "dark";
  const reserved = [out, theme];
  const file = args.find((a) => !a.startsWith("--") && !reserved.includes(a));
  if (!file) {
    console.error("Usage: code-img <file> [--theme dark|light] [--no-lines] [--out file.svg]");
    process.exit(2);
  }
  const code = readFileSync(file, "utf8");
  const { svg } = renderSvg(code, { theme, lineNumbers: !args.includes("--no-lines") });
  if (out) {
    writeFileSync(out, svg);
    console.error(`wrote ${out}`);
  } else {
    process.stdout.write(svg);
  }
}

main(process.argv);
