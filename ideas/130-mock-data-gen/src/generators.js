// Field generators: (rng, opts) => value. Pure given the rng.
import { randInt, pick } from "./rng.js";

const FIRST = ["Min", "Soo", "Jin", "Alex", "Sam", "Lee", "Kim", "Park", "Noah", "Mia"];
const LAST = ["Kim", "Lee", "Park", "Choi", "Jung", "Smith", "Lopez", "Chen", "Patel", "Garcia"];
const WORDS = ["lorem", "ipsum", "dolor", "sit", "amet", "data", "mock", "test", "alpha", "beta"];

function hex(rng, n) {
  let s = "";
  for (let i = 0; i < n; i++) s += "0123456789abcdef"[randInt(rng, 0, 15)];
  return s;
}

export const generators = {
  string: (rng, o = {}) => pick(rng, WORDS) + (o.suffix ?? ""),
  lorem: (rng, o = {}) => Array.from({ length: o.words ?? 3 }, () => pick(rng, WORDS)).join(" "),
  name: (rng) => `${pick(rng, FIRST)} ${pick(rng, LAST)}`,
  email: (rng) => `${pick(rng, FIRST).toLowerCase()}.${pick(rng, LAST).toLowerCase()}@example.com`,
  uuid: (rng) => `${hex(rng, 8)}-${hex(rng, 4)}-4${hex(rng, 3)}-${pick(rng, ["8", "9", "a", "b"])}${hex(rng, 3)}-${hex(rng, 12)}`,
  int: (rng, o = {}) => randInt(rng, o.min ?? 0, o.max ?? 100),
  float: (rng, o = {}) => {
    const min = o.min ?? 0;
    const max = o.max ?? 1;
    return Math.round((min + rng() * (max - min)) * 100) / 100;
  },
  bool: (rng) => rng() < 0.5,
  enum: (rng, o = {}) => pick(rng, o.values ?? ["a", "b", "c"]),
  date: (rng, o = {}) => {
    const start = new Date(o.start ?? "2020-01-01").getTime();
    const end = new Date(o.end ?? "2025-12-31").getTime();
    return new Date(start + Math.floor(rng() * (end - start))).toISOString().slice(0, 10);
  },
};

export function hasGenerator(type) {
  return Object.prototype.hasOwnProperty.call(generators, type);
}
