// Basic moderation pre-filter. Real moderation goes through Claude;
// this catches obvious cases before we spend tokens, and acts as a
// post-filter on the generated caption too.

const KOREAN_SLURS = ['김치녀', '한남충', '맘충', '틀딱'];
const REAL_PERSON_PATTERNS = [
  /윤석열/, /이재명/, /문재인/, /박근혜/, /이명박/,
  /(BTS|블랙핑크|뉴진스)\s*[가-힣A-Za-z]+/i,
];
const HARD_BLOCK = [
  /자살\s*방법/, /폭탄\s*제조/, /(?:^|\s)혐오(?:\s|$)/,
];

export function classifyCaption(text) {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return { allowed: false, reasons: ['empty'] };
  }
  const reasons = [];
  for (const word of KOREAN_SLURS) {
    if (text.includes(word)) reasons.push(`slur:${word}`);
  }
  for (const re of REAL_PERSON_PATTERNS) {
    if (re.test(text)) reasons.push(`real_person:${re.source}`);
  }
  for (const re of HARD_BLOCK) {
    if (re.test(text)) reasons.push(`block:${re.source}`);
  }
  return {
    allowed: reasons.length === 0,
    needsHumanReview: reasons.some((r) => r.startsWith('real_person:')),
    hardBlocked: reasons.some((r) => r.startsWith('block:') || r.startsWith('slur:')),
    reasons,
  };
}
