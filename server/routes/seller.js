/**
 * Cortex Hub - Seller Studio API (SRS SELL-01..05, 18-20, 24)
 * Figures come from the WalletLedger (double entry) and Orders; nothing is typed in.
 */

import { z } from "zod";
import { ah, audit, prisma, validate } from "../lib/common.js";
import { requireWorkspace } from "../auth.js";

const CURRENCY = "INR";
const PAYOUT_HOLD_DAYS = 7; // SRS SELL-05: 7-day hold before funds become available
const MIN_PAYOUT_MINOR = Number(process.env.PAYOUT_MINIMUM_INR_PAISE || 50000); // ₹500

const PRODUCT_TYPES = [
  "APPLICATION",
  "AI_AGENT",
  "API",
  "RAG_SYSTEM",
  "MODEL",
  "LORA",
  "EMBEDDING_MODEL",
  "RERANKER",
  "MCP_SERVER",
  "PYTHON_PACKAGE",
  "NPM_PACKAGE",
  "WORKFLOW",
  "DATASET",
  "CUSTOM_SERVICE",
  "PROMPT_PACK"
];

async function sellerProfileFor(workspace) {
  return prisma.sellerProfile.upsert({
    where: { workspaceId: workspace.id },
    update: {},
    create: { workspaceId: workspace.id, handle: workspace.slug, displayName: workspace.name }
  });
}

async function walletSummary(workspaceId) {
  const holdCutoff = new Date(Date.now() - PAYOUT_HOLD_DAYS * 24 * 60 * 60 * 1000);
  const [byType, matured, recent] = await Promise.all([
    prisma.walletLedger.groupBy({
      by: ["type"],
      where: { workspaceId, currency: CURRENCY },
      _sum: { amountMinor: true }
    }),
    prisma.walletLedger.aggregate({
      where: {
        workspaceId,
        currency: CURRENCY,
        OR: [{ createdAt: { lte: holdCutoff } }, { type: { in: ["PAYOUT", "ADJUSTMENT"] } }]
      },
      _sum: { amountMinor: true }
    }),
    prisma.walletLedger.aggregate({
      where: {
        workspaceId,
        currency: CURRENCY,
        createdAt: { gt: holdCutoff },
        type: { in: ["SALE", "FEE", "REFUND"] }
      },
      _sum: { amountMinor: true }
    })
  ]);
  const sum = (type) => byType.find((t) => t.type === type)?._sum.amountMinor || 0;
  return {
    grossMinor: sum("SALE"),
    feesMinor: -sum("FEE"),
    refundsMinor: -sum("REFUND"),
    paidOutMinor: -sum("PAYOUT"),
    availableMinor: Math.max(0, matured._sum.amountMinor || 0),
    pendingMinor: recent._sum.amountMinor || 0
  };
}

