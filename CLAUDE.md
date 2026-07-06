# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

The **HPerkins Tokens** theme — the **"Imladris" design-system child theme** for hperkins.blog (a Rivendell-inspired, parchment-and-evergreen serif editorial system). This directory is its **own git repo** (remote `github.com/henryperkins/hperkins-tokens`, branch `main`) with real history, nested inside a larger WordPress site checkout.

- **Parent theme:** `assembler` (Automattic), vendored as a sibling at `../assembler`. It is **required** for this theme to activate — this is a child theme (`Template: assembler` in `style.css`).
- **Baseline:** block theme, `theme.json` v3. Tested to WP 7.0; `Requires PHP: 8.0` (the wider custom stack targets PHP 8.2 / WP 7.0+).
- **No build step, no `package.json`, no Composer.** Everything is hand-authored HTML/CSS/PHP + `theme.json`. The `scripts/*.js` verifiers are dependency-free (Node built-ins driving Chrome over the DevTools Protocol — no `npm install`).

**For site-wide and plugin-stack context, defer to the parent checkout's docs**, which load alongside this file: `/home/dev/hperkinsblog/CLAUDE.md` and `/home/dev/hperkinsblog/AGENTS.md`. They cover the governed-AI plugin stack (`flavor-agent`, AI Client, MCP), the migration runbook, and the **site-level** theme verifiers (`scripts/verify-hperkins-tokens.js`, `scripts/verify-nav-close.js`) that live *one level up*, in the site checkout — **distinct** from this repo's own `scripts/` (see Commands). This file adds the theme-internal depth those don't cover.

## Commands

```bash
# Lint — the de-facto check (no phpcs config). PHP syntax-check the whole theme:
find . -name '*.php' -print0 | xargs -0 -n1 php -l

# Theme verifiers (this repo's scripts/). Dependency-free; need Chrome + the LIVE site.
# Override via env: CHROME_BIN (default /usr/bin/google-chrome), HPERKINS_ORIGIN (default https://hperkins.blog).
node scripts/verify-ring-cards-mobile.js        # 320px: ring cards don't collide / no horizontal overflow on / and /ai-enablement/
node scripts/verify-contact-form-styling.js     # /contact/: themed .hp-input beats the parent's raw input rules; focus ring isn't the weak fallback
node scripts/verify-content-ownership.js        # front/about/work/ai-enablement template ownership + snapshots, plus the DB-owned /work/flavor-agent/demo/ snapshot
node scripts/verify-content-ownership-docs.js   # readme / CLAUDE / design-system docs still describe the DB-owned page contract accurately
node scripts/export-page-snapshots.js           # refresh content/page-snapshots/*.html after intentional edits to DB-owned page bodies

# WP-CLI targets the SITE checkout, not this dir:
wp --path=/home/dev/hperkinsblog theme list                 # hperkins-tokens active, assembler = parent
wp --path=/home/dev/hperkinsblog eval 'echo wp_get_theme()->get("Version");'
wp --path=/home/dev/hperkinsblog cache flush                 # after theme.json / global-styles changes

# Re-classify this repo after structural changes (adds theme.json/templates/etc.):
node /home/dev/.claude/skills/wp-project-triage/scripts/detect_wp_project.mjs
```

The verifiers load the **deployed** site at `https://hperkins.blog`; set `HPERKINS_ORIGIN` to point them elsewhere. Behavioral nav checks (tap → overlay closes across the Interactivity Router swap) are covered by the site-level `verify-nav-close.js` / Playwright MCP, not by this repo's scripts.

## Architecture — the parts that need multiple files to understand

### `theme.json` is the single source of truth

It defines the entire token vocabulary: the palette (`parchment-*`, `mist-*`, `ink-*`, `green-*` (Evergreen, brand), `river-*` (links/info), `gold-*` (accent), `twilight-*`, plus semantic `leaf`/`amber`/`rust`/`slate`), the spacing scale, four self-hosted font families with type scale, and a deep `settings.custom` tree (`surface`, `text`, `border`, `rule`, `brand`, `accent`, `feedback`, `status`, `type`, `radius`, `shadow`, `ease`, `dur`, …). **All stock pickers are disabled** (`defaultPalette`/`defaultGradients`/`defaultDuotone`/`custom`/`customGradient`/`customDuotone` = false; `defaultFontSizes`/`defaultSpacingSizes` = false, non-fluid) so authors choose only from named tokens. Add new design values **here first**, then alias them in `style.css` — never introduce a parallel hardcoded value that can drift. One drift edge *inside* theme.json itself: the `settings.custom` tree repeats palette hexes as literals (a deliberate DS-mirror choice — `custom.type.*` shows the `var()` alternative), so when changing any palette color, grep theme.json for that hex and update the `custom` twins in the same edit.

