/**
 * Cortex Hub - Express REST API Server
 * Connects Frontend Client to PostgreSQL via Prisma ORM.
 *
 * Phase 0 (SRS v3.0): every non-public route requires a session and the right
 * platform role or workspace membership (G1). Catalog, licensing, API-key,
 * customization and ticket routes use the compatibility models (Component,
 * LegacyLicense, ...) until Phase 1 moves them to Product / Entitlement.
 */

// Must be the first import: modules below read process.env when they load
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { randomBytes, randomUUID } from "crypto";
import { fileURLToPath, pathToFileURL } from "url";
import { z } from "zod";
import { getTwilioStatus, sendTwilioMessage } from "./services/twilio.js";
import { IS_PRODUCTION, ah, audit, formatMoney, prisma, shortId, tenantForWorkspace, validate } from "./lib/common.js";
import { razorpayWebhookHandler, registerCommerceRoutes } from "./routes/commerce.js";
import { registerSellerRoutes } from "./routes/seller.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerBuyerRoutes } from "./routes/buyer.js";
import { registerSandboxRoutes } from "./routes/sandbox.js";
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
  needsRehash,
  publicUser,
  recordLoginFailure,
  requireAuth,
  requirePlatformRole,
  requireWorkspace,
  sha256,
  verifyPassword
} from "./auth.js";


const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const app = express();
export { prisma };
const PORT = process.env.PORT || 5000;


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

// Bodies: the Razorpay webhook needs the raw bytes and the sandbox accepts documents,
// so both bring their own parsers; everything else is small JSON.
const RAW_OR_LARGE_BODY_PATHS = ["/api/webhooks/razorpay", "/api/sandbox/run"];
const smallJson = express.json({ limit: "100kb" });
app.use((req, res, next) => (RAW_OR_LARGE_BODY_PATHS.includes(req.path) ? next() : smallJson(req, res, next)));

// CSRF defence: state-changing API calls must be JSON (cross-site HTML forms cannot send it),
// on top of SameSite=Lax session cookies and the CORS allow-list.
app.use("/api", (req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method) && !req.is("application/json")) {
    return res.status(415).json({ error: "Content-Type must be application/json", requestId: req.requestId });
  }
  next();
});

app.use(loadSession(prisma));

app.post("/api/webhooks/razorpay", ...razorpayWebhookHandler());

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------
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
    if (needsRehash(user.passwordHash)) {
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(body.password) } });
    }
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

function productAsCatalogEntry(p) {
  const tiers = p.prices.map((pr) => ({
    name: pr.name,
    price: pr.model === "CUSTOM" ? "Custom" : formatMoney(pr.amountMinor, pr.currency).replace(/\.00$/, ""),
    desc: pr.model === "ONE_TIME" ? "One-time licence" : "Per month",
    features: []
  }));
  const first = tiers[0]?.price || "—";
  return {
    id: p.slug,
    name: p.name,
    category: p.businessCategory || "AI Component",
    categoryBadge: "badge-indigo",
    productType: p.productType,
    version: p.versions[0] ? `v${p.versions[0].version}` : "v1.0.0",
    shortDesc: p.shortDesc,
    longDesc: p.longDesc,
    coreOutput: p.shortDesc,
    targetBuyer: p.prerequisites || "",
    basePrice: null,
    priceFormatted: first,
    inrPriceFormatted: first,
    tags: p.tags,
    features: p.features,
    pricingTiers: tiers,
    architecture: [],
    codeSnippets: null,
    benchmarks: p.benchmarks?.sellerReported ? { accuracy: `${p.benchmarks.sellerReported} (seller-reported)` } : null,
    sellerName: p.seller.displayName,
    verificationStatus: p.verificationStatus,
    rating: p.ratingCount ? p.rating : null,
    ratingCount: p.ratingCount,
    published: true
  };
}

app.get(
  "/api/components",
  ah(async (req, res) => {
    const isAdmin = isPlatformRole(req.user, PLATFORM_ADMIN_ROLES);
    const components = await prisma.component.findMany({
      where: isAdmin ? {} : { published: true },
      orderBy: { basePrice: "asc" }
    });
    // Approved seller products that have no curated catalog entry yet
    const sellerProducts = await prisma.product.findMany({
      where: { status: "PUBLISHED", slug: { notIn: components.map((c) => c.id) } },
      include: { seller: true, prices: { where: { isActive: true }, orderBy: { amountMinor: "asc" } }, versions: { where: { isLatest: true }, take: 1 } },
      orderBy: { createdAt: "desc" }
    });
    res.json([...components, ...sellerProducts.map(productAsCatalogEntry)]);
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
  estimatedPrice: z.string().max(50).optional(),
  scope: z.string().trim().max(2000).optional()
});

const STATUS_STEPS = { Submitted: 1, "Under Review": 2, Quoted: 3, "In Progress": 4, Delivered: 5 };

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
        ...(body.status && { status: body.status, statusStep: body.statusStep || STATUS_STEPS[body.status] }),
        ...(!body.status && body.statusStep && { statusStep: body.statusStep }),
        ...(body.estimatedPrice && { estimatedPrice: body.estimatedPrice }),
        ...(body.scope && { scope: body.scope }),
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
// Commerce, seller, admin, buyer and sandbox modules (all persisted in Postgres)
// --------------------------------------------------------------------------
registerCommerceRoutes(app);
registerSellerRoutes(app);
registerAdminRoutes(app);
registerBuyerRoutes(app);
registerSandboxRoutes(app);

// Public seller profile: no financial fields
app.get(
  "/api/sellers/:handle",
  ah(async (req, res) => {
    const profile = await prisma.sellerProfile.findUnique({
      where: { handle: req.params.handle },
      include: { products: { where: { status: "PUBLISHED" }, select: { slug: true, name: true } } }
    });
    if (!profile) return res.status(404).json({ error: "Seller not found", requestId: req.requestId });
    res.json({
      handle: profile.handle,
      displayName: profile.displayName,
      bio: profile.bio,
      website: profile.website,
      verifiedLevel: profile.verifiedLevel,
      totalSales: profile.totalSalesCount,
      products: profile.products
    });
  })
);

// --------------------------------------------------------------------------
// Twilio Communications & WhatsApp Assistant (SRS §2.3, ADM-06)
// --------------------------------------------------------------------------
app.get("/api/twilio/status", requirePlatformRole(...PLATFORM_ADMIN_ROLES), ah(async (req, res) => {
  const status = await getTwilioStatus();
  res.json(status);
}));

app.post("/api/notifications/whatsapp", requirePlatformRole("SUPPORT", ...PLATFORM_ADMIN_ROLES), ah(async (req, res) => {
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

app.post("/api/notifications/sms", requirePlatformRole("SUPPORT", ...PLATFORM_ADMIN_ROLES), ah(async (req, res) => {
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
