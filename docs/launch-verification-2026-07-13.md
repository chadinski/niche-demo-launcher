# Launch verification — 2026-07-13

This record contains no credentials, tokens, disposable-account email addresses, or raw customer data.

## Database and tenant isolation

- Applied and verified `202607130001_auth_user_bootstrap.sql` in staging and production. The trigger creates profile, onboarding, and explicit active Trial entitlement rows for every new Auth user and backfilled all existing production users.
- Applied and verified `202607130002_lead_search_rls.sql` in staging and production after the live test exposed missing migrated policies for lead search runs and blacklists.
- Ran the expanded two-user staging verifier. User B could not read User A's prospect or lead search, insert a generated website for User A's prospect, link a lead candidate to User A's search, or read User A's blacklist. User A could create a search and blacklist record.
- The same prospect/child isolation test had already passed against production. The newly restored lead policies are identical to the staging policies and the live authenticated production Lead Finder write succeeded after application.

## Authenticated production workflow

Using disposable confirmed accounts against `https://niche-demo-launcher.vercel.app`:

1. Signed in and verified automatic first-run redirect to onboarding.
2. Completed onboarding and entered the guided first-project workflow.
3. Imported business text, ran Gemini extraction, and approved the facts.
4. Generated a Fast Draft and verified a successful database-backed usage event.
5. Reviewed the generated site in an iframe with an empty sandbox token list and `no-referrer`; the generated HTML contained no script element.
6. Opened the HTML view and successfully exercised the website download control.
7. Generated personalized outreach, saved the prospect, and manually marked it contacted. No message was sent automatically.
8. Verified the Usage page showed Trial allowances, provider/model metadata, failure state, and estimated cost.
9. Deleted the disposable account and verified its Auth user and account-owned records were removed.
10. Ran a live Firecrawl search for five candidates, persisted the search, and saved a candidate. The disposable account was then deleted.

The account-export endpoint and UI control are present and covered by route/contract tests. The Chrome test environment blocked the attachment navigation, so a downloaded JSON file still requires one manual browser confirmation outside the automation extension.

## Reliability and security

- `npm run ci` passed: ESLint, strict TypeScript, 26 Vitest assertions across two test files, and the Next.js production build.
- `npm run test:staging:rls` passed all seven isolation assertions.
- The production Lead Finder failure was refundable, returned a safe user message, and sent no outreach. Its root cause was fixed with a versioned RLS migration.
- The Lead Finder now uses the distributed rate-limit guard and safe structured failure logging in addition to atomic quota reservation.
- Managed customer deployment remains disabled. HTML export is the supported public-beta delivery path.
- Premium asynchronous generation remains disabled on Vercel Hobby because its Cron schedule is limited to daily execution. The durable job schema, leasing, retry path, and protected worker endpoint remain installed for a future frequent scheduler.
- Production deployment `dpl_wSeXGUveKZUvnd4DNpUkEH7s8Xo7` reached `READY` and was aliased to the public URL. The landing page, health endpoint, and robots file returned HTTP 200; a protected page redirected to sign-in and an unauthenticated protected API call returned structured `401 AUTH_REQUIRED` JSON.
- Final production database verification reported three Lead Finder policies, an active Auth bootstrap trigger, five Auth users, five profiles, five active Trial entitlements, and zero disposable E2E users.

## External launch gates

These cannot be truthfully completed without owned provider details or professional approval:

1. Configure Supabase custom SMTP and verify confirmation and password-recovery delivery.
2. Set `NEXT_PUBLIC_SUPPORT_EMAIL` to an owned, monitored mailbox and assign support/incident ownership.
3. Configure business-approved spend and quota alerts in Gemini, Firecrawl, Vercel, Supabase, and Upstash dashboards.
4. Obtain licensed-counsel approval of the clearly marked draft Terms, Privacy Policy, and Acceptable Use Policy.
5. Confirm an account-export JSON download in a normal browser without the automation extension.
6. Complete the viewport matrix and keyboard-only pass at 360, 430, 768, 1280, and 1440+ widths.
