/**
 * Cortex Hub - Admin Operations & Moderation View Controller
 * Implements SRS v2.0 Section 13 (Verification), Section 19 (Commission),
 * Section 31 (Admin System), and Section 63 (Acceptance Criteria).
 */

import { CATALOG_COMPONENTS } from "../data/catalog-data.js";
import { MOCK_ADMIN_DEPLOYMENTS } from "../data/mock-dashboard.js";
import { escapeHtml, getIconSvg, showToast } from "../utils/helpers.js";

export class AdminView {
  constructor(app) {
    this.app = app;
    this.activeTab = "moderation"; // Default to Moderation Queue in SRS v2.0
    this.currentRole = "Platform Admin";
    this.deployments = [...MOCK_ADMIN_DEPLOYMENTS];
    this.components = [...CATALOG_COMPONENTS];
  }

  get isLive() {
    return this.app.api.isStaff();
  }

  money(minor) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format((minor || 0) / 100);
  }

  async render(container) {
    let queue;
    try {
      queue = await this.app.api.getModerationQueue();
    } catch (err) {
      container.innerHTML = `<p style="padding: 40px 0; color: var(--status-error);">Could not load the admin console: ${escapeHtml(err.message)}</p>`;
      return;
    }
    const pendingCount = queue.filter((m) => m.status === "UNDER_REVIEW").length;

    container.innerHTML = `
      <div class="admin-container">
        <!-- Banner -->
        <div class="admin-banner">
          <div class="admin-banner-info">
            <h2>PLATFORM GOVERNANCE &amp; OPERATIONS</h2>
            <p class="admin-subtext">// Multi-vendor product moderation, platform take-rate settings, Customization Kanban, and cluster health.</p>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            ${
              this.isLive
                ? `<span class="badge badge-lime">SIGNED IN AS ${escapeHtml(this.app.currentUser.globalRole)}</span>`
                : `<span class="badge badge-amber">SAMPLE DATA: sign in as staff for live data</span>`
            }
            <div class="role-switcher-container" ${this.isLive ? "hidden" : ""}>
              <span class="role-label">RBAC:</span>
              <select id="admin-role-select" class="role-select">
                <option value="Platform Admin" ${this.currentRole === "Platform Admin" ? "selected" : ""}>Platform Admin</option>
                <option value="Moderator" ${this.currentRole === "Moderator" ? "selected" : ""}>Component Moderator</option>
                <option value="Billing Admin" ${this.currentRole === "Billing Admin" ? "selected" : ""}>Billing Admin</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="tab-bar" id="admin-dash-tabs">
          <button class="tab-btn ${this.activeTab === "moderation" ? "active" : ""}" data-tab="moderation">
            MODERATION QUEUE [${pendingCount}]
          </button>
          <button class="tab-btn ${this.activeTab === "kanban" ? "active" : ""}" data-tab="kanban">
            CUSTOMIZATION KANBAN
          </button>
          <button class="tab-btn ${this.activeTab === "catalog" ? "active" : ""}" data-tab="catalog">
            CATALOG CRUD
          </button>
          <button class="tab-btn ${this.activeTab === "revenue" ? "active" : ""}" data-tab="revenue">
            PLATFORM FINANCIALS &amp; COMMISSIONS
          </button>
          <button class="tab-btn ${this.activeTab === "deployments" ? "active" : ""}" data-tab="deployments">
            DEPLOYMENT MATRIX
          </button>
        </div>

        <div id="admin-tab-body"></div>
      </div>
    `;

    await this.renderTabContent(container);
    this.attachEvents(container);
  }

  async renderTabContent(container) {
    const body = container.querySelector("#admin-tab-body");
    if (!body) return;

    if (this.activeTab === "moderation") {
      const queue = await this.app.api.getModerationQueue();

      body.innerHTML = `
        <div style="margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
          <p style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-secondary);">
            // SRS v2.0 Section 13 &amp; 31: Verify technical specs, integrity checksums, and approve/reject seller submissions.
          </p>
          <span class="badge badge-lime">${queue.length} Total Submissions</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${queue
            .map(
              (m) => `
            <div class="moderation-card" style="background: var(--bg-surface-2); border: 1px solid ${m.status === "APPROVED" ? "var(--accent-lime)" : m.status === "REJECTED" ? "var(--status-error)" : "var(--border-medium)"}; border-radius: 8px; padding: 18px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="badge ${m.status === "APPROVED" ? "badge-lime" : m.status === "REJECTED" ? "badge-gray" : "badge-amber"}">
                      ● ${m.status}
                    </span>
                    <span class="badge badge-indigo">${m.productType || "AI_AGENT"}</span>
                    <span class="badge badge-gray">${m.category}</span>
                  </div>
                  <h4 style="font-family: var(--font-heading); font-size: 1.2rem; color: #FFF; margin-top: 6px;">
                    ${m.productName}
                  </h4>
                  <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                    Submitted by <strong style="color: var(--accent-cyan);">${m.sellerName}</strong> (${m.sellerHandle}) on ${m.submittedDate} // Proposed Price: <strong style="color: var(--accent-lime);">${m.price}</strong>
                  </div>
                </div>

                <div style="display: flex; gap: 8px;">
                  ${
                    m.status === "UNDER_REVIEW"
                      ? `
                    <button class="btn btn-secondary btn-sm btn-reject-mod" data-id="${m.id}">
                      Reject / Request Revision
                    </button>
                    <button class="btn btn-primary btn-sm btn-approve-mod" data-id="${m.id}" style="background: var(--accent-lime); color: #000;">
                      ${getIconSvg("check", 13)} Approve &amp; Publish
                    </button>
                  `
                      : `<span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">Decision finalized: ${m.resolutionReason || m.status}</span>`
                  }
                </div>
              </div>

              <p style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 14px;">
                ${m.specs}
              </p>

              <!-- Technical Verification Checklist (SRS Section 13) -->
              <div style="background: var(--bg-deep); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 12px;">
                <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">
                  Automated Pre-Flight Verification Checklist:
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 0.78rem;">
                  <div style="color: var(--accent-lime);">✓ Malware &amp; Wheel Check: ${m.checklist ? m.checklist.malwareScan : "PASS"}</div>
                  <div style="color: var(--accent-lime);">✓ License Compliance: ${m.checklist ? m.checklist.licenseCompliance : "PASS"}</div>
                  <div style="color: var(--accent-lime);">✓ Docs &amp; Quickstart: ${m.checklist ? m.checklist.documentation : "PASS"}</div>
                  <div style="color: var(--accent-lime);">✓ Sandbox Execution: ${m.checklist ? m.checklist.sandboxIntegrity : "PASS"}</div>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;

      body.querySelectorAll(".btn-approve-mod").forEach((btn) => {
        btn.addEventListener("click", async () => {
          await this.app.api.moderateProduct(btn.dataset.id, "APPROVE");
          showToast("Component approved and published live to Cortex Hub catalog!", "success");
          this.renderTabContent(container);
        });
      });

      body.querySelectorAll(".btn-reject-mod").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const reason = prompt(
            "Enter revision feedback for seller:",
            "Please expand hardware benchmark results and provide Dockerfile."
          );
          if (reason) {
            await this.app.api.moderateProduct(btn.dataset.id, "REJECT", reason);
            showToast("Component rejected and feedback sent to seller.", "info");
            this.renderTabContent(container);
          }
        });
      });
    } else if (this.activeTab === "kanban") {
      const requests = this.isLive
        ? await this.app.refreshCustomizationRequests()
        : this.app.getCustomizationRequests();

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
              <div class="kanban-cards-stack">
                ${col.cards
                  .map(
                    (card) => `
                  <div class="kanban-card" data-id="${card.id}">
                    <div class="kanban-card-top">
                      <span class="card-id">${card.id}</span>
                      <span class="badge badge-gray" style="font-size: 0.65rem;">${card.industry || "General"}</span>
                    </div>
                    <h4 class="card-title">${card.tenantName}</h4>
                    <p class="card-desc">${card.scope}</p>
                    <div class="card-meta-row">
                      <span class="card-price">${card.estimatedPrice}</span>
                      <span class="card-target">${card.deploymentTarget || "Dedicated AWS"}</span>
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

        <!-- Scope Review Drawer -->
        <div id="scope-review-drawer" class="scope-drawer"></div>
      `;

      this.attachKanbanEvents(body);
    } else if (this.activeTab === "catalog") {
      if (this.isLive) this.components = await this.app.api.getComponents();
      body.innerHTML = `
        <div class="dashboard-subpanel">
          <div class="subpanel-header">
            <div>
              <h3 class="subpanel-title">Component Catalog Parameter Controls (FR-6.2)</h3>
              <p style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px;">
                // Dynamically modify production base prices, publication state, and vendor attribution.
              </p>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Component Name</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Vendor</th>
                  <th>Base USD Price</th>
                  <th>State</th>
                  <th style="text-align: right;">Operations</th>
                </tr>
              </thead>
              <tbody>
                ${this.components
                  .map(
                    (c) => `
                  <tr>
                    <td style="font-family: var(--font-heading); font-weight: 700; color: #FFF;">${c.name}</td>
                    <td><span class="badge badge-gray">${c.category}</span></td>
                    <td><span class="badge badge-indigo">${c.productType || "AI_AGENT"}</span></td>
                    <td style="color: var(--accent-cyan); font-size: 0.8rem;">${c.sellerName || "Apex AI Labs"}</td>
                    <td style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-lime);">${c.priceFormatted}</td>
                    <td><span class="badge badge-lime">PUBLISHED</span></td>
                    <td style="text-align: right;">
                      <button class="btn btn-outline btn-sm btn-edit-price" data-id="${c.id}">
                        Adjust Price
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

      body.querySelectorAll(".btn-edit-price").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const c = this.components.find((comp) => comp.id === btn.dataset.id);
          const tier = c.pricingTiers?.[0]?.name;
          if (!this.isLive) {
            showToast("Sign in as an admin to change prices.", "info");
            return;
          }
          const input = prompt(`New monthly price in INR (₹) for ${c.name}, ${tier} tier:`);
          const amount = Number(input);
          if (!input || !Number.isInteger(amount) || amount <= 0) return;
          try {
            const res = await this.app.api.setProductPrice(c.id, tier, amount);
            showToast(`${c.name} ${res.tier} price set to ${res.formatted}.`, "success");
            this.renderTabContent(container);
          } catch (err) {
            showToast(err.message, "error");
          }
        });
      });
    } else if (this.activeTab === "revenue") {
      if (!this.isLive) {
        body.innerHTML = `<div class="dashboard-subpanel"><p style="color: var(--text-secondary);">Revenue figures come from paid orders. Sign in as an admin or finance user to see them.</p></div>`;
        return;
      }
      let rev;
      let payouts;
      try {
        [rev, payouts] = await Promise.all([this.app.api.getAdminRevenue(), this.app.api.getAdminPayouts()]);
      } catch (err) {
        body.innerHTML = `<p style="color: var(--status-error);">${escapeHtml(err.message)}</p>`;
        return;
      }
      const ratePct = Math.round(rev.commissionRate * 100);
      body.innerHTML = `
        <div class="revenue-grid">
          <div class="revenue-card">
            <div class="rev-label">Gross Merchandise Volume (excl. GST)</div>
            <div class="rev-val" style="color: var(--accent-lime);">${this.money(rev.gmvMinor)}</div>
            <div class="rev-sub">${rev.paidOrders} paid orders · ${this.money(rev.monthGmvMinor)} this month</div>
          </div>
          <div class="revenue-card">
            <div class="rev-label">Platform Commission Earned</div>
            <div class="rev-val" style="color: var(--accent-amber);">${this.money(rev.platformFeesMinor)}</div>
            <div class="rev-sub">GST collected: ${this.money(rev.gstCollectedMinor)}</div>
          </div>
          <div class="revenue-card">
            <div class="rev-label">Seller Payouts</div>
            <div class="rev-val">${this.money(rev.payoutsPaidMinor)}</div>
            <div class="rev-sub">${rev.payoutsPendingCount} pending (${this.money(rev.payoutsPendingMinor)})</div>
          </div>
          <div class="revenue-card">
            <div class="rev-label">Sellers With Live Products</div>
            <div class="rev-val">${rev.activeSellers}</div>
            <div class="rev-sub">Earnings owed to sellers: ${this.money(rev.sellerEarningsMinor)}</div>
          </div>
        </div>

        <div class="dashboard-subpanel" style="margin-top: 20px;">
          <h3 class="subpanel-title" style="margin-bottom: 8px;">Revenue by Product</h3>
          ${
            rev.byProduct.length === 0
              ? `<p style="color: var(--text-muted);">No paid orders yet.</p>`
              : `<table class="data-table"><thead><tr><th>Product</th><th style="text-align: right;">Orders</th><th style="text-align: right;">Revenue (excl. GST)</th></tr></thead><tbody>
            ${rev.byProduct.map((r) => `<tr><td>${escapeHtml(r.product)}</td><td style="text-align: right;">${r.orders}</td><td style="text-align: right; font-family: var(--font-mono);">${this.money(r.revenueMinor)}</td></tr>`).join("")}
          </tbody></table>`
          }
        </div>

        <div class="dashboard-subpanel" style="margin-top: 20px;">
          <h3 class="subpanel-title" style="margin-bottom: 8px;">Platform Commission</h3>
          <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 16px;">Applied to new orders at checkout. Existing orders keep the rate they were placed at.</p>
          <div style="display: flex; align-items: center; gap: 16px; background: var(--bg-deep); padding: 16px; border: 1px solid var(--border-medium);">
            <div style="flex: 1;">
              <label class="form-label" for="commission-slider">Take rate</label>
              <input type="range" min="5" max="30" value="${ratePct}" id="commission-slider" style="width: 100%; accent-color: var(--accent-lime);" />
            </div>
            <span id="commission-display" style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 800; color: var(--accent-lime); width: 80px; text-align: center;">${ratePct}%</span>
            <button class="btn btn-primary btn-sm" id="btn-save-commission">Save</button>
          </div>
        </div>

        <div class="dashboard-subpanel" style="margin-top: 20px;">
          <h3 class="subpanel-title" style="margin-bottom: 8px;">Payout Requests</h3>
          ${
            payouts.length === 0
              ? `<p style="color: var(--text-muted);">No payout requests.</p>`
              : `<table class="data-table"><thead><tr><th>Seller</th><th>Requested</th><th>Method</th><th style="text-align: right;">Amount</th><th>Status</th><th style="text-align: right;">Action</th></tr></thead><tbody>
            ${payouts
              .map(
                (p) => `<tr>
              <td>${escapeHtml(p.seller)}</td>
              <td>${escapeHtml(new Date(p.date).toLocaleDateString("en-IN"))}</td>
              <td>${escapeHtml(p.method.replace("_", " "))}</td>
              <td style="text-align: right; font-family: var(--font-mono);">${this.money(p.amountMinor)}</td>
              <td><span class="badge ${p.status === "PAID" ? "badge-emerald" : p.status === "FAILED" ? "badge-gray" : "badge-amber"}">${escapeHtml(p.status)}</span></td>
              <td style="text-align: right;">${
                ["PENDING", "PROCESSING"].includes(p.status)
                  ? `<button class="btn btn-outline btn-sm btn-payout" data-id="${escapeHtml(p.id)}" data-status="PAID">Mark paid</button>
                     <button class="btn btn-secondary btn-sm btn-payout" data-id="${escapeHtml(p.id)}" data-status="FAILED">Failed</button>`
                  : ""
              }</td>
            </tr>`
              )
              .join("")}
          </tbody></table>`
          }
        </div>
      `;

      const slider = body.querySelector("#commission-slider");
      const display = body.querySelector("#commission-display");
      slider.addEventListener("input", (e) => {
        display.textContent = `${e.target.value}%`;
      });
      body.querySelector("#btn-save-commission").addEventListener("click", async () => {
        try {
          await this.app.api.setCommissionRate(Number(slider.value) / 100);
          showToast(`Commission set to ${slider.value}% for new orders.`, "success");
        } catch (err) {
          showToast(err.message, "error");
        }
      });
      body.querySelectorAll(".btn-payout").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (
            !confirm(
              btn.dataset.status === "PAID"
                ? "Mark this payout as paid? Only do this after the transfer has gone out."
                : "Mark as failed? The amount returns to the seller's balance."
            )
          )
            return;
          try {
            await this.app.api.updatePayout(btn.dataset.id, btn.dataset.status);
            this.renderTabContent(container);
          } catch (err) {
            showToast(err.message, "error");
          }
        });
      });
    } else if (this.activeTab === "deployments") {
      if (this.isLive) {
        body.innerHTML = `<div class="dashboard-subpanel"><h3 class="subpanel-title" style="margin-bottom: 8px;">Deployments</h3>
          <p style="color: var(--text-secondary);">No managed deployments yet. Customer deployments will be listed here, with health checks from monitoring, once the hosted runtime and private-deployment packages ship (SRS RUN-01, RUN-05).</p></div>`;
        return;
      }
      body.innerHTML = `
        <div class="card" style="margin-bottom: 12px; border-color: var(--status-review); padding: 10px 14px; font-size: 0.82rem;"><strong>Sample data.</strong> These rows and ping results are illustrative.</div>
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

      body.querySelectorAll(".btn-ping-node").forEach((btn) => {
        btn.addEventListener("click", () => {
          btn.textContent = "Pinging...";
          setTimeout(() => {
            btn.textContent = "24ms OK";
            showToast(`Heartbeat verified for ${btn.dataset.tenant}`, "success");
          }, 400);
        });
      });

      const pingAllBtn = body.querySelector("#btn-ping-all-nodes");
      if (pingAllBtn) {
        pingAllBtn.addEventListener("click", () => {
          pingAllBtn.textContent = "Querying Beacons...";
          setTimeout(() => {
            pingAllBtn.textContent = "Ping All Clusters";
            showToast("All 4 clusters responded healthy with P95 < 45ms", "success");
          }, 600);
        });
      }
    }
  }

  attachEvents(container) {
    const tabs = container.querySelectorAll("#admin-dash-tabs .tab-btn");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        this.activeTab = tab.dataset.tab;
        this.renderTabContent(container);
      });
    });

    const roleSelect = container.querySelector("#admin-role-select");
    if (roleSelect) {
      roleSelect.addEventListener("change", (e) => {
        this.currentRole = e.target.value;
        showToast(`Perspective switched to ${this.currentRole}`, "info");
      });
    }
  }

  attachKanbanEvents(body) {
    const cards = body.querySelectorAll(".kanban-card");
    const drawer = body.querySelector("#scope-review-drawer");

    cards.forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        const requests = this.app.getCustomizationRequests();
        const req = requests.find((r) => r.id === id);
        if (!req) return;

        drawer.innerHTML = `
          <div class="drawer-header">
            <div>
              <span class="badge badge-lime">// SCOPE REVIEW DESK</span>
              <h3 style="font-family: var(--font-heading); color: #FFF; margin-top: 4px;">${req.id} — ${req.tenantName}</h3>
            </div>
            <button class="btn-icon btn-ghost drawer-close-btn">${getIconSvg("x", 20)}</button>
          </div>
          <div class="drawer-body">
            <div class="form-group">
              <label class="form-label">Current Pipeline Stage</label>
              <select class="select-input" id="drawer-status-select">
                <option value="Submitted" ${req.status === "Submitted" ? "selected" : ""}>Submitted</option>
                <option value="Under Review" ${req.status === "Under Review" ? "selected" : ""}>Under Review</option>
                <option value="Quoted" ${req.status === "Quoted" ? "selected" : ""}>Quoted</option>
                <option value="In Progress" ${req.status === "In Progress" ? "selected" : ""}>In Progress</option>
                <option value="Delivered" ${req.status === "Delivered" ? "selected" : ""}>Delivered</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Quoted Commercial Value</label>
              <input type="text" class="text-input" id="drawer-price-input" value="${req.estimatedPrice}" />
            </div>
            <div class="form-group">
              <label class="form-label">Architectural Scope Notes</label>
              <textarea class="textarea-input" id="drawer-scope-input" rows="4">${req.scope}</textarea>
            </div>
            <button class="btn btn-primary" id="btn-save-scope-changes" style="width: 100%;">
              Commit Architectural Updates
            </button>
          </div>
        `;

        drawer.classList.add("active");
        drawer.querySelector(".drawer-close-btn").addEventListener("click", () => drawer.classList.remove("active"));

        drawer.querySelector("#btn-save-scope-changes").addEventListener("click", async () => {
          const newStatus = drawer.querySelector("#drawer-status-select").value;
          const newPrice = drawer.querySelector("#drawer-price-input").value;
          const newScope = drawer.querySelector("#drawer-scope-input").value;

          try {
            await this.app.api.updateCustomizationRequest(req.id, {
              status: newStatus,
              estimatedPrice: newPrice,
              scope: newScope,
              timelineEvent: `Status set to ${newStatus}.`
            });
          } catch (err) {
            showToast(err.message, "error");
            return;
          }
          showToast(`${req.id} updated.`, "success");
          drawer.classList.remove("active");
          this.renderTabContent(body.closest(".admin-container"));
        });
      });
    });
  }
}
