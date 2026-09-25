/**
 * AI Component Store & Customization Platform
 * Mock Customer, Seller & Admin Operational Dashboard Data
 * Aligned with SRS v2.0 Multi-Vendor Marketplace Specifications
 */

// ----------------------------------------------------------------------------
// 1. ENTERPRISE BUYER PERSPECTIVE (Acme Health Technologies Inc.)
// ----------------------------------------------------------------------------
export const MOCK_TENANT = {
  id: "tnt-8849-acme",
  name: "Acme Health Technologies Inc.",
  industry: "Healthcare & Life Sciences",
  tier: "Enterprise Tier 2",
  role: "Buyer",
  planRenewalDate: "Nov 15, 2026",
  monthlySpend: 4250,
  spendFormatted: "$4,250",
  monthlyTokenQuota: 10000000,
  monthlyTokensUsed: 6420000,
  activeLicensesCount: 2,
  openRequestsCount: 3,
  supportTicketsOpen: 1
};

export const MOCK_LICENSES = [
  {
    id: "lic-rag-091",
    componentId: "rag-chatbot",
    componentName: "Enterprise RAG Chatbot",
    version: "v1.3.2",
    tier: "Advanced Tier",
    status: "Active",
    startDate: "May 12, 2026",
    renewalDate: "May 12, 2027",
    monthlyPrice: "$1,299/mo",
    quotaUsed: "68%",
    rateLimit: "100 req/sec",
    env: "Dedicated AWS VPC (us-east-1)"
  },
  {
    id: "lic-doc-044",
    componentId: "doc-analyzer",
    componentName: "AI Document Analyzer & Extractor",
    version: "v2.0.1",
    tier: "Professional Tier",
    status: "Active",
    startDate: "Jul 01, 2026",
    renewalDate: "Jul 01, 2027",
    monthlyPrice: "$1,999/mo",
    quotaUsed: "42%",
    rateLimit: "50 req/sec",
    env: "Multi-tenant Cloud"
  }
];

export const MOCK_BUYER_ENTITLEMENTS = [
  {
    id: "ent-rag-091",
    componentId: "rag-chatbot",
    componentName: "Enterprise RAG Chatbot",
    sellerName: "Apex AI Labs",
    version: "v1.3.2",
    tier: "Advanced Tier",
    licenseKey: "LIC-RAG-894A-91FC",
    downloadAllowed: true,
    downloadUrl: "https://artifacts.cortex-hub.io/signed/rag-chatbot-v1.3.2-prod.tar.gz?token=exp17982",
    fileSize: "1.42 GB",
    checksumSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    apiQuota: "1,000,000 reqs/mo",
    apiUsed: "642,000 reqs",
    purchasedDate: "May 12, 2026"
  },
  {
    id: "ent-doc-044",
    componentId: "doc-analyzer",
    componentName: "AI Document Analyzer & Extractor",
    sellerName: "DocuMatrix Labs",
    version: "v2.0.1",
    tier: "Professional Tier",
    licenseKey: "LIC-DOC-7721-BC08",
    downloadAllowed: true,
    downloadUrl: "https://artifacts.cortex-hub.io/signed/doc-analyzer-v2.0.1-prod.tar.gz?token=exp28911",
    fileSize: "840 MB",
    checksumSha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    apiQuota: "500,000 reqs/mo",
    apiUsed: "210,000 reqs",
    purchasedDate: "Jul 01, 2026"
  }
];

