import { describe, it, expect } from 'vitest';
import {
  parseDependencies, auditDependencies, summarize, shouldFail,
  type PackageJson,
} from '../src/lib/audit';
import { MOCK_VULN_DB } from '../src/lib/mock-db';

const pkg: PackageJson = {
  dependencies: {
    lodash: '^4.17.20', // vulnerable (<4.17.21)
    minimist: '^1.2.6', // patched, NOT vulnerable
    'serialize-javascript': '3.0.4', // critical, vulnerable
    express: '^4.18.0', // not in DB
  },
  devDependencies: {
    'left-pad': '1.3.0', // low, no patch
  },
};

describe('parseDependencies', () => {
  it('flattens deps and devDeps with dev flag', () => {
    const deps = parseDependencies(pkg);
    expect(deps).toHaveLength(5);
    expect(deps.find((d) => d.name === 'left-pad')?.dev).toBe(true);
    expect(deps.find((d) => d.name === 'lodash')?.dev).toBe(false);
  });
});

describe('auditDependencies', () => {
  const findings = auditDependencies(parseDependencies(pkg), MOCK_VULN_DB);

  it('flags vulnerable packages and skips patched/unknown ones', () => {
    const names = findings.map((f) => f.package).sort();
    expect(names).toEqual(['left-pad', 'lodash', 'serialize-javascript']);
    expect(names).not.toContain('minimist'); // patched version
    expect(names).not.toContain('express'); // not in DB
  });

  it('includes a fix recommendation when a patch exists', () => {
    const lodash = findings.find((f) => f.package === 'lodash')!;
    expect(lodash.fixAvailable).toBe(true);
    expect(lodash.recommendation).toContain('4.17.21');
  });

  it('reports no fix when patchedVersion is missing', () => {
    const leftPad = findings.find((f) => f.package === 'left-pad')!;
    expect(leftPad.fixAvailable).toBe(false);
    expect(leftPad.recommendation).toContain('No patch');
  });
});

describe('summarize / shouldFail', () => {
  const findings = auditDependencies(parseDependencies(pkg), MOCK_VULN_DB);

  it('summarizes counts and highest severity', () => {
    const s = summarize(findings);
    expect(s.total).toBe(3);
    expect(s.bySeverity.critical).toBe(1);
    expect(s.bySeverity.high).toBe(1);
    expect(s.bySeverity.low).toBe(1);
    expect(s.highestSeverity).toBe('critical');
  });

  it('fails CI at or above threshold', () => {
    expect(shouldFail(findings, 'high')).toBe(true);
    expect(shouldFail(findings, 'critical')).toBe(true);
    const onlyLow = auditDependencies(
      [{ name: 'left-pad', range: '1.0.0', dev: false }],
      MOCK_VULN_DB,
    );
    expect(shouldFail(onlyLow, 'high')).toBe(false);
  });
});
