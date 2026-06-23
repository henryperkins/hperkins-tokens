# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A full **WordPress site checkout** for **hperkins.blog** (Henry Perkins' portfolio/blog). Core runs **WP 7.1-alpha** (bleeding edge via the bundled `wordpress-beta-tester` + `gutenberg` plugins); the production/deploy target is WP 7.0 / PHP 8.2. The site exists to showcase a **governed-AI plugin stack** (`flavor-agent` + the in-core AI Client + MCP).

WordPress core — `wp-admin/`, `wp-includes/`, and the root `wp-*.php` files — is **vendored upstream**. Do not edit it unless the task is explicitly a core patch.

`AGENTS.md` is the companion doc (coding style, PR conventions, security notes, agent-skill routing). Keep the two consistent; this file adds the cross-file architecture AGENTS.md doesn't cover.

## Where the project-specific code lives

Most of `wp-content/` is vendored. The code that is actually *this project*:

- `wp-content/themes/hperkins-tokens/` — **ours.** The "Imladris" design-system child theme. Has its **own nested git repo** (remote `github.com/henryperkins/hperkins-tokens`, branch `main`) with real history.
- `wp-content/themes/assembler/` — **vendored parent theme** (Automattic). Don't hand-edit as if it's ours.
- `wp-content/plugins/ai-provider-for-anthropic/`, `wp-content/plugins/ai-provider-for-openai/` — **ours.** AI Client provider plugins.
- **Symlinked plugins that point OUTSIDE this repo** — editing through these paths edits separate git repos (each with its own `.claude/` and tooling):
  - `plugins/flavor-agent` → `/home/dev/flavor-agent` (the centerpiece custom plugin)
  - `plugins/mcp-adapter` → `/home/dev/mcp-adapter`
  - `plugins/scriptorium-ai-provider-for-codex` → `/home/dev/ai-provider-for-codex`
