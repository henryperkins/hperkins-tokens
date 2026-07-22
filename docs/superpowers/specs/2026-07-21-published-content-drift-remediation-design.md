# Published Content Drift Remediation Design

## Objective

Make the public portfolio's release, delivery, artifact, status, skill, and
contribution claims agree with their current primary evidence without deleting
drafts, relocating durable assets, or replacing production with the older local
Studio database.

## Canonical claims

- Flavor Agent's latest tagged release is `v0.1.0-rc.3`, published 13 July
  2026. Current-branch facts remain dated evidence rather than evergreen hero
  copy. The intentionally pinned RC1 contracts row in the Job Placement Digest
  remains historical evidence.
- DJ Lee & Voices of Judah is a booking-first static site served by one
  Cloudflare Worker, not a WordPress rebuild.
- Python is familiarity without a shipped public artifact; the portfolio's
  Python-or-JavaScript evidence is currently JavaScript.
- WordPress/ai PR #757 is open with changes requested. WordPress/agent-skills
  PR #49 closed without merge on 18 July 2026.
- The AI Enablement deck action points to the already-public
  `/wp-content/uploads/2026/06/ExposeGovernAttest.pptx` artifact.

## Ownership and data flow

Theme-owned current-state surfaces are updated in `patterns/wapuu-home-hero.php`
and `inc/council-header.php`, with the Council header source verifier updated in
the same change. Database-owned pages are fetched fresh from production and
updated through the WordPress.com content API so the newer production page 599
and other production-only state are not overwritten by the Studio clone.

Tracked page mirrors and seed patterns stay aligned with the production edits:
Home, About, Work, and AI Enablement snapshots remain exact mirrors of their
database bodies; About, Work, and AI Enablement patterns remain reusable seed
copies. The local Studio records receive the same bounded replacements so local
WP-CLI verification remains meaningful.

## Scope

Production page updates are limited to IDs 6, 13, 25, 36, 120, and 175. The
seven drafts are preserved. The direct theme-asset paths are documented drift
but are not migrated in this change. Current unrelated production-gate failures
for fine-pointer emulation, search heading order, and prominent-action count are
reported but not folded into this remediation.

## Verification

Source checks must reject current marketing copy that references RC1, the DJ
Lee WordPress-rebuild description, an unqualified Python skill, a placeholder
deck link, stale Home status classes, or the obsolete PR #49 state. Existing
PHP, Node unit, content-ownership, header, typography-source, and artifact
checks run before publication. After production updates and the `main` push,
the six affected routes are checked in the public rendered DOM at desktop and
mobile widths, including direct verification that the PPTX returns HTTP 200.

