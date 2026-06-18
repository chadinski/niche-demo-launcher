import type { CopyAngleName } from "@/lib/generators/copy-angles";
import type { WebsitePresetName } from "@/lib/generators/website-presets";

export type IndustryDesignId =
  | "restaurant"
  | "auto-detailing"
  | "auto-repair"
  | "clinic"
  | "wellness"
  | "salon"
  | "trades"
  | "real-estate"
  | "memorial"
  | "product-studio"
  | "artist"
  | "florist"
  | "pet-care"
  | "professional"
  | "local-service";

export type WebsiteSectionId =
  | "credibility"
  | "services"
  | "experience"
  | "transformation"
  | "gallery"
  | "process"
  | "spotlight"
  | "connect"
  | "trust"
  | "faq"
  | "finalCta";

export interface IndustryDesign {
  id: IndustryDesignId;
  label: string;
  match: RegExp;
  preset: WebsitePresetName;
  copyAngle: CopyAngleName;
  primary: string;
  accent: string;
  colorPath: string;
  composition: string;
  navPrimary: string;
  trustCue: string;
  cssClass: string;
}

export interface IndustryWebsiteContent {
  serviceDefaults: [string, string, string, string, string, string];
  serviceIntro: string;
  credibilityDetails: [string, string, string, string];
  processDetails: [string, string, string, string];
  faqQuestions: [string, string, string];
  contactContext: string;
}

export interface IndustrySpotlight {
  eyebrow: string;
  title: string;
  body: string;
  items: [string, string, string];
}