export function registerSellerRoutes(app) {
  app.get(
    "/api/seller/dashboard",
    requireWorkspace("SELLER"),
    ah(async (req, res) => {
      const ws = req.workspace;
      const profile = await sellerProfileFor(ws);
      const [products, wallet, payouts] = await Promise.all([
        prisma.product.findMany({
          where: { workspaceId: ws.id },
          include: {
            versions: { where: { isLatest: true }, orderBy: { publishedAt: "desc" }, take: 1 },
            orderItems: { where: { order: { status: "PAID" } }, select: { amountMinor: true } },
            _count: { select: { sandboxRuns: true } }
          },
          orderBy: { createdAt: "desc" }
        }),
        walletSummary(ws.id),
        prisma.payout.findMany({ where: { workspaceId: ws.id }, orderBy: { createdAt: "desc" }, take: 20 })
      ]);

      const productIds = products.map((p) => p.id);
      const [checkouts, purchases] = await Promise.all([
        prisma.order.count({ where: { items: { some: { productId: { in: productIds } } } } }),
        prisma.order.count({ where: { status: "PAID", items: { some: { productId: { in: productIds } } } } })
      ]);
      const views = products.reduce((n, p) => n + p.viewCount, 0);
      const demoRuns = products.reduce((n, p) => n + p._count.sandboxRuns, 0);

      res.json({
        currency: CURRENCY,
        handle: profile.handle,
        displayName: profile.displayName,
        organization: profile.organization,
        bio: profile.bio || "",
        verifiedLevel: profile.verifiedLevel,
        kycPassed: profile.kycPassed,
        website: profile.website,
        github: profile.github,
        totalSalesCount: purchases,
        averageRating: profile.averageRating,
        ...wallet,
        payoutHoldDays: PAYOUT_HOLD_DAYS,
        minPayoutMinor: MIN_PAYOUT_MINOR,
        funnel: { productViews: views, demoRuns, checkouts, purchases },
        products: products.map((p) => ({
          id: p.slug,
          name: p.name,
          category: p.businessCategory || p.technicalCategory || "AI Component",
          productType: p.productType,
          status: p.status,
          version: p.versions[0] ? `v${p.versions[0].version.replace(/^v/, "")}` : "v1.0.0",
          salesCount: p.orderItems.length,
          grossMinor: p.orderItems.reduce((n, i) => n + i.amountMinor, 0),
          rating: p.ratingCount ? p.rating : null,
          downloads: p.downloadCount,
          lastUpdated: p.updatedAt
        })),
        payoutHistory: payouts.map((p) => ({
          id: p.id,
          date: p.createdAt,
          amountMinor: p.amountMinor,
          method: p.method,
          status: p.status
        }))
      });
    })
  );

  // Product submission: persisted as Product (UNDER_REVIEW) + version + prices + moderation record
  app.post(
    "/api/seller/products",
    requireWorkspace("SELLER"),
    ah(async (req, res) => {
      const body = validate(
        z.object({
          name: z.string().trim().min(3).max(120),
          version: z.string().trim().max(30).default("1.0.0"),
          category: z.string().trim().max(80).default("Generative AI"),
          productType: z.enum(PRODUCT_TYPES).default("AI_AGENT"),
          shortDesc: z.string().trim().min(10).max(300),
          longDesc: z.string().trim().max(5000).default(""),
          targetBuyer: z.string().trim().max(200).optional(),
          licenseType: z.string().trim().max(100).default("Commercial Permissive"),
          basePriceInr: z.coerce.number().int().min(100).max(10000000),
          framework: z.string().trim().max(100).optional(),
          hardware: z.string().trim().max(200).optional(),
          benchmark: z.string().trim().max(200).optional()
        }),
        req.body,
        req,
        res
      );
      if (!body) return;

      const profile = await sellerProfileFor(req.workspace);
      const base = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);
      let slug = base || "product";
      for (let n = 2; await prisma.product.findUnique({ where: { slug } }); n++) slug = `${base}-${n}`;

      const product = await prisma.product.create({
        data: {
          workspaceId: req.workspace.id,
          sellerId: profile.id,
          name: body.name,
          slug,
          shortDesc: body.shortDesc,
          longDesc: body.longDesc || body.shortDesc,
          businessCategory: body.category,
          productType: body.productType,
          status: "UNDER_REVIEW",
          licenseType: body.licenseType,
          prerequisites: body.targetBuyer,
          hardwareReqs: body.hardware ? { summary: body.hardware, framework: body.framework || null } : undefined,
          // Seller-reported until the platform's own eval runs (TRUST-02)
          benchmarks: body.benchmark ? { sellerReported: body.benchmark } : undefined,
          versions: { create: { version: body.version.replace(/^v/i, ""), changelog: "Initial submission" } },
          prices: {
            create: [
              { name: "Starter", model: "ONE_TIME", amountMinor: body.basePriceInr * 100, currency: CURRENCY },
              {
                name: "Pro",
                model: "ONE_TIME",
                amountMinor: Math.round(body.basePriceInr * 2.5) * 100,
                currency: CURRENCY
              }
            ]
          },
          moderations: {
            create: {
              action: "SUBMIT",
              checklist: {
                malwareScan: "PENDING (automated scanning not yet implemented)",
                licenseCompliance: `PENDING (${body.licenseType}: manual review)`,
                documentation: "PENDING (manual review)",
                sandboxIntegrity: "PENDING (automated scanning not yet implemented)"
              }
            }
          }
        }
      });
      await audit(req, "product.submitted", { workspaceId: req.workspace.id, resourceId: product.id });
      res.status(201).json({ product: { id: product.slug, name: product.name, status: product.status } });
    })
  );

  app.post(
    "/api/seller/payouts",
    requireWorkspace("SELLER"),
    ah(async (req, res) => {
      const body = validate(
        z.object({
          amountMinor: z.number().int().positive(),
          method: z.enum(["bank_transfer", "razorpay", "stripe_connect"]).default("bank_transfer")
        }),
        req.body,
        req,
        res
      );
      if (!body) return;

      const profile = await sellerProfileFor(req.workspace);
      if (!profile.kycPassed) {
        return res.status(403).json({
          error: "Complete identity and bank verification (KYC) before requesting payouts",
          requestId: req.requestId
        });
      }
      if (body.amountMinor < MIN_PAYOUT_MINOR) {
        return res
          .status(400)
          .json({ error: `Minimum payout is ₹${MIN_PAYOUT_MINOR / 100}`, requestId: req.requestId });
      }

      // Check the balance and debit it in one transaction so two requests cannot overdraw
      const payout = await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${req.workspace.id}))`;
        const wallet = await walletSummary(req.workspace.id);
        if (body.amountMinor > wallet.availableMinor) return null;
        const created = await tx.payout.create({
          data: {
            workspaceId: req.workspace.id,
            amountMinor: body.amountMinor,
            currency: CURRENCY,
            method: body.method,
            status: "PENDING"
          }
        });
        await tx.walletLedger.create({
          data: {
            workspaceId: req.workspace.id,
            type: "PAYOUT",
            amountMinor: -body.amountMinor,
            currency: CURRENCY,
            reference: created.id,
            note: "Payout requested"
          }
        });
        return created;
      });
      if (!payout) return res.status(400).json({ error: "Amount exceeds available balance", requestId: req.requestId });

      await audit(req, "payout.requested", { workspaceId: req.workspace.id, resourceId: payout.id });
      res.status(201).json({
        id: payout.id,
        amountMinor: payout.amountMinor,
        status: payout.status,
        method: payout.method,
        date: payout.createdAt
      });
    })
  );
}
