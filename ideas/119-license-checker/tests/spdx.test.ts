import { describe, it, expect } from 'vitest';
import {
  normalizeLicense, getLicense, checkCompatibility, auditProject,
} from '../src/lib/spdx';

describe('normalizeLicense', () => {
  it('resolves aliases', () => {
    expect(normalizeLicense('Apache 2.0')).toBe('Apache-2.0');
    expect(normalizeLicense('GPLv3')).toBe('GPL-3.0');
    expect(normalizeLicense('X11')).toBe('MIT');
  });
  it('is case-insensitive against catalog ids', () => {
    expect(normalizeLicense('mit')).toBe('MIT');
  });
  it('passes through unknown ids unchanged', () => {
    expect(normalizeLicense('WTFPL')).toBe('WTFPL');
  });
});

describe('getLicense', () => {
  it('categorizes known licenses', () => {
    expect(getLicense('MIT').category).toBe('permissive');
    expect(getLicense('GPL-3.0').category).toBe('strong-copyleft');
    expect(getLicense('MPL-2.0').category).toBe('weak-copyleft');
  });
  it('marks unknown licenses', () => {
    expect(getLicense('WTFPL').category).toBe('unknown');
  });
});

describe('checkCompatibility', () => {
  it('permissive deps are always compatible', () => {
    expect(checkCompatibility('Proprietary', 'MIT').verdict).toBe('compatible');
    expect(checkCompatibility('GPL-3.0', 'Apache-2.0').verdict).toBe('compatible');
  });

  it('strong copyleft dep is incompatible with a permissive/proprietary project', () => {
    expect(checkCompatibility('MIT', 'GPL-3.0').verdict).toBe('incompatible');
    expect(checkCompatibility('Proprietary', 'AGPL-3.0').verdict).toBe('incompatible');
  });

  it('strong copyleft dep is compatible with a strong copyleft project', () => {
    expect(checkCompatibility('GPL-3.0', 'GPL-2.0').verdict).toBe('compatible');
  });

  it('weak copyleft requires review for proprietary projects', () => {
    expect(checkCompatibility('Proprietary', 'LGPL-3.0').verdict).toBe('review');
    expect(checkCompatibility('MIT', 'LGPL-3.0').verdict).toBe('compatible');
  });

  it('unknown dep license requires review', () => {
    expect(checkCompatibility('MIT', 'WTFPL').verdict).toBe('review');
  });
});

describe('auditProject', () => {
  it('aggregates verdicts and computes passed', () => {
    const audit = auditProject('MIT', ['Apache-2.0', 'ISC', 'GPL-3.0', 'WTFPL']);
    expect(audit.results).toHaveLength(4);
    expect(audit.incompatible).toBe(1); // GPL-3.0
    expect(audit.review).toBe(1); // WTFPL
    expect(audit.passed).toBe(false);
  });

  it('passes when all deps are permissive', () => {
    const audit = auditProject('Proprietary', ['MIT', 'Apache-2.0', 'BSD-3-Clause']);
    expect(audit.passed).toBe(true);
    expect(audit.incompatible).toBe(0);
  });
});
