import type { BusinessInfo, Prospect, QualityAudit, QualityAuditItem } from "@/lib/types";

function includesAny(html: string, values: string[]) {
  const lower = html.toLowerCase();
  return values.filter(Boolean).some((value) => lower.includes(value.toLowerCase()));
}

function item(label: string, passed: boolean, detail: string): QualityAuditItem {
  return { label, passed, detail };
}

export function auditWebsite(html: string, input: BusinessInfo | Prospect): QualityAudit {
  const name = "businessName" in input ? input.businessName : input.business_name;
  const category = "businessName" in input ? input.category : input.category;
  const phone = "businessName" in input ? input.phone : input.phone;
  const email = "businessName" in input ? input.email : input.email;
  const contactPresent = Boolean(phone || email || includesAny(html, ["wa.me", "mailto:", "contact"]));
  const lower = html.toLowerCase();

  const items = [
    item("Business name present", includesAny(html, [name]), name ? "Business name appears in the HTML." : "Business name is missing from the profile."),
    item("Contact info present", contactPresent, contactPresent ? "A contact path is present." : "Add phone, WhatsApp, email, or a clear contact CTA."),
    item("Clear CTA", includesAny(html, ["request", "book", "call", "contact", "quote", "availability"]), "CTA language should guide visitors to the next step."),
    item("Mobile responsive", includesAny(html, ["@media", "viewport"]), "Viewport metadata and responsive CSS should be present."),
    item("SEO metadata", includesAny(html, ["<title", "description", "og:title"]), "SEO title, description, and Open Graph tags should exist."),
    item("No fake claims", !/(rated #1|award-winning|guaranteed|5-star|trusted by \d|years of experience)/i.test(html), "Avoid unsupported reviews, awards, guarantees, and statistics."),
    item("Correct category", includesAny(html, [category]), category ? "Business category appears in the site." : "Category is missing from the profile."),
    item("Strong hero", includesAny(html, ["<section class=\"hero", "hero"]), "Hero section should be present and visually prominent."),
    item("Services section", includesAny(html, ["id=\"services\"", "service-card", "services"]), "Services/products should be visible."),
    item("Contact section", includesAny(html, ["id=\"contact\"", "contact"]), "Contact section should be available."),
    item("FAQ section", includesAny(html, ["faq", "questions"]), "FAQ or objection-handling content should be present."),
    item("Visual polish", html.length > 25000 && includesAny(html, ["gallery", "reveal", "shadow", "border-radius"]), "Generated file should include rich structure and refined CSS."),
  ];

  const passedCount = items.filter((check) => check.passed).length;
  const warnings = items.filter((check) => !check.passed).map((check) => check.detail);
  const score = Math.round((passedCount / items.length) * 100);

  if (lower.includes("representative imagery")) {
    warnings.push("Representative imagery should be replaced with verified business photography before final publication.");
  }

  return {
    score,
    passed: score >= 82,
    items,
    warnings,
  };
}
