// Filter DSL for log entries.
// Grammar (whitespace-separated terms, implicit AND):
//   level:error            -> level equals
//   level>=warn            -> level threshold
//   field.user=alice       -> nested field equals
//   "free text"            -> substring match on message
//   word                   -> substring match on message
//   -term                  -> negation
import type { LogEntry } from './parser';

const LEVEL_ORDER = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

export interface FilterTerm {
  negate: boolean;
  kind: 'level-eq' | 'level-cmp' | 'field-eq' | 'text';
  key?: string;
  op?: '>=' | '<=' | '>' | '<' | '=';
  value: string;
}

export function parseQuery(query: string): FilterTerm[] {
  const terms: FilterTerm[] = [];
  const tokens = tokenizeQuery(query);
  for (let tok of tokens) {
    let negate = false;
    if (tok.startsWith('-') && tok.length > 1) {
      negate = true;
      tok = tok.slice(1);
    }
    const cmp = /^level\s*(>=|<=|>|<)\s*(\w+)$/.exec(tok);
    if (cmp) {
      terms.push({ negate, kind: 'level-cmp', op: cmp[1] as FilterTerm['op'], value: cmp[2].toLowerCase() });
      continue;
    }
    const lvl = /^level:(\w+)$/.exec(tok);
    if (lvl) {
      terms.push({ negate, kind: 'level-eq', value: lvl[1].toLowerCase() });
      continue;
    }
    const field = /^([\w.]+)=(.+)$/.exec(tok);
    if (field) {
      terms.push({ negate, kind: 'field-eq', key: field[1], op: '=', value: stripQuotes(field[2]) });
      continue;
    }
    terms.push({ negate, kind: 'text', value: stripQuotes(tok) });
  }
  return terms;
}

function tokenizeQuery(query: string): string[] {
  const out: string[] = [];
  const re = /"[^"]*"|\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(query)) !== null) out.push(m[0]);
  return out;
}

function stripQuotes(s: string): string {
  return s.replace(/^"(.*)"$/, '$1');
}

function levelRank(level?: string): number {
  if (!level) return -1;
  return LEVEL_ORDER.indexOf(level.toLowerCase());
}

function matchTerm(entry: LogEntry, term: FilterTerm): boolean {
  let result: boolean;
  switch (term.kind) {
    case 'level-eq':
      result = (entry.level ?? '') === term.value;
      break;
    case 'level-cmp': {
      const a = levelRank(entry.level);
      const b = levelRank(term.value);
      if (a < 0 || b < 0) { result = false; break; }
      if (term.op === '>=') result = a >= b;
      else if (term.op === '<=') result = a <= b;
      else if (term.op === '>') result = a > b;
      else result = a < b;
      break;
    }
    case 'field-eq': {
      const key = term.key!.startsWith('field.') ? term.key!.slice(6) : term.key!;
      const val = entry.fields[key];
      result = val !== undefined && String(val) === term.value;
      break;
    }
    case 'text':
    default:
      result = entry.message.toLowerCase().includes(term.value.toLowerCase())
        || entry.raw.toLowerCase().includes(term.value.toLowerCase());
      break;
  }
  return term.negate ? !result : result;
}

export function matches(entry: LogEntry, query: string): boolean {
  const terms = parseQuery(query);
  return terms.every((t) => matchTerm(entry, t));
}

export function filterLogs(entries: LogEntry[], query: string): LogEntry[] {
  if (!query.trim()) return entries;
  const terms = parseQuery(query);
  return entries.filter((e) => terms.every((t) => matchTerm(e, t)));
}
