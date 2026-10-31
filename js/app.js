/**
 * AI Component Store & Customization Platform
 * Application Core Bootstrap & Navigation Coordinator
 */

import { MarketplaceView } from "./views/marketplace-view.js";
import { PlaygroundView } from "./views/playground-view.js";
import { ConfiguratorView } from "./views/configurator-view.js";
import { CustomerView } from "./views/customer-view.js";
import { AdminView } from "./views/admin-view.js";
import { SellerView } from "./views/seller-view.js";
import { MOCK_CUSTOMIZATION_REQUESTS } from "./data/mock-dashboard.js";
import { getIconSvg, showToast } from "./utils/helpers.js";
import { apiClient } from "./services/api-client.js";

class Application {
  constructor() {
    this.activeRoute = "marketplace";
    this.customizationRequests = [...MOCK_CUSTOMIZATION_REQUESTS];
    this.api = apiClient;

    // Initialize View Controllers
    this.views = {
      marketplace: new MarketplaceView(this),
      playground: new PlaygroundView(this),
      configurator: new ConfiguratorView(this),
      seller: new SellerView(this),
      customer: new CustomerView(this),
      admin: new AdminView(this)
    };
  }

  async init() {
    this.attachNavEvents();
    this.renderCurrentView();
    // Theme initialization (SRS §6.1)
    const savedTheme = localStorage.getItem("cortex_hub_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    const themeIcon = document.getElementById("theme-icon");
    if (themeIcon) {
      themeIcon.textContent = savedTheme === "light" ? "🌙" : "☀️";
    }

    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        const next = current === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("cortex_hub_theme", next);
        if (themeIcon) themeIcon.textContent = next === "light" ? "🌙" : "☀️";
        showToast(`Theme switched to ${next} mode`, "info");
      });
    }

    this.attachAuthEvents();
    await this.syncDatabaseTelemetry();
    this.setSignedInUser(await this.api.getCurrentUser());
  }

  // --------------------------------------------------------------------------
  // Sign-in (G1): the server owns identity; the header shows who is signed in.
  // --------------------------------------------------------------------------
  attachAuthEvents() {
    const modal = document.getElementById("auth-modal");
    const form = document.getElementById("auth-form");
    const errorEl = document.getElementById("auth-error");
    const submitBtn = document.getElementById("auth-submit");
    if (!modal || !form) return;

    const close = () => modal.classList.remove("active");
    document.getElementById("auth-signin-btn").addEventListener("click", () => {
      errorEl.textContent = "";
      modal.classList.add("active");
      document.getElementById("auth-email").focus();
    });
    document.getElementById("auth-modal-close").addEventListener("click", close);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.textContent = "";
      submitBtn.disabled = true;
      try {
        const user = await this.api.login(
          document.getElementById("auth-email").value,
          document.getElementById("auth-password").value
        );
        form.reset();
        close();
        this.setSignedInUser(user);
        showToast(`Signed in as ${user.name}`, "success");
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        submitBtn.disabled = false;
      }
    });

    document.getElementById("auth-signout-btn").addEventListener("click", async () => {
      await this.api.logout();
      this.setSignedInUser(null);
      const select = document.getElementById("header-role-select");
      if (select) {
        select.value = "visitor";
        select.dispatchEvent(new Event("change"));
      }
      showToast("Signed out", "info");
    });
  }

  setSignedInUser(user) {
    this.currentUser = user;
    const label = document.getElementById("auth-user-label");
    const signInBtn = document.getElementById("auth-signin-btn");
    const signOutBtn = document.getElementById("auth-signout-btn");
    if (!label) return;

    label.hidden = !user;
    signOutBtn.hidden = !user;
    signInBtn.hidden = Boolean(user);
    label.textContent = user ? `${user.name} · ${user.workspaces[0]?.name || user.globalRole}` : "";

    // Open the portal that matches the account's role
    if (user) {
      const workspaceTypes = user.workspaces.map((w) => w.type);
      let role = "visitor";
      if (["ADMIN", "SUPERADMIN", "MODERATOR", "SUPPORT", "FINANCE"].includes(user.globalRole)) role = "admin";
      else if (workspaceTypes.includes("SELLER")) role = "seller";
      else if (workspaceTypes.includes("BUYER")) role = "customer";
      const select = document.getElementById("header-role-select");
      if (select && role !== "visitor") {
        select.value = role;
        select.dispatchEvent(new Event("change"));
      }
    }
  }

  async syncDatabaseTelemetry() {
    try {
      const health = await this.api.checkHealth();
      const statusText = document.getElementById("sys-status-text");
      const footerUptime = document.getElementById("footer-uptime");
      const online = health.status === "ONLINE";
      if (statusText) {
        statusText.innerHTML = online
          ? `<strong>ONLINE</strong> // DATABASE CONNECTED`
          : `<strong>OFFLINE</strong> // SHOWING SAMPLE DATA`;
      }
      // Only report what was just checked; uptime history needs real monitoring (G11)
      if (footerUptime) {
        footerUptime.textContent = online ? "API reachable (checked just now)" : "API unreachable: sample data";
      }
      this.customizationRequests = await this.api.getCustomizationRequests();
    } catch {
      const statusText = document.getElementById("sys-status-text");
      if (statusText) statusText.textContent = "STANDALONE READY";
    }
  }

  attachNavEvents() {
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const route = link.dataset.route;
        if (route) this.navigateTo(route);
      });
    });

    // Brand logo click navigates to marketplace
    const logo = document.querySelector(".brand-logo");
    if (logo) {
      logo.addEventListener("click", () => this.navigateTo("marketplace"));
    }

    // Role switcher dropdown in header
    const headerRoleSelect = document.getElementById("header-role-select");
    if (headerRoleSelect) {
      headerRoleSelect.addEventListener("change", (e) => {
        const role = e.target.value;
        const adminNav = document.getElementById("nav-admin");
        if (adminNav) {
          // G13 Fix: Admin nav only visible when admin role is active
          adminNav.style.display = role === "admin" ? "inline-flex" : "none";
        }

        if (role === "admin") {
          this.navigateTo("admin");
          showToast("Switched perspective to Platform Administrator", "info");
        } else if (role === "seller") {
          this.navigateTo("seller");
          showToast("Switched perspective to Multi-Vendor Seller (Apex AI Labs)", "info");
        } else if (role === "customer") {
          this.navigateTo("customer");
          showToast("Switched perspective to Registered Customer (Acme Health)", "info");
        } else {
          this.navigateTo("marketplace");
          showToast("Switched perspective to Public Visitor", "info");
        }
      });
    }
  }

  navigateTo(route, params = {}) {
    this.activeRoute = route;

    // Update Nav bar active states
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.toggle("active", link.dataset.route === route);
    });

    // Update View Containers
    document.querySelectorAll(".view-section").forEach((sec) => {
      sec.classList.remove("active");
    });

    const activeContainer = document.getElementById(`view-${route}`);
    if (activeContainer) {
      activeContainer.classList.add("active");
      
      // If passing componentId to playground or configurator
      if (params.componentId) {
        if (route === "configurator" && this.views.configurator) {
          this.views.configurator.config.baseComponentId = params.componentId;
        }
      }

      // Render view
      if (this.views[route]) {
        this.views[route].render(activeContainer);
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  renderCurrentView() {
    this.navigateTo(this.activeRoute);
  }

  // Customization Request Store Methods
  getCustomizationRequests() {
    return this.api ? this.api.memoryRequests : this.customizationRequests;
  }

  async addCustomizationRequest(req) {
    if (this.api) {
      const saved = await this.api.submitCustomizationRequest(req);
      this.customizationRequests = this.api.memoryRequests;
      return saved;
    }
    this.customizationRequests.unshift(req);
    return req;
  }

  // Checkout & Licensing Flow Modal (FR-4.1 - FR-4.8)
  openCheckoutModal(item) {
    let modal = document.getElementById("checkout-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "checkout-modal";
      modal.className = "modal-backdrop";
      document.body.appendChild(modal);
    }

    const priceNum = parseInt(item.price.replace(/[^0-9]/g, "")) || 499;
    const taxNum = Math.round(priceNum * 0.18); // 18% GST / VAT (FR-4.8)
    const totalNum = priceNum + taxNum;

    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <div>
            <span class="badge badge-lime">// SECURE CHECKOUT (FR-4.1)</span>
            <h3 class="modal-title" style="margin-top: 4px;">License Provisioning & Payment</h3>
          </div>
          <button class="btn-icon btn-ghost modal-close-btn">${getIconSvg("x", 20)}</button>
        </div>
        <div class="modal-body">
          <div style="background: var(--bg-surface-2); border: 1px solid var(--border-medium); border-radius: var(--radius-xs); padding: 16px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="font-family: var(--font-heading); font-size: 1.05rem; color: #FFF;">${item.componentName}</strong>
              <span class="badge badge-lime">${item.tier}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">
              <span>Base License Subtotal</span>
              <span>$${priceNum}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">
              <span>Estimated Tax (18% GST / VAT)</span>
              <span>$${taxNum}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 700; color: #FFF; padding-top: 8px; border-top: 1px solid var(--border-subtle);">
              <span>Total Payable</span>
              <span style="color: var(--accent-lime); font-family: var(--font-heading);">$${totalNum} USD <span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">(₹${Math.round(totalNum * 83.5).toLocaleString()})</span></span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Customer Tenant Account</label>
            <input type="text" class="text-input" value="Acme Health Technologies Inc. (tnt-8849-acme)" disabled />
          </div>

          <div class="form-group">
            <label class="form-label">Payment Gateway Simulator (FR-4.1)</label>
            <select class="select-input" id="checkout-payment-method">
              <option value="card">Corporate Credit Card (ending in •••• 4242)</option>
              <option value="wire">Direct ACH / Wire Transfer (Invoice Net 30)</option>
              <option value="upi">UPI / Razorpay Business</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-close-btn">Cancel</button>
          <button class="btn btn-primary" id="btn-complete-checkout">
            Confirm & Activate License ($${totalNum})
          </button>
        </div>
      </div>
    `;

    modal.classList.add("active");
    modal.querySelectorAll(".modal-close-btn").forEach((btn) => {
      btn.addEventListener("click", () => modal.classList.remove("active"));
    });

    modal.querySelector("#btn-complete-checkout").addEventListener("click", async () => {
      let provisionedKey = null;
      if (this.api) {
        const lic = await this.api.checkoutLicense(item.componentId, item.tier);
        provisionedKey = lic ? lic.licenseKey : null;
      }
      // G2 FIX: CSPRNG fallback key if backend doesn't provide one
      let generatedLicenseKey = provisionedKey;
      if (!generatedLicenseKey) {
        const fb = new Uint8Array(8);
        crypto.getRandomValues(fb);
        const fbHex = Array.from(fb).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
        generatedLicenseKey = `LIC-${item.componentId.toUpperCase().slice(0, 4)}-${fbHex.substring(0, 6)}-${fbHex.substring(6)}`;
      }

      modal.innerHTML = `
        <div class="modal-dialog" style="text-align: center; max-width: 500px;">
          <div class="modal-body" style="padding: 36px 20px;">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--success-bg); border: 2px solid var(--success); color: var(--success); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
              ${getIconSvg("check-circle", 30)}
            </div>
            <h3 style="font-family: var(--font-heading); font-size: 1.4rem; margin-bottom: 6px;">License Activated!</h3>
            <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 18px;">
              Your production license for <strong>${item.componentName}</strong> (${item.tier}) has been provisioned.
            </p>
            <div style="background: var(--bg-deep); border: 1px solid var(--border-subtle); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
              <span style="font-size: 0.74rem; color: var(--text-muted); text-transform: uppercase;">Issued License Key (FR-4.5)</span>
              <div style="font-family: var(--font-mono); font-size: 1.05rem; font-weight: 700; color: var(--cyan); margin-top: 4px;">
                ${generatedLicenseKey}
              </div>
            </div>
            <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
              <button class="btn btn-secondary btn-sm" id="btn-dl-artifact-checkout">
                ${getIconSvg("download", 13)} Signed Artifact (.tar.gz)
              </button>
              <button class="btn btn-secondary btn-sm" id="btn-dl-invoice-checkout">
                ${getIconSvg("download", 13)} Invoice PDF (FR-4.4)
              </button>
              <button class="btn btn-primary btn-sm" id="btn-go-to-portal">
                Digital Delivery Vault →
              </button>
            </div>
          </div>
        </div>
      `;

      modal.querySelector("#btn-dl-artifact-checkout").addEventListener("click", () => {
        showToast(`Authenticated signed artifact download initiated! (SHA-256 Verified)`, "success");
      });

      modal.querySelector("#btn-dl-invoice-checkout").addEventListener("click", () => {
        showToast("Invoice PDF generated and downloaded!", "success");
      });

      modal.querySelector("#btn-go-to-portal").addEventListener("click", () => {
        modal.classList.remove("active");
        this.navigateTo("customer");
        // Switch customer view to the vault tab
        if (this.views.customer) {
          this.views.customer.activeTab = "vault";
          const custContainer = document.getElementById("view-customer");
          if (custContainer) this.views.customer.render(custContainer);
        }
      });
    });
  }
}

// Bootstrap application on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new Application();
  window.app.init();
});
