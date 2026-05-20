// CLI: lint a Dockerfile.
// Usage: node src/index.ts ./Dockerfile --fail-on warning
import { readFileSync } from 'node:fs';
import { parseDockerfile } from './lib/parser';
import { lint, hasErrors, type Severity } from './lib/rules';

const args = process.argv.slice(2);
const path = args.find((a) => !a.startsWith('--')) ?? './Dockerfile';
const failIdx = args.indexOf('--fail-on');
const threshold = (failIdx >= 0 ? args[failIdx + 1] : 'error') as Severity;

const text = readFileSync(path, 'utf8');
const violations = lint(parseDockerfile(text));

for (const v of violations) {
  process.stdout.write(`${path}:${v.line} [${v.severity}] ${v.rule}: ${v.message}\n`);
}
process.stdout.write(`\n${violations.length} issue(s)\n`);

if (hasErrors(violations, threshold)) process.exitCode = 1;
