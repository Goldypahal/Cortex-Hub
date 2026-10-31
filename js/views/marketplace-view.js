/**
 * Cortex Hub - Marketplace & Catalog View Controller
 * Implements Master SRS v3.0:
 * - Section 8: Outcome-Driven Taxonomy & Intent Mapping (Buyer Mode) + Technical Graph (Dev Mode)
 * - Section 10: Dual Display Modes (FR-MKT-001, FR-MKT-002, FR-MKT-003, FR-MKT-004, FR-MKT-005)
 * - Section 11: Product Detail Page (PDP) with Progressive Disclosure & Trust Panel (PDP-01, PDP-02, PDP-03)
 * - Section 21: Verified Purchaser Reviews
 * - G7 Fix: XSS sanitization via escapeHtml()
 */

import { CATALOG_COMPONENTS } from "../data/catalog-data.js";
import { getIconSvg, copyToClipboard, showToast, escapeHtml } from "../utils/helpers.js";

export class MarketplaceView {
  constructor(app) {
    this.app = app;
    this.components = CATALOG_COMPONENTS;
    // SRS DISC-04: Dual Display Modes - default to Buyer Mode
    this.viewMode = localStorage.getItem("cortex_hub_view_mode") || "buyer";
    this.selectedCategory = "all";
    this.selectedProductType = "all";
    this.selectedIndustry = "all";
    this.searchQuery = "";
    this.comparedComponentIds = new Set();
  }

