// Korean+English word/char counters for fanfic editor stats.
// Korean: count by CJK characters (no spaces). English: count by whitespace tokens.

const CJK_RE = /[\p{Script=Hangul}\p{Script=Han}]/gu;
const EN_WORD_RE = /[A-Za-z][A-Za-z'-]*/g;

export function countStats(markdown) {
  if (typeof markdown !== 'string') return { chars: 0, korean: 0, english: 0, readingMinutes: 0 };
  // Strip code blocks + image refs so they don't count
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  const korean = (stripped.match(CJK_RE) || []).length;
  const english = (stripped.match(EN_WORD_RE) || []).length;
  const chars = stripped.length;
  // Korean reading speed ~ 400 chars/min, English ~ 250 wpm.
  const minutes = korean / 400 + english / 250;
  return {
    chars,
    korean,
    english,
    readingMinutes: Math.max(1, Math.ceil(minutes)),
  };
}

export function splitChapters(markdown, marker = /^#\s+/m) {
  if (typeof markdown !== 'string' || markdown.length === 0) return [];
  if (!marker.test(markdown)) {
    return [{ title: '본문', body: markdown.trim() }];
  }
  const parts = markdown.split(marker).filter((p) => p.trim().length > 0);
  return parts.map((body, i) => {
    const firstLine = body.split('\n', 1)[0].trim();
    const rest = body.slice(firstLine.length).trim();
    return { title: firstLine || `Chapter ${i + 1}`, body: rest };
  });
}
