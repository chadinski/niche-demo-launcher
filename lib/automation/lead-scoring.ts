import type { BusinessInfo, LeadScoreResult, LeadTemperature, Prospect } from "@/lib/types";

function lowerFacts(input: BusinessInfo | Prospect) {
  const source =
    "businessName" in input
      ? [
          input.rawInfo,
          input.businessName,
          input.category,
          input.location,
          input.websiteUrl,
          input.socialUrl,
          input.services,
          input.notes,
          input.painPoints,
        ]
      : [
          input.pasted_raw_info,
          input.business_name,
          input.category,
          input.location,
          input.website_url,
          input.social_url,
          input.notes,
          input.extracted_summary,
        ];

  return source.filter(Boolean).join(" ").toLowerCase();
}

function hasValue(input: BusinessInfo | Prospect, key: "website" | "social" | "contact") {
  if ("businessName" in input) {
    if (key === "website") return Boolean(input.websiteUrl);
    if (key === "social") return Boolean(input.socialUrl);
    return Boolean(input.phone || input.email);
  }

  if (key === "website") return Boolean(input.website_url);
  if (key === "social") return Boolean(input.social_url);
  return Boolean(input.phone || input.email);
}

function temperature(score: number): LeadTemperature {
  if (score >= 75) return "Hot";
  if (score >= 45) return "Warm";
  return "Cold";
}

export function scoreLead(input: BusinessInfo | Prospect): LeadScoreResult {
  const text = lowerFacts(input);
  const category = "businessName" in input ? input.category.toLowerCase() : input.category.toLowerCase();
  let score = 18;
  const reasons: string[] = [];

  if (!hasValue(input, "website")) {
    score += 20;
    reasons.push("No website link is available, which creates a strong website opportunity.");
  } else if (/(outdated|old|slow|weak|not mobile|mobile issue|broken|needs update)/.test(text)) {
    score += 18;
    reasons.push("Existing online presence appears outdated or weak based on the notes.");
  } else {
    score += 6;
    reasons.push("A website exists, so the angle should focus on improvement rather than replacement.");
  }

  if (/(weak brand|poor branding|bad logo|unclear|messy|not professional|low quality)/.test(text)) {
    score += 12;
    reasons.push("Branding or clarity concerns were detected.");
  }

  if (hasValue(input, "social")) {
    score += 12;
    reasons.push("Active social presence gives outreach a warmer entry point.");
  }

  if (hasValue(input, "contact")) {
    score += 10;
    reasons.push("Contact information is available, making manual outreach practical.");
  }

  if (/(dental|clinic|medical|law|legal|accounting|real estate|interior|construction|contractor|auto|detailing|funeral|memorial|restaurant|catering|spa|salon|3d|printing|product)/.test(category)) {
    score += 12;
    reasons.push("The category has clear commercial value and benefits from stronger presentation.");
  }

  if (/(premium|luxury|wedding|private|custom|consultation|emergency|commercial|high ticket|property|family|memorial|prototype)/.test(text)) {
    score += 9;
    reasons.push("The business details suggest higher-value services or urgent customer intent.");
  }

  if (/(kingston|montego|ocho|jamaica|local|near me|service area|parish)/.test(text)) {
    score += 7;
    reasons.push("Local demand signals are present.");
  }

  if (/(urgent|asap|launch|opening|new location|season|event|booking|appointments)/.test(text)) {
    score += 10;
    reasons.push("Notes suggest timely opportunity or booking demand.");
  }

  const finalScore = Math.min(100, Math.max(0, score));
  const leadTemperature = temperature(finalScore);
  const recommendedAngle =
    leadTemperature === "Hot"
      ? "Lead with the ready-to-review website, a clear contact path, and a direct package conversation."
      : leadTemperature === "Warm"
        ? "Lead with a helpful observation and invite them to review the website direction."
        : "Use a soft educational angle and keep the ask low-pressure.";

  return {
    score: finalScore,
    temperature: leadTemperature,
    explanation: reasons,
    recommendedAngle,
  };
}
