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

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_FALLBACK_MODELS=gemini-3.1-flash-lite,gemini-3.1-flash-lite-preview,gemini-flash-lite-latest,gemini-2.5-flash
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_TOKEN=
GITHUB_OWNER=
GITHUB_REPO_PREFIX=niche-demo
VERCEL_TOKEN=
VERCEL_TEAM_ID=
```

`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, and `GEMINI_API_KEY` are server-only. Never expose them through `NEXT_PUBLIC_*`.
`VERCEL_TOKEN` is required for one-click demo deployment. `GITHUB_TOKEN` and `GITHUB_OWNER` are optional for deployment, but when present the generated `index.html` is also archived to a GitHub repository.

## AI Extraction

Screenshot and pasted-info extraction use the server-side AI route in `app/api/business-intelligence/route.ts`. Set `GEMINI_API_KEY` or `OPENAI_API_KEY` locally and in Vercel before production use. Gemini is preferred when both are present. `GEMINI_FALLBACK_MODELS` lets the server try alternate Gemini models when the primary model is rate-limited or temporarily overloaded.

Generated concept sites:

- are complete standalone `index.html` files;
- use embedded CSS and no build step;
- include responsive layouts and accessible focus states;
- default to `noindex, nofollow`;
- omit canonical and production URL metadata until a real domain is known;
- avoid fabricated reviews, awards, metrics, urgency, and guarantees;
- label the footer as a website concept for review.

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
- `/templates` reusable templates
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
