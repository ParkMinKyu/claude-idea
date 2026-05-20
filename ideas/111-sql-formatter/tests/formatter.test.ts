import { describe, it, expect } from 'vitest';
import { tokenize, format, lint } from '../src/lib/formatter';

describe('tokenize', () => {
  it('classifies keywords, identifiers, numbers and strings', () => {
    const toks = tokenize("SELECT id FROM users WHERE age > 18 AND name = 'kim'")
      .filter((t) => t.type !== 'whitespace');
    expect(toks.find((t) => t.value === 'SELECT')?.type).toBe('keyword');
    expect(toks.find((t) => t.value === 'users')?.type).toBe('identifier');
    expect(toks.find((t) => t.value === '18')?.type).toBe('number');
    expect(toks.find((t) => t.value === "'kim'")?.type).toBe('string');
    expect(toks.find((t) => t.value === '>')?.type).toBe('operator');
  });

  it('normalizes keyword case to uppercase', () => {
    const toks = tokenize('select id from t').filter((t) => t.type === 'keyword');
    expect(toks.map((t) => t.value)).toEqual(['SELECT', 'FROM']);
  });
});

describe('format', () => {
  it('puts each clause on its own line', () => {
    const out = format('select id, name from users where age > 18 order by id');
    const lines = out.split('\n');
    expect(lines[0].startsWith('SELECT')).toBe(true);
    expect(lines.some((l) => l.startsWith('FROM'))).toBe(true);
    expect(lines.some((l) => l.startsWith('WHERE'))).toBe(true);
    expect(lines.some((l) => l.startsWith('ORDER BY'))).toBe(true);
  });

  it('breaks comma-separated select columns onto indented lines', () => {
    const out = format('select a, b, c from t');
    expect(out).toContain('SELECT a,');
    expect(out).toMatch(/\n {2}b,/);
  });

  it('is idempotent for an already-formatted query', () => {
    const once = format('SELECT id FROM users');
    const twice = format(once);
    expect(twice).toBe(once);
  });
});

describe('lint', () => {
  it('flags SELECT * and DELETE without WHERE', () => {
    const issues = lint('DELETE FROM users');
    expect(issues.map((i) => i.rule)).toContain('delete-without-where');
    const star = lint('SELECT * FROM users');
    expect(star.map((i) => i.rule)).toContain('no-select-star');
  });

  it('flags lowercase keywords', () => {
    const issues = lint('select id from t where x = 1');
    expect(issues.map((i) => i.rule)).toContain('keyword-case');
  });

  it('returns no issues for a clean explicit query', () => {
    const issues = lint("SELECT id FROM users WHERE id = 1");
    expect(issues).toHaveLength(0);
  });
});