export const industryDesigns: IndustryDesign[] = [
  {
    id: "restaurant",
    label: "Restaurant / hospitality",
    match: /(restaurant|cafe|coffee|food|bakery|catering|bar|grill|dining|menu|chef)/,
    preset: "Restaurant Experience",
    copyAngle: "hospitality experience",
    primary: "#7c2d12",
    accent: "#fb923c",
    colorPath: "ember, clay, cream, and warm hospitality contrast",
    composition: "Immersive food-and-atmosphere hero, menu-forward service cards, large sensory gallery, then visit details.",
    navPrimary: "Menu",
    trustCue: "Atmosphere, current menu options, visit details, and reservation/order path.",
    cssClass: "industry-restaurant",
  },
  {
    id: "auto-detailing",
    label: "Auto detailing",
    match: /(auto detailing|detailing|car care|vehicle appearance|ceramic coating|paint correction)/,
    preset: "Luxury Editorial",
    copyAngle: "craftsmanship",
    primary: "#0f172a",
    accent: "#38bdf8",
    colorPath: "midnight graphite, chrome blue, and high-gloss contrast",
    composition: "High-impact finish imagery, detail-led proof blocks, premium service cards, and quote-ready contact.",
    navPrimary: "Services",
    trustCue: "Finish quality, service scope, care process, and estimate path.",
    cssClass: "industry-auto-detailing",
  },
  {
    id: "auto-repair",
    label: "Auto repair / mechanic",
    match: /(auto repair|mechanic|vehicle repair|car repair|garage|diagnostic|brakes|servicing)/,
    preset: "Industrial Premium",
    copyAngle: "technical precision",
    primary: "#1f2937",
    accent: "#f97316",
    colorPath: "charcoal, safety orange, steel, and practical contrast",
    composition: "Capability-first hero, service diagnostics, process clarity, and direct estimate request.",
    navPrimary: "Repairs",
    trustCue: "Diagnostics, service process, direct contact, and quote path.",
    cssClass: "industry-auto-repair",
  },
  {
    id: "clinic",
    label: "Clinic / healthcare",
    match: /(dental|dentist|clinic|medical|health|doctor|patient|care)/,
    preset: "Soft Wellness",
    copyAngle: "care clarity",
    primary: "#0f766e",
    accent: "#38bdf8",
    colorPath: "clean teal, clinical blue, soft white, and calm contrast",
    composition: "Reassuring split hero, care categories, patient guidance, and appointment-oriented FAQ.",
    navPrimary: "Care",
    trustCue: "Care options, appointment clarity, patient guidance, and comfort.",
    cssClass: "industry-clinic",
  },
  {
    id: "wellness",
    label: "Wellness / spa",
    match: /(wellness|therapy|massage|spa|holistic|yoga|meditation|healing)/,
    preset: "Soft Wellness",
    copyAngle: "booking simplicity",
    primary: "#52796f",
    accent: "#d4a373",
    colorPath: "sage, sand, cream, and gentle wellness warmth",
    composition: "Soft editorial hero, calm service guidance, comfort proof, and low-pressure booking.",
    navPrimary: "Services",
    trustCue: "Comfort, appointment options, preparation details, and gentle contact.",
    cssClass: "industry-wellness",
  },
  {
    id: "salon",
    label: "Salon / beauty",
    match: /(salon|barber|beauty|makeup|hair|styling|lashes|nails)/,
    preset: "Luxury Editorial",
    copyAngle: "booking simplicity",
    primary: "#9f1239",
    accent: "#e8b4a2",
    colorPath: "deep rose, blush, ivory, and polished editorial contrast",
    composition: "Style-led hero, appointment services, transformation imagery, and easy booking route.",
    navPrimary: "Appointments",
    trustCue: "Style, services, booking, and occasion-ready presentation.",
    cssClass: "industry-salon",
  },
  {
    id: "trades",
    label: "Trades / construction",
    match: /(construction|contractor|builder|roofing|plumbing|electrical|hardware|supplies|renovation|repair service)/,
    preset: "Industrial Premium",
    copyAngle: "technical precision",
    primary: "#334155",
    accent: "#f59e0b",
    colorPath: "slate, hazard amber, concrete, and structured contrast",
    composition: "Capability grid, process-first sections, project imagery, and scope/quote CTA.",
    navPrimary: "Capabilities",
    trustCue: "Service scope, materials, process, service area, and quote path.",
    cssClass: "industry-trades",
  },
  {
    id: "real-estate",
    label: "Property / interiors",
    match: /(real estate|interior|architect|property|home staging|decor|furniture)/,
    preset: "Luxury Editorial",
    copyAngle: "transformation",
    primary: "#57534e",
    accent: "#c08457",
    colorPath: "stone, walnut, ivory, and architectural warmth",
    composition: "Editorial property hero, portfolio-style gallery, transformation story, and consultation CTA.",
    navPrimary: "Portfolio",
    trustCue: "Portfolio, approach, property goals, and consultation path.",
    cssClass: "industry-real-estate",
  },
  {
    id: "memorial",
    label: "Memorial / funeral care",
    match: /(funeral|memorial|tribute|urn|cremation|remembrance)/,
    preset: "Memorial Tribute",
    copyAngle: "emotional memorial tone",
    primary: "#465649",
    accent: "#b8a47a",
    colorPath: "soft evergreen, muted gold, parchment, and dignified restraint",
    composition: "Gentle hero, private guidance, careful process, and calm support sections.",
    navPrimary: "Support",
    trustCue: "Respectful support, private contact, options, and remembrance.",
    cssClass: "industry-memorial",
  },
  {
    id: "product-studio",
    label: "3D printing / product studio",
    match: /(3d|printing|prototype|custom product|fabrication|sign|laser|cnc)/,
    preset: "3D Printing Studio",
    copyAngle: "technical precision",
    primary: "#6d28d9",
    accent: "#06b6d4",
    colorPath: "violet, cyan, midnight, and technical glow",
    composition: "Technical hero, capability modules, process path, product gallery, and custom quote CTA.",
    navPrimary: "Capabilities",
    trustCue: "Capabilities, materials, production process, and custom quote path.",
    cssClass: "industry-product-studio",
  },
  {
    id: "artist",
    label: "Music / artist portfolio",
    match: /(music|musician|artist|band|violin|performer|recording studio|entertainment|dj|creative)/,
    preset: "Music / Artist Portfolio",
    copyAngle: "creative portfolio tone",
    primary: "#581c87",
    accent: "#f43f5e",
    colorPath: "night violet, stage rose, black, and cinematic energy",
    composition: "Cinematic portfolio hero, media-first gallery, booking availability, and collaboration path.",
    navPrimary: "Work",
    trustCue: "Featured work, creative identity, availability, and booking route.",
    cssClass: "industry-artist",
  },
  {
    id: "florist",
    label: "Florist / events",
    match: /(flor|flower|wedding|event|arrangement|bouquet)/,
    preset: "Soft Wellness",
    copyAngle: "craftsmanship",
    primary: "#9d174d",
    accent: "#84cc16",
    colorPath: "berry, botanical green, petal cream, and fresh contrast",
    composition: "Beautiful occasion-led hero, visual arrangements, service occasions, and custom order CTA.",
    navPrimary: "Occasions",
    trustCue: "Arrangements, occasions, visual portfolio, and enquiry route.",
    cssClass: "industry-florist",
  },
  {
    id: "pet-care",
    label: "Pet care",
    match: /(pet|veterinary|animal|grooming|dog|cat|pet store)/,
    preset: "Clean Local Business",
    copyAngle: "booking simplicity",
    primary: "#166534",
    accent: "#f59e0b",
    colorPath: "leaf green, warm amber, clean white, and friendly local contrast",
    composition: "Approachable local hero, care categories, helpful process, and easy contact.",
    navPrimary: "Care",
    trustCue: "Care services, pet owner guidance, availability, and contact.",
    cssClass: "industry-pet-care",
  },
  {
    id: "professional",
    label: "Professional services",
    match: /(law|legal|attorney|accounting|accountant|finance|consulting|consultant|professional service|realty)/,
    preset: "Professional Trust",
    copyAngle: "trust and credibility",
    primary: "#1e3a5f",
    accent: "#64748b",
    colorPath: "deep blue, slate, white, and measured professional contrast",
    composition: "Trust-led split hero, expertise sections, process clarity, and consultation CTA.",
    navPrimary: "Expertise",
    trustCue: "Expertise, service clarity, process, and confidential enquiry.",
    cssClass: "industry-professional",
  },
];

