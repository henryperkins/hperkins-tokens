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

# Theme verifiers (this repo's scripts/ — all eleven). Dependency-free (Node built-ins).
# Env overrides: CHROME_BIN (default /usr/bin/google-chrome), HPERKINS_ORIGIN (default https://hperkins.blog),
# HPERKINS_WP_PATH (default /home/dev/hperkinsblog, for the wp-cli-backed scripts).
#
# Chrome + live site:
node scripts/verify-ring-cards-mobile.js        # 320px: three ring cards render, don't collide, no horizontal overflow on / and /ai-enablement/
node scripts/verify-contact-form-styling.js     # /contact/: themed .hp-input beats parent input rules; gold-700 border + 2px outline focus ring; subscribe status states
node scripts/verify-homepage-hero-polish.js     # / hero title weight: medium mobile, semibold desktop
node scripts/verify-prominent-actions.js        # /, /about/, /job-placement-digest/, and Flavor Agent demo: rail/panel counts, 44px targets, focus, mobile stacking, overflow, screenshots
node scripts/verify-journal-polish.js           # /essays/ masthead clamp + overflow at 390/320px; fallback plate-crop variety
#
# WP-CLI / HTTP / file checks (no Chrome):
node scripts/verify-content-ownership.js        # front/about/work/ai-enablement/job-placement-digest ownership + snapshots, the DB-owned /work/flavor-agent/demo/ snapshot, and retired-route absence (wp-cli)
node scripts/verify-content-ownership-docs.js   # readme / CLAUDE / design-system docs still describe the DB-owned page contract accurately (pure file reads)
node scripts/verify-performance-assets.js       # image budgets, fontDisplay, eager LCP hero (fetchpriority=high, never loading=lazy), front-page CSS skip
node scripts/verify-style-token-usage.js        # every var() in style.css resolves against theme.json-generated variables (wp-cli)
node scripts/verify-design-system-specimen.js   # post 79 specimen references live patterns; rendered checks auto-skip while the page is draft (wp-cli + HTTP)
node scripts/verify-subscribe-endpoint.js       # subscribe nonce rejection over HTTP + storage/rate-limit/privacy runtime checks (wp-cli; MUTATES+restores options — the runtime half only runs when ORIGIN matches the local install)
node scripts/export-page-snapshots.js           # refresh content/page-snapshots/*.html after intentional edits to DB-owned page bodies (wp-cli)

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

It defines the entire token vocabulary: the palette (`parchment-*`, `mist-*`, `ink-*`, `green-*` (Evergreen, brand), `river-*` (links/info), `gold-*` (accent), `twilight-*`, plus semantic `leaf`/`amber`/`rust`/`slate`), the spacing scale, four self-hosted font families with type scale, and a deep `settings.custom` tree (`surface`, `text`, `border`, `rule`, `brand`, `accent`, `feedback`, `status`, `type`, `radius`, `shadow`, `ease`, `dur`, …). **All stock pickers and free-form value inputs are disabled** (`defaultPalette`/`defaultGradients`/`defaultDuotone`/`custom`/`customGradient`/`customDuotone` = false; `defaultFontSizes`/`defaultSpacingSizes` = false, non-fluid; `customFontSize`/`customSpacingSize` = false, so the editor offers no arbitrary type or spacing values either) so authors choose only from named tokens. Add new design values **here first**, then alias them in `style.css` — never introduce a parallel hardcoded value that can drift. One drift edge *inside* theme.json itself: the `settings.custom` tree repeats palette hexes as literals (a deliberate DS-mirror choice — `custom.type.*` shows the `var()` alternative), so when changing any palette color, grep theme.json for that hex and update the `custom` twins in the same edit.

### CSS: a two-sheet split, aliased onto generated vars

- **`style.css`** — the hand-authored sheet. Its `:root` block **aliases onto the `theme.json`-generated `--wp--preset--*` / `--wp--custom--*` vars** (e.g. `--hp-neutral-900: var(--wp--custom--text--strong)`) so there are no parallel hex copies. It then holds the **core component CSS** (`.hp-lead`, `.hp-ring-card`, `.hp-site-header`, `.hp-footer`, chips/rows/quotes, etc.). Treat it as the authored artifact; keep it clean.
- **`assets/imladris-pages.css`** — **page-layout CSS** for designs pulled from the design system (ai-enablement essay, contact, work index, job-placement digest). Deliberately kept **out of `style.css`** so the hand-authored sheet stays untouched; enqueued separately (handle `hperkins-pages`) and depends on `hperkins-tokens` so the cascade is right. Put page-specific layout here, component tokens/CSS in `style.css`.

Prominent page actions compose the canonical Button primitive through
`.hp-action-rail`; final invitations add `.hp-action-panel.is-closing`.
Both are shared components in `style.css`. Page selectors may own surrounding
typography and layout, but compact header, form, icon, and specimen controls
must not opt into either class.

### `functions.php` — parent/child load-order surgery (read before touching enqueue/editor wiring)

