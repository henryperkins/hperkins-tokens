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

## Pass 5 — handoff re-read against the implementation

Re-read `design_handoff_about_skills_index/README.md` and the prototype against
the committed candidate. The publication boundary is unchanged: only
`content/page-drafts/about.html`, `assets/imladris-pages.css`,
`assets/js/about-resume.js`, and the contract were touched. The accepted mirror
`content/page-snapshots/about.html`, WordPress Page 6, deployment, and
production were not changed.

Corrected in this pass:

- **Evidence links pointed at a GitHub account that is not the author's.** Seven
  links used `github.com/hperkins`; the repo's own activity audit and every
  other tracked surface use `github.com/henryperkins`, and the Codex row named
  the non-existent `hperkins/wp-ai-codex-provider`. Two contribution rows also
  linked to *filtered search* URLs rather than artifacts, so a row labelled
  "Merged pull request" resolved to an empty result page. Every row now links
  the specific artifact the prototype names; each URL is corroborated by
  `docs/audits/2026-08-10-wordpress-github-activity.md`.
- **Selected artifacts had drifted from the real project set.** The handoff
  marks the showcase out of scope and unchanged; the candidate carried five
  invented cards, one of them a project the repo's own audit classifies as
  non-WordPress adjacent work. Restored to the five real projects the design
  carries, which also makes the "5 public projects" signal checkable on the page.
- **Impact strip was missing half its anatomy.** Section 2 specifies a metric, a
  mono unit, an explanation, and a jump link to the section that proves it. The
  cards carried a metric and one label, and were not links.
- **Education had lost two real records.** The handoff and the currently-live
  About page both carry College of DuPage (2013) and Columbia College Chicago
  (2007 – 2008); the candidate had replaced them with two unattributed
  paragraphs. Restored on the specified `11rem minmax(0, 1fr)` grid.
- **A superseded CSS layer drew a 3px evergreen rule above every skills group.**
  The pass-3 override never reset it, so each group carried a heavy rule where
  the design uses a hairline. Visible in the pass-4 desktop and mobile captures.
- **An unbacked term could not render as specified.** It showed `0` on a
  disabled control at `cursor: not-allowed`; the design calls for an em-dash on
  an inert term at `opacity: 0.55`, `cursor: default`. No term on the page is
  currently unbacked, so this path was unreachable and unverified.
- **One authored count contradicted the evidence map.** PHP was authored as `3`
  where two rows carry it, so the no-JS source and the runtime disagreed.
- **Contributions and roles dimmed to different opacities** (0.32 vs 0.34) for
  the same filter state; the design names one value.
- **The main-column sections size with `width: 100%` and then pad**, so the page
  depended on a border-box reset it inherits from outside its own stylesheet. A
  scoped reset makes About independent of it — a no-op wherever the reset
  already exists, and the removal of a 390px overflow where it does not.

Guards added so each correction stays corrected: `verifyAboutV2Body()` now
checks every authored count against the derived count (em-dash at zero), that
each impact card carries a unit, an explanation, and a cue resolving to a real
section, that both education records are present verbatim, and that no outbound
GitHub link names an owner outside `WordPress` / `henryperkins`.

Deliberate departures from the handoff prose, kept:

- The readout reads "1 row above matches" at N = 1. The prototype emits "1 row
  above match"; N = 1 is the common case here, so the grammatical form ships.
- The section rail marks the current entry `aria-current="location"` rather than
  `"true"`, which is the more precise value for an in-page scrollspy.
- Term chips keep the pill radius shown in the reference screenshots rather than
  the `--radius-chip` (2px) named in the README prose.

Evidence: `.impeccable/qa/about-v2/pass5-impact-strip-1280.png`,
`.impeccable/qa/about-v2/pass5-skills-education-1280.png`. Measured in a static
fixture built from the reviewed draft, theme tokens, fonts, page stylesheet, and
the About controller: 1280px and 390px both report
`scrollWidth === clientWidth`; the Documentation filter dims 6 of 11 rows at
0.34 with a 140ms opacity transition; a synthetic unbacked term renders an
em-dash, no control, `opacity: 0.55`, `cursor: default`, and recomputes its
group coverage.

## Residual boundary

The fixture still does not prove integration with the complete local WordPress
header, database-owned Page 6, deployment, or production. The border-box result
in particular is defensive: it is correct either way, but whether the live page
overflowed at 390px was not established against a real install.

