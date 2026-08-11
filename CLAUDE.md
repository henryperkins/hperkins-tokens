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

# Theme verifiers (this repo's scripts/). Dependency-free (Node built-ins).
# Env overrides: CHROME_BIN (optional explicit Chrome/Chromium path; verify-header.js probes current-platform candidates when unset), HPERKINS_ORIGIN (default https://hperkins.blog),
# HPERKINS_WP_PATH (required for the wp-cli-backed scripts).
#
# Chrome + live site:
node scripts/verify-ring-cards-mobile.js        # 320px: three ring cards render, don't collide, no horizontal overflow on / and /ai-enablement/
node scripts/verify-contact-form-styling.js     # /contact/: themed .hp-input beats parent input rules; gold-700 border + 2px outline focus ring; subscribe status states, and the redirected-to status taking focus
node scripts/verify-homepage-hero-polish.js     # / hero title weight: medium mobile, semibold desktop
node scripts/verify-prominent-actions.js        # /, /about/, /job-placement-digest/, and Flavor Agent demo: rail/panel counts, 44px targets, focus, mobile stacking, overflow, screenshots
node scripts/verify-job-placement-pages.js      # recruiter main + appendix at 1440/1024/768/390/320: outline, overflow/wrapping, disclosures, fragment target, CTAs, and reduced motion
node scripts/verify-header.js                    # Condensed Council source + eight-width geometry, interaction, focus, reduced-motion, router cleanup, and screenshot checks (--source-only for the static half)
node scripts/verify-journal-polish.js           # /essays/ masthead clamp + overflow at 390/320px; fallback plate-crop variety
node scripts/verify-about-page-rendered.js      # /about/ proof-first rendered contract at 1440/1024/768/390/320 plus 895/896, 781/782, 600/601 boundary probes: heading inventory, named nav landmark + keyboard fragment activation and router-scroll focus, 24px nav/action targets, 2×2 work grid / 3-col capabilities, 2fr/1fr foundations split, two rails + one closing panel at 44px, no whole-card anchors or card-level hover, canonical source/rendered word-count parity, screenshots. --require-local runs it against the matching local install (needs HPERKINS_WP_PATH + non-production HPERKINS_ORIGIN)
node scripts/verify-typography.js               # site-wide typography contract: single H1, no heading skips, text floors, 68ch prose measure, four approved families, no synthetic Marcellus bold, bounded contrast, overflow at 320–1440px, SVG effective text size. --require-local is loopback-only and may quarantine only filesystem-like local fixture permalinks; it still requires a valid single-post route. --report audits without failing; --source-only runs the static half.
#
# WP-CLI / HTTP / file checks (no Chrome):
node scripts/verify-content-ownership.js        # page-body ownership plus exact menu-237 identity/shape and content/nav-snapshots/nav-237.html parity (wp-cli)
node scripts/verify-deployed-content-ownership.js # public post-deploy gate: digest + method DB bodies must equal committed snapshots (--drafts compares a reviewed local/live candidate; --source-only checks route wiring)
node scripts/verify-no-duplicate-pages.js       # no two published pages share a resolved permalink, a (parent, slug) tuple, or a title; every /work/ entry carries a real artifact link; homepage and /work/ list the same projects; patterns/work-index.php stays byte-identical to content/page-snapshots/work.html (wp-cli + file reads)
node scripts/verify-content-ownership-docs.js   # readme / CLAUDE / design-system docs still describe page and Council-header ownership accurately (pure file reads)
node scripts/verify-journal-templates.js        # blog template source contract: query IDs vs functions.php filters, sticky mode, seed offset, postcard link shape, per-loop empty states, arrow-free pagination labels, reader-hero dim ratio, data-URI palette hexes, pagination touch token (pure file reads)
node scripts/verify-job-placement-digest-source.js # recruiter main/appendix copy, outline, evidence, row counts, fragment target, immutable links, and retired-pattern contract. The digest's theme row is a claim about what is *released and deployed*, so it is checked against README.md's "Current release" + "Deployed commit" record, not against style.css — an in-flight version bump must not demand the page advertise a release tag nobody has cut. style.css may run ahead of that record, never behind it.
node scripts/verify-job-placement-digest-metadata.js # read-only public SEO/share gate: exact title, description, canonical, OG title/description, and absolute OG image (`HPERKINS_ORIGIN` base; `--url` exact override)
node scripts/verify-placement-artifacts.js      # one-page/searchable résumé, public/private workbook boundary, version/link consistency (--check-links performs the public HTTP pass). The résumé's HPerkins Tokens entry names a *shipped* version and links a release tag `--check-links` actually fetches, so — like the digest's theme row, and through the same `scripts/lib/release-record.js` parser — it is checked against README.md's release record rather than style.css.
node scripts/verify-performance-assets.js       # image budgets, fontDisplay, eager LCP hero (fetchpriority=high, never loading=lazy), front-page CSS skip, responsive srcset/sizes contracts, and the 0.3.57 bundle split: PHP/JS bundle maps agree, no selector on both sides of the load order, and neither the front page nor the always-rendered markup (template parts, the patterns they delegate to, and inc/council-header.php) uses a bundle-owned class
node scripts/verify-style-token-usage.js        # every var() in style.css, the three assets/c/ bundles, AND assets/imladris-pages.css resolves against theme.json-generated variables, scoped per sheet to what actually loads with it (wp-cli)
node scripts/verify-about-page-source.js --drafts # exact proof-first About contract against the reviewed candidate content/page-drafts/about.html: hero copy, heading inventory, three proof signals, hp-about-nav landmark, four Selected Work cards, EvidenceBoard rows, capabilities, selected experience, skills/foundations, closing panel, deterministic 850–950 word count, thin pattern adapter, and exclusive imladris-pages.css CSS ownership. Omit --drafts to validate the accepted snapshot plus candidate↔snapshot parity (passes only after the redesign is promoted + exported)
node scripts/verify-design-system-specimen.js   # post 79 specimen references live patterns; rendered checks auto-skip while the page is draft (wp-cli + HTTP)
node scripts/verify-subscribe-endpoint.js       # subscribe nonce rejection over HTTP + storage/rate-limit/privacy runtime checks (wp-cli; MUTATES+restores options — the runtime half runs only when HPERKINS_WP_PATH is set, and then hard-fails rather than skips if HPERKINS_ORIGIN doesn't match that install's home URL, refusing to mutate a different site)
node scripts/export-page-snapshots.js           # refresh content/page-snapshots/*.html after intentional edits to DB-owned page bodies (wp-cli); --page=<key> narrows, --expect-draft refuses to export unless the DB body equals the reviewed draft, --check runs the parity/hash steps without writing; snapshot writes are atomic (exclusive temp file, hash-verified rename)
node scripts/apply-local-page-drafts.js --confirm-local # guarded localhost-only application of the two reviewed recruiter drafts (MUTATES local pages). Explicit selection via repeated --page=<key>; --page=about is the ONLY way to apply the About candidate (never applied by default, requires the /about/ page to exist, updates only post_content). Requires HPERKINS_ORIGIN to match the selected install's home URL; draft bodies never enter the WP-CLI command line (Node SHA-256 preflight + PHP re-read/re-hash before any mutation)
node scripts/export-navigation-snapshot.js      # refresh content/nav-snapshots/nav-237.html from the selected site (wp-cli)
node scripts/apply-council-navigation.js        # guarded, idempotent menu-237 recut; refuses any state except its pinned baseline or already-current target (wp-cli; MUTATES)

