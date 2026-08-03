# Job Placement Digest — Audit Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the verified, non-editorial findings from the 2026-07-20 review of `/job-placement-digest/` — the live heading-order skip, the broken jump target, the date contradiction, the missing closing CTA panel, and the mobile padding squeeze — without touching the page's argument or ordering.

**Architecture:** The page splits across two owners. The **body** lives in `post_content` of page **433** in the WordPress database and is edited through WP-CLI; the **presentation** lives in the `hperkins-tokens` theme repo (`style.css`, `patterns/`, `content/page-snapshots/`). Every body edit must be followed by a snapshot re-export, in that order — the snapshot is a one-way mirror (DB → file) and re-exporting first would overwrite the fix.

**Tech Stack:** WordPress block markup (`wp:*` comment delimiters), WP-CLI via `studio wp`, the theme's dependency-free Node verifiers in `scripts/`, SQLite-backed Studio site.

## Global Constraints

- **Page 433** (`job-placement-digest`) is the only page in scope. Live and local bodies are identical as of 2026-07-20; both carry the unfixed markup.
- **Body edits use a file inside the site tree.** `studio wp post update 433 <file>`. The file must live under `C:\Users\htper\Studio\henry-perkins\` (use `tmp/`) — the PHP runtime cannot read the system temp dir. **Never pass `-` for stdin: it wipes `post_content`.**
- **Order is fixed:** edit body → verify rendered output → `node scripts/export-page-snapshots.js` → `node scripts/verify-content-ownership.js`. Never export before the body edit lands.
- **Bump `style.css` `Version:`** and mirror it in `readme.txt` with a changelog entry whenever `style.css` or `theme.json` changes. Current version: **0.3.48** → target **0.3.49**.
- Theme repo: `C:\Users\htper\hperkins-tokens` (current branch `design/condensed-council-header-phase-1`). Site root: `C:\Users\htper\Studio\henry-perkins`.
- Verifiers need standalone PHP with `pdo_sqlite` (Studio's bundled PHP lacks it) and a raised `memory_limit` via `PHPRC`. Set `HPERKINS_WP_PATH` to the site root.

---

## Audit corrections — read before starting

Four claims in `output/audits/job-placement-digest-2026-07-20/audit.md` did not survive checking against the source. The plan implements the corrected version, not the audit text.

| Audit claim | Finding |
|---|---|
| "`Start a conversation` is visually quieter than `See the work`" | **Backwards.** `style.css:2245-2256` gives the default button a solid `brand--default` background with inverse text; `style.css:2268-2272` makes `is-style-secondary` transparent with a 1px inset border. In the body, `Start a conversation` is the default and `See the work` is `is-style-secondary` — contact already renders louder. No change needed. |
| "the jump target does not receive programmatic focus" | **Understated.** The target is `<div id="resume-keyword-bank" aria-hidden="true"></div>` — an empty div hidden from the accessibility tree. It is not merely unfocusable; it is a target screen readers cannot land on at all. |
| Heading skip is an open finding | **Already diagnosed by Henry.** `docs/typography-followups.md:77-85` records it as "Not done — still open" and warns that re-exporting the snapshot before re-applying the H2 would silently revert it. This plan honours that ordering. |
| (missed by the audit) | **`verify-prominent-actions.js:501-503` is failing right now.** It asserts `/job-placement-digest/` renders `.hp-digest-cta h2` with the text `Bring me the problem behind the ticket.` The theme's seed pattern `patterns/job-placement-digest.php:175-194` defines that closing panel; the stored body has only bare `wp:buttons`. The pattern and the body have drifted. |

**Also note:** the repo snapshot has fallen ~250 lines behind the body (12,669 bytes vs 29,055). Task 1's export closes that gap as a side effect.

---

## File Structure

| File | Responsibility | Tasks |
|---|---|---|
| `post_content` of page 433 (DB) | The page's argument and markup — heading levels, anchors, dateline, closing panel | 1, 2, 3, 4 |
| `C:\Users\htper\Studio\henry-perkins\tmp\page-433.html` | Scratch staging file for body edits (not tracked) | 1, 2, 3, 4 |
| `content/page-snapshots/job-placement-digest.html` | Versioned mirror of the body; regenerated, never hand-edited | 1, 2, 3, 4 |
| `style.css` | Mobile padding override; version bump | 5 |
| `readme.txt` | Version mirror + changelog entry | 5 |
| `docs/typography-followups.md` | DB-side work tracker — §3 entry and the stale §5 claim | 6 |

---

### Task 1: Fix the live H1 → H3 heading skip

The operational-story title is the page's first heading after the H1 and is currently `level:3`, so the rendered order is H1 → H3 → H2. `.hp-operational-story__title` pins `font: var(--wp--custom--type--h-4)` (`style.css:876`, `:2168`), so promoting it to H2 is visually neutral.

**Files:**
- Modify: page 433 `post_content` (DB) — the `wp:heading` at body line 59
- Modify: `content/page-snapshots/job-placement-digest.html` (regenerated, not hand-edited)

**Interfaces:**
- Produces: a body whose first two headings are H1 then H2. Tasks 2-4 edit the same staging file and must re-dump it fresh each time rather than reusing a stale copy.

- [ ] **Step 1: Dump the current body into the site tree**

```powershell
$site = "C:\Users\htper\Studio\henry-perkins"
New-Item -ItemType Directory -Force "$site\tmp" | Out-Null
studio wp post get 433 --field=post_content > "$site\tmp\page-433.html"
Select-String -Path "$site\tmp\page-433.html" -Pattern 'hp-operational-story__title'
```

Expected: two lines, the `wp:heading` comment carrying `"level":3` and the `<h3 …>` tag.

- [ ] **Step 2: Confirm the skip is live (the failing test)**

```powershell
$h = (Invoke-WebRequest "https://hperkins.blog/job-placement-digest/" -UseBasicParsing).Content
[regex]::Matches($h, '<h([1-6])[^>]*hp-operational-story__title') | ForEach-Object { "h" + $_.Groups[1].Value }
```

Expected: `h3` — this is the defect. Record it; Step 5 re-runs this and expects `h2`.

- [ ] **Step 3: Promote the heading to H2**

Replace both halves of the block. The `className` and text are unchanged; only the level moves.

```html
<!-- wp:heading {"level":2,"className":"hp-operational-story__title"} -->
<h2 class="wp-block-heading hp-operational-story__title">Support first, then the SE seat</h2>
<!-- /wp:heading -->
```

- [ ] **Step 4: Write the body back**

```powershell
studio wp post update 433 "C:\Users\htper\Studio\henry-perkins\tmp\page-433.html"
```

Expected: `Success: Updated post 433.` If it prints `Success` but the body empties, the file argument was dropped — restore from `_backup-hperkins-tokens-20260720` or a revision before continuing.

- [ ] **Step 5: Verify the rendered order locally, then live**

```powershell
studio wp eval 'echo wp_kses_post( apply_filters( "the_content", get_post( 433 )->post_content ) );' > "$env:TEMP\r.html"
[regex]::Matches((Get-Content "$env:TEMP\r.html" -Raw), '<h([1-6])[^>]*class="[^"]*wp-block-heading') | ForEach-Object { "h" + $_.Groups[1].Value }
```

Expected first two: `h1`, `h2`. No `h3` before the first `h2`.

- [ ] **Step 6: Re-export the snapshot and verify ownership**

```powershell
$env:HPERKINS_WP_PATH = "C:\Users\htper\Studio\henry-perkins"
node scripts/export-page-snapshots.js
node scripts/verify-content-ownership.js
```

Expected: export rewrites `content/page-snapshots/job-placement-digest.html` from ~12.7KB to ~29KB; `verify-content-ownership.js` passes with matching sha256 for the digest.

- [ ] **Step 7: Commit**

```bash
git add content/page-snapshots/job-placement-digest.html
git commit -m "a11y: promote the digest operational-story title H3 -> H2 in the page body

