# Launch verification — 2026-07-13

This record captures the final local and production checks performed after correcting the Vercel runtime settings. It contains no credentials or user data.

## Automated checks

- `npm run ci` passed: lint, strict typecheck, 23 Vitest tests, and the production build.
- The build produced the expected public, protected, API, health, and worker routes with no compilation errors.

## Production runtime settings

- Corrected Vercel Production `NEXT_PUBLIC_APP_URL` to `https://niche-demo-launcher.vercel.app`.
- Enabled required distributed rate limiting with `DISTRIBUTED_RATE_LIMIT_REQUIRED=1`.
- Kept asynchronous Premium generation disabled with `NEXT_PUBLIC_PREMIUM_GENERATION_ASYNC=0` while the project remains on the Vercel Hobby daily-Cron limit. The durable worker code remains available for a frequent scheduler.
- Confirmed the production environment retains the Supabase, Upstash, provider, and worker-secret configuration required by the app. Secret values were not printed or committed.
- `NEXT_PUBLIC_SUPPORT_EMAIL` remains unset; public support cannot be considered launch-ready until an owned mailbox is configured.
- Supabase Authentication Site URL is set to `https://niche-demo-launcher.vercel.app`.
- Supabase Authentication still shows “Set up SMTP”; the hosted email service is not a substitute for production SMTP verification and must be configured before email confirmation and password recovery can be advertised.

## Live deployment verification

After redeploying with the corrected settings, these checks returned the expected status:

- `/`, `/robots.txt`, `/sitemap.xml`, `/api/health`, `/login`, and `/signup`: HTTP 200.
- `/dashboard` and `/create`: HTTP 307 to authentication, confirming protected-route enforcement.
- `/api/health` returned the safe payload `{"status":"ok","service":"seraphim"}` without exposing secrets.

## Remaining external gates

1. Set and test production SMTP, email verification, password recovery, and email templates.
2. Set provider budgets and alerting for AI, Firecrawl, Vercel, GitHub, and Upstash.
3. Configure the owned support mailbox and confirm the support route in production.
4. Obtain professional legal review and complete company/controller/jurisdiction details.
5. Complete a fresh authenticated signup-to-outreach E2E run with a confirmed inbox.
6. Use a frequent durable scheduler or a plan that supports it before enabling async Premium jobs.
