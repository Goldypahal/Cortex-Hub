/**
 * AURA AI Platform
 * Customer Tenant Portal View Controller
 * Tactical Telemetry, Masked Key Management & Pipeline Tracking
 */

import { MOCK_TENANT, MOCK_LICENSES, MOCK_API_KEYS, MOCK_DAILY_USAGE, MOCK_SUPPORT_TICKETS } from "../data/mock-dashboard.js";
import { getIconSvg, copyToClipboard, showToast } from "../utils/helpers.js";

export class CustomerView {
  constructor(app) {
    this.app = app;
    this.tenant = MOCK_TENANT;
    this.licenses = MOCK_LICENSES;
    this.apiKeys = [...MOCK_API_KEYS];
    this.activeTab = "overview";
  }

  render(container) {
    const requests = this.app.getCustomizationRequests();

    container.innerHTML = `
      <div class="dashboard-container">
        <!-- Banner -->
        <div class="dashboard-banner">
          <div class="tenant-identity">
            <div class="tenant-avatar">AH</div>
            <div class="tenant-details">
              <h2>${this.tenant.name}</h2>
              <div class="tenant-meta">
                <span class="badge badge-lime">${this.tenant.tier}</span>
                <span style="color: var(--text-muted);">TENANT: <code>${this.tenant.id}</code></span>
                <span style="color: var(--text-muted);">ROLE: <strong>${this.tenant.role}</strong></span>
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" id="btn-raise-ticket-top">
              Support Desk
            </button>
            <button class="btn btn-primary btn-sm" id="btn-create-key-top">
              + Generate API Key
            </button>
          </div>
        </div>

        <!-- Metrics -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-title">Active Licenses</span>
            <span class="kpi-value">${this.licenses.length}</span>
            <span class="kpi-trend" style="color: var(--status-live);">● Both clusters healthy</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Monthly Quota Consumed</span>
            <span class="kpi-value">64.2%</span>
            <span class="kpi-trend">6.42M / 10M tokens used</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">MTD Inference Spend</span>
            <span class="kpi-value">${this.tenant.spendFormatted}</span>
            <span class="kpi-trend" style="color: var(--accent-lime);">+12% vs prior cycle</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Pending Customizations</span>
            <span class="kpi-value">${requests.filter((r) => r.status !== "Delivered").length}</span>
            <span class="kpi-trend">1 in engineering flight</span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tab-bar" id="cust-dash-tabs">
          <button class="tab-btn ${this.activeTab === "overview" ? "active" : ""}" data-tab="overview">LICENSES &amp; PURCHASES</button>
          <button class="tab-btn ${this.activeTab === "keys" ? "active" : ""}" data-tab="keys">API KEY MANAGEMENT</button>
          <button class="tab-btn ${this.activeTab === "usage" ? "active" : ""}" data-tab="usage">INFERENCE TELEMETRY</button>
          <button class="tab-btn ${this.activeTab === "requests" ? "active" : ""}" data-tab="requests">CUSTOMIZATION SPRINT</button>
          <button class="tab-btn ${this.activeTab === "tickets" ? "active" : ""}" data-tab="tickets">SUPPORT TICKETS</button>
        </div>

        <div id="cust-tab-content"></div>
      </div>
    `;

    this.renderTabContent(container);
    this.attachEvents(container);
  }

