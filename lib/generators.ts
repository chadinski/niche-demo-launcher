import type {
AppSettings,
BusinessInfo,
MessageTone,
SalesMessages,
} from "@/lib/types";
import { slugify } from "@/lib/utils";

const DEFAULT_PRIMARY = "#4f46e5";
const DEFAULT_ACCENT = "#14b8a6";

function valueAfterLabel(raw: string, labels: string[]) {
const lines = raw.split(/\r?\n/);
for (const line of lines) {
for (const label of labels) {
const match = line.match(new RegExp(`^\\s*${label}\\s*[:\\-]\\s*(.+)$`, "i"));
if (match?.[1]) return match[1].trim();
}
}
return "";
}

function firstMatch(raw: string, pattern: RegExp) {
return raw.match(pattern)?.[0]?.trim() ?? "";
}

function inferCategory(raw: string) {
const categories = [
"auto detailing",
"auto repair",
"mechanic",
"dental clinic",
"restaurant",
"cafe",
"bakery",
"florist",
"funeral home",
"memorial service",
"3d printing",
"sign shop",
"custom products",
"contractor",
"construction",
"real estate",
"interior design",
"salon",
"barber",
"spa",
"law firm",
"accounting",
"pet store",
"veterinary",
"electrical supplies",
"plumbing supplies",
"photography",
"cleaning service",
"music",
"artist",
"fitness",
"gym",
"coaching",
];

const lower = raw.toLowerCase();
return categories.find((category) => lower.includes(category)) ?? "";
}

function inferName(raw: string) {
const labeled = valueAfterLabel(raw, ["business name", "company", "name", "brand"]);
if (labeled) return labeled;

const firstLine = raw
.split(/\r?\n/)
.map((line) => line.trim())
.find(Boolean);

if (!firstLine) return "";

return firstLine
.split(/[|•]/)[0]
.split(/\s[-–]\s/)[0]
.replace(/^business\s*[:-]\s*/i, "")
.trim()
.slice(0, 80);
}

function inferServices(raw: string) {
const labeled = valueAfterLabel(raw, [
"services",
"products",
"offers",
"specialties",
"specialities",
"what they do",
]);

if (labeled) return labeled;

const serviceLine = raw
.split(/\r?\n/)
.find((line) => /\b(services?|products?|speciali[sz](?:es|ing)|offers?)\b/i.test(line));

return serviceLine?.replace(/^.*?[:-]\s*/, "").trim() ?? "";
}

function inferPainPoints(raw: string, website: string) {
const labeled = valueAfterLabel(raw, [
"pain points",
"issues",
"website issue",
"opportunity",
"problem",
"website status",
]);

if (labeled) return labeled;

if (!website) {
return "No clear website link was included in the supplied business information.";
}

return "The current online presentation may benefit from clearer mobile calls to action, stronger visual positioning, and a more polished service journey.";
}

export function emptyBusinessInfo(): BusinessInfo {
return {
rawInfo: "",
businessName: "",
category: "",
location: "",
phone: "",
email: "",
websiteUrl: "",
socialUrl: "",
services: "",
brandColors: "",
notes: "",
painPoints: "",
packagePrice: "$1,000",
demoUrl: "",
};
}