### CSS: a two-sheet split, aliased onto generated vars

- **`style.css`** — the hand-authored sheet. Its `:root` block **aliases onto the `theme.json`-generated `--wp--preset--*` / `--wp--custom--*` vars** (e.g. `--hp-neutral-900: var(--wp--custom--text--strong)`) so there are no parallel hex copies. It then holds the **core component CSS** (`.hp-lead`, `.hp-ring-card`, `.hp-site-header`, `.hp-footer`, chips/rows/quotes, etc.). Treat it as the authored artifact; keep it clean.
- **`assets/imladris-pages.css`** — **page-layout CSS** for designs pulled from the design system (ai-enablement essay, contact, work index). Deliberately kept **out of `style.css`** so the hand-authored sheet stays untouched; enqueued separately (handle `hperkins-pages`) and depends on `hperkins-tokens` so the cascade is right. Put page-specific layout here, component tokens/CSS in `style.css`.

### `functions.php` — parent/child load-order surgery (read before touching enqueue/editor wiring)

Because Assembler registers `assembler-style` from the *stylesheet* dir — which under a child theme resolves to **this** theme's `style.css` — the child CSS would load twice. `functions.php`:
- **Frontend (`wp_enqueue_scripts`, prio 20):** dequeues `assembler-style`, then enqueues **parent-then-child explicitly** (`assembler-parent` → `hperkins-tokens`), then `hperkins-pages`. It injects the footer- and hero-backdrop image URLs as CSS custom properties (`--hp-footer-backdrop-url`, `--hp-council-hero-backdrop-url`) via `wp_add_inline_style` (the hero uses an `image-set(webp,png)` branch when `elvenbook.webp` exists), and enqueues the deferred `nav-close-delight.js`, `form-enhance.js`, and `header-search.js` (progressive enhancement; the `mailto:` links/action are the no-JS fallback).
- **Editor (`after_setup_theme`, prio 20):** rewrites editor styles to load **both** sheets parent-then-child, dropping only the fragile relative `style.css` entry (so other plugins' editor styles survive). Also `remove_action(..., 'assembler_preload_fonts', 1)` — the parent preloads an InterVariable font path that 404s under this child (Imladris serves its own `theme.json` font faces).
- **`init` (prio 9):** registers the **`hperkins` pattern category** and block styles — `core/button`: `secondary`/`ghost`/`accent`/`link`; `core/quote`: `imladris`.
- **`after_switch_theme`:** one-time legacy `wp_global_styles` cleanup (removes stale `wp-global-styles-pub/` and `…-assembler` posts, clears the theme-JSON cache). Activation-time migration, not a request-time task; guarded by the `hperkins_tokens_global_styles_cleanup_v1` option.

> **Cache-busting is `filemtime()`-based for every hand-authored asset.** `style.css`, `assets/imladris-pages.css`, `nav-close-delight.js`, and `form-enhance.js` all bust on file mtime, so editing any of them ships under a fresh cache key automatically — no manual step. Still bump the `style.css` `Version:` header (and mirror it in `readme.txt`) when you change `style.css`/`theme.json`, but now for **release/version tracking** (the theme's declared version + changelog source-of-truth), not cache invalidation. The parent `assembler-parent` sheet is versioned by Assembler's own `Version`.

### Patterns & templates

- **`patterns/`** — two kinds. The **`imladris-*`** files are the reusable **design-system components** (button, badge, tag, avatar, callout, pullquote, input, subscribe, ring-card, icon-button); the rest are content/section patterns (about-resume, work-index, contact, ai-enablement, proof-bar, work-entry, evidence-first, …). Every pattern uses the header block `Slug: hperkins-tokens/<name>`, `Categories: hperkins`, and cache-busts image `src`s with a `filemtime` `?v=` query arg. For `/about/`, `/work/`, and `/ai-enablement/`, those content patterns are reusable seeds/reference copies rather than the live route owners. On `/`, the theme-owned `wapuu-home-hero` pattern remains live so its asset URLs stay dynamic.
- **`templates/` + `parts/`** — front-page, home/single (blog index + reader), page-about, page-ai-enablement, page-case-study, page-contact, page-work, page-how-this-was-built, page-plato-artifacts; header/footer parts. Unspecified templates are **inherited from Assembler**. `front-page.html` wraps the stored Home page body between the theme-owned `wapuu-home-hero` pattern and the theme-owned Three Rings section; the tracked middle section lives in `content/page-snapshots/front-page.html`. `page-about.html`, `page-ai-enablement.html`, and `page-work.html` render stored page bodies through `wp:post-content`; their versioned source copies live in `content/page-snapshots/about.html`, `content/page-snapshots/ai-enablement.html`, and `content/page-snapshots/work.html`. The published Flavor Agent demo child page (`/work/flavor-agent/demo/`) also keeps its artifact embed + explainer in `post_content`; because it inherits the generic page shell rather than a theme-owned wrapper, its source copy is tracked separately at `content/page-snapshots/work-flavor-agent-demo.html`. Refresh the tracked page bodies with `node scripts/export-page-snapshots.js` after intentional DB-body edits and verify drift with `node scripts/verify-content-ownership.js`. `page-plato-artifacts.html` likewise preserves DB content inside the work-template shell. `page-how-this-was-built.html` is by contrast fully **theme-owned**: it embeds the `hperkins-tokens/how-this-was-built` build-report pattern and its DB page (post 263) carries an empty `post_content`, so the pattern file is the source of record — it is deliberately **not** part of the `wp:post-content` snapshot contract (there is no DB body to track). At `/`, `front-page.html` intentionally outranks `home.html`.
- **Navigation is `wp:navigation {"ref":237}`** in `parts/header.html`. Search is **theme-owned** (the `hp-site-search` core/search block in the header part, at every width — the old in-menu `hp-nav-search` overlay search is gone). Menu 237 carries the nav links **plus the mobile Subscribe**: a trailing navigation-link with `className: hp-nav-subscribe` (href `/contact/#subscribe`) that renders as the pill at the drawer foot; the bar pill is hidden ≤781px, so **deleting that link removes every mobile subscribe affordance** (this happened once — restored 2026-07-06). It is **DB content and does not travel with the theme**; the redesign-era menu is backed up at `.design-pull/header-and-navigation-redesign/backup/nav-post-237.after.html` — after any menu edit, verify the link survived (`wp post get 237 --field=post_content | grep hp-nav-subscribe`).
- **Header sticky gotcha:** the sticky frosted bar is on the **`header.wp-block-template-part` wrapper**, not `.hp-site-header`. Moving `position:sticky` back onto `.hp-site-header` silently breaks the stick (its parent is the page-height scroller).

### The design-system round-trip (`design-pull`)

This theme is the **WordPress implementation of a claude.ai/design project**, "Imladris Design System". `docs/design-system/` (`README.md`, `INDEX.md`) is the **authoritative provenance + mapping**: every DS token verified **1:1 against `theme.json`** (zero drift), and a full **DS-component → theme-pattern map**. The React components are **reference-only** for a block theme — each is mirrored as a hand-authored pattern/part. A faithful token mirror is staged under `.design-pull/` (gitignored, re-pullable). To refresh or vendor more, re-run `/design-pull` against the project URL in `INDEX.md`. **Read `docs/design-system/INDEX.md` before changing tokens, patterns, or the header/footer** — it records what maps to what and the fidelity-pass history.

### The design invariant — a "ledger" row anatomy

Status is expressed by a **semantic palette plus a redundant word** (done/review/pending — never color alone). Within any component, the **row anatomy is fixed** — padding, left-rule width, and radius are fixed named tokens **per component, never per state** (`--hp-rule-chip` 7px, `--hp-rule-entry` 3px, `--hp-rule-evidence` 5px, `--hp-rule-quote` 3px). State changes only the **rule color, surface tint, and a filled-vs-hollow dot** — never the shape. Preserve this when editing component CSS.

## Conventions & guardrails

- **WordPress PHP standards:** tabs, escaped output (`esc_url`, `esc_html`), sanitized input, nonce + capability checks for privileged actions, prefix theme functions/hooks `hperkins_` / patterns `hperkins-tokens/`.
- **Tokens first:** new design values go in `theme.json`, then alias in `style.css`. No parallel hardcoded hex.
- **Respect the CSS split:** component tokens/CSS → `style.css`; page-layout CSS for pulled designs → `assets/imladris-pages.css`.
- **Bump `style.css` `Version:`** (and mirror in `readme.txt`) when `style.css` or `theme.json` changes, so the frontend/editor cache busts.
- **Don't edit the parent as if it's ours:** `../assembler` is vendored upstream.
- **`.design-pull/` is disposable** (gitignored, re-pullable); the durable provenance is `docs/design-system/`.
