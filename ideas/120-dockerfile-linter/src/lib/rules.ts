// Dockerfile best-practice lint rules over the parsed instruction list.
// Pure functions, zero runtime dependencies.
import type { Instruction } from './parser';

export type Severity = 'info' | 'warning' | 'error';

export interface LintViolation {
  rule: string;
  severity: Severity;
  line: number;
  message: string;
}

export type Rule = (instrs: Instruction[]) => LintViolation[];

// DL3006: avoid `latest` tag (or no tag) in FROM.
const noLatestTag: Rule = (instrs) =>
  instrs
    .filter((x) => x.instruction === 'FROM')
    .filter((x) => {
      const image = x.args.split(/\s+as\s+/i)[0].trim();
      if (image.includes('@')) return false; // digest pinned
      const tag = image.split(':')[1];
      return !tag || tag === 'latest';
    })
    .map((x) => ({
      rule: 'no-latest-tag',
      severity: 'warning' as const,
      line: x.line,
      message: 'FROM 이미지에 명시적 버전 태그를 고정하세요 (latest 금지).',
    }));

// DL3002: do not run as root at the end (no USER instruction present).
const requireNonRootUser: Rule = (instrs) => {
  const hasUser = instrs.some((x) => x.instruction === 'USER' && x.args.trim() !== 'root');
  if (hasUser) return [];
  const lastFrom = [...instrs].reverse().find((x) => x.instruction === 'FROM');
  return [{
    rule: 'require-non-root-user',
    severity: 'warning' as const,
    line: lastFrom?.line ?? 1,
    message: '컨테이너를 비루트 USER로 실행하세요.',
  }];
};

// DL3009: apt-get install without cleaning lists / DL3015 no-install-recommends hint.
const aptCleanup: Rule = (instrs) =>
  instrs
    .filter((x) => x.instruction === 'RUN')
    .filter((x) => /apt-get\s+install/.test(x.args) && !/rm\s+-rf\s+\/var\/lib\/apt\/lists/.test(x.args))
    .map((x) => ({
      rule: 'apt-cleanup',
      severity: 'warning' as const,
      line: x.line,
      message: 'apt-get install 후 /var/lib/apt/lists 를 정리해 이미지 크기를 줄이세요.',
    }));

// DL3020: use COPY instead of ADD for local files (ADD has surprising behavior).
const preferCopy: Rule = (instrs) =>
  instrs
    .filter((x) => x.instruction === 'ADD')
    .filter((x) => !/^https?:\/\//.test(x.args)) // remote URLs are a valid ADD use
    .map((x) => ({
      rule: 'prefer-copy',
      severity: 'info' as const,
      line: x.line,
      message: '로컬 파일은 ADD 대신 COPY 를 사용하세요.',
    }));

// Custom: each Dockerfile must start with a FROM (after optional ARG/comments).
const mustStartWithFrom: Rule = (instrs) => {
  const firstNonArg = instrs.find((x) => x.instruction !== 'ARG');
  if (!firstNonArg) return [];
  if (firstNonArg.instruction !== 'FROM') {
    return [{
      rule: 'first-instruction-from',
      severity: 'error' as const,
      line: firstNonArg.line,
      message: 'Dockerfile 의 첫 명령은 (ARG 제외) FROM 이어야 합니다.',
    }];
  }
  return [];
};

export const ALL_RULES: Rule[] = [
  mustStartWithFrom,
  noLatestTag,
  requireNonRootUser,
  aptCleanup,
  preferCopy,
];

export function lint(instrs: Instruction[], rules: Rule[] = ALL_RULES): LintViolation[] {
  const out = rules.flatMap((rule) => rule(instrs));
  return out.sort((a, b) => a.line - b.line);
}

const SEVERITY_WEIGHT: Record<Severity, number> = { info: 1, warning: 2, error: 3 };

export function hasErrors(violations: LintViolation[], threshold: Severity = 'error'): boolean {
  return violations.some((v) => SEVERITY_WEIGHT[v.severity] >= SEVERITY_WEIGHT[threshold]);
}
