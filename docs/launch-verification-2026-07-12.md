# Launch verification — 2026-07-12

This record captures the checks performed against the configured production services. It intentionally does not contain credentials, tokens, or disposable-account email addresses.

## Database and tenant isolation

- Applied `202607110001_public_beta_foundation.sql` and `202607110002_durable_generation_jobs.sql` to the configured Supabase production project.
- Verified the `user_profiles`, `generation_jobs`, `usage_events`, and `plan_limits` tables exist and that protected tables have tenant-aware RLS policies.
- No separate staging Supabase project is configured in this repository, so a distinct staging migration run remains a launch gate.
- Real two-user test: User A created a prospect; User B could not select it and could not insert a generated website referencing User A's prospect. The cross-tenant mutation was rejected by RLS.

## Authenticated workflow

- Confirmed-user browser workflow completed against the local app using the production Supabase project: create prospect → save → generate outreach → inspect message variants → manually mark contacted.
- Signup API returned a new unconfirmed user as expected when email confirmation is enabled.
- Confirmation email was not delivered to the configured test inbox during the verification window. Production SMTP/template/deliverability must be verified before public signup is advertised.

## Production configuration

- Configured Vercel production support email, worker secret, Cron secret, Supabase service-role key, and Upstash Redis integration.
- Enabled `DISTRIBUTED_RATE_LIMIT_REQUIRED=1` and verified the application accepts the Vercel-provided Upstash variable names.
- Automatic Premium worker mode is disabled with `NEXT_PUBLIC_PREMIUM_GENERATION_ASYNC=0` because the current Vercel Hobby plan permits only a daily Cron schedule. The durable worker remains available for a plan or scheduler that can run it frequently.
- Shared-account automated deployment remains disabled by default.

## Live deployment checks

- `https://niche-demo-launcher.vercel.app/` returned HTTP 200.
- `/api/health` returned HTTP 200 with a safe readiness payload.
- `/api/internal/generation-worker` returned HTTP 404 without its worker secret, confirming it is not exposed through the authenticated user surface.
- `npm run ci`: lint passed, typecheck passed, 23 tests passed, and the production build passed.

## Remaining launch gates

1. Create and verify a separate staging Supabase project, then repeat the migration and RLS matrix there.
2. Configure and verify production SMTP, password recovery, and email templates.
3. Set provider budgets/alerts for OpenAI/Gemini, Firecrawl, Vercel, GitHub, and Upstash.
4. Obtain licensed-counsel review of the draft legal copy and fill in controller/company/jurisdiction details.
5. Either upgrade to a plan with frequent Cron or connect a durable external scheduler before enabling async Premium jobs.
