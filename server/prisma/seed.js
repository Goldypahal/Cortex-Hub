/**
 * Cortex Hub - PostgreSQL Database Seeder
 * Populates PostgreSQL 18 with 10 production AI components, tenant accounts, licenses, and telemetry
 */

import "dotenv/config";
import { randomBytes } from "crypto";
import { hashPassword, sha256 } from "../auth.js";
import { prisma } from "../lib/common.js";
import { fulfilOrder } from "../routes/commerce.js";
import { CATALOG_COMPONENTS } from "../../js/data/catalog-data.js";
import {
  MOCK_TENANT,
  MOCK_LICENSES,
  MOCK_API_KEYS,
  MOCK_CUSTOMIZATION_REQUESTS,
  MOCK_SUPPORT_TICKETS
} from "../../js/data/mock-dashboard.js";

async function main() {
  console.log("🌱 Starting Cortex Hub PostgreSQL Database Seed...");

  // 1. Seed Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "acme-health" },
    update: {},
    create: {
      id: MOCK_TENANT.id || "tnt-8849-acme",
      slug: "acme-health",
      name: MOCK_TENANT.name,
      tier: MOCK_TENANT.tier,
      role: MOCK_TENANT.role,
      monthlyTokenQuota: BigInt(10000000)
    }
  });
  console.log(`✅ Seeded Tenant: ${tenant.name} (${tenant.id})`);

  // 2. Seed 10 Production Components
  for (const c of CATALOG_COMPONENTS) {
    await prisma.component.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        category: c.category,
        categoryBadge: c.categoryBadge || "badge-indigo",
        version: c.version,
        shortDesc: c.shortDesc,
        longDesc: c.longDesc,
        coreOutput: c.coreOutput,
        targetBuyer: c.targetBuyer,
        basePrice: c.basePrice,
        priceFormatted: c.priceFormatted,
        inrPriceFormatted: c.inrPriceFormatted,
        tags: c.tags,
        features: c.features,
        pricingTiers: c.pricingTiers,
        architecture: c.architecture,
        codeSnippets: c.codeSnippets,
        published: true
      },
      create: {
        id: c.id,
        name: c.name,
        category: c.category,
        categoryBadge: c.categoryBadge || "badge-indigo",
        version: c.version,
        shortDesc: c.shortDesc,
        longDesc: c.longDesc,
        coreOutput: c.coreOutput,
        targetBuyer: c.targetBuyer,
        basePrice: c.basePrice,
        priceFormatted: c.priceFormatted,
        inrPriceFormatted: c.inrPriceFormatted,
        tags: c.tags,
        features: c.features,
        pricingTiers: c.pricingTiers,
        architecture: c.architecture,
        codeSnippets: c.codeSnippets,
        published: true
      }
    });
  }
  console.log(`✅ Seeded ${CATALOG_COMPONENTS.length} Production AI Engines`);

  // 3. Seed Customization Requests
  for (const req of MOCK_CUSTOMIZATION_REQUESTS) {
    await prisma.legacyCustomizationRequest.upsert({
      where: { id: req.id },
      update: {
        status: req.status,
        statusStep: req.statusStep,
        estimatedPrice: req.estimatedPrice,
        timelineLog: req.timelineLog
      },
      create: {
        id: req.id,
        tenantId: tenant.id,
        componentId: req.componentId,
        tenantName: req.tenantName,
        componentName: req.componentName,
        scope: req.scope,
        industry: req.industry,
        deploymentTarget: req.deploymentTarget,
        estimatedPrice: req.estimatedPrice,
        priceInr: req.priceInr || "₹0",
        targetDelivery: req.targetDelivery,
        status: req.status,
        statusStep: req.statusStep || 1,
        timelineLog: req.timelineLog || []
      }
    });
  }
  console.log(`✅ Seeded ${MOCK_CUSTOMIZATION_REQUESTS.length} Customization Pipeline Requests`);

  // 5. Seed API Keys
  for (const k of MOCK_API_KEYS) {
    await prisma.legacyApiKey.upsert({
      where: { id: k.id },
      update: {},
      create: {
        id: k.id,
        tenantId: tenant.id,
        name: k.name,
        prefix: k.prefix,
        keyHash: sha256(randomBytes(24).toString("hex")), // demo key: raw value never exists
        status: k.status,
        environment: k.environment,
        monthlySpend: k.monthlySpend,
        lastUsed: new Date()
      }
    });
  }
  console.log(`✅ Seeded ${MOCK_API_KEYS.length} API Keys`);

  // 6. Seed Support Tickets
  for (const t of MOCK_SUPPORT_TICKETS) {
    await prisma.legacySupportTicket.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        tenantId: tenant.id,
        subject: t.subject,
        priority: t.priority,
        status: t.status,
        lastActivity: t.lastActivity,
        messages: t.messages || []
      }
    });
  }
  console.log(`✅ Seeded ${MOCK_SUPPORT_TICKETS.length} Support Tickets`);

  // 7. Seed Workspaces & Demo Accounts (SRS v3.0 AUTH)
  // The buyer workspace shares the tenant's slug so legacy data maps onto it.
  const workspaces = await seedDemoAccounts();

  // 8. Marketplace: seller workspaces, Products and INR Prices for the catalog
  await seedMarketplace(workspaces);

  // 9. Demo purchases for Acme Health, through the same fulfilment code as live checkout
  await seedDemoOrders(workspaces);

  console.log("✨ PostgreSQL Database Seeding Complete!");
}