Because Assembler registers `assembler-style` from the *stylesheet* dir — which under a child theme resolves to **this** theme's `style.css` — the child CSS would load twice. `functions.php`:
- **Frontend (`wp_enqueue_scripts`, prio 20):** dequeues `assembler-style`, then enqueues **parent-then-child explicitly** (`assembler-parent` → `hperkins-tokens`), then `hperkins-pages` — **skipped on the front page** (`! is_front_page()`; the front page uses no page-layout CSS, and the full-page router adds the sheet's `<link>` on client swaps to other pages — verified live). It injects the footer- and hero-backdrop image URLs as CSS custom properties (`--hp-footer-backdrop-url`, `--hp-council-hero-backdrop-url`) via `wp_add_inline_style` (the hero uses an `image-set(webp,png)` branch when `elvenbook.webp` exists), and enqueues four deferred progressive-enhancement scripts: `nav-close-delight.js`, `form-enhance.js`, `header-search.js`, and `router-scroll.js`. No-JS fallbacks: the contact form is a `mailto:` form; the subscribe form is a real HTTPS POST to `admin-post.php` (see the subscribe endpoint below).
- **Editor (`after_setup_theme`, prio 20):** rewrites editor styles to load **three** sheets — parent `style.css`, child `style.css`, and `imladris-pages.css` (the editor previews page CSS on every template since `add_editor_style` registers globally) — dropping only the fragile relative `style.css` entry (so other plugins' editor styles survive). Also `remove_action(..., 'assembler_preload_fonts', 1)` — the parent preloads an InterVariable font path that 404s under this child (Imladris serves its own `theme.json` font faces).
- **`init` (prio 9):** registers the **`hperkins` pattern category** and block styles — `core/button`: `secondary`/`ghost`/`accent`/`link`; `core/quote`: `imladris`.
- **Subscribe endpoint (`admin_post[_nopriv]_hperkins_tokens_subscribe`):** the newsletter form POSTs to `admin-post.php` — nonce check, `is_email`, per-IP transient rate limit (5/10min, filterable), then storage in the bounded non-autoloaded `hperkins_tokens_subscribe_requests` option (capped 200, optimistic concurrency) + a notification mail (recipient filterable via `hperkins_tokens_subscribe_notify_email`). Duplicates resolve to the generic success status (anti-enumeration). WordPress privacy **exporter + eraser** callbacks are registered for the stored requests. Status returns via `?hperkins_subscribe=<status>#subscribe`, rendered by the subscribe pattern.
- **Query filters:** the single.html related loop (queryId **12**) excludes the current post via `query_loop_block_query_vars`; the home.html journal grid (queryId **11**, seed offset 3) is tagged so a `found_posts` filter subtracts the offset — without it core fabricates a trailing empty pagination page at post counts like 7–9. Both are keyed to the template's literal queryId: renumber the template, update the filter.
- **Other request-time hooks:** a 301 from the agent-owned `flavor-agent-demo` seed slug to `/work/flavor-agent/demo/` (`template_redirect`); a front-page-only `<link rel=preload>` for the Cormorant Garamond display face (`wp_head` prio 1, URL matched to the theme.json font face so the browser dedupes); and a five-hook set that **hides inherited Assembler style variations + section styles** from the Site Editor, global-styles/block-type REST responses, and the theme-JSON data (so the editor can't switch the child onto parent palettes that bypass the locked tokens).
- **`after_switch_theme`:** one-time legacy `wp_global_styles` cleanup (removes stale `wp-global-styles-pub/` and `…-assembler` posts, clears the theme-JSON cache). Activation-time migration, not a request-time task; guarded by the `hperkins_tokens_global_styles_cleanup_v1` option.

> **Cache-busting is `filemtime()`-based for every hand-authored asset.** `style.css`, `assets/imladris-pages.css`, and all four JS files (`nav-close-delight.js`, `form-enhance.js`, `header-search.js`, `router-scroll.js`) bust on file mtime, so editing any of them ships under a fresh cache key automatically — no manual step. Still bump the `style.css` `Version:` header (and mirror it in `readme.txt`) when you change `style.css`/`theme.json`, but now for **release/version tracking** (the theme's declared version + changelog source-of-truth), not cache invalidation. The parent `assembler-parent` sheet is versioned by Assembler's own `Version`.

### Patterns & templates

- **`patterns/`** — two kinds. The **`imladris-*`** files are the reusable **design-system components** (button, badge, tag, avatar, callout, pullquote, input, subscribe, ring-card, icon-button); the rest are content/section patterns (about-resume, work-index, contact, ai-enablement, job-placement-digest, proof-bar, work-entry, evidence-first, …). Every pattern uses the header block `Slug: hperkins-tokens/<name>`, `Categories: hperkins`, and cache-busts image `src`s with a `filemtime` `?v=` query arg (theme assets via `hperkins_tokens_asset_url()`; the uploads-hosted About portrait computes its own mtime in the seed and carries a pinned `?v=` in the DB body — bump it by hand if the upload is ever replaced in place). For `/about/`, `/work/`, `/ai-enablement/`, and `/job-placement-digest/`, those content patterns are reusable seeds/reference copies rather than the live route owners. On `/`, the theme-owned `wapuu-home-hero` pattern remains live so its asset URLs stay dynamic.
- **`templates/` + `parts/`** — front-page, home/single (blog index + reader), page-about, page-ai-enablement, page-case-study, page-contact, page-job-placement-digest, page-work, page-how-this-was-built; header/footer parts. Unspecified templates are **inherited from Assembler**. `front-page.html` wraps the stored Home page body between the theme-owned `wapuu-home-hero` pattern and the theme-owned Three Rings section; the tracked middle section lives in `content/page-snapshots/front-page.html`. `page-about.html`, `page-ai-enablement.html`, `page-job-placement-digest.html`, and `page-work.html` render stored page bodies through `wp:post-content`; their versioned source copies live in `content/page-snapshots/about.html`, `content/page-snapshots/ai-enablement.html`, `content/page-snapshots/job-placement-digest.html`, and `content/page-snapshots/work.html`. The published Flavor Agent demo child page (`/work/flavor-agent/demo/`) also keeps its artifact embed + explainer in `post_content`; because it inherits the generic page shell rather than a theme-owned wrapper, its source copy is tracked separately at `content/page-snapshots/work-flavor-agent-demo.html`. Refresh the tracked page bodies with `node scripts/export-page-snapshots.js` after intentional DB-body edits and verify drift with `node scripts/verify-content-ownership.js`. The retired `plato-artifacts` path is asserted absent by that verifier. `page-how-this-was-built.html` is by contrast fully **theme-owned**: it embeds the `hperkins-tokens/how-this-was-built` build-report pattern and its DB page (post 263) carries an empty `post_content`, so the pattern file is the source of record — it is deliberately **not** part of the `wp:post-content` snapshot contract (there is no DB body to track). At `/`, `front-page.html` intentionally outranks `home.html`.
- **Navigation is `wp:navigation {"ref":237}`** in `parts/header.html`. Search is **theme-owned** (the `hp-site-search` core/search block in the header part, at every width — the old in-menu `hp-nav-search` overlay search is gone). Menu 237 carries the nav links **plus the mobile Subscribe**: a trailing navigation-link with `className: hp-nav-subscribe` (href `/contact/#subscribe`) that renders as the pill at the drawer foot; the bar pill is hidden ≤781px, so **deleting that link removes every mobile subscribe affordance** (this happened once — restored 2026-07-06). It is **DB content and does not travel with the theme**; the redesign-era menu is backed up at `.design-pull/header-and-navigation-redesign/backup/nav-post-237.after.html` — after any menu edit, verify the link survived (`wp post get 237 --field=post_content | grep hp-nav-subscribe`).
- **Header sticky gotcha:** the sticky frosted bar is on the **`header.wp-block-template-part` wrapper**, not `.hp-site-header`. Moving `position:sticky` back onto `.hp-site-header` silently breaks the stick (its parent is the page-height scroller).

### The design-system round-trip (`design-pull`)

This theme is the **WordPress implementation of a claude.ai/design project**, "Imladris Design System". `docs/design-system/` (`README.md`, `INDEX.md`) is the **authoritative provenance + mapping**: every DS token was verified **1:1 against `theme.json`** at the 2026-06-20 pull, with the deliberate post-pull theme-side deltas (ink-450, `custom.scrim.*`, the dropped `borderWidth` group, darkened accessible text tokens) recorded in INDEX.md, plus a full **DS-component → theme-pattern map**. The React components are **reference-only** for a block theme — each is mirrored as a hand-authored pattern/part. A faithful token mirror is staged under `.design-pull/` (gitignored, re-pullable). To refresh or vendor more, re-run `/design-pull` against the project URL in `INDEX.md`. **Read `docs/design-system/INDEX.md` before changing tokens, patterns, or the header/footer** — it records what maps to what and the fidelity-pass history.

### The design invariant — a "ledger" row anatomy

Status is expressed by a **semantic palette plus a redundant word** (done/review/pending — never color alone). Within any component, the **row anatomy is fixed** — padding, left-rule width, and radius are fixed named tokens **per component, never per state** (`--hp-rule-chip` 7px, `--hp-rule-entry` 3px, `--hp-rule-evidence` 5px, `--hp-rule-quote` 3px). State changes only the **rule color, surface tint, and a filled-vs-hollow dot** — never the shape. Preserve this when editing component CSS.

## Conventions & guardrails

- **WordPress PHP standards:** tabs, escaped output (`esc_url`, `esc_html`), sanitized input, nonce + capability checks for privileged actions, prefix theme functions/hooks `hperkins_` / patterns `hperkins-tokens/`.
- **Tokens first:** new design values go in `theme.json`, then alias in `style.css`. No parallel hardcoded hex.
- **Respect the CSS split:** component tokens/CSS → `style.css`; page-layout CSS for pulled designs → `assets/imladris-pages.css`.
- **Bump `style.css` `Version:`** (and mirror in `readme.txt` + add a changelog entry) when `style.css` or `theme.json` changes — release/version tracking; the cache key is `filemtime()`.
- **Don't edit the parent as if it's ours:** `../assembler` is vendored upstream.
- **`.design-pull/` is disposable** (gitignored, re-pullable); the durable provenance is `docs/design-system/`.
