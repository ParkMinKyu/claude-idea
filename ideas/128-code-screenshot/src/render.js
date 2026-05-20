// Render tokenized code to an SVG string. Pure (deterministic).
import { tokenize } from "./tokenizer.js";
import { getTheme } from "./themes.js";
import { escapeXml } from "./escape.js";

const DEFAULTS = {
  fontSize: 14,
  padding: 24,
  lineHeight: 1.5,
  charWidth: 0.6, // relative to fontSize (monospace approximation)
  headerHeight: 36,
  lineNumbers: true,
  theme: "dark",
};

function colorFor(theme, type) {
  return theme[type] ?? theme.text;
}

/**
 * Render code to SVG.
 * @returns {{ svg:string, width:number, height:number, lines:number }}
 */
export function renderSvg(code, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const theme = getTheme(o.theme);
  const lines = tokenize(code);
  const lineCount = lines.length;

  const cw = o.fontSize * o.charWidth;
  const lh = o.fontSize * o.lineHeight;
  const gutter = o.lineNumbers ? cw * (String(lineCount).length + 2) : 0;

  const longest = Math.max(0, ...lines.map((ln) => ln.reduce((n, t) => n + t.text.length, 0)));
  const width = Math.ceil(o.padding * 2 + gutter + longest * cw);
  const height = Math.ceil(o.headerHeight + o.padding * 2 + lineCount * lh);

  const parts = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="monospace">`);
  parts.push(`<rect width="${width}" height="${height}" rx="10" fill="${theme.bg}"/>`);
  parts.push(`<rect width="${width}" height="${o.headerHeight}" rx="10" fill="${theme.window}"/>`);
  // macOS-style traffic lights.
  parts.push(`<circle cx="20" cy="18" r="6" fill="#ff5f56"/>`);
  parts.push(`<circle cx="40" cy="18" r="6" fill="#ffbd2e"/>`);
  parts.push(`<circle cx="60" cy="18" r="6" fill="#27c93f"/>`);

  lines.forEach((tokens, i) => {
    const y = o.headerHeight + o.padding + (i + 1) * lh - lh * 0.25;
    if (o.lineNumbers) {
      parts.push(
        `<text x="${o.padding}" y="${y}" font-size="${o.fontSize}" fill="${theme.lineNumber}">${i + 1}</text>`
      );
    }
    let x = o.padding + gutter;
    for (const tok of tokens) {
      if (tok.text.trim() === "") {
        x += tok.text.length * cw;
        continue;
      }
      parts.push(
        `<text x="${x.toFixed(1)}" y="${y}" font-size="${o.fontSize}" fill="${colorFor(theme, tok.type)}" xml:space="preserve">${escapeXml(tok.text)}</text>`
      );
      x += tok.text.length * cw;
    }
  });

  parts.push("</svg>");
  return { svg: parts.join("\n"), width, height, lines: lineCount };
}