export function parseBusinessInfo(raw: string): Partial<BusinessInfo> {
const email = firstMatch(raw, /[\w.+-]+@[\w-]+(?:.[\w-]+)+/i);
const urls = raw.match(/https?://[^\s,)]]+/gi) ?? [];
const socialUrl =
urls.find((url) => /(instagram|facebook|tiktok|linkedin|youtube|x.com|twitter).com/i.test(url)) ?? "";
const websiteUrl = urls.find((url) => url !== socialUrl) ?? "";

const phone =
valueAfterLabel(raw, ["phone", "whatsapp", "tel", "telephone", "call"]) ||
firstMatch(raw, /(?:+?\d[\d\s().-]{7,}\d)/);

const colors = raw.match(/#[0-9a-f]{6}\b/gi)?.slice(0, 3).join(", ") ?? "";

return {
rawInfo: raw,
businessName: inferName(raw),
category: valueAfterLabel(raw, ["category", "business type", "industry", "niche"]) || inferCategory(raw),
location: valueAfterLabel(raw, ["location", "address", "service area", "based in"]),
phone,
email,
websiteUrl,
socialUrl,
services: inferServices(raw),
brandColors: valueAfterLabel(raw, ["brand colors", "brand colours", "colours", "colors"]) || colors,
painPoints: inferPainPoints(raw, websiteUrl),
};
}

function escapeHtml(value: string) {
return value
.replace(/&/g, "&")
.replace(/</g, "<")
.replace(/>/g, ">")
.replace(/"/g, """)
.replace(/'/g, "'");
}

function safeUrl(value: string) {
if (!value) return "";

try {
const url = new URL(value.startsWith("http") ? value : `https://${value}`);
return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
} catch {
return "";
}
}

function servicesFrom(value: string, category: string) {
const services = value
.split(/,|\n|•|||;/)
.map((item) => item.trim())
.filter(Boolean)
.slice(0, 6);

if (services.length) return services;

const lower = category.toLowerCase();

if (/(auto|mechanic|vehicle|car|detailing)/.test(lower)) {
return [
"Exterior presentation",
"Interior care",
"Maintenance support",
"Finish enhancement",
"Booking consultation",
"Custom service options",
];
}

if (/(restaurant|cafe|food|bakery|catering)/.test(lower)) {
return [
"Signature menu experience",
"Dining atmosphere",
"Ordering information",
"Catering or group enquiries",
"Location and hours",
"Customer contact path",
];
}

if (/(salon|barber|beauty|spa|makeup)/.test(lower)) {
return [
"Styling services",
"Beauty appointments",
"Consultation and care",
"Special occasion support",
"Booking guidance",
"Service packages",
];
}

if (/(dental|clinic|medical|health|wellness)/.test(lower)) {
return [
"Consultation support",
"Preventive care",
"Family services",
"Appointment guidance",
"Patient information",
"Direct contact options",
];
}

if (/(3d|printing|prototype|custom product|sign)/.test(lower)) {
return [
"Custom design",
"3D printing",
"Product prototyping",
"Personalized items",
"Business signage",
"Quote requests",
];
}

return [
`${category || "Professional"} services`,
"Personalized support",
"Consultation and guidance",
"Easy contact options",
"Custom service options",
"Customer-focused experience",
];
}

function categoryPalette(category: string) {
const lower = category.toLowerCase();

if (/(auto|mechanic|vehicle|car|detailing)/.test(lower)) return ["#d97706", "#f59e0b"];
if (/(restaurant|cafe|food|bakery|catering)/.test(lower)) return ["#b45309", "#f97316"];
if (/(flor|flower|wedding|event)/.test(lower)) return ["#be185d", "#84cc16"];
if (/(dental|clinic|medical|health|wellness)/.test(lower)) return ["#0f766e", "#38bdf8"];
if (/(salon|barber|beauty|spa|makeup)/.test(lower)) return ["#be185d", "#f59e0b"];
if (/(real estate|interior|architect|construction|contractor|home)/.test(lower)) return ["#92400e", "#d6a955"];
if (/(pet|veterinary|animal)/.test(lower)) return ["#15803d", "#f97316"];
if (/(funeral|memorial|tribute|urn)/.test(lower)) return ["#8b6f3d", "#d6b46a"];
if (/(3d|printing|prototype|custom product|sign)/.test(lower)) return ["#7c3aed", "#06b6d4"];
if (/(music|artist|band|violin|studio|entertainment)/.test(lower)) return ["#7c2d12", "#eab308"];
if (/(law|legal|accounting|finance|consulting)/.test(lower)) return ["#1d4ed8", "#94a3b8"];

return [DEFAULT_PRIMARY, DEFAULT_ACCENT];
}

function colorPair(value: string, category: string) {
const colors = value.match(/#[0-9a-f]{6}\b/gi) ?? [];
const [fallbackPrimary, fallbackAccent] = categoryPalette(category);
return [colors[0] ?? fallbackPrimary, colors[1] ?? fallbackAccent];
}

function visualProfile(category: string) {
const lower = category.toLowerCase();

const profiles = [
{
match: /(auto|mechanic|vehicle|car|detailing)/,
mood: "Precision, care, and a finish worth noticing.",
hero: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=2200&q=88",
feature: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1400&q=86",
gallery: [
"https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1400&q=84",
"https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1400&q=84",
],
alt: "Premium vehicle presented in refined light",
},
{
match: /(flor|flower|wedding|event)/,
mood: "Thoughtful details, beautiful presentation, and moments made memorable.",
hero: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=2200&q=88",
feature: "https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=1400&q=86",
gallery: [
"https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=1400&q=84",
"https://images.unsplash.com/photo-1507501336603-6e31db2be093?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1469259943454-aa100abba749?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1494972308805-463bc619d34e?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=1400&q=84",
],
alt: "Artfully arranged flowers in refined natural light",
},
{
match: /(restaurant|cafe|food|bakery|catering)/,
mood: "An inviting experience shaped by flavor, atmosphere, and attention to detail.",
hero: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2200&q=88",
feature: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=86",
gallery: [
"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=84",
"https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&w=1400&q=84",
],
alt: "Welcoming restaurant interior with thoughtful lighting",
},
{
match: /(dental|clinic|medical|health|wellness)/,
mood: "Modern care, clear guidance, and a calmer customer experience.",
hero: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=2200&q=88",
feature: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1400&q=86",
gallery: [
"https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1400&q=84",
"https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1588776813677-77aaf5595b83?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=84",
],
alt: "Bright, modern care environment",
},
{
match: /(salon|barber|beauty|spa|makeup)/,
mood: "Personal style, considered service, and confidence in every detail.",
hero: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=2200&q=88",
feature: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1400&q=86",
gallery: [
"https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1400&q=84",
"https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1519415943484-9fa1873496d4?auto=format&fit=crop&w=1400&q=84",
],
alt: "Polished salon interior with modern styling",
},
{
match: /(real estate|interior|architect|construction|contractor|home)/,
mood: "Spaces and projects presented with clarity, confidence, and strong visual intent.",
hero: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=88",
feature: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=86",
gallery: [
"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=84",
"https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=84",
],
alt: "Refined contemporary interior with architectural detail",
},
{
match: /(pet|veterinary|animal)/,
mood: "Helpful service, genuine care, and an experience built around pets and their people.",
hero: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=2200&q=88",
feature: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1400&q=86",
gallery: [
"https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1400&q=84",
"https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1400&q=84",
],
alt: "Happy pet in warm natural light",
},
{
match: /(3d|printing|prototype|custom product|sign)/,
mood: "Ideas shaped into useful, physical, memorable products.",
hero: "https://images.unsplash.com/photo-1631004191764-4c60c34e2313?auto=format&fit=crop&w=2200&q=88",
feature: "https://images.unsplash.com/photo-1611117775350-ac3950990985?auto=format&fit=crop&w=1400&q=86",
gallery: [
"https://images.unsplash.com/photo-1631004191764-4c60c34e2313?auto=format&fit=crop&w=1400&q=84",
"https://images.unsplash.com/photo-1611117775350-ac3950990985?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1581093458791-9d42cc5484a3?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1581091215367-59ab6f01d339?auto=format&fit=crop&w=1400&q=84",
],
alt: "Modern fabrication and product prototyping workspace",
},
];

return (
profiles.find((profile) => profile.match.test(lower)) ?? {
mood: "Professional service, clear next steps, and a presentation built around trust.",
hero: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2200&q=88",
feature: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=86",
gallery: [
"https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=84",
"https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=84",
"https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=84",
],
alt: "Professional modern workspace",
}
);
}

function schemaType(category: string) {
const lower = category.toLowerCase();

if (/(restaurant|cafe|food|bakery)/.test(lower)) return "Restaurant";
if (/(dental|dentist)/.test(lower)) return "Dentist";
if (/(auto|mechanic|vehicle|car|detailing)/.test(lower)) return "AutoRepair";
if (/(salon|beauty|spa|barber)/.test(lower)) return "BeautySalon";
if (/(real estate)/.test(lower)) return "RealEstateAgent";
if (/(pet|veterinary)/.test(lower)) return "PetStore";
if (/(funeral|memorial)/.test(lower)) return "LocalBusiness";
if (/(3d|printing|prototype|sign)/.test(lower)) return "ProfessionalService";

return "ProfessionalService";
}

function readableCategory(category: string) {
return category || "professional service";
}

function contactButtons(phone: string, email: string, social: string, website: string) {
const phoneHref = phone.replace(/[^\d+]/g, "");

const primary = phoneHref
? `<a class="btn btn-primary" href="tel:${phoneHref}">Call ${phone}</a>`
: email
? `<a class="btn btn-primary" href="mailto:${email}">Send an enquiry</a>`
: `<a class="btn btn-primary" href="#contact">View contact options</a>`;

const secondary = social
? `<a class="btn btn-glass" href="${escapeHtml(social)}" target="_blank" rel="noopener">Visit social profile <span>↗</span></a>`
: website
? `<a class="btn btn-glass" href="${escapeHtml(website)}" target="_blank" rel="noopener">Existing website <span>↗</span></a>`
: `<a class="btn btn-glass" href="#services">Explore services</a>`;

return { primary, secondary, phoneHref };
}

export function generateWebsiteHTML(info: BusinessInfo) {
const businessNameRaw = info.businessName || "Your Business";
const categoryRaw = readableCategory(info.category);
const locationRaw = info.location;
const businessName = escapeHtml(businessNameRaw);
const category = escapeHtml(categoryRaw);
const location = escapeHtml(locationRaw);
const phone = escapeHtml(info.phone);
const email = escapeHtml(info.email);
const website = safeUrl(info.websiteUrl);
const social = safeUrl(info.socialUrl);
const services = servicesFrom(info.services, info.category);
const [primary, accent] = colorPair(info.brandColors, info.category);
const profile = visualProfile(info.category || info.rawInfo);
const locationPhrase = location ? ` in ${location}` : "";
const offerLead = escapeHtml(services[0] || categoryRaw);
const description = `${businessNameRaw} provides ${categoryRaw}${locationRaw ? ` in ${locationRaw}` : ""}. Explore services, contact options, and current availability through this private website concept.`;
const title = `${businessNameRaw} | ${categoryRaw}${locationRaw ? ` in ${locationRaw}` : ""}`;
const buttons = contactButtons(phone, email, social, website);

const schema = {
"@context": "https://schema.org",
"@type": schemaType(info.category),
name: businessNameRaw,
description,
...(website ? { url: website } : {}),
...(info.phone ? { telephone: info.phone } : {}),
...(info.email ? { email: info.email } : {}),
...(info.location ? { areaServed: info.location } : {}),
sameAs: [social].filter(Boolean),
hasOfferCatalog: {
"@type": "OfferCatalog",
name: "Current service options",
itemListElement: services.map((service) => ({
"@type": "Offer",
itemOffered: { "@type": "Service", name: service },
description: "Contact the business to confirm current scope, pricing, and availability.",
})),
},
};

const jsonLd = JSON.stringify(schema).replace(/</g, "\u003c");

const serviceCards = services
.map(
(service, index) => `<article class="service-card reveal">         <div class="card-index"><span>${String(index + 1).padStart(2, "0")}</span><span class="card-icon">${["◇", "✦", "◈", "↻", "◆", "＋"][index] ?? "✦"}</span></div>         <h3>${escapeHtml(service)}</h3>         <p>Ask about current scope, availability, pricing, and the right option for your specific needs.</p>         <a class="text-link" href="#contact">Discuss this service <span>→</span></a>       </article>`,
)
.join("");

const galleryCards = profile.gallery
.map(
(image, index) => `<figure class="gallery-card reveal">         <img src="${escapeHtml(image)}" alt="${escapeHtml(`${profile.alt}, representative image ${index + 1}`)}" loading="lazy">         <figcaption class="gallery-caption">           <strong>${["A stronger first impression", "Service with visual confidence", "Details customers can trust", "A polished customer journey", "Designed for action", "Built around the brand"][index] ?? "Visual direction"}</strong>           <span>Representative concept imagery</span>         </figcaption>       </figure>`,
)
.join("");

return `<!DOCTYPE html>

<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description.slice(0, 160))}">
  <meta name="keywords" content="${businessName}, ${category}, ${location}, services, booking, contact, website concept">
  <meta name="theme-color" content="${primary}">
  <meta name="robots" content="noindex, nofollow">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description.slice(0, 160))}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${escapeHtml(profile.hero)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description.slice(0, 160))}">
  <meta name="twitter:image" content="${escapeHtml(profile.hero)}">
  <link rel="preconnect" href="https://images.unsplash.com">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='18' fill='%23111114'/%3E%3Cpath d='M16 40c8-16 24-16 32 0M20 44h24' fill='none' stroke='%23ffffff' stroke-width='4' stroke-linecap='round'/%3E%3Ccircle cx='32' cy='25' r='6' fill='%23ffffff'/%3E%3C/svg%3E">
  <script type="application/ld+json">${jsonLd}</script>
  <style>
    :root {
      --ink: #07080b;
      --ink-soft: #101115;
      --panel: #14151a;
      --panel-light: #1b1c22;
      --primary: ${primary};
      --accent: ${accent};
      --white: #f8f5ee;
      --silver: #b9b5ad;
      --muted: #8d8f99;
      --line: color-mix(in srgb, var(--primary) 30%, rgba(255,255,255,.13));
      --glass: rgba(15, 16, 20, .74);
      --shadow: 0 30px 90px rgba(0,0,0,.48);
      --radius: 24px;
      --ease: cubic-bezier(.2,.7,.2,1);
    }

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  overflow-x: hidden;
  color: var(--white);
  background:
    radial-gradient(circle at 16% 8%, color-mix(in srgb, var(--primary) 20%, transparent), transparent 28rem),
    radial-gradient(circle at 90% 28%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 30rem),
    var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.6;
}

body::before {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  content: "";
  opacity: .22;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.12'/%3E%3C/svg%3E");
}

img { display: block; max-width: 100%; }
a { color: inherit; text-decoration: none; }
button, a { -webkit-tap-highlight-color: transparent; }
button { font: inherit; }

.container { width: min(1180px, calc(100% - 40px)); margin-inline: auto; }
.section { position: relative; padding: 112px 0; }
.section-tight { padding: 78px 0; }

.eyebrow {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 18px;
  color: color-mix(in srgb, var(--accent) 68%, white);
  font-size: .73rem;
  font-weight: 850;
  letter-spacing: .18em;
  text-transform: uppercase;
}

.eyebrow::before {
  width: 34px;
  height: 1px;
  content: "";
  background: linear-gradient(90deg, transparent, var(--accent));
}

h1, h2, h3, p { margin-top: 0; }
h1, h2, h3 { line-height: 1.06; }

h1 {
  max-width: 830px;
  margin-bottom: 24px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(3.35rem, 7.2vw, 7.5rem);
  font-weight: 400;
  letter-spacing: -.055em;
}

h2 {
  max-width: 820px;
  margin-bottom: 22px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(2.35rem, 5vw, 5rem);
  font-weight: 400;
  letter-spacing: -.045em;
}

h3 { margin-bottom: 13px; font-size: 1.16rem; }

.accent-text {
  color: transparent;
  background: linear-gradient(115deg, var(--primary), color-mix(in srgb, var(--accent) 74%, white) 48%, var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
}

.lead {
  max-width: 680px;
  color: #d0ccc4;
  font-size: clamp(1.02rem, 1.7vw, 1.22rem);
}

.section-head {
  display: flex;
  gap: 30px;
  align-items: end;
  justify-content: space-between;
  margin-bottom: 52px;
}

.section-head p {
  max-width: 480px;
  margin-bottom: 7px;
  color: var(--silver);
}

.nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 1000;
  border-bottom: 1px solid transparent;
  transition: .35s var(--ease);
}

.nav.scrolled {
  border-color: var(--line);
  background: rgba(7,8,11,.84);
  box-shadow: 0 12px 42px rgba(0,0,0,.28);
  backdrop-filter: blur(18px);
}

.nav-wrap {
  display: flex;
  min-height: 84px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 220px;
}

.brand-mark {
  position: relative;
  display: grid;
  width: 46px;
  height: 50px;
  place-items: center;
  color: white;
  border: 1px solid color-mix(in srgb, var(--primary) 52%, rgba(255,255,255,.28));
  border-radius: 17px 17px 21px 21px;
  background: linear-gradient(145deg, color-mix(in srgb, var(--primary) 34%, transparent), color-mix(in srgb, var(--accent) 12%, transparent));
  font-family: Georgia, serif;
  font-size: 1.1rem;
}

.brand-mark::after {
  position: absolute;
  bottom: 6px;
  width: 18px;
  height: 1px;
  content: "";
  background: var(--accent);
}

.brand-name {
  display: block;
  max-width: 260px;
  overflow: hidden;
  font-family: Georgia, serif;
  font-size: 1rem;
  letter-spacing: .02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand-sub {
  display: block;
  color: var(--silver);
  font-size: .62rem;
  letter-spacing: .15em;
  text-transform: uppercase;
}

.nav-links {
  display: flex;
  gap: 26px;
  align-items: center;
}

.nav-links > a {
  position: relative;
  color: #d4d0c8;
  font-size: .78rem;
  font-weight: 760;
  letter-spacing: .04em;
}

.nav-links > a:not(.nav-cta)::after {
  position: absolute;
  right: 100%;
  bottom: -8px;
  left: 0;
  height: 1px;
  content: "";
  background: var(--accent);
  transition: right .3s var(--ease);
}

.nav-links > a:hover::after { right: 0; }

.nav-cta {
  padding: 12px 18px;
  color: white !important;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  box-shadow: 0 14px 34px color-mix(in srgb, var(--primary) 28%, transparent);
}

.menu-btn {
  display: none;
  width: 46px;
  height: 46px;
  padding: 0;
  color: var(--white);
  border: 1px solid var(--line);
  border-radius: 50%;
  background: rgba(255,255,255,.04);
  cursor: pointer;
}

.menu-btn span,
.menu-btn::before,
.menu-btn::after {
  display: block;
  width: 19px;
  height: 1px;
  margin: 5px auto;
  content: "";
  background: currentColor;
  transition: .3s;
}

.menu-btn.active span { opacity: 0; }
.menu-btn.active::before { transform: translateY(6px) rotate(45deg); }
.menu-btn.active::after { transform: translateY(-6px) rotate(-45deg); }

.hero {
  position: relative;
  display: flex;
  min-height: 960px;
  align-items: center;
  overflow: hidden;
  padding: 145px 0 75px;
}

.hero-bg {
  position: absolute;
  inset: 0;
  z-index: -2;
  background:
    linear-gradient(90deg, rgba(5,6,8,.98) 5%, rgba(5,6,8,.84) 44%, rgba(5,6,8,.18) 76%, rgba(5,6,8,.68)),
    linear-gradient(0deg, var(--ink) 0%, transparent 38%),
    url("${escapeHtml(profile.hero)}") 72% center / cover no-repeat;
  transform: scale(1.02);
}

.light-streak {
  position: absolute;
  top: 22%;
  right: -10%;
  z-index: -1;
  width: 58%;
  height: 2px;
  opacity: .78;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 80%, white), transparent);
  filter: blur(.5px) drop-shadow(0 0 11px var(--accent));
  transform: rotate(-8deg);
  animation: streak 7s ease-in-out infinite;
}

@keyframes streak {
  50% { opacity: .25; transform: translateX(-50px) rotate(-8deg); }
}

.hero-copy { position: relative; z-index: 2; max-width: 820px; }
.hero-copy .lead { max-width: 680px; margin-bottom: 34px; }

.hero-actions,
.cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 13px;
  align-items: center;
}

.btn {
  position: relative;
  display: inline-flex;
  min-height: 54px;
  padding: 0 24px;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  font-size: .8rem;
  font-weight: 850;
  letter-spacing: .07em;
  text-transform: uppercase;
  transition: transform .28s var(--ease), box-shadow .28s, border-color .28s;
}

.btn::before {
  position: absolute;
  inset: 0;
  content: "";
  background: linear-gradient(115deg, transparent 25%, rgba(255,255,255,.36), transparent 70%);
  transform: translateX(-130%);
  transition: transform .6s;
}

.btn:hover { transform: translateY(-3px); }
.btn:hover::before { transform: translateX(130%); }

.btn-primary {
  color: white;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  box-shadow: 0 14px 42px color-mix(in srgb, var(--primary) 26%, transparent);
}

.btn-glass {
  color: var(--white);
  border-color: color-mix(in srgb, var(--accent) 35%, rgba(255,255,255,.2));
  background: rgba(12,12,14,.48);
  backdrop-filter: blur(9px);
}

.hero-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 17px 30px;
  margin-top: 29px;
  color: #d1cec7;
  font-size: .86rem;
}

.hero-contact a,
.hero-contact span {
  display: flex;
  gap: 8px;
  align-items: center;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent);
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 42px;
}

.badge {
  padding: 9px 13px;
  color: #cac6bd;
  border: 1px solid rgba(255,255,255,.11);
  border-radius: 999px;
  background: rgba(9,9,10,.42);
  font-size: .68rem;
  font-weight: 750;
  letter-spacing: .08em;
  text-transform: uppercase;
  backdrop-filter: blur(10px);
}

.badge.accent {
  color: color-mix(in srgb, var(--accent) 65%, white);
  border-color: color-mix(in srgb, var(--accent) 35%, rgba(255,255,255,.16));
}

.hero-float {
  position: absolute;
  right: max(3vw, calc((100vw - 1180px) / 2));
  bottom: 92px;
  z-index: 3;
  display: grid;
  width: min(385px, 32vw);
  grid-template-columns: 1fr 1fr;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: rgba(10,10,12,.72);
  box-shadow: var(--shadow);
  backdrop-filter: blur(19px);
}

.hero-float-title {
  grid-column: 1 / -1;
  padding: 19px 21px;
  border-bottom: 1px solid var(--line);
  color: color-mix(in srgb, var(--accent) 70%, white);
  font-family: Georgia, serif;
  font-size: 1.04rem;
}

.mini-stat {
  padding: 18px 21px;
  border-right: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.mini-stat:nth-child(3),
.mini-stat:nth-child(5) { border-right: 0; }

.mini-stat:nth-child(4),
.mini-stat:nth-child(5) { border-bottom: 0; }

.mini-stat strong {
  display: block;
  margin-bottom: 2px;
  font-family: Georgia, serif;
  font-size: 1.18rem;
  font-weight: 400;
}

.mini-stat span {
  color: var(--silver);
  font-size: .68rem;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.premium-seal {
  position: absolute;
  top: 19%;
  right: 8%;
  z-index: 2;
  display: grid;
  width: 126px;
  height: 126px;
  padding: 16px;
  place-items: center;
  text-align: center;
  color: color-mix(in srgb, var(--accent) 70%, white);
  border: 1px solid color-mix(in srgb, var(--accent) 45%, rgba(255,255,255,.25));
  border-radius: 50%;
  background: radial-gradient(circle, rgba(24,21,18,.82), rgba(5,5,6,.5));
  box-shadow: inset 0 0 0 5px color-mix(in srgb, var(--primary) 10%, transparent), 0 0 50px color-mix(in srgb, var(--accent) 14%, transparent);
  font-family: Georgia, serif;
  font-size: .82rem;
  letter-spacing: .13em;
  text-transform: uppercase;
  animation: float 5s ease-in-out infinite;
}

@keyframes float {
  50% { transform: translateY(-10px); }
}

.premium-seal::before,
.premium-seal::after {
  position: absolute;
  content: "✦";
  color: var(--accent);
  font-size: .66rem;
}

.premium-seal::before { top: 15px; }
.premium-seal::after { bottom: 15px; }

.sparkle {
  position: absolute;
  z-index: 3;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 0 12px 3px color-mix(in srgb, var(--accent) 55%, transparent);
  animation: twinkle 3.7s ease-in-out infinite;
}

.sparkle::before,
.sparkle::after {
  position: absolute;
  top: 50%;
  left: 50%;
  content: "";
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 72%, white), transparent);
  transform: translate(-50%,-50%);
}

.sparkle::before { width: 28px; height: 1px; }
.sparkle::after { width: 1px; height: 28px; }

@keyframes twinkle {
  0%, 100% { opacity: .15; transform: scale(.6); }
  50% { opacity: .9; transform: scale(1); }
}

.credibility {
  position: relative;
  z-index: 4;
  margin-top: -1px;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  background: rgba(10,10,12,.78);
}

.cred-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.cred-card {
  min-height: 158px;
  padding: 32px 26px;
  border-right: 1px solid var(--line);
}

.cred-card:last-child { border-right: 0; }

.cred-num {
  display: block;
  margin-bottom: 12px;
  color: var(--accent);
  font-family: Georgia, serif;
  font-size: .78rem;
}

.cred-card h3 {
  font-family: Georgia, serif;
  font-weight: 400;
}

.cred-card p {
  margin: 0;
  color: var(--silver);
  font-size: .83rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.service-card,
.reason-card,
.social-card,
.quote-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.09);
  border-radius: var(--radius);
  background: linear-gradient(145deg, rgba(27,27,31,.84), rgba(11,11,13,.8));
  box-shadow: 0 18px 55px rgba(0,0,0,.2);
  transition: transform .36s var(--ease), border-color .36s, box-shadow .36s;
}

.service-card:hover,
.reason-card:hover,
.social-card:hover,
.quote-card:hover {
  transform: translateY(-7px);
  border-color: color-mix(in srgb, var(--accent) 38%, rgba(255,255,255,.18));
  box-shadow: var(--shadow);
}

.service-card {
  min-height: 335px;
  padding: 33px;
}

.service-card::after {
  position: absolute;
  right: -70px;
  bottom: -70px;
  width: 160px;
  height: 160px;
  content: "";
  border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
  border-radius: 50%;
  box-shadow: inset 0 0 60px color-mix(in srgb, var(--accent) 7%, transparent);
}

.card-index {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 45px;
  color: var(--accent);
  font-family: Georgia, serif;
  font-size: .79rem;
}

.card-icon {
  display: grid;
  width: 43px;
  height: 43px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: color-mix(in srgb, var(--accent) 7%, transparent);
  font-size: 1rem;
}

.service-card h3 {
  max-width: 260px;
  font-family: Georgia, serif;
  font-size: 1.55rem;
  font-weight: 400;
}

.service-card p {
  color: var(--silver);
  font-size: .91rem;
}

.text-link {
  display: inline-flex;
  gap: 9px;
  align-items: center;
  margin-top: 8px;
  color: color-mix(in srgb, var(--accent) 70%, white);
  font-size: .72rem;
  font-weight: 850;
  letter-spacing: .1em;
  text-transform: uppercase;
}

.text-link span { transition: transform .25s; }
.text-link:hover span { transform: translateX(5px); }

.why {
  overflow: hidden;
  background: linear-gradient(180deg, #0b0c0f, #08090b);
}

.why-grid {
  display: grid;
  grid-template-columns: .85fr 1.15fr;
  gap: 66px;
  align-items: center;
}

.image-frame {
  position: relative;
  min-height: 650px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 180px 24px 24px 24px;
  box-shadow: var(--shadow);
}

.image-frame img {
  width: 100%;
  height: 100%;
  min-height: 650px;
  object-fit: cover;
}

.image-frame::after {
  position: absolute;
  inset: 0;
  content: "";
  background: linear-gradient(0deg, rgba(5,5,6,.72), transparent 52%);
}

.image-label {
  position: absolute;
  right: 25px;
  bottom: 25px;
  left: 25px;
  z-index: 2;
  padding: 19px;
  border: 1px solid rgba(255,255,255,.13);
  border-radius: 16px;
  background: rgba(7,7,9,.68);
  backdrop-filter: blur(14px);
}

.image-label strong {
  display: block;
  color: color-mix(in srgb, var(--accent) 68%, white);
  font-family: Georgia, serif;
  font-size: 1.2rem;
}

.image-label span {
  color: var(--silver);
  font-size: .75rem;
}

.reasons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 35px;
}

.reason-card { padding: 23px; }
.reason-card .card-icon { margin-bottom: 20px; }

.reason-card h3 {
  font-family: Georgia, serif;
  font-size: 1.12rem;
  font-weight: 400;
}

.reason-card p {
  margin-bottom: 0;
  color: var(--silver);
  font-size: .82rem;
}

.transformation { overflow: hidden; }

.transform-shell {
  position: relative;
  min-height: 720px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 32px;
  box-shadow: var(--shadow);
}

.transform-shell > img {
  width: 100%;
  height: 720px;
  object-fit: cover;
}

.transform-shell::after {
  position: absolute;
  inset: 0;
  content: "";
  background:
    linear-gradient(90deg, rgba(6,6,8,.94) 0%, rgba(6,6,8,.66) 43%, rgba(6,6,8,.12) 75%),
    linear-gradient(0deg, rgba(6,6,8,.75), transparent 55%);
}

.transform-copy {
  position: absolute;
  top: 50%;
  left: 7%;
  z-index: 2;
  max-width: 580px;
  transform: translateY(-50%);
}

.transform-copy h2 {
  font-size: clamp(2.7rem, 5vw, 5.1rem);
}

.transform-copy p {
  max-width: 520px;
  color: #c7c4bd;
}

.demo-label {
  display: inline-flex;
  margin-bottom: 22px;
  padding: 7px 11px;
  color: color-mix(in srgb, var(--accent) 72%, white);
  border: 1px solid color-mix(in srgb, var(--accent) 35%, rgba(255,255,255,.16));
  border-radius: 999px;
  background: rgba(7,7,9,.5);
  font-size: .65rem;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.benefit-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 29px;
}

.benefit-pill {
  padding: 11px 14px;
  color: #ddd8cf;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 12px;
  background: rgba(10,10,12,.6);
  font-size: .76rem;
  backdrop-filter: blur(10px);
}

.transform-note {
  position: absolute;
  right: 28px;
  bottom: 28px;
  z-index: 3;
  width: 290px;
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 19px;
  background: rgba(8,8,10,.74);
  backdrop-filter: blur(15px);
}

.transform-note strong {
  display: block;
  margin-bottom: 7px;
  color: color-mix(in srgb, var(--accent) 70%, white);
  font-family: Georgia, serif;
  font-size: 1.13rem;
}

.transform-note p {
  margin: 0;
  color: var(--silver);
  font-size: .78rem;
}

.gallery { background: #0a0b0d; }

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-auto-rows: 225px;
  gap: 14px;
}

.gallery-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 20px;
  background: var(--panel);
}

.gallery-card:nth-child(1),
.gallery-card:nth-child(5) { grid-column: span 7; }

.gallery-card:nth-child(2),
.gallery-card:nth-child(6) { grid-column: span 5; }

.gallery-card:nth-child(3),
.gallery-card:nth-child(4) { grid-column: span 6; }

.gallery-card:nth-child(1),
.gallery-card:nth-child(2) { grid-row: span 2; }

.gallery-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .7s var(--ease), filter .5s;
}

.gallery-card::after {
  position: absolute;
  inset: 0;
  content: "";
  background: linear-gradient(0deg, rgba(5,5,6,.9), transparent 55%);
}

.gallery-card:hover img {
  transform: scale(1.055);
  filter: saturate(1.1);
}

.gallery-caption {
  position: absolute;
  right: 22px;
  bottom: 18px;
  left: 22px;
  z-index: 2;
}

.gallery-caption::before {
  display: block;
  width: 34px;
  height: 1px;
  margin-bottom: 9px;
  content: "";
  background: var(--accent);
}

.gallery-caption strong {
  display: block;
  font-family: Georgia, serif;
  font-size: 1.05rem;
  font-weight: 400;
}

.gallery-caption span {
  color: #b6b1a9;
  font-size: .7rem;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.process-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  margin-top: 48px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 25px;
  background: var(--line);
}

.step {
  position: relative;
  min-height: 285px;
  padding: 33px 29px;
  background: #0d0e11;
}

.step-no {
  display: block;
  margin-bottom: 72px;
  color: var(--accent);
  font-family: Georgia, serif;
  font-size: 2.6rem;
  line-height: 1;
}

.step h3 {
  font-family: Georgia, serif;
  font-size: 1.22rem;
  font-weight: 400;
}

.step p {
  margin: 0;
  color: var(--silver);
  font-size: .83rem;
}

.step::after {
  position: absolute;
  top: 47px;
  right: 25px;
  width: 38px;
  height: 1px;
  content: "";
  background: linear-gradient(90deg, var(--accent), transparent);
}

.social-grid {
  display: grid;
  grid-template-columns: 1.15fr 1.15fr .85fr .85fr;
  gap: 15px;
}

.social-card {
  display: flex;
  min-height: 280px;
  padding: 28px;
  flex-direction: column;
  justify-content: space-between;
}

.social-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  color: color-mix(in srgb, var(--accent) 70%, white);
  border: 1px solid var(--line);
  border-radius: 15px;
  font-family: Georgia, serif;
  font-size: 1.05rem;
}

.social-card h3 {
  font-family: Georgia, serif;
  font-size: 1.5rem;
  font-weight: 400;
}

.social-card p {
  color: var(--silver);
  font-size: .81rem;
  overflow-wrap: anywhere;
}

.placeholder-card { border-style: dashed; }

.trust { background: linear-gradient(180deg, #08090b, #0d0e11); }

.notice {
  max-width: 740px;
  margin: -26px 0 38px;
  padding: 14px 17px;
  color: #c6bfae;
  border-left: 2px solid var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  font-size: .8rem;
}

.quote-card { padding: 30px; }

.quote-mark {
  margin-bottom: 28px;
  color: var(--accent);
  font-family: Georgia, serif;
  font-size: 3.2rem;
  line-height: .6;
}

.quote-card blockquote {
  margin: 0 0 28px;
  color: #d3cfc6;
  font-family: Georgia, serif;
  font-size: 1.08rem;
  line-height: 1.55;
}

.placeholder-tag {
  color: color-mix(in srgb, var(--accent) 70%, white);
  font-size: .65rem;
  font-weight: 800;
  letter-spacing: .13em;
  text-transform: uppercase;
}

.faq-wrap {
  display: grid;
  grid-template-columns: .72fr 1.28fr;
  gap: 70px;
  align-items: start;
}

.faq-intro {
  position: sticky;
  top: 120px;
}

.faq-list { border-top: 1px solid var(--line); }
.faq-item { border-bottom: 1px solid var(--line); }

.faq-question {
  display: flex;
  width: 100%;
  padding: 25px 4px;
  align-items: center;
  justify-content: space-between;
  color: var(--white);
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-family: Georgia, serif;
  font-size: 1.16rem;
}

.faq-question span:last-child {
  display: grid;
  width: 29px;
  height: 29px;
  flex: 0 0 auto;
  margin-left: 20px;
  place-items: center;
  color: var(--accent);
  border: 1px solid var(--line);
  border-radius: 50%;
  transition: transform .3s;
}

.faq-answer {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows .35s var(--ease);
}

.faq-answer > div { overflow: hidden; }

.faq-answer p {
  padding: 0 48px 0 4px;
  color: var(--silver);
  font-size: .9rem;
}

.faq-item.open .faq-answer { grid-template-rows: 1fr; }
.faq-item.open .faq-answer p { padding-bottom: 24px; }
.faq-item.open .faq-question span:last-child { transform: rotate(45deg); }

.final-cta { padding: 80px 0 30px; }

.cta-shell {
  position: relative;
  padding: 80px clamp(28px, 7vw, 85px);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--accent) 30%, rgba(255,255,255,.16));
  border-radius: 35px;
  background:
    linear-gradient(90deg, rgba(6,6,8,.96), rgba(6,6,8,.72) 58%, rgba(6,6,8,.25)),
    url("${escapeHtml(profile.feature)}") center / cover;
  box-shadow: var(--shadow);
}

.cta-shell::before {
  position: absolute;
  top: 0;
  left: 9%;
  width: 48%;
  height: 1px;
  content: "";
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 72%, white), transparent);
  box-shadow: 0 0 18px var(--accent);
}

.cta-shell h2 { max-width: 740px; }
.cta-shell p { max-width: 620px; color: #c7c2b9; }

.cta-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 13px 28px;
  margin-top: 28px;
  color: color-mix(in srgb, var(--accent) 70%, white);
  font-size: .79rem;
  letter-spacing: .06em;
  text-transform: uppercase;
}

footer {
  padding: 60px 0 25px;
  border-top: 1px solid var(--line);
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.35fr .65fr .8fr 1fr;
  gap: 45px;
  padding-bottom: 46px;
}

.footer-brand p {
  max-width: 390px;
  color: var(--silver);
  font-size: .84rem;
}

.footer-title {
  display: block;
  margin-bottom: 18px;
  color: color-mix(in srgb, var(--accent) 70%, white);
  font-size: .7rem;
  font-weight: 850;
  letter-spacing: .14em;
  text-transform: uppercase;
}

.footer-links {
  display: grid;
  gap: 9px;
  color: #c6c2ba;
  font-size: .82rem;
}

.footer-links a:hover { color: color-mix(in srgb, var(--accent) 70%, white); }

.footer-bottom {
  display: flex;
  gap: 20px;
  padding-top: 23px;
  align-items: center;
  justify-content: space-between;
  color: #76736e;
  border-top: 1px solid rgba(255,255,255,.07);
  font-size: .72rem;
}

.reveal {
  opacity: 0;
  transform: translateY(26px);
  transition: opacity .8s var(--ease), transform .8s var(--ease);
}

.reveal.visible {
  opacity: 1;
  transform: none;
}

.delay-1 { transition-delay: .08s; }
.delay-2 { transition-delay: .16s; }
.delay-3 { transition-delay: .24s; }

@media (max-width: 1020px) {
  .hero { min-height: 900px; }
  .hero-float { display: none; }
  .premium-seal { top: auto; right: 5%; bottom: 84px; }
  .cards-grid { grid-template-columns: 1fr 1fr; }
  .why-grid { grid-template-columns: 1fr; }
  .image-frame { min-height: 540px; }
  .image-frame img { min-height: 540px; }
  .process-grid { grid-template-columns: 1fr 1fr; }
  .social-grid { grid-template-columns: 1fr 1fr; }
  .faq-wrap { grid-template-columns: 1fr; gap: 35px; }
  .faq-intro { position: static; }
  .footer-grid { grid-template-columns: 1.3fr .7fr 1fr; }
  .footer-grid > div:last-child { grid-column: 1 / -1; }
}

@media (max-width: 800px) {
  .section { padding: 82px 0; }
  .section-head { display: block; }
  .nav-wrap { min-height: 74px; }
  .menu-btn { display: block; }
  .nav-links {
    position: absolute;
    top: 74px;
    right: 16px;
    left: 16px;
    display: grid;
    gap: 0;
    padding: 16px;
    visibility: hidden;
    border: 1px solid var(--line);
    border-radius: 19px;
    background: rgba(8,8,10,.97);
    box-shadow: var(--shadow);
    opacity: 0;
    transform: translateY(-12px);
    transition: .3s var(--ease);
  }

  .nav-links.open {
    visibility: visible;
    opacity: 1;
    transform: none;
  }

  .nav-links > a { padding: 14px 12px; }
  .nav-cta { margin-top: 8px; text-align: center; }
  .hero { min-height: 920px; align-items: flex-start; padding-top: 150px; }
  .hero-bg { background-position: 62% center; }
  .hero-bg::after {
    position: absolute;
    inset: 0;
    content: "";
    background: linear-gradient(180deg, rgba(5,5,6,.28), rgba(5,5,6,.92) 72%);
  }

  .premium-seal { display: none; }
  .cred-grid { grid-template-columns: 1fr 1fr; }
  .cred-card:nth-child(2) { border-right: 0; }
  .cred-card:nth-child(-n+2) { border-bottom: 1px solid var(--line); }
  .transform-copy { right: 6%; left: 6%; }
  .transform-note { display: none; }
  .gallery-grid { grid-template-columns: 1fr 1fr; grid-auto-rows: 250px; }
  .gallery-card:nth-child(n) { grid-column: span 1; grid-row: span 1; }
  .gallery-card:nth-child(1),
  .gallery-card:nth-child(4) { grid-row: span 2; }
}

@media (max-width: 620px) {
  .container { width: calc(100% - 28px); max-width: 1180px; }
  .section { padding: 70px 0; }
  h1 { font-size: clamp(2.9rem, 14vw, 4.2rem); }
  h2 { font-size: clamp(2.35rem, 11vw, 3.7rem); }
  .eyebrow { max-width: 100%; line-height: 1.45; }
  .brand { min-width: 0; }
  .brand-name { font-size: .9rem; max-width: 200px; }
  .brand-sub { display: none; }
  .hero { min-height: 930px; padding-top: 126px; }
  .hero-copy,
  .hero-copy .lead { width: 100%; overflow-wrap: anywhere; }
  .hero-actions .btn,
  .cta-actions .btn { width: 100%; }
  .hero-contact { display: grid; gap: 10px; }
  .badges { margin-top: 28px; }
  .cred-grid,
  .cards-grid,
  .reasons,
  .social-grid,
  .process-grid,
  .footer-grid { grid-template-columns: 1fr; }
  .cred-card {
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }
  .cred-card:last-child { border-bottom: 0; }
  .service-card { min-height: 310px; }
  .image-frame {
    min-height: 490px;
    border-radius: 100px 20px 20px 20px;
  }
  .image-frame img { min-height: 490px; }
  .transform-shell,
  .transform-shell > img {
    height: 740px;
    min-height: 740px;
  }
  .transform-shell > img { object-position: 64% center; }
  .transform-shell::after {
    background: linear-gradient(0deg, rgba(5,5,6,.98) 8%, rgba(5,5,6,.67) 65%, rgba(5,5,6,.12));
  }
  .transform-copy {
    top: auto;
    right: 24px;
    bottom: 36px;
    left: 24px;
    transform: none;
  }
  .gallery-grid {
    display: grid;
    grid-template-columns: 1fr;
    grid-auto-rows: 300px;
  }
  .gallery-card:nth-child(n) {
    grid-column: 1;
    grid-row: auto;
  }
  .step { min-height: 240px; }
  .step-no { margin-bottom: 45px; }
  .social-card { min-height: 245px; }
  .faq-question { font-size: 1.04rem; }
  .cta-shell { padding: 57px 23px; }
  .footer-grid > div:last-child { grid-column: auto; }
  .footer-bottom { display: block; }
  .footer-bottom span { display: block; margin-top: 7px; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *,
  *::before,
  *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: .01ms !important;
  }
  .reveal { opacity: 1; transform: none; }
}
```

  </style>
</head>
<body>
  <nav class="nav" id="nav" aria-label="Main navigation">
    <div class="container nav-wrap">
      <a class="brand" href="#top" aria-label="${businessName} home">
        <span class="brand-mark">${businessName.replace(/&[^;]+;/g, "").charAt(0) || "N"}</span>
        <span>
          <span class="brand-name">${businessName}</span>
          <span class="brand-sub">${category}${location ? ` • ${location}` : ""}</span>
        </span>
      </a>
      <button class="menu-btn" id="menuBtn" type="button" aria-label="Open navigation menu" aria-expanded="false"><span></span></button>
      <div class="nav-links" id="navLinks">
        <a href="#experience">Experience</a>
        <a href="#services">Services</a>
        <a href="#gallery">Gallery</a>
        <a href="#process">Booking</a>
        <a href="#faq">FAQ</a>
        <a class="nav-cta" href="#contact">Contact</a>
      </div>
    </div>
  </nav>

  <main id="top">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-bg"></div>
      <div class="light-streak"></div>
      <span class="sparkle" style="top:23%;right:31%"></span>
      <span class="sparkle" style="top:42%;right:9%;animation-delay:1.4s"></span>

```
  <div class="container">
    <div class="hero-copy reveal visible">
      <div class="eyebrow">${category}${location ? ` · ${location}` : ""}</div>
      <h1 id="hero-title">A sharper online presence for <span class="accent-text">${businessName}.</span></h1>
      <p class="lead">${escapeHtml(profile.mood)} This private concept shows how ${businessName} can present services, contact options, and customer value with more clarity and polish${locationPhrase}.</p>
      <div class="hero-actions">
        ${buttons.primary}
        ${buttons.secondary}
      </div>
      <div class="hero-contact">
        ${phone ? `<a href="tel:${buttons.phoneHref}"><i class="dot"></i>${phone}</a>` : ""}
        ${email ? `<a href="mailto:${email}"><i class="dot"></i>${email}</a>` : ""}
        ${location ? `<span><i class="dot"></i>${location}</span>` : `<span><i class="dot"></i>Contact for service area</span>`}
      </div>
      <div class="badges" aria-label="Business highlights">
        <span class="badge accent">${category}</span>
        <span class="badge">Mobile-ready concept</span>
        <span class="badge">Clear contact path</span>
        <span class="badge accent">Premium presentation</span>
      </div>
    </div>
  </div>

  <div class="premium-seal" aria-hidden="true">Private<br>Concept</div>

  <aside class="hero-float" aria-label="Website concept highlights">
    <div class="hero-float-title">Built for better first impressions</div>
    <div class="mini-stat"><strong>Clarity</strong><span>Services explained</span></div>
    <div class="mini-stat"><strong>Trust</strong><span>Proof-ready layout</span></div>
    <div class="mini-stat"><strong>Action</strong><span>Contact made easy</span></div>
    <div class="mini-stat"><strong>Mobile</strong><span>Responsive flow</span></div>
  </aside>
</section>

<section class="credibility" aria-label="Why this website concept helps">
  <div class="container cred-grid">
    <article class="cred-card reveal"><span class="cred-num">01</span><h3>Premium first impression</h3><p>A stronger visual identity helps customers understand the business faster.</p></article>
    <article class="cred-card reveal delay-1"><span class="cred-num">02</span><h3>Service clarity</h3><p>Clear sections make it easier to see what is offered and what to ask about.</p></article>
    <article class="cred-card reveal delay-2"><span class="cred-num">03</span><h3>Mobile contact path</h3><p>Calls, email, social, and booking prompts stay easy to reach on smaller screens.</p></article>
    <article class="cred-card reveal delay-3"><span class="cred-num">04</span><h3>Ready for real content</h3><p>Representative imagery can be replaced with verified business photos when available.</p></article>
  </div>
</section>

<section class="section" id="services">
  <div class="container">
    <div class="section-head reveal">
      <div>
        <div class="eyebrow">Services and offers</div>
        <h2>Make every offer feel <span class="accent-text">easy to understand.</span></h2>
      </div>
      <p>Customers should not have to guess what is available. This concept organizes the main services into clear, premium cards with direct next steps.</p>
    </div>

    <div class="cards-grid">
      ${serviceCards}
    </div>
  </div>
</section>

<section class="section why" id="experience">
  <div class="container why-grid">
    <div class="image-frame reveal">
      <img src="${escapeHtml(profile.feature)}" alt="${escapeHtml(profile.alt)}" loading="lazy">
      <div class="image-label">
        <strong>Visual concept direction</strong>
        <span>Representative imagery • replace with verified business photography when ready</span>
      </div>
    </div>

    <div>
      <div class="eyebrow reveal">Why this presentation works</div>
      <h2 class="reveal">Because customers decide quickly who feels <span class="accent-text">credible.</span></h2>
      <p class="lead reveal">A website should make the business feel active, trustworthy, easy to contact, and worth choosing. This structure gives ${businessName} a stronger presentation without inventing unsupported claims.</p>

      <div class="reasons">
        <article class="reason-card reveal"><span class="card-icon">✦</span><h3>Business-specific identity</h3><p>Color, imagery, and copy can be shaped around the actual brand and niche.</p></article>
        <article class="reason-card reveal delay-1"><span class="card-icon">↗</span><h3>Clearer conversion path</h3><p>Visitors are guided toward calling, emailing, messaging, or reviewing services.</p></article>
        <article class="reason-card reveal"><span class="card-icon">◎</span><h3>Useful on mobile</h3><p>Important details stay readable and easy to act on across screen sizes.</p></article>
        <article class="reason-card reveal delay-1"><span class="card-icon">◆</span><h3>Proof-ready sections</h3><p>Real testimonials, project photos, and booking links can be added when available.</p></article>
      </div>
    </div>
  </div>
</section>

<section class="section transformation">
  <div class="container">
    <div class="transform-shell reveal">
      <img src="${escapeHtml(profile.hero)}" alt="${escapeHtml(profile.alt)}" loading="lazy">
      <div class="transform-copy">
        <span class="demo-label">Website concept • private review</span>
        <h2>From scattered information to a site that <span class="accent-text">feels intentional.</span></h2>
        <p>${businessName} can use this structure to turn existing details into a polished customer journey: what you do, why it matters, how to contact you, and what customers should do next.</p>
        <div class="benefit-stack">
          <span class="benefit-pill">Clear service positioning</span>
          <span class="benefit-pill">Stronger visual trust</span>
          <span class="benefit-pill">Better mobile action flow</span>
        </div>
      </div>
      <aside class="transform-note">
        <strong>Ready to personalize.</strong>
        <p>Replace representative imagery with real business photos, confirmed reviews, packages, and booking links.</p>
      </aside>
    </div>
  </div>
</section>

<section class="section gallery" id="gallery">
  <div class="container">
    <div class="section-head reveal">
      <div>
        <div class="eyebrow">Visual showcase</div>
        <h2>A richer view of the <span class="accent-text">brand world.</span></h2>
      </div>
      <p>Strong visuals create context. This gallery uses niche-relevant representative imagery until verified business photos are available.</p>
    </div>

    <div class="gallery-grid">
      ${galleryCards}
    </div>
  </div>
</section>

<section class="section" id="process">
  <div class="container">
    <div class="section-head reveal">
      <div>
        <div class="eyebrow">Simple customer journey</div>
        <h2>Four steps from interest to <span class="accent-text">action.</span></h2>
      </div>
      <p>A good website should reduce friction. This section gives customers a simple path to contact, confirm details, and move forward.</p>
    </div>

    <div class="process-grid">
      <article class="step reveal"><span class="step-no">01</span><h3>Explore the offer</h3><p>Customers quickly understand the service, product, or experience available.</p></article>
      <article class="step reveal delay-1"><span class="step-no">02</span><h3>Ask the right questions</h3><p>They can confirm scope, availability, pricing, booking, or custom needs.</p></article>
      <article class="step reveal delay-2"><span class="step-no">03</span><h3>Use a clear contact path</h3><p>Phone, email, website, or social links are placed where customers can act.</p></article>
      <article class="step reveal delay-3"><span class="step-no">04</span><h3>Move with confidence</h3><p>The business feels more credible because the information is organized well.</p></article>
    </div>
  </div>
</section>

<section class="section section-tight">
  <div class="container">
    <div class="section-head reveal">
      <div>
        <div class="eyebrow">Connect</div>
        <h2>Make every contact option <span class="accent-text">easy to find.</span></h2>
      </div>
      <p>Customers should never hunt for the next step. This section can connect calls, email, social media, booking links, and existing websites.</p>
    </div>

    <div class="social-grid">
      <article class="social-card reveal">
        <span class="social-icon">☎</span>
        <div>
          <h3>Phone / WhatsApp</h3>
          <p>${phone || "Add a phone or WhatsApp number when available."}</p>
          ${phone ? `<a class="text-link" href="tel:${buttons.phoneHref}">Call now <span>→</span></a>` : `<span class="text-link">Add phone number</span>`}
        </div>
      </article>

      <article class="social-card reveal delay-1">
        <span class="social-icon">@</span>
        <div>
          <h3>Email</h3>
          <p>${email || "Add an email address when available."}</p>
          ${email ? `<a class="text-link" href="mailto:${email}">Send email <span>→</span></a>` : `<span class="text-link">Add email address</span>`}
        </div>
      </article>

      <article class="social-card placeholder-card reveal delay-2">
        <span class="social-icon">↗</span>
        <div>
          <h3>Social</h3>
          <p>${social ? escapeHtml(social) : "Add Instagram, Facebook, TikTok, YouTube, or another public profile."}</p>
          ${social ? `<a class="text-link" href="${escapeHtml(social)}" target="_blank" rel="noopener">Visit social <span>↗</span></a>` : `<span class="text-link">Add social link</span>`}
        </div>
      </article>

      <article class="social-card placeholder-card reveal delay-3">
        <span class="social-icon">＋</span>
        <div>
          <h3>Booking / Website</h3>
          <p>${website ? escapeHtml(website) : "Add booking or existing website link when available."}</p>
          ${website ? `<a class="text-link" href="${escapeHtml(website)}" target="_blank" rel="noopener">Open link <span>↗</span></a>` : `<span class="text-link">Add booking link</span>`}
        </div>
      </article>
    </div>
  </div>
</section>

<section class="section trust">
  <div class="container">
    <div class="section-head reveal">
      <div>
        <div class="eyebrow">Trust ready</div>
        <h2>Built for real proof, not <span class="accent-text">fake claims.</span></h2>
      </div>
    </div>

    <p class="notice reveal"><strong>Placeholder examples for demo purposes only</strong> — replace these cards with real customer reviews, project results, certifications, or proof points when available.</p>

    <div class="cards-grid">
      <article class="quote-card reveal"><div class="quote-mark">“</div><blockquote>Space for a verified customer review about the experience, service quality, or result.</blockquote><span class="placeholder-tag">Placeholder • Not a real review</span></article>
      <article class="quote-card reveal delay-1"><div class="quote-mark">“</div><blockquote>Space for a verified project story, transformation, case study, or client result.</blockquote><span class="placeholder-tag">Placeholder • Not a real review</span></article>
      <article class="quote-card reveal delay-2"><div class="quote-mark">“</div><blockquote>Space for a verified trust signal, guarantee, certification, or business milestone.</blockquote><span class="placeholder-tag">Placeholder • Not a real claim</span></article>
    </div>
  </div>
</section>

<section class="section" id="faq">
  <div class="container faq-wrap">
    <div class="faq-intro reveal">
      <div class="eyebrow">Frequently asked</div>
      <h2>Useful answers before customers <span class="accent-text">reach out.</span></h2>
      <p class="lead">Clear questions reduce hesitation and help visitors understand what to do next.</p>
      ${buttons.primary}
    </div>

    <div class="faq-list reveal">
      <div class="faq-item open">
        <button class="faq-question" type="button" aria-expanded="true"><span>What does ${businessName} offer?</span><span>+</span></button>
        <div class="faq-answer"><div><p>${businessName} is presented as a ${category} business${locationPhrase}. Contact the business directly to confirm current options, packages, pricing, and availability.</p></div></div>
      </div>

      <div class="faq-item">
        <button class="faq-question" type="button" aria-expanded="false"><span>Where is the business located?</span><span>+</span></button>
        <div class="faq-answer"><div><p>${location ? `${businessName} is listed in ${location}.` : "A specific service area was not provided. Add a confirmed location or service area when available."}</p></div></div>
      </div>

      <div class="faq-item">
        <button class="faq-question" type="button" aria-expanded="false"><span>Are prices listed?</span><span>+</span></button>
        <div class="faq-answer"><div><p>No confirmed public pricing is included in this concept unless added by the business. Customers should contact ${businessName} to confirm current pricing and scope.</p></div></div>
      </div>

      <div class="faq-item">
        <button class="faq-question" type="button" aria-expanded="false"><span>Can this website use real photos and reviews?</span><span>+</span></button>
        <div class="faq-answer"><div><p>Yes. Representative imagery and placeholder trust cards should be replaced with verified business photography, real reviews, actual services, and confirmed proof points.</p></div></div>
      </div>

      <div class="faq-item">
        <button class="faq-question" type="button" aria-expanded="false"><span>How do customers get started?</span><span>+</span></button>
        <div class="faq-answer"><div><p>Use the contact section to call, email, visit social media, or open the existing website if those details are available.</p></div></div>
      </div>
    </div>
  </div>
</section>

<section class="final-cta" id="contact">
  <div class="container">
    <div class="cta-shell reveal">
      <div class="eyebrow">Ready for a stronger presence</div>
      <h2>Turn this concept into a website customers can <span class="accent-text">trust and use.</span></h2>
      <p>This private concept shows how ${businessName} can present services, visuals, trust, and contact options with more polish and purpose.</p>
      <div class="cta-actions">
        ${buttons.primary}
        ${email ? `<a class="btn btn-glass" href="mailto:${email}">Send an email</a>` : ""}
        ${social ? `<a class="btn btn-glass" href="${escapeHtml(social)}" target="_blank" rel="noopener">Social profile</a>` : ""}
        ${website ? `<a class="btn btn-glass" href="${escapeHtml(website)}" target="_blank" rel="noopener">Existing website</a>` : ""}
      </div>
      <div class="cta-meta">
        <span>${category}</span>
        ${location ? `<span>${location}</span>` : `<span>Service area to be confirmed</span>`}
      </div>
    </div>
  </div>
</section>
```

  </main>

  <footer>
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a class="brand" href="#top">
            <span class="brand-mark">${businessName.replace(/&[^;]+;/g, "").charAt(0) || "N"}</span>
            <span>
              <span class="brand-name">${businessName}</span>
              <span class="brand-sub">${category}${location ? ` • ${location}` : ""}</span>
            </span>
          </a>
          <p style="margin-top:20px">Private website concept for review. Replace representative content with verified business details before publishing as an official website.</p>
        </div>

```
    <div>
      <span class="footer-title">Navigate</span>
      <div class="footer-links">
        <a href="#experience">Experience</a>
        <a href="#services">Services</a>
        <a href="#gallery">Gallery</a>
        <a href="#process">Booking</a>
        <a href="#faq">FAQ</a>
      </div>
    </div>

    <div>
      <span class="footer-title">Connect</span>
      <div class="footer-links">
        ${phone ? `<a href="tel:${buttons.phoneHref}">${phone}</a>` : `<span>Phone to be added</span>`}
        ${email ? `<a href="mailto:${email}">${email}</a>` : `<span>Email to be added</span>`}
        ${social ? `<a href="${escapeHtml(social)}" target="_blank" rel="noopener">Social profile</a>` : `<span>Social link to be added</span>`}
      </div>
    </div>

    <div>
      <span class="footer-title">Concept Notes</span>
      <div class="footer-links">
        <span>Representative imagery only</span>
        <span>No fake reviews or claims</span>
        <span>Services should be confirmed</span>
        <span>Designed for private review</span>
      </div>
    </div>
  </div>

  <div class="footer-bottom">
    <span>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</span>
    <span>Website concept created for presentation purposes.</span>
  </div>
</div>
```

  </footer>

  <script>
    (() => {
      const nav = document.getElementById("nav");
      const menuBtn = document.getElementById("menuBtn");
      const navLinks = document.getElementById("navLinks");

      const updateNav = () => nav.classList.toggle("scrolled", window.scrollY > 20);
      updateNav();
      window.addEventListener("scroll", updateNav, { passive: true });

      menuBtn.addEventListener("click", () => {
        const open = navLinks.classList.toggle("open");
        menuBtn.classList.toggle("active", open);
        menuBtn.setAttribute("aria-expanded", String(open));
        menuBtn.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
      });

      navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          navLinks.classList.remove("open");
          menuBtn.classList.remove("active");
          menuBtn.setAttribute("aria-expanded", "false");
        });
      });

      document.querySelectorAll(".faq-question").forEach((button) => {
        button.addEventListener("click", () => {
          const item = button.closest(".faq-item");
          const isOpen = item.classList.contains("open");

          document.querySelectorAll(".faq-item").forEach((other) => {
            other.classList.remove("open");
            other.querySelector(".faq-question").setAttribute("aria-expanded", "false");
          });

          if (!isOpen) {
            item.classList.add("open");
            button.setAttribute("aria-expanded", "true");
          }
        });
      });

      const observer = "IntersectionObserver" in window
        ? new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
              }
            });
          }, { threshold: 0.1, rootMargin: "0px 0px -40px" })
        : null;

      document.querySelectorAll(".reveal:not(.visible)").forEach((el) => {
        if (observer) observer.observe(el);
        else el.classList.add("visible");
      });
    })();
  </script>

