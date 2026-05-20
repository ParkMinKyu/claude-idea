import { describe, it, expect } from 'vitest';
import { parse, compare, coerce, satisfies } from '../src/lib/semver';

describe('parse / coerce', () => {
  it('parses plain versions', () => {
    expect(parse('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
    expect(parse('v2.0.0')).toEqual({ major: 2, minor: 0, patch: 0 });
  });
  it('coerces ranges to a base version', () => {
    expect(coerce('^4.17.20')).toEqual({ major: 4, minor: 17, patch: 20 });
    expect(coerce('~1.2.0')).toEqual({ major: 1, minor: 2, patch: 0 });
  });
  it('returns null for garbage', () => {
    expect(parse('not-a-version')).toBeNull();
  });
});

describe('compare', () => {
  it('orders versions correctly', () => {
    expect(compare(parse('1.0.0')!, parse('2.0.0')!)).toBeLessThan(0);
    expect(compare(parse('1.2.0')!, parse('1.1.9')!)).toBeGreaterThan(0);
    expect(compare(parse('1.0.0')!, parse('1.0.0')!)).toBe(0);
  });
});

describe('satisfies', () => {
  it('handles single comparators', () => {
    expect(satisfies('4.17.20', '<4.17.21')).toBe(true);
    expect(satisfies('4.17.21', '<4.17.21')).toBe(false);
  });
  it('handles AND of comparators (a range)', () => {
    expect(satisfies('3.0.5', '>=3.0.0 <3.1.0')).toBe(true);
    expect(satisfies('3.1.0', '>=3.0.0 <3.1.0')).toBe(false);
    expect(satisfies('2.9.9', '>=3.0.0 <3.1.0')).toBe(false);
  });
});
