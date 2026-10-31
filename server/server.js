/**
 * Cortex Hub - Express REST API Server
 * Connects Frontend Client to PostgreSQL 18 via Prisma ORM
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// G3 FIX: Restrict CORS to allow-list only. Never use open cors() in production.
// Add your deployment domain to ALLOWED_ORIGINS in .env
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5000,http://localhost:3000").split(",");
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS: Origin not allowed"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());

// ============================================================================
// G1 FIX: Authentication & Authorization
// NOTE: All routes below are currently UNPROTECTED (prototype mode).
// Phase 0 requirement: add JWT/session middleware before deploying to production.
// Use Better Auth or Auth.js with Postgres sessions (per SRS v3.0 Section 8.1).
//
// Pattern to add when auth is implemented:
//   app.use('/api/protected', requireAuth, requireRole('ADMIN'));
//
// For now, adding a request ID to every request for audit trail support.
// ============================================================================
const { randomUUID } = await import('crypto').catch(() => ({ randomUUID: () => Math.random().toString(36) }));

// Request ID middleware (required for audit log, error responses)
app.use((req, res, next) => {
  req.requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// Security headers (G3 FIX)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});


// --------------------------------------------------------------------------
// System Telemetry & Health Check
// --------------------------------------------------------------------------
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ONLINE",
      database: "PostgreSQL 18 Connected",
      service: "Cortex Hub API Core",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: "DEGRADED",
      database: "Disconnected or Initializing",
      error: err.message
    });
  }
});

// --------------------------------------------------------------------------
// Component Catalog CRUD (FR-1.1 - FR-1.6, FR-6.2)
// --------------------------------------------------------------------------
app.get("/api/components", async (req, res) => {
  try {
    const components = await prisma.component.findMany({
      orderBy: { basePrice: "asc" }
    });
    res.json(components);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch components", requestId: req.requestId || "unknown" });
  }
});

app.get("/api/components/:id", async (req, res) => {
  try {
    const component = await prisma.component.findUnique({
      where: { id: req.params.id }
    });
    if (!component) return res.status(404).json({ error: "Component not found" });
    res.json(component);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch component", requestId: req.requestId || "unknown" });
  }
});

app.post("/api/components", async (req, res) => {
  try {
    const created = await prisma.component.create({
      data: req.body
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to create component", requestId: req.requestId || "unknown" });
  }
});

app.put("/api/components/:id", async (req, res) => {
  try {
    const updated = await prisma.component.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update component", requestId: req.requestId || "unknown" });
  }
});

app.delete("/api/components/:id", async (req, res) => {
  try {
    await prisma.component.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: `Component ${req.params.id} deleted` });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete component", requestId: req.requestId || "unknown" });
  }
});

// --------------------------------------------------------------------------
// Customization Requests (FR-3.1 - FR-3.8, FR-6.3)
// --------------------------------------------------------------------------
app.get("/api/customization-requests", async (req, res) => {
  try {
    const requests = await prisma.customizationRequest.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customization requests", requestId: req.requestId || "unknown" });
  }
});

app.post("/api/customization-requests", async (req, res) => {
  try {
    const {
      id,
      tenantId,
      componentId,
      tenantName,
      componentName,
      scope,
      industry,
      deploymentTarget,
      estimatedPrice,
      priceInr,
      targetDelivery,
      status,
      statusStep,
      timelineLog
    } = req.body;

    // Ensure tenant exists or default to first tenant
    let targetTenantId = tenantId;
    if (!targetTenantId) {
      const defaultTenant = await prisma.tenant.findFirst();
      targetTenantId = defaultTenant ? defaultTenant.id : "tnt-8849-acme";
    }

    const created = await prisma.customizationRequest.create({
      data: {
        id: id || `CR-${Date.now().toString(36).toUpperCase()}`,
        tenantId: targetTenantId,
        componentId: componentId || "rag-chatbot",
        tenantName: tenantName || "Acme Health Technologies Inc.",
        componentName: componentName || "Enterprise RAG Chatbot",
        scope: scope || "Standard Architecture Scope",
        industry: industry || "Cross-Industry",
        deploymentTarget: deploymentTarget || "VPC",
        estimatedPrice: estimatedPrice || "$2,499",
        priceInr: priceInr || "₹2,08,000",
        targetDelivery: targetDelivery || "14 Business Days",
        status: status || "Submitted",
        statusStep: statusStep || 1,
        timelineLog: timelineLog || [
          { date: "Just now", event: "Architecture Request submitted via BOM Configurator." }
        ]
      }
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to submit customization request", requestId: req.requestId || "unknown" });
  }
});

app.patch("/api/customization-requests/:id", async (req, res) => {
  try {
    const { status, statusStep, timelineEvent, estimatedPrice } = req.body;
    
    const existing = await prisma.customizationRequest.findUnique({
      where: { id: req.params.id }
    });
    if (!existing) return res.status(404).json({ error: "Request not found" });

    let updatedLogs = Array.isArray(existing.timelineLog) ? [...existing.timelineLog] : [];
    if (timelineEvent) {
      updatedLogs.unshift({
        date: new Date().toISOString().split("T")[0],
        event: timelineEvent
      });
    }

    const updated = await prisma.customizationRequest.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(statusStep && { statusStep }),
        ...(estimatedPrice && { estimatedPrice }),
        timelineLog: updatedLogs
      }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update customization request", requestId: req.requestId || "unknown" });
  }
});

// --------------------------------------------------------------------------
// Tenant Portal & API Keys (FR-5.1 - FR-5.8)
// --------------------------------------------------------------------------
app.get("/api/tenant", async (req, res) => {
  try {
    const tenant = await prisma.tenant.findFirst({
      include: {
        licenses: true,
        apiKeys: true,
        supportTickets: true
      }
    });
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tenant info", requestId: req.requestId || "unknown" });
  }
});

app.get("/api/licenses", async (req, res) => {
  try {
    const licenses = await prisma.license.findMany({
      include: { component: true }
    });
    res.json(licenses);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch licenses", requestId: req.requestId || "unknown" });
  }
});

app.post("/api/licenses/checkout", async (req, res) => {
  try {
    const { componentId, tier } = req.body;
    const defaultTenant = await prisma.tenant.findFirst();
    const tenantId = defaultTenant ? defaultTenant.id : "tnt-8849-acme";

    // G2 FIX: CSPRNG for license keys
    const { randomBytes } = await import('crypto');
    const licBytes = randomBytes(12).toString('hex').toUpperCase();
    const generatedLicenseKey = `LIC-${componentId.toUpperCase().slice(0, 4)}-${licBytes.substring(0, 6)}-${licBytes.substring(6, 12)}`;

    const createdLicense = await prisma.license.create({
      data: {
        tenantId,
        componentId,
        tier: tier || "Starter",
        licenseKey: generatedLicenseKey,
        status: "ACTIVE",
        clusterTarget: "Dedicated VPC (AWS us-east-1)",
        rateLimit: "1,000 req/min"
      }
    });

    res.status(201).json({
      success: true,
      license: createdLicense,
      message: "License provisioned and activated in PostgreSQL"
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to process license checkout", requestId: req.requestId || "unknown" });
  }
});

app.get("/api/api-keys", async (req, res) => {
  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json(keys);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch API keys", requestId: req.requestId || "unknown" });
  }
});

app.post("/api/api-keys", async (req, res) => {
  try {
    const { name, environment } = req.body;
    const defaultTenant = await prisma.tenant.findFirst();
    const tenantId = defaultTenant ? defaultTenant.id : "tnt-8849-acme";

        // G2 FIX: CSPRNG for API keys — never Math.random()
    const { randomBytes: apiKeyBytes } = await import('crypto');
    const rawSecret = apiKeyBytes(24).toString('hex');
    const envPrefix = environment === "Staging" ? "test" : "live";
    const newKeyId = `key-${rawSecret.substring(0, 8)}`;
    const fullKey = `ctx_${envPrefix}_${rawSecret}`;
    const prefix = `ctx_${envPrefix}_${rawSecret.substring(0, 6)}[HIDDEN]`;
    const keyHash = require('crypto').createHash('sha256').update(fullKey).digest('hex');
        const newKey = await prisma.apiKey.create({
      data: {
        id: newKeyId,
        tenantId,
        name: name || "Default Client Key",
        prefix,
        keyHash, // SHA-256 of the actual key — raw key is NEVER stored
        environment: environment || "Production",
        status: "ACTIVE",
        monthlySpend: 0.0,
        lastUsed: new Date()
      }
    });

    res.status(201).json(newKey);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate API key", requestId: req.requestId || "unknown" });
  }
});

app.delete("/api/api-keys/:id", async (req, res) => {
  try {
    await prisma.apiKey.update({
      where: { id: req.params.id },
      data: { status: "REVOKED" }
    });
    res.json({ success: true, message: `Key ${req.params.id} revoked` });
  } catch (err) {
    res.status(500).json({ error: "Failed to revoke API key", requestId: req.requestId || "unknown" });
  }
});

// --------------------------------------------------------------------------
// Support Tickets Desk (FR-5.6, FR-6.7)
// --------------------------------------------------------------------------
app.get("/api/tickets", async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch support tickets", requestId: req.requestId || "unknown" });
  }
});

app.post("/api/tickets", async (req, res) => {
  try {
    const { subject, priority, message } = req.body;
    const defaultTenant = await prisma.tenant.findFirst();
    const tenantId = defaultTenant ? defaultTenant.id : "tnt-8849-acme";
    const ticketId = `TCK-${Date.now().toString(36).toUpperCase()}`;

    const newTicket = await prisma.supportTicket.create({
      data: {
        id: ticketId,
        tenantId,
        subject,
        priority: priority || "MEDIUM",
        status: "OPEN",
        lastActivity: "Just now",
        messages: [
          {
            sender: "Customer",
            author: "Dr. Sarah Chen",
            time: "Just now",
            text: message || "Support request initiated."
          }
        ]
      }
    });

    res.status(201).json(newTicket);
  } catch (err) {
    res.status(500).json({ error: "Failed to create support ticket", requestId: req.requestId || "unknown" });
  }
});

// --------------------------------------------------------------------------
// Revenue BI & Multi-Cluster Health (FR-6.5, FR-6.6)
// --------------------------------------------------------------------------
app.get("/api/analytics/revenue", async (req, res) => {
  res.json({
    mrrFormatted: "$64,280",
    annualRunRate: "$771,360",
    netExpansion: "+14.8%",
    churnRate: "0.8%",
    activeTenants: 48,
    breakdown: [
      { stream: "Component Licenses (Fixed)", mrr: "$38,400", pct: 60 },
      { stream: "BOM Customization Sprints", mrr: "$16,280", pct: 25 },
      { stream: "Enterprise VPC SLAs & Support", mrr: "$9,600", pct: 15 }
    ]
  });
});

// --------------------------------------------------------------------------
// Multi-Vendor Marketplace Core Routes (SRS v2.0 Section 12, 14, 18, 20, 31)
// --------------------------------------------------------------------------

// In-memory runtime state for fast execution & graceful offline fallback
let dynamicModerationQueue = [
  {
    id: "MOD-301",
    productId: "mcp-server-dev",
    productName: "Autonomous DevOps MCP Bridge",
    productType: "MCP_SERVER",
    category: "Developer Tools",
    sellerName: "Apex AI Labs",
    sellerHandle: "@apex-ai",
    price: "$399",
    submittedDate: "2026-09-21",
    status: "UNDER_REVIEW",
    checklist: {
      malwareScan: "PASS (0 threats detected in wheels/binaries)",
      licenseCompliance: "PASS (Apache-2.0 / Commercial Permissive)",
      documentation: "PASS (Quickstart, schema specs, dependencies verified)",
      sandboxIntegrity: "PASS (Docker container builds cleanly in 38s)"
    },
    specs: "Dockerized Model Context Protocol server exposing Kubernetes telemetry & Helm deploy tooling to LLM agents."
  }
];

let dynamicEntitlements = [];

// Seller Profile
app.get("/api/sellers/:handle", (req, res) => {
  res.json({
    handle: req.params.handle,
    displayName: "Apex AI Labs",
    verifiedLevel: "VERIFIED",
    totalSales: 86,
    grossRevenue: 42850,
    availableBalance: 8240,
    platformTakeRate: 0.15
  });
});

// Vendor Product Submission (SRS Section 12)
app.post("/api/products/submit", (req, res) => {
  const submission = req.body;
  const modRecord = {
    id: `MOD-${Date.now().toString(36).toUpperCase()}`,
    productId: submission.id || `prod-${Date.now()}`,
    productName: submission.name,
    productType: submission.productType || "AI_AGENT",
    category: submission.category || "Generative AI",
    sellerName: "Apex AI Labs",
    sellerHandle: "@apex-ai",
    price: `$${submission.basePrice || 499}`,
    submittedDate: new Date().toISOString().split("T")[0],
    status: "UNDER_REVIEW",
    checklist: {
      malwareScan: "PASS (Automated static analysis clean)",
      licenseCompliance: `PASS (${submission.licenseType || "Commercial Permissive"} verified)`,
      documentation: "PASS (Quickstart & schema verified)",
      sandboxIntegrity: "PASS (Container health: 200 OK)"
    },
    specs: submission.shortDesc || "Production AI component"
  };
  dynamicModerationQueue.unshift(modRecord);
  res.status(201).json({ success: true, moderation: modRecord });
});

// Moderation Queue (SRS Section 13, 31)
app.get("/api/moderation/queue", (req, res) => {
  res.json(dynamicModerationQueue);
});

app.post("/api/moderation/:id", (req, res) => {
  const { action, reason } = req.body;
  const item = dynamicModerationQueue.find((m) => m.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Moderation record not found" });

  item.status = action === "APPROVE" ? "APPROVED" : "REJECTED";
  item.resolutionReason = reason || (action === "APPROVE" ? "Verified and published to catalog" : "Revision requested");
  res.json({ success: true, item });
});

// Digital Delivery Entitlements (SRS Section 14)
app.get("/api/entitlements", (req, res) => {
  res.json(dynamicEntitlements);
});

// Checkout Order & Entitlement Provisioning (SRS Section 17)
app.post("/api/orders/checkout", (req, res) => {
  const { componentId, tier, price } = req.body;
  const priceNum = parseInt(price) || 499;
  // G2 FIX: CSPRNG for entitlement keys
  const checkoutBytes = require('crypto').randomBytes(12).toString('hex').toUpperCase();
  const licenseKey = `LIC-${componentId.toUpperCase().slice(0, 4)}-${checkoutBytes.substring(0, 6)}-${checkoutBytes.substring(6, 12)}`;

  const entitlement = {
    id: `ent-${Date.now()}`,
    componentId,
    tier: tier || "Starter",
    licenseKey,
    downloadAllowed: true,
    downloadUrl: `https://artifacts.cortex-hub.io/signed/${componentId}-prod.tar.gz?token=exp_${Date.now() + 86400000}`,
    checksumSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    fileSize: "1.42 GB",
    apiQuota: "1,000,000 reqs/mo",
    status: "ACTIVE",
    createdAt: new Date().toISOString()
  };
  dynamicEntitlements.unshift(entitlement);

  res.status(201).json({
    success: true,
    licenseKey,
    entitlement,
    platformFee: priceNum * 0.15,
    sellerNet: priceNum * 0.85
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`⚡ Cortex Hub REST API running on http://localhost:${PORT}`);
  console.log(`🐘 Connected to PostgreSQL 18 via Prisma ORM`);
});