Closes the H1 -> H3 skip that 61e1140 fixed in the snapshot only. The
stored body now carries level:2 and the snapshot is re-exported from it,
which also closes the ~250-line drift the snapshot had accumulated since
the 2026-07-18 Resume + Keyword Bank addition.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Make `#resume-keyword-bank` a reachable jump target

`Read the verified artifacts` (`hp-artifact__link`) points at `#resume-keyword-bank`, which resolves to an empty `aria-hidden="true"` div. The scroll works; the target is invisible to assistive tech and cannot take focus.

**Files:**
- Modify: page 433 `post_content` — remove the `wp:html` stub, move the anchor onto the section group
- Modify: `content/page-snapshots/job-placement-digest.html` (regenerated)

**Interfaces:**
- Consumes: the body as left by Task 1. Re-dump with Step 1 of Task 1 before editing.
- Produces: `id="resume-keyword-bank"` on the `hp-resume-keyword-bank` group element.

- [ ] **Step 1: Confirm the broken target (the failing test)**

```powershell
$h = (Invoke-WebRequest "https://hperkins.blog/job-placement-digest/" -UseBasicParsing).Content
[regex]::Matches($h, '<[^>]*id="resume-keyword-bank"[^>]*>') | ForEach-Object { $_.Value }
```

Expected: `<div id="resume-keyword-bank" aria-hidden="true"></div>` — hidden and empty.

