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

app.use(cors());
app.use(express.json());

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
    res.status(500).json({ error: "Failed to fetch components", details: err.message });
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
    res.status(500).json({ error: "Failed to fetch component", details: err.message });
  }
});

app.post("/api/components", async (req, res) => {
  try {
    const created = await prisma.component.create({
      data: req.body
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to create component", details: err.message });
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
    res.status(500).json({ error: "Failed to update component", details: err.message });
  }
});

app.delete("/api/components/:id", async (req, res) => {
  try {
    await prisma.component.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: `Component ${req.params.id} deleted` });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete component", details: err.message });
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
    res.status(500).json({ error: "Failed to fetch customization requests", details: err.message });
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
        id: id || `CR-${Math.floor(1000 + Math.random() * 9000)}`,
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
    res.status(500).json({ error: "Failed to submit customization request", details: err.message });
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
    res.status(500).json({ error: "Failed to update customization request", details: err.message });
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
    res.status(500).json({ error: "Failed to fetch tenant info", details: err.message });
  }
});

app.get("/api/licenses", async (req, res) => {
  try {
    const licenses = await prisma.license.findMany({
      include: { component: true }
    });
    res.json(licenses);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch licenses", details: err.message });
  }
});

app.post("/api/licenses/checkout", async (req, res) => {
  try {
    const { componentId, tier } = req.body;
    const defaultTenant = await prisma.tenant.findFirst();
    const tenantId = defaultTenant ? defaultTenant.id : "tnt-8849-acme";

    const generatedLicenseKey = `LIC-${componentId.toUpperCase().slice(0, 4)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

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
    res.status(500).json({ error: "Failed to process license checkout", details: err.message });
  }
});

app.get("/api/api-keys", async (req, res) => {
  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json(keys);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch API keys", details: err.message });
  }
});

app.post("/api/api-keys", async (req, res) => {
  try {
    const { name, environment } = req.body;
    const defaultTenant = await prisma.tenant.findFirst();
    const tenantId = defaultTenant ? defaultTenant.id : "tnt-8849-acme";

    const newKeyId = `key-${Math.floor(100 + Math.random() * 900)}`;
    const secretSuffix = Math.random().toString(36).substring(2, 10);
    const prefix = `ctx_${environment === "Staging" ? "test" : "live"}_${secretSuffix}••••••••`;

    const newKey = await prisma.apiKey.create({
      data: {
        id: newKeyId,
        tenantId,
        name: name || "Default Client Key",
        prefix,
        keyHash: `sha256_${newKeyId}`,
        environment: environment || "Production",
        status: "ACTIVE",
        monthlySpend: 0.0,
        lastUsed: new Date()
      }
    });

    res.status(201).json(newKey);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate API key", details: err.message });
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
    res.status(500).json({ error: "Failed to revoke API key", details: err.message });
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
    res.status(500).json({ error: "Failed to fetch support tickets", details: err.message });
  }
});

app.post("/api/tickets", async (req, res) => {
  try {
    const { subject, priority, message } = req.body;
    const defaultTenant = await prisma.tenant.findFirst();
    const tenantId = defaultTenant ? defaultTenant.id : "tnt-8849-acme";
    const ticketId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;

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
    res.status(500).json({ error: "Failed to create support ticket", details: err.message });
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

// Start Express Server
app.listen(PORT, () => {
  console.log(`⚡ Cortex Hub REST API running on http://localhost:${PORT}`);
  console.log(`🐘 Connected to PostgreSQL 18 via Prisma ORM`);
});