## Pass 5 result

passed

## Pass 6 — approved handoff fidelity follow-up

### Source visual truth and rendered evidence

- Handoff archive: `C:\Users\htper\hperkins-tokens\aboutredesign.zip`.
- Source screenshots: `C:\Users\htper\AppData\Local\Temp\about-redesign-reference-20260824\design_handoff_about_skills_index\screenshots\01-identity-header.png` through `04-contributions-dimmed.png`.
- Rendered preview: `http://127.0.0.1:4179/about/`.
- Final rendered screenshots:
  - `C:\Users\htper\AppData\Local\Temp\about-review-identity-909x540-final.png`
  - `C:\Users\htper\AppData\Local\Temp\about-review-skills-idle-909x540-final.png`
  - `C:\Users\htper\AppData\Local\Temp\about-review-skills-filtered-909x540-final.png`
  - `C:\Users\htper\AppData\Local\Temp\about-review-contributions-filtered-909x540-final.png`
  - `C:\Users\htper\AppData\Local\Temp\about-review-mobile-390x844-final.png`
  - `C:\Users\htper\AppData\Local\Temp\about-review-mobile-skills-filtered-390x844-final.png`
  - `C:\Users\htper\AppData\Local\Temp\about-review-desktop-1280x900-final.png`

The four source screenshots and their corresponding 909px implementation
captures are each 909 x 540 pixels. They were compared at a 909 x 540 CSS
viewport, scale 1, zoom 1, with no density conversion. The responsive captures
are 390 x 844 and 1280 x 900 pixels at the matching CSS sizes and density 1.
The in-app browser was unavailable, so the connected Edge browser was used as
the Product Design fallback.

The original fixture process held the pre-edit stylesheet in memory. The final
preview therefore layers the current candidate stylesheet after that fixture;
the capture-only route also suppresses the native scrollbar so the visible CSS
width matches the 909px source capture. This normalization changes no repository
code and is not used as production evidence.

### State and comparison evidence

- Identity, resting Skills, Documentation-filtered Skills, and filtered
  Contributions were captured at the same viewport and interaction state as
  their numbered source screenshots. Each source/implementation pair was
  opened together in one comparison input before this report was updated.
- Full-view comparison checked composition, section framing, rail behavior,
  type hierarchy, ledger density, and the active/dimmed state.
- Focused comparison checked the identity kicker, compact Copy control, Skills
  readout line fit, Clear filter control, first skill group, and the first two
  contribution rows. Focused evidence was required because those details are
  too small to judge reliably from the full page alone.
- The source identity screenshot includes the full site header while the local
  candidate fixture begins at `<main>`. The candidate-owned identity region was
  compared at unchanged scale; header integration remains outside this
  candidate-only review.

### Comparison history

- Initial P2 — identity metadata drift: the kicker resolved to Marcellus and the
  Copy control inherited the 15px bold generic action treatment. The scoped fix
  now resolves both to JetBrains Mono; Copy computes to 12px/400, 1.4 leading,
  0.06em tracking, uppercase, the card surface and hair border, while retaining
  a 44px minimum target. Post-fix evidence:
  `about-review-identity-909x540-final.png`.
- Initial P2 — resting readout wrapped to two lines: added tracking and an empty
  explicit grid track consumed the width reserved for the hidden Clear button.
  The handoff's no-tracking flex-wrap control row and `flex: 1 1 16rem`
  readout were restored. It now computes to one line at 909px. Post-fix evidence:
  `about-review-skills-idle-909x540-final.png`.
- Post-fix comparison found no new P0, P1, or P2 issue. No further visual edits
  were made after the final comparison.

### Required fidelity surfaces

- Fonts and typography: handoff families, weights, sizes, leading, tracking,
  and wrapping are retained. The corrected kicker is mono, Copy is compact mono,
  and the resting Skills readout is one line at 909px.
- Spacing and layout rhythm: the identity geometry, readout surface, skill-chip
  flow, contribution ledger, and 13rem desktop rail align with the supplied
  system. At 1280px the layout computes to `208px 840px`; skill groups compute
  to `176px 640px`.
- Colors and tokens: corrected states use the registered Imladris card, hair,
  faint-text, strong-text, and gold hover tokens. No new literal palette values
  were introduced.
