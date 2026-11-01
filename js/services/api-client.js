/**
 * Cortex Hub - API Client Service
 * Communicates with the Express REST API and PostgreSQL database
 * Live data when signed in with the matching workspace or staff role; otherwise the
 * in-memory sample data below, which the views label as sample data.
 */

import { CATALOG_COMPONENTS } from "../data/catalog-data.js";
import { MOCK_CUSTOMIZATION_REQUESTS, MOCK_SELLER, MOCK_MODERATION_QUEUE } from "../data/mock-dashboard.js";

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
    this.memorySeller = JSON.parse(JSON.stringify(MOCK_SELLER));
    this.memoryModerationQueue = [...MOCK_MODERATION_QUEUE];
  }

  // ------------------------------------------------------------------------
  // Live API plumbing. Portals use live data when the signed-in user has the
  // matching workspace; otherwise they show the sample data below, labelled as such.
  // ------------------------------------------------------------------------
  setCurrentUser(user) {
    this.currentUser = user || null;
  }

  hasWorkspace(type) {
    return Boolean(this.currentUser && this.currentUser.workspaces.some((w) => w.type === type));
  }

  isStaff() {
    return Boolean(this.currentUser && ["ADMIN", "SUPERADMIN", "MODERATOR", "SUPPORT", "FINANCE"].includes(this.currentUser.globalRole));
  }

  async request(method, path, body, headers = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { ...(body !== undefined && { "Content-Type": "application/json" }), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // Buyer portal: everything the customer view needs, in one call
  async getBuyerPortal() {
    const [summary, entitlements, apiKeys, tickets, requests, usage] = await Promise.all([
      this.request("GET", "/buyer/summary"),
      this.request("GET", "/entitlements"),
      this.request("GET", "/api-keys"),
      this.request("GET", "/tickets"),
      this.request("GET", "/customization-requests"),
      this.request("GET", "/usage/daily?days=7")
    ]);
    return { summary, entitlements, apiKeys, tickets, requests, usage };
  }

  createApiKeyLive(name, environment) {
    return this.request("POST", "/api-keys", { name, environment });
  }

  rotateApiKeyLive(id) {
    return this.request("POST", `/api-keys/${encodeURIComponent(id)}/rotate`, {});
  }

  revokeApiKeyLive(id) {
    return this.request("DELETE", `/api-keys/${encodeURIComponent(id)}`);
  }

  rotateLicenseKey(entitlementId) {
    return this.request("POST", `/entitlements/${encodeURIComponent(entitlementId)}/rotate-key`, {});
  }

  createTicketLive(subject, priority, message) {
    return this.request("POST", "/tickets", { subject, priority, message });
  }

  replyToTicket(id, text) {
    return this.request("POST", `/tickets/${encodeURIComponent(id)}/messages`, { text });
  }

  // Checkout (INR via Razorpay, or simulated outside production)
  getCheckoutConfig() {
    return this.request("GET", "/checkout/config");
  }

  getProductPrices(slug) {
    return this.request("GET", `/products/${encodeURIComponent(slug)}/prices`);
  }

  startCheckout(productSlug, tier, idempotencyKey) {
    return this.request("POST", "/checkout", { productSlug, tier }, { "Idempotency-Key": idempotencyKey });
  }

  confirmCheckout(orderId, paymentResult = {}) {
    return this.request("POST", `/checkout/${encodeURIComponent(orderId)}/confirm`, paymentResult);
  }

  // Admin
  getAdminRevenue() {
    return this.request("GET", "/admin/revenue");
  }

  setCommissionRate(commissionRate) {
    return this.request("PUT", "/admin/settings/commission", { commissionRate });
  }

  setProductPrice(slug, tier, amountInr) {
    return this.request("PUT", `/admin/products/${encodeURIComponent(slug)}/prices/${encodeURIComponent(tier)}`, { amountInr });
  }

  getAdminPayouts() {
    return this.request("GET", "/admin/payouts");
  }

  updatePayout(id, status) {
    return this.request("POST", `/admin/payouts/${encodeURIComponent(id)}`, { status });
  }

  // Sandbox: streams Server-Sent Events from a POST (EventSource only supports GET)
  getSandboxStatus() {
    return this.request("GET", "/sandbox/status");
  }

  async runSandbox(payload, { onText, onDone, onError }) {
    const res = await fetch(`${API_BASE}/sandbox/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      onError(data.error || `Sandbox request failed (${res.status})`);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const chunk = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const event = /^event: (.*)$/m.exec(chunk)?.[1];
        const dataLine = /^data: (.*)$/m.exec(chunk)?.[1];
        if (!event || !dataLine) continue;
        const data = JSON.parse(dataLine);
        if (event === "text") onText(data.text);
        else if (event === "done") onDone(data);
        else if (event === "error") onError(data.error);
      }
    }
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
  // Authentication (SRS v3.0 AUTH-01, G1) - session cookie set by the server
  // ------------------------------------------------------------------------
  async getCurrentUser() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`);
      if (res.ok) return (await res.json()).user || null;
    } catch {
      // Backend offline: treat as signed out
    }
    return null;
  }

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Sign-in failed");
    return data.user;
  }

  async logout() {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    }).catch(() => {});
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
    if (!this.hasWorkspace("SELLER")) return { ...this.memorySeller, currency: "USD", isSample: true };
    const d = await this.request("GET", "/seller/dashboard");
    const major = (minor) => minor / 100;
    const money = (minor) => new Intl.NumberFormat("en-IN", { style: "currency", currency: d.currency }).format(minor / 100);
    const conv = d.funnel.productViews ? `${((d.funnel.purchases / d.funnel.productViews) * 100).toFixed(1)}%` : "—";
    return {
      isSample: false,
      currency: d.currency,
      handle: d.handle,
      displayName: d.displayName,
      organization: d.organization,
      bio: d.bio,
      verifiedLevel: d.verifiedLevel,
      kycPassed: d.kycPassed,
      website: d.website,
      github: d.github,
      grossRevenueUsd: major(d.grossMinor),
      platformFeesPaid: major(d.feesMinor),
      netEarningsUsd: major(d.grossMinor - d.feesMinor - d.refundsMinor),
      availableBalance: major(d.availableMinor),
      pendingBalance: major(d.pendingMinor),
      platformFeeRate: d.grossMinor ? d.feesMinor / d.grossMinor : 0.15,
      totalSalesCount: d.totalSalesCount,
      averageRating: d.averageRating,
      payoutHoldDays: d.payoutHoldDays,
      minPayout: major(d.minPayoutMinor),
      funnelMetrics: {
        impressions: "—",
        productViews: d.funnel.productViews.toLocaleString(),
        demoRuns: d.funnel.demoRuns.toLocaleString(),
        checkouts: d.funnel.checkouts.toLocaleString(),
        purchases: d.funnel.purchases.toLocaleString(),
        conversionRate: conv
      },
      products: d.products.map((p) => ({
        ...p,
        grossRevenue: money(p.grossMinor),
        rating: p.rating ?? "—",
        lastUpdated: String(p.lastUpdated).slice(0, 10)
      })),
      payoutHistory: d.payoutHistory.map((p) => ({
        id: p.id,
        date: new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        amount: money(p.amountMinor),
        method: p.method.replace("_", " "),
        status: p.status,
        txHash: p.id.slice(0, 8)
      }))
    };
  }

  async submitSellerProduct(submissionData) {
    if (this.hasWorkspace("SELLER")) {
      const res = await this.request("POST", "/seller/products", {
        name: submissionData.name,
        version: submissionData.version,
        category: submissionData.category,
        productType: submissionData.productType,
        shortDesc: submissionData.shortDesc,
        longDesc: submissionData.longDesc,
        targetBuyer: submissionData.targetBuyer,
        licenseType: submissionData.licenseType,
        basePriceInr: Number(submissionData.basePrice),
        framework: submissionData.framework,
        hardware: [submissionData.vram, submissionData.gpu, submissionData.cpu].filter(Boolean).join(", "),
        benchmark: submissionData.accuracy
      });
      return { product: res.product, moderation: { id: res.product.id, status: res.product.status } };
    }
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

  async requestSellerPayout(amount, method) {
    if (this.hasWorkspace("SELLER")) {
      const methodKey = /razorpay/i.test(method || "") ? "razorpay" : /stripe/i.test(method || "") ? "stripe_connect" : "bank_transfer";
      return this.request("POST", "/seller/payouts", { amountMinor: Math.round(Number(amount) * 100), method: methodKey });
    }
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
    if (this.isStaff()) return this.request("GET", "/admin/moderation");
    return this.memoryModerationQueue;
  }

  async moderateProduct(modId, action, reason) {
    if (this.isStaff()) {
      const res = await this.request("POST", `/admin/moderation/${encodeURIComponent(modId)}`, { action, reason });
      return res.item;
    }
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
  // Tenant & API Keys & Customization Requests
  // ------------------------------------------------------------------------
  async getCustomizationRequests() {
    if (this.hasWorkspace("BUYER") || this.isStaff()) return this.request("GET", "/customization-requests");
    return this.memoryRequests;
  }

  async submitCustomizationRequest(payload) {
    if (this.hasWorkspace("BUYER")) {
      return this.request("POST", "/customization-requests", {
        componentId: payload.componentId,
        componentName: payload.componentName,
        scope: payload.scope,
        industry: payload.industry,
        deploymentTarget: payload.deploymentTarget,
        estimatedPrice: payload.estimatedPrice,
        priceInr: payload.priceInr,
        targetDelivery: payload.targetDelivery
      });
    }
    this.memoryRequests.unshift(payload);
    return payload;
  }

  async updateCustomizationRequest(id, updatePayload) {
    if (this.isStaff()) return this.request("PATCH", `/customization-requests/${encodeURIComponent(id)}`, updatePayload);
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

  // ------------------------------------------------------------------------
  // Twilio Integration (SRS §2.3, ADM-06)
  // ------------------------------------------------------------------------
  async getTwilioStatus() {
    try {
      const res = await fetch(`${API_BASE}/twilio/status`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return { configured: false, status: "UNAVAILABLE", message: "Could not reach the API or not signed in as staff" };
  }

  async sendTwilioNotification({ to, message, channel = "whatsapp" }) {
    try {
      const res = await fetch(`${API_BASE}/notifications/${channel}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, message, channel })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

}

export const apiClient = new ApiClient();