export const fallbackIndustryDesign: IndustryDesign = {
  id: "local-service",
  label: "Local service",
  match: /$a/,
  preset: "Professional Trust",
  copyAngle: "local authority",
  primary: "#4f46e5",
  accent: "#14b8a6",
  colorPath: "indigo, teal, white, and polished local-service contrast",
  composition: "Clear hero, practical services, proof-ready sections, and direct contact path.",
  navPrimary: "Services",
  trustCue: "Services, customer guidance, contact, and verified proof.",
  cssClass: "industry-local-service",
};

const sharedProofNote = "Representative content is ready to be replaced with verified photos, reviews, credentials, and business proof.";

export const industryWebsiteContent: Record<IndustryDesignId, IndustryWebsiteContent> = {
  restaurant: {
    serviceDefaults: ["Current menu highlights", "Dine-in experience", "Takeout or ordering details", "Catering or group enquiries", "Location and hours", "Reservations or visit planning"],
    serviceIntro: "Guests should quickly understand what they can taste, how the space feels, and how to plan a visit or order.",
    credibilityDetails: ["Atmosphere and menu context come forward before generic service claims.", "Visit, order, or reservation details sit close to the main offer.", "The layout makes hours, location, and contact routes easy to confirm.", sharedProofNote],
    processDetails: ["Explore the menu direction and atmosphere.", "Check current hours, availability, or ordering options.", "Use the preferred contact route to reserve, order, or ask a question.", "Confirm details directly before visiting or placing an order."],
    faqQuestions: ["What menu or dining options are available?", "Can guests book, order, or ask about catering?", "Where can visitors confirm hours and location?"],
    contactContext: "Use this page to connect menu interest to a visit, order, reservation, or catering enquiry.",
  },
  "auto-detailing": {
    serviceDefaults: ["Exterior wash and finish care", "Interior detailing", "Paint correction enquiries", "Ceramic coating options", "Maintenance detail packages", "Custom vehicle care quotes"],
    serviceIntro: "Vehicle owners need to see the finish quality, understand service levels, and know how to ask for the right package.",
    credibilityDetails: ["Finish-focused imagery supports the service value.", "Service cards distinguish maintenance care from premium correction work.", "The quote path is direct without implying fixed prices.", sharedProofNote],
    processDetails: ["Share the vehicle condition and desired finish.", "Review suitable detailing or protection options.", "Confirm timing, scope, and preparation needs.", "Book the detail or request a custom quote."],
    faqQuestions: ["Which detailing option fits the vehicle?", "How should customers prepare before service?", "How can they request a quote?"],
    contactContext: "Use this page to move from visual interest to a clear detailing enquiry or quote request.",
  },
  "auto-repair": {
    serviceDefaults: ["Vehicle diagnostics", "Brake and suspension service", "Oil change and maintenance", "Engine or electrical checks", "Repair estimates", "Service scheduling"],
    serviceIntro: "Drivers need practical service clarity, fast contact, and enough process detail to feel comfortable requesting help.",
    credibilityDetails: ["Capability-led sections explain what can be checked or repaired.", "The process reduces uncertainty before a quote.", "Mobile contact routes stay visible for urgent service needs.", sharedProofNote],
    processDetails: ["Describe the vehicle issue or maintenance need.", "Ask about diagnostics, timing, and availability.", "Confirm estimate expectations and required parts.", "Schedule service directly with the shop."],
    faqQuestions: ["What repair or diagnostic services are available?", "How can customers request an estimate?", "What details should drivers share first?"],
    contactContext: "Use this page to convert service uncertainty into a direct repair or diagnostic enquiry.",
  },
  clinic: {
    serviceDefaults: ["Consultations", "Preventive care", "Family or patient services", "Appointment guidance", "Patient preparation details", "Direct contact options"],
    serviceIntro: "Patients need calm service explanations, visible appointment routes, and careful wording that avoids unsupported medical claims.",
    credibilityDetails: ["Care options are presented with calm, factual language.", "Appointment guidance is placed near the primary contact path.", "The page leaves room for real credentials and patient information.", sharedProofNote],
    processDetails: ["Review available care options.", "Ask about suitability and current appointment availability.", "Confirm preparation details directly with the clinic.", "Arrange the appointment through the supplied contact route."],
    faqQuestions: ["What care options can patients ask about?", "How should someone request an appointment?", "What details should be confirmed before visiting?"],
    contactContext: "Use this page to make appointment enquiries feel clearer, calmer, and easier to start.",
  },
  wellness: {
    serviceDefaults: ["Wellness consultations", "Massage or therapy sessions", "Holistic service options", "Preparation guidance", "Appointment availability", "Personalized care enquiries"],
    serviceIntro: "Visitors should feel the tone of care, understand session options, and know how to ask about fit and availability.",
    credibilityDetails: ["The design emphasizes calm guidance over exaggerated outcomes.", "Service information is framed around comfort and preparation.", "Booking prompts stay low-pressure and practical.", sharedProofNote],
    processDetails: ["Explore current session or service options.", "Ask whether the service is suitable for the need.", "Confirm preparation, timing, and availability.", "Arrange the appointment directly."],
    faqQuestions: ["Which wellness service should someone ask about?", "How can visitors confirm availability?", "What should they know before booking?"],
    contactContext: "Use this page to make the first wellness enquiry feel comfortable and informed.",
  },
  salon: {
    serviceDefaults: ["Hair or styling services", "Barbering or grooming", "Nails, lashes, or beauty services", "Special occasion appointments", "Consultation guidance", "Booking enquiries"],
    serviceIntro: "Style-led businesses need the work, appointment path, and service menu to feel polished from the first screen.",
    credibilityDetails: ["The page prioritizes visual style and booking clarity.", "Service groups can be replaced with the verified menu.", "Transformation sections are ready for real client-approved photos.", sharedProofNote],
    processDetails: ["Explore current services and style direction.", "Ask about suitability, availability, or preparation.", "Confirm the appointment details directly.", "Book or message through the preferred contact route."],
    faqQuestions: ["What beauty or grooming services are available?", "How can clients ask about appointments?", "What should clients confirm before booking?"],
    contactContext: "Use this page to turn style interest into a simple appointment enquiry.",
  },
  trades: {
    serviceDefaults: ["Project enquiries", "Repairs or installation", "Materials or supply options", "Site or scope review", "Service area confirmation", "Quote requests"],
    serviceIntro: "Trade and construction customers need capability, scope, service area, and quote expectations made clear early.",
    credibilityDetails: ["Capability sections replace vague marketing with practical decision support.", "The process shows how customers can request a quote.", "Service area and contact details stay easy to find.", sharedProofNote],
    processDetails: ["Describe the project, issue, or supply need.", "Review service area, materials, or site requirements.", "Confirm scope, timing, and quote expectations.", "Move forward once details are agreed directly."],
    faqQuestions: ["What project or repair work can customers ask about?", "How does the quote process start?", "What service area or site details are needed?"],
    contactContext: "Use this page to move a practical need into a clear scope or quote conversation.",
  },
  "real-estate": {
    serviceDefaults: ["Property consultation", "Portfolio or project review", "Home staging or presentation", "Interior or space planning", "Buying or selling guidance", "Consultation booking"],
    serviceIntro: "Property-focused businesses need refined imagery, clear consultation paths, and proof-ready portfolio structure.",
    credibilityDetails: ["The page frames property goals and visual outcomes without inventing results.", "Gallery sections can hold verified listings, interiors, or project work.", "Consultation prompts stay measured and professional.", sharedProofNote],
    processDetails: ["Share the property or project goal.", "Review the current approach and available services.", "Confirm fit, scope, and next-step requirements.", "Arrange a consultation or project conversation."],
    faqQuestions: ["What property or design goals can be discussed?", "Can real project images be added?", "How should someone request a consultation?"],
    contactContext: "Use this page to turn property interest into a focused consultation request.",
  },
  memorial: {
    serviceDefaults: ["Private guidance", "Memorial or tribute options", "Cremation or funeral enquiries", "Family support information", "Remembrance details", "Direct private contact"],
    serviceIntro: "Families need careful wording, private contact, and clear support options without pressure or unsupported promises.",
    credibilityDetails: ["The tone stays respectful and calm throughout the page.", "Service cards explain available support gently.", "The contact path is private and easy to find.", sharedProofNote],
    processDetails: ["Make private contact when ready.", "Discuss current needs and available support.", "Review options with care and patience.", "Confirm arrangements directly with the business."],
    faqQuestions: ["What support options can families ask about?", "How can someone make private contact?", "What details should be confirmed directly?"],
    contactContext: "Use this page to offer a quiet, respectful path to guidance and support.",
  },
  "product-studio": {
    serviceDefaults: ["Custom design support", "3D printing", "Product prototyping", "Fabrication or signage", "Material and file review", "Custom quote requests"],
    serviceIntro: "Product and fabrication customers need capabilities, materials, process, and quote requirements explained clearly.",
    credibilityDetails: ["Technical capability is organized before the enquiry step.", "The page supports file, prototype, signage, or custom product requests.", "Scope and pricing are left for direct confirmation.", sharedProofNote],
    processDetails: ["Share the idea, file, drawing, or requirement.", "Review materials, production options, and constraints.", "Confirm scope, timing, and quote details.", "Approve the next production step directly."],
    faqQuestions: ["What files or ideas can customers bring?", "How are materials and production options confirmed?", "How does a custom quote start?"],
    contactContext: "Use this page to turn a concept or file into a structured production enquiry.",
  },
  artist: {
    serviceDefaults: ["Featured work", "Live performance or booking", "Collaborations", "Media or portfolio highlights", "Availability enquiries", "Contact for projects"],
    serviceIntro: "Creative pages need personality, media, booking context, and a simple route for collaboration or performance enquiries.",
    credibilityDetails: ["The design gives the work a focused stage.", "Booking and collaboration paths are visible without inventing credentials.", "Portfolio media can be replaced with verified images, audio, or video.", sharedProofNote],
    processDetails: ["Explore the work and creative direction.", "Review current offerings or availability.", "Discuss fit, date, venue, or collaboration needs.", "Confirm the booking or project details directly."],
    faqQuestions: ["What work or performances can visitors explore?", "How can someone discuss availability?", "What media should be added before launch?"],
    contactContext: "Use this page to make bookings, collaborations, and portfolio enquiries easier to start.",
  },
  florist: {
    serviceDefaults: ["Bouquets and arrangements", "Wedding florals", "Event florals", "Custom orders", "Delivery or pickup details", "Occasion enquiries"],
    serviceIntro: "Floral and event customers need occasion fit, visual inspiration, and a clear custom-order path.",
    credibilityDetails: ["The page makes occasion types and visual direction easy to scan.", "Custom order prompts leave pricing and availability for confirmation.", "Gallery areas are ready for real arrangement photography.", sharedProofNote],
    processDetails: ["Share the occasion, style, date, and delivery needs.", "Review arrangement options or inspiration.", "Confirm availability, budget, and pickup or delivery details.", "Place or finalize the order directly."],
    faqQuestions: ["What occasions can customers ask about?", "How do custom floral orders start?", "What details should be confirmed before ordering?"],
    contactContext: "Use this page to turn occasion inspiration into a clear floral enquiry.",
  },
  "pet-care": {
    serviceDefaults: ["Pet care services", "Grooming enquiries", "Veterinary or wellness guidance", "Owner preparation details", "Availability checks", "Direct contact options"],
    serviceIntro: "Pet owners need clear care options, preparation guidance, and easy contact without overcomplicating the decision.",
    credibilityDetails: ["Care categories are written for pet owners, not internal operations.", "Availability and preparation details sit close to contact prompts.", "Proof areas can hold verified staff, facility, or customer material.", sharedProofNote],
    processDetails: ["Choose the care option or describe the pet's need.", "Ask about suitability, timing, and preparation.", "Confirm availability and any visit requirements.", "Arrange the visit or service directly."],
    faqQuestions: ["What pet care services can owners ask about?", "How can availability be confirmed?", "What should owners prepare before visiting?"],
    contactContext: "Use this page to help pet owners move from concern or interest to a clear care enquiry.",
  },
  professional: {
    serviceDefaults: ["Consultations", "Advisory services", "Document or case review", "Ongoing support", "Confidential enquiries", "Next-step guidance"],
    serviceIntro: "Professional-service visitors need trust, clarity, and a measured path to consultation without exaggerated promises.",
    credibilityDetails: ["Expertise is framed clearly without unsupported credentials.", "The consultation path is prominent and professional.", "Proof areas are ready for verified credentials, client types, or case material.", sharedProofNote],
    processDetails: ["Describe the need or situation.", "Review available professional services.", "Confirm fit, confidentiality, timing, and next steps.", "Arrange a consultation through the supplied contact route."],
    faqQuestions: ["What professional services are available?", "How can someone request a consultation?", "What should be confirmed before moving forward?"],
    contactContext: "Use this page to convert uncertainty into a professional consultation enquiry.",
  },
  "local-service": {
    serviceDefaults: ["Current services", "Personalized support", "Service area guidance", "Availability checks", "Direct contact options", "Custom enquiries"],
    serviceIntro: "Visitors need to understand what is offered, where it is available, and how to take the next step.",
    credibilityDetails: ["The first impression explains the offer clearly.", "Service cards turn scattered details into an easier decision path.", "Contact routes stay visible on mobile and desktop.", sharedProofNote],
    processDetails: ["Review the available services.", "Confirm fit, scope, and service area.", "Use the supplied contact route to ask questions.", "Agree the next step directly with the business."],
    faqQuestions: ["What services can customers ask about?", "Where is the service available?", "How can customers confirm the next step?"],
    contactContext: "Use this page to give customers one clear place to understand and contact the business.",
  },
};

