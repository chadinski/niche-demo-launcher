# Public-beta launch checklist

## Blocking before traffic

- [x] Apply and verify all four public-beta migrations in production and in the dedicated staging Supabase project. See `docs/launch-verification-2026-07-13.md`.
- [ ] Require email verification and verify signup, callback, recovery, reset, sign-out, and expired-session behavior.
- [x] Run a real two-user RLS isolation test, including a child-table foreign-key attempt.
- [x] Configure the production `NEXT_PUBLIC_APP_URL`.
- [ ] Configure an owned, monitored `NEXT_PUBLIC_SUPPORT_EMAIL` mailbox.
- [ ] Obtain licensed-counsel review of Terms, Privacy, and Acceptable Use; product/security review is documented in `docs/legal-review-2026-07-12.md`.
- [x] Seed Trial/Starter/Pro/Admin limits and assign existing users explicit active Trial entitlements.
- [x] Keep managed deployment disabled for public users; HTML download remains available.
- [ ] Confirm all AI, Firecrawl, Vercel, GitHub, and Supabase budgets/alerts.
- [x] Apply `202607110002_durable_generation_jobs.sql` and configure the worker/Cron secrets. Premium async remains disabled on Vercel Hobby because its Cron schedule is daily.
- [x] Configure Upstash Redis and enable the distributed limiter in production.
- [x] Run `npm run ci` from the current dependency state.
- [ ] Exercise the critical journey on 360, 430, 768, 1280, and 1440+ widths with keyboard-only navigation.

## Critical journey

- [ ] Sign up and verify email (signup API was verified; confirmation delivery still needs production SMTP verification).
- [x] Complete onboarding and verify incomplete accounts are redirected there.
- [x] Add/import a business and extract facts with the configured production AI provider.
- [ ] Review evidence and correct an uncertain fact.
- [x] Generate a Fast Draft and verify the successful usage event and Trial allowance.
- [ ] Cancel/reset during a run and confirm stale output cannot overwrite the active project.
- [x] Preview in the scriptless sandbox and download HTML.
- [x] Save the prospect and generate outreach in an authenticated production-Supabase workflow.
- [x] Confirm no message is sent automatically; outreach remains a manual draft and status action.
- [x] Mark contacted and verify follow-up state.
- [ ] Export account data.
- [x] Delete disposable accounts and verify cascaded data removal.
- [x] Run a live Firecrawl lead search, persist five candidates, and save one candidate through the production UI.

## Operations

- [ ] Add structured logs to the chosen log drain and alert on safe error codes.
- [ ] Configure an error-reporting provider only after privacy review.
- [ ] Establish provider cost and quota alerts.
- [ ] Define support response ownership and incident escalation.
- [x] Define stale `reserved` usage/job cleanup and reconciliation procedure in the runbook.
- [x] Document external Vercel/GitHub artifact cleanup after account deletion.
