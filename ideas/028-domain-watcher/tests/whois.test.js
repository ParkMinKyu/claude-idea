import { describe, it, expect } from "vitest";
import { isValidDomain, parseWhois, expiryAlertTier, detectChange } from "../src/whois.js";

describe("isValidDomain", () => {
  it("accepts standard domains", () => {
    expect(isValidDomain("example.com")).toBe(true);
    expect(isValidDomain("sub.example.co.kr")).toBe(true);
  });
  it("rejects malformed", () => {
    expect(isValidDomain("no_dot")).toBe(false);
    expect(isValidDomain("-bad.com")).toBe(false);
    expect(isValidDomain("a..b.com")).toBe(false);
  });
});

describe("parseWhois", () => {
  it("detects available when 'no match'", () => {
    expect(parseWhois("No match for domain freebie.com\n").status).toBe("available");
  });
  it("parses expiration date", () => {
    const out = parseWhois(`
Domain Name: example.com
Registrar: ICANN
Registry Expiry Date: 2027-08-13T04:00:00Z
    `.trim());
    expect(out.status).toBe("active");
    expect(out.registrar).toBe("ICANN");
    expect(out.expiresAt).toMatch(/^2027-08-13/);
  });
  it("returns unknown when nothing parseable", () => {
    expect(parseWhois("garbage").status).toBe("unknown");
  });
});

describe("expiryAlertTier", () => {
  const now = new Date("2026-05-18T00:00:00Z");
  it("returns 30d tier", () => {
    expect(expiryAlertTier(new Date("2026-06-10T00:00:00Z"), now)).toBe("30d");
  });
  it("returns 7d tier", () => {
    expect(expiryAlertTier(new Date("2026-05-22T00:00:00Z"), now)).toBe("7d");
  });
  it("returns 1d tier", () => {
    expect(expiryAlertTier(new Date("2026-05-18T20:00:00Z"), now)).toBe("1d");
  });
  it("expired in past", () => {
    expect(expiryAlertTier(new Date("2026-05-01T00:00:00Z"), now)).toBe("expired");
  });
  it("null beyond 30d", () => {
    expect(expiryAlertTier(new Date("2027-01-01T00:00:00Z"), now)).toBeNull();
  });
});

describe("detectChange", () => {
  it("flags newly available", () => {
    expect(detectChange({ status: "active" }, { status: "available" })).toBe("available");
  });
  it("flags newly registered", () => {
    expect(detectChange({ status: "available" }, { status: "active" })).toBe("registered");
  });
  it("flags expiry change", () => {
    expect(
      detectChange(
        { status: "active", expiresAt: "2027-01-01" },
        { status: "active", expiresAt: "2028-01-01" },
      ),
    ).toBe("expiry_changed");
  });
  it("returns null when nothing changed", () => {
    expect(
      detectChange(
        { status: "active", expiresAt: "2027-01-01" },
        { status: "active", expiresAt: "2027-01-01" },
      ),
    ).toBeNull();
  });
});
