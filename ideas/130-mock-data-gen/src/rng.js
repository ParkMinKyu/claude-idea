// Deterministic PRNG (mulberry32). Pure/seeded for reproducible output.

/** Create a seeded RNG. Returns a function -> float in [0,1). */
export function createRng(seed = 1) {
  let a = seed >>> 0 || 1;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] inclusive. */
export function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Pick one element from an array. */
export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}