  renderTabContent(container) {
    const tabBody = container.querySelector("#cust-tab-content");
    if (!tabBody) return;

    if (this.activeTab === "overview") {
      tabBody.innerHTML = `
        <div class="dashboard-subpanel">
          <div class="subpanel-header">
            <h3 class="subpanel-title">Active Production Licenses</h3>
            <button class="btn btn-outline btn-sm" id="btn-browse-more-store">
              Explore Catalog →
            </button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 14px;">
            ${this.licenses
              .map(
                (lic) => `
              <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span class="badge badge-emerald">${lic.status}</span>
                    <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${lic.id}</span>
                  </div>
                  <h4 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; margin-bottom: 2px;">${lic.componentName}</h4>
                  <div style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--accent-lime); margin-bottom: 12px;">${lic.tier} // ${lic.version}</div>

                  <div style="display: flex; flex-direction: column; gap: 4px; font-family: var(--font-mono); font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 16px;">
                    <div>TOPOLOGY: ${lic.env}</div>
                    <div>RATE LIMIT: ${lic.rateLimit}</div>
                    <div>RENEWAL: ${lic.renewalDate} (${lic.monthlyPrice})</div>
                  </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid var(--border-subtle);">
                  <button class="btn btn-secondary btn-sm btn-download-invoice" data-id="${lic.id}">
                    Invoice PDF
                  </button>
                  <button class="btn btn-primary btn-sm btn-launch-lic-sandbox" data-id="${lic.componentId}">
                    Test Sandbox →
                  </button>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;

      tabBody.querySelector("#btn-browse-more-store").addEventListener("click", () => {
        this.app.navigateTo("marketplace");
      });

      tabBody.querySelectorAll(".btn-download-invoice").forEach((btn) => {
        btn.addEventListener("click", () => {
          showToast(`Invoice for ${btn.dataset.id} downloaded!`, "success");
        });
      });

      tabBody.querySelectorAll(".btn-launch-lic-sandbox").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.app.navigateTo("playground", { componentId: btn.dataset.id });
        });
      });
    } else if (this.activeTab === "keys") {
      tabBody.innerHTML = `
        <div class="dashboard-subpanel">
          <div class="subpanel-header">
            <div>
              <h3 class="subpanel-title">Production &amp; Staging API Keys</h3>
              <p style="font-size: 0.8rem; color: var(--text-secondary); font-family: var(--font-mono); margin-top: 2px;">
                // Keys hashed with SHA-256. Click eye to temporarily unmask raw secret (NFR-8).
              </p>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-modal-generate-key">
              + Generate Key
            </button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Key Name</th>
                  <th>Environment</th>
                  <th>Masked Token Secret</th>
                  <th>Last Ingress</th>
                  <th>30d Calls</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.apiKeys
                  .map(
                    (k) => `
                  <tr>
                    <td style="font-weight: 600; font-family: var(--font-mono);">${k.name}</td>
                    <td>
                      <span class="badge ${k.environment === "Production" ? "badge-lime" : "badge-gray"}">
                        ${k.environment}
                      </span>
                    </td>
                    <td>
                      <code class="api-key-code key-secret-display" data-raw="${k.rawKey}" data-masked="${k.masked}">
                        ${k.masked}
                      </code>
                    </td>
                    <td style="color: var(--text-muted); font-size: 0.76rem; font-family: var(--font-mono);">${k.lastUsed}</td>
                    <td style="font-family: var(--font-mono);">${k.calls30d}</td>
                    <td style="text-align: right;">
                      <div style="display: inline-flex; gap: 4px;">
                        <button class="btn btn-outline btn-sm btn-reveal-key" data-id="${k.id}">Reveal</button>
                        <button class="btn btn-outline btn-sm btn-copy-key" data-id="${k.id}">Copy</button>
                        <button class="btn btn-secondary btn-sm btn-rotate-key" data-id="${k.id}" style="color: var(--signal-amber);">Rotate</button>
                        <button class="btn btn-secondary btn-sm btn-revoke-key" data-id="${k.id}" style="color: var(--status-error);">Revoke</button>
                      </div>
                    </td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;

      tabBody.querySelector("#btn-modal-generate-key").addEventListener("click", () => this.showNewKeyModal());

      tabBody.querySelectorAll(".btn-reveal-key").forEach((btn) => {
        btn.addEventListener("click", () => {
          const row = btn.closest("tr");
          const codeEl = row.querySelector(".key-secret-display");
          const isRevealed = codeEl.textContent.trim() === codeEl.dataset.raw;
          if (isRevealed) {
            codeEl.textContent = codeEl.dataset.masked;
            btn.textContent = "Reveal";
          } else {
            codeEl.textContent = codeEl.dataset.raw;
            btn.textContent = "Mask";
            showToast("Raw key exposed temporarily.", "info");
          }
        });
      });

      tabBody.querySelectorAll(".btn-copy-key").forEach((btn) => {
        btn.addEventListener("click", () => {
          const row = btn.closest("tr");
          const codeEl = row.querySelector(".key-secret-display");
          copyToClipboard(codeEl.dataset.raw, "API key copied to clipboard!");
        });
      });

      tabBody.querySelectorAll(".btn-rotate-key").forEach((btn) => {
        btn.addEventListener("click", () => {
          const keyId = btn.dataset.id;
          const targetKey = this.apiKeys.find((k) => k.id === keyId);
          if (confirm(`Rotate "${targetKey.name}"? Previous key remains accepted for 5 minutes during rollover.`)) {
            const newSuffix = Math.random().toString(36).substring(2, 8);
            targetKey.rawKey = `${targetKey.prefix}${newSuffix}rot99`;
            targetKey.masked = `${targetKey.prefix}•••••••••••••${newSuffix}`;
            showToast(`Key rotated! 5-min rollover active.`, "success");
            this.renderTabContent(container);
          }
        });
      });

      tabBody.querySelectorAll(".btn-revoke-key").forEach((btn) => {
        btn.addEventListener("click", () => {
          const keyId = btn.dataset.id;
          if (confirm(`Revoke key ${keyId}? This will terminate all traffic using this credential.`)) {
            this.apiKeys = this.apiKeys.filter((k) => k.id !== keyId);
            showToast(`Key ${keyId} revoked permanently.`, "warning");
            this.renderTabContent(container);
          }
        });
      });
    } else if (this.activeTab === "usage") {
      tabBody.innerHTML = `
        <div class="dashboard-subpanel">
          <div class="subpanel-header">
            <h3 class="subpanel-title">Inference Volume &amp; Quota Telemetry (FR-5.4)</h3>
            <span style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted);">BILLING CYCLE: SEP 01 - SEP 30, 2026</span>
          </div>

          <div class="usage-progress-container">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
              <span><strong>6,420,000</strong> Tokens Consumed</span>
              <span><strong>10,000,000</strong> Quota Ceiling (64.2%)</span>
            </div>
            <div class="progress-track">
              <div class="progress-bar-fill" style="width: 64.2%;"></div>
            </div>
          </div>

          <h4 style="font-family: var(--font-heading); font-size: 0.95rem; margin-top: 28px; margin-bottom: 6px;">Daily Token Activity (7-Day Rolling Trend)</h4>
          <div class="chart-container">
            ${MOCK_DAILY_USAGE.map(
              (u) => `
              <div class="chart-bar-group" title="${u.day}: ${u.tokens.toLocaleString()} tokens">
                <div class="chart-bar" style="height: ${u.heightPct}%;"></div>
                <span class="chart-label">${u.day}</span>
              </div>
            `
            ).join("")}
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 10px; font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted);">
            <span>AVG DAILY: 850K tokens</span>
            <span>RUN-RATE PROJECTION: 8.8M tokens (Within quota)</span>
          </div>
        </div>
      `;
    } else if (this.activeTab === "requests") {
      const allRequests = this.app.getCustomizationRequests();

      tabBody.innerHTML = `
        <div class="dashboard-subpanel">
          <div class="subpanel-header">
            <div>
              <h3 class="subpanel-title">Customization Pipeline &amp; Sprints (FR-5.7)</h3>
              <p style="font-size: 0.8rem; color: var(--text-secondary); font-family: var(--font-mono); margin-top: 2px;">
                // Track architectural reviews, approved BOM quotes, and VPC delivery milestones.
              </p>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-request-new-customization">
              + New Architecture
            </button>
          </div>

          ${allRequests
            .map(
              (req) => `
            <div class="request-pipeline-card">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="badge ${req.status === "Delivered" ? "badge-emerald" : req.status === "In Progress" ? "badge-lime" : "badge-amber"}">
                      ${req.status}
                    </span>
                    <strong style="font-family: var(--font-heading); font-size: 1.05rem;">${req.componentName}</strong>
                    <span style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted);">${req.id}</span>
                  </div>
                  <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px;">
                    SCOPE: ${req.scope} (${req.deploymentTarget})
                  </div>
                </div>

                <div style="text-align: right;">
                  <div style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; color: var(--accent-lime);">${req.estimatedPrice}</div>
                  <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${req.targetDelivery}</div>
                </div>
              </div>

              <!-- Pipeline Stepper -->
              <div class="pipeline-stepper">
                <div class="pipeline-step ${req.statusStep >= 1 ? (req.statusStep > 1 ? "done" : "active") : ""}">
                  <div class="pipeline-dot">${req.statusStep > 1 ? "✓" : "1"}</div>
                  <span class="pipeline-label">Submitted</span>
                </div>
                <div class="pipeline-step ${req.statusStep >= 2 ? (req.statusStep > 2 ? "done" : "active") : ""}">
                  <div class="pipeline-dot">${req.statusStep > 2 ? "✓" : "2"}</div>
                  <span class="pipeline-label">Scoping</span>
                </div>
                <div class="pipeline-step ${req.statusStep >= 3 ? (req.statusStep > 3 ? "done" : "active") : ""}">
                  <div class="pipeline-dot">${req.statusStep > 3 ? "✓" : "3"}</div>
                  <span class="pipeline-label">Quoted</span>
                </div>
                <div class="pipeline-step ${req.statusStep >= 4 ? (req.statusStep > 4 ? "done" : "active") : ""}">
                  <div class="pipeline-dot">${req.statusStep > 4 ? "✓" : "4"}</div>
                  <span class="pipeline-label">Engineering</span>
                </div>
                <div class="pipeline-step ${req.statusStep >= 5 ? "done" : ""}">
                  <div class="pipeline-dot">${req.statusStep >= 5 ? "✓" : "5"}</div>
                  <span class="pipeline-label">Delivered</span>
                </div>
              </div>

              <!-- Audit Logs -->
              <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border-subtle);">
                <span style="font-family: var(--font-mono); font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">
                  // AUDIT LOG HISTORY (FR-3.8):
                </span>
                <ul style="list-style: none; margin-top: 4px; font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 3px;">
                  ${req.timelineLog
                    .map(
                      (log) => `
                    <li><span style="color: var(--accent-lime);">${log.date}:</span> ${log.event}</li>
                  `
                    )
                    .join("")}
                </ul>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;

      tabBody.querySelector("#btn-request-new-customization").addEventListener("click", () => {
        this.app.navigateTo("configurator");
      });
    } else if (this.activeTab === "tickets") {
      tabBody.innerHTML = `
        <div class="dashboard-subpanel">
          <div class="subpanel-header">
            <h3 class="subpanel-title">Engineering Tickets (FR-5.6)</h3>
            <button class="btn btn-primary btn-sm" id="btn-create-ticket-modal">
              + Raise Ticket
            </button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${MOCK_SUPPORT_TICKETS.map(
              (tck) => `
              <div class="card" style="padding: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="badge ${tck.status === "Open" ? "badge-amber" : "badge-emerald"}">${tck.status}</span>
                    <span class="badge badge-gray">${tck.priority} Priority</span>
                    <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${tck.id}</span>
                  </div>
                  <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${tck.created}</span>
                </div>
                <h4 style="font-family: var(--font-heading); font-size: 0.95rem; font-weight: 700; margin-bottom: 6px;">${tck.subject}</h4>
                <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 10px;">
                  "${tck.messages[tck.messages.length - 1].text}"
                </p>
                <div style="display: flex; justify-content: flex-end;">
                  <button class="btn btn-outline btn-sm btn-view-ticket-thread" data-id="${tck.id}">
                    Discussion (${tck.messages.length}) →
                  </button>
                </div>
              </div>
            `
            ).join("")}
          </div>
        </div>
      `;

      tabBody.querySelector("#btn-create-ticket-modal").addEventListener("click", () => this.showNewTicketModal());

      tabBody.querySelectorAll(".btn-view-ticket-thread").forEach((btn) => {
        btn.addEventListener("click", () => {
          const tck = MOCK_SUPPORT_TICKETS.find((t) => t.id === btn.dataset.id);
          if (tck) this.showTicketThreadModal(tck);
        });
      });
    }
  }

  attachEvents(container) {
    container.querySelector("#btn-create-key-top").addEventListener("click", () => {
      this.activeTab = "keys";
      this.updateActiveTabUI(container);
      this.showNewKeyModal();
    });

    container.querySelector("#btn-raise-ticket-top").addEventListener("click", () => {
      this.activeTab = "tickets";
      this.updateActiveTabUI(container);
    });

    container.querySelectorAll(".tab-btn").forEach((tab) => {
      tab.addEventListener("click", () => {
        this.activeTab = tab.dataset.tab;
        this.updateActiveTabUI(container);
      });
    });
  }

  updateActiveTabUI(container) {
    container.querySelectorAll(".tab-btn").forEach((t) => {
      t.classList.toggle("active", t.dataset.tab === this.activeTab);
    });
    this.renderTabContent(container);
  }

  showNewKeyModal() {
    let modal = document.getElementById("new-key-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "new-key-modal";
      modal.className = "modal-backdrop";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">Issue Ingress API Key (FR-5.3)</h3>
          <button class="btn-icon btn-ghost modal-close-btn">${getIconSvg("x", 20)}</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Key Identifier Name</label>
            <input type="text" id="new-key-name" class="text-input" placeholder="e.g. Production Envoy Ingress" />
          </div>
          <div class="form-group">
            <label class="form-label">Target Environment</label>
            <select id="new-key-env" class="select-input">
              <option value="Production">Production (VPC Isolated)</option>
              <option value="Staging">Staging</option>
              <option value="Development">Development</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Burst Ceiling</label>
            <select class="select-input">
              <option value="100">100 req/sec</option>
              <option value="50">50 req/sec</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-close-btn">Cancel</button>
          <button class="btn btn-primary" id="btn-confirm-create-key">Issue Secret Token</button>
        </div>
      </div>
    `;

    modal.classList.add("active");
    modal.querySelectorAll(".modal-close-btn").forEach((btn) => {
      btn.addEventListener("click", () => modal.classList.remove("active"));
    });

    modal.querySelector("#btn-confirm-create-key").addEventListener("click", () => {
      const name = modal.querySelector("#new-key-name").value.trim() || "Ingress Token";
      const env = modal.querySelector("#new-key-env").value;
      const rawHex = Math.random().toString(36).substring(2, 10);

      this.apiKeys.unshift({
        id: `key-${Date.now().toString().slice(-4)}`,
        name,
        environment: env,
        prefix: `sk-${env.toLowerCase()}-acme-`,
        masked: `sk-${env.toLowerCase()}-acme-•••••••••••••${rawHex.slice(0, 4)}`,
        rawKey: `sk-${env.toLowerCase()}-acme-${rawHex}902847a`,
        created: new Date().toISOString().split("T")[0],
        lastUsed: "Never",
        status: "Active",
        calls30d: "0"
      });

      modal.classList.remove("active");
      showToast(`Key "${name}" provisioned.`, "success");
      const container = document.querySelector(".dashboard-container");
      if (container) this.renderTabContent(container);
    });
  }

  showNewTicketModal() {
    let modal = document.getElementById("new-ticket-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "new-ticket-modal";
      modal.className = "modal-backdrop";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">Open Support Ticket (FR-5.6)</h3>
          <button class="btn-icon btn-ghost modal-close-btn">${getIconSvg("x", 20)}</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Subject</label>
            <input type="text" id="tck-subject" class="text-input" placeholder="e.g. VPC peering CIDR conflict in us-east-1" />
          </div>
          <div class="form-group">
            <label class="form-label">Urgency SLA</label>
            <select id="tck-priority" class="select-input">
              <option value="High">High (Within 2 hours)</option>
              <option value="Medium">Medium (Within 8 hours)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Description &amp; Request IDs</label>
            <textarea id="tck-desc" class="textarea-input" placeholder="Provide log snippets or request tracing IDs..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-close-btn">Cancel</button>
          <button class="btn btn-primary" id="btn-submit-ticket">Dispatch Ticket</button>
        </div>
      </div>
    `;

    modal.classList.add("active");
    modal.querySelectorAll(".modal-close-btn").forEach((btn) => {
      btn.addEventListener("click", () => modal.classList.remove("active"));
    });

    modal.querySelector("#btn-submit-ticket").addEventListener("click", () => {
      const subject = modal.querySelector("#tck-subject").value.trim() || "Technical Question";
      const priority = modal.querySelector("#tck-priority").value;
      const desc = modal.querySelector("#tck-desc").value.trim();

      MOCK_SUPPORT_TICKETS.unshift({
        id: `TCK-${Math.floor(310 + Math.random() * 50)}`,
        subject,
        priority,
        category: "Infrastructure",
        status: "Open",
        created: "Just now",
        messages: [{ sender: "Customer (You)", time: "Just now", text: desc || subject }]
      });

      modal.classList.remove("active");
      showToast("Support ticket dispatched to on-call engineer.", "success");
      const container = document.querySelector(".dashboard-container");
      if (container) this.renderTabContent(container);
    });
  }

  showTicketThreadModal(ticket) {
    let modal = document.getElementById("ticket-thread-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "ticket-thread-modal";
      modal.className = "modal-backdrop";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge ${ticket.status === "Open" ? "badge-amber" : "badge-emerald"}">${ticket.status}</span>
              <span style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted);">${ticket.id}</span>
            </div>
            <h3 class="modal-title" style="margin-top: 4px;">${ticket.subject}</h3>
          </div>
          <button class="btn-icon btn-ghost modal-close-btn">${getIconSvg("x", 20)}</button>
        </div>
        <div class="modal-body" style="display: flex; flex-direction: column; gap: 10px;">
          ${ticket.messages
            .map(
              (m) => `
            <div style="padding: 10px 14px; background: var(--bg-surface-2); border: 1px solid var(--border-medium); border-radius: var(--radius-xs);">
              <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-lime); margin-bottom: 4px;">
                <strong>${m.sender}</strong>
                <span style="color: var(--text-muted);">${m.time}</span>
              </div>
              <div style="font-size: 0.85rem; color: var(--text-primary);">${m.text}</div>
            </div>
          `
            )
            .join("")}
        </div>
        <div class="modal-footer" style="flex-direction: column; align-items: stretch;">
          <div style="display: flex; gap: 6px;">
            <input type="text" id="ticket-reply-input" class="text-input" placeholder="Reply to support engineer..." />
            <button class="btn btn-primary" id="btn-send-ticket-reply">Send Reply</button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add("active");
    modal.querySelectorAll(".modal-close-btn").forEach((btn) => {
      btn.addEventListener("click", () => modal.classList.remove("active"));
    });

    modal.querySelector("#btn-send-ticket-reply").addEventListener("click", () => {
      const input = modal.querySelector("#ticket-reply-input");
      if (input.value.trim()) {
        ticket.messages.push({
          sender: "Customer (You)",
          time: "Just now",
          text: input.value.trim()
        });
        showToast("Reply sent", "info");
        this.showTicketThreadModal(ticket);
      }
    });
  }
}
