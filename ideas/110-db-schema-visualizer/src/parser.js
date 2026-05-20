// SQL DDL parser -> graph model for ERD generation. Pure, regex-driven.
// Handles CREATE TABLE with columns, PK, and FK (inline + table-level).

const stripComments = (sql) =>
  sql.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

const unquote = (s) => s.replace(/^["`\[]|["`\]]$/g, "").trim();

/** Split a column-definitions body on top-level commas (ignores commas in parens). */
function splitTopLevel(body) {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const ch of body) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

const TABLE_RE = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"\[\]\w.]+)\s*\(([\s\S]*?)\)\s*;/gi;
const FK_LINE_RE =
  /FOREIGN\s+KEY\s*\(\s*([`"\w]+)\s*\)\s*REFERENCES\s+([`"\[\]\w.]+)\s*\(\s*([`"\w]+)\s*\)/i;
const INLINE_FK_RE = /REFERENCES\s+([`"\[\]\w.]+)\s*\(\s*([`"\w]+)\s*\)/i;
const PK_LINE_RE = /PRIMARY\s+KEY\s*\(\s*([^)]+)\)/i;
const RESERVED = /^(PRIMARY|FOREIGN|UNIQUE|CONSTRAINT|CHECK|KEY|INDEX)\b/i;

/** Parse DDL into { tables, relations } graph model. */
export function parseDDL(sql) {
  const clean = stripComments(sql);
  const tables = [];
  const relations = [];
  let m;
  while ((m = TABLE_RE.exec(clean))) {
    const tableName = unquote(m[1]);
    const columns = [];
    const pkCols = new Set();
    for (const line of splitTopLevel(m[2])) {
      const pkMatch = PK_LINE_RE.exec(line);
      if (RESERVED.test(line)) {
        if (pkMatch && /^PRIMARY/i.test(line))
          pkMatch[1].split(",").forEach((c) => pkCols.add(unquote(c)));
        const fk = FK_LINE_RE.exec(line);
        if (fk) {
          relations.push({
            from: tableName,
            fromColumn: unquote(fk[1]),
            to: unquote(fk[2]),
            toColumn: unquote(fk[3]),
          });
        }
        continue;
      }
      const tokens = line.split(/\s+/);
      const name = unquote(tokens[0]);
      const type = (tokens[1] ?? "").toUpperCase();
      const isPk = /\bPRIMARY\s+KEY\b/i.test(line);
      if (isPk) pkCols.add(name);
      const notNull = /\bNOT\s+NULL\b/i.test(line) || isPk;
      columns.push({ name, type, primaryKey: isPk, notNull });
      const inlineFk = INLINE_FK_RE.exec(line);
      if (inlineFk) {
        relations.push({
          from: tableName,
          fromColumn: name,
          to: unquote(inlineFk[1]),
          toColumn: unquote(inlineFk[2]),
        });
      }
    }
    for (const col of columns) if (pkCols.has(col.name)) col.primaryKey = true;
    tables.push({ name: tableName, columns });
  }
  return { tables, relations };
}

/** Find a table by name. */
export function findTable(model, name) {
  return model.tables.find((t) => t.name === name) ?? null;
}

/** Emit a Graphviz DOT string for the ERD. */
export function toDot(model) {
  const lines = ["digraph ERD {", "  rankdir=LR;", "  node [shape=record];"];
  for (const t of model.tables) {
    const cols = t.columns
      .map((c) => (c.primaryKey ? `${c.name} (PK)` : c.name))
      .join("\\l");
    lines.push(`  "${t.name}" [label="{${t.name}|${cols}\\l}"];`);
  }
  for (const r of model.relations) {
    lines.push(`  "${r.from}" -> "${r.to}" [label="${r.fromColumn}"];`);
  }
  lines.push("}");
  return lines.join("\n");
}
