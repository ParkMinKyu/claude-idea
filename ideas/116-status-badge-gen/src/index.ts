// CLI: render a badge to stdout.
// Usage: node src/index.ts build passing brightgreen > badge.svg
import { renderBadge, coverageBadge } from './lib/badge';

const [label, message, color] = process.argv.slice(2);

if (label === 'coverage' && message && /^\d+$/.test(message)) {
  process.stdout.write(coverageBadge(Number(message)) + '\n');
} else {
  process.stdout.write(
    renderBadge({ label: label ?? 'badge', message: message ?? 'n/a', color }) + '\n',
  );
}
