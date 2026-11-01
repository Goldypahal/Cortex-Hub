/**
 * Cortex Hub - Razorpay payments (SRS BILL-02)
 * Orders API + Checkout signature and webhook verification. Card data never
 * touches our servers: the buyer pays inside Razorpay Checkout.
 */

import { createHmac, timingSafeEqual } from "crypto";

const API_BASE = "https://api.razorpay.com/v1";

function keys() {
  return {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || ""
  };
}

export function isRazorpayConfigured() {
  const { keyId, keySecret } = keys();
  return Boolean(keyId && keySecret);
}

export function razorpayKeyId() {
  return keys().keyId;
}

/** Creates a Razorpay order. amountMinor is in paise for INR. */
export async function createRazorpayOrder({ amountMinor, currency, receipt, notes }) {
  const { keyId, keySecret } = keys();
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ amount: amountMinor, currency, receipt, notes })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Razorpay order creation failed (HTTP ${res.status}): ${data.error?.description || "unknown error"}`
    );
  }
  return data;
}

function safeEqualHex(expectedHex, givenHex) {
  if (typeof givenHex !== "string") return false;
  const a = Buffer.from(expectedHex, "utf8");
  const b = Buffer.from(givenHex, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Checkout success handler signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret) */
export function verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, signature) {
  const expected = createHmac("sha256", keys().keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook signature: HMAC_SHA256(raw request body, webhook_secret) */
export function verifyWebhookSignature(rawBody, signature) {
  const { webhookSecret } = keys();
  if (!webhookSecret) return false;
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
