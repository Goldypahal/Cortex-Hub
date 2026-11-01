/**
 * Cortex Hub - Express REST API Server
 * Connects Frontend Client to PostgreSQL via Prisma ORM.
 *
 * Phase 0 (SRS v3.0): every non-public route requires a session and the right
 * platform role or workspace membership (G1). Catalog, licensing, API-key,
 * customization and ticket routes use the compatibility models (Component,
 * LegacyLicense, ...) until Phase 1 moves them to Product / Entitlement.
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { randomBytes, randomUUID } from "crypto";
import { fileURLToPath, pathToFileURL } from "url";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { getTwilioStatus, sendTwilioMessage } from "./services/twilio.js";
import {
  PLATFORM_ADMIN_ROLES,
  PLATFORM_STAFF_ROLES,
  burnPasswordCheck,
  clearLoginFailures,
  createSession,
  destroySession,
  findMembership,
  hashPassword,
  isLoginThrottled,
  isPlatformRole,
  loadSession,
  publicUser,
  recordLoginFailure,
  requireAuth,
  requirePlatformRole,
  requireWorkspace,
  sha256,
  verifyPassword
} from "./auth.js";

dotenv.config();

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const app = express();
export const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Async route wrapper: forwards rejections to the error handler below
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// G3 FIX: Restrict CORS to allow-list only. Never use open cors() in production.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5000,http://localhost:3000")
  .split(",")
  .map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || ALLOWED_ORIGINS.includes(origin)),
    credentials: true,
    optionsSuccessStatus: 200
  })
);

// Request ID (audit trail + error responses)
app.use((req, res, next) => {
  req.requestId = `req_${randomUUID()}`;
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

// Security headers (G3 FIX)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (IS_PRODUCTION) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

app.use(express.json({ limit: "100kb" }));

// CSRF defence: state-changing API calls must be JSON (cross-site HTML forms cannot send it),
// on top of SameSite=Lax session cookies and the CORS allow-list.
app.use("/api", (req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method) && !req.is("application/json")) {
    return res.status(415).json({ error: "Content-Type must be application/json", requestId: req.requestId });
  }
  next();
});

app.use(loadSession(prisma));

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------
function validate(schema, data, req, res) {
  const result = schema.safeParse(data);
  if (!result.success) {
    res.status(400).json({
      error: "Invalid request",
      issues: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      requestId: req.requestId
    });
    return null;
  }
  return result.data;
}

async function audit(req, action, { workspaceId = null, resourceId = null, before = null, after = null } = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        workspaceId,
        actorId: req.user ? req.user.id : null,
        action,
        resourceId,
        before: before ?? undefined,
        after: after ?? undefined,
        ipAddress: req.ip,
        requestId: req.requestId
      }
    });
  } catch (err) {
    console.error(`[audit] failed to record ${action} (${req.requestId}):`, err.message);
  }
}

// Legacy tables are keyed by Tenant; each buyer Workspace maps to the Tenant with the same slug.
async function tenantForWorkspace(workspace) {
  return prisma.tenant.upsert({
    where: { slug: workspace.slug },
    update: {},
    create: { slug: workspace.slug, name: workspace.name }
  });
}

function shortId(prefix) {
  return `${prefix}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function newLicenseKey(componentId) {
  const hex = randomBytes(12).toString("hex").toUpperCase();
  return `LIC-${componentId.toUpperCase().slice(0, 4)}-${hex.substring(0, 6)}-${hex.substring(6, 12)}`;
}

// Payments are not integrated yet (SRS BILL-02, BILL-05): simulated checkouts are refused in production.
function blockSimulatedCheckoutInProduction(req, res, next) {
  if (IS_PRODUCTION) {
    return res.status(501).json({ error: "Payments are not enabled yet", requestId: req.requestId });
  }
  next();
}

const apiKeyPublicFields = {
  id: true,
  tenantId: true,
  name: true,
  prefix: true,
  status: true,
  environment: true,
  monthlySpend: true,
  lastUsed: true,
  createdAt: true,
  updatedAt: true
};

// --------------------------------------------------------------------------
// System Health
// --------------------------------------------------------------------------
app.get(
  "/api/health",
  ah(async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ONLINE", database: "connected", timestamp: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: "DEGRADED", database: "unavailable", timestamp: new Date().toISOString() });
    }
  })
);

// --------------------------------------------------------------------------
// Authentication (SRS AUTH-01, AUTH-02, AUTH-05)
// --------------------------------------------------------------------------
const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(12, "Password must be at least 12 characters").max(200),
  workspaceName: z.string().trim().min(2).max(120),
  accountType: z.enum(["BUYER", "SELLER"]).default("BUYER")
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200)
});

function slugify(text) {
  const base = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "workspace";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

app.post(
  "/api/auth/register",
  ah(async (req, res) => {
    const body = validate(registerSchema, req.body, req, res);
    if (!body) return;

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists", requestId: req.requestId });
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { type: body.accountType, name: body.workspaceName, slug: slugify(body.workspaceName) }
      });
      return tx.user.create({
        data: {
          email: body.email,
          name: body.name,
          passwordHash,
          globalRole: body.accountType,
          memberships: { create: { workspaceId: workspace.id, role: "OWNER" } }
        },
        include: { memberships: { include: { workspace: true } } }
      });
    });

    await createSession(prisma, res, user, req);
    req.user = user;
    await audit(req, "user.registered", { workspaceId: user.memberships[0].workspaceId, resourceId: user.id });
    res.status(201).json({ user: publicUser(user) });
  })
);

app.post(
  "/api/auth/login",
  ah(async (req, res) => {
    const body = validate(loginSchema, req.body, req, res);
    if (!body) return;

    const throttleKey = `${req.ip}|${body.email}`;
    if (isLoginThrottled(throttleKey)) {
      return res.status(429).json({ error: "Too many failed attempts. Try again in 15 minutes.", requestId: req.requestId });
    }

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { memberships: { include: { workspace: true } } }
    });
    const ok = user ? await verifyPassword(body.password, user.passwordHash) : await burnPasswordCheck(body.password);
    if (!ok || user.status !== "ACTIVE") {
      recordLoginFailure(throttleKey);
      return res.status(401).json({ error: "Invalid email or password", requestId: req.requestId });
    }

    clearLoginFailures(throttleKey);
    await createSession(prisma, res, user, req);
    req.user = user;
    await audit(req, "user.login", { resourceId: user.id });
    res.json({ user: publicUser(user) });
  })
);

app.post(
  "/api/auth/logout",
  ah(async (req, res) => {
    if (req.user) await audit(req, "user.logout", { resourceId: req.user.id });
    await destroySession(prisma, req, res);
    res.json({ success: true });
  })
);

// Returns { user: null } for visitors so the page can check sign-in state without an error
app.get("/api/auth/me", (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

// --------------------------------------------------------------------------
// Component Catalog (public read, platform-admin write)
// --------------------------------------------------------------------------
const componentSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{2,64}$/, "Use lowercase letters, digits and hyphens"),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  categoryBadge: z.string().max(50).optional(),
  version: z.string().max(30).optional(),
  shortDesc: z.string().max(500),
  longDesc: z.string().max(5000),
  coreOutput: z.string().max(500),
  targetBuyer: z.string().max(200),
  basePrice: z.number().int().nonnegative(),
  priceFormatted: z.string().max(50),
  inrPriceFormatted: z.string().max(50),
  tags: z.array(z.string().max(60)).max(30).default([]),
  features: z.array(z.string().max(300)).max(50).default([]),
  pricingTiers: z.any(),
  architecture: z.any(),
  codeSnippets: z.any(),
  published: z.boolean().optional()
});

app.get(
  "/api/components",
  ah(async (req, res) => {
    const isAdmin = isPlatformRole(req.user, PLATFORM_ADMIN_ROLES);
    const components = await prisma.component.findMany({
      where: isAdmin ? {} : { published: true },
      orderBy: { basePrice: "asc" }
    });
    res.json(components);
  })
);

app.get(
  "/api/components/:id",
  ah(async (req, res) => {
    const component = await prisma.component.findUnique({ where: { id: req.params.id } });
    const visible = component && (component.published || isPlatformRole(req.user, PLATFORM_ADMIN_ROLES));
    if (!visible) return res.status(404).json({ error: "Component not found", requestId: req.requestId });
    res.json(component);
  })
);

app.post(
  "/api/components",
  requirePlatformRole(...PLATFORM_ADMIN_ROLES),
  ah(async (req, res) => {
    const data = validate(componentSchema, req.body, req, res);
    if (!data) return;
    const created = await prisma.component.create({ data });
    await audit(req, "component.created", { resourceId: created.id, after: created });
    res.status(201).json(created);
  })
);

app.put(
  "/api/components/:id",
  requirePlatformRole(...PLATFORM_ADMIN_ROLES),
  ah(async (req, res) => {
    const data = validate(componentSchema.omit({ id: true }).partial(), req.body, req, res);
    if (!data) return;
    const before = await prisma.component.findUnique({ where: { id: req.params.id } });
    if (!before) return res.status(404).json({ error: "Component not found", requestId: req.requestId });
    const updated = await prisma.component.update({ where: { id: req.params.id }, data });
    await audit(req, "component.updated", { resourceId: updated.id, before, after: updated });
    res.json(updated);
  })
);

app.delete(
  "/api/components/:id",
  requirePlatformRole(...PLATFORM_ADMIN_ROLES),
  ah(async (req, res) => {
    const before = await prisma.component.findUnique({ where: { id: req.params.id } });
    if (!before) return res.status(404).json({ error: "Component not found", requestId: req.requestId });
    await prisma.component.delete({ where: { id: req.params.id } });
    await audit(req, "component.deleted", { resourceId: before.id, before });
    res.json({ success: true, message: `Component ${req.params.id} deleted` });
  })
);

// --------------------------------------------------------------------------
// Customization Requests (buyers submit their own; platform staff review all)
// --------------------------------------------------------------------------
const customizationSchema = z.object({
  componentId: z.string().min(1).max(64),
  componentName: z.string().max(200).optional(),
  scope: z.string().max(2000).optional(),
  industry: z.string().max(100).optional(),
  deploymentTarget: z.string().max(100).optional(),
  estimatedPrice: z.string().max(50).optional(),
  priceInr: z.string().max(50).optional(),
  targetDelivery: z.string().max(100).optional()
});

const customizationUpdateSchema = z.object({
  status: z.enum(["Submitted", "Under Review", "Quoted", "In Progress", "Delivered"]).optional(),
  statusStep: z.number().int().min(1).max(5).optional(),
  timelineEvent: z.string().max(500).optional(),
  estimatedPrice: z.string().max(50).optional()
});

app.get(
  "/api/customization-requests",
  requireAuth,
  ah(async (req, res) => {
    if (isPlatformRole(req.user, PLATFORM_STAFF_ROLES)) {
      const all = await prisma.legacyCustomizationRequest.findMany({ orderBy: { createdAt: "desc" } });
      return res.json(all);
    }
    const membership = findMembership(req, "BUYER");
    if (!membership) return res.status(403).json({ error: "Insufficient permissions", requestId: req.requestId });
    const tenant = await tenantForWorkspace(membership.workspace);
    const own = await prisma.legacyCustomizationRequest.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" }
    });
    res.json(own);
  })
);

app.post(
  "/api/customization-requests",
  requireWorkspace("BUYER"),
  ah(async (req, res) => {
    const body = validate(customizationSchema, req.body, req, res);
    if (!body) return;
    const component = await prisma.component.findUnique({ where: { id: body.componentId } });
    if (!component) return res.status(404).json({ error: "Component not found", requestId: req.requestId });

    const tenant = await tenantForWorkspace(req.workspace);
    const created = await prisma.legacyCustomizationRequest.create({
      data: {
        id: shortId("CR"),
        tenantId: tenant.id,
        componentId: component.id,
        tenantName: req.workspace.name,
        componentName: body.componentName || component.name,
        scope: body.scope || "Standard Architecture Scope",
        industry: body.industry || "Cross-Industry",
        deploymentTarget: body.deploymentTarget || "VPC",
        estimatedPrice: body.estimatedPrice || component.priceFormatted,
        priceInr: body.priceInr || component.inrPriceFormatted,
        targetDelivery: body.targetDelivery || "14 Business Days",
        status: "Submitted",
        statusStep: 1,
        timelineLog: [{ date: new Date().toISOString().split("T")[0], event: "Architecture request submitted via configurator." }]
      }
    });
    await audit(req, "customization.created", { workspaceId: req.workspace.id, resourceId: created.id });
    res.status(201).json(created);
  })
);

app.patch(
  "/api/customization-requests/:id",
  requirePlatformRole("SUPPORT", ...PLATFORM_ADMIN_ROLES),
  ah(async (req, res) => {
    const body = validate(customizationUpdateSchema, req.body, req, res);
    if (!body) return;
    const existing = await prisma.legacyCustomizationRequest.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Request not found", requestId: req.requestId });

    const updatedLogs = Array.isArray(existing.timelineLog) ? [...existing.timelineLog] : [];
    if (body.timelineEvent) {
      updatedLogs.unshift({ date: new Date().toISOString().split("T")[0], event: body.timelineEvent });
    }

    const updated = await prisma.legacyCustomizationRequest.update({
      where: { id: req.params.id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.statusStep && { statusStep: body.statusStep }),
        ...(body.estimatedPrice && { estimatedPrice: body.estimatedPrice }),
        timelineLog: updatedLogs
      }
    });
    await audit(req, "customization.updated", { resourceId: updated.id, before: existing, after: updated });
    res.json(updated);
  })
);

// --------------------------------------------------------------------------
// Buyer Portal: tenant, licenses, API keys (scoped to the caller's workspace)
// --------------------------------------------------------------------------
app.get(
  "/api/tenant",
  requireWorkspace("BUYER"),
  ah(async (req, res) => {
    const tenant = await tenantForWorkspace(req.workspace);
    const full = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      include: {
        licenses: true,
        apiKeys: { select: apiKeyPublicFields },
        supportTickets: true
      }
    });
    res.json({ ...full, monthlyTokenQuota: full.monthlyTokenQuota.toString() });
  })
);

app.get(
  "/api/licenses",
  requireWorkspace("BUYER"),
  ah(async (req, res) => {
    const tenant = await tenantForWorkspace(req.workspace);
    const licenses = await prisma.legacyLicense.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" }
    });
    res.json(licenses);
  })
);

app.post(
  "/api/licenses/checkout",
  requireWorkspace("BUYER"),
  blockSimulatedCheckoutInProduction,
  ah(async (req, res) => {
    const body = validate(
      z.object({ componentId: z.string().min(1).max(64), tier: z.string().max(50).default("Starter") }),
      req.body,
      req,
      res
    );
    if (!body) return;
    const component = await prisma.component.findUnique({ where: { id: body.componentId } });
    if (!component || !component.published) {
      return res.status(404).json({ error: "Component not found", requestId: req.requestId });
    }

    const tenant = await tenantForWorkspace(req.workspace);
    const createdLicense = await prisma.legacyLicense.create({
      data: {
        tenantId: tenant.id,
        componentId: component.id,
        tier: body.tier,
        licenseKey: newLicenseKey(component.id),
        status: "ACTIVE",
        clusterTarget: "Dedicated VPC (AWS us-east-1)",
        rateLimit: "1,000 req/min"
      }
    });
    await audit(req, "license.created", { workspaceId: req.workspace.id, resourceId: createdLicense.id });
    res.status(201).json({
      success: true,
      simulatedPayment: true,
      license: createdLicense,
      message: "License provisioned (simulated checkout, no payment taken)"
    });
  })
);

app.get(
  "/api/api-keys",
  requireWorkspace("BUYER"),
  ah(async (req, res) => {
    const tenant = await tenantForWorkspace(req.workspace);
    const keys = await prisma.legacyApiKey.findMany({
      where: { tenantId: tenant.id },
      select: apiKeyPublicFields,
      orderBy: { createdAt: "desc" }
    });
    res.json(keys);
  })
);

app.post(
  "/api/api-keys",
  requireWorkspace("BUYER"),
  ah(async (req, res) => {
    const body = validate(
      z.object({
        name: z.string().trim().min(1).max(100).default("Default Client Key"),
        environment: z.enum(["Production", "Staging"]).default("Production")
      }),
      req.body,
      req,
      res
    );
    if (!body) return;

    // G2 FIX: CSPRNG secret; only its SHA-256 hash is stored, the raw key is returned once.
    const tenant = await tenantForWorkspace(req.workspace);
    const rawSecret = randomBytes(24).toString("hex");
    const envPrefix = body.environment === "Staging" ? "test" : "live";
    const fullKey = `ctx_${envPrefix}_${rawSecret}`;

    const created = await prisma.legacyApiKey.create({
      data: {
        id: `key-${randomBytes(6).toString("hex")}`,
        tenantId: tenant.id,
        name: body.name,
        prefix: `ctx_${envPrefix}_${rawSecret.substring(0, 6)}…`,
        keyHash: sha256(fullKey),
        environment: body.environment,
        status: "ACTIVE",
        monthlySpend: 0.0
      },
      select: apiKeyPublicFields
    });
    await audit(req, "apikey.created", { workspaceId: req.workspace.id, resourceId: created.id });
    res.status(201).json({ ...created, key: fullKey, keyShownOnce: true });
  })
);

app.delete(
  "/api/api-keys/:id",
  requireWorkspace("BUYER"),
  ah(async (req, res) => {
    const tenant = await tenantForWorkspace(req.workspace);
    const result = await prisma.legacyApiKey.updateMany({
      where: { id: req.params.id, tenantId: tenant.id },
      data: { status: "REVOKED" }
    });
    if (result.count === 0) return res.status(404).json({ error: "API key not found", requestId: req.requestId });
    await audit(req, "apikey.revoked", { workspaceId: req.workspace.id, resourceId: req.params.id });
    res.json({ success: true, message: `Key ${req.params.id} revoked` });
  })
);

// --------------------------------------------------------------------------
// Support Tickets (buyers see their own; platform staff see all)
// --------------------------------------------------------------------------
app.get(
  "/api/tickets",
  requireAuth,
  ah(async (req, res) => {
    if (isPlatformRole(req.user, PLATFORM_STAFF_ROLES)) {
      const all = await prisma.legacySupportTicket.findMany({ orderBy: { createdAt: "desc" } });
      return res.json(all);
    }
    const membership = findMembership(req, "BUYER");
    if (!membership) return res.status(403).json({ error: "Insufficient permissions", requestId: req.requestId });
    const tenant = await tenantForWorkspace(membership.workspace);
    // internalNotes are staff-only
    const own = await prisma.legacySupportTicket.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        subject: true,
        priority: true,
        status: true,
        lastActivity: true,
        messages: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(own);
  })
);

app.post(
  "/api/tickets",
  requireWorkspace("BUYER"),
  ah(async (req, res) => {
    const body = validate(
      z.object({
        subject: z.string().trim().min(1).max(200),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
        message: z.string().trim().max(5000).default("Support request initiated.")
      }),
      req.body,
      req,
      res
    );
    if (!body) return;

    const tenant = await tenantForWorkspace(req.workspace);
    const newTicket = await prisma.legacySupportTicket.create({
      data: {
        id: shortId("TCK"),
        tenantId: tenant.id,
        subject: body.subject,
        priority: body.priority,
        status: "OPEN",
        lastActivity: "Just now",
        messages: [{ sender: "Customer", author: req.user.name, time: new Date().toISOString(), text: body.message }]
      }
    });
    await audit(req, "ticket.created", { workspaceId: req.workspace.id, resourceId: newTicket.id });
    res.status(201).json(newTicket);
  })
);

// --------------------------------------------------------------------------
// Revenue BI (platform finance/admin only; figures are sample data until billing exists)
// --------------------------------------------------------------------------
app.get("/api/analytics/revenue", requirePlatformRole("FINANCE", ...PLATFORM_ADMIN_ROLES), (req, res) => {
  res.json({
    dataSource: "sample",
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
// Multi-Vendor Marketplace Routes (SRS v2.0 Section 12, 14, 18, 20, 31)
// NOTE: still held in process memory (G4) until Phase 1 persists them in
// ModerationRecord / Order / Entitlement.
// --------------------------------------------------------------------------
const dynamicModerationQueue = [
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
      malwareScan: "PENDING (automated scanning not yet implemented)",
      licenseCompliance: "PENDING (manual review)",
      documentation: "PENDING (manual review)",
      sandboxIntegrity: "PENDING (automated scanning not yet implemented)"
    },
    specs: "Dockerized Model Context Protocol server exposing Kubernetes telemetry & Helm deploy tooling to LLM agents."
  }
];

const dynamicEntitlements = [];

// Public seller profile: no financial fields
app.get("/api/sellers/:handle", (req, res) => {
  res.json({
    dataSource: "sample",
    handle: req.params.handle,
    displayName: "Apex AI Labs",
    verifiedLevel: "VERIFIED",
    totalSales: 86
  });
});

app.post("/api/products/submit", requireWorkspace("SELLER"), (req, res) => {
  const body = validate(
    z.object({
      id: z.string().max(64).optional(),
      name: z.string().trim().min(1).max(200),
      productType: z.string().max(40).default("AI_AGENT"),
      category: z.string().max(100).default("Generative AI"),
      basePrice: z.number().nonnegative().default(499),
      licenseType: z.string().max(100).optional(),
      shortDesc: z.string().max(500).default("Production AI component")
    }),
    req.body,
    req,
    res
  );
  if (!body) return;

  const modRecord = {
    id: shortId("MOD"),
    productId: body.id || `prod-${Date.now()}`,
    productName: body.name,
    productType: body.productType,
    category: body.category,
    sellerName: req.workspace.name,
    sellerHandle: `@${req.workspace.slug}`,
    sellerWorkspaceId: req.workspace.id,
    price: `$${body.basePrice}`,
    submittedDate: new Date().toISOString().split("T")[0],
    status: "UNDER_REVIEW",
    checklist: {
      malwareScan: "PENDING (automated scanning not yet implemented)",
      licenseCompliance: `PENDING (${body.licenseType || "license"} needs manual review)`,
      documentation: "PENDING (manual review)",
      sandboxIntegrity: "PENDING (automated scanning not yet implemented)"
    },
    specs: body.shortDesc
  };
  dynamicModerationQueue.unshift(modRecord);
  res.status(201).json({ success: true, moderation: modRecord });
});

app.get("/api/moderation/queue", requirePlatformRole("MODERATOR", ...PLATFORM_ADMIN_ROLES), (req, res) => {
  res.json(dynamicModerationQueue);
});

app.post(
  "/api/moderation/:id",
  requirePlatformRole("MODERATOR", ...PLATFORM_ADMIN_ROLES),
  ah(async (req, res) => {
    const body = validate(
      z.object({ action: z.enum(["APPROVE", "REJECT"]), reason: z.string().max(1000).optional() }),
      req.body,
      req,
      res
    );
    if (!body) return;
    const item = dynamicModerationQueue.find((m) => m.id === req.params.id);
    if (!item) return res.status(404).json({ error: "Moderation record not found", requestId: req.requestId });

    item.status = body.action === "APPROVE" ? "APPROVED" : "REJECTED";
    item.resolutionReason =
      body.reason || (body.action === "APPROVE" ? "Verified and published to catalog" : "Revision requested");
    await audit(req, `moderation.${body.action.toLowerCase()}`, { resourceId: item.id });
    res.json({ success: true, item });
  })
);

app.get("/api/entitlements", requireWorkspace("BUYER"), (req, res) => {
  res.json(dynamicEntitlements.filter((e) => e.workspaceId === req.workspace.id));
});

app.post("/api/orders/checkout", requireWorkspace("BUYER"), blockSimulatedCheckoutInProduction, (req, res) => {
  const body = validate(
    z.object({
      componentId: z.string().min(1).max(64),
      tier: z.string().max(50).default("Starter"),
      price: z.coerce.number().int().nonnegative().default(499)
    }),
    req.body,
    req,
    res
  );
  if (!body) return;

  const licenseKey = newLicenseKey(body.componentId);
  const entitlement = {
    id: `ent-${randomBytes(6).toString("hex")}`,
    workspaceId: req.workspace.id,
    componentId: body.componentId,
    tier: body.tier,
    licenseKey,
    downloadAllowed: true,
    apiQuota: "1,000,000 reqs/mo",
    status: "ACTIVE",
    createdAt: new Date().toISOString()
  };
  dynamicEntitlements.unshift(entitlement);

  res.status(201).json({
    success: true,
    simulatedPayment: true,
    licenseKey,
    entitlement,
    platformFee: body.price * 0.15,
    sellerNet: body.price * 0.85
  });
});


// --------------------------------------------------------------------------
// Twilio Communications & WhatsApp Assistant (SRS §2.3, ADM-06)
// --------------------------------------------------------------------------
app.get("/api/twilio/status", ah(async (req, res) => {
  const status = await getTwilioStatus();
  res.json(status);
}));

app.post("/api/notifications/whatsapp", ah(async (req, res) => {
  const body = validate(
    z.object({
      to: z.string().min(8),
      message: z.string().min(1).max(1600),
      channel: z.enum(["whatsapp", "sms"]).default("whatsapp")
    }),
    req.body,
    req,
    res
  );
  if (!body) return;

  try {
    const result = await sendTwilioMessage({
      to: body.to,
      body: body.message,
      isWhatsApp: body.channel === "whatsapp"
    });
    res.json({ success: true, result });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
      requestId: req.requestId
    });
  }
}));

app.post("/api/notifications/sms", ah(async (req, res) => {
  const body = validate(
    z.object({
      to: z.string().min(8),
      message: z.string().min(1).max(1600)
    }),
    req.body,
    req,
    res
  );
  if (!body) return;

  try {
    const result = await sendTwilioMessage({
      to: body.to,
      body: body.message,
      isWhatsApp: false
    });
    res.json({ success: true, result });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
      requestId: req.requestId
    });
  }
}));

// Unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found", requestId: req.requestId });
});

// --------------------------------------------------------------------------
// Frontend (served from the same origin so session cookies and /api just work - G9)
// Only public folders are exposed; server/, .env and docs are never served.
// --------------------------------------------------------------------------
app.use("/css", express.static(path.join(ROOT_DIR, "css")));
app.use("/js", express.static(path.join(ROOT_DIR, "js")));
app.get("/favicon.svg", (req, res) => res.sendFile(path.join(ROOT_DIR, "favicon.svg")));
app.get(["/", "/index.html"], (req, res) => res.sendFile(path.join(ROOT_DIR, "index.html")));

// --------------------------------------------------------------------------
// Error handler: log details server-side, never leak them to the client (G3)
// --------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON body", requestId: req.requestId });
  }
  console.error(`[error] ${req.method} ${req.originalUrl} (${req.requestId}):`, err);
  res.status(500).json({ error: "Internal server error", requestId: req.requestId });
});

// Start only when run directly (tests import the app)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(PORT, () => {
    console.log(`Cortex Hub running on http://localhost:${PORT} (API under /api)`);
  });
}
