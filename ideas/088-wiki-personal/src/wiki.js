// Core wiki engine: link parsing, backlink index, in-memory search.

const LINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export function parseLinks(markdown) {
  const links = [];
  for (const m of markdown.matchAll(LINK_RE)) {
    links.push({ title: m[1].trim(), alias: m[2]?.trim() ?? null });
  }
  return links;
}

export function renderLinks(markdown, exists = () => true) {
  return markdown.replace(LINK_RE, (_, title, alias) => {
    const display = alias ?? title;
    const cls = exists(title) ? "wiki-link" : "wiki-link missing";
    const href = `/note/${encodeURIComponent(title)}`;
    return `<a class="${cls}" href="${href}">${display}</a>`;
  });
}

export function createIndex() {
  const notes = new Map(); // title -> { title, body }
  const outgoing = new Map(); // title -> Set<title>
  const incoming = new Map(); // title -> Set<title>

  function reindexLinks(title, body) {
    const old = outgoing.get(title) ?? new Set();
    for (const t of old) incoming.get(t)?.delete(title);
    const next = new Set(parseLinks(body).map((l) => l.title));
    outgoing.set(title, next);
    for (const t of next) {
      if (!incoming.has(t)) incoming.set(t, new Set());
      incoming.get(t).add(title);
    }
  }

  return {
    upsert(title, body) {
      notes.set(title, { title, body });
      reindexLinks(title, body);
    },
    get(title) {
      return notes.get(title);
    },
    backlinks(title) {
      return Array.from(incoming.get(title) ?? []);
    },
    has(title) {
      return notes.has(title);
    },
    search(query) {
      const q = query.toLowerCase().split(/\s+/).filter(Boolean);
      if (q.length === 0) return [];
      const scored = [];
      for (const n of notes.values()) {
        const titleLc = n.title.toLowerCase();
        const bodyLc = n.body.toLowerCase();
        let score = 0;
        for (const term of q) {
          if (titleLc.includes(term)) score += 3;
          const occ = (bodyLc.match(new RegExp(escape(term), "g")) ?? []).length;
          score += occ;
        }
        if (score > 0) scored.push({ title: n.title, score });
      }
      return scored.sort((a, b) => b.score - a.score);
    },
    all() {
      return Array.from(notes.values());
    },
  };
}

function escape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
