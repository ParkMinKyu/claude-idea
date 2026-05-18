export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface Request {
  name: string;
  method: Method;
  url: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface Folder {
  name: string;
  requests: Request[];
  folders?: Folder[];
}

export interface Collection {
  name: string;
  variables?: Record<string, string>;
  root: Folder;
}

const VAR_RE = /\{\{\s*([\w.-]+)\s*\}\}/g;

export function substitute(value: string, vars: Record<string, string>): string {
  return value.replace(VAR_RE, (_, k) => (k in vars ? vars[k] : `{{${k}}}`));
}

export function applyVars(req: Request, vars: Record<string, string>): Request {
  const next: Request = {
    ...req,
    url: substitute(req.url, vars),
    body: req.body !== undefined ? substitute(req.body, vars) : undefined,
  };
  if (req.headers) {
    next.headers = Object.fromEntries(
      Object.entries(req.headers).map(([k, v]) => [k, substitute(v, vars)])
    );
  }
  return next;
}

export function flattenRequests(folder: Folder, prefix = ''): Request[] {
  const here = folder.requests.map((r) => ({ ...r, name: prefix ? `${prefix} / ${r.name}` : r.name }));
  const sub = (folder.folders ?? []).flatMap((f) =>
    flattenRequests(f, prefix ? `${prefix} / ${f.name}` : f.name)
  );
  return [...here, ...sub];
}

export function toYaml(c: Collection): string {
  // Minimal YAML emitter for collection round-tripping (no external deps).
  const lines: string[] = [`name: ${JSON.stringify(c.name)}`];
  if (c.variables) {
    lines.push('variables:');
    for (const [k, v] of Object.entries(c.variables)) lines.push(`  ${k}: ${JSON.stringify(v)}`);
  }
  lines.push('requests:');
  for (const r of flattenRequests(c.root)) {
    lines.push(`  - name: ${JSON.stringify(r.name)}`);
    lines.push(`    method: ${r.method}`);
    lines.push(`    url: ${JSON.stringify(r.url)}`);
  }
  return lines.join('\n');
}