export const MOCK_API_KEYS = [
  {
    id: "key-prod-01",
    name: "Production Ingress Gateway",
    prefix: "sk-live-acme-prod-",
    masked: "sk-live-acme-prod-•••••••••••••7f92a",
    rawKey: "sk-live-acme-prod-7f92a41bc901ef4582103e",
    created: "2026-05-14",
    lastUsed: "2 mins ago",
    status: "Active",
    calls30d: "1,248,590",
    environment: "Production"
  },
  {
    id: "key-stg-02",
    name: "Staging Pipeline CI/CD",
    prefix: "sk-test-acme-stg-",
    masked: "sk-test-acme-stg-•••••••••••••39a01",
    rawKey: "sk-test-acme-stg-39a01e459b22ca8871092b",
    created: "2026-06-20",
    lastUsed: "4 hours ago",
    status: "Active",
    calls30d: "84,310",
    environment: "Staging"
  },
  {
    id: "key-dev-03",
    name: "Developer Sandbox Key",
    prefix: "sk-test-acme-dev-",
    masked: "sk-test-acme-dev-•••••••••••••89c09",
    rawKey: "sk-test-acme-dev-89c094ef7123aa1290384f",
    created: "2026-08-01",
    lastUsed: "Yesterday",
    status: "Active",
    calls30d: "12,940",
    environment: "Development"
  }
];

export const MOCK_DAILY_USAGE = [
  { day: "Sep 09", tokens: 780000, calls: 42100, cost: 4.82, heightPct: 62 },
  { day: "Sep 10", tokens: 910000, calls: 48900, cost: 5.64, heightPct: 75 },
  { day: "Sep 11", tokens: 840000, calls: 44200, cost: 5.21, heightPct: 68 },
  { day: "Sep 12", tokens: 1040000, calls: 56300, cost: 6.45, heightPct: 88 },
  { day: "Sep 13", tokens: 1180000, calls: 62400, cost: 7.32, heightPct: 98 },
  { day: "Sep 14", tokens: 620000, calls: 31000, cost: 3.84, heightPct: 48 },
  { day: "Sep 15", tokens: 890000, calls: 46800, cost: 5.52, heightPct: 72 }
];

export const MOCK_CUSTOMIZATION_REQUESTS = [
  {
    id: "CR-1042",
    tenantName: "Acme Health Technologies Inc.",
    componentId: "rag-chatbot",
    componentName: "Enterprise RAG Chatbot",
    scope: "HIPAA Cloud RAG + Epic EHR Connector + SAML SSO",
    industry: "Healthcare",
    deploymentTarget: "Dedicated AWS VPC",
    estimatedPrice: "$2,850",
    priceInr: "₹2,38,000",
    targetDelivery: "Sep 28, 2026",
    status: "In Progress",
    statusStep: 4,
    submittedDate: "2026-09-02",
    timelineLog: [
      { date: "Sep 02", event: "Customization Request submitted via Configurator." },
      { date: "Sep 04", event: "Admin reviewed architectural scope & verified Epic EHR specs." },
      { date: "Sep 05", event: "Formal quote generated for $2,850; Customer approved payment." },
      { date: "Sep 08", event: "VPC terraform infrastructure provisioned; testing embeddings." }
    ]
  },
  {
    id: "CR-1049",
    tenantName: "Acme Health Technologies Inc.",
    componentId: "doc-analyzer",
    componentName: "AI Document Analyzer",
    scope: "German & French OCR + SAP S/4HANA Invoice Connector",
    industry: "Finance & Supply Chain",
    deploymentTarget: "Multi-tenant Cloud",
    estimatedPrice: "$1,950",
    priceInr: "₹1,62,800",
    targetDelivery: "Oct 05, 2026",
    status: "Quoted",
    statusStep: 3,
    submittedDate: "2026-09-10",
    timelineLog: [
      { date: "Sep 10", event: "Request submitted by lead architect." },
      { date: "Sep 12", event: "Technical scoping approved with Tesseract OCR fallback." },
      { date: "Sep 13", event: "Formal quote dispatched ($1,950). Awaiting customer PO approval." }
    ]
  },
  {
    id: "CR-1055",
    tenantName: "Apex Retail Logistics",
    componentId: "customer-support-bot",
    componentName: "AI Customer Support Bot",
    scope: "WhatsApp Business API + Shopify Inventory Sync",
    industry: "E-Commerce",
    deploymentTarget: "Multi-tenant Cloud",
    estimatedPrice: "$1,400",
    priceInr: "₹1,16,900",
    targetDelivery: "Pending Review",
    status: "Under Review",
    statusStep: 2,
    submittedDate: "2026-09-14",
    timelineLog: [
      { date: "Sep 14", event: "Submitted through portal by customer." },
      { date: "Sep 15", event: "Assigned to Senior Solutions Architect for API rate review." }
    ]
  }
];

