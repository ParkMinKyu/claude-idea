// Link page domain logic — reorder, validate, parse referrers, generate page JSON.

const URL_RE = /^https?:\/\/[^\s]+$/i;

export function validateLink(input) {
  const errs = [];
  if (!input || typeof input !== "object") return ["link must be object"];
  if (!input.title || typeof input.title !== "string") errs.push("title required");
  if (input.title && input.title.length > 80) errs.push("title too long");
  if (!URL_RE.test(input.url ?? "")) errs.push("url must be http(s)");
  if (input.position != null && !Number.isFinite(input.position)) errs.push("position must be number");
  return errs;
}

export function reorder(links, fromId, toIndex) {
  const arr = [...links].sort((a, b) => a.position - b.position);
  const idx = arr.findIndex((l) => l.id === fromId);
  if (idx === -1) throw new Error("link not found");
  const [item] = arr.splice(idx, 1);
  const clamped = Math.max(0, Math.min(toIndex, arr.length));
  arr.splice(clamped, 0, item);
  return arr.map((l, i) => ({ ...l, position: i }));
}

export function detectIcon(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const map = {
      "youtube.com": "youtube",
      "youtu.be": "youtube",
      "instagram.com": "instagram",
      "tiktok.com": "tiktok",
      "twitter.com": "twitter",
      "x.com": "twitter",
      "github.com": "github",
      "linkedin.com": "linkedin",
      "open.spotify.com": "spotify",
      "stripe.com": "stripe",
      "buy.stripe.com": "stripe",
    };
    for (const k of Object.keys(map)) {
      if (host === k || host.endsWith("." + k)) return map[k];
    }
    return "link";
  } catch {
    return "link";
  }
}

export function parseReferrer(ref) {
  if (!ref) return { source: "direct", medium: "none" };
  try {
    const u = new URL(ref);
    const host = u.hostname.replace(/^www\./, "");
    const utm = u.searchParams.get("utm_source");
    if (utm) return { source: utm, medium: u.searchParams.get("utm_medium") ?? "unknown" };
    if (/google|bing|naver|daum/.test(host)) return { source: host, medium: "organic" };
    if (/instagram|facebook|tiktok|twitter|x\.com|threads/.test(host)) return { source: host, medium: "social" };
    return { source: host, medium: "referral" };
  } catch {
    return { source: "direct", medium: "none" };
  }
}

export function buildPage(profile, links) {
  const sorted = [...links].sort((a, b) => a.position - b.position);
  return {
    slug: profile.slug,
    title: profile.displayName ?? profile.slug,
    avatarUrl: profile.avatarUrl ?? null,
    theme: profile.theme ?? "default",
    links: sorted.map((l) => ({
      id: l.id,
      title: l.title,
      url: l.url,
      icon: l.icon ?? detectIcon(l.url),
      enabled: l.enabled !== false,
    })),
  };
}
