# Public-beta launch checklist

## Blocking before traffic

- [x] Apply and verify the public-beta migrations in production and in the dedicated staging Supabase project. The staging two-user verifier passed on 2026-07-13; see `docs/launch-verification-2026-07-12.md`.
- [ ] Require email verification and verify signup, callback, recovery, reset, sign-out, and expired-session behavior.
- [x] Run a real two-user RLS isolation test, including a child-table foreign-key attempt.
- [x] Configure a real `NEXT_PUBLIC_APP_URL` and support address.
- [ ] Obtain licensed-counsel review of Terms, Privacy, and Acceptable Use; product/security review is documented in `docs/legal-review-2026-07-12.md`.
- [ ] Confirm Trial/Starter/Pro/Admin limits and assign existing users deliberately.
- [ ] Keep managed deployment disabled or test the exact approved-account allowlist and tenant namespaces.
- [ ] Confirm all AI, Firecrawl, Vercel, GitHub, and Supabase budgets/alerts.
- [x] Apply `202607110002_durable_generation_jobs.sql` and configure the worker/Cron secrets. Premium async remains disabled on Vercel Hobby because its Cron schedule is daily.
- [x] Configure Upstash Redis and enable the distributed limiter in production.
- [x] Run `npm run ci` from the current clean dependency state.
- [ ] Exercise the critical journey on 360, 430, 768, 1280, and 1440+ widths with keyboard-only navigation.

## Critical journey

- [ ] Sign up and verify email (signup API was verified; confirmation delivery still needs production SMTP verification).
- [ ] Complete onboarding.
- [ ] Add/import a business.
- [ ] Review evidence and correct an uncertain fact.
- [ ] Generate a Fast Draft and verify usage increments once.
- [ ] Cancel/reset during a run and confirm stale output cannot overwrite the active project.
- [ ] Preview in the scriptless sandbox and download HTML.
- [x] Save the prospect and generate outreach in an authenticated production-Supabase workflow.
- [ ] Confirm no message is sent automatically.
- [x] Mark contacted and verify follow-up state.
- [ ] Export account data.
- [ ] Delete a disposable account and verify cascaded data removal.

## Operations

- [ ] Add structured logs to the chosen log drain and alert on safe error codes.
- [ ] Configure an error-reporting provider only after privacy review.
- [ ] Establish provider cost and quota alerts.
- [ ] Define support response ownership and incident escalation.
- [ ] Define stale `reserved` usage/job cleanup and reconciliation procedure.
- [ ] Document external Vercel/GitHub artifact cleanup after account deletion.
