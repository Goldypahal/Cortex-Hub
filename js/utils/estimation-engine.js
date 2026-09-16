/**
 * AI Component Store & Customization Platform
 * Dynamic Price & Timeline Estimation Rule Engine (SRS Section 8.2)
 */

export function calculateCustomizationEstimate(config) {
  // Base price from component or default base
  const basePrice = config.basePrice || 499;

  let modifierSum = 0;
  let breakdown = [];
  let estimatedDays = 3; // Base delivery timeline

  // 1. Data Connectors Modifier
  const selectedConnectors = config.connectors || [];
  if (selectedConnectors.length > 0) {
    const connectorCost = selectedConnectors.length * 180;
    modifierSum += connectorCost;
    breakdown.push({
      item: `Data Connectors (${selectedConnectors.length} selected)`,
      cost: `+$${connectorCost}`,
      details: selectedConnectors.join(", ")
    });
    estimatedDays += Math.max(1, Math.floor(selectedConnectors.length * 0.75));
  }

  // 2. Authentication Complexity Modifier
  const auth = config.auth || "api_key";
  if (auth === "sso_saml") {
    modifierSum += 450;
    breakdown.push({ item: "Enterprise SAML / Okta SSO", cost: "+$450", details: "Zero-trust SAML 2.0 federation" });
    estimatedDays += 2;
  } else if (auth === "oauth") {
    modifierSum += 250;
    breakdown.push({ item: "OAuth 2.0 Integration", cost: "+$250", details: "Google / Microsoft identity" });
    estimatedDays += 1;
  } else if (auth === "rbac") {
    modifierSum += 300;
    breakdown.push({ item: "Row-Level RBAC Isolation", cost: "+$300", details: "Tenant partition permissions" });
    estimatedDays += 2;
  }

  // 3. Deployment Target Modifier
  const deployment = config.deployment || "cloud";
  if (deployment === "vpc") {
    modifierSum += 600;
    breakdown.push({ item: "Dedicated VPC Deployment", cost: "+$600", details: "AWS / GCP VPC peering & Terraform" });
    estimatedDays += 3;
  } else if (deployment === "onprem") {
    modifierSum += 1200;
    breakdown.push({ item: "Air-Gapped On-Premise Install", cost: "+$1,200", details: "Docker Compose / Helm chart package" });
    estimatedDays += 5;
  }

  // 4. White-Label Branding Modifier
  if (config.whiteLabel) {
    modifierSum += 250;
    breakdown.push({ item: "Custom White-Label Styling", cost: "+$250", details: "Custom domain, widget CSS & branded avatar" });
    estimatedDays += 1;
  }

  // 5. Feature Toggles Modifier
  const features = config.features || {};
  if (features.citations) {
    modifierSum += 150;
    breakdown.push({ item: "Strict Page Citations Engine", cost: "+$150", details: "Pixel & section attribution" });
  }
  if (features.guardrails) {
    modifierSum += 250;
    breakdown.push({ item: "Hallucination Guardrails", cost: "+$250", details: "Confidence thresholding & PII filter" });
    estimatedDays += 1;
  }
  if (features.analytics) {
    modifierSum += 180;
    breakdown.push({ item: "Audit Logs & Cost Telemetry", cost: "+$180", details: "Per-request token & latency logs" });
  }
  if (features.multilingual) {
    modifierSum += 200;
    breakdown.push({ item: "40+ Language Support", cost: "+$200", details: "Auto-language detection & translation" });
    estimatedDays += 1;
  }
  if (features.humanHandover) {
    modifierSum += 150;
    breakdown.push({ item: "Human-in-the-Loop Handover", cost: "+$150", details: "Escalation to Zendesk/Intercom/Slack" });
  }

  const minTotalUsd = basePrice + modifierSum;
  const maxTotalUsd = Math.round(minTotalUsd * 1.25); // 25% upper buffer for complex edge cases

  const usdToInrRate = 83.5;
  const minTotalInr = Math.round(minTotalUsd * usdToInrRate);
  const maxTotalInr = Math.round(maxTotalUsd * usdToInrRate);

  const minDays = estimatedDays;
  const maxDays = estimatedDays + 3;

  return {
    basePrice,
    modifierSum,
    breakdown,
    minTotalUsd,
    maxTotalUsd,
    formattedUsdRange: `$${minTotalUsd.toLocaleString()} - $${maxTotalUsd.toLocaleString()}`,
    formattedInrRange: `₹${minTotalInr.toLocaleString()} - ₹${maxTotalInr.toLocaleString()}`,
    deliveryTimeline: `${minDays} - ${maxDays} Business Days`
  };
}
