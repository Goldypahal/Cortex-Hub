/**
 * Cortex Hub - Seller Studio & Submission Wizard View Controller
 * Implements SRS v2.0 Sections 12 (Submission Wizard), 18 (Monetization),
 * 20 (Wallet & Payouts), and 24 (Seller Dashboard).
 */

import { getIconSvg, showToast } from "../utils/helpers.js";

export class SellerView {
  constructor(app) {
    this.app = app;
    this.activeTab = "portfolio"; // 'portfolio', 'submit', 'wallet', 'analytics'
    this.submissionStep = 1;
    this.wizardData = {
      name: "",
      shortDesc: "",
      longDesc: "",
      category: "Generative AI",
      productType: "AI_AGENT",
      tags: "AI, Agents, Production",
      framework: "PyTorch 2.4 / Transformers",
      vram: "8 GB VRAM",
      gpu: "NVIDIA RTX 4090 / A10G",
      cpu: "4 Cores (x86_64)",
      ram: "16 GB RAM",
      accuracy: "97.2% Benchmark Precision",
      latency: "620ms P95 Latency",
      dataset: "SWE-Bench / Standard 2026",
      version: "v1.0.0",
      licenseType: "Commercial Permissive (Multi-Seat)",
      basePrice: "499",
      deliveryType: "Downloadable Artifact + API Access",
      downloadSize: "540 MB",
      targetBuyer: "Enterprise AI Engineering Teams",
      coreOutput: "Structured JSON Inference & Citations"
    };
  }

  async render(container) {
    const seller = await this.app.api.getSellerProfile();

    container.innerHTML = `
      <!-- Seller Studio Header Banner -->
      <section class="seller-studio-header">
        <div class="seller-header-left">
          <div class="seller-avatar-badge">
            <span class="seller-monogram">AP</span>
            <span class="seller-verified-pip" title="Verified Tier-1 Seller">${getIconSvg("check", 12)}</span>
          </div>
          <div class="seller-meta">
            <div style="display: flex; align-items: center; gap: 8px;">
              <h2 class="seller-name">${seller.displayName}</h2>
              <span class="badge badge-lime">${seller.verifiedLevel}</span>
              <span class="badge badge-gray">TIER-1 VENDOR</span>
            </div>
            <p class="seller-bio">${seller.bio}</p>
            <div class="seller-subline">
              <span>Handle: <strong>@${seller.handle}</strong></span>
              <span class="ticker-divider">/</span>
              <span>Total Sales: <strong>${seller.totalSalesCount} units</strong></span>
              <span class="ticker-divider">/</span>
              <span>Rating: <strong>★ ${seller.averageRating}</strong></span>
              <span class="ticker-divider">/</span>
              <span>Platform Take-Rate: <strong>${Math.round(seller.platformFeeRate * 100)}%</strong></span>
            </div>
          </div>
        </div>

        <div class="seller-header-stats">
          <div class="seller-stat-card">
            <span class="stat-label">GROSS REVENUE</span>
            <span class="stat-value text-accent">$${seller.grossRevenueUsd.toLocaleString()}</span>
            <span class="stat-sub">Lifetime Component Sales</span>
          </div>
          <div class="seller-stat-card">
            <span class="stat-label">AVAILABLE PAYOUT</span>
            <span class="stat-value" style="color: var(--accent-cyan);">$${seller.availableBalance.toLocaleString()}</span>
            <button class="btn btn-secondary btn-sm" id="btn-request-payout-header" style="margin-top: 6px;">
              Request Payout →
            </button>
          </div>
        </div>
      </section>

      <!-- Seller Studio Tabs Navigation -->
      <div class="seller-tabs-nav">
        <button class="seller-tab-btn ${this.activeTab === "portfolio" ? "active" : ""}" data-tab="portfolio">
          ${getIconSvg("layers", 14)} Product Portfolio [${seller.products.length}]
        </button>
        <button class="seller-tab-btn ${this.activeTab === "submit" ? "active" : ""}" data-tab="submit">
          ${getIconSvg("upload", 14)} 8-Step Component Submission Wizard
        </button>
        <button class="seller-tab-btn ${this.activeTab === "wallet" ? "active" : ""}" data-tab="wallet">
          ${getIconSvg("dollar-sign", 14)} Wallet &amp; Payouts
        </button>
        <button class="seller-tab-btn ${this.activeTab === "analytics" ? "active" : ""}" data-tab="analytics">
          ${getIconSvg("activity", 14)} Sales Funnel Analytics
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="seller-tab-content" class="seller-tab-content">
        <!-- Rendered dynamically -->
      </div>

      <!-- Payout Request Modal -->
      <div id="seller-payout-modal" class="modal-backdrop"></div>
    `;

    this.attachEvents(container, seller);
    this.renderActiveTab(seller);
  }

