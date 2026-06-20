# HAND-OFF — Imladris migration of hperkins.blog (resume prompt)

Paste this into a fresh Claude Code session opened at `/home/dev/hperkinsblog` to resume.

## What this is
Re-skinning the **live** WordPress block theme `hperkins-tokens` (child of Assembler, active on
https://hperkins.blog, served by nginx from THIS box `dropitlet`) to the **Imladris design system** —
a Rivendell-inspired parchment/evergreen/mallorn-gold serif editorial system with a status-verified
evidence layer. Full design handoff is extracted at `/home/dev/imladris-handoff/design_handoff_imladris/`
(source zip `/home/dev/hperkinsblog/Imladris.zip`). Read its `README.md` + `CLAUDE_CODE_PROMPT.md`.

## Confirmed decisions (do NOT re-litigate)
- Work IN-PLACE on git branch **`imladris`** in the theme repo `wp-content/themes/hperkins-tokens/.git`.
  Live site reflects each commit (cache permitting); theme git is the rollback/review surface.
- Run the WHOLE migration end-to-end, present ONE consolidated diff. **No droplet deploy.**
- Approach = **re-point + restyle** (keep existing evidence patterns/CSS, re-point tokens, add new pieces).
- Presentation-only: do NOT touch post content, pages, menus, custom fields, CPTs. Do NOT ship the
  reference `.jsx`/`.dc.html` files.

## Current state — branch `imladris`, working tree CLEAN, 5 commits past `main`
1. `944c979` spec/plan → `docs/superpowers/specs/2026-06-20-imladris-migration-design.md`
2. `52fc016` **theme.json** — adopted Imladris (palette/type/spacing/`custom`/`styles`); preserved
   `templateParts` header/footer; 44/72rem layout; `blockGap` spacing--5.
3. `2080557` **fonts** — self-hosted `assets/fonts/{cormorant-garamond,cormorant-garamond-italic,
   eb-garamond,eb-garamond-italic,marcellus,jetbrains-mono}.woff2` (latin variable; names match
   theme.json `fontFace`). WP emits @font-face from theme.json — no enqueue needed.
4. `bca1fb5` **style.css** — re-pointed the `--hp-*` alias layer onto Imladris tokens (140 deterministic
   token remaps); appended the re-skin layer (Cormorant hero, Marcellus eyebrows, gold quote rule +
   content underlines, Bruinen-river artifact links, 3px gold focus ring, inline-code, button
   vocabulary); bumped Version 0.2.9 → **0.3.0**. Braces balanced; all referenced presets/custom exist.
5. `d607177` **assets** — `assets/img/` (Wapuu mascot, 3 Ring-bearers + ring badges, emblem.svg/
   wordmark.svg, valley + three-ages imagery; pngquant-compressed 28M→8.4M, dims/filenames unchanged).

## ⚠️ LIVE-SITE NOTE
The `imladris` branch is checked out, so the live site renders the PARTIAL migration: colors/fonts/most
components are correct, but `parts/footer.html` and `parts/header.html` still use OLD slugs (surface,
hairline, spacing 20/40/50/60, large/small) absent from the Imladris theme.json → footer/header have
collapsed padding, no footer background, a dark hairline. Fixing this is the first Phase-5 task.
- Restore OLD look instantly while paused: `git -C wp-content/themes/hperkins-tokens checkout main`
- Resume: `git -C wp-content/themes/hperkins-tokens checkout imladris`

## Slug remap (old → Imladris) — already applied to style.css; APPLY SAME to parts markup
- spacing: 10→2, 20→3, 30→4, 40→5, 50→6, 60→9, 70→10
- font-size: micro→2xs, small→xs, medium→base, large→lg, x-large→xl, xx-large→2xl (xs stays)
- color (palette slugs for block attrs): base→parchment-50, surface→parchment-200, hairline→parchment-300,
  muted→ink-500, contrast→ink-900, action→green-700, status-merged→leaf, status-review→amber,
  status-pending→ink-400, surface-merged→green-050, surface-review→gold-100
- font-family: mono stays; system-text→body
- Token model: block CSS uses `--hp-*` aliases (defined in style.css `:root`, now → Imladris
  `--wp--preset--*` / `--wp--custom--*`). Never hardcode hex.

## Remaining work

### Phase 5 — parts + existing patterns (next; nothing committed yet)
The 9 existing patterns render via `.hp-*` classes (already re-skinned) — NO structural change. Tasks:
- `patterns/quote-block.php`: `"fontSize":"medium"` + `has-medium-font-size` → `base` / `has-base-font-size`.
- `patterns/wapuu-home-hero.php`: swap hero image `assets/wapuu/wapuu-hero.png` → canonical Imladris
  `assets/img/wapuu-color.png` (keep filemtime cache-bust; update `$..._file` and `$..._src`).
- **`parts/footer.html`** — REBUILD as the Imladris twilight SiteFooter. Ref:
  `…/reference/components/site/SiteFooter.{prompt.md,jsx.txt}`. Inverse twilight plate
  (`--wp--custom--surface--inverse`) + gold top rule; faint `valley-twilight.png` backdrop opacity .22 +
  dark gradient; identity = gold star emblem + "Henry Perkins" (Cormorant 2xl); disciplines
  "Support Enablement · WordPress Delivery · AI Workflows" (Marcellus xs caps, parchment-300, gold-dot
  separators); social pills GitHub(github.com/henryperkins)/LinkedIn(linkedin.com/in/henryperkins)/
  Email(mailto:henry@lakefrontdigital.io) with lucide SVG icons; PRESERVE Henry's existing internal links
  (/design-system/, /design-tokens/, /about/ Resume) as a secondary mono nav line; static colophon
  (drop dynamic {year}).
  - Backdrop URL: static template parts can't run PHP → inject `--hp-footer-backdrop-url` in
    `functions.php` (mirror the existing `--hp-wapuu-mark-url` `wp_add_inline_style` block, filemtime
    cache-bust) and use it in `.hp-footer__backdrop { background: var(--hp-footer-backdrop-url) … }`.
  - **style.css**: REPLACE the old footer section at **lines 1071–1102** (`/* === footer === */` …
    `.hp-footer__tagline { max-width: 42rem; }`) with the twilight-plate CSS below.
- `parts/header.html`: optional light re-skin (already acceptable via CSS); if touched only remap
  `var:preset|spacing|20`→`…|2`. Low priority.
- `functions.php`: `register_block_style()` for button variants (`is-style-secondary|ghost|accent|link`
  on `core/button`) + `is-style-imladris` on `core/quote`; fix stale "uses system fonts" comment.
- All spacing/color/large/small slug usage in markup lives ONLY in parts/ (footer+header). proof-bar's
  `xs` is valid in Imladris (leave).

### Phase 6 — new patterns `patterns/imladris-*.php` (category `hperkins`)
From each `…/reference/components/**/*.{prompt.md,card.html.txt,d.ts.txt}`:
- actions: **Button** (variants' CSS already in style.css; register block styles), **IconButton**
- content: **Tag** (# pill), **Callout** (gold note rule), **PullQuote** (extend core Quote
  `is-style-imladris`; CSS done), **Badge**, **Avatar**
- forms: **Input**, **Subscribe** (twilight gilt block)
- framework: **RingCard** — signature Three-Rings 3-up; each pillar = Ring-bearer Wapuu
  (`assets/img/wapuu-{vilya,narya,nenya}.png`) under element-tint scrim + `assets/img/ring-badge-*.png`;
  Vilya/Air/EXPOSE · Narya/Fire/GOVERN · Nenya/Water/ATTEST.
- Status = rule-color AND a redundant word (accessibility-critical).

### Phase 7 — page templates (additive child overrides; content untouched)
Inspect current front-page/about/case-study mapping first. Add `templates/front-page.html` (Wapuu hero +
Three Rings; ref templates/home), a case-study page template (ref templates/work — evidence layer
end-to-end), `templates/page-about.html` (ref templates/about). Theme has NO templates/ dir today
(inherits Assembler).

### Phase 8 — finish/QA
Version already 0.3.0. `wp cache flush`; clear theme.json transient (functions.php calls
`WP_Theme_JSON_Resolver::clean_cached_data()` once via option flag). DB-saved Site Editor global styles
override theme.json — check Appearance→Editor→Styles if stale. QA against
`…/reference/About — Henry Perkins.html` + `*.card.html.txt`; verify status color+word; reduced-motion;
inspect `:root` for resolved `--wp--custom--*`. Present `git diff main..imladris`. No deploy.

## Draft footer CSS (replace style.css lines 1071–1102)
```css
/* === footer (Imladris twilight plate) === */
.hp-footer { position: relative; overflow: hidden; background: var(--wp--custom--surface--inverse); color: var(--wp--preset--color--parchment-100); border-top: 1px solid var(--hp-gold); }
.hp-footer__backdrop { position: absolute; inset: 0; pointer-events: none; background: var(--hp-footer-backdrop-url) center / cover no-repeat; opacity: 0.22; }
.hp-footer__backdrop::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(20,28,24,0.72), rgba(20,28,24,0.92)); }
.hp-footer__inner { position: relative; }
.hp-footer__identity { display: flex; align-items: center; gap: var(--wp--preset--spacing--3); }
.hp-footer__star { width: 22px; height: 22px; flex: 0 0 auto; color: var(--wp--preset--color--gold-400); }
.hp-footer__name { margin: 0; font-family: var(--hp-font-display); font-size: var(--wp--preset--font-size--2xl); font-weight: var(--wp--custom--weight--semibold); letter-spacing: -0.01em; color: var(--wp--preset--color--parchment-50); }
.hp-footer__meta { margin: var(--wp--preset--spacing--3) 0 0; font-family: var(--hp-font-label); font-size: var(--wp--preset--font-size--xs); letter-spacing: var(--wp--custom--tracking--wide); text-transform: uppercase; color: var(--wp--preset--color--parchment-300); }
.hp-footer__social { display: flex; flex-wrap: wrap; gap: var(--wp--preset--spacing--3); margin: 0; padding: 0; list-style: none; }
.hp-footer__social a { display: inline-flex; align-items: center; gap: 0.55em; padding: 9px 16px; border-radius: var(--hp-radius-pill); border: 1px solid color-mix(in srgb, var(--wp--preset--color--parchment-50) 18%, transparent); color: var(--wp--preset--color--parchment-100); font-family: var(--hp-font-label); font-size: var(--wp--preset--font-size--sm); text-decoration: none; transition: border-color 140ms var(--wp--custom--ease--out), color 140ms var(--wp--custom--ease--out); }
.hp-footer__social a:hover { border-color: var(--wp--preset--color--gold-400); color: var(--wp--preset--color--gold-400); }
.hp-footer__social svg { width: 16px; height: 16px; }
.hp-footer__nav { margin: var(--wp--preset--spacing--4) 0 0; font-family: var(--hp-font-mono); font-size: var(--wp--preset--font-size--xs); color: var(--wp--preset--color--parchment-300); }
.hp-footer__nav a { color: var(--wp--preset--color--parchment-100); text-decoration: none; border-bottom: 1px solid color-mix(in srgb, var(--hp-gold) 45%, transparent); }
.hp-footer__nav a:hover { border-bottom-color: var(--hp-gold); color: var(--wp--preset--color--gold-400); }
.hp-footer__colophon { margin: var(--wp--preset--spacing--6) 0 0; padding-top: var(--wp--preset--spacing--5); border-top: 1px solid color-mix(in srgb, var(--wp--preset--color--parchment-50) 14%, transparent); font-family: var(--hp-font-mono); font-size: var(--wp--preset--font-size--2xs); color: var(--wp--preset--color--parchment-300); }
```

## Useful facts
- wp-cli works read-only without flags; content writes need `--user=hperkins` (else kses strips block delimiters).
- The design connector is already authorized (claude.ai login upgraded with user:design:read/write). The
  project is "Imladris Design System" (id 89e0d236-6451-44a0-8280-e4b7917360ab) — DesignSync read methods work.
- Commit messages end with: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
