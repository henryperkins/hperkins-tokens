# Imladris migration — design / implementation plan

**Date:** 2026-06-20
**Theme:** `hperkins-tokens` (FSE child of `assembler`), active on https://hperkins.blog
**Source:** `Imladris.zip` → `design_handoff_imladris/` (extracted at `/home/dev/imladris-handoff/`)
**Branch:** `imladris` (theme repo `wp-content/themes/hperkins-tokens/.git`)

## Decisions (confirmed with user)
- **Work target:** in-place on the `imladris` branch. The live site reflects each commit once caches clear; the theme git repo is the rollback/review surface.
- **Cadence:** run the *whole* migration end-to-end, present one consolidated diff. No droplet deploy.
- **Approach:** **re-point + restyle** the existing evidence layer rather than rebuild from scratch. The existing patterns are already native core blocks driven by token variables with status conveyed by rule-color **and** a redundant word — exactly Imladris's architecture. We adopt Imladris `theme.json`, re-point the `--hp-*` alias layer onto Imladris tokens, restyle to the parchment/evergreen/gold + serif look, update block-attribute slugs, and add the genuinely-new pieces.

## Scope
Presentation-only. Do **not** touch post content, pages, menus, custom fields, or CPTs. Do **not** ship the reference `.jsx`/`.dc.html` files. Recreate appearance with `theme.json` presets, patterns, template parts, and theme `styles` — variables only, never hardcoded hex.

## Slug remap (old `hperkins-tokens` → Imladris)
**Color (preset):** base→`parchment-50` · surface→`parchment-200` · hairline→`parchment-300`/`--custom--border--hair` · muted→`ink-500` · contrast→`ink-900` · action→`green-700` (and artifact links→`--custom--artifact-link`/`river-500`) · status-merged→`--custom--status--done`(leaf) · status-review→`amber` · status-pending→`ink-400` · surface-merged→`green-050` · surface-review→`gold-100`.
**Font size (preset):** micro→`2xs` · xs→`2xs` · small→`xs` · medium→`base` (reading→`md`) · large→`lg` · x-large→`xl` · xx-large→`2xl`/`3xl`.
**Font family:** system-text→`body` (EB Garamond) for prose, headings→`display` (Cormorant), eyebrows→`label` (Marcellus) where brand voice; evidence/status labels **stay** `mono` (JetBrains) — machine-set status is intentional.
**Custom:** rule widths (chip 7 / entry 3 / evidence 5 / quote 2 px) and `touch.min` 44px are fixed anatomy → keep as literals in `style.css`. radii→Imladris `radius.*`; shadows→Imladris `shadow.*` (warm); weights→Imladris `weight.*`; grid pitch/tints kept; tracking handled per-rule.

## Phases (each its own commit)
1. **theme.json** — adopt Imladris palette/typography/spacing/custom/styles; preserve `templateParts`; adopt 44/72rem layout; carry `blockGap` + focus/code CSS into `style.css`.
2. **Fonts** — self-host Cormorant Garamond (400–700 + italic 400–500), EB Garamond (400–600 + italic 400), Marcellus 400, JetBrains Mono 400–500 → `assets/fonts/`, matching the `fontFace` `src` filenames already in Imladris `theme.json`. Egress to Google Fonts confirmed.
3. **style.css** — re-point `--hp-*`, restyle look, replace old slug refs, bump header Version/Description.
4. **Assets** — copy brand art into `assets/` (img/, wapuu/), reference from patterns/parts.
5. **Parts + existing patterns** — rebuild `parts/footer.html` (twilight SiteFooter); re-skin `header.html`; update each pattern's block-attribute slugs; re-skin the Wapuu home hero.
6. **New patterns** — Button, Tag, Callout, PullQuote, Badge, Avatar, Input, Subscribe, RingCard.
7. **Templates** — `front-page.html`, case-study page template, `page-about.html` (additive overrides; content untouched).
8. **Finish** — bump Version, flush caches, QA vs reference HTML + specimen cards, verify status redundancy + reduced-motion, consolidated diff.

## Live-site / cache handling
- `style.css` is enqueued with the theme Version as its cache key → **bump Version** to bust it (asset `max-age` is 30 days).
- `theme.json` changes need the theme-JSON cache cleared (`WP_Theme_JSON_Resolver::clean_cached_data()` + object cache flush). DB-saved Site Editor global styles override `theme.json` — check/reset if stale colors persist.
- New fonts/images use new filenames → no cache conflict.

## Rollback
`git checkout main` in the theme repo restores v0.2.9 instantly. Per-step commits allow partial rollback.

## QA
Open `reference/About — Henry Perkins.html` as the pixel reference; compare each `*.card.html.txt` specimen; confirm every status reads by rule-color **and** word; inspect `:root` on the front end to confirm `--wp--custom--*` resolve; check `prefers-reduced-motion`.
