---
name: verifiers
description: Run the HPerkins Tokens theme verifier scripts, WP-CLI checks, and library unit tests. Covers required env vars (HPERKINS_WP_PATH, HPERKINS_ORIGIN, HPERKINS_WP_CLI_PHAR), the --source-only / --require-local / --drafts flag modes, the WCUS portfolio phase gate, and which script owns which contract.
---

# Commands

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
node scripts/verify-job-placement-pages.js      # recruiter main + appendix at 1440/1024/768/390/320: outline, overflow/wrapping, recruiter-brief height budget, both appendix ledgers publishing complete before their filter narrows them, fragment target, CTAs, and reduced motion. Reads the accepted snapshots; add --drafts while an appendix or Digest redesign is in review
node scripts/verify-header.js                    # Condensed Council source + eight-width geometry, interaction, focus, reduced-motion, router cleanup, and screenshot checks (--source-only for the static half)
node scripts/verify-journal-polish.js           # /essays/ masthead clamp + overflow at 390/320px; fallback plate-crop variety
node scripts/verify-about-page-rendered.js      # /about/ phase-aware rendered contract at 1440/1024/768/390/320 plus boundary probes: derives the proof-first accepted-snapshot or v2 résumé shape from the selected body, then checks heading ancestry, named navigation + keyboard fragment behavior, responsive work/showcase layout, portrait text, prominent actions, focus, overflow, reduced motion, source/rendered word-count parity, and screenshots. --source-only --drafts checks the v2 candidate; --require-local --drafts runs it against the matching local install (needs HPERKINS_WP_PATH + non-production HPERKINS_ORIGIN)
node scripts/verify-typography.js               # site-wide typography contract: single H1, no heading skips, text floors, 68ch prose measure, four approved families, no synthetic Marcellus bold, bounded contrast, overflow at 320–1440px, SVG effective text size. --require-local is loopback-only and may quarantine only filesystem-like local fixture permalinks; it still requires a valid single-post route. --report audits without failing; --source-only runs the static half.
#
# WP-CLI / HTTP / file checks (no Chrome):
node scripts/verify-content-ownership.js        # page-body ownership plus exact menu-237 identity/shape and content/nav-snapshots/nav-237.html parity (wp-cli)
node scripts/verify-deployed-content-ownership.js # public post-deploy gate: digest + method DB bodies must equal committed snapshots (--drafts compares a reviewed local/live candidate; --source-only checks route wiring)
node scripts/verify-no-duplicate-pages.js       # no two published pages share a resolved permalink, a (parent, slug) tuple, or a title; every /work/ entry carries a real artifact link; homepage and /work/ list the same projects; patterns/work-index.php stays byte-identical to content/page-snapshots/work.html (wp-cli + file reads)
node scripts/verify-content-ownership-docs.js   # readme / CLAUDE / design-system docs still describe page and Council-header ownership accurately (pure file reads)
node scripts/verify-impeccable-artifacts.js     # PRODUCT / DESIGN / generated sidecar / theme-token parity plus shared hook and PHP-template detector coverage (pure file reads)
node scripts/verify-journal-templates.js        # blog template source contract: query IDs vs functions.php filters, sticky mode, seed offset, postcard link shape, per-loop empty states, arrow-free pagination labels, reader-hero dim ratio, data-URI palette hexes, pagination touch token (pure file reads)
node scripts/verify-job-placement-digest-source.js # recruiter brief word/link budget, four-block structure, selected proof attribution, appendix row counts/fragment target, immutable links, and retired-pattern contract
node scripts/verify-job-placement-digest-metadata.js # read-only public SEO/share gate: exact title, description, canonical, OG title/description, and absolute OG image (`HPERKINS_ORIGIN` base; `--url` exact override)
node scripts/verify-placement-artifacts.js      # one-page/searchable résumé, public/private workbook boundary, version/link consistency (--check-links performs the public HTTP pass). The résumé's HPerkins Tokens entry names a *shipped* version and links a release tag `--check-links` actually fetches, so it is checked against README.md's release record through `scripts/lib/release-record.js` rather than against style.css.
node scripts/verify-performance-assets.js       # image budgets, fontDisplay, eager LCP hero (fetchpriority=high, never loading=lazy), front-page CSS skip, responsive srcset/sizes contracts, and the 0.3.57 bundle split: PHP/JS bundle maps agree, no selector on both sides of the load order, and neither the front page nor the always-rendered markup (template parts, the patterns they delegate to, and inc/council-header.php) uses a bundle-owned class
node scripts/verify-style-token-usage.js        # every var() in style.css, the three assets/c/ bundles, AND assets/imladris-pages.css resolves against theme.json-generated variables, scoped per sheet to what actually loads with it (wp-cli)
node scripts/verify-about-page-source.js --drafts # exact v2 résumé contract against content/page-drafts/about.html: ordered sections, seven contribution rows, four current + three earlier roles, 30 evidence-backed skill terms, three impact signals, five showcase cards, the shared closing action panel, stable /contact/ and /one-page-resume/ actions, thin pattern adapter, and exclusive imladris-pages.css ownership. Omit --drafts to validate the accepted proof-first snapshot; candidate↔snapshot parity becomes required only after an approved promotion/export.
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
node --test scripts/lib/about-page-contract.test.js scripts/lib/about-page-rendered-probe.test.js scripts/lib/about-gravatar-heading.test.js scripts/lib/about-resume-style.test.js scripts/lib/about-resume.test.js scripts/lib/content-integrity.test.js scripts/lib/content-ownership-docs.test.js scripts/lib/event-copy-retirement-runbook.test.js scripts/lib/impeccable-artifacts.test.js scripts/lib/job-placement-digest-source-contract.test.js scripts/lib/job-placement-metadata-contract.test.js scripts/lib/journal-route-discovery.test.js scripts/lib/market-screen-parity.test.js scripts/lib/navigation-content-contract.test.js scripts/lib/page-content-contract.test.js scripts/lib/page-markup-contract.test.js scripts/lib/page-phase-contract.test.js scripts/lib/placement-artifact-contract.test.js scripts/lib/placement-artifact-links.test.js scripts/lib/production-gates-workflow.test.js scripts/lib/release-record.test.js scripts/lib/resume-route-contract.test.js scripts/lib/site-url.test.js scripts/lib/style-coverage.test.js scripts/lib/support-resume-cleanup.test.js scripts/lib/wp-cli.test.js scripts/lib/zip-archive.test.js

# Re-classify this repo after structural changes with the wp-project-triage skill.
```

`scripts/export-support-resume.ps1` resolves `HPERKINS_PYTHON_BIN` first, then `python` from `PATH`. The selected interpreter must import `python-docx`, `pdfplumber`, and `pypdf`; dependency preflight runs before Word can overwrite the PDF.

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
