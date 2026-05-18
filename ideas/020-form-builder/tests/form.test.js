import { describe, it, expect } from "vitest";
import { validateField, validateAnswer, reorderFields, evaluateBranch, nextField } from "../src/form.js";

describe("validateField", () => {
  it("accepts valid select", () => {
    expect(validateField({ id: "a", type: "select", label: "Pick", options: ["x", "y"] })).toEqual([]);
  });
  it("rejects select with too few options", () => {
    expect(validateField({ id: "a", type: "select", label: "Pick", options: ["x"] })).toContain("options >= 2 required");
  });
  it("rejects unknown type", () => {
    expect(validateField({ id: "a", type: "foo", label: "x" })[0]).toMatch(/unknown type/);
  });
});

describe("validateAnswer", () => {
  it("validates email", () => {
    expect(validateAnswer({ type: "email", required: true }, "not")).toBe("invalid email");
    expect(validateAnswer({ type: "email", required: true }, "a@b.co")).toBeNull();
  });
  it("requires consent true", () => {
    expect(validateAnswer({ type: "consent", required: true }, false)).toBe("consent required");
    expect(validateAnswer({ type: "consent", required: true }, true)).toBeNull();
  });
  it("validates rating range", () => {
    expect(validateAnswer({ type: "rating", max: 5 }, 6)).toMatch(/rating/);
    expect(validateAnswer({ type: "rating", max: 5 }, 3)).toBeNull();
  });
});

describe("reorderFields", () => {
  it("moves field", () => {
    const fields = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(reorderFields(fields, "a", 2).map((f) => f.id)).toEqual(["b", "c", "a"]);
  });
});

describe("evaluateBranch", () => {
  it("returns then on match", () => {
    const rule = { if: { field: "q1", op: "eq", value: "yes" }, then: "go:q3" };
    expect(evaluateBranch(rule, { q1: "yes" })).toBe("go:q3");
  });
  it("returns else (or next) on mismatch", () => {
    const rule = { if: { field: "q1", op: "eq", value: "yes" }, then: "go:q3" };
    expect(evaluateBranch(rule, { q1: "no" })).toBe("next");
  });
});

describe("nextField", () => {
  const fields = [{ id: "q1" }, { id: "q2" }, { id: "q3" }];
  it("follows branching rule", () => {
    const rules = [{ from: "q1", if: { field: "q1", op: "eq", value: "yes" }, then: "go:q3" }];
    expect(nextField(fields, "q1", { q1: "yes" }, rules)).toBe("q3");
  });
  it("falls through to next when no rule matches", () => {
    expect(nextField(fields, "q1", {})).toBe("q2");
  });
  it("returns null at end", () => {
    expect(nextField(fields, "q3", {})).toBeNull();
  });
});
