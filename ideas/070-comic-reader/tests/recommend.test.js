import { describe, it, expect } from 'vitest';
import { jaccard, recommend, scoreWork, tasteVector } from '../src/recommend.js';

describe('jaccard', () => {
  it('returns 1 for identical sets', () => {
    expect(jaccard(['a', 'b'], ['a', 'b'])).toBe(1);
  });
  it('returns 0 for disjoint sets', () => {
    expect(jaccard(['a'], ['b'])).toBe(0);
  });
  it('returns 0 when either side empty', () => {
    expect(jaccard([], ['a'])).toBe(0);
  });
});

describe('tasteVector + scoreWork', () => {
  const works = [
    { id: 'w1', tags: ['판타지', '회귀'] },
    { id: 'w2', tags: ['일상'] },
  ];
  const byId = new Map(works.map((w) => [w.id, w]));

  it('weights tags by rating delta from 3', () => {
    const t = tasteVector([{ workId: 'w1', score: 5 }, { workId: 'w2', score: 1 }], byId);
    expect(t.get('판타지')).toBe(2);
    expect(t.get('일상')).toBe(-2);
  });

  it('scores unseen works using taste vector', () => {
    const t = tasteVector([{ workId: 'w1', score: 5 }], byId);
    const s = scoreWork({ tags: ['판타지', '회귀', '학원'] }, t);
    expect(s).toBeGreaterThan(0);
  });
});

describe('recommend', () => {
  const works = [
    { id: 'w1', title: 'A', tags: ['판타지', '회귀'] },
    { id: 'w2', title: 'B', tags: ['일상'] },
    { id: 'w3', title: 'C', tags: ['판타지', '회귀', '학원'] },
    { id: 'w4', title: 'D', tags: ['로맨스'] },
  ];

  it('omits already-rated works from recommendations', () => {
    const recs = recommend({
      ratings: [{ workId: 'w1', score: 5 }],
      works,
      limit: 10,
    });
    expect(recs.find((r) => r.work.id === 'w1')).toBeUndefined();
  });

  it('ranks fantasy work above romance for a fantasy lover', () => {
    const recs = recommend({
      ratings: [{ workId: 'w1', score: 5 }],
      works,
      limit: 3,
    });
    expect(recs[0].work.id).toBe('w3');
  });
});
