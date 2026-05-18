// Bookmark domain: meta extraction, tag suggestion, search query.

export function extractMeta(html, url) {
  const get = (re) => {
    const m = html.match(re);
    return m ? decode(m[1].trim()) : null;
  };
  const title = get(/<title>([^<]+)<\/title>/i) ?? get(/property=["']og:title["']\s+content=["']([^"']+)["']/i) ?? url;
  const description =
    get(/name=["']description["']\s+content=["']([^"']+)["']/i) ??
    get(/property=["']og:description["']\s+content=["']([^"']+)["']/i) ??
    "";
  const image = get(/property=["']og:image["']\s+content=["']([^"']+)["']/i);
  const domain = new URL(url).hostname.replace(/^www\./, "");
  return { url, title, description, image, domain };
}

const STOP = new Set(
  "the a an of and to in on for with by is are was were be been this that these those it its as at from or not but if".split(" ")
);

export function suggestTags(text, limit = 5) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z가-힣0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP.has(w));
  const freq = {};
  for (const w of words) freq[w] = (freq[w] ?? 0) + 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

export function buildSearchQuery({ q, tags = [], domain }) {
  // Returns a simple filter object the search backend can consume.
  return {
    q: q ?? "",
    filters: [
      ...tags.map((t) => `tags = "${escape(t)}"`),
      domain ? `domain = "${escape(domain)}"` : null,
    ].filter(Boolean),
  };
}

function decode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escape(s) {
  return s.replace(/"/g, '\\"');
}