- Image quality and asset fidelity: the supplied portrait remains an 80 x 80
  circular source asset with the approved gold border and shadow. The handoff
  contains no additional candidate-owned imagery or icons to reproduce.
- Copy and content: identity, availability, idle/filter readouts, evidence
  counts, and contribution copy match the reviewed candidate and handoff.
- Responsiveness and accessibility: 390px and 1280px both report zero horizontal
  overflow. Mobile terms wrap in one column, the rail remains horizontally
  scrollable, and Copy/Clear controls retain 44px targets.

### Interaction, console, and detector evidence

- Documentation selection sets `aria-pressed="true"`, reports
  `Documentation — 5 rows above match; the rest are dimmed.`, and dims 6 of 11
  evidence rows. Clear filter restores 0 dimmed rows and the one-line idle copy.
- Earlier roles expands to exactly 3 rows with `aria-expanded="true"` and then
  returns to the hidden, collapsed state.
- The final browser error log is empty.
- The required Impeccable detector ran once after the UI edit. It degraded to
  regex mode because its optional HTML parser modules are unavailable. Its
  warnings are pre-existing global literals or the handoff's intentional ledger
  and education rules; it reported no finding in the selectors changed here.

### Final findings

- P0: none.
- P1: none.
- P2: none.
- P3: the supplied filtered screenshot wraps `Clear filter` onto two lines while
  this implementation keeps it on one line inside the same 44px target. The
  difference is non-blocking and keeps the control easier to scan.
- Expected framing difference: the sticky section rail remains visible in the
  implementation's Skills captures, as required by the handoff behavior, while
  the source captures show the preceding disclosure edge in that strip.

## Final result

passed

## Pass 7 — closing action-panel remediation

### Source and implementation evidence

- Approved source: `C:\Users\htper\hperkins-tokens\aboutredesign.zip`,
  `design_handoff_about_skills_index/About v2.dc.html` lines 281–290 and the
  handoff README's "Showcase and contact" contract.
- The source pins a hair border, 3px gold left rule, `--radius-lg`, the
  `--surface-sunken` → `--surface-card` gradient, `--shadow-md`, and exactly two
  design-system Buttons: primary `/contact/` "Start a conversation", then
  secondary `/one-page-resume/` "Download résumé (PDF)".
- The supplied numbered source screenshots do not include Contact, and the
  standalone canvas harness exposes imported design-system Buttons as generic
  placeholders. The source file was therefore inspected directly at 909 x 540,
  while visual comparison used its explicit inline panel tokens and the site's
  existing shared `.hp-action-panel.is-closing` / `.hp-action-rail` primitive.
- Final implementation captures:
  - `.impeccable/qa/about-v2/implementation-contact-909x540.png`
  - `.impeccable/qa/about-v2/implementation-contact-mobile-390x844.png`

The candidate's already-reviewed Contact heading and lede remain unchanged;
the handoff marks that copy as outside this Skills-index change. This pass
restores only the shared closing-panel composition and its approved actions.

### Responsive, interaction, and accessibility results

- At 909 x 540 the panel is 845.33px wide with the expected gradient, gold
  left rule, 12px radius, and medium shadow. The two actions share one row in
  primary-then-secondary order and each computes to 44.875px high.
- At 390 x 844 the rail becomes a column; both actions compute to 313.33px wide
  and 44.875px high. At the 320px boundary both still fill the rail, remain at
  least 44px high, and the document reports `scrollWidth === clientWidth`.
- The secondary action received keyboard focus with `:focus-visible` matched
  and a solid gold outline. The exact rendered hrefs are `/contact/` and
  `/one-page-resume/`.
- The final browser error/warning log is empty.
- The candidate-only preview omits WordPress core's block-layout sheet, so the
  QA proxy supplied only core's canonical `.wp-block-buttons` flex behavior.
  Theme and page styles remained the repository versions. This is browser
  evidence for the candidate surface, not database, deployment, or production
  evidence.

### Detector result

The required Impeccable detector ran once after this UI edit. Optional parser
modules were unavailable, so it used degraded regex mode. It found no warning
in the changed Contact selector or markup; reported items are pre-existing
page-wide literals and intentional ledger/education rules.

### Final findings

- P0: none.
- P1: none.
- P2: none.
- P3: none.

## Final result

passed
