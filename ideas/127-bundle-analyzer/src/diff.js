// Compute per-asset diff between baseline and current asset maps. Pure.

/**
 * @returns {{ assets:object[], totalDelta:number, totalGzipDelta:number }}
 */
export function diffAssets(baseline = {}, current = {}) {
  const names = new Set([...Object.keys(baseline), ...Object.keys(current)]);
  const assets = [];
  let totalDelta = 0;
  let totalGzipDelta = 0;

  for (const name of names) {
    const b = baseline[name] ?? { size: 0, gzip: 0 };
    const c = current[name] ?? { size: 0, gzip: 0 };
    const delta = c.size - b.size;
    const gzipDelta = c.gzip - b.gzip;
    totalDelta += delta;
    totalGzipDelta += gzipDelta;
    let status = "unchanged";
    if (!baseline[name]) status = "added";
    else if (!current[name]) status = "removed";
    else if (delta !== 0) status = "changed";
    assets.push({ name, baselineSize: b.size, currentSize: c.size, delta, gzipDelta, status });
  }

  assets.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return { assets, totalDelta, totalGzipDelta };
}
