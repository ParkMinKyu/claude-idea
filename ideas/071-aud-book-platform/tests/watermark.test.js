import { describe, it, expect } from 'vitest';
import { watermarkSeed, watermarkPositions, formatChapterTime } from '../src/watermark.js';

describe('watermarkSeed', () => {
  it('is deterministic for same user+book', () => {
    expect(watermarkSeed('u1', 'b1')).toBe(watermarkSeed('u1', 'b1'));
  });
  it('differs across users', () => {
    expect(watermarkSeed('u1', 'b1')).not.toBe(watermarkSeed('u2', 'b1'));
  });
  it('throws when missing inputs', () => {
    expect(() => watermarkSeed('', 'b')).toThrow();
  });
});

describe('watermarkPositions', () => {
  it('returns positions within [5, duration-5]', () => {
    const ps = watermarkPositions({ seed: 1234, durationSeconds: 600, count: 8 });
    for (const p of ps) {
      expect(p).toBeGreaterThanOrEqual(5);
      expect(p).toBeLessThanOrEqual(595);
    }
    expect(ps).toHaveLength(8);
  });
  it('returns ascending unique values', () => {
    const ps = watermarkPositions({ seed: 99, durationSeconds: 300, count: 5 });
    for (let i = 1; i < ps.length; i++) expect(ps[i]).toBeGreaterThan(ps[i - 1]);
  });
  it('returns [] for too-short audio', () => {
    expect(watermarkPositions({ seed: 1, durationSeconds: 20 })).toEqual([]);
  });
});

describe('formatChapterTime', () => {
  it('formats seconds + ms', () => {
    expect(formatChapterTime(3725.42)).toBe('01:02:05.420');
  });
  it('handles zero', () => {
    expect(formatChapterTime(0)).toBe('00:00:00.000');
  });
});
