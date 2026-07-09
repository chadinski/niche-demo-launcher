export type LeadIndustryPriority = "High" | "Medium-High" | "Medium" | "Medium-Low" | "Low";

export interface LeadIndustryTarget {
  id: string;
  rank: number;
  industry: string;
  priority: LeadIndustryPriority;
  searchLabel: string;
  searchTerms: string[];
  worthTargeting: string;
  commonWeaknesses: string[];
  bestWebsiteOffer: string;
  outreachHook: string;
  qualificationSignals: string[];
  avoidSignals: string[];
}

export const LEAD_INDUSTRY_TARGETS: LeadIndustryTarget[] = [
  {
    id: "funeral-memorial",
    rank: 1,
    industry: "Funeral, memorial, caskets, urns, and headstones",
    priority: "High",
    searchLabel: "Funeral home",
    searchTerms: ["funeral home", "memorial service", "casket seller", "urn seller", "headstone maker"],
    worthTargeting: "Urgent, emotional, high-trust decisions where unclear services or contact friction can cost calls immediately.",
    commonWeaknesses: ["Outdated websites", "Facebook-only presence", "unclear service options", "weak mobile contact path", "missing product galleries"],
    bestWebsiteOffer: "Respectful trust website with services, memorial products, location, FAQ, and call or WhatsApp CTAs.",
    outreachHook: "Families need clear help fast on mobile; this concept makes services and contact easier to understand.",
    qualificationSignals: ["funeral", "memorial", "chapel", "cremation", "casket", "urn", "headstone", "obituary"],
    avoidSignals: ["job", "career", "death notice only", "news article"],
  },
  {
    id: "tourism-hospitality",
    rank: 2,
    industry: "Tourism, villas, guest houses, tours, transfers, and experiences",
    priority: "High",
    searchLabel: "Tour business",
    searchTerms: ["villa rental", "guest house", "tour guide", "airport transfer", "boat tour", "rafting experience"],
    worthTargeting: "Visual, booking-driven businesses where a stronger website can turn interest into direct reservations.",
    commonWeaknesses: ["Instagram-only presentation", "weak booking flow", "poor photo hierarchy", "unclear packages", "missing pickup or location details"],
    bestWebsiteOffer: "Visual booking site with packages, gallery, availability CTA, FAQs, pickup details, and direct WhatsApp booking.",
    outreachHook: "Your experience already has visual appeal; this concept turns photos and details into a clearer booking path.",
    qualificationSignals: ["tour", "villa", "guest house", "transfer", "excursion", "rafting", "boat", "booking"],
    avoidSignals: ["travel blog", "government tourism listing", "hotel chain", "flight booking portal"],
  },
  {
    id: "contractors-home-services",
    rank: 3,
    industry: "Contractors and home service businesses",
    priority: "High",
    searchLabel: "Home services",
    searchTerms: ["plumber", "electrician", "roofer", "AC repair", "solar installer", "painter", "landscaper", "pest control"],
    worthTargeting: "Urgent local intent, quote requests, and trust-sensitive work inside homes or properties.",
    commonWeaknesses: ["No standalone website", "unclear service area", "buried phone number", "weak proof of work", "generic Facebook page"],
    bestWebsiteOffer: "Service-area lead-generation website with quote CTA, WhatsApp/call buttons, services, proof gallery, and FAQs.",
    outreachHook: "Customers looking for urgent home repairs need to trust and contact you quickly.",
    qualificationSignals: ["plumbing", "electrician", "roof", "repair", "solar", "painting", "landscaping", "pest"],
    avoidSignals: ["DIY article", "hardware store only", "job listing", "training course"],
  },
  {
    id: "health-clinics",
    rank: 4,
    industry: "Dentists, private clinics, med spas, physiotherapists, optical stores, and labs",
    priority: "High",
    searchLabel: "Private clinic",
    searchTerms: ["dentist", "private clinic", "med spa", "physiotherapist", "optical store", "diagnostic lab"],
    worthTargeting: "High-value appointments where trust, clarity, and mobile booking directly influence patient inquiries.",
    commonWeaknesses: ["Outdated clinic websites", "weak appointment CTA", "unclear services", "no FAQ", "poor mobile layout"],
    bestWebsiteOffer: "Trust-first appointment website with services, location, contact, patient FAQ, and booking or call CTA.",
    outreachHook: "Patients judge trust before they call; this concept makes services and appointments clearer.",
    qualificationSignals: ["clinic", "dental", "dentist", "physio", "medical", "optical", "diagnostic", "appointment"],
    avoidSignals: ["public hospital directory", "medical journal", "insurance portal", "job listing"],
  },
  {
    id: "food-restaurants",
    rank: 5,
    industry: "Restaurants, caterers, jerk centers, cafes, bakeries, and food trucks",
    priority: "High",
    searchLabel: "Restaurant",
    searchTerms: ["restaurant", "caterer", "jerk center", "cafe", "bakery", "food truck"],
    worthTargeting: "Highly visual, local, and order-driven businesses where menus, hours, and WhatsApp ordering matter.",
    commonWeaknesses: ["No online menu", "unclear hours", "poor food photo presentation", "no ordering CTA", "Facebook-only updates"],
    bestWebsiteOffer: "Menu and ordering website with food gallery, catering section, hours, location, and WhatsApp CTA.",
    outreachHook: "Your food can create interest fast; this concept makes menu viewing and ordering easier.",
    qualificationSignals: ["menu", "restaurant", "catering", "jerk", "cafe", "bakery", "food truck", "delivery"],
    avoidSignals: ["recipe blog", "food review article", "franchise aggregator"],
  },
  {
    id: "auto-services",
    rank: 6,
    industry: "Auto services",
    priority: "High",
    searchLabel: "Auto detailing",
    searchTerms: ["mechanic", "tyre shop", "car wash", "auto detailing", "tint shop", "auto electrician", "auto parts store"],
    worthTargeting: "Immediate repair and quote intent plus strong before-and-after visuals for detailing, tint, and wash services.",
    commonWeaknesses: ["No service list", "no booking path", "weak gallery", "phone hard to find", "social-only presence"],
    bestWebsiteOffer: "Service and booking website with service categories, quote CTA, gallery, location, hours, and common issues.",
    outreachHook: "Drivers need fast service info and a clear contact path; this concept makes that easier.",
    qualificationSignals: ["mechanic", "tyre", "tire", "detailing", "car wash", "tint", "auto electrician", "parts"],
    avoidSignals: ["car sales marketplace", "manufacturer page", "job listing"],
  },
  {
    id: "real-estate-property",
    rank: 7,
    industry: "Real estate, property managers, Airbnb managers, land sellers, and small developers",
    priority: "High",
    searchLabel: "Real estate agent",
    searchTerms: ["real estate agent", "property manager", "Airbnb manager", "land seller", "property developer"],
    worthTargeting: "High-ticket leads where listing presentation, inquiry capture, and trust can affect large transactions.",
    commonWeaknesses: ["Listings scattered on social", "no dedicated landing pages", "poor galleries", "weak inquiry capture", "unclear agent profile"],
    bestWebsiteOffer: "Listing and inquiry website with featured properties, gallery, inquiry form, WhatsApp CTA, and profile.",
    outreachHook: "Your listings need a polished place where buyers or renters can browse and inquire.",
    qualificationSignals: ["property", "real estate", "land", "Airbnb", "villa", "listing", "rent", "sale"],
    avoidSignals: ["large listing portal", "mortgage calculator", "news article"],
  },
  {
    id: "events-weddings",
    rank: 8,
    industry: "Event businesses",
    priority: "High",
    searchLabel: "Event planner",
    searchTerms: ["wedding decorator", "DJ", "photographer", "videographer", "tent rental", "chair rental", "florist", "event planner"],
    worthTargeting: "Visual, quote-driven businesses where a strong portfolio can produce booking inquiries.",
    commonWeaknesses: ["Instagram-only portfolio", "no package clarity", "weak quote request path", "unorganized gallery", "no availability CTA"],
    bestWebsiteOffer: "Portfolio and event inquiry website with gallery, event types, packages/process, and WhatsApp quote CTA.",
    outreachHook: "Your work is visual; this concept turns the portfolio into a clearer booking inquiry path.",
    qualificationSignals: ["wedding", "event", "decor", "DJ", "photography", "videography", "tent", "florist"],
    avoidSignals: ["event calendar only", "ticketing platform", "news article"],
  },
  {
    id: "beauty-wellness",
    rank: 9,
    industry: "Beauty and wellness businesses",
    priority: "Medium-High",
    searchLabel: "Beauty salon",
    searchTerms: ["salon", "barber", "nail tech", "lash tech", "spa", "massage therapist", "skincare studio", "fitness coach"],
    worthTargeting: "Visual, booking-heavy, social-first businesses where service menus and booking clarity matter.",
    commonWeaknesses: ["No booking website", "unclear services", "prices scattered", "no policies", "Instagram-only gallery"],
    bestWebsiteOffer: "Stylish booking website with service menu, gallery, location, hours, policies, and booking CTA.",
    outreachHook: "Your visual work deserves a cleaner booking path and better service organization.",
    qualificationSignals: ["salon", "barber", "nail", "lash", "spa", "massage", "skincare", "fitness"],
    avoidSignals: ["beauty supply only", "influencer post", "job listing"],
  },
  {
    id: "education-training",
    rank: 10,
    industry: "Private schools, daycare centers, tutors, training centers, driving schools, and music schools",
    priority: "Medium-High",
    searchLabel: "Private school",
    searchTerms: ["private school", "daycare", "tutor", "training center", "driving school", "music school"],
    worthTargeting: "Trust and enrollment clarity matter for parents and students before they inquire.",
    commonWeaknesses: ["Outdated sites", "missing program details", "no enrollment CTA", "weak mobile layout", "unclear location"],
    bestWebsiteOffer: "Enrollment-focused website with programs, admissions steps, schedule, FAQ, location, and inquiry form.",
    outreachHook: "Parents and students need clear information before they inquire.",
    qualificationSignals: ["school", "daycare", "tutor", "training", "driving school", "music lessons", "enrollment"],
    avoidSignals: ["public school district page", "exam results article", "job listing"],
  },
  {
    id: "legal-professional",
    rank: 11,
    industry: "Legal and professional services",
    priority: "Medium-High",
    searchLabel: "Law firm",
    searchTerms: ["lawyer", "accountant", "consultant", "immigration service", "business registration service"],
    worthTargeting: "High client value and credibility-sensitive decisions, though outreach should be more professional and careful.",
    commonWeaknesses: ["Old corporate sites", "vague service pages", "no consultation CTA", "weak trust-building copy", "no FAQ"],
    bestWebsiteOffer: "Consultation website with services, process, professional profile, FAQ, and contact path.",
    outreachHook: "Clients judge credibility before contacting; this concept clarifies services and consultation steps.",
    qualificationSignals: ["law", "legal", "accounting", "consultant", "immigration", "business registration", "consultation"],
    avoidSignals: ["court document", "government form", "job listing"],
  },
  {
    id: "security-systems",
    rank: 12,
    industry: "Security services, CCTV, alarms, and gate automation",
    priority: "Medium-High",
    searchLabel: "CCTV installer",
    searchTerms: ["security company", "CCTV installer", "alarm installer", "gate automation"],
    worthTargeting: "Trust, safety, and quote intent make presentation and contact clarity very important.",
    commonWeaknesses: ["No proper service pages", "unclear residential vs commercial services", "weak quote request path", "limited project proof"],
    bestWebsiteOffer: "Security quote-generation website with service categories, residential/commercial split, FAQ, and contact CTA.",
    outreachHook: "Security buyers need confidence before they call; this concept presents services clearly.",
    qualificationSignals: ["security", "CCTV", "alarm", "gate automation", "surveillance", "access control"],
    avoidSignals: ["crime news", "police page", "job listing"],
  },
  {
    id: "printing-signage-custom",
    rank: 13,
    industry: "Printing, signage, embroidery, custom gifts, 3D printing, trophies, and plaques",
    priority: "Medium",
    searchLabel: "Printing service",
    searchTerms: ["printing service", "signage", "embroidery", "custom gifts", "3D printing", "trophy plaque"],
    worthTargeting: "Visual products and quote-driven sales benefit from organized galleries and request flows.",
    commonWeaknesses: ["Examples scattered on social", "no catalog structure", "no quote form", "unclear turnaround", "poor gallery"],
    bestWebsiteOffer: "Gallery/catalog quote website with categories, sample work, upload/request CTA, process, and FAQ.",
    outreachHook: "Customers need a clearer way to browse options and request quotes.",
    qualificationSignals: ["printing", "sign", "embroidery", "custom", "3D print", "trophy", "plaque"],
    avoidSignals: ["printer repair only", "job listing", "software tutorial"],
  },
  {
    id: "church-nonprofit",
    rank: 14,
    industry: "Churches, ministries, nonprofits, and community organizations",
    priority: "Medium-Low",
    searchLabel: "Church",
    searchTerms: ["church", "ministry", "nonprofit", "community organization"],
    worthTargeting: "Community trust, events, donations, and updates matter, but budgets can be lower and relationship-driven.",
    commonWeaknesses: ["Outdated sites", "poor event calendar", "no donation flow", "unclear programs", "hard-to-find contact info"],
    bestWebsiteOffer: "Community website with service times, events, programs, donation path if applicable, and contact info.",
    outreachHook: "Your community needs a clear place to find updates, events, and ways to connect.",
    qualificationSignals: ["church", "ministry", "nonprofit", "community", "donation", "service times"],
    avoidSignals: ["religious article", "sermon transcript only", "government registry"],
  },
  {
    id: "visual-retail",
    rank: 15,
    industry: "Retail shops with visual products",
    priority: "Medium-Low",
    searchLabel: "Furniture store",
    searchTerms: ["furniture store", "appliance store", "clothing boutique", "hardware store", "home decor shop"],
    worthTargeting: "Visual product businesses can benefit from catalogs, but inventory complexity can make the sale harder.",
    commonWeaknesses: ["No online catalog", "products only on WhatsApp or Instagram", "unclear store info", "poor product photography", "no delivery notes"],
    bestWebsiteOffer: "Catalog-style inquiry website with featured products, categories, WhatsApp inquiry, store location, and delivery notes.",
    outreachHook: "Customers need an easier way to browse products before messaging or visiting.",
    qualificationSignals: ["furniture", "appliance", "boutique", "hardware", "decor", "catalog", "products"],
    avoidSignals: ["big box chain", "marketplace listing only", "job listing"],
  },
];

export function getLeadIndustryTarget(id: string) {
  return LEAD_INDUSTRY_TARGETS.find((target) => target.id === id) ?? LEAD_INDUSTRY_TARGETS[0];
}

export function leadIndustryPriorityWeight(priority: LeadIndustryPriority) {
  if (priority === "High") return 12;
  if (priority === "Medium-High") return 8;
  if (priority === "Medium") return 4;
  if (priority === "Medium-Low") return 1;
  return 0;
}

export function buildLeadIndustrySearchPhrase(target: LeadIndustryTarget, override?: string) {
  const terms = override?.trim() || target.searchTerms.slice(0, 4).join(" OR ");
  return `${terms} ${target.qualificationSignals.slice(0, 5).join(" ")}`;
}
