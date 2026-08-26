# About v3 design QA

## Scope and release state

- Released body: production Page 6, `content/page-drafts/about.html`, and `content/page-snapshots/about.html` share the same normalized v3 content.
- Rendered implementation: `https://henry-perkins.wp.local/about/`, using the local WordPress Studio install and the candidate worktree.
- Production promotion: Page 6 was updated body-only after its previous content matched the accepted snapshot; the supporting theme release and public route verification complete the publication boundary.

## Source visual truth

The source is the extracted v3 handoff at:

`C:\Users\htper\AppData\Local\Temp\codex-about-v3-handoff-20260825\design_handoff_about_v3`

Focused source captures, each 909 x 540 pixels at 96 DPI / 1x density:

- `screenshots\01-hero.png`
- `screenshots\02-signals-and-sticky-nav.png`
- `screenshots\03-experience.png`
- `screenshots\04-skills-index.png`
- `screenshots\05-filter-active-contributions.png`
- `screenshots\06-selected-work.png`

## Implementation evidence and normalization

The matching Edge browser captures are in:

`C:\Users\htper\AppData\Local\Temp\hperkins-about-v3-qa`

- `implementation-01-hero.png`
- `implementation-02-contributions.png`
- `implementation-03-experience.png`
- `implementation-04-skills-index.png`
- `implementation-05-filter-active-contributions.png`
- `implementation-06-selected-work.png`

The browser was set to a 909 x 540 CSS viewport at device pixel ratio 1. The in-app browser's content-only compositor capture excludes its scrollbar/inset and writes 894 x 531 pixels; source and implementation were aligned to the same content crop and placed together in the same comparison input without changing page scale. The frame inset was treated as browser chrome, not a page mismatch.

Full-page responsive evidence from the repository's Edge/CDP verifier:

- `C:\Users\htper\AppData\Local\Temp\hperkins-about-rendered\about-1440.png` — 1440 x 5978
- `C:\Users\htper\AppData\Local\Temp\hperkins-about-rendered\about-1024.png` — 1024 x 6109
- `C:\Users\htper\AppData\Local\Temp\hperkins-about-rendered\about-768.png` — 768 x 7728
- `C:\Users\htper\AppData\Local\Temp\hperkins-about-rendered\about-390.png` — 390 x 10400
- `C:\Users\htper\AppData\Local\Temp\hperkins-about-rendered\about-320.png` — 320 x 11974

## State and comparison evidence

- Full-view comparisons covered the hero, impact strip, sticky page navigation, contributions, experience, Skills/Education, selected work, closing panel, and the page's overall rhythm.
- Focused comparisons were required because ledger typography, evidence states, skill controls, and work-card details are too small to judge from a full-page image. Each of the six source captures was compared with the corresponding rendered region in one combined visual input.
- Resting and active filter states were compared. The active state used `Provider integrations`; the readout, cited-row promotion, divider, citation chips, and unchanged total row count were all visible.
- The global Condensed Council header is intentionally retained from the real theme. Its shape differs from the prototype's framing header, but it is outside the database-owned About body and was not treated as candidate drift.
- The source's active-filter capture contains a visible overlap artifact. The implementation preserves the specified content and state while keeping the rows legible; reproducing the artifact would create a usability defect.

## Required fidelity surfaces

- Fonts and typography: Cormorant Garamond carries display headings, EB Garamond carries body copy, Marcellus carries labels/actions, and JetBrains Mono carries status/provenance. Family, weight, scale, line height, tracking, wrapping, and hierarchy match the handoff at the reviewed states.
- Spacing and layout rhythm: the portrait/nameplate, proof panels, impact strip, evidence ledgers, 64rem rail handoff, one-column pre-64rem showcase, education grid, and closing panel match the source structure. The final rendered gate found no overflow at 1440, 1024, 768, 390, or 320 pixels.
- Colors and visual tokens: v3 uses the registered Imladris surface, text, border, brand, gold, radius, and shadow tokens. The static token test and WordPress token verifier both pass; no parallel palette was introduced.
- Image quality and asset fidelity: the supplied Henry Perkins portrait is used directly with the intended circular crop, gold border, scale, and shadow. The handoff contains no additional page-owned imagery or icon assets to reproduce.
- Copy and content: the hero, credential, WordCamp US note, seven contribution rows, seven experience roles, six skill groups / 34 terms, two education records, five selected-work entries, and closing invitation match the v3 contract. Visible source count is 995 words.
- States and interactions: section navigation, scrollspy, evidence filters, Clear filter, earlier-role disclosure, Copy status, responsive Skills-index relocation, canonical print preparation, and a real Interactivity Router route-away/Back remount were exercised. Filtering stably promotes cited rows, dims the non-citing partition to 0.34, and hides none; Back restores exactly one control set, two dividers, and eleven citation chips.
- Accessibility and resilience: semantic native navigation and controls remain keyboard reachable; prominent actions and artifact links retain 44px targets; focus styling, reduced motion, portrait alt text, live status messaging, and sticky-target clearance are verified. Console errors and warnings were empty in the final desktop and mobile passes.

