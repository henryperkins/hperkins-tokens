# Repository Guidelines

## Project Structure & Module Organization

This repository is a WordPress core/site checkout. Core files live in `wp-admin/` and `wp-includes/`; avoid changing them unless the task is explicitly a core patch. Site code is under `wp-content/`. The most project-specific areas are `wp-content/themes/hperkins-tokens/`, `wp-content/themes/assembler/`, and the AI provider plugins in `wp-content/plugins/ai-provider-for-openai/` and `wp-content/plugins/ai-provider-for-anthropic/`. Uploaded media is in `wp-content/uploads/`; migration artifacts and backups live in `migration/`.

## Build, Test, and Development Commands

There is no root `package.json`, Composer config, or Makefile. Use WordPress tooling directly:

- `wp --path=/home/dev/hperkinsblog plugin list` checks installed plugin state.
- `wp --path=/home/dev/hperkinsblog theme list` checks active and available themes.
- `node scripts/verify-hperkins-tokens.js` verifies editor stylesheets and mobile overflow for the HPerkins Tokens theme. It requires WP-CLI, a reachable `https://hperkins.blog`, and Chrome at `CHROME_PATH` or `/usr/bin/google-chrome`.
- `find wp-content/themes/hperkins-tokens wp-content/plugins/ai-provider-for-openai wp-content/plugins/ai-provider-for-anthropic -name '*.php' -print0 | xargs -0 -n1 php -l` runs PHP syntax checks on the custom theme and AI provider plugins.

## Coding Style & Naming Conventions

Follow WordPress coding standards for PHP: tabs for indentation, escaped output, sanitized input, nonce and capability checks for privileged actions, and prefix project-specific functions/hooks. Theme templates and parts use block-theme conventions under `templates/`, `parts/`, `patterns/`, and `theme.json`. Plugin PHP classes are organized under `src/` with descriptive namespaces and filenames such as `OpenAiTextGenerationModel.php`.

## Testing Guidelines

No root PHPUnit, Jest, Playwright, or `wp-env` configuration is present. For focused changes, run PHP linting and any relevant WP-CLI checks. For visual/theme changes, run `node scripts/verify-hperkins-tokens.js` and manually review affected pages at desktop and mobile widths.

## Applicable Agent Skills

Use `wordpress-router` or `wp-project-triage` before broad repository work. Use `wp-block-themes` for `theme.json`, templates, parts, and patterns. Use `wp-plugin-development` for general plugin changes, `wp-ai-connectors` for provider plugins, `wp-ai-plugin` for the canonical AI plugin, and `wp-ai-client` for core AI Client usage. Use `wp-abilities-api`, `wp-rest-api`, `wp-wpcli-and-ops`, or `wp-performance` when those areas are involved.

## Commit & Pull Request Guidelines

This checkout has no local Git metadata, so repository-specific commit history is unavailable. Use concise imperative commits with a scope, for example `theme: tighten mobile spacing` or `plugin: validate OpenAI settings`. Pull requests should describe the change, list verification commands, link related issues, and include screenshots for theme or admin UI changes.

## Security & Configuration Tips

Do not commit secrets from `wp-config.php`, database dumps, or migration backups. Treat `migration/backups/`, uploaded media, and generated bundles as sensitive unless the task specifically involves migration packaging.
