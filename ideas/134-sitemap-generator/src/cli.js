#!/usr/bin/env node
// CLI: node src/cli.js https://example.com [maxPages]  -> prints sitemap.xml
import { crawl, buildSitemap } from "./sitemap.js";

const seed = process.argv[2];
const maxPages = Number(process.argv[3] || 100);
if (!seed) {
  console.error("usage: cli.js <seed-url> [maxPages]");
  process.exit(2);
}

const pages = await crawl({ seed, maxPages, fetchImpl: fetch });
process.stdout.write(buildSitemap(pages.map((p) => ({ ...p, changefreq: "weekly", priority: 0.5 }))));
