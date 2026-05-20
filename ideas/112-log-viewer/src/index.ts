// Streaming log viewer: tail stdin, parse each line, apply a filter DSL query.
// Usage: tail -f app.log | node src/index.ts "level>=warn -healthcheck"
import { createInterface } from 'node:readline';
import { parseLine } from './lib/parser';
import { matches } from './lib/filter';

const query = process.argv.slice(2).join(' ');
const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on('line', (line) => {
  if (!line.trim()) return;
  const entry = parseLine(line);
  if (!query || matches(entry, query)) {
    const lvl = entry.level ? `[${entry.level.toUpperCase()}]` : '';
    process.stdout.write(`${entry.ts ?? ''} ${lvl} ${entry.message}\n`.trim() + '\n');
  }
});
