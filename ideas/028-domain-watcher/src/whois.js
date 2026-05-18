// Lightweight whois response parser + domain validation + alert tier resolver.

const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)$/i;

export function isValidDomain(input) {
  if (typeof input !== "string") return false;
  return DOMAIN_RE.test(input.trim().toLowerCase());
}

const EXPIRY_KEYS = [
  /^Registry Expiry Date:/i,
  /^Registrar Registration Expiration Date:/i,
  /^Expiration Date:/i,
  /^expires:/i,
  /^expire:/i,
  /^Expiry Date:/i,
];

const AVAILABLE_MARKERS = [
  /no match for/i,
  /not found/i,
  /no entries found/i,
  /domain not found/i,
  /is available/i,
];

export function parseWhois(text) {
  if (typeof text !== "string") return { status: "unknown" };
  if (AVAILABLE_MARKERS.some((re) => re.test(text))) return { status: "available" };

  const lines = text.split(/\r?\n/);
  let expiry = null;
  let registrar = null;
  for (const line of lines) {
    if (!expiry && EXPIRY_KEYS.some((re) => re.test(line))) {
      const idx = line.indexOf(":");
      const raw = line.slice(idx + 1).trim();
      const d = new Date(raw);
      if (!isNaN(d.getTime())) expiry = d.toISOString();
    }
    if (!registrar && /^Registrar:/i.test(line)) {
      registrar = line.split(":").slice(1).join(":").trim();
    }
  }
  return {
    status: expiry ? "active" : "unknown",
    expiresAt: expiry,
    registrar,
  };
}

// Alert tiers when nearing expiration. Returns the tier label or null.
export function expiryAlertTier(expiresAt, now = new Date()) {
  if (!expiresAt) return null;
  const days = Math.ceil((new Date(expiresAt) - now) / 86_400_000);
  if (days <= 0) return "expired";
  if (days <= 1) return "1d";
  if (days <= 7) return "7d";
  if (days <= 14) return "14d";
  if (days <= 30) return "30d";
  return null;
}

// Diff previous and current whois to decide which event to emit.
export function detectChange(prev, current) {
  if (!prev || prev.status === "unknown") return current.status === "available" ? "available" : null;
  if (prev.status !== "available" && current.status === "available") return "available";
  if (prev.status === "available" && current.status === "active") return "registered";
  if (prev.expiresAt !== current.expiresAt && current.expiresAt) return "expiry_changed";
  return null;
}
