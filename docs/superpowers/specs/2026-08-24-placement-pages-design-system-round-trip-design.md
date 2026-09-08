# Placement Pages Design-System Round Trip

**Date:** 2026-08-24

**Status:** Approved in chat on 2026-08-24 as a candidate-first,
high-fidelity implementation. This document records that approved contract for
implementation review; it does not authorize publication, deployment, commit,
or push.

## Decision

Recreate the paired Imladris Design System references for the Job Placement
Digest and Placement Method and Evidence inside the existing WordPress block
theme. The ZIP is a dated visual and interaction reference, not production
code or a data source. The theme's current evidence, workbook-derived facts,
tokens, component primitives, and content-ownership contracts remain
authoritative.

The implementation is candidate-first:

- `content/page-drafts/job-placement-digest.html` and
  `content/page-drafts/placement-method-evidence.html` are the only page bodies
  changed during implementation.
- The live WordPress database remains canonical and untouched.
- The accepted snapshots remain unchanged until a separately authorized
  publication and export.
- Commit, push, theme deployment, production content publication, and public
  verification are separate gates and are not authorized here.

The two routes are one product surface. The Digest is the concise recruiter
argument; the Method page is its inspectable research appendix. Their shared
layout and interaction language should be implemented once without erasing the
content-driven differences between them.

## Sources and authority

The authority order is:

1. The live WordPress database body is canonical for published page content.
   Its accepted snapshot is a verified mirror; the draft is a review-only
   candidate and cannot override either merely by existing in Git.
2. Workbook and artifact contracts govern factual evidence: links, dates,
   counts, state classifications, and contribution attribution.
3. `theme.json`, `DESIGN.md`, and existing shared components govern visual
   tokens and component behavior.
4. `imladrisdesignsystem.zip` governs the approved composition, responsive
   topology, interaction behavior, and visual fidelity.
5. Prototype HTML, JavaScript, and bundled token files are explanatory
   reference only. They are not copied into the theme.

When prototype data conflicts with current evidence, current evidence wins and
the deviation must remain visible in source contracts and QA notes.

## Relationship to earlier specs

This design preserves the data-integrity and publication boundaries in the
earlier placement specs, while superseding presentation and interaction
choices that the approved 2026-08-24 handoff changes.

### Digest event and layout spec

`2026-08-13-job-placement-digest-event-banner-layout-design.md` remains
authoritative for factual copy, native WordPress ownership, the hero-first
amendment, the captioned event photograph, and fail-closed evidence filtering.
This design supersedes its lower-page decision to suppress repeated phone
column labels. The handoff's dual-anatomy ledger renders labelled stacked cells
below 782px, then a real table at and above 782px.

The existing hero-first order remains: global header, Digest masthead, WordCamp
band, numbered argument, evidence band, appendix, and close.

### Method redesign spec

`2026-08-16-placement-method-evidence-redesign-design.md` remains
authoritative for the 34-term ledger, 20-row market screen, workbook parity,
one merged State cell, fail-closed classification, and candidate/snapshot
separation.

This design supersedes five earlier presentation decisions:

- The enhanced keyword ledger opens on **Demonstrated**, not All terms.
- Mobile ledger cells render their column labels.
- The market screen becomes a full-bleed sunken band with an 84rem inner
  container instead of an inset wide plate.
- The Method hero replaces scope chips with the three-figure audit plate and a
  visible back-link to the Digest.
- In a successfully mounted single-standing keyword view, the repeated visible
  standing word may collapse to screen-reader-only text because the active chip
  supplies the visible group label. The per-row word remains in the accessible
  name and returns visibly in All terms, no-JavaScript, and fail-closed output.

The earlier requirement that every row and standing be present without
JavaScript remains. The demonstrated-first view exists only after the
controller has classified every row and mounted successfully.

## Architecture and ownership

### Route templates

`templates/page-job-placement-digest.html` and
`templates/page-placement-method-and-evidence.html` remain unchanged. They
already provide the correct full-width `wp:post-content` shell and preserve the
database-owned body.

### Page bodies

The two candidate bodies own semantic structure and factual content:

- masthead groupings and in-page navigation
- numbered section wrappers
- standing and figure definitions
- ledger headers, rows, `data-label` attributes, and fragment targets
- cross-links between the two routes
- closing invitation content

Use native block markup and existing theme components wherever they can express
the structure. Prototype-only custom elements, runtime classes, support
scripts, and inline token styles do not enter the page bodies.

### Shared page-pair CSS

`assets/imladris-pages.css` owns the shared placement-page chassis and all
route-specific layout:

