/**
 * AURA AI Platform
 * Customization Configurator & Engineering Phase Manifest View Controller
 * Implements Phase Pipeline & Live BOM Specification Engine
 */

import { CATALOG_COMPONENTS } from "../data/catalog-data.js";
import { calculateCustomizationEstimate } from "../utils/estimation-engine.js";
import { showToast } from "../utils/helpers.js";

export class ConfiguratorView {
  constructor(app) {
    this.app = app;
    this.currentStep = 1;
    this.totalSteps = 6;

    this.config = {
      baseComponentId: "rag-chatbot",
      basePrice: 499,
      industry: "Healthcare",
      connectors: ["PDF & DOCX Files", "Postgres / SQL DB"],
      auth: "sso_saml",
      deployment: "vpc",
      whiteLabel: true,
      brandColor: "#D4FF00",
      brandName: "Acme Assistant",
      greeting: "Deterministic clinical protocol engine ready. Inquire on Phase 2 dosage titration.",
      features: {
        citations: true,
        guardrails: true,
        analytics: true,
        multilingual: false,
        humanHandover: true
      }
    };
  }

  render(container) {
    const estimate = calculateCustomizationEstimate(this.config);

    container.innerHTML = `
      <div class="configurator-container">
        <!-- Header -->
        <div class="wizard-header">
          <span class="badge badge-lime">// ENTERPRISE SPECIFICATION MANIFEST</span>
          <h2>Architecture Configurator &amp; BOM Engine</h2>
          <p>Define custom domain vectors, zero-trust SSO authentication, private VPC infrastructure, and production feature toggles.</p>
        </div>

        <!-- Engineering Phase Pipeline Bar (No bubble circles) -->
        <div class="phase-pipeline-track">
          <div class="phase-item ${this.currentStep === 1 ? "active" : ""} ${this.currentStep > 1 ? "completed" : ""}" data-step="1">
            <span class="phase-idx">01</span>
            <span>DOMAIN</span>
          </div>
          <div class="phase-item ${this.currentStep === 2 ? "active" : ""} ${this.currentStep > 2 ? "completed" : ""}" data-step="2">
            <span class="phase-idx">02</span>
            <span>INGESTION</span>
          </div>
          <div class="phase-item ${this.currentStep === 3 ? "active" : ""} ${this.currentStep > 3 ? "completed" : ""}" data-step="3">
            <span class="phase-idx">03</span>
            <span>SECURITY</span>
          </div>
          <div class="phase-item ${this.currentStep === 4 ? "active" : ""} ${this.currentStep > 4 ? "completed" : ""}" data-step="4">
            <span class="phase-idx">04</span>
            <span>HOSTING</span>
          </div>
          <div class="phase-item ${this.currentStep === 5 ? "active" : ""} ${this.currentStep > 5 ? "completed" : ""}" data-step="5">
            <span class="phase-idx">05</span>
            <span>BRANDING</span>
          </div>
          <div class="phase-item ${this.currentStep === 6 ? "active" : ""} ${this.currentStep > 6 ? "completed" : ""}" data-step="6">
            <span class="phase-idx">06</span>
            <span>MANIFEST</span>
          </div>
        </div>

        <!-- Wizard Two-Column Grid -->
        <div class="wizard-content-grid">
          <!-- Left: Active Phase Body -->
          <div class="card" id="wizard-step-body">
            <!-- Rendered dynamically -->
          </div>

          <!-- Right: Live Bill of Materials (BOM) Estimate -->
          <div class="estimate-card" id="estimate-card">
            <div class="estimate-header">
              <span class="estimate-title">// BILL OF MATERIALS (BOM)</span>
              <div class="estimate-total-range" id="est-usd-range">${estimate.formattedUsdRange}</div>
              <div class="estimate-currency-alt" id="est-inr-range">Approx. ${estimate.formattedInrRange}</div>
            </div>

            <div class="estimate-timeline-badge">
              <div>
                <span style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">ESTIMATED SPRINT TURNAROUND</span>
                <div style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-lime);" id="est-days">${estimate.deliveryTimeline}</div>
              </div>
            </div>

            <div style="font-family: var(--font-mono); font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">
              // SCOPE ADDITIVES ITEMIZED:
            </div>
            <div class="estimate-breakdown-list" id="estimate-breakdown-list">
              <div class="estimate-line-item">
                <span>Base Component License</span>
                <span style="color: #FFF;">$${estimate.basePrice}</span>
              </div>
              ${estimate.breakdown
                .map(
                  (b) => `
                <div class="estimate-line-item">
                  <span>${b.item}</span>
                  <span style="color: var(--accent-lime);">${b.cost}</span>
                </div>
              `
                )
                .join("")}
            </div>

            <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-muted); margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
              * Indicative BOM based on SRS Section 8.2 calculation weights. Final quotation confirmed by Admin review.
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderStepContent(container);
    this.attachEvents(container);
  }

  renderStepContent(container) {
    const stepBody = container.querySelector("#wizard-step-body");
    if (!stepBody) return;

    if (this.currentStep === 1) {
      stepBody.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
          <h3 style="font-family: var(--font-heading); font-size: 1.25rem;">Phase 01: Industry &amp; Regulatory Domain</h3>
          <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">STEP 1 OF 6</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">Pre-configures retrieval weights, taxonomies, and compliance filters for your sector.</p>
        
        <div class="options-grid">
          ${[
            {
              id: "Healthcare",
              title: "Healthcare & Life Sciences",
              desc: "HIPAA compliance, medical terminology, dosage titration heuristics."
            },
            {
              id: "Legal",
              title: "Legal & Compliance",
              desc: "Statutory citations, clause contradiction analysis, strict redline deltas."
            },
            {
              id: "Finance",
              title: "Finance & Audit",
              desc: "SOX/GLBA security, balance sheet tables, zero tolerance audit trails."
            },
            {
              id: "EdTech",
              title: "EdTech & Universities",
              desc: "Bloom's taxonomy grading, LMS QTI export, pedagogical tone."
            },
            {
              id: "E-Commerce",
              title: "Retail & E-Commerce",
              desc: "Catalog recs, inventory checks, multi-lingual customer chat."
            },
            {
              id: "Custom",
              title: "Sovereign Enterprise",
              desc: "General enterprise models tuned to bespoke operational protocols."
            }
          ]
            .map(
              (item) => `
            <div class="option-card ${this.config.industry === item.id ? "selected" : ""}" data-industry="${item.id}">
              <span class="option-check">${this.config.industry === item.id ? "[ACTIVE]" : "[SELECT]"}</span>
              <div class="option-title">${item.title}</div>
              <div class="option-desc">${item.desc}</div>
            </div>
          `
            )
            .join("")}
        </div>
      `;

      stepBody.querySelectorAll(".option-card").forEach((card) => {
        card.addEventListener("click", () => {
          this.config.industry = card.dataset.industry;
          this.renderStepContent(container);
          this.updateEstimateUI(container);
        });
      });
    } else if (this.currentStep === 2) {
      const allConnectors = [
        "PDF & DOCX Files",
        "Google Drive & Docs",
        "Notion Knowledge Base",
        "Postgres / SQL DB",
        "Web Crawling & Sitemaps",
        "Custom REST APIs"
      ];

      stepBody.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
          <h3 style="font-family: var(--font-heading); font-size: 1.25rem;">Phase 02: Ingestion &amp; Knowledge Connectors</h3>
          <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">STEP 2 OF 6</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">Select automated pipelines to index into your isolated tenant vector store. (+ $180 per connector)</p>
        
        <div class="options-grid">
          ${allConnectors
            .map((conn) => {
              const selected = this.config.connectors.includes(conn);
              return `
              <div class="option-card ${selected ? "selected" : ""}" data-connector="${conn}">
                <span class="option-check">${selected ? "[LINKED]" : "[+ADD]"}</span>
                <div class="option-title">${conn}</div>
                <div class="option-desc">Automated ingestion with incremental delta sync.</div>
                <div class="option-modifier-tag">+ $180 / PIPELINE</div>
              </div>
            `;
            })
            .join("")}
        </div>
      `;

      stepBody.querySelectorAll(".option-card").forEach((card) => {
        card.addEventListener("click", () => {
          const conn = card.dataset.connector;
          if (this.config.connectors.includes(conn)) {
            this.config.connectors = this.config.connectors.filter((c) => c !== conn);
          } else {
            this.config.connectors.push(conn);
          }
          this.renderStepContent(container);
          this.updateEstimateUI(container);
        });
      });
    } else if (this.currentStep === 3) {
      stepBody.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
          <h3 style="font-family: var(--font-heading); font-size: 1.25rem;">Phase 03: Security &amp; Tenant Authentication</h3>
          <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">STEP 3 OF 6</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">Configure identity protocols and tenant boundary controls.</p>
        
        <div class="options-grid">
          ${[
            {
              id: "api_key",
              title: "API Key Authentication",
              desc: "Hashed SHA-256 tokens with rate-limiting response headers.",
              cost: "INCLUDED"
            },
            {
              id: "sso_saml",
              title: "Enterprise SAML 2.0 / Okta",
              desc: "Zero-trust SSO federation with Azure AD, Okta, and Ping.",
              cost: "+ $450"
            },
            {
              id: "oauth",
              title: "OAuth 2.0 PKCE",
              desc: "Workforce login via Google Workspace or Microsoft 365.",
              cost: "+ $250"
            },
            {
              id: "rbac",
              title: "Row-Level RBAC Partitioning",
              desc: "Permissions mapped directly to vector search payload filters.",
              cost: "+ $300"
            }
          ]
            .map(
              (auth) => `
            <div class="option-card ${this.config.auth === auth.id ? "selected" : ""}" data-auth="${auth.id}">
              <span class="option-check">${this.config.auth === auth.id ? "[ACTIVE]" : "[SELECT]"}</span>
              <div class="option-title">${auth.title}</div>
              <div class="option-desc">${auth.desc}</div>
              <div class="option-modifier-tag">${auth.cost}</div>
            </div>
          `
            )
            .join("")}
        </div>
      `;

      stepBody.querySelectorAll(".option-card").forEach((card) => {
        card.addEventListener("click", () => {
          this.config.auth = card.dataset.auth;
          this.renderStepContent(container);
          this.updateEstimateUI(container);
        });
      });
    } else if (this.currentStep === 4) {
      stepBody.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
          <h3 style="font-family: var(--font-heading); font-size: 1.25rem;">Phase 04: Infrastructure &amp; Hosting Target</h3>
          <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">STEP 4 OF 6</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">Specify cloud topology or air-gapped sovereign deployment.</p>
        
        <div class="options-grid">
          ${[
            {
              id: "cloud",
              title: "Multi-Tenant Managed Cloud",
              desc: "Fully managed, SOC2 Type II, logical row-level isolation.",
              cost: "INCLUDED"
            },
            {
              id: "vpc",
              title: "Dedicated Private VPC",
              desc: "Provisioned to your AWS or GCP VPC with VPC peering & static IPs.",
              cost: "+ $600"
            },
            {
              id: "onprem",
              title: "Air-Gapped Sovereign On-Prem",
              desc: "Self-hosted containerized Helm chart package with zero telemetry egress.",
              cost: "+ $1,200"
            }
          ]
            .map(
              (dep) => `
            <div class="option-card ${this.config.deployment === dep.id ? "selected" : ""}" data-dep="${dep.id}">
              <span class="option-check">${this.config.deployment === dep.id ? "[ACTIVE]" : "[SELECT]"}</span>
              <div class="option-title">${dep.title}</div>
              <div class="option-desc">${dep.desc}</div>
              <div class="option-modifier-tag">${dep.cost}</div>
            </div>
          `
            )
            .join("")}
        </div>
      `;

      stepBody.querySelectorAll(".option-card").forEach((card) => {
        card.addEventListener("click", () => {
          this.config.deployment = card.dataset.dep;
          this.renderStepContent(container);
          this.updateEstimateUI(container);
        });
      });
    } else if (this.currentStep === 5) {
      stepBody.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
          <h3 style="font-family: var(--font-heading); font-size: 1.25rem;">Phase 05: Brand Persona &amp; Live Simulation</h3>
          <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">STEP 5 OF 6</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">Configure brand color, assistant handle, and greeting with real-time feedback.</p>
        
        <div class="brand-editor-row">
          <div>
            <div class="form-group">
              <label class="form-label">Assistant Identity Handle</label>
              <input type="text" id="brand-name-input" class="text-input" value="${this.config.brandName}" />
            </div>

            <div class="form-group">
              <label class="form-label">Initial Grounding Greeting</label>
              <textarea id="brand-greeting-input" class="textarea-input">${this.config.greeting}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Accent Theme</label>
              <div class="color-swatches">
                ${[
                  { hex: "#D4FF00", name: "Acid Lime" },
                  { hex: "#00E5FF", name: "Cyber Cyan" },
                  { hex: "#FF8C00", name: "Signal Amber" },
                  { hex: "#00E676", name: "Emerald" },
                  { hex: "#FFFFFF", name: "Pure White" }
                ]
                  .map(
                    (c) => `
                  <div class="color-swatch ${this.config.brandColor === c.hex ? "active" : ""}" data-color="${c.hex}" style="background-color: ${c.hex};" title="${c.name}"></div>
                `
                  )
                  .join("")}
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--border-subtle);">
              <div>
                <div style="font-family: var(--font-mono); font-size: 0.8rem; font-weight: 700; color: #FFF;">WHITE-LABEL DEPLOYMENT</div>
                <div style="font-size: 0.72rem; color: var(--text-muted);">Remove Cortex Hub attribution from customer-facing interfaces</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="toggle-whitelabel" ${this.config.whiteLabel ? "checked" : ""} />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- Live Tactical Simulation -->
          <div>
            <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">
              // TACTICAL WIDGET SIMULATOR
            </div>
            <div class="widget-preview-box" id="widget-preview-box">
              <div class="widget-preview-header">
                <div style="width: 26px; height: 26px; border-radius: var(--radius-xs); background: ${this.config.brandColor}; display: flex; align-items: center; justify-content: center; color: #000; font-family: var(--font-mono); font-size: 0.74rem; font-weight: 800;">
                  AI
                </div>
                <div>
                  <span style="font-family: var(--font-mono); font-weight: 700; font-size: 0.82rem; color: #FFF;" id="sim-bot-name">${this.config.brandName}</span>
                  <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--status-live);">● ONLINE // GROUNDED</div>
                </div>
              </div>

              <div class="widget-preview-body">
                <div class="widget-message-sim" id="sim-bot-greeting" style="background: var(--bg-surface-2); border-left: 2px solid ${this.config.brandColor};">
                  ${this.config.greeting}
                </div>
              </div>

              <div style="display: flex; gap: 6px;">
                <input type="text" class="text-input" placeholder="Query simulation..." disabled style="font-size: 0.75rem; padding: 5px 10px;" />
                <button class="btn btn-sm" style="background: ${this.config.brandColor}; color: #000; font-weight: 700;">Send</button>
              </div>
            </div>
          </div>
        </div>
      `;

      const nameInput = stepBody.querySelector("#brand-name-input");
      const greetingInput = stepBody.querySelector("#brand-greeting-input");
      const simName = stepBody.querySelector("#sim-bot-name");
      const simGreeting = stepBody.querySelector("#sim-bot-greeting");

      nameInput.addEventListener("input", (e) => {
        this.config.brandName = e.target.value;
        simName.textContent = e.target.value;
      });

      greetingInput.addEventListener("input", (e) => {
        this.config.greeting = e.target.value;
        simGreeting.textContent = e.target.value;
      });

      stepBody.querySelectorAll(".color-swatch").forEach((swatch) => {
        swatch.addEventListener("click", () => {
          this.config.brandColor = swatch.dataset.color;
          this.renderStepContent(container);
        });
      });

      stepBody.querySelector("#toggle-whitelabel").addEventListener("change", (e) => {
        this.config.whiteLabel = e.target.checked;
        this.updateEstimateUI(container);
      });
    } else if (this.currentStep === 6) {
      stepBody.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
          <h3 style="font-family: var(--font-heading); font-size: 1.25rem;">Phase 06: Production Features &amp; Submission</h3>
          <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">STEP 6 OF 6</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">Toggle advanced pipeline modules and dispatch for architecture review.</p>
        
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
          ${[
            {
              id: "citations",
              title: "Strict Page Citations Engine",
              desc: "Bounding box paragraph attribution linked to source documents.",
              cost: "+ $150"
            },
            {
              id: "guardrails",
              title: "Hallucination Guardrails & PII Masking",
              desc: "Pre-inference prompt validation and automated PII redaction layer.",
              cost: "+ $250"
            },
            {
              id: "analytics",
              title: "Audit Telemetry & Token Cost Logs",
              desc: "Per-request latency, token consumption, and tenant quota tracking.",
              cost: "+ $180"
            },
            {
              id: "multilingual",
              title: "40+ Language Automatic Localization",
              desc: "Cross-lingual semantic intent preservation and auto-translation.",
              cost: "+ $200"
            },
            {
              id: "humanHandover",
              title: "Human Escalation Webhook Bridge",
              desc: "Automated ticket creation in Zendesk, Freshdesk, and Slack.",
              cost: "+ $150"
            }
          ]
            .map(
              (feat) => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-surface-2); border: 1px solid var(--border-medium); border-radius: var(--radius-xs);">
              <div>
                <div style="font-family: var(--font-mono); font-weight: 700; font-size: 0.82rem; color: #FFF;">
                  ${feat.title} <span style="color: var(--accent-lime); margin-left: 6px;">${feat.cost}</span>
                </div>
                <div style="font-size: 0.74rem; color: var(--text-muted);">${feat.desc}</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" class="feature-toggle-check" data-feat="${feat.id}" ${this.config.features[feat.id] ? "checked" : ""} />
                <span class="toggle-slider"></span>
              </label>
            </div>
          `
            )
            .join("")}
        </div>

        <div style="background: var(--bg-surface-2); border: 1px solid var(--border-medium); border-left: 3px solid var(--accent-lime); border-radius: var(--radius-xs); padding: 14px;">
          <span style="font-family: var(--font-mono); font-size: 0.72rem; font-weight: 700; color: var(--accent-lime); text-transform: uppercase;">
            // CONFIGURED ARCHITECTURE BOM MANIFEST:
          </span>
          <p style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--text-secondary); margin-top: 4px; line-height: 1.5;">
            DOMAIN: ${this.config.industry} // CONNECTORS: ${this.config.connectors.join(", ") || "None"} // SECURITY: ${this.config.auth.toUpperCase()} // TARGET: ${this.config.deployment.toUpperCase()}
          </p>
        </div>
      `;

      stepBody.querySelectorAll(".feature-toggle-check").forEach((cb) => {
        cb.addEventListener("change", () => {
          this.config.features[cb.dataset.feat] = cb.checked;
          this.updateEstimateUI(container);
        });
      });
    }

    const actionFooter = document.createElement("div");
    actionFooter.className = "wizard-nav-actions";
    actionFooter.innerHTML = `
      <button class="btn btn-secondary btn-sm" id="btn-wizard-prev" ${this.currentStep === 1 ? "disabled" : ""}>
        ← Back
      </button>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-outline btn-sm" id="btn-save-draft">
          Save Draft
        </button>
        ${
          this.currentStep < this.totalSteps
            ? `<button class="btn btn-primary btn-sm" id="btn-wizard-next">Next Phase →</button>`
            : `<button class="btn btn-primary btn-sm" id="btn-wizard-submit">Submit Formal Architecture Request →</button>`
        }
      </div>
    `;

    stepBody.appendChild(actionFooter);

    actionFooter.querySelector("#btn-wizard-prev").addEventListener("click", () => {
      if (this.currentStep > 1) {
        this.currentStep--;
        this.renderStepContent(container);
        this.updatePhaseTrack(container);
      }
    });

    const nextBtn = actionFooter.querySelector("#btn-wizard-next");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (this.currentStep < this.totalSteps) {
          this.currentStep++;
          this.renderStepContent(container);
          this.updatePhaseTrack(container);
        }
      });
    }

    const submitBtn = actionFooter.querySelector("#btn-wizard-submit");
    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        this.submitCustomizationRequest();
      });
    }

    actionFooter.querySelector("#btn-save-draft").addEventListener("click", () => {
      localStorage.setItem("aura_config_draft", JSON.stringify(this.config));
      showToast("Specification manifest draft saved locally.", "success");
    });
  }

  attachEvents(container) {
    container.querySelectorAll(".phase-item").forEach((item) => {
      item.addEventListener("click", () => {
        const step = parseInt(item.dataset.step);
        if (step <= this.totalSteps) {
          this.currentStep = step;
          this.renderStepContent(container);
          this.updatePhaseTrack(container);
        }
      });
    });
  }

  updatePhaseTrack(container) {
    container.querySelectorAll(".phase-item").forEach((item) => {
      const step = parseInt(item.dataset.step);
      item.classList.toggle("active", step === this.currentStep);
      item.classList.toggle("completed", step < this.currentStep);
    });
  }

  updateEstimateUI(container) {
    const est = calculateCustomizationEstimate(this.config);

    container.querySelector("#est-usd-range").textContent = est.formattedUsdRange;
    container.querySelector("#est-inr-range").textContent = `Approx. ${est.formattedInrRange}`;
    container.querySelector("#est-days").textContent = est.deliveryTimeline;

    const list = container.querySelector("#estimate-breakdown-list");
    list.innerHTML = `
      <div class="estimate-line-item">
        <span>Base Component License</span>
        <span style="color: #FFF;">$${est.basePrice}</span>
      </div>
      ${est.breakdown
        .map(
          (b) => `
        <div class="estimate-line-item">
          <span>${b.item}</span>
          <span style="color: var(--accent-lime);">${b.cost}</span>
        </div>
      `
        )
        .join("")}
    `;
  }

  async submitCustomizationRequest() {
    const est = calculateCustomizationEstimate(this.config);
    const localId = `CR-SAMPLE-${Math.floor(1070 + Math.random() * 30)}`;
    const component = CATALOG_COMPONENTS.find((c) => c.id === this.config.baseComponentId);

    let saved;
    try {
      saved = await this.app.addCustomizationRequest({
        id: localId,
        tenantName: "Sample workspace",
        componentId: this.config.baseComponentId,
        componentName: component ? component.name : this.config.baseComponentId,
        scope: `${this.config.industry} + ${this.config.connectors.join(", ") || "Standard"} + ${this.config.auth.toUpperCase()}`,
        industry: this.config.industry,
        deploymentTarget: this.config.deployment.toUpperCase(),
        estimatedPrice: `$${est.minTotalUsd.toLocaleString()}`,
        priceInr: `₹${(est.minTotalUsd * 83.5).toLocaleString()}`,
        targetDelivery: est.deliveryTimeline,
        status: "Submitted",
        statusStep: 1,
        submittedDate: new Date().toISOString().split("T")[0],
        timelineLog: [{ date: "Just now", event: "Created via configurator (sample mode, not saved)." }]
      });
    } catch (err) {
      showToast(`Could not submit: ${err.message}`, "error");
      return;
    }
    const newReqId = saved.id;
    const isSample = !this.app.api.hasWorkspace("BUYER");

    let modal = document.getElementById("submission-confirm-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "submission-confirm-modal";
      modal.className = "modal-backdrop";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog" style="max-width: 500px; text-align: center;">
        <div class="modal-body" style="padding: 32px 20px;">
          <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-lime); margin-bottom: 8px;">
            // MANIFEST REGISTERED
          </div>
          <h3 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 8px;">Architecture Dispatched</h3>
          <p style="color: var(--text-secondary); font-size: 0.86rem; line-height: 1.5; margin-bottom: 18px;">
            Request <strong>${newReqId}</strong> logged with indicative BOM range <strong>${est.formattedUsdRange}</strong>.
            ${isSample ? "Sample mode: sign in with a buyer account to submit real requests." : "The platform team will review the scope and send a quote."}
          </p>
          <div style="display: flex; justify-content: center; gap: 10px;">
            <button class="btn btn-secondary btn-sm" id="btn-modal-close-conf">Continue Catalog</button>
            <button class="btn btn-primary btn-sm" id="btn-modal-track-req">Inspect in Portal →</button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add("active");

    modal.querySelector("#btn-modal-close-conf").addEventListener("click", () => {
      modal.classList.remove("active");
      this.app.navigateTo("marketplace");
    });

    modal.querySelector("#btn-modal-track-req").addEventListener("click", () => {
      modal.classList.remove("active");
      this.app.navigateTo("customer");
    });
  }
}
