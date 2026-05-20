import { describe, it, expect } from 'vitest';
import { parseLine, parseLog } from '../src/lib/parser';

describe('parseLine', () => {
  it('parses a JSON log line', () => {
    const e = parseLine('{"ts":"2024-01-02T10:00:00Z","level":"ERROR","msg":"boom","user":"alice"}');
    expect(e.ts).toBe('2024-01-02T10:00:00Z');
    expect(e.level).toBe('error');
    expect(e.message).toBe('boom');
    expect(e.fields.user).toBe('alice');
  });

  it('parses a text log line with key=value fields', () => {
    const e = parseLine('2024-01-02T10:00:00Z WARN disk almost full path=/data pct=92');
    expect(e.level).toBe('warn');
    expect(e.message).toContain('disk almost full');
    expect(e.fields.path).toBe('/data');
    expect(e.fields.pct).toBe(92);
  });

  it('normalizes warning to warn', () => {
    const e = parseLine('{"level":"warning","msg":"x"}');
    expect(e.level).toBe('warn');
  });

  it('falls back to raw message for unstructured lines', () => {
    const e = parseLine('just some plain text');
    expect(e.message).toBe('just some plain text');
    expect(e.level).toBeUndefined();
  });

  it('parseLog skips blank lines', () => {
    const entries = parseLog('a\n\n  \nb');
    expect(entries).toHaveLength(2);
  });
});
