import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import {
  createStore,
  addProduct,
  buildCheckoutPayload,
  verifyStripeSignature,
  handleCheckoutCompleted,
  consumeGrant,
  buildSignedUrl,
} from "../src/checkout.js";

function signStripePayload(payload, secret, t = Math.floor(Date.now() / 1000)) {
  const sig = crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  return `t=${t},v1=${sig}`;
}

describe("buildCheckoutPayload", () => {
  it("creates a Stripe Checkout session payload", () => {
    const product = { id: "p1", name: "Notion Template", priceCents: 1900, currency: "usd", s3Key: "templates/p1.zip" };
    const payload = buildCheckoutPayload(product, { baseUrl: "https://shop.test" });
    expect(payload.line_items[0].price_data.unit_amount).toBe(1900);
    expect(payload.metadata.product_id).toBe("p1");
  });
});

describe("verifyStripeSignature", () => {
  const secret = "whsec_test";
  it("accepts a valid signature", () => {
    const payload = JSON.stringify({ type: "ping" });
    const header = signStripePayload(payload, secret);
    expect(() => verifyStripeSignature(payload, header, secret)).not.toThrow();
  });
  it("rejects a tampered payload", () => {
    const payload = JSON.stringify({ type: "ping" });
    const header = signStripePayload(payload, secret);
    expect(() => verifyStripeSignature(payload + "x", header, secret)).toThrow(/mismatch/);
  });
  it("rejects an old timestamp", () => {
    const payload = JSON.stringify({ type: "ping" });
    const old = Math.floor(Date.now() / 1000) - 10_000;
    const header = signStripePayload(payload, secret, old);
    expect(() => verifyStripeSignature(payload, header, secret)).toThrow(/tolerance/);
  });
});

describe("end-to-end purchase", () => {
  it("issues a download grant on checkout completion and consumes it", () => {
    const store = createStore();
    addProduct(store, { id: "p1", name: "Pack", priceCents: 2900, s3Key: "files/pack.zip" });
    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          metadata: { product_id: "p1" },
          customer_details: { email: "buyer@test.com" },
          amount_total: 2900,
        },
      },
    };
    const { order, grant } = handleCheckoutCompleted(store, event);
    expect(order.email).toBe("buyer@test.com");
    expect(grant.token).toHaveLength(48);

    const c1 = consumeGrant(store, grant.token);
    expect(c1.ok).toBe(true);
    expect(c1.s3Key).toBe("files/pack.zip");
    expect(c1.usesLeft).toBe(4);

    const c2 = consumeGrant(store, "bogus");
    expect(c2.ok).toBe(false);
  });
});

describe("buildSignedUrl", () => {
  it("produces a URL with expires and signature params", () => {
    const url = buildSignedUrl("https://cdn.test", "files/pack.zip", "secret", 600);
    expect(url).toContain("expires=");
    expect(url).toMatch(/sig=[a-f0-9]{64}/);
  });
});
