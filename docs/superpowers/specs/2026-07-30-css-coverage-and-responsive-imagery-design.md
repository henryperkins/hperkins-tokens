# Stylesheet Coverage and Responsive Imagery

**Date:** 2026-07-30
**Status:** Approved for implementation
**Selected direction:** Split the hand-authored stylesheet into content-resolved component bundles, and give the two `<picture>` patterns real responsive candidates

## Context

The 2026-07-30 WordPress.com speed test for `https://hperkins.blog/` reported a mobile score of 68 and raised five recommendations: unused CSS, unused JavaScript, image delivery, legacy JavaScript, and CSS minification.

Only three of the five touch theme-owned code. The two largest items by claimed impact — 262 KB of unused JavaScript across `gtag/js?id=G-XJN6VX0BFM`, `gtag/js?id=GT-NM8WG45J`, and `gtm.js?id=GTM-W43HM55V`, and 47 KB of legacy polyfills in Jetpack Search and Jetpack Stats bundles — are emitted by connected services and cannot be changed from this repository.

Measurements taken against the working tree on 2026-07-30:

- `style.css` is 134,565 bytes across 4,516 lines and compresses to 26,865 bytes. That matches the 26.93 kB transfer size in the report, so source-byte reductions translate to transfer almost directly.
- Per-rule coverage across the 572 rules in the sheet, classified by whether any class in the selector is reachable from the front page:

  | Class | Rule bytes | Share |
  | --- | --- | --- |
  | Front-page reachable | 38.0 kB | 37% |
  | Other pages only | 38.5 kB | 38% |
  | No class selector or unmatched | 24.5 kB | 24% |
  | `@font-face`, `@keyframes`, and similar | 0.8 kB | 1% |

  The 62% that is not front-page reachable corroborates the report's "72% unused" figure, the remainder being front-page rules whose individual declarations go unexercised.

- Removing the 223 other-pages-only rules from the file and compressing what remains gives the measured result the design is aiming at:

  | | Raw | Gzip |
  | --- | --- | --- |
  | `style.css` today | 131.4 KiB | 26.2 KiB |
  | Retained sheet (front page) | 83.6 KiB | **17.9 KiB** |
  | Extracted rules | 48.0 KiB | 9.5 KiB |

  The front-page transfer saving is **8.3 KiB gzip, or 32%**. The extracted total reads as 48.0 KiB here against 38.5 kB in the coverage table because this measurement removes each rule's span from the file, carrying its surrounding formatting with it, where the table counts selector and declaration bytes only.

- The report's image findings are half right. `assets/img/wapuu-color.webp` is 640×681 for a slot the report measures at 208×221, which is oversized even allowing for a 2× device pixel ratio. The three `rivendell-*.webp` files are 1100×619 — not the 683×619 the report states — for a slot measured at 587×330. At 1.87× they are slightly *under* a 2× candidate, so the report's advice to re-export them at roughly 600×340 would soften the artwork on every current phone in exchange for 65 kB.

The 2026-07-18 mobile PageSpeed remediation listed "recompressing the Three Rings imagery" as an explicit non-goal, deferring it. This design takes it up, but as a responsive-candidate problem rather than a re-compression problem.

## Goals

- Stop shipping component CSS to pages that cannot render those components.
- Keep the reduction robust against editorial changes made in wp-admin, not only against the templates as they exist today.
- Give both `<picture>` patterns genuine responsive candidates so the browser resolves size per viewport and per device pixel ratio.
- Reduce the Wapuu hero transfer, which is the Largest Contentful Paint element on the front page.
- Preserve the rendered appearance of every page at every viewport and device pixel ratio.
- Prevent regressions with dependency-free repository checks.

## Non-goals

- Changing anything about Google Tag Manager, the two `gtag.js` tags, Site Kit, Jetpack Search, or Jetpack Stats. These are database-backed and dashboard-owned; the report's two largest items are out of scope here.
- Minifying CSS. Banking the report's 8 KiB item requires a build step and a separate source-of-truth for a sheet that is currently hand-authored and hand-reviewed. Deferred rather than rejected.
- Re-exporting the `rivendell-*` artwork at a smaller intrinsic size, for the device-pixel-ratio reason given above.
- Adding a critical-CSS inliner, a deferred-stylesheet loader, or any other render-path workaround to theme PHP.
- Deploying to WordPress.com or claiming a production score change before a fresh test runs against deployed code.

## Selected design

### Why page identity is the wrong gate

The existing conditional load in `functions.php` gates `assets/imladris-pages.css` on `! is_front_page()`. That works because those rules belong to page *layouts*, which are template-determined.

The rules this design extracts are not. Checking where each extractable component is referenced:

```text
hp-work-template      templates:1  patterns:0  snapshots:0
hp-callout            templates:0  patterns:2  snapshots:1
hp-quote              templates:0  patterns:3  snapshots:1
hp-operational-story  templates:0  patterns:1  snapshots:0
hp-evidence-row       templates:0  patterns:1  snapshots:1
```

