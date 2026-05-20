// Dependency vulnerability audit: parse package.json, match against a vuln DB.
// Pure functions, zero runtime dependencies. The DB is injectable so tests are offline.
import { coerce, satisfies, compare, type SemVer } from './semver';

export type Severity = 'low' | 'moderate' | 'high' | 'critical';

export interface Vulnerability {
  id: string; // e.g. CVE / advisory id
  package: string;
  vulnerableRange: string; // e.g. ">=1.0.0 <1.4.2"
  patchedVersion?: string; // e.g. "1.4.2"
  severity: Severity;
  title: string;
}

export interface Dependency {
  name: string;
  range: string; // version range from package.json
  dev: boolean;
}

export interface Finding {
  package: string;
  installedRange: string;
  resolvedVersion: string;
  vulnerability: Vulnerability;
  fixAvailable: boolean;
  recommendation: string;
}

export interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export function parseDependencies(pkg: PackageJson): Dependency[] {
  const deps: Dependency[] = [];
  for (const [name, range] of Object.entries(pkg.dependencies ?? {})) {
    deps.push({ name, range, dev: false });
  }
  for (const [name, range] of Object.entries(pkg.devDependencies ?? {})) {
    deps.push({ name, range, dev: true });
  }
  return deps;
}

// Resolve a range to the concrete version we'd treat as installed.
// For ^/~/exact we coerce to the base version expressed in the range.
function resolvedVersion(range: string): SemVer | null {
  return coerce(range);
}

export function auditDependencies(
  deps: Dependency[],
  db: Vulnerability[],
): Finding[] {
  const findings: Finding[] = [];
  const byPackage = new Map<string, Vulnerability[]>();
  for (const v of db) {
    const arr = byPackage.get(v.package) ?? [];
    arr.push(v);
    byPackage.set(v.package, arr);
  }

  for (const dep of deps) {
    const vulns = byPackage.get(dep.name);
    if (!vulns) continue;
    const resolved = resolvedVersion(dep.range);
    if (!resolved) continue;
    const resolvedStr = `${resolved.major}.${resolved.minor}.${resolved.patch}`;

    for (const v of vulns) {
      if (!satisfies(resolvedStr, v.vulnerableRange)) continue;
      const fixAvailable = Boolean(v.patchedVersion);
      const recommendation = v.patchedVersion
        ? `Upgrade ${dep.name} to >=${v.patchedVersion}`
        : `No patch available; review usage of ${dep.name}`;
      findings.push({
        package: dep.name,
        installedRange: dep.range,
        resolvedVersion: resolvedStr,
        vulnerability: v,
        fixAvailable,
        recommendation,
      });
    }
  }
  return findings;
}

const SEVERITY_WEIGHT: Record<Severity, number> = {
  low: 1, moderate: 2, high: 3, critical: 4,
};

export interface AuditSummary {
  total: number;
  bySeverity: Record<Severity, number>;
  highestSeverity: Severity | null;
}

export function summarize(findings: Finding[]): AuditSummary {
  const bySeverity: Record<Severity, number> = { low: 0, moderate: 0, high: 0, critical: 0 };
  let highest: Severity | null = null;
  for (const f of findings) {
    const sev = f.vulnerability.severity;
    bySeverity[sev] += 1;
    if (!highest || SEVERITY_WEIGHT[sev] > SEVERITY_WEIGHT[highest]) highest = sev;
  }
  return { total: findings.length, bySeverity, highestSeverity: highest };
}

// Exit-code helper for CI: fail if any finding is at or above a threshold.
export function shouldFail(findings: Finding[], threshold: Severity): boolean {
  return findings.some(
    (f) => SEVERITY_WEIGHT[f.vulnerability.severity] >= SEVERITY_WEIGHT[threshold],
  );
}

export { compare };
