// Broken link checker core: link extraction, URL normalization, status classification, simple crawl loop.
// cheerio import is dynamic to keep tests fast & optional.

export function normalizeUrl(input, base) {
  try {
    const u = new URL(input, base);
    u.hash = "";
    // Normalize trailing slash on paths (keep root /)
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.replace(/\/+$/, "");
    }
    return u.toString();
  } catch {
    return null;
  }
}

export function isSameOrigin(url, base) {
  try {
    return new URL(url).origin === new URL(base).origin;
  } catch {
    return false;
  }
}

const SKIP_SCHEMES = /^(mailto:|tel:|javascript:|data:|#)/i;

export function extractLinks(html, base) {
  // Lightweight regex parser used in tests; production uses cheerio.
  const found = new Set();
  const re = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const raw = m[1].trim();
    if (!raw || SKIP_SCHEMES.test(raw)) continue;
    const norm = normalizeUrl(raw, base);
    if (norm) found.add(norm);
  }
  return [...found];
}

export function classifyStatus(status) {
  if (status === 0) return "error";
  if (status >= 200 && status < 300) return "ok";
  if (status >= 300 && status < 400) return "redirect";
  if (status === 404 || status === 410) return "broken";
  if (status >= 400 && status < 500) return "client_error";
  if (status >= 500) return "server_error";
  return "unknown";
}

export async function checkLink(url, fetchImpl = fetch, timeoutMs = 10_000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    let res = await fetchImpl(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    if (res.status === 405 || res.status === 501) {
      res = await fetchImpl(url, { method: "GET", redirect: "follow", signal: controller.signal });
    }
    return { url, status: res.status, classification: classifyStatus(res.status), latencyMs: Date.now() - start };
  } catch (err) {
    return {
      url,
      status: 0,
      classification: "error",
      error: err.name === "AbortError" ? "timeout" : err.message,
      latencyMs: Date.now() - start,
    };
  } finally {
    clearTimeout(t);
  }
}

// Naive single-threaded crawler suitable for unit tests; production uses p-queue.
export async function crawl({ seed, maxPages = 50, fetchImpl = fetch, sameOrigin = true }) {
  const visited = new Map();
  const queue = [seed];
  while (queue.length > 0 && visited.size < maxPages) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    const res = await fetchImpl(url);
    const status = res.status ?? 0;
    const html = typeof res.text === "function" ? await res.text() : "";
    visited.set(url, { status, classification: classifyStatus(status) });
    if (status >= 200 && status < 300) {
      for (const link of extractLinks(html, url)) {
        if (sameOrigin && !isSameOrigin(link, seed)) continue;
        if (!visited.has(link)) queue.push(link);
      }
    }
  }
  return [...visited.entries()].map(([url, v]) => ({ url, ...v }));
}
