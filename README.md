# Seraphim

Private internal command center for Niche Technologies. Paste business information, generate a premium single-file website, deploy the demo, prepare personalized outreach, and track the real prospect.

## Core Workflow

1. Paste messy business information into **Create Site**.
   You can also import a business screenshot or photo. OpenAI vision analyzes the image, extracts the business facts, classifies the industry, and populates the profile.
2. Parse and review the extracted facts.
3. Generate a private `noindex` single-file `index.html`.
4. Generate WhatsApp, email, DM, and follow-up messages.
5. Deploy the demo to Vercel or paste an existing live URL.
6. Copy a message or open a WhatsApp/email draft.
7. Manually approve sending and update the prospect status.

The app does not bulk-send or automatically submit outreach.

Screenshot extraction requires `GEMINI_API_KEY` or `OPENAI_API_KEY`. Images are sent to the server-side `/api/business-intelligence` route, then to the configured AI provider for structured business intelligence. Gemini is used first when configured. The app does not run local screenshot OCR.

Website generation is handled only by Seraphim Generator in `app/api/generate-website/route.ts`. Seraphim Generator builds from verified facts, an industry-specific visual thesis, a conversion brief, and QA rules. It does not use template packs, preset website generators, fixed blueprint layouts, or meta-keyword-era SEO. `FIRECRAWL_API_KEY` can optionally provide abstract inspiration and photo-direction cues, but it must not become a template source.

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

# Stage-based model routing
EXTRACTION_MODEL=gemini-2.5-flash-lite
PLANNER_MODEL=gemini-2.5-flash-lite
SECTION_MODEL=gemini-2.5-flash
QA_MODEL=gemini-2.5-flash-lite
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
`FIRECRAWL_API_KEY` is optional. Add it when you want generated websites to research premium landing-page references and stronger niche-matched photo direction before HTML generation.
`VERCEL_TOKEN` is required for one-click demo deployment. `GITHUB_TOKEN` and `GITHUB_OWNER` are optional for deployment, but when present the generated `index.html` is also archived to a GitHub repository.

## AI Model Routing

Screenshot and pasted-info extraction use the server-side AI route in `app/api/business-intelligence/route.ts`. Website HTML generation uses only the Seraphim Generator route in `app/api/generate-website/route.ts`. Set `GEMINI_API_KEY` or `OPENAI_API_KEY` locally and in Vercel before production use. Add `FIRECRAWL_API_KEY` only when you want abstract inspiration and stronger niche-matched photo direction before HTML generation.

Model names are centralized in `lib/ai/modelConfig.ts` and routed through `lib/ai/modelRouter.ts`. Use the cheapest reliable model for extraction/planning/QA, reserve `VISION_MODEL` for screenshot/image analysis, and set `SECTION_MODEL` to the strongest writing/design model you want producing complete website HTML. `FALLBACK_MODEL` and `GEMINI_FALLBACK_MODELS` keep generation resilient when the primary model is unavailable.

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
