/**
 * Cortex Hub - Buyer workspace API (SRS BUY-01, BUY-03, ADM-04)
 */

import { randomBytes } from "crypto";
import { z } from "zod";
import { ah, audit, formatMoney, prisma, tenantForWorkspace, validate } from "../lib/common.js";
import { PLATFORM_STAFF_ROLES, isPlatformRole, requireAuth, requireWorkspace, sha256 } from "../auth.js";

export function registerBuyerRoutes(app) {
  app.get(
    "/api/buyer/summary",
    requireWorkspace("BUYER"),
    ah(async (req, res) => {
      const ws = req.workspace;
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const tenant = await tenantForWorkspace(ws);
      const [entitlements, spend, usage, openRequests] = await Promise.all([
        prisma.entitlement.aggregate({
          where: { workspaceId: ws.id, status: "ACTIVE" },
          _count: true,
          _sum: { apiQuota: true, apiUsed: true }
        }),
        prisma.order.aggregate({
          where: { workspaceId: ws.id, status: "PAID", createdAt: { gte: monthStart } },
          _sum: { totalAmountMinor: true }
        }),
        prisma.usageEvent.aggregate({
          where: { workspaceId: ws.id, recordedAt: { gte: monthStart } },
          _sum: { units: true },
          _count: true
        }),
        prisma.legacyCustomizationRequest.count({ where: { tenantId: tenant.id, status: { not: "Delivered" } } })
      ]);
      res.json({
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        plan: ws.plan,
        role: req.membership.role,
        activeEntitlements: entitlements._count,
        spendThisMonth: formatMoney(spend._sum.totalAmountMinor || 0, "INR"),
        usageEventsThisMonth: usage._count,
        tokensThisMonth: usage._sum.units || 0,
        apiQuota: entitlements._sum.apiQuota || 0,
        apiUsed: entitlements._sum.apiUsed || 0,
        openCustomizations: openRequests
      });
    })
  );

  // Daily usage for the last N days, from recorded UsageEvents
  app.get(
    "/api/usage/daily",
    requireWorkspace("BUYER"),
    ah(async (req, res) => {
      const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);
      // Buckets are UTC days so they do not depend on the server's timezone
      const since = new Date();
      since.setUTCHours(0, 0, 0, 0);
      since.setUTCDate(since.getUTCDate() - (days - 1));
      const events = await prisma.usageEvent.findMany({
        where: { workspaceId: req.workspace.id, recordedAt: { gte: since } },
        select: { recordedAt: true, units: true }
      });
      const buckets = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(since);
        d.setUTCDate(since.getUTCDate() + i);
        buckets.push({ date: d.toISOString().slice(0, 10), units: 0, events: 0 });
      }
      for (const e of events) {
        const b = buckets.find((x) => x.date === e.recordedAt.toISOString().slice(0, 10));
        if (b) {
          b.units += e.units;
          b.events += 1;
        }
      }
      res.json(buckets);
    })
  );

  // Ticket replies (owning buyer workspace or platform staff)
  app.post(
    "/api/tickets/:id/messages",
    requireAuth,
    ah(async (req, res) => {
      const body = validate(z.object({ text: z.string().trim().min(1).max(5000) }), req.body, req, res);
      if (!body) return;
      const ticket = await prisma.legacySupportTicket.findUnique({
        where: { id: req.params.id },
        include: { tenant: true }
      });
      const isStaff = isPlatformRole(req.user, PLATFORM_STAFF_ROLES);
      const isOwner =
        ticket &&
        req.user.memberships.some((m) => m.workspace.type === "BUYER" && m.workspace.slug === ticket.tenant.slug);
      if (!ticket || !(isStaff || isOwner))
        return res.status(404).json({ error: "Ticket not found", requestId: req.requestId });

      const messages = Array.isArray(ticket.messages) ? [...ticket.messages] : [];
      messages.push({
        sender: isStaff ? "Support" : "Customer",
        author: req.user.name,
        time: new Date().toISOString(),
        text: body.text
      });
      const updated = await prisma.legacySupportTicket.update({
        where: { id: ticket.id },
        data: { messages, lastActivity: new Date().toISOString(), status: isStaff ? ticket.status : "OPEN" }
      });
      await audit(req, "ticket.replied", { resourceId: ticket.id });
      res.json({ id: updated.id, status: updated.status, messages: updated.messages });
    })
  );

  // Rotate = revoke the old key and issue a new one, shown once
  app.post(
    "/api/api-keys/:id/rotate",
    requireWorkspace("BUYER"),
    ah(async (req, res) => {
      const tenant = await tenantForWorkspace(req.workspace);
      const old = await prisma.legacyApiKey.findFirst({
        where: { id: req.params.id, tenantId: tenant.id, status: "ACTIVE" }
      });
      if (!old) return res.status(404).json({ error: "API key not found", requestId: req.requestId });

      const envPrefix = old.environment === "Staging" ? "test" : "live";
      const rawSecret = randomBytes(24).toString("hex");
      const fullKey = `ctx_${envPrefix}_${rawSecret}`;
      const created = await prisma.$transaction(async (tx) => {
        await tx.legacyApiKey.update({ where: { id: old.id }, data: { status: "REVOKED" } });
        return tx.legacyApiKey.create({
          data: {
            id: `key-${randomBytes(6).toString("hex")}`,
            tenantId: tenant.id,
            name: old.name,
            prefix: `ctx_${envPrefix}_${rawSecret.substring(0, 6)}…`,
            keyHash: sha256(fullKey),
            environment: old.environment,
            status: "ACTIVE",
            monthlySpend: 0
          }
        });
      });
      await audit(req, "apikey.rotated", {
        workspaceId: req.workspace.id,
        resourceId: created.id,
        before: { id: old.id }
      });
      const { keyHash: _omit, ...publicKey } = created;
      res.status(201).json({ ...publicKey, key: fullKey, keyShownOnce: true });
    })
  );
}