- **Vendored plugins** (don't treat as project code): `ai` (canonical WordPress/ai), `gutenberg`, `plugin-check`, `wordpress-beta-tester`, `akismet`.
- `scripts/` — Node verifiers (see Commands). `migration/` — Studio→droplet migration artifacts (sensitive; see Migration).

> The **root** checkout is a fresh `git init` with **0 commits and nothing tracked** (no root `.gitignore`). Real version control happens inside the nested `hperkins-tokens/` theme repo, not at the root.

## Commands

There is **no root `package.json`, Composer config, or Makefile, and no build step for project code** — the theme is hand-authored HTML/CSS/PHP + `theme.json`, and the provider plugins are plain PHP with a hand-rolled `src/autoload.php` (no Composer). Use WordPress tooling directly.

```bash
# WP-CLI always targets this checkout via --path:
wp --path=/home/dev/hperkinsblog plugin list
wp --path=/home/dev/hperkinsblog theme list        # hperkins-tokens active, assembler = parent
wp --path=/home/dev/hperkinsblog eval '<php>'       # how the verifiers introspect the live config

# Lint (the de-facto check — no phpcs config present): PHP syntax-check the custom code
find wp-content/themes/hperkins-tokens \
     wp-content/plugins/ai-provider-for-openai \
     wp-content/plugins/ai-provider-for-anthropic \
     -name '*.php' -print0 | xargs -0 -n1 php -l

# Theme verifier (WP-CLI + headless Chrome). Needs https://hperkins.blog reachable and
# Chrome at $CHROME_PATH or /usr/bin/google-chrome:
node scripts/verify-hperkins-tokens.js     # editor-stylesheet uniqueness + Assembler parent present;
                                           # 320px mobile overflow; ≥44px touch targets; ring-card
                                           # layout @1440/2048; nav breakpoints — across portfolio pages
node scripts/verify-nav-close.js           # static (curl-only): locks the router-aware
                                           # close-on-tap contract for the mobile nav overlay

# Plugin-check is installed (vendored), if you need WP.org-guideline checks:
wp --path=/home/dev/hperkinsblog plugin check <slug>

# Re-classify the repo after structural changes:
node /home/dev/.claude/skills/wp-project-triage/scripts/detect_wp_project.mjs
```

WP-CLI introspects the local checkout; the browser-based verifier loads the **deployed** site at `https://hperkins.blog`. Behavioral UI checks (tap → overlay closes across the Interactivity Router swap) are covered by the **Playwright MCP** harness, not by the Node verifiers.

## Architecture: the parts that need multiple files to understand

### Theme — HPerkins Tokens (the "Imladris" design system)

- **`theme.json` is the single source of truth.** It defines the palette (`parchment-*`, `ink-*`, `green-*`, `river-*`, `gold-*`, `twilight-*`, plus `leaf/amber/rust/slate`) and a deep `settings.custom` tree (`surface`, `text`, `border`, `rule`, `status`, `radius`, `shadow`, `ease`, `dur`, …). `style.css` deliberately **aliases onto the generated `--wp--custom--*` / preset CSS vars** rather than duplicating hex values — don't introduce a parallel set of hardcoded colors that can drift.
- **`functions.php` does load-order surgery for the parent/child pair.** Because Assembler registers `assembler-style` from the *stylesheet* dir (which resolves to the **child** under a child theme), it would otherwise load the child CSS twice. `functions.php` dequeues that, then enqueues **parent-then-child explicitly** on both the frontend (`wp_enqueue_scripts`) and the block editor (`after_setup_theme` editor-style rewrite). It also drops Assembler's broken `assembler_preload_fonts` preload, injects the wapuu/footer-backdrop image URLs as CSS custom properties, and enqueues `assets/js/nav-close-delight.js`. If you touch stylesheet/editor wiring, `verify-hperkins-tokens.js`'s stylesheet assertions are the contract.
- Registers custom **block styles** (`core/button`: secondary/ghost/accent/link; `core/quote`: imladris) and the **`hperkins` pattern category**. On theme activation it runs a one-time **legacy `wp_global_styles` cleanup** (removes stale `wp-global-styles-pub/`, `…-assembler` posts and clears the theme-JSON cache) — this is activation-time migration, not a request-time task.
- UI lives in `templates/` (front-page, page-about, page-case-study), `parts/` (header/footer), and `patterns/` — the `imladris-*` patterns are the reusable design-system components; the others are content/case-study patterns.

### AI / governance plugin stack (how the pieces relate)

- The vendored **`ai`** plugin (canonical WordPress/ai) supplies the **`WordPress\AI\Abstracts\Abstract_Feature` / `Abstract_Ability`** "canonical contracts."
- **`flavor-agent`** registers Features/Abilities on top of those contracts — *governed* AI edits: bounded operations, review-gated structural changes, server-side attribution, drift-safe undo. Gated **off by default** behind `wpai_features_enabled` and `wpai_feature_flavor-agent_enabled` options.
- The **AI provider plugins** (`ai-provider-for-anthropic`, `ai-provider-for-openai`, `scriptorium-ai-provider-for-codex`) register providers with the **in-core AI Client / Connectors** (admin: Settings → Connectors). Each follows the same `src/` shape — `Provider/`, `Models/` (text, and image for OpenAI), `Metadata/`, `Authentication/`. API keys are configured via Connectors, not in code.
- **`mcp-adapter`** exposes the **Abilities API** as MCP tools/resources/prompts; flavor-agent's abilities surface at `/wp-json/wp-abilities/v1/*` and a dedicated MCP route.

### Migration

`migration/RUNBOOK.md` documents a **Studio (SQLite) → self-hosted droplet (MySQL)** migration: **content** moves via **WXR** (DB-agnostic), **theme + uploads** move as files, and **plugins are deployed separately**. `migration/backups/*.sql`, `migration/bundle/`, and `migration/stage/` are sensitive (DB dumps, export bundles) — don't commit or exfiltrate them.

## Conventions & guardrails

- **WordPress PHP standards:** tabs, escaped output, sanitized input, nonce + capability checks for privileged actions, prefix project functions/hooks. Custom stack baseline is **PHP 8.2 / WP 7.0+**.
- **Don't edit vendored code as if it's ours:** core (`wp-admin/`, `wp-includes/`, root `wp-*.php`), the `assembler` parent theme, or the vendored plugins (`ai`, `gutenberg`, etc.).
- **Mind the symlinks:** changes under `plugins/flavor-agent`, `plugins/mcp-adapter`, and `plugins/scriptorium-ai-provider-for-codex` land in separate `/home/dev/*` repos.
- **Secrets:** never commit `wp-config.php` values, DB dumps, or migration bundles.
- **Agent skills:** see **Applicable Agent Skills** in `AGENTS.md` for which WordPress skill to route through per area (`theme.json`/templates, provider plugins, the `ai` plugin, core AI Client, abilities, REST, WP-CLI, performance).