All but one live in patterns that an editor inserts into post content. Gating them on page identity would leave a component unstyled the first time someone adds an Imladris callout to a page whose identity was not on the allowlist. Given that this site's published content is known to drift from the repository snapshots and is edited in wp-admin, that is a live failure mode, not a theoretical one.

The gate must therefore be derived from the content that will actually render.

### Content-resolved bundle enqueue

A new `inc/` module owns the mapping from bundle to class tokens:

```php
'evidence'    => hp-operational-story, hp-evidence-row, hp-evidence-board,
                 hp-product-hero, hp-artifact, hp-artifacts, hp-artifact-row,
                 hp-signal, hp-signal-strip, hp-shot, hp-quote, hp-spoke-nav,
                 hp-case-study-template, hp-lead
'interactive' => hp-disclosure, hp-subscribe, hp-input, hp-icon-button,
                 hp-content-search, hp-callout, hp-badge, hp-tag, hp-avatar
'longform'    => wp-block-table, hp-reader-hero, hp-archive-hero,
                 hp-skill-group, hp-work-template
```

On `wp_enqueue_scripts`, the module assembles a haystack from:

1. the queried object's `post_content`, when the request is singular;
2. the resolved theme template file under `templates/`, chosen from `get_page_template_slug()` when set and otherwise from the conditional tags (`is_front_page`, `is_home`, `is_archive`, `is_search`, `is_singular`, `is_404`);
3. the body of any pattern the template names through `<!-- wp:pattern {"slug":"…"} /-->`, expanded one level from `patterns/`.

It then enqueues each bundle whose token list intersects the haystack. Styles are registered in `<head>` in the normal way, so nothing renders unstyled and no stylesheet arrives after paint.

**The resolver fails open.** If the template cannot be identified, or a referenced file is missing, every bundle is enqueued. The worst case is the transfer profile the site has today, never a broken page.

Bundle count is held at three deliberately. The extractable rules decompose into roughly a dozen component groups, but a page that uses several would then pay several round trips; three bundles keep the common cases to one or two requests.

### Cascade preservation

Extraction changes source order, which is the substantive correctness risk in this change. Every extracted rule ends up after every retained rule, because the bundles depend on `hperkins-tokens` and load after it.

Two constraints follow, and both are mechanical:

- Within each bundle, rules keep their original relative order from `style.css`.
- Where a retained rule and an extracted rule share a selector at equal specificity, the pair must be found and resolved by hand before the split lands, because their relative order inverts.

The verifier gains a check for the second case so the collision set cannot grow silently.

### Bundle layout

Sizes below are rule bytes, consistent with the coverage table, so the three bundles sum to the 38.5 kB extractable slice rather than to the 48.0 KiB of file text they carry with them.

```text
style.css                   83.6 KiB   shell, tokens, header, footer, buttons,
                                       page hero, primitives  → every request
assets/imladris-pages.css              existing, unchanged
assets/c/evidence.css        ~19 kB    evidence, case study, product surfaces
assets/c/interactive.css     ~13 kB    form and disclosure primitives
assets/c/longform.css         ~6 kB    tables, reader and archive heroes
```

The front page resolves to none of the three, taking its stylesheet from 26.2 KiB to a measured 17.9 KiB over the wire.

### Responsive imagery

Variants are generated with PHP GD, which is present and WebP-capable, so the change adds no toolchain.

Candidate widths are derived from the layout rules rather than from the report's measured display sizes. The root font size is unmodified at 16px and `wideSize` is 72rem.

**Wapuu hero.** `.hp-wapuu-hero__figure` is `width: min(100%, 27.5rem)` — 440 CSS pixels — and inside `@media (max-width: 781px)` becomes `width: 13rem; max-width: 62vw`, or 208 CSS pixels. That 208 figure is exactly the display size the report measured. The needed candidates are therefore 440 for desktop at 1×, 416 for mobile at 2×, and 624 for mobile at 3×.

A single new candidate at **448w** covers the first two, which today both download the 640w file. Mobile at 3× continues to select 640w, unchanged.

```html
<source type="image/webp"
        srcset="…-448.webp 448w, ….webp 640w"
        sizes="(max-width: 781px) 13rem, 27.5rem">
```

`assets/img/wapuu-color-448.webp` is generated at 448×476 from the 962×1024 PNG. The existing `wapuu-color.webp` keeps its name, its 640×681 dimensions, and its place in the verifier's budget map.

**Ring cards.** `.hp-ring-grid` is `repeat(3, minmax(0, 1fr))` inside an `alignwide` 72rem container, giving roughly 365 CSS pixels per column, and collapses to one column under `@media (max-width: 920px)`. Needed candidates are ~365 for desktop 1×, ~730 for desktop 2×, and on a 412-pixel viewport ~663 at 1.75× or ~758 at 2×.

A single new candidate at **768w** covers all four. This is the correction to the report's advice: at 600w none of those cases would select the new file, and every device would keep downloading 1100w.

```html
<source type="image/webp"
        srcset="…-768.webp 768w, ….webp 1100w"
        sizes="(max-width: 920px) 92vw, 23rem">
```

