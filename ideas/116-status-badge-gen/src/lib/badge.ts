// SVG status badge renderer (shields.io-style "flat" badges).
// Pure functions, zero runtime dependencies.

export interface BadgeOptions {
  label: string;
  message: string;
  color?: string; // named or hex
  labelColor?: string;
}

const NAMED_COLORS: Record<string, string> = {
  brightgreen: '#4c1',
  green: '#97ca00',
  yellow: '#dfb317',
  yellowgreen: '#a4a61d',
  orange: '#fe7d37',
  red: '#e05d44',
  blue: '#007ec6',
  lightgrey: '#9f9f9f',
  gray: '#9f9f9f',
};

export function resolveColor(color: string | undefined, fallback = 'lightgrey'): string {
  if (!color) return NAMED_COLORS[fallback];
  if (/^#[0-9a-fA-F]{3,6}$/.test(color)) return color;
  return NAMED_COLORS[color.toLowerCase()] ?? NAMED_COLORS[fallback];
}

// Approximate text width (px) at the 11px font shields uses.
// Real shields uses font metrics; this average works well for ASCII.
export function textWidth(text: string): number {
  let w = 0;
  for (const ch of text) {
    if (/[A-Z]/.test(ch)) w += 8;
    else if (/[a-z]/.test(ch)) w += 6.5;
    else if (/[0-9]/.test(ch)) w += 7;
    else if (ch === ' ') w += 4;
    else if (/[.\-_:|]/.test(ch)) w += 4;
    else w += 7;
  }
  return Math.ceil(w);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderBadge(opts: BadgeOptions): string {
  const label = opts.label ?? '';
  const message = opts.message ?? '';
  const color = resolveColor(opts.color, 'blue');
  const labelColor = resolveColor(opts.labelColor, 'gray');

  const padding = 10;
  const labelW = textWidth(label) + padding;
  const msgW = textWidth(message) + padding;
  const totalW = labelW + msgW;
  const height = 20;

  const labelX = (labelW / 2) * 10;
  const msgX = (labelW + msgW / 2) * 10;
  const labelTextLen = (textWidth(label)) * 10;
  const msgTextLen = (textWidth(message)) * 10;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${height}" role="img" aria-label="${escapeXml(label)}: ${escapeXml(message)}">
  <title>${escapeXml(label)}: ${escapeXml(message)}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalW}" height="${height}" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="${height}" fill="${labelColor}"/>
    <rect x="${labelW}" width="${msgW}" height="${height}" fill="${color}"/>
    <rect width="${totalW}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="110">
    <text x="${labelX}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${labelTextLen}">${escapeXml(label)}</text>
    <text x="${labelX}" y="140" transform="scale(.1)" textLength="${labelTextLen}">${escapeXml(label)}</text>
    <text x="${msgX}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${msgTextLen}">${escapeXml(message)}</text>
    <text x="${msgX}" y="140" transform="scale(.1)" textLength="${msgTextLen}">${escapeXml(message)}</text>
  </g>
</svg>`;
}

// Coverage badge with auto color thresholds.
export function coverageBadge(pct: number): string {
  let color: string;
  if (pct >= 90) color = 'brightgreen';
  else if (pct >= 75) color = 'green';
  else if (pct >= 60) color = 'yellow';
  else if (pct >= 40) color = 'orange';
  else color = 'red';
  return renderBadge({ label: 'coverage', message: `${pct}%`, color });
}
