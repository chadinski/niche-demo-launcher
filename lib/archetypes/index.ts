import type { DesignTokenPreferences } from "@/lib/design/tokens";

export interface Archetype {
  id: string;
  name: string;
  industries: string[];
  designTokens: DesignTokenPreferences;
  sectionOrder: string[];
  tone: string;
  qaChecks: string[];
}

const warmNeutral = {
  50: "#FBF8F3",
  100: "#F5EFE5",
  200: "#E8DCCB",
  300: "#D7C4AA",
  400: "#BFA17E",
  500: "#9C7A58",
  600: "#785B42",
  700: "#5B4433",
  800: "#3E3026",
  900: "#241C17",
  950: "#120D0A",
};

const coolNeutral = {
  50: "#F8FAFC",
  100: "#F1F5F9",
  200: "#E2E8F0",
  300: "#CBD5E1",
  400: "#94A3B8",
  500: "#64748B",
  600: "#475569",
  700: "#334155",
  800: "#1E293B",
  900: "#0F172A",
  950: "#020617",
};

function tokens(input: {
  primary: string;
  secondary: string;
  accent: string;
  heading: string;
  body?: string;
  neutral?: Record<string, string>;
}): DesignTokenPreferences {
  return {
    colors: {
      primary: input.primary,
      secondary: input.secondary,
      accent: input.accent,
      neutral: input.neutral ?? coolNeutral,
    },
    fonts: {
      heading: input.heading,
      body: input.body ?? 'Inter, ui-sans-serif, system-ui, "Segoe UI", sans-serif',
    },
  };
}

