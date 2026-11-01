/**
 * Cortex Hub - Checkout, payments, entitlements and invoices (SRS BILL-01..05, BUY-04)
 *
 * Settlement currency is INR (Razorpay) with 18% GST. Without Razorpay keys a
 * "simulated" provider is available outside production so the flow can be
 * exercised end to end; it never runs when NODE_ENV=production.
 */

import express from "express";
import { randomBytes } from "crypto";
import { z } from "zod";
import {
  GST_RATE,
  IS_PRODUCTION,
  ah,
  audit,
  formatMoney,
  getCommissionRate,
  newLicenseKey,
  prisma,
  validate
} from "../lib/common.js";
import { isPlatformRole, requireWorkspace, sha256 } from "../auth.js";
import {
  createRazorpayOrder,
  isRazorpayConfigured,
  razorpayKeyId,
  verifyPaymentSignature,
  verifyWebhookSignature
} from "../services/razorpay.js";

const CURRENCY = "INR";

// --------------------------------------------------------------------------
// Fulfilment: idempotent, safe to call from both the browser confirmation and the webhook
// --------------------------------------------------------------------------
export async function fulfilOrder(orderId, { provider, providerPayId }) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({ where: { id: orderId, status: "PENDING" }, data: { status: "PAID" } });
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true, price: true } } }
    });
    if (claimed.count === 0) return { order, issuedKeys: [], alreadyFulfilled: order?.status === "PAID" };

    await tx.payment.create({
      data: {
        orderId,
        amountMinor: order.totalAmountMinor,
        currency: order.currency,
        provider,
        providerPayId,
        status: "CAPTURED",
        capturedAt: new Date()
      }
    });

    const issuedKeys = [];
    for (const item of order.items) {
      const licenseKey = newLicenseKey(item.product.slug);
      const latestVersion = await tx.productVersion.findFirst({
        where: { productId: item.productId, isLatest: true },
        orderBy: { publishedAt: "desc" }
      });
      const entitlement = await tx.entitlement.create({
        data: {
          workspaceId: order.workspaceId,
          productId: item.productId,
          orderId,
          versionId: latestVersion?.id,
          licenseKeyHash: sha256(licenseKey),
          licenseKeyPrefix: licenseKey.slice(0, 15),
          licenseTier: item.licenseTier,
          apiAccess: true,
          apiQuota: 100000,
          // Monthly licences cover 30 days; renewal is a new purchase until subscriptions ship
          expiresAt: item.price.interval === "MONTH" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
        }
      });
      issuedKeys.push({ entitlementId: entitlement.id, productName: item.product.name, licenseKey });

      // Seller wallet (double entry): gross sale credit, platform fee debit
      const fee = Math.round(
        item.amountMinor * (order.platformFeeMinor / Math.max(1, order.totalAmountMinor - order.taxAmountMinor))
      );
      await tx.walletLedger.createMany({
        data: [
          {
            workspaceId: item.product.workspaceId,
            type: "SALE",
            amountMinor: item.amountMinor,
            currency: order.currency,
            reference: orderId,
            note: item.product.name
          },
          {
            workspaceId: item.product.workspaceId,
            type: "FEE",
            amountMinor: -fee,
            currency: order.currency,
            reference: orderId,
            note: "Platform commission"
          }
        ]
      });
      await tx.product.update({ where: { id: item.productId }, data: { activeInstalls: { increment: 1 } } });
      await tx.sellerProfile.update({
        where: { id: item.product.sellerId },
        data: { totalSalesCount: { increment: 1 } }
      });
    }

    const now = new Date();
    await tx.invoice.create({
      data: {
        orderId,
        workspaceId: order.workspaceId,
        invoiceNumber: `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${randomBytes(3).toString("hex").toUpperCase()}`,
        amountMinor: order.totalAmountMinor,
        taxMinor: order.taxAmountMinor,
        currency: order.currency,
        hsnSacCode: process.env.INVOICE_SAC_CODE || null
      }
    });

    return { order: { ...order, status: "PAID" }, issuedKeys, alreadyFulfilled: false };
  });
}

async function loadOwnOrder(req, res) {
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
  if (!order || order.workspaceId !== req.workspace.id) {
    res.status(404).json({ error: "Order not found", requestId: req.requestId });
    return null;
  }
  return order;
}

