/**
 * Cortex Hub - fictional sample documents for the sandbox presets.
 * These are invented for demonstration only. They are sent to the model as plain-text
 * documents, so answers and citations about them are generated live, not pre-written.
 */

export const SAMPLE_DOCUMENTS = {
  "healthcare-protocol": {
    title: "Clinical_Trial_Hypertension_Phase2 (fictional sample)",
    text: `FICTIONAL SAMPLE DOCUMENT - NOT A REAL PROTOCOL
Study CH-HTN-204: Phase 2 Dose-Ranging Study of Investigational Drug XR-17 in Adults with Stage 1-2 Hypertension

Section 4.2.1 Titration Guidelines
Participants start at 10 mg of XR-17 once daily. Titration proceeds at 14-day intervals in 10 mg increments. A participant moves to 20 mg daily if mean seated systolic blood pressure remains at or above 140 mmHg after 14 consecutive days and no Grade 2 or higher adverse event has occurred. The maximum dose is 40 mg daily. Any escalation beyond 20 mg requires countersignature by a second investigator within 24 hours and a serum creatinine clearance above 60 mL/min measured within the previous 7 days.

Section 5.3 Discontinuation Criteria
A participant must be discontinued immediately if any of the following occurs: seated systolic blood pressure below 95 mmHg on two consecutive readings; serum potassium above 5.8 mmol/L; creatinine clearance falling below 45 mL/min; symptomatic orthostatic hypotension of Grade 3; pregnancy; or withdrawal of consent. Discontinued participants attend a follow-up visit 14 days after the last dose.

Section 7.1 Serious Adverse Event Reporting
Investigators must report every serious adverse event (SAE) to the sponsor's safety desk within 24 hours of becoming aware of it, using form SAE-1. A follow-up report with the outcome and causality assessment is due within 7 calendar days. SAEs that are fatal or life-threatening and assessed as related to XR-17 are reported to the ethics committee within 7 days and to regulators within 15 days.`
  },
  "legal-contract": {
    title: "CloudCorp_Enterprise_MSA_2026 (fictional sample)",
    text: `FICTIONAL SAMPLE DOCUMENT - NOT A REAL CONTRACT
Master Services Agreement between CloudCorp Ltd. ("Provider") and Customer

Section 9.2 Audit Rights
Customer may audit Provider's records of data processing once in any twelve-month period, on at least thirty (30) days' written notice, during normal business hours. An additional audit is permitted within ten (10) days after a confirmed personal data breach or where a supervisory authority requires it. Audits are performed by Customer or an independent auditor bound by confidentiality, at Customer's cost, unless the audit reveals a material breach, in which case Provider reimburses reasonable audit costs.

Section 11.1 Service Level
Provider guarantees 99.9% monthly availability of the production service, excluding scheduled maintenance announced at least 72 hours in advance. If availability falls below 99.9%, Customer receives a service credit of 10% of the monthly fee; below 99.0%, 25%; below 95.0%, 50%. Credits must be claimed within 30 days of month end and are Customer's sole remedy for availability failures.

Section 12.3 Limitation of Liability
Each party's aggregate liability for direct damages is capped at the fees paid by Customer in the twelve (12) months preceding the claim. Claims for third-party intellectual property indemnification, breach of confidentiality, or gross negligence are subject to a higher cap of five times (5x) the annual contract value. Neither party is liable for indirect or consequential damages.

Section 14.2 Termination
Either party may terminate for convenience on ninety (90) days' written notice. Either party may terminate for material breach if the breach is not cured within thirty (30) days of written notice.`
  },
  "tech-spec": {
    title: "FinPay_Core_Engine_Spec_v3 (fictional sample)",
    text: `FICTIONAL SAMPLE DOCUMENT - NOT A REAL API
FinPay Core Engine - Gateway and API Specification, version 3

Section 6.4 Mutual TLS and Token Rotation
All production ingress requires mutual TLS 1.3. Client certificates must be issued by the tenant's registered enterprise root CA; the gateway checks the certificate thumbprint against the tenant registry during the handshake. Bearer tokens are issued by POST /oauth/token with a time-to-live of 3,600 seconds. To rotate without downtime, request a new token up to 300 seconds before expiry; both tokens are accepted during that overlap window. Certificates are rotated every 90 days, and the gateway accepts the previous certificate for 24 hours after a new one is registered.

Section 8.2 Idempotency
POST /v3/charges requires an Idempotency-Key header (a UUID). The gateway stores keys for 24 hours. A repeated request with the same key and the same body within that window returns the original response with header Idempotent-Replayed: true. The same key with a different body returns HTTP 422 with error code idempotency_key_reused.

Section 9.1 Rate Limits
Each tenant may send 500 requests per second sustained, with bursts up to 1,000 requests per second for at most 5 seconds. Requests beyond the burst limit receive HTTP 429 Too Many Requests with a Retry-After header in seconds and error code rate_limit_burst_exceeded.`
  }
};
