import { describe, it, expect } from "vitest";
import {
  validateSlug,
  createLink,
  buildRedirectUrl,
  recordClick,
  summarizeClicks,
  checkLinkHealth,
  createStore,
} from "../src/tracker.js";

describe("validateSlug", () => {
  it("accepts valid slugs", () => {
    expect(validateSlug("my-link-1").ok).toBe(true);
  });
  it("rejects invalid slugs", () => {
    expect(validateSlug("Bad Slug").ok).toBe(false);
    expect(validateSlug("a").ok).toBe(false);
    expect(validateSlug("-bad").ok).toBe(false);
  });
});

describe("createLink", () => {
  it("creates and prevents duplicate slug", () => {
    const store = createStore();
    createLink(store, { slug: "abc", targetUrl: "https://amazon.com/dp/X", ownerId: "u1" });
    expect(() => createLink(store, { slug: "abc", targetUrl: "https://x.com", ownerId: "u1" })).toThrow();
  });
  it("rejects non-http target", () => {
    const store = createStore();
    expect(() => createLink(store, { slug: "abc", targetUrl: "ftp://x", ownerId: "u" })).toThrow();
  });
});

describe("buildRedirectUrl", () => {
  it("appends affiliate params for known programs", () => {
    const link = { targetUrl: "https://www.amazon.com/dp/X", tags: ["review"] };
    const out = buildRedirectUrl(link, { "amazon.com": { params: { tag: "myaff-20" } } });
    expect(out).toContain("tag=myaff-20");
    expect(out).toContain("utm_campaign=review");
  });
});

describe("recordClick + summarizeClicks", () => {
  it("records a click and produces summary buckets", () => {
    const store = createStore();
    createLink(store, { slug: "k", targetUrl: "https://amazon.com/x", ownerId: "u" });
    recordClick(store, "k", { country: "KR", userAgent: "iPhone", referrer: "https://blog.test/post" });
    recordClick(store, "k", { country: "US", userAgent: "Mozilla", referrer: "https://x.com/abc?q=1" });
    recordClick(store, "k", { country: "KR", userAgent: "iPhone" });
    const sum = summarizeClicks(store.clicks, { slug: "k" });
    expect(sum.total).toBe(3);
    expect(sum.byCountry.KR).toBe(2);
    expect(sum.byDevice.mobile).toBe(2);
  });
  it("returns 404 for unknown slug", () => {
    const store = createStore();
    expect(recordClick(store, "nope").ok).toBe(false);
  });
});

describe("checkLinkHealth", () => {
  it("reports healthy link", async () => {
    const fakeFetch = async () => ({ status: 200 });
    const r = await checkLinkHealth({ slug: "k", targetUrl: "https://x.com" }, fakeFetch);
    expect(r.ok).toBe(true);
  });
  it("reports broken link", async () => {
    const fakeFetch = async () => ({ status: 404 });
    const r = await checkLinkHealth({ slug: "k", targetUrl: "https://x.com" }, fakeFetch);
    expect(r.ok).toBe(false);
  });
});
