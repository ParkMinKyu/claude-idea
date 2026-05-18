// Digital goods checkout MVP — handles Stripe Checkout session creation,
// webhook verification, and signed download URL generation.

import crypto from "node:crypto";

// In-memory store stand-in. Replace with Postgres in production.
export function createStore() {
  return {
    products: new Map(),
    orders: new Map(),
    grants: new Map(),
  };
}

export function addProduct(store, product) {
  if (!product.id || !product.s3Key || typeof product.priceCents !== "number") {
    throw new Error("product requires id, s3Key, priceCents");
  }
  store.products.set(product.id, product);
  return product;
}

export function buildCheckoutPayload(product, opts = {}) {
  const successUrl = opts.successUrl ?? `${opts.baseUrl}/thanks?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = opts.cancelUrl ?? `${opts.baseUrl}/p/${product.id}`;
  return {
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: product.currency ?? "usd",
          product_data: { name: product.name, description: product.description ?? "" },
          unit_amount: product.priceCents,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { product_id: product.id, ...(opts.metadata ?? {}) },
  };
}

// Verifies a Stripe webhook signature using the v1 scheme.
// Returns the parsed event on success, throws on failure.
export function verifyStripeSignature(payload, header, secret, toleranceSec = 300, nowSec = Math.floor(Date.now() / 1000)) {
  if (!header) throw new Error("Missing signature header");
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const idx = kv.indexOf("=");
      return [kv.slice(0, idx), kv.slice(idx + 1)];
    })
  );
  const timestamp = Number(parts.t);
  const sig = parts.v1;
  if (!timestamp || !sig) throw new Error("Malformed signature header");
  if (Math.abs(nowSec - timestamp) > toleranceSec) throw new Error("Signature timestamp outside tolerance");
  const signed = `${timestamp}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signed).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(sig, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error("Signature mismatch");
  }
  return JSON.parse(payload);
}

export function handleCheckoutCompleted(store, event) {
  if (event.type !== "checkout.session.completed") return null;
  const session = event.data.object;
  const productId = session.metadata?.product_id;
  const product = store.products.get(productId);
  if (!product) throw new Error(`Unknown product_id ${productId}`);
  const order = {
    id: session.id,
    productId,
    email: session.customer_details?.email ?? session.customer_email,
    amount: session.amount_total,
    createdAt: new Date().toISOString(),
  };
  store.orders.set(order.id, order);
  const grant = issueDownloadGrant(store, order.id, productId);
  return { order, grant };
}

export function issueDownloadGrant(store, orderId, productId, ttlSec = 86_400) {
  const token = crypto.randomBytes(24).toString("hex");
  const grant = {
    token,
    orderId,
    productId,
    expiresAt: Math.floor(Date.now() / 1000) + ttlSec,
    used: 0,
  };
  store.grants.set(token, grant);
  return grant;
}

export function consumeGrant(store, token, maxUses = 5) {
  const grant = store.grants.get(token);
  if (!grant) return { ok: false, reason: "not_found" };
  if (grant.expiresAt < Math.floor(Date.now() / 1000)) return { ok: false, reason: "expired" };
  if (grant.used >= maxUses) return { ok: false, reason: "exhausted" };
  grant.used += 1;
  const product = store.products.get(grant.productId);
  return { ok: true, s3Key: product.s3Key, usesLeft: maxUses - grant.used };
}

// Build a signed S3-style URL (HMAC) — independent of AWS SDK for testability.
export function buildSignedUrl(baseUrl, s3Key, secret, ttlSec = 900, nowSec = Math.floor(Date.now() / 1000)) {
  const expires = nowSec + ttlSec;
  const toSign = `${s3Key}|${expires}`;
  const sig = crypto.createHmac("sha256", secret).update(toSign).digest("hex");
  return `${baseUrl}/${s3Key}?expires=${expires}&sig=${sig}`;
}
