export type CopyAngleName =
  | "premium positioning"
  | "trust and credibility"
  | "speed and convenience"
  | "transformation"
  | "craftsmanship"
  | "local authority"
  | "booking simplicity"
  | "care clarity"
  | "hospitality experience"
  | "emotional memorial tone"
  | "creative portfolio tone"
  | "technical precision";

export interface CopyAngle {
  name: CopyAngleName;
  heroLead: string;
  valueLine: string;
  serviceLine: string;
  credibility: [string, string, string, string];
  transformation: string;
  process: [string, string, string, string];
  galleryCaptions: [string, string, string, string, string, string];
  finalPrompt: string;
}

export const copyAngles: Record<CopyAngleName, CopyAngle> = {
  "premium positioning": {
    name: "premium positioning",
    heroLead: "A more considered presence for",
    valueLine: "Present the offer with stronger visual confidence, clearer value, and an easier path to enquire.",
    serviceLine: "Give each service the clarity and presentation it deserves.",
    credibility: ["Refined first impression", "Clear service value", "Considered contact path", "Ready for verified proof"],
    transformation: "From useful information to a presence that feels intentionally positioned.",
    process: ["Discover the offer", "Review current options", "Choose a contact route", "Confirm the next step"],
    galleryCaptions: ["Signature presentation", "Details with purpose", "A more refined experience", "Visual confidence", "Designed around action", "A coherent brand world"],
    finalPrompt: "Present the business with the clarity and confidence customers expect.",
  },
  "trust and credibility": {
    name: "trust and credibility",
    heroLead: "Clearer information and a more credible presence for",
    valueLine: "Help customers understand the service, available contact routes, and what to confirm before moving forward.",
    serviceLine: "Make expertise and current service options easier to understand.",
    credibility: ["Clear information", "Professional presentation", "Direct contact options", "Proof-ready structure"],
    transformation: "From scattered details to a clearer, more reassuring customer journey.",
    process: ["Understand the need", "Review the service", "Ask for guidance", "Confirm the next step"],
    galleryCaptions: ["Professional context", "Clarity in every detail", "A reassuring environment", "Service made visible", "Built around trust", "Ready for verified proof"],
    finalPrompt: "Create a clearer path from first impression to informed enquiry.",
  },
  "speed and convenience": {
    name: "speed and convenience",
    heroLead: "A faster way to explore and contact",
    valueLine: "Put services, essential details, and direct contact routes where customers can use them quickly.",
    serviceLine: "Help customers find the right option without unnecessary friction.",
    credibility: ["Fast service overview", "Simple next steps", "Mobile-ready contact", "Current options made clear"],
    transformation: "From searching for details to finding the next step quickly.",
    process: ["Choose a service", "Check current options", "Contact directly", "Confirm availability"],
    galleryCaptions: ["Easy to explore", "Key details up front", "Built for quick decisions", "A smoother journey", "Contact within reach", "Clear from any device"],
    finalPrompt: "Make it easier for customers to find what they need and act.",
  },
  transformation: {
    name: "transformation",
    heroLead: "A stronger before-and-after presence for",
    valueLine: "Show how thoughtful presentation can turn existing business information into a more useful customer experience.",
    serviceLine: "Frame each offer around the change or outcome customers are seeking.",
    credibility: ["Clear starting point", "Visible service value", "Stronger presentation", "Practical next step"],
    transformation: "From an initial need to a clearer vision of what comes next.",
    process: ["Share the starting point", "Explore suitable options", "Agree the direction", "Move toward the outcome"],
    galleryCaptions: ["The starting point", "Possibility made visible", "Details taking shape", "A more polished direction", "Designed for progress", "The next chapter"],
    finalPrompt: "Give customers a clearer picture of what is possible.",
  },
  craftsmanship: {
    name: "craftsmanship",
    heroLead: "Care, detail, and a stronger presentation for",
    valueLine: "Bring the quality of the work forward through focused imagery, service detail, and considered customer guidance.",
    serviceLine: "Show the care behind each service without making unsupported claims.",
    credibility: ["Detail-led presentation", "Service-specific guidance", "Quality-focused visuals", "Direct enquiry path"],
    transformation: "From individual details to an experience that feels carefully finished.",
    process: ["Discuss the need", "Confirm the scope", "Plan the details", "Review the finished direction"],
    galleryCaptions: ["Care in the details", "A considered process", "Quality made visible", "Refined execution", "Purposeful finishing", "Craft presented clearly"],
    finalPrompt: "Let the quality and care behind the work lead the conversation.",
  },
  "local authority": {
    name: "local authority",
    heroLead: "A clearer local presence for",
    valueLine: "Connect services, location context, and direct contact information in one dependable place.",
    serviceLine: "Help local customers understand what is available and how to reach the business.",
    credibility: ["Locally relevant", "Services made clear", "Contact details visible", "Service area ready"],
    transformation: "From word-of-mouth details to a reliable local reference point.",
    process: ["Review local services", "Confirm the service area", "Contact the business", "Arrange the next step"],
    galleryCaptions: ["Built for the local market", "A familiar point of contact", "Services close at hand", "Clear local relevance", "Easy to reach", "Ready for the community"],
    finalPrompt: "Give local customers one clear place to understand and contact the business.",
  },
  "booking simplicity": {
    name: "booking simplicity",
    heroLead: "A calmer path from interest to appointment with",
    valueLine: "Make services, preparation details, and contact options easier to review before booking.",
    serviceLine: "Organize services around the questions customers ask before they book.",
    credibility: ["Services explained", "Availability made clear", "Comfortable contact path", "Booking-ready structure"],
    transformation: "From uncertainty to a simple, reassuring booking journey.",
    process: ["Explore services", "Ask about suitability", "Confirm availability", "Arrange the visit"],
    galleryCaptions: ["A welcoming first step", "Carefully presented options", "Comfort in the details", "A smoother booking path", "Service with clarity", "Prepared for real photography"],
    finalPrompt: "Make the next appointment or enquiry feel simple and comfortable.",
  },
  "care clarity": {
    name: "care clarity",
    heroLead: "Modern care made easier to understand and easier to book with",
    valueLine: "Help patients review services, comfort details, and appointment options before they reach out.",
    serviceLine: "Explain care options in a calm, practical way so patients know what to ask next.",
    credibility: ["Clean care presentation", "Appointment clarity", "Patient-friendly guidance", "Proof-ready trust"],
    transformation: "From clinical uncertainty to a calmer path toward care.",
    process: ["Review care options", "Ask about suitability", "Confirm availability", "Arrange the appointment"],
    galleryCaptions: ["Clean care environment", "Comfortable first step", "Patient guidance", "Modern appointment path", "Care made clearer", "Ready for verified clinic photography"],
    finalPrompt: "Make care feel clearer, calmer, and easier to book.",
  },
  "hospitality experience": {
    name: "hospitality experience",
    heroLead: "Make the atmosphere, menu, and booking path feel immediate for",
    valueLine: "Bring the dining experience forward with warm imagery, clear offers, and practical visit details.",
    serviceLine: "Frame each offer around what guests want to taste, book, or ask about.",
    credibility: ["Atmosphere first", "Menu clarity", "Reservation path", "Visit details"],
    transformation: "From a place people hear about to an experience they can picture and plan.",
    process: ["Explore the atmosphere", "Review current options", "Plan the visit", "Confirm availability"],
    galleryCaptions: ["Atmosphere worth visiting", "Menu moments", "Hospitality in focus", "A table-ready experience", "Warm visual appetite", "Representative dining imagery"],
    finalPrompt: "Turn interest into a visit, booking, order, or catering enquiry.",
  },
  "emotional memorial tone": {
    name: "emotional memorial tone",
    heroLead: "A thoughtful, respectful online presence for",
    valueLine: "Present support, available options, and private contact routes with clarity and care.",
    serviceLine: "Explain available support gently and make it easy to ask for guidance.",
    credibility: ["Respectful presentation", "Clear support options", "Private contact route", "Careful wording"],
    transformation: "From difficult questions to a calmer, more supportive path forward.",
    process: ["Make private contact", "Discuss current needs", "Review available options", "Confirm arrangements"],
    galleryCaptions: ["A quiet place to begin", "Details handled with care", "Space for remembrance", "Gentle visual guidance", "Support made clearer", "Representative tribute imagery"],
    finalPrompt: "Offer families a respectful place to understand options and make contact.",
  },
  "creative portfolio tone": {
    name: "creative portfolio tone",
    heroLead: "A more expressive digital stage for",
    valueLine: "Bring the work, personality, and ways to connect into one focused portfolio experience.",
    serviceLine: "Let each offering or body of work contribute to a stronger creative story.",
    credibility: ["Distinct creative identity", "Featured work", "Audience-ready contact", "Booking-ready structure"],
    transformation: "From separate creative moments to one coherent portfolio presence.",
    process: ["Explore the work", "Review current offerings", "Discuss availability", "Plan the collaboration"],
    galleryCaptions: ["A distinctive point of view", "Work in focus", "Creative energy", "A memorable atmosphere", "Built for an audience", "Ready for verified portfolio media"],
    finalPrompt: "Give the work a focused home and make collaboration easier to start.",
  },
  "technical precision": {
    name: "technical precision",
    heroLead: "A clearer technical and capability-led presence for",
    valueLine: "Organize capabilities, process information, and quote routes around the details customers need.",
    serviceLine: "Make technical capabilities easier to compare, discuss, and scope.",
    credibility: ["Capabilities defined", "Process made visible", "Quote path clarified", "Detail-ready structure"],
    transformation: "From an idea or requirement to a clearer production path.",
    process: ["Share the requirement", "Review technical options", "Confirm scope and timing", "Approve the next step"],
    galleryCaptions: ["Precision in process", "Ideas taking form", "Technical detail", "Built to specification", "From concept to output", "Representative production imagery"],
    finalPrompt: "Turn technical capability into a clearer conversation about the next project.",
  },
};

export function getCopyAngle(name: CopyAngleName) {
  return copyAngles[name];
}
