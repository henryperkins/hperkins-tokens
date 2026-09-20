# Approved About mobile implementation

**Goal:** Implement the approved parchment-and-evergreen mobile proposal and the seven audited corrections.

**Architecture:** Keep the existing WordPress block body, one progressively enhanced About controller, and the page-specific stylesheet. Edit the candidate only; retain the accepted snapshot until a separate publication step. The Studio theme junction already points at this clean tracked checkout.

**Spec:** `output/about-mobile-audit-2026-09-20/about-mobile-proposal.md` and `impeccable-audit.md`.

## Constraints

- Preserve all five timeline steps, seven contributions, seven roles, 34 skills, five projects, factual claims, and existing destinations.
- Preserve desktop layout, no-JavaScript reading, native printing, router remounts, design tokens, and the ledger status anatomy.
- Use at least 44px touch areas; keep every mobile project summary readable.
- Production page writes and snapshot promotion remain separate. Commit and push to `main` were authorized after implementation review; that push feeds the configured theme publication pipeline.

## Tasks

- [x] Extend filter behavior tests to cover separate contribution/experience counts, empty matches, and clearing; implement counted destination links and a return-to-filter control in `assets/js/about-resume.js`.
- [x] Upgrade the same section navigation to a labeled mobile disclosure; preserve five native anchors, keyboard closing/focus, active location, breakpoint moves, and cleanup on navigation.
- [x] Adapt `assets/imladris-pages.css` for single-column text-led mobile work records, visible descriptions, comfortable targets, and the approved open contact composition. Remove the missing screenshot placeholder from `content/page-drafts/about.html`.
- [x] Integrate an in-flow contact launcher with the real Jetpack Reader Chat mount. Hide its floating launcher only while a working replacement exists; keep widget ownership upstream and restore on route disposal.
- [x] Add responsive modern image derivatives and targeted below-fold loading in `inc/content-images.php`, preserving original artwork and explicit hero priority. Exercise the PHP filter with existing attributes and unknown images.
- [x] Refresh the scoped About brief and relevant source/rendered contracts. Retain accepted-source compatibility where content promotion is separate.
- [x] Run focused unit/source checks and the required repository checks. Render at 320/390/430px, tablet, desktop, landscape, enlarged text, no-JS and reduced motion; exercise results, navigation, chat open/close, and remount behavior.

## Review focus

1. A skill matching two ledgers must provide both destinations, with counts derived from that ledger's rows.
2. Selecting a skill must retain focus; explicit navigation must reach readable evidence and offer a return path.
3. Repeated mount/dispose, print, and viewport changes must not duplicate controls or strand focus.
4. An absent or late chat widget must leave working contact links and must not be hidden before its replacement exists.
5. Image filtering must not duplicate dimensions, replace unrelated assets, lazily load the visible portrait, or discard upstream responsive markup.