</body>
</html>`;
}

function toneLead(tone: MessageTone) {
const leads: Record<MessageTone, string> = {
Friendly: "I came across your business and liked how clearly your work comes through.",
Direct: "I reviewed the online information available for your business and saw a clear website opportunity.",
Premium: "Your business has the ingredients for a much stronger premium online presentation.",
"Soft sell": "I wanted to share a small idea that may be useful for your online presence.",
Confident: "I can see a strong opportunity to make your online presentation clearer, more polished, and more conversion-focused.",
"Local business friendly": "I enjoy seeing local businesses present their work well, and yours caught my attention.",
};

return leads[tone];
}

function observation(info: BusinessInfo) {
if (info.painPoints) return info.painPoints;

if (!info.websiteUrl) {
return "From the information I had, I could not find a clear website link where customers can quickly review the offer and contact you.";
}

return "I noticed an opportunity to make the mobile service journey, visual presentation, and main contact action more immediate.";
}

function priceLine(info: BusinessInfo) {
return info.packagePrice
? `The website package shown here starts at ${info.packagePrice}, subject to final scope.`
: "I can outline the package and scope after you review the concept.";
}

function demoLine(info: BusinessInfo) {
return info.demoUrl
? `You can view the private concept here: ${info.demoUrl}`
: "I can send the private concept link as soon as the preview is deployed.";
}

export function generateSalesMessages(
info: BusinessInfo,
tone: MessageTone,
settings: AppSettings,
): SalesMessages {
const name = info.businessName || "your business";
const sender = settings.senderName || "Chad";
const company = settings.companyName || "Niche Technologies";
const intro = toneLead(tone);
const specificObservation = observation(info);
const price = priceLine(info);
const link = demoLine(info);

return {
whatsapp: `Hi ${name}, ${intro}

