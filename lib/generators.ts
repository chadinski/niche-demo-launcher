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
    "dental clinic",
    "restaurant",
    "florist",
    "auto repair",
    "mechanic",
    "contractor",
    "real estate",
    "salon",
    "barber",
    "bakery",
    "law firm",
    "accounting",
    "interior design",
    "pet store",
    "electrical supplies",
    "plumbing supplies",
    "photography",
    "cleaning service",
  ];
  const lower = raw.toLowerCase();
  return categories.find((category) => lower.includes(category)) ?? "";
}

function inferName(raw: string) {
  const labeled = valueAfterLabel(raw, ["business name", "company", "name"]);
  if (labeled) return labeled;
  const firstLine = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (!firstLine) return "";
  return firstLine.split(/[|•]/)[0].split(/\s[-–]\s/)[0].trim().slice(0, 80);
}

function inferServices(raw: string) {
  const labeled = valueAfterLabel(raw, ["services", "products", "offers", "specialties"]);
  if (labeled) return labeled;
  const serviceLine = raw
    .split(/\r?\n/)
    .find((line) => /\b(services?|products?|speciali[sz](?:es|ing)|offers?)\b/i.test(line));
  return serviceLine?.replace(/^.*?[:\-]\s*/, "").trim() ?? "";
}

function inferPainPoints(raw: string, website: string) {
  const labeled = valueAfterLabel(raw, ["pain points", "issues", "website issue", "opportunity"]);
  if (labeled) return labeled;
  if (!website) {
    return "No clear website link was included in the supplied business information.";
  }
  return "The current online presentation may benefit from clearer mobile calls to action and service positioning.";
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
  const email = firstMatch(raw, /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/i);
  const urls = raw.match(/https?:\/\/[^\s,)\]]+/gi) ?? [];
  const socialUrl =
    urls.find((url) => /(instagram|facebook|tiktok|linkedin)\.com/i.test(url)) ?? "";
  const websiteUrl = urls.find((url) => url !== socialUrl) ?? "";
  const phone =
    valueAfterLabel(raw, ["phone", "whatsapp", "tel", "telephone"]) ||
    firstMatch(raw, /(?:\+?\d[\d\s().-]{7,}\d)/);
  const colors = raw.match(/#[0-9a-f]{6}\b/gi)?.slice(0, 3).join(", ") ?? "";

  return {
    rawInfo: raw,
    businessName: inferName(raw),
    category: valueAfterLabel(raw, ["category", "business type", "industry"]) || inferCategory(raw),
    location: valueAfterLabel(raw, ["location", "address", "service area", "based in"]),
    phone,
    email,
    websiteUrl,
    socialUrl,
    services: inferServices(raw),
    brandColors: valueAfterLabel(raw, ["brand colors", "colours", "colors"]) || colors,
    painPoints: inferPainPoints(raw, websiteUrl),
  };
}

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
    .split(/,|\n|•|\|/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);

  if (services.length) return services;
  return [
    `${category || "Professional"} services`,
    "Personalized support",
    "Easy consultation and contact",
  ];
}

