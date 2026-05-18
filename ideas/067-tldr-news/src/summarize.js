// Prompt builder + dedupe utility for the LLM summarization step.
// We separate prompt construction from the network call so tests can pin
// the exact text we'd send to Claude.

import { normalizeUrl } from './rss.js';

export function buildSummaryPrompt({ title, snippet, url, category }) {
  if (!title) throw new Error('title required');
  return [
    `당신은 한국어 뉴스 큐레이터입니다. 카테고리: ${category}.`,
    `원문 제목: ${title}`,
    `원문 URL: ${url}`,
    `발췌: ${snippet || '(본문 미수신)'}`,
    '',
    '아래 형식으로 응답하세요 (JSON):',
    '{ "headline": "한국어 8~14자 헤드라인",',
    '  "bullets": ["3줄 요약 1", "3줄 요약 2", "3줄 요약 3"],',
    '  "insight": "왜 중요한지 한 줄 시사점 (40자 이내)" }',
  ].join('\n');
}

// Lightweight similarity: token-set Jaccard over normalized Korean+English
// tokens. Robust enough for "이 기사 같은 사건" 묶기 when embeddings are
// unavailable (no network in tests).
export function similarity(a, b) {
  const toks = (s) =>
    new Set(
      (s || '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 1)
    );
  const A = toks(a);
  const B = toks(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

// Group articles by URL (after normalization) and by title similarity.
// Returns one representative per group (earliest publishedAt wins).
export function dedupe(articles, { threshold = 0.6 } = {}) {
  const seenUrls = new Map();
  for (const a of articles) {
    const key = normalizeUrl(a.url);
    const prev = seenUrls.get(key);
    if (!prev || (a.publishedAt && a.publishedAt < prev.publishedAt)) {
      seenUrls.set(key, { ...a, url: key });
    }
  }
  const unique = [...seenUrls.values()];

  const kept = [];
  for (const a of unique) {
    const dupe = kept.find((k) => similarity(k.title, a.title) >= threshold);
    if (!dupe) kept.push(a);
  }
  return kept;
}
