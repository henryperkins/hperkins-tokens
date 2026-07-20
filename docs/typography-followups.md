# Typography review 2026-07-19 — database-side follow-ups

The 0.3.46 release implements every repo-side item from the 2026-07-19
site-wide typography review (fluid heading presets, text floors, the 68ch
prose measure, role styles for nav/buttons/footer/archive/search/404, AA
text-token corrections, and the `verify-typography.js` regression verifier).
The items below live in the WordPress database — page bodies, page records,
or Site Editor state — so the theme cannot fix them. Work through them on the
live site, then refresh the tracked snapshots.

## 1. Retire the duplicate published pages (review P0)

Compare content/metadata, keep the canonical record, 301 the old slug, then
unpublish:

| Keep | Retire |
|---|---|
| `/privacy-policy/` | `/privacy-policy-2/` |
| `/ai-enablement/` | `/ai-enablement-2/` |
| `/work/` | `/work-2/` |
| `/about/` | `/about-2/` |

There is also a second published AI Governance page record resolving to the
same public URL — merge or unpublish the extra record. Page-scoped CSS and
the snapshot-ownership contract both assume one record per route.

## 2. Redesign the Flavor Agent loop diagram (review P0 — "Critical")

The loop SVG lives in the stored body of `/work/flavor-agent/` (not tracked
in this repo). Per the review:

- Rebuild it as responsive HTML (stacked on narrow screens) with the SVG as
  a wide-viewport overview, or give the SVG a real minimum width inside a
  scrollable figure.
- Replace Inter / generic `ui-monospace` / raw grays with the theme families
  and ink tokens (`ink-500` for secondary annotations; pale gray for
  non-text lines only).
- No text below an *effective* 12px once the SVG scales — check with
  `getScreenCTM()`; `scripts/verify-typography.js` now asserts exactly this.
- Add an equivalent text description or ordered list beside the diagram.

## 3. Stored-body corrections (edit in place, then re-export snapshots)

- `/work/flavor-agent/demo/`: the presenter-note paragraph carries
  `has-xs-font-size` (13px for a long explanatory paragraph). Re-author to
  `sm` (or drop the size class). The embed caption raise shipped in CSS.
- `/ai-enablement/`: the hero dateline carries `has-ink-400-color`
  (~3.9:1 on parchment). Re-author to ink-500/muted, then remove the
  temporary override in `assets/imladris-pages.css` (marked with a comment
  pointing at this file). Also normalize the odd `sm`+body proof chip to
  match its `xs`+mono siblings.
- Front-page Work section: `hp-work__footer` carries `has-small-font-size`,
  a preset this theme does not define (the class is inert). Replace with a
  real preset or remove.
- `/work/`: H1 jumps to H3 entries — add a "Selected work" H2 or promote the
  entry titles to H2.
- `/job-placement-digest/`: H1 jumps to the operational-story H3, and the
  page's only H2 comes after it — insert the missing section H2 (or demote
  and reorder).
- AI Leadership reflection (`/work/ai-provider-for-codex/ai-leadership-4-…/`):
  the visible title is an H2 with no H1 on the page — make it the H1.

After the body edits: `node scripts/export-page-snapshots.js`, then
`node scripts/verify-content-ownership.js`, and bump the pinned `?v=` only if
an upload was replaced in place (per CLAUDE.md).

## 4. Make sure the new templates actually resolve

`templates/archive.html`, `templates/search.html`, and `templates/404.html`
are new in 0.3.46. If the Site Editor holds customized copies of these
templates (`wp_template` posts), the database copies win and the theme files
never render — check for and delete stale DB template records for
`archive`, `search`, and `404`, then `wp cache flush`.

## 5. Verification once deployed

```bash
node scripts/verify-typography.js            # full assertion run (should pass after 1–4)
node scripts/verify-typography.js --report   # non-failing audit of what remains
```

The remaining known failures until §1–§3 land: the Flavor Agent SVG text
size/contrast, the duplicate pages' un-scoped typography, the heading-order
skips listed above, and the missing H1 on the reflection page.
