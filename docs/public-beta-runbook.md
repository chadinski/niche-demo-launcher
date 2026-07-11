# Public-beta deployment runbook

## Migration order

1. Back up the production database.
2. Confirm the existing base schema from `supabase/schema.sql` is present.
3. Apply `supabase/migrations/202607110001_public_beta_foundation.sql` in a staging Supabase project.
4. Run the full application CI against staging.
5. Create two non-admin test accounts and prove each cannot select, mutate, or reference the other's prospect and child records.
6. Apply the same migration to production during a low-traffic window.

The migration is additive except for replacing three permissive child-table RLS policies with tenant-reference-aware policies. Existing rows are preserved. Existing Auth users are backfilled into profile, onboarding, and Trial entitlement tables.

## Rollback considerations

- Do not drop the new tables after users begin generating usage/job history; export them first.
- If the new quota RPC blocks production unexpectedly, disable expensive UI entry points and correct the migration. Do not bypass server quota checks with a client flag.
- The previous RLS policies can be recreated from `supabase/schema.sql`, but doing so reopens the cross-tenant reference-integrity gap.
- Managed deployment defaults off and can be disabled immediately with `AUTOMATED_DEPLOYMENT_ENABLED=0`.

## Required configuration

See `.env.example`. Production requires a real HTTPS `NEXT_PUBLIC_APP_URL`, Supabase URL/anon key, and at least one AI provider. `SUPABASE_SERVICE_ROLE_KEY` is used only for confirmed Auth-user deletion and server-verified admin diagnostics. Firecrawl and managed deployment are optional.

## Supabase manual setup

- Enable email/password signups and require email confirmation.
- Configure Site URL and allowed redirects for `/auth/callback`, `/onboarding`, and `/reset-password`.
- Configure Google OAuth only if the provider is ready; otherwise leave it disabled and hide/disable the button in a follow-up change.
- Review email templates and SMTP deliverability.
- Apply the migration and inspect all RLS policies.
- Assign admin role in `user_profiles` or list operator emails in `ADMIN_EMAILS`.

## Vercel manual setup

- Set the production app URL and server-only keys.
- Keep `AUTOMATED_DEPLOYMENT_ENABLED=0` until shared-account controls and approved-account list are confirmed.
- Configure a support email.
- Add error reporting only after privacy/consent review.
- Verify function duration supports Fast generation; Premium remains a controlled-beta risk until queued.

## Seed/test data

Use separate staging users. Do not copy real prospect personal data into fixtures. Plan limits are seeded idempotently by the migration.
