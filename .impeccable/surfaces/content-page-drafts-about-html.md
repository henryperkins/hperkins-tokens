# About resume candidate

## Surface

- Source: `content/page-drafts/about.html`
- Template: `templates/page-about.html`
- Page stylesheet: `assets/imladris-pages.css`
- Progressive controller: `assets/js/about-resume.js`
- Ownership: reviewed candidate only. The accepted snapshot and database-owned About page remain unchanged until a separate publication step.

## Thesis

The page is an explorable evidence index rather than a static keyword matrix. It should let an evaluator move from identity to proof, chronology, evidence-backed skills, selected artifacts, and contact without losing the resume reading path.

## Reading path

1. Identity hero: portrait, name, role, location, positioning, availability, and direct contact actions.
2. Impact strip: three compact proof signals.
3. Contributions: seven artifact-first ledger rows with visible state and source links.
4. Experience: four primary roles and a progressively enhanced disclosure for three earlier roles.
5. Skills: thirty terms whose counts are derived from the eleven contribution and primary-role rows above.
6. Showcase: five selected artifacts, ending with the theme and design system itself.
7. Contact: one direct closing proposition and two concrete actions.

## Responsive behavior

- Mobile first: a single-column document and a horizontally scrollable sticky section bar.
- At `64rem`: a `13rem` sticky section rail and a fluid main column within a `72rem` maximum canvas.
- Showcase cards become two columns when space permits; the final card spans both columns.
- All interactive targets remain at least `44px` high.

## Interaction contract

- JavaScript upgrades static skill labels into buttons only when evidence exists.
- Selecting a term dims nonmatching contribution and primary-role rows to `0.34` opacity; it never removes evidence.
- The live readout names the selected term and exact match count. Clear restores every row.
- Earlier roles remain visible without JavaScript and collapse behind a disclosure only after enhancement.
- Copy-email, active section state, and print preparation are progressive enhancements.
- Print preparation clears filters, expands earlier roles, and removes navigation, showcase, and contact furniture.
- The controller is globally enqueued but self-declines outside `.hp-about-resume`, allowing it to remount after Interactivity Router swaps.

## Visual language

- Use the existing Parchment, Evergreen, Bruinen, and Mallorn tokens only.
- Use Cormorant for display hierarchy, EB Garamond for reading copy, Marcellus for register headings, and JetBrains Mono for labels and metadata.
- Favor flat council registers, hairline dividers, and `3px` evidence rules over rounded cards or decorative imagery.
- Keep the existing portrait asset and provide the `HP` fallback behind it.

## Acceptance boundary

- The draft, page CSS, runtime controller, contracts, and documentation may change in this build.
- Do not update `content/page-snapshots/about.html`, database Page 6, deployment artifacts, or production.
- Publication requires a separate candidate-to-snapshot review and explicit approval.
