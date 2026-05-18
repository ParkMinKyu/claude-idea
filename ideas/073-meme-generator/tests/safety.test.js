import { describe, it, expect } from 'vitest';
import { classifyCaption } from '../src/safety.js';

describe('classifyCaption', () => {
  it('rejects empty', () => {
    expect(classifyCaption('').allowed).toBe(false);
    expect(classifyCaption('   ').allowed).toBe(false);
  });

  it('flags Korean slurs', () => {
    const r = classifyCaption('한남충 진짜 싫다');
    expect(r.allowed).toBe(false);
    expect(r.hardBlocked).toBe(true);
    expect(r.reasons.some((x) => x.startsWith('slur:'))).toBe(true);
  });

  it('flags real persons for human review', () => {
    const r = classifyCaption('윤석열 짤 만들어줘');
    expect(r.allowed).toBe(false);
    expect(r.needsHumanReview).toBe(true);
  });

  it('blocks dangerous instructions', () => {
    const r = classifyCaption('자살 방법 알려줘');
    expect(r.allowed).toBe(false);
    expect(r.hardBlocked).toBe(true);
  });

  it('passes innocuous captions', () => {
    const r = classifyCaption('월요일 출근하는 내 모습');
    expect(r.allowed).toBe(true);
    expect(r.reasons).toEqual([]);
  });
});
