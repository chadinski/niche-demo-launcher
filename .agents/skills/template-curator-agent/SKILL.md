---
name: template-curator-agent
description: Find, evaluate, and prepare premium website template candidates for Seraphim's industry template catalog. Use when the user asks to find/import/polish premium website templates, build industry-specific template packs, compare GitHub or marketplace templates, capture visual evidence for approval, or decide whether a template is safe to import, adapt, or use only as inspiration.
---

# Template Curator Agent

## Mission

Build approval-ready template shortlists for Seraphim without copying unsafe code or lowering the visual bar. Favor sources that can become ultra-premium, industry-specific static template packs after Niche Studios polish.

## Workflow

1. **Define the target industries.**
   - Default set: restaurants, medical/dental, beauty/salon/spa, auto repair/tire shop, legal, real estate, home services, professional services.
   - Add specific sub-niches when known, such as Caribbean restaurant, tire shop, orthodontist, med spa, estate attorney, roofing, or luxury realtor.

2. **Search sources.**
   - Search GitHub first for open-source HTML/CSS/static templates.
   - Search reputable premium marketplaces or template galleries as inspiration or license candidates.
   - Prefer live demos with accessible source or clear license information.

3. **Triage license and stack.**
   - Mark each source as `import-candidate`, `adapt-candidate`, `inspiration-only`, or `reject`.
   - Import only when the license permits commercial reuse and attribution requirements are understood.
   - Treat missing license, unclear asset rights, paid marketplace templates without purchase, copied brand assets, or proprietary SaaS templates as inspiration-only.
   - Reject sources that require a heavy stack, broken demos, intrusive dependencies, copied claims, or fake testimonials that cannot be removed cleanly.

4. **Capture visual evidence.**
   - Open live demos in Chrome or another browser surface when available.
   - Save screenshots under `docs/template-curator/screenshots/`.
   - Capture at least the hero/first viewport. Capture mobile and deeper sections when preparing a source for import.

5. **Score candidates.**
   - Score 1-10 for visual premium feel, industry fit, section depth, image strategy, code portability, responsiveness, accessibility risk, license clarity, and Seraphim fit.
   - Do not let GitHub stars override visual quality or license clarity.

6. **Prepare the approval shortlist.**
   - Include source link, demo link, license status, industry mapping, screenshot path, strengths, weaknesses, and recommended use.
   - Separate `ready to adapt` from `needs license` and `inspiration-only`.
   - Explain what Niche Studios would polish before a source becomes a Seraphim template pack.

7. **Do not wire into generation until approved.**
   - The shortlist is an approval gate.
   - After user approval, create internal template packs by translating patterns into Seraphim's static single-file standards, not by blindly copying full templates.

## Quality Rules

- Use Niche Studios standards: factual copy, one clear CTA, mobile-first layout, strong SEO, accessible interactions, no fake claims, no generic Bootstrap feel.
- Premium means composition, typography, imagery, spacing, story, and conversion flow, not just gradients or animation.
- Keep business facts separate from template placeholder content.
- Prefer templates with strong art direction, real section variety, and flexible component anatomy.
- A visually basic but well-licensed template can become a structure seed; it should not be approved as final visual quality.

## Output Shape

When reporting a pass, include:

- Candidate table grouped by industry.
- Recommended action for each candidate.
- Screenshot links when captured.
- License risks.
- Top 3 templates to approve first.
- Next implementation step after approval.

For current curated candidates, read `references/initial-shortlist.md`.
