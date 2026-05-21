#!/usr/bin/env node
// Bundle each demos/*.demo.js into dist/demos/<slug>.js (browser IIFE).
// Adapters that fail to bundle (Node-only deps) are skipped and reported.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEMOS_DIR = path.join(ROOT, "demos");
const OUT_DIR = path.join(ROOT, "dist", "demos");

export async function buildDemos() {
  if (!fs.existsSync(DEMOS_DIR)) return { ok: [], failed: [] };
  // esbuild is installed under demos/node_modules
  const esbuildEntry = path.join(DEMOS_DIR, "node_modules", "esbuild", "lib", "main.js");
  const { build } = await import(pathToFileURL(esbuildEntry).href);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const adapters = fs.readdirSync(DEMOS_DIR).filter((f) => f.endsWith(".demo.js"));
  const ok = [];
  const failed = [];

  for (const file of adapters) {
    const slug = file.replace(/\.demo\.js$/, "");
    const entry = path.join(DEMOS_DIR, file);
    const outfile = path.join(OUT_DIR, `${slug}.js`);
    try {
      await build({
        entryPoints: [entry],
        outfile,
        bundle: true,
        format: "iife",
        platform: "browser",
        target: "es2020",
        minify: true,
        legalComments: "none",
        logLevel: "silent",
        define: { "process.env.NODE_ENV": '"production"' },
      });
      ok.push(slug);
    } catch (err) {
      failed.push({ slug, error: (err && err.message ? err.message : String(err)).split("\n")[0] });
    }
  }

  return { ok, failed };
}

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  buildDemos().then((res) => {
    console.log(`✓ 데모 번들 ${res.ok.length}개 성공`);
    res.ok.forEach((s) => console.log(`  ✓ ${s}`));
    if (res.failed.length) {
      console.log(`✗ ${res.failed.length}개 실패 (Node 전용 의존성 등):`);
      res.failed.forEach((f) => console.log(`  ✗ ${f.slug} — ${f.error}`));
    }
  });
}
