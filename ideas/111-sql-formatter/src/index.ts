// CLI entry: read SQL from stdin or a file arg, print formatted output + lint.
import { readFileSync } from 'node:fs';
import { format, lint } from './lib/formatter';

function readInput(): string {
  const arg = process.argv[2];
  if (arg && arg !== '-') return readFileSync(arg, 'utf8');
  return readFileSync(0, 'utf8'); // stdin
}

const sql = readInput();
process.stdout.write(format(sql) + '\n');
const issues = lint(sql);
if (issues.length) {
  process.stderr.write('\n-- lint --\n');
  for (const issue of issues) {
    process.stderr.write(`[${issue.rule}] ${issue.message}\n`);
  }
}
