# WordCamp US 2026 Portfolio Readiness Design

**Date:** 2026-08-10

**Status:** Approved by the user on 2026-08-10

**Surfaces:** `/job-placement-digest/`, the root-cause proof within that page, `/about/`, the one-page Support Engineer résumé, global résumé links, and the proposed `/one-page-resume/` redirect

**Evidence companion:** [`docs/audits/2026-08-10-wordpress-github-activity.md`](../../audits/2026-08-10-wordpress-github-activity.md)

## Goal

Prepare Henry Perkins's recruiter-facing WordPress portfolio for WordCamp US 2026 in Phoenix. A visitor should immediately understand that Henry will attend, that he was selected to staff the Core AI booth, what role he is pursuing, and which current WordPress evidence supports that fit.

The result must be concise, accurate about contribution ownership, usable on a phone in the Career Corner, and easy to retire after the event. It must not turn the portfolio into a conference landing page or inflate open, technically discussed, fork-only, or unreleased work.

## Event Facts And Wording

WordCamp US programming runs **Sunday, August 16 through Wednesday, August 19, 2026** at the Phoenix Convention Center. August 20 may be Henry's travel/departure day, but it is not presented as a WordCamp day. Sources: [official About page](https://us.wordcamp.org/2026/about/), [official schedule](https://us.wordcamp.org/2026/schedule/), and [WordPress.org event guide](https://wordpress.org/news/2026/07/wcus-2026-guide/).

