import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeUrl,
  sameHost,
  extractLinks,
  crawl,
  buildSitemap,
  buildSitemapIndex,
} from "../src/sitemap.js";

test("normalizeUrl strips hash, trailing slash, tracking params", () => {
  assert.equal(normalizeUrl("/a/#x", "https://e.com/"), "https://e.com/a");
  assert.equal(
    normalizeUrl("https://e.com/p?utm_source=x&id=5", "https://e.com/"),
    "https://e.com/p?id=5"
  );
});

test("extractLinks dedupes and skips nofollow + non-http schemes", () => {
  const html = `
    <a href="/a">A</a>
    <a href="/a">dup</a>
    <a href="/b" rel="nofollow">B</a>
    <a href="mailto:x@y">m</a>`;
  const links = extractLinks(html, "https://e.com/").sort();
  assert.deepEqual(links, ["https://e.com/a"]);
});

test("extractLinks can include nofollow when asked", () => {
  const html = `<a href="/b" rel="nofollow">B</a>`;
  assert.deepEqual(extractLinks(html, "https://e.com/", { followNofollow: true }), [
    "https://e.com/b",
  ]);
});

test("crawl BFS visits same-host pages within limit", async () => {
  // seed normalizes to root with trailing slash; mock keys match normalized urls.
  const pages = {
    "https://e.com/": { status: 200, text: async () => '<a href="/a">a</a><a href="https://other.com/z">z</a>' },
    "https://e.com/a": { status: 200, text: async () => '<a href="/b">b</a>' },
    "https://e.com/b": { status: 200, text: async () => "" },
  };
  const out = await crawl({
    seed: "https://e.com",
    maxPages: 10,
    fetchImpl: async (u) => pages[u] ?? { status: 404, text: async () => "" },
  });
  const urls = out.map((p) => p.url).sort();
  assert.deepEqual(urls, ["https://e.com/", "https://e.com/a", "https://e.com/b"]);
});

test("crawl respects maxPages", async () => {
  const fetchImpl = async (u) => ({
    status: 200,
    text: async () => '<a href="/1">1</a><a href="/2">2</a><a href="/3">3</a>',
  });
  const out = await crawl({ seed: "https://e.com", maxPages: 2, fetchImpl });
  assert.equal(out.length, 2);
});

test("buildSitemap emits valid xml with escaping + dedupe", () => {
  const xml = buildSitemap([
    { url: "https://e.com/a&b", lastmod: "2024-01-01", priority: 0.8 },
    { url: "https://e.com/a&b" }, // duplicate dropped
  ]);
  assert.ok(xml.startsWith('<?xml version="1.0"'));
  assert.ok(xml.includes("https://e.com/a&amp;b"));
  assert.ok(xml.includes("<priority>0.8</priority>"));
  assert.equal((xml.match(/<url>/g) || []).length, 1);
});

test("buildSitemapIndex splits over perFile and writes index", () => {
  const pages = Array.from({ length: 5 }, (_, i) => ({ url: `https://e.com/${i}` }));
  const { files, index } = buildSitemapIndex(pages, "https://e.com/", 2);
  assert.equal(files.length, 3); // 2 + 2 + 1
  assert.ok(index.includes("<sitemapindex"));
  assert.ok(index.includes("https://e.com/sitemap-1.xml"));
});
