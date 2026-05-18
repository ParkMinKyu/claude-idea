import { describe, it, expect } from "vitest";
import {
  castVote,
  removeVote,
  hotScore,
  rankPosts,
  groupByColumn,
  transitionStatus,
  notifyRecipients,
  COLUMNS,
} from "../src/roadmap.js";

describe("castVote", () => {
  const post = { id: "1", voters: [], createdAt: "2026-05-01T00:00:00Z", status: "backlog" };
  it("adds new voter", () => {
    const { post: next, changed } = castVote(post, "A@Example.com");
    expect(changed).toBe(true);
    expect(next.voters).toEqual(["a@example.com"]);
  });
  it("ignores duplicate", () => {
    const once = castVote(post, "a@x").post;
    const again = castVote(once, "A@X");
    expect(again.changed).toBe(false);
    expect(again.post.voters).toHaveLength(1);
  });
});

describe("removeVote", () => {
  it("removes voter", () => {
    const post = { id: "1", voters: ["a@x"], createdAt: "2026-05-01T00:00:00Z" };
    const { post: next, changed } = removeVote(post, "a@x");
    expect(changed).toBe(true);
    expect(next.voters).toEqual([]);
  });
  it("no-op when not present", () => {
    expect(removeVote({ voters: [] }, "z@x").changed).toBe(false);
  });
});

describe("hotScore / rankPosts", () => {
  const now = Date.parse("2026-05-18T00:00:00Z");
  const posts = [
    { id: "old-popular", voters: Array(20).fill().map((_, i) => `${i}@x`), createdAt: new Date(now - 30 * 86400000).toISOString() },
    { id: "new-small", voters: ["a@x", "b@x"], createdAt: new Date(now - 60_000).toISOString() },
    { id: "mid", voters: ["a@x"], createdAt: new Date(now - 86400000).toISOString() },
  ];
  it("hot mode favors recent over old popular", () => {
    const ranked = rankPosts(posts, "hot", now);
    expect(ranked[0].id).toBe("new-small");
  });
  it("top mode favors raw votes", () => {
    expect(rankPosts(posts, "top", now)[0].id).toBe("old-popular");
  });
  it("new mode sorts by createdAt desc", () => {
    expect(rankPosts(posts, "new", now)[0].id).toBe("new-small");
  });
});

describe("groupByColumn + transitionStatus", () => {
  it("groups into all columns", () => {
    const posts = [{ status: "backlog" }, { status: "shipped" }, { status: "unknown" }];
    const g = groupByColumn(posts);
    expect(COLUMNS.every((c) => Array.isArray(g[c]))).toBe(true);
    expect(g.backlog).toHaveLength(2); // unknown coerced
    expect(g.shipped).toHaveLength(1);
  });
  it("rejects invalid transition target", () => {
    expect(() => transitionStatus({ status: "backlog" }, "wat")).toThrow();
  });
});

describe("notifyRecipients", () => {
  it("dedups author and voters", () => {
    const post = { authorEmail: "A@x", voters: ["a@x", "b@x"] };
    const r = notifyRecipients(post);
    expect(r.sort()).toEqual(["a@x", "b@x"]);
  });
});
