// Header normalization helpers (pure).

/** Normalize a headers object (or Headers instance) to a lowercase-key map. */
export function normalizeHeaders(input) {
  const out = {};
  if (!input) return out;
  // Support both plain objects and Headers-like (entries()).
  const entries = typeof input.entries === "function" ? [...input.entries()] : Object.entries(input);
  for (const [k, v] of entries) {
    out[String(k).toLowerCase()] = Array.isArray(v) ? v.join(", ") : String(v);
  }
  return out;
}

/** Parse a directive-style header value (e.g. HSTS, Cache-Control) into a map. */
export function parseDirectives(value = "") {
  const map = {};
  for (const part of value.split(/[;,]/)) {
    const [k, ...rest] = part.trim().split("=");
    if (!k) continue;
    map[k.toLowerCase()] = rest.length ? rest.join("=").trim() : true;
  }
  return map;
}
