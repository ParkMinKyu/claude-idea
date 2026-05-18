import { describe, it, expect } from 'vitest';
import { testPattern, toPython } from '../src/lib/regex';

describe('testPattern', () => {
  it('finds simple matches', () => {
    const r = testPattern('\\d+', 'g', 'a1 b22 c333');
    expect(r.valid).toBe(true);
    expect(r.matches.map((m) => m.value)).toEqual(['1', '22', '333']);
  });

  it('returns invalid for bad pattern', () => {
    const r = testPattern('(unclosed', 'g', 'x');
    expect(r.valid).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it('captures groups', () => {
    const r = testPattern('(\\w+)@(\\w+)', 'g', 'a@b');
    expect(r.matches[0].groups).toEqual(['a', 'b']);
  });

  it('handles zero-width without infinite loop', () => {
    const r = testPattern('(?=x)', 'g', 'xxx');
    expect(r.valid).toBe(true);
    expect(r.matches.length).toBeLessThan(10);
  });
});

describe('toPython', () => {
  it('emits flag args', () => {
    expect(toPython('foo', 'im')).toContain('re.IGNORECASE');
    expect(toPython('foo', 'im')).toContain('re.MULTILINE');
  });

  it('emits raw string literal', () => {
    expect(toPython('\\d+', 'g')).toContain('r"\\d+"');
  });
});