async function seedDemoAccounts() {
  const workspaces = [
    { type: "BUYER", name: MOCK_TENANT.name, slug: "acme-health" },
    { type: "SELLER", name: "Apex AI Labs", slug: "apex-ai" },
    { type: "PLATFORM", name: "Cortex Hub Operations", slug: "cortex-platform" }
  ];
  const accounts = [
    { email: "buyer@acme-health.test", name: "Acme Health Buyer", globalRole: "BUYER", workspace: "acme-health" },
    { email: "seller@apex-ai.test", name: "Apex AI Seller", globalRole: "SELLER", workspace: "apex-ai" },
    { email: "admin@cortex-hub.test", name: "Platform Admin", globalRole: "ADMIN", workspace: "cortex-platform" }
  ];

  const bySlug = {};
  for (const w of workspaces) {
    bySlug[w.slug] = await prisma.workspace.upsert({ where: { slug: w.slug }, update: {}, create: w });
  }

  // Passwords are never hard-coded: set SEED_DEMO_PASSWORD, or one is generated and printed once.
  const password = process.env.SEED_DEMO_PASSWORD || randomBytes(12).toString("base64url");
  const created = [];
  for (const a of accounts) {
    const existing = await prisma.user.findUnique({ where: { email: a.email } });
    if (existing) continue;
    await prisma.user.create({
      data: {
        email: a.email,
        name: a.name,
        globalRole: a.globalRole,
        emailVerified: true,
        passwordHash: await hashPassword(password),
        memberships: { create: { workspaceId: bySlug[a.workspace].id, role: "OWNER" } }
      }
    });
    created.push(a.email);
  }

  if (created.length > 0) {
    console.log(`✅ Created demo accounts: ${created.join(", ")}`);
    if (!process.env.SEED_DEMO_PASSWORD) console.log(`   Demo password (shown once): ${password}`);
  } else {
    console.log("✅ Demo accounts already exist (passwords unchanged)");
  }
  return bySlug;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function seedMarketplace(workspaces) {
  for (const c of CATALOG_COMPONENTS) {
    const sellerName = c.sellerName || "Apex AI Labs";
    const sellerSlug = sellerName === "Apex AI Labs" ? "apex-ai" : slugify(sellerName);
    const ws =
      workspaces[sellerSlug] ||
      (workspaces[sellerSlug] = await prisma.workspace.upsert({
        where: { slug: sellerSlug },
        update: {},
        create: { type: "SELLER", name: sellerName, slug: sellerSlug }
      }));
    const seller = await prisma.sellerProfile.upsert({
      where: { workspaceId: ws.id },
      update: {},
      create: {
        workspaceId: ws.id,
        handle: sellerSlug,
        displayName: sellerName,
        bio: c.sellerBio || null,
        verifiedLevel: "PLATFORM_REVIEWED",
        // Only the demo seller account can request payouts; others have not done KYC
        kycPassed: sellerSlug === "apex-ai"
      }
    });

    const existing = await prisma.product.findUnique({ where: { slug: c.id } });
    if (existing) continue;

    // INR prices per tier, scaled from the catalog's USD tiers by its own USD/INR base pair
    const usdBase = c.basePrice;
    const inrBase = Number(String(c.inrPriceFormatted).replace(/[^0-9]/g, ""));
    const ratio = inrBase / usdBase;
    const prices = c.pricingTiers.map((t) => {
      const usd = Number(String(t.price).replace(/[^0-9]/g, ""));
      if (!usd) return { name: t.name, model: "CUSTOM", amountMinor: 0, currency: "INR" };
      const inr = usd === usdBase ? inrBase : Math.round((usd * ratio) / 100) * 100;
      return { name: t.name, model: "SUBSCRIPTION", interval: "MONTH", amountMinor: inr * 100, currency: "INR" };
    });

    await prisma.product.create({
      data: {
        workspaceId: ws.id,
        sellerId: seller.id,
        name: c.name,
        slug: c.id,
        shortDesc: c.shortDesc,
        longDesc: c.longDesc,
        businessCategory: c.category,
        productType: c.productType || "AI_AGENT",
        status: "PUBLISHED",
        verificationStatus: "PLATFORM_REVIEWED",
        tags: c.tags || [],
        features: c.features || [],
        lastVersionDate: new Date(),
        versions: { create: { version: String(c.version || "1.0.0").replace(/^v/, ""), changelog: "Catalog import" } },
        prices: { create: prices }
      }
    });
  }
  console.log(`✅ Seeded marketplace products and INR prices for ${CATALOG_COMPONENTS.length} catalog engines`);
}

async function seedDemoOrders(workspaces) {
  const buyerWs = workspaces["acme-health"];
  const buyer = await prisma.user.findUnique({ where: { email: "buyer@acme-health.test" } });
  if (!buyerWs || !buyer) return;
  if (await prisma.order.count({ where: { workspaceId: buyerWs.id } })) {
    console.log("✅ Demo orders already exist");
    return;
  }

  for (const lic of MOCK_LICENSES) {
    const product = await prisma.product.findUnique({
      where: { slug: lic.componentId },
      include: { prices: { orderBy: { amountMinor: "asc" } } }
    });
    const price = product?.prices.find((p) => p.model !== "CUSTOM");
    if (!price) continue;
    const tax = Math.round(price.amountMinor * 0.18);
    const fee = Math.round(price.amountMinor * 0.15);
    const order = await prisma.order.create({
      data: {
        workspaceId: buyerWs.id,
        buyerUserId: buyer.id,
        totalAmountMinor: price.amountMinor + tax,
        taxAmountMinor: tax,
        platformFeeMinor: fee,
        sellerNetMinor: price.amountMinor - fee,
        currency: "INR",
        status: "PENDING",
        paymentProvider: "seed",
        items: {
          create: {
            productId: product.id,
            priceId: price.id,
            licenseTier: price.name,
            amountMinor: price.amountMinor,
            currency: "INR"
          }
        }
      }
    });
    await fulfilOrder(order.id, { provider: "seed", providerPayId: `seed_${order.id.slice(0, 8)}` });
    // Backdate demo sales past the 7-day payout hold so the demo seller has an available balance
    const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await prisma.walletLedger.updateMany({ where: { reference: order.id }, data: { createdAt: past } });
  }
  console.log(`✅ Seeded ${MOCK_LICENSES.length} demo purchases (provider "seed", no payment)`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