- text, wide, and full-band containers
- mobile-first section rhythm
- numbered spine
- masthead and side plates
- filter-strip layout
- dual-anatomy ledgers
- standing tiles, fit register, proof cards, and market scroll treatment
- route-specific responsive exceptions

Implement the shared anatomy with a small `hp-placement-*` class vocabulary,
composed with the existing `hp-digest-*` and `hp-method-*` route classes. Do
not copy the prototypes' `data-sec`, `data-part`, or `data-ledger` API merely to
imitate their implementation.

Do not move the chassis into `style.css` or create a fourth conditional bundle.
These layouts belong only to the route pair. Existing shared primitives such as
`.hp-action-panel.is-closing`, `.hp-action-rail`, `.hp-chip`, callouts, artifact
rows, and base buttons remain in their current owners.

### Filtering controller

`assets/js/digest-register-filter.js` remains the single progressive-
enhancement controller for all three ledgers. Extend its existing config rather
than adding route-specific scripts.

The controller contract is:

- Digest evidence defaults to All evidence.
- Method keywords default to Demonstrated; filter order is Demonstrated,
  Partial, Gap, All terms.
- Method market rows default to All rows.
- Counts are derived from classified rows, never authored in JavaScript.
- Every row must classify before a ledger mounts. Any mismatch leaves the
  complete unfiltered source visible.
- No-JavaScript output contains every row and every written standing.
- The mounted All terms view shows each row's standing word. A single-standing
  view may reduce the repeated per-row word to screen-reader-only text because
  the active chip names the visible standing. The controller must not remove
  the word from the accessibility tree. It returns visibly in All terms,
  no-JavaScript, and fail-closed output.
- Chip state uses `aria-pressed`, a redundant written label, and the existing
  live count line. Filtering has no URL state or row-swap animation.
- Router remounting remains idempotent.

## Shared visual chassis

### Containers and rhythm

Both pages are mobile-first. Phone layout is the default; `min-width` queries
enhance it.

- Text sections use the existing 44rem reading measure.
- Wide sections stop at 72rem.
- Digest bands use a 72rem inner container.
- The Method market band uses an 84rem inner container because its table has
  six columns.
- Inline gutters are 16px on phones and 32px from 600px.
- Ordinary section padding is 40px on phones and 64px from 600px.
- Anchor offset is centralized: 72px below 782px and 84px from 782px, applied
  to the route pair's section, subheading, and note targets.

### Numbered spine

Each numbered section wraps a numeral and content column.

- Below 782px, the numeral is a 19px mono label followed by a flexible warm
  hairline across the remaining width.
- From 782px, the section becomes a `3rem minmax(0, 1fr)` grid with 16px gap,
  24px top padding, and a top hairline. Full-bleed band interiors use the bare
  variant without a second top border.
- Section eyebrows remain 12px mono tracked caps, preserving the repository's
  typography floor.
- Section headings use the existing fluid H3 token and balanced wrapping on
  both pages.

### Filter strips

Below 600px, filters are horizontal snapping strips that bleed to the content
gutter without producing page overflow. From 600px they wrap normally. Buttons
retain the 44px target floor, written counts, hover/focus treatment, and
colour-plus-word state redundancy.

### Dual-anatomy ledgers

Below 782px, each row is a stacked record. The table header is visually hidden;
each data cell reads its own `data-label` through `attr(data-label)`. All
columns remain represented, including Company and Posting on the market screen.

From 782px, the same markup becomes a semantic table. Status colour attaches to
the row header cell rather than the `tr`, because table rows do not reliably
paint an inline-start border. Existing state words remain visible wherever the
active filter does not already supply the same visible word and remain in the
accessibility tree in every state.

Empty source cells remain empty for workbook parity and render as an em dash in
the presentation layer. Inline ledger actions retain reachable phone hit areas
without moving their visible underline.

### Closing invitation

Reuse `.hp-action-panel.is-closing` and `.hp-action-rail`. The existing masked
Imladris emblem supplies the watermark; do not add prototype inline SVG to the
database-owned body. Route-specific CSS may adjust outer rhythm but must not
fork the shared component.

## Job Placement Digest

### Masthead

The masthead is one column by default and becomes a 1.6fr / 0.85fr grid at
940px.

The main column retains the existing eyebrow, H1, credential line, role
proposition, and two proof chips. The side column adds a labelled contents
navigation with seven in-page links and the published/verified dates. At narrow
widths the contents rows are full 44px navigation targets. Dates remain visible
even if the contents navigation is ever disabled.

