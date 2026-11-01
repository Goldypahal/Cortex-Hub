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
import { escapeHtml, getIconSvg, showToast } from "./utils/helpers.js";
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
    this.api.setCurrentUser(user);
    this.refreshCustomizationRequests();
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
        if (route === "playground" && this.views.playground) {
          this.views.playground.componentId = params.componentId;
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
    return this.customizationRequests;
  }

  async refreshCustomizationRequests() {
    try {
      this.customizationRequests = await this.api.getCustomizationRequests();
    } catch {
      this.customizationRequests = this.api.memoryRequests;
    }
    return this.customizationRequests;
  }

  async addCustomizationRequest(req) {
    const saved = await this.api.submitCustomizationRequest(req);
    await this.refreshCustomizationRequests();
    return saved;
  }

  // Checkout & Licensing Flow Modal (FR-4.1 - FR-4.8)
  checkoutModal(html) {
    let modal = document.getElementById("checkout-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "checkout-modal";
      modal.className = "modal-backdrop";
      document.body.appendChild(modal);
    }
    modal.innerHTML = `<div class="modal-dialog" style="max-width: 560px;">${html}</div>`;
    modal.classList.add("active");
    modal
      .querySelectorAll(".modal-close-btn")
      .forEach((btn) => btn.addEventListener("click", () => modal.classList.remove("active")));
    return modal;
  }

  async openCheckoutModal(item) {
    const header = (title) => `
      <div class="modal-header">
        <h3 class="modal-title" style="color: var(--text-primary);">${escapeHtml(title)}</h3>
        <button class="btn-icon btn-ghost modal-close-btn" aria-label="Close">${getIconSvg("x", 20)}</button>
      </div>`;

    if (!this.api.hasWorkspace("BUYER")) {
      const modal = this.checkoutModal(`${header("Sign in to buy")}
        <div class="modal-body"><p style="color: var(--text-secondary);">Purchases are made by a buyer workspace. Sign in with a buyer account to buy <strong>${escapeHtml(item.componentName)}</strong>.</p></div>
        <div class="modal-footer"><button class="btn btn-secondary modal-close-btn">Cancel</button><button class="btn btn-primary" id="btn-checkout-signin">Sign in</button></div>`);
      modal.querySelector("#btn-checkout-signin").addEventListener("click", () => {
        modal.classList.remove("active");
        document.getElementById("auth-signin-btn").click();
      });
      return;
    }

    let prices;
    let config;
    try {
      [prices, config] = await Promise.all([this.api.getProductPrices(item.componentId), this.api.getCheckoutConfig()]);
    } catch (err) {
      this.checkoutModal(
        `${header("Checkout unavailable")}<div class="modal-body"><p>${escapeHtml(err.message)}</p></div>`
      );
      return;
    }
    const buyable = prices.prices.filter((p) => p.model !== "CUSTOM");
    if (config.provider === "unavailable" || buyable.length === 0) {
      this.checkoutModal(
        `${header("Checkout unavailable")}<div class="modal-body"><p style="color: var(--text-secondary);">${
          buyable.length === 0
            ? "This product is quoted on request. Use the configurator to request a quote."
            : "Payments are not configured on this server yet."
        }</p></div>`
      );
      return;
    }

    const selected = buyable.find((p) => p.tier === item.tier) || buyable[0];
    const gstPct = Math.round(prices.gstRate * 100);
    const fmt = (minor) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(minor / 100);
    const totals = (p) => {
      const tax = Math.round(p.amountMinor * prices.gstRate);
      return { sub: fmt(p.amountMinor), tax: fmt(tax), total: fmt(p.amountMinor + tax) };
    };
    const t = totals(selected);

    const modal = this.checkoutModal(`${header(`Buy ${item.componentName}`)}
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label" for="checkout-tier">Plan</label>
          <select class="select-input" id="checkout-tier">
            ${buyable.map((p) => `<option value="${escapeHtml(p.tier)}" ${p.tier === selected.tier ? "selected" : ""}>${escapeHtml(p.tier)}: ${escapeHtml(p.formatted)}${p.model === "SUBSCRIPTION" ? " / month" : ""}</option>`).join("")}
          </select>
        </div>
        <div style="background: var(--bg-surface-2); border: 1px solid var(--border-medium); padding: 14px; font-family: var(--font-mono); font-size: 0.85rem; display: grid; gap: 6px;">
          <div style="display: flex; justify-content: space-between;"><span>Subtotal</span><span id="co-sub">${t.sub}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>GST (${gstPct}%)</span><span id="co-tax">${t.tax}</span></div>
          <div style="display: flex; justify-content: space-between; font-weight: 700; padding-top: 6px; border-top: 1px solid var(--border-subtle);"><span>Total</span><span id="co-total">${t.total}</span></div>
        </div>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 10px;">
          ${config.provider === "razorpay" ? "You will pay securely in Razorpay Checkout (cards, UPI, netbanking). Card details never reach Cortex Hub." : "<strong>Test mode:</strong> payments are not configured on this server, so this order is completed with a simulated payment and no money is taken."}
          Monthly plans cover 30 days; renew by purchasing again.
        </p>
        <p id="co-error" role="alert" style="color: var(--status-error); font-size: 0.85rem; min-height: 1.2em;"></p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close-btn">Cancel</button>
        <button class="btn btn-primary" id="btn-complete-checkout">${config.provider === "razorpay" ? "Continue to payment" : "Complete test purchase"}</button>
      </div>`);

    const tierSelect = modal.querySelector("#checkout-tier");
    tierSelect.addEventListener("change", () => {
      const p = buyable.find((x) => x.tier === tierSelect.value);
      const nt = totals(p);
      modal.querySelector("#co-sub").textContent = nt.sub;
      modal.querySelector("#co-tax").textContent = nt.tax;
      modal.querySelector("#co-total").textContent = nt.total;
    });

    const idempotencyKey = crypto.randomUUID();
    const payBtn = modal.querySelector("#btn-complete-checkout");
    const errorEl = modal.querySelector("#co-error");
    payBtn.addEventListener("click", async () => {
      payBtn.disabled = true;
      errorEl.textContent = "";
      try {
        const order = await this.api.startCheckout(item.componentId, tierSelect.value, idempotencyKey);
        if (order.provider === "razorpay") {
          await this.payWithRazorpay(order, modal, item);
        } else {
          this.showCheckoutResult(await this.api.confirmCheckout(order.orderId), item);
        }
      } catch (err) {
        errorEl.textContent = err.message;
        payBtn.disabled = false;
      }
    });
  }

  loadRazorpayScript() {
    if (window.Razorpay) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = resolve;
      script.onerror = () => reject(new Error("Could not load Razorpay Checkout"));
      document.head.appendChild(script);
    });
  }

  async payWithRazorpay(order, modal, item) {
    await this.loadRazorpayScript();
    modal.classList.remove("active");
    const rzp = new window.Razorpay({
      key: order.razorpay.keyId,
      amount: order.razorpay.amount,
      currency: order.razorpay.currency,
      name: order.razorpay.name,
      description: order.razorpay.description,
      order_id: order.razorpay.orderId,
      prefill: order.razorpay.prefill,
      handler: async (response) => {
        try {
          this.showCheckoutResult(await this.api.confirmCheckout(order.orderId, response), item);
        } catch (err) {
          showToast(
            `Payment received but confirmation failed: ${err.message}. Your licence will appear once the payment webhook arrives.`,
            "error"
          );
        }
      },
      modal: { ondismiss: () => showToast("Payment cancelled.", "info") }
    });
    rzp.on("payment.failed", (resp) =>
      showToast(`Payment failed: ${resp.error?.description || "unknown error"}`, "error")
    );
    rzp.open();
  }

  showCheckoutResult(result, item) {
    const keys = result.licenseKeys || [];
    const modal = this.checkoutModal(`
      <div class="modal-body" style="text-align: center; padding: 32px 20px;">
        <div style="width: 56px; height: 56px; border-radius: 50%; border: 2px solid var(--success); color: var(--success); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          ${getIconSvg("check-circle", 30)}
        </div>
        <h3 style="font-family: var(--font-heading); font-size: 1.3rem; margin-bottom: 6px;">Licence activated</h3>
        <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 16px;">
          ${escapeHtml(item.componentName)} is now in your workspace${result.simulatedPayment ? " (test purchase, no money taken)" : ""}.
        </p>
        ${
          keys.length
            ? keys
                .map(
                  (
                    k
                  ) => `<div style="background: var(--bg-deep); border: 1px solid var(--border-subtle); padding: 12px; margin-bottom: 12px; text-align: left;">
            <span style="font-size: 0.74rem; color: var(--text-muted); text-transform: uppercase;">Licence key (shown once, store it now)</span>
            <code style="display: block; font-family: var(--font-mono); font-size: 0.95rem; margin-top: 4px; word-break: break-all;">${escapeHtml(k.licenseKey)}</code>
          </div>`
                )
                .join("")
            : `<p style="font-size: 0.82rem; color: var(--text-secondary);">Your key was already issued. Rotate it from the buyer portal to get a new one.</p>`
        }
        <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
          ${keys.length ? `<button class="btn btn-secondary btn-sm" id="btn-copy-licence">Copy key</button>` : ""}
          <button class="btn btn-secondary btn-sm" id="btn-dl-invoice-checkout">${getIconSvg("download", 13)} Invoice</button>
          <button class="btn btn-primary btn-sm" id="btn-go-to-portal">Go to buyer portal →</button>
        </div>
      </div>`);

    const copyBtn = modal.querySelector("#btn-copy-licence");
    if (copyBtn)
      copyBtn.addEventListener("click", () =>
        navigator.clipboard
          .writeText(keys.map((k) => k.licenseKey).join("\n"))
          .then(() => showToast("Copied", "success"))
      );
    modal
      .querySelector("#btn-dl-invoice-checkout")
      .addEventListener("click", () =>
        window.open(`/api/invoices/${encodeURIComponent(result.orderId)}`, "_blank", "noopener")
      );
    modal.querySelector("#btn-go-to-portal").addEventListener("click", () => {
      modal.classList.remove("active");
      this.views.customer.activeTab = "overview";
      this.navigateTo("customer");
    });
  }
}

// Bootstrap application on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new Application();
  window.app.init();
});
