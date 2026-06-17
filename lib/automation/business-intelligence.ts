import type { BusinessInfo, BusinessIntelligence, LeadScoreResult, Prospect } from "@/lib/types";

function pickCategory(input: BusinessInfo | Prospect) {
  return ("businessName" in input ? input.category : input.category).toLowerCase();
}

function businessName(input: BusinessInfo | Prospect) {
  return "businessName" in input ? input.businessName || "This business" : input.business_name || "This business";
}

function location(input: BusinessInfo | Prospect) {
  return "businessName" in input ? input.location : input.location;
}

function hasWebsite(input: BusinessInfo | Prospect) {
  return "businessName" in input ? Boolean(input.websiteUrl) : Boolean(input.website_url);
}

function suggestedPrice(category: string, fallback: string) {
  if (/(dental|medical|clinic|law|accounting|real estate|interior)/.test(category)) return "$1,500 - $3,500";
  if (/(restaurant|catering|funeral|memorial|construction|contractor|auto|detailing)/.test(category)) return "$1,200 - $2,500";
  if (/(artist|music|flor|salon|spa|3d|printing)/.test(category)) return "$900 - $2,000";
  return fallback || "$1,000 - $2,000";
}

export function generateBusinessIntelligence(
  input: BusinessInfo | Prospect,
  lead: LeadScoreResult,
): BusinessIntelligence {
  const category = pickCategory(input);
  const name = businessName(input);
  const where = location(input);
  const localPhrase = where ? ` in ${where}` : "";

  let targetCustomer = `Local customers looking for clear ${category || "service"} options${localPhrase}.`;
  let strategy = "Present the offer clearly, show service paths, and make contact effortless.";
  let cta = "Request availability";
  let packageName = "Premium local website";
  let objections = ["Need to confirm scope", "May already rely on social media", "May ask about price before reviewing value"];

  if (/(restaurant|cafe|food|catering)/.test(category)) {
    targetCustomer = `Diners, event hosts, and visitors deciding where to eat or book${localPhrase}.`;
    strategy = "Lead with atmosphere, menu clarity, reservations, private dining, and food imagery.";
    cta = "Reserve or view menu";
    packageName = "Restaurant experience website";
    objections = ["Menu content may not be ready", "May prefer social media only", "May need booking integration later"];
  } else if (/(funeral|memorial|tribute|cremation)/.test(category)) {
    targetCustomer = `Families looking for calm, respectful guidance${localPhrase}.`;
    strategy = "Use a soft, dignified layout with services, consultation paths, tribute options, and gentle contact routes.";
    cta = "Speak with someone";
    packageName = "Memorial care website";
    objections = ["Sensitive tone must be exact", "Services and pricing may need careful review", "Family trust matters more than speed"];
  } else if (/(auto|mechanic|detailing|repair)/.test(category)) {
    targetCustomer = `Drivers who need trustworthy diagnostics, repair, detailing, or servicing${localPhrase}.`;
    strategy = "Use a sharp, confident layout with service cards, process clarity, WhatsApp contact, and estimate requests.";
    cta = "Request an estimate";
    packageName = "Service shop conversion website";
  } else if (/(flor|flower|event|wedding)/.test(category)) {
    targetCustomer = `People planning gifts, events, weddings, or special occasions${localPhrase}.`;
    strategy = "Lead with beautiful imagery, occasion-based packages, custom order prompts, and social proof placeholders.";
    cta = "Ask about an arrangement";
    packageName = "Florist/event showcase website";
  } else if (/(dental|clinic|medical|wellness)/.test(category)) {
    targetCustomer = `Patients looking for clear, reassuring care and appointment options${localPhrase}.`;
    strategy = "Use a bright, calm structure with service clarity, appointment CTAs, comfort language, and trust-building FAQs.";
    cta = "Book an appointment";
    packageName = "Clinic trust website";
  } else if (/(artist|music|violin|band|dj)/.test(category)) {
    targetCustomer = "Event planners, couples, venues, and people looking for live performance bookings.";
    strategy = "Build around a cinematic portfolio, media/gallery emphasis, booking inquiry, and event types.";
    cta = "Check availability";
    packageName = "Artist booking website";
  } else if (/(3d|printing|product|prototype)/.test(category)) {
    targetCustomer = "Creators, small businesses, and buyers who need custom products, signs, prototypes, or design help.";
    strategy = "Emphasize custom work, technical precision, product categories, quote requests, and production examples.";
    cta = "Request a custom quote";
    packageName = "Product studio website";
  }

  const onlineWeakness = hasWebsite(input)
    ? "Existing website presence can likely be sharpened around mobile clarity, conversion paths, and stronger visual proof."
    : "No clear website link is available, so customers may be relying on scattered social or directory information.";

  return {
    summary: `${name} appears to be a ${category || "local business"}${localPhrase}. The best opportunity is to turn scattered business details into a clear, polished customer path.`,
    targetCustomer,
    onlineWeakness,
    websiteStrategy: strategy,
    bestCta: cta,
    suggestedPackage: packageName,
    suggestedPriceRange: suggestedPrice(category, "businessName" in input ? input.packagePrice : input.package_price),
    outreachAngle: lead.recommendedAngle,
    objections,
  };
}