### Event and argument

The captioned WordCamp photograph remains sharp documentary evidence inside the
time-bound callout. The callout sits in a sunken full-width band immediately
after the masthead and keeps one primary Contact action.

Sections 01 through 07 retain their current factual copy, evidence links, and
order. Their compositions change to the shared numbered spine:

1. The work I want — text measure.
2. The ask, against proof — text measure, responsive fit register, named gap.
3. Three proofs, open to inspection — wide proof-card grid.
4. How I debug — text measure, four-step grid and artifact rows.
5. What prevention looks like — text measure and pinned theme artifact.
6. Evidence register, dated — full-width sunken band and 72rem inner ledger.
7. The appendix — text measure and forward link to the Method page.

The evidence register retains 12 rows, its three 4-row states, three primary-
proof markers, real artifact URLs, and an All evidence default.

### Close

The existing closing panel keeps its three actions: Contact Henry, View
one-page resume, and Review selected WordPress evidence. The last action remains
an in-page fragment link.

## Placement Method and Evidence

### Masthead

The masthead becomes a 1.6fr / 0.8fr grid at 940px. The main column retains the
eyebrow, H1, date line, lead, and a 44px phone back-link to the Digest.

The side plate presents three verifier-backed figures:

- 34 resume terms audited
- 20 market rows screened
- 3 machine verdicts overturned

Do not reproduce the prototype's false implication that every market row has a
recorded check date. The figure note must use the current derived distribution
or neutral wording such as "Every row retained; delistings kept visible."

### Keyword ledger

Section 01 uses the shared spine and retains all 34 current terms and their
10/11/13 standing distribution. The standing definitions become three bordered
tiles with fixed 5px state rules and visible counts. The ledger opens on the 10
Demonstrated rows only after the controller mounts successfully; no-JavaScript
and fail-closed output shows all 34.

### Screening questions

Section 02 retains Q1/Q2/Q3 in each heading's accessible name. The numerals may
occupy a visual grid column from 600px, but fragment arrivals from the market
screen must still expose the question label and full heading.

### Market band

Section 03 becomes a full-width sunken band with an 84rem inner container. It
retains all 20 workbook-parity rows and the existing five filter groups. From
782px the table scrolls horizontally with a 62rem minimum width; the scroll hint
appears only from 782px through 1180px, where the table exists and overflows.

On phones, all six cells stack with labels. The Posting link becomes the row's
pill-shaped 44px action; Q and note references remain inline links with expanded
hit areas.

The NBCUniversal row remains verbatim in the register because its reasoning is
a workbook-owned field. Do not duplicate or relocate it into the prototype's
`#note-nbcu` callout. This is an intentional data-authority deviation from the
visual reference.

### Corrective close

Section 04 retains the current delisting and overturned-decision facts and
presents the corrective control through the existing callout vocabulary. The
closing action panel returns to the Digest with one primary action.

## Accessibility and interaction

- Preserve one H1 per route and sequential heading order.
- Contents and cross-reference links use real fragment targets with the shared
  responsive anchor offset.
- Every interactive control meets the existing phone target contract.
- Focus uses the existing Gold system ring unless the handoff documents the
  local contents/filter exception.
- Hover styles that alter layout-adjacent presentation are limited to
  hover-capable pointers.
- Existing reduced-motion behavior remains authoritative.
- Status never depends on colour alone: written state, dot shape, fixed-width
  rule, or active filter label supplies the redundant signal.
- No CSS visual reordering, duplicated mobile content, default-hidden source
  evidence, loading state, skeleton, or form is added.
- Long artifact URLs, labels, headings, and table values wrap without causing
  page overflow at 320px, 390px, or 200% zoom.

## Implementation scope

Expected changed files:

- `content/page-drafts/job-placement-digest.html`
- `content/page-drafts/placement-method-evidence.html`
- `assets/imladris-pages.css`
- `assets/js/digest-register-filter.js`
- focused placement source, style, parity, and rendered verifier files under
  `scripts/`
- this design spec and the later implementation plan

Capture `git status --short` before implementation and preserve it as the
dirty-worktree baseline. The planned edit allowlist is:

- the two page drafts named above
- `assets/imladris-pages.css`
- `assets/js/digest-register-filter.js`
- `scripts/verify-job-placement-digest-source.js`
- `scripts/verify-job-placement-pages.js`
- `scripts/lib/job-placement-digest-source-contract.test.js`
- `scripts/lib/job-placement-page-style-contracts.js`
- this design spec and its implementation plan

