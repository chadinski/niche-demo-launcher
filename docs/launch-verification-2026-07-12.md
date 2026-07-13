# Launch verification — 2026-07-12

This record captures the checks performed against the configured production services. It intentionally does not contain credentials, tokens, or disposable-account email addresses.

## Database and tenant isolation

- Applied `202607110001_public_beta_foundation.sql` and `202607110002_durable_generation_jobs.sql` to the configured Supabase production project.
- Verified the `user_profiles`, `generation_jobs`, `usage_events`, and `plan_limits` tables exist and that protected tables have tenant-aware RLS policies.
- Production verification was performed separately from the dedicated staging verification recorded below.
- Real two-user test: User A created a prospect; User B could not select it and could not insert a generated website referencing User A's prospect. The cross-tenant mutation was rejected by RLS.

## Staging verification — 2026-07-13

- Created the dedicated Supabase staging project `niche-demo-launcher-staging` (`ccrlfsrsvipecpjkaici`) in East US.
- Applied the base schema followed by `202607110001_public_beta_foundation.sql` and `202607110002_durable_generation_jobs.sql`.
- Confirmed the staged tables and helper functions exist with a read-only object check.
- Ran `npm run test:staging:rls` with two disposable confirmed users. User B could not read User A's prospect and could not insert a generated website referencing User A's prospect; both checks passed and the blocked mutation was rejected by RLS.
- Disposable staging users and their prospect data were deleted by the verifier. Credentials remain only in the ignored local `.env.staging.local` file.

## Authenticated workflow

- Confirmed-user browser workflow completed against the local app using the production Supabase project: create prospect → save → generate outreach → inspect message variants → manually mark contacted.
- Signup API returned a new unconfirmed user as expected when email confirmation is enabled.
- Confirmation email was not delivered to the configured test inbox during the verification window. Production SMTP/template/deliverability must be verified before public signup is advertised.

## Production configuration

- Configured the Vercel production worker secret, Cron secret, Supabase service-role key, and Upstash Redis integration. `NEXT_PUBLIC_SUPPORT_EMAIL` is still blank and must be set to the owned support mailbox before public signup is advertised.
- Enabled `DISTRIBUTED_RATE_LIMIT_REQUIRED=1` and verified the application accepts the Vercel-provided Upstash variable names.
- Automatic Premium worker mode is disabled with `NEXT_PUBLIC_PREMIUM_GENERATION_ASYNC=0` because the current Vercel Hobby plan permits only a daily Cron schedule. The durable worker remains available for a plan or scheduler that can run it frequently.
- Shared-account automated deployment remains disabled by default.

## Live deployment checks

- `https://niche-demo-launcher.vercel.app/` returned HTTP 200.
- `/api/health` returned HTTP 200 with a safe readiness payload.
- `/api/internal/generation-worker` returned HTTP 404 without its worker secret, confirming it is not exposed through the authenticated user surface.
- `npm run ci`: lint passed, typecheck passed, 23 tests passed, and the production build passed.

## Remaining launch gates

1. Configure and verify production SMTP, password recovery, and email templates.
2. Set provider budgets/alerts for OpenAI/Gemini, Firecrawl, Vercel, GitHub, and Upstash.
3. Obtain licensed-counsel review of the draft legal copy and fill in controller/company/jurisdiction details.
4. Either upgrade to a plan with frequent Cron or connect a durable external scheduler before enabling async Premium jobs.
