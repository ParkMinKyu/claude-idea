// SQL formatter/linter: a small tokenizer + format rules engine.
// Pure functions, zero runtime dependencies — fully testable offline.

export type TokenType =
  | 'keyword'
  | 'identifier'
  | 'number'
  | 'string'
  | 'operator'
  | 'punctuation'
  | 'comment'
  | 'whitespace';

export interface Token {
  type: TokenType;
  value: string;
}

// Keywords that begin a new clause and get their own line.
const CLAUSE_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING',
  'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET',
  'DELETE FROM', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
  'OUTER JOIN', 'ON', 'UNION', 'UNION ALL',
]);

const KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT',
  'OFFSET', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'JOIN',
  'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'UNION', 'ALL', 'AND', 'OR',
  'NOT', 'NULL', 'AS', 'DISTINCT', 'IN', 'IS', 'LIKE', 'BETWEEN', 'EXISTS',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'ASC', 'DESC', 'COUNT', 'SUM',
  'AVG', 'MIN', 'MAX',
]);

const OPERATORS = ['<>', '!=', '<=', '>=', '=', '<', '>', '+', '-', '*', '/', '%'];

export function tokenize(sql: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const ch = sql[i];
    // whitespace
    if (/\s/.test(ch)) {
      let j = i;
      while (j < n && /\s/.test(sql[j])) j += 1;
      tokens.push({ type: 'whitespace', value: ' ' });
      i = j;
      continue;
    }
    // line comment
    if (ch === '-' && sql[i + 1] === '-') {
      let j = i;
      while (j < n && sql[j] !== '\n') j += 1;
      tokens.push({ type: 'comment', value: sql.slice(i, j) });
      i = j;
      continue;
    }
    // string literal
    if (ch === "'" || ch === '"') {
      const quote = ch;
      let j = i + 1;
      while (j < n && sql[j] !== quote) j += 1;
      tokens.push({ type: 'string', value: sql.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    // number
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < n && /[0-9.]/.test(sql[j])) j += 1;
      tokens.push({ type: 'number', value: sql.slice(i, j) });
      i = j;
      continue;
    }
    // identifier / keyword
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_]/.test(sql[j])) j += 1;
      const word = sql.slice(i, j);
      const upper = word.toUpperCase();
      tokens.push({
        type: KEYWORDS.has(upper) ? 'keyword' : 'identifier',
        value: KEYWORDS.has(upper) ? upper : word,
      });
      i = j;
      continue;
    }
    // multi-char operators
    const two = sql.slice(i, i + 2);
    if (OPERATORS.includes(two)) {
      tokens.push({ type: 'operator', value: two });
      i += 2;
      continue;
    }
    if (OPERATORS.includes(ch)) {
      tokens.push({ type: 'operator', value: ch });
      i += 1;
      continue;
    }
    // punctuation
    tokens.push({ type: 'punctuation', value: ch });
    i += 1;
  }
  return tokens;
}

export interface FormatOptions {
  indent?: string; // default two spaces
  uppercaseKeywords?: boolean; // default true
}

// Merge two-word clause keywords like GROUP BY into one logical token.
function mergeClauses(tokens: Token[]): Token[] {
  const meaningful = tokens.filter((t) => t.type !== 'whitespace');
  const out: Token[] = [];
  for (let i = 0; i < meaningful.length; i += 1) {
    const cur = meaningful[i];
    const next = meaningful[i + 1];
    if (cur.type === 'keyword' && next && next.type === 'keyword') {
      const pair = `${cur.value} ${next.value}`;
      if (CLAUSE_KEYWORDS.has(pair)) {
        out.push({ type: 'keyword', value: pair });
        i += 1;
        continue;
      }
    }
    out.push(cur);
  }
  return out;
}

export function format(sql: string, options: FormatOptions = {}): string {
  const indent = options.indent ?? '  ';
  const tokens = mergeClauses(tokenize(sql));
  const lines: string[] = [];
  let current = '';

  const flush = () => {
    if (current.trim()) lines.push(current.trimEnd());
    current = '';
  };

  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (t.type === 'keyword' && CLAUSE_KEYWORDS.has(t.value)) {
      flush();
      current = t.value;
      continue;
    }
    if (t.type === 'punctuation' && t.value === ',') {
      // comma stays attached, then break list item onto a new indented line.
      current += ',';
      flush();
      current = indent.repeat(1) + '';
      continue;
    }
    if (t.type === 'punctuation' && t.value === ';') {
      current += ';';
      flush();
      continue;
    }
    const piece = t.value;
    if (current === '' || current === indent) current += piece;
    else if (t.type === 'punctuation' && (t.value === ')' || t.value === '('))
      current += piece;
    else current += ` ${piece}`;
  }
  flush();
  return lines.join('\n');
}

export interface LintIssue {
  rule: string;
  message: string;
}

// Static lint rules over raw SQL text.
export function lint(sql: string): LintIssue[] {
  const issues: LintIssue[] = [];
  if (/select\s+\*/i.test(sql)) {
    issues.push({ rule: 'no-select-star', message: 'SELECT * 사용을 피하고 컬럼을 명시하세요.' });
  }
  if (/\bdelete\s+from\b/i.test(sql) && !/\bwhere\b/i.test(sql)) {
    issues.push({ rule: 'delete-without-where', message: 'WHERE 없는 DELETE는 위험합니다.' });
  }
  if (/\bupdate\b/i.test(sql) && /\bset\b/i.test(sql) && !/\bwhere\b/i.test(sql)) {
    issues.push({ rule: 'update-without-where', message: 'WHERE 없는 UPDATE는 위험합니다.' });
  }
  // Detect lowercase clause keywords in the raw text (tokenizer normalizes case,
  // so we scan the original string here).
  const hasLowercaseKw = /\b(select|from|where|join|group by|order by)\b/.test(sql);
  if (hasLowercaseKw) {
    issues.push({ rule: 'keyword-case', message: '키워드는 대문자로 통일하세요.' });
  }
  return issues;
}
