# Home Page — Design System Audit

> Point-in-time audit of `/` (the front page) against the Imladris design system.
> **Date:** 2026-07-15 · **Theme:** HPerkins Tokens 0.3.42 · **Audited surface:** `https://hperkins.blog/` (live) + repo source.

## Scope & method

The home page is assembled in `templates/front-page.html` as three bands:

1. **Wapuu hero** — theme-owned pattern `patterns/wapuu-home-hero.php` (renders from PHP, cannot drift from source).
2. **Middle body** — `wp:post-content`, i.e. the **DB `post_content` of the Home page (page 36)**. Its versioned source of truth is `content/page-snapshots/front-page.html`. This is the only band that can drift from the theme.
3. **Three Rings** — theme-owned `hp-template-hero` copy + pattern `patterns/imladris-ring-card.php`, then the `hp-front-template__cta` closing panel (also DB body).

Audited against: `theme.json` tokens, the ownership/component contract in `docs/design-system/INDEX.md`, the invariants in `CLAUDE.md` (ledger row anatomy, tokens-first, front-page CSS skip, prominent-action composition, eager LCP hero), and the repo's own verifiers. Evidence came from reading the source and diffing it against the **live rendered HTML** of `/`.

## Summary

| # | Finding | Severity | Where |
|---|---|---|---|
| 1 | Work ledger: left-rule status color contradicts the label word on 3 of 4 entries | **High** | live page 36 body |
| 2 | Front-page CTA is missing the 0.3.42 closing action panel + rail | **Medium** | live page 36 body |
| 3 | Dead `gold-700` / `0.2em` declarations on the hero eyebrow | Low | `style.css` |
| 4 | Two eyebrow color registers on one page (hero muted vs. section kickers gold) | Low | `style.css` |
| 5 | Hero title uses a raw `clamp()` rather than a named type token (deliberate) | Info | `style.css` |

**Findings 1 and 2 share one root cause and one fix:** the production DB body of page 36 is stale — it predates the current tracked snapshot. The theme code/CSS is current (it cache-busts on `filemtime`), but the DB content was never re-synced. The repo source is **correct**; the deployed page is behind.

## Conformant — what passes

- **Composition & ownership** match the `INDEX.md` contract (hero + rings theme-owned; middle body DB-owned; snapshot tracked).
- **Performance invariants (verified live + source):** the hero `<img>` is the eager LCP element — `fetchpriority="high"`, `decoding="async"`, intrinsic `962×1024`, no `loading="lazy"`; the three ring images are `loading="lazy"` (below the fold); and `assets/imladris-pages.css` is correctly **not** enqueued on `/` (`! is_front_page()` in `functions.php`). No home-page component depends on that sheet.
- **Tokens-first:** no raw hex in any home-page CSS range — every value resolves through `var()` onto the `theme.json` presets. (The only literals are the documented browser-chrome dots, which are not on this page.)
- **Theme-owned patterns render current markup** on live (hero, rings, proof-bar chips).
- **Status invariant is correct in the source:** the snapshot ledger pairs each rule color with an agreeing word; the third ring CTA shows `In review` + a hollow pill dot for the not-yet-shipped action; proof-bar chips use filled ● (merged) vs. hollow ○ (review/pending) with a redundant word.
- **Prominent-action source contracts pass** — `scripts/verify-prominent-actions.js` printed `prominent action source contracts verified` (opt-in, compact-control exclusions, 44px targets in source). It then timed out only on the live-render step (headless Chromium is not proxy-routed in this environment); it is not an assertion failure.

## Findings

### 1 — High · Work ledger status color contradicts the label word (live)

**Design invariant** (`CLAUDE.md`, "a 'ledger' row anatomy"): status is a **semantic palette plus a redundant word** — the rule color and the word are two encodings of the *same* status; "never color alone."

**Live `/` renders:**

| Entry | Left-rule (`is-status-*`) | Label word | Agree? |
|---|---|---|---|
| Flavor Agent | `review` (amber) | In review | ✅ |
| WordPress's Core AI Contributions | `review` (amber) | **Merged** | ❌ |
| AI Provider for Codex | `review` (amber) | **Shipped** | ❌ |
| DJ Lee & Voices of Judah | `review` (amber) | **Delivered** | ❌ |

All four live entries carry `hp-work__entry is-status-review`, so three shipped/merged/delivered projects show the **amber "in-review" rule** — the color says "not resolved" while the word says "done." Because the home ledger's only status cues are the rule color and the label word (the dotted `::before` marker belongs to the `.hp-work-template` variant, not the base `.hp-work` used here), the two redundant signals directly contradict each other. A reader scanning rule colors misreads three finished projects as still in review. The footer's own claim — *"Same rule across every entry"* — is exactly what the live page breaks.

