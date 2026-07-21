# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

The **HPerkins Tokens** theme — the **"Imladris" design-system child theme** for hperkins.blog (a Rivendell-inspired, parchment-and-evergreen serif editorial system). This directory is its **own git repo** (remote `github.com/henryperkins/hperkins-tokens`, branch `main`) with real history. Link or junction it into a separate WordPress installation for local development; WordPress core, the database, uploads, and the parent theme are not part of this repo.

- **Parent theme:** `assembler` (Automattic), installed as a sibling of this theme in the target WordPress site's `wp-content/themes/` directory. It is **required** for this theme to activate — this is a child theme (`Template: assembler` in `style.css`).
- **Baseline:** block theme, `theme.json` v3. Tested to WP 7.0; `Requires PHP: 8.0` (the wider custom stack targets PHP 8.2 / WP 7.0+).
- **No build step, no `package.json`, no Composer.** Everything is hand-authored HTML/CSS/PHP + `theme.json`. The `scripts/*.js` verifiers are dependency-free (Node built-ins driving Chrome over the DevTools Protocol — no `npm install`).

Site-wide plugin stacks and production operations belong to their own checkout. This repository's commands and `scripts/` cover the theme only.

## Commands

Database-backed scripts require `HPERKINS_WP_PATH`; there is intentionally no machine-specific fallback (`verify-subscribe-endpoint.js` is the one partial exception — its HTTP nonce-rejection half runs without it, and only the mutating runtime half is gated on the path). `HPERKINS_ORIGIN` selects the matching HTTP site; the wp-cli **and** HTTP verifiers that touch the DB (`verify-subscribe-endpoint`, `verify-design-system-specimen`, `verify-style-token-usage`) now assert that `HPERKINS_ORIGIN` and the selected install's `home` URL name the same site before running, so a mismatched pair fails fast instead of mixing two sites. On Windows, the shared launcher invokes PHP plus the WP-CLI PHAR directly because Node cannot execute the `wp.cmd` wrapper safely. `HPERKINS_PHP_BIN` can select a non-default PHP executable when `php` is not on `PATH`.

```powershell
# Local WordPress Studio development site (PowerShell).
$env:HPERKINS_WP_PATH = Join-Path $env:USERPROFILE 'Studio\hperkins-tokens-dev'
$env:HPERKINS_WP_CLI_PHAR = "$env:USERPROFILE\.local\bin\wp-cli.phar"
$env:HPERKINS_ORIGIN = (& studio wp option get home --path $env:HPERKINS_WP_PATH).Trim()

# Studio-managed WP-CLI and standalone WP-CLI should agree for this clean site.
studio wp core version --path $env:HPERKINS_WP_PATH
wp --path=$env:HPERKINS_WP_PATH core version
wp --path=$env:HPERKINS_WP_PATH theme list
```

