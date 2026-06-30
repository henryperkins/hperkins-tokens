# Remaining SEO Local Implementation - design spec

- **Date:** 2026-06-24
- **Theme:** `hperkins-tokens` inside the live `/home/dev/hperkinsblog` WordPress install
- **Status:** design approved in conversation; pending written-spec review
- **Scope:** local, site-owned follow-through only

## Problem

The technical SEO layer is already live: per-page titles and descriptions, Open Graph,
JSON-LD, canonical fixes, sitemap hygiene, and the `wp.hperkins.com` redirect have
already shipped. The remaining local work is not infrastructure; it is **content
connective tissue**:

- About still ships two live link bugs: the hero CTA goes to `mailto:htperkins@gmail.com`
  and the chronology line still links to `https://hperkins.com/resume`.
- The homepage does not yet expose the visible role/internal-link path called for in the
  SEO brief, and it lacks the closing contact CTA.
- The work/case-study surfaces, including the `/work/` hub, still rely mostly on
  nav/chrome links. In-body contextual links and closing conversion CTAs are still sparse
  or absent.
- The earlier brief also named `/how-this-was-built/`, but the public reference pages it
  would absorb (`/design-system/` and `/design-tokens/`) are still `noindex`. `/design-system/`
  now reads as current reference material, but `/design-tokens/` still describes the
  pre-Imladris token contract rather than the current live theme vocabulary.

## Goal

Ship the remaining **site-owned** SEO work without changing the source-of-truth model:

- strengthen internal linking with descriptive anchors,
- add consistent closing CTAs to the work pages,
- fix the About link bugs,
- add the missing bridge links from the essay and the currently in-scope supporting pages,
- leave Henry-only external-account tasks untouched.

## Explicitly out of scope

This pass does **not** touch:

- Cloudflare/domain consolidation (`hperkins.com`, WordPress.com redirect, Search Console)
- GitHub / LinkedIn profile edits
- GA4 / Site Kit / Search Console setup
- Nginx page-cache / Redis / Brotli / security-header work
- image-format generation (`avif` / `webp`) and server delivery changes
- visible breadcrumb design
- ATS PDF or other upload artifacts
- the `/how-this-was-built/` -> `/design-system/` / `/design-tokens/` absorption step until
  those reference pages are refreshed and their indexing posture is intentionally revisited
- the already-shipped SEO mu-plugin/meta contract

## Ownership model (confirmed)

### DB-owned page bodies

These routes render `wp:post-content` and should be edited through the stored post body:

- `36` `/` Home
- `6` `/about/`
- `13` `/work/`
- `175` `/ai-enablement/`
- `120` `/work/flavor-agent/`
- `12` `/work/flavor-agent/ai-governance/`
- `11` `/work/flavor-agent/demo/`
- `25` `/work/upstream-core-ai-stack/`
- `10` `/work/ai-provider-for-codex/`
- `17` `/work/dj-lee-voices-of-judah/`
- `238` `/2026/06/govern-for-the-return/`

### Theme-owned route referenced by the brief (deferred here)

- `/how-this-was-built/` is rendered from
  `templates/page-how-this-was-built.html` ->
  `patterns/how-this-was-built.php`, but this pass defers that route because the intended
  public targets are still `noindex` reference pages, and `/design-tokens/` still needs a
  content refresh before it should inherit more internal-link weight.

### Reference-only patterns (not live owners)

These remain useful reference copies, but they are not the live source for their routes:

- `patterns/about-resume.php`
- `patterns/work-index.php`
- `patterns/ai-enablement.php`

## Design decisions resolved

### 1. Keep the current DB-vs-theme ownership split

Do **not** move any of these routes back into filesystem patterns. The current live contract
is already in place and documented. This pass edits the actual live owners only.

### 2. Route the About CTA to `/contact/`

The `/about/` hero CTA should go to `/contact/`, not to a direct mailto link. That keeps
the visitor on the canonical contact path already used in site navigation and avoids needing
Henry to pick a public professional email before this local pass can ship.

### 3. Standardize the touched on-site role language around
`WordPress AI Solutions Engineer`

The live home SEO output and site schema already use `WordPress AI Solutions Engineer`.
This pass uses that string on the touched public page bodies where the brief asks for the
missing visible-role/internal-link path. It does **not** widen into external profiles or the
ATS PDF.

### 4. Use one shared closing-CTA block pattern in content, not a template rewrite

The closing CTA is implemented as repeated Gutenberg block markup inside the relevant page
bodies. Reuse the theme's existing button styling and spacing primitives; do not add a new
template or change the case-study template hierarchy for this.

