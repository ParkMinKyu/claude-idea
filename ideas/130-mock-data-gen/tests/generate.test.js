import { describe, it, expect } from "vitest";
import { createRng, randInt, pick } from "../src/rng.js";
import { generators } from "../src/generators.js";
import { generate, generateRecord, generateField } from "../src/schema.js";
import { handleGenerate } from "../src/server.js";

describe("rng", () => {
  it("is deterministic for the same seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it("differs across seeds", () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
  });
  it("randInt stays within bounds", () => {
    const rng = createRng(7);
    for (let i = 0; i < 50; i++) {
      const n = randInt(rng, 5, 10);
      expect(n).toBeGreaterThanOrEqual(5);
      expect(n).toBeLessThanOrEqual(10);
    }
  });
});

describe("generators", () => {
  const rng = createRng(3);
  it("uuid matches v4-ish shape", () => {
    expect(generators.uuid(createRng(1))).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  it("email contains @example.com", () => {
    expect(generators.email(rng)).toContain("@example.com");
  });
  it("enum picks from values", () => {
    expect(["x", "y"]).toContain(generators.enum(rng, { values: ["x", "y"] }));
  });
  it("date is within range", () => {
    const d = generators.date(createRng(9), { start: "2021-01-01", end: "2021-12-31" });
    expect(d >= "2021-01-01" && d <= "2021-12-31").toBe(true);
  });
});

describe("generate", () => {
  const schema = {
    id: "uuid",
    name: "name",
    age: { type: "int", min: 18, max: 65 },
    active: "bool",
    tags: { type: "array", of: "lorem", count: 2 },
    address: { type: "object", properties: { city: { type: "enum", values: ["Seoul", "Busan"] } } },
  };

  it("produces the requested number of records", () => {
    expect(generate(schema, { count: 5, seed: 1 }).length).toBe(5);
  });

  it("is fully reproducible for the same seed", () => {
    expect(generate(schema, { count: 3, seed: 99 })).toEqual(generate(schema, { count: 3, seed: 99 }));
  });

  it("respects field types, ranges, nested objects and arrays", () => {
    const [rec] = generate(schema, { count: 1, seed: 5 });
    expect(typeof rec.id).toBe("string");
    expect(rec.age).toBeGreaterThanOrEqual(18);
    expect(rec.age).toBeLessThanOrEqual(65);
    expect(Array.isArray(rec.tags)).toBe(true);
    expect(rec.tags.length).toBe(2);
    expect(["Seoul", "Busan"]).toContain(rec.address.city);
  });

  it("throws on unknown field type", () => {
    expect(() => generateField({ type: "nope" }, createRng(1))).toThrow(/unknown field type/);
  });
});

describe("handleGenerate (API)", () => {
  it("returns 200 with records for valid schema", () => {
    const r = handleGenerate({ schema: { id: "uuid" }, count: 2, seed: 1 });
    expect(r.status).toBe(200);
    expect(r.payload.length).toBe(2);
  });
  it("returns 400 when schema missing", () => {
    expect(handleGenerate({}).status).toBe(400);
  });
  it("returns 400 on bad field type", () => {
    const r = handleGenerate({ schema: { x: "bogus" }, count: 1 });
    expect(r.status).toBe(400);
    expect(r.payload.error).toMatch(/unknown field type/);
  });
});