## Comparison history

- Pass 1 — P1 layout integration: the parent post-content constraint and legacy About gutters narrowed and offset the v3 composition. The v3-only post-content breakout, owned hero/layout gutters, and mobile sticky-nav offset were corrected. Post-fix hero and contributions comparisons align with `01-hero.png` and `02-signals-and-sticky-nav.png`.
- Pass 2 — P2 experience drift: inherited v2 card borders, role order, and typography made the experience ledger heavier than the flat source anatomy. The v3 experience layer now uses transparent rows, the 3px evidence rule, Marcellus organization labels, and mono metadata. Post-fix evidence is `implementation-03-experience.png`.
- Pass 3 — P2 responsive work drift: the showcase switched to two columns too early and inherited inflated card minimum heights. Its handoff moved to 64rem, the fifth item spans only at that breakpoint, and pre-64rem cards are compact and stacked. Post-fix evidence is `implementation-06-selected-work.png` plus the 768/390/320 full-page captures.
- Pass 4 — P2 interaction integration: the earlier-role wrapper could remain displayed despite `hidden`, and desktop-responsive Skills copy confused canonical word parity. The disclosure rule now wins WordPress block display styles, and the rendered probe restores authored Skills copy before comparing source/rendered counts. Post-fix disclosure and all five primary viewport probes pass.
- Pass 5 — P2 narrow boundary: at 601px the closing action rail wrapped to two rows even though the shared contract becomes horizontal above 600px. The v3 contact rail now stays nonwrapping with two shrinkable equal button columns. The 601px and 600px boundary probes both pass.
- Pass 6 — review hardening: enhancement-only dividers and citation chips moved out of authored Gutenberg markup and are generated exactly once at runtime; the phone navigation is the flat 92%-parchment/8px-blur band; full impact cells are native links on the auto-fit grid; secondary actions use the registered style; the 3px Gold 700 focus ring keeps its 2px offset; exact handoff copy, the `/one-page-resume/` fallback, current live v0.3.60 status, and route cleanup are enforced. A real-browser flow now covers filter, clear, disclosure, copy, print, focus, and cleanup.
- Pass 7 — router lifecycle hardening: a trusted header-link click now drives the real WordPress Interactivity Router away from About, verifies document-global cleanup, traverses Back, and requires one clean remount. The controller normalizes the router's cached pre-teardown DOM snapshot before remounting, preventing duplicate Clear, disclosure, copy, divider, and citation controls.
- Final comparison: no actionable P0, P1, or P2 mismatch remained after the Pass 6 same-state recaptures. The refreshed 1440px and 390px review artifacts are `.impeccable/review/desktop.png` and `.impeccable/review/mobile.png`.

## Findings

- P0: none.
- P1: none remaining.
- P2: none remaining.
- P3: none requiring candidate changes. The real global header and the implementation's correction of the source overlap artifact are expected, documented differences.

## Implementation checklist

- [x] Match all six supplied visual states.
- [x] Verify desktop, tablet, mobile, and breakpoint geometry.
- [x] Exercise navigation, filtering, disclosure, copy, print preparation, and a real router away/Back remount.
- [x] Check fonts, spacing, tokens, portrait quality, copy, focus, targets, reduced motion, overflow, and console output.
- [x] Promote the exact reviewed body, synchronize the accepted snapshot, and preserve the previous production body for rollback.

final result: passed