export const MOCK_SUPPORT_TICKETS = [
  {
    id: "TCK-302",
    subject: "Assistance with private VPC peering for pgvector instance",
    priority: "High",
    category: "Infrastructure",
    status: "Open",
    created: "2026-09-14 10:24 AM",
    messages: [
      { sender: "Customer (John Doe)", time: "Yesterday, 10:24 AM", text: "We are configuring VPC peering between our AWS us-east-1 cluster and your managed pgvector endpoint. We need your VPC CIDR block." },
      { sender: "Support Engineer (Sarah)", time: "Yesterday, 11:15 AM", text: "Hello John, our AWS us-east-1 CIDR block is 10.142.0.0/16. I've sent the peering connection request from our side (pcx-08a9f41)." }
    ]
  },
  {
    id: "TCK-289",
    subject: "Zero-downtime production API key rotation guidance",
    priority: "Medium",
    category: "Security",
    status: "Resolved",
    created: "2026-09-08 03:10 PM",
    messages: [
      { sender: "Customer (John Doe)", time: "Sep 08, 03:10 PM", text: "How do we rotate production keys without dropping queries in-flight?" },
      { sender: "Support Engineer (Mike)", time: "Sep 08, 03:45 PM", text: "When you click 'Rotate' in the API Keys panel, the old key remains valid for a 5-minute rollover period." }
    ]
  }
];

// ----------------------------------------------------------------------------
// 2. MULTI-VENDOR SELLER STUDIO PERSPECTIVE (Apex AI Labs) (SRS Section 18, 20, 24)
// ----------------------------------------------------------------------------
export const MOCK_SELLER = {
  id: "seller-apex-01",
  handle: "apex-ai",
  displayName: "Apex AI Labs",
  organization: "Apex Intelligence Inc.",
  bio: "Engineering deterministic RAG pipelines, low-latency cross-encoders, and sovereign enterprise LLM agents.",
  verifiedLevel: "VERIFIED",
  website: "https://apex-ai-labs.io",
  github: "github.com/apex-ai-labs",
  grossRevenueUsd: 42850,
  platformFeeRate: 0.15, // Configurable 15% platform take rate
  platformFeesPaid: 6427.50,
  netEarningsUsd: 36422.50,
  availableBalance: 8240.00,
  pendingBalance: 3150.00,
  totalSalesCount: 86,
  averageRating: 4.94,
  funnelMetrics: {
    impressions: "142,500",
    productViews: "28,400",
    demoRuns: "6,820",
    checkouts: "112",
    purchases: "86",
    conversionRate: "2.4%"
  },
  products: [
    {
      id: "rag-chatbot",
      name: "Enterprise RAG Chatbot",
      category: "Generative AI",
      productType: "RAG_SYSTEM",
      salesCount: 48,
      grossRevenue: "$23,952",
      status: "PUBLISHED",
      version: "v1.3.2",
      rating: 4.9,
      downloads: 48,
      lastUpdated: "2026-09-12"
    },
    {
      id: "git-repair-agent",
      name: "AI Git & CI/CD Repair Agent",
      category: "Developer Tools",
      productType: "MCP_SERVER",
      salesCount: 26,
      grossRevenue: "$19,474",
      status: "PUBLISHED",
      version: "v2.3.0",
      rating: 4.9,
      downloads: 26,
      lastUpdated: "2026-09-18"
    },
    {
      id: "mcp-server-dev",
      name: "Autonomous DevOps MCP Bridge",
      category: "Developer Tools",
      productType: "MCP_SERVER",
      salesCount: 0,
      grossRevenue: "$0",
      status: "UNDER_REVIEW",
      version: "v1.0.0",
      rating: 0,
      downloads: 0,
      lastUpdated: "2026-09-22"
    }
  ],
  payoutHistory: [
    { id: "PAY-9041", date: "Sep 15, 2026", amount: "$4,500.00", method: "Stripe Connect / ACH", status: "COMPLETED", txHash: "tx_98fbc102e3" },
    { id: "PAY-8812", date: "Aug 15, 2026", amount: "$6,200.00", method: "Stripe Connect / ACH", status: "COMPLETED", txHash: "tx_772ae891f0" },
    { id: "PAY-8409", date: "Jul 15, 2026", amount: "$5,100.00", method: "Stripe Connect / ACH", status: "COMPLETED", txHash: "tx_554df990b4" }
  ]
};

