// Compile a schema object into record/batch generation. Pure given a seed.
import { createRng } from "./rng.js";
import { generators, hasGenerator } from "./generators.js";

/** Normalize a field spec into { type, ...opts }. */
function normalize(spec) {
  if (typeof spec === "string") return { type: spec };
  return spec;
}

/** Generate a value for one field spec using the shared rng. */
export function generateField(spec, rng) {
  const f = normalize(spec);
  if (f.type === "object") {
    return generateRecord(f.properties ?? {}, rng);
  }
  if (f.type === "array") {
    const count = f.count ?? 1;
    return Array.from({ length: count }, () => generateField(f.of, rng));
  }
  if (!hasGenerator(f.type)) {
    throw new Error(`unknown field type: ${f.type}`);
  }
  return generators[f.type](rng, f);
}

/** Generate a single record from a schema (object of field specs). */
export function generateRecord(schema, rng) {
  const out = {};
  for (const [key, spec] of Object.entries(schema)) {
    out[key] = generateField(spec, rng);
  }
  return out;
}

/**
 * Generate `count` records deterministically from (schema, seed).
 */
export function generate(schema, { count = 1, seed = 1 } = {}) {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => generateRecord(schema, rng));
}
