import parser from 'cron-parser';
import cronstrue from 'cronstrue/i18n';

export interface ParseResult {
  valid: boolean;
  description?: string;
  descriptionKo?: string;
  nextRuns?: string[];
  error?: string;
}

export function parseCron(
  expression: string,
  options: { count?: number; tz?: string } = {}
): ParseResult {
  const count = options.count ?? 10;
  const tz = options.tz ?? 'UTC';
  const trimmed = expression.trim();
  if (!trimmed) return { valid: false, error: 'empty expression' };

  try {
    const interval = parser.parseExpression(trimmed, { tz });
    const nextRuns: string[] = [];
    for (let i = 0; i < count; i += 1) {
      nextRuns.push(interval.next().toISOString());
    }
    return {
      valid: true,
      description: cronstrue.toString(trimmed, { locale: 'en' }),
      descriptionKo: cronstrue.toString(trimmed, { locale: 'ko' }),
      nextRuns,
    };
  } catch (err) {
    return { valid: false, error: (err as Error).message };
  }
}

export function encodeShare(expression: string, tz = 'UTC'): string {
  return Buffer.from(JSON.stringify({ e: expression, t: tz })).toString('base64url');
}

export function decodeShare(token: string): { expression: string; tz: string } | null {
  try {
    const obj = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    if (typeof obj.e !== 'string') return null;
    return { expression: obj.e, tz: obj.t ?? 'UTC' };
  } catch {
    return null;
  }
}
