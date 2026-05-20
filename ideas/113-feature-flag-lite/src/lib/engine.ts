// Lightweight feature flag engine with a deterministic rule evaluator.
// Pure functions, zero runtime dependencies.

export interface EvalContext {
  userId?: string;
  [key: string]: string | number | boolean | undefined;
}

export type Operator =
  | 'eq' | 'neq' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';

export interface Condition {
  attribute: string;
  operator: Operator;
  value: string | number | boolean | Array<string | number>;
}

export interface Rule {
  // All conditions must match (AND). Empty conditions => always matches.
  conditions: Condition[];
  // Percentage of matching users to roll out to (0-100). Default 100.
  rollout?: number;
  // Variant to serve when this rule wins. Default true.
  serve?: boolean | string;
}

export interface FlagDefinition {
  key: string;
  enabled: boolean; // master switch
  defaultValue: boolean | string;
  rules?: Rule[];
}

export interface EvalResult {
  value: boolean | string;
  reason: 'disabled' | 'rule_match' | 'rollout_excluded' | 'default';
  ruleIndex?: number;
}

function compare(actual: unknown, op: Operator, expected: Condition['value']): boolean {
  switch (op) {
    case 'eq': return actual === expected;
    case 'neq': return actual !== expected;
    case 'in': return Array.isArray(expected) && expected.includes(actual as never);
    case 'nin': return Array.isArray(expected) && !expected.includes(actual as never);
    case 'gt': return typeof actual === 'number' && actual > Number(expected);
    case 'gte': return typeof actual === 'number' && actual >= Number(expected);
    case 'lt': return typeof actual === 'number' && actual < Number(expected);
    case 'lte': return typeof actual === 'number' && actual <= Number(expected);
    case 'contains':
      return typeof actual === 'string' && actual.includes(String(expected));
    default: return false;
  }
}

function ruleMatches(rule: Rule, ctx: EvalContext): boolean {
  return rule.conditions.every((c) => compare(ctx[c.attribute], c.operator, c.value));
}

// Deterministic 0..99 bucket from flag key + user id (FNV-1a hash).
export function bucket(flagKey: string, userId: string): number {
  const input = `${flagKey}:${userId}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % 100;
}

export function evaluate(flag: FlagDefinition, ctx: EvalContext = {}): EvalResult {
  if (!flag.enabled) {
    return { value: flag.defaultValue, reason: 'disabled' };
  }
  const rules = flag.rules ?? [];
  for (let i = 0; i < rules.length; i += 1) {
    const rule = rules[i];
    if (!ruleMatches(rule, ctx)) continue;
    const rollout = rule.rollout ?? 100;
    if (rollout < 100) {
      const id = ctx.userId ?? '';
      if (bucket(flag.key, id) >= rollout) {
        return { value: flag.defaultValue, reason: 'rollout_excluded', ruleIndex: i };
      }
    }
    return { value: rule.serve ?? true, reason: 'rule_match', ruleIndex: i };
  }
  return { value: flag.defaultValue, reason: 'default' };
}

// Convenience SDK-style client over a static flag set.
export class FlagClient {
  private flags: Map<string, FlagDefinition>;
  constructor(defs: FlagDefinition[]) {
    this.flags = new Map(defs.map((d) => [d.key, d]));
  }
  isEnabled(key: string, ctx: EvalContext = {}): boolean {
    return this.variant(key, ctx) === true;
  }
  variant(key: string, ctx: EvalContext = {}): boolean | string {
    const flag = this.flags.get(key);
    if (!flag) return false;
    return evaluate(flag, ctx).value;
  }
  explain(key: string, ctx: EvalContext = {}): EvalResult {
    const flag = this.flags.get(key);
    if (!flag) return { value: false, reason: 'default' };
    return evaluate(flag, ctx);
  }
}
