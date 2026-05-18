// Lightweight mood classifier + template matcher.
// Real prod uses Claude; this gives us a fast offline path and a unit-testable
// baseline of "what mood does this quote read as?"

const MOOD_LEXICON = {
  calm: ['고요', '잔잔', '평온', '쉼', '여백', '편안', '바다', '숲'],
  inspire: ['도전', '시작', '꿈', '용기', '성공', '극복', '한계'],
  humor: ['ㅋㅋ', '웃기', '농담', '재미', '풉', '히히'],
  sad: ['눈물', '슬픔', '이별', '그리움', '아픔', '잃다'],
  love: ['사랑', '고백', '연인', '설렘', '그대', '너'],
};

export function classifyMood(text) {
  if (typeof text !== 'string' || text.length === 0) return 'calm';
  const lower = text.toLowerCase();
  const scores = {};
  for (const [mood, words] of Object.entries(MOOD_LEXICON)) {
    scores[mood] = 0;
    for (const w of words) {
      if (lower.includes(w)) scores[mood] += 1;
    }
  }
  const entries = Object.entries(scores).filter(([, s]) => s > 0);
  if (entries.length === 0) return 'calm';
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

// Template = { id, mood, palette, font }. Pick top match by mood, then by
// palette diversity for variety.
export function recommendTemplates(templates, { text, count = 5 } = {}) {
  if (!Array.isArray(templates)) throw new TypeError('templates must be array');
  const mood = classifyMood(text);
  const sameMood = templates.filter((t) => t.mood === mood);
  const others = templates.filter((t) => t.mood !== mood);
  return [...sameMood, ...others].slice(0, count);
}
