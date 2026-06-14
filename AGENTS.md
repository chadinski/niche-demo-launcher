# Niche Demo Launcher — Project Instructions

This is a private internal app for Niche Technologies.

Core workflow:
Paste business info → parse details → generate premium website demo → generate outreach message → paste demo link → open WhatsApp/email/copy message → track prospect.

Tech stack:

* Next.js App Router
* TypeScript
* Tailwind CSS
* Supabase
* Vercel

Primary goal:
This app helps create high-end website demos quickly for outreach. The generated websites should look custom, premium, polished, professional, and valuable enough to help sell website packages.

## Critical workflow rules

* `/create` is the most important page.
* Prioritize the fastest path from pasted business info to generated website and outreach message.
* Do not overcomplicate the app.
* Do not add bulk automation unless explicitly requested.
* Preserve manual approval before any outreach action.
* Keep the app optimized for one-person agency speed.

## Low-credit / surgical mode rules

For every future change:

* Do not rebuild the whole app.
* Do not refactor unrelated files.
* Do not redesign unrelated screens.
* Do not install new packages unless absolutely required.
* Inspect only the files needed for the task.
* Make the smallest clean change that solves the request.
* Preserve existing architecture, naming, and UI style.
* Keep TypeScript clean.
* Keep mobile responsiveness intact.
* Run only the most relevant checks.

Before editing:

1. Identify the likely files involved.
2. Explain the smallest change needed.
3. Edit only those files.

After editing:

1. List files changed.
2. Explain what changed.
3. List checks run.
4. Mention any risks or next steps.

## Generated website quality standard

The Johnsons Premium Finish website is the benchmark for overall quality, polish, structure, responsiveness, and attention to detail — not for color palette, branding, or theme.

Use this file as the quality and layout reference when available:

`templates/luxury-editorial-reference.html`

For every generated website:

* Match the visual style, color palette, branding, mood, and theme shown in the provided screenshots, reference images, business niche, or user description.
* Do not force the Johnsons black, gold, champagne, bronze, or luxury color scheme onto every website.
* Adapt typography, colors, imagery, spacing, and visual identity to suit the specific business and references provided.
* Preserve the same level of premium design quality, polish, completeness, and professionalism as the Johnsons site.
* Create websites that feel custom-designed for that business rather than reused from a single template.

## Quality expectations for generated websites

Generated websites should include, when appropriate:

* SEO metadata
* Open Graph metadata
* Twitter card metadata
* Schema.org JSON-LD
* fixed or polished navigation
* strong hero section
* clear value proposition
* high-quality niche-relevant imagery
* service or product cards
* credibility/trust section
* about or experience section
* transformation/storytelling section
* gallery or visual showcase section
* process or booking section
* social/contact section
* FAQ section
* strong final CTA
* polished footer
* mobile responsive layout
* subtle animations and transitions
* refined hover effects
* excellent spacing and typography

## Screenshot/reference behavior

When screenshots or visual references are provided:

* Treat them as the primary source of truth for colors, styling, layout direction, and overall aesthetic.
* Match the design language as closely as practical.
* Use the Johnsons reference only as a benchmark for quality, execution, and completeness.

## Generated website restrictions

Do not generate basic landing pages.
Do not generate cheap-looking generic templates.
Do not use irrelevant images.
Do not invent fake reviews.
Do not invent fake awards.
Do not invent fake prices.
Do not invent fake guarantees.
Do not invent fake certifications.
Do not imply claims that were not provided.

If information is missing, phrase it carefully using wording like:

* “Ask about current options”
* “Confirm availability directly”
* “Add booking link when ready”
* “Representative imagery for this website concept”
* “Replace with verified business photography when available”

## Generated website output rules

When generating an `index.html` website:

* Create a complete single-file legacy `index.html`.
* Include HTML, CSS, and JavaScript in the same file.
* No external build process should be required.
* The file must be ready to deploy.
* The file must be responsive.
* The file must include contact links when contact details are available.
* The file must include social links when provided.
* The file must include a clear CTA.
* The file must feel customized to the business.
* The footer should make clear when the website is a concept/demo for review.

## Outreach message rules

Generated outreach messages should:

* mention the business by name
* mention the custom demo link when available
* explain the value clearly
* include the price/package if provided
* be short enough for WhatsApp
* sound confident but not pushy
* avoid fake urgency
* avoid spammy language
* include opt-out wording for cold email when appropriate

## App behavior priorities

The app should make it easy to:

* paste messy business info
* import a screenshot or business image
* extract useful business details
* generate a premium website
* copy/download the generated `index.html`
* paste the Vercel demo link
* generate WhatsApp/email/DM messages
* open WhatsApp with a prefilled message
* create an email draft
* copy messages
* mark outreach status
* track replies and follow-ups

## Future integrations

Do not build these unless explicitly requested:

* automatic GitHub push
* automatic Vercel deployment
* automatic email sending
* bulk lead scraping
* bulk messaging
* payment processing
* complex CRM automation

Build the core workflow first. Keep it sharp, fast, premium, and practical.