export function getIndustryWebsiteContent(id: IndustryDesignId) {
  return industryWebsiteContent[id] ?? industryWebsiteContent["local-service"];
}

const defaultSectionOrder: WebsiteSectionId[] = [
  "credibility",
  "services",
  "spotlight",
  "experience",
  "process",
  "gallery",
  "connect",
  "trust",
  "faq",
  "finalCta",
];

export const industrySectionOrders: Record<IndustryDesignId, WebsiteSectionId[]> = {
  restaurant: ["services", "gallery", "spotlight", "credibility", "experience", "process", "connect", "trust", "faq", "finalCta"],
  "auto-detailing": ["credibility", "gallery", "services", "spotlight", "transformation", "process", "connect", "trust", "faq", "finalCta"],
  "auto-repair": ["services", "spotlight", "process", "credibility", "experience", "connect", "trust", "faq", "finalCta"],
  clinic: ["credibility", "spotlight", "services", "process", "experience", "connect", "trust", "faq", "finalCta"],
  wellness: ["credibility", "experience", "services", "spotlight", "process", "gallery", "connect", "trust", "faq", "finalCta"],
  salon: ["gallery", "services", "spotlight", "credibility", "experience", "process", "connect", "trust", "faq", "finalCta"],
  trades: ["services", "spotlight", "process", "gallery", "credibility", "connect", "trust", "faq", "finalCta"],
  "real-estate": ["gallery", "transformation", "services", "spotlight", "process", "credibility", "connect", "trust", "faq", "finalCta"],
  memorial: ["credibility", "services", "spotlight", "process", "connect", "experience", "trust", "faq", "finalCta"],
  "product-studio": ["services", "spotlight", "process", "gallery", "transformation", "credibility", "connect", "trust", "faq", "finalCta"],
  artist: ["gallery", "spotlight", "services", "process", "credibility", "connect", "trust", "faq", "finalCta"],
  florist: ["gallery", "services", "spotlight", "process", "connect", "credibility", "trust", "faq", "finalCta"],
  "pet-care": ["credibility", "services", "spotlight", "process", "connect", "gallery", "trust", "faq", "finalCta"],
  professional: ["credibility", "services", "spotlight", "process", "experience", "connect", "trust", "faq", "finalCta"],
  "local-service": defaultSectionOrder,
};