function colorPair(value: string) {
  const colors = value.match(/#[0-9a-f]{6}\b/gi) ?? [];
  return [colors[0] ?? DEFAULT_PRIMARY, colors[1] ?? DEFAULT_ACCENT];
}

export function generateWebsiteHTML(info: BusinessInfo) {
  const businessName = escapeHtml(info.businessName || "Your Business");
  const category = escapeHtml(info.category || "professional services");
  const location = escapeHtml(info.location);
  const phone = escapeHtml(info.phone);
  const email = escapeHtml(info.email);
  const website = safeUrl(info.websiteUrl);
  const social = safeUrl(info.socialUrl);
  const services = servicesFrom(info.services, info.category);
  const [primary, accent] = colorPair(info.brandColors);
  const phoneHref = info.phone.replace(/[^\d+]/g, "");
  const locationPhrase = location ? ` in ${location}` : "";
  const title = `${businessName} | ${category}${locationPhrase}`;
  const description = `${businessName} provides ${category}${locationPhrase}. Explore services and contact the team directly.`;
  const contactLink = phoneHref
    ? `<a class="button button-primary" href="tel:${phoneHref}">Call ${phone}</a>`
    : email
      ? `<a class="button button-primary" href="mailto:${email}">Send an enquiry</a>`
      : `<a class="button button-primary" href="#contact">View contact options</a>`;
  const secondaryLink = social
    ? `<a class="button button-ghost" href="${escapeHtml(social)}" target="_blank" rel="noopener">View social profile</a>`
    : `<a class="button button-ghost" href="#services">Explore services</a>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="${primary}">
  <title>${title}</title>
  <meta name="description" content="${escapeHtml(description.slice(0, 160))}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${escapeHtml(description.slice(0, 160))}">
  <style>
    :root {
      --ink: #172033;
      --muted: #667085;
      --paper: #fbfaf7;
      --surface: #ffffff;
      --line: #e8e6e0;
      --primary: ${primary};
      --accent: ${accent};
      --soft: color-mix(in srgb, var(--primary) 8%, white);
      --radius: 22px;
      --shadow: 0 24px 70px rgba(23, 32, 51, .12);
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      color: var(--ink);
      background: var(--paper);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.6;
    }
    a { color: inherit; }
    button, a { -webkit-tap-highlight-color: transparent; }
    :focus-visible { outline: 3px solid color-mix(in srgb, var(--primary) 45%, white); outline-offset: 3px; }
    .skip-link { position: fixed; left: 16px; top: -80px; z-index: 100; padding: 12px 16px; background: var(--ink); color: white; border-radius: 10px; }
    .skip-link:focus { top: 16px; }
    .container { width: min(1160px, calc(100% - 40px)); margin: 0 auto; }
    .header { position: sticky; top: 0; z-index: 20; border-bottom: 1px solid rgba(232,230,224,.8); background: rgba(251,250,247,.9); backdrop-filter: blur(16px); }
    .nav { min-height: 76px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
    .brand { font-size: 1.05rem; font-weight: 800; text-decoration: none; letter-spacing: -.03em; }
    .nav-links { display: flex; align-items: center; gap: 24px; font-size: .92rem; }
    .nav-links a { text-decoration: none; color: var(--muted); }
    .nav-links a:hover { color: var(--ink); }
    .nav-cta { padding: 11px 17px; border-radius: 999px; background: var(--ink); color: white !important; font-weight: 700; }
    .hero { padding: clamp(72px, 10vw, 136px) 0 72px; overflow: hidden; }
    .hero-grid { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(320px, .92fr); gap: clamp(40px, 7vw, 96px); align-items: center; }
    .eyebrow { margin: 0 0 18px; color: var(--primary); font-size: .78rem; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
    h1, h2, h3 { margin: 0; line-height: 1.08; letter-spacing: -.045em; }
    h1 { max-width: 760px; font-family: Georgia, "Times New Roman", serif; font-size: clamp(3rem, 7vw, 6.3rem); font-weight: 500; }
    h2 { font-family: Georgia, "Times New Roman", serif; font-size: clamp(2.25rem, 4.5vw, 4rem); font-weight: 500; }
    h3 { font-size: 1.15rem; letter-spacing: -.025em; }
    .hero-copy { max-width: 640px; margin: 24px 0 0; color: var(--muted); font-size: clamp(1.03rem, 2vw, 1.2rem); }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
    .button { min-height: 50px; display: inline-flex; align-items: center; justify-content: center; padding: 0 22px; border: 1px solid transparent; border-radius: 999px; font-weight: 800; text-decoration: none; transition: transform .2s ease, background .2s ease; }
    .button:hover { transform: translateY(-2px); }
    .button-primary { background: var(--primary); color: white; box-shadow: 0 14px 30px color-mix(in srgb, var(--primary) 24%, transparent); }
    .button-ghost { border-color: var(--line); background: var(--surface); color: var(--ink); }
    .hero-art { position: relative; min-height: 510px; border-radius: 34px; background: linear-gradient(145deg, var(--primary), color-mix(in srgb, var(--primary) 44%, var(--accent))); box-shadow: var(--shadow); overflow: hidden; }
    .hero-art::before { content: ""; position: absolute; width: 340px; height: 340px; right: -100px; top: -80px; border: 1px solid rgba(255,255,255,.38); border-radius: 50%; box-shadow: 0 0 0 50px rgba(255,255,255,.08), 0 0 0 100px rgba(255,255,255,.06); }
    .art-card { position: absolute; left: 8%; right: 8%; bottom: 8%; padding: 28px; border: 1px solid rgba(255,255,255,.32); border-radius: 22px; background: rgba(255,255,255,.9); backdrop-filter: blur(18px); }
    .art-label { color: var(--primary); font-size: .75rem; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; }
    .art-card strong { display: block; margin-top: 8px; font-family: Georgia, serif; font-size: clamp(1.75rem, 4vw, 3rem); line-height: 1.1; font-weight: 500; }
    .art-card p { margin: 14px 0 0; color: var(--muted); }
    .trust { padding: 0 0 56px; }
    .trust-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
    .trust-item { padding: 24px; }
    .trust-item + .trust-item { border-left: 1px solid var(--line); }
    .trust-item span { display: block; color: var(--muted); font-size: .82rem; }
    .trust-item strong { display: block; margin-top: 4px; font-size: 1rem; }
    section { scroll-margin-top: 96px; }
    .section { padding: clamp(76px, 10vw, 124px) 0; }
    .section-muted { background: var(--soft); }
    .section-head { display: grid; grid-template-columns: minmax(0, .8fr) minmax(280px, .45fr); gap: 48px; align-items: end; margin-bottom: 48px; }
    .section-head p { margin: 0; color: var(--muted); }
    .service-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
    .service { min-height: 250px; display: flex; flex-direction: column; justify-content: space-between; padding: 28px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
    .service-number { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 50%; background: var(--soft); color: var(--primary); font-size: .82rem; font-weight: 800; }
    .service p { margin: 12px 0 0; color: var(--muted); }
    .about-grid { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); gap: clamp(40px, 8vw, 110px); align-items: start; }
    .about-copy { color: var(--muted); font-size: 1.06rem; }
    .about-copy p { margin: 0 0 20px; }
    .principles { display: grid; gap: 12px; margin-top: 28px; }
    .principle { padding: 18px 20px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); }
    .process { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px; margin-top: 48px; }
    .step { padding-top: 22px; border-top: 2px solid var(--line); }
    .step b { color: var(--primary); font-size: .78rem; letter-spacing: .12em; text-transform: uppercase; }
    .step h3 { margin-top: 13px; }
    .step p { margin: 12px 0 0; color: var(--muted); }
    .faq { display: grid; grid-template-columns: minmax(0, .55fr) minmax(0, 1fr); gap: 64px; }
    details { padding: 22px 0; border-bottom: 1px solid var(--line); }
    summary { cursor: pointer; font-weight: 800; }
    details p { margin: 12px 0 0; color: var(--muted); }
    .contact-panel { padding: clamp(34px, 6vw, 72px); border-radius: 30px; background: var(--ink); color: white; }
    .contact-panel p { max-width: 620px; color: rgba(255,255,255,.68); }
    .contact-panel .button-primary { background: white; color: var(--ink); box-shadow: none; }
    .contact-panel .button-ghost { border-color: rgba(255,255,255,.24); background: transparent; color: white; }
    footer { padding: 36px 0; color: var(--muted); font-size: .9rem; }
    .footer-row { display: flex; justify-content: space-between; gap: 24px; }
    .footer-links { display: flex; flex-wrap: wrap; gap: 18px; }
    .footer-links a { text-decoration: none; }
    @media (max-width: 900px) {
      .hero-grid, .section-head, .about-grid, .faq { grid-template-columns: 1fr; }
      .hero-art { min-height: 390px; }
      .service-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .section-head { gap: 18px; }
    }
    @media (max-width: 680px) {
      .container { width: min(100% - 28px, 1160px); }
      .nav-links a:not(.nav-cta) { display: none; }
      .hero { padding-top: 58px; }
      .hero-art { min-height: 330px; }
      .trust-grid, .service-list, .process { grid-template-columns: 1fr; }
      .trust-item + .trust-item { border-left: 0; border-top: 1px solid var(--line); }
      .footer-row { flex-direction: column; }
      .actions .button { width: 100%; }
    }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
      *, *::before, *::after { transition-duration: .01ms !important; }
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="header">
    <nav class="container nav" aria-label="Primary navigation">
      <a class="brand" href="#top">${businessName}</a>
      <div class="nav-links">
        <a href="#services">Services</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
        <a class="nav-cta" href="#contact">Get in touch</a>
      </div>
    </nav>
  </header>
  <main id="main">
    <section class="hero" id="top">
      <div class="container hero-grid">
        <div>
          <p class="eyebrow">${category}${location ? ` · ${location}` : ""}</p>
          <h1>Clear service. Thoughtful details. A better way to connect.</h1>
          <p class="hero-copy">${businessName} helps customers find the right ${category} support with a focused, personal experience${locationPhrase}.</p>
          <div class="actions">${contactLink}${secondaryLink}</div>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="art-card">
            <span class="art-label">Designed around your next step</span>
            <strong>${escapeHtml(services[0])}</strong>
            <p>Explore the offer, ask a question, or connect directly with ${businessName}.</p>
          </div>
        </div>
      </div>
    </section>
    <div class="container trust" aria-label="Business details">
      <div class="trust-grid">
        <div class="trust-item"><span>Business</span><strong>${businessName}</strong></div>
        <div class="trust-item"><span>Category</span><strong>${category}</strong></div>
        <div class="trust-item"><span>Location</span><strong>${location || "Contact for service area"}</strong></div>
      </div>
    </div>
    <section class="section section-muted" id="services">
      <div class="container">
        <div class="section-head">
          <div><p class="eyebrow">Services</p><h2>Support built around what customers need.</h2></div>
          <p>A clear view of the available services makes it easier to choose the right next step and start a useful conversation.</p>
        </div>
        <div class="service-list">
          ${services
            .map(
              (service, index) => `<article class="service">
            <span class="service-number">${String(index + 1).padStart(2, "0")}</span>
            <div><h3>${escapeHtml(service)}</h3><p>Ask about scope, availability, and the best option for your specific needs.</p></div>
          </article>`,
            )
            .join("")}
        </div>
      </div>
    </section>
    <section class="section" id="about">
      <div class="container about-grid">
        <div><p class="eyebrow">About ${businessName}</p><h2>A direct, human way to get started.</h2></div>
        <div class="about-copy">
          <p>${businessName} provides ${category}${locationPhrase}. This concept site is structured to make the offer easier to understand and the contact path easier to use on any device.</p>
          <div class="principles">
            <div class="principle"><strong>Clear options</strong><br>Services are organized around customer intent.</div>
            <div class="principle"><strong>Direct contact</strong><br>Visitors can move from interest to conversation without friction.</div>
            <div class="principle"><strong>Mobile ready</strong><br>Important details and actions stay readable on smaller screens.</div>
          </div>
        </div>
      </div>
    </section>
    <section class="section section-muted">
      <div class="container">
        <p class="eyebrow">How it works</p>
        <h2>Three simple steps from question to next move.</h2>
        <div class="process">
          <article class="step"><b>Step 01</b><h3>Share what you need</h3><p>Call, email, or message with a short description of what you are looking for.</p></article>
          <article class="step"><b>Step 02</b><h3>Confirm the details</h3><p>Discuss scope, availability, and any information needed before moving forward.</p></article>
          <article class="step"><b>Step 03</b><h3>Choose the next step</h3><p>Receive a clear recommendation or arrangement based on the conversation.</p></article>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container faq">
        <div><p class="eyebrow">Common questions</p><h2>Useful details before you reach out.</h2></div>
        <div>
          <details open><summary>How do I get started?</summary><p>Use the contact options below and share the service or product you are interested in.</p></details>
          <details><summary>Can I ask about availability first?</summary><p>Yes. Contact ${businessName} directly to confirm availability and the most suitable next step.</p></details>
          <details><summary>Where is the business located?</summary><p>${location ? `${businessName} is listed in ${location}.` : "Contact the business directly to confirm its location or service area."}</p></details>
        </div>
      </div>
    </section>
    <section class="section" id="contact">
      <div class="container">
        <div class="contact-panel">
          <p class="eyebrow">Contact</p>
          <h2>Start with a simple conversation.</h2>
          <p>Tell ${businessName} what you need and confirm the right service, availability, and next step.</p>
          <div class="actions">
            ${contactLink}
            ${email ? `<a class="button button-ghost" href="mailto:${email}">Email ${email}</a>` : ""}
            ${website ? `<a class="button button-ghost" href="${escapeHtml(website)}" target="_blank" rel="noopener">Existing website</a>` : ""}
          </div>
        </div>
      </div>
    </section>
  </main>
  <footer>
    <div class="container footer-row">
      <span>© ${new Date().getFullYear()} ${businessName}. Website concept for review.</span>
      <div class="footer-links">
        ${phone ? `<a href="tel:${phoneHref}">${phone}</a>` : ""}
        ${email ? `<a href="mailto:${email}">${email}</a>` : ""}
        ${social ? `<a href="${escapeHtml(social)}" target="_blank" rel="noopener">Social profile</a>` : ""}
      </div>
    </div>
  </footer>
</body>
</html>`;
}

function toneLead(tone: MessageTone) {
  const leads: Record<MessageTone, string> = {
    Friendly: "I came across your business and liked how clearly your work comes through.",
    Direct: "I reviewed the online information available for your business and saw a clear website opportunity.",
    Premium: "Your business has the ingredients for a much stronger premium online presentation.",
    "Soft sell": "I wanted to share a small idea that may be useful for your online presence.",
    Confident: "I can see a strong opportunity to make your online presentation clearer and more conversion-focused.",
    "Local business friendly": "I enjoy seeing local businesses present their work well, and yours caught my attention.",
  };
  return leads[tone];
}

function observation(info: BusinessInfo) {
  if (info.painPoints) return info.painPoints;
  if (!info.websiteUrl) {
    return "From the information I had, I could not find a clear website link where customers can quickly review the offer and contact you.";
  }
  return "I noticed an opportunity to make the mobile service journey and main contact action more immediate.";
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
    whatsapp: `Hi ${name}, ${intro}\n\n${specificObservation}\n\nI created a private, custom website concept to show how the business could look with clearer services, stronger mobile presentation, and an easier contact path.\n\n${link}\n\n${price}\n\nWould you be open to taking a quick look and telling me what you think?\n\n${sender}\n${company}`,
    emailSubject: `Private website concept for ${name}`,
    email: `Hi ${name},\n\n${intro}\n\n${specificObservation}\n\nI prepared a private website concept for your business. It is designed to make the offer easier to understand, improve the mobile experience, and give prospective customers a clearer next step.\n\n${link}\n\n${price}\n\nIf the direction feels useful, I would be happy to walk you through what is included and tailor it to your real content.\n\nRegards,\n${sender}\n${company}\n${settings.mailingAddress ? `${settings.mailingAddress}\n` : ""}\nIf you would prefer not to receive another message from me, just let me know.`,
    dm: `Hi ${name}. ${specificObservation} I made a private website concept to show a clearer, more polished direction for the business. ${info.demoUrl ? `Preview: ${info.demoUrl}` : "I can send the preview link once it is live."} ${price} Open to a quick look? - ${sender}, ${company}`,
    followUp: `Hi ${name}, just following up on the private website concept I prepared. ${info.demoUrl ? `Here is the preview again: ${info.demoUrl}` : "I can send the live preview whenever convenient."} No pressure at all; I would value your honest feedback.`,
    finalFollowUp: `Hi ${name}, one last note from me about the website concept. ${info.demoUrl ? `The preview is here if you would still like to see it: ${info.demoUrl}` : "I am happy to share the preview if it becomes useful."} I will close the loop after this, but you are welcome to reach out anytime. - ${sender}, ${company}`,
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