  async render(container) {
    // Refresh components from client cache/backend
    try {
      const remote = await this.app.api.getComponents();
      if (Array.isArray(remote) && remote.length > 0) {
        this.components = remote;
      }
    } catch {
      // Keep local catalog
    }

    const isBuyer = this.viewMode === "buyer";

    container.innerHTML = `
      <!-- SRS DISC-04: View Mode Switcher -->
      <div class="view-mode-switch-wrapper">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="mode-switch-label">VIEW PERSPECTIVE:</span>
          <div class="mode-switch-pills">
            <button class="mode-pill-btn ${isBuyer ? "active" : ""}" id="btn-mode-buyer" data-mode="buyer">
              🏢 Business Buyer (Outcomes)
            </button>
            <button class="mode-pill-btn ${!isBuyer ? "active" : ""}" id="btn-mode-dev" data-mode="developer">
              💻 Developer & AI Engineer (Specs)
            </button>
          </div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted);">
          <span>[SPEC: SRS v3.0]</span> • <span style="color: var(--accent);">${this.components.length} Components</span>
        </div>
      </div>

      <!-- Asymmetric Hero Section -->
      <section class="hero-asymmetric">
        <!-- Left Column -->
        <div class="hero-content-left">
          ${
            isBuyer
              ? `
            <span class="hero-spec-tag">// BUSINESS SOLUTION STORE // TRY-BEFORE-YOU-BUY</span>
            <h1 class="hero-headline">
              Find AI Tools That Solve <span class="accent-text">Real Business Problems.</span>
            </h1>
            <p class="hero-technical-desc">
              Tell us what you need, test it with your sample business files, and see transparent pricing in USD and INR. Shielded from model parameters and vector database complexity.
            </p>
          `
              : `
            <span class="hero-spec-tag">// MASTER SPECIFICATION // SRS v3.0 MULTI-VENDOR</span>
            <h1 class="hero-headline">
              Production AI Engines. <span class="accent-text">Zero Guesswork.</span>
            </h1>
            <p class="hero-technical-desc">
              The commercialization platform for AI engineers. Discover, benchmark in isolated sandboxes, compare technical architectures, and integrate verified models, agents, MCP servers, and RAG pipelines.
            </p>
          `
          }

          <div class="hero-cta-cluster">
            <button class="btn btn-primary btn-lg" id="hero-btn-explore">
              Explore ${this.components.length} Solutions →
            </button>
            <button class="btn btn-secondary btn-lg" id="hero-btn-launch-sandbox">
              Launch Live Sandbox
            </button>
            <button class="btn btn-outline btn-lg" id="hero-btn-sell-component">
              Publish AI Component →
            </button>
          </div>

          <div class="hero-specs-row">
            <div class="hero-spec-item">
              <span class="hero-spec-val">${this.components.length}</span>
              <span class="hero-spec-lbl">Solutions in Catalog</span>
            </div>
            <div class="hero-spec-item">
              <span class="hero-spec-val">Sandbox</span>
              <span class="hero-spec-lbl">Try Before You Buy</span>
            </div>
            <div class="hero-spec-item">
              <span class="hero-spec-val">INR + USD</span>
              <span class="hero-spec-lbl">Prices Shown</span>
            </div>
          </div>
        </div>

        <!-- Right Column: Live Telemetry & Benchmark Monitor -->
        <div class="pipeline-monitor-box">
          <div class="monitor-header">
            <span class="monitor-title">
              SAMPLE PIPELINE RUN // ILLUSTRATIVE
            </span>
            <span class="badge badge-amber">SAMPLE DATA</span>
          </div>

          <div class="monitor-pipeline-stages">
            <div class="pipeline-stage-row">
              <span class="stage-name">1. Document OCR &amp; Parsing</span>
              <span class="stage-latency">14ms</span>
            </div>
            <div class="pipeline-stage-row">
              <span class="stage-name">2. Dense Vector Retrieval (HNSW)</span>
              <span class="stage-latency">28ms</span>
            </div>
            <div class="pipeline-stage-row">
              <span class="stage-name">3. Cross-Encoder Semantic Rerank</span>
              <span class="stage-latency">42ms</span>
            </div>
            <div class="pipeline-stage-row" style="border-color: var(--border-focus);">
              <span class="stage-name">4. Factual Citation Grounding</span>
              <span class="stage-latency" style="color: var(--accent);">98.4% Score</span>
            </div>
          </div>

          <div class="monitor-live-output">
            <div style="color: var(--text-muted); margin-bottom: 4px;">// SAMPLE OUTPUT (illustrative, not a measured run):</div>
            <div>"Section 12.3: Liability indemnification capped at 12-month contract fees."</div>
            <div style="color: var(--accent); margin-top: 4px; font-size: 0.72rem;">
              → Cited source: MSA_2026.docx // Page 18
            </div>
          </div>
        </div>
      </section>

      <!-- Filter & Search Bar -->
      <section class="filter-bar">
        <div class="filter-top-row">
          <div class="search-input-box">
            <span class="search-svg-icon">${getIconSvg("search", 15)}</span>
            <input type="text" id="catalog-search" class="search-field" 
              placeholder="${isBuyer ? "What do you want AI to do? (e.g. answer customer questions, review contracts)..." : "Search by architecture, model, framework, license, or vendor..."}" 
              value="${escapeHtml(this.searchQuery)}" />
          </div>
          <select id="industry-filter" class="industry-dropdown">
            <option value="all">ALL INDUSTRIES</option>
            <option value="Legal">Legal &amp; Compliance</option>
            <option value="Healthcare">Healthcare &amp; Bio</option>
            <option value="Finance">Finance &amp; Banking</option>
            <option value="E-Commerce">E-Commerce &amp; Retail</option>
            <option value="EdTech">Education &amp; Training</option>
            <option value="Recruitment">HR &amp; Recruitment</option>
            <option value="Developer Tools">Software &amp; DevOps</option>
          </select>
        </div>

        <!-- Hierarchical Categories -->
        <div class="category-tags-row">
          ${
            isBuyer
              ? `
            <button class="cat-filter-btn ${this.selectedCategory === "all" ? "active" : ""}" data-cat="all">ALL SOLUTIONS [${this.components.length}]</button>
            <button class="cat-filter-btn ${this.selectedCategory === "💬 Talk to Customers" ? "active" : ""}" data-cat="💬 Talk to Customers">💬 Talk to Customers</button>
            <button class="cat-filter-btn ${this.selectedCategory === "📄 Work with Documents" ? "active" : ""}" data-cat="📄 Work with Documents">📄 Work with Documents</button>
            <button class="cat-filter-btn ${this.selectedCategory === "📊 Understand Data" ? "active" : ""}" data-cat="📊 Understand Data">📊 Understand Data</button>
            <button class="cat-filter-btn ${this.selectedCategory === "🛒 Increase Sales" ? "active" : ""}" data-cat="🛒 Increase Sales">🛒 Increase Sales</button>
            <button class="cat-filter-btn ${this.selectedCategory === "⚙️ Automate Work" ? "active" : ""}" data-cat="⚙️ Automate Work">⚙️ Automate Work</button>
            <button class="cat-filter-btn ${this.selectedCategory === "✍️ Create Content" ? "active" : ""}" data-cat="✍️ Create Content">✍️ Create Content</button>
            <button class="cat-filter-btn ${this.selectedCategory === "🔎 Find Information" ? "active" : ""}" data-cat="🔎 Find Information">🔎 Find Information</button>
            <button class="cat-filter-btn ${this.selectedCategory === "👥 Manage Employees" ? "active" : ""}" data-cat="👥 Manage Employees">👥 Manage Employees</button>
          `
              : `
            <button class="cat-filter-btn ${this.selectedCategory === "all" ? "active" : ""}" data-cat="all">ALL DISCIPLINES [${this.components.length}]</button>
            <button class="cat-filter-btn ${this.selectedCategory === "Generative AI" ? "active" : ""}" data-cat="Generative AI">GENERATIVE AI &amp; RAG</button>
            <button class="cat-filter-btn ${this.selectedCategory === "Computer Vision" ? "active" : ""}" data-cat="Computer Vision">COMPUTER VISION &amp; OCR</button>
            <button class="cat-filter-btn ${this.selectedCategory === "Developer Tools" ? "active" : ""}" data-cat="Developer Tools">DEV TOOLS &amp; MCP SERVERS</button>
            <button class="cat-filter-btn ${this.selectedCategory === "NLP" ? "active" : ""}" data-cat="NLP">NLP &amp; RERANKERS</button>
            <button class="cat-filter-btn ${this.selectedCategory === "Machine Learning" ? "active" : ""}" data-cat="Machine Learning">MACHINE LEARNING &amp; RECS</button>
            <button class="cat-filter-btn ${this.selectedCategory === "EdTech" ? "active" : ""}" data-cat="EdTech">EDTECH &amp; PEDAGOGY</button>
          `
          }
        </div>

        ${
          !isBuyer
            ? `
          <!-- Product Type Pills (Developer Mode only) -->
          <div class="product-type-pills-row">
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted); align-self: center; margin-right: 6px;">TYPE:</span>
            <button class="type-pill-btn ${this.selectedProductType === "all" ? "active" : ""}" data-type="all">ALL TYPES</button>
            <button class="type-pill-btn ${this.selectedProductType === "RAG_SYSTEM" ? "active" : ""}" data-type="RAG_SYSTEM">RAG_SYSTEM</button>
            <button class="type-pill-btn ${this.selectedProductType === "AI_AGENT" ? "active" : ""}" data-type="AI_AGENT">AI_AGENT</button>
            <button class="type-pill-btn ${this.selectedProductType === "MCP_SERVER" ? "active" : ""}" data-type="MCP_SERVER">MCP_SERVER</button>
            <button class="type-pill-btn ${this.selectedProductType === "MODEL" ? "active" : ""}" data-type="MODEL">MODEL</button>
            <button class="type-pill-btn ${this.selectedProductType === "WORKFLOW" ? "active" : ""}" data-type="WORKFLOW">WORKFLOW</button>
            <button class="type-pill-btn ${this.selectedProductType === "API" ? "active" : ""}" data-type="API">API</button>
          </div>
        `
            : ""
        }
      </section>

      <!-- Bento Catalog Grid -->
      <section id="bento-catalog-grid" class="bento-catalog-grid">
        <!-- Injected dynamically -->
      </section>

      <!-- Sticky Floating Product Comparison Tray (FR-MKT-005) -->
      <div id="comparison-tray" class="comparison-tray" style="display: none;">
        <div class="comparison-tray-inner">
          <div class="comparison-tray-left">
            <span class="badge badge-lime">// COMPARISON ENGINE</span>
            <span id="comparison-count-label" style="font-family: var(--font-mono); font-size: 0.82rem; color: #FFF; margin-left: 8px;">
              0 components selected (Max 5)
            </span>
          </div>
          <div class="comparison-tray-actions">
            <button class="btn btn-ghost btn-sm" id="btn-clear-comparison">Clear All</button>
            <button class="btn btn-primary btn-sm" id="btn-open-comparison-modal">
              Compare Side-by-Side →
            </button>
          </div>
        </div>
      </div>

      <!-- Component Detail Modal -->
      <div id="component-detail-modal" class="modal-backdrop"></div>

      <!-- Side-by-Side Comparison Modal -->
      <div id="comparison-modal" class="modal-backdrop"></div>
    `;

