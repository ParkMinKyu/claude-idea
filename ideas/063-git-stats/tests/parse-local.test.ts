import { describe, it, expect } from 'vitest';
import { parseGitLog } from '../src/lib/parse-local';

// Fixture: real `git log --numstat --pretty=format:COMMIT%x1f...` output shape.
const fixture = [
  'COMMIT\x1fabc123\x1fAlice\x1falice@ex.com\x1f2026-05-01T10:00:00+00:00',
  '10\t1\tsrc/a.ts',
  '5\t0\tsrc/b.ts',
  '',
  'COMMIT\x1fdef456\x1fBob\x1fbob@ex.com\x1f2026-05-02T15:30:00+00:00',
  '3\t2\tsrc/a.ts',
  '-\t-\timages/logo.png',
  '',
  'COMMIT\x1fghi789\x1fAlice\x1falice@ex.com\x1f2026-05-03T08:00:00+00:00',
  '8\t0\tREADME.md',
].join('\n');

describe('parseGitLog', () => {
  it('parses three commits', () => {
    const commits = parseGitLog(fixture);
    expect(commits).toHaveLength(3);
  });

  it('extracts author, email, and ISO date', () => {
    const [first] = parseGitLog(fixture);
    expect(first.hash).toBe('abc123');
    expect(first.author).toBe('Alice');
    expect(first.email).toBe('alice@ex.com');
    expect(first.date).toBe('2026-05-01T10:00:00+00:00');
  });

  it('aggregates file paths and line counts per commit', () => {
    const commits = parseGitLog(fixture);
    expect(commits[0].filesChanged).toEqual(['src/a.ts', 'src/b.ts']);
    expect(commits[0].additions).toBe(15);
    expect(commits[0].deletions).toBe(1);
  });

  it('treats binary files (- - path) as 0 lines but counts the file', () => {
    const commits = parseGitLog(fixture);
    expect(commits[1].filesChanged).toContain('images/logo.png');
    expect(commits[1].additions).toBe(3); // src/a.ts only
    expect(commits[1].deletions).toBe(2);
  });

  it('handles empty input', () => {
    expect(parseGitLog('')).toEqual([]);
  });

  it('handles file paths with tabs (preserves them)', () => {
    const tricky = 'COMMIT\x1fxxx\x1fX\x1fx@x\x1f2026-01-01T00:00:00Z\n1\t0\tfile\twith\ttab.ts';
    const [c] = parseGitLog(tricky);
    expect(c.filesChanged).toEqual(['file\twith\ttab.ts']);
  });
});
