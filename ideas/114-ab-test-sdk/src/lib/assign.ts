// Deterministic A/B test variant assignment.
// Pure functions, zero runtime dependencies.

export interface Variant {
  key: string;
  weight: number; // relative weight, must be > 0
}

export interface Experiment {
  key: string;
  variants: Variant[];
  // optional explicit traffic allocation 0..1 (default 1 = everyone enrolled)
  allocation?: number;
}

// FNV-1a -> normalized float in [0, 1).
export function hashToUnit(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return (hash >>> 0) / 0x100000000;
}

export interface Assignment {
  experiment: string;
  variant: string | null; // null = not enrolled
  enrolled: boolean;
}

export function assign(exp: Experiment, unitId: string): Assignment {
  const allocation = exp.allocation ?? 1;
  // Separate hash space for enrollment vs. variant pick so changing one is stable.
  const enrollRoll = hashToUnit(`${exp.key}:enroll:${unitId}`);
  if (enrollRoll >= allocation) {
    return { experiment: exp.key, variant: null, enrolled: false };
  }
  const total = exp.variants.reduce((s, v) => s + v.weight, 0);
  if (total <= 0) return { experiment: exp.key, variant: null, enrolled: false };

  const roll = hashToUnit(`${exp.key}:variant:${unitId}`) * total;
  let acc = 0;
  for (const v of exp.variants) {
    acc += v.weight;
    if (roll < acc) {
      return { experiment: exp.key, variant: v.key, enrolled: true };
    }
  }
  // floating point safety net
  return { experiment: exp.key, variant: exp.variants[exp.variants.length - 1].key, enrolled: true };
}

// Convenience client over a set of experiments.
export class ExperimentClient {
  private experiments: Map<string, Experiment>;
  constructor(experiments: Experiment[]) {
    this.experiments = new Map(experiments.map((e) => [e.key, e]));
  }
  getVariant(key: string, unitId: string): string | null {
    const exp = this.experiments.get(key);
    if (!exp) return null;
    return assign(exp, unitId).variant;
  }
}