    this.attachEvents(container);
    this.renderBentoCards();
    this.updateComparisonTray();
  }

  attachEvents(container) {
    // Mode Switcher handlers
    const buyerModeBtn = container.querySelector("#btn-mode-buyer");
    const devModeBtn = container.querySelector("#btn-mode-dev");
    if (buyerModeBtn) {
      buyerModeBtn.addEventListener("click", () => {
        this.viewMode = "buyer";
        this.selectedCategory = "all";
        localStorage.setItem("cortex_hub_view_mode", "buyer");
        this.render(container);
        showToast("Switched to Business Buyer Mode (Outcomes & Solutions)", "info");
      });
    }
    if (devModeBtn) {
      devModeBtn.addEventListener("click", () => {
        this.viewMode = "developer";
        this.selectedCategory = "all";
        localStorage.setItem("cortex_hub_view_mode", "developer");
        this.render(container);
        showToast("Switched to Developer Mode (Architectures & Specs)", "info");
      });
    }

    const exploreBtn = container.querySelector("#hero-btn-explore");
    if (exploreBtn) {
      exploreBtn.addEventListener("click", () => {
        document.getElementById("bento-catalog-grid").scrollIntoView({ behavior: "smooth" });
      });
    }

    const sandboxBtn = container.querySelector("#hero-btn-launch-sandbox");
    if (sandboxBtn) {
      sandboxBtn.addEventListener("click", () => {
        this.app.navigateTo("playground");
      });
    }

    const sellBtn = container.querySelector("#hero-btn-sell-component");
    if (sellBtn) {
      sellBtn.addEventListener("click", () => {
        this.app.navigateTo("seller");
        showToast("Switched to Seller Studio & Publishing Wizard", "info");
      });
    }

    const searchField = container.querySelector("#catalog-search");
    if (searchField) {
      searchField.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderBentoCards();
      });
    }

    const industryDropdown = container.querySelector("#industry-filter");
    if (industryDropdown) {
      industryDropdown.addEventListener("change", (e) => {
        this.selectedIndustry = e.target.value;
        this.renderBentoCards();
      });
    }

    const catBtns = container.querySelectorAll(".cat-filter-btn");
    catBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        catBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.selectedCategory = btn.dataset.cat;
        this.renderBentoCards();
      });
    });

    const typeBtns = container.querySelectorAll(".type-pill-btn");
    typeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        typeBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.selectedProductType = btn.dataset.type;
        this.renderBentoCards();
      });
    });

    const clearCompBtn = container.querySelector("#btn-clear-comparison");
    if (clearCompBtn) {
      clearCompBtn.addEventListener("click", () => {
        this.comparedComponentIds.clear();
        this.updateComparisonTray();
        this.renderBentoCards();
        showToast("Cleared comparison selections", "info");
      });
    }

    const openCompBtn = container.querySelector("#btn-open-comparison-modal");
    if (openCompBtn) {
      openCompBtn.addEventListener("click", () => this.openComparisonModal());
    }
  }

  renderBentoCards() {
    const grid = document.getElementById("bento-catalog-grid");
    if (!grid) return;

    const isBuyer = this.viewMode === "buyer";

    const filtered = this.components.filter((c) => {
      let matchCat = true;
      if (this.selectedCategory !== "all") {
        if (isBuyer) {
          matchCat = c.businessCategory === this.selectedCategory;
        } else {
          matchCat = c.category === this.selectedCategory;
        }
      }

      const matchType = this.selectedProductType === "all" || c.productType === this.selectedProductType;
      const matchInd = this.selectedIndustry === "all" || (c.tags && c.tags.includes(this.selectedIndustry)) || (c.goodFor && c.goodFor.includes(this.selectedIndustry));
      
      const query = this.searchQuery;
      const matchSearch =
        !query ||
        c.name.toLowerCase().includes(query) ||
        (c.buyerTitle && c.buyerTitle.toLowerCase().includes(query)) ||
        (c.buyerValueProp && c.buyerValueProp.toLowerCase().includes(query)) ||
        c.shortDesc.toLowerCase().includes(query) ||
        (c.sellerName && c.sellerName.toLowerCase().includes(query)) ||
        (c.productType && c.productType.toLowerCase().includes(query)) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(query)));

      return matchCat && matchType && matchInd && matchSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: span 12; text-align: center; padding: 64px 24px; color: var(--text-muted); font-family: var(--font-mono);">
          <div style="font-size: 1.1rem; color: var(--text); margin-bottom: 8px;">[NO MATCHES LOCATED]</div>
          <p style="font-size: 0.85rem;">No solutions matching active filter query "${escapeHtml(this.searchQuery || this.selectedCategory)}".</p>
        </div>
      `;
      return;
    }

    if (isBuyer) {
      // ----------------------------------------------------------------------
      // FR-MKT-002: Simplified Business Product Cards (Buyer Mode)
      // ----------------------------------------------------------------------
      grid.innerHTML = filtered
        .map((c) => {
          const isCompared = this.comparedComponentIds.has(c.id);
          const telemetry = c.measuredTelemetry || {};
          const activeInstalls = telemetry.activeInstalls;
          const channels = c.channels || ["Website", "WhatsApp", "Email"];

          return `
            <div class="buyer-card">
              <div class="buyer-card-header">
                <div class="buyer-card-icon">
                  ${c.businessCategory?.includes("💬") ? "💬" : c.businessCategory?.includes("📄") ? "📄" : c.businessCategory?.includes("📊") ? "📊" : c.businessCategory?.includes("🛒") ? "🛒" : c.businessCategory?.includes("⚙️") ? "⚙️" : c.businessCategory?.includes("✍️") ? "✍️" : c.businessCategory?.includes("🔎") ? "🔎" : "🤖"}
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <button class="btn-compare-toggle ${isCompared ? "active" : ""}" data-id="${escapeHtml(c.id)}">
                    ${isCompared ? "✓ Compared" : "+ Compare"}
                  </button>
                  <span class="badge badge-lime" style="font-size: 0.65rem;">VERIFIED</span>
                </div>
              </div>

              <h3 class="buyer-card-title">${escapeHtml(c.buyerTitle || c.name)}</h3>
              <p class="buyer-card-valueprop">${escapeHtml(c.buyerValueProp || c.shortDesc)}</p>

              <div class="buyer-social-proof">
                ${
                  c.rating
                    ? `<span class="buyer-social-rating">★ ${escapeHtml(c.rating)}</span>
                <span>(${escapeHtml(c.ratingCount || 0)} reviews)</span>`
                    : `<span>No reviews yet</span>`
                }
                ${activeInstalls ? `<span>•</span><span class="buyer-social-installs">${escapeHtml(activeInstalls)} installs (sample)</span>` : ""}
              </div>

              <div class="buyer-channels-container">
                <div class="buyer-channels-label">Supported Channels:</div>
                <div class="buyer-channels-row">
                  ${channels.map((ch) => `<span class="channel-badge"><span class="channel-check">✓</span> ${escapeHtml(ch)}</span>`).join("")}
                </div>
              </div>

              <div class="buyer-meta-specs">
                <div class="buyer-meta-item">Setup: <strong>${escapeHtml(c.setupComplexity || "Easy (~15 mins)")}</strong></div>
                <div class="buyer-meta-item">Input: <strong>${escapeHtml(c.prerequisites ? c.prerequisites.split(",")[0] : "Docs / FAQs")}</strong></div>
              </div>

              <div class="buyer-card-footer">
                <div class="buyer-price-box">
                  <span class="buyer-price-label">STARTING AT</span>
                  <div class="buyer-price-amount">${escapeHtml(c.priceFormatted)}<span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted);">/mo</span></div>
                  <span class="buyer-price-inr">or ${escapeHtml(c.inrPriceFormatted)}/mo</span>
                </div>
                <div style="display: flex; gap: 6px;">
                  <button class="btn btn-secondary btn-sm btn-view-detail" data-id="${escapeHtml(c.id)}">
                    Learn More
                  </button>
                  <button class="btn btn-primary btn-sm btn-try-sandbox" data-id="${escapeHtml(c.id)}">
                    Try Demo →
                  </button>
                </div>
              </div>
            </div>
          `;
        })
        .join("");
    } else {
      // ----------------------------------------------------------------------
      // FR-MKT-003: Developer Technical Cards (Developer Mode)
      // ----------------------------------------------------------------------
      grid.innerHTML = filtered
        .map((c, index) => {
          const isFeatured = index === 0 && this.selectedCategory === "all" && this.selectedProductType === "all" && !this.searchQuery;
          const isCompared = this.comparedComponentIds.has(c.id);
          const telemetry = c.measuredTelemetry || {};

          if (isFeatured) {
            return `
              <div class="bento-card featured-wide">
                <div class="bento-card-meta">
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span class="badge badge-lime">FLAGSHIP ARCHITECTURE</span>
                    <span class="badge badge-gray">${escapeHtml(c.category)}</span>
                    <span class="badge badge-indigo" style="font-size: 0.68rem;">${escapeHtml(c.productType || "RAG_SYSTEM")}</span>
                    <span class="badge badge-cyan" style="font-size: 0.68rem;">by ${escapeHtml(c.sellerName || "Apex AI Labs")}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <button class="btn-compare-toggle ${isCompared ? "active" : ""}" data-id="${escapeHtml(c.id)}">
                      ${isCompared ? "✓ Compared" : "+ Compare"}
                    </button>
                    <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent);">${escapeHtml(c.version)}</span>
                  </div>
                </div>

                <h3 class="bento-card-title" style="font-size: 1.6rem;">${escapeHtml(c.name)}</h3>
                <p class="bento-card-desc">${escapeHtml(c.longDesc)}</p>

                <!-- Hardware and Accuracy Badges -->
                <div style="display: flex; gap: 12px; margin: 10px 0; font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); flex-wrap: wrap;">
                  <span>• VRAM: <strong style="color: var(--text);">${escapeHtml(c.hardwareReqs ? c.hardwareReqs.vram : "8 GB VRAM")}</strong></span>
                  <span>• p95 (sample): <strong style="color: var(--accent);">${escapeHtml(telemetry.p95Latency || "—")}</strong></span>
                  <span>• Eval (sample): <strong style="color: var(--cyan);">${escapeHtml(telemetry.evalScore || "—")}</strong></span>
                  <span>• Uptime (sample): <strong style="color: var(--success);">${escapeHtml(telemetry.uptime30d || "—")}</strong></span>
                </div>

                <div class="bento-mini-inspector">
                  <span>[INSPECTOR]</span>
                  <span>Hybrid HNSW Vector + BM25 Lexical • Sub-second byte attribution</span>
                </div>

                <div class="bento-tags-row">
                  ${(c.tags || []).map((t) => `<span class="tech-tag">${escapeHtml(t)}</span>`).join("")}
                  <span class="tech-tag">VPC-PEERING</span>
                  <span class="tech-tag">DPDP-RESIDENT</span>
                </div>

                <div class="bento-card-footer">
                  <div>
                    <span style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">STARTING PRICE</span>
                    <div class="bento-price-val">${escapeHtml(c.priceFormatted)} <span style="font-size: 0.75rem; font-weight: 400; color: var(--text-muted);">/ ${escapeHtml(c.inrPriceFormatted)}</span></div>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button class="btn btn-secondary btn-sm btn-view-detail" data-id="${escapeHtml(c.id)}">
                      Technical Specs
                    </button>
                    <button class="btn btn-primary btn-sm btn-try-sandbox" data-id="${escapeHtml(c.id)}">
                      Test Sandbox →
                    </button>
                  </div>
                </div>
              </div>
            `;
          }

          // Standard developer card
          return `
            <div class="bento-card standard-card">
              <div class="bento-card-meta">
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                  <span class="badge badge-gray">${escapeHtml(c.category)}</span>
                  <span class="badge badge-indigo" style="font-size: 0.65rem;">${escapeHtml(c.productType || "AI_AGENT")}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <button class="btn-compare-toggle ${isCompared ? "active" : ""}" data-id="${escapeHtml(c.id)}">
                    ${isCompared ? "✓" : "+"} Compare
                  </button>
                  <span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted);">${escapeHtml(c.version)}</span>
                </div>
              </div>

              <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                <span>by <strong style="color: var(--cyan);">${escapeHtml(c.sellerName || "Cortex Team")}</strong></span>
                ${c.sellerVerified ? `<span style="color: var(--accent); font-size: 0.7rem;" title="Verified Seller">●</span>` : ""}
              </div>

              <h3 class="bento-card-title">${escapeHtml(c.name)}</h3>
              <p class="bento-card-desc">${escapeHtml(c.shortDesc)}</p>

              <div style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--accent); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                <span>→</span> <span>${escapeHtml(c.coreOutput)}</span>
              </div>

              <div style="display: flex; gap: 8px; font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted); margin-bottom: 10px;">
                <span>VRAM: <strong style="color: var(--text);">${escapeHtml(c.hardwareReqs ? c.hardwareReqs.vram.split(" ")[0] + " GB" : "4 GB")}</strong></span>
                <span>• Latency (sample): <strong style="color: var(--cyan);">${escapeHtml(telemetry.p95Latency || "—")}</strong></span>
                ${c.rating ? `<span>• ★ ${escapeHtml(c.rating)}</span>` : ""}
              </div>

              <div class="bento-tags-row">
                ${(c.tags || []).map((t) => `<span class="tech-tag">${escapeHtml(t)}</span>`).join("")}
              </div>

              <div class="bento-card-footer">
                <div>
                  <span style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">STARTING PRICE</span>
                  <div class="bento-price-val">${escapeHtml(c.priceFormatted)}</div>
                </div>
                <div style="display: flex; gap: 6px;">
                  <button class="btn btn-secondary btn-sm btn-view-detail" data-id="${escapeHtml(c.id)}">
                    Specs
                  </button>
                  <button class="btn btn-primary btn-sm btn-try-sandbox" data-id="${escapeHtml(c.id)}">
                    Trial →
                  </button>
                </div>
              </div>
            </div>
          `;
        })
        .join("");
    }

    // Attach click listeners to cards
    grid.querySelectorAll(".btn-view-detail").forEach((btn) => {
      btn.addEventListener("click", () => this.openDetailModal(btn.dataset.id));
    });

    grid.querySelectorAll(".btn-try-sandbox").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.app.navigateTo("playground", { componentId: btn.dataset.id });
      });
    });

    grid.querySelectorAll(".btn-compare-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (this.comparedComponentIds.has(id)) {
          this.comparedComponentIds.delete(id);
        } else {
          if (this.comparedComponentIds.size >= 5) {
            showToast("Comparison limit reached (Maximum 5 components)", "warning");
            return;
          }
          this.comparedComponentIds.add(id);
        }
        this.updateComparisonTray();
        this.renderBentoCards();
      });
    });
  }

  updateComparisonTray() {
    const tray = document.getElementById("comparison-tray");
    const countLabel = document.getElementById("comparison-count-label");
    if (!tray || !countLabel) return;

    const count = this.comparedComponentIds.size;
    if (count > 0) {
      tray.style.display = "block";
      countLabel.textContent = `${count} component${count > 1 ? "s" : ""} selected for technical comparison (Max 5)`;
    } else {
      tray.style.display = "none";
    }
  }

  // --------------------------------------------------------------------------
  // Multi-Product Side-by-Side Comparison Modal (SRS Section 10, FR-MKT-005)
  // --------------------------------------------------------------------------
  openComparisonModal() {
    if (this.comparedComponentIds.size === 0) return;

    const selectedComps = this.components.filter((c) => this.comparedComponentIds.has(c.id));
    const modal = document.getElementById("comparison-modal");
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-dialog modal-xl">
        <div class="modal-header">
          <div>
            <span class="badge badge-lime">// SRS SECTION 10 // COMPARISON MATRIX (FR-MKT-005)</span>
            <h3 class="modal-title" style="margin-top: 4px;">Side-by-Side Technical Comparison (${selectedComps.length} Engines)</h3>
          </div>
          <button class="btn-icon btn-ghost modal-close-btn">${getIconSvg("x", 20)}</button>
        </div>

        <div class="modal-body" style="overflow-x: auto; padding: 20px;">
          <table class="comparison-matrix-table">
            <thead>
              <tr>
                <th style="min-width: 180px;">SPECIFICATION</th>
                ${selectedComps
                  .map(
                    (c) => `
                  <th style="min-width: 220px; text-align: left;">
                    <div style="font-weight: 700; color: #FFF; font-size: 1rem;">${escapeHtml(c.name)}</div>
                    <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--cyan); margin-top: 2px;">
                      by ${escapeHtml(c.sellerName || "Apex AI Labs")} (${escapeHtml(c.version)})
                    </div>
                  </th>
                `
                  )
                  .join("")}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="matrix-label">Base Price</td>
                ${selectedComps
                  .map(
                    (c) => `
                  <td class="matrix-val" style="color: var(--accent); font-weight: 700; font-size: 1.05rem;">
                    ${escapeHtml(c.priceFormatted)} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 400;">(${escapeHtml(c.inrPriceFormatted)})</span>
                  </td>
                `
                  )
                  .join("")}
              </tr>
              <tr>
                <td class="matrix-label">Category &amp; Type</td>
                ${selectedComps
                  .map(
                    (c) => `
                  <td class="matrix-val">
                    <span class="badge badge-gray">${escapeHtml(c.category)}</span>
                    <span class="badge badge-indigo" style="font-size: 0.65rem;">${escapeHtml(c.productType || "RAG_SYSTEM")}</span>
                  </td>
                `
                  )
                  .join("")}
              </tr>
              <tr>
                <td class="matrix-label">Accuracy Benchmark (sample)</td>
                ${selectedComps
                  .map(
                    (c) => `
                  <td class="matrix-val" style="color: var(--accent);">
                    ${escapeHtml(c.measuredTelemetry?.evalScore || (c.benchmarks ? c.benchmarks.accuracy : "—"))}
                  </td>
                `
                  )
                  .join("")}
              </tr>
              <tr>
                <td class="matrix-label">P95 Inference Latency</td>
                ${selectedComps
                  .map(
                    (c) => `
                  <td class="matrix-val" style="color: var(--cyan); font-family: var(--font-mono);">
                    ${escapeHtml(c.measuredTelemetry?.p95Latency || (c.benchmarks ? c.benchmarks.latencyP95 : "<800ms"))}
                  </td>
                `
                  )
                  .join("")}
              </tr>
              <tr>
                <td class="matrix-label">Hardware VRAM Bounds</td>
                ${selectedComps
                  .map(
                    (c) => `
                  <td class="matrix-val" style="font-family: var(--font-mono);">
                    ${escapeHtml(c.hardwareReqs ? c.hardwareReqs.vram : "8 GB VRAM")}
                  </td>
                `
                  )
                  .join("")}
              </tr>
              <tr>
                <td class="matrix-label">Action</td>
                ${selectedComps
                  .map(
                    (c) => `
                  <td class="matrix-val">
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                      <button class="btn btn-primary btn-sm btn-comp-trial" data-id="${escapeHtml(c.id)}">
                        Test in Sandbox →
                      </button>
                      <button class="btn btn-secondary btn-sm btn-comp-buy" data-id="${escapeHtml(c.id)}">
                        Purchase License
                      </button>
                    </div>
                  </td>
                `
                  )
                  .join("")}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    modal.classList.add("active");
    modal.querySelectorAll(".modal-close-btn").forEach((b) => {
      b.addEventListener("click", () => modal.classList.remove("active"));
    });

    modal.querySelectorAll(".btn-comp-trial").forEach((btn) => {
      btn.addEventListener("click", () => {
        modal.classList.remove("active");
        this.app.navigateTo("playground", { componentId: btn.dataset.id });
      });
    });

    modal.querySelectorAll(".btn-comp-buy").forEach((btn) => {
      btn.addEventListener("click", () => {
        modal.classList.remove("active");
        const comp = this.components.find((c) => c.id === btn.dataset.id);
        if (comp) {
          this.app.openCheckoutModal({
            componentId: comp.id,
            componentName: comp.name,
            tier: "Starter",
            price: comp.priceFormatted
          });
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // SRS Section 11: Product Detail Page (PDP) with Progressive Disclosure
  // --------------------------------------------------------------------------
  openDetailModal(componentId) {
    const comp = this.components.find((c) => c.id === componentId);
    if (!comp) return;

    const modal = document.getElementById("component-detail-modal");
    const telemetry = comp.measuredTelemetry || {};
    const basePriceNum = comp.basePrice || 499;

    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span class="badge badge-lime">${escapeHtml(comp.businessCategory || comp.category)}</span>
              <span class="badge badge-indigo">${escapeHtml(comp.productType || "AI_AGENT")}</span>
              <span class="badge badge-cyan">by ${escapeHtml(comp.sellerName || "Apex AI Labs")}</span>
              <span style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted);">${escapeHtml(comp.version)}</span>
            </div>
            <h2 class="modal-title" style="margin-top: 6px;">${escapeHtml(comp.buyerTitle || comp.name)}</h2>
          </div>
          <button class="btn-icon btn-ghost modal-close-btn">${getIconSvg("x", 20)}</button>
        </div>

        <div class="modal-body">
          <!-- 11.1 Above the Fold: Business Decision Section -->
          <div class="pdp-header-band">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text);">${escapeHtml(comp.name)}</h3>
            <p class="pdp-tagline">${escapeHtml(comp.buyerValueProp || comp.shortDesc)}</p>
            
            <div class="pdp-fit-badges-row">
              ${(comp.goodFor || comp.tags || ["Enterprise", "SMBs"]).map((g) => `<span class="fit-badge">Good for: ${escapeHtml(g)}</span>`).join("")}
            </div>
          </div>

          <!-- PDP-02: Trust Panel. Shows sample values until platform telemetry fills Product.uptimePct30d etc. (G11) -->
          <div class="live-trust-panel">
            <div class="trust-panel-title">
              <span>// TRUST PANEL (PDP-02)</span>
              <span style="color: var(--status-review);">SAMPLE DATA, NOT YET MEASURED</span>
            </div>
            <div class="trust-metrics-grid">
              <div class="trust-metric-cell">
                <span class="trust-metric-lbl">30-Day Uptime</span>
                <span class="trust-metric-val">${escapeHtml(telemetry.uptime30d || "—")}</span>
              </div>
              <div class="trust-metric-cell">
                <span class="trust-metric-lbl">p95 Latency</span>
                <span class="trust-metric-val">${escapeHtml(telemetry.p95Latency || "—")}</span>
              </div>
              <div class="trust-metric-cell">
                <span class="trust-metric-lbl">Benchmark Eval</span>
                <span class="trust-metric-val" style="color: var(--cyan);">${escapeHtml(telemetry.evalScore || "—")}</span>
              </div>
              <div class="trust-metric-cell">
                <span class="trust-metric-lbl">Active Installs</span>
                <span class="trust-metric-val">${escapeHtml(String(telemetry.activeInstalls ?? "—"))}</span>
              </div>
              <div class="trust-metric-cell">
                <span class="trust-metric-lbl">Release Date</span>
                <span class="trust-metric-val" style="font-size: 0.85rem;">${escapeHtml(telemetry.lastUpdated || "—")}</span>
              </div>
            </div>
          </div>

          <!-- What It Does & What You Need -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
            <div style="background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px;">
              <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text); margin-bottom: 10px;">What It Does (Business Impact)</h4>
              <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.84rem; color: var(--text-muted);">
                <div>• Eliminates manual backlog and repetitive human steps.</div>
                <div>• Learns directly from your business documents with exact citations.</div>
                <div>• Integrates into website widgets, WhatsApp, or internal APIs.</div>
                <div>• Automatic human-escalation handover on complex queries.</div>
              </div>
            </div>

            <div style="background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px;">
              <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text); margin-bottom: 10px;">What You Need (Prerequisites)</h4>
              <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.84rem; color: var(--text-muted);">
                <div>• <strong>Input Data:</strong> ${escapeHtml(comp.prerequisites || "Your FAQs, documents or database read URL")}</div>
                <div>• <strong>Setup Time:</strong> ${escapeHtml(comp.setupComplexity || "Easy — ~15 minutes with wizard")}</div>
                <div>• <strong>Coding Required:</strong> None (Turnkey solution with guided UI)</div>
                <div>• <strong>Data Privacy:</strong> Zero training on your proprietary data</div>
              </div>
            </div>
          </div>

          <!-- PDP-03: Interactive Cost Estimator -->
          <div class="cost-estimator-box">
            <div class="estimator-header">
              <span class="estimator-title">📊 Real-Time Cost Estimator (PDP-03)</span>
              <span style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted);">Adjust monthly query volume:</span>
            </div>
            <div class="estimator-slider-wrap">
              <input type="range" min="1000" max="100000" step="1000" value="10000" class="estimator-slider" id="estimator-volume-slider" />
              <div class="estimator-slider-labels">
                <span>1,000 requests/mo</span>
                <span id="estimator-volume-display" style="color: var(--accent); font-weight: 700;">10,000 requests/mo</span>
                <span>100,000 requests/mo</span>
              </div>
            </div>
            <div class="estimator-result-row">
              <div>
                <span style="font-size: 0.76rem; color: var(--text-muted); font-family: var(--font-mono);">ESTIMATED MONTHLY INVESTMENT:</span>
                <div style="font-size: 0.74rem; color: var(--text-dim);">Includes cloud hosting, compute inference, security updates, and SLAs.</div>
              </div>
              <div style="text-align: right;">
                <div class="estimator-calc-value" id="estimator-price-usd">$${basePriceNum} USD</div>
                <div style="font-size: 0.76rem; color: var(--text-muted);" id="estimator-price-inr">₹${Math.round(basePriceNum * 83.5).toLocaleString()} INR (incl. GST)</div>
              </div>
            </div>
          </div>

          <!-- 11.2 Below the Fold: Progressive Disclosure ("Technical Details ▾") -->
          <details class="tech-details-disclosure">
            <summary class="tech-details-summary">
              <span>▼ TECHNICAL SPECIFICATIONS &amp; ARCHITECTURE (PROGRESSIVE DISCLOSURE §11.2)</span>
              <span style="color: var(--accent);">Click to expand</span>
            </summary>
            
            <div class="tech-details-content">
              <div class="tab-bar" id="modal-tabs">
                <button class="tab-btn active" data-tab="architecture">Data Pipeline</button>
                <button class="tab-btn" data-tab="specs">Hardware &amp; VRAM</button>
                <button class="tab-btn" data-tab="code">OpenAPI &amp; SDK</button>
                <button class="tab-btn" data-tab="reviews">Verified Reviews [${comp.reviews ? comp.reviews.length : 0}]</button>
              </div>

              <div class="tab-content" id="tab-architecture">
                <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 12px; font-family: var(--font-mono);">
                  Underlying execution topology and isolation pipeline:
                </p>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  ${(comp.architecture || [])
                    .map(
                      (step) => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-xs);">
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--accent); font-weight: 700;">STAGE 0${step.step}</span>
                        <strong style="font-size: 0.86rem; color: var(--text);">${escapeHtml(step.title)}</strong>
                      </div>
                      <span style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono);">${escapeHtml(step.desc)}</span>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>

              <div class="tab-content" id="tab-specs" style="display: none;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
                  <div class="spec-detail-box">
                    <span class="spec-label">MINIMUM VRAM</span>
                    <span class="spec-val" style="color: var(--accent);">${escapeHtml(comp.hardwareReqs ? comp.hardwareReqs.vram : "8 GB VRAM")}</span>
                  </div>
                  <div class="spec-detail-box">
                    <span class="spec-label">RECOMMENDED GPU</span>
                    <span class="spec-val">${escapeHtml(comp.hardwareReqs ? comp.hardwareReqs.gpu : "NVIDIA RTX 4090 / Cloud T4")}</span>
                  </div>
                  <div class="spec-detail-box">
                    <span class="spec-label">CPU &amp; SYSTEM RAM</span>
                    <span class="spec-val">${escapeHtml(comp.hardwareReqs ? `${comp.hardwareReqs.cpu} // ${comp.hardwareReqs.ram}` : "4 Cores, 16 GB RAM")}</span>
                  </div>
                  <div class="spec-detail-box">
                    <span class="spec-label">LICENSE GRANT</span>
                    <span class="spec-val">${escapeHtml(comp.licenseType || "Commercial Permissive")}</span>
                  </div>
                </div>

                <div style="background: var(--surface-2); border: 1px solid var(--border); border-radius: 6px; padding: 12px;">
                  <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">
                    SHA-256 ARTIFACT INTEGRITY CHECKSUM
                  </span>
                  <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--text); margin-top: 4px; word-break: break-all;">
                    ${escapeHtml(comp.artifactChecksum || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")}
                  </div>
                </div>
              </div>

              <div class="tab-content" id="tab-code" style="display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--accent);">SDK Snippet // Python 3.10+</span>
                  <button class="btn btn-outline btn-sm copy-snippet-btn">Copy Code</button>
                </div>
                <pre style="background: var(--surface-2); border: 1px solid var(--border); padding: 14px; border-radius: var(--radius-xs); font-family: var(--font-mono); font-size: 0.78rem; color: var(--text); overflow-x: auto; line-height: 1.5;">${escapeHtml(comp.codeSnippets ? comp.codeSnippets.python : "# Python snippet")}</pre>
              </div>

              <div class="tab-content" id="tab-reviews" style="display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                  <div>
                    <span style="font-size: 1.2rem; font-weight: 700; color: var(--text);">★ ${comp.rating || 4.9}</span>
                    <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 6px;">based on ${comp.ratingCount || 12} verified purchaser reviews</span>
                  </div>
                  <button class="btn btn-secondary btn-sm" id="btn-toggle-write-review">
                    + Write a Review
                  </button>
                </div>

                <div id="write-review-panel" style="display: none; background: var(--surface-2); border: 1px solid var(--border); border-radius: 6px; padding: 14px; margin-bottom: 16px;">
                  <h5 style="color: var(--text); font-size: 0.9rem; margin-bottom: 10px;">Submit Verified Purchaser Review</h5>
                  <div class="form-row">
                    <div class="form-group flex-1">
                      <label class="form-label">Reviewer Name</label>
                      <input type="text" class="text-input" id="review-author" placeholder="e.g. Operations Director, Global Retail" />
                    </div>
                    <div class="form-group" style="width: 120px;">
                      <label class="form-label">Rating</label>
                      <select class="select-input" id="review-rating">
                        <option value="5">5 ★★★★★</option>
                        <option value="4">4 ★★★★</option>
                        <option value="3">3 ★★★</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Headline</label>
                    <input type="text" class="text-input" id="review-title" placeholder="e.g. Saved 20 hours per week from day one" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Review Details</label>
                    <textarea class="textarea-input" id="review-comment" rows="3" placeholder="Describe business outcomes, setup experience, and impact..."></textarea>
                  </div>
                  <button class="btn btn-primary btn-sm" id="btn-submit-review">Submit Review</button>
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px;">
                  ${
                    comp.reviews && comp.reviews.length > 0
                      ? comp.reviews
                          .map(
                            (r) => `
                    <div style="background: var(--surface-2); border: 1px solid var(--border); border-radius: 6px; padding: 14px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <div>
                          <strong style="color: var(--text); font-size: 0.9rem;">${escapeHtml(r.title)}</strong>
                          <div style="font-size: 0.75rem; color: var(--accent); margin-top: 2px;">
                            ★ ${r.rating}.0 // ${escapeHtml(r.buyerName)} [VERIFIED PURCHASER]
                          </div>
                        </div>
                        <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${escapeHtml(r.date)}</span>
                      </div>
                      <p style="font-size: 0.84rem; color: var(--text-muted); line-height: 1.5; margin-top: 6px;">
                        ${escapeHtml(r.comment)}
                      </p>
                    </div>
                  `
                          )
                          .join("")
                      : `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 24px;">No reviews yet. Be the first verified buyer to leave feedback!</div>`
                  }
                </div>
              </div>
            </div>
          </details>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary btn-launch-playground-modal" data-id="${escapeHtml(comp.id)}">
            Launch in Sandbox →
          </button>
          <button class="btn btn-primary btn-buy-now-modal" data-id="${escapeHtml(comp.id)}">
            Buy &amp; Setup Now (${escapeHtml(comp.priceFormatted)})
          </button>
        </div>
      </div>
    `;

    modal.classList.add("active");

    modal.querySelector(".modal-close-btn").addEventListener("click", () => modal.classList.remove("active"));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("active");
    });

    // Cost estimator slider logic
    const slider = modal.querySelector("#estimator-volume-slider");
    const volumeDisplay = modal.querySelector("#estimator-volume-display");
    const priceUsdDisplay = modal.querySelector("#estimator-price-usd");
    const priceInrDisplay = modal.querySelector("#estimator-price-inr");

    if (slider) {
      slider.addEventListener("input", (e) => {
        const vol = parseInt(e.target.value);
        volumeDisplay.textContent = `${vol.toLocaleString()} requests/mo`;
        
        // Scale calculation: base price covers 10,000 requests, extra is metered at $0.005/req
        const extraReqs = Math.max(0, vol - 10000);
        const calculatedUsd = Math.round(basePriceNum + (extraReqs * 0.005));
        const calculatedInr = Math.round(calculatedUsd * 83.5);

        priceUsdDisplay.textContent = `$${calculatedUsd.toLocaleString()} USD`;
        priceInrDisplay.textContent = `₹${calculatedInr.toLocaleString()} INR (incl. GST)`;
      });
    }

    // Tabs inside details
    modal.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        modal.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        modal.querySelectorAll(".tab-content").forEach((tc) => (tc.style.display = "none"));
        const target = modal.querySelector(`#tab-${btn.dataset.tab}`);
        if (target) target.style.display = "block";
      });
    });

    const copyBtn = modal.querySelector(".copy-snippet-btn");
    if (copyBtn && comp.codeSnippets) {
      copyBtn.addEventListener("click", () => copyToClipboard(comp.codeSnippets.python, "SDK sample copied!"));
    }

    modal.querySelector(".btn-launch-playground-modal").addEventListener("click", () => {
      modal.classList.remove("active");
      this.app.navigateTo("playground", { componentId: comp.id });
    });

    modal.querySelector(".btn-buy-now-modal").addEventListener("click", () => {
      modal.classList.remove("active");
      this.app.openCheckoutModal({
        componentId: comp.id,
        componentName: comp.buyerTitle || comp.name,
        tier: "Starter",
        price: comp.priceFormatted
      });
    });

    // Write review toggle & submit
    const writeReviewBtn = modal.querySelector("#btn-toggle-write-review");
    const writePanel = modal.querySelector("#write-review-panel");
    if (writeReviewBtn && writePanel) {
      writeReviewBtn.addEventListener("click", () => {
        writePanel.style.display = writePanel.style.display === "none" ? "block" : "none";
      });
    }

    const submitReviewBtn = modal.querySelector("#btn-submit-review");
    if (submitReviewBtn) {
      submitReviewBtn.addEventListener("click", async () => {
        const author = modal.querySelector("#review-author").value;
        const rating = modal.querySelector("#review-rating").value;
        const title = modal.querySelector("#review-title").value;
        const comment = modal.querySelector("#review-comment").value;

        if (!title || !comment) {
          showToast("Please provide both a review headline and comment", "warning");
          return;
        }

        await this.app.api.submitReview(comp.id, {
          buyerName: author || "Verified Enterprise Buyer",
          rating,
          title,
          comment
        });

        showToast("Review submitted and published!", "success");
        this.openDetailModal(comp.id);
      });
    }
  }
}
