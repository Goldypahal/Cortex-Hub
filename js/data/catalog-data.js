/**
 * AI Component Store & Customization Platform
 * Product Catalog Data (All 10 SRS Appendix A Components)
 */

export const CATALOG_COMPONENTS = [
  {
    id: "rag-chatbot",
    name: "Enterprise RAG Chatbot",
    category: "Chatbots",
    categoryBadge: "badge-indigo",
    version: "v1.3.2",
    shortDesc: "Accurate, cited question-answering over private enterprise documentation with zero hallucinations.",
    longDesc: "Production-grade Retrieval-Augmented Generation (RAG) system engineered for high-stakes enterprise compliance. Features hybrid dense/sparse vector retrieval, context-aware re-ranking, document source attribution down to page/paragraph, and customizable security guardrails.",
    coreOutput: "Cited Q&A over internal documents",
    targetBuyer: "Colleges, Law Firms, Healthcare, Insurance",
    basePrice: 499,
    priceFormatted: "$499",
    inrPriceFormatted: "₹41,500",
    tags: ["Legal", "Healthcare", "EdTech", "Compliance"],
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
      python: `from aistore import RAGChatbotClient

client = RAGChatbotClient(api_key="sk-live-rag-...")

# Ingest and query
response = client.query(
    knowledge_base_id="kb_legal_contracts_2026",
    prompt="What are the non-compete indemnification terms in Section 12?",
    retrieval_mode="hybrid",
    top_k=4
)

print("Answer:", response.answer)
for citation in response.citations:
    print(f"[{citation.doc_title} - Page {citation.page_no}]: {citation.excerpt}")`,
      curl: `curl -X POST https://api.aicomponents.io/v1/rag/query \\
  -H "Authorization: Bearer sk-live-rag-..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "knowledge_base_id": "kb_legal_contracts_2026",
    "prompt": "What are the indemnification terms in Section 12?",
    "retrieval_mode": "hybrid",
    "top_k": 4
  }'`
    }
  },
  {
    id: "customer-support-bot",
    name: "AI Customer Support Agent",
    category: "Chatbots",
    categoryBadge: "badge-indigo",
    version: "v2.1.0",
    shortDesc: "Autonomous tier-1 support agent with live website chat, CRM sync, and smart ticket escalation.",
    longDesc: "An omnichannel customer support agent capable of resolving up to 70% of inbound tickets autonomously. Integrates seamlessly with Zendesk, Freshdesk, HubSpot, and WhatsApp Business. Detects user frustration and escalates with complete conversation summaries.",
    coreOutput: "Website chat, CRM sync, automated ticket triage",
    targetBuyer: "E-Commerce, SaaS, Financial Services",
    basePrice: 599,
    priceFormatted: "$599",
    inrPriceFormatted: "₹49,800",
    tags: ["E-Commerce", "SaaS", "Support", "Automation"],
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
      python: `from aistore import SupportBotClient

bot = SupportBotClient(api_key="sk-live-support-...")
ticket = bot.handle_inbound(
    customer_id="cust_9921",
    message="I need to change shipping address for order #88124",
    channel="web_widget"
)
print("Bot Action:", ticket.suggested_action)`,
      curl: `curl -X POST https://api.aicomponents.io/v1/support/inbound \\
  -H "Authorization: Bearer sk-live-support-..." \\
  -H "Content-Type: application/json" \\
  -d '{"customer_id": "cust_9921", "message": "Change address for order #88124"}'`
    }
  },
  {
    id: "resume-screener",
    name: "Resume Screening & Match Engine",
    category: "Document AI",
    categoryBadge: "badge-cyan",
    version: "v1.4.0",
    shortDesc: "Semantic candidate profiling, skill gap extraction, and unbiased job requisition ranking.",
    longDesc: "High-throughput resume parser that extracts structured skills, work history, and educational timelines from multi-format CVs. Computes multidimensional semantic fit scores against complex job descriptions while eliminating unconscious bias.",
    coreOutput: "Structured candidate scorecards & skill taxonomy",
    targetBuyer: "Recruitment Agencies, Enterprise HR, Tech Staffing",
    basePrice: 699,
    priceFormatted: "$699",
    inrPriceFormatted: "₹58,200",
    tags: ["Recruitment", "HR Tech", "Enterprise"],
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
      python: `from aistore import ResumeScreenerClient

screener = ResumeScreenerClient(api_key="sk-live-rec-...")
result = screener.rank_candidate(
    job_description_id="job_staff_backend_2026",
    resume_file_path="candidates/john_doe_resume.pdf"
)
print(f"Candidate Score: {result.match_score}%")
print(f"Top Skills: {result.matched_skills}")`,
      curl: `curl -X POST https://api.aicomponents.io/v1/screener/evaluate \\
  -H "Authorization: Bearer sk-live-rec-..." \\
  -F "job_id=job_staff_backend_2026" \\
  -F "resume=@candidate.pdf"`
    }
  },
  {
    id: "doc-analyzer",
    name: "AI Document Analyzer & Extractor",
    category: "Document AI",
    categoryBadge: "badge-cyan",
    version: "v2.0.1",
    shortDesc: "Intelligent table extraction, financial clause verification, and multi-doc cross comparison.",
    longDesc: "Engineered for finance, audit, insurance, and legal teams. Ingests complex multi-page financial statements, insurance policies, and supplier contracts to extract tabular data, identify conflicting clauses, and produce structured audit sheets.",
    coreOutput: "JSON field extraction & multi-clause delta reports",
    targetBuyer: "Legal Firms, Hedge Funds, Insurance Underwriters",
    basePrice: 799,
    priceFormatted: "$799",
    inrPriceFormatted: "₹66,500",
    tags: ["Finance", "Legal", "Insurance", "Audit"],
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
      python: `from aistore import DocAnalyzerClient

analyzer = DocAnalyzerClient(api_key="sk-live-doc-...")
extracted = analyzer.extract_fields(
    document_url="https://s3.aws.com/leases/commercial_lease_2026.pdf",
    schema={"rent_amount": "number", "escalation_rate": "number", "term_months": "integer"}
)
print("Extracted Lease Data:", extracted.data)`,
      curl: `curl -X POST https://api.aicomponents.io/v1/analyzer/extract \\
  -H "Authorization: Bearer sk-live-doc-..." \\
  -H "Content-Type: application/json" \\
  -d '{"doc_url": "https://...", "schema_id": "commercial_lease"}'`
    }
  },
  {
    id: "meeting-intelligence",
    name: "Meeting Intelligence & Action Engine",
    category: "Productivity",
    categoryBadge: "badge-emerald",
    version: "v1.1.0",
    shortDesc: "Speaker-separated transcript analysis, decision tracking, and Jira/Asana task generation.",
    longDesc: "Transforms raw multi-speaker audio transcripts into concise executive briefs, key decisions logs, and Jira/Linear work items assigned to participants with deadlines.",
    coreOutput: "Executive meeting summaries & assigned action items",
    targetBuyer: "Startups, Remote Engineering Teams, Consultancies",
    basePrice: 399,
    priceFormatted: "$399",
    inrPriceFormatted: "₹33,200",
    tags: ["Productivity", "SaaS", "Engineering"],
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
      python: `from aistore import MeetingIntelClient

client = MeetingIntelClient(api_key="sk-live-meet-...")
summary = client.analyze_transcript(
    transcript_text="Alice: Let's ship the migration by Friday. Bob: I'll finish the tests.",
    dispatch_integrations=["jira", "slack"]
)
print("Action Items:", summary.action_items)`,
      curl: `curl -X POST https://api.aicomponents.io/v1/meetings/analyze \\
  -H "Authorization: Bearer sk-live-meet-..." \\
  -H "Content-Type: application/json" \\
  -d '{"transcript": "...", "create_tasks": true}'`
    }
  },
  {
    id: "recommendation-engine",
    name: "AI Personalization & Recommendation Engine",
    category: "Search & Recs",
    categoryBadge: "badge-amber",
    version: "v2.2.0",
    shortDesc: "Real-time user vector embeddings, next-best-action prediction, and dynamic content re-ranking.",
    longDesc: "High-performance vector recommendation engine processing tens of thousands of requests per second with under 15ms latency. Computes dynamic user taste vectors combining past purchases, browse history, and real-time session behavior.",
    coreOutput: "Ranked personalized product & content feeds",
    targetBuyer: "EdTech, E-Commerce, Streaming Media",
    basePrice: 899,
    priceFormatted: "$899",
    inrPriceFormatted: "₹74,900",
    tags: ["E-Commerce", "EdTech", "Media", "High-Throughput"],
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
      python: `from aistore import RecEngineClient

recs = RecEngineClient(api_key="sk-live-rec-...")
products = recs.get_recommendations(
    user_id="usr_88319",
    context_tags=["electronics", "headphones"],
    limit=6
)
for p in products:
    print(f"Recommend: {p.title} (Score: {p.affinity_score})")`,
      curl: `curl -X POST https://api.aicomponents.io/v1/recs/feed \\
  -H "Authorization: Bearer sk-live-rec-..." \\
  -H "Content-Type: application/json" \\
  -d '{"user_id": "usr_88319", "limit": 6}'`
    }
  },
  {
    id: "semantic-search-api",
    name: "Semantic Neural Search API",
    category: "Search & Recs",
    categoryBadge: "badge-amber",
    version: "v1.2.5",
    shortDesc: "Meaning-based multi-modal search combining semantic vector distance with full-text BM25.",
    longDesc: "Drop-in replacement for legacy keyword search engines. Understands synonyms, intent, typographical errors, and contextual semantics across product databases, documentation, and customer records.",
    coreOutput: "Ranked semantic query hits with snippet highlights",
    targetBuyer: "SaaS Platforms, Internal Knowledge Portals",
    basePrice: 549,
    priceFormatted: "$549",
    inrPriceFormatted: "₹45,600",
    tags: ["Search", "Developer Tools", "Knowledge Base"],
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
      python: `from aistore import SemanticSearchClient

search = SemanticSearchClient(api_key="sk-live-search-...")
results = search.query(
    index_name="products_v2",
    query="wireless noise cancelling ear buds for sports",
    filters={"brand": "Sony", "in_stock": True}
)
for hit in results.hits:
    print(f"Hit: {hit.title} | Relevance: {hit.score}")`,
      curl: `curl -X POST https://api.aicomponents.io/v1/search/query \\
  -H "Authorization: Bearer sk-live-search-..." \\
  -H "Content-Type: application/json" \\
  -d '{"query": "wireless earbuds", "filters": {"in_stock": true}}'`
    }
  },
  {
    id: "quiz-generator",
    name: "AI Quiz & Assessment Generator",
    category: "EdTech",
    categoryBadge: "badge-cyan",
    version: "v1.0.8",
    shortDesc: "Pedagogical test creation with difficulty tiering, distractor validation, and explanation rationales.",
    longDesc: "Engineered for colleges, universities, and EdTech platforms. Transforms textbook chapters, lecture notes, or syllabi into rigorous multiple choice, short answer, and coding assessments calibrated to Bloom's taxonomy.",
    coreOutput: "Calibrated question banks with explanations",
    targetBuyer: "Universities, EdTech Companies, Corporate Learning",
    basePrice: 349,
    priceFormatted: "$349",
    inrPriceFormatted: "₹28,900",
    tags: ["EdTech", "Education", "Assessment"],
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
      python: `from aistore import QuizGeneratorClient

generator = QuizGeneratorClient(api_key="sk-live-quiz-...")
quiz = generator.generate_from_text(
    source_text="Mitochondria are double-membraned organelles...",
    question_count=10,
    difficulty="undergraduate",
    bloom_level="Analysis"
)
for q in quiz.questions:
    print(f"Q: {q.question_stem}\\nCorrect: {q.correct_answer}\\nRationale: {q.explanation}")`,
      curl: `curl -X POST https://api.aicomponents.io/v1/quiz/generate \\
  -H "Authorization: Bearer sk-live-quiz-..." \\
  -H "Content-Type: application/json" \\
  -d '{"text": "...", "count": 10, "difficulty": "intermediate"}'`
    }
  },
  {
    id: "report-generator",
    name: "AI Autonomous Report Generator",
    category: "Document AI",
    categoryBadge: "badge-cyan",
    version: "v1.5.0",
    shortDesc: "Synthesis of multi-source metrics, tables, and charts into executive PDF & Slide decks.",
    longDesc: "Connects directly to your data warehouses (Snowflake, BigQuery, Postgres) and operational logs to synthesize structured weekly, monthly, and quarterly business intelligence briefs complete with charts, executive takeaways, and anomaly detection.",
    coreOutput: "Publication-grade branded PDF & PPTX reports",
    targetBuyer: "Financial Analysts, Corporate Strategy, Operations",
    basePrice: 649,
    priceFormatted: "$649",
    inrPriceFormatted: "₹53,900",
    tags: ["Analytics", "BI", "Reporting", "Finance"],
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
      python: `from aistore import ReportGenClient

reporter = ReportGenClient(api_key="sk-live-rep-...")
report = reporter.generate_executive_brief(
    data_source_id="dw_snowflake_finance",
    period="Q3-2026",
    template="executive_board_deck"
)
print("Report PDF URL:", report.download_url)`,
      curl: `curl -X POST https://api.aicomponents.io/v1/reports/build \\
  -H "Authorization: Bearer sk-live-rep-..." \\
  -H "Content-Type: application/json" \\
  -d '{"source": "dw_snowflake_finance", "period": "Q3-2026"}'`
    }
  },
  {
    id: "git-repair-agent",
    name: "AI Git & CI/CD Repair Agent",
    category: "Developer Tools",
    categoryBadge: "badge-indigo",
    version: "v2.3.0",
    shortDesc: "Automated build error localization, syntax repair generation, and Git PR synthesis.",
    longDesc: "Autonomous developer companion that listens to CI/CD pipeline failure webhooks (GitHub Actions, GitLab CI), analyzes build logs and stack traces, isolates failing files, drafts targeted code diffs, and opens a pull request with explanatory unit tests.",
    coreOutput: "Tested code patches & automated Pull Requests",
    targetBuyer: "Engineering Teams, DevOps, Open Source Maintainers",
    basePrice: 749,
    priceFormatted: "$749",
    inrPriceFormatted: "₹62,300",
    tags: ["DevOps", "Developer Tools", "CI/CD", "Testing"],
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
      python: `from aistore import GitRepairClient

agent = GitRepairClient(api_key="sk-live-git-...")
repair_job = agent.diagnose_and_patch(
    repo_url="https://github.com/org/payment-service",
    failing_commit_sha="e79b12a04",
    ci_log_url="https://actions.github.com/runs/182912/logs"
)
print(f"Repair PR Created: {repair_job.pull_request_url}")`,
      curl: `curl -X POST https://api.aicomponents.io/v1/git/repair \\
  -H "Authorization: Bearer sk-live-git-..." \\
  -H "Content-Type: application/json" \\
  -d '{"repo": "org/payment-service", "commit": "e79b12a04"}'`
    }
  }
];
