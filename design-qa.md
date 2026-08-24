# About v2 design QA

## Scope and publication boundary

- Reviewed surface: `content/page-drafts/about.html`.
- Supporting implementation: `assets/imladris-pages.css`, `assets/js/about-resume.js`, and the candidate-only enqueue in `functions.php`.
- Accepted mirror `content/page-snapshots/about.html`, WordPress Page 6, deployment configuration, and production were not changed or treated as verified by this review.
- The local preview is a read-only fixture assembled from the exact reviewed draft, theme tokens, fonts, portrait, page stylesheet, and About controller. It excludes the full site header because the local WordPress hostname was unavailable.

## Visual source of truth

- `.impeccable/qa/about-v2/design_handoff_about_skills_index/screenshots/01-identity-header.png`
- `.impeccable/qa/about-v2/design_handoff_about_skills_index/screenshots/02-skills-index-idle.png`
- `.impeccable/qa/about-v2/design_handoff_about_skills_index/screenshots/03-skills-index-filtered.png`
- `.impeccable/qa/about-v2/design_handoff_about_skills_index/screenshots/04-contributions-dimmed.png`

## Implementation evidence

- `.impeccable/qa/about-v2/implementation-909x540-final.png`
- `.impeccable/qa/about-v2/implementation-skills-idle-909x540.png`
- `.impeccable/qa/about-v2/implementation-skills-filtered-909x540.png`
- `.impeccable/qa/about-v2/implementation-contributions-dimmed-909x540.png`
- `.impeccable/qa/about-v2/implementation-mobile-390x844.png`
- `.impeccable/qa/about-v2/implementation-mobile-skills-390x844.png`

## Same-input comparisons

- `.impeccable/qa/about-v2/compare-identity-final.png`
- `.impeccable/qa/about-v2/compare-skills-idle.png`
- `.impeccable/qa/about-v2/compare-skills-filtered.png`
- `.impeccable/qa/about-v2/compare-contributions-dimmed.png`

## Capture normalization

- Browser: the user's connected Edge browser.
- Desktop review viewport: 909 x 540 CSS pixels with device scale factor 1. The vertical scrollbar leaves a 894 px document client width; every final desktop state reported `scrollWidth === clientWidth === 894`.
- Mobile review viewport: 390 x 844 CSS pixels with device scale factor 1. The scrollbar leaves a 375 px document client width; both mobile states reported `scrollWidth === clientWidth === 375`.
- Desktop screenshots were captured through CDP at exact viewport density.
- The identity comparison uses source pixels y=100..540 beside implementation pixels y=0..440 because the source image includes header context not present in the static fixture. The compared identity content remains at the same scale and state.

## Interaction and responsive evidence

- Skills idle: Clear filter is not displayed and all 30 terms remain available as 44 px controls.
- Documentation filter: selected term is pressed, the live readout is `Documentation — 5 rows above match; the rest are dimmed.`, and exactly 6 of 11 evidence rows are dimmed.
- Coverage: runtime and source both render `6/6 backed above`; the pure index contract also verifies `9/9 backed above` for Workflow and enablement.
- Earlier experience: `Show 3 earlier roles` expands to exactly 3 visible roles, updates `aria-expanded` to `true`, and changes its label to `Hide earlier roles`.
- Print preparation: clears the active filter, exposes `Print / Save PDF` and `Exit print view`, keeps the screen rail reachable, and expands all 3 earlier roles. Exit restores the single `Print` action. Actual `@media print` output continues to suppress the navigation rail.
- Desktop anchor: rail bottom 55 px, Skills section top 75 px, heading top 159 px; no horizontal overflow.
- Mobile anchor: rail bottom 55 px, Skills section top 72 px, heading top 147 px; no horizontal overflow.
- Mobile target sizes: first rail link 44 px high and first skill term 44 px high.
- Browser console: no warnings or errors in the final desktop or mobile passes.

## Iteration history

- Pass 1, P1: About v2 CSS used conceptual preset names not registered by `theme.json`, and the new impact cards collided with the accepted About breakout selector. Corrected to registered Imladris preset slugs and renamed the candidate impact class.
- Pass 1 fixture note: an apparent spacing failure came from an omitted preset in the temporary preview fixture, not the repository stylesheet. The fixture was corrected before judging layout.
- Pass 2, P1: the identity surface, copy hierarchy, availability measure, and contact placement drifted from the handoff. Corrected to the supplied portrait, exact identity copy, raw evidence links, and source-aligned spacing.
- Pass 3, P1: Skills and Contributions used tabular/editorial treatments instead of the supplied grouped chips, bordered readout, stacked evidence cards, and pill rail. Corrected without changing the evidence-map behavior.
- Pass 4, P1: the inherited desktop breakout overflowed the main grid, runtime coverage text diverged from the source, print preparation hid its own exit control, and mobile anchors landed beneath the sticky rail. Each issue was corrected and recaptured at the same state and viewport.

## Final findings

- P0: none.
- P1: none remaining.
- P2: none remaining.
- P3 residual boundary: the static fixture does not prove integration with the complete local WordPress header, database-owned Page 6, deployment, or production. Those surfaces were deliberately outside this candidate review.

## Fresh verification

- `node --test scripts/lib/about-resume-style.test.js scripts/lib/about-resume.test.js`: 7 passed, 0 failed.
- `node scripts/verify-about-page-source.js --drafts`: candidate verified; 701 visible words, 7 contributions, 7 experience rows, 30 skills, 5 showcase items, 1 contact section.
- `php -l functions.php`: no syntax errors detected.

## Final result

passed
