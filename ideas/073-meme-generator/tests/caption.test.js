import { describe, it, expect } from 'vitest';
import { wrapCaption, autoFontSize } from '../src/caption.js';

const measureFn = (s) => ({ width: s.length * 10 }); // 10px per char
const measureAt = (size) => (s) => ({ width: s.length * size * 0.5 });

describe('wrapCaption', () => {
  it('returns single line when text fits', () => {
    expect(wrapCaption({ text: 'hello', maxWidth: 100, measureFn })).toEqual(['hello']);
  });

  it('wraps on whitespace when needed', () => {
    const lines = wrapCaption({ text: 'one two three four five', maxWidth: 100, measureFn });
    expect(lines.length).toBeGreaterThan(1);
    for (const l of lines) expect(l.length * 10).toBeLessThanOrEqual(100);
  });

  it('per-character wraps when a token exceeds maxWidth', () => {
    const lines = wrapCaption({ text: '아주긴한단어인데띄어쓰기가없음', maxWidth: 50, measureFn });
    expect(lines.length).toBeGreaterThan(1);
    for (const l of lines) expect(l.length * 10).toBeLessThanOrEqual(50);
  });

  it('respects maxLines by ellipsizing the last line', () => {
    const lines = wrapCaption({
      text: 'a b c d e f g h i j k',
      maxWidth: 20,
      measureFn,
      maxLines: 2,
    });
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith('…')).toBe(true);
  });

  it('throws on invalid input', () => {
    expect(() => wrapCaption({ text: 'x', maxWidth: 0, measureFn })).toThrow();
    expect(() => wrapCaption({ text: 'x', maxWidth: 10, measureFn: null })).toThrow();
  });
});

describe('autoFontSize', () => {
  it('chooses smaller font for longer text', () => {
    const long = 'a'.repeat(200);
    const short = 'a'.repeat(10);
    const sLong = autoFontSize({ text: long, width: 200, maxLines: 2, measureAt });
    const sShort = autoFontSize({ text: short, width: 200, maxLines: 2, measureAt });
    expect(sShort).toBeGreaterThanOrEqual(sLong);
  });
});
