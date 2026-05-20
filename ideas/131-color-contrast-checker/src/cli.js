#!/usr/bin/env node
// CLI: node src/cli.js "#777" "#fff"
import { checkContrast } from "./contrast.js";

const [, , fg, bg] = process.argv;
if (!fg || !bg) {
  console.error("usage: cli.js <foreground> <background>");
  process.exit(2);
}
try {
  const r = checkContrast(fg, bg);
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.normal.AA ? 0 : 1);
} catch (e) {
  console.error("error:", e.message);
  process.exit(2);
}