${specificObservation}

I created a private, custom website concept to show how the business could look with clearer services, stronger mobile presentation, premium visuals, and an easier contact path.

${link}

${price}

Would you be open to taking a quick look and telling me what you think?

${sender}
${company}`,

```
emailSubject: `Private website concept for ${name}`,

email: `Hi ${name},
```

${intro}

${specificObservation}

I prepared a private website concept for your business. It is designed to make the offer easier to understand, improve the mobile experience, strengthen the visual presentation, and give prospective customers a clearer next step.

${link}

${price}

If the direction feels useful, I would be happy to walk you through what is included and tailor it to your real content.

Regards,
${sender}
${company}
${settings.mailingAddress ? `${settings.mailingAddress}\n` : ""}
If you would prefer not to receive another message from me, just let me know.`,

```
dm: `Hi ${name}. ${specificObservation} I made a private website concept to show a clearer, more polished direction for the business. ${info.demoUrl ? `Preview: ${info.demoUrl}` : "I can send the preview link once it is live."} ${price} Open to a quick look? - ${sender}, ${company}`,

followUp: `Hi ${name}, just following up on the private website concept I prepared. ${info.demoUrl ? `Here is the preview again: ${info.demoUrl}` : "I can send the live preview whenever convenient."} No pressure at all; I would value your honest feedback.`,

finalFollowUp: `Hi ${name}, one last note from me about the website concept. ${info.demoUrl ? `The preview is here if you would still like to see it: ${info.demoUrl}` : "I am happy to share the preview if it becomes useful."} I will close the loop after this, but you are welcome to reach out anytime. - ${sender}, ${company}`,
```

};
}

export function generateFollowUpMessage(
info: BusinessInfo,
settings: AppSettings,
final = false,
) {
const messages = generateSalesMessages(info, "Soft sell", settings);
return final ? messages.finalFollowUp : messages.followUp;
}

export function generatedNames(info: BusinessInfo) {
const slug = slugify(info.businessName || "business-demo");

return {
folder: slug || "business-demo",
project: `${slug || "business"}-demo`,
file: "index.html",
};
}
