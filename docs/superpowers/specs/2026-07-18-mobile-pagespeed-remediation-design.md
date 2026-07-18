# Mobile PageSpeed Remediation

**Date:** 2026-07-18
**Status:** Approved for implementation
**Selected direction:** Remove the decorative hero bitmap from the mobile critical path and isolate the self-hosted body font from WordPress.com's generated font family

## Context

The 2026-07-18 mobile Lighthouse run for `https://hperkins.blog/` reported a 6.0-second Largest Contentful Paint while First Contentful Paint was 1.5 seconds, Total Blocking Time was 60 milliseconds, and Cumulative Layout Shift was 0.014. The LCP breakdown attributed 1.45 seconds to resource load delay and 330 milliseconds to the resource load itself.

The homepage hero currently paints `assets/img/imagery/elvenbook.webp` through `.hp-wapuu-hero-wrap::before`. Because the image is referenced from CSS, the browser discovers it only after the render-blocking stylesheet arrives. The 128 KiB bitmap is decorative, yet it can become part of the hero LCP candidate on the simulated mobile connection.

The theme also registers a self-hosted EB Garamond variable face, but WordPress.com emits additional `@font-face` rules with the same public family name. The live trace selected a 149 KiB `fonts.wp.com` face instead of the theme's 41 KiB same-origin file. The remote face was also identified as the source of the measured 0.014 layout shift.

Jetpack Search's overlay experience adds search-result markup, scripts, and styles to the initial page even when no search interaction occurs. The legacy Jetpack sharing styles are also enqueued on the homepage despite having no visible above-the-fold use.

## Goals

- Keep the decorative hero bitmap out of the mobile critical rendering path.
- Preserve the desktop hero artwork and the mobile parchment/gradient composition.
- Make the body typography resolve to the theme's self-hosted EB Garamond files without changing its visible typeface.
- Prevent regressions with dependency-free repository checks.
- Reduce Jetpack's initial-page overhead through supported settings when the connected WordPress interface exposes them.
- Leave Site Kit Analytics unchanged.

## Non-goals

- Redesigning the hero, changing its copy, or changing the eager Wapuu artwork.
- Removing desktop background imagery.
- Replacing EB Garamond with a system font or changing the typography hierarchy.
- Disabling Google Analytics, Google Tag Manager, Site Kit, Jetpack Stats, or Page Optimize.
- Recompressing the Three Rings imagery in this patch.
- Adding cache, minification, security-header, or dequeue workarounds to theme PHP.
- Claiming a production PageSpeed improvement before the theme patch and supported WordPress settings are deployed and a fresh test can run.

## Selected design

### Mobile hero backdrop

Within the existing `@media (max-width: 781px)` rules, `.hp-wapuu-hero-wrap::before` sets `background-image: none`. The pseudo-element remains in place, so its layout, opacity, and border treatment do not change. The separate `.hp-wapuu-hero-wrap::after` parchment and radial gradients continue to provide depth on mobile. The base declaration still uses the versioned `--hp-council-hero-backdrop-url` image-set value on larger viewports.

The eager `wapuu-color.webp` image remains unchanged. It is above the fold, has intrinsic dimensions, uses `fetchpriority="high"`, and is not lazy-loaded.

### Self-hosted body font isolation

The body typography preset keeps its user-facing name and the EB Garamond assets, weights, styles, and `fontDisplay: "swap"` declarations. Its internal CSS family changes from `EB Garamond` to `HPerkins EB Garamond` in both `fontFamily` and every matching `fontFace.fontFamily` entry.

The unique internal name prevents WordPress.com's generated `EB Garamond` declarations from joining the same CSS family. The body stack remains:

```text
'HPerkins EB Garamond', 'Iowan Old Style', Georgia, serif
```

### Jetpack settings

- Change Jetpack Search from the Overlay experience to the Theme experience. Search continues to use Jetpack's index while the theme supplies the visible search layout.
- Disable legacy Jetpack sharing buttons when the setting is exposed and the site is not using them.
- Do not implement undocumented option writes or theme-level dequeue filters if the connected interface cannot safely apply either setting.

### Versioning

Because both `style.css` and `theme.json` change, advance the theme version and `readme.txt` stable tag from `0.3.43` to `0.3.44`. Add a changelog entry describing the mobile hero and font isolation changes.

## Accessibility and compatibility

- The change removes no semantic content and changes no focusable element.
- The hero's mobile gradient and text contrast remain controlled by the existing pseudo-element and token rules.
- The body font remains EB Garamond; only its internal family identifier changes.
- `fontDisplay: "swap"` remains mandatory for every theme-owned face.
- The mobile override uses broadly supported CSS and requires no JavaScript.

## Verification strategy

Extend `scripts/verify-performance-assets.js` test-first so it fails unless:

- the mobile media rules explicitly disable `.hp-wapuu-hero-wrap::before`'s background image;
- the body preset uses `HPerkins EB Garamond` in its stack;
- every body `fontFace` uses the same unique family name;
- existing image budgets, lazy-loading contracts, intrinsic dimensions, and `fontDisplay` checks still pass.

Run the focused verifier after each red/green cycle, then run the repository's dependency-free unit tests, PHP lint, the applicable static verifiers, and `git diff --check`.

## Deployment boundary

The repository patch is complete only when it passes local verification. It is live only after the changed theme is deployed to WordPress.com. Jetpack Search and sharing are separate database-backed settings: apply them through the connected WordPress capability when supported; otherwise report the exact remaining administrator actions without claiming they were changed.

## Alternatives considered

### Preload the CSS background image

Preloading would reduce discovery delay while preserving the bitmap, but it would force a 128 KiB decorative download onto every mobile visit and compete with the Wapuu image, stylesheet, and fonts. Rejected.

### Re-encode a smaller mobile backdrop

A smaller derivative would reduce transfer size but would remain CSS-discovered and eligible to delay the hero paint. It also adds an asset and responsive-image maintenance path for a decorative layer whose mobile composition already works without it. Rejected.

### Dequeue WordPress.com's remote font CSS

Dequeuing generated font styles would couple the theme to a hosting implementation detail and could affect other registered typography. A unique theme-owned family name is local, deterministic, and keeps the desired visual face. Rejected.

### Replace the body face with a system stack

This would minimize font transfer but would visibly change the editorial design system. Rejected.