```bash
# POSIX local setup. HPERKINS_WP_BIN may override the default `wp` executable.
export HPERKINS_WP_PATH=/absolute/path/to/wordpress
export HPERKINS_ORIGIN="$(wp --path="$HPERKINS_WP_PATH" option get home)"

# Lint — the de-facto check (no phpcs config). PHP syntax-check the whole theme:
find . -name '*.php' -print0 | xargs -0 -n1 php -l

# Theme verifiers (this repo's scripts/ — all fourteen). Dependency-free (Node built-ins).
# Env overrides: CHROME_BIN (optional explicit Chrome/Chromium path; verify-header.js probes current-platform candidates when unset), HPERKINS_ORIGIN (default https://hperkins.blog),
# HPERKINS_WP_PATH (required for the wp-cli-backed scripts).
#
# Chrome + live site:
node scripts/verify-ring-cards-mobile.js        # 320px: three ring cards render, don't collide, no horizontal overflow on / and /ai-enablement/
node scripts/verify-contact-form-styling.js     # /contact/: themed .hp-input beats parent input rules; gold-700 border + 2px outline focus ring; subscribe status states
node scripts/verify-homepage-hero-polish.js     # / hero title weight: medium mobile, semibold desktop
node scripts/verify-prominent-actions.js        # /, /about/, /job-placement-digest/, and Flavor Agent demo: rail/panel counts, 44px targets, focus, mobile stacking, overflow, screenshots
node scripts/verify-header.js                    # Condensed Council source + eight-width geometry, interaction, focus, reduced-motion, router cleanup, and screenshot checks (--source-only for the static half)
node scripts/verify-journal-polish.js           # /essays/ masthead clamp + overflow at 390/320px; fallback plate-crop variety
node scripts/verify-typography.js               # site-wide typography contract: single H1, no heading skips, text floors, 68ch prose measure, four approved families, no synthetic Marcellus bold, bounded contrast, overflow at 320–1440px, SVG effective text size (--report to audit without failing; --source-only for the static half)
#
# WP-CLI / HTTP / file checks (no Chrome):
node scripts/verify-content-ownership.js        # page-body ownership plus exact menu-237 identity/shape and content/nav-snapshots/nav-237.html parity (wp-cli)
node scripts/verify-no-duplicate-pages.js       # no two published pages share a resolved permalink, a (parent, slug) tuple, or a title; every /work/ entry carries a real artifact link; homepage and /work/ list the same projects; patterns/work-index.php stays byte-identical to content/page-snapshots/work.html (wp-cli + file reads)
node scripts/verify-content-ownership-docs.js   # readme / CLAUDE / design-system docs still describe page and Council-header ownership accurately (pure file reads)
node scripts/verify-performance-assets.js       # image budgets, fontDisplay, eager LCP hero (fetchpriority=high, never loading=lazy), front-page CSS skip
node scripts/verify-style-token-usage.js        # every var() in style.css resolves against theme.json-generated variables (wp-cli)
node scripts/verify-design-system-specimen.js   # post 79 specimen references live patterns; rendered checks auto-skip while the page is draft (wp-cli + HTTP)
node scripts/verify-subscribe-endpoint.js       # subscribe nonce rejection over HTTP + storage/rate-limit/privacy runtime checks (wp-cli; MUTATES+restores options — the runtime half runs only when HPERKINS_WP_PATH is set, and then hard-fails rather than skips if HPERKINS_ORIGIN doesn't match that install's home URL, refusing to mutate a different site)
node scripts/export-page-snapshots.js           # refresh content/page-snapshots/*.html after intentional edits to DB-owned page bodies (wp-cli)
node scripts/export-navigation-snapshot.js      # refresh content/nav-snapshots/nav-237.html from the selected site (wp-cli)
node scripts/apply-council-navigation.js        # guarded, idempotent menu-237 recut; refuses any state except its pinned baseline or already-current target (wp-cli; MUTATES)

# WP-CLI targets the configured WordPress site, not this theme repo:
wp --path="$HPERKINS_WP_PATH" theme list                 # hperkins-tokens active, assembler = parent
wp --path="$HPERKINS_WP_PATH" eval 'echo wp_get_theme()->get("Version");'
wp --path="$HPERKINS_WP_PATH" cache flush                # after theme.json / global-styles changes

# Unit tests for the shared script libraries. Name every file explicitly — the
# directory form of `node --test` is unreliable on Windows.
node --test scripts/lib/wp-cli.test.js scripts/lib/site-url.test.js scripts/lib/navigation-content-contract.test.js

# Re-classify this repo after structural changes with the wp-project-triage skill.
```

The verifiers load the **deployed** site at `https://hperkins.blog`; set `HPERKINS_ORIGIN` to point them elsewhere. `verify-header.js` owns the Council header's rendered geometry, disclosure and drawer behavior, focus restoration, route-commit cleanup, reduced-motion behavior, and screenshots.

## Architecture — the parts that need multiple files to understand

### `theme.json` is the single source of truth