### 5. Defer `/how-this-was-built/` until its public targets are current

Do **not** add new internal-link weight from the build report into `/design-system/` or
`/design-tokens/` in this pass. Both pages are still `noindex` reference material. The live
`/design-tokens/` copy still describes the pre-Imladris token contract rather than the
current `theme.json` vocabulary, while `/design-system/` is current enough in voice but is
still a reference/specimen surface rather than an intentional crawl target. Refresh those
public references first, then decide whether they should remain `noindex` before routing new
internal links to them.

## Route-by-route change set

### A. Home (`36`, `/`) - DB body

Add the missing role/internal-link and closing CTA while keeping the current hero thesis
(`Trust must be structural.`) intact.

Changes:

- Add an in-body descriptive anchor to `/about/` with the exact link text
  **`WordPress AI Solutions Engineer`** near the hero/intro so the role is visible, not only
  present in metadata.
- Add a descriptive bridge from the Three Rings framework to `/ai-enablement/` using the
  anchor text **`Expose · Govern · Attest`**.
- Add a closing CTA section directly below the framework block:
  - eyebrow or kicker: `Work with me`
  - body copy:
    `Have a WordPress AI build that has to be auditable? Tell me what you're trying to verify, govern, or ship.`
  - primary button: **`Start a conversation`** -> `/contact/`

Do **not** replace the H1, remove the existing Work section, or move the rings back into the
template file. The route remains DB-owned.

### B. About (`6`, `/about/`) - DB body

Fix the live link bugs and add the visible role string needed by the home-page internal link.

Changes:

- Change the hero CTA **`Get in touch`** target from `mailto:htperkins@gmail.com` to
  `/contact/`.
- Remove the `https://hperkins.com/resume` link from the chronology/footer sentence and keep
  only the on-site PDF link:
  `/wp-content/uploads/2026/06/henry-perkins-ats-resume.pdf`
- Add or revise the visible role line in the hero area so the page clearly presents
  **`WordPress AI Solutions Engineer`** as the public on-site role wording touched in this pass.

Do **not** widen the edit into a full About-page rewrite, and do **not** touch the ATS PDF.

### C. Flavor Agent hub (`120`, `/work/flavor-agent/`) - DB body

Turn the hub into the spoke/router page the SEO brief describes.

Changes:

- Add or revise in-body prose so the spoke links read as:
  - **`the governance model`** -> `/work/flavor-agent/ai-governance/`
  - **`the live demo`** -> `/work/flavor-agent/demo/`
- Add an internal dependency link to `/work/upstream-core-ai-stack/` with the phrase
  **`built on the WordPress 7.0 AI stack`**.
- Add the closing CTA block:
  - primary: **`Discuss a governed AI build`** -> `/contact/`
  - secondary: **`View the code`** -> `https://github.com/henryperkins/flavor-agent`

### D. Flavor Agent spokes (`12`, `11`) - DB bodies

Add the missing conversion CTA to both spoke pages without rewriting their proof sections.

For each of:

- `12` `/work/flavor-agent/ai-governance/`
- `11` `/work/flavor-agent/demo/`

append a closing CTA block:

- primary: **`Discuss a governed AI build`** -> `/contact/`
- secondary: **`View the code`** -> `https://github.com/henryperkins/flavor-agent`

Keep the existing spoke-nav line and proof images intact.

### E. Upstream core AI stack (`25`, `/work/upstream-core-ai-stack/`) - DB body

Add the reverse cross-links the brief calls for.

Changes:

- Add a short cross-link bridge to the downstream build pages:
  - `/work/flavor-agent/`
  - `/work/ai-provider-for-codex/`
- Use **`what I built on top`** as the lead-in phrase for that bridge, with the project
  names themselves as the clickable anchors.
- Add the closing CTA block:
  - primary: **`Discuss a governed AI build`** -> `/contact/`

Do **not** invent a synthetic repo CTA here; the brief did not call for one on this page.

### F. AI Provider for Codex (`10`, `/work/ai-provider-for-codex/`) - DB body

Add the missing internal dependency link and closing CTA.

Changes:

- Add an internal link to `/work/upstream-core-ai-stack/` using the anchor text
  **`the WordPress AI Client`**.
- Add the closing CTA block:
  - primary: **`Discuss a governed AI build`** -> `/contact/`
  - secondary: **`View the code`** -> `https://github.com/henryperkins/ai-provider-for-codex`

### G. DJ Lee (`17`, `/work/dj-lee-voices-of-judah/`) - DB body

Add the missing closing conversion CTA only.

Changes:

- append the closing CTA block:
  - primary: **`Discuss a governed AI build`** -> `/contact/`

