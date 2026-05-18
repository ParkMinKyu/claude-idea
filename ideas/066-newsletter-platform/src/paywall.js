// Paywall trimming: split markdown body so non-subscribers see only the
// configured ratio (e.g. 0.33). We split on paragraph boundaries to avoid
// breaking sentences. Returns { preview, hasMore }.

export function trimForPaywall(markdown, ratio = 0.33) {
  if (typeof markdown !== 'string') {
    throw new TypeError('markdown must be a string');
  }
  if (ratio <= 0 || ratio >= 1) {
    return { preview: ratio >= 1 ? markdown : '', hasMore: ratio < 1 };
  }
  const paragraphs = markdown.split(/\n{2,}/);
  if (paragraphs.length === 0) return { preview: '', hasMore: false };

  const total = markdown.length;
  const target = Math.max(1, Math.floor(total * ratio));
  let acc = 0;
  const taken = [];
  for (const p of paragraphs) {
    if (acc >= target) break;
    taken.push(p);
    acc += p.length + 2; // +2 for the \n\n we split on
  }
  const preview = taken.join('\n\n');
  return { preview, hasMore: preview.length < markdown.length };
}

// Render the public-facing body. If user is a paid member, return full markdown.
// Otherwise return preview + paywall CTA appended as markdown.
export function renderForReader(markdown, { isPaidMember, ratio = 0.33 } = {}) {
  if (isPaidMember) return markdown;
  const { preview, hasMore } = trimForPaywall(markdown, ratio);
  if (!hasMore) return preview;
  return `${preview}\n\n---\n\n**유료 구독자 전용 콘텐츠입니다.** [구독하기](/subscribe)`;
}
