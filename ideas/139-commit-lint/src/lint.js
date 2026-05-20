// Conventional Commits parser + linter.
// Spec: https://www.conventionalcommits.org/en/v1.0.0/
// Pure functions, dependency-free.

export const DEFAULT_TYPES = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
];

const HEADER_RE = /^(?<type>\w+)(?:\((?<scope>[^)]+)\))?(?<bang>!)?: (?<subject>.+)$/;

/**
 * Parse a commit message into structured parts.
 * @returns {{ header, type, scope, breaking, subject, body, footers }}
 */
export function parseCommit(message) {
  const normalized = String(message).replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n");
  const header = lines[0] ?? "";
  const m = HEADER_RE.exec(header);

  const rest = lines.slice(1);
  // body = lines after a blank separator, before footers
  let body = "";
  const footers = [];
  const footerRe = /^(?<key>[A-Za-z-]+|BREAKING CHANGE)(?<sep>: | #)(?<value>.+)$/;
  const bodyLines = [];
  for (const line of rest) {
    const fm = footerRe.exec(line.trim());
    if (fm) {
      footers.push({ key: fm.groups.key, value: fm.groups.value });
    } else if (line.trim() !== "" || bodyLines.length) {
      bodyLines.push(line);
    }
  }
  body = bodyLines.join("\n").trim();

  const breaking =
    (m?.groups.bang === "!") || footers.some((f) => f.key === "BREAKING CHANGE");

  return {
    header,
    valid: Boolean(m),
    type: m?.groups.type ?? null,
    scope: m?.groups.scope ?? null,
    breaking,
    subject: m?.groups.subject ?? null,
    body,
    footers,
  };
}

/**
 * Lint a commit message against rules.
 * @returns {{ valid: boolean, errors: string[], warnings: string[], parsed }}
 */
export function lintCommit(message, options = {}) {
  const {
    types = DEFAULT_TYPES,
    maxHeaderLength = 72,
    minSubjectLength = 3,
    requireScope = false,
    subjectCase = "any", // "lower" | "any"
  } = options;

  const parsed = parseCommit(message);
  const errors = [];
  const warnings = [];

  // ignore merge/revert auto-messages gracefully
  if (/^Merge /.test(parsed.header)) {
    return { valid: true, errors, warnings, parsed, skipped: "merge-commit" };
  }

  if (!parsed.valid) {
    errors.push(
      "헤더 형식이 잘못되었습니다. 'type(scope?): subject' 형태여야 합니다."
    );
    return { valid: false, errors, warnings, parsed };
  }

  if (!types.includes(parsed.type)) {
    errors.push(`알 수 없는 타입 '${parsed.type}'. 허용: ${types.join(", ")}`);
  }
  if (requireScope && !parsed.scope) {
    errors.push("scope가 필요합니다 (예: feat(api): ...).");
  }
  if (parsed.header.length > maxHeaderLength) {
    errors.push(`헤더가 ${parsed.header.length}자로 ${maxHeaderLength}자를 초과했습니다.`);
  }
  if ((parsed.subject ?? "").length < minSubjectLength) {
    errors.push(`subject가 너무 짧습니다 (최소 ${minSubjectLength}자).`);
  }
  if (parsed.subject && /\.$/.test(parsed.subject)) {
    warnings.push("subject는 마침표로 끝내지 않는 것이 관례입니다.");
  }
  if (subjectCase === "lower" && parsed.subject && /^[A-Z]/.test(parsed.subject)) {
    warnings.push("subject는 소문자로 시작하는 것이 관례입니다.");
  }
  if (parsed.body && rest_has_no_blank_separator(message)) {
    warnings.push("헤더와 본문 사이에 빈 줄을 두는 것이 관례입니다.");
  }

  return { valid: errors.length === 0, errors, warnings, parsed };
}

function rest_has_no_blank_separator(message) {
  const lines = String(message).replace(/\r\n/g, "\n").split("\n");
  return lines.length > 1 && lines[1].trim() !== "";
}
