import { describe, it, expect } from "vitest";
import { createQueue, postProcess, searchTokens, rank } from "../src/ocrQueue.js";

describe("postProcess", () => {
  it("collapses whitespace and drops short lines", () => {
    const text = "Hello   world\n\nx\nthis is a line   here";
    expect(postProcess(text)).toBe("Hello world\nthis is a line here");
  });

  it("returns empty on null", () => {
    expect(postProcess(null)).toBe("");
  });
});

describe("searchTokens", () => {
  it("lowercases and prefixes wildcards", () => {
    expect(searchTokens("Tokio Async")).toEqual(["tokio*", "async*"]);
  });

  it("drops 1-char tokens", () => {
    expect(searchTokens("a tokio b")).toEqual(["tokio*"]);
  });
});

describe("rank", () => {
  it("sorts by score desc", () => {
    const out = rank([
      { path: "a", score: 1 },
      { path: "b", score: 3 },
      { path: "c", score: 2 },
    ]);
    expect(out.map((r) => r.path)).toEqual(["b", "c", "a"]);
  });
});

describe("createQueue", () => {
  it("runs OCR jobs and stores results", async () => {
    const fakeOcr = async (path) => `text for ${path}`;
    const q = createQueue({ ocr: fakeOcr, concurrency: 2 });
    const r1 = await q.enqueue("/img/a.png");
    expect(r1.text).toContain("a.png");
    expect(q.stats().done).toBe(1);
  });

  it("propagates errors", async () => {
    const failing = async () => {
      throw new Error("ocr failed");
    };
    const q = createQueue({ ocr: failing });
    await expect(q.enqueue("/x.png")).rejects.toThrow("ocr failed");
    expect(q.get("/x.png").error).toBe("ocr failed");
  });

  it("respects concurrency limit", async () => {
    let active = 0;
    let peak = 0;
    const slow = async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 10));
      active--;
      return "done";
    };
    const q = createQueue({ ocr: slow, concurrency: 2 });
    await Promise.all(["a", "b", "c", "d"].map((p) => q.enqueue(p)));
    expect(peak).toBeLessThanOrEqual(2);
  });
});
