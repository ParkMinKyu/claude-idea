import { describe, it, expect } from "vitest";
import { detectCodeBlock, enforceFreeLimit, search, tokenize } from "../src/main/search";

const items = [
  { id: "1", type: "text", content: "hello world", capturedAt: 1, hash: "a" },
  { id: "2", type: "text", content: "git commit -m fix", capturedAt: 2, hash: "b" },
  { id: "3", type: "text", content: "function foo() { return 1; }", capturedAt: 3, hash: "c", pinned: true },
] as const;

describe("tokenize", () => {
  it("splits on non-word", () => {
    expect(tokenize("Hello, world!")).toEqual(["hello", "world"]);
  });
});

describe("search", () => {
  it("returns by score", () => {
    const r = search([...items], "git");
    expect(r[0].id).toBe("2");
  });
  it("empty query returns all", () => {
    expect(search([...items], "")).toHaveLength(3);
  });
  it("pinned ranks higher", () => {
    const r = search([...items], "foo");
    expect(r[0].id).toBe("3");
  });
});

describe("detectCodeBlock", () => {
  it("detects multi-line code", () => {
    expect(detectCodeBlock("function foo() {\n  return 1;\n}")).toBe(true);
  });
  it("detects single-line declaration", () => {
    expect(detectCodeBlock("const a = 1;")).toBe(true);
  });
  it("rejects plain text", () => {
    expect(detectCodeBlock("hello world")).toBe(false);
  });
});

describe("enforceFreeLimit", () => {
  it("caps free users", () => {
    expect(enforceFreeLimit([1, 2, 3, 4, 5], false, 3)).toEqual([3, 4, 5]);
  });
  it("does not cap pro", () => {
    expect(enforceFreeLimit([1, 2, 3, 4, 5], true, 3)).toEqual([1, 2, 3, 4, 5]);
  });
});
