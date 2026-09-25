/**
 * Cortex Hub - Marketplace & Catalog View Controller
 * Implements SRS v2.0 Section 8 (Categories), Section 9 (Product Types),
 * Section 10 (Marketplace, Search, Filtering & Product Comparison FR-MKT-005),
 * Section 11 (Product Detail Page), and Section 21 (Verified Reviews).
 */

import { CATALOG_COMPONENTS } from "../data/catalog-data.js";
import { getIconSvg, copyToClipboard, showToast } from "../utils/helpers.js";

export class MarketplaceView {
  constructor(app) {
    this.app = app;
    this.components = CATALOG_COMPONENTS;
    this.selectedCategory = "all";
    this.selectedProductType = "all";
    this.selectedIndustry = "all";
    this.searchQuery = "";
    this.comparedComponentIds = new Set(); // Multi-product comparison (FR-MKT-005)
  }

  async render(container) {
    // Refresh components from client cache/backend
    this.components = await this.app.api.getComponents();

    container.innerHTML = `
      <!-- Asymmetric Hero Section (Off-Center Split) -->
      <section class="hero-asymmetric">
        <!-- Left Column: High-Impact Technical Narrative -->
        <div class="hero-content-left">
          <span class="hero-spec-tag">// MASTER SPECIFICATION // SRS v2.0 MULTI-VENDOR</span>
          <h1 class="hero-headline">
            Production AI Engines. <span class="accent-text">Zero Guesswork.</span>
          </h1>
          <p class="hero-technical-desc">
            The multi-vendor marketplace for production-ready AI building blocks. Discover, evaluate in live sandboxes, compare technical architectures, and integrate verified models, agents, MCP servers, and RAG pipelines.
          </p>

          <div class="hero-cta-cluster">
            <button class="btn btn-primary btn-lg" id="hero-btn-explore">
              Explore ${this.components.length} Verified Components →
            </button>
            <button class="btn btn-secondary btn-lg" id="hero-btn-launch-sandbox">
              Launch Live Sandbox
            </button>
            <button class="btn btn-outline btn-lg" id="hero-btn-sell-component">
              Sell Component →
            </button>
          </div>

          <div class="hero-specs-row">
            <div class="hero-spec-item">
              <span class="hero-spec-val">${this.components.length}/${this.components.length}</span>
              <span class="hero-spec-lbl">Production Templates</span>
            </div>
            <div class="hero-spec-item">
              <span class="hero-spec-val">&lt; 750ms</span>
              <span class="hero-spec-lbl">Average P95 Latency</span>
            </div>
            <div class="hero-spec-item">
              <span class="hero-spec-val">100%</span>
              <span class="hero-spec-lbl">Verified Vendors</span>
            </div>
            <div class="hero-spec-item">
              <span class="hero-spec-val">DPDP/SOC2</span>
              <span class="hero-spec-lbl">Zero Data Egress</span>
            </div>
          </div>
        </div>

        <!-- Right Column: Live Pipeline Benchmark Monitor -->
        <div class="pipeline-monitor-box">
          <div class="monitor-header">
            <span class="monitor-title">
              <span class="ticker-beacon"></span>
              LIVE PIPELINE BENCHMARK // RAG-1.3
            </span>
            <span class="badge badge-lime">ACTIVE TELEMETRY</span>
          </div>

          <div class="monitor-pipeline-stages">
            <div class="pipeline-stage-row">
              <span class="stage-name">1. Document OCR &amp; Chunking</span>
              <span class="stage-latency">14ms</span>
            </div>
            <div class="pipeline-stage-row">
              <span class="stage-name">2. Dense Vector (pgvector HNSW)</span>
              <span class="stage-latency">28ms</span>
            </div>
            <div class="pipeline-stage-row">
              <span class="stage-name">3. BM25 Sparse Reciprocal Rank</span>
              <span class="stage-latency">19ms</span>
            </div>
            <div class="pipeline-stage-row">
              <span class="stage-name">4. Cohere Cross-Encoder Rerank</span>
              <span class="stage-latency">42ms</span>
            </div>
            <div class="pipeline-stage-row" style="border-color: var(--accent-lime-border);">
              <span class="stage-name">5. Grounded Citation Verification</span>
              <span class="stage-latency" style="color: var(--accent-lime);">737ms</span>
            </div>
          </div>

          <div class="monitor-live-output">
            <div style="color: var(--text-muted); margin-bottom: 4px;">// LATEST INFERENCE PROOF:</div>
            <div>"Section 12.3: Liability capped at 12mo contract value."</div>
            <div style="color: var(--accent-lime); margin-top: 4px; font-size: 0.7rem;">
              → [Doc: Enterprise_MSA.docx // Page 18 // Byte: 14892-15200]
            </div>
          </div>
        </div>
      </section>

      <!-- Functional Filter & Search Bar (SRS Section 8 & 9) -->
      <section class="filter-bar">
        <div class="filter-top-row">
          <div class="search-input-box">
            <span class="search-svg-icon">${getIconSvg("search", 15)}</span>
            <input type="text" id="catalog-search" class="search-field" placeholder="Search components by technical capability, model, framework, or vendor..." />
          </div>
          <select id="industry-filter" class="industry-dropdown">
            <option value="all">DOMAIN: ALL DISCIPLINES</option>
            <option value="Legal">DOMAIN: LEGAL &amp; COMPLIANCE</option>
            <option value="Healthcare">DOMAIN: HEALTHCARE &amp; BIO</option>
            <option value="Finance">DOMAIN: FINANCE &amp; AUDIT</option>
            <option value="E-Commerce">DOMAIN: E-COMMERCE</option>
            <option value="EdTech">DOMAIN: EDTECH &amp; PEDAGOGY</option>
            <option value="Recruitment">DOMAIN: RECRUITMENT</option>
            <option value="Developer Tools">DOMAIN: DEVOPS &amp; TOOLS</option>
          </select>
        </div>

        <!-- Hierarchical Categories (SRS Section 8) -->
        <div class="category-tags-row">
          <button class="cat-filter-btn active" data-cat="all">ALL DISCIPLINES [${this.components.length}]</button>
          <button class="cat-filter-btn" data-cat="Generative AI">GENERATIVE AI &amp; RAG</button>
          <button class="cat-filter-btn" data-cat="Computer Vision">COMPUTER VISION &amp; OCR</button>
          <button class="cat-filter-btn" data-cat="Developer Tools">DEV TOOLS &amp; MCP SERVERS</button>
          <button class="cat-filter-btn" data-cat="NLP">NLP &amp; RERANKERS</button>
          <button class="cat-filter-btn" data-cat="Machine Learning">MACHINE LEARNING &amp; RECS</button>
          <button class="cat-filter-btn" data-cat="EdTech">EDTECH &amp; PEDAGOGY</button>
        </div>

        <!-- Product Type Pills (SRS Section 9) -->
        <div class="product-type-pills-row">
          <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted); align-self: center; margin-right: 6px;">TYPE:</span>
          <button class="type-pill-btn active" data-type="all">ALL TYPES</button>
          <button class="type-pill-btn" data-type="RAG_SYSTEM">RAG_SYSTEM</button>
          <button class="type-pill-btn" data-type="AI_AGENT">AI_AGENT</button>
          <button class="type-pill-btn" data-type="MCP_SERVER">MCP_SERVER</button>
          <button class="type-pill-btn" data-type="MODEL">MODEL</button>
          <button class="type-pill-btn" data-type="WORKFLOW">WORKFLOW</button>
          <button class="type-pill-btn" data-type="RERANKER">RERANKER</button>
          <button class="type-pill-btn" data-type="PROMPT_PACK">PROMPT_PACK</button>
        </div>
      </section>

      <!-- Bento Asymmetric Catalog Grid -->
      <section id="bento-catalog-grid" class="bento-catalog-grid">
        <!-- Injected dynamically -->
      </section>

      <!-- Sticky Floating Product Comparison Tray (FR-MKT-005) -->
      <div id="comparison-tray" class="comparison-tray" style="display: none;">
        <div class="comparison-tray-inner">
          <div class="comparison-tray-left">
            <span class="badge badge-lime">// COMPARISON ENGINE (FR-MKT-005)</span>
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

      <!-- Side-by-Side Comparison Modal (FR-MKT-005) -->
      <div id="comparison-modal" class="modal-backdrop"></div>
    `;

    this.attachEvents(container);
    this.renderBentoCards();
    this.updateComparisonTray();
  }

