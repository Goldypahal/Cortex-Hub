/**
 * Marketplace integration tests: checkout and payments, webhooks, seller wallet and
 * payouts, moderation, commission, sandbox. External services (Razorpay, Anthropic)
 * are stubbed at the fetch level; no real payments or model calls are made.
 */

import "./setup.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "crypto";
import { client, prisma, signedIn, useServer } from "./helpers.js";
import { sha256 } from "../server/auth.js";

useServer();

const realFetch = globalThis.fetch;
function stubFetch(handler) {
  globalThis.fetch = async (url, init) => {
    const u = String(url instanceof Request ? url.url : url);
    const stubbed = await handler(u, init);
    return stubbed || realFetch(url, init);
  };
}
function restoreFetch() {
  globalThis.fetch = realFetch;
}

async function registerBuyer() {
  const call = client();
  const res = await call("POST", "/api/auth/register", {
    name: "Checkout Tester",
    email: `buyer-${randomBytes(4).toString("hex")}@example.test`,
    password: "correct-horse-battery",
    workspaceName: "Checkout Co"
  });
  assert.equal(res.status, 201);
  return call;
}

test("simulated checkout: order, GST, idempotency, licence key, invoice", async () => {
  const buyer = await registerBuyer();
  const prices = await buyer("GET", "/api/products/doc-analyzer/prices");
  assert.equal(prices.status, 200);
  const tier = prices.body.prices.find((p) => p.model !== "CUSTOM");
  const custom = prices.body.prices.find((p) => p.model === "CUSTOM");

  assert.equal((await buyer("POST", "/api/checkout", { productSlug: "doc-analyzer", tier: custom.tier })).status, 400);

  const key = randomBytes(8).toString("hex");
  const order = await buyer("POST", "/api/checkout", { productSlug: "doc-analyzer", tier: tier.tier }, { "Idempotency-Key": key });
  assert.equal(order.status, 201);
  assert.equal(order.body.provider, "simulated");
  assert.equal(order.body.taxMinor, Math.round(tier.amountMinor * 0.18));
  assert.equal(order.body.totalMinor, tier.amountMinor + order.body.taxMinor);

  const replay = await buyer("POST", "/api/checkout", { productSlug: "doc-analyzer", tier: tier.tier }, { "Idempotency-Key": key });
  assert.equal(replay.body.orderId, order.body.orderId);
  assert.equal(replay.body.replayed, true);

  // Another buyer can neither confirm nor see this order's invoice
  const other = await registerBuyer();
  assert.equal((await other("POST", `/api/checkout/${order.body.orderId}/confirm`, {})).status, 404);

  const confirm = await buyer("POST", `/api/checkout/${order.body.orderId}/confirm`, {});
  assert.equal(confirm.status, 200);
  assert.equal(confirm.body.simulatedPayment, true);
  const licenseKey = confirm.body.licenseKeys[0].licenseKey;
  assert.match(licenseKey, /^LIC-DOCA-[0-9A-F]{6}-[0-9A-F]{6}$/);

  const again = await buyer("POST", `/api/checkout/${order.body.orderId}/confirm`, {});
  assert.equal(again.body.keysAlreadyIssued, true);
  assert.equal(again.body.licenseKeys.length, 0, "keys are issued exactly once");

  const ents = await buyer("GET", "/api/entitlements");
  assert.equal(ents.body.length, 1);
  assert.equal(ents.body[0].componentId, "doc-analyzer");
  assert.ok(licenseKey.startsWith(ents.body[0].licenseKeyPrefix));
  const days = (new Date(ents.body[0].expiresAt) - Date.now()) / 86400000;
  assert.ok(days > 29 && days <= 30, "monthly licence lasts 30 days");
  const stored = await prisma.entitlement.findUnique({ where: { id: ents.body[0].id } });
  assert.equal(stored.licenseKeyHash, sha256(licenseKey), "only the hash is stored");

  const invoice = await buyer("GET", `/api/invoices/${order.body.orderId}`);
  assert.equal(invoice.status, 200);
  assert.match(invoice.body, new RegExp(confirm.body.invoiceNumber));
  assert.match(invoice.body, /simulated payment/);
  assert.equal((await other("GET", `/api/invoices/${order.body.orderId}`)).status, 404);

  // Seller wallet got the sale and the platform fee
  const ledger = await prisma.walletLedger.findMany({ where: { reference: order.body.orderId } });
  assert.deepEqual(ledger.map((l) => l.type).sort(), ["FEE", "SALE"]);
  assert.equal(ledger.reduce((n, l) => n + l.amountMinor, 0), tier.amountMinor - Math.round(tier.amountMinor * 0.15));

  // Rotating the licence key replaces the stored hash
  const rotated = await buyer("POST", `/api/entitlements/${ents.body[0].id}/rotate-key`, {});
  assert.notEqual(rotated.body.licenseKey, licenseKey);
  const after = await prisma.entitlement.findUnique({ where: { id: ents.body[0].id } });
  assert.equal(after.licenseKeyHash, sha256(rotated.body.licenseKey));
});

