import { describe, it, expect } from 'vitest';
import { buildSummaryPrompt, similarity, dedupe } from '../src/summarize.js';

describe('buildSummaryPrompt', () => {
  it('includes title, url, category in the prompt', () => {
    const p = buildSummaryPrompt({
      title: 'AI 스타트업, 시리즈 B 마감',
      snippet: '회사 X가 ...',
      url: 'https://x.com/a',
      category: '스타트업',
    });
    expect(p).toContain('AI 스타트업');
    expect(p).toContain('https://x.com/a');
    expect(p).toContain('스타트업');
    expect(p).toContain('JSON');
  });

  it('throws when title missing', () => {
    expect(() => buildSummaryPrompt({ url: 'x', category: 'y' })).toThrow();
  });
});

describe('similarity + dedupe', () => {
  it('rates identical titles as 1 and unrelated as 0', () => {
    expect(similarity('hello world', 'hello world')).toBe(1);
    expect(similarity('foo', 'bar')).toBe(0);
  });

  it('rates near-duplicate titles above 0.5', () => {
    const s = similarity(
      '스타트업 A 시리즈 B 200억 투자 마감',
      '스타트업 A 시리즈 B 200억 투자'
    );
    expect(s).toBeGreaterThanOrEqual(0.5);
  });

  it('dedupes by normalized URL', () => {
    const arts = [
      { title: 'a', url: 'https://x.com/p?utm_source=rss', publishedAt: '2026-05-18T01:00:00Z' },
      { title: 'a', url: 'https://x.com/p', publishedAt: '2026-05-18T02:00:00Z' },
    ];
    expect(dedupe(arts)).toHaveLength(1);
  });

  it('dedupes by title similarity above threshold', () => {
    const arts = [
      { title: '스타트업 A 시리즈 B 200억 투자 마감', url: 'https://a.com/1', publishedAt: '' },
      { title: '스타트업 A 시리즈 B 200억 투자', url: 'https://b.com/2', publishedAt: '' },
    ];
    expect(dedupe(arts, { threshold: 0.5 })).toHaveLength(1);
  });
});