It defines the entire token vocabulary: the palette (`parchment-*`, `mist-*`, `ink-*`, `green-*` (Evergreen, brand), `river-*` (links/info), `gold-*` (accent), `twilight-*`, plus semantic `leaf`/`amber`/`rust`/`slate`), the spacing scale, four self-hosted font families with type scale, and a deep `settings.custom` tree (`surface`, `text`, `border`, `rule`, `brand`, `accent`, `feedback`, `status`, `type`, `radius`, `shadow`, `ease`, `dur`, …). **All stock pickers and free-form value inputs are disabled** (`defaultPalette`/`defaultGradients`/`defaultDuotone`/`custom`/`customGradient`/`customDuotone` = false; `defaultFontSizes`/`defaultSpacingSizes` = false; `customFontSize`/`customSpacingSize` = false, so the editor offers no arbitrary type or spacing values either) so authors choose only from named tokens. `settings.typography.fluid` stays `false`, but the `2xl`–`5xl` heading presets are fluid **by value** — their `size` is a hand-authored `clamp()` (24–36 / 32–48 / 40–64 / 48–88px, 0.3.46), mirrored verbatim in the `custom.type.hero/h1/h2/h3` shorthand strings, so every heading that uses the presets is responsive without per-page overrides. Keep the preset and `custom.type` clamps in the same edit if either changes. Add new design values **here first**, then alias them in `style.css` — never introduce a parallel hardcoded value that can drift. One drift edge *inside* theme.json itself: the `settings.custom` tree repeats palette hexes as literals (a deliberate DS-mirror choice — `custom.type.*` shows the `var()` alternative), so when changing any palette color, grep theme.json for that hex and update the `custom` twins in the same edit.

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
- **Frontend (`wp_enqueue_scripts`, prio 20):** dequeues `assembler-style`, then enqueues **parent-then-child explicitly** (`assembler-parent` → `hperkins-tokens`), then `hperkins-pages` — **skipped on the front page** (`! is_front_page()`; the front page uses no page-layout CSS, and the full-page router adds the sheet's `<link>` on client swaps to other pages — verified live). It injects the footer- and hero-backdrop image URLs as CSS custom properties (`--hp-footer-backdrop-url`, `--hp-council-hero-backdrop-url`) via `wp_add_inline_style` (the hero uses an `image-set(webp,png)` branch when `elvenbook.webp` exists), and enqueues three deferred progressive-enhancement scripts: `header-controller.js`, `form-enhance.js`, and `router-scroll.js`. The Council controller replaces the retired `nav-close-delight.js` and `header-search.js` listeners. No-JS fallbacks: the header exposes its complete noscript navigation, the contact form is a `mailto:` form, and the subscribe form is a real HTTPS POST to `admin-post.php` (see the subscribe endpoint below).
- **Editor (`after_setup_theme`, prio 20):** rewrites editor styles to load **three** sheets — parent `style.css`, child `style.css`, and `imladris-pages.css` (the editor previews page CSS on every template since `add_editor_style` registers globally) — dropping only the fragile relative `style.css` entry (so other plugins' editor styles survive). Also `remove_action(..., 'assembler_preload_fonts', 1)` — the parent preloads an InterVariable font path that 404s under this child (Imladris serves its own `theme.json` font faces).
- **`init` (prio 9):** registers the **`hperkins` pattern category** and block styles — `core/button`: `secondary`/`ghost`/`accent`/`link`; `core/quote`: `imladris`.
- **Subscribe endpoint (`admin_post[_nopriv]_hperkins_tokens_subscribe`):** the newsletter form POSTs to `admin-post.php` — nonce check, `is_email`, per-IP transient rate limit (5/10min, filterable), then storage in the bounded non-autoloaded `hperkins_tokens_subscribe_requests` option (capped 200, optimistic concurrency) + a notification mail (recipient filterable via `hperkins_tokens_subscribe_notify_email`). Duplicates resolve to the generic success status (anti-enumeration). WordPress privacy **exporter + eraser** callbacks are registered for the stored requests. Status returns via `?hperkins_subscribe=<status>#subscribe`, rendered by the subscribe pattern.
- **Query filters:** the single.html related loop (queryId **12**) excludes the current post via `query_loop_block_query_vars`; the home.html journal grid (queryId **11**, seed offset 3) is tagged so a `found_posts` filter subtracts the offset — without it core fabricates a trailing empty pagination page at post counts like 7–9. Both are keyed to the template's literal queryId: renumber the template, update the filter.
- **Other request-time hooks:** a 301 from the agent-owned `flavor-agent-demo` seed slug to `/work/flavor-agent/demo/` (`template_redirect`); a front-page-only `<link rel=preload>` for the Cormorant Garamond display face (`wp_head` prio 1, URL matched to the theme.json font face so the browser dedupes); and a five-hook set that **hides inherited Assembler style variations + section styles** from the Site Editor, global-styles/block-type REST responses, and the theme-JSON data (so the editor can't switch the child onto parent palettes that bypass the locked tokens).
- **`after_switch_theme`:** one-time legacy `wp_global_styles` cleanup (removes stale `wp-global-styles-pub/` and `…-assembler` posts, clears the theme-JSON cache). Activation-time migration, not a request-time task; guarded by the `hperkins_tokens_global_styles_cleanup_v1` option.

> **Cache-busting is `filemtime()`-based for every hand-authored asset.** `style.css`, `assets/imladris-pages.css`, and the three JS files (`header-controller.js`, `form-enhance.js`, `router-scroll.js`) bust on file mtime, so editing any of them ships under a fresh cache key automatically — no manual step. Still bump the `style.css` `Version:` header (and mirror it in `readme.txt`) when you change `style.css`/`theme.json`, but now for **release/version tracking** (the theme's declared version + changelog source-of-truth), not cache invalidation. The parent `assembler-parent` sheet is versioned by Assembler's own `Version`.

### Patterns & templates

- **`patterns/`** — two kinds. The **`imladris-*`** files are the reusable **design-system components** (button, badge, tag, avatar, callout, pullquote, input, subscribe, ring-card, icon-button); the rest are content/section patterns (about-resume, work-index, contact, ai-enablement, job-placement-digest, proof-bar, work-entry, evidence-first, …). Every pattern uses the header block `Slug: hperkins-tokens/<name>`, `Categories: hperkins`, and cache-busts image `src`s with a `filemtime` `?v=` query arg (theme assets via `hperkins_tokens_asset_url()`; the uploads-hosted About portrait computes its own mtime in the seed and carries a pinned `?v=` in the DB body — bump it by hand if the upload is ever replaced in place). For `/about/`, `/work/`, `/ai-enablement/`, and `/job-placement-digest/`, those content patterns are reusable seeds/reference copies rather than the live route owners. On `/`, the theme-owned `wapuu-home-hero` pattern remains live so its asset URLs stay dynamic.
- **`templates/` + `parts/`** — front-page, home/single (blog index + reader), archive/search/404 (theme-owned as of 0.3.46: proper H1 via `wp:query-title` or a heading block, journal-postcard results reusing the `hp-postcards`/`hp-postcard` vocabulary, query IDs 13/14 — never reuse 11/12, which are keyed to `functions.php` filters), page-about, page-ai-enablement, page-case-study, page-contact, page-job-placement-digest, page-work, page-how-this-was-built; header/footer parts. Unspecified templates are **inherited from Assembler**. `front-page.html` wraps the stored Home page body between the theme-owned `wapuu-home-hero` pattern and the theme-owned Three Rings section; the tracked middle section lives in `content/page-snapshots/front-page.html`. `page-about.html`, `page-ai-enablement.html`, `page-job-placement-digest.html`, and `page-work.html` render stored page bodies through `wp:post-content`; their versioned source copies live in `content/page-snapshots/about.html`, `content/page-snapshots/ai-enablement.html`, `content/page-snapshots/job-placement-digest.html`, and `content/page-snapshots/work.html`. The published Flavor Agent demo child page (`/work/flavor-agent/demo/`) also keeps its artifact embed + explainer in `post_content`; because it inherits the generic page shell rather than a theme-owned wrapper, its source copy is tracked separately at `content/page-snapshots/work-flavor-agent-demo.html`. Refresh the tracked page bodies with `node scripts/export-page-snapshots.js` after intentional DB-body edits and verify drift with `node scripts/verify-content-ownership.js`. The retired `plato-artifacts` path is asserted absent by that verifier. `page-how-this-was-built.html` is by contrast fully **theme-owned**: it embeds the `hperkins-tokens/how-this-was-built` build-report pattern and its DB page (post 263) carries an empty `post_content`, so the pattern file is the source of record — it is deliberately **not** part of the `wp:post-content` snapshot contract (there is no DB body to track). At `/`, `front-page.html` intentionally outranks `home.html`.
- **Condensed Council header:** `parts/header.html` retains the `.hp-site-header` wrapper and renders `[hperkins_council_header]`. `inc/council-header.php` owns the server markup, the safe fallback, and the current Work evidence data. Menu post **237** is DB-owned input to that renderer; its core Navigation markup is **not** rendered directly. The exact data IA is Work (`hp-nav-work`), Writing (`hp-nav-writing`) with AI Enablement (`hp-nav-ai`), Essays (`hp-nav-essays`), and Job Placement Digest (`hp-nav-digest`), About, Search (`hp-drawer-search`), and Subscribe (`hp-nav-subscribe`). Because there is no published `/writing/` route, the mobile drawer deliberately exposes Work, Essays, AI Enablement, About, Job Placement Digest, Search, and Subscribe as reachable rows; Contact remains a labelled footer route. The renderer also **says where the visitor is** (`aria-current="page"` on all ten destinations, `is-current` on the Work and Writing items for any descendant route) — the retired core Navigation block gave this for free, so dropping it was a regression. The root carries **`data-hp-header-source="navigation|fallback"`**: the fallback's labels and URLs are byte-identical to the DB model, so without that attribute a silent detach from menu 237 passes every rendered assertion. `verify-header.js` requires `navigation`.
- **Menu-237 recovery and mutation:** the portable source copy is `content/nav-snapshots/nav-237.html` (the recut *target*). Refresh it with `node scripts/export-navigation-snapshot.js`, verify it with `node scripts/verify-content-ownership.js`, and use only the hash-guarded `node scripts/apply-council-navigation.js` for the approved recut. Never hand-edit the live record without a fresh verified backup and snapshot parity.
- **The production recut is still pending, and it is ordered after the deploy.** `content/nav-snapshots/nav-237.production.html` is a byte-exact backup of production's menu 237 (captured 2026-07-20; `apply-council-navigation.js` pins its canonical sha256). Production's menu is *richer than the target*: it carries Home, a nested Work → Flavor Agent Hub → (AI Governance, Flavor Agent Demo) tree, Contact, and About labelled "Resume". The recut **drops Home and Contact from the nav and flattens the Work tree** — that is a content decision, not just a data migration. Run it **only after the Council theme is deployed**: production still serves 0.3.49, whose `parts/header.html` renders `wp:navigation {"ref":237}` directly, so recutting first would strip the live navigation while nothing yet consumes the Council data IA.
- **Single interaction owner:** `assets/js/header-controller.js` owns the mutually exclusive `closed|work|writing|search|drawer` state, disclosure keyboard/pointer behavior, focus restoration, breakpoint settlement, tab-out closing, and Interactivity Router history cleanup. Do not add competing header listeners. **Focus ownership is the subtle part:** a hover-opened panel records an `origin` the visitor never focused, so Escape restores focus only when focus is genuinely inside the header; the hover close stands down while focus is inside a panel; and the drawer-link close rescues focus only when it was stranded, because `router-scroll.js` may already have focused a hash target across the same commit window. `settle()` resets `state` and `origin` directly, since `applyState()` returns early when the router has detached the header. `scripts/verify-header.js` owns source, geometry, behavior, focus, reduced-motion, route-settlement, and screenshot checks.
- **Header sticky gotcha:** the sticky frosted bar is on the **`header.wp-block-template-part` wrapper**, not `.hp-site-header`. Moving `position:sticky` back onto `.hp-site-header` silently breaks the stick (its parent is the page-height scroller).

### The design-system round-trip (`design-pull`)

This theme is the **WordPress implementation of a claude.ai/design project**, "Imladris Design System". `docs/design-system/` (`README.md`, `INDEX.md`) is the **authoritative provenance + mapping**: every DS token was verified **1:1 against `theme.json`** at the 2026-06-20 pull, with the deliberate post-pull theme-side deltas (ink-450, `custom.scrim.*`, the dropped `borderWidth` group, darkened accessible text tokens) recorded in INDEX.md, plus a full **DS-component → theme-pattern map**. The React components are **reference-only** for a block theme — each is mirrored as a hand-authored pattern/part. A faithful token mirror is staged under `.design-pull/` (gitignored, re-pullable). To refresh or vendor more, re-run `/design-pull` against the project URL in `INDEX.md`. The selected `Header rework.dc.html` / Condensed Council handoff is likewise a **design reference only**: its DC runtime, DS bundle, duplicate fonts, and exploration controls are not production dependencies. **Read `docs/design-system/INDEX.md` before changing tokens, patterns, or the header/footer** — it records what maps to what and the fidelity-pass history.

### The design invariant — a "ledger" row anatomy

Status is expressed by a **semantic palette plus a redundant word** (done/review/pending — never color alone). Within any component, the **row anatomy is fixed** — padding, left-rule width, and radius are fixed named tokens **per component, never per state** (`--hp-rule-chip` 7px, `--hp-rule-entry` 3px, `--hp-rule-evidence` 5px, `--hp-rule-quote` 3px). State changes only the **rule color, surface tint, and a filled-vs-hollow dot** — never the shape. Preserve this when editing component CSS.

In the Council header the redundant word is the **status line itself** (`.hp-council-work-row__status`: "Release candidate · v0.1.0-rc.1", "Merged · upstream", …). It is real text inside the link, never `aria-hidden`, so it reaches the accessible name — `verify-header.js` asserts the four strings, that none is hidden, and that padding/radius/border/min-height are identical across states.

### The Council header's typography-floor exemption

Four Council header values sit **below the site-wide 12px text floor**, deliberately: `.hp-council-work-row__status` and `.hp-council-work-panel__eyebrow` at 9px, `.hp-council-drawer__legend` at 10px, and `.hp-council-digest-cue` at 8px. All four are uppercase mono in `--wp--custom--text--faint`, and they preserve the density of the Condensed Council design handoff. `verify-typography.js` does not see them — it gates on `getClientRects()`, and these live inside `[data-hp-header-panel][hidden]`, which is `display: none` at load. So the exemption is guarded in `verify-header.js` instead, which **pins each of the four computed sizes** (`SUB_FLOOR_TYPE`) inside its opened-panel and opened-drawer passes. Change a value there and the verifier fails: the exemption stays a decision rather than drift. Do not add new sub-floor values without pinning them the same way.

## Conventions & guardrails

- **WordPress PHP standards:** tabs, escaped output (`esc_url`, `esc_html`), sanitized input, nonce + capability checks for privileged actions, prefix theme functions/hooks `hperkins_` / patterns `hperkins-tokens/`.
- **Tokens first:** new design values go in `theme.json`, then alias in `style.css`. No parallel hardcoded hex.
- **Respect the CSS split:** component tokens/CSS → `style.css`; page-layout CSS for pulled designs → `assets/imladris-pages.css`.
- **Bump `style.css` `Version:`** (and mirror in `readme.txt` + add a changelog entry) when `style.css` or `theme.json` changes — release/version tracking; the cache key is `filemtime()`.
- **Don't edit the parent as if it's ours:** `assembler` is vendored upstream and lives beside this theme in the target WordPress install's `wp-content/themes/`, not in this repo.
- **`.design-pull/` is disposable** (gitignored, re-pullable); the durable provenance is `docs/design-system/`.
