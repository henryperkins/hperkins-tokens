# Published Content Drift Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the live portfolio's current claims with primary evidence while preserving drafts and production-only state.

**Architecture:** Use source contracts and tracked snapshots for theme-owned or mirrored content, bounded exact replacements for the local Studio database, and fresh production reads followed by targeted WordPress.com page updates. Push the verified theme commit to `main`, which deploys automatically, only after production page bodies match the new mirrors.

**Tech Stack:** WordPress block markup, PHP, dependency-free Node.js verifiers, WordPress Studio/WP-CLI, WordPress.com content API, Playwright CLI, GitHub Actions.

## Global Constraints

- Canonical current release wording is `v0.1.0-rc.3`; preserve the dated RC1 contracts row in page 433.
- Preserve all seven drafts and the untracked `.tmp-bundle-check-20260721/` directory.
- Do not migrate theme-owned asset URLs in this change.
- Do not overwrite production with the older Studio database.
- Production page writes are limited to IDs 6, 13, 25, 36, 120, and 175.

---

### Task 1: Pin the corrected source contracts

**Files:**
- Modify: `scripts/verify-header.js`
- Create: `scripts/verify-published-content-drift.js`
- Test: `scripts/verify-published-content-drift.js`

- [ ] Add exact assertions for RC3, the static Cloudflare Worker wording, qualified Python, the deck URL, Home resolved-state classes, and current contribution states.
- [ ] Run `node scripts/verify-published-content-drift.js` and confirm it fails on the existing stale source.
- [ ] Update the source and snapshot files named in Tasks 2 and 3.
- [ ] Re-run the verifier and confirm it passes.

### Task 2: Correct theme-owned release surfaces

**Files:**
- Modify: `patterns/wapuu-home-hero.php`
- Modify: `inc/council-header.php`
- Modify: `scripts/verify-header.js`
- Modify: `CLAUDE.md`

- [ ] Replace the current Flavor Agent chip with `v0.1.0-rc.3 · Jul 2026`.
- [ ] Replace the Council status with `Release candidate · v0.1.0-rc.3`.
- [ ] Update the header verifier and architecture documentation to match.
- [ ] Run `node scripts/verify-header.js --source-only` and confirm success.

### Task 3: Correct mirrored database content

**Files:**
- Modify: `patterns/about-resume.php`
- Modify: `patterns/work-index.php`
- Modify: `patterns/ai-enablement.php`
- Modify: `content/page-snapshots/about.html`
- Modify: `content/page-snapshots/work.html`
- Modify: `content/page-snapshots/front-page.html`
- Modify: `content/page-snapshots/ai-enablement.html`

- [ ] Update RC3 release text and links in About and Work.
- [ ] Replace the About DJ Lee sentence with the static Cloudflare Worker delivery account.
- [ ] Qualify Python as familiarity without shipped evidence.
- [ ] Correct the About contribution row for PR #757 and PR #49.
- [ ] Assign resolved Home entries `is-status-merged` while retaining Flavor Agent as `is-status-review`.
- [ ] Ensure the AI Enablement deck action points to the existing public PPTX.
- [ ] Run the published-content drift verifier and snapshot parity checks.

### Task 4: Update the local Studio database safely

**Files:**
- Create temporarily: `C:/Users/htper/Studio/henry-perkins/tmp/apply-published-content-drift-remediation.php`
- Backup: `C:/Users/htper/Studio/henry-perkins/output/backups/pre-published-content-drift-20260721.sql`

- [ ] Export the local database before writes.
- [ ] Apply exact-count replacements to local pages 6, 13, 25, 36, 120, and 175.
- [ ] Remove the temporary apply script after successful execution.
- [ ] Run `node scripts/verify-content-ownership.js` with the guarded local environment.

### Task 5: Update production pages through WordPress.com

**Interfaces:**
- Consumes: fresh `pages.get` results for IDs 6, 13, 25, 36, 120, and 175.
- Produces: published page bodies with unchanged titles, slugs, parents, and statuses.

- [ ] Re-fetch every target with `context=edit`; assert RC1 counts of 1/3/2 on pages 6/13/120, eight `is-status-review` tokens on page 36, one `href="#"` on page 175, and the two `Three contributions` plus one `as of today` and three `PR #49` references on page 25.
- [ ] Apply the approved replacements with `pages.update` and `user_confirmed: true`.
- [ ] Inspect every `_content_warnings` response and stop if WordPress strips content.
- [ ] Re-fetch every page and assert the corrected text and absence of the stale text.

### Task 6: Verify, commit, deploy, and check live

**Files:**
- Modify: only the files listed in Tasks 1-3 plus these two plan documents.

- [ ] Run PHP lint, targeted Node tests, source verifiers, database ownership checks, and `git diff --check`.
- [ ] Review `git diff` and confirm the untracked bundle-check directory remains untouched.
- [ ] Commit the verified changes and push `main` to trigger deployment.
- [ ] Inspect the GitHub publish and verify workflows without treating the three known unrelated browser-gate failures as resolved.
- [ ] Re-check Home, About, Work, Flavor Agent, AI Enablement, and Upstream Contributions at desktop and mobile widths; verify the deck returns HTTP 200.
