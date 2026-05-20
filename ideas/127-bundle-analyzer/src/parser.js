// Parse a bundler stats.json into a normalized asset map. Pure.

const SOURCEMAP_RE = /\.map$/;

/**
 * Normalize stats into { name -> { size, gzip } }.
 * Handles webpack `assets[]` and rollup/vite `output{}` shapes.
 */
export function parseStats(stats, { includeSourcemaps = false } = {}) {
  const assets = {};

  const add = (name, size, gzip) => {
    if (!name) return;
    if (!includeSourcemaps && SOURCEMAP_RE.test(name)) return;
    assets[name] = { size: Number(size) || 0, gzip: gzip != null ? Number(gzip) : estimateGzip(Number(size) || 0) };
  };

  if (Array.isArray(stats?.assets)) {
    for (const a of stats.assets) add(a.name, a.size, a.gzipSize ?? a.gzip);
  }
  if (stats?.output && typeof stats.output === "object") {
    for (const [name, o] of Object.entries(stats.output)) {
      const size = o.size ?? (typeof o.code === "string" ? o.code.length : 0);
      add(name, size, o.gzip);
    }
  }
  return assets;
}

/** Rough gzip estimate when not provided by the bundler. */
export function estimateGzip(rawBytes) {
  return Math.round(rawBytes * 0.32);
}

/** Total raw + gzip across all assets. */
export function totals(assets) {
  return Object.values(assets).reduce(
    (acc, a) => ({ size: acc.size + a.size, gzip: acc.gzip + a.gzip }),
    { size: 0, gzip: 0 }
  );
}
