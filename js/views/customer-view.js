/**
 * Cortex Hub - Buyer Portal View Controller
 * Live workspace data when signed in to a buyer workspace; labelled sample data otherwise.
 */

import { MOCK_TENANT, MOCK_LICENSES, MOCK_API_KEYS, MOCK_DAILY_USAGE, MOCK_SUPPORT_TICKETS } from "../data/mock-dashboard.js";
import { getIconSvg, copyToClipboard, showToast, escapeHtml } from "../utils/helpers.js";

const esc = escapeHtml;

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name) {
  return (name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// Sample data shown to visitors, in the same shape as the live data
function sampleData() {
  return {
    isSample: true,
    workspace: { name: MOCK_TENANT.name, plan: MOCK_TENANT.tier, role: MOCK_TENANT.role },
    kpis: {
      activeLicenses: MOCK_LICENSES.length,
      spend: MOCK_TENANT.spendFormatted,
      tokens: MOCK_DAILY_USAGE.reduce((n, u) => n + u.tokens, 0),
      pendingCustomizations: null
    },
    licenses: MOCK_LICENSES.map((l) => ({
      id: l.id,
      componentId: l.componentId,
      componentName: l.componentName,
      tier: l.tier,
      version: l.version,
      status: l.status,
      keyPrefix: null,
      purchasedAt: l.startDate,
      expiresAt: l.renewalDate,
      totalPaid: l.monthlyPrice,
      orderId: null,
      sellerName: null
    })),
    apiKeys: MOCK_API_KEYS.map((k) => ({ id: k.id, name: k.name, environment: k.environment, prefix: k.masked, status: k.status || "Active", lastUsed: k.lastUsed })),
    usage: MOCK_DAILY_USAGE.map((u) => ({ label: u.day, units: u.tokens })),
    tickets: MOCK_SUPPORT_TICKETS.map((t) => ({ ...t, created: t.created })),
    requests: null // filled from app.getCustomizationRequests()
  };
}

function liveData(portal) {
  const { summary, entitlements, apiKeys, tickets, requests, usage } = portal;
  return {
    isSample: false,
    workspace: { name: summary.name, plan: summary.plan, role: summary.role },
    kpis: {
      activeLicenses: summary.activeEntitlements,
      spend: summary.spendThisMonth,
      tokens: summary.tokensThisMonth,
      pendingCustomizations: summary.openCustomizations
    },
    licenses: entitlements.map((e) => ({
      id: e.id,
      componentId: e.componentId,
      componentName: e.componentName,
      tier: e.tier,
      version: e.version,
      status: e.status,
      keyPrefix: e.licenseKeyPrefix,
      purchasedAt: e.purchasedAt,
      expiresAt: e.expiresAt,
      totalPaid: e.totalPaid,
      orderId: e.orderId,
      invoiceNumber: e.invoiceNumber,
      sellerName: e.sellerName
    })),
    apiKeys: apiKeys.map((k) => ({
      id: k.id,
      name: k.name,
      environment: k.environment,
      prefix: k.prefix,
      status: k.status,
      lastUsed: k.lastUsed ? fmtDate(k.lastUsed) : "Never"
    })),
    usage: usage.map((u) => ({ label: new Date(u.date).toLocaleDateString("en-IN", { weekday: "short" }), units: u.units })),
    tickets: tickets.map((t) => ({ ...t, created: fmtDate(t.createdAt) })),
    requests
  };
}

export class CustomerView {
  constructor(app) {
    this.app = app;
    this.activeTab = "overview";
    this.data = null;
  }

  async load() {
    if (this.app.api.hasWorkspace("BUYER")) {
      try {
        this.data = liveData(await this.app.api.getBuyerPortal());
        return;
      } catch (err) {
        showToast(`Could not load your workspace: ${err.message}`, "error");
      }
    }
    this.data = sampleData();
    this.data.requests = this.app.getCustomizationRequests();
  }

  async render(container) {
    this.container = container;
    container.innerHTML = `<div class="dashboard-container"><p style="color: var(--text-muted); padding: 40px 0;">Loading workspace…</p></div>`;
    await this.load();
    const d = this.data;
    const pending = d.kpis.pendingCustomizations ?? d.requests.filter((r) => r.status !== "Delivered").length;

    container.innerHTML = `
      <div class="dashboard-container">
        ${
          d.isSample
            ? `<div class="card" style="margin-bottom: 16px; border-color: var(--status-review); padding: 12px 16px; font-size: 0.85rem;">
                <strong>Sample data.</strong> This is a preview of the buyer portal. Sign in with a buyer account to see your own licences, keys, usage and tickets.
              </div>`
            : ""
        }
        <div class="dashboard-banner">
          <div class="tenant-identity">
            <div class="tenant-avatar">${esc(initials(d.workspace.name))}</div>
            <div class="tenant-details">
              <h2>${esc(d.workspace.name)}</h2>
              <div class="tenant-meta">
                <span class="badge badge-lime">${esc(d.workspace.plan)}</span>
                <span style="color: var(--text-muted);">ROLE: <strong>${esc(d.workspace.role)}</strong></span>
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" id="btn-raise-ticket-top">Support Desk</button>
            <button class="btn btn-primary btn-sm" id="btn-create-key-top">+ Generate API Key</button>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-title">Active Licences</span>
            <span class="kpi-value">${esc(d.kpis.activeLicenses)}</span>
            <span class="kpi-trend">${d.isSample ? "Sample" : "From your paid orders"}</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Spend This Month</span>
            <span class="kpi-value">${esc(d.kpis.spend)}</span>
            <span class="kpi-trend">${d.isSample ? "Sample" : "Incl. 18% GST"}</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Tokens This Month</span>
            <span class="kpi-value">${esc(Number(d.kpis.tokens).toLocaleString("en-IN"))}</span>
            <span class="kpi-trend">${d.isSample ? "Sample" : "Recorded usage events"}</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Open Customizations</span>
            <span class="kpi-value">${esc(pending)}</span>
            <span class="kpi-trend">Not yet delivered</span>
          </div>
        </div>

        <div class="tab-bar" id="cust-dash-tabs">
          ${[
            ["overview", "LICENCES &amp; PURCHASES"],
            ["keys", "API KEYS"],
            ["usage", "USAGE"],
            ["requests", "CUSTOMIZATIONS"],
            ["tickets", "SUPPORT TICKETS"]
          ]
            .map(([id, label]) => `<button class="tab-btn ${this.activeTab === id ? "active" : ""}" data-tab="${id}">${label}</button>`)
            .join("")}
        </div>

        <div id="cust-tab-content"></div>
      </div>
    `;

    this.renderTabContent(container);
    this.attachEvents(container);
  }

  requireLive(action) {
    if (this.data.isSample) {
      showToast(`Sign in with a buyer account to ${action}.`, "info");
      return false;
    }
    return true;
  }

  async refresh() {
    if (this.container) await this.render(this.container);
  }

  renderTabContent(container) {
    const tabBody = container.querySelector("#cust-tab-content");
    if (!tabBody) return;
    const d = this.data;

    if (this.activeTab === "overview") {
      tabBody.innerHTML = `
        <div class="dashboard-subpanel">
          <div class="subpanel-header">
            <div>
              <h3 class="subpanel-title">Licences &amp; Purchases</h3>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
                Licence keys are shown once when issued. Lost one? Rotate it to get a new key; the old key stops working.
              </p>
            </div>
            <button class="btn btn-outline btn-sm" id="btn-browse-more-store">Explore Catalog →</button>
          </div>
          ${
            d.licenses.length === 0
              ? `<p style="color: var(--text-muted);">No purchases yet. Licences you buy appear here.</p>`
              : `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 14px;">
            ${d.licenses
              .map(
                (lic) => `
              <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span class="badge ${lic.status === "ACTIVE" || lic.status === "Active" ? "badge-emerald" : "badge-amber"}">${esc(lic.status)}</span>
                    ${lic.invoiceNumber ? `<span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${esc(lic.invoiceNumber)}</span>` : ""}
                  </div>
                  <h4 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; margin-bottom: 2px;">${esc(lic.componentName)}</h4>
                  <div style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--accent-lime); margin-bottom: 12px;">${esc(lic.tier)}${lic.version ? ` // ${esc(lic.version)}` : ""}${lic.sellerName ? ` // by ${esc(lic.sellerName)}` : ""}</div>
                  <div style="display: flex; flex-direction: column; gap: 4px; font-family: var(--font-mono); font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 16px;">
                    <div>PURCHASED: ${esc(fmtDate(lic.purchasedAt))}${lic.totalPaid ? ` (${esc(lic.totalPaid)})` : ""}</div>
                    <div>${lic.expiresAt ? `VALID UNTIL: ${esc(fmtDate(lic.expiresAt))}` : "PERPETUAL LICENCE"}</div>
                    ${lic.keyPrefix ? `<div>KEY: <code>${esc(lic.keyPrefix)}…</code></div>` : ""}
                  </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; padding-top: 10px; border-top: 1px solid var(--border-subtle); flex-wrap: wrap;">
                  <div style="display: flex; gap: 6px;">
                    <button class="btn btn-secondary btn-sm btn-invoice" data-order="${esc(lic.orderId || "")}" ${lic.orderId ? "" : "disabled"}>Invoice</button>
                    <button class="btn btn-secondary btn-sm btn-rotate-licence" data-id="${esc(lic.id)}">Rotate key</button>
                  </div>
                  <button class="btn btn-primary btn-sm btn-launch-lic-sandbox" data-id="${esc(lic.componentId)}">Test Sandbox →</button>
                </div>
              </div>`
              )
              .join("")}
          </div>`
          }
        </div>
      `;

      tabBody.querySelector("#btn-browse-more-store").addEventListener("click", () => this.app.navigateTo("marketplace"));
      tabBody.querySelectorAll(".btn-invoice").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (!this.requireLive("download invoices")) return;
          window.open(`/api/invoices/${encodeURIComponent(btn.dataset.order)}`, "_blank", "noopener");
        });
      });
      tabBody.querySelectorAll(".btn-rotate-licence").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!this.requireLive("rotate licence keys")) return;
          if (!confirm("Issue a new licence key? The current key stops working immediately.")) return;
          try {
            const res = await this.app.api.rotateLicenseKey(btn.dataset.id);
            this.showSecretModal("New licence key", res.licenseKey, "Store this key now. It will not be shown again.");
            await this.refresh();
          } catch (err) {
            showToast(err.message, "error");
          }
        });
      });
      tabBody.querySelectorAll(".btn-launch-lic-sandbox").forEach((btn) => {
        btn.addEventListener("click", () => this.app.navigateTo("playground", { componentId: btn.dataset.id }));
      });
    } else if (this.activeTab === "keys") {
      tabBody.innerHTML = `
        <div class="dashboard-subpanel">
          <div class="subpanel-header">
            <div>
              <h3 class="subpanel-title">API Keys</h3>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
                Keys are stored as SHA-256 hashes, so the full secret is shown only once, when created or rotated.
              </p>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-modal-generate-key">+ Generate Key</button>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr><th>Key Name</th><th>Environment</th><th>Key</th><th>Status</th><th>Last Used</th><th style="text-align: right;">Actions</th></tr>
              </thead>
              <tbody>
                ${d.apiKeys
                  .map(
                    (k) => `
                  <tr>
                    <td style="font-weight: 600; font-family: var(--font-mono);">${esc(k.name)}</td>
                    <td><span class="badge ${k.environment === "Production" ? "badge-lime" : "badge-gray"}">${esc(k.environment)}</span></td>
                    <td><code class="api-key-code">${esc(k.prefix)}</code></td>
                    <td><span class="badge ${/active/i.test(k.status) ? "badge-emerald" : "badge-gray"}">${esc(k.status)}</span></td>
                    <td style="color: var(--text-muted); font-size: 0.76rem; font-family: var(--font-mono);">${esc(k.lastUsed)}</td>
                    <td style="text-align: right;">
                      ${
                        /active/i.test(k.status)
                          ? `<div style="display: inline-flex; gap: 4px;">
                        <button class="btn btn-secondary btn-sm btn-rotate-key" data-id="${esc(k.id)}" style="color: var(--signal-amber);">Rotate</button>
                        <button class="btn btn-secondary btn-sm btn-revoke-key" data-id="${esc(k.id)}" style="color: var(--status-error);">Revoke</button>
                      </div>`
                          : ""
                      }
                    </td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;

      tabBody.querySelector("#btn-modal-generate-key").addEventListener("click", () => this.showNewKeyModal());
      tabBody.querySelectorAll(".btn-rotate-key").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!this.requireLive("rotate API keys")) return;
          if (!confirm("Rotate this key? The current key is revoked immediately and a new one is issued.")) return;
          try {
            const res = await this.app.api.rotateApiKeyLive(btn.dataset.id);
            this.showSecretModal("Rotated API key", res.key, "Update your services with this key now. It will not be shown again.");
            await this.refresh();
          } catch (err) {
            showToast(err.message, "error");
          }
        });
      });
      tabBody.querySelectorAll(".btn-revoke-key").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!this.requireLive("revoke API keys")) return;
          if (!confirm("Revoke this key? All traffic using it will be rejected.")) return;
          try {
            await this.app.api.revokeApiKeyLive(btn.dataset.id);
            showToast("Key revoked.", "warning");
            await this.refresh();
          } catch (err) {
            showToast(err.message, "error");
          }
        });
      });
    } else if (this.activeTab === "usage") {
      const max = Math.max(1, ...d.usage.map((u) => u.units));
      const total = d.usage.reduce((n, u) => n + u.units, 0);
      tabBody.innerHTML = `
        <div class="dashboard-subpanel">
          <div class="subpanel-header">
            <h3 class="subpanel-title">Usage, last 7 days</h3>
            <span style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted);">${d.isSample ? "SAMPLE DATA" : "TOKENS FROM RECORDED USAGE EVENTS"}</span>
          </div>
          ${
            total === 0
              ? `<p style="color: var(--text-muted);">No usage recorded in the last 7 days. Sandbox runs and API calls appear here.</p>`
              : `<div class="chart-container" role="img" aria-label="Tokens per day for the last 7 days, ${total.toLocaleString("en-IN")} in total">
            ${d.usage
              .map(
                (u) => `
              <div class="chart-bar-group" title="${esc(u.label)}: ${esc(u.units.toLocaleString("en-IN"))} tokens">
                <div class="chart-bar" style="height: ${Math.max(2, Math.round((u.units / max) * 100))}%;"></div>
                <span class="chart-label">${esc(u.label)}</span>
              </div>`
              )
              .join("")}
          </div>
          <table class="data-table" style="margin-top: 16px;">
            <thead><tr><th>Day</th><th style="text-align: right;">Tokens</th></tr></thead>
            <tbody>${d.usage.map((u) => `<tr><td>${esc(u.label)}</td><td style="text-align: right; font-family: var(--font-mono);">${esc(u.units.toLocaleString("en-IN"))}</td></tr>`).join("")}</tbody>
          </table>`
          }
        </div>
      `;
    } else if (this.activeTab === "requests") {
      tabBody.innerHTML = `
        <div class="dashboard-subpanel">
          <div class="subpanel-header">
            <h3 class="subpanel-title">Customization Requests</h3>
            <button class="btn btn-primary btn-sm" id="btn-request-new-customization">+ New Request</button>
          </div>
          ${d.requests.length === 0 ? `<p style="color: var(--text-muted);">No customization requests yet.</p>` : ""}
          ${d.requests
            .map((req) => {
              const steps = ["Submitted", "Scoping", "Quoted", "Engineering", "Delivered"];
              return `
            <div class="request-pipeline-card">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="badge ${req.status === "Delivered" ? "badge-emerald" : req.status === "In Progress" ? "badge-lime" : "badge-amber"}">${esc(req.status)}</span>
                    <strong style="font-family: var(--font-heading); font-size: 1.05rem;">${esc(req.componentName)}</strong>
                    <span style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted);">${esc(req.id)}</span>
                  </div>
                  <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px;">SCOPE: ${esc(req.scope)} (${esc(req.deploymentTarget)})</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; color: var(--accent-lime);">${esc(req.estimatedPrice)}</div>
                  <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${esc(req.targetDelivery)}</div>
                </div>
              </div>
              <div class="pipeline-stepper">
                ${steps
                  .map((label, i) => {
                    const n = i + 1;
                    const cls = req.statusStep > n || (n === 5 && req.statusStep >= 5) ? "done" : req.statusStep === n ? "active" : "";
                    return `<div class="pipeline-step ${cls}"><div class="pipeline-dot">${cls === "done" ? "✓" : n}</div><span class="pipeline-label">${label}</span></div>`;
                  })
                  .join("")}
              </div>
              <ul style="list-style: none; margin-top: 10px; font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 3px;">
                ${(req.timelineLog || []).map((log) => `<li><span style="color: var(--accent-lime);">${esc(log.date)}:</span> ${esc(log.event)}</li>`).join("")}
              </ul>
            </div>`;
            })
            .join("")}
        </div>
      `;
      tabBody.querySelector("#btn-request-new-customization").addEventListener("click", () => this.app.navigateTo("configurator"));
    } else if (this.activeTab === "tickets") {
      tabBody.innerHTML = `
        <div class="dashboard-subpanel">
          <div class="subpanel-header">
            <h3 class="subpanel-title">Support Tickets</h3>
            <button class="btn btn-primary btn-sm" id="btn-create-ticket-modal">+ Raise Ticket</button>
          </div>
          ${d.tickets.length === 0 ? `<p style="color: var(--text-muted);">No tickets yet.</p>` : ""}
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${d.tickets
              .map((tck) => {
                const last = tck.messages[tck.messages.length - 1];
                return `
              <div class="card" style="padding: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="badge ${/open/i.test(tck.status) ? "badge-amber" : "badge-emerald"}">${esc(tck.status)}</span>
                    <span class="badge badge-gray">${esc(tck.priority)} priority</span>
                    <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${esc(tck.id)}</span>
                  </div>
                  <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${esc(tck.created)}</span>
                </div>
                <h4 style="font-family: var(--font-heading); font-size: 0.95rem; font-weight: 700; margin-bottom: 6px;">${esc(tck.subject)}</h4>
                ${last ? `<p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 10px;">"${esc(last.text)}"</p>` : ""}
                <div style="display: flex; justify-content: flex-end;">
                  <button class="btn btn-outline btn-sm btn-view-ticket-thread" data-id="${esc(tck.id)}">Discussion (${tck.messages.length}) →</button>
                </div>
              </div>`;
              })
              .join("")}
          </div>
        </div>
      `;
      tabBody.querySelector("#btn-create-ticket-modal").addEventListener("click", () => this.showNewTicketModal());
      tabBody.querySelectorAll(".btn-view-ticket-thread").forEach((btn) => {
        btn.addEventListener("click", () => {
          const tck = d.tickets.find((t) => t.id === btn.dataset.id);
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
    container.querySelectorAll(".tab-btn").forEach((t) => t.classList.toggle("active", t.dataset.tab === this.activeTab));
    this.renderTabContent(container);
  }

  modal(id, html) {
    let modal = document.getElementById(id);
    if (!modal) {
      modal = document.createElement("div");
      modal.id = id;
      modal.className = "modal-backdrop";
      document.body.appendChild(modal);
    }
    modal.innerHTML = html;
    modal.classList.add("active");
    modal.querySelectorAll(".modal-close-btn").forEach((btn) => btn.addEventListener("click", () => modal.classList.remove("active")));
    return modal;
  }

  showSecretModal(title, secret, note) {
    const modal = this.modal(
      "secret-modal",
      `<div class="modal-dialog" style="max-width: 560px;">
        <div class="modal-header">
          <h3 class="modal-title" style="color: var(--text-primary);">${esc(title)}</h3>
          <button class="btn-icon btn-ghost modal-close-btn" aria-label="Close">${getIconSvg("x", 20)}</button>
        </div>
        <div class="modal-body">
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 10px;">${esc(note)}</p>
          <code style="display: block; word-break: break-all; padding: 12px; background: var(--bg-deep); border: 1px solid var(--border-medium); font-family: var(--font-mono);">${esc(secret)}</code>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-copy-secret">Copy</button>
          <button class="btn btn-primary modal-close-btn">I have stored it</button>
        </div>
      </div>`
    );
    modal.querySelector("#btn-copy-secret").addEventListener("click", () => copyToClipboard(secret, "Copied to clipboard"));
  }

  showNewKeyModal() {
    if (!this.requireLive("create API keys")) return;
    const modal = this.modal(
      "new-key-modal",
      `<div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title" style="color: var(--text-primary);">Create API Key</h3>
          <button class="btn-icon btn-ghost modal-close-btn" aria-label="Close">${getIconSvg("x", 20)}</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label" for="new-key-name">Key name</label>
            <input type="text" id="new-key-name" class="text-input" placeholder="e.g. Production backend" maxlength="100" />
          </div>
          <div class="form-group">
            <label class="form-label" for="new-key-env">Environment</label>
            <select id="new-key-env" class="select-input">
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-close-btn">Cancel</button>
          <button class="btn btn-primary" id="btn-confirm-create-key">Create key</button>
        </div>
      </div>`
    );
    modal.querySelector("#btn-confirm-create-key").addEventListener("click", async () => {
      const name = modal.querySelector("#new-key-name").value.trim() || "API key";
      const env = modal.querySelector("#new-key-env").value;
      try {
        const res = await this.app.api.createApiKeyLive(name, env);
        modal.classList.remove("active");
        this.showSecretModal("New API key", res.key, "Store this key now. It will not be shown again.");
        await this.refresh();
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  showNewTicketModal() {
    if (!this.requireLive("open support tickets")) return;
    const modal = this.modal(
      "new-ticket-modal",
      `<div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title" style="color: var(--text-primary);">Open Support Ticket</h3>
          <button class="btn-icon btn-ghost modal-close-btn" aria-label="Close">${getIconSvg("x", 20)}</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label" for="tck-subject">Subject</label>
            <input type="text" id="tck-subject" class="text-input" maxlength="200" />
          </div>
          <div class="form-group">
            <label class="form-label" for="tck-priority">Priority</label>
            <select id="tck-priority" class="select-input">
              <option value="LOW">Low</option>
              <option value="MEDIUM" selected>Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="tck-desc">Description</label>
            <textarea id="tck-desc" class="textarea-input" maxlength="5000" placeholder="What happened? Include request IDs if you have them."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-close-btn">Cancel</button>
          <button class="btn btn-primary" id="btn-submit-ticket">Submit ticket</button>
        </div>
      </div>`
    );
    modal.querySelector("#btn-submit-ticket").addEventListener("click", async () => {
      const subject = modal.querySelector("#tck-subject").value.trim();
      if (!subject) return showToast("Add a subject.", "warning");
      try {
        await this.app.api.createTicketLive(subject, modal.querySelector("#tck-priority").value, modal.querySelector("#tck-desc").value.trim() || subject);
        modal.classList.remove("active");
        showToast("Ticket submitted.", "success");
        this.activeTab = "tickets";
        await this.refresh();
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  showTicketThreadModal(ticket) {
    const modal = this.modal(
      "ticket-thread-modal",
      `<div class="modal-dialog modal-lg">
        <div class="modal-header">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge ${/open/i.test(ticket.status) ? "badge-amber" : "badge-emerald"}">${esc(ticket.status)}</span>
              <span style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted);">${esc(ticket.id)}</span>
            </div>
            <h3 class="modal-title" style="margin-top: 4px; color: var(--text-primary);">${esc(ticket.subject)}</h3>
          </div>
          <button class="btn-icon btn-ghost modal-close-btn" aria-label="Close">${getIconSvg("x", 20)}</button>
        </div>
        <div class="modal-body" style="display: flex; flex-direction: column; gap: 10px;">
          ${ticket.messages
            .map(
              (m) => `
            <div style="padding: 10px 14px; background: var(--bg-surface-2); border: 1px solid var(--border-medium); border-radius: var(--radius-xs);">
              <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-lime); margin-bottom: 4px;">
                <strong>${esc(m.author || m.sender)}</strong>
                <span style="color: var(--text-muted);">${esc(fmtDate(m.time))}</span>
              </div>
              <div style="font-size: 0.85rem; color: var(--text-primary); white-space: pre-wrap;">${esc(m.text)}</div>
            </div>`
            )
            .join("")}
        </div>
        <div class="modal-footer">
          <input type="text" id="ticket-reply-input" class="text-input" placeholder="Write a reply…" maxlength="5000" aria-label="Reply" />
          <button class="btn btn-primary" id="btn-send-ticket-reply">Send</button>
        </div>
      </div>`
    );
    modal.querySelector("#btn-send-ticket-reply").addEventListener("click", async () => {
      const text = modal.querySelector("#ticket-reply-input").value.trim();
      if (!text || !this.requireLive("reply to tickets")) return;
      try {
        const res = await this.app.api.replyToTicket(ticket.id, text);
        ticket.messages = res.messages;
        this.showTicketThreadModal(ticket);
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }
}
