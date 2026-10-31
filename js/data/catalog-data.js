/**
 * AI Component Store & Customization Platform
 * Multi-Vendor Product Catalog Data (All 10 Production AI Engines)
 * Aligned with SRS v2.0 Master Product Specification
 */

export const CATALOG_COMPONENTS = [
  {
    id: "rag-chatbot",
    buyerTitle: "Internal Document Search & Q&A Assistant",
    businessCategory: "\ud83d\udcc4 Work with Documents",
    buyerValueProp: "Get instant, verified answers from all your company contracts, policies, and files with exact page citations.",
    channels: ["Website Chat", "Slack", "Internal Portal", "API"],
    setupComplexity: "Easy (~15 mins)",
    prerequisites: "Upload your PDF, Word, or text documents",
    goodFor: ["Legal", "Healthcare", "EdTech", "Finance"],
    measuredTelemetry: {
        "uptime30d": "99.98%",
        "p95Latency": "737ms",
        "evalScore": "98.4%",
        "activeInstalls": 342,
        "lastUpdated": "Sep 28, 2026"
  },
    name: "Enterprise RAG Chatbot",
    category: "Generative AI",
    categoryBadge: "badge-indigo",
    productType: "RAG_SYSTEM",
    version: "v1.3.2",
    sellerName: "Apex AI Labs",
    sellerHandle: "@apex-ai",
    sellerVerified: true,
    sellerRating: 4.95,
    verificationStatus: "VERIFIED",
    shortDesc: "Accurate, cited question-answering over private enterprise documentation with zero hallucinations.",
    longDesc: "Production-grade Retrieval-Augmented Generation (RAG) system engineered for high-stakes enterprise compliance. Features hybrid dense/sparse vector retrieval, context-aware re-ranking, document source attribution down to page/paragraph, and customizable security guardrails.",
    coreOutput: "Cited Q&A over internal documents",
    targetBuyer: "Colleges, Law Firms, Healthcare, Insurance",
    basePrice: 499,
    priceFormatted: "$499",
    inrPriceFormatted: "₹41,500",
    tags: ["Legal", "Healthcare", "EdTech", "Compliance"],
    licenseType: "Commercial Permissive (Multi-Seat)",
    downloadSize: "1.42 GB",
    artifactChecksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    hardwareReqs: {
      vram: "8 GB VRAM",
      gpu: "NVIDIA RTX 4090 / A10G",
      cpu: "4 Cores (x86_64 / ARM64)",
      ram: "16 GB System RAM"
    },
    benchmarks: {
      accuracy: "98.4% Source Factual Grounding",
      latencyP95: "737ms Time-to-First-Token",
      dataset: "FinanceBench & LegalEval 2026"
    },
    rating: 4.9,
    ratingCount: 48,
    features: [
      "Hybrid Retrieval (Dense Vector + BM25 Lexical search)",
      "Strict Source Citations with exact page & excerpt references",
      "Multi-tenant document isolation with row-level security",
      "Streaming responses with sub-second time-to-first-token",
      "Hallucination guardrails and confidence threshold scoring",
      "Support for PDF, DOCX, Notion, Confluence, and SQL"
    ],
    pricingTiers: [
      {
        name: "Starter",
        price: "$499",
        desc: "Ideal for small teams with up to 5,000 document pages.",
        features: ["Up to 5,000 pages indexed", "Standard vector retrieval", "Public cloud deployment", "Community email support", "10 req/sec limit"]
      },
      {
        name: "Advanced",
        price: "$1,299",
        featured: true,
        desc: "Optimized for high-volume compliance & cited research.",
        features: ["Up to 50,000 pages indexed", "Hybrid Search + Cohere Re-ranker", "Dedicated VPC deployment", "24/7 Priority SLA", "Custom security guardrails"]
      },
      {
        name: "Enterprise",
        price: "Custom",
        desc: "Air-gapped on-premise deployment with tailored fine-tuning.",
        features: ["Unlimited document scale", "Self-hosted Llama / Mixtral", "On-premise / air-gapped options", "Custom SLA & dedicated engineer", "Full source code licensing"]
      }
    ],
    architecture: [
      { step: "1", title: "Document Ingestion", desc: "PDF/DOCX OCR, Chunking & Metadata tagging", icon: "file-text" },
      { step: "2", title: "Hybrid Indexing", desc: "pgvector dense embeddings + BM25 inverted index", icon: "database" },
      { step: "3", title: "Re-Ranking Router", desc: "Cross-encoder semantic score & deduplication", icon: "git-branch" },
      { step: "4", title: "LLM Synthesizer", desc: "Context injection with strict grounded prompt", icon: "cpu" },
      { step: "5", title: "Citation Engine", desc: "Attribution validation & confidence telemetry", icon: "check-circle" }
    ],
    codeSnippets: {
      python: `from cortexhub import RAGChatbotClient

client = RAGChatbotClient(api_key="ctx_live_rag_99182")

response = client.query(
    knowledge_base_id="kb_legal_contracts_2026",
    prompt="What are the non-compete indemnification terms in Section 12?",
    retrieval_mode="hybrid",
    top_k=4
)

print("Grounded Answer:", response.answer)
for citation in response.citations:
    print(f"[{citation.doc_title} - P.{citation.page_no}]: {citation.excerpt}")`,
      curl: `curl -X POST https://api.cortex-hub.io/v1/rag/query \\
  -H "Authorization: Bearer ctx_live_rag_99182" \\
  -H "Content-Type: application/json" \\
  -d '{
    "knowledge_base_id": "kb_legal_contracts_2026",
    "prompt": "What are the indemnification terms in Section 12?",
    "retrieval_mode": "hybrid",
    "top_k": 4
  }'`
    },
    reviews: [
      {
        id: "rev-1",
        buyerName: "Dr. Marcus Vance (Acme Health)",
        rating: 5,
        version: "v1.3.2",
        date: "2026-08-14",
        title: "Exact byte citations eliminated hallucination liability entirely",
        comment: "We deployed this across 40,000 pages of clinical trials. The hybrid vector + lexical search catches critical medical acronyms that standard vector stores miss.",
        sellerReply: "Thank you Dr. Vance! The BM25 reciprocal rank tuning was specifically calibrated for technical terminology."
      },
      {
        id: "rev-2",
        buyerName: "Elena Rostova (General Counsel, Veloce)",
        rating: 5,
        version: "v1.3.1",
        date: "2026-07-29",
        title: "Passed SOC2 and HIPAA audit with zero egress",
        comment: "The VPC deployment instructions were flawless. Our legal analysts now complete 3-hour lease reviews in 8 minutes."
      }
    ]
  },
  {
    id: "customer-support-bot",
    buyerTitle: "24/7 AI Customer Support Assistant",
    businessCategory: "\ud83d\udcac Talk to Customers",
    buyerValueProp: "Automatically answer customer questions 24/7 across your website, WhatsApp, and email without human delay.",
    channels: ["Website Chat", "WhatsApp", "Email", "Zendesk"],
    setupComplexity: "Fast (<10 mins)",
    prerequisites: "Connect website chat or WhatsApp Business number",
    goodFor: ["E-Commerce", "SaaS", "Hospitality", "Support Desks"],
    measuredTelemetry: {
        "uptime30d": "99.99%",
        "p95Latency": "480ms",
        "evalScore": "94.2%",
        "activeInstalls": 518,
        "lastUpdated": "Oct 12, 2026"
  },
    name: "AI Customer Support Agent",
    category: "Generative AI",
    categoryBadge: "badge-indigo",
    productType: "AI_AGENT",
    version: "v2.1.0",
    sellerName: "CognitivePulse Labs",
    sellerHandle: "@cogpulse",
    sellerVerified: true,
    sellerRating: 4.88,
    verificationStatus: "VERIFIED",
    shortDesc: "Autonomous tier-1 support agent with live website chat, CRM sync, and smart ticket escalation.",
    longDesc: "An omnichannel customer support agent capable of resolving up to 70% of inbound tickets autonomously. Integrates seamlessly with Zendesk, Freshdesk, HubSpot, and WhatsApp Business. Detects user frustration and escalates with complete conversation summaries.",
    coreOutput: "Website chat, CRM sync, automated ticket triage",
    targetBuyer: "E-Commerce, SaaS, Financial Services",
    basePrice: 599,
    priceFormatted: "$599",
    inrPriceFormatted: "₹49,800",
    tags: ["E-Commerce", "SaaS", "Support", "Automation"],
    licenseType: "Commercial Permissive (Multi-Seat)",
    downloadSize: "680 MB",
    artifactChecksum: "a71b29d44c8290e1f78234bb4819e9182371928374a8b7123984172398471293",
    hardwareReqs: {
      vram: "4 GB VRAM",
      gpu: "CPU / T4 Cloud Instance",
      cpu: "2 Cores",
      ram: "8 GB RAM"
    },
    benchmarks: {
      accuracy: "94.2% Autonomous Resolution Rate",
      latencyP95: "480ms First Token",
      dataset: "CustomerBench Omnichannel 2026"
    },
    rating: 4.8,
    ratingCount: 34,
    features: [
      "Omnichannel widget (Web, WhatsApp, Slack, Intercom)",
      "Automated order status lookup & refund handling",
      "Sentiment analysis with human handoff trigger",
      "Automated FAQ auto-learning from resolved tickets",
      "Multi-lingual support across 40+ languages"
    ],
    pricingTiers: [
      { name: "Basic", price: "$599", desc: "Up to 2,000 monthly conversations.", features: ["Web chat widget", "Zendesk/HubSpot sync", "Standard AI model", "Email support"] },
      { name: "Pro", price: "$1,499", featured: true, desc: "Up to 15,000 monthly conversations.", features: ["Omnichannel (WhatsApp + Web)", "Custom API tool actions", "Sentiment escalation", "Analytics dashboard"] },
      { name: "Scale", price: "Custom", desc: "Unlimited conversations with dedicated SLAs.", features: ["Custom integrations", "Dedicated model tuning", "99.95% uptime SLA", "Private VPC"] }
    ],
    architecture: [
      { step: "1", title: "Channel Ingress", desc: "Web Widget / WhatsApp Webhook", icon: "message-square" },
      { step: "2", title: "Intent & Sentiment", desc: "Classify intent & user urgency", icon: "activity" },
      { step: "3", title: "Action Execution", desc: "Query CRM, Order DB or Knowledge Base", icon: "server" },
      { step: "4", title: "Resolution / Escalation", desc: "Generate reply or create agent handoff", icon: "users" }
    ],
    codeSnippets: {
      python: `from cortexhub import SupportBotClient

bot = SupportBotClient(api_key="ctx_live_support_11928")
ticket = bot.handle_inbound(
    customer_id="cust_9921",
    message="I need to change shipping address for order #88124",
    channel="web_widget"
)
print("Bot Action:", ticket.suggested_action)`,
      curl: `curl -X POST https://api.cortex-hub.io/v1/support/inbound \\
  -H "Authorization: Bearer ctx_live_support_11928" \\
  -H "Content-Type: application/json" \\
  -d '{"customer_id": "cust_9921", "message": "Change address for order #88124"}'`
    },
    reviews: [
      {
        id: "rev-3",
        buyerName: "Nikhil Sharma (CTO, SwiftRetail)",
        rating: 5,
        version: "v2.1.0",
        date: "2026-09-02",
        title: "Deflected 68% of refund and tracking inquiries on day 1",
        comment: "The Shopify API tool calling worked straight out of the box with zero custom glue code."
      }
    ]
  },
  {
    id: "resume-screener",
    buyerTitle: "Candidate Resume Matcher & Screener",
    businessCategory: "\ud83d\udc65 Manage Employees",
    buyerValueProp: "Instantly rank and score job applicants against job descriptions with unbiased competency scoring.",
    channels: ["Greenhouse", "Lever", "CSV / PDF Upload", "API"],
    setupComplexity: "Instant (<5 mins)",
    prerequisites: "Job descriptions and candidate resume files",
    goodFor: ["Recruiting Agencies", "HR Teams", "Enterprises"],
    measuredTelemetry: {
        "uptime30d": "99.95%",
        "p95Latency": "620ms",
        "evalScore": "96.1%",
        "activeInstalls": 184,
        "lastUpdated": "Sep 15, 2026"
  },
    name: "Resume Screening & Match Engine",
    category: "Machine Learning",
    categoryBadge: "badge-cyan",
    productType: "MODEL",
    version: "v1.4.0",
    sellerName: "Neuromorphic AI",
    sellerHandle: "@neuromorphic",
    sellerVerified: true,
    sellerRating: 4.82,
    verificationStatus: "VERIFIED",
    shortDesc: "Semantic candidate profiling, skill gap extraction, and unbiased job requisition ranking.",
    longDesc: "High-throughput resume parser that extracts structured skills, work history, and educational timelines from multi-format CVs. Computes multidimensional semantic fit scores against complex job descriptions while eliminating unconscious bias.",
    coreOutput: "Structured candidate scorecards & skill taxonomy",
    targetBuyer: "Recruitment Agencies, Enterprise HR, Tech Staffing",
    basePrice: 699,
    priceFormatted: "$699",
    inrPriceFormatted: "₹58,200",
    tags: ["Recruitment", "HR Tech", "Enterprise"],
    licenseType: "Commercial Permissive (Multi-Seat)",
    downloadSize: "1.10 GB",
    artifactChecksum: "b891823901a8f901238471293847129384719283741928374192837491827341",
    hardwareReqs: {
      vram: "6 GB VRAM",
      gpu: "NVIDIA T4 / RTX 3060",
      cpu: "4 Cores",
      ram: "16 GB RAM"
    },
    benchmarks: {
      accuracy: "96.2% Normalized Skill Extraction",
      latencyP95: "120ms Per Resume Parse",
      dataset: "O*NET Competency Framework & ResumeBench"
    },
    rating: 4.7,
    ratingCount: 22,
    features: [
      "Bulk batch processing of PDF/DOCX resumes (1,000s/min)",
      "Deep semantic skill ontology matching (not just keyword hit)",
      "Candidate anonymization mode to combat demographic bias",
      "ATS integration with Greenhouse, Lever, and Workday",
      "Automated interview question suggestion based on skill gaps"
    ],
    pricingTiers: [
      { name: "Starter", price: "$699", desc: "Up to 1,000 resume parses/mo.", features: ["Standard skill extraction", "PDF/DOCX parsing", "CSV/JSON export", "Email support"] },
      { name: "Agency", price: "$1,899", featured: true, desc: "Up to 10,000 resume parses/mo.", features: ["Deep semantic matching", "ATS 2-way sync", "Bias anonymization", "Batch API"] },
      { name: "Enterprise", price: "Custom", desc: "Unlimited parsing with private data isolation.", features: ["Custom skill taxonomy", "On-premise deployment", "Dedicated model fine-tuning"] }
    ],
    architecture: [
      { step: "1", title: "CV Parser", desc: "Extract layouts, tables, and timeline entities", icon: "file-text" },
      { step: "2", title: "Skill Ontology", desc: "Map experiences to 40,000+ normalized skills", icon: "layers" },
      { step: "3", title: "Job Vector Match", desc: "Cosine similarity against Job Requisition", icon: "crosshair" },
      { step: "4", title: "Scorecard Gen", desc: "Produce rank, missing skills & interview prompts", icon: "award" }
    ],
    codeSnippets: {
      python: `from cortexhub import ResumeScreenerClient

screener = ResumeScreenerClient(api_key="ctx_live_rec_44129")
result = screener.rank_candidate(
    job_description_id="job_staff_backend_2026",
    resume_file_path="candidates/john_doe_resume.pdf"
)
print(f"Candidate Score: {result.match_score}%")
print(f"Top Skills: {result.matched_skills}")`,
      curl: `curl -X POST https://api.cortex-hub.io/v1/screener/evaluate \\
  -H "Authorization: Bearer ctx_live_rec_44129" \\
  -F "job_id=job_staff_backend_2026" \\
  -F "resume=@candidate.pdf"`
    },
    reviews: [
      {
        id: "rev-4",
        buyerName: "Sarah Jenkins (Global Staffing)",
        rating: 5,
        version: "v1.4.0",
        date: "2026-08-20",
        title: "Cut initial candidate filtering from 4 days to 25 minutes",
        comment: "The blind audit algorithm eliminated demographic bias and surfaced top engineering talent we previously overlooked."
      }
    ]
  },
  {
    id: "doc-analyzer",
    buyerTitle: "Invoice & Contract Data Extractor",
    businessCategory: "\ud83d\udcc4 Work with Documents",
    buyerValueProp: "Extract structured numbers, line items, and terms from invoices, receipts, and agreements into Excel or databases.",
    channels: ["Email Ingestion", "Google Drive", "ERP Sync", "API"],
    setupComplexity: "Easy (~15 mins)",
    prerequisites: "Sample invoices or contract PDFs",
    goodFor: ["Accounting", "Logistics", "Procurement", "Legal"],
    measuredTelemetry: {
        "uptime30d": "99.97%",
        "p95Latency": "890ms",
        "evalScore": "97.8%",
        "activeInstalls": 279,
        "lastUpdated": "Oct 04, 2026"
  },
    name: "AI Document Analyzer & Extractor",
    category: "Computer Vision",
    categoryBadge: "badge-cyan",
    productType: "WORKFLOW",
    version: "v2.0.1",
    sellerName: "DocuMatrix Labs",
    sellerHandle: "@documatrix",
    sellerVerified: true,
    sellerRating: 4.92,
    verificationStatus: "VERIFIED",
    shortDesc: "Intelligent table extraction, financial clause verification, and multi-doc cross comparison.",
    longDesc: "Engineered for finance, audit, insurance, and legal teams. Ingests complex multi-page financial statements, insurance policies, and supplier contracts to extract tabular data, identify conflicting clauses, and produce structured audit sheets.",
    coreOutput: "JSON field extraction & multi-clause delta reports",
    targetBuyer: "Legal Firms, Hedge Funds, Insurance Underwriters",
    basePrice: 799,
    priceFormatted: "$799",
    inrPriceFormatted: "₹66,500",
    tags: ["Finance", "Legal", "Insurance", "Audit"],
    licenseType: "Commercial Permissive (Multi-Seat)",
    downloadSize: "840 MB",
    artifactChecksum: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    hardwareReqs: {
      vram: "8 GB VRAM",
      gpu: "NVIDIA RTX 4090 / A10G",
      cpu: "4 Cores",
      ram: "16 GB RAM"
    },
    benchmarks: {
      accuracy: "99.1% Tabular Field Extraction Precision",
      latencyP95: "350ms Per Page",
      dataset: "DocBank & FinTabNet 2026"
    },
    rating: 4.9,
    ratingCount: 39,
    features: [
      "Table & spreadsheet reconstruction from scanned PDFs",
      "Cross-document conflict & redline identification",
      "Strict schema enforcement with JSON Schema output validation",
      "Audit trail linking extracted numbers back to pixel coordinates",
      "Automated executive summary generation"
    ],
    pricingTiers: [
      { name: "Standard", price: "$799", desc: "Up to 500 documents/mo.", features: ["Key-value field extraction", "Table recognition", "REST API", "Email support"] },
      { name: "Professional", price: "$1,999", featured: true, desc: "Up to 3,000 documents/mo.", features: ["Cross-doc comparisons", "Pixel-coordinate citations", "Custom JSON schemas", "Priority support"] },
      { name: "Enterprise", price: "Custom", desc: "High volume enterprise processing.", features: ["Unlimited docs", "Private cloud/On-prem", "Custom OCR models", "Dedicated support"] }
    ],
    architecture: [
      { step: "1", title: "Layout OCR", desc: "Pixel-level text & table bounding box detection", icon: "grid" },
      { step: "2", title: "Schema Extractor", desc: "LLM extraction constrained by JSON schema", icon: "code" },
      { step: "3", title: "Cross Comparison", desc: "Diff clauses against standard template", icon: "git-commit" },
      { step: "4", title: "Audit Verification", desc: "Confidence scores with pixel coordinates", icon: "check-circle" }
    ],
    codeSnippets: {
      python: `from cortexhub import DocAnalyzerClient

analyzer = DocAnalyzerClient(api_key="ctx_live_doc_88201")
extracted = analyzer.extract_fields(
    document_url="https://s3.aws.com/leases/commercial_lease_2026.pdf",
    schema={"rent_amount": "number", "escalation_rate": "number", "term_months": "integer"}
)
print("Extracted Lease Data:", extracted.data)`,
      curl: `curl -X POST https://api.cortex-hub.io/v1/analyzer/extract \\
  -H "Authorization: Bearer ctx_live_doc_88201" \\
  -H "Content-Type: application/json" \\
  -d '{"doc_url": "https://...", "schema_id": "commercial_lease"}'`
    },
    reviews: [
      {
        id: "rev-5",
        buyerName: "Rajesh Kulkarni (FinPay Labs)",
        rating: 5,
        version: "v2.0.1",
        date: "2026-08-10",
        title: "Pixel-level bounding box links made internal audit pass smoothly",
        comment: "Our auditors loved that clicking any extracted EBITDA or interest rate jumps straight to the exact page coordinates in the source PDF."
      }
    ]
  },
  {
    id: "meeting-summarizer",
    buyerTitle: "Meeting Notes & Action Item Copilot",
    businessCategory: "\u2699\ufe0f Automate Work",
    buyerValueProp: "Turn meeting transcripts and call recordings into executive summaries, action items, and task assignments automatically.",
    channels: ["Zoom", "Google Meet", "Teams", "Slack"],
    setupComplexity: "Fast (<10 mins)",
    prerequisites: "Meeting recording audio or transcript text",
    goodFor: ["Executive Teams", "Consultancies", "Agile Squads"],
    measuredTelemetry: {
        "uptime30d": "99.96%",
        "p95Latency": "1,120ms",
        "evalScore": "95.5%",
        "activeInstalls": 412,
        "lastUpdated": "Sep 22, 2026"
  },
    name: "Meeting Intelligence & Action Engine",
    category: "Developer Tools",
    categoryBadge: "badge-emerald",
    productType: "AI_AGENT",
    version: "v1.1.0",
    sellerName: "CognitivePulse Labs",
    sellerHandle: "@cogpulse",
    sellerVerified: true,
    sellerRating: 4.88,
    verificationStatus: "VERIFIED",
    shortDesc: "Speaker-separated transcript analysis, decision tracking, and Jira/Asana task generation.",
    longDesc: "Transforms raw multi-speaker audio transcripts into concise executive briefs, key decisions logs, and Jira/Linear work items assigned to participants with deadlines.",
    coreOutput: "Executive meeting summaries & assigned action items",
    targetBuyer: "Startups, Remote Engineering Teams, Consultancies",
    basePrice: 399,
    priceFormatted: "$399",
    inrPriceFormatted: "₹33,200",
    tags: ["Productivity", "SaaS", "Engineering"],
    licenseType: "Commercial Permissive (Multi-Seat)",
    downloadSize: "520 MB",
    artifactChecksum: "c189283741928374192837419283741928374192837419283741928374192837",
    hardwareReqs: {
      vram: "4 GB VRAM",
      gpu: "T4 / Standard Compute",
      cpu: "4 Cores",
      ram: "8 GB RAM"
    },
    benchmarks: {
      accuracy: "97.4% Speaker Attribution & Action Mining",
      latencyP95: "1.2s Per 30m Audio",
      dataset: "AMI Meeting Corpus & RealWorld Remote Transcripts"
    },
    rating: 4.8,
    ratingCount: 19,
    features: [
      "Speaker diarization and speaker intent tracking",
      "Automated Jira, Linear, and Notion task creation",
      "Executive TL;DR and decision history archiving",
      "Zoom, Google Meet, and MS Teams webhook bots",
      "Confidential conversation redaction (PII/Financial)"
    ],
    pricingTiers: [
      { name: "Team", price: "$399", desc: "Up to 50 hours of audio/mo.", features: ["Speaker summaries", "Action items", "Notion sync", "Email support"] },
      { name: "Business", price: "$899", featured: true, desc: "Up to 200 hours of audio/mo.", features: ["Jira/Linear auto-tickets", "Zoom/Teams bot integration", "Sentiment trends"] },
      { name: "Enterprise", price: "Custom", desc: "Custom retention with airgap options.", features: ["Unlimited hours", "Custom PII masking", "On-prem transcript storage"] }
    ],
    architecture: [
      { step: "1", title: "Audio Ingest", desc: "Diarized STT speech-to-text pipeline", icon: "mic" },
      { step: "2", title: "Discussion Graph", desc: "Topic segmentation and decision mining", icon: "share-2" },
      { step: "3", title: "Task Synthesizer", desc: "Assignee, deadline & context extraction", icon: "check-square" },
      { step: "4", title: "Ticket Dispatch", desc: "Post to Jira, Linear, Asana & Slack", icon: "send" }
    ],
    codeSnippets: {
      python: `from cortexhub import MeetingIntelClient

client = MeetingIntelClient(api_key="ctx_live_meet_30192")
summary = client.analyze_transcript(
    transcript_text="Alice: Let's ship the migration by Friday. Bob: I'll finish the tests.",
    dispatch_integrations=["jira", "slack"]
)
print("Action Items:", summary.action_items)`,
      curl: `curl -X POST https://api.cortex-hub.io/v1/meetings/analyze \\
  -H "Authorization: Bearer ctx_live_meet_30192" \\
  -H "Content-Type: application/json" \\
  -d '{"transcript": "...", "create_tasks": true}'`
    },
    reviews: [
      {
        id: "rev-6",
        buyerName: "Liam O'Connor (VP Engineering)",
        rating: 5,
        version: "v1.1.0",
        date: "2026-08-30",
        title: "Clean Linear tickets created right after our sprint planning",
        comment: "No more forgotten action items. It accurately assigns tasks to the right dev and includes context quotes."
      }
    ]
  },
  {
    id: "recs-engine",
    buyerTitle: "E-Commerce Product Recommender",
    businessCategory: "\ud83d\uded2 Increase Sales",
    buyerValueProp: "Boost checkout average order value by showing personalized product recommendations and bundle suggestions.",
    channels: ["Shopify", "WooCommerce", "Custom Web Store", "API"],
    setupComplexity: "Easy (~20 mins)",
    prerequisites: "Product catalog CSV or store API credentials",
    goodFor: ["Online Retail", "B2B Marketplaces", "Content Portals"],
    measuredTelemetry: {
        "uptime30d": "99.99%",
        "p95Latency": "140ms",
        "evalScore": "96.9%",
        "activeInstalls": 630,
        "lastUpdated": "Oct 19, 2026"
  },
    name: "AI Personalization & Recommendation Engine",
    category: "Machine Learning",
    categoryBadge: "badge-amber",
    productType: "MODEL",
    version: "v2.2.0",
    sellerName: "VectorFlow Systems",
    sellerHandle: "@vectorflow",
    sellerVerified: true,
    sellerRating: 4.96,
    verificationStatus: "VERIFIED",
    shortDesc: "Real-time user vector embeddings, next-best-action prediction, and dynamic content re-ranking.",
    longDesc: "High-performance vector recommendation engine processing tens of thousands of requests per second with under 15ms latency. Computes dynamic user taste vectors combining past purchases, browse history, and real-time session behavior.",
    coreOutput: "Ranked personalized product & content feeds",
    targetBuyer: "EdTech, E-Commerce, Streaming Media",
    basePrice: 899,
    priceFormatted: "$899",
    inrPriceFormatted: "₹74,900",
    tags: ["E-Commerce", "EdTech", "Media", "High-Throughput"],
    licenseType: "Commercial Permissive (Multi-Seat)",
    downloadSize: "1.85 GB",
    artifactChecksum: "d412983719283741928374192837419283741928374192837419283741928374",
    hardwareReqs: {
      vram: "16 GB VRAM",
      gpu: "NVIDIA A10G / L4",
      cpu: "8 Cores (Ultra-low latency HNSW)",
      ram: "32 GB RAM"
    },
    benchmarks: {
      accuracy: "+34% Click-Through-Rate Uplift",
      latencyP95: "14ms P95 Latency",
      dataset: "RecSys 2026 Million Item Benchmark"
    },
    rating: 4.9,
    ratingCount: 31,
    features: [
      "Sub-15ms vector retrieval at 50,000 queries per second",
      "Cold-start handling with zero behavioral history",
      "Dynamic session re-ranking based on immediate clicks",
      "A/B testing harness with conversion attribution telemetry",
      "SDKs for Python, Node.js, Go, and Java"
    ],
    pricingTiers: [
      { name: "Growth", price: "$899", desc: "Up to 500,000 rec calls/mo.", features: ["User vector tracking", "Product graph", "REST API", "Standard SLA"] },
      { name: "Scale", price: "$2,499", featured: true, desc: "Up to 5,000,000 rec calls/mo.", features: ["Real-time session updates", "Multi-region cluster", "A/B telemetry", "24/7 SLA"] },
      { name: "Enterprise", price: "Custom", desc: "Dedicated bare-metal vector nodes.", features: ["Unlimited volume", "Custom algorithmic graph", "Dedicated engineer"] }
    ],
    architecture: [
      { step: "1", title: "Clickstream Ingest", desc: "Real-time event stream via Kafka / Kinesis", icon: "activity" },
      { step: "2", title: "User Vectorizer", desc: "Dynamic session embedding generation", icon: "user-check" },
      { step: "3", title: "ANN Vector Search", desc: "HNSW index search across product catalog", icon: "search" },
      { step: "4", title: "Business Re-ranker", desc: "Margin, inventory & diversity weighting", icon: "sliders" }
    ],
    codeSnippets: {
      python: `from cortexhub import RecEngineClient

recs = RecEngineClient(api_key="ctx_live_rec_55019")
products = recs.get_recommendations(
    user_id="usr_88319",
    context_tags=["electronics", "headphones"],
    limit=6
)
for p in products:
    print(f"Recommend: {p.title} (Score: {p.affinity_score})")`,
      curl: `curl -X POST https://api.cortex-hub.io/v1/recs/feed \\
  -H "Authorization: Bearer ctx_live_rec_55019" \\
  -H "Content-Type: application/json" \\
  -d '{"user_id": "usr_88319", "limit": 6}'`
    },
    reviews: [
      {
        id: "rev-7",
        buyerName: "Chloe Dupont (Head of Growth, LuxeCart)",
        rating: 5,
        version: "v2.2.0",
        date: "2026-07-15",
        title: "Immediate 28% increase in average order value",
        comment: "The session-aware re-ranking catches in-session intent shifts within 2 clicks. P95 latency consistently holds under 14ms."
      }
    ]
  },
  {
    id: "semantic-search",
    buyerTitle: "Smart Enterprise Search Engine",
    businessCategory: "\ud83d\udd0e Find Information",
    buyerValueProp: "Give your users Google-quality search that understands intent and context, even with typos or synonyms.",
    channels: ["REST API", "Website Widget", "PostgreSQL / Elasticsearch"],
    setupComplexity: "Developer Guided (<30 mins)",
    prerequisites: "Searchable data source or database connection",
    goodFor: ["SaaS Platforms", "Documentation Sites", "Media Catalogs"],
    measuredTelemetry: {
        "uptime30d": "99.99%",
        "p95Latency": "85ms",
        "evalScore": "99.1%",
        "activeInstalls": 755,
        "lastUpdated": "Oct 24, 2026"
  },
    name: "Semantic Neural Search API",
    category: "NLP",
    categoryBadge: "badge-amber",
    productType: "RERANKER",
    version: "v1.2.5",
    sellerName: "VectorFlow Systems",
    sellerHandle: "@vectorflow",
    sellerVerified: true,
    sellerRating: 4.96,
    verificationStatus: "VERIFIED",
    shortDesc: "Meaning-based multi-modal search combining semantic vector distance with full-text BM25.",
    longDesc: "Drop-in replacement for legacy keyword search engines. Understands synonyms, intent, typographical errors, and contextual semantics across product databases, documentation, and customer records.",
    coreOutput: "Ranked semantic query hits with snippet highlights",
    targetBuyer: "SaaS Platforms, Internal Knowledge Portals",
    basePrice: 549,
    priceFormatted: "$549",
    inrPriceFormatted: "₹45,600",
    tags: ["Search", "Developer Tools", "Knowledge Base"],
    licenseType: "Commercial Permissive (Multi-Seat)",
    downloadSize: "920 MB",
    artifactChecksum: "e712398471293847192837419283741928374192837419283741928374192837",
    hardwareReqs: {
      vram: "6 GB VRAM",
      gpu: "T4 / RTX 3080",
      cpu: "4 Cores",
      ram: "16 GB RAM"
    },
    benchmarks: {
      accuracy: "92.8% MRR@10 (Mean Reciprocal Rank)",
      latencyP95: "38ms Hybrid Rerank Latency",
      dataset: "BEIR Benchmark & MS MARCO"
    },
    rating: 4.9,
    ratingCount: 27,
    features: [
      "Blended hybrid retrieval (Vector + BM25 with Reciprocal Rank Fusion)",
      "Instant typo tolerance and synonym expansion",
      "Faceted filtering with metadata drill-down",
      "Self-updating vector indexes via webhooks",
      "Ready-to-use search UI component for React and Vue"
    ],
    pricingTiers: [
      { name: "Developer", price: "$549", desc: "Up to 100,000 search queries/mo.", features: ["Hybrid search", "Instant indexing", "REST API", "Community support"] },
      { name: "Team", price: "$1,399", featured: true, desc: "Up to 1,000,000 search queries/mo.", features: ["Custom embeddings", "Zero-downtime re-indexing", "Faceted filtering", "99.9% SLA"] },
      { name: "Enterprise", price: "Custom", desc: "Multi-cluster private cloud deployment.", features: ["Unlimited queries", "Dedicated Milvus/Qdrant cluster", "Custom ranking models"] }
    ],
    architecture: [
      { step: "1", title: "Query Embedding", desc: "Transformer tokenization & dense embedding", icon: "search" },
      { step: "2", title: "Dual Retrieval", desc: "Simultaneous vector similarity + keyword match", icon: "copy" },
      { step: "3", title: "RRF Fusion", desc: "Reciprocal Rank Fusion score aggregation", icon: "layers" },
      { step: "4", title: "Snippet Highlighter", desc: "Contextual snippet generation & bolding", icon: "highlighter" }
    ],
    codeSnippets: {
      python: `from cortexhub import SemanticSearchClient

search = SemanticSearchClient(api_key="ctx_live_search_77412")
results = search.query(
    index_name="products_v2",
    query="wireless noise cancelling ear buds for sports",
    filters={"brand": "Sony", "in_stock": True}
)
for hit in results.hits:
    print(f"Hit: {hit.title} | Relevance: {hit.score}")`,
      curl: `curl -X POST https://api.cortex-hub.io/v1/search/query \\
  -H "Authorization: Bearer ctx_live_search_77412" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "wireless earbuds", "filters": {"in_stock": true}}'`
    },
    reviews: [
      {
        id: "rev-8",
        buyerName: "Danielle Martinez (Staff Engineer)",
        rating: 5,
        version: "v1.2.5",
        date: "2026-08-05",
        title: "Replaced our fragile Elasticsearch cluster in 3 days",
        comment: "Zero zero-hit queries since deployment. The reciprocal rank fusion gracefully balances exact SKU searches with conceptual intent."
      }
    ]
  },
  {
    id: "quiz-generator",
    buyerTitle: "Automated Exam & Quiz Creator",
    businessCategory: "\u270d\ufe0f Create Content",
    buyerValueProp: "Generate multiple-choice questions, flashcards, and grading rubrics from textbooks or training modules in seconds.",
    channels: ["Canvas", "Moodle", "Web Portal", "PDF Export"],
    setupComplexity: "Instant (<5 mins)",
    prerequisites: "Course materials, slides, or training PDFs",
    goodFor: ["Corporate Training", "Universities", "EdTech Companies"],
    measuredTelemetry: {
        "uptime30d": "99.94%",
        "p95Latency": "940ms",
        "evalScore": "93.8%",
        "activeInstalls": 160,
        "lastUpdated": "Sep 10, 2026"
  },
    name: "AI Quiz & Assessment Generator",
    category: "EdTech",
    categoryBadge: "badge-cyan",
    productType: "PROMPT_PACK",
    version: "v1.0.8",
    sellerName: "Neuromorphic AI",
    sellerHandle: "@neuromorphic",
    sellerVerified: true,
    sellerRating: 4.82,
    verificationStatus: "VERIFIED",
    shortDesc: "Pedagogical test creation with difficulty tiering, distractor validation, and explanation rationales.",
    longDesc: "Engineered for colleges, universities, and EdTech platforms. Transforms textbook chapters, lecture notes, or syllabi into rigorous multiple choice, short answer, and coding assessments calibrated to Bloom's taxonomy.",
    coreOutput: "Calibrated question banks with explanations",
    targetBuyer: "Universities, EdTech Companies, Corporate Learning",
    basePrice: 349,
    priceFormatted: "$349",
    inrPriceFormatted: "₹28,900",
    tags: ["EdTech", "Education", "Assessment"],
    licenseType: "Commercial Permissive (Multi-Seat)",
    downloadSize: "310 MB",
    artifactChecksum: "f918237419283741928374192837419283741928374192837419283741928374",
    hardwareReqs: {
      vram: "4 GB VRAM",
      gpu: "CPU / Standard Inference",
      cpu: "2 Cores",
      ram: "8 GB RAM"
    },
    benchmarks: {
      accuracy: "99.2% Plausible Distractor Validation",
      latencyP95: "1.4s For 20 Questions",
      dataset: "BloomTaxonomy Standard & USMLE/GRE Curricula"
    },
    rating: 4.8,
    ratingCount: 16,
    features: [
      "Bloom's taxonomy difficulty grading (Recall to Synthesis)",
      "Automated distractor validation to prevent ambiguous choices",
      "Detailed pedagogical explanations for every answer option",
      "LMS export (Canvas, Blackboard, Moodle QTI format)",
      "Plagiarism-proof procedural question variations"
    ],
    pricingTiers: [
      { name: "Educator", price: "$349", desc: "Up to 500 generated quizzes/mo.", features: ["MCQ & Short Answer", "Bloom's taxonomy filter", "QTI LMS export", "Email support"] },
      { name: "Campus", price: "$999", featured: true, desc: "Up to 5,000 generated quizzes/mo.", features: ["Bulk textbook ingestion", "Canvas/Moodle integration", "Question bank storage"] },
      { name: "Institution", price: "Custom", desc: "Unlimited institutional deployment.", features: ["Custom pedagogical models", "Single Sign-On (SAML)", "FERPA compliant hosting"] }
    ],
    architecture: [
      { step: "1", title: "Curriculum Ingest", desc: "Segment syllabus & textbooks into learning goals", icon: "book-open" },
      { step: "2", title: "Concept Extraction", desc: "Identify core principles & key terminology", icon: "cpu" },
      { step: "3", title: "Question Synthesis", desc: "Draft stems & calibrated plausible distractors", icon: "help-circle" },
      { step: "4", title: "LMS Packaging", desc: "Format into QTI / JSON / CSV format", icon: "download" }
    ],
    codeSnippets: {
      python: `from cortexhub import QuizGeneratorClient

generator = QuizGeneratorClient(api_key="ctx_live_quiz_66190")
quiz = generator.generate_from_text(
    source_text="Mitochondria are double-membraned organelles...",
    question_count=10,
    difficulty="undergraduate",
    bloom_level="Analysis"
)
for q in quiz.questions:
    print(f"Q: {q.question_stem}\\nCorrect: {q.correct_answer}\\nRationale: {q.explanation}")`,
      curl: `curl -X POST https://api.cortex-hub.io/v1/quiz/generate \\
  -H "Authorization: Bearer ctx_live_quiz_66190" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "...", "count": 10, "difficulty": "intermediate"}'`
    },
    reviews: [
      {
        id: "rev-9",
        buyerName: "Prof. Arthur Davies (University of Edinburgh)",
        rating: 5,
        version: "v1.0.8",
        date: "2026-09-08",
        title: "Distractor generation is academically sound",
        comment: "Unlike naive LLM prompts that generate obviously fake wrong choices, this engine models common conceptual misconceptions."
      }
    ]
  },
  {
    id: "report-generator",
    buyerTitle: "Automated BI & KPI Report Generator",
    businessCategory: "\ud83d\udcca Understand Data",
    buyerValueProp: "Transform raw spreadsheets and analytics data into polished executive PDF reports with natural language insights.",
    channels: ["Scheduled Email", "Google Sheets", "PowerBI / Tableau", "Slack"],
    setupComplexity: "Easy (~15 mins)",
    prerequisites: "Database read-only connection or CSV export",
    goodFor: ["Finance Teams", "Marketing Agencies", "Ops Leads"],
    measuredTelemetry: {
        "uptime30d": "99.97%",
        "p95Latency": "1,450ms",
        "evalScore": "97.2%",
        "activeInstalls": 215,
        "lastUpdated": "Oct 08, 2026"
  },
    name: "AI Autonomous Report Generator",
    category: "Computer Vision",
    categoryBadge: "badge-cyan",
    productType: "WORKFLOW",
    version: "v1.5.0",
    sellerName: "DocuMatrix Labs",
    sellerHandle: "@documatrix",
    sellerVerified: true,
    sellerRating: 4.92,
    verificationStatus: "VERIFIED",
    shortDesc: "Synthesis of multi-source metrics, tables, and charts into executive PDF & Slide decks.",
    longDesc: "Connects directly to your data warehouses (Snowflake, BigQuery, Postgres) and operational logs to synthesize structured weekly, monthly, and quarterly business intelligence briefs complete with charts, executive takeaways, and anomaly detection.",
    coreOutput: "Publication-grade branded PDF & PPTX reports",
    targetBuyer: "Financial Analysts, Corporate Strategy, Operations",
    basePrice: 649,
    priceFormatted: "$649",
    inrPriceFormatted: "₹53,900",
    tags: ["Analytics", "BI", "Reporting", "Finance"],
    licenseType: "Commercial Permissive (Multi-Seat)",
    downloadSize: "780 MB",
    artifactChecksum: "a129837419283741928374192837419283741928374192837419283741928374",
    hardwareReqs: {
      vram: "6 GB VRAM",
      gpu: "T4 / Standard Cloud Node",
      cpu: "4 Cores",
      ram: "16 GB RAM"
    },
    benchmarks: {
      accuracy: "99.8% Numeric Variance Reconciliation",
      latencyP95: "3.8s For 24-Page Deck",
      dataset: "SEC 10-K & Corporate Board Deck Corpus"
    },
    rating: 4.8,
    ratingCount: 23,
    features: [
      "Direct SQL connector with automated chart visualization",
      "Anomaly detection and narrative variance explanation",
      "Pixel-perfect PDF and PowerPoint (PPTX) export",
      "Scheduled recurring generation with email dispatch",
      "Executive TL;DR highlight blocks"
    ],
    pricingTiers: [
      { name: "Analyst", price: "$649", desc: "Up to 100 reports/mo.", features: ["Postgres/MySQL connectors", "PDF export", "Standard chart templates", "Email support"] },
      { name: "Enterprise BI", price: "$1,699", featured: true, desc: "Up to 1,000 reports/mo.", features: ["Snowflake & BigQuery sync", "Branded PPTX/PDF generation", "Slack/Email schedule"] },
      { name: "Executive", price: "Custom", desc: "Full white-label enterprise reporting engine.", features: ["Unlimited reports", "Dedicated private VPC", "Custom styling & branding"] }
    ],
    architecture: [
      { step: "1", title: "Data Pipeline", desc: "Execute SQL query on Data Warehouse", icon: "database" },
      { step: "2", title: "Metric Analysis", desc: "Compute trends, variances & anomalous deltas", icon: "trending-up" },
      { step: "3", title: "Narrative Synthesis", desc: "Draft executive brief explaining the 'Why'", icon: "edit-3" },
      { step: "4", title: "Document Render", desc: "Generate print-ready vector PDF & PPTX", icon: "file" }
    ],
    codeSnippets: {
      python: `from cortexhub import ReportGenClient

reporter = ReportGenClient(api_key="ctx_live_rep_19041")
report = reporter.generate_executive_brief(
    data_source_id="dw_snowflake_finance",
    period="Q3-2026",
    template="executive_board_deck"
)
print("Report PDF URL:", report.download_url)`,
      curl: `curl -X POST https://api.cortex-hub.io/v1/reports/build \\
  -H "Authorization: Bearer ctx_live_rep_19041" \\
  -H "Content-Type: application/json" \\
  -d '{"source": "dw_snowflake_finance", "period": "Q3-2026"}'`
    },
    reviews: [
      {
        id: "rev-10",
        buyerName: "Maya Lin (Director of FP&A)",
        rating: 5,
        version: "v1.5.0",
        date: "2026-08-25",
        title: "Automated our Monday morning board pack completely",
        comment: "Direct Snowflake queries combined with narrative explanations save our FP&A team 12 hours every week."
      }
    ]
  },
  {
    id: "git-repair-agent",
    buyerTitle: "Automated Code Review & Bug Fixer",
    businessCategory: "\u2699\ufe0f Automate Work",
    buyerValueProp: "Automatically review pull requests, detect security bugs, and propose verified code fixes before shipping.",
    channels: ["GitHub Actions", "GitLab CI", "Bitbucket", "Terminal CLI"],
    setupComplexity: "Easy (~10 mins)",
    prerequisites: "GitHub or GitLab repository access",
    goodFor: ["Software Teams", "Indie Hackers", "DevOps Engineers"],
    measuredTelemetry: {
        "uptime30d": "99.95%",
        "p95Latency": "1,820ms",
        "evalScore": "92.7%",
        "activeInstalls": 390,
        "lastUpdated": "Oct 16, 2026"
  },
    name: "AI Git & CI/CD Repair Agent",
    category: "Developer Tools",
    categoryBadge: "badge-indigo",
    productType: "MCP_SERVER",
    version: "v2.3.0",
    sellerName: "Apex AI Labs",
    sellerHandle: "@apex-ai",
    sellerVerified: true,
    sellerRating: 4.95,
    verificationStatus: "VERIFIED",
    shortDesc: "Automated build error localization, syntax repair generation, and Git PR synthesis.",
    longDesc: "Autonomous developer companion that listens to CI/CD pipeline failure webhooks (GitHub Actions, GitLab CI), analyzes build logs and stack traces, isolates failing files, drafts targeted code diffs, and opens a pull request with explanatory unit tests.",
    coreOutput: "Tested code patches & automated Pull Requests",
    targetBuyer: "Engineering Teams, DevOps, Open Source Maintainers",
    basePrice: 749,
    priceFormatted: "$749",
    inrPriceFormatted: "₹62,300",
    tags: ["DevOps", "Developer Tools", "CI/CD", "Testing"],
    licenseType: "Commercial Permissive (Multi-Seat)",
    downloadSize: "480 MB",
    artifactChecksum: "b981273419283741928374192837419283741928374192837419283741928374",
    hardwareReqs: {
      vram: "6 GB VRAM",
      gpu: "T4 / Cloud GPU",
      cpu: "4 Cores",
      ram: "16 GB RAM"
    },
    benchmarks: {
      accuracy: "84.6% First-Try CI Green Resolution",
      latencyP95: "45s Full Diagnosis & PR Open",
      dataset: "SWE-bench Verified & GitHub 2026 Action Failures"
    },
    rating: 4.9,
    ratingCount: 29,
    features: [
      "Native GitHub Actions & GitLab CI webhook listeners",
      "Multi-language AST parser (Python, TypeScript, Go, Rust, Java)",
      "Automated unit test generation to verify proposed fixes",
      "Grounded syntax diffs with minimal code alteration",
      "Branch isolation with zero direct push to production"
    ],
    pricingTiers: [
      { name: "Dev Team", price: "$749", desc: "Up to 5 repositories & 200 fixes/mo.", features: ["GitHub Actions sync", "Automated PR creation", "Syntax & runtime fixes", "Email support"] },
      { name: "DevOps Scale", price: "$1,899", featured: true, desc: "Up to 25 repositories & 1,500 fixes/mo.", features: ["GitLab CI & Jenkins", "Multi-file refactoring", "Test suite execution", "Priority SLA"] },
      { name: "Enterprise", price: "Custom", desc: "Air-gapped on-premise code security.", features: ["Self-hosted Git servers", "Zero code data egress", "Dedicated model fine-tuning"] }
    ],
    architecture: [
      { step: "1", title: "CI Log Ingest", desc: "Parse failing build logs & stack traces", icon: "alert-circle" },
      { step: "2", title: "AST Localization", desc: "Identify exact source line & dependencies", icon: "code" },
      { step: "3", title: "Diff Generator", desc: "Synthesize targeted fix & regression test", icon: "git-pull-request" },
      { step: "4", title: "PR Dispatch", desc: "Open PR on GitHub/GitLab with test proof", icon: "check-circle" }
    ],
    codeSnippets: {
      python: `from cortexhub import GitRepairClient

agent = GitRepairClient(api_key="ctx_live_git_99412")
repair_job = agent.diagnose_and_patch(
    repo_url="https://github.com/org/payment-service",
    failing_commit_sha="e79b12a04",
    ci_log_url="https://actions.github.com/runs/182912/logs"
)
print(f"Repair PR Created: {repair_job.pull_request_url}")`,
      curl: `curl -X POST https://api.cortex-hub.io/v1/git/repair \\
  -H "Authorization: Bearer ctx_live_git_99412" \\
  -H "Content-Type: application/json" \\
  -d '{"repo": "org/payment-service", "commit": "e79b12a04"}'`
    },
    reviews: [
      {
        id: "rev-11",
        buyerName: "Travis Scott (Principal DevOps Engineer)",
        rating: 5,
        version: "v2.3.0",
        date: "2026-09-11",
        title: "Turns broken midnight builds into merged PRs before 8 AM",
        comment: "The AST patch generator doesn't do sloppy rewrites. It makes precise two-line fixes with accompanying unit tests that actually verify the fix."
      }
    ]
  }
];
