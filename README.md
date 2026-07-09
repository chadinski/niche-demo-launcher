# Seraphim

Private internal command center for Niche Technologies. Paste business information, generate a premium single-file website, deploy the demo, prepare personalized outreach, and track the real prospect.

## Core Workflow

1. Paste messy business information into **Create Site**.
   You can also import a business screenshot or photo. OpenAI vision analyzes the image, extracts the business facts, classifies the industry, and populates the profile.
2. Optionally use **Lead Finder** to search Firecrawl for niche/location lead candidates, qualify them, and save selected businesses as prospects.
3. Parse and review the extracted facts.
4. Generate a private `noindex` single-file `index.html`.
5. Generate WhatsApp, email, DM, and follow-up messages.
6. Deploy the demo to Vercel or paste an existing live URL.
7. Copy a message or open a WhatsApp/email draft.
8. Manually approve sending and update the prospect status.

The app does not bulk-send or automatically submit outreach.

Screenshot extraction requires `GEMINI_API_KEY` or `OPENAI_API_KEY`. Images are sent to the server-side `/api/business-intelligence` route, then to the configured AI provider for structured business intelligence. Gemini is used first when configured. The app does not run local screenshot OCR.

Website generation is handled only by Seraphim Generator in `app/api/generate-website/route.ts`. Seraphim Generator builds from verified facts, an industry-specific visual thesis, a conversion brief, and QA rules. It does not use template packs, preset website generators, fixed blueprint layouts, or meta-keyword-era SEO. `FIRECRAWL_API_KEY` can optionally provide abstract inspiration and photo-direction cues, but it must not become a template source. Firecrawl is also used by **Lead Finder** for live niche/location prospect discovery and qualification.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Supabase Auth and Postgres
- Vercel-ready

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

When Supabase variables are blank, the app runs in local mode using browser storage. It does not preload fake prospects or fake revenue.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Create the private internal user in Supabase Auth.
4. Optionally run `supabase/seed.sql` after the user exists.
5. Add the project URL and anon key to `.env.local`.
6. Add the same variables to Vercel production.

All tables use Row Level Security and scope reads/writes to `auth.uid()`.

### Google Sign-In

The login screen supports Supabase Google OAuth. To enable Gmail/Google sign-in:

1. In Google Cloud, create an OAuth Client ID for a web application.
2. Add your app origins, such as `http://localhost:3000` and your Vercel production URL, under **Authorized JavaScript origins**.
3. Add the Supabase Google callback URL from **Supabase Dashboard > Authentication > Sign In / Providers > Google** under **Authorized redirect URIs**.
4. In Supabase, enable the Google provider and paste the Google client ID and client secret.
5. In Supabase **Authentication > URL Configuration**, allow the app callback URLs, such as `http://localhost:3000/auth/callback` and `https://your-production-domain.com/auth/callback`.

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
FIRECRAWL_API_KEY=

# Public default design tokens
NEXT_PUBLIC_DEFAULT_PRIMARY_COLOR=#2B5E8C
NEXT_PUBLIC_DEFAULT_SECONDARY_COLOR=#F4A261

# Stage-based model routing
EXTRACTION_MODEL=gemini-2.5-flash-lite
CREATIVE_MODEL=gemini-2.5-pro
DESIGN_SYSTEM_MODEL=gemini-2.5-pro
PLANNER_MODEL=gemini-2.5-pro
PAGE_CONTRACT_MODEL=gemini-2.5-pro
SECTION_MODEL=gemini-2.5-pro
QA_MODEL=gemini-2.5-flash
VISUAL_QA_MODEL=gemini-2.5-flash
INSPIRATION_MODEL=gemini-2.5-flash
VISION_MODEL=gemini-2.5-flash
FALLBACK_MODEL=gemini-2.5-flash-lite
OPENAI_MODEL=
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_FALLBACK_MODELS=gemini-3.1-flash-lite,gemini-3.1-flash-lite-preview,gemini-flash-lite-latest,gemini-2.5-flash
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_TOKEN=
GITHUB_OWNER=
GITHUB_REPO_PREFIX=niche-demo
VERCEL_TOKEN=
VERCEL_TEAM_ID=
```

`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, and `FIRECRAWL_API_KEY` are server-only. Never expose them through `NEXT_PUBLIC_*`.
`FIRECRAWL_API_KEY` is optional. Add it when you want generated websites to research premium landing-page references and stronger niche-matched photo direction before HTML generation, and when you want `/leads` to search live business results for prospect discovery.
`NEXT_PUBLIC_DEFAULT_PRIMARY_COLOR` and `NEXT_PUBLIC_DEFAULT_SECONDARY_COLOR` set the default public design-token palette used by `lib/design/tokens.ts`.
`VERCEL_TOKEN` is required for one-click demo deployment. `GITHUB_TOKEN` and `GITHUB_OWNER` are optional for deployment, but when present the generated `index.html` is also archived to a GitHub repository.

