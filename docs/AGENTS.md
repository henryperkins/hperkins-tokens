# Repository Guidelines

## Project Structure

This repository is the standalone `hperkins-tokens` WordPress block child theme, not a WordPress core or site checkout. Theme PHP, `theme.json`, templates, parts, patterns, assets, tracked page snapshots, and dependency-free Node verifiers live at the repository root. WordPress core, the database, uploads, plugins, and the required `assembler` parent theme belong to a separate local WordPress installation.

For local development, link or junction this repository into `<wordpress>/wp-content/themes/hperkins-tokens` and install `assembler` beside it. Do not copy local WordPress core, databases, uploads, credentials, or generated Studio state into this repository.

## Local WordPress and WP-CLI

Database-backed verifier scripts require an explicit `HPERKINS_WP_PATH`; there is no hard-coded site fallback. `HPERKINS_ORIGIN` selects the matching HTTP origin. On Windows, `scripts/lib/wp-cli.js` invokes PHP plus a WP-CLI PHAR directly, avoiding Node's inability to launch the `wp.cmd` wrapper safely. Set `HPERKINS_PHP_BIN` if the PHP executable is not available as `php` on `PATH`.

For the exact PowerShell environment setup (Studio development site), see the **Commands** section of [`../CLAUDE.md`](../CLAUDE.md) — it is the single source of truth for the `HPERKINS_WP_PATH` / `HPERKINS_WP_CLI_PHAR` / `HPERKINS_ORIGIN` block and the Studio-vs-standalone WP-CLI note, so it is not duplicated here.

## Build and Verification

There is no package install, Composer install, or asset build. Use the repository's dependency-free checks:

- PHP-lint every tracked PHP file.
- Run `node --test scripts/lib/wp-cli.test.js scripts/lib/site-url.test.js scripts/lib/navigation-content-contract.test.js` for the cross-platform WP-CLI launcher, the runtime-mutation site-URL guard, and the navigation shape that guards the destructive `apply-council-navigation.js` recut (name every file explicitly; the directory form of `node --test` is unreliable on Windows).
- Run `node scripts/verify-performance-assets.js` for source-only asset checks.
- With the local environment variables set, run the relevant database/HTTP verifiers listed in `CLAUDE.md`.
- Run `git diff --check` before committing.

`scripts/verify-subscribe-endpoint.js` performs a bounded runtime check that mutates and restores local options. Point it only at a disposable local installation whose `HPERKINS_WP_PATH` and `HPERKINS_ORIGIN` match.

## Coding Style

Follow WordPress coding standards for PHP: tabs, escaped output, sanitized input, nonce and capability checks for privileged actions, and the existing `hperkins_` prefixes. Keep design tokens in `theme.json`, component CSS in `style.css`, page-layout CSS in `assets/imladris-pages.css`, and block-theme markup in `templates/`, `parts/`, and `patterns/`.

## Commits and Security

Use concise imperative commits and list exact verification commands in pull requests. Never commit `wp-config.php`, Studio credentials, SQLite files, database dumps, uploads, local environment paths outside documentation examples, or generated runtime state.
