# Niche Demo Launcher

Private internal command center for Niche Technologies. Paste business information, generate a premium single-file website concept, prepare personalized outreach, add the deployed demo URL, and track the prospect.

## Core Workflow

1. Paste messy business information into **Create Demo**.
2. Parse and review the extracted facts.
3. Generate a private `noindex` single-file `index.html`.
4. Generate WhatsApp, email, DM, and follow-up messages.
5. Add the live Vercel URL.
6. Copy a message or open a WhatsApp/email draft.
7. Manually approve sending and update the prospect status.

The app does not bulk-send or automatically submit outreach.

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

When Supabase variables are blank, the app runs in local demo mode using browser storage and bundled mock prospects.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Create the private internal user in Supabase Auth.
4. Optionally run `supabase/seed.sql` after the user exists.
5. Add the project URL and anon key to `.env.local`.

All tables use Row Level Security and scope reads/writes to `auth.uid()`.

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` are server-only. Never expose them through `NEXT_PUBLIC_*`.

## AI Generation

The server action placeholders are in `app/actions.ts`:

- `parseBusinessInfo()`
- `generateWebsiteHTML()`
- `generateSalesMessages()`
- `generateFollowUpMessage()`

The current implementation intentionally uses deterministic mock generation, even when an API key exists. Replace the `ai-placeholder` branch with the preferred OpenAI call when the prompt and model are approved. The local generator remains the fallback.

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
2. Add the environment variables.
3. Set the framework preset to Next.js.
4. Deploy.

The Vercel and GitHub buttons in Settings are placeholders for future deployment automation. Today, generated HTML is copied or downloaded for manual deployment.