# WP-CLI targets the configured WordPress site, not this theme repo:
wp --path="$HPERKINS_WP_PATH" theme list                 # hperkins-tokens active, assembler = parent
wp --path="$HPERKINS_WP_PATH" eval 'echo wp_get_theme()->get("Version");'
wp --path="$HPERKINS_WP_PATH" cache flush                # after theme.json / global-styles changes

# Unit tests for the shared script libraries. Name every file explicitly — the
# directory form of `node --test` is unreliable on Windows.
node --test scripts/lib/content-integrity.test.js scripts/lib/content-ownership-docs.test.js scripts/lib/event-copy-retirement-runbook.test.js scripts/lib/job-placement-metadata-contract.test.js scripts/lib/market-screen-parity.test.js scripts/lib/navigation-content-contract.test.js scripts/lib/page-content-contract.test.js scripts/lib/page-markup-contract.test.js scripts/lib/placement-artifact-links.test.js scripts/lib/production-gates-workflow.test.js scripts/lib/release-record.test.js scripts/lib/site-url.test.js scripts/lib/style-coverage.test.js scripts/lib/wp-cli.test.js scripts/lib/zip-archive.test.js

# Re-classify this repo after structural changes with the wp-project-triage skill.
```

### WCUS portfolio ownership and phase gate

`/one-page-resume/` is the stable visible-link destination. The final PDF remains a theme-owned artifact verified directly. `about-resume` substitutes only the portrait URL. Digest and About database bodies remain canonical; drafts are candidates and snapshots are accepted mirrors. Production page/footer writes are separate from a theme deploy.

The adapter never rewrites résumé links; visible résumé actions stay on the stable route.

Use the candidate-aware source and local-render checks before publication. The unflagged résumé-route command proves the public redirect and PDF response, while the artifact link pass validates the PDF and the other recruiter artifacts directly:

```powershell
node scripts/verify-resume-route.js --source-only
node scripts/verify-resume-route.js
node scripts/verify-job-placement-pages.js --source-only --drafts
node scripts/verify-prominent-actions.js --source-only --drafts
node scripts/verify-about-page-source.js --drafts
node scripts/verify-about-page-rendered.js --require-local --drafts
node scripts/verify-placement-artifacts.js --check-links
```

For Task 9 local rendering, keep the public commands above unchanged and opt in explicitly to the loopback-only verifier modes:

```powershell
node scripts/verify-typography.js --require-local
node scripts/verify-resume-route.js --require-local
```

These checks prepare and verify candidates; they do not promote them. Do not change accepted snapshots before the corresponding database bodies are explicitly approved, published, freshly re-read, and proven equal. A theme deploy may publish the route, CSS, adapter, footer source, and final PDF artifact, but it does not write the production Digest or About body or the database-owned footer override.

The verifiers load the **deployed** site at `https://hperkins.blog`; set `HPERKINS_ORIGIN` to point them elsewhere. `verify-header.js` owns the Council header's rendered geometry, disclosure and drawer behavior, focus restoration, route-commit cleanup, reduced-motion behavior, and screenshots.

