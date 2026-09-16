/**
 * AURA AI Platform
 * Marketplace & Bento Catalog View Controller
 * Implements Asymmetric Hero, Pipeline Monitor & Concrete Copy
 */

import { CATALOG_COMPONENTS } from "../data/catalog-data.js";
import { getIconSvg, copyToClipboard, showToast } from "../utils/helpers.js";

export class MarketplaceView {
  constructor(app) {
    this.app = app;
    this.components = CATALOG_COMPONENTS;
    this.selectedCategory = "all";
    this.selectedIndustry = "all";
    this.searchQuery = "";
  }

  render(container) {
    container.innerHTML = `
      <!-- Asymmetric Hero Section (Off-Center Split) -->
      <section class="hero-asymmetric">
        <!-- Left Column: High-Impact Technical Narrative -->
        <div class="hero-content-left">
          <span class="hero-spec-tag">// DETERMINISTIC AI FABRIC // SRS v1.0</span>
          <h1 class="hero-headline">
            Production AI Engines. <span class="accent-text">Zero Guesswork.</span>
          </h1>
          <p class="hero-technical-desc">
            Stop relying on generic chatbot wrappers. Deploy verified retrieval pipelines with exact document byte-offset citations, strict hallucination guardrails, and sovereign private VPC or air-gapped hosting.
          </p>

          <div class="hero-cta-cluster">
            <button class="btn btn-primary btn-lg" id="hero-btn-explore">
              Explore 10 Verified Engines →
            </button>
            <button class="btn btn-secondary btn-lg" id="hero-btn-launch-sandbox">
              Launch Live Sandbox
            </button>
          </div>

          <div class="hero-specs-row">
            <div class="hero-spec-item">
              <span class="hero-spec-val">10/10</span>
              <span class="hero-spec-lbl">Production Templates</span>
            </div>
            <div class="hero-spec-item">
              <span class="hero-spec-val">&lt; 900ms</span>
              <span class="hero-spec-lbl">Average P95 Latency</span>
            </div>
            <div class="hero-spec-item">
              <span class="hero-spec-val">100%</span>
              <span class="hero-spec-lbl">Tenant Isolation (RLS)</span>
            </div>
            <div class="hero-spec-item">
              <span class="hero-spec-val">SOC2/DPDP</span>
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

      <!-- Functional Filter & Search Bar -->
      <section class="filter-bar">
        <div class="filter-top-row">
          <div class="search-input-box">
            <span class="search-svg-icon">${getIconSvg("search", 15)}</span>
            <input type="text" id="catalog-search" class="search-field" placeholder="Search components by technical capability, model, or task..." />
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

        <div class="category-tags-row">
          <button class="cat-filter-btn active" data-cat="all">ALL COMPONENTS [10]</button>
          <button class="cat-filter-btn" data-cat="Chatbots">RAG &amp; SUPPORT AGENTS</button>
          <button class="cat-filter-btn" data-cat="Document AI">DOCUMENT AI &amp; EXTRACTION</button>
          <button class="cat-filter-btn" data-cat="Search &amp; Recs">NEURAL SEARCH &amp; RECS</button>
          <button class="cat-filter-btn" data-cat="Developer Tools">DEVOPS &amp; AGENTS</button>
          <button class="cat-filter-btn" data-cat="EdTech">EDTECH &amp; ASSESSMENT</button>
        </div>
      </section>

      <!-- Bento Asymmetric Catalog Grid -->
      <section id="bento-catalog-grid" class="bento-catalog-grid">
        <!-- Injected dynamically -->
      </section>

      <!-- Component Detail Modal -->
      <div id="component-detail-modal" class="modal-backdrop"></div>
    `;

    this.attachEvents(container);
    this.renderBentoCards();
  }

