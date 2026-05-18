// Content-based recommender using tag overlap as a stand-in for embeddings.
// In production we replace `tagVector` with pre-computed dense vectors.

function tagVector(tags) {
  return new Set((tags || []).map((t) => String(t).toLowerCase().trim()));
}

export function jaccard(a, b) {
  const A = tagVector(a);
  const B = tagVector(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

// Build a user "taste vector" from rated works: tag weight = sum(rating - 3).
export function tasteVector(ratings, worksById) {
  const weights = new Map();
  for (const r of ratings) {
    const work = worksById.get(r.workId);
    if (!work) continue;
    const w = Number(r.score) - 3; // 1-5 -> -2..+2
    for (const t of work.tags || []) {
      const key = String(t).toLowerCase().trim();
      weights.set(key, (weights.get(key) || 0) + w);
    }
  }
  return weights;
}

// Score a candidate work against a taste vector. Tags the user likes (>0)
// boost score; disliked tags (<0) reduce it.
export function scoreWork(work, taste) {
  let s = 0;
  for (const t of work.tags || []) {
    s += taste.get(String(t).toLowerCase().trim()) || 0;
  }
  // Normalize by tag count so longer-tagged works don't dominate.
  return (work.tags?.length ? s / Math.sqrt(work.tags.length) : 0);
}

export function recommend({ ratings, works, limit = 10 }) {
  const worksById = new Map(works.map((w) => [w.id, w]));
  const taste = tasteVector(ratings, worksById);
  const rated = new Set(ratings.map((r) => r.workId));
  const scored = works
    .filter((w) => !rated.has(w.id))
    .map((w) => ({ work: w, score: scoreWork(w, taste) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored;
}