## Architecture — the parts that need multiple files to understand

### `theme.json` is the single source of truth

It defines the entire token vocabulary: the palette (`parchment-*`, `mist-*`, `ink-*`, `green-*` (Evergreen, brand), `river-*` (links/info), `gold-*` (accent), `twilight-*`, plus semantic `leaf`/`amber`/`rust`/`slate`), the spacing scale, four self-hosted font families with type scale, and a deep `settings.custom` tree (`surface`, `text`, `border`, `rule`, `brand`, `accent`, `feedback`, `status`, `type`, `radius`, `shadow`, `ease`, `dur`, …). **All stock pickers and free-form value inputs are disabled** (`defaultPalette`/`defaultGradients`/`defaultDuotone`/`custom`/`customGradient`/`customDuotone` = false; `defaultFontSizes`/`defaultSpacingSizes` = false; `customFontSize`/`customSpacingSize` = false, so the editor offers no arbitrary type or spacing values either) so authors choose only from named tokens. `settings.typography.fluid` stays `false`, but the `2xl`–`5xl` heading presets are fluid **by value** — their `size` is a hand-authored `clamp()` (24–36 / 32–48 / 40–64 / 48–88px, 0.3.46), mirrored verbatim in the `custom.type.hero/h1/h2/h3` shorthand strings, so every heading that uses the presets is responsive without per-page overrides. Keep the preset and `custom.type` clamps in the same edit if either changes. Add new design values **here first**, then alias them in `style.css` — never introduce a parallel hardcoded value that can drift. One drift edge *inside* theme.json itself: the `settings.custom` tree repeats palette hexes as literals (a deliberate DS-mirror choice — `custom.type.*` shows the `var()` alternative), so when changing any palette color, grep theme.json for that hex and update the `custom` twins in the same edit.

### CSS: an always-on sheet, three conditional bundles, and a page sheet — all aliased onto generated vars

- **`style.css`** — the hand-authored sheet, loaded on **every** route. Its `:root` block **aliases onto the `theme.json`-generated `--wp--preset--*` / `--wp--custom--*` vars** (e.g. `--hp-neutral-900: var(--wp--custom--text--strong)`) so there are no parallel hex copies. It then holds the **core component CSS** (`.hp-ring-card`, `.hp-site-header`, `.hp-footer`, chips/rows, etc.). Treat it as the authored artifact; keep it clean.
- **`assets/c/{evidence,interactive,longform}.css`** — **conditionally loaded component bundles** (0.3.57), extracted from `style.css` so the front page ships none of them (131.4 → 79.2 KiB raw, 26.2 → 17.5 KiB gzip). Each bundle owns a fixed set of class-name prefixes; `.hp-lead`, `.hp-quote` and the artifact/evidence vocabulary are `evidence`, the disclosure/subscribe/input/badge/tag/avatar vocabulary is `interactive`, and tables/reader-hero/archive-hero/work-template are `longform`. They enqueue after `hperkins-tokens` and before `hperkins-pages`, preserving the old source order. See **conditional component styles** below.
- **`assets/imladris-pages.css`** — **page-layout CSS** for designs pulled from the design system (about, ai-enablement essay, contact, work index, job-placement digest), **plus the entire blog surface**: the postcard vocabulary shared by `home`/`single`/`archive`/`search` (`.hp-postcard__*`, `.hp-journal-*`, `.hp-pagination`) and the reader hero (`.hp-reader-*`). Deliberately kept **out of `style.css`** so the hand-authored sheet stays untouched; enqueued separately (handle `hperkins-pages`) and depends on `hperkins-tokens` so the cascade is right. Put page-specific layout here, component tokens/CSS in `style.css` or the matching bundle. The blog rules are the one set of genuinely reusable components living in this sheet; the front-page skip is safe for them only because `front-page.html` outranks `home.html` at `/`, so no blog route is ever the front page. **Anything a blog rule needs on every route must live in `style.css`** — that is why the heading wrap guard and the reader's post-tag pill are there and not here. The pill is the case that shows why the split is done at **selector**, not rule, granularity: `.hp-tag` and `.hp-reader-tags a` were one grouped rule, `.hp-tag` is `interactive`-owned, and `.hp-reader-tags a` is not — so the declarations were written into both files. `wp:post-terms` emits bare `<a>` elements, so the reader never matches `.hp-tag` and stays styled with no bundle loaded. Move the whole rule to a bundle and every untagged-by-`interactive` post loses its pills.

