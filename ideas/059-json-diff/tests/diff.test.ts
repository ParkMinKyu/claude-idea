import { describe, it, expect } from 'vitest';
import { diff, summarize, changedOnly } from '../src/lib/diff';

describe('diff', () => {
  it('detects added/removed/changed in objects', () => {
    const c = diff({ a: 1, b: 2 }, { a: 1, b: 3, c: 4 });
    const sum = summarize(c);
    expect(sum.added).toBe(1);
    expect(sum.changed).toBe(1);
    expect(sum.same).toBe(1);
  });

  it('ignores key insertion order', () => {
    const c = changedOnly(diff({ a: 1, b: 2 }, { b: 2, a: 1 }));
    expect(c).toHaveLength(0);
  });

  it('walks arrays positionally', () => {
    const c = changedOnly(diff([1, 2, 3], [1, 9, 3, 4]));
    expect(c.find((x) => x.path === '1')?.kind).toBe('changed');
    expect(c.find((x) => x.path === '3')?.kind).toBe('added');
  });

  it('emits dot paths for nested objects', () => {
    const c = changedOnly(diff({ a: { b: 1 } }, { a: { b: 2 } }));
    expect(c[0].path).toBe('a.b');
  });

  it('treats identical primitives as same', () => {
    const c = diff(42, 42);
    expect(c[0].kind).toBe('same');
  });
});