  attachEvents(container) {
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
    searchField.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderBentoCards();
    });

    const industryDropdown = container.querySelector("#industry-filter");
    industryDropdown.addEventListener("change", (e) => {
      this.selectedIndustry = e.target.value;
      this.renderBentoCards();
    });

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

    const filtered = this.components.filter((c) => {
      const matchCat = this.selectedCategory === "all" || c.category === this.selectedCategory;
      const matchType = this.selectedProductType === "all" || c.productType === this.selectedProductType;
      const matchInd = this.selectedIndustry === "all" || (c.tags && c.tags.includes(this.selectedIndustry));
      const matchSearch =
        !this.searchQuery ||
        c.name.toLowerCase().includes(this.searchQuery) ||
        c.shortDesc.toLowerCase().includes(this.searchQuery) ||
        (c.sellerName && c.sellerName.toLowerCase().includes(this.searchQuery)) ||
        (c.productType && c.productType.toLowerCase().includes(this.searchQuery)) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(this.searchQuery)));
      return matchCat && matchType && matchInd && matchSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: span 12; text-align: center; padding: 64px 24px; color: var(--text-muted); font-family: var(--font-mono);">
          <div style="font-size: 1.1rem; color: var(--text-primary); margin-bottom: 8px;">[NO MATCHES LOCATED]</div>
          <p style="font-size: 0.85rem;">No components matching active filter query "${this.searchQuery || this.selectedCategory}".</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map((c, index) => {
        const isFeatured = index === 0 && this.selectedCategory === "all" && this.selectedProductType === "all" && !this.searchQuery;
        const isCompared = this.comparedComponentIds.has(c.id);

        if (isFeatured) {
          return `
            <div class="bento-card featured-wide">
              <div class="bento-card-meta">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <span class="badge badge-lime">FLAGSHIP ARCHITECTURE</span>
                  <span class="badge badge-gray">${c.category}</span>
                  <span class="badge badge-indigo" style="font-size: 0.68rem;">${c.productType || "RAG_SYSTEM"}</span>
                  <span class="badge badge-cyan" style="font-size: 0.68rem;">by ${c.sellerName || "Apex AI Labs"}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <button class="btn-compare-toggle ${isCompared ? "active" : ""}" data-id="${c.id}">
                    ${isCompared ? "✓ Compared" : "+ Compare"}
                  </button>
                  <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-lime);">${c.version}</span>
                </div>
              </div>

              <h3 class="bento-card-title" style="font-size: 1.6rem;">${c.name}</h3>
              <p class="bento-card-desc">${c.longDesc}</p>

              <!-- Hardware and Accuracy Badges -->
              <div style="display: flex; gap: 12px; margin: 10px 0; font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-secondary); flex-wrap: wrap;">
                <span>• VRAM: <strong style="color: #FFF;">${c.hardwareReqs ? c.hardwareReqs.vram : "8 GB VRAM"}</strong></span>
                <span>• Benchmark: <strong style="color: var(--accent-lime);">${c.benchmarks ? c.benchmarks.accuracy : "98.4% Grounding"}</strong></span>
                <span>• P95 Latency: <strong style="color: var(--accent-cyan);">${c.benchmarks ? c.benchmarks.latencyP95 : "737ms"}</strong></span>
                <span>• Rating: <strong style="color: #FFF;">★ ${c.rating || 4.9} (${c.ratingCount || 1} verified)</strong></span>
              </div>

              <!-- Embedded Citation Proof Inspector -->
              <div class="bento-mini-inspector">
                <span>[INSPECTOR]</span>
                <span>Hybrid HNSW + BM25 • Page &amp; paragraph-level attribution with bounding boxes</span>
              </div>

              <div class="bento-tags-row">
                ${(c.tags || []).map((t) => `<span class="tech-tag">${t}</span>`).join("")}
                <span class="tech-tag">VPC-PEERING</span>
                <span class="tech-tag">HIPAA-READY</span>
              </div>

              <div class="bento-card-footer">
                <div>
                  <span style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">STARTING PRICE</span>
                  <div class="bento-price-val">${c.priceFormatted} <span style="font-size: 0.75rem; font-weight: 400; color: var(--text-muted);">/ ${c.inrPriceFormatted}</span></div>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary btn-sm btn-view-detail" data-id="${c.id}">
                    Technical Specs
                  </button>
                  <button class="btn btn-primary btn-sm btn-try-sandbox" data-id="${c.id}">
                    Test Sandbox →
                  </button>
                </div>
              </div>
            </div>
          `;
        }

        // Standard bento cards (span 4 columns)
        return `
          <div class="bento-card standard-card">
            <div class="bento-card-meta">
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span class="badge badge-gray">${c.category}</span>
                <span class="badge badge-indigo" style="font-size: 0.65rem;">${c.productType || "AI_AGENT"}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <button class="btn-compare-toggle ${isCompared ? "active" : ""}" data-id="${c.id}">
                  ${isCompared ? "✓" : "+"} Compare
                </button>
                <span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted);">${c.version}</span>
              </div>
            </div>

            <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
              <span>by <strong style="color: var(--accent-cyan);">${c.sellerName || "Cortex Team"}</strong></span>
              ${c.sellerVerified ? `<span style="color: var(--accent-lime); font-size: 0.7rem;" title="Verified Seller">●</span>` : ""}
            </div>

            <h3 class="bento-card-title">${c.name}</h3>
            <p class="bento-card-desc">${c.shortDesc}</p>

            <div style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--accent-lime); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <span>→</span> <span>${c.coreOutput}</span>
            </div>

            <div style="display: flex; gap: 8px; font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted); margin-bottom: 10px;">
              <span>VRAM: <strong style="color: #FFF;">${c.hardwareReqs ? c.hardwareReqs.vram.split(" ")[0] + " GB" : "4 GB"}</strong></span>
              <span>• Latency: <strong style="color: var(--accent-cyan);">${c.benchmarks ? c.benchmarks.latencyP95.split(" ")[0] : "<1s"}</strong></span>
              <span>• ★ ${c.rating || 4.8}</span>
            </div>

            <div class="bento-tags-row">
              ${(c.tags || []).map((t) => `<span class="tech-tag">${t}</span>`).join("")}
            </div>

            <div class="bento-card-footer">
              <div>
                <span style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">STARTING PRICE</span>
                <div class="bento-price-val">${c.priceFormatted}</div>
              </div>
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-secondary btn-sm btn-view-detail" data-id="${c.id}">
                  Specs
                </button>
                <button class="btn btn-primary btn-sm btn-try-sandbox" data-id="${c.id}">
                  Trial
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

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
            <span class="badge badge-lime">// SRS SECTION 10 // FR-MKT-005 COMPARISON MATRIX</span>
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
                    <div style="font-weight: 700; color: #FFF; font-size: 1rem;">${c.name}</div>
                    <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-cyan); margin-top: 2px;">
                      by ${c.sellerName || "Apex AI Labs"} (${c.version})
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
                  <td class="matrix-val" style="color: var(--accent-lime); font-weight: 700; font-size: 1.05rem;">
                    ${c.priceFormatted} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 400;">(${c.inrPriceFormatted})</span>
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
                    <span class="badge badge-gray">${c.category}</span>
                    <span class="badge badge-indigo" style="font-size: 0.65rem;">${c.productType || "RAG_SYSTEM"}</span>
                  </td>
                `
                  )
                  .join("")}
              </tr>
              <tr>
                <td class="matrix-label">Verified Accuracy Benchmark</td>
                ${selectedComps
                  .map(
                    (c) => `
                  <td class="matrix-val" style="color: var(--accent-lime);">
                    ${c.benchmarks ? c.benchmarks.accuracy : "98% Grounding Precision"}
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
                  <td class="matrix-val" style="color: var(--accent-cyan); font-family: var(--font-mono);">
                    ${c.benchmarks ? c.benchmarks.latencyP95 : "<800ms TTFT"}
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
                    ${c.hardwareReqs ? c.hardwareReqs.vram : "8 GB VRAM"}
                  </td>
                `
                  )
                  .join("")}
              </tr>
              <tr>
                <td class="matrix-label">Recommended GPU</td>
                ${selectedComps
                  .map(
                    (c) => `
                  <td class="matrix-val">
                    ${c.hardwareReqs ? c.hardwareReqs.gpu : "NVIDIA RTX 4090 / Cloud T4"}
                  </td>
                `
                  )
                  .join("")}
              </tr>
              <tr>
                <td class="matrix-label">License Grant</td>
                ${selectedComps
                  .map(
                    (c) => `
                  <td class="matrix-val" style="font-size: 0.78rem;">
                    ${c.licenseType || "Commercial Permissive (Multi-Seat)"}
                  </td>
                `
                  )
                  .join("")}
              </tr>
              <tr>
                <td class="matrix-label">Delivery Artifact Size</td>
                ${selectedComps
                  .map(
                    (c) => `
                  <td class="matrix-val" style="font-family: var(--font-mono);">
                    ${c.downloadSize || "850 MB"}
                  </td>
                `
                  )
                  .join("")}
              </tr>
              <tr>
                <td class="matrix-label">Verified Buyer Rating</td>
                ${selectedComps
                  .map(
                    (c) => `
                  <td class="matrix-val">
                    ★ ${c.rating || 4.9} (${c.ratingCount || 12} reviews)
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
                      <button class="btn btn-primary btn-sm btn-comp-trial" data-id="${c.id}">
                        Test in Sandbox →
                      </button>
                      <button class="btn btn-secondary btn-sm btn-comp-buy" data-id="${c.id}">
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
  // Enhanced Product Detail Modal (SRS Section 11 & 21)
  // --------------------------------------------------------------------------
  openDetailModal(componentId) {
    const comp = this.components.find((c) => c.id === componentId);
    if (!comp) return;

    const modal = document.getElementById("component-detail-modal");
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span class="badge badge-lime">${comp.category}</span>
              <span class="badge badge-indigo">${comp.productType || "AI_AGENT"}</span>
              <span class="badge badge-cyan">by ${comp.sellerName || "Apex AI Labs"}</span>
              <span style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted);">${comp.version}</span>
            </div>
            <h2 class="modal-title" style="margin-top: 6px;">${comp.name}</h2>
          </div>
          <button class="btn-icon btn-ghost modal-close-btn">${getIconSvg("x", 20)}</button>
        </div>

        <div class="modal-body">
          <div class="tab-bar" id="modal-tabs">
            <button class="tab-btn active" data-tab="overview">Capabilities</button>
            <button class="tab-btn" data-tab="architecture">Data Pipeline</button>
            <button class="tab-btn" data-tab="specs">Technical Specs &amp; Hardware</button>
            <button class="tab-btn" data-tab="code">Integration SDK</button>
            <button class="tab-btn" data-tab="reviews">Verified Reviews [${comp.reviews ? comp.reviews.length : 0}]</button>
            <button class="tab-btn" data-tab="pricing">Tiers &amp; Licenses</button>
          </div>

          <div class="tab-content" id="tab-overview">
            <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px;">
              ${comp.longDesc}
            </p>
            <div style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px;">
              Architectural Constraints &amp; Features:
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${(comp.features || [])
                .map(
                  (f) => `
                <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.84rem; color: var(--text-primary); font-family: var(--font-sans);">
                  <span style="color: var(--accent-lime); font-family: var(--font-mono);">[+]</span>
                  <span>${f}</span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>

          <div class="tab-content" id="tab-architecture" style="display: none;">
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 12px; font-family: var(--font-mono);">
              Deterministic inference flow with tenant isolation guarantees:
            </p>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${(comp.architecture || [])
                .map(
                  (step) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-surface-2); border: 1px solid var(--border-medium); border-radius: var(--radius-xs);">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--accent-lime); font-weight: 700;">PHASE 0${step.step}</span>
                    <strong style="font-size: 0.86rem;">${step.title}</strong>
                  </div>
                  <span style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono);">${step.desc}</span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>

          <!-- Technical Specs Tab (SRS Section 11 & 46) -->
          <div class="tab-content" id="tab-specs" style="display: none;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
              <div class="spec-detail-box">
                <span class="spec-label">MINIMUM VRAM</span>
                <span class="spec-val" style="color: var(--accent-lime);">${comp.hardwareReqs ? comp.hardwareReqs.vram : "8 GB VRAM"}</span>
              </div>
              <div class="spec-detail-box">
                <span class="spec-label">RECOMMENDED GPU</span>
                <span class="spec-val">${comp.hardwareReqs ? comp.hardwareReqs.gpu : "NVIDIA RTX 4090 / A10G"}</span>
              </div>
              <div class="spec-detail-box">
                <span class="spec-label">CPU &amp; SYSTEM RAM</span>
                <span class="spec-val">${comp.hardwareReqs ? `${comp.hardwareReqs.cpu} // ${comp.hardwareReqs.ram}` : "4 Cores, 16 GB RAM"}</span>
              </div>
              <div class="spec-detail-box">
                <span class="spec-label">BENCHMARK ACCURACY</span>
                <span class="spec-val" style="color: var(--accent-cyan);">${comp.benchmarks ? comp.benchmarks.accuracy : "98.4% Precision"}</span>
              </div>
              <div class="spec-detail-box">
                <span class="spec-label">P95 INFERENCE LATENCY</span>
                <span class="spec-val" style="color: var(--accent-lime);">${comp.benchmarks ? comp.benchmarks.latencyP95 : "737ms TTFT"}</span>
              </div>
              <div class="spec-detail-box">
                <span class="spec-label">DOWNLOAD PACKAGE SIZE</span>
                <span class="spec-val">${comp.downloadSize || "1.42 GB"}</span>
              </div>
            </div>

            <div style="background: var(--bg-deep); border: 1px solid var(--border-medium); border-radius: 6px; padding: 12px;">
              <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">
                SHA-256 ARTIFACT INTEGRITY CHECKSUM
              </span>
              <div style="font-family: var(--font-mono); font-size: 0.78rem; color: #FFF; margin-top: 4px; word-break: break-all;">
                ${comp.artifactChecksum || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
              </div>
            </div>
          </div>

          <div class="tab-content" id="tab-code" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--accent-lime);">SDK v2.0 // Python 3.10+</span>
              <button class="btn btn-outline btn-sm copy-snippet-btn">Copy Code</button>
            </div>
            <pre style="background: var(--bg-deep); border: 1px solid var(--border-medium); padding: 14px; border-radius: var(--radius-xs); font-family: var(--font-mono); font-size: 0.78rem; color: #E2E8F0; overflow-x: auto; line-height: 1.5;">${comp.codeSnippets ? comp.codeSnippets.python : "# Python snippet"}</pre>
          </div>

          <!-- Verified Buyer Reviews Tab (SRS Section 21) -->
          <div class="tab-content" id="tab-reviews" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div>
                <span style="font-size: 1.2rem; font-weight: 700; color: #FFF;">★ ${comp.rating || 4.9}</span>
                <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 6px;">based on ${comp.ratingCount || 12} verified purchaser reviews</span>
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-toggle-write-review">
                + Write a Verified Review
              </button>
            </div>

            <!-- Review Submission Form (collapsed by default) -->
            <div id="write-review-panel" style="display: none; background: var(--bg-surface-2); border: 1px solid var(--border-medium); border-radius: 6px; padding: 14px; margin-bottom: 16px;">
              <h5 style="color: #FFF; font-size: 0.9rem; margin-bottom: 10px;">Submit Verified Technical Review</h5>
              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Reviewer Name &amp; Title</label>
                  <input type="text" class="text-input" id="review-author" placeholder="e.g. Lead Architect, Fintech Corp" />
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
                <label class="form-label">Headline / Title</label>
                <input type="text" class="text-input" id="review-title" placeholder="e.g. Flawless latency and byte citations" />
              </div>
              <div class="form-group">
                <label class="form-label">Technical Review Comment</label>
                <textarea class="textarea-input" id="review-comment" rows="3" placeholder="Describe benchmark findings, deployment experience, and runtime accuracy..."></textarea>
              </div>
              <button class="btn btn-primary btn-sm" id="btn-submit-review">Publish Review</button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${
                comp.reviews && comp.reviews.length > 0
                  ? comp.reviews
                      .map(
                        (r) => `
                <div style="background: var(--bg-surface-2); border: 1px solid var(--border-medium); border-radius: 6px; padding: 14px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <div>
                      <strong style="color: #FFF; font-size: 0.9rem;">${r.title}</strong>
                      <div style="font-size: 0.75rem; color: var(--accent-lime); margin-top: 2px;">
                        ★ ${r.rating}.0 // ${r.buyerName} [VERIFIED PURCHASER]
                      </div>
                    </div>
                    <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${r.date} (${r.version})</span>
                  </div>
                  <p style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.5; margin-top: 6px;">
                    ${r.comment}
                  </p>
                  ${
                    r.sellerReply
                      ? `
                    <div style="margin-top: 10px; padding: 10px; background: var(--bg-deep); border-left: 2px solid var(--accent-cyan); border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
                      <strong style="color: var(--accent-cyan);">${comp.sellerName || "Seller"} Response:</strong> ${r.sellerReply}
                    </div>
                  `
                      : ""
                  }
                </div>
              `
                      )
                      .join("")
                  : `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 24px;">No reviews yet. Be the first verified buyer to leave feedback!</div>`
              }
            </div>
          </div>

          <div class="tab-content" id="tab-pricing" style="display: none;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
              ${(comp.pricingTiers || [])
                .map(
                  (t) => `
                <div style="background: var(--bg-surface-2); border: 1px solid ${t.featured ? "var(--accent-lime)" : "var(--border-medium)"}; border-radius: var(--radius-xs); padding: 16px; display: flex; flex-direction: column;">
                  <span style="font-family: var(--font-mono); font-size: 0.8rem; font-weight: 700; color: #FFF;">${t.name}</span>
                  <div style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 800; color: var(--accent-lime); margin: 6px 0 12px;">${t.price}</div>
                  <p style="font-size: 0.76rem; color: var(--text-muted); margin-bottom: 14px; flex: 1;">${t.desc}</p>
                  <button class="btn ${t.featured ? "btn-primary" : "btn-secondary"} btn-sm btn-checkout-tier" data-tier="${t.name}">
                    Select ${t.name}
                  </button>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary btn-configure-from-modal" data-id="${comp.id}">
            Configure Architecture →
          </button>
          <button class="btn btn-primary btn-launch-playground-modal" data-id="${comp.id}">
            Launch in Sandbox
          </button>
        </div>
      </div>
    `;

    modal.classList.add("active");

    modal.querySelector(".modal-close-btn").addEventListener("click", () => modal.classList.remove("active"));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("active");
    });

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

    modal.querySelector(".btn-configure-from-modal").addEventListener("click", () => {
      modal.classList.remove("active");
      this.app.navigateTo("configurator", { componentId: comp.id });
    });

    modal.querySelector(".btn-launch-playground-modal").addEventListener("click", () => {
      modal.classList.remove("active");
      this.app.navigateTo("playground", { componentId: comp.id });
    });

    modal.querySelectorAll(".btn-checkout-tier").forEach((tierBtn) => {
      tierBtn.addEventListener("click", () => {
        modal.classList.remove("active");
        this.app.openCheckoutModal({
          componentId: comp.id,
          componentName: comp.name,
          tier: tierBtn.dataset.tier,
          price: comp.priceFormatted
        });
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
        this.openDetailModal(comp.id); // Re-open to show new review
      });
    }
  }
}
