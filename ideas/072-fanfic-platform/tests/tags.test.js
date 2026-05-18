import { describe, it, expect } from 'vitest';
import {
  canonicalize,
  normalizeTags,
  canonicalRelationship,
  passesFilters,
  missingWarnings,
} from '../src/tags.js';

describe('canonicalize / normalizeTags', () => {
  it('maps Korean and English aliases to same id', () => {
    expect(canonicalize('지민')).toBe('jimin');
    expect(canonicalize('박지민')).toBe('jimin');
    expect(canonicalize('BTS Jimin')).toBe('jimin');
  });

  it('strips whitespace + lowercases unknown tags', () => {
    expect(canonicalize('  Some Tag  ')).toBe('some tag');
    expect(canonicalize('')).toBeNull();
    expect(canonicalize(null)).toBeNull();
  });

  it('normalizeTags dedupes after canonicalization', () => {
    expect(normalizeTags(['지민', '박지민', 'BTS Jimin']).sort()).toEqual(['jimin']);
  });
});

describe('canonicalRelationship', () => {
  it('sorts pair alphabetically', () => {
    expect(canonicalRelationship('박지민/V')).toBe(canonicalRelationship('뷔/지민'));
  });
  it('returns null for non-pair input', () => {
    expect(canonicalRelationship('지민')).toBeNull();
  });
});

describe('passesFilters', () => {
  const work = { tags: ['지민', '학원물', '로미오'] };
  it('honors blocked tags', () => {
    expect(passesFilters(work, { blocked: ['jimin'] })).toBe(false);
  });
  it('honors required tags', () => {
    expect(passesFilters(work, { required: ['romeo'] })).toBe(true);
    expect(passesFilters(work, { required: ['absent'] })).toBe(false);
  });
});

describe('missingWarnings', () => {
  it('flags explicit work missing warnings', () => {
    expect(missingWarnings({ tags: ['explicit'], warnings: [] })).toContain('explicit');
  });
  it('flags invalid warnings', () => {
    expect(
      missingWarnings({ tags: ['explicit'], warnings: ['18+', '말도안되는경고'] })
    ).toContain('invalid_warning:말도안되는경고');
  });
  it('returns empty when properly warned', () => {
    expect(missingWarnings({ tags: ['explicit'], warnings: ['18+'] })).toEqual([]);
  });
});
