import { hexToRgb, rgbToHex } from "./color";

export interface Swatch {
  id: string;
  hex: string;
  label?: string;
}

export interface Palette {
  id: string;
  name: string;
  swatches: Swatch[];
}

export const MAX_FREE_PALETTES = 3;
export const MAX_FREE_SWATCHES = 50;

export function newSwatch(hex: string, label?: string): Swatch {
  const rgb = hexToRgb(hex); // validates
  return { id: rid(), hex: rgbToHex(rgb).toLowerCase(), label };
}

export function addSwatch(p: Palette, hex: string, label?: string, isPro = false): Palette {
  if (p.swatches.some((s) => s.hex.toLowerCase() === hex.toLowerCase())) return p;
  const swatches = [...p.swatches, newSwatch(hex, label)];
  if (!isPro && swatches.length > MAX_FREE_SWATCHES) return p;
  return { ...p, swatches };
}

export function removeSwatch(p: Palette, id: string): Palette {
  return { ...p, swatches: p.swatches.filter((s) => s.id !== id) };
}

export function reorder(p: Palette, fromIndex: number, toIndex: number): Palette {
  const arr = [...p.swatches];
  const [s] = arr.splice(fromIndex, 1);
  arr.splice(Math.max(0, Math.min(arr.length, toIndex)), 0, s);
  return { ...p, swatches: arr };
}

export function toCssVariables(p: Palette, prefix = "--color"): string {
  const lines = p.swatches.map((s, i) => {
    const key = (s.label || `${prefix}-${i + 1}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    return `  ${key.startsWith("--") ? key : prefix + "-" + key}: ${s.hex};`;
  });
  return `:root {\n${lines.join("\n")}\n}`;
}

export function toTailwindTheme(p: Palette): string {
  const obj: Record<string, string> = {};
  for (const [i, s] of p.swatches.entries()) {
    const key = (s.label || `c${i + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, "");
    obj[key] = s.hex;
  }
  return `{ "extend": { "colors": ${JSON.stringify(obj, null, 2)} } }`;
}

export function toJson(p: Palette): string {
  return JSON.stringify(p, null, 2);
}

function rid(): string {
  return Math.random().toString(36).slice(2, 9);
}