function entitlementView(e) {
  const version = e.product.versions?.[0];
  return {
    id: e.id,
    componentId: e.product.slug,
    componentName: e.product.name,
    sellerName: e.product.seller?.displayName,
    version: version ? `v${version.version.replace(/^v/, "")}` : null,
    tier: e.licenseTier,
    licenseKeyPrefix: e.licenseKeyPrefix,
    apiQuota: e.apiQuota,
    apiUsed: e.apiUsed,
    status: e.expiresAt && e.expiresAt < new Date() ? "EXPIRED" : e.status,
    purchasedAt: e.createdAt,
    expiresAt: e.expiresAt,
    orderId: e.orderId,
    invoiceNumber: e.order?.invoice?.invoiceNumber || null,
    totalPaid: e.order ? formatMoney(e.order.totalAmountMinor, e.order.currency) : null,
    downloadAvailable: false
  };
}

const entitlementInclude = {
  product: {
    include: {
      seller: true,
      versions: { where: { isLatest: true }, orderBy: { publishedAt: "desc" }, take: 1 }
    }
  },
  order: { include: { invoice: true } }
};

// --------------------------------------------------------------------------
// Routes
// --------------------------------------------------------------------------
export function registerCommerceRoutes(app) {
  // Razorpay webhook needs the raw body for signature verification, so it is
  // registered before express.json() by server.js via this exported handler.

  // Public price list for a product (what checkout will charge)
  app.get(
    "/api/products/:slug/prices",
    ah(async (req, res) => {
      const product = await prisma.product.findUnique({
        where: { slug: req.params.slug },
        include: { prices: { where: { isActive: true }, orderBy: { amountMinor: "asc" } } }
      });
      if (!product || product.status !== "PUBLISHED") {
        return res.status(404).json({ error: "Product not found", requestId: req.requestId });
      }
      res.json({
        product: { slug: product.slug, name: product.name },
        gstRate: GST_RATE,
        prices: product.prices.map((p) => ({
          id: p.id,
          tier: p.name,
          model: p.model,
          amountMinor: p.amountMinor,
          currency: p.currency,
          formatted: p.model === "CUSTOM" ? "Custom quote" : formatMoney(p.amountMinor, p.currency)
        }))
      });
    })
  );

  // Payment configuration the browser needs (no secrets)
  app.get("/api/checkout/config", (req, res) => {
    res.json({
      provider: isRazorpayConfigured() ? "razorpay" : IS_PRODUCTION ? "unavailable" : "simulated",
      currency: CURRENCY,
      gstRate: GST_RATE
    });
  });

  app.post(
    "/api/checkout",
    requireWorkspace("BUYER"),
    ah(async (req, res) => {
      const body = validate(
        z.object({ productSlug: z.string().min(1).max(64), tier: z.string().min(1).max(60) }),
        req.body,
        req,
        res
      );
      if (!body) return;

      const idempotencyKey = req.get("idempotency-key");
      if (idempotencyKey) {
        const existing = await prisma.order.findUnique({ where: { idempotencyKey } });
        if (existing) {
          if (existing.workspaceId !== req.workspace.id) {
            return res.status(409).json({ error: "Idempotency key already used", requestId: req.requestId });
          }
          return res.json({
            orderId: existing.id,
            status: existing.status,
            provider: existing.paymentProvider,
            replayed: true
          });
        }
      }

      const product = await prisma.product.findUnique({ where: { slug: body.productSlug } });
      if (!product || product.status !== "PUBLISHED") {
        return res.status(404).json({ error: "Product not found", requestId: req.requestId });
      }
      const price = await prisma.price.findFirst({
        where: { productId: product.id, name: body.tier, currency: CURRENCY, isActive: true }
      });
      if (!price) return res.status(404).json({ error: "Price tier not found", requestId: req.requestId });
      if (price.model === "CUSTOM") {
        return res.status(400).json({
          error: "This tier is quoted on request. Submit a customization request instead.",
          requestId: req.requestId
        });
      }

      const useRazorpay = isRazorpayConfigured();
      if (!useRazorpay && IS_PRODUCTION) {
        return res.status(503).json({ error: "Payments are not configured", requestId: req.requestId });
      }

      const rate = await getCommissionRate();
      const subtotal = price.amountMinor;
      const tax = Math.round(subtotal * GST_RATE);
      const fee = Math.round(subtotal * rate);

      const order = await prisma.order.create({
        data: {
          workspaceId: req.workspace.id,
          buyerUserId: req.user.id,
          totalAmountMinor: subtotal + tax,
          taxAmountMinor: tax,
          platformFeeMinor: fee,
          sellerNetMinor: subtotal - fee,
          currency: CURRENCY,
          status: "PENDING",
          paymentProvider: useRazorpay ? "razorpay" : "simulated",
          idempotencyKey: idempotencyKey || null,
          items: {
            create: {
              productId: product.id,
              priceId: price.id,
              licenseTier: price.name,
              amountMinor: subtotal,
              currency: CURRENCY
            }
          }
        }
      });

      const summary = {
        orderId: order.id,
        provider: order.paymentProvider,
        productName: product.name,
        tier: price.name,
        currency: CURRENCY,
        subtotalMinor: subtotal,
        taxMinor: tax,
        totalMinor: subtotal + tax,
        subtotal: formatMoney(subtotal),
        tax: formatMoney(tax),
        total: formatMoney(subtotal + tax)
      };

      if (useRazorpay) {
        try {
          const rzpOrder = await createRazorpayOrder({
            amountMinor: order.totalAmountMinor,
            currency: CURRENCY,
            receipt: order.id.slice(0, 40),
            notes: { orderId: order.id, workspaceId: req.workspace.id }
          });
          await prisma.order.update({ where: { id: order.id }, data: { providerOrderId: rzpOrder.id } });
          summary.razorpay = {
            keyId: razorpayKeyId(),
            orderId: rzpOrder.id,
            amount: order.totalAmountMinor,
            currency: CURRENCY,
            name: "Cortex Hub",
            description: `${product.name} (${price.name})`,
            prefill: { name: req.user.name, email: req.user.email }
          };
        } catch (err) {
          console.error(`[checkout] ${req.requestId}:`, err.message);
          await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
          return res
            .status(502)
            .json({ error: "Could not start payment. Please try again.", requestId: req.requestId });
        }
      }

      await audit(req, "order.created", { workspaceId: req.workspace.id, resourceId: order.id });
      res.status(201).json(summary);
    })
  );

  app.post(
    "/api/checkout/:orderId/confirm",
    requireWorkspace("BUYER"),
    ah(async (req, res) => {
      const order = await loadOwnOrder(req, res);
      if (!order) return;

      let providerPayId;
      if (order.paymentProvider === "razorpay") {
        const body = validate(
          z.object({
            razorpay_payment_id: z.string().min(1).max(100),
            razorpay_order_id: z.string().min(1).max(100),
            razorpay_signature: z.string().min(1).max(200)
          }),
          req.body,
          req,
          res
        );
        if (!body) return;
        const valid =
          body.razorpay_order_id === order.providerOrderId &&
          verifyPaymentSignature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature);
        if (!valid) {
          await audit(req, "payment.signature_invalid", { workspaceId: req.workspace.id, resourceId: order.id });
          return res.status(400).json({ error: "Payment could not be verified", requestId: req.requestId });
        }
        providerPayId = body.razorpay_payment_id;
      } else if (order.paymentProvider === "simulated") {
        if (IS_PRODUCTION)
          return res.status(400).json({ error: "Simulated payments are disabled", requestId: req.requestId });
        providerPayId = `sim_${randomBytes(8).toString("hex")}`;
      } else {
        return res.status(400).json({ error: "Order cannot be confirmed", requestId: req.requestId });
      }

      const result = await fulfilOrder(order.id, { provider: order.paymentProvider, providerPayId });
      if (!result.order || (result.order.status !== "PAID" && !result.alreadyFulfilled)) {
        return res
          .status(409)
          .json({ error: `Order is ${result.order?.status || "unknown"}`, requestId: req.requestId });
      }
      await audit(req, "order.paid", { workspaceId: req.workspace.id, resourceId: order.id });
      const invoice = await prisma.invoice.findUnique({ where: { orderId: order.id } });
      res.json({
        orderId: order.id,
        status: "PAID",
        simulatedPayment: order.paymentProvider === "simulated",
        invoiceNumber: invoice?.invoiceNumber,
        // Raw keys are returned exactly once. If the webhook fulfilled first, rotate the key to get a new one.
        licenseKeys: result.issuedKeys,
        keysAlreadyIssued: result.alreadyFulfilled
      });
    })
  );

  app.get(
    "/api/orders",
    requireWorkspace("BUYER"),
    ah(async (req, res) => {
      const orders = await prisma.order.findMany({
        where: { workspaceId: req.workspace.id },
        include: { items: { include: { product: { select: { name: true, slug: true } } } }, invoice: true },
        orderBy: { createdAt: "desc" }
      });
      res.json(
        orders.map((o) => ({
          id: o.id,
          status: o.status,
          total: formatMoney(o.totalAmountMinor, o.currency),
          createdAt: o.createdAt,
          invoiceNumber: o.invoice?.invoiceNumber || null,
          items: o.items.map((i) => ({ product: i.product.name, slug: i.product.slug, tier: i.licenseTier }))
        }))
      );
    })
  );

  app.get(
    "/api/entitlements",
    requireWorkspace("BUYER"),
    ah(async (req, res) => {
      const entitlements = await prisma.entitlement.findMany({
        where: { workspaceId: req.workspace.id },
        include: entitlementInclude,
        orderBy: { createdAt: "desc" }
      });
      res.json(entitlements.map(entitlementView));
    })
  );

  // Issue a new key for an entitlement (old key stops working); the new key is shown once
  app.post(
    "/api/entitlements/:id/rotate-key",
    requireWorkspace("BUYER"),
    ah(async (req, res) => {
      const ent = await prisma.entitlement.findUnique({ where: { id: req.params.id }, include: { product: true } });
      if (!ent || ent.workspaceId !== req.workspace.id) {
        return res.status(404).json({ error: "Entitlement not found", requestId: req.requestId });
      }
      const licenseKey = newLicenseKey(ent.product.slug);
      await prisma.entitlement.update({
        where: { id: ent.id },
        data: { licenseKeyHash: sha256(licenseKey), licenseKeyPrefix: licenseKey.slice(0, 15) }
      });
      await audit(req, "entitlement.key_rotated", { workspaceId: req.workspace.id, resourceId: ent.id });
      res.json({ entitlementId: ent.id, licenseKey });
    })
  );

  // Printable invoice (HTML; the browser's print dialog saves it as PDF)
  app.get(
    "/api/invoices/:orderId",
    ah(async (req, res) => {
      if (!req.user) return res.status(401).json({ error: "Authentication required", requestId: req.requestId });
      const order = await prisma.order.findUnique({
        where: { id: req.params.orderId },
        include: { invoice: true, workspace: true, items: { include: { product: { include: { seller: true } } } } }
      });
      const isMember = order && req.user.memberships.some((m) => m.workspaceId === order.workspaceId);
      const isFinance = isPlatformRole(req.user, ["FINANCE", "ADMIN", "SUPERADMIN"]);
      if (!order || !order.invoice || !(isMember || isFinance)) {
        return res.status(404).json({ error: "Invoice not found", requestId: req.requestId });
      }
      res.type("html").send(renderInvoice(order));
    })
  );
}

