# Cortex Hub // Enterprise AI Component Store & Customization Fabric

> Production-ready, deterministic AI engines with exact document byte-offset citations, hybrid vector retrieval, and sovereign VPC / air-gapped deployment.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> **Status:** pre-launch (SRS v3.0, Phase 0 to 1). Orders, licences, invoices, seller wallets, payouts and moderation are stored in PostgreSQL. Checkout takes real payments through Razorpay once keys are configured (otherwise a labelled test payment, never in production). The live sandbox answers with Claude once `ANTHROPIC_API_KEY` is set. Catalog telemetry (uptime, latency, eval scores) is still sample data, and no compliance certification has been issued.

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

* **Database & ORM:** PostgreSQL 18, Prisma ORM (`@prisma/client`), pgvector ready.
* **Backend:** Node.js, Express REST API, CORS, Dotenv.
* **Frontend:** Vanilla HTML5, Modern Modular JavaScript (ES Modules), Custom Vanilla CSS (Design tokens, Bricolage Grotesque, Space Grotesk, JetBrains Mono).
* **Styling Principles:** Strict precision dark-mode design system, tactical data density, zero framework bloat.
* **Architecture:** Component-driven MVC pattern (`js/views/`, `js/data/`, `js/utils/`, `server/`).

---

## 💻 Local Development

### Prerequisites
* [Node.js](https://nodejs.org/) (v20 or higher)
* [PostgreSQL](https://www.postgresql.org/) (Local instance or cloud provider like Supabase/Neon)

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/Goldypahal/Cortex-Hub.git
   cd Cortex-Hub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Copy `.env.example` to `.env` and set your PostgreSQL connection string:
   ```bash
   DATABASE_URL="postgresql://postgres:<password>@localhost:5432/cortex_hub"
   ```
   Optionally set `SEED_DEMO_PASSWORD` to choose the demo accounts' password.

4. Create the schema & seed the database:
   ```bash
   # Apply versioned migrations (server/prisma/migrations)
   npm run db:migrate:deploy

   # Seed 10 AI engines, sample tenant data and demo accounts
   npm run db:seed
   ```
   The seed creates three demo accounts: `buyer@acme-health.test`, `seller@apex-ai.test` and `admin@cortex-hub.test`. If `SEED_DEMO_PASSWORD` is empty, it prints a generated password once.

5. Start the application (one Express server serves the site and the API under `/api`):
   ```bash
   npm start        # or: npm run dev (restarts on file changes)
   ```

6. Open http://localhost:5000 and use **Sign in** with a demo account.

7. Run the API tests (they need `DATABASE_URL` pointing at a migrated, seeded database and `SEED_DEMO_PASSWORD` set to the demo password):
   ```bash
   npm test
   ```

### Payments (Razorpay)

Checkout settles in INR with 18% GST. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` in `.env`, and register `https://<your-domain>/api/webhooks/razorpay` in the Razorpay dashboard for `payment.captured` and `order.paid`. A purchase is fulfilled once, whether the browser confirmation or the webhook arrives first: it records the payment, issues the licence (key shown once, stored hashed), writes a GST invoice and credits the seller's wallet minus the platform commission. Without keys and outside production, checkout completes with a clearly labelled simulated payment.

Monthly plans cover 30 days and are renewed by purchasing again; automatic renewal (Razorpay Subscriptions) is not built yet. Seller payouts are requested in Seller Studio after a 7-day hold and KYC, and are marked paid by a finance admin after the bank transfer.

### Live sandbox

Set `ANTHROPIC_API_KEY` (and optionally `SANDBOX_MODEL`, default `claude-opus-5-5`). Visitors get 20 runs a day and signed-in users 100. Uploaded PDFs and text files are sent to the model for that one request and never stored. Without a key, the sandbox shows recorded sample answers labelled as such.

### Access control

| Area | Who can use it |
| --- | --- |
| Catalog read (`GET /api/components`), health, seller profiles | Anyone |
| Checkout, orders, licences, invoices, API keys, usage, tickets, customization requests | Signed-in members of a buyer workspace (their own data only) |
| Seller dashboard, product submission, payout requests | Signed-in members of a seller workspace (their own data only) |
| Moderation | Moderators and admins |
| Revenue, payout processing | Finance and admins |
| Catalog and price changes, commission rate, Twilio messaging | Admins (support can also send notifications and update customization requests) |

---

## 📄 Documentation

For full functional specifications and requirements, see [`srs.md`](./srs.md) and [`capstone.md`](./capstone.md).

---

## 📜 License

This project is licensed under the [MIT License](./package.json).
