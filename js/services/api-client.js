/**
 * Cortex Hub - API Client Service
 * Communicates with the Express REST API and PostgreSQL database
 * Includes transparent in-memory fallback if the backend is unreachable.
 */

import { CATALOG_COMPONENTS } from "../data/catalog-data.js";
import {
  MOCK_TENANT,
  MOCK_LICENSES,
  MOCK_API_KEYS,
  MOCK_CUSTOMIZATION_REQUESTS,
  MOCK_SUPPORT_TICKETS
} from "../data/mock-dashboard.js";

const API_BASE = "http://localhost:5000/api";

class ApiClient {
  constructor() {
    this.isBackendOnline = false;
    this.memoryRequests = [...MOCK_CUSTOMIZATION_REQUESTS];
    this.memoryLicenses = [...MOCK_LICENSES];
    this.memoryApiKeys = [...MOCK_API_KEYS];
    this.memoryTickets = [...MOCK_SUPPORT_TICKETS];
  }

  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        this.isBackendOnline = data.status === "ONLINE";
        return data;
      }
    } catch {
      this.isBackendOnline = false;
    }
    return { status: "OFFLINE", database: "Local In-Memory Mode" };
  }

  // ------------------------------------------------------------------------
  // Components
  // ------------------------------------------------------------------------
  async getComponents() {
    try {
      const res = await fetch(`${API_BASE}/components`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return CATALOG_COMPONENTS;
  }

  // ------------------------------------------------------------------------
  // Customization Requests
  // ------------------------------------------------------------------------
  async getCustomizationRequests() {
    try {
      const res = await fetch(`${API_BASE}/customization-requests`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return this.memoryRequests;
  }

  async submitCustomizationRequest(payload) {
    try {
      const res = await fetch(`${API_BASE}/customization-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        this.memoryRequests.unshift(created);
        return created;
      }
    } catch {
      // Fallback
    }
    this.memoryRequests.unshift(payload);
    return payload;
  }

  async updateCustomizationRequest(id, updatePayload) {
    try {
      const res = await fetch(`${API_BASE}/customization-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload)
      });
      if (res.ok) {
        const updated = await res.json();
        const idx = this.memoryRequests.findIndex((r) => r.id === id);
        if (idx !== -1) this.memoryRequests[idx] = updated;
        return updated;
      }
    } catch {
      // Fallback
    }

    const req = this.memoryRequests.find((r) => r.id === id);
    if (req) {
      if (updatePayload.status) req.status = updatePayload.status;
      if (updatePayload.statusStep) req.statusStep = updatePayload.statusStep;
      if (updatePayload.estimatedPrice) req.estimatedPrice = updatePayload.estimatedPrice;
      if (updatePayload.timelineEvent) {
        req.timelineLog = req.timelineLog || [];
        req.timelineLog.unshift({
          date: new Date().toISOString().split("T")[0],
          event: updatePayload.timelineEvent
        });
      }
      return req;
    }
    return null;
  }

  // ------------------------------------------------------------------------
  // Tenant & Licenses
  // ------------------------------------------------------------------------
  async getTenant() {
    try {
      const res = await fetch(`${API_BASE}/tenant`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return MOCK_TENANT;
  }

  async getLicenses() {
    try {
      const res = await fetch(`${API_BASE}/licenses`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return this.memoryLicenses;
  }

  async checkoutLicense(componentId, tier) {
    try {
      const res = await fetch(`${API_BASE}/licenses/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentId, tier })
      });
      if (res.ok) {
        const data = await res.json();
        this.memoryLicenses.push(data.license);
        return data.license;
      }
    } catch {
      // Fallback
    }

    const key = `LIC-${componentId.toUpperCase().slice(0, 4)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newLic = {
      id: `lic_${Date.now()}`,
      componentId,
      tier: tier || "Starter",
      licenseKey: key,
      status: "ACTIVE",
      clusterTarget: "Dedicated VPC (AWS us-east-1)",
      rateLimit: "1,000 req/min",
      startDate: new Date().toISOString().split("T")[0]
    };
    this.memoryLicenses.push(newLic);
    return newLic;
  }

  // ------------------------------------------------------------------------
  // API Keys
  // ------------------------------------------------------------------------
  async getApiKeys() {
    try {
      const res = await fetch(`${API_BASE}/api-keys`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return this.memoryApiKeys;
  }

  async createApiKey(name, environment) {
    try {
      const res = await fetch(`${API_BASE}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, environment })
      });
      if (res.ok) {
        const key = await res.json();
        this.memoryApiKeys.unshift(key);
        return key;
      }
    } catch {
      // Fallback
    }

    const newKey = {
      id: `key-${Math.floor(100 + Math.random() * 900)}`,
      name: name || "Production Cluster Key",
      prefix: `ctx_${environment === "Staging" ? "test" : "live"}_${Math.random().toString(36).substring(2, 8)}••••••••`,
      environment: environment || "Production",
      status: "ACTIVE",
      monthlySpend: 0.0,
      lastUsed: "Just now"
    };
    this.memoryApiKeys.unshift(newKey);
    return newKey;
  }

  async revokeApiKey(id) {
    try {
      const res = await fetch(`${API_BASE}/api-keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        const k = this.memoryApiKeys.find((item) => item.id === id);
        if (k) k.status = "REVOKED";
        return true;
      }
    } catch {
      // Fallback
    }

    const k = this.memoryApiKeys.find((item) => item.id === id);
    if (k) k.status = "REVOKED";
    return true;
  }

  // ------------------------------------------------------------------------
  // Support Tickets
  // ------------------------------------------------------------------------
  async getTickets() {
    try {
      const res = await fetch(`${API_BASE}/tickets`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return this.memoryTickets;
  }

  async createTicket(payload) {
    try {
      const res = await fetch(`${API_BASE}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        this.memoryTickets.unshift(created);
        return created;
      }
    } catch {
      // Fallback
    }

    const newTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: payload.subject,
      priority: payload.priority || "MEDIUM",
      status: "OPEN",
      lastActivity: "Just now",
      messages: [
        {
          sender: "Customer",
          author: "Dr. Sarah Chen",
          time: "Just now",
          text: payload.message || "Ticket logged."
        }
      ]
    };
    this.memoryTickets.unshift(newTicket);
    return newTicket;
  }
}

export const apiClient = new ApiClient();
