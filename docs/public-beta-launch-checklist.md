# Public-beta launch checklist

## Blocking before traffic

- [ ] Apply and verify the public-beta migration in staging and production.
- [ ] Require email verification and verify signup, callback, recovery, reset, sign-out, and expired-session behavior.
- [ ] Run the two-user RLS isolation matrix, including child-table foreign keys.
- [ ] Configure a real `NEXT_PUBLIC_APP_URL` and support address.
- [ ] Complete professional review of Terms, Privacy, and Acceptable Use; add controller/company/jurisdiction details.
- [ ] Confirm Trial/Starter/Pro/Admin limits and assign existing users deliberately.
- [ ] Keep managed deployment disabled or test the exact approved-account allowlist and tenant namespaces.
- [ ] Confirm all AI, Firecrawl, Vercel, GitHub, and Supabase budgets/alerts.
- [ ] Run `npm run ci` from a clean install.
- [ ] Exercise the critical journey on 360, 430, 768, 1280, and 1440+ widths with keyboard-only navigation.

## Critical journey

- [ ] Sign up and verify email.
- [ ] Complete onboarding.
- [ ] Add/import a business.
- [ ] Review evidence and correct an uncertain fact.
- [ ] Generate a Fast Draft and verify usage increments once.
- [ ] Cancel/reset during a run and confirm stale output cannot overwrite the active project.
- [ ] Preview in the scriptless sandbox and download HTML.
- [ ] Save the prospect and generate outreach.
- [ ] Confirm no message is sent automatically.
- [ ] Mark contacted and verify follow-up state.
- [ ] Export account data.
- [ ] Delete a disposable account and verify cascaded data removal.

## Operations

- [ ] Add structured logs to the chosen log drain and alert on safe error codes.
- [ ] Configure an error-reporting provider only after privacy review.
- [ ] Establish provider cost and quota alerts.
- [ ] Define support response ownership and incident escalation.
- [ ] Define stale `reserved` usage/job cleanup and reconciliation procedure.
- [ ] Document external Vercel/GitHub artifact cleanup after account deletion.
