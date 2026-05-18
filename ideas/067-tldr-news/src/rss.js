// Tiny RSS/Atom parser tuned for our needs. We only care about title, link,
// pubDate and a content snippet. Real prod uses fast-xml-parser; this is
// dependency-free for the MVP so tests don't need a package install.

const ITEM_RE = /<item\b[\s\S]*?<\/item>|<entry\b[\s\S]*?<\/entry>/gi;
const TAG_RE = (tag) => new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');

function decode(s) {
  if (!s) return '';
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '')
    .trim();
}

function extractLink(block) {
  // Atom: <link href="..."/>; RSS: <link>...</link>
  const hrefMatch = block.match(/<link[^>]*href=["']([^"']+)["']/i);
  if (hrefMatch) return hrefMatch[1];
  const inner = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  return inner ? inner[1].trim() : '';
}

export function parseFeed(xml) {
  if (typeof xml !== 'string' || xml.length === 0) return [];
  const items = [];
  const blocks = xml.match(ITEM_RE) || [];
  for (const block of blocks) {
    const title = decode(block.match(TAG_RE('title'))?.[1] || '');
    const link = extractLink(block);
    const pub =
      block.match(TAG_RE('pubDate'))?.[1] ||
      block.match(TAG_RE('updated'))?.[1] ||
      block.match(TAG_RE('published'))?.[1] ||
      '';
    const desc = decode(
      block.match(TAG_RE('description'))?.[1] ||
        block.match(TAG_RE('summary'))?.[1] ||
        ''
    );
    if (title && link) {
      items.push({
        title,
        url: link,
        publishedAt: pub ? new Date(pub).toISOString() : null,
        snippet: desc.slice(0, 400),
      });
    }
  }
  return items;
}

// Normalize URL for dedupe: strip tracking params + trailing slash.
const TRACKING = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'fbclid', 'mc_cid', 'mc_eid',
]);

export function normalizeUrl(raw) {
  try {
    const u = new URL(raw);
    for (const k of [...u.searchParams.keys()]) {
      if (TRACKING.has(k.toLowerCase())) u.searchParams.delete(k);
    }
    u.hash = '';
    let s = u.toString();
    if (s.endsWith('/')) s = s.slice(0, -1);
    return s;
  } catch {
    return raw;
  }
}