Any additional path requires an explicit dependency finding before it is
edited. Final review compares the changed-path set with this allowlist and the
baseline so pre-existing dirty files, accepted snapshots, templates, and
global theme files cannot enter the change accidentally.

No change is planned for:

- accepted page snapshots
- either route template
- `theme.json`
- `style.css`
- `assets/c/*`
- `functions.php`
- global header, footer, navigation, About, resume, or unrelated routes
- the existing dirty 0.3.61 touch-target work

If implementation proves that a no-change file must move, stop and present the
new dependency before expanding scope.

## Verification

### Source and contract gates

Run the repository's verifier skill before executing checks. The focused suite
must cover:

```powershell
git ls-files '*.php' | ForEach-Object { php -l $_ }

node --test scripts/lib/job-placement-digest-source-contract.test.js scripts/lib/market-screen-parity.test.js scripts/lib/placement-artifact-contract.test.js scripts/lib/placement-artifact-links.test.js scripts/lib/style-coverage.test.js
node scripts/verify-job-placement-digest-source.js
node scripts/verify-job-placement-pages.js --source-only --drafts
node scripts/verify-prominent-actions.js --source-only --drafts
node scripts/verify-placement-artifacts.js
node scripts/verify-performance-assets.js
node scripts/verify-style-token-usage.js
node scripts/verify-content-ownership-docs.js
git diff --check
```

The Method source contract must replace the retired `hp-method-scope` checks
with an audit-plate check under `--drafts`. It derives and asserts all three
displayed figures — 34 terms, 20 market rows, and 3 overturned verdicts — plus
the accurate market-date/distribution note from the keyword ledger and workbook
contract. Typed figures or the false "every state dated" claim fail the gate.

If documentation or Impeccable authority artifacts change beyond this spec,
also run their focused ownership/artifact verifiers.

### Rendered QA

Compare the design references and candidate implementation at matched desktop
and mobile viewports. One combined desktop/mobile inspection, one batched fix,
and at most one confirmation round is the implementation ceiling.

Rendered checks cover:

- 1440px and 940px masthead composition
- 782/781px ledger and Council-header boundary
- 600px filter/action transition
- 390px and 320px containment and labelled ledger anatomy
- 200% zoom
- filter defaults, counts, keyboard operation, and live regions
- fragment navigation and focus visibility
- event-image crop/caption and market horizontal scroll hint
- no JavaScript and deliberately unclassifiable-row fail-closed states

Do not mutate an existing WordPress database merely to obtain screenshots. A
rendered candidate may use a disposable, separately created local copy. If no
such preview is available, report rendered candidate verification as pending;
do not substitute source checks for browser evidence.

After the UI is complete, run the Impeccable detector once over the changed UI
targets. Resolve mechanical findings before the independent finish review.

## Acceptance criteria

- Both pages visibly read as one dossier/appendix pair while retaining their
  distinct jobs.
- Digest gains the contents plate, shared numbered spine, banded event/evidence
  movements, labelled phone ledger, and faithful closing composition.
- Method gains the figures plate, demonstrated-first keyword view, standing
  tiles, full-width market band, scroll hint, labelled phone ledgers, and return
  path.
- All current evidence, real URLs, dates, attribution, workbook fields, and row
  counts remain present and verifiable.
- Without JavaScript, all 12 Digest records, all 34 keyword rows, and all 20
  market rows remain visible.
- A classification mismatch disables only the affected filter and hides
  nothing.
- No horizontal page overflow occurs at the verified widths or zoom state.
- Existing unrelated worktree changes remain untouched.
- Candidate, snapshot, local runtime, commit/push, deployment, database
  publication, and public verification are reported as separate states.

## Future publication ordering

Publication is out of scope, but the eventual production sequence is a coupled
gate because the new CSS reads candidate-owned `data-label` anatomy:

1. Publish both reviewed database bodies through the guarded content workflow.
2. Deploy the exact matching theme CSS and controller.
3. Verify the rendered routes and all three ledgers at phone and table widths.
4. Export the accepted snapshots from the verified live bodies and prove
   parity.

Do not deploy the new placement-page CSS against the old published bodies, and
do not export snapshots before the database write. A partial release can put
the wrong phone label over otherwise correct evidence.

## Out of scope

- Copying prototype runtime or token files into the theme
- Rewriting evidence claims to match prototype mock data
- Changing the workbook or recruiter artifacts
- Changing global tokens, navigation, header, footer, About, or resume routes
- Adding a new design-system bundle or route-specific JavaScript file
- Editing accepted snapshots or any WordPress database
- Commit, push, deployment, publication, or public-site verification