test("razorpay checkout verifies the payment signature", async () => {
  process.env.RAZORPAY_KEY_ID = "rzp_test_key";
  process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret";
  let created;
  stubFetch(async (url, init) => {
    if (url === "https://api.razorpay.com/v1/orders") {
      created = JSON.parse(init.body);
      return new Response(JSON.stringify({ id: "order_rzp_1", amount: created.amount, currency: created.currency }), { status: 200 });
    }
    return null;
  });
  try {
    const buyer = await registerBuyer();
    const order = await buyer("POST", "/api/checkout", { productSlug: "rag-chatbot", tier: "Starter" });
    assert.equal(order.status, 201);
    assert.equal(order.body.provider, "razorpay");
    assert.equal(order.body.razorpay.orderId, "order_rzp_1");
    assert.equal(created.amount, order.body.totalMinor);
    assert.equal(created.currency, "INR");

    const payId = `pay_${randomBytes(4).toString("hex")}`;
    const forged = await buyer("POST", `/api/checkout/${order.body.orderId}/confirm`, {
      razorpay_order_id: "order_rzp_1",
      razorpay_payment_id: payId,
      razorpay_signature: "0".repeat(64)
    });
    assert.equal(forged.status, 400);
    assert.equal((await buyer("GET", "/api/entitlements")).body.length, 0);

    const signature = createHmac("sha256", "rzp_test_secret").update(`order_rzp_1|${payId}`).digest("hex");
    const ok = await buyer("POST", `/api/checkout/${order.body.orderId}/confirm`, {
      razorpay_order_id: "order_rzp_1",
      razorpay_payment_id: payId,
      razorpay_signature: signature
    });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.licenseKeys.length, 1);
    const payment = await prisma.payment.findFirst({ where: { orderId: order.body.orderId } });
    assert.equal(payment.providerPayId, payId);
  } finally {
    restoreFetch();
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
  }
});

test("razorpay webhook fulfils only correctly signed, matching payments", async () => {
  process.env.RAZORPAY_KEY_ID = "rzp_test_key";
  process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret";
  process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test";
  const rzpId = `order_wh_${randomBytes(4).toString("hex")}`;
  stubFetch(async (url, init) =>
    url === "https://api.razorpay.com/v1/orders" ? new Response(JSON.stringify({ id: rzpId, amount: JSON.parse(init.body).amount }), { status: 200 }) : null
  );
  try {
    const buyer = await registerBuyer();
    const order = await buyer("POST", "/api/checkout", { productSlug: "rag-chatbot", tier: "Starter" });
    const event = (amount) =>
      JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: `pay_${rzpId}`, order_id: rzpId, amount, currency: "INR" } } } });
    const sign = (body) => createHmac("sha256", "whsec_test").update(body).digest("hex");
    const anon = client();

    const unsigned = event(order.body.totalMinor);
    assert.equal((await anon("POST", "/api/webhooks/razorpay", unsigned, { "X-Razorpay-Signature": "bad" })).status, 400);

    const wrongAmount = event(1);
    assert.equal((await anon("POST", "/api/webhooks/razorpay", wrongAmount, { "X-Razorpay-Signature": sign(wrongAmount) })).status, 200);
    assert.equal((await prisma.order.findUnique({ where: { id: order.body.orderId } })).status, "PENDING");

    const good = event(order.body.totalMinor);
    assert.equal((await anon("POST", "/api/webhooks/razorpay", good, { "X-Razorpay-Signature": sign(good) })).status, 200);
    assert.equal((await prisma.order.findUnique({ where: { id: order.body.orderId } })).status, "PAID");
    // Replayed webhook does not issue a second entitlement
    await anon("POST", "/api/webhooks/razorpay", good, { "X-Razorpay-Signature": sign(good) });
    assert.equal(await prisma.entitlement.count({ where: { orderId: order.body.orderId } }), 1);
  } finally {
    restoreFetch();
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
  }
});