  attachEvents(container, seller) {
    const tabBtns = container.querySelectorAll(".seller-tab-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.activeTab = btn.dataset.tab;
        this.renderActiveTab(seller);
      });
    });

    const headerPayoutBtn = container.querySelector("#btn-request-payout-header");
    if (headerPayoutBtn) {
      headerPayoutBtn.addEventListener("click", () => this.openPayoutModal(seller));
    }
  }

  renderActiveTab(seller) {
    const content = document.getElementById("seller-tab-content");
    if (!content) return;

    if (this.activeTab === "portfolio") {
      this.renderPortfolioTab(content, seller);
    } else if (this.activeTab === "submit") {
      this.renderSubmissionWizard(content, seller);
    } else if (this.activeTab === "wallet") {
      this.renderWalletTab(content, seller);
    } else if (this.activeTab === "analytics") {
      this.renderAnalyticsTab(content, seller);
    }
  }

  // --------------------------------------------------------------------------
  // Tab 1: Product Portfolio
  // --------------------------------------------------------------------------
  renderPortfolioTab(content, seller) {
    content.innerHTML = `
      <div class="portfolio-action-bar">
        <div>
          <h3 style="font-family: var(--font-heading); color: #FFF; font-size: 1.2rem;">Published &amp; Pending Components</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 2px;">
            Manage versions, view downloads, and track component status across the Cortex Hub catalog.
          </p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-portfolio-new-submission">
          + New Component Submission
        </button>
      </div>

      <div class="seller-table-container">
        <table class="seller-table">
          <thead>
            <tr>
              <th>COMPONENT / ENGINE</th>
              <th>CATEGORY &amp; TYPE</th>
              <th>VERSION</th>
              <th>STATUS</th>
              <th>SALES</th>
              <th>GROSS REVENUE</th>
              <th>RATING</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            ${seller.products
              .map(
                (p) => `
              <tr>
                <td>
                  <div style="font-weight: 600; color: #FFF;">${p.name}</div>
                  <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${p.id}</div>
                </td>
                <td>
                  <span class="badge badge-gray">${p.category || "AI Engine"}</span>
                  <span class="badge badge-indigo" style="font-size: 0.65rem;">${p.productType || "RAG_SYSTEM"}</span>
                </td>
                <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-cyan);">${p.version}</td>
                <td>
                  <span class="badge ${p.status === "PUBLISHED" ? "badge-lime" : p.status === "UNDER_REVIEW" ? "badge-amber" : "badge-gray"}">
                    ${p.status === "UNDER_REVIEW" ? "● UNDER REVIEW" : p.status}
                  </span>
                </td>
                <td style="font-family: var(--font-mono); font-size: 0.85rem;">${p.salesCount || 0}</td>
                <td style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-lime);">${p.grossRevenue || "$0"}</td>
                <td style="font-family: var(--font-mono); font-size: 0.85rem; color: #FFF;">
                  ${p.rating > 0 ? `★ ${p.rating}` : "N/A"}
                </td>
                <td>
                  <div style="display: flex; gap: 6px;">
                    <button class="btn btn-ghost btn-sm btn-view-in-catalog" data-id="${p.id}" title="Inspect in Catalog">
                      ${getIconSvg("eye", 13)}
                    </button>
                    <button class="btn btn-ghost btn-sm" title="Edit Artifact Details" onclick="showToast('Opened component configuration editor', 'info')">
                      ${getIconSvg("edit", 13)}
                    </button>
                  </div>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    const newSubBtn = content.querySelector("#btn-portfolio-new-submission");
    if (newSubBtn) {
      newSubBtn.addEventListener("click", () => {
        this.activeTab = "submit";
        this.renderActiveTab(seller);
        document.querySelectorAll(".seller-tab-btn").forEach((b) => {
          b.classList.toggle("active", b.dataset.tab === "submit");
        });
      });
    }

    content.querySelectorAll(".btn-view-in-catalog").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.app.navigateTo("marketplace");
        showToast("Navigated to Marketplace view", "info");
      });
    });
  }

  // --------------------------------------------------------------------------
  // Tab 2: 8-Step Product Submission Wizard (SRS v2.0 Section 12)
  // --------------------------------------------------------------------------
  renderSubmissionWizard(content, seller) {
    content.innerHTML = `
      <div class="wizard-container">
        <!-- Wizard Step Tracker -->
        <div class="wizard-stepper">
          ${[
            "1. Basic Info",
            "2. Technical Specs",
            "3. Files & Artifacts",
            "4. Quickstart Docs",
            "5. Licensing",
            "6. Pricing Model",
            "7. Sandbox Demo",
            "8. Review & Submit"
          ]
            .map((name, i) => {
              const stepNum = i + 1;
              const isActive = this.submissionStep === stepNum;
              const isDone = this.submissionStep > stepNum;
              return `
              <div class="wizard-step-node ${isActive ? "active" : ""} ${isDone ? "completed" : ""}" data-step="${stepNum}">
                <div class="step-circle">${isDone ? "✓" : stepNum}</div>
                <div class="step-name">${name}</div>
              </div>
            `;
            })
            .join("")}
        </div>

        <!-- Wizard Step Form Body -->
        <div class="wizard-card">
          <div class="wizard-card-header">
            <span class="badge badge-lime">// SRS v2.0 SECTION 12 PUBLISHING PIPELINE</span>
            <h3 class="wizard-step-title" style="margin-top: 6px;">${this.getStepTitle(this.submissionStep)}</h3>
            <p class="wizard-step-desc">${this.getStepDesc(this.submissionStep)}</p>
          </div>

          <div class="wizard-form-body">
            ${this.renderStepFormContent(this.submissionStep)}
          </div>

          <div class="wizard-card-footer">
            <button class="btn btn-secondary" id="wizard-btn-prev" ${this.submissionStep === 1 ? "disabled" : ""}>
              ← Previous Step
            </button>
            <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">
              Step ${this.submissionStep} of 8
            </div>
            ${
              this.submissionStep < 8
                ? `<button class="btn btn-primary" id="wizard-btn-next">Next Step →</button>`
                : `<button class="btn btn-primary" id="wizard-btn-submit" style="background: var(--accent-lime); color: #000;">
                    ${getIconSvg("check-circle", 14)} Submit for Admin Moderation
                   </button>`
            }
          </div>
        </div>
      </div>
    `;

    this.attachWizardEvents(content, seller);
  }

  getStepTitle(step) {
    const titles = {
      1: "Step 1: Component Fundamentals & Category",
      2: "Step 2: Technical Specifications & Hardware Requirements",
      3: "Step 3: Component Artifacts, Weights & Delivery Model",
      4: "Step 4: Developer Documentation, Quickstart & cURL Snippets",
      5: "Step 5: Commercial Licensing & Rights Management",
      6: "Step 6: Monetization & Tiered Pricing Architecture",
      7: "Step 7: Live Sandbox & Inference Demo Configuration",
      8: "Step 8: Specification Audit & Submission for Review"
    };
    return titles[step] || "Product Submission";
  }

  getStepDesc(step) {
    const descs = {
      1: "Define component identity, market problem solved, target enterprise buyers, and taxonomic category.",
      2: "Specify ML framework, model architecture, VRAM bounds, and verified benchmark metrics.",
      3: "Configure signed delivery artifacts (Docker images, wheel packages, or model checkpoint tarballs).",
      4: "Provide concrete developer quickstart code and API invocation schemas for seamless buyer adoption.",
      5: "Specify commercial usage rights, multi-seat allowances, and source modification entitlements.",
      6: "Select monetization model: One-time license, subscription, usage-based, or enterprise custom quote.",
      7: "Configure input parameters and interactive playground sandbox for prospective buyers.",
      8: "Perform automated compliance pre-flight checks and dispatch component to Admin Moderation Queue."
    };
    return descs[step] || "";
  }

  renderStepFormContent(step) {
    if (step === 1) {
      return `
        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Component Name *</label>
            <input type="text" class="text-input" id="wiz-name" value="${this.wizardData.name || "Autonomous Kubernetes DevOps MCP Bridge"}" placeholder="e.g. Enterprise Legal RAG Pipeline" />
          </div>
          <div class="form-group" style="width: 140px;">
            <label class="form-label">Version</label>
            <input type="text" class="text-input" id="wiz-version" value="${this.wizardData.version}" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Category (SRS Section 8) *</label>
            <select class="select-input" id="wiz-category">
              <option value="Generative AI" ${this.wizardData.category === "Generative AI" ? "selected" : ""}>Generative AI (LLMs, LoRA, RAG, Agents)</option>
              <option value="Computer Vision" ${this.wizardData.category === "Computer Vision" ? "selected" : ""}>Computer Vision &amp; Document AI</option>
              <option value="Developer Tools" ${this.wizardData.category === "Developer Tools" ? "selected" : ""}>Developer Tools &amp; MCP Servers</option>
              <option value="NLP" ${this.wizardData.category === "NLP" ? "selected" : ""}>NLP, Embeddings &amp; Rerankers</option>
              <option value="Machine Learning" ${this.wizardData.category === "Machine Learning" ? "selected" : ""}>Machine Learning &amp; Recommendation</option>
              <option value="EdTech" ${this.wizardData.category === "EdTech" ? "selected" : ""}>EdTech &amp; Assessment</option>
            </select>
          </div>
          <div class="form-group flex-1">
            <label class="form-label">Product Type (SRS Section 9) *</label>
            <select class="select-input" id="wiz-type">
              <option value="MCP_SERVER" ${this.wizardData.productType === "MCP_SERVER" ? "selected" : ""}>MCP_SERVER (Model Context Protocol)</option>
              <option value="RAG_SYSTEM" ${this.wizardData.productType === "RAG_SYSTEM" ? "selected" : ""}>RAG_SYSTEM (Retrieval Augmented)</option>
              <option value="AI_AGENT" ${this.wizardData.productType === "AI_AGENT" ? "selected" : ""}>AI_AGENT (Autonomous Action)</option>
              <option value="MODEL" ${this.wizardData.productType === "MODEL" ? "selected" : ""}>MODEL (Weights / Fine-tune)</option>
              <option value="EMBEDDING_MODEL" ${this.wizardData.productType === "EMBEDDING_MODEL" ? "selected" : ""}>EMBEDDING_MODEL</option>
              <option value="RERANKER" ${this.wizardData.productType === "RERANKER" ? "selected" : ""}>RERANKER (Cross-Encoder)</option>
              <option value="WORKFLOW" ${this.wizardData.productType === "WORKFLOW" ? "selected" : ""}>WORKFLOW (Multi-stage Pipeline)</option>
              <option value="PROMPT_PACK" ${this.wizardData.productType === "PROMPT_PACK" ? "selected" : ""}>PROMPT_PACK</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Short Value Proposition (1-2 sentences) *</label>
          <input type="text" class="text-input" id="wiz-short-desc" value="${this.wizardData.shortDesc || "Containerized MCP server exposing Kubernetes cluster telemetry and Helm deployments to AI agents."}" />
        </div>

        <div class="form-group">
          <label class="form-label">Full Architecture Overview &amp; Problem Solved *</label>
          <textarea class="textarea-input" id="wiz-long-desc" rows="4">${this.wizardData.longDesc || "Provides full bidirectional Model Context Protocol tooling for autonomous engineering agents to inspect failing pods, analyze ingress logs, and generate verified Helm rollback patches with zero cluster egress."}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Target Enterprise Buyer</label>
            <input type="text" class="text-input" id="wiz-buyer" value="${this.wizardData.targetBuyer}" />
          </div>
          <div class="form-group flex-1">
            <label class="form-label">Core Deliverable / Output</label>
            <input type="text" class="text-input" id="wiz-output" value="${this.wizardData.coreOutput}" />
          </div>
        </div>
      `;
    }

    if (step === 2) {
      return `
        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Inference Framework &amp; Runtime *</label>
            <input type="text" class="text-input" id="wiz-framework" value="${this.wizardData.framework}" placeholder="e.g. PyTorch 2.4, vLLM, ONNX Runtime" />
          </div>
          <div class="form-group flex-1">
            <label class="form-label">Minimum VRAM Requirement *</label>
            <input type="text" class="text-input" id="wiz-vram" value="${this.wizardData.vram}" placeholder="e.g. 8 GB VRAM" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Recommended GPU Hardware</label>
            <input type="text" class="text-input" id="wiz-gpu" value="${this.wizardData.gpu}" placeholder="e.g. NVIDIA RTX 4090 / A10G" />
          </div>
          <div class="form-group flex-1">
            <label class="form-label">CPU &amp; System RAM Bounds</label>
            <input type="text" class="text-input" id="wiz-cpu" value="${this.wizardData.cpu}" placeholder="e.g. 4 Cores, 16 GB RAM" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Verified Accuracy / Benchmark Score *</label>
            <input type="text" class="text-input" id="wiz-accuracy" value="${this.wizardData.accuracy}" placeholder="e.g. 98.4% Source Factual Grounding" />
          </div>
          <div class="form-group flex-1">
            <label class="form-label">P95 Inference Latency</label>
            <input type="text" class="text-input" id="wiz-latency" value="${this.wizardData.latency}" placeholder="e.g. 450ms TTFT" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Evaluation Benchmark Dataset Tested</label>
          <input type="text" class="text-input" id="wiz-dataset" value="${this.wizardData.dataset}" placeholder="e.g. SWE-bench Verified & Kubernetes Incident Corpus" />
        </div>
      `;
    }

    if (step === 3) {
      return `
        <div class="form-group">
          <label class="form-label">Delivery Mechanism (SRS Section 14) *</label>
          <select class="select-input" id="wiz-delivery">
            <option value="Downloadable Artifact + API Access">Hybrid: Signed Download Link + Hosted API Key</option>
            <option value="Downloadable ZIP / Model Weights">Self-Hosted: Downloadable Weights &amp; Docker Image</option>
            <option value="Hosted API / SaaS Access">Hosted: Managed API Gateway Endpoint</option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Artifact Download Size</label>
            <input type="text" class="text-input" id="wiz-size" value="${this.wizardData.downloadSize}" />
          </div>
          <div class="form-group flex-1">
            <label class="form-label">SHA-256 Checksum (Integrity Verification)</label>
            <input type="text" class="text-input" style="font-family: var(--font-mono); font-size: 0.8rem;" value="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" disabled />
          </div>
        </div>

        <div style="background: var(--bg-surface-2); border: 2px dashed var(--border-medium); border-radius: 8px; padding: 28px; text-align: center; margin-top: 10px;">
          <div style="color: var(--accent-cyan); margin-bottom: 8px;">${getIconSvg("upload-cloud", 32)}</div>
          <div style="font-weight: 600; color: #FFF; margin-bottom: 4px;">Attach Component Checkpoints or Docker Manifest</div>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 12px;">Supports .tar.gz, .whl, .safetensors, and Dockerfile (Max 5 GB per artifact)</p>
          <button class="btn btn-secondary btn-sm" onclick="showToast('Mock file attached: kubernetes-mcp-v1.0.0.tar.gz (540 MB)', 'success')">
            Select Local Files (Mock File Pre-loaded)
          </button>
        </div>
      `;
    }

    if (step === 4) {
      return `
        <div class="form-group">
          <label class="form-label">Quickstart Python Code Example *</label>
          <textarea class="textarea-input" rows="5" style="font-family: var(--font-mono); font-size: 0.82rem;">from cortexhub import ComponentClient

client = ComponentClient(api_key="ctx_live_...")
mcp_session = client.connect("k8s-mcp-bridge")
health = mcp_session.run_tool("check_cluster_health", namespace="production")
print("Cluster Telemetry:", health.status)</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">cURL Invocation Schema</label>
          <textarea class="textarea-input" rows="4" style="font-family: var(--font-mono); font-size: 0.82rem;">curl -X POST https://api.cortex-hub.io/v1/mcp/invoke \\
  -H "Authorization: Bearer ctx_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"tool": "check_cluster_health", "namespace": "prod"}'</textarea>
        </div>
      `;
    }

    if (step === 5) {
      return `
        <div class="form-group">
          <label class="form-label">License Grant Model (SRS Section 16) *</label>
          <select class="select-input" id="wiz-license">
            <option value="Commercial Permissive (Multi-Seat)">Commercial Permissive (Unlimited Internal Multi-Seat)</option>
            <option value="Apache-2.0">Apache 2.0 (Open Source with Commercial Use)</option>
            <option value="MIT License">MIT License</option>
            <option value="Enterprise Source Available">Enterprise Source Available (Air-gapped deployment allowed)</option>
          </select>
        </div>

        <div style="background: var(--bg-surface-2); border: 1px solid var(--border-medium); border-radius: 6px; padding: 14px; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.6;">
          <strong style="color: #FFF; display: block; margin-bottom: 4px;">// BUYER ENTITLEMENT SUMMARY:</strong>
          ✓ Permitted for internal enterprise SaaS, APIs, and commercial workflows.<br />
          ✓ Allows private VPC, air-gapped hosting, or on-prem deployment.<br />
          ✗ Strictly prohibits redistributing or reselling raw source code directly on competing marketplaces.
        </div>
      `;
    }

    if (step === 6) {
      return `
        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Base Single-License Price (USD) *</label>
            <input type="number" class="text-input" id="wiz-price" value="${this.wizardData.basePrice}" placeholder="499" />
          </div>
          <div class="form-group flex-1">
            <label class="form-label">Platform Take-Rate (Admin Config)</label>
            <input type="text" class="text-input" value="15% Platform Fee (Net: $${Math.round((parseInt(this.wizardData.basePrice) || 499) * 0.85)})" disabled />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Multi-Tier Pricing Scheme (Starter / Pro / Enterprise)</label>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 6px;">
            <div style="background: var(--bg-surface-2); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 12px;">
              <span class="badge badge-gray">STARTER</span>
              <div style="font-size: 1.1rem; font-weight: 700; color: #FFF; margin: 4px 0;">$${this.wizardData.basePrice}</div>
              <p style="font-size: 0.75rem; color: var(--text-muted);">Standard developer license</p>
            </div>
            <div style="background: var(--bg-surface-2); border: 1px solid var(--accent-lime); border-radius: 6px; padding: 12px;">
              <span class="badge badge-lime">PRO TIER</span>
              <div style="font-size: 1.1rem; font-weight: 700; color: var(--accent-lime); margin: 4px 0;">$${Math.round((parseInt(this.wizardData.basePrice) || 499) * 2.5)}</div>
              <p style="font-size: 0.75rem; color: var(--text-muted);">Team license &amp; priority SLA</p>
            </div>
            <div style="background: var(--bg-surface-2); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 12px;">
              <span class="badge badge-gray">ENTERPRISE</span>
              <div style="font-size: 1.1rem; font-weight: 700; color: #FFF; margin: 4px 0;">Custom Quote</div>
              <p style="font-size: 0.75rem; color: var(--text-muted);">Air-gapped VPC &amp; code audit</p>
            </div>
          </div>
        </div>
      `;
    }

    if (step === 7) {
      return `
        <div class="form-group">
          <label class="form-label">Sandbox Test Payload Endpoint</label>
          <input type="text" class="text-input" value="https://sandbox.cortex-hub.io/v1/mcp-bridge/test" />
        </div>

        <div class="form-group">
          <label class="form-label">Sample Input Demo Prompt</label>
          <textarea class="textarea-input" rows="3">{"action": "diagnose_namespace", "target_pod": "payment-api-pod-991", "simulate_egress": false}</textarea>
        </div>

        <div style="background: var(--bg-surface-2); border: 1px solid var(--border-medium); border-radius: 6px; padding: 14px;">
          <div style="display: flex; align-items: center; gap: 8px; color: var(--accent-lime); font-size: 0.85rem; font-weight: 600; margin-bottom: 4px;">
            ${getIconSvg("check-circle", 15)} Sandbox Runtime Healthcheck Passed
          </div>
          <p style="font-size: 0.78rem; color: var(--text-secondary);">
            Test instance spawned in 840ms. Safe execution sandbox verified with zero external data egress.
          </p>
        </div>
      `;
    }

    if (step === 8) {
      return `
        <div style="background: var(--bg-surface-2); border: 1px solid var(--border-medium); border-radius: 8px; padding: 20px; margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div>
              <span class="badge badge-lime">SUBMISSION SUMMARY</span>
              <h4 style="font-family: var(--font-heading); font-size: 1.25rem; color: #FFF; margin-top: 4px;">
                ${this.wizardData.name || "Autonomous Kubernetes DevOps MCP Bridge"}
              </h4>
            </div>
            <div style="text-align: right;">
              <span style="font-family: var(--font-mono); font-size: 1.2rem; font-weight: 700; color: var(--accent-lime);">$${this.wizardData.basePrice || "499"} USD</span>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${this.wizardData.version}</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.6;">
            <div>• Category: <strong>${this.wizardData.category}</strong></div>
            <div>• Product Type: <strong>${this.wizardData.productType}</strong></div>
            <div>• Runtime: <strong>${this.wizardData.framework}</strong></div>
            <div>• Hardware: <strong>${this.wizardData.vram}</strong></div>
            <div>• Benchmark: <strong>${this.wizardData.accuracy}</strong></div>
            <div>• License: <strong>${this.wizardData.licenseType}</strong></div>
          </div>
        </div>

        <div style="background: var(--bg-deep); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px;">
          <div style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">Pre-flight Verification Checklist:</div>
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.82rem;">
            <div style="display: flex; align-items: center; gap: 8px; color: var(--accent-lime);">${getIconSvg("check", 14)} Static security &amp; malware scan: PASS (0 threats)</div>
            <div style="display: flex; align-items: center; gap: 8px; color: var(--accent-lime);">${getIconSvg("check", 14)} License terms &amp; commercial rights compliance: PASS</div>
            <div style="display: flex; align-items: center; gap: 8px; color: var(--accent-lime);">${getIconSvg("check", 14)} Interactive sandbox runtime health: PASS</div>
            <div style="display: flex; align-items: center; gap: 8px; color: var(--accent-lime);">${getIconSvg("check", 14)} Checksum integrity verification: PASS</div>
          </div>
        </div>
      `;
    }
  }

  attachWizardEvents(content, seller) {
    const prevBtn = content.querySelector("#wizard-btn-prev");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (this.submissionStep > 1) {
          this.saveCurrentStepData(content);
          this.submissionStep--;
          this.renderSubmissionWizard(content, seller);
        }
      });
    }

    const nextBtn = content.querySelector("#wizard-btn-next");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (this.submissionStep < 8) {
          this.saveCurrentStepData(content);
          this.submissionStep++;
          this.renderSubmissionWizard(content, seller);
        }
      });
    }

    const submitBtn = content.querySelector("#wizard-btn-submit");
    if (submitBtn) {
      submitBtn.addEventListener("click", async () => {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `Submitting to Admin Queue...`;

        try {
          const res = await this.app.api.submitSellerProduct(this.wizardData);
          showToast(`Component "${this.wizardData.name || "DevOps MCP Bridge"}" submitted for Admin Review!`, "success");

          // Reset wizard and switch to portfolio tab
          this.submissionStep = 1;
          this.activeTab = "portfolio";
          this.renderActiveTab(seller);
          document.querySelectorAll(".seller-tab-btn").forEach((b) => {
            b.classList.toggle("active", b.dataset.tab === "portfolio");
          });
        } catch (err) {
          showToast(`Submission failed: ${err.message}`, "error");
          submitBtn.disabled = false;
        }
      });
    }

    content.querySelectorAll(".wizard-step-node").forEach((node) => {
      node.addEventListener("click", () => {
        const stepNum = parseInt(node.dataset.step);
        if (stepNum) {
          this.saveCurrentStepData(content);
          this.submissionStep = stepNum;
          this.renderSubmissionWizard(content, seller);
        }
      });
    });
  }

  saveCurrentStepData(content) {
    const nameEl = content.querySelector("#wiz-name");
    if (nameEl) this.wizardData.name = nameEl.value;

    const shortEl = content.querySelector("#wiz-short-desc");
    if (shortEl) this.wizardData.shortDesc = shortEl.value;

    const longEl = content.querySelector("#wiz-long-desc");
    if (longEl) this.wizardData.longDesc = longEl.value;

    const catEl = content.querySelector("#wiz-category");
    if (catEl) this.wizardData.category = catEl.value;

    const typeEl = content.querySelector("#wiz-type");
    if (typeEl) this.wizardData.productType = typeEl.value;

    const frameworkEl = content.querySelector("#wiz-framework");
    if (frameworkEl) this.wizardData.framework = frameworkEl.value;

    const vramEl = content.querySelector("#wiz-vram");
    if (vramEl) this.wizardData.vram = vramEl.value;

    const gpuEl = content.querySelector("#wiz-gpu");
    if (gpuEl) this.wizardData.gpu = gpuEl.value;

    const accEl = content.querySelector("#wiz-accuracy");
    if (accEl) this.wizardData.accuracy = accEl.value;

    const latEl = content.querySelector("#wiz-latency");
    if (latEl) this.wizardData.latency = latEl.value;

    const priceEl = content.querySelector("#wiz-price");
    if (priceEl) this.wizardData.basePrice = priceEl.value;

    const licEl = content.querySelector("#wiz-license");
    if (licEl) this.wizardData.licenseType = licEl.value;
  }

  // --------------------------------------------------------------------------
  // Tab 3: Wallet & Payouts (SRS v2.0 Section 20)
  // --------------------------------------------------------------------------
  renderWalletTab(content, seller) {
    content.innerHTML = `
      <div class="wallet-ledger-grid">
        <div class="seller-stat-card" style="border-left: 3px solid var(--accent-lime);">
          <span class="stat-label">GROSS SALES VOLUME</span>
          <span class="stat-value text-accent">$${seller.grossRevenueUsd.toLocaleString()}</span>
          <span class="stat-sub">From ${seller.totalSalesCount} units sold</span>
        </div>
        <div class="seller-stat-card" style="border-left: 3px solid var(--accent-amber);">
          <span class="stat-label">PLATFORM COMMISSION</span>
          <span class="stat-value" style="color: var(--accent-amber);">$${seller.platformFeesPaid.toLocaleString()}</span>
          <span class="stat-sub">15% Take-Rate Retained</span>
        </div>
        <div class="seller-stat-card" style="border-left: 3px solid var(--accent-cyan);">
          <span class="stat-label">NET SELLER EARNINGS</span>
          <span class="stat-value" style="color: var(--accent-cyan);">$${seller.netEarningsUsd.toLocaleString()}</span>
          <span class="stat-sub">85% Net Disbursed</span>
        </div>
        <div class="seller-stat-card" style="border-left: 3px solid #FFF;">
          <span class="stat-label">AVAILABLE FOR PAYOUT</span>
          <span class="stat-value" style="color: #FFF;">$${seller.availableBalance.toLocaleString()}</span>
          <button class="btn btn-primary btn-sm" id="btn-request-payout-tab" style="margin-top: 8px;">
            Request Payout →
          </button>
        </div>
      </div>

      <div class="portfolio-action-bar" style="margin-top: 24px;">
        <h4 style="font-family: var(--font-heading); color: #FFF; font-size: 1.1rem;">Disbursement &amp; Payout History</h4>
        <span class="badge badge-gray">STABLECOIN / ACH CONNECTED</span>
      </div>

      <div class="seller-table-container">
        <table class="seller-table">
          <thead>
            <tr>
              <th>PAYOUT ID</th>
              <th>DATE</th>
              <th>DISBURSED AMOUNT</th>
              <th>METHOD</th>
              <th>STATUS</th>
              <th>TX REFERENCE</th>
            </tr>
          </thead>
          <tbody>
            ${seller.payoutHistory
              .map(
                (p) => `
              <tr>
                <td style="font-family: var(--font-mono); font-weight: 600; color: #FFF;">${p.id}</td>
                <td>${p.date}</td>
                <td style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-lime);">${p.amount}</td>
                <td>${p.method}</td>
                <td><span class="badge badge-lime">${p.status}</span></td>
                <td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">${p.txHash}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    const reqBtn = content.querySelector("#btn-request-payout-tab");
    if (reqBtn) {
      reqBtn.addEventListener("click", () => this.openPayoutModal(seller));
    }
  }

  // --------------------------------------------------------------------------
  // Tab 4: Sales Funnel Analytics (SRS v2.0 Section 24, 60)
  // --------------------------------------------------------------------------
  renderAnalyticsTab(content, seller) {
    const f = seller.funnelMetrics || {
      impressions: "142,500",
      productViews: "28,400",
      demoRuns: "6,820",
      checkouts: "112",
      purchases: "86",
      conversionRate: "2.4%"
    };

    content.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="font-family: var(--font-heading); color: #FFF; font-size: 1.2rem;">Full-Funnel Developer Conversion Metrics</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">
          Track prospective enterprise developer drop-off from initial discovery to active production license activation.
        </p>
      </div>

      <div class="funnel-container">
        <div class="funnel-stage-row">
          <div class="funnel-stage-info">
            <span class="funnel-stage-name">1. Catalog Impressions</span>
            <span class="funnel-stage-count">${f.impressions}</span>
          </div>
          <div class="funnel-progress-bar"><div class="funnel-fill" style="width: 100%;"></div></div>
        </div>

        <div class="funnel-stage-row">
          <div class="funnel-stage-info">
            <span class="funnel-stage-name">2. Product Specification Views</span>
            <span class="funnel-stage-count">${f.productViews} (20%)</span>
          </div>
          <div class="funnel-progress-bar"><div class="funnel-fill" style="width: 20%;"></div></div>
        </div>

        <div class="funnel-stage-row">
          <div class="funnel-stage-info">
            <span class="funnel-stage-name">3. Live Sandbox Demo Executions</span>
            <span class="funnel-stage-count">${f.demoRuns} (24% of views)</span>
          </div>
          <div class="funnel-progress-bar"><div class="funnel-fill" style="width: 12%;"></div></div>
        </div>

        <div class="funnel-stage-row">
          <div class="funnel-stage-info">
            <span class="funnel-stage-name">4. Checkout Initiated</span>
            <span class="funnel-stage-count">${f.checkouts}</span>
          </div>
          <div class="funnel-progress-bar"><div class="funnel-fill" style="width: 4%;"></div></div>
        </div>

        <div class="funnel-stage-row">
          <div class="funnel-stage-info">
            <span class="funnel-stage-name">5. Verified License Activations</span>
            <span class="funnel-stage-count" style="color: var(--accent-lime); font-weight: 700;">${f.purchases} (${f.conversionRate})</span>
          </div>
          <div class="funnel-progress-bar"><div class="funnel-fill" style="width: 2.8%; background: var(--accent-lime);"></div></div>
        </div>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // Payout Request Modal
  // --------------------------------------------------------------------------
  openPayoutModal(seller) {
    const modal = document.getElementById("seller-payout-modal");
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <div>
            <span class="badge badge-lime">// DISBURSEMENT LEDGER (SRS v2.0 SECTION 20)</span>
            <h3 class="modal-title" style="margin-top: 4px;">Request Seller Payout</h3>
          </div>
          <button class="btn-icon btn-ghost modal-close-btn">${getIconSvg("x", 20)}</button>
        </div>
        <div class="modal-body">
          <div style="background: var(--bg-surface-2); border: 1px solid var(--border-medium); border-radius: 6px; padding: 14px; margin-bottom: 16px;">
            <div style="font-size: 0.8rem; color: var(--text-muted);">Available Net Balance</div>
            <div style="font-size: 1.4rem; font-weight: 700; color: var(--accent-lime); font-family: var(--font-heading);">
              $${seller.availableBalance.toLocaleString()} USD
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Payout Amount (USD) *</label>
            <input type="number" class="text-input" id="payout-amount-input" value="${Math.min(seller.availableBalance, 5000)}" max="${seller.availableBalance}" />
          </div>

          <div class="form-group">
            <label class="form-label">Payout Destination Method</label>
            <select class="select-input" id="payout-method-select">
              <option value="Stripe Connect / ACH">Stripe Connect Direct (Chase **** 8842)</option>
              <option value="International Wire">International Wire SWIFT (Citibank)</option>
              <option value="USDC Polygon">USDC (Polygon POS: 0x71A...9b2)</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-close-btn">Cancel</button>
          <button class="btn btn-primary" id="btn-confirm-payout-submit">
            Confirm &amp; Disburse Payout
          </button>
        </div>
      </div>
    `;

    modal.classList.add("active");
    modal.querySelectorAll(".modal-close-btn").forEach((b) => {
      b.addEventListener("click", () => modal.classList.remove("active"));
    });

    const confirmBtn = modal.querySelector("#btn-confirm-payout-submit");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", async () => {
        const amt = modal.querySelector("#payout-amount-input").value;
        const method = modal.querySelector("#payout-method-select").value;

        try {
          await this.app.api.requestSellerPayout(amt, method);
          showToast(`Payout request for $${amt} submitted and processing!`, "success");
          modal.classList.remove("active");
          this.renderActiveTab(seller);
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    }
  }
}
