export interface ParsedPrice {
  amount: number;
  currency: string;
}

const CURRENCY_MAP: Record<string, string> = {
  "$": "USD",
  "￥": "JPY",
  "¥": "JPY",
  "€": "EUR",
  "£": "GBP",
  "₩": "KRW",
};

const SELECTORS = [
  ".a-price .a-offscreen",
  "#priceblock_ourprice",
  "#priceblock_dealprice",
  "#priceblock_saleprice",
  "#corePrice_feature_div .a-offscreen",
];

export function parsePriceFromHtml(html: string): ParsedPrice | null {
  for (const sel of SELECTORS) {
    const m = matchSelector(html, sel);
    if (m) {
      const parsed = parsePriceString(m);
      if (parsed) return parsed;
    }
  }
  return null;
}

export function parsePriceString(s: string): ParsedPrice | null {
  const trimmed = s.trim();
  // detect currency symbol or 3-letter code
  let currency = "USD";
  for (const [sym, code] of Object.entries(CURRENCY_MAP)) {
    if (trimmed.includes(sym)) {
      currency = code;
      break;
    }
  }
  const codeMatch = trimmed.match(/\b(USD|EUR|JPY|GBP|KRW)\b/);
  if (codeMatch) currency = codeMatch[1];
  // For JPY no decimals; strip commas.
  const cleaned = trimmed
    .replace(/[^\d.,]/g, "")
    .replace(/,(?=\d{3}(\D|$))/g, "");
  const n = parseFloat(cleaned);
  if (!isFinite(n) || n <= 0) return null;
  return { amount: n, currency };
}

function matchSelector(html: string, selector: string): string | null {
  // tiny class/id matcher (not a full CSS engine)
  // supports: ".class .class2", "#id", "#id .class"
  const parts = selector.split(/\s+/);
  let cursor = html;
  for (const p of parts) {
    let re: RegExp;
    if (p.startsWith(".")) {
      const cls = p.slice(1);
      re = new RegExp(
        `<[a-z0-9]+[^>]*class="[^"]*\\b${escapeRe(cls)}\\b[^"]*"[^>]*>([\\s\\S]*?)</`,
        "i"
      );
    } else if (p.startsWith("#")) {
      const id = p.slice(1);
      re = new RegExp(
        `<[a-z0-9]+[^>]*id="${escapeRe(id)}"[^>]*>([\\s\\S]*?)</[a-z]`,
        "i"
      );
    } else {
      return null;
    }
    const m = cursor.match(re);
    if (!m) return null;
    cursor = m[1];
  }
  return cursor.replace(/<[^>]+>/g, "").trim();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractAsin(url: string): string | null {
  const m = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/);
  return m ? m[1] : null;
}
