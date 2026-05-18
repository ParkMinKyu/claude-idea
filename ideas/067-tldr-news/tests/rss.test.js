import { describe, it, expect } from 'vitest';
import { parseFeed, normalizeUrl } from '../src/rss.js';

describe('parseFeed', () => {
  it('parses RSS items with CDATA titles', () => {
    const xml = `<rss><channel>
      <item><title><![CDATA[헬로 월드 & 친구]]></title><link>https://x.com/a</link></item>
      <item><title>plain</title><link>https://x.com/b</link></item>
    </channel></rss>`;
    const items = parseFeed(xml);
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe('헬로 월드 & 친구');
    expect(items[1].url).toBe('https://x.com/b');
  });

  it('parses Atom entries with href link', () => {
    const xml = `<feed>
      <entry><title>foo</title><link href="https://x.com/c"/><updated>2026-05-18T10:00:00Z</updated></entry>
    </feed>`;
    const items = parseFeed(xml);
    expect(items[0].url).toBe('https://x.com/c');
    expect(items[0].publishedAt).toMatch(/2026-05-18/);
  });

  it('returns empty array for empty input', () => {
    expect(parseFeed('')).toEqual([]);
    expect(parseFeed(null)).toEqual([]);
  });
});

describe('normalizeUrl', () => {
  it('strips utm + fbclid + trailing slash', () => {
    const u = 'https://x.com/a/?utm_source=rss&utm_medium=feed&fbclid=abc';
    expect(normalizeUrl(u)).toBe('https://x.com/a');
  });

  it('keeps non-tracking params', () => {
    expect(normalizeUrl('https://x.com/a?id=42')).toBe('https://x.com/a?id=42');
  });

  it('passes through invalid URLs unchanged', () => {
    expect(normalizeUrl('not a url')).toBe('not a url');
  });
});