- [ ] **Step 2: Delete the stub block**

Remove these three lines from the body in full:

```html
<!-- wp:html -->
<div id="resume-keyword-bank" aria-hidden="true"></div>
<!-- /wp:html -->
```

- [ ] **Step 3: Put the anchor on the section group**

The `hp-resume-keyword-bank` group immediately follows. Add `"anchor":"resume-keyword-bank"` to its attributes and `id="resume-keyword-bank"` to its tag — matching how `hp-non-negotiables` and `hp-validated-set` already carry their anchors. Change only the opening delimiter and tag; leave the inline `style` string byte-identical.

```html
<!-- wp:group {"align":"wide","anchor":"resume-keyword-bank","className":"hp-resume-keyword-bank", … } -->
<div id="resume-keyword-bank" class="wp-block-group alignwide hp-resume-keyword-bank has-border-color has-green-200-border-color has-parchment-50-background-color has-background" style=" … ">
```

- [ ] **Step 4: Add scroll offset and focus affordance**

Append to `style.css` beside the other page-section rules. `scroll-margin-block-start` keeps the heading clear of the sticky header; `tabindex` is added at runtime by Step 5 so the target can receive focus without breaking block validation.

```css
/* Jump targets: keep the landed heading clear of the header, and make the
   section focusable so keyboard/AT users land inside it, not just near it. */
#resume-keyword-bank,
#non-negotiables,
#validated-set {
	scroll-margin-block-start: var(--wp--preset--spacing--6);
}
#resume-keyword-bank:focus-visible,
#non-negotiables:focus-visible,
#validated-set:focus-visible {
	outline: 2px solid var(--wp--custom--border--brand);
	outline-offset: 4px;
}
```

- [ ] **Step 5: Move focus on in-page navigation**

**DECISION REQUIRED — do not implement blind.** Adding `tabindex="-1"` needs a home. Check whether the theme already ships a front-end script (`assets/`, or a `wp_enqueue_script` in `functions.php`) before creating a new one; if it does, extend it rather than adding a second file. Confirm the chosen host with Henry, then add:

```js
// Fragment links must land focus inside the target, not merely scroll to it.
document.addEventListener( 'click', ( event ) => {
	const link = event.target.closest( 'a[href^="#"]' );
	if ( ! link ) { return; }
	const target = document.getElementById( decodeURIComponent( link.hash.slice( 1 ) ) );
	if ( ! target ) { return; }
	if ( ! target.hasAttribute( 'tabindex' ) ) { target.setAttribute( 'tabindex', '-1' ); }
	target.focus( { preventScroll: true } );
} );
```

- [ ] **Step 6: Write back, re-export, verify**

```powershell
studio wp post update 433 "C:\Users\htper\Studio\henry-perkins\tmp\page-433.html"
node scripts/export-page-snapshots.js
node scripts/verify-content-ownership.js
```

Expected: pass. Then confirm no `aria-hidden` stub survives:

```powershell
studio wp post get 433 --field=post_content | Select-String 'aria-hidden="true"></div>'
```

Expected: no matches.

- [ ] **Step 7: Commit**

```bash
git add content/page-snapshots/job-placement-digest.html style.css
git commit -m "a11y: make the digest resume anchor a real jump target

The fragment resolved to an empty aria-hidden div, so assistive tech had
nothing to land on. Move the anchor onto the section group, add scroll
offset, and focus the target on fragment navigation.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Reconcile the two dates

The hero dateline reads `13 Jul 2026`; the screening notes inside the validated set read `Two passes ran on July 18, 2026`. A reader cannot tell which date describes the market state.

**Files:**
- Modify: page 433 `post_content` — the `hp-digest__dateline` paragraph
- Modify: `content/page-snapshots/job-placement-digest.html` (regenerated)

**DECISION REQUIRED — Henry picks one.** Both are one-line edits; the choice is editorial:

- **A (recommended):** the dateline carries the verification date, since that is what a hiring reader is dating. Replace `13 Jul 2026` with `verified 18 Jul 2026`.
- **B:** keep authorship and verification separate — `13 Jul 2026 · verified 18 Jul` — which is honest but spends more of a small line.

- [ ] **Step 1: Apply the chosen wording**

Option A:

```html
<!-- wp:paragraph {"className":"hp-digest__dateline"} -->
<p class="hp-digest__dateline">verified 18 Jul 2026 · WordPress since 2012 · Chicago</p>
<!-- /wp:paragraph -->
```

- [ ] **Step 2: Write back, re-export, verify**

```powershell
studio wp post update 433 "C:\Users\htper\Studio\henry-perkins\tmp\page-433.html"
node scripts/export-page-snapshots.js
node scripts/verify-content-ownership.js
```

Expected: pass, and the rendered dateline no longer contradicts the screening notes.

- [ ] **Step 3: Commit**

```bash
git add content/page-snapshots/job-placement-digest.html
git commit -m "content: date the digest by its verification pass, not its authoring date

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Restore the `.hp-digest-cta` closing panel