// ----------------------------------------------------------------------------
// 3. ADMIN OPERATIONS & PRODUCT MODERATION QUEUE (SRS Section 13, 31, 63)
// ----------------------------------------------------------------------------
export const MOCK_MODERATION_QUEUE = [
  {
    id: "MOD-301",
    productId: "mcp-server-dev",
    productName: "Autonomous DevOps MCP Bridge",
    productType: "MCP_SERVER",
    category: "Developer Tools",
    sellerName: "Apex AI Labs",
    sellerHandle: "@apex-ai",
    price: "$399",
    submittedDate: "2026-09-21",
    status: "UNDER_REVIEW",
    checklist: {
      malwareScan: "PASS (0 threats detected across binary & wheel inspects)",
      licenseCompliance: "PASS (Apache-2.0 / Commercial Permissive license verified)",
      documentation: "PASS (Verified Quickstart, schema spec & cURL test)",
      sandboxIntegrity: "PASS (Docker container builds in 38s, health check: 200 OK)"
    },
    specs: "Dockerized Model Context Protocol server exposing Kubernetes cluster telemetry & Helm deploy capabilities to LLM agents."
  },
  {
    id: "MOD-302",
    productId: "legal-contract-llm",
    productName: "JurisLex-7B Legal LoRA Adapter",
    productType: "LORA",
    category: "Generative AI",
    sellerName: "CognitivePulse Labs",
    sellerHandle: "@cogpulse",
    price: "$599",
    submittedDate: "2026-09-23",
    status: "UNDER_REVIEW",
    checklist: {
      malwareScan: "PASS (PyTorch safe_tensors format verified, no pickling risk)",
      licenseCompliance: "PASS (Llama-3 Community License Compliant)",
      documentation: "PASS (Hardware VRAM requirements & LegalBench results provided)",
      sandboxIntegrity: "PASS (FP16 weights load in 7.8GB VRAM cleanly)"
    },
    specs: "LoRA adapter fine-tuned on 40,000 corporate Master Service Agreements, NDAs, and indemnification clauses."
  }
];

export const MOCK_ADMIN_DEPLOYMENTS = [
  {
    tenant: "Acme Health Technologies Inc.",
    component: "Enterprise RAG Chatbot",
    version: "v1.3.2",
    env: "AWS us-east-1 (VPC)",
    status: "Healthy",
    uptime: "99.98%",
    pingMs: 28,
    lastCheck: "1 min ago"
  },
  {
    tenant: "Acme Health Technologies Inc.",
    component: "AI Document Analyzer",
    version: "v2.0.1",
    env: "Multi-tenant Cloud",
    status: "Healthy",
    uptime: "99.95%",
    pingMs: 44,
    lastCheck: "3 mins ago"
  },
  {
    tenant: "Global Staffing Alliance",
    component: "Resume Screening Engine",
    version: "v1.4.0",
    env: "GCP europe-west3 (VPC)",
    status: "Healthy",
    uptime: "99.99%",
    pingMs: 32,
    lastCheck: "2 mins ago"
  },
  {
    tenant: "FinPay Global Labs",
    component: "Multi-Aspect Financial Sentiment",
    version: "v1.2.5",
    env: "On-Premise (Air-gapped)",
    status: "Warning",
    uptime: "99.40%",
    pingMs: 86,
    lastCheck: "5 mins ago"
  }
];