Do **not** add a repo secondary here in this pass; the SEO brief only named explicit repo
secondaries for Flavor Agent and the Codex provider.

### H. AI Enablement (`175`, `/ai-enablement/`) - DB body

Add the three worked-example links from the ring sections into the essay body.

Changes:

- In the **Expose** section, add a link to `/work/flavor-agent/demo/` with the anchor
  **`exposing abilities to an MCP agent`**.
- In the **Govern** section, add a link to `/work/flavor-agent/ai-governance/` with the
  anchor **`owner-controlled review gates`**.
- In the **Attest** section, add a link to `/work/upstream-core-ai-stack/` with the anchor
  **`provenance in WordPress core`**.

Keep the essay's argument and proof tone intact; this is a link-layer edit, not a rewrite.

### I. Govern for the Return (`238`, `/2026/06/govern-for-the-return/`) - DB body

Add the missing essay-to-pillar bridge.

Changes:

- Add one short sentence or clause linking to `/ai-enablement/` with the anchor text
  **`the trust model behind this`**.

Do not reframe the essay or rewrite its defect/history posture.

### J. Work (`13`, `/work/`) - DB body

Add the missing closing CTA to the work hub so the route the other case studies converge on
does not end without a contact path.

Changes:

- Add a closing CTA section below the work-entry list and above the colophon:
  - eyebrow or kicker: `Work with me`
  - body copy:
    `If you need a WordPress AI build that can be inspected, governed, and shipped without hand-waving, tell me what has to hold up.`
  - primary button: **`Discuss a governed AI build`** -> `/contact/`

Do **not** rewrite the work-entry grid or replace the existing artifact rows.

## Shared CTA block shape

Use the same content shape at the end of each work/case-study page touched here:

- paragraph or eyebrow introducing the close
- one short sentence, not a paragraph wall
- primary button
- optional secondary repo button only where resolved above

Copy:

- work/case-study primary: **`Discuss a governed AI build`**
- homepage primary: **`Start a conversation`**

Destination:

- all primary CTAs -> `/contact/`

This stays in content so each page body remains independently editable.

## Content-handling guardrails

- Keep the evidence-first voice. No invented outcomes, no ranking claims, no filler.
- Prefer inserting or replacing the minimum block markup needed for the new links/CTAs.
- Preserve existing screenshots, artifact rows, and proof bars.
- Where a route is DB-owned but not snapshot-tracked today (the case-study pages and the
  essay post), export a temporary pre-edit backup before updating it. Use one-off WP-CLI
  exports for those backups; do **not** make this pass depend on additional helper scripts.

## Files and surfaces touched

### WordPress stored content

- posts/pages `36`, `6`, `13`, `120`, `12`, `11`, `25`, `10`, `17`, `175`, `238`

### Theme files

- `content/page-snapshots/front-page.html`
- `content/page-snapshots/about.html`
- `content/page-snapshots/work.html`
- `content/page-snapshots/ai-enablement.html`

## Verification

After implementation:

1. Backup the DB-owned bodies before editing the unsnapshotted routes.
2. Refresh the four tracked snapshot files directly from WordPress (`36`, `6`, `13`, `175`)
   with `wp post get ... --field=post_content`, then inspect the snapshot diffs to confirm
   they only contain the intended link/CTA edits.
3. Run `git diff --check`.
4. Run `node /home/dev/hperkinsblog/scripts/verify-hperkins-tokens.js` to re-check the live
   theme surfaces that this pass touches through DB content.
5. Run `node scripts/verify-ring-cards-mobile.js` to confirm the new homepage and
   `/ai-enablement/` link-layer edits did not introduce narrow-viewport overflow.
6. Spot-check the live routes with `curl`/HTML grep for the new anchors and CTA targets:
   - `/`
   - `/about/`
   - `/work/`
   - `/work/flavor-agent/`
   - `/work/flavor-agent/ai-governance/`
   - `/work/flavor-agent/demo/`
   - `/work/upstream-core-ai-stack/`
   - `/work/ai-provider-for-codex/`
   - `/work/dj-lee-voices-of-judah/`
   - `/ai-enablement/`
   - `/2026/06/govern-for-the-return/`
7. Confirm `/about/` no longer emits `mailto:htperkins@gmail.com` or
   `https://hperkins.com/resume`.

## Why this design

This is the smallest change set that actually finishes the local portion of the SEO brief.
It improves crawl paths and conversion paths where the live site is currently thin, but it
does so **without** reopening the theme/page ownership model, without dragging in server
operations, without routing new internal-link weight into stale `noindex` references, and
without blocking on any Henry-only external account decisions.
