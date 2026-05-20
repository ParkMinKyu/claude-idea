import { describe, it, expect } from "vitest";
import { normalizeHeaders, parseDirectives } from "../src/headers.js";
import { SECURITY_RULES } from "../src/rules.js";
import { analyzeHeaders, grade } from "../src/analyze.js";

const STRONG = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'self'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "geolocation=()",
};

const WEAK = {
  "Strict-Transport-Security": "max-age=300",
  "Content-Security-Policy": "default-src 'self' 'unsafe-inline'",
  Server: "Apache/2.4.1",
};

describe("normalizeHeaders", () => {
  it("lowercases keys and joins arrays", () => {
    const h = normalizeHeaders({ "X-Foo": "bar", "Set-Cookie": ["a", "b"] });
    expect(h["x-foo"]).toBe("bar");
    expect(h["set-cookie"]).toBe("a, b");
  });
  it("supports Headers-like objects", () => {
    const headers = new Map([["X-Test", "1"]]);
    headers.entries = Map.prototype.entries.bind(headers);
    expect(normalizeHeaders(headers)["x-test"]).toBe("1");
  });
});

describe("parseDirectives", () => {
  it("parses max-age and flags", () => {
    const d = parseDirectives("max-age=63072000; includeSubDomains; preload");
    expect(d["max-age"]).toBe("63072000");
    expect(d.includesubdomains).toBe(true);
    expect(d.preload).toBe(true);
  });
});

describe("rules", () => {
  it("all rules produce a finding for empty headers", () => {
    const findings = SECURITY_RULES.map((r) => r({}));
    expect(findings.length).toBe(SECURITY_RULES.length);
    expect(findings.every((f) => f.present === false)).toBe(true);
  });
});

describe("analyzeHeaders", () => {
  it("grades a fully-hardened site as A", () => {
    const report = analyzeHeaders(STRONG);
    expect(report.score).toBe(100);
    expect(report.grade).toBe("A");
    expect(report.disclosures).toEqual([]);
  });

  it("penalizes weak HSTS, unsafe CSP, missing headers and disclosure", () => {
    const report = analyzeHeaders(WEAK);
    expect(report.score).toBeLessThan(60);
    expect(report.disclosures.some((d) => d.header === "server")).toBe(true);
    const hsts = report.findings.find((f) => f.header === "Strict-Transport-Security");
    expect(hsts.points).toBeLessThan(hsts.max);
  });

  it("grade boundaries", () => {
    expect(grade(95)).toBe("A");
    expect(grade(85)).toBe("B");
    expect(grade(40)).toBe("F");
  });
});
