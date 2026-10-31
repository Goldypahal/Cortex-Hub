/**
 * Cortex Hub - PostgreSQL Database Seeder
 * Populates PostgreSQL 18 with 10 production AI components, tenant accounts, licenses, and telemetry
 */

import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { hashPassword, sha256 } from "../auth.js";
import { CATALOG_COMPONENTS } from "../../js/data/catalog-data.js";
import {
  MOCK_TENANT,
  MOCK_LICENSES,
  MOCK_API_KEYS,
  MOCK_CUSTOMIZATION_REQUESTS,
  MOCK_SUPPORT_TICKETS,
  MOCK_DAILY_USAGE
} from "../../js/data/mock-dashboard.js";

const prisma = new PrismaClient();

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

  // 4. Seed Licenses
  for (const lic of MOCK_LICENSES) {
    // Mock licenses carry no key, so seeded ones get a random demo key
    await prisma.legacyLicense.upsert({
      where: { id: lic.id },
      update: {},
      create: {
        id: lic.id,
        tenantId: tenant.id,
        componentId: lic.componentId,
        tier: lic.tier,
        licenseKey: lic.licenseKey || `LIC-DEMO-${randomBytes(6).toString("hex").toUpperCase()}`,
        status: lic.status,
        clusterTarget: lic.clusterTarget || lic.env,
        rateLimit: lic.rateLimit,
        startDate: new Date(lic.startDate)
      }
    });
  }
  console.log(`✅ Seeded ${MOCK_LICENSES.length} Cryptographic Licenses`);

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
  await seedDemoAccounts();

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
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
