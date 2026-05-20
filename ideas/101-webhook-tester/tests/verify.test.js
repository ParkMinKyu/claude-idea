import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifySignature, inspectRequest, signPayload } from "../src/verify.js";

const secret = "whsec_test";
const body = JSON.stringify({ event: "ping", n: 1 });

describe("verifySignature github", () => {
  it("accepts a correct sha256 signature", () => {
    const header = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
    const out = verifySignature("github", {
      rawBody: body,
      headers: { "x-hub-signature-256": header },
      secret,
    });
    expect(out.valid).toBe(true);
  });

  it("rejects a tampered body", () => {
    const header = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
    const out = verifySignature("github", {
      rawBody: body + "tampered",
      headers: { "x-hub-signature-256": header },
      secret,
    });
    expect(out.valid).toBe(false);
  });
});

describe("verifySignature stripe", () => {
  it("accepts a fresh, correctly signed payload", () => {
    const header = signPayload("stripe", body, secret);
    const out = verifySignature("stripe", {
      rawBody: body,
      headers: { "stripe-signature": header },
      secret,
    });
    expect(out.valid).toBe(true);
  });

  it("rejects a malformed stripe-signature header", () => {
    const out = verifySignature("stripe", {
      rawBody: body,
      headers: { "stripe-signature": "garbage" },
      secret,
    });
    expect(out.valid).toBe(false);
    expect(out.reason).toMatch(/malformed/);
  });
});

describe("inspectRequest", () => {
  it("parses JSON bodies", () => {
    const info = inspectRequest({
      method: "POST",
      headers: { "content-type": "application/json" },
      rawBody: body,
    });
    expect(info.bodyKind).toBe("json");
    expect(info.parsedBody.event).toBe("ping");
    expect(info.sizeBytes).toBeGreaterThan(0);
  });

  it("flags invalid JSON", () => {
    const info = inspectRequest({
      method: "POST",
      headers: { "content-type": "application/json" },
      rawBody: "{not json",
    });
    expect(info.bodyKind).toBe("invalid-json");
  });
});
