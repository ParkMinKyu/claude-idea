// Language-agnostic heuristic tokenizer. Pure.
// Produces token objects: { text, type } where type ∈
//   keyword | string | comment | number | text

const KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while",
  "import", "export", "from", "class", "new", "async", "await", "def", "fn",
  "pub", "use", "match", "struct", "enum", "interface", "type", "public",
  "private", "static", "void", "int", "string", "bool", "true", "false", "null", "None",
]);

const TOKEN_RE = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\/\/[^\n]*|#[^\n]*)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][A-Za-z0-9_$]*)|(\s+)|([^\sA-Za-z0-9_$]+)/g;

/** Tokenize a single line into typed tokens. */
export function tokenizeLine(line) {
  const tokens = [];
  let m;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(line))) {
    if (m[1] != null) tokens.push({ text: m[1], type: "string" });
    else if (m[2] != null) tokens.push({ text: m[2], type: "comment" });
    else if (m[3] != null) tokens.push({ text: m[3], type: "number" });
    else if (m[4] != null) tokens.push({ text: m[4], type: KEYWORDS.has(m[4]) ? "keyword" : "text" });
    else tokens.push({ text: m[0], type: "text" });
  }
  return tokens;
}

/** Tokenize multi-line code into an array of lines (each an array of tokens). */
export function tokenize(code) {
  return String(code).split("\n").map(tokenizeLine);
}