## AI Model Routing

Screenshot and pasted-info extraction use the server-side AI route in `app/api/business-intelligence/route.ts`. Website HTML generation uses only the Seraphim Generator route in `app/api/generate-website/route.ts`. Set `GEMINI_API_KEY` or `OPENAI_API_KEY` locally and in Vercel before production use. Add `FIRECRAWL_API_KEY` when you want abstract inspiration, stronger niche-matched photo direction, and Firecrawl-powered lead discovery in `/leads`.

## Firecrawl Lead Finder

The `/leads` page implements Phase 1 of Firecrawl lead generation. Enter a niche, choose a country/region, and Seraphim calls `app/api/leads/search/route.ts`, which uses `lib/leads/firecrawl-lead-search.ts` to query Firecrawl web search. Results are normalized into typed lead candidates, scored for website opportunity, contact availability, social-first presence, local intent, and commercial niche fit, then displayed for manual review.

Lead Finder supports region targeting through `lib/leads/regions.ts`. The first supported markets are the United States with all 50 states, Jamaica with parish targeting, and Trinidad and Tobago with major regional corporations/boroughs. The selected country, region, and optional city/area are composed into the Firecrawl search location while preserving the older freeform `location` API field for backward compatibility.

Lead Finder also includes a ranked industry targeting layer in `lib/leads/industry-targets.ts`. It prioritizes the industries most likely to lose calls, bookings, trust, inquiries, or sales from a weak or missing website: funeral and memorial businesses, tourism and hospitality, contractors and home services, clinics and med spas, restaurants and caterers, auto services, real estate, events, beauty and wellness, education, professional services, security systems, printing/signage, nonprofits, and visual retail. Each target defines why it is worth targeting, common digital weaknesses, best website offer, outreach hook, search terms, qualification signals, and avoid signals.

The selected target industry now influences Firecrawl queries, candidate scoring, visible strategy guidance, and saved prospect notes. This keeps lead generation focused on niches where a premium demo website has a clear before-and-after sales story.

Saving a candidate creates a normal Seraphim prospect with status `profile_extracted`. It does not generate a demo, deploy a site, send outreach, submit forms, or contact anyone automatically. Each saved lead includes the source URL, source summary, score reasons, warnings, and a reminder to verify facts before generation or outreach.

Model names are centralized in `lib/ai/modelConfig.ts` and routed through `lib/ai/modelRouter.ts`. `CREATIVE_MODEL`, `DESIGN_SYSTEM_MODEL`, `PLANNER_MODEL`, `PAGE_CONTRACT_MODEL`, and `SECTION_MODEL` default to `gemini-2.5-pro`; `QA_MODEL`, `VISUAL_QA_MODEL`, and `INSPIRATION_MODEL` default to `gemini-2.5-flash`. Reserve `VISION_MODEL` for screenshot/image analysis, and set `SECTION_MODEL` to the strongest writing/design model you want producing complete website HTML. `FALLBACK_MODEL` and `GEMINI_FALLBACK_MODELS` keep generation resilient when the primary model is unavailable. The router retries failed model calls twice with exponential backoff and temporarily opens a 60-second circuit after repeated route failures.

## Generation UI Migration Notes

The `/create` workflow now streams website generation when the browser requests `text/event-stream`. The server emits creative-contract, design-system, plan, page-contract, section, QA, and complete events so the preview can fill in section by section; JSON responses remain supported for older callers and prospect-detail fallbacks.

Website generation now runs through a Creative Contract pipeline before HTML generation: business data -> Creative Contract -> Design System Contract -> Website Plan -> Page Contract -> section HTML -> standalone assembly -> Visual QA -> targeted section revision. This keeps the output AI-generated and business-specific without adding static template libraries, while making every section obey a shared visual grammar and embedded CSS system.

The taste layer now builds a visual identity profile before the Creative Contract. It preserves screenshot/logo/material signals such as extracted colors, logo mood, image energy, typography feel, brand temperature, and niche cues; reconciles the selected archetype against the extracted industry and conversion action; and surfaces warnings when a page risks generic corporate defaults. QA now treats “technically complete but boring” as a failure mode, so technically valid pages can be capped until they show brand specificity, emotional fit, niche-appropriate visual language, and palette/logo alignment.

Seraphim also includes a Premium Visual Motif Library in `lib/generation/visual-motifs.ts`. This is a primitive library, not a template system. It recommends reusable visual vocabulary such as SVG dividers, texture overlays, verified fact badges, section frames, icon treatments, CTA bands, image masks, proof strips, and service rails based on the visual identity profile and archetype. The Creative Contract, Design System Contract, Page Contract, section prompts, Visual QA, and app quality audit all receive the motif recommendation so generated demos can become more visually distinctive while preserving verified facts and standalone embedded CSS reliability.

