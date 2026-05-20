import { describe, it, expect } from 'vitest';
import { parseChange, generateChangelog } from '../src/lib/changelog';

describe('parseChange', () => {
  it('parses a conventional commit with scope', () => {
    const c = parseChange('feat(auth): add OAuth login');
    expect(c.category).toBe('feature');
    expect(c.scope).toBe('auth');
    expect(c.description).toBe('add OAuth login');
    expect(c.breaking).toBe(false);
  });

  it('extracts PR number suffix', () => {
    const c = parseChange('fix: handle null user (#123)');
    expect(c.category).toBe('fix');
    expect(c.prNumber).toBe(123);
    expect(c.description).toBe('handle null user');
  });

  it('detects breaking change via bang', () => {
    const c = parseChange('feat(api)!: drop v1 endpoints');
    expect(c.breaking).toBe(true);
    expect(c.category).toBe('feature');
  });

  it('detects breaking change in body text', () => {
    const c = parseChange('refactor: rework config\n\nBREAKING CHANGE: env vars renamed');
    expect(c.breaking).toBe(true);
  });

  it('maps aliases (perf, ci, bugfix)', () => {
    expect(parseChange('perf: faster query').category).toBe('performance');
    expect(parseChange('ci: add workflow').category).toBe('build');
    expect(parseChange('bugfix: typo').category).toBe('fix');
  });

  it('falls back to other for non-conventional titles', () => {
    const c = parseChange('Update README');
    expect(c.category).toBe('other');
    expect(c.description).toBe('Update README');
  });
});

describe('generateChangelog', () => {
  const titles = [
    'feat(ui): add dark mode (#10)',
    'fix: crash on empty input (#11)',
    'feat!: new pricing model',
    'docs: update install guide',
    'chore: bump deps',
    'random commit message',
  ];

  it('groups changes into sections in order', () => {
    const out = generateChangelog(titles, { version: '2.0.0', date: '2024-05-01' });
    expect(out).toContain('## 2.0.0 - 2024-05-01');
    expect(out).toContain('### Features');
    expect(out).toContain('### Bug Fixes');
    expect(out).toContain('### Documentation');
    // Features section appears before Bug Fixes
    expect(out.indexOf('### Features')).toBeLessThan(out.indexOf('### Bug Fixes'));
  });

  it('renders a breaking changes section first', () => {
    const out = generateChangelog(titles, { version: '2.0.0' });
    expect(out).toContain('### ⚠ BREAKING CHANGES');
    expect(out).toContain('new pricing model');
    expect(out.indexOf('BREAKING')).toBeLessThan(out.indexOf('### Features'));
  });

  it('includes scope and PR number in the line', () => {
    const out = generateChangelog(['feat(ui): add dark mode (#10)']);
    expect(out).toContain('- **ui:** add dark mode (#10)');
  });

  it('can filter to only certain categories', () => {
    const out = generateChangelog(titles, { includeCategories: ['feature'] });
    expect(out).toContain('### Features');
    expect(out).not.toContain('### Bug Fixes');
  });

  it('defaults version to Unreleased', () => {
    expect(generateChangelog(['fix: x'])).toContain('## Unreleased');
  });
});