export function razorpayWebhookHandler() {
  return [
    express.raw({ type: "application/json", limit: "1mb" }),
    ah(async (req, res) => {
      const signature = req.get("x-razorpay-signature");
      if (!Buffer.isBuffer(req.body) || !verifyWebhookSignature(req.body, signature)) {
        return res.status(400).json({ error: "Invalid signature", requestId: req.requestId });
      }
      const event = JSON.parse(req.body.toString("utf8"));
      const payment = event.payload?.payment?.entity;
      if (["payment.captured", "order.paid"].includes(event.event) && payment?.order_id) {
        const order = await prisma.order.findFirst({ where: { providerOrderId: payment.order_id } });
        if (order && order.totalAmountMinor === payment.amount && order.currency === payment.currency) {
          await fulfilOrder(order.id, { provider: "razorpay", providerPayId: payment.id });
        } else if (order) {
          console.error(`[webhook] amount/currency mismatch for order ${order.id}`);
        }
      }
      res.json({ received: true });
    })
  ];
}

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

function renderInvoice(order) {
  const inv = order.invoice;
  const rows = order.items
    .map(
      (i) =>
        `<tr><td>${esc(i.product.name)}<br><small>${esc(i.licenseTier)} licence, sold by ${esc(i.product.seller.displayName)}</small></td><td class="num">${esc(formatMoney(i.amountMinor, i.currency))}</td></tr>`
    )
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Invoice ${esc(inv.invoiceNumber)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 16px;color:#111}h1{font-size:22px}table{width:100%;border-collapse:collapse;margin-top:24px}td,th{padding:10px 0;border-bottom:1px solid #ddd;text-align:left}.num{text-align:right}.total td{font-weight:700;border-bottom:none}small{color:#555}.meta{color:#444;line-height:1.6}@media print{button{display:none}}</style></head>
<body><button onclick="window.print()">Print / Save as PDF</button>
<h1>Tax invoice ${esc(inv.invoiceNumber)}</h1>
<div class="meta">Issued ${esc(inv.issuedAt.toISOString().slice(0, 10))}<br>Billed to: ${esc(order.workspace.name)}<br>Order: ${esc(order.id)}${inv.hsnSacCode ? `<br>SAC: ${esc(inv.hsnSacCode)}` : ""}${inv.gstNumber ? `<br>Buyer GSTIN: ${esc(inv.gstNumber)}` : ""}</div>
<table><thead><tr><th>Item</th><th class="num">Amount</th></tr></thead><tbody>${rows}
<tr><td>GST (18%)</td><td class="num">${esc(formatMoney(order.taxAmountMinor, order.currency))}</td></tr>
<tr class="total"><td>Total paid</td><td class="num">${esc(formatMoney(order.totalAmountMinor, order.currency))}</td></tr></tbody></table>
${order.paymentProvider === "simulated" ? "<p><strong>Test order: simulated payment, no money was taken.</strong></p>" : ""}
</body></html>`;
}
