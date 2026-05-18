export type ChangeKind = 'added' | 'removed' | 'changed' | 'same';

export interface Change {
  path: string;
  kind: ChangeKind;
  left?: unknown;
  right?: unknown;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function joinPath(base: string, key: string | number): string {
  return base ? `${base}.${key}` : String(key);
}

export function diff(left: unknown, right: unknown, base = ''): Change[] {
  const out: Change[] = [];

  if (isObject(left) && isObject(right)) {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    for (const k of keys) {
      const p = joinPath(base, k);
      if (!(k in left)) out.push({ path: p, kind: 'added', right: right[k] });
      else if (!(k in right)) out.push({ path: p, kind: 'removed', left: left[k] });
      else out.push(...diff(left[k], right[k], p));
    }
    return out;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    const n = Math.max(left.length, right.length);
    for (let i = 0; i < n; i += 1) {
      const p = joinPath(base, i);
      if (i >= left.length) out.push({ path: p, kind: 'added', right: right[i] });
      else if (i >= right.length) out.push({ path: p, kind: 'removed', left: left[i] });
      else out.push(...diff(left[i], right[i], p));
    }
    return out;
  }

  if (left === right) return [{ path: base, kind: 'same', left, right }];
  return [{ path: base, kind: 'changed', left, right }];
}

export function summarize(changes: Change[]): {
  added: number;
  removed: number;
  changed: number;
  same: number;
} {
  const s = { added: 0, removed: 0, changed: 0, same: 0 };
  for (const c of changes) s[c.kind] += 1;
  return s;
}

export function changedOnly(changes: Change[]): Change[] {
  return changes.filter((c) => c.kind !== 'same');
}
