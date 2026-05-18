// Affiliate link cloaker / tracker MVP — slug management, redirect target
// computation with affiliate params, click recording, and analytics aggregation.

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,40}$/;

export function validateSlug(slug) {
  if (typeof slug !== "string" || !SLUG_RE.test(slug)) {
    return { ok: false, reason: "slug must match /^[a-z0-9][a-z0-9-]{1,40}$/" };
  }
  return { ok: true };
}

export function createLink(store, { slug, targetUrl, ownerId, programs = {}, tags = [] }) {
  const v = validateSlug(slug);
  if (!v.ok) throw new Error(v.reason);
  if (store.links.has(slug)) throw new Error("slug taken");
  if (!/^https?:\/\//.test(targetUrl)) throw new Error("targetUrl must be http(s)");
  const link = {
    slug,
    targetUrl,
    ownerId,
    programs,
    tags,
    createdAt: new Date().toISOString(),
    status: "active",
  };
  store.links.set(slug, link);
  return link;
}

export function buildRedirectUrl(link, programConfig = {}) {
  const url = new URL(link.targetUrl);
  const host = url.hostname.replace(/^www\./, "");
  const cfg = programConfig[host];
  if (cfg) {
    for (const [k, v] of Object.entries(cfg.params ?? {})) {
      url.searchParams.set(k, v);
    }
  }
  // Append UTM if the link defines a tag
  if (link.tags?.length) {
    url.searchParams.set("utm_source", "affiliate-tracker");
    url.searchParams.set("utm_campaign", link.tags[0]);
  }
  return url.toString();
}

export function recordClick(store, slug, ctx = {}) {
  const link = store.links.get(slug);
  if (!link) return { ok: false, status: 404 };
  if (link.status !== "active") return { ok: false, status: 410 };
  const click = {
    slug,
    ownerId: link.ownerId,
    ts: ctx.ts ?? Date.now(),
    country: ctx.country ?? "??",
    device: parseDevice(ctx.userAgent),
    referrer: stripQuery(ctx.referrer),
    ip: maskIp(ctx.ip),
  };
  store.clicks.push(click);
  return { ok: true, redirectTo: buildRedirectUrl(link, ctx.programConfig ?? {}) };
}

function parseDevice(ua = "") {
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  if (!ua) return "unknown";
  return "desktop";
}

function stripQuery(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return null;
  }
}

function maskIp(ip) {
  if (!ip) return null;
  if (ip.includes(":")) return ip.split(":").slice(0, 4).join(":") + "::"; // IPv6
  const p = ip.split(".");
  if (p.length === 4) return `${p[0]}.${p[1]}.${p[2]}.0`;
  return null;
}

export function summarizeClicks(clicks, opts = {}) {
  const start = opts.since ?? 0;
  const filtered = clicks.filter((c) => c.ts >= start && (!opts.slug || c.slug === opts.slug));
  const total = filtered.length;
  const byCountry = bucket(filtered, "country");
  const byDevice = bucket(filtered, "device");
  const byReferrer = bucket(filtered, "referrer");
  return { total, byCountry, byDevice, byReferrer };
}

function bucket(items, key) {
  const m = new Map();
  for (const it of items) m.set(it[key] ?? "?", (m.get(it[key] ?? "?") ?? 0) + 1);
  return Object.fromEntries([...m.entries()].sort((a, b) => b[1] - a[1]));
}

export async function checkLinkHealth(link, fetchImpl = fetch) {
  try {
    const res = await fetchImpl(link.targetUrl, { method: "HEAD", redirect: "follow" });
    return { slug: link.slug, ok: res.status < 400, status: res.status };
  } catch (err) {
    return { slug: link.slug, ok: false, status: 0, error: err.message };
  }
}

export function createStore() {
  return { links: new Map(), clicks: [] };
}
