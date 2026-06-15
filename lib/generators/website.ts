import type { BusinessInfo } from "@/lib/types";
import { getCopyAngle } from "@/lib/generators/copy-angles";
import { colorPair } from "@/lib/generators/palettes";
import { schemaType, visualProfile } from "@/lib/generators/visual-profiles";
import { getWebsitePreset } from "@/lib/generators/website-presets";

function escapeHtml(value: string) {
return value
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");
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

function readableCategory(category: string) {
return category || "professional service";
}

function contactButtons(phone: string, email: string, social: string, website: string, ctaLanguage: string) {
const phoneHref = phone.replace(/[^\d+]/g, "");
const cta = escapeHtml(ctaLanguage);

const primary = phoneHref
? `<a class="btn btn-primary" href="tel:${phoneHref}">${cta}</a>`
: email
? `<a class="btn btn-primary" href="mailto:${email}">${cta}</a>`
: `<a class="btn btn-primary" href="#contact">${cta}</a>`;

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
const preset = getWebsitePreset(profile.preferredPreset);
const copy = getCopyAngle(profile.copyAngle);
const locationPhrase = location ? ` in ${location}` : "";
const offerLead = escapeHtml(services[0] || categoryRaw);
const description = `${businessNameRaw} provides ${categoryRaw}${locationRaw ? ` in ${locationRaw}` : ""}. Explore services, contact options, and current availability through this private website concept.`;
const title = `${businessNameRaw} | ${categoryRaw}${locationRaw ? ` in ${locationRaw}` : ""}`;
const buttons = contactButtons(phone, email, social, website, profile.ctaLanguage);

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
(service, index) => `<article class="service-card reveal">         <div class="card-index"><span>${String(index + 1).padStart(2, "0")}</span><span class="card-icon">${["◇", "✦", "◈", "↻", "◆", "＋"][index] ?? "✦"}</span></div>         <h3>${escapeHtml(service)}</h3>         <p>${escapeHtml(copy.serviceLine)} Ask about current scope, availability, and the right option for your needs.</p>         <a class="text-link" href="#contact">${escapeHtml(profile.ctaLanguage)} <span>→</span></a>       </article>`,
)
.join("");

const galleryCards = profile.gallery
.map(
(image, index) => `<figure class="gallery-card reveal">         <img src="${escapeHtml(image)}" alt="${escapeHtml(`${profile.alt}, representative image ${index + 1}`)}" loading="lazy">         <figcaption class="gallery-caption">           <strong>${escapeHtml(copy.galleryCaptions[index] ?? "Visual direction")}</strong>           <span>Representative imagery</span>         </figcaption>       </figure>`,
)
.join("");

const credibilityDescriptions = [
`A ${preset.tone.toLowerCase()} first impression shaped around ${profile.sectionEmphasis[0]}.`,
`Clear sections help visitors understand ${profile.sectionEmphasis[1]} and ask informed questions.`,
`The contact path supports ${profile.sectionEmphasis[3]} without implying unavailable services.`,
"Representative content is ready to be replaced with verified photography and proof.",
];

const credibilityCards = copy.credibility
.map(
(heading, index) => `<article class="cred-card reveal${index ? ` delay-${index}` : ""}"><span class="cred-num">${String(index + 1).padStart(2, "0")}</span><h3>${escapeHtml(heading)}</h3><p>${escapeHtml(credibilityDescriptions[index])}</p></article>`,
)
.join("");

const processDescriptions = [
`Start with ${profile.sectionEmphasis[0]} and the information currently available.`,
`Ask about ${profile.sectionEmphasis[1]}, current options, and suitability.`,
`Use the available contact route to discuss ${profile.sectionEmphasis[2]}.`,
`Confirm availability, scope, and the next step directly with ${businessNameRaw}.`,
];

const processCards = copy.process
.map(
(heading, index) => `<article class="step reveal${index ? ` delay-${index}` : ""}"><span class="step-no">${String(index + 1).padStart(2, "0")}</span><h3>${escapeHtml(heading)}</h3><p>${escapeHtml(processDescriptions[index])}</p></article>`,
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
      --page-bg: ${preset.theme.pageBg};
      --surface: ${preset.theme.surface};
      --text: ${preset.theme.text};
      --theme-muted: ${preset.theme.muted};
      --hero-overlay: ${preset.theme.heroOverlay};
      --hero-text: ${preset.theme.heroText};
      --card-bg: ${preset.theme.cardBg};
      --section-bg: ${preset.theme.sectionBg};
      --theme-border: ${preset.theme.border};
      --nav-bg: ${preset.theme.navBg};
      --display-font: ${preset.theme.displayFont};
      --body-font: ${preset.theme.bodyFont};
      --theme-shadow: ${preset.theme.shadow};
      --white: var(--text);
      --silver: var(--theme-muted);
      --muted: var(--theme-muted);
      --line: var(--theme-border);
      --glass: rgba(15, 16, 20, .74);
      --shadow: var(--theme-shadow);
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

/* Preset-driven theme layer */
body {
  color: var(--text);
  background:
    radial-gradient(circle at 16% 8%, color-mix(in srgb, var(--primary) 13%, transparent), transparent 28rem),
    radial-gradient(circle at 90% 28%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 30rem),
    var(--page-bg);
  font-family: var(--body-font);
}

main { display: flex; flex-direction: column; }
.hero { order: 1; color: var(--hero-text); }
.credibility { order: 2; }
#services { order: 3; }
#experience { order: 4; }
.transformation { order: 5; }
#gallery { order: 6; }
#process { order: 7; }
.section-tight { order: 8; }
.trust { order: 9; }
#faq { order: 10; }
.final-cta { order: 11; }

h1, h2, h3,
.brand-name,
.hero-float-title,
.cred-num,
.cred-card h3,
.reason-card h3,
.faq-question { font-family: var(--display-font); }

.lead,
.section-head p,
.service-card p,
.reason-card p,
.social-card p,
.cred-card p,
.faq-answer p,
.footer-brand p { color: var(--theme-muted); }

.nav.scrolled {
  background: var(--nav-bg);
  box-shadow: var(--theme-shadow);
}
.brand-name,
.brand-sub,
.nav-links > a,
.menu-btn { color: var(--text); }

.hero-bg {
  background:
    var(--hero-overlay),
    linear-gradient(0deg, var(--page-bg) 0%, transparent 38%),
    url("${escapeHtml(profile.hero)}") 72% center / cover no-repeat;
}

.btn-glass,
.badge,
.hero-float,
.premium-seal {
  color: var(--text);
  border-color: var(--theme-border);
  background: color-mix(in srgb, var(--surface) 84%, transparent);
}

.hero-contact,
.mini-stat span { color: color-mix(in srgb, var(--hero-text) 76%, transparent); }

.credibility {
  border-color: var(--theme-border);
  background: var(--surface);
}

.service-card,
.reason-card,
.social-card,
.quote-card {
  color: var(--text);
  border-color: var(--theme-border);
  background: var(--card-bg);
  box-shadow: var(--theme-shadow);
}

.why,
.gallery,
.trust { background: var(--section-bg); }

.faq-question { color: var(--text); }
.notice,
.quote-card blockquote { color: var(--text); }
footer { color: var(--text); background: var(--page-bg); }
.footer-links { color: var(--theme-muted); }
.footer-bottom { color: color-mix(in srgb, var(--text) 48%, transparent); border-color: var(--theme-border); }

.card-bordered .service-card,
.card-bordered .reason-card,
.card-bordered .social-card,
.card-bordered .quote-card { box-shadow: none; }

.card-soft .service-card,
.card-soft .reason-card,
.card-soft .social-card,
.card-soft .quote-card { border-radius: 36px; }

.card-minimal .service-card,
.card-minimal .reason-card,
.card-minimal .social-card,
.card-minimal .quote-card {
  border-width: 0 0 1px;
  border-radius: 0;
  box-shadow: none;
}

.type-bold h1,
.type-bold h2 { font-weight: 800; letter-spacing: -.06em; }
.type-clean h1,
.type-clean h2,
.type-technical h1,
.type-technical h2 { font-family: var(--display-font); font-weight: 720; }
.type-technical .eyebrow { letter-spacing: .24em; }

.hero-split .hero { min-height: 790px; }
.hero-split .hero-bg {
  inset: 105px 4vw 55px 52%;
  border: 1px solid var(--theme-border);
  border-radius: 36px;
  box-shadow: var(--theme-shadow);
}
.hero-split .hero-copy { max-width: 49%; }
.hero-split .hero-float,
.hero-split .premium-seal,
.hero-split .light-streak,
.hero-split .sparkle { display: none; }

.hero-soft-overlay .light-streak,
.hero-soft-overlay .sparkle,
.hero-soft-overlay .premium-seal { display: none; }

.hero-technical .image-frame,
.hero-technical .transform-shell,
.hero-technical .service-card { border-radius: 8px; }

.theme-memorial .hero { min-height: 820px; }
.theme-memorial .section { padding-block: 96px; }
.theme-memorial .eyebrow { letter-spacing: .12em; }

.theme-professional .hero,
.theme-clean-local .hero,
.theme-soft-wellness .hero { min-height: 790px; }

.theme-restaurant #services { order: 2; }
.theme-restaurant #gallery { order: 3; }
.theme-restaurant #experience { order: 4; }
.theme-restaurant .transformation { order: 5; }
.theme-restaurant #process { order: 6; }
.theme-restaurant .credibility { order: 7; }
.theme-restaurant .gallery-grid { grid-auto-rows: 275px; }

.theme-artist #gallery { order: 2; }
.theme-artist #experience { order: 3; }
.theme-artist #services { order: 4; }
.theme-artist .transformation { order: 5; }
.theme-artist .credibility { order: 6; }
.theme-artist #process { order: 7; }
.theme-artist .gallery-grid { grid-auto-rows: 310px; }
.theme-artist .hero { min-height: 1020px; }

.theme-3d-studio #services,
.theme-industrial #services { order: 2; }
.theme-3d-studio #process,
.theme-industrial #process { order: 3; }
.theme-3d-studio .transformation,
.theme-industrial .transformation { order: 4; }
.theme-3d-studio #gallery,
.theme-industrial #gallery { order: 5; }
.theme-3d-studio #experience,
.theme-industrial #experience { order: 6; }
.theme-3d-studio .credibility,
.theme-industrial .credibility { order: 7; }

@media (max-width: 900px) {
  .hero-split .hero { min-height: 900px; }
  .hero-split .hero-bg {
    inset: 92px 14px 30px;
    border-radius: 26px;
  }
  .hero-split .hero-bg::after { content: ""; position: absolute; inset: 0; background: var(--hero-overlay); }
  .hero-split .hero-copy { max-width: 100%; }
  .nav-links { background: var(--nav-bg); }
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
  </style>
</head>
<body class="${preset.themeClass} mode-${preset.themeMode} type-${preset.typographyMood} card-${preset.cardStyle} hero-${preset.heroTreatment} intensity-${preset.colorIntensity}">
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

  <div class="container">
    <div class="hero-copy reveal visible">
      <div class="eyebrow">${category}${location ? ` · ${location}` : ""}</div>
      <h1 id="hero-title">${escapeHtml(copy.heroLead)} <span class="accent-text">${businessName}.</span></h1>
      <p class="lead">${escapeHtml(profile.mood)} ${escapeHtml(copy.valueLine)}${location ? ` Serving customers in ${location}.` : ""}</p>
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
        <span class="badge">${escapeHtml(profile.sectionEmphasis[0])}</span>
        <span class="badge">${escapeHtml(profile.sectionEmphasis[1])}</span>
        <span class="badge accent">${escapeHtml(preset.name)}</span>
      </div>
    </div>
  </div>

  <div class="premium-seal" aria-hidden="true">Private<br>Concept</div>

  <aside class="hero-float" aria-label="Website concept highlights">
    <div class="hero-float-title">${escapeHtml(preset.headlineStyle)}</div>
    ${profile.sectionEmphasis.map((item, index) => `<div class="mini-stat"><strong>${String(index + 1).padStart(2, "0")}</strong><span>${escapeHtml(item)}</span></div>`).join("")}
  </aside>
</section>

<section class="credibility" aria-label="Why this website concept helps">
  <div class="container cred-grid">
    ${credibilityCards}
  </div>
</section>

<section class="section" id="services">
  <div class="container">
    <div class="section-head reveal">
      <div>
        <div class="eyebrow">Services and offers</div>
        <h2>${escapeHtml(copy.serviceLine)}</h2>
      </div>
      <p>${escapeHtml(preset.sectionEmphasis.join(", "))}. Ask about current options and confirm availability directly.</p>
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
      <div class="eyebrow reveal">${escapeHtml(preset.visualMood)}</div>
      <h2 class="reveal">${escapeHtml(copy.finalPrompt)}</h2>
      <p class="lead reveal">${escapeHtml(preset.tone)} ${businessName} can use this structure to clarify ${escapeHtml(profile.sectionEmphasis.join(", "))} without inventing unsupported claims.</p>

      <div class="reasons">
        <article class="reason-card reveal"><span class="card-icon">✦</span><h3>${escapeHtml(profile.sectionEmphasis[0])}</h3><p>${escapeHtml(copy.credibility[0])} with wording grounded in supplied business details.</p></article>
        <article class="reason-card reveal delay-1"><span class="card-icon">↗</span><h3>${escapeHtml(profile.sectionEmphasis[1])}</h3><p>${escapeHtml(copy.credibility[1])} while leaving current options open for confirmation.</p></article>
        <article class="reason-card reveal"><span class="card-icon">◎</span><h3>${escapeHtml(profile.sectionEmphasis[2])}</h3><p>${escapeHtml(preset.preferredLayoutRhythm)}</p></article>
        <article class="reason-card reveal delay-1"><span class="card-icon">◆</span><h3>${escapeHtml(profile.sectionEmphasis[3])}</h3><p>${escapeHtml(preset.ctaStyle)} Confirm availability directly.</p></article>
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
        <h2>${escapeHtml(copy.transformation)}</h2>
        <p>${businessName} can use this structure to connect ${escapeHtml(profile.sectionEmphasis.join(", "))} in one ${escapeHtml(preset.tone.toLowerCase())} customer journey.</p>
        <div class="benefit-stack">
          <span class="benefit-pill">${escapeHtml(copy.credibility[0])}</span>
          <span class="benefit-pill">${escapeHtml(copy.credibility[1])}</span>
          <span class="benefit-pill">${escapeHtml(copy.credibility[2])}</span>
        </div>
      </div>
      <aside class="transform-note">
        <strong>${escapeHtml(preset.name)} direction.</strong>
        <p>Replace representative imagery with verified business photography. Ask about current options before publishing service details.</p>
      </aside>
    </div>
  </div>
</section>

<section class="section gallery" id="gallery">
  <div class="container">
    <div class="section-head reveal">
      <div>
        <div class="eyebrow">Visual showcase</div>
        <h2>${escapeHtml(copy.galleryCaptions[0])}: a richer view of the brand world.</h2>
      </div>
      <p>${escapeHtml(preset.visualMood)} Representative imagery should be replaced with verified business photography when ready.</p>
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
        <div class="eyebrow">${escapeHtml(profile.sectionEmphasis[3])}</div>
        <h2>Four steps shaped around ${escapeHtml(copy.name)}.</h2>
      </div>
      <p>${escapeHtml(preset.ctaStyle)} Current scope and availability should always be confirmed directly.</p>
    </div>

    <div class="process-grid">
      ${processCards}
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
      <div class="eyebrow">Before you ${escapeHtml(profile.ctaLanguage.toLowerCase())}</div>
      <h2>Useful answers about ${escapeHtml(profile.sectionEmphasis[0])} and current options.</h2>
      <p class="lead">${escapeHtml(preset.safeWordingRules[0])} ${escapeHtml(preset.safeWordingRules[1])}</p>
      ${buttons.primary}
    </div>

    <div class="faq-list reveal">
      <div class="faq-item open">
        <button class="faq-question" type="button" aria-expanded="true"><span>What ${escapeHtml(profile.sectionEmphasis[0])} options are available?</span><span>+</span></button>
        <div class="faq-answer"><div><p>${businessName} is presented as a ${category} business${locationPhrase}. Ask about current options, scope, and availability directly.</p></div></div>
      </div>

      <div class="faq-item">
        <button class="faq-question" type="button" aria-expanded="false"><span>Where is the business located?</span><span>+</span></button>
        <div class="faq-answer"><div><p>${location ? `${businessName} is listed in ${location}.` : "A specific service area was not provided. Add a confirmed location or service area when available."}</p></div></div>
      </div>

      <div class="faq-item">
        <button class="faq-question" type="button" aria-expanded="false"><span>How can I confirm ${escapeHtml(profile.sectionEmphasis[1])}?</span><span>+</span></button>
        <div class="faq-answer"><div><p>Use the available contact route to ask ${businessName} about current options, pricing, timing, and suitability. No unverified pricing is included.</p></div></div>
      </div>

      <div class="faq-item">
        <button class="faq-question" type="button" aria-expanded="false"><span>Can this website use real photos and reviews?</span><span>+</span></button>
        <div class="faq-answer"><div><p>Yes. Representative imagery and placeholder trust cards should be replaced with verified business photography, real reviews, actual services, and confirmed proof points.</p></div></div>
      </div>

      <div class="faq-item">
        <button class="faq-question" type="button" aria-expanded="false"><span>How do customers get started?</span><span>+</span></button>
        <div class="faq-answer"><div><p>${escapeHtml(copy.process[0])}, then use the contact section to call, email, visit social media, or open the existing website when those details are available.</p></div></div>
      </div>
    </div>
  </div>
</section>

<section class="final-cta" id="contact">
  <div class="container">
    <div class="cta-shell reveal">
      <div class="eyebrow">${escapeHtml(profile.ctaLanguage)}</div>
      <h2>${escapeHtml(copy.finalPrompt)}</h2>
      <p>This ${escapeHtml(preset.name)} concept shows how ${businessName} can present ${escapeHtml(profile.sectionEmphasis.join(", "))} with more clarity and purpose.</p>
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
          <p style="margin-top:20px">${escapeHtml(preset.name)} private concept for review. Replace representative content with verified business details before publishing as an official website.</p>
        </div>

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
        <span>${escapeHtml(preset.safeWordingRules[2])}</span>
        <span>No fake reviews, awards, or guarantees</span>
        <span>${escapeHtml(preset.safeWordingRules[1])}</span>
        <span>${escapeHtml(preset.tone)}</span>
      </div>
    </div>
  </div>

  <div class="footer-bottom">
    <span>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</span>
    <span>Website concept created for presentation purposes.</span>
  </div>
</div>
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
