import { describe, it, expect } from 'vitest';
import { tokenize, textScore, cosine, rank } from '../src/search.js';

describe('tokenize', () => {
  it('splits on whitespace and emits CJK per character', () => {
    const ts = tokenize('hello 한복 World');
    expect(ts).toContain('hello');
    expect(ts).toContain('world');
    expect(ts).toContain('한');
    expect(ts).toContain('복');
  });
  it('returns [] for non-string', () => {
    expect(tokenize(null)).toEqual([]);
  });
});

describe('textScore', () => {
  it('rates 1.0 for full overlap', () => {
    const photo = { title: '한복', tags: ['한복'] };
    expect(textScore('한복', photo)).toBe(1);
  });
  it('rates 0 for no overlap', () => {
    expect(textScore('cat', { title: '한복', tags: [] })).toBe(0);
  });
});

describe('cosine', () => {
  it('returns 1 for identical unit vectors', () => {
    expect(cosine([1, 0], [1, 0])).toBe(1);
  });
  it('returns 0 for orthogonal', () => {
    expect(cosine([1, 0], [0, 1])).toBe(0);
  });
  it('handles size mismatch / zero vectors gracefully', () => {
    expect(cosine([1, 0], [1, 0, 0])).toBe(0);
    expect(cosine([0, 0], [1, 1])).toBe(0);
  });
});

describe('rank', () => {
  const photos = [
    { id: 'a', title: '한복 입은 사람', tags: ['한복', '여성'], embedding: [1, 0, 0] },
    { id: 'b', title: '시장 풍경', tags: ['시장'], embedding: [0, 1, 0] },
  ];

  it('ranks photos with stronger text match higher', () => {
    const r = rank({ query: '한복', photos });
    expect(r[0].photo.id).toBe('a');
  });

  it('uses visual score when query embedding is provided', () => {
    const r = rank({ query: 'nothing in common', queryEmbedding: [0, 1, 0], photos });
    expect(r[0].photo.id).toBe('b');
  });
});