Prominent page actions compose the canonical Button primitive through
`.hp-action-rail`; final invitations add `.hp-action-panel.is-closing`.
Both are shared components in `style.css`. Page selectors may own surrounding
typography and layout, but compact header, form, icon, and specimen controls
must not opt into either class.

The entire About page layer (`.hp-about-template…` composition, polish, wide
breakout, and the proof-first redesign selectors) lives in
`assets/imladris-pages.css` as of 0.3.56 — `style.css` contains no
`.hp-about-template` selector anymore, and the About source contract enforces
that split. `verify-style-token-usage.js` validates var() usage across all five
authored sheets, each scoped to what actually loads with it: `style.css` alone,
each `assets/c/` bundle against `style.css` plus itself (never a sibling
bundle — they load independently), and `imladris-pages.css` against
`style.css` plus itself.

### Conditional component styles (`inc/component-styles.php`, 0.3.57)

**The gate is content, not page identity.** These components arrive through
patterns an editor inserts, so an `is_page()` allowlist would leave them
unstyled the first time one is used somewhere new. On `wp_enqueue_scripts` the
resolver builds a **haystack** — the queried post's body, the template
WordPress actually resolved (`$_wp_current_template_content`, which respects a
Site Editor override stored in `wp_template` and can differ from the theme
file), and **every theme pattern reachable from either, expanded
transitively** — then `strpos()`-matches each bundle's class prefixes against
it. Two coupled maps must stay identical: `hperkins_tokens_bundle_map()` and
`BUNDLES` in `scripts/lib/style-coverage.js`; `verify-performance-assets.js`
fails if they diverge.

Three things are easy to get wrong here:

- **Pattern expansion has to be transitive.** `page-contact.html` names
  `hperkins-tokens/contact`, which names `hperkins-tokens/imladris-subscribe`,
  which is the only source of `.hp-subscribe`. A one-level walk resolved
  `/contact/` correctly only by accident, because `contact.php` independently
  uses `.hp-input` from the same bundle.
- **Template parts are excluded on purpose.** They render on every route, so
  anything they use belongs in `style.css`. The guard has to follow their
  delegations, not just read the part files: `parts/header.html` is a bare
  `[hperkins_council_header]` shortcode whose markup lives in
  `inc/council-header.php`, and `parts/footer.html` delegates to the
  `footer-colophon` pattern.
- **The null-haystack "load everything" path is a backstop, not the safety
  net.** WordPress sets `$_wp_current_template_content` for effectively every
  front-end request on a block theme — falling back to the **parent** template
  when this theme owns no match — so the haystack is almost never null. A
  parent-served route with no queried post resolves to **zero** bundles, not
  all three. Every route this theme serves is theme-owned today; keep it that
  way, or add the route's template here.

Enqueue order is carried by the `array( 'hperkins-tokens' )` dependency, which
`WP_Dependencies` resolves at print time — **not** by the priority. The
`require_once` at `functions.php:33` registers this callback *before* the main
enqueue closure at the same priority 20, so it actually runs first. Keep the
dependency.

### `functions.php` — parent/child load-order surgery (read before touching enqueue/editor wiring)

