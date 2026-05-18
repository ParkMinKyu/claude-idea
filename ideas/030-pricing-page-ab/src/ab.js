// A/B test core: deterministic variant assignment, segment matching,
// frequentist z-test, Bayesian posterior, auto-stop rules.

import { createHash } from "node:crypto";

// FNV-1a-ish stable hash → uint32 for variant bucketing.
export function hashToUnit(key) {
  const h = createHash("sha1").update(String(key)).digest();
  // Use first 4 bytes as uint32 then normalize to [0,1).
  const n = (h[0] << 24) | (h[1] << 16) | (h[2] << 8) | h[3];
  // Avoid negative (>>> 0)
  return (n >>> 0) / 0x1_0000_0000;
}

export function assignVariant(experiment, userId) {
  const totalWeight = experiment.variants.reduce((s, v) => s + (v.weight ?? 1), 0);
  if (totalWeight <= 0) throw new Error("variant weights must sum > 0");
  const u = hashToUnit(`${experiment.id}:${userId}`) * totalWeight;
  let acc = 0;
  for (const v of experiment.variants) {
    acc += v.weight ?? 1;
    if (u < acc) return v.key;
  }
  return experiment.variants[experiment.variants.length - 1].key;
}

// segments: [{ field, op, value }]; user is plain object.
const OPS = {
  eq: (a, b) => a === b,
  neq: (a, b) => a !== b,
  in: (a, b) => Array.isArray(b) && b.includes(a),
  starts: (a, b) => typeof a === "string" && a.startsWith(b),
};

export function matchesSegment(user, rules = []) {
  for (const r of rules) {
    const op = OPS[r.op];
    if (!op) throw new Error("unknown op: " + r.op);
    if (!op(user[r.field], r.value)) return false;
  }
  return true;
}

// Two-proportion z-test. Returns { z, pValue, lift }.
export function zTest({ aConv, aN, bConv, bN }) {
  if (aN <= 0 || bN <= 0) return { z: 0, pValue: 1, lift: 0 };
  const pA = aConv / aN;
  const pB = bConv / bN;
  const pPool = (aConv + bConv) / (aN + bN);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / aN + 1 / bN));
  const z = se === 0 ? 0 : (pB - pA) / se;
  const pValue = 2 * (1 - cdfStandardNormal(Math.abs(z)));
  return { z, pValue, lift: pA === 0 ? 0 : (pB - pA) / pA };
}

// Abramowitz-Stegun approximation of standard normal CDF.
function cdfStandardNormal(x) {
  const t = 1 / (1 + 0.2316419 * x);
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return 1 - p;
}

// Bayesian Beta-Bernoulli P(pB > pA) via Monte Carlo.
export function bayesianProb({ aConv, aN, bConv, bN }, samples = 5000, rng = Math.random) {
  const aAlpha = 1 + aConv;
  const aBeta = 1 + (aN - aConv);
  const bAlpha = 1 + bConv;
  const bBeta = 1 + (bN - bConv);
  let wins = 0;
  for (let i = 0; i < samples; i++) {
    if (sampleBeta(bAlpha, bBeta, rng) > sampleBeta(aAlpha, aBeta, rng)) wins++;
  }
  return wins / samples;
}

function sampleGamma(shape, rng) {
  // Marsaglia & Tsang for shape >= 1; for shape <1 use boost.
  if (shape < 1) return sampleGamma(shape + 1, rng) * Math.pow(rng(), 1 / shape);
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x, v;
    do {
      x = normalSample(rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * x ** 4) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function normalSample(rng) {
  const u1 = Math.max(rng(), Number.MIN_VALUE);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function sampleBeta(a, b, rng) {
  const x = sampleGamma(a, rng);
  const y = sampleGamma(b, rng);
  return x / (x + y);
}

// Auto-stop rule: stop when pValue < alpha OR sample size > N_max OR Bayesian prob > 0.95.
export function shouldStop({ pValue, samples, nMax = 50_000, alpha = 0.05, bayesProb = null }) {
  if (samples >= nMax) return { stop: true, reason: "max_samples" };
  if (pValue < alpha) return { stop: true, reason: "significant" };
  if (bayesProb != null && (bayesProb > 0.95 || bayesProb < 0.05)) return { stop: true, reason: "bayes_decisive" };
  return { stop: false, reason: null };
}
