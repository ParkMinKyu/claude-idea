// Generate a changelog from commit / PR titles using Conventional Commits.
// Pure functions, zero runtime dependencies.

export type ChangeCategory =
  | 'feature' | 'fix' | 'performance' | 'docs' | 'refactor'
  | 'test' | 'build' | 'chore' | 'other';

export interface ParsedChange {
  category: ChangeCategory;
  scope?: string;
  description: string;
  breaking: boolean;
  prNumber?: number;
  raw: string;
}

const TYPE_MAP: Record<string, ChangeCategory> = {
  feat: 'feature',
  feature: 'feature',
  fix: 'fix',
  bugfix: 'fix',
  perf: 'performance',
  docs: 'docs',
  doc: 'docs',
  refactor: 'refactor',
  test: 'test',
  tests: 'test',
  build: 'build',
  ci: 'build',
  chore: 'chore',
};

// Matches: type(scope)!: description   (scope and ! optional)
const CONVENTIONAL_RE = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;
const PR_SUFFIX_RE = /\s*\(#(\d+)\)\s*$/;

export function parseChange(title: string): ParsedChange {
  const raw = title.trim();
  let working = raw;
  let prNumber: number | undefined;

  const prMatch = PR_SUFFIX_RE.exec(working);
  if (prMatch) {
    prNumber = Number(prMatch[1]);
    working = working.replace(PR_SUFFIX_RE, '');
  }

  const m = CONVENTIONAL_RE.exec(working);
  if (m) {
    const type = m[1].toLowerCase();
    const scope = m[2];
    const bang = Boolean(m[3]);
    let description = m[4].trim();
    const breakingBody = /BREAKING CHANGE/i.test(raw);
    return {
      category: TYPE_MAP[type] ?? 'other',
      scope: scope || undefined,
      description,
      breaking: bang || breakingBody,
      prNumber,
      raw,
    };
  }

  return {
    category: 'other',
    description: working,
    breaking: /BREAKING CHANGE/i.test(raw),
    prNumber,
    raw,
  };
}

const SECTION_ORDER: Array<{ category: ChangeCategory; title: string }> = [
  { category: 'feature', title: '### Features' },
  { category: 'fix', title: '### Bug Fixes' },
  { category: 'performance', title: '### Performance' },
  { category: 'refactor', title: '### Refactoring' },
  { category: 'docs', title: '### Documentation' },
  { category: 'test', title: '### Tests' },
  { category: 'build', title: '### Build & CI' },
  { category: 'chore', title: '### Chores' },
  { category: 'other', title: '### Other' },
];

export interface ChangelogOptions {
  version?: string;
  date?: string; // ISO date, default today
  includeCategories?: ChangeCategory[]; // default: all except chore/other excluded? -> include all
}

function formatLine(c: ParsedChange): string {
  const scope = c.scope ? `**${c.scope}:** ` : '';
  const pr = c.prNumber ? ` (#${c.prNumber})` : '';
  return `- ${scope}${c.description}${pr}`;
}

export function generateChangelog(titles: string[], options: ChangelogOptions = {}): string {
  const parsed = titles
    .map((t) => t.trim())
    .filter(Boolean)
    .map(parseChange);

  const grouped = new Map<ChangeCategory, ParsedChange[]>();
  for (const c of parsed) {
    const arr = grouped.get(c.category) ?? [];
    arr.push(c);
    grouped.set(c.category, arr);
  }

  const lines: string[] = [];
  const version = options.version ?? 'Unreleased';
  const date = options.date ?? new Date().toISOString().slice(0, 10);
  lines.push(`## ${version} - ${date}`);

  const breaking = parsed.filter((c) => c.breaking);
  if (breaking.length) {
    lines.push('');
    lines.push('### ⚠ BREAKING CHANGES');
    for (const c of breaking) lines.push(formatLine(c));
  }

  const allowed = options.includeCategories;
  for (const section of SECTION_ORDER) {
    if (allowed && !allowed.includes(section.category)) continue;
    const items = grouped.get(section.category);
    if (!items || items.length === 0) continue;
    lines.push('');
    lines.push(section.title);
    for (const c of items) lines.push(formatLine(c));
  }

  return lines.join('\n');
}
