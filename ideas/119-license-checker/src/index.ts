// CLI: check a project license against dependency licenses.
// Usage: node src/index.ts MIT GPL-3.0 Apache-2.0 ISC
import { auditProject } from './lib/spdx';

const [projectLicense, ...depLicenses] = process.argv.slice(2);
if (!projectLicense) {
  process.stderr.write('usage: license-checker <projectLicense> <depLicense...>\n');
  process.exit(2);
}

const audit = auditProject(projectLicense, depLicenses);
for (const r of audit.results) {
  const mark = r.verdict === 'compatible' ? 'OK ' : r.verdict === 'review' ? '?? ' : 'XX ';
  process.stdout.write(`${mark}${r.dependency.id} [${r.verdict}] ${r.reason}\n`);
}
process.stdout.write(
  `\nincompatible:${audit.incompatible} review:${audit.review} passed:${audit.passed}\n`,
);
if (!audit.passed) process.exitCode = 1;
