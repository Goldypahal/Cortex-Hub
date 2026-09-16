/**
 * AI Component Store & Customization Platform
 * Application Core Bootstrap & Navigation Coordinator
 */

import { MarketplaceView } from "./views/marketplace-view.js";
import { PlaygroundView } from "./views/playground-view.js";
import { ConfiguratorView } from "./views/configurator-view.js";
import { CustomerView } from "./views/customer-view.js";
import { AdminView } from "./views/admin-view.js";
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
      customer: new CustomerView(this),
      admin: new AdminView(this)
    };
  }

  async init() {
    this.attachNavEvents();
    this.renderCurrentView();
    await this.syncDatabaseTelemetry();
  }

  async syncDatabaseTelemetry() {
    try {
      const health = await this.api.checkHealth();
      const tickerTag = document.querySelector(".system-status-ticker .ticker-left .ticker-item");
      if (tickerTag) {
        if (health.status === "ONLINE") {
          tickerTag.innerHTML = `SYS: <strong>ONLINE</strong> // POSTGRESQL 18 CONNECTED`;
        } else {
          tickerTag.innerHTML = `SYS: <strong>ONLINE</strong> // HYBRID LOCAL PERSISTENCE`;
        }
      }
      this.customizationRequests = await this.api.getCustomizationRequests();
    } catch {
      // Keep default
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
        if (role === "admin") {
          this.navigateTo("admin");
          showToast("Switched perspective to Platform Administrator", "info");
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
      const generatedLicenseKey = provisionedKey || `LIC-${item.componentId.toUpperCase().slice(0, 4)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

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
            <div style="display: flex; justify-content: center; gap: 10px;">
              <button class="btn btn-secondary btn-sm" id="btn-dl-invoice-checkout">
                ${getIconSvg("download", 13)} Download Invoice PDF (FR-4.4)
              </button>
              <button class="btn btn-primary btn-sm" id="btn-go-to-portal">
                Go to Customer Portal
              </button>
            </div>
          </div>
        </div>
      `;

      modal.querySelector("#btn-dl-invoice-checkout").addEventListener("click", () => {
        showToast("Invoice PDF generated and downloaded!", "success");
      });

      modal.querySelector("#btn-go-to-portal").addEventListener("click", () => {
        modal.classList.remove("active");
        this.navigateTo("customer");
      });
    });
  }
}

// Bootstrap application on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new Application();
  window.app.init();
});
