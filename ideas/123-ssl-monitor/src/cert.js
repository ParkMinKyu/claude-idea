// Pure functions over a parsed peer-certificate object.
// Input shape matches Node's tls.getPeerCertificate():
//   { valid_from, valid_to, subject:{CN}, issuer:{O,CN}, subjectaltname, sigalg }

const DAY_MS = 86_400_000;

export const DEFAULT_THRESHOLDS = { warning: 30, critical: 7 };

/** Days remaining until notAfter (negative if expired). */
export function daysUntilExpiry(cert, now = new Date()) {
  const notAfter = new Date(cert.valid_to);
  return Math.floor((notAfter.getTime() - now.getTime()) / DAY_MS);
}

/** Classify expiry status from days remaining. */
export function classifyExpiry(days, thresholds = DEFAULT_THRESHOLDS) {
  if (days < 0) return "expired";
  if (days <= thresholds.critical) return "critical";
  if (days <= thresholds.warning) return "warning";
  return "ok";
}

/** Parse the subjectaltname string into an array of DNS names. */
export function parseSan(subjectaltname = "") {
  return subjectaltname
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("DNS:"))
    .map((s) => s.slice(4));
}

/** Wildcard-aware hostname match against a single SAN entry. */
export function matchHost(host, san) {
  if (san === host) return true;
  if (san.startsWith("*.")) {
    const suffix = san.slice(1); // ".example.com"
    const hostSuffix = host.slice(host.indexOf("."));
    // Wildcard matches exactly one left-most label.
    return host.includes(".") && hostSuffix === suffix && host.split(".").length === san.split(".").length;
  }
  return false;
}

/** True if hostname is covered by CN or any SAN. */
export function hostCovered(cert, host) {
  const names = [...parseSan(cert.subjectaltname), cert?.subject?.CN].filter(Boolean);
  return names.some((n) => matchHost(host, n));
}

/** Detect a weak signature algorithm (SHA-1 / MD5). */
export function isWeakSignature(cert) {
  const alg = (cert.sigalg ?? "").toLowerCase();
  return alg.includes("sha1") || alg.includes("md5");
}

/** Full health evaluation for one cert + intended host. */
export function evaluateCert(cert, host, opts = {}) {
  const now = opts.now ?? new Date();
  const thresholds = opts.thresholds ?? DEFAULT_THRESHOLDS;
  const days = daysUntilExpiry(cert, now);
  const status = classifyExpiry(days, thresholds);
  const issues = [];
  if (host && !hostCovered(cert, host)) issues.push("hostname-mismatch");
  if (isWeakSignature(cert)) issues.push("weak-signature");
  return {
    host,
    daysRemaining: days,
    status,
    issuer: cert?.issuer?.O ?? cert?.issuer?.CN ?? "unknown",
    validTo: cert.valid_to,
    issues,
    healthy: status === "ok" && issues.length === 0,
  };
}
