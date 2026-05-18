import { describe, it, expect } from 'vitest';
import { countStats, splitChapters } from '../src/wordcount.js';

describe('countStats', () => {
  it('counts Korean characters and English words separately', () => {
    const s = countStats('안녕하세요 hello world');
    expect(s.korean).toBe(5);
    expect(s.english).toBe(2);
  });

  it('strips code blocks before counting', () => {
    const s = countStats('내용시작 ```\nlots of code here\n``` 마지막');
    expect(s.korean).toBe(7); // 내용시작(4) + 마지막(3)
    expect(s.english).toBe(0);
  });

  it('returns at least 1 reading minute', () => {
    expect(countStats('짧음').readingMinutes).toBeGreaterThanOrEqual(1);
  });

  it('handles non-string input safely', () => {
    expect(countStats(null)).toEqual({ chars: 0, korean: 0, english: 0, readingMinutes: 0 });
  });
});

describe('splitChapters', () => {
  it('splits on top-level H1 headings', () => {
    const md = '# 1화\n내용 1\n\n# 2화\n내용 2';
    const ch = splitChapters(md);
    expect(ch).toHaveLength(2);
    expect(ch[0].title).toBe('1화');
    expect(ch[1].body).toContain('내용 2');
  });

  it('returns whole body when no headings', () => {
    const ch = splitChapters('그냥 본문');
    expect(ch).toHaveLength(1);
    expect(ch[0].title).toBe('본문');
  });

  it('returns [] for empty input', () => {
    expect(splitChapters('')).toEqual([]);
  });
});
