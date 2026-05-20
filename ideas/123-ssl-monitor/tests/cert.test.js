import { describe, it, expect } from "vitest";
import {
  daysUntilExpiry,
  classifyExpiry,
  parseSan,
  matchHost,
  hostCovered,
  isWeakSignature,
  evaluateCert,
} from "../src/cert.js";
import { monitor } from "../src/monitor.js";

const NOW = new Date("2026-05-20T00:00:00Z");

function certIn(days, extra = {}) {
  const notAfter = new Date(NOW.getTime() + days * 86_400_000);
  return {
    valid_from: "2026-01-01T00:00:00Z",
    valid_to: notAfter.toISOString(),
    subject: { CN: "example.com" },
    issuer: { O: "Let's Encrypt" },
    subjectaltname: "DNS:example.com, DNS:*.example.com",
    sigalg: "sha256WithRSAEncryption",
    ...extra,
  };
}

describe("expiry math", () => {
  it("computes days remaining", () => {
    expect(daysUntilExpiry(certIn(45), NOW)).toBe(45);
    expect(daysUntilExpiry(certIn(-3), NOW)).toBe(-3);
  });
  it("classifies by thresholds", () => {
    expect(classifyExpiry(45)).toBe("ok");
    expect(classifyExpiry(20)).toBe("warning");
    expect(classifyExpiry(5)).toBe("critical");
    expect(classifyExpiry(-1)).toBe("expired");
  });
});

describe("hostname matching", () => {
  it("parses SAN DNS entries", () => {
    expect(parseSan("DNS:a.com, DNS:b.com, IP:1.2.3.4")).toEqual(["a.com", "b.com"]);
  });
  it("matches exact and single-label wildcard", () => {
    expect(matchHost("api.example.com", "*.example.com")).toBe(true);
    expect(matchHost("example.com", "*.example.com")).toBe(false);
    expect(matchHost("a.b.example.com", "*.example.com")).toBe(false);
    expect(matchHost("example.com", "example.com")).toBe(true);
  });
  it("hostCovered uses SAN and CN", () => {
    expect(hostCovered(certIn(30), "api.example.com")).toBe(true);
    expect(hostCovered(certIn(30), "other.org")).toBe(false);
  });
});

describe("weak signature", () => {
  it("flags sha1 and md5", () => {
    expect(isWeakSignature(certIn(30, { sigalg: "sha1WithRSAEncryption" }))).toBe(true);
    expect(isWeakSignature(certIn(30))).toBe(false);
  });
});

describe("evaluateCert", () => {
  it("returns healthy for a good far-future cert", () => {
    const r = evaluateCert(certIn(60), "example.com", { now: NOW });
    expect(r.healthy).toBe(true);
    expect(r.status).toBe("ok");
    expect(r.issues).toEqual([]);
  });
  it("collects mismatch + weak-signature issues", () => {
    const r = evaluateCert(certIn(60, { sigalg: "sha1WithRSAEncryption" }), "wrong.org", { now: NOW });
    expect(r.issues).toContain("hostname-mismatch");
    expect(r.issues).toContain("weak-signature");
    expect(r.healthy).toBe(false);
  });
});

describe("monitor", () => {
  it("aggregates alerts and summary", () => {
    const report = monitor(
      [
        { host: "example.com", cert: certIn(60) },
        { host: "soon.example.com", cert: certIn(5) },
        { host: "dead.example.com", cert: certIn(-1) },
      ],
      { now: NOW }
    );
    expect(report.summary.ok).toBe(1);
    expect(report.summary.critical).toBe(1);
    expect(report.summary.expired).toBe(1);
    expect(report.alerts.length).toBe(2);
  });
});