`scripts/verify-prominent-actions.js:501-503` asserts the page renders `.hp-digest-cta h2` reading `Bring me the problem behind the ticket.`. The seed pattern defines that panel; the stored body ends in bare `wp:buttons` with no wrapper, eyebrow, or heading. The verifier is failing.

**Files:**
- Modify: page 433 `post_content` — replace the trailing `wp:buttons` block
- Reference: `patterns/job-placement-digest.php:175-194` (the canonical markup — copy from the file, do not retype)
- Modify: `content/page-snapshots/job-placement-digest.html` (regenerated)

- [ ] **Step 1: Run the verifier to see it fail**

```powershell
$env:HPERKINS_ORIGIN = "https://hperkins.blog"
node scripts/verify-prominent-actions.js
```

Expected: FAIL on the `digestHeading` assertion for `/job-placement-digest/`. Capture the exact message — Step 4 expects it gone.

- [ ] **Step 2: Read the canonical panel out of the pattern**

```powershell
$t = "C:\Users\htper\hperkins-tokens"
Get-Content "$t\patterns\job-placement-digest.php" | Select-Object -Skip 174 -First 22
```

This is the source of truth for the panel markup — the eyebrow, the H2, and the `.hp-action-rail` buttons.

- [ ] **Step 3: Replace the trailing buttons block**

Delete the body's final `wp:buttons` block (the one wrapping `Start a conversation` and `See the work`) and paste the pattern's `hp-digest-cta` section in its place. Keep the two buttons' existing hrefs and styles — `Start a conversation` stays the default (solid) button and `See the work` stays `is-style-secondary`.

- [ ] **Step 4: Write back, re-export, verify**

```powershell
studio wp post update 433 "C:\Users\htper\Studio\henry-perkins\tmp\page-433.html"
node scripts/export-page-snapshots.js
node scripts/verify-content-ownership.js
node scripts/verify-prominent-actions.js
```

Expected: all three pass. `verify-prominent-actions.js` should now find `railCount: 1, panelCount: 1` and the expected heading.

- [ ] **Step 5: Commit**

```bash
git add content/page-snapshots/job-placement-digest.html
git commit -m "content: restore the digest closing action panel

The stored body ended in bare buttons while patterns/job-placement-digest.php
and verify-prominent-actions.js both expect the .hp-digest-cta panel. Brings
the body back in line with the pattern; the verifier passes again.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Relieve the mobile padding squeeze

At 390px the three bordered sections reduce the text column to ~261px. The cause is `padding-left`/`padding-right: var(--wp--preset--spacing--6)` — but these are **inline styles on the block**, so a stylesheet rule cannot win without either `!important` or lifting the padding out of the block attributes.

**Files:**
- Modify: `style.css` (rule + `Version:` header)
- Modify: `readme.txt` (version mirror + changelog)

**DECISION REQUIRED — pick the mechanism:**

- **A (recommended):** keep the inline styles and add one narrow-viewport override using `!important`. Self-contained in the theme, no body edit, no snapshot churn. The `!important` is justified and should carry the comment below.
- **B:** strip `padding-left`/`padding-right` from all three blocks' attributes and own the padding in CSS. Cleaner cascade, but it is a fourth body edit plus re-export, and an editor re-saving the block in Gutenberg could reintroduce the inline values.

- [ ] **Step 1: Measure the current column (the failing test)**

```powershell
node scripts/verify-typography.js --report
```

Note the reported measure for the digest's bordered sections at the mobile viewport. Expected: ~261px text column.

- [ ] **Step 2: Add the override (Option A)**

```css
/* The digest's bordered sections carry spacing-6 side padding as inline block
   styles, which leaves ~261px of text column at 390px. Only !important can
   reach an inline style; the alternative is stripping padding from the block
   attributes, where an editor re-save would reintroduce it. */