`assets/img/imagery/rivendell-{second,third,fourth}-age-768.webp` are generated at 768×432 from the 1672×941 PNGs. Phones at 3× still select the 1100w files, which is the correct outcome rather than a shortfall.

The `<img>` fallback keeps its current `src` and its intrinsic `width` and `height` in every case, so the aspect ratio the verifier pins is unchanged and no layout shift is introduced. The hero keeps `fetchpriority="high"` and stays out of `loading="lazy"`; the ring cards keep `loading="lazy"`.

Note that `hperkins_tokens_asset_url()` appends a numeric `?v=<mtime>` query argument. Numeric values contain no commas, so the generated `srcset` lists stay unambiguous.

One pre-existing shortfall is deliberately left alone: at 640w the hero is only 1.45× its 440-pixel desktop slot, so desktop at 2× is already under-resolved. Fixing that needs an 880w candidate, which would increase desktop transfer, and this design does not trade mobile bytes for desktop sharpness. Recorded here so the omission is not mistaken for an oversight.

### Versioning

`style.css`, `theme.json`-adjacent contracts, and the patterns all change, so the theme version and `readme.txt` stable tag advance from `0.3.56` to `0.3.57` with a matching changelog entry.

## Accessibility and compatibility

- No semantic content, focusable element, or heading order changes.
- `srcset` and `sizes` degrade cleanly: a browser that ignores them takes the `<source>`'s first candidate, and one without WebP support takes the PNG `<img>` fallback.
- Retaining intrinsic `width` and `height` on every `<img>` keeps Cumulative Layout Shift unaffected.
- The bundle resolver runs server-side and requires no JavaScript.
- Fail-open resolution means a resolver defect degrades to today's transfer, not to unstyled output.

## Verification strategy

Extend `scripts/verify-performance-assets.js` test-first so it fails unless:

- every class token in the bundle map is absent from `style.css` and present in exactly one bundle, so a rule cannot be extracted twice or dropped;
- no class token in the bundle map is reachable from the front-page template, its patterns, or the front-page snapshot, which pins the front page's zero-bundle result;
- no selector appears at equal specificity in both `style.css` and a bundle, which is the cascade-inversion guard;
- the enqueue module lists every bundle present on disk and every bundle it lists exists;
- both `<picture>` sources carry `srcset` and `sizes`, and every candidate they name exists on disk;
- the new variants stay inside byte budgets, and the existing budgets, lazy-loading contracts, intrinsic dimensions, `fetchpriority`, and `fontDisplay` checks still pass.

A dependency-free coverage script reproduces the per-rule classification in this document, so the 38% figure is reproducible rather than a one-off measurement.

Run the focused verifier after each red/green cycle, then the repository's unit tests, PHP lint, the applicable static verifiers, and `git diff --check`. Render the front page and one page per bundle locally through Studio and compare against pre-change captures before claiming visual parity.

## Deployment boundary

The patch is complete when it passes local verification. It is live only after the theme is deployed. Studio Push is not the deployment path for this repository: it fails with HTTP 413 against a server-side upload cap, so deployment goes over SFTP with WP-CLI. No production score claim is made until a fresh test runs against deployed code.

The report's two largest items remain open and administrator-owned after this patch ships: consolidating the duplicate `gtag.js` tags into the single GTM container, and either updating or disabling Jetpack Search. Those should be reported as outstanding, not described as addressed.

## Alternatives considered

### Gate the bundles on page identity

This mirrors the existing `! is_front_page()` pattern and needs no resolver. It breaks the first time a pattern is used on a page the allowlist does not name, which on this site is a matter of when rather than whether. Rejected.

### Enqueue bundles from `render_block`

Detection would be exact, since a bundle would load precisely when its block renders. In a block theme the template renders after `wp_head`, so the stylesheet would print in the footer and briefly leave above-the-fold content unstyled on exactly the pages the bundles serve. Rejected.

### Minify `style.css` in place

This banks the report's 8 KiB item immediately, but the sheet is hand-authored and reviewed in diffs, and minifying it in place destroys that. Doing it properly means a build step and a `src` sheet, which is a larger change than this design carries. Deferred.

### Prune only genuinely dead rules

The safest option for the cascade, and it needs no new machinery. The measurement shows the win is small: most of the non-front-page bytes are live CSS serving other routes, not dead code. Rejected as insufficient on its own, though the 24.5 kB unmatched slice is worth a separate audit later.

### Follow the report's image advice literally

Re-exporting all three artworks at the reported display sizes banks the full 184 kB. It also ships a 1× asset to a 2×-and-up device population, visibly softening the Three Rings artwork. Rejected for `rivendell-*`; the underlying oversizing claim is accepted for `wapuu-color.webp`, which this design addresses.

### Enable Jetpack Boost's Optimize CSS Loading

The report's own first suggestion, and it would generate critical CSS and defer the rest without touching the theme. It treats the symptom at the hosting layer while the theme keeps shipping the same bytes, and it is a dashboard change rather than a repository one. Out of scope here and not mutually exclusive with this design.