Because Assembler registers `assembler-style` from the *stylesheet* dir — which under a child theme resolves to **this** theme's `style.css` — the child CSS would load twice. `functions.php`:
- **Frontend (`wp_enqueue_scripts`, prio 20):** dequeues `assembler-style`, then enqueues **parent-then-child explicitly** (`assembler-parent` → `hperkins-tokens`), then `hperkins-pages` — **skipped on the front page** (`! is_front_page()`; the front page uses no page-layout CSS, and the full-page router adds the sheet's `<link>` on client swaps to other pages — verified live). `inc/component-styles.php` adds the `hperkins-c-*` bundles to the same hook; they print between `hperkins-tokens` and `hperkins-pages`, which is the order the rules had inside `style.css` before the split. It injects the footer- and hero-backdrop image URLs as CSS custom properties (`--hp-footer-backdrop-url`, `--hp-council-hero-backdrop-url`) via `wp_add_inline_style` (the hero uses an `image-set(webp,png)` branch when `elvenbook.webp` exists), and enqueues three deferred progressive-enhancement scripts: `header-controller.js`, `form-enhance.js`, and `router-scroll.js`. The Council controller replaces the retired `nav-close-delight.js` and `header-search.js` listeners. No-JS fallbacks: the header exposes its complete noscript navigation, the contact form is a `mailto:` form, and the subscribe form is a real HTTPS POST to `admin-post.php` (see the subscribe endpoint below).
- **Editor (`after_setup_theme`, prio 20):** rewrites editor styles to load **three** sheets — parent `style.css`, child `style.css`, and `imladris-pages.css` (the editor previews page CSS on every template since `add_editor_style` registers globally) — dropping only the fragile relative `style.css` entry (so other plugins' editor styles survive). Also `remove_action(..., 'assembler_preload_fonts', 1)` — the parent preloads an InterVariable font path that 404s under this child (Imladris serves its own `theme.json` font faces).
- **`init` (prio 9):** registers the **`hperkins` pattern category** and block styles — `core/button`: `secondary`/`ghost`/`accent`/`link`; `core/quote`: `imladris`.
- **Subscribe endpoint (`admin_post[_nopriv]_hperkins_tokens_subscribe`):** the newsletter form POSTs to `admin-post.php` — nonce check, `is_email`, per-IP transient rate limit (5/10min, filterable), then storage in the bounded non-autoloaded `hperkins_tokens_subscribe_requests` option (capped 200, optimistic concurrency) + a notification mail (recipient filterable via `hperkins_tokens_subscribe_notify_email`). Duplicates resolve to the generic success status (anti-enumeration). WordPress privacy **exporter + eraser** callbacks are registered for the stored requests. Status returns via `?hperkins_subscribe=<status>#subscribe`, rendered by the subscribe pattern.
- **Query filters:** the single.html related loop (queryId **12**) excludes the current post via `query_loop_block_query_vars`; the home.html journal grid (queryId **11**, seed offset 3) is tagged so a `found_posts` filter subtracts the offset — without it core fabricates a trailing empty pagination page at post counts like 7–9. Both are keyed to the template's literal queryId: renumber the template, update the filter.
- **Comments are closed on the front end** (`comments_open` + `pings_open`). The theme renders no comment UI anywhere — no comments template, no form, no count — but WordPress would still accept POSTs to `wp-comments-post.php` for any post whose `comment_status` is open, so discussion could accumulate on a site that never shows it. This is a filter, not a database change: nothing is written to post records, and `add_filter( 'hperkins_tokens_enable_comments', '__return_true' )` restores the previous behaviour. Admin requests are untouched.
- **Other request-time hooks:** a 301 from the agent-owned `flavor-agent-demo` seed slug to `/work/flavor-agent/demo/` (`template_redirect`); a site-wide `<link rel=preload>` for the Cormorant Garamond display face (`wp_head` prio 1, URL matched to the theme.json font face so the browser dedupes; theme.json sets every heading in that family and every route opens on one, so scoping the preload to the front page left the /essays/ masthead, every reader hero, and every archive title to swap); and a five-hook set that **hides inherited Assembler style variations + section styles** from the Site Editor, global-styles/block-type REST responses, and the theme-JSON data (so the editor can't switch the child onto parent palettes that bypass the locked tokens).
- **`after_switch_theme`:** one-time legacy `wp_global_styles` cleanup (removes stale `wp-global-styles-pub/` and `…-assembler` posts, clears the theme-JSON cache). Activation-time migration, not a request-time task; guarded by the `hperkins_tokens_global_styles_cleanup_v1` option.

> **Cache-busting is `filemtime()`-based for every hand-authored asset.** `style.css`, `assets/imladris-pages.css`, the three `assets/c/` bundles, and the three JS files (`header-controller.js`, `form-enhance.js`, `router-scroll.js`) bust on file mtime, so editing any of them ships under a fresh cache key automatically — no manual step. Still bump the `style.css` `Version:` header (and mirror it in `readme.txt`) when you change `style.css`/`theme.json`, but now for **release/version tracking** (the theme's declared version + changelog source-of-truth), not cache invalidation. The parent `assembler-parent` sheet is versioned by Assembler's own `Version`.

### Patterns & templates

- **`patterns/`** — two kinds. The **`imladris-*`** files are the reusable **design-system components** (button, badge, tag, avatar, callout, pullquote, input, subscribe, ring-card, icon-button); the rest are content/section patterns (about-resume, work-index, contact, ai-enablement, proof-bar, work-entry, evidence-first, …). Every pattern uses the header block `Slug: hperkins-tokens/<name>`, `Categories: hperkins`, and cache-busts image `src`s with a `filemtime` `?v=` query arg (theme assets via `hperkins_tokens_asset_url()`; the uploads-hosted About portrait computes its own mtime in the adapter and carries a pinned `?v=` in the DB body — bump it by hand if the upload is ever replaced in place). The `/work/` and `/ai-enablement/` content patterns are reusable seeds/reference copies rather than the live route owners. `about-resume` is a **thin adapter over the accepted snapshot**: it reads `content/page-snapshots/about.html`, substitutes exactly the known portrait URL with a `filemtime()`-derived URL, fails closed (emits nothing) on a missing/empty snapshot or a substitution-count mismatch, never reads the work-in-progress draft, and carries no About page markup of its own — so the About body cannot acquire a third maintained copy. Résumé links stay on the stable `/one-page-resume/` route; the adapter does not rewrite them. The former full-page `job-placement-digest` pattern is retired so the recruiter page cannot acquire a third maintained body. On `/`, the theme-owned `wapuu-home-hero` pattern remains live so its asset URLs stay dynamic. `footer-colophon` is a pattern rather than markup in `parts/footer.html` for one reason: a template part is static HTML and cannot compute the copyright year, so the literal went stale every January. It is `Inserter: no` — a footer fragment, not something to place by hand.
- **`templates/` + `parts/`** — front-page, home/single (blog index + reader), archive/search/404 (theme-owned as of 0.3.46: proper H1 via `wp:query-title` or a heading block, journal-postcard results reusing the `hp-postcards`/`hp-postcard` vocabulary, query IDs 13/14 — never reuse 11/12, which are keyed to `functions.php` filters; `archive.html` also carries the `hp-topic-filter` row, because a term archive is the only route where core marks the current topic — `wp_list_categories()` reads the queried object, so `current-cat` never matches on `/essays/` — and it keeps the archive-type prefix so a category and a tag of the same name do not render as the same title), page-about, page-ai-enablement, page-case-study, page-contact, page-job-placement-digest, page-placement-method-and-evidence, page-work, page-how-this-was-built; header/footer parts. Unspecified templates are **inherited from Assembler**. Two WooCommerce templates are the exception — `archive-product.html` and `single-product.html` are overridden here, each an Assembler copy with targeted edits. The catalogue is what `product_cat` term archives resolve to (WooCommerce ships no `taxonomy-product_cat`, so `/product-category/<slug>/` falls through to `archive-product`); it drops the results-count/catalog-sorting row and gives each card a summary and an Add to cart button at two columns. `single-product.html` moves `woocommerce/product-details` out of the 50%-wide buy-box column into a constrained group below the columns, so long-form product copy gets the reading measure instead of a half-width column beside an empty gallery well — this is also what WooCommerce's own default template does. That block's `align` attribute **defaults to `wide`**, so the override carries an explicit `"align":"none"`; drop it and the description breaks straight back out to `wideSize` and the move buys nothing. `front-page.html` wraps the stored Home page body between the theme-owned `wapuu-home-hero` pattern and the theme-owned Three Rings section; the tracked middle section lives in `content/page-snapshots/front-page.html`. `page-about.html`, `page-ai-enablement.html`, `page-job-placement-digest.html`, `page-placement-method-and-evidence.html`, and `page-work.html` render stored page bodies through `wp:post-content`; their verified mirrors live in `content/page-snapshots/about.html`, `content/page-snapshots/ai-enablement.html`, `content/page-snapshots/job-placement-digest.html`, `content/page-snapshots/placement-method-evidence.html`, and `content/page-snapshots/work.html`. For these visitor-facing routes, the WordPress database body is canonical and the committed snapshot is its automatically verified mirror—not an independent authoring source. About additionally keeps its **one human-authored candidate** at `content/page-drafts/about.html` (the guarded local-apply input for the proof-first redesign): candidate and snapshot may differ only while review is in progress, the candidate reaches a local DB only via the explicit `--page=about` draft command, and the snapshot is refreshed only through the parity-checked `--expect-draft` export. The published Flavor Agent demo child page (`/work/flavor-agent/demo/`) also keeps its artifact embed + explainer in `post_content`; because it inherits the generic page shell rather than a theme-owned wrapper, its verified mirror is tracked separately at `content/page-snapshots/work-flavor-agent-demo.html`. Refresh the tracked mirrors with `node scripts/export-page-snapshots.js` only after intentional live DB-body edits and verify drift with `node scripts/verify-content-ownership.js`. The retired `plato-artifacts` path is asserted absent by that verifier. `page-how-this-was-built.html` is by contrast fully **theme-owned**: it embeds the `hperkins-tokens/how-this-was-built` build-report pattern and its DB page (post 263) carries an empty `post_content`, so the pattern file is the source of record — it is deliberately **not** part of the `wp:post-content` snapshot contract (there is no DB body to track). At `/`, `front-page.html` intentionally outranks `home.html`.
- **The blog surfaces are fully theme-owned, and `/essays/` is the exception worth stating.** `home.html`, `single.html`, `archive.html`, and `search.html` carry no `wp:post-content`, so none of them is part of the page-snapshot contract. `/essays/` is the subtle one: WordPress resolves it through the posts-page assignment (page **236**), so that page supplies the **document title** while every visible word on the route — eyebrow, `<h1>`, and lead — is hardcoded in `templates/home.html`. Editing the page body changes nothing on screen, and editing the template leaves the tab title behind; change the two together or they drift apart silently. Page 236 is deliberately **not** in `content/page-snapshots/` and not in `page-content-contract.js`, because it owns no rendered body.
- **`single.html`'s standfirst is `wp:post-excerpt`, not a subtitle field.** With no manual excerpt WordPress falls back to the article's opening 40 words, which then appear twice in a row — once in the hero, once at the top of the prose. Every published post needs a hand-written excerpt; there is no `has_excerpt()` guard in the template and no verifier for it, so this is an authoring requirement, not an enforced one.
- **Blog template source has its own verifier.** `node scripts/verify-journal-templates.js` pins the couplings a rendered page cannot show: query IDs against the `functions.php` filters, the WordPress 6.6-compatible empty `sticky` mode on queryIds 10/11 paired with the `ignore_sticky_posts` filter, the offset-3 ↔ `found_posts` agreement, `isLink:false` on every postcard featured image, a `wp:query-no-results` for every Query Loop (a loop without one renders nothing at all when it is empty — under a heading that promised results, inside the pagination chrome a stale `?query-N-page=…` still draws), arrow glyphs kept out of pagination labels and left to core's `aria-hidden` `paginationArrow` span, the reader hero's dim ratio (core only ships dim classes in multiples of ten — any other value silently renders at 0.5), palette-pinned hexes inside data URIs, and the pagination touch token. It needs neither Chrome nor a WordPress install.
- **Condensed Council header:** `parts/header.html` retains the `.hp-site-header` wrapper and renders `[hperkins_council_header]`. `inc/council-header.php` owns the server markup, the safe fallback, and the current Work evidence data. Menu post **237** is DB-owned input to that renderer; its core Navigation markup is **not** rendered directly. The exact data IA is Work (`hp-nav-work`), Writing (`hp-nav-writing`) with AI Enablement (`hp-nav-ai`), Essays (`hp-nav-essays`), and Job Placement Digest (`hp-nav-digest`), About, Search (`hp-drawer-search`), and Subscribe (`hp-nav-subscribe`). Because there is no published `/writing/` route, the mobile drawer deliberately exposes Work, Essays, AI Enablement, About, Job Placement Digest, Search, and Subscribe as reachable rows; Contact remains a labelled footer route. The renderer also **says where the visitor is** (`aria-current="page"` on all ten destinations, `is-current` on the Work and Writing items for any descendant route) — the retired core Navigation block gave this for free, so dropping it was a regression. The root carries **`data-hp-header-source="navigation|fallback"`**: the fallback's labels and URLs are byte-identical to the DB model, so without that attribute a silent detach from menu 237 passes every rendered assertion. `verify-header.js` requires `navigation`.
- **Menu-237 recovery and mutation:** the portable source copy is `content/nav-snapshots/nav-237.html` (the recut *target*). Refresh it with `node scripts/export-navigation-snapshot.js`, verify it with `node scripts/verify-content-ownership.js`, and use only the hash-guarded `node scripts/apply-council-navigation.js` for the approved recut. Never hand-edit the live record without a fresh verified backup and snapshot parity.
- **Menu 237 has a guarded production baseline and a separate current target.** `content/nav-snapshots/nav-237.production.html` is the byte-exact pre-recut backup captured 2026-07-20; `content/nav-snapshots/nav-237.html` is the portable current target consumed by the deployed Condensed Council renderer. `apply-council-navigation.js` accepts only its pinned baseline or the already-current target. Do not use it as a generic navigation editor or rerun it against an unverified third state.
- **Single interaction owner:** `assets/js/header-controller.js` owns the mutually exclusive `closed|work|writing|search|drawer` state, disclosure keyboard/pointer behavior, focus restoration, breakpoint settlement, tab-out closing, and Interactivity Router history cleanup. Do not add competing header listeners. **Focus ownership is the subtle part:** a hover-opened panel records an `origin` the visitor never focused, so Escape restores focus only when focus is genuinely inside the header; the hover close stands down while focus is inside a panel; and the drawer-link close rescues focus only when it was stranded, because `router-scroll.js` may already have focused a hash target across the same commit window. `settle()` resets `state` and `origin` directly, since `applyState()` returns early when the router has detached the header. `scripts/verify-header.js` owns source, geometry, behavior, focus, reduced-motion, route-settlement, and screenshot checks.
- **Header sticky gotcha:** the sticky frosted bar is on the **`header.wp-block-template-part` wrapper**, not `.hp-site-header`. Moving `position:sticky` back onto `.hp-site-header` silently breaks the stick (its parent is the page-height scroller).

### The design-system round-trip (`design-pull`)

This theme is the **WordPress implementation of a claude.ai/design project**, "Imladris Design System". `docs/design-system/` (`README.md`, `INDEX.md`) is the **authoritative provenance + mapping**: every DS token was verified **1:1 against `theme.json`** at the 2026-06-20 pull, with the deliberate post-pull theme-side deltas (ink-450, `custom.scrim.*`, the dropped `borderWidth` group, darkened accessible text tokens) recorded in INDEX.md, plus a full **DS-component → theme-pattern map**. The React components are **reference-only** for a block theme — each is mirrored as a hand-authored pattern/part. A faithful token mirror is staged under `.design-pull/` (gitignored, re-pullable). To refresh or vendor more, re-run `/design-pull` against the project URL in `INDEX.md`. The selected `Header rework.dc.html` / Condensed Council handoff is likewise a **design reference only**: its DC runtime, DS bundle, duplicate fonts, and exploration controls are not production dependencies. **Read `docs/design-system/INDEX.md` before changing tokens, patterns, or the header/footer** — it records what maps to what and the fidelity-pass history.

### The design invariant — a "ledger" row anatomy

Status is expressed by a **semantic palette plus a redundant word** (done/review/pending — never color alone). Within any component, the **row anatomy is fixed** — padding, left-rule width, and radius are fixed named tokens **per component, never per state** (`--hp-rule-chip` 7px, `--hp-rule-entry` 3px, `--hp-rule-evidence` 5px, `--hp-rule-quote` 3px). State changes only the **rule color, surface tint, and a filled-vs-hollow dot** — never the shape. Preserve this when editing component CSS.

In the Council header the redundant word is the **status line itself** (`.hp-council-work-row__status`: "Release candidate · v0.1.0-rc.3", "Merged · upstream", …). It is real text inside the link, never `aria-hidden`, so it reaches the accessible name — `verify-header.js` asserts the four strings, that none is hidden, and that padding/radius/border/min-height are identical across states.

### The Council header's typography-floor exemption

Three Council header values sit **below the site-wide 12px text floor**, deliberately: `.hp-council-work-row__status` and `.hp-council-work-panel__eyebrow` at 9px, and `.hp-council-digest-cue` at 8px. All three are uppercase mono in `--wp--custom--text--faint`, and they preserve the density of the Condensed Council design handoff. The mobile `.hp-council-drawer__legend` is intentionally outside that exemption at the 13px `xs` functional-text token. `verify-typography.js` does not see these labels at load because they live inside `[data-hp-header-panel][hidden]`; `verify-header.js` therefore pins the three sub-floor values and the drawer legend's 13px token inside its opened-panel and opened-drawer passes. Change a value there and the verifier fails: the exception stays a decision rather than drift. Do not add new sub-floor values without pinning them the same way.

## Conventions & guardrails

- **WordPress PHP standards:** tabs, escaped output (`esc_url`, `esc_html`), sanitized input, nonce + capability checks for privileged actions, prefix theme functions/hooks `hperkins_` / patterns `hperkins-tokens/`.
- **Tokens first:** new design values go in `theme.json`, then alias in `style.css`. No parallel hardcoded hex.
- **Respect the CSS split:** always-on tokens/CSS → `style.css`; component CSS whose classes a bundle owns → the matching `assets/c/` bundle; page-layout CSS for pulled designs → `assets/imladris-pages.css`. A rule that any route needs *without* a bundle anchor present belongs in `style.css`, and a grouped rule split across the two must carry its declarations in both.
- **Bump `style.css` `Version:`** (and mirror in `readme.txt` + add a changelog entry) when `style.css` or `theme.json` changes — release/version tracking; the cache key is `filemtime()`.
- **Don't edit the parent as if it's ours:** `assembler` is vendored upstream and lives beside this theme in the target WordPress install's `wp-content/themes/`, not in this repo.
- **`.design-pull/` is disposable** (gitignored, re-pullable); the durable provenance is `docs/design-system/`.