export const ARCHETYPES: Archetype[] = [
  {
    id: "friendly-local",
    name: "Friendly Local",
    industries: ["local business", "pet", "pet care", "grooming", "community", "family business", "neighborhood"],
    designTokens: tokens({
      primary: "#2B7A78",
      secondary: "#F4A261",
      accent: "#E76F51",
      heading: '"DM Sans", Inter, ui-sans-serif, system-ui, sans-serif',
      neutral: warmNeutral,
    }),
    sectionOrder: ["Hero", "Trust Bridge", "Services", "Local Story", "Experience", "FAQ", "Contact"],
    tone: "Warm, clear, neighborly, practical, and confidence-building without sounding small.",
    qaChecks: ["Hero must make the local offer obvious within the first viewport.", "Use friendly proof cues only from verified facts."],
  },
  {
    id: "professional-services",
    name: "Professional Services",
    industries: ["law", "legal", "attorney", "accounting", "finance", "insurance", "consulting", "advisor", "professional"],
    designTokens: tokens({
      primary: "#1F3A5F",
      secondary: "#C8A45D",
      accent: "#6D8EA0",
      heading: '"Source Serif 4", Georgia, serif',
      body: '"DM Sans", Inter, ui-sans-serif, system-ui, sans-serif',
    }),
    sectionOrder: ["Hero", "Credibility", "Practice Areas", "Process", "Decision Support", "FAQ", "Consultation"],
    tone: "Composed, authoritative, precise, discreet, and consultative.",
    qaChecks: ["Do not invent credentials, outcomes, case results, or client names.", "Consultation CTA must be clear and low-friction."],
  },
  {
    id: "saas-tech",
    name: "SaaS / Tech",
    industries: ["saas", "software", "app", "platform", "marketplace", "startup", "digital product"],
    designTokens: tokens({
      primary: "#4F46E5",
      secondary: "#06B6D4",
      accent: "#A78BFA",
      heading: '"Space Grotesk", Inter, ui-sans-serif, system-ui, sans-serif',
    }),
    sectionOrder: ["Hero", "Product Snapshot", "Use Cases", "Feature Flow", "Trust", "FAQ", "Signup"],
    tone: "Sharp, product-led, high-clarity, modern, and status-honest.",
    qaChecks: ["Do not invent users, integrations, launch status, or metrics.", "Interface visuals must be labeled as concepts unless verified screenshots exist."],
  },
  {
    id: "ecommerce-retail",
    name: "Ecommerce / Retail",
    industries: ["ecommerce", "retail", "shop", "store", "boutique", "product", "supplier", "online store"],
    designTokens: tokens({
      primary: "#7C3AED",
      secondary: "#F59E0B",
      accent: "#EC4899",
      heading: '"Playfair Display", Georgia, serif',
      body: '"DM Sans", Inter, ui-sans-serif, system-ui, sans-serif',
      neutral: warmNeutral,
    }),
    sectionOrder: ["Hero", "Featured Products", "Collections", "Shopping Experience", "Proof", "FAQ", "Shop CTA"],
    tone: "Editorial, desirable, visual, product-specific, and easy to shop or enquire.",
    qaChecks: ["Do not invent prices, discounts, inventory, or shipping promises.", "Product/category visuals must match the stated niche."],
  },
  {
    id: "restaurant-hospitality",
    name: "Restaurant / Hospitality",
    industries: ["restaurant", "cafe", "bar", "grill", "bakery", "catering", "hotel", "hospitality", "food", "dining"],
    designTokens: tokens({
      primary: "#7F1D1D",
      secondary: "#D97706",
      accent: "#16A34A",
      heading: '"Cormorant Garamond", Georgia, serif',
      body: '"Lora", Georgia, serif',
      neutral: warmNeutral,
    }),
    sectionOrder: ["Hero", "Atmosphere", "Menu Highlights", "Visit Details", "Gallery", "FAQ", "Reservation CTA"],
    tone: "Sensory, welcoming, appetite-led, locally grounded, and immediate.",
    qaChecks: ["Do not invent menu items, hours, delivery, reservations, or prices.", "Hero imagery must feel food or venue specific."],
  },
  {
    id: "health-wellness",
    name: "Health / Wellness",
    industries: ["health", "wellness", "clinic", "dental", "medical", "therapy", "counseling", "spa", "care"],
    designTokens: tokens({
      primary: "#0F766E",
      secondary: "#A7C7B7",
      accent: "#F59E0B",
      heading: '"Merriweather", Georgia, serif',
      body: '"DM Sans", Inter, ui-sans-serif, system-ui, sans-serif',
    }),
    sectionOrder: ["Hero", "Care Promise", "Services", "Patient Journey", "Comfort Details", "FAQ", "Appointment"],
    tone: "Calm, reassuring, professional, readable, and carefully factual.",
    qaChecks: ["Do not invent medical outcomes, providers, credentials, or testimonials.", "CTA must reduce anxiety around the first appointment."],
  },
  {
    id: "real-estate",
    name: "Real Estate",
    industries: ["real estate", "realtor", "property", "broker", "homes", "apartments", "rental", "realty"],
    designTokens: tokens({
      primary: "#17324D",
      secondary: "#B88A44",
      accent: "#6B7280",
      heading: '"Playfair Display", Georgia, serif',
    }),
    sectionOrder: ["Hero", "Market Position", "Listings or Services", "Buyer Seller Path", "Neighborhoods", "FAQ", "Consultation"],
    tone: "Aspirational, polished, market-aware, and trust-forward.",
    qaChecks: ["Do not invent listings, sales volume, prices, or market rankings.", "Separate buyer, seller, and rental paths when relevant."],
  },
  {
    id: "creative-agency",
    name: "Creative Agency",
    industries: ["agency", "design", "creative", "marketing", "branding", "studio", "photography", "portfolio"],
    designTokens: tokens({
      primary: "#111827",
      secondary: "#F97316",
      accent: "#EC4899",
      heading: '"Space Grotesk", Inter, ui-sans-serif, system-ui, sans-serif',
    }),
    sectionOrder: ["Hero", "Point of View", "Services", "Work Style", "Showcase", "FAQ", "Project CTA"],
    tone: "Bold, editorial, taste-driven, confident, and conversion-aware.",
    qaChecks: ["Do not invent client logos, press, awards, or portfolio results.", "Section rhythm must vary beyond repeated card grids."],
  },
  {
    id: "education-tutoring",
    name: "Education / Tutoring",
    industries: ["education", "school", "tutoring", "tutor", "course", "academy", "training", "learning"],
    designTokens: tokens({
      primary: "#2563EB",
      secondary: "#FACC15",
      accent: "#10B981",
      heading: '"Montserrat", Inter, ui-sans-serif, system-ui, sans-serif',
    }),
    sectionOrder: ["Hero", "Learning Promise", "Programs", "Student Journey", "Support", "FAQ", "Enrollment"],
    tone: "Encouraging, structured, clear, optimistic, and parent/student friendly.",
    qaChecks: ["Do not invent student outcomes, accreditations, or pass rates.", "Explain the next learning step clearly."],
  },
  {
    id: "automotive",
    name: "Automotive",
    industries: ["automotive", "auto", "mechanic", "garage", "tire", "tyre", "car wash", "detailing", "vehicle", "repair"],
    designTokens: tokens({
      primary: "#111827",
      secondary: "#DC2626",
      accent: "#F59E0B",
      heading: '"Oswald", Inter, ui-sans-serif, system-ui, sans-serif',
    }),
    sectionOrder: ["Hero", "Service Proof", "Services", "Process", "Vehicle Care", "FAQ", "Quote CTA"],
    tone: "Capable, direct, energetic, precise, and road-ready.",
    qaChecks: ["Do not invent warranties, certifications, turnaround times, or emergency coverage.", "Phone or quote CTA must be highly visible."],
  },
  {
    id: "home-services",
    name: "Home Services",
    industries: ["home services", "plumbing", "electrical", "hvac", "roofing", "construction", "contractor", "landscaping", "repair", "installation"],
    designTokens: tokens({
      primary: "#365314",
      secondary: "#F59E0B",
      accent: "#0EA5E9",
      heading: '"Montserrat", Inter, ui-sans-serif, system-ui, sans-serif',
      neutral: warmNeutral,
    }),
    sectionOrder: ["Hero", "Service Area", "Services", "Why Choose Us", "Process", "FAQ", "Quote"],
    tone: "Practical, dependable, quote-ready, clear, and locally credible.",
    qaChecks: ["Do not invent licenses, insurance, warranties, project counts, or timelines.", "Service area and scope must be visible without overclaiming."],
  },
  {
    id: "nonprofit-charity",
    name: "Nonprofit / Charity",
    industries: ["nonprofit", "charity", "foundation", "community organization", "ngo", "ministry", "donation"],
    designTokens: tokens({
      primary: "#047857",
      secondary: "#FBBF24",
      accent: "#2563EB",
      heading: '"Lora", Georgia, serif',
    }),
    sectionOrder: ["Hero", "Mission", "Programs", "Impact Context", "Get Involved", "FAQ", "Donate or Contact"],
    tone: "Human, mission-led, transparent, hopeful, and action-oriented.",
    qaChecks: ["Do not invent impact numbers, donors, grants, or outcomes.", "Donation/help CTAs must be honest about available links."],
  },
  {
    id: "fitness-sports",
    name: "Fitness / Sports",
    industries: ["fitness", "gym", "trainer", "sports", "coach", "athletics", "yoga", "pilates"],
    designTokens: tokens({
      primary: "#0F172A",
      secondary: "#22C55E",
      accent: "#F97316",
      heading: '"Oswald", Inter, ui-sans-serif, system-ui, sans-serif',
    }),
    sectionOrder: ["Hero", "Training Promise", "Programs", "Experience", "Schedule or Process", "FAQ", "Join CTA"],
    tone: "Energized, disciplined, motivating, clear, and body-positive.",
    qaChecks: ["Do not invent transformations, certifications, schedules, or performance claims.", "CTA must match verified booking/contact options."],
  },
  {
    id: "travel-tourism",
    name: "Travel / Tourism",
    industries: ["travel", "tourism", "tour", "hotel", "resort", "vacation", "adventure", "excursion"],
    designTokens: tokens({
      primary: "#0369A1",
      secondary: "#F97316",
      accent: "#14B8A6",
      heading: '"Playfair Display", Georgia, serif',
    }),
    sectionOrder: ["Hero", "Destination Feel", "Experiences", "Itinerary Style", "Gallery", "FAQ", "Book Enquiry"],
    tone: "Immersive, vivid, reassuring, destination-specific, and enquiry-led.",
    qaChecks: ["Do not invent packages, availability, prices, safety guarantees, or permits.", "Visuals must match the destination or activity category."],
  },
  {
    id: "beauty-salon",
    name: "Beauty / Salon",
    industries: ["beauty", "salon", "hair", "barber", "nails", "makeup", "esthetician", "lashes", "spa"],
    designTokens: tokens({
      primary: "#9D174D",
      secondary: "#F9A8D4",
      accent: "#B45309",
      heading: '"Cormorant Garamond", Georgia, serif',
      body: '"DM Sans", Inter, ui-sans-serif, system-ui, sans-serif',
      neutral: warmNeutral,
    }),
    sectionOrder: ["Hero", "Signature Style", "Services", "Experience", "Gallery", "FAQ", "Book Appointment"],
    tone: "Elegant, expressive, tactile, confidence-building, and booking-focused.",
    qaChecks: ["Do not invent transformations, celebrity clients, prices, or availability.", "Gallery or imagery must support the beauty niche without fake proof."],
  },
  {
    id: "tech-consulting",
    name: "Tech Consulting",
    industries: ["tech consulting", "it consulting", "cybersecurity", "managed it", "cloud", "automation", "data", "ai consulting"],
    designTokens: tokens({
      primary: "#0F172A",
      secondary: "#38BDF8",
      accent: "#8B5CF6",
      heading: '"Space Grotesk", Inter, ui-sans-serif, system-ui, sans-serif',
    }),
    sectionOrder: ["Hero", "Technical Positioning", "Solutions", "Process", "Risk Reduction", "FAQ", "Strategy Call"],
    tone: "Technically credible, calm, systems-minded, clear, and executive-friendly.",
    qaChecks: ["Do not invent certifications, breach prevention guarantees, vendors, or ROI metrics.", "Explain technical value in business language."],
  },
];

const defaultArchetype = ARCHETYPES.find((archetype) => archetype.id === "friendly-local") ?? ARCHETYPES[0];

export function getArchetypeById(id: string): Archetype | undefined {
  const normalized = id.trim().toLowerCase();
  return ARCHETYPES.find((archetype) => archetype.id.toLowerCase() === normalized);
}

export function getArchetypeForIndustry(industry: string): Archetype {
  const normalized = industry.trim().toLowerCase();
  if (!normalized) return defaultArchetype;

  return ARCHETYPES.find((archetype) =>
    archetype.industries.some((candidate) => {
      const industryCandidate = candidate.toLowerCase();
      return normalized.includes(industryCandidate) || industryCandidate.includes(normalized);
    }),
  ) ?? defaultArchetype;
}
