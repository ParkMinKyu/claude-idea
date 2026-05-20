// Log line parser: detects JSON logs and common text formats.
// Pure functions, zero runtime dependencies.

export interface LogEntry {
  ts?: string;
  level?: string;
  message: string;
  fields: Record<string, string | number | boolean | null>;
  raw: string;
}

const LEVELS = ['trace', 'debug', 'info', 'warn', 'warning', 'error', 'fatal'];

// Common text format: "2024-01-02T10:00:00Z INFO message here"
const TEXT_RE = /^\s*(\S+)\s+(TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL)\b\s*(.*)$/i;

export function parseLine(line: string): LogEntry {
  const raw = line;
  const trimmed = line.trim();

  // JSON log
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed) as Record<string, unknown>;
      const fields: LogEntry['fields'] = {};
      for (const [k, v] of Object.entries(obj)) {
        if (['ts', 'time', 'timestamp', 'level', 'msg', 'message'].includes(k)) continue;
        fields[k] = v as never;
      }
      return {
        ts: pickString(obj, ['ts', 'time', 'timestamp']),
        level: normalizeLevel(pickString(obj, ['level', 'lvl', 'severity'])),
        message: pickString(obj, ['msg', 'message']) ?? '',
        fields,
        raw,
      };
    } catch {
      // fall through to text parsing
    }
  }

  // Text log
  const m = TEXT_RE.exec(trimmed);
  if (m) {
    return {
      ts: m[1],
      level: normalizeLevel(m[2]),
      message: m[3],
      fields: parseKeyValues(m[3]),
      raw,
    };
  }

  return { message: trimmed, fields: {}, raw };
}

export function parseLog(text: string): LogEntry[] {
  return text
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map(parseLine);
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
  }
  return undefined;
}

function normalizeLevel(level?: string): string | undefined {
  if (!level) return undefined;
  const l = level.toLowerCase();
  if (l === 'warning') return 'warn';
  return LEVELS.includes(l) ? l : level.toLowerCase();
}

// Parse "key=value key2=value2" pairs out of free text.
function parseKeyValues(text: string): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  const re = /(\w+)=("([^"]*)"|\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const key = m[1];
    let value: string = m[3] !== undefined ? m[3] : m[2];
    out[key] = coerce(value);
  }
  return out;
}

function coerce(v: string): string | number | boolean | null {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}
