# Typography review 2026-07-19 — database-side follow-ups

The 0.3.46 release implements every repo-side item from the 2026-07-19
site-wide typography review (fluid heading presets, text floors, the 68ch
prose measure, role styles for nav/buttons/footer/archive/search/404, AA
text-token corrections, and the `verify-typography.js` regression verifier).
The items below live in the WordPress database — page bodies, page records,
or Site Editor state — so the theme cannot fix them. Work through them on the
live site, then refresh the tracked snapshots.

> **Code-side follow-ups** — bugs and polish in the theme's own files
> (`verify-typography.js`, `style.css`, the new templates, `readme.txt`) surfaced
> by the implementation review — are tracked separately in
> [`typography-followups-code.md`](./typography-followups-code.md).

## 1. Retire the duplicate published pages (review P0) — **Done (0.3.48)**

Each pair was hash-compared before anything was retired:

| Keep | Retired | Basis |
|---|---|---|
| `/privacy-policy/` | `/privacy-policy-2/` | page 3 is a strictly newer revision (17 Jul vs 22 Jun) and a superset — 11 headings to 8, including a Hosting section 439 lacks |
| `/ai-enablement/` | `/ai-enablement-2/` | byte-identical bodies (sha256 `ac830b15…`) |
| `/work/` | `/work-2/` | page 11's four entries and twelve artifact links merged into page 13 first |
| `/about/` | `/about-2/` | byte-identical bodies (sha256 `465aac07…`) |
| `/work/flavor-agent/ai-governance/` (page 12) | page 443 | byte-identical bodies (sha256 `9c382882…`); 443 shared 12's parent, slug and permalink and was unreachable at any public URL |

Retired by trashing, not deletion — `wp_trash_post()` renames the slug to
`{slug}__trashed`, which frees the route and keeps the row recoverable. The four
`-2` routes now 404; redirects were deliberately deferred rather than shipped
half-built, because once the page is trashed `is_page( 'work-2' )` no longer
fires and a 301 needs 404-time or rewrite-level handling. Revisit with the site
plugin. Nothing linked to any retired record: there are no `nav_menu_item` posts
on this site, and no option, widget or page body referenced the retired IDs or
slugs.

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
- `/work/`: **Done (0.3.48).** The entry titles are H2 in the page body, so the
  rendered order is H1 → H2 → H2 → H2 → H2 across four entries. Visually
  neutral: `.hp-work-template .hp-work__title` pins `font:
  var(--wp--custom--type--h-4)`, so the level change did not alter size. The
  "Selected work" label is the existing hero eyebrow, not a heading.

  Corrects an earlier entry here that claimed this was done on 2026-07-19. It
  was not. Commit `61e1140` changed `content/page-snapshots/work.html` and this
  document; it did not touch the stored page body or `patterns/work-index.php`,
  so production kept rendering H1 → H3 for a further day and the seed pattern
  kept its H3 headings. Snapshot and pattern are both regenerated in 0.3.48, and
  `scripts/verify-no-duplicate-pages.js` now fails if they diverge again.
- `/job-placement-digest/`: **Done (0.3.49).** The stored page body now carries
  `.hp-operational-story__title` as H2, so the rendered order is H1 → H2 with no
  skip. The earlier "Done (2026-07-19)" claim here was wrong in the same way
  `/work/`'s was: `61e1140` promoted the heading in
  `content/page-snapshots/job-placement-digest.html` only, so production kept
  rendering H1 → H3 for a further day. The snapshot had also fallen behind the
  body by roughly 250 lines (the page gained a "Resume + Keyword Bank" section on
  2026-07-18); the body edit landed **before** the re-export, which is the order
  that matters — exporting first would have overwritten the fix with the stale
  mirror. Snapshot and body are back in sync.
- AI Leadership reflection (`/work/ai-provider-for-codex/ai-leadership-4-…/`):
  the visible title is an H2 with no H1 on the page — make it the H1. **Still
  open:** this post is not one of the tracked page snapshots and is not present
  in the local Studio site, so it must be edited on the live site directly.

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
size/contrast, the duplicate pages' un-scoped typography, and the missing H1
on the reflection page. (`/work/`'s heading-order skip was fixed in 0.3.48 and
`/job-placement-digest/`'s in 0.3.49 — see §3. Both were previously recorded
here as fixed on 2026-07-19, when only the snapshots had changed.)
