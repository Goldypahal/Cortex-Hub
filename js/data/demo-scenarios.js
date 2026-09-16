/**
 * AI Component Store & Customization Platform
 * Playground Demo Scenarios & Grounded Citations Dataset
 */

export const DEMO_SCENARIOS = [
  {
    id: "healthcare-protocol",
    title: "Clinical Hypertension Protocol (PDF)",
    filename: "Clinical_Trial_Hypertension_Phase2.pdf",
    filesize: "4.8 MB",
    pages: 22,
    industry: "Healthcare & Life Sciences",
    sampleQuestions: [
      "What is the recommended dosage escalation protocol for hypertensive patients in Phase 2?",
      "Under what clinical criteria must a patient be immediately discontinued from the trial?",
      "What are the reporting requirements for serious adverse events (SAEs)?"
    ],
    defaultQuestion: "What is the recommended dosage escalation protocol for hypertensive patients in Phase 2?",
    simulatedResponse: {
      answer: "According to Section 4.2.1 of the Phase 2 Protocol, dosage escalation must follow a bi-weekly stepwise titration: Patients commence on a baseline dose of 10mg once daily. If systolic blood pressure remains ≥ 140 mmHg after 14 consecutive days without grade 2+ adverse events, the dosage is titrated to 20mg daily. Escalation to the maximum ceiling of 40mg daily requires secondary physician sign-off and baseline renal function re-evaluation (serum creatinine clearance > 60 mL/min).",
      citations: [
        {
          docTitle: "Clinical_Trial_Hypertension_Phase2.pdf",
          pageNo: 11,
          section: "Section 4.2.1: Titration Guidelines & Biomarker Thresholds",
          excerpt: "Titration shall proceed at 14-day intervals in 10mg increments up to 40mg/day, conditioned upon serum creatinine clearance remaining strictly above 60 mL/min and absence of Grade 2 postural hypotension.",
          confidence: 99.4
        },
        {
          docTitle: "Clinical_Trial_Hypertension_Phase2.pdf",
          pageNo: 14,
          section: "Table 3: Phase 2 Dosage Ceilings",
          excerpt: "Maximum therapeutic dose: 40mg PO Q.D. Any escalation beyond 20mg mandates secondary investigator countersignature within 24 hours.",
          confidence: 98.1
        }
      ],
      telemetry: {
        latencyMs: 940,
        tokensPrompt: 412,
        tokensCompletion: 148,
        costUsd: 0.0028,
        costInr: 0.23,
        retrievalMethod: "Hybrid (pgvector + BM25)",
        model: "Claude 3.5 Sonnet"
      }
    }
  },
  {
    id: "legal-contract",
    title: "Enterprise Master Services Agreement (DOCX)",
    filename: "CloudCorp_Enterprise_MSA_2026.docx",
    filesize: "2.1 MB",
    pages: 36,
    industry: "Legal & Enterprise Procurement",
    sampleQuestions: [
      "What are the indemnification liability caps and termination notice periods?",
      "Under what conditions can either party audit data processing records?",
      "What is the defined SLA uptime guarantee and service credit schedule?"
    ],
    defaultQuestion: "What are the indemnification liability caps and termination notice periods?",
    simulatedResponse: {
      answer: "Under Section 12.3 of the MSA, aggregate liability for direct damages is capped at the total fees paid by Customer during the preceding twelve (12) months. However, third-party intellectual property indemnification and gross negligence claims are subject to a super-cap of five times (5x) annual contract value. For termination: either party may terminate for convenience with ninety (90) days prior written notice, or immediately for cause upon thirty (30) days notice if an uncured material breach persists.",
      citations: [
        {
          docTitle: "CloudCorp_Enterprise_MSA_2026.docx",
          pageNo: 18,
          section: "Section 12.3: Limitation of Direct and Consequential Damages",
          excerpt: "Neither party's aggregate cumulative liability shall exceed the total amount paid by Customer in the 12-month period immediately preceding the event giving rise to liability, except for breaches of Section 14 (IP Indemnification).",
          confidence: 99.7
        },
        {
          docTitle: "CloudCorp_Enterprise_MSA_2026.docx",
          pageNo: 23,
          section: "Section 16.2: Termination for Convenience and Material Breach",
          excerpt: "Either party may terminate this Agreement without cause upon giving no less than ninety (90) calendar days prior written notice to the other party.",
          confidence: 97.9
        }
      ],
      telemetry: {
        latencyMs: 1120,
        tokensPrompt: 520,
        tokensCompletion: 165,
        costUsd: 0.0035,
        costInr: 0.29,
        retrievalMethod: "Hybrid (Dense Vector + Cohere Re-ranker)",
        model: "GPT-4o"
      }
    }
  },
  {
    id: "tech-spec",
    title: "Financial API Specs & Architecture (OpenAPI)",
    filename: "FinPay_Core_Engine_Spec_v3.yaml",
    filesize: "1.4 MB",
    pages: 42,
    industry: "FinTech & Payments",
    sampleQuestions: [
      "How do I configure mutual TLS (mTLS) with token rotation on the edge gateway?",
      "What is the idempotency key window for processing charge requests?",
      "What error status code is returned on rate-limiting burst breaches?"
    ],
    defaultQuestion: "How do I configure mutual TLS (mTLS) with token rotation on the edge gateway?",
    simulatedResponse: {
      answer: "Per Section 6.4 of the Gateway Architecture Spec, all production ingress traffic mandates mutual TLS (mTLS v1.3) with client certificates issued by the designated enterprise Root CA. Certificate thumbprints are verified against the tenant registry at handshake time. For token rotation, bearer tokens issued via `/oauth/token` carry a 3,600-second TTL with a 300-second overlapping grace window during which both the outgoing and active cryptographic keys remain accepted.",
      citations: [
        {
          docTitle: "FinPay_Core_Engine_Spec_v3.yaml",
          pageNo: 27,
          section: "Section 6.4: Zero-Trust Ingress & mTLS Enforcement",
          excerpt: "The Edge Envoy proxy enforces mTLS utilizing X.509 v3 certificates with SHA-256 signatures. Inbound requests lacking valid thumbprint matches in Redis tenant vault are rejected with HTTP 495.",
          confidence: 99.2
        },
        {
          docTitle: "FinPay_Core_Engine_Spec_v3.yaml",
          pageNo: 31,
          section: "Section 7.1: JWT Lifetimes and Key Rotation",
          excerpt: "Token keys rotate every 24 hours. A 5-minute rollover grace period is maintained to allow pending in-flight payment settlement queries to complete without retry exceptions.",
          confidence: 98.6
        }
      ],
      telemetry: {
        latencyMs: 870,
        tokensPrompt: 388,
        tokensCompletion: 142,
        costUsd: 0.0024,
        costInr: 0.20,
        retrievalMethod: "Dense Vector (pgvector HNSW)",
        model: "Gemini 1.5 Pro"
      }
    }
  }
];
