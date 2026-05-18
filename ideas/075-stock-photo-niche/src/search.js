// Search ranking: hybrid score from text match (tag/title token overlap)
// and visual similarity (cosine over pre-computed embeddings).
//
// We avoid heavy NLP libs; for the MVP, tokenization is whitespace +
// CJK char fallback so single-token Korean queries still score.

export function tokenize(s) {
  if (typeof s !== 'string') return [];
  const tokens = [];
  // Whitespace tokens (latin words, mixed strings)
  for (const t of s.split(/\s+/).filter(Boolean)) {
    tokens.push(t.toLowerCase());
  }
  // Per-CJK-character tokens for Korean
  for (const ch of s) {
    if (/[\p{Script=Hangul}]/u.test(ch)) tokens.push(ch);
  }
  return tokens;
}

export function textScore(query, photo) {
  const q = new Set(tokenize(query));
  if (q.size === 0) return 0;
  const docTokens = new Set([
    ...tokenize(photo.title || ''),
    ...tokenize((photo.tags || []).join(' ')),
  ]);
  let inter = 0;
  for (const t of q) if (docTokens.has(t)) inter++;
  return inter / q.size;
}

export function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function rank({ query, queryEmbedding = null, photos, textWeight = 0.6 }) {
  const visualWeight = 1 - textWeight;
  const scored = photos.map((p) => {
    const ts = textScore(query, p);
    const vs = queryEmbedding && p.embedding ? cosine(queryEmbedding, p.embedding) : 0;
    const score = ts * textWeight + vs * visualWeight;
    return { photo: p, score, textScore: ts, visualScore: vs };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored;
}
