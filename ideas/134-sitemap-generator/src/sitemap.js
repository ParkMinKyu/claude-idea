// Sitemap generator core: URL extraction, normalization/dedupe, crawl model, XML build.
// Network is injected (fetchImpl) so the crawl is fully unit-testable offline.

const SKIP = /^(mailto:|tel:|javascript:|data:|#)/i;

/** Normalize a URL relative to base; drop hash; collapse trailing slash (keep root). */
export function normalizeUrl(input, base) {
  try {
    const u = new URL(input, base);
    u.hash = "";
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.replace(/\/+$/, "");
    }
    // strip common tracking params for cleaner sitemaps
    for (const p of [...u.searchParams.keys()]) {
      if (/^utm_|^fbclid$|^gclid$/.test(p)) u.searchParams.delete(p);
    }
    return u.toString();
  } catch {
    return null;
  }
}

export function sameHost(url, base) {
  try {
    return new URL(url).host === new URL(base).host;
  } catch {
    return false;
  }
}

/** Extract internal links from HTML, normalized + deduped, honoring rel=nofollow skip. */
export function extractLinks(html, base, { followNofollow = false } = {}) {
  const out = new Set();
  const re = /<a\b([^>]*?)\bhref\s*=\s*["']([^"']+)["']([^>]*)>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = (m[1] || "") + (m[3] || "");
    if (!followNofollow && /rel\s*=\s*["'][^"']*nofollow/i.test(attrs)) continue;
    const raw = m[2].trim();
    if (!raw || SKIP.test(raw)) continue;
    const norm = normalizeUrl(raw, base);
    if (norm) out.add(norm);
  }
  return [...out];
}

/** Crawl from a seed, BFS, same-host only, bounded by maxPages. Returns visited urls. */
export async function crawl({ seed, maxPages = 100, fetchImpl, opts = {} }) {
  if (typeof fetchImpl !== "function") throw new TypeError("fetchImpl required");
  const start = normalizeUrl(seed, seed);
  if (!start) throw new Error("invalid seed");
  const visited = new Set();
  const queue = [start];
  const pages = [];
  while (queue.length && pages.length < maxPages) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);
    let res;
    try {
      res = await fetchImpl(url);
    } catch {
      continue;
    }
    const status = res.status ?? 0;
    if (status < 200 || status >= 300) continue;
    const html = typeof res.text === "function" ? await res.text() : "";
    pages.push({ url, lastmod: res.lastmod });
    for (const link of extractLinks(html, url, opts)) {
      if (sameHost(link, start) && !visited.has(link)) queue.push(link);
    }
  }
  return pages;
}

function xmlEscape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Build sitemap.xml from page entries.
 * @param {Array<{url:string,lastmod?:string,changefreq?:string,priority?:number}>} pages
 */
export function buildSitemap(pages) {
  const seen = new Set();
  const rows = [];
  for (const p of pages) {
    if (!p?.url || seen.has(p.url)) continue;
    seen.add(p.url);
    const parts = [`    <loc>${xmlEscape(p.url)}</loc>`];
    if (p.lastmod) parts.push(`    <lastmod>${xmlEscape(p.lastmod)}</lastmod>`);
    if (p.changefreq) parts.push(`    <changefreq>${xmlEscape(p.changefreq)}</changefreq>`);
    if (p.priority != null) parts.push(`    <priority>${Number(p.priority).toFixed(1)}</priority>`);
    rows.push(`  <url>\n${parts.join("\n")}\n  </url>`);
  }
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    rows.join("\n") +
    `\n</urlset>\n`
  );
}

/** Split into multiple sitemaps + an index when over the 50k URL limit. */
export function buildSitemapIndex(pages, baseUrl, perFile = 50000) {
  const chunks = [];
  for (let i = 0; i < pages.length; i += perFile) chunks.push(pages.slice(i, i + perFile));
  const files = chunks.map((c, i) => ({ name: `sitemap-${i + 1}.xml`, xml: buildSitemap(c) }));
  const index =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    files
      .map((f) => `  <sitemap>\n    <loc>${xmlEscape(new URL(f.name, baseUrl).toString())}</loc>\n  </sitemap>`)
      .join("\n") +
    `\n</sitemapindex>\n`;
  return { files, index };
}
