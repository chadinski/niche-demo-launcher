# Seraphim public-beta launch audit

Audit date: 2026-07-11

## Scores

- Initial launch-readiness score: **34/100**
- Codebase readiness after this change set: **86/100**
- Production launch remains conditional on applying the migration, configuring Supabase/email/support, exercising two-user isolation in the target project, and completing legal review.

## Baseline

The untouched branch passed `npm run lint`, `npm run typecheck`, 9 Vitest tests, and `next build`. The deployed application was inspected while authenticated at desktop width. `/`, `/create`, `/leads`, `/prospects`, and `/settings` were mapped. The generation engine, generation-ID stale-response protection, manual outreach boundary, and scriptless `sandbox=""` preview were production-worthy foundations.

## Prioritized findings

| Priority | Finding | Launch impact | Resolution in this branch |
| --- | --- | --- | --- |
| P0 | Root and metadata exposed a private command center and globally blocked indexing | No understandable public product | Public landing/features/workflow/beta/support/legal pages; dashboard moved to `/dashboard`; public sitemap/robots and private route metadata |
| P0 | Every authenticated user could invoke shared AI/search credentials without quota enforcement | Unbounded cost and abuse | Atomic `consume_usage` reservation, plan limits, usage events, request limits, throttling, and idempotency keys |
| P0 | Shared Vercel/GitHub credentials were available to any signed-in user and project names could collide | Cross-tenant overwrite and shared-account abuse | Deployment off by default; explicit allowlist; tenant-derived namespace; private GitHub repositories; universal HTML export retained |
| P0 | Production middleware silently passed protected UI when Supabase was missing | Accidental public/internal fallback | Production fails closed with API 503 or configuration-unavailable page; local fallback remains development-only |
| P0 | RLS child tables scoped `user_id` but did not prove the referenced prospect belonged to the same tenant | Cross-tenant reference integrity gap | Versioned policies require owned prospect for generated websites, outreach messages, and activity logs |
| P0 | No self-service signup, recovery, or first-run guidance | New users could not start independently | Signup, verification redirect, sign-in, Google OAuth path, forgot/reset password, safe redirects, onboarding and first-project handoff |
| P1 | Customer settings exposed provider/model/environment terminology | Confusing and security-sensitive UX | Settings now contains only agency, proposal, and outreach defaults; operator view is server-role protected |
| P1 | Expensive routes returned provider errors and lacked uniform limits | Information leakage and poor recovery | User-safe codes, correlation IDs, declared body limits, MIME constraints, timeouts, safe failure copy, structured logging seam |
| P1 | No account export or deletion | Privacy and trust blocker | Authenticated JSON export and confirmed Auth-admin deletion; service role isolated to deletion/admin diagnostics |
| P1 | No durable operation record | Weak recovery/operations visibility | `generation_jobs` and `usage_events` migrations; generation success/failure status persisted |
| P1 | Create workspace exposed advanced controls by default | First-run overload | Fast/Premium choice is explicit; advanced design controls moved behind disclosure; cost/allowance copy added |
| P1 | No usage view or truthful pricing state | Users could not understand limits | Usage page and public-beta page; no fake Stripe or checkout |
| P1 | Legal, AI processing, acceptable use, and support surfaces absent | Trust/compliance gap | Clearly marked draft Terms/Privacy plus Acceptable Use and Support pages |
| P1 | Test suite did not cover launch controls | Regressions likely | Redirect, upload, throttling, request size, entitlement mapping, deployment gating, migration contract, and preview sandbox tests added |
| P2 | In-memory throttling is instance-local | Distributed bursts may span serverless instances | Upstash-compatible distributed limiter, fail-closed production option, and staging configuration seam added |
| P2 | Generation jobs run within request lifetime | Premium jobs remain exposed to platform timeout ceilings | Durable Premium queue, atomic leases, cancellation/status APIs, Vercel Cron worker, result persistence, and bounded retries added; staging interruption test remains required |
| P2 | Admin can observe readiness but cannot edit plan limits or replay jobs in UI | Operator tasks still require controlled SQL/config | Keep as explicit beta operation; add audited admin mutations later |
| P2 | Draft legal text lacks jurisdiction/controller details | Not ready for general availability | Professional review and final company/support details are launch checklist gates |
| P2 | No configured analytics or error-reporting vendor | Limited product/exception visibility | Provider-neutral env seams documented; no tracking is activated without a consent design |

## External-cost inventory

- Screenshot/business extraction: Gemini or OpenAI.
- Lead discovery: Firecrawl.
- Fast and Premium website generation: multiple Gemini/OpenAI stage calls; Premium adds QA/revision work; optional Firecrawl inspiration.
- Section regeneration: Gemini/OpenAI.
- Outreach generation: Gemini/OpenAI with deterministic fallback.
- Managed deployment: Vercel and optional GitHub.
- Optional rendered QA may add server compute when enabled.

Every listed end-user action now has a provider-neutral usage operation. Managed deployment is separately feature-flagged and allowlisted.

## Upload and user-content inventory

- `/api/business-intelligence`: OCR text and base64 PNG/JPEG/WebP; 6 MB client file limit and 8 MB encoded schema ceiling.
- `/api/generate-website`: business fields, optional embedded supported image, design preferences, extracted report.
- `/api/regenerate-section`: existing section HTML and correction instruction.
- `/api/generate-outreach`: business data, report, quality summary, tone, and settings.
- `/api/leads/search`: bounded industry/location fields; Firecrawl performs search rather than arbitrary URL fetching.
- Prospect/settings server actions: Zod-validated, bounded customer data.
- Generated HTML is previewed in an iframe with no sandbox permissions and no referrer.

## Lifecycle map

Account creation → email verification/OAuth callback → onboarding/profile defaults → first project → lead import/search → evidence review → Fast/Premium generation → isolated preview/refinement → prospect persistence → HTML export or approved managed deployment → outreach draft → manual send → status/follow-up → export or account deletion.
