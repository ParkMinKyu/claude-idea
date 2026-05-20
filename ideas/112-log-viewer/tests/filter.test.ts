import { describe, it, expect } from 'vitest';
import { parseLog } from '../src/lib/parser';
import { parseQuery, filterLogs, matches } from '../src/lib/filter';

const sample = parseLog(
  [
    '{"ts":"t1","level":"info","msg":"started","user":"alice"}',
    '{"ts":"t2","level":"warn","msg":"slow query","user":"bob"}',
    '{"ts":"t3","level":"error","msg":"connection refused","user":"alice"}',
    '{"ts":"t4","level":"debug","msg":"healthcheck ok"}',
  ].join('\n'),
);

describe('parseQuery', () => {
  it('parses level comparison, field eq and negation', () => {
    const terms = parseQuery('level>=warn user=alice -healthcheck');
    expect(terms).toHaveLength(3);
    expect(terms[0]).toMatchObject({ kind: 'level-cmp', op: '>=', value: 'warn' });
    expect(terms[1]).toMatchObject({ kind: 'field-eq', key: 'user', value: 'alice' });
    expect(terms[2]).toMatchObject({ kind: 'text', value: 'healthcheck', negate: true });
  });
});

describe('filterLogs', () => {
  it('filters by level threshold', () => {
    const out = filterLogs(sample, 'level>=warn');
    expect(out.map((e) => e.level)).toEqual(['warn', 'error']);
  });

  it('combines level threshold with field equality (implicit AND)', () => {
    const out = filterLogs(sample, 'level>=warn user=alice');
    expect(out).toHaveLength(1);
    expect(out[0].message).toBe('connection refused');
  });

  it('supports negation', () => {
    const out = filterLogs(sample, '-healthcheck');
    expect(out.every((e) => !e.message.includes('healthcheck'))).toBe(true);
    expect(out).toHaveLength(3);
  });

  it('does text substring match on message', () => {
    const out = filterLogs(sample, 'query');
    expect(out).toHaveLength(1);
    expect(out[0].message).toBe('slow query');
  });

  it('returns all entries for an empty query', () => {
    expect(filterLogs(sample, '   ')).toHaveLength(4);
  });

  it('matches() works on a single entry', () => {
    expect(matches(sample[2], 'level:error')).toBe(true);
    expect(matches(sample[0], 'level:error')).toBe(false);
  });
});
