// Diff two OpenAPI documents into a flat list of change objects. Pure.
// Change = { kind, path, method?, name?, detail }

const METHODS = ["get", "post", "put", "patch", "delete", "options", "head"];

function operations(pathItem = {}) {
  return METHODS.filter((m) => pathItem[m]).map((m) => [m, pathItem[m]]);
}

function paramKey(p) {
  return `${p.in}:${p.name}`;
}

function indexParams(op = {}) {
  const map = new Map();
  for (const p of op.parameters ?? []) map.set(paramKey(p), p);
  return map;
}

/** Compute the change list from old -> new spec. */
export function diffSpecs(oldSpec, newSpec) {
  const changes = [];
  const oldPaths = oldSpec?.paths ?? {};
  const newPaths = newSpec?.paths ?? {};
  const allPaths = new Set([...Object.keys(oldPaths), ...Object.keys(newPaths)]);

  for (const path of allPaths) {
    const oldItem = oldPaths[path];
    const newItem = newPaths[path];

    if (oldItem && !newItem) {
      changes.push({ kind: "path-removed", path, detail: "경로 제거됨" });
      continue;
    }
    if (!oldItem && newItem) {
      changes.push({ kind: "path-added", path, detail: "경로 추가됨" });
      continue;
    }

    const oldOps = Object.fromEntries(operations(oldItem));
    const newOps = Object.fromEntries(operations(newItem));
    const allMethods = new Set([...Object.keys(oldOps), ...Object.keys(newOps)]);

    for (const method of allMethods) {
      const o = oldOps[method];
      const n = newOps[method];
      if (o && !n) {
        changes.push({ kind: "operation-removed", path, method, detail: "오퍼레이션 제거됨" });
        continue;
      }
      if (!o && n) {
        changes.push({ kind: "operation-added", path, method, detail: "오퍼레이션 추가됨" });
        continue;
      }

      // Parameters.
      const oldP = indexParams(o);
      const newP = indexParams(n);
      for (const [key, p] of newP) {
        if (!oldP.has(key)) {
          changes.push({
            kind: "param-added",
            path,
            method,
            name: p.name,
            required: !!p.required,
            detail: `${p.required ? "필수" : "선택"} 파라미터 추가: ${p.name}`,
          });
        } else {
          const before = oldP.get(key);
          if (!before.required && p.required) {
            changes.push({ kind: "param-required-added", path, method, name: p.name, detail: `파라미터가 필수로 변경: ${p.name}` });
          }
        }
      }
      for (const [key, p] of oldP) {
        if (!newP.has(key)) {
          changes.push({ kind: "param-removed", path, method, name: p.name, detail: `파라미터 제거: ${p.name}` });
        }
      }

      // Responses.
      const oldR = Object.keys(o.responses ?? {});
      const newR = Object.keys(n.responses ?? {});
      for (const code of newR) if (!oldR.includes(code)) changes.push({ kind: "response-added", path, method, name: code, detail: `응답 추가: ${code}` });
      for (const code of oldR) if (!newR.includes(code)) changes.push({ kind: "response-removed", path, method, name: code, detail: `응답 제거: ${code}` });
    }
  }

  return changes;
}
