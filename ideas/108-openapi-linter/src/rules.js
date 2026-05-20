// OpenAPI 3.x linter rule engine. Pure functions over a parsed spec object.
// Each rule: { id, severity, description, check(spec) -> [{ path, message }] }

const get = (obj, path) => path.reduce((o, k) => (o == null ? o : o[k]), obj);

export const RULES = [
  {
    id: "info-contact",
    severity: "warn",
    description: "info.contact should be present",
    check(spec) {
      return spec.info?.contact
        ? []
        : [{ path: "info.contact", message: "missing contact info" }];
    },
  },
  {
    id: "operation-operationId",
    severity: "error",
    description: "every operation must have a unique operationId",
    check(spec) {
      const issues = [];
      const seen = new Map();
      for (const [p, methods] of Object.entries(spec.paths ?? {})) {
        for (const [method, op] of Object.entries(methods)) {
          if (!HTTP_METHODS.has(method)) continue;
          const loc = `paths.${p}.${method}`;
          if (!op.operationId) {
            issues.push({ path: loc, message: "missing operationId" });
          } else if (seen.has(op.operationId)) {
            issues.push({
              path: loc,
              message: `duplicate operationId "${op.operationId}" (also at ${seen.get(op.operationId)})`,
            });
          } else {
            seen.set(op.operationId, loc);
          }
        }
      }
      return issues;
    },
  },
  {
    id: "operation-success-response",
    severity: "error",
    description: "every operation must declare a 2xx response",
    check(spec) {
      const issues = [];
      for (const [p, methods] of Object.entries(spec.paths ?? {})) {
        for (const [method, op] of Object.entries(methods)) {
          if (!HTTP_METHODS.has(method)) continue;
          const codes = Object.keys(op.responses ?? {});
          if (!codes.some((c) => /^2\d\d$/.test(c) || c === "2XX")) {
            issues.push({ path: `paths.${p}.${method}.responses`, message: "no 2xx response defined" });
          }
        }
      }
      return issues;
    },
  },
  {
    id: "path-param-defined",
    severity: "error",
    description: "path template params must be declared as parameters",
    check(spec) {
      const issues = [];
      for (const [p, methods] of Object.entries(spec.paths ?? {})) {
        const templated = [...p.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
        for (const [method, op] of Object.entries(methods)) {
          if (!HTTP_METHODS.has(method)) continue;
          const declared = new Set(
            [...(methods.parameters ?? []), ...(op.parameters ?? [])]
              .filter((x) => x.in === "path")
              .map((x) => x.name)
          );
          for (const name of templated) {
            if (!declared.has(name)) {
              issues.push({
                path: `paths.${p}.${method}`,
                message: `path param "{${name}}" not declared`,
              });
            }
          }
        }
      }
      return issues;
    },
  },
];

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete", "head", "options", "trace"]);

/** Run all (or selected) rules and return a flat issue list with metadata. */
export function lint(spec, { only, disable = [] } = {}) {
  if (!spec || typeof spec !== "object") throw new Error("spec must be an object");
  if (!spec.openapi) throw new Error("missing 'openapi' version field");
  const active = RULES.filter(
    (r) => (!only || only.includes(r.id)) && !disable.includes(r.id)
  );
  const issues = [];
  for (const rule of active) {
    for (const found of rule.check(spec)) {
      issues.push({ ruleId: rule.id, severity: rule.severity, ...found });
    }
  }
  return issues;
}

/** Summarize issues by severity; ok=true when there are no errors. */
export function summarize(issues) {
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warn").length;
  return { ok: errors === 0, errors, warnings, total: issues.length };
}
