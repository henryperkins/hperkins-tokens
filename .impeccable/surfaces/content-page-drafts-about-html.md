# About resume candidate

## Surface

- Source: `content/page-drafts/about.html`
- Template: `templates/page-about.html`
- Page stylesheet: `assets/imladris-pages.css`
- Progressive controller: `assets/js/about-resume.js`
- Ownership: reviewed candidate applied to the local Studio page for verification. The accepted snapshot and production database-owned About page remain unchanged until a separate publication step.

## Thesis

The page is an explorable evidence index rather than a static keyword matrix. It should let an evaluator move from identity to proof, chronology, evidence-backed skills, selected artifacts, and contact without losing the resume reading path.

## Reading path

1. Identity hero: portrait, name, role, location, positioning, availability, and direct contact actions.
2. Proof timeline: five steps, from WordPress since 2012 through the 2026 credential, merged upstream work, five public projects, and WordCamp US.
3. Contributions: seven artifact-first ledger rows with visible state and source links.
4. Experience: four primary roles and a progressively enhanced disclosure for three earlier roles.
5. Skills: 34 terms across six categories, with counts derived from the eleven contribution and primary-role rows above.
6. Showcase: five selected artifacts, ending with Tableau. Each retains its purpose, written status, and evidence links.
7. Contact: one direct closing proposition, two concrete actions, and an in-flow chat launcher when the real widget is available.

## Responsive behavior

- Mobile first: a single-column document with a full-width labeled jump disclosure under the header. All five destinations are native links; without JavaScript they remain expanded.
- At `64rem`: the same navigation moves into the hero contents plate and the same skills index moves into a `13–15rem` sticky filter rail, within a `72rem` maximum canvas.
- Showcase records stay in one text-led column through `600px`, with summaries visible. Above that, the two-column artwork layout returns and the final card spans both columns. No missing-screenshot placeholder ships in the candidate.
- All interactive targets remain at least `44px` high.

## Interaction contract

- JavaScript upgrades static skill labels into buttons only when evidence exists.
- Selecting a term stably promotes matching rows in each ledger; nonmatches remain fully opaque below the named divider.
- The live readout names the selected term and exact match count. Counted contribution and role links lead to the matching ledgers, and a return action focuses the selected skill. Selection itself preserves focus. Clear restores canonical order.
- Earlier roles remain visible without JavaScript and collapse behind a disclosure only after enhancement.
- Active section state, the mobile jump disclosure, conditional chat integration, and print preparation are progressive enhancements. Email remains a real mailto link.
- Print preparation clears filters, expands earlier roles, and removes navigation, showcase, and contact furniture.
- The controller is globally enqueued but self-declines outside `.hp-about-resume-v3`, allowing it to remount after Interactivity Router swaps. Generated controls and observers are removed on disposal.

## Visual language

- Use the existing Parchment, Evergreen, Bruinen, and Mallorn tokens only.
- Use Cormorant for display hierarchy, EB Garamond for reading copy, Marcellus for register headings, and JetBrains Mono for labels and metadata.
- Favor flat council registers, hairline dividers, and `3px` evidence rules over rounded cards or decorative imagery.
- Keep the existing portrait identity and `HP` fallback. Serve responsive WebP derivatives while retaining the original artwork; keep the portrait eager and defer the four deep-page showcase images.

## Acceptance boundary

- The draft, page CSS, runtime controller, contracts, and documentation may change in this build.
- Local candidate application to the explicitly verified Studio site is permitted through `apply-local-page-drafts.js --confirm-local --page=about`. Do not update `content/page-snapshots/about.html`, deployment artifacts, or the production database.
- Publication requires a separate candidate-to-snapshot review and explicit approval.
