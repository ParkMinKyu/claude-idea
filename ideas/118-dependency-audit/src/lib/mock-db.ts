// Mock vulnerability database (stands in for a real advisory feed).
import type { Vulnerability } from './audit';

export const MOCK_VULN_DB: Vulnerability[] = [
  {
    id: 'GHSA-0001',
    package: 'lodash',
    vulnerableRange: '<4.17.21',
    patchedVersion: '4.17.21',
    severity: 'high',
    title: 'Prototype pollution in lodash',
  },
  {
    id: 'GHSA-0002',
    package: 'minimist',
    vulnerableRange: '<1.2.6',
    patchedVersion: '1.2.6',
    severity: 'moderate',
    title: 'Prototype pollution in minimist',
  },
  {
    id: 'GHSA-0003',
    package: 'left-pad',
    vulnerableRange: '>=0.0.0 <99.0.0',
    severity: 'low',
    title: 'Unmaintained package (no patch)',
  },
  {
    id: 'GHSA-0004',
    package: 'serialize-javascript',
    vulnerableRange: '>=3.0.0 <3.1.0',
    patchedVersion: '3.1.0',
    severity: 'critical',
    title: 'XSS via crafted regex',
  },
];
