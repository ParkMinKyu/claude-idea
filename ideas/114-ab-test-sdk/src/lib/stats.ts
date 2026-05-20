// Frequentist statistics for two-proportion A/B tests.
// Pure functions, zero runtime dependencies.

export interface VariantStats {
  conversions: number;
  visitors: number;
}

export interface AbResult {
  controlRate: number;
  treatmentRate: number;
  relativeUplift: number; // (t - c) / c
  zScore: number;
  pValue: number; // two-tailed
  significant: boolean; // at alpha (default 0.05)
}

// Standard normal CDF via Abramowitz & Stegun 7.1.26 erf approximation.
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-(z * z) / 2);
  const p =
    d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z > 0 ? 1 - p : p;
}

export function twoTailedP(z: number): number {
  return 2 * (1 - normalCdf(Math.abs(z)));
}

export function analyze(
  control: VariantStats,
  treatment: VariantStats,
  alpha = 0.05,
): AbResult {
  const cRate = control.visitors ? control.conversions / control.visitors : 0;
  const tRate = treatment.visitors ? treatment.conversions / treatment.visitors : 0;

  const pPool =
    (control.conversions + treatment.conversions) /
    (control.visitors + treatment.visitors || 1);
  const se = Math.sqrt(
    pPool * (1 - pPool) * (1 / (control.visitors || 1) + 1 / (treatment.visitors || 1)),
  );
  const z = se === 0 ? 0 : (tRate - cRate) / se;
  const pValue = twoTailedP(z);

  return {
    controlRate: cRate,
    treatmentRate: tRate,
    relativeUplift: cRate === 0 ? 0 : (tRate - cRate) / cRate,
    zScore: z,
    pValue,
    significant: pValue < alpha,
  };
}

// Required sample size per arm for a two-proportion test (approximation).
export function sampleSizePerArm(
  baseRate: number,
  minDetectableEffect: number, // absolute, e.g. 0.02
  alpha = 0.05,
  power = 0.8,
): number {
  const zAlpha = 1.959963985; // two-tailed 0.05
  const zBeta = power === 0.8 ? 0.841621234 : 1.281551566; // 0.8 or 0.9
  const p1 = baseRate;
  const p2 = baseRate + minDetectableEffect;
  const pBar = (p1 + p2) / 2;
  const numerator =
    zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) +
    zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
  return Math.ceil((numerator * numerator) / (minDetectableEffect * minDetectableEffect));
}
