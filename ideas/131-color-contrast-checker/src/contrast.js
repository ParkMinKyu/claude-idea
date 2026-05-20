// Color contrast checker core: WCAG 2.1 relative luminance + contrast ratio + grade.
// Pure functions, zero deps. Spec: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance

/** Parse #rgb / #rrggbb / rgb(r,g,b) into {r,g,b} (0-255). Throws on invalid. */
export function parseColor(input) {
  if (typeof input !== "string") throw new TypeError("color must be a string");
  const s = input.trim().toLowerCase();
  let m;
  if ((m = /^#([0-9a-f]{3})$/.exec(s))) {
    const [r, g, b] = m[1].split("").map((c) => parseInt(c + c, 16));
    return { r, g, b };
  }
  if ((m = /^#([0-9a-f]{6})$/.exec(s))) {
    return {
      r: parseInt(m[1].slice(0, 2), 16),
      g: parseInt(m[1].slice(2, 4), 16),
      b: parseInt(m[1].slice(4, 6), 16),
    };
  }
  if ((m = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(s))) {
    const r = +m[1], g = +m[2], b = +m[3];
    if ([r, g, b].some((v) => v > 255)) throw new RangeError("channel out of range");
    return { r, g, b };
  }
  throw new SyntaxError(`unrecognized color: ${input}`);
}

/** sRGB channel (0-255) -> linear value per WCAG. */
export function linearize(channel8bit) {
  const c = channel8bit / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Relative luminance (0..1). */
export function relativeLuminance({ r, g, b }) {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Contrast ratio between two colors (1..21), rounded to 2 decimals. */
export function contrastRatio(fg, bg) {
  const a = relativeLuminance(typeof fg === "string" ? parseColor(fg) : fg);
  const b = relativeLuminance(typeof bg === "string" ? parseColor(bg) : bg);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

/**
 * WCAG pass/fail grade for a ratio.
 * @param {number} ratio
 * @param {{large?: boolean}} opts  large = >=18pt or >=14pt bold
 */
export function grade(ratio, { large = false } = {}) {
  const aa = large ? 3.0 : 4.5;
  const aaa = large ? 4.5 : 7.0;
  return {
    ratio,
    AA: ratio >= aa,
    AAA: ratio >= aaa,
    level: ratio >= aaa ? "AAA" : ratio >= aa ? "AA" : "fail",
  };
}

/** Full check returning ratio + grades for normal and large text. */
export function checkContrast(fg, bg) {
  const ratio = contrastRatio(fg, bg);
  return {
    ratio,
    normal: grade(ratio, { large: false }),
    large: grade(ratio, { large: true }),
  };
}
