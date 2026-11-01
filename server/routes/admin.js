/**
 * Cortex Hub - Platform administration API (SRS TRUST-04, ADM-02, ADM-03, 19)
 */

import { z } from "zod";
import { ah, audit, formatMoney, getCommissionRate, prisma, validate } from "../lib/common.js";
import { PLATFORM_ADMIN_ROLES, requirePlatformRole } from "../auth.js";

const MODERATORS = ["MODERATOR", ...PLATFORM_ADMIN_ROLES];
const FINANCE = ["FINANCE", ...PLATFORM_ADMIN_ROLES];

export function registerAdminRoutes(app) {
  // Moderation queue: products waiting for review, with their latest checklist
  app.get(
    "/api/admin/moderation",
    requirePlatformRole(...MODERATORS),
    ah(async (req, res) => {
      const products = await prisma.product.findMany({
        where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "PUBLISHED", "REJECTED"] }, moderations: { some: {} } },
        include: {
          seller: true,
          prices: { orderBy: { amountMinor: "asc" }, take: 1 },
          moderations: { orderBy: { createdAt: "desc" } }
        },
        orderBy: { updatedAt: "desc" },
        take: 100
      });
      res.json(
        products.map((p) => {
          const submit = p.moderations.find((m) => m.action === "SUBMIT");
          const decision = p.moderations.find((m) => ["APPROVE", "REJECT"].includes(m.action));
          return {
            id: p.slug,
            productId: p.slug,
            productName: p.name,
            productType: p.productType,
            category: p.businessCategory || "AI Component",
            sellerName: p.seller.displayName,
            sellerHandle: `@${p.seller.handle}`,
            price: p.prices[0] ? formatMoney(p.prices[0].amountMinor, p.prices[0].currency) : "—",
            submittedDate: (submit?.createdAt || p.createdAt).toISOString().split("T")[0],
            status: p.status === "PUBLISHED" ? "APPROVED" : p.status,
            checklist: submit?.checklist || {},
            resolutionReason: decision?.reason || null,
            specs: p.shortDesc
          };
        })
      );
    })
  );

  app.post(
    "/api/admin/moderation/:slug",
    requirePlatformRole(...MODERATORS),
    ah(async (req, res) => {
      const body = validate(
        z.object({ action: z.enum(["APPROVE", "REJECT"]), reason: z.string().trim().max(1000).optional() }),
        req.body,
        req,
        res
      );
      if (!body) return;
      const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
      if (!product || !["SUBMITTED", "UNDER_REVIEW"].includes(product.status)) {
        return res.status(404).json({ error: "No pending review for this product", requestId: req.requestId });
      }
      const approve = body.action === "APPROVE";
      const reason = body.reason || (approve ? "Approved by moderator" : "Changes requested");
      const updated = await prisma.product.update({
        where: { id: product.id },
        data: {
          status: approve ? "PUBLISHED" : "REJECTED",
          verificationStatus: approve ? "PLATFORM_REVIEWED" : product.verificationStatus,
          lastVersionDate: approve ? new Date() : product.lastVersionDate,
          moderations: { create: { action: body.action, reason, moderatorId: req.user.id } }
        }
      });
      await audit(req, `moderation.${body.action.toLowerCase()}`, { resourceId: product.id, before: { status: product.status }, after: { status: updated.status } });
      res.json({ success: true, item: { id: updated.slug, status: approve ? "APPROVED" : "REJECTED", resolutionReason: reason } });
    })
  );

  // Revenue from paid orders (INR settlement)
  app.get(
    "/api/admin/revenue",
    requirePlatformRole(...FINANCE),
    ah(async (req, res) => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [all, month, payoutsPaid, payoutsPending, sellers, byProduct] = await Promise.all([
        prisma.order.aggregate({
          where: { status: "PAID" },
          _sum: { totalAmountMinor: true, taxAmountMinor: true, platformFeeMinor: true, sellerNetMinor: true },
          _count: true
        }),
        prisma.order.aggregate({ where: { status: "PAID", createdAt: { gte: monthStart } }, _sum: { totalAmountMinor: true, taxAmountMinor: true } }),
        prisma.payout.aggregate({ where: { status: "PAID" }, _sum: { amountMinor: true } }),
        prisma.payout.aggregate({ where: { status: { in: ["PENDING", "PROCESSING"] } }, _sum: { amountMinor: true }, _count: true }),
        prisma.workspace.count({ where: { type: "SELLER", products: { some: { status: "PUBLISHED" } } } }),
        prisma.orderItem.groupBy({ by: ["productId"], where: { order: { status: "PAID" } }, _sum: { amountMinor: true }, _count: true })
      ]);

      const products = await prisma.product.findMany({ where: { id: { in: byProduct.map((b) => b.productId) } }, select: { id: true, name: true } });
      const gmvNet = (all._sum.totalAmountMinor || 0) - (all._sum.taxAmountMinor || 0);
      res.json({
        currency: "INR",
        commissionRate: await getCommissionRate(),
        paidOrders: all._count,
        gmvMinor: gmvNet,
        gstCollectedMinor: all._sum.taxAmountMinor || 0,
        platformFeesMinor: all._sum.platformFeeMinor || 0,
        sellerEarningsMinor: all._sum.sellerNetMinor || 0,
        monthGmvMinor: (month._sum.totalAmountMinor || 0) - (month._sum.taxAmountMinor || 0),
        payoutsPaidMinor: payoutsPaid._sum.amountMinor || 0,
        payoutsPendingMinor: payoutsPending._sum.amountMinor || 0,
        payoutsPendingCount: payoutsPending._count,
        activeSellers: sellers,
        byProduct: byProduct
          .map((b) => ({ product: products.find((p) => p.id === b.productId)?.name || b.productId, orders: b._count, revenueMinor: b._sum.amountMinor || 0 }))
          .sort((a, b) => b.revenueMinor - a.revenueMinor)
      });
    })
  );

  app.get("/api/admin/settings/commission", requirePlatformRole(...FINANCE), ah(async (req, res) => {
    res.json({ commissionRate: await getCommissionRate() });
  }));

  app.put(
    "/api/admin/settings/commission",
    requirePlatformRole(...PLATFORM_ADMIN_ROLES),
    ah(async (req, res) => {
      const body = validate(z.object({ commissionRate: z.number().min(0.05).max(0.3) }), req.body, req, res);
      if (!body) return;
      const before = await getCommissionRate();
      await prisma.platformSetting.upsert({
        where: { key: "commissionRate" },
        update: { value: body.commissionRate, updatedById: req.user.id },
        create: { key: "commissionRate", value: body.commissionRate, updatedById: req.user.id }
      });
      await audit(req, "settings.commission_updated", { before: { commissionRate: before }, after: body });
      res.json({ commissionRate: body.commissionRate });
    })
  );

  // Catalog price for checkout: updates the INR Price row of one tier
  app.put(
    "/api/admin/products/:slug/prices/:tier",
    requirePlatformRole(...PLATFORM_ADMIN_ROLES),
    ah(async (req, res) => {
      const body = validate(z.object({ amountInr: z.number().int().min(1).max(10000000) }), req.body, req, res);
      if (!body) return;
      const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
      const price = product && (await prisma.price.findFirst({ where: { productId: product.id, name: req.params.tier, currency: "INR" } }));
      if (!price || price.model === "CUSTOM") return res.status(404).json({ error: "Price tier not found", requestId: req.requestId });
      const updated = await prisma.price.update({ where: { id: price.id }, data: { amountMinor: body.amountInr * 100 } });
      if (price.name === (await prisma.price.findFirst({ where: { productId: product.id, currency: "INR" }, orderBy: { createdAt: "asc" } }))?.name) {
        // Keep the catalog card's display price in step with the first tier
        await prisma.component.updateMany({ where: { id: product.slug }, data: { inrPriceFormatted: formatMoney(updated.amountMinor, "INR").replace(/\.00$/, "") } });
      }
      await audit(req, "price.updated", { resourceId: price.id, before: { amountMinor: price.amountMinor }, after: { amountMinor: updated.amountMinor } });
      res.json({ tier: updated.name, amountMinor: updated.amountMinor, formatted: formatMoney(updated.amountMinor, "INR") });
    })
  );

  // Finance: payout requests
  app.get(
    "/api/admin/payouts",
    requirePlatformRole(...FINANCE),
    ah(async (req, res) => {
      const payouts = await prisma.payout.findMany({ include: { workspace: true }, orderBy: { createdAt: "desc" }, take: 100 });
      res.json(payouts.map((p) => ({ id: p.id, seller: p.workspace.name, amountMinor: p.amountMinor, method: p.method, status: p.status, date: p.createdAt })));
    })
  );

  app.post(
    "/api/admin/payouts/:id",
    requirePlatformRole(...FINANCE),
    ah(async (req, res) => {
      const body = validate(z.object({ status: z.enum(["PROCESSING", "PAID", "FAILED"]), reference: z.string().max(120).optional() }), req.body, req, res);
      if (!body) return;
      const payout = await prisma.payout.findUnique({ where: { id: req.params.id } });
      if (!payout || ["PAID", "FAILED"].includes(payout.status)) {
        return res.status(404).json({ error: "Open payout not found", requestId: req.requestId });
      }
      const updated = await prisma.$transaction(async (tx) => {
        if (body.status === "FAILED") {
          // Return the money to the seller's balance
          await tx.walletLedger.create({
            data: { workspaceId: payout.workspaceId, type: "ADJUSTMENT", amountMinor: payout.amountMinor, currency: payout.currency, reference: payout.id, note: "Payout failed: reversed" }
          });
        }
        return tx.payout.update({
          where: { id: payout.id },
          data: { status: body.status, providerPayoutId: body.reference, processedAt: body.status === "PAID" ? new Date() : null }
        });
      });
      await audit(req, "payout.updated", { workspaceId: payout.workspaceId, resourceId: payout.id, before: { status: payout.status }, after: { status: updated.status } });
      res.json({ id: updated.id, status: updated.status });
    })
  );
}