export const industrySpotlights: Record<IndustryDesignId, IndustrySpotlight> = {
  restaurant: {
    eyebrow: "Visit planning",
    title: "Make the menu, atmosphere, and visit path easy to picture.",
    body: "A restaurant demo should move quickly from appetite to action: what guests can enjoy, what the space feels like, and how to visit, order, or ask about groups.",
    items: ["Menu or offer clarity", "Atmosphere-led gallery", "Hours, location, and booking path"],
  },
  "auto-detailing": {
    eyebrow: "Finish decision",
    title: "Help vehicle owners choose the right level of care.",
    body: "Detailing pages work best when they show finish quality, explain service levels, and keep estimates honest until the vehicle condition is known.",
    items: ["Finish-focused visuals", "Package and scope guidance", "Quote request without fixed-price claims"],
  },
  "auto-repair": {
    eyebrow: "Service confidence",
    title: "Put diagnostics, repair scope, and contact first.",
    body: "Repair customers usually need practical answers fast. This structure prioritizes what can be checked, how estimates begin, and how to reach the shop.",
    items: ["Problem-first service list", "Estimate expectations", "Fast phone or WhatsApp route"],
  },
  clinic: {
    eyebrow: "Patient path",
    title: "Make care options feel clear before someone books.",
    body: "Clinic pages should reduce uncertainty with calm service groupings, appointment guidance, and careful wording that does not imply unverified outcomes.",
    items: ["Care categories", "Appointment preparation", "Verified proof placeholders"],
  },
  wellness: {
    eyebrow: "Comfort path",
    title: "Make the first enquiry feel calm and informed.",
    body: "Wellness visitors need reassurance, session clarity, and a gentle booking path without exaggerated promises.",
    items: ["Session fit", "Preparation details", "Low-pressure availability check"],
  },
  salon: {
    eyebrow: "Appointment path",
    title: "Let style, services, and booking work together.",
    body: "Beauty and grooming demos should lead with visual taste, then make service options and appointment next steps simple to understand.",
    items: ["Style-led visual proof", "Service menu clarity", "Appointment enquiry route"],
  },
  trades: {
    eyebrow: "Scope and quote",
    title: "Turn project uncertainty into a clearer quote conversation.",
    body: "Trade pages should explain capabilities, service area, and the information needed before a quote, without pretending every project has the same price.",
    items: ["Capability groups", "Site or scope requirements", "Quote-ready contact path"],
  },
  "real-estate": {
    eyebrow: "Property decision",
    title: "Show the visual standard before asking for a consultation.",
    body: "Property and interiors pages need portfolio rhythm, project goals, and a measured consultation path more than generic service blocks.",
    items: ["Portfolio-first proof", "Goal-led services", "Consultation path"],
  },
  memorial: {
    eyebrow: "Private support",
    title: "Keep guidance respectful, calm, and easy to request.",
    body: "Memorial and funeral care pages need careful pacing, private contact, and clear options without pressure or unsupported reassurance.",
    items: ["Gentle service guidance", "Private enquiry route", "Respectful proof placeholders"],
  },
  "product-studio": {
    eyebrow: "Idea to quote",
    title: "Help customers understand what to bring before production starts.",
    body: "Product studios need capability modules, material or file guidance, and a custom quote path that makes complex work feel approachable.",
    items: ["File or concept intake", "Materials and constraints", "Production quote path"],
  },
  artist: {
    eyebrow: "Booking signal",
    title: "Put the work, availability, and collaboration path on stage.",
    body: "Creative sites should feel more like a portfolio journey than a local service page, with media first and booking context close behind.",
    items: ["Featured work", "Booking or collaboration", "Media-ready proof area"],
  },
  florist: {
    eyebrow: "Occasion path",
    title: "Connect visual inspiration to a custom order enquiry.",
    body: "Floral and event visitors need to see style quickly, understand occasion fit, and know what details to share before ordering.",
    items: ["Occasion type", "Style and delivery details", "Custom order enquiry"],
  },
  "pet-care": {
    eyebrow: "Owner guidance",
    title: "Help pet owners understand care, preparation, and availability.",
    body: "Pet care pages should be warm and practical, giving owners enough guidance to ask the right next question.",
    items: ["Care categories", "Preparation details", "Availability check"],
  },
  professional: {
    eyebrow: "Consultation path",
    title: "Make expertise clear without overclaiming.",
    body: "Professional-service pages should explain the enquiry path, confidentiality expectations, and service fit before asking for a consultation.",
    items: ["Expertise areas", "Fit and confidentiality", "Consultation request"],
  },
  "local-service": {
    eyebrow: "Decision path",
    title: "Give visitors one clear way to understand and contact the business.",
    body: "Local service pages should connect the offer, service area, proof placeholders, and contact route without making unsupported claims.",
    items: ["Service clarity", "Area and availability", "Direct contact route"],
  },
};

export function getIndustrySectionOrder(id: IndustryDesignId) {
  return industrySectionOrders[id] ?? defaultSectionOrder;
}

export function getIndustrySpotlight(id: IndustryDesignId) {
  return industrySpotlights[id] ?? industrySpotlights["local-service"];
}

export function resolveIndustryDesign(value: string): IndustryDesign {
  const lower = value.toLowerCase();
  return industryDesigns.find((design) => design.match.test(lower)) ?? fallbackIndustryDesign;
}
