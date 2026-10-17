# Client acquisition workspace — October 2026

The existing Next.js/Supabase application remains the product. The customer is a freelance web designer or small agency. One saved business connects discovery, verified facts, demo versions, manually approved sharing/outreach, and follow-up.

## Delivery

1. Confirm remote saves, surface failures with retry, and guard unsaved work.
2. Separate sales stage from demo state; preserve existing prospects and legacy routes.
3. Create a shared business workspace with facts, design, review, outreach, and history.
4. Replace inference-heavy confidence badges with source evidence and explicit unknowns.
5. Add reviewed, revocable demo sharing and recipient feedback with isolated previews.
6. Put useful next actions ahead of dashboard decoration.

## Product decisions

- Retain the generation engine, Fast/Premium allowances, screenshot extraction, targeted regeneration, export, and approved deployment.
- Default to Fast Draft; Premium is an explicit refinement choice.
- Keep advanced legacy workflows reachable while making the focused studio the default.
- Keep immutable demo versions and a database activity timeline. Regeneration cannot move a deal backwards.
- Sharing requires a reviewed snapshot. Only the chosen HTML and public presentation copy are exposed; internal notes, contact lists, model details, and agency records are excluded.
- Feedback is recorded as feedback, never treated as permission to send a message automatically.
- Do not introduce billing or additional infrastructure in this change.

## Database release

Apply `202610160001_client_workspace.sql` after the four July migrations, before releasing the application. It adds prospect state/revision fields, snapshot/activity triggers, and owner-scoped share records/feedback. Existing values are backfilled without deleting data. Existing HTML starts in `draft` review state even when an older public URL exists; the URL itself is preserved. Roll back the application first; retain the additive tables and columns to preserve new data.

## Acceptance checks

Save failures are visible and retryable; overlapping saves cannot silently reorder; existing sales stages survive generation; sources do not become verified locations; existing records open in the new workspace; users can restore demo versions; unreviewed output cannot be shared; revoked/expired shares stop resolving; shared previews execute no script; feedback is bounded and rate-limited; all protected operations verify ownership; CI passes.