**Source of truth is correct** — `content/page-snapshots/front-page.html` pairs Flavor Agent with `is-status-review` and the other three with `is-status-merged` (green), agreeing with their words. It has been correct since the 0.3.31 content-ownership check-in (`3013230`).

**Root cause:** page 36's production `post_content` was never re-synced to the snapshot. **Fix:** see Remediation.

### 2 — Medium · Front-page CTA missing the 0.3.42 closing action panel + rail (live)

**Spec** (`CLAUDE.md` / `INDEX.md`, 0.3.42): "the front page, Job Placement Digest, and Flavor Agent demo use **both**" — the closing CTA is `hp-front-template__cta hp-action-panel is-closing` wrapping an `hp-front-template__cta-actions hp-action-rail`.

**Live `/` renders** the pre-0.3.42 markup: the section is plain `hp-front-template__cta` (no `hp-action-panel`), and the buttons are `wp-block-buttons hp-front-template__cta-actions` (no `hp-action-rail`). Live counts: `hp-action-panel` = 0; the only `hp-action-rail` on the page is the theme-owned **hero** pattern. So the front page's "final invitation" lacks the gold-rule closing panel, the parchment action rail, and the emblem the design system specifies. Purely presentational (no misinformation), hence Medium.

**Source of truth is correct** — the snapshot's CTA carries `hp-action-panel is-closing` + the inner rail; the class was added in the merged 0.3.42 commit `f1d02ce` ("theme: add prominent action system"). Same stale-DB root cause as #1.

### 3 — Low · Dead declarations on the hero eyebrow (`style.css`)

`.hp-wapuu-hero__eyebrow` sets `color: var(--wp--preset--color--gold-700)` and `letter-spacing: 0.2em` (`style.css:1305`, `:1303`), but the later equal-specificity rule `.hp-wapuu-hero__eyebrow, .hp-eyebrow` (`style.css:2107`) overrides both to `text--muted` and `tracking--caps` (0.18em). The eyebrow renders muted ink (~6:1 on parchment, AA-pass) — no visual bug — but the two overridden declarations are dead and misleading to a reader of the hero block. Consolidate.

### 4 — Low · Two eyebrow color registers on one page

The hero eyebrow resolves to `text--muted` (ink), while the Three Rings kicker and the CTA kicker use `text--accent` (AA-hardened gold `#7A5C1E`). Both are Marcellus lapidary-caps labels, so the page shows two "eyebrow" colors. Defensible — the hero one is a linked *credential showcase* (hairline underline, not link-blue), the others are section eyebrows — but it's a deliberate call worth recording. If unifying is desired, move the hero eyebrow to `text--accent` (the page-hero convention in `INDEX.md`); do **not** use raw `gold-700`, which fails AA at the 12px eyebrow size.

### 5 — Info · Hero title bypasses the named type scale (deliberate)

`.hp-wapuu-hero__title` uses `font-size: clamp(2.6rem, 4.2vw, 3.9rem)` (desktop) / `clamp(2.1rem, 9vw, 2.7rem)` (mobile) rather than a `theme.json` font-size token or `custom.type.hero/h1`. This is the one place on the page where display type is a raw clamp. It is intentional — a "restrained council-hero display scale" (the DS `hero` 5.5rem / `h1` 4rem would overwhelm this composition) — and the weight is guarded by `scripts/verify-homepage-hero-polish.js` (medium mobile → semibold desktop). Recorded, not a defect.

## Remediation

**Primary (fixes #1 and #2 together) — re-deploy the page 36 DB body from the tracked snapshot.** The repo source is already correct; production content is stale. Per the deploy contract in `CLAUDE.md`/`INDEX.md`: replace page 36's `post_content` with `content/page-snapshots/front-page.html`, flush cache, then confirm with the ownership verifier:

```bash
# On the site checkout that deploys production (wp-cli path per CLAUDE.md):
wp --path=<site> post update 36 content/page-snapshots/front-page.html
wp --path=<site> cache flush
node scripts/export-page-snapshots.js      # should now be a no-op (DB == snapshot)
node scripts/verify-content-ownership.js   # confirms no template/DB drift
```

This is a **DB content deploy, not a theme code change** — the ledger statuses and the closing action panel both live in page 36's body, which the theme files cannot carry.

**Optional (repo hygiene) — Finding #3:** drop the overridden `color: gold-700` and `letter-spacing: 0.2em` from the `.hp-wapuu-hero__eyebrow` block (`style.css:1298`). Bump `style.css` `Version:` + `readme.txt` + changelog per convention if touched.

**Consider — Finding #4:** decide whether the hero eyebrow should stay muted or align to `text--accent`.
