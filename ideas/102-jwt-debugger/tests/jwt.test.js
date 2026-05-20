import { describe, it, expect } from "vitest";
import { SignJWT } from "jose";
import { decodeJwt, inspectClaims, verifyJwt } from "../src/jwt.js";

const secret = new TextEncoder().encode("super-secret-key-1234567890");

async function makeToken(claims = {}, expSec = "2h") {
  return new SignJWT({ role: "admin", ...claims })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer("acme")
    .setSubject("user-1")
    .setExpirationTime(expSec)
    .sign(secret);
}

describe("decodeJwt", () => {
  it("decodes header and payload without a key", async () => {
    const token = await makeToken();
    const out = decodeJwt(token);
    expect(out.header.alg).toBe("HS256");
    expect(out.payload.role).toBe("admin");
    expect(out.payload.iss).toBe("acme");
  });

  it("returns an error for malformed tokens", () => {
    expect(decodeJwt("not.a.jwt.token").error).toBeDefined();
    expect(decodeJwt("onlyonesegment").error).toBeDefined();
  });
});

describe("inspectClaims", () => {
  it("flags expired tokens", () => {
    const out = inspectClaims({ exp: 1000 }, 2000);
    expect(out.expired).toBe(true);
    expect(out.active).toBe(false);
  });

  it("reports active tokens with positive ttl", () => {
    const out = inspectClaims({ exp: 5000, iss: "acme" }, 1000);
    expect(out.active).toBe(true);
    expect(out.expiresInSec).toBe(4000);
    expect(out.issuer).toBe("acme");
  });
});

describe("verifyJwt", () => {
  it("verifies a correctly signed HS256 token", async () => {
    const token = await makeToken();
    const out = await verifyJwt(token, { kind: "secret", secret: "super-secret-key-1234567890" });
    expect(out.valid).toBe(true);
    expect(out.payload.sub).toBe("user-1");
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await makeToken();
    const out = await verifyJwt(token, { kind: "secret", secret: "wrong-secret" });
    expect(out.valid).toBe(false);
  });
});
