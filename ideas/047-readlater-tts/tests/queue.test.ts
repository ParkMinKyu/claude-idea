import { describe, it, expect } from "vitest";
import { addItem, markDone, removeItem, reorder, MAX_FREE_ITEMS } from "../src/lib/queue";

describe("queue", () => {
  it("adds new item", () => {
    const q = addItem([], { url: "https://a", title: "A" });
    expect(q).toHaveLength(1);
    expect(q[0].url).toBe("https://a");
    expect(q[0].id).toBeTruthy();
  });

  it("dedupes by url", () => {
    let q = addItem([], { url: "https://a", title: "A" });
    q = addItem(q, { url: "https://a", title: "A2" });
    expect(q).toHaveLength(1);
  });

  it("removes item by id", () => {
    let q = addItem([], { url: "https://a", title: "A" });
    q = removeItem(q, q[0].id);
    expect(q).toHaveLength(0);
  });

  it("marks done", () => {
    let q = addItem([], { url: "https://a", title: "A" });
    q = markDone(q, q[0].id);
    expect(q[0].done).toBe(true);
  });

  it("reorders", () => {
    let q = addItem([], { url: "https://a", title: "A" });
    q = addItem(q, { url: "https://b", title: "B" });
    q = reorder(q, q[0].id, 1);
    expect(q.map((i) => i.url)).toEqual(["https://b", "https://a"]);
  });

  it("enforces free limit", () => {
    let q: ReturnType<typeof addItem> = [];
    for (let i = 0; i < MAX_FREE_ITEMS + 3; i++) {
      q = addItem(q, { url: `https://x/${i}`, title: `t${i}` });
    }
    expect(q.length).toBeLessThanOrEqual(MAX_FREE_ITEMS);
  });

  it("pro has no limit", () => {
    let q: ReturnType<typeof addItem> = [];
    for (let i = 0; i < 50; i++) {
      q = addItem(q, { url: `https://x/${i}`, title: `t${i}` }, { isPro: true });
    }
    expect(q.length).toBe(50);
  });
});
