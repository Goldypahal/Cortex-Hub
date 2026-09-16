/**
 * AURA AI Platform
 * Admin Operations & Kanban Management View Controller
 * Tactical Kanban Board, Scope Review Drawer, Deployment Telemetry
 */

import { CATALOG_COMPONENTS } from "../data/catalog-data.js";
import { MOCK_ADMIN_DEPLOYMENTS } from "../data/mock-dashboard.js";
import { getIconSvg, showToast } from "../utils/helpers.js";

export class AdminView {
  constructor(app) {
    this.app = app;
    this.activeTab = "kanban";
    this.currentRole = "Platform Admin";
    this.deployments = [...MOCK_ADMIN_DEPLOYMENTS];
    this.components = [...CATALOG_COMPONENTS];
  }

  render(container) {
    container.innerHTML = `
      <div class="admin-container">
        <!-- Banner -->
        <div class="admin-banner">
          <div class="admin-banner-info">
            <h2>
              PLATFORM OPERATIONS DESK
            </h2>
            <p class="admin-subtext">// Catalog parameters, Customization Kanban, revenue BI, and multi-cluster health.</p>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="role-switcher-container">
              <span class="role-label">RBAC:</span>
              <select id="admin-role-select" class="role-select">
                <option value="Platform Admin" ${this.currentRole === "Platform Admin" ? "selected" : ""}>Platform Admin</option>
                <option value="Support Agent" ${this.currentRole === "Support Agent" ? "selected" : ""}>Support Agent</option>
                <option value="Billing Admin" ${this.currentRole === "Billing Admin" ? "selected" : ""}>Billing Admin</option>
              </select>
            </div>
            <span class="badge badge-emerald">SYS NORMAL</span>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="tab-bar" id="admin-dash-tabs">
          <button class="tab-btn ${this.activeTab === "kanban" ? "active" : ""}" data-tab="kanban">CUSTOMIZATION KANBAN</button>
          <button class="tab-btn ${this.activeTab === "catalog" ? "active" : ""}" data-tab="catalog">CATALOG CRUD</button>
          <button class="tab-btn ${this.activeTab === "revenue" ? "active" : ""}" data-tab="revenue">REVENUE BI</button>
          <button class="tab-btn ${this.activeTab === "deployments" ? "active" : ""}" data-tab="deployments">DEPLOYMENT MATRIX</button>
        </div>

        <div id="admin-tab-body"></div>
      </div>
    `;

    this.renderTabContent(container);
    this.attachEvents(container);
  }

