// CLI: read commit/PR titles from stdin (one per line) and emit a changelog.
// Usage: git log --pretty=%s v1.0.0..HEAD | node src/index.ts --version 1.1.0
import { readFileSync } from 'node:fs';
import { generateChangelog } from './lib/changelog';

const args = process.argv.slice(2);
let version: string | undefined;
const vi = args.indexOf('--version');
if (vi >= 0) version = args[vi + 1];

const input = readFileSync(0, 'utf8');
const titles = input.split('\n');
process.stdout.write(generateChangelog(titles, { version }) + '\n');
