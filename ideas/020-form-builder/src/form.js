// Form builder core: schema validation, field reorder, conditional branching evaluator.

export const FIELD_TYPES = ["text", "longtext", "email", "number", "select", "multiselect", "rating", "date", "file", "payment", "consent"];

export function validateField(field) {
  const errs = [];
  if (!field || typeof field !== "object") return ["field must be object"];
  if (!field.id) errs.push("id required");
  if (!FIELD_TYPES.includes(field.type)) errs.push(`unknown type: ${field.type}`);
  if (!field.label || field.label.length > 200) errs.push("label required and <=200 chars");
  if (field.type === "select" || field.type === "multiselect") {
    if (!Array.isArray(field.options) || field.options.length < 2) errs.push("options >= 2 required");
  }
  return errs;
}

export function validateAnswer(field, value) {
  if (field.required && (value == null || value === "")) return "required";
  if (value == null || value === "") return null;
  switch (field.type) {
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)) ? null : "invalid email";
    case "number":
      if (typeof value !== "number" && !/^-?\d+(\.\d+)?$/.test(String(value))) return "not a number";
      return null;
    case "rating": {
      const n = Number(value);
      const max = field.max ?? 5;
      return Number.isInteger(n) && n >= 1 && n <= max ? null : `rating 1..${max}`;
    }
    case "select":
      return field.options.includes(value) ? null : "invalid option";
    case "multiselect":
      return Array.isArray(value) && value.every((v) => field.options.includes(v)) ? null : "invalid options";
    case "consent":
      return value === true ? null : "consent required";
    default:
      return null;
  }
}

export function reorderFields(fields, fromId, toIndex) {
  const arr = [...fields];
  const idx = arr.findIndex((f) => f.id === fromId);
  if (idx === -1) throw new Error("field not found");
  const [item] = arr.splice(idx, 1);
  arr.splice(Math.max(0, Math.min(toIndex, arr.length)), 0, item);
  return arr;
}

// Branching DSL: { if: { field: "a", op: "eq", value: "yes" }, then: "go:fieldId", else: "next" }
const OPS = {
  eq: (a, b) => a === b,
  neq: (a, b) => a !== b,
  gt: (a, b) => Number(a) > Number(b),
  lt: (a, b) => Number(a) < Number(b),
  contains: (a, b) => Array.isArray(a) ? a.includes(b) : String(a ?? "").includes(b),
};

export function evaluateBranch(rule, answers) {
  const op = OPS[rule.if.op];
  if (!op) throw new Error("unknown op: " + rule.if.op);
  const left = answers[rule.if.field];
  return op(left, rule.if.value) ? rule.then : rule.else ?? "next";
}

export function nextField(fields, currentId, answers, rules = []) {
  const rule = rules.find((r) => r.from === currentId);
  if (rule) {
    const action = evaluateBranch(rule, answers);
    if (action === "submit") return null;
    if (action?.startsWith?.("go:")) return action.slice(3);
  }
  const idx = fields.findIndex((f) => f.id === currentId);
  if (idx === -1 || idx === fields.length - 1) return null;
  return fields[idx + 1].id;
}
