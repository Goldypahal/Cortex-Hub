# Cortex Hub // Enterprise AI Component Store & Customization Fabric

> Production-ready, deterministic AI engines with exact document byte-offset citations, hybrid vector retrieval, and sovereign VPC / air-gapped deployment.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Status: Online](https://img.shields.io/badge/Platform-Online-00ff66.svg)](#)
[![Compliance: SOC2/DPDP](https://img.shields.io/badge/Compliance-DPDP%20%2F%20GDPR-cyan.svg)](#)

---

## ⚡ Overview

**Cortex Hub** is a multi-tenant enterprise marketplace and SaaS system that enables organizations to discover, trial, customize, license, and deploy production-ready AI components. 

Unlike generic chatbot wrappers, Cortex Hub provides verified retrieval pipelines, hallucination guardrails, and deterministic grounding designed for high-stakes industries (Healthcare, Legal, Financial Services, Enterprise HR).

---

## 🏛️ Platform Architecture

The platform is structured across three core planes:

```
+-------------------------------------------------------------------------+
|                         CORTEX HUB PLATFORM                             |
+-------------------------------------------------------------------------+
       |                                                 |
[Customer-Facing Plane]                           [Admin Plane]
├── Catalog & Bento Grid (10 Engines)            ├── Customization Kanban
├── Interactive Live Sandbox                     ├── Scope Review Drawer
├── BOM Architecture Configurator               ├── Catalog CRUD Matrix
├── Tenant Customer Portal                       ├── Multi-Cluster Deployments
└── Licensing & Checkout Flow                    └── Revenue BI & Churn Telemetry
       |                                                 |
       +-----------------------+-------------------------+
                               |
                      [AI Services Plane]
                      ├── Hybrid pgvector Dense + BM25 Lexical
                      ├── Cross-Encoder Re-Ranking Router
                      ├── Strict Byte-Offset Citation Engine
                      ├── Multi-Tenant Row-Level Isolation (RLS)
                      └── Sovereign VPC / Air-Gapped Deployments
```

---

## 🚀 Key Modules & Capabilities

### 1. Catalog & Marketplace (`FR-1.1 – FR-1.6`)
* **10 Verified Production Engines**:
  * Enterprise RAG Chatbot (Hybrid vector, cited Q&A)
  * AI Customer Support Agent (Omnichannel web/WhatsApp, CRM sync)
  * Resume Screening & Match Engine (Semantic ontology, bias anonymization)
  * Smart Contract & Legal Due Diligence Engine (Clause risk extraction)
  * Financial Report & Earnings Call Analyzer (XBRL & table parsing)
  * Clinical Protocol & Healthcare Scribe (HIPAA/FHIR compliant)
  * SQL & Internal Database Agent (Text-to-SQL with schema guardrails)
  * Autonomous Code Reviewer & Security Auditor (CWE/OWASP scanning)
  * Multi-Agent Workflow Orchestrator (DAG-based autonomous agents)
  * Enterprise Document OCR & Entity Extraction (Invoice/ID parser)
* Dynamic search, category/industry filters, architecture flowcharts, pricing tiers, and copy-ready SDK snippets (Python & cURL).

### 2. Live AI Sandbox (`FR-2.1 – FR-2.9`)
* Split-pane IDE workspace for direct model testing.
* Knowledge base dropzone (PDF/DOCX) with ephemeral memory auto-purged on session end.
* Pre-loaded compliance test scenarios (Clinical trial protocol, Enterprise SaaS SLA, Form 10-K).
* Real-time streaming response simulation with exact document citations, confidence metrics, token counts, cost breakdown, and latency telemetry.

### 3. Architecture Configurator & BOM Calculator (`FR-3.1 – FR-3.8`)
* 6-phase engineering pipeline wizard:
  1. **Domain Selection** (Healthcare, Legal, Fintech, EdTech, GovTech)
  2. **Data Ingestion** (PDF/DOCX, Postgres, S3, Snowflake, Confluence)
  3. **Zero-Trust Auth** (SAML/Okta, OAuth 2.0, Cognito, API Keys)
  4. **Sovereign Deployment** (Multi-tenant Cloud, Private VPC, On-Premise Air-Gapped)
  5. **White-Label Branding** (Colors, custom avatar, custom system prompts)
  6. **Feature Toggles** (Citations, guardrails, analytics, multilingual, human handoff)
* Real-time dynamic Bill-of-Materials (BOM) engine calculating estimated costs in **USD & INR** along with target delivery timelines.
* Customization request dispatch and tracking.

### 4. Tenant Customer Portal (`FR-5.1 – FR-5.8`)
* Organization identity & cluster health telemetry.
* Masked API key generator, rotator, and revocation controls.
* Daily token & inference usage charts.
* Active customization request audit log and timeline tracker.
* Integrated support desk.

### 5. Platform Admin Operations Desk (`FR-6.1 – FR-6.8`)
* Role-based access control (Platform Admin, Support Agent, Billing Admin).
* 5-column Customization Request Kanban board (`Submitted` → `Under Review` → `Quoted` → `In Progress` → `Delivered`).
* Architectural Scope Review drawer for quoting and advancing sprint tickets.
* Catalog CRUD management and versioning.
* Revenue BI analytics (MRR, product revenue breakdown, churn).
* Deployment matrix across AWS, GCP, Azure, and On-Prem clusters.

### 6. Checkout & Licensing (`FR-4.1 – FR-4.8`)
* Secure checkout modal with automated 18% GST/VAT calculation.
* Payment gateway simulator (Credit Card, Wire Transfer, UPI).
* Instant cryptographic license key generation (`LIC-XXXX-XXXXXX`).
* Invoice receipt generator.

---

## 🛠️ Tech Stack

* **Frontend:** Vanilla HTML5, Modern Modular JavaScript (ES Modules), Custom Vanilla CSS (Design tokens, Bricolage Grotesque, Space Grotesk, JetBrains Mono).
* **Styling Principles:** Strict precision dark-mode design system, tactical data density, no generic framework overhead.
* **Architecture:** Component-driven MVC pattern (`js/views/`, `js/data/`, `js/utils/`).

---

## 💻 Local Development

### Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher)

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/Goldypahal/Cortex-Hub.git
   cd Cortex-Hub
   ```

2. Start the local development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 📄 Documentation

For full functional specifications and requirements, see [`capstone.md`](./capstone.md).

---

## 📜 License

This project is licensed under the [MIT License](./package.json).
