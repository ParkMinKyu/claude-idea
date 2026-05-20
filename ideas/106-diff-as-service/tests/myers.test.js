import { describe, it, expect } from "vitest";
import { diffSequences, diffLines, toUnified, diffStats } from "../src/myers.js";
import { handleDiff } from "../src/server.js";

/** Apply ops to reconstruct the new sequence from the diff. */
function applyOps(ops) {
  return ops.filter((o) => o.type !== "delete").map((o) => o.value);
}

describe("diffSequences", () => {
  it("classic ABCABBA -> CBABAC produces a valid edit script", () => {
    const a = "ABCABBA".split("");
    const b = "CBABAC".split("");
    const ops = diffSequences(a, b);
    expect(applyOps(ops).join("")).toBe("CBABAC");
    // Equal ops must be a common subsequence preserved in order.
    const equals = ops.filter((o) => o.type === "equal").map((o) => o.value);
    expect(equals.length).toBeGreaterThan(0);
  });

  it("identical inputs yield only equal ops", () => {
    const ops = diffSequences([1, 2, 3], [1, 2, 3]);
    expect(ops.every((o) => o.type === "equal")).toBe(true);
    expect(ops).toHaveLength(3);
  });

  it("empty old yields only inserts", () => {
    const ops = diffSequences([], ["x", "y"]);
    expect(ops.every((o) => o.type === "insert")).toBe(true);
    expect(ops).toHaveLength(2);
  });
});

describe("diffLines + reconstruction", () => {
  it("reconstructs new text from line ops", () => {
    const oldText = "line1\nline2\nline3";
    const newText = "line1\nline2-edited\nline3\nline4";
    const ops = diffLines(oldText, newText);
    expect(applyOps(ops).join("\n")).toBe(newText);
  });
});

describe("diffStats + toUnified", () => {
  it("counts insertions and deletions", () => {
    const ops = diffLines("a\nb\nc", "a\nx\nc\nd");
    const stats = diffStats(ops);
    expect(stats.insertions).toBe(2); // x, d
    expect(stats.deletions).toBe(1); // b
  });

  it("toUnified prefixes lines correctly", () => {
    const ops = diffLines("keep\nremove", "keep\nadd");
    const u = toUnified(ops);
    expect(u).toContain(" keep");
    expect(u).toContain("-remove");
    expect(u).toContain("+add");
  });
});

describe("handleDiff", () => {
  it("returns unified format on request", () => {
    const out = handleDiff({ old: "a\nb", new: "a\nc", format: "unified" });
    expect(out.unified).toContain("-b");
    expect(out.unified).toContain("+c");
    expect(out.stats.insertions).toBe(1);
  });
});