@media (max-width: 600px) {
	.hp-resume-keyword-bank,
	.hp-non-negotiables,
	.hp-validated-set {
		padding-inline: var(--wp--preset--spacing--4) !important;
	}
}
```

- [ ] **Step 3: Bump the version**

`style.css` header `Version: 0.3.48` → `Version: 0.3.49`. Mirror in `readme.txt` and add:

```
= 0.3.49 =
* A11y: the digest's operational-story title is H2, closing the H1 -> H3 skip.
* A11y: #resume-keyword-bank is a real, focusable jump target.
* Mobile: relieve side padding on the digest's bordered sections at <=600px.
```

- [ ] **Step 4: Verify**

```powershell
node scripts/verify-typography.js
node scripts/verify-style-token-usage.js
node scripts/verify-performance-assets.js
```

Expected: pass. The measure at 390px should widen by roughly two spacing steps.

- [ ] **Step 5: Commit**

```bash
git add style.css readme.txt
git commit -m "release: 0.3.49 — digest a11y fixes and mobile padding relief

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Correct the DB-side tracker

`docs/typography-followups.md` contradicts itself: §3 (lines 77-85) correctly records the digest heading skip as open, while §5 (lines 110-113) still claims both skips "were fixed 2026-07-19."

**Files:**
- Modify: `docs/typography-followups.md`

- [ ] **Step 1: Close the §3 entry**

Replace the `/job-placement-digest/` bullet's "**Not done — still open.**" opening with **Done (0.3.49)**, and record that the snapshot drift closed with the same export.

- [ ] **Step 2: Fix the stale §5 claim**

Replace:

```
The (`/work/` and `/job-placement-digest/` heading-order
skips were fixed 2026-07-19 — see §3.)
```

with:

```
(`/work/` was fixed in 0.3.48; `/job-placement-digest/` in 0.3.49 — see §3.
Both were claimed fixed on 2026-07-19 while only the snapshots had changed.)
```

- [ ] **Step 3: Verify and commit**

```powershell
node scripts/verify-content-ownership-docs.js
```

```bash
git add docs/typography-followups.md
git commit -m "docs: close the digest heading-order item and fix the stale §5 claim

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Out of scope — needs Henry's input before it can be planned

The audit's three structural recommendations cannot be specified without content only Henry has. They are listed here so they are not lost, not because they are ready.

1. **Live-status module after the hero** (audit §1). Needs the current `confirmed live` / `delisted` / `pending verification` counts and a verification date, plus a decision on whether those numbers get maintained by hand on every screening pass — an unmaintained status module is worse than none.
2. **Result before method** (audit §2). Moving the validated set above the resume bank is a large reordering of a carefully sequenced argument. The page currently builds: standard → why it matters → the path → proof → screen → result. Inverting it is an editorial call about whether the reader is a hiring manager scanning or a peer reading.
3. **Split or collapse the resume/keyword appendix** (audit §3). ~230 of the body's 457 lines. Options: `wp:details` wrapper, or its own page at `/resume/`. The second changes the site's page contract and would need a new entry in `PAGE_CONTRACTS`.

**Not doing:** the audit's CTA-prominence recommendation. Corrected above — contact already renders as the louder button.

---

## Self-review

**Spec coverage.** Audit §1 dates → Task 3; §1 status module → out of scope (1). §2 result-before-method → out of scope (2); §2 CTA prominence → rejected with evidence; §2 "five postings" ambiguity → **not covered, see below**. §3 mobile length → out of scope (3); §3 card padding → Task 5. §4 navigation → no finding. §5 heading skip → Task 1; §5 jump focus → Task 2. Plus two findings the audit missed: the failing prominent-actions verifier (Task 4) and the tracker contradiction (Task 6).

**Gap found and left open deliberately:** the audit's "five postings can be misread" point (§2) is a wording change to the H2 `One page. Five postings. Thirty-four audited terms.` The line immediately below it already says the five are Solutions Engineer postings used for the keyword bank, so the ambiguity is mild and the fix is a headline rewrite — editorial, and it belongs with out-of-scope item 3 rather than in a mechanical task.

**Type consistency.** Class names used across tasks are taken verbatim from the body dump and verified against `style.css`: `hp-operational-story__title`, `hp-resume-keyword-bank`, `hp-non-negotiables`, `hp-validated-set`, `hp-digest-cta`, `hp-action-rail`, `hp-digest__dateline`. Anchors `#resume-keyword-bank`, `#non-negotiables`, `#validated-set` match Task 2's CSS. Version `0.3.49` is consistent across Tasks 5 and 6.

**Ordering.** Tasks 1-4 each touch the body and each end with an export. Run them in order and re-dump the staging file at the start of each — a stale dump would silently revert the previous task.
