import { describe, it, expect } from 'vitest';
import { trimForPaywall, renderForReader } from '../src/paywall.js';

describe('trimForPaywall', () => {
  const body = ['p1 short.', 'p2 medium length text.', 'p3 longer body of text that exceeds.', 'p4 final.'].join('\n\n');

  it('returns less than full body when ratio < 1', () => {
    const { preview, hasMore } = trimForPaywall(body, 0.33);
    expect(preview.length).toBeLessThan(body.length);
    expect(hasMore).toBe(true);
  });

  it('respects paragraph boundaries (does not break sentences mid-word)', () => {
    const { preview } = trimForPaywall(body, 0.5);
    const ends = ['.', ''];
    expect(ends.includes(preview.trim().slice(-1))).toBe(true);
  });

  it('returns full body when ratio >= 1', () => {
    const { preview, hasMore } = trimForPaywall(body, 1);
    expect(preview).toBe(body);
    expect(hasMore).toBe(false);
  });

  it('throws on non-string input', () => {
    expect(() => trimForPaywall(null)).toThrow(TypeError);
  });
});

describe('renderForReader', () => {
  it('returns full markdown for paid members', () => {
    const md = 'a\n\nb';
    expect(renderForReader(md, { isPaidMember: true })).toBe(md);
  });

  it('appends paywall CTA for non-members when content is trimmed', () => {
    const md = 'para1\n\npara2\n\npara3\n\npara4';
    const out = renderForReader(md, { isPaidMember: false, ratio: 0.25 });
    expect(out).toContain('구독하기');
  });
});
