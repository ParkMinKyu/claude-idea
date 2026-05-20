// OG image generator core: parse params -> validated config -> SVG markup.
// SVG -> PNG/JPEG rasterization is delegated to resvg/sharp at the edge (render.js);
// all template + layout logic here is pure and dependency-free.

export const DEFAULTS = {
  width: 1200,
  height: 630, // canonical OG aspect ~1.91:1
  bg: "#0f172a",
  fg: "#f8fafc",
  accent: "#38bdf8",
  title: "Untitled",
  subtitle: "",
  template: "basic",
};

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Escape text for safe inclusion in SVG/XML. */
export function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Parse + validate a params object (e.g. from a query string) into a config. */
export function parseParams(params = {}) {
  const cfg = { ...DEFAULTS };
  for (const key of ["bg", "fg", "accent"]) {
    if (params[key] != null) {
      const v = String(params[key]).startsWith("#") ? params[key] : "#" + params[key];
      if (!HEX.test(v)) throw new SyntaxError(`invalid color for ${key}: ${params[key]}`);
      cfg[key] = v;
    }
  }
  for (const key of ["width", "height"]) {
    if (params[key] != null) {
      const n = Number(params[key]);
      if (!Number.isInteger(n) || n < 200 || n > 4000)
        throw new RangeError(`${key} must be 200..4000`);
      cfg[key] = n;
    }
  }
  if (params.title != null) cfg.title = String(params.title).slice(0, 140);
  if (params.subtitle != null) cfg.subtitle = String(params.subtitle).slice(0, 200);
  if (params.template != null) {
    if (!["basic", "split", "minimal"].includes(params.template))
      throw new SyntaxError(`unknown template: ${params.template}`);
    cfg.template = params.template;
  }
  return cfg;
}

/** Naive word-wrap: split into <=maxChars-per-line lines, capped at maxLines. */
export function wrapText(text, maxChars, maxLines = 3) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines) {
    // mark truncation if leftover words exist
    const used = lines.join(" ").split(/\s+/).length;
    if (used < words.length) lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "…");
  }
  return lines;
}

/** Render the SVG string for a validated config. */
export function renderSvg(cfg) {
  const c = { ...DEFAULTS, ...cfg };
  const titleLines = wrapText(c.title, Math.floor(c.width / 24), 3);
  const fontSize = titleLines.length > 2 ? 56 : 72;
  const startY = c.height / 2 - ((titleLines.length - 1) * fontSize) / 2 - 20;

  const titleTspans = titleLines
    .map(
      (line, i) =>
        `<tspan x="80" y="${startY + i * (fontSize + 12)}">${escapeXml(line)}</tspan>`
    )
    .join("");

  const accentBar =
    c.template === "minimal"
      ? ""
      : `<rect x="80" y="${startY - fontSize}" width="120" height="10" fill="${c.accent}"/>`;

  const subtitle = c.subtitle
    ? `<text x="80" y="${c.height - 80}" font-size="32" fill="${c.fg}" opacity="0.8" font-family="sans-serif">${escapeXml(
        c.subtitle
      )}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${c.width}" height="${c.height}" viewBox="0 0 ${c.width} ${c.height}">
  <rect width="100%" height="100%" fill="${c.bg}"/>
  ${accentBar}
  <text font-family="sans-serif" font-weight="700" font-size="${fontSize}" fill="${c.fg}">${titleTspans}</text>
  ${subtitle}
</svg>`;
}

/** Convenience: params -> SVG in one call. */
export function generate(params) {
  return renderSvg(parseParams(params));
}
