import { describe, it, expect } from "vitest";
import {
  DEFAULT_CONFIG,
  hostMatches,
  pickSuspendCandidates,
  shouldSuspend,
  TabInfo,
} from "../src/lib/suspend-engine";

const now = 1_000_000_000;
const baseCfg = { ...DEFAULT_CONFIG, idleThresholdMs: 60_000 };

function tab(p: Partial<TabInfo>): TabInfo {
  return {
    id: 1,
    url: "https://example.com/x",
    active: false,
    pinned: false,
    audible: false,
    discarded: false,
    lastActivityMs: now - 120_000,
    ...p,
  };
}

describe("hostMatches", () => {
  it("matches exact host", () => {
    expect(hostMatches("https://mail.google.com/", ["mail.google.com"])).toBe(true);
  });
  it("matches wildcard suffix", () => {
    expect(hostMatches("https://api.slack.com/", ["*.slack.com"])).toBe(true);
    expect(hostMatches("https://slack.com/", ["*.slack.com"])).toBe(true);
  });
  it("ignores invalid url", () => {
    expect(hostMatches(undefined, ["x"])).toBe(false);
    expect(hostMatches("not-a-url", ["x"])).toBe(false);
  });
});

describe("shouldSuspend", () => {
  it("suspends idle non-active tab", () => {
    expect(shouldSuspend(tab({}), now, baseCfg)).toBe(true);
  });
  it("skips active tab", () => {
    expect(shouldSuspend(tab({ active: true }), now, baseCfg)).toBe(false);
  });
  it("skips pinned when configured", () => {
    expect(shouldSuspend(tab({ pinned: true }), now, baseCfg)).toBe(false);
  });
  it("skips audible when configured", () => {
    expect(shouldSuspend(tab({ audible: true }), now, baseCfg)).toBe(false);
  });
  it("skips whitelisted host", () => {
    const cfg = { ...baseCfg, whitelist: ["example.com"] };
    expect(shouldSuspend(tab({}), now, cfg)).toBe(false);
  });
  it("skips chrome:// urls", () => {
    expect(shouldSuspend(tab({ url: "chrome://newtab" }), now, baseCfg)).toBe(false);
  });
  it("skips already discarded", () => {
    expect(shouldSuspend(tab({ discarded: true }), now, baseCfg)).toBe(false);
  });
  it("respects threshold", () => {
    expect(
      shouldSuspend(tab({ lastActivityMs: now - 10_000 }), now, baseCfg)
    ).toBe(false);
  });
});

describe("pickSuspendCandidates", () => {
  it("returns only suspendable tab ids", () => {
    const tabs: TabInfo[] = [
      tab({ id: 1 }),
      tab({ id: 2, active: true }),
      tab({ id: 3, pinned: true }),
      tab({ id: 4, lastActivityMs: now - 5_000 }),
    ];
    expect(pickSuspendCandidates(tabs, now, baseCfg)).toEqual([1]);
  });
});