  attachEvents(container) {
    // Hero CTA buttons
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

    // Search field
    const searchField = container.querySelector("#catalog-search");
    searchField.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderBentoCards();
    });

    // Industry dropdown
    const industryDropdown = container.querySelector("#industry-filter");
    industryDropdown.addEventListener("change", (e) => {
      this.selectedIndustry = e.target.value;
      this.renderBentoCards();
    });

    // Category filter buttons
    const catBtns = container.querySelectorAll(".cat-filter-btn");
    catBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        catBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.selectedCategory = btn.dataset.cat;
        this.renderBentoCards();
      });
    });
  }

  renderBentoCards() {
    const grid = document.getElementById("bento-catalog-grid");
    if (!grid) return;

    const filtered = this.components.filter((c) => {
      const matchCat = this.selectedCategory === "all" || c.category === this.selectedCategory;
      const matchInd = this.selectedIndustry === "all" || c.tags.includes(this.selectedIndustry);
      const matchSearch =
        !this.searchQuery ||
        c.name.toLowerCase().includes(this.searchQuery) ||
        c.shortDesc.toLowerCase().includes(this.searchQuery) ||
        c.tags.some((t) => t.toLowerCase().includes(this.searchQuery));
      return matchCat && matchInd && matchSearch;
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
        // Flagship wide card for the first item in the list
        const isFeatured = index === 0 && this.selectedCategory === "all" && !this.searchQuery;

        if (isFeatured) {
          return `
            <div class="bento-card featured-wide">
              <div class="bento-card-meta">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="badge badge-lime">FLAGSHIP ARCHITECTURE</span>
                  <span class="badge badge-gray">${c.category}</span>
                </div>
                <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-lime);">${c.version}</span>
              </div>

              <h3 class="bento-card-title" style="font-size: 1.6rem;">${c.name}</h3>
              <p class="bento-card-desc">${c.longDesc}</p>

              <!-- Embedded Citation Proof Inspector -->
              <div class="bento-mini-inspector">
                <span>[INSPECTOR]</span>
                <span>Hybrid HNSW + BM25 • Page &amp; paragraph-level attribution with bounding boxes</span>
              </div>

              <div class="bento-tags-row">
                ${c.tags.map((t) => `<span class="tech-tag">${t}</span>`).join("")}
                <span class="tech-tag">VPC-PEERING</span>
                <span class="tech-tag">HIPAA-READY</span>
              </div>

              <div class="bento-card-footer">
                <div>
                  <span style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">BASE SPECIFICATION</span>
                  <div class="bento-price-val">${c.priceFormatted} <span style="font-size: 0.75rem; font-weight: 400; color: var(--text-muted);">/ ${c.inrPriceFormatted}</span></div>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary btn-sm btn-view-detail" data-id="${c.id}">
                    Architectural Specs
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
              <span class="badge badge-gray">${c.category}</span>
              <span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted);">${c.version}</span>
            </div>

            <h3 class="bento-card-title">${c.name}</h3>
            <p class="bento-card-desc">${c.shortDesc}</p>

            <div style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--accent-lime); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
              <span>→</span> <span>${c.coreOutput}</span>
            </div>

            <div class="bento-tags-row">
              ${c.tags.map((t) => `<span class="tech-tag">${t}</span>`).join("")}
            </div>

            <div class="bento-card-footer">
              <div>
                <span style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">TIER 1</span>
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
  }

  openDetailModal(componentId) {
    const comp = this.components.find((c) => c.id === componentId);
    if (!comp) return;

    const modal = document.getElementById("component-detail-modal");
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge badge-lime">${comp.category}</span>
              <span style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted);">${comp.version}</span>
            </div>
            <h2 class="modal-title" style="margin-top: 4px;">${comp.name}</h2>
          </div>
          <button class="btn-icon btn-ghost modal-close-btn">${getIconSvg("x", 20)}</button>
        </div>

        <div class="modal-body">
          <div class="tab-bar" id="modal-tabs">
            <button class="tab-btn active" data-tab="overview">Capabilities</button>
            <button class="tab-btn" data-tab="architecture">Data Pipeline</button>
            <button class="tab-btn" data-tab="pricing">Tiers &amp; SLAs</button>
            <button class="tab-btn" data-tab="code">Integration SDK</button>
          </div>

          <div class="tab-content" id="tab-overview">
            <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px;">
              ${comp.longDesc}
            </p>
            <div style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px;">
              Architectural Constraints &amp; Features:
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${comp.features
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
              ${comp.architecture
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

          <div class="tab-content" id="tab-pricing" style="display: none;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
              ${comp.pricingTiers
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

          <div class="tab-content" id="tab-code" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--accent-lime);">SDK v1.0 // Python 3.10+</span>
              <button class="btn btn-outline btn-sm copy-snippet-btn">Copy Code</button>
            </div>
            <pre style="background: var(--bg-deep); border: 1px solid var(--border-medium); padding: 14px; border-radius: var(--radius-xs); font-family: var(--font-mono); font-size: 0.78rem; color: #E2E8F0; overflow-x: auto; line-height: 1.5;">${comp.codeSnippets.python}</pre>
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
    if (copyBtn) {
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
  }
}