test("seller dashboard and payouts follow the ledger, hold and KYC rules", async () => {
  const seller = await signedIn("seller@apex-ai.test");
  const dash = await seller("GET", "/api/seller/dashboard");
  assert.equal(dash.status, 200);
  assert.equal(dash.body.currency, "INR");
  assert.ok(dash.body.grossMinor > 0, "seeded sale counted");
  assert.ok(dash.body.availableMinor > 0, "seeded sale past the hold");

  assert.equal((await seller("POST", "/api/seller/payouts", { amountMinor: 100 })).status, 400, "below minimum");
  assert.equal((await seller("POST", "/api/seller/payouts", { amountMinor: dash.body.availableMinor + 100 })).status, 400, "above balance");
  const payout = await seller("POST", "/api/seller/payouts", { amountMinor: 50000 });
  assert.equal(payout.status, 201);
  const after = await seller("GET", "/api/seller/dashboard");
  assert.equal(after.body.availableMinor, dash.body.availableMinor - 50000);

  // Finance marks it failed: the money goes back to the seller
  const admin = await signedIn("admin@cortex-hub.test");
  assert.equal((await admin("POST", `/api/admin/payouts/${payout.body.id}`, { status: "FAILED" })).status, 200);
  assert.equal((await seller("GET", "/api/seller/dashboard")).body.availableMinor, dash.body.availableMinor);

  // A new seller has not passed KYC
  const fresh = client();
  await fresh("POST", "/api/auth/register", {
    name: "New Seller",
    email: `seller-${randomBytes(4).toString("hex")}@example.test`,
    password: "correct-horse-battery",
    workspaceName: "New Seller Co",
    accountType: "SELLER"
  });
  assert.equal((await fresh("POST", "/api/seller/payouts", { amountMinor: 50000 })).status, 403);
});

test("moderation approval publishes a seller product to the catalog and checkout", async () => {
  const seller = await signedIn("seller@apex-ai.test");
  const name = `Moderated Agent ${randomBytes(3).toString("hex")}`;
  const sub = await seller("POST", "/api/seller/products", { name, shortDesc: "Agent submitted for moderation tests", basePriceInr: 1500 });
  const slug = sub.body.product.id;

  assert.ok(!(await client()("GET", "/api/components")).body.some((c) => c.id === slug), "hidden while under review");
  assert.equal((await seller("POST", `/api/admin/moderation/${slug}`, { action: "APPROVE" })).status, 403);

  const admin = await signedIn("admin@cortex-hub.test");
  const queue = await admin("GET", "/api/admin/moderation");
  assert.equal(queue.body.find((q) => q.id === slug).status, "UNDER_REVIEW");
  assert.equal((await admin("POST", `/api/admin/moderation/${slug}`, { action: "APPROVE" })).status, 200);

  const listed = (await client()("GET", "/api/components")).body.find((c) => c.id === slug);
  assert.equal(listed.name, name);
  assert.equal(listed.priceFormatted, "₹1,500");

  const buyer = await registerBuyer();
  const order = await buyer("POST", "/api/checkout", { productSlug: slug, tier: "Starter" });
  assert.equal(order.body.subtotalMinor, 150000);
  const done = await buyer("POST", `/api/checkout/${order.body.orderId}/confirm`, {});
  assert.equal(done.status, 200);
  const ent = (await buyer("GET", "/api/entitlements")).body[0];
  assert.equal(ent.expiresAt, null, "one-time licence does not expire");
});

test("commission rate is admin-only, validated, and used for new orders", async () => {
  const admin = await signedIn("admin@cortex-hub.test");
  const buyer = await registerBuyer();
  assert.equal((await buyer("PUT", "/api/admin/settings/commission", { commissionRate: 0.2 })).status, 403);
  assert.equal((await admin("PUT", "/api/admin/settings/commission", { commissionRate: 0.5 })).status, 400);
  assert.equal((await admin("PUT", "/api/admin/settings/commission", { commissionRate: 0.2 })).status, 200);
  try {
    const order = await buyer("POST", "/api/checkout", { productSlug: "rag-chatbot", tier: "Starter" });
    const stored = await prisma.order.findUnique({ where: { id: order.body.orderId } });
    assert.equal(stored.platformFeeMinor, Math.round(order.body.subtotalMinor * 0.2));
  } finally {
    await admin("PUT", "/api/admin/settings/commission", { commissionRate: 0.15 });
  }
});

