import { describe, it, expect } from 'vitest';
import { parseDockerfile } from '../src/lib/parser';
import { lint, hasErrors } from '../src/lib/rules';

function lintDf(df: string) {
  return lint(parseDockerfile(df));
}

describe('lint rules', () => {
  it('flags latest / untagged FROM', () => {
    const v = lintDf('FROM node\nUSER app');
    expect(v.map((x) => x.rule)).toContain('no-latest-tag');
    const v2 = lintDf('FROM node:latest\nUSER app');
    expect(v2.map((x) => x.rule)).toContain('no-latest-tag');
  });

  it('accepts a pinned tag and digest', () => {
    const v = lintDf('FROM node:20.11.0\nUSER app');
    expect(v.map((x) => x.rule)).not.toContain('no-latest-tag');
    const v2 = lintDf('FROM node@sha256:abc\nUSER app');
    expect(v2.map((x) => x.rule)).not.toContain('no-latest-tag');
  });

  it('requires a non-root USER', () => {
    const v = lintDf('FROM node:20\nCMD ["node"]');
    expect(v.map((x) => x.rule)).toContain('require-non-root-user');
    const ok = lintDf('FROM node:20\nUSER app\nCMD ["node"]');
    expect(ok.map((x) => x.rule)).not.toContain('require-non-root-user');
  });

  it('warns on apt-get install without cleanup', () => {
    const dirty = lintDf('FROM ubuntu:22.04\nUSER app\nRUN apt-get install -y curl');
    expect(dirty.map((x) => x.rule)).toContain('apt-cleanup');
    const clean = lintDf(
      'FROM ubuntu:22.04\nUSER app\nRUN apt-get install -y curl && rm -rf /var/lib/apt/lists/*',
    );
    expect(clean.map((x) => x.rule)).not.toContain('apt-cleanup');
  });

  it('prefers COPY over ADD for local files but allows remote ADD', () => {
    const local = lintDf('FROM node:20\nUSER app\nADD ./app /app');
    expect(local.map((x) => x.rule)).toContain('prefer-copy');
    const remote = lintDf('FROM node:20\nUSER app\nADD https://x.com/f.tar /tmp/');
    expect(remote.map((x) => x.rule)).not.toContain('prefer-copy');
  });

  it('errors when first instruction is not FROM (ARG allowed before)', () => {
    const bad = lintDf('RUN echo hi\nFROM node:20');
    expect(bad.find((x) => x.rule === 'first-instruction-from')?.severity).toBe('error');
    const okWithArg = lintDf('ARG VERSION=20\nFROM node:20\nUSER app');
    expect(okWithArg.map((x) => x.rule)).not.toContain('first-instruction-from');
  });

  it('sorts violations by line and reports errors for CI', () => {
    const v = lintDf('RUN echo hi\nFROM node\nADD ./x /x');
    for (let i = 1; i < v.length; i += 1) expect(v[i].line).toBeGreaterThanOrEqual(v[i - 1].line);
    expect(hasErrors(v, 'error')).toBe(true);
    const clean = lintDf('FROM node:20\nUSER app');
    expect(hasErrors(clean, 'warning')).toBe(false);
  });
});