The conference includes a Career Corner in the Sponsor Hall for job-board, hiring, résumé, and interview conversations. That makes the Digest and résumé directly useful. Showcase Day and the technical/AI program make a compact, evidence-led debugging example appropriate. Source: [official Career Corner description](https://us.wordcamp.org/2026/47-days-out-whats-waiting-for-you-at-wordcamp-us-2026/).

“Selected to staff the Core AI booth” is user-supplied first-party information. Public copy uses **staff**, not **man**, and does not invent booth hours or promise that Henry will be present at every moment.

## Information Architecture

There are two public pages and one document, not three standalone pages:

- `/job-placement-digest/` is the recruiter-facing evidence page.
- “Root Cause Investigation” is currently a long anchored section within the Digest. It remains within the Digest as a compact proof block; it does not become a standalone page or primary call to action.
- The one-page résumé is a DOCX/PDF artifact linked from the Digest, About page, and footer. `/one-page-resume/` becomes a stable semantic redirect to the current PDF, not a new content page.

The nonexistent `/root-cause-investigation/` route remains nonexistent. No redirect is added for it because the section is not an independent destination and the user does not find that page concept useful.

## Job Placement Digest

### Event panel

Add a temporary Imladris-style event panel near the beginning of the page, after the opening positioning copy and before the longer evidence argument.

Approved copy:

**Eyebrow:** `WORDCAMP US 2026 · PHOENIX`

**Heading:** `I’ll be at WordCamp US.`

**Body:** `I’ll be in Phoenix August 16–19, and I’ve been selected to staff the Core AI booth. If you’re hiring for WordPress support engineering, working on WordPress AI, or carrying an interesting incident, come say hello.`

Actions, in order:

1. **Start a WordCamp conversation** → `/contact/`
2. **View one-page résumé** → `/one-page-resume/`
3. **Review selected WordPress evidence** → `#evidence-register`

Remove the current **Read the root-cause investigation** action. The debugging proof supports the page's argument; it is not the page's primary navigation choice.

The panel reuses the current visual system, with no new event-brand color system, WordCamp logo treatment, stock conference imagery, or fake booth graphics. It must read as a temporary status card inside the existing portfolio.

### Page shape

The current Digest is roughly 14,700 pixels tall on a mobile viewport. The refresh should reduce scanning cost rather than add another long section.

- Preserve the opening Support Engineer positioning and gap-aware role-fit table.
- Move the strongest, current evidence earlier.
- Replace moving counts with stable status labels and dated links.
- Condense the root-cause story as specified below.
- Keep the detailed evidence register, but group it by evidence state and remove stale or duplicative rows.
- Preserve the explicit enterprise-monitoring/scale gap unless new qualifying evidence exists.
- Keep the closing invitation focused on conversation, résumé, and selected evidence.

### Evidence taxonomy

Every contribution row uses one explicit state. If one project needs both released and unreleased evidence, render separate rows or separately labeled subentries rather than one blended status:

- **Authored · merged upstream**
- **Authored · open upstream**
- **Reported · fixed upstream by another contributor**
- **Reproduced · integration-tested · technical feedback (non-formal)**
- **Released owned work**
- **Merged to owned main · unreleased**
- **Fork-only**
- **Active evidence tooling · no release**

Do not summarize this record as “two merged PRs” or similar aggregate counts. Status and ownership matter more than volume.

### Selected evidence register

The visible register should include the following high-signal items:

1. [WordPress/ai PR #501](https://github.com/WordPress/ai/pull/501) — Henry-authored and merged; retained as the strongest merged upstream baseline even though it predates the July audit window.
2. [WordPress/php-ai-client issue #262](https://github.com/WordPress/php-ai-client/issues/262) and [PR #263](https://github.com/WordPress/php-ai-client/pull/263) — Henry-authored open upstream defect report, regression coverage, and finite-vector validation.
3. [WordPress/ai-provider-for-openai PR #40](https://github.com/WordPress/ai-provider-for-openai/pull/40) — Henry-authored open upstream model-aware sampling compatibility work.
4. [WordPress/ai issue #529](https://github.com/WordPress/ai/issues/529), maintainer [PR #593](https://github.com/WordPress/ai/pull/593), and release [1.0.1](https://github.com/WordPress/ai/releases/tag/1.0.1) — Henry reported; a maintainer fixed and shipped it.
5. [WordPress/ai issue #732](https://github.com/WordPress/ai/issues/732) and another contributor's [PR #757](https://github.com/WordPress/ai/pull/757) — Henry reported, reproduced, integration-tested, and supplied non-formal technical feedback; he did not author the PR.
6. [WordPress/ai PR #749 feedback](https://github.com/WordPress/ai/pull/749#issuecomment-5010134375) — central access-control enforcement and direct-execution denial-test design feedback.
7. [Flavor Agent RC3](https://github.com/henryperkins/flavor-agent/releases/tag/v0.1.0-rc.3) — latest public artifact; label it **released owned work · prerelease**.
8. Selected Flavor Agent post-RC3 milestones — separate row labeled **merged to owned main · unreleased** or **in development**.
9. [AI Provider for Codex v2.1](https://github.com/henryperkins/ai-provider-for-codex/releases/tag/v2.1) — released owned WordPress AI provider.
10. [HPerkins Tokens v0.3.53](https://github.com/henryperkins/hperkins-tokens/releases/tag/v0.3.53) — latest public released/deployed theme evidence.
11. Later HPerkins Tokens WooCommerce/main work — separate row labeled **merged to owned main · unreleased**.
12. [`roadmaptrac`](https://github.com/henryperkins/roadmaptrac) — active WordPress AI evidence tooling with no release tag.

The maintained `agent-skills` distribution and fork-only MCP Adapter work remain in the companion audit and may appear in a smaller “More current work” disclosure. They must not displace stronger authored upstream or released evidence. The agent-authored WP-Bench branch remains audit-only unless attribution and upstream disposition become clearer.

## Root-Cause Proof Block

### Purpose

The root-cause content exists only to demonstrate support-engineering judgment: noticing a silent observability failure, tracing the boundary in someone else's codebase, testing a proposed fix, and communicating what remains unsafe. It is not a microsite, an essay destination, or a second pitch.

### Approved compact structure

**Heading:** `Debugging proof: a request log that silently under-reported`

**Status:** `Issue #732 open · PR #757 by another contributor open`

**Signal**

`Codex provider generations never appeared in the WordPress AI request log. Nothing errored; the diagnostic silently looked complete.`

**Diagnosis**

`Logging decorated one SDK HTTP transporter. Supported providers using a sidecar, custom handler, or direct WordPress HTTP request bypassed that boundary and disappeared from the record.`

**Constraint**

`Lifecycle-hook capture restored the missing success rows in integration testing, but it double-logged successes when the provider bridge remained active and still omitted failures. Capture, attribution, and ownership cannot be collapsed into a one-line fix.`

**Result**

`Henry authored issue #732 and its reproduction. Anubhav Anand authored PR #757. Henry tested the integration and proposed the ownership split. An earlier report, issue #529, was reproduced and fixed by a maintainer in PR #593 and shipped in WordPress AI 1.0.1.`

Direct links follow the block. They must include [issue #732](https://github.com/WordPress/ai/issues/732), the [PR #757 integration-test result](https://github.com/WordPress/ai/pull/757#issuecomment-4980297831), the [ownership proposal](https://github.com/WordPress/ai/pull/757#issuecomment-4981567682), [issue #529](https://github.com/WordPress/ai/issues/529), maintainer [PR #593](https://github.com/WordPress/ai/pull/593), and release [1.0.1](https://github.com/WordPress/ai/releases/tag/1.0.1). The copy must remain first-person where Henry owns the work and name the other contributor where he does not.

### Markup and behavior

- Use one H2 and a compact four-part definition/grid structure, not six H3 subsections.
- Preserve an optional `#root-cause-investigation` fragment for old internal links, but do not promote it as a CTA or standalone route.
- At narrow widths, stack Signal, Diagnosis, Constraint, and Result in reading order without horizontal scrolling.
- The status chip is text, not color-only state.
- Code symbols are retained only when they materially help; the main proof must be understandable without reading PHP identifiers.

## About Page

Add a shorter, removable event status near the introductory actions:

**Label:** `WordCamp US 2026 · Phoenix · Aug 16–19`

**Copy:** `I’ll be there, and I’ve been selected to staff the Core AI booth.`

**Action:** `Start a conversation` → `/contact/`

Do not duplicate the full Digest panel or create another long conference section.

Refresh the Core AI evidence board:

- Keep merged PR #501 with authored/merged wording.
- Keep issue #529 with reporter/fix attribution.
- Replace the weak closed `agent-skills` PR #49 reference with current open upstream PRs #263 and #40.
- Represent issue #732 / PR #757 as report, integration testing, and non-formal technical feedback—not authored fix work or a formal GitHub review.
- Add PR #749 only if the board remains scannable.

Correct the visible `Tableu` typo to `Tableau` if the current live database body still contains it when publication begins.

## One-Page Résumé

### Event line

Add this exact line near the contact/header area:

`WORDCAMP US 2026 — Phoenix, Aug 16–19 · Selected to staff the Core AI booth`

The event line is selectable/searchable text, not a raster banner. It must survive ATS extraction and remain visually subordinate to Henry's name and Support Engineer target.

### Evidence refresh

Retain a one-page Support Engineer résumé. Curate rather than enumerate:

- Preserve the strongest merged upstream proof: WordPress/ai PR #501.
- Add open upstream code PRs #263 and #40, explicitly labeled open.
- Preserve issue #529 and issue #732 as reported/investigated work, with PR #593 and PR #757 attribution separated.
- Retain released owned evidence for AI Provider for Codex v2.1 and HPerkins Tokens v0.3.53.
- Describe Flavor Agent with separate phrases for `RC3 prerelease` and `post-RC3 main hardening, unreleased`; do not imply final v0.1.0.
- Prefer durable capability/outcome language over moving contribution, commit, or contract counts.
- Keep `roadmaptrac`, `agent-skills`, MCP Adapter, WP-Bench, and other secondary activity in the Digest/audit unless space can be gained without shrinking text or weakening the employment story.

### Document contract

- Update the DOCX source and PDF output together.
- PDF and DOCX must be text-identical for recruiter-facing content.
- PDF remains exactly one page, searchable, tagged, keyboard-readable, and visually clean at normal zoom.
- All hyperlinks must resolve and expose meaningful link text.
- Keep the current Support Engineer filename as the versioned theme artifact unless the implementation plan establishes a safer asset migration.
- Do not overwrite the older Media Library attachment and assume the problem is solved; eliminate public links to it.

## Stable Résumé Route And Global Links

Add `/one-page-resume/` as a semantic redirect, not a content page. It should return a temporary redirect to the current Support Engineer PDF so the destination can change later without a permanently cached stale asset.

All user-facing résumé actions—including Digest, About, and footer—should point to `/one-page-resume/`. The redirect's final destination is the current theme-owned PDF. Direct artifact checks may still resolve and verify the PDF URL.

Production currently exposes both the current Support Engineer PDF and an older upload named `henry-perkins-wordpress-ai-open-source-resume-2026-06-30.pdf`; the old link appears in the database-overridden footer even though the tracked footer source points to the current artifact. The implementation must update both the tracked source contract and the live template-part/database override through the guarded publication workflow. Do not delete the old media attachment as part of this work.

The redirect must:

- work for `GET` and `HEAD`;
- preserve no query parameters unless a cache-busting parameter is deliberately generated by the theme;
- remain on the same HTTPS origin;
- avoid a redirect loop;
- return the PDF with the expected content type after one hop.

## Visual And Accessibility Direction

Use the existing Imladris visual vocabulary: parchment, evergreen, ink, muted gold, river blue, current type system, proof chips, ledgers, and prominent-action composition. The event additions should feel native and temporary.

- Do not introduce WordCamp brand colors, event logos, gradients, dashboard cards, generic AI art, or decorative Phoenix imagery.
- Maintain one H1 per page and sequential heading order.
- Maintain 44-pixel interactive targets, visible focus, AA contrast, meaningful link text, and non-color status labels.
- Prevent tables, chips, long repository names, and status strings from overflowing at 320 and 390 pixels.
- Keep the primary text measure readable and avoid shrinking résumé body text to force in more evidence.
- Respect reduced motion; no new animation is needed.

## Content Ownership And Publication Workflow

The live WordPress database body is canonical for `/job-placement-digest/` and `/about/`; committed snapshots are verified mirrors. The local Studio database is stale and must not overwrite production or the current snapshots.

Implementation follows this order:

1. Re-fetch and hash the live database-owned bodies before authoring.
2. Create or refresh one human-authored candidate per page from that verified source.
3. Apply candidates only to the local Studio database for review through the existing guarded draft command.
4. Update source verifiers, browser checks, résumé artifacts, and redirect tests against the candidate.
5. Obtain content/visual approval.
6. Treat production publication as a separate explicit gate.
7. After an authorized production edit, export the published bodies into snapshots and prove live DB/snapshot parity.

Theme source, document artifacts, and tests can be committed before publication. A repository commit is not evidence that the live database, footer override, redirect, or PDF delivery changed.

## Verification

### Evidence freshness

- Re-resolve every GitHub issue, PR, release, and pinned commit on the publication day.
- Assert author, state, merge status, release status, and attribution vocabulary separately.
- Reject moving branch-distance and current-count claims.
- Re-run the July/August activity search for work after the audit cutoff.

### Source and content contracts

- Extend `verify-job-placement-digest-source.js` for event copy, CTA order, evidence taxonomy, compact root-cause structure, direct links, and the retired long-form headings.
- Extend About source/rendered verification for the event line, current Core AI rows, action destination, and `Tableau` spelling.
- Extend placement-artifact and link tests so all visible résumé links use `/one-page-resume/` while the final PDF asset remains verifiable.
- Add redirect tests for one-hop `GET`/`HEAD`, same-origin destination, content type, and no loop.
- Keep content-ownership, draft/snapshot, and deployed-content checks green.

### Document and PDF

- Extract DOCX and PDF text and compare normalized recruiter-facing content.
- Assert one PDF page, searchable text, tagged structure, valid links, current event dates, and absence of stale contribution counts.
- Render the PDF to an image and visually inspect clipping, spacing, link decoration, alignment, and readability.

### Browser and accessibility

- Inspect Digest and About at 1440×1000, 1024, 768, 390×844, and 320-pixel widths.
- Verify heading outline, keyboard order, focus visibility, target size, contrast, fragment behavior, reduced motion, and horizontal overflow.
- Verify the event panel and compact proof block in production-like rendered HTML, not only source snapshots.
- Check public footer output because the live database override currently differs from the tracked footer source.

### Final production proof

After separate publication authorization:

- Fetch `/job-placement-digest/`, `/about/`, `/one-page-resume/`, the final PDF, and representative pages containing the global footer.
- Confirm the event copy, current dates, Core AI booth wording, CTA destinations, current evidence states, redirect response, and single résumé artifact.
- Export and hash the live database-owned page bodies into their verified mirrors.
- Record the deployed theme release/commit separately from content publication.

## Event Retirement

The event panel, About status, and résumé event line are temporary. After August 20, review them deliberately:

- remove the pre-event “I’ll be there” wording;
- optionally replace it with a short post-event contact cue only if it remains useful;
- regenerate the one-page résumé without the event line;
- keep the evidence refresh and contribution-attribution corrections permanently.

No automatic date-driven mutation is introduced. Manual retirement is safer for database-owned content and document artifacts.

## Acceptance Criteria

- WordCamp US is dated August 16–19 everywhere; August 20 is not called a conference day.
- Digest and About explicitly say Henry will attend and was selected to staff the Core AI booth.
- “Read the root-cause investigation” is absent from the primary action rail.
- The root-cause proof is a compact Signal → Diagnosis → Constraint → Result block with correct PR authorship.
- The contribution register distinguishes authored, merged, open, reported, integration-tested, non-formal technical feedback, released, unreleased, and fork-only evidence.
- PRs #263 and #40 appear as open upstream code; PR #757 is never presented as Henry-authored.
- Stale aggregate counts and volatile Flavor Agent branch counts are removed.
- The résumé is one page, text-searchable/tagged, current, and contains the approved event line.
- Digest, About, and footer point to `/one-page-resume/`; it redirects once to the current Support Engineer PDF.
- The old upload is no longer linked publicly, but is not destructively deleted.
- Mobile and desktop layouts pass overflow, focus, target-size, heading, contrast, and reduced-motion checks.
- Local/source, repository commit, production publication, deployed release, and post-event retirement remain separate evidence gates.

## Out Of Scope

- A standalone Root Cause Investigation page or redirect.
- A standalone résumé landing page with new content.
- Changes to WordCamp, WordPress, or Core AI branding.
- Claims about booth hours, employer participation, interviews, offers, or availability not established by evidence.
- Deleting historical media-library files.
- Publishing the page drafts, changing the live footer override, enabling the redirect in production, or deploying a theme release without a separate explicit authorization.