test("sandbox: disabled without a key, streams answers with citations when configured, enforces quota", async () => {
  delete process.env.ANTHROPIC_API_KEY;
  const visitor = client();
  assert.equal((await visitor("GET", "/api/sandbox/status")).body.enabled, false);
  const body = { componentId: "rag-chatbot", scenarioId: "healthcare-protocol", question: "What is the maximum dose?" };
  assert.equal((await visitor("POST", "/api/sandbox/run", body)).status, 503);

  process.env.ANTHROPIC_API_KEY = "sk-ant-test";
  let sent;
  const sse = [
    ["message_start", { type: "message_start", message: { id: "msg_1", type: "message", role: "assistant", model: "claude-opus-5-5", content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 820, output_tokens: 1 } } }],
    ["content_block_start", { type: "content_block_start", index: 0, content_block: { type: "text", text: "", citations: [] } }],
    ["content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "citations_delta", citation: { type: "char_location", cited_text: "The maximum dose is 40 mg daily.", document_index: 0, document_title: "Sample", start_char_index: 10, end_char_index: 42 } } }],
    ["content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "The maximum dose " } }],
    ["content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "is 40 mg daily." } }],
    ["content_block_stop", { type: "content_block_stop", index: 0 }],
    ["message_delta", { type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 14 } }],
    ["message_stop", { type: "message_stop" }]
  ]
    .map(([e, d]) => `event: ${e}\ndata: ${JSON.stringify(d)}\n\n`)
    .join("");
  stubFetch(async (url, init) => {
    if (url.startsWith("https://api.anthropic.com/v1/messages")) {
      sent = { body: JSON.parse(init.body), headers: new Headers(init.headers) };
      return new Response(sse, { status: 200, headers: { "content-type": "text/event-stream", "request-id": "req_test" } });
    }
    return null;
  });
  try {
    const buyer = await signedIn("buyer@acme-health.test");
    const before = (await buyer("GET", "/api/sandbox/status")).body.usedToday;
    const res = await buyer("POST", "/api/sandbox/run", body);
    assert.equal(res.status, 200);
    const events = res.body
      .trim()
      .split("\n\n")
      .map((chunk) => ({ event: /^event: (.*)$/m.exec(chunk)[1], data: JSON.parse(/^data: (.*)$/m.exec(chunk)[1]) }));
    assert.equal(events.filter((e) => e.event === "text").map((e) => e.data.text).join(""), "The maximum dose is 40 mg daily.");
    const done = events.find((e) => e.event === "done").data;
    assert.equal(done.citations[0].citedText, "The maximum dose is 40 mg daily.");
    assert.equal(done.inputTokens, 820);
    assert.equal(done.outputTokens, 14);
    assert.equal(done.costUsd, Number(((820 * 4 + 14 * 20) / 1e6).toFixed(4)));

    // Request shape: sample document with citations, server-side fallback enabled
    const doc = sent.body.messages[0].content[0];
    assert.equal(doc.type, "document");
    assert.deepEqual(doc.citations, { enabled: true });
    assert.match(doc.source.data, /FICTIONAL SAMPLE DOCUMENT/);
    assert.equal(sent.body.model, "claude-opus-5-5");
    assert.equal(sent.body.fallbacks, "default");
    assert.match(sent.headers.get("anthropic-beta"), /server-side-fallback-2026-07-01/);

    assert.equal((await buyer("GET", "/api/sandbox/status")).body.usedToday, before + 1);
    const usage = await buyer("GET", "/api/usage/daily?days=1");
    assert.ok(usage.body[0].units >= 834, "sandbox tokens recorded as usage");

    // Input validation and daily quota
    assert.equal((await buyer("POST", "/api/sandbox/run", { ...body, document: { name: "a.txt", mediaType: "text/plain", data: "x" } })).status, 400);
    assert.equal((await buyer("POST", "/api/sandbox/run", { componentId: "rag-chatbot", question: "Hi there", document: { name: "a.pdf", mediaType: "application/pdf", data: "not base64!" } })).status, 400);
    const me = (await buyer("GET", "/api/auth/me")).body.user;
    const product = await prisma.product.findUnique({ where: { slug: "rag-chatbot" } });
    await prisma.sandboxRun.createMany({ data: Array.from({ length: 100 }, () => ({ productId: product.id, sessionToken: sha256(`user:${me.id}`) })) });
    assert.equal((await buyer("POST", "/api/sandbox/run", body)).status, 429);
    await prisma.sandboxRun.deleteMany({ where: { sessionToken: sha256(`user:${me.id}`), durationMs: null } });
  } finally {
    restoreFetch();
    delete process.env.ANTHROPIC_API_KEY;
  }
});

test("demo passwords are upgraded to Argon2id on login", async () => {
  await signedIn("buyer@acme-health.test");
  const user = await prisma.user.findUnique({ where: { email: "buyer@acme-health.test" } });
  assert.match(user.passwordHash, /^\$argon2id\$/);
});

test("Twilio status and sending are staff-only", async () => {
  const admin = await signedIn("admin@cortex-hub.test");
  const status = await admin("GET", "/api/twilio/status");
  assert.equal(status.status, 200);
  assert.equal(status.body.configured, false);
  assert.equal((await client()("GET", "/api/twilio/status")).status, 401);
});
