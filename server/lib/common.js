/**
 * Cortex Hub - shared server helpers (Prisma client, validation, audit, money)
 */

import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Async route wrapper: forwards rejections to the error handler
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function validate(schema, data, req, res) {
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

export async function audit(req, action, { workspaceId = null, resourceId = null, before = null, after = null } = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        workspaceId,
        actorId: req.user ? req.user.id : null,
        action,
        resourceId,
        before: before ? JSON.parse(JSON.stringify(before, bigintSafe)) : undefined,
        after: after ? JSON.parse(JSON.stringify(after, bigintSafe)) : undefined,
        ipAddress: req.ip,
        requestId: req.requestId
      }
    });
  } catch (err) {
    console.error(`[audit] failed to record ${action} (${req.requestId}):`, err.message);
  }
}

function bigintSafe(key, value) {
  return typeof value === "bigint" ? value.toString() : value;
}

// Legacy tables are keyed by Tenant; each buyer Workspace maps to the Tenant with the same slug.
export async function tenantForWorkspace(workspace) {
  return prisma.tenant.upsert({
    where: { slug: workspace.slug },
    update: {},
    create: { slug: workspace.slug, name: workspace.name }
  });
}

export function shortId(prefix) {
  return `${prefix}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function newLicenseKey(slug) {
  const hex = randomBytes(12).toString("hex").toUpperCase();
  return `LIC-${slug
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4)}-${hex.substring(0, 6)}-${hex.substring(6, 12)}`;
}

// --------------------------------------------------------------------------
// Money: always integer minor units (paise / cents) + ISO currency
// --------------------------------------------------------------------------
export const GST_RATE = 0.18;

export function formatMoney(minor, currency = "INR") {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(minor / 100);
}

// Platform commission (SRS 19), admin-configurable via PlatformSetting "commissionRate"
export const DEFAULT_COMMISSION_RATE = Number(process.env.PLATFORM_COMMISSION_RATE) || 0.15;

export async function getCommissionRate() {
  const setting = await prisma.platformSetting.findUnique({ where: { key: "commissionRate" } });
  const rate = setting ? Number(setting.value) : DEFAULT_COMMISSION_RATE;
  return Number.isFinite(rate) ? rate : DEFAULT_COMMISSION_RATE;
}
