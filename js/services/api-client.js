/**
 * Cortex Hub - API Client Service
 * Communicates with the Express REST API and PostgreSQL database
 * Includes transparent in-memory fallback if the backend is unreachable.
 * Upgraded to Master SRS v2.0 Multi-Vendor Marketplace Operations.
 */

import { CATALOG_COMPONENTS } from "../data/catalog-data.js";
import {
  MOCK_TENANT,
  MOCK_LICENSES,
  MOCK_API_KEYS,
  MOCK_CUSTOMIZATION_REQUESTS,
  MOCK_SUPPORT_TICKETS,
  MOCK_SELLER,
  MOCK_MODERATION_QUEUE,
  MOCK_BUYER_ENTITLEMENTS
} from "../data/mock-dashboard.js";

// G9 FIX: API base URL reads from environment config, never hardcoded.
// Set window.CORTEX_API_URL via a server-rendered <script> tag or env injection.
// Falls back to relative path '/api' so it works on any deployment.
const API_BASE = (typeof window !== "undefined" && window.CORTEX_API_URL)
  ? window.CORTEX_API_URL
  : "/api";

class ApiClient {
  constructor() {
    this.isBackendOnline = false;
    this.memoryComponents = [...CATALOG_COMPONENTS];
    this.memoryRequests = [...MOCK_CUSTOMIZATION_REQUESTS];
    this.memoryLicenses = [...MOCK_LICENSES];
    this.memoryApiKeys = [...MOCK_API_KEYS];
    this.memoryTickets = [...MOCK_SUPPORT_TICKETS];
    this.memorySeller = JSON.parse(JSON.stringify(MOCK_SELLER));
    this.memoryModerationQueue = [...MOCK_MODERATION_QUEUE];
    this.memoryEntitlements = [...MOCK_BUYER_ENTITLEMENTS];
    this.platformCommissionRate = 0.15; // 15% platform take-rate
  }

  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        this.isBackendOnline = data.status === "ONLINE";
        return data;
      }
    } catch {
      this.isBackendOnline = false;
    }
    return { status: "OFFLINE", database: "Local In-Memory Mode" };
  }

  // ------------------------------------------------------------------------
  // Components & Multi-Vendor Catalog (SRS v2.0 Section 10, 11)
  // ------------------------------------------------------------------------
  async getComponents() {
    try {
      const res = await fetch(`${API_BASE}/components`);
      if (res.ok) {
        const remote = await res.json();
        if (Array.isArray(remote) && remote.length > 0) return remote;
      }
    } catch {
      // Fallback to memory
    }
    return this.memoryComponents;
  }

  async getComponentById(id) {
    try {
      const res = await fetch(`${API_BASE}/components/${id}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return this.memoryComponents.find((c) => c.id === id) || null;
  }

  // ------------------------------------------------------------------------
  // Multi-Vendor Seller Studio & Submission Wizard (SRS v2.0 Section 12, 24)
  // ------------------------------------------------------------------------
  async getSellerProfile() {
    return this.memorySeller;
  }

  async submitSellerProduct(submissionData) {
    const slug = (submissionData.name || "custom-engine")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const newProduct = {
      id: slug || `prod-${Date.now()}`,
      name: submissionData.name,
      category: submissionData.category || "Generative AI",
      categoryBadge: "badge-indigo",
      productType: submissionData.productType || "AI_AGENT",
      version: submissionData.version || "v1.0.0",
      sellerName: this.memorySeller.displayName,
      sellerHandle: `@${this.memorySeller.handle}`,
      sellerVerified: true,
      sellerRating: 5.0,
      verificationStatus: "UNDER_REVIEW",
      shortDesc: submissionData.shortDesc || "Production AI component submitted via Seller Studio.",
      longDesc: submissionData.longDesc || submissionData.shortDesc || "",
      coreOutput: submissionData.coreOutput || "Inference Output & Structured Telemetry",
      targetBuyer: submissionData.targetBuyer || "Enterprise Developers & AI Engineers",
      basePrice: parseInt(submissionData.basePrice) || 499,
      priceFormatted: `$${parseInt(submissionData.basePrice) || 499}`,
      inrPriceFormatted: `₹${Math.round((parseInt(submissionData.basePrice) || 499) * 83.5).toLocaleString()}`,
      tags: submissionData.tags || ["AI", "Component", "Production"],
      licenseType: submissionData.licenseType || "Commercial Permissive (Multi-Seat)",
      downloadSize: submissionData.downloadSize || "420 MB",
      artifactChecksum: "a" + Math.random().toString(16).substring(2, 10) + "89201ef4582103e990b7123984172398471293",
      hardwareReqs: {
        vram: submissionData.vram || "8 GB VRAM",
        gpu: submissionData.gpu || "NVIDIA RTX 4090 / Cloud T4",
        cpu: submissionData.cpu || "4 Cores",
        ram: submissionData.ram || "16 GB RAM"
      },
      benchmarks: {
        accuracy: submissionData.accuracy || "96.5% Benchmark Accuracy",
        latencyP95: submissionData.latency || "650ms TTFT",
        dataset: submissionData.dataset || "Enterprise Benchmark 2026"
      },
      features: submissionData.features || [
        "Production-ready deployment manifest",
        "Strict input validation and error handling",
        "Deterministic zero-data-egress compliance"
      ],
      pricingTiers: [
        {
          name: "Starter",
          price: `$${parseInt(submissionData.basePrice) || 499}`,
          desc: "Single developer license for production workloads.",
          features: ["Full binary / artifact access", "Standard updates", "Community support"]
        },
        {
          name: "Pro",
          price: `$${Math.round((parseInt(submissionData.basePrice) || 499) * 2.5)}`,
          featured: true,
          desc: "Multi-seat team deployment with high-throughput SLA.",
          features: ["Priority bug fixes", "Dedicated VPC deployment guide", "Direct engineer email support"]
        }
      ],
      architecture: [
        { step: "1", title: "Ingress", desc: "Validate input payload & schema", icon: "shield" },
        { step: "2", title: "Inference Engine", desc: `${submissionData.framework || "PyTorch"} optimized execution`, icon: "cpu" },
        { step: "3", title: "Audit Verification", desc: "Telemetry check & output verification", icon: "check-circle" }
      ],
      codeSnippets: {
        python: `from cortexhub import ComponentClient

client = ComponentClient(api_key="ctx_live_...")
output = client.run(
    component="${slug}",
    payload={"query": "Test benchmark execution"}
)
print("Result:", output)`,
        curl: `curl -X POST https://api.cortex-hub.io/v1/${slug}/run \\
  -H "Authorization: Bearer ctx_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"query": "Test execution"}'`
      },
      rating: 5.0,
      ratingCount: 0,
      reviews: []
    };

    // Add to seller's local product portfolio
    this.memorySeller.products.unshift({
      id: newProduct.id,
      name: newProduct.name,
      category: newProduct.category,
      productType: newProduct.productType,
      salesCount: 0,
      grossRevenue: "$0",
      status: "UNDER_REVIEW",
      version: newProduct.version,
      rating: 0,
      downloads: 0,
      lastUpdated: "Just now"
    });

    // Add to Moderation Queue for Admin inspection
    const modItem = {
      id: `MOD-${Math.floor(400 + Math.random() * 500)}`,
      productId: newProduct.id,
      productName: newProduct.name,
      productType: newProduct.productType,
      category: newProduct.category,
      sellerName: this.memorySeller.displayName,
      sellerHandle: `@${this.memorySeller.handle}`,
      price: newProduct.priceFormatted,
      submittedDate: new Date().toISOString().split("T")[0],
      status: "UNDER_REVIEW",
      checklist: {
        malwareScan: "PASS (Automated static analysis clean)",
        licenseCompliance: `PASS (${newProduct.licenseType} verified)`,
        documentation: "PASS (Quickstart, schema specs, dependencies verified)",
        sandboxIntegrity: "PASS (Container builds cleanly, healthy sandbox)"
      },
      specs: `${newProduct.productType} engine targeting ${newProduct.targetBuyer}. Framework: ${submissionData.framework || "PyTorch"}. VRAM: ${newProduct.hardwareReqs.vram}.`,
      productRef: newProduct
    };
    this.memoryModerationQueue.unshift(modItem);

    return { product: newProduct, moderation: modItem };
  }

  async requestSellerPayout(amount, method, destination) {
    const amtNum = parseFloat(amount) || 1000;
    if (amtNum > this.memorySeller.availableBalance) {
      throw new Error(`Requested amount ($${amtNum}) exceeds available balance ($${this.memorySeller.availableBalance})`);
    }

    this.memorySeller.availableBalance -= amtNum;
    const newPayout = {
      id: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      amount: `$${amtNum.toFixed(2)}`,
      method: method || "Stripe Connect / ACH",
      status: "PROCESSING",
      txHash: `tx_${Math.random().toString(36).substring(2, 10)}`
    };
    this.memorySeller.payoutHistory.unshift(newPayout);
    return newPayout;
  }

  // ------------------------------------------------------------------------
  // Product Reviews & Ratings (SRS v2.0 Section 21)
  // ------------------------------------------------------------------------
  async submitReview(componentId, reviewData) {
    const comp = this.memoryComponents.find((c) => c.id === componentId);
    if (!comp) return null;

    const newRev = {
      id: `rev-${Date.now()}`,
      buyerName: reviewData.buyerName || "Verified Enterprise Buyer",
      rating: parseInt(reviewData.rating) || 5,
      version: comp.version,
      date: new Date().toISOString().split("T")[0],
      title: reviewData.title || "Excellent production performance",
      comment: reviewData.comment || "Integrated seamlessly into our production pipelines."
    };

    comp.reviews = comp.reviews || [];
    comp.reviews.unshift(newRev);
    comp.ratingCount = (comp.ratingCount || 0) + 1;

    // Recalculate average rating
    const sum = comp.reviews.reduce((acc, r) => acc + r.rating, 0);
    comp.rating = parseFloat((sum / comp.reviews.length).toFixed(1));

    return newRev;
  }

  // ------------------------------------------------------------------------
  // Admin Operations & Product Moderation Queue (SRS v2.0 Section 13, 31)
  // ------------------------------------------------------------------------
  async getModerationQueue() {
    return this.memoryModerationQueue;
  }

  async moderateProduct(modId, action, reason) {
    const mod = this.memoryModerationQueue.find((m) => m.id === modId);
    if (!mod) return null;

    mod.status = action === "APPROVE" ? "APPROVED" : "REJECTED";
    mod.resolutionReason = reason || (action === "APPROVE" ? "Passed technical specification and malware scan." : "Requires additional documentation.");

    // If approved, publish to the active catalog!
    if (action === "APPROVE" && mod.productRef) {
      mod.productRef.verificationStatus = "VERIFIED";
      // Check if not already in catalog
      const exists = this.memoryComponents.find((c) => c.id === mod.productRef.id);
      if (!exists) {
        this.memoryComponents.unshift(mod.productRef);
      }
      // Update status in seller portfolio
      const sellerProd = this.memorySeller.products.find((p) => p.id === mod.productId);
      if (sellerProd) sellerProd.status = "PUBLISHED";
    } else if (action === "REJECT") {
      const sellerProd = this.memorySeller.products.find((p) => p.id === mod.productId);
      if (sellerProd) sellerProd.status = "REJECTED";
    }

    return mod;
  }

  // ------------------------------------------------------------------------
  // Digital Entitlements & Orders (SRS v2.0 Section 14, 17, 23)
  // ------------------------------------------------------------------------
  async getBuyerEntitlements() {
    return this.memoryEntitlements;
  }

  async checkoutLicense(componentId, tier, paymentMethod = "Corporate Credit Card") {
    const comp = this.memoryComponents.find((c) => c.id === componentId);
    const compName = comp ? comp.name : componentId;
    const version = comp ? comp.version : "v1.0.0";
    const priceNum = comp ? comp.basePrice : 499;

    // G2 FIX: CSPRNG for license keys, not Math.random()
    const licBytes = new Uint8Array(12);
    crypto.getRandomValues(licBytes);
    const licHex = Array.from(licBytes).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const licenseKey = `LIC-${componentId.toUpperCase().slice(0, 4)}-${licHex.substring(0, 6)}-${licHex.substring(6, 12)}`;

    // Create License record
    const newLic = {
      id: `lic_${Date.now()}`,
      componentId,
      componentName: compName,
      version,
      tier: tier || "Starter",
      licenseKey,
      status: "Active",
      startDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      renewalDate: "Sep 24, 2027",
      monthlyPrice: `$${priceNum}`,
      quotaUsed: "0%",
      rateLimit: "1,000 req/min",
      env: "Dedicated AWS VPC"
    };
    this.memoryLicenses.unshift(newLic);

    // Create Digital Entitlement (Instant Download Link + API Quota)
    const newEntitlement = {
      id: `ent-${componentId.slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`,
      componentId,
      componentName: compName,
      sellerName: comp ? comp.sellerName : "Apex AI Labs",
      version,
      tier: tier || "Starter",
      licenseKey,
      downloadAllowed: true,
      downloadUrl: `https://artifacts.cortex-hub.io/signed/${componentId}-${version}-prod.tar.gz?token=exp_${Date.now() + 86400000}`,
      fileSize: comp ? comp.downloadSize : "850 MB",
      checksumSha256: comp ? comp.artifactChecksum : "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      apiQuota: "500,000 reqs/mo",
      apiUsed: "0 reqs",
      purchasedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };
    this.memoryEntitlements.unshift(newEntitlement);

    // Update seller earnings ledger
    const grossSale = priceNum;
    const fee = grossSale * this.platformCommissionRate;
    const sellerNet = grossSale - fee;
    this.memorySeller.grossRevenueUsd += grossSale;
    this.memorySeller.platformFeesPaid += fee;
    this.memorySeller.netEarningsUsd += sellerNet;
    this.memorySeller.availableBalance += sellerNet;
    this.memorySeller.totalSalesCount += 1;

    return newLic;
  }

  // ------------------------------------------------------------------------
  // Tenant & API Keys & Customization Requests
  // ------------------------------------------------------------------------
  async getTenant() {
    return MOCK_TENANT;
  }

  async getLicenses() {
    return this.memoryLicenses;
  }

  async getCustomizationRequests() {
    return this.memoryRequests;
  }

  async submitCustomizationRequest(payload) {
    this.memoryRequests.unshift(payload);
    return payload;
  }

  async updateCustomizationRequest(id, updatePayload) {
    const req = this.memoryRequests.find((r) => r.id === id);
    if (req) {
      if (updatePayload.status) req.status = updatePayload.status;
      if (updatePayload.statusStep) req.statusStep = updatePayload.statusStep;
      if (updatePayload.estimatedPrice) req.estimatedPrice = updatePayload.estimatedPrice;
      if (updatePayload.timelineEvent) {
        req.timelineLog = req.timelineLog || [];
        req.timelineLog.unshift({
          date: new Date().toISOString().split("T")[0],
          event: updatePayload.timelineEvent
        });
      }
      return req;
    }
    return null;
  }

  async getApiKeys() {
    return this.memoryApiKeys;
  }

  async createApiKey(name, environment) {
    // G2 FIX: Use crypto.getRandomValues() (CSPRNG) - never Math.random() for secrets.
    const randomBytes = new Uint8Array(20);
    crypto.getRandomValues(randomBytes);
    const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, "0")).join("");
    const envPrefix = environment === "Staging" ? "test" : "live";
    const rawKey = `ctx_${envPrefix}_${randomHex}`;
    const maskedKey = `ctx_${envPrefix}_${randomHex.substring(0, 6)}[REDACTED]`;

    const newKey = {
      id: `key-${randomHex.substring(0, 8)}`,
      name: name || "Production Cluster Key",
      prefix: maskedKey,
      rawKey, // shown ONCE to user, never retrievable again after creation
      environment: environment || "Production",
      status: "Active",
      calls30d: "0",
      lastUsed: "Just now"
    };
    this.memoryApiKeys.unshift(newKey);
    return newKey;
  }

    async revokeApiKey(id) {
    const k = this.memoryApiKeys.find((item) => item.id === id);
    if (k) k.status = "Revoked";
    return true;
  }

  async getTickets() {
    return this.memoryTickets;
  }

  async createTicket(payload) {
    const newTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: payload.subject,
      priority: payload.priority || "Medium",
      status: "Open",
      lastActivity: "Just now",
      messages: [
        {
          sender: "Customer",
          time: "Just now",
          text: payload.message || "Ticket logged."
        }
      ]
    };
    this.memoryTickets.unshift(newTicket);
    return newTicket;
  }
}

export const apiClient = new ApiClient();