  renderTabContent(container) {
    const body = container.querySelector("#admin-tab-body");
    if (!body) return;

    if (this.activeTab === "kanban") {
      const requests = this.app.getCustomizationRequests();

      const columns = [
        { id: "Submitted", title: "NEW SUBMITTED", count: 0, cards: [] },
        { id: "Under Review", title: "UNDER SCOPING", count: 0, cards: [] },
        { id: "Quoted", title: "FORMAL QUOTED", count: 0, cards: [] },
        { id: "In Progress", title: "ENGINEERING", count: 0, cards: [] },
        { id: "Delivered", title: "DELIVERED & LIVE", count: 0, cards: [] }
      ];

      requests.forEach((req) => {
        const col = columns.find((c) => c.id === req.status) || columns[0];
        col.cards.push(req);
        col.count++;
      });

      body.innerHTML = `
        <div style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
          <p style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-secondary);">
            // Click request card to open Architectural Scope Review Drawer, override quote pricing, or advance stages.
          </p>
          <span style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--accent-lime); font-weight: 700;">
            ${requests.length} ACTIVE PIPELINE SPRINT JOBS
          </span>
        </div>

        <div class="kanban-board">
          ${columns
            .map(
              (col) => `
            <div class="kanban-column" data-col="${col.id}">
              <div class="kanban-col-header">
                <span class="col-title">
                  <span>${col.title}</span>
                  <span class="col-count-badge">[${col.count}]</span>
                </span>
              </div>
              <div class="kanban-cards-list">
                ${col.cards
                  .map(
                    (card) => `
                  <div class="kanban-card" data-req-id="${card.id}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span class="k-card-component">${card.componentName}</span>
                      <span style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-muted);">${card.id}</span>
                    </div>
                    <div class="k-card-tenant">${card.tenantName}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.3;">
                      ${card.scope}
                    </div>
                    <div class="k-card-tags">
                      <span class="tech-tag">${card.industry}</span>
                      <span class="tech-tag">${card.deploymentTarget}</span>
                    </div>
                    <div class="k-card-footer">
                      <span class="k-card-price">${card.estimatedPrice}</span>
                      <span>${card.targetDelivery}</span>
                    </div>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;

      body.querySelectorAll(".kanban-card").forEach((cardEl) => {
        cardEl.addEventListener("click", () => {
          const req = requests.find((r) => r.id === cardEl.dataset.reqId);
          if (req) this.openScopeReviewDrawer(req);
        });
      });
    } else if (this.activeTab === "catalog") {
      body.innerHTML = `
        <div class="dashboard-subpanel">
          <div class="subpanel-header">
            <div>
              <h3 class="subpanel-title">Component Catalog Specification Management (FR-6.2)</h3>
              <p style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px;">
                // Manage pricing tiers, model versions, and production visibility.
              </p>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-add-component-catalog">
              + Add Component
            </button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Component Name</th>
                  <th>Category</th>
                  <th>Version</th>
                  <th>Base License</th>
                  <th>State</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${this.components
                  .map(
                    (c) => `
                  <tr>
                    <td style="font-family: var(--font-heading); font-weight: 700; color: #FFF;">${c.name}</td>
                    <td><span class="badge badge-gray">${c.category}</span></td>
                    <td><code class="api-key-code">${c.version}</code></td>
                    <td style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-lime);">${c.priceFormatted}</td>
                    <td><span class="badge badge-emerald">PUBLISHED</span></td>
                    <td style="text-align: right;">
                      <button class="btn btn-outline btn-sm btn-edit-comp" data-id="${c.id}">
                        Edit Base Fee
                      </button>
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

      body.querySelector("#btn-add-component-catalog").addEventListener("click", () => {
        showToast("New component authoring dialog launched.", "info");
      });

      body.querySelectorAll(".btn-edit-comp").forEach((btn) => {
        btn.addEventListener("click", () => {
          const c = this.components.find((comp) => comp.id === btn.dataset.id);
          const newPrice = prompt(`Enter new base price for ${c.name}:`, c.basePrice);
          if (newPrice && !isNaN(newPrice)) {
            c.basePrice = parseInt(newPrice);
            c.priceFormatted = `$${newPrice}`;
            c.inrPriceFormatted = `₹${Math.round(newPrice * 83.5).toLocaleString()}`;
            showToast(`Base price for ${c.name} updated to $${newPrice}!`, "success");
            this.renderTabContent(container);
          }
        });
      });
    } else if (this.activeTab === "revenue") {
      body.innerHTML = `
        <div class="revenue-grid">
          <div class="revenue-card">
            <div class="rev-label">Monthly Recurring Revenue</div>
            <div class="rev-val" style="color: var(--accent-lime);">$42,850</div>
            <div class="rev-sub">+14.2% vs last cycle</div>
          </div>
          <div class="revenue-card">
            <div class="rev-label">Annualized Run Rate (ARR)</div>
            <div class="rev-val">$514,200</div>
            <div class="rev-sub">+18.5% YoY projection</div>
          </div>
          <div class="revenue-card">
            <div class="rev-label">Gross Revenue Churn</div>
            <div class="rev-val">1.18%</div>
            <div class="rev-sub" style="color: var(--signal-cyan);">Sovereign SaaS benchmark</div>
          </div>
          <div class="revenue-card">
            <div class="rev-label">Active Paying Tenant Orgs</div>
            <div class="rev-val">128 Orgs</div>
            <div class="rev-sub">+9 this sprint</div>
          </div>
        </div>

        <div class="dashboard-subpanel">
          <h3 class="subpanel-title" style="margin-bottom: 14px;">Revenue Stream Distribution (FR-6.5 / Section 8.1)</h3>
          
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.8rem; margin-bottom: 4px;">
                <span>1. Base Component Licenses</span>
                <strong>45% ($19,282 / mo)</strong>
              </div>
              <div class="progress-track"><div class="progress-bar-fill" style="width: 45%; background: var(--accent-lime);"></div></div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.8rem; margin-bottom: 4px;">
                <span>2. Customization &amp; VPC Integration Packages</span>
                <strong>38% ($16,283 / mo)</strong>
              </div>
              <div class="progress-track"><div class="progress-bar-fill" style="width: 38%; background: var(--signal-cyan);"></div></div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.8rem; margin-bottom: 4px;">
                <span>3. Monthly Maintenance &amp; Sovereign SLAs</span>
                <strong>17% ($7,285 / mo)</strong>
              </div>
              <div class="progress-track"><div class="progress-bar-fill" style="width: 17%; background: var(--status-live);"></div></div>
            </div>
          </div>
        </div>
      `;
    } else if (this.activeTab === "deployments") {
      body.innerHTML = `
        <div class="dashboard-subpanel">
          <div class="subpanel-header">
            <div>
              <h3 class="subpanel-title">Active Tenant Deployment Matrix (FR-6.6)</h3>
              <p style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px;">
                // Telemetry health check across AWS VPCs, GCP clusters, and air-gapped nodes.
              </p>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-ping-all-nodes">
              Ping All Clusters
            </button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tenant Organization</th>
                  <th>Component</th>
                  <th>Topology Target</th>
                  <th>Health Status</th>
                  <th>SLA Uptime</th>
                  <th>Ping Latency</th>
                  <th>Last Beacon</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${this.deployments
                  .map(
                    (d) => `
                  <tr>
                    <td style="font-family: var(--font-heading); font-weight: 700; color: #FFF;">${d.tenant}</td>
                    <td>
                      <div>${d.component}</div>
                      <code style="font-size: 0.7rem; color: var(--text-muted); font-family: var(--font-mono);">${d.version}</code>
                    </td>
                    <td><span class="badge badge-gray">${d.env}</span></td>
                    <td>
                      <span class="health-beacon">
                        <span class="beacon-pulse ${d.status === "Healthy" ? "online" : "warning"}"></span>
                        <span>${d.status.toUpperCase()}</span>
                      </span>
                    </td>
                    <td style="font-family: var(--font-mono); color: var(--status-live);">${d.uptime}</td>
                    <td style="font-family: var(--font-mono); color: var(--accent-lime);">${d.pingMs}ms</td>
                    <td style="color: var(--text-muted); font-size: 0.76rem; font-family: var(--font-mono);">${d.lastCheck}</td>
                    <td style="text-align: right;">
                      <button class="btn btn-outline btn-sm btn-ping-node" data-tenant="${d.tenant}">
                        Ping
                      </button>
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

      body.querySelector("#btn-ping-all-nodes").addEventListener("click", () => {
        showToast("Health beacons received from all 4 clusters. Latency nominal.", "success");
      });

      body.querySelectorAll(".btn-ping-node").forEach((btn) => {
        btn.addEventListener("click", () => {
          showToast(`Cluster heartbeat for ${btn.dataset.tenant} responded in 24ms`, "success");
        });
      });
    }
  }

  attachEvents(container) {
    container.querySelector("#admin-role-select").addEventListener("change", (e) => {
      this.currentRole = e.target.value;
      showToast(`RBAC context set to ${this.currentRole}`, "info");
    });

    const tabs = container.querySelectorAll(".tab-btn");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        this.activeTab = tab.dataset.tab;
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        this.renderTabContent(container);
      });
    });
  }

  openScopeReviewDrawer(request) {
    let modal = document.getElementById("admin-scope-drawer");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "admin-scope-drawer";
      modal.className = "modal-backdrop";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge badge-lime">${request.status}</span>
              <span style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted);">${request.id}</span>
            </div>
            <h3 class="modal-title" style="margin-top: 4px;">Architecture Scoping &amp; BOM Override (FR-3.6)</h3>
          </div>
          <button class="btn-icon btn-ghost modal-close-btn">${getIconSvg("x", 20)}</button>
        </div>
        <div class="modal-body">
          <div class="scope-meta-grid">
            <div>
              <div class="scope-item-lbl">Tenant Organization</div>
              <div class="scope-item-val">${request.tenantName}</div>
            </div>
            <div>
              <div class="scope-item-lbl">Target Component</div>
              <div class="scope-item-val">${request.componentName}</div>
            </div>
            <div>
              <div class="scope-item-lbl">Infrastructure Target</div>
              <div class="scope-item-val">${request.deploymentTarget}</div>
            </div>
            <div>
              <div class="scope-item-lbl">Domain Context</div>
              <div class="scope-item-val">${request.industry}</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Approved Quotation Price (USD)</label>
            <input type="text" id="drawer-quote-price" class="text-input" value="${request.estimatedPrice}" />
          </div>

          <div class="form-group">
            <label class="form-label">Target Delivery Sprint</label>
            <input type="text" id="drawer-target-delivery" class="text-input" value="${request.targetDelivery}" />
          </div>

          <div class="form-group">
            <label class="form-label">Advance Pipeline Stage</label>
            <select id="drawer-new-status" class="select-input" style="font-family: var(--font-mono); font-size: 0.8rem;">
              <option value="Submitted" ${request.status === "Submitted" ? "selected" : ""}>Submitted</option>
              <option value="Under Review" ${request.status === "Under Review" ? "selected" : ""}>Under Review</option>
              <option value="Quoted" ${request.status === "Quoted" ? "selected" : ""}>Quoted (Awaiting Customer Payment)</option>
              <option value="In Progress" ${request.status === "In Progress" ? "selected" : ""}>In Progress (Engineering Active)</option>
              <option value="Delivered" ${request.status === "Delivered" ? "selected" : ""}>Delivered</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Internal Engineering Scoping Notes (FR-6.7 - Hidden from Customer)</label>
            <textarea id="drawer-internal-notes" class="textarea-input" placeholder="e.g. Verified Epic EHR FHIR endpoints. Standard connector will suffice with OAuth2 flow."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-close-btn">Cancel</button>
          <button class="btn btn-primary" id="btn-save-drawer-quote">
            Save &amp; Update Stage
          </button>
        </div>
      </div>
    `;

    modal.classList.add("active");
    modal.querySelectorAll(".modal-close-btn").forEach((btn) => {
      btn.addEventListener("click", () => modal.classList.remove("active"));
    });

    modal.querySelector("#btn-save-drawer-quote").addEventListener("click", () => {
      const newPrice = modal.querySelector("#drawer-quote-price").value.trim();
      const newDelivery = modal.querySelector("#drawer-target-delivery").value.trim();
      const newStatus = modal.querySelector("#drawer-new-status").value;
      const notes = modal.querySelector("#drawer-internal-notes").value.trim();

      request.estimatedPrice = newPrice;
      request.targetDelivery = newDelivery;
      request.status = newStatus;

      const stepMap = {
        Submitted: 1,
        "Under Review": 2,
        Quoted: 3,
        "In Progress": 4,
        Delivered: 5
      };
      request.statusStep = stepMap[newStatus] || 1;

      request.timelineLog.push({
        date: "Today",
        event: `Admin updated status to "${newStatus}" with quote ${newPrice}. ${notes ? `(${notes})` : ""}`
      });

      modal.classList.remove("active");
      showToast(`Request ${request.id} advanced to ${newStatus}!`, "success");
      const container = document.querySelector(".admin-container");
      if (container) this.renderTabContent(container);
    });
  }
}
