// SPDX license compatibility analysis.
// Pure functions, zero runtime dependencies.

export type LicenseCategory = 'permissive' | 'weak-copyleft' | 'strong-copyleft' | 'proprietary' | 'unknown';

export interface LicenseInfo {
  id: string;
  name: string;
  category: LicenseCategory;
}

// A compact catalog of common SPDX identifiers.
const CATALOG: Record<string, LicenseInfo> = {
  MIT: { id: 'MIT', name: 'MIT License', category: 'permissive' },
  'Apache-2.0': { id: 'Apache-2.0', name: 'Apache License 2.0', category: 'permissive' },
  'BSD-2-Clause': { id: 'BSD-2-Clause', name: 'BSD 2-Clause', category: 'permissive' },
  'BSD-3-Clause': { id: 'BSD-3-Clause', name: 'BSD 3-Clause', category: 'permissive' },
  ISC: { id: 'ISC', name: 'ISC License', category: 'permissive' },
  'MPL-2.0': { id: 'MPL-2.0', name: 'Mozilla Public License 2.0', category: 'weak-copyleft' },
  'LGPL-3.0': { id: 'LGPL-3.0', name: 'GNU LGPL v3', category: 'weak-copyleft' },
  'LGPL-2.1': { id: 'LGPL-2.1', name: 'GNU LGPL v2.1', category: 'weak-copyleft' },
  'GPL-2.0': { id: 'GPL-2.0', name: 'GNU GPL v2', category: 'strong-copyleft' },
  'GPL-3.0': { id: 'GPL-3.0', name: 'GNU GPL v3', category: 'strong-copyleft' },
  'AGPL-3.0': { id: 'AGPL-3.0', name: 'GNU AGPL v3', category: 'strong-copyleft' },
  'Proprietary': { id: 'Proprietary', name: 'Proprietary', category: 'proprietary' },
};

// Common aliases people put in package.json.
const ALIASES: Record<string, string> = {
  'BSD': 'BSD-3-Clause',
  'Apache 2.0': 'Apache-2.0',
  'Apache2': 'Apache-2.0',
  'GPLv3': 'GPL-3.0',
  'GPLv2': 'GPL-2.0',
  'AGPLv3': 'AGPL-3.0',
  'GPL': 'GPL-3.0',
  'X11': 'MIT',
};

export function normalizeLicense(raw: string): string {
  const trimmed = raw.trim().replace(/^\(|\)$/g, '');
  if (CATALOG[trimmed]) return trimmed;
  if (ALIASES[trimmed]) return ALIASES[trimmed];
  // case-insensitive match against catalog ids
  const lower = trimmed.toLowerCase();
  const hit = Object.keys(CATALOG).find((k) => k.toLowerCase() === lower);
  return hit ?? trimmed;
}

export function getLicense(raw: string): LicenseInfo {
  const id = normalizeLicense(raw);
  return CATALOG[id] ?? { id, name: id, category: 'unknown' };
}

export type Verdict = 'compatible' | 'review' | 'incompatible';

export interface CompatResult {
  project: LicenseInfo;
  dependency: LicenseInfo;
  verdict: Verdict;
  reason: string;
}

// Can a project under `projectLicense` include a dependency under `depLicense`?
// Simplified matrix focused on the common "ship a product" direction.
export function checkCompatibility(projectLicenseRaw: string, depLicenseRaw: string): CompatResult {
  const project = getLicense(projectLicenseRaw);
  const dep = getLicense(depLicenseRaw);

  let verdict: Verdict;
  let reason: string;

  if (dep.category === 'unknown') {
    verdict = 'review';
    reason = `Dependency license "${dep.id}" is unrecognized; manual review needed.`;
  } else if (dep.category === 'permissive') {
    verdict = 'compatible';
    reason = 'Permissive dependency licenses can be used by any project.';
  } else if (dep.category === 'weak-copyleft') {
    verdict = project.category === 'proprietary' ? 'review' : 'compatible';
    reason = project.category === 'proprietary'
      ? 'Weak copyleft is usually OK if dynamically linked; review distribution terms.'
      : 'Weak copyleft is compatible with open-source projects.';
  } else if (dep.category === 'strong-copyleft') {
    if (project.category === 'strong-copyleft') {
      verdict = 'compatible';
      reason = 'Both project and dependency are strong copyleft.';
    } else {
      verdict = 'incompatible';
      reason = `Strong copyleft (${dep.id}) requires the whole project to adopt a compatible copyleft license.`;
    }
  } else {
    verdict = 'review';
    reason = 'Could not classify; manual review needed.';
  }

  return { project, dependency: dep, verdict, reason };
}

export interface ProjectAuditResult {
  results: CompatResult[];
  incompatible: number;
  review: number;
  passed: boolean;
}

export function auditProject(projectLicense: string, depLicenses: string[]): ProjectAuditResult {
  const results = depLicenses.map((d) => checkCompatibility(projectLicense, d));
  const incompatible = results.filter((r) => r.verdict === 'incompatible').length;
  const review = results.filter((r) => r.verdict === 'review').length;
  return { results, incompatible, review, passed: incompatible === 0 };
}
