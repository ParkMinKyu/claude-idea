#!/usr/bin/env node
// Runtime-verify every built demo bundle by actually executing its spec.run()
// with the adapter's default field values, in a sandbox that mimics the browser.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEMOS = path.join(ROOT, "dist", "demos");

const files = fs.readdirSync(DEMOS).filter((f) => f.endsWith(".js")).sort();
const ok = [];
const bad = [];

for (const file of files) {
  const slug = file.replace(/\.js$/, "");
  const code = fs.readFileSync(path.join(DEMOS, file), "utf8");
  const ctx = {};
  ctx.window = ctx;
  ctx.globalThis = ctx;
  ctx.self = ctx;
  ctx.console = console;
  ctx.crypto = globalThis.crypto;
  ctx.TextEncoder = TextEncoder;
  ctx.TextDecoder = TextDecoder;
  ctx.btoa = (s) => Buffer.from(s, "binary").toString("base64");
  ctx.atob = (s) => Buffer.from(s, "base64").toString("binary");
  ctx.setTimeout = setTimeout;
  try {
    vm.createContext(ctx);
    vm.runInContext(code, ctx, { timeout: 5000 });
    const spec = ctx.__DEMO_SPEC__ || (ctx.window && ctx.window.__DEMO_SPEC__);
    if (!spec || typeof spec.run !== "function") {
      bad.push({ slug, why: "no __DEMO_SPEC__.run" });
      continue;
    }
    const vals = {};
    for (const f of spec.fields || []) vals[f.name] = f.default != null ? f.default : "";
    const res = spec.run(vals);
    if (!Array.isArray(res) || res.length === 0) {
      bad.push({ slug, why: "run() returned empty/non-array" });
      continue;
    }
    const errs = res.filter((r) => r && r.type === "error");
    if (errs.length) {
      bad.push({ slug, why: "error result: " + errs.map((e) => e.value).join("; ").slice(0, 120) });
      continue;
    }
    const empties = res.filter((r) => r && (r.value == null || r.value === ""));
    ok.push({ slug, results: res.length, empties: empties.length });
  } catch (err) {
    bad.push({ slug, why: (err && err.message ? err.message : String(err)).split("\n")[0] });
  }
}

console.log(`\n=== 런타임 검증: ${ok.length}/${files.length} OK ===`);
for (const o of ok) console.log(`  ✓ ${o.slug} (${o.results} results${o.empties ? `, ${o.empties} empty` : ""})`);
if (bad.length) {
  console.log(`\n=== 실패 ${bad.length}개 ===`);
  for (const b of bad) console.log(`  ✗ ${b.slug} — ${b.why}`);
  process.exit(1);
}