Industry-specific asset packs live in `lib/generation/industry-asset-packs.ts`. These packs add deeper art direction for food, automotive, pet care, home services, beauty, wellness, retail, travel, fitness, real estate, education, SaaS/tech, professional services, creative agencies, nonprofits, and local fallback businesses. Each pack defines a visual thesis, texture system, motif system, frame language, icon direction, image direction, section applications, CSS primitive names, copy tone, avoid rules, and factual-safety rules. The generator uses these packs as design vocabulary, not fixed templates.

Texture and background tokens live in `lib/generation/texture-background-tokens.ts`. They provide CSS-only atmosphere such as subtle paper grain, fine noise overlays, radial light maps, warm local-business surfaces, dark premium automotive surfaces, blueprint grids, soft pet backgrounds, beauty pearl gradients, wellness contours, retail fabric textures, travel map washes, tech node grids, and professional document washes. These tokens help pages feel richer when verified photography is limited, without relying on external texture assets or fake proof imagery.

Photo direction lives in `lib/generation/photo-direction.ts`. It is not a random stock-image system. It tells Seraphim when to use the uploaded screenshot/source image, when representative remote imagery is acceptable, when CSS/SVG art is safer, how to label replaceable visuals honestly, and how to write alt text without inventing proof. Visual QA rejects broken images, local paths, missing alt text, unsafe stock imagery, and unlabeled representative visuals.

Component primitives live in `lib/generation/component-primitives.ts`. They provide premium Lego pieces such as editorial/cinematic/montage hero compositions, customer-intent service cards, detailed service rails, numbered process timelines, split checklists, FAQ blocks, contact strips, and gallery frames. These are composable primitives, not templates; the AI assembles them differently based on the Creative Contract, business facts, and industry asset pack.

Design controls are available above the Generate buttons. Primary/secondary colors, heading/body fonts, and mood are saved in localStorage and sent as `visualPreferences` to the generator. Generated output includes those values as CSS custom properties, and saved prospects keep the preferences for future premium regeneration. The preview also supports **Regenerate All** and per-section **Regenerate** actions.

Business type archetypes are now available in `/create` as an optional **Business Type** selector. The selector applies industry-matched design tokens, preferred section rhythm, tone guidance, and QA checks from `lib/archetypes/index.ts`; if no archetype is selected, the generation API auto-detects one from the supplied business category/services and falls back to Friendly Local. Existing JSON and streaming API consumers remain backward-compatible because `archetypeId` is optional.

## Generation Isolation

Every create-workspace run has a fresh `generationId`. The client sends that ID to the extraction API, aborts old requests when starting over, clears generation-only storage, and ignores late responses from old IDs. The visible **New Generation** and **Clear Current Data** controls reset screenshot, extracted facts, generated HTML, preview state, messages, section outputs, QA state, errors, and placeholders without clearing auth or prospect records.

Generated concept sites:

- are complete standalone `index.html` files;
- use embedded CSS and no build step;
- include responsive layouts and accessible focus states;
- default to `noindex, nofollow`;
- omit canonical and production URL metadata until a real domain is known;
- avoid fabricated reviews, ratings, badges, awards, metrics, urgency, prices, certifications, and guarantees;
- do not include meta keywords, fake-proof surfaces, generic template-pack language, or prominent "Private Concept" seals;
- may use restrained footer wording that identifies the page as a website demo concept when appropriate.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

Key UI paths:

- `/` dashboard
- `/leads` Firecrawl lead finder
- `/create` generation workspace
- `/prospects` CRM list
- `/prospects/[id]` prospect detail
- `/settings` deployment and workspace configuration
- `/settings` app defaults and integrations
- `/login` Supabase sign-in

## Vercel Deployment

1. Import the `niche-demo-launcher` folder as a Vercel project.
2. Add the app environment variables.
3. Set the framework preset to Next.js.
4. Deploy.

## Demo Deployment Conveyor

For one-click deployment of each generated demo:

1. Create a Vercel API token in the Vercel account settings.
2. Add it as `VERCEL_TOKEN` in Vercel project environment variables.
3. Optionally add `VERCEL_TEAM_ID` when deploying under a team scope.
4. Optionally add `GITHUB_TOKEN`, `GITHUB_OWNER`, and `GITHUB_REPO_PREFIX` to archive each generated `index.html` to GitHub.
5. Redeploy this app after changing environment variables.

After that, the **Deploy Website** button on `/create` and `/prospects/[id]` sends the generated HTML to Vercel, saves the live URL, and archives to GitHub when GitHub credentials are configured. Manual copy/download remains available as a fallback.
