// CLI: audit a package.json against the mock vuln DB.
// Usage: node src/index.ts ./package.json --fail-on high
import { readFileSync } from 'node:fs';
import { parseDependencies, auditDependencies, summarize, shouldFail, type Severity } from './lib/audit';
import { MOCK_VULN_DB } from './lib/mock-db';

const args = process.argv.slice(2);
const path = args.find((a) => !a.startsWith('--')) ?? './package.json';
const failIdx = args.indexOf('--fail-on');
const threshold = (failIdx >= 0 ? args[failIdx + 1] : 'high') as Severity;

const pkg = JSON.parse(readFileSync(path, 'utf8'));
const findings = auditDependencies(parseDependencies(pkg), MOCK_VULN_DB);
const summary = summarize(findings);

for (const f of findings) {
  process.stdout.write(
    `[${f.vulnerability.severity}] ${f.package}@${f.resolvedVersion} ${f.vulnerability.id}: ${f.vulnerability.title}\n  -> ${f.recommendation}\n`,
  );
}
process.stdout.write(
  `\n${summary.total} finding(s) | critical:${summary.bySeverity.critical} high:${summary.bySeverity.high} moderate:${summary.bySeverity.moderate} low:${summary.bySeverity.low}\n`,
);

if (shouldFail(findings, threshold)) {
  process.exitCode = 1;
}
