# Job Placement Digest Event Banner Layout Design

**Date:** 2026-08-13

**Status:** Approved by the user on 2026-08-13. **Partially superseded on
2026-08-16** — see the amendment below.

## Amendment — 2026-08-16, approved by the user

The Digest was re-derived from the Imladris Design System project's
`templates/digest/Digest.dc.html`, which restores the long-form numbered
dossier. Three constraints recorded below were lifted deliberately, and are
recorded here rather than silently overridden:

1. **The event-imagery ban is lifted.** "Add no WordCamp palette, logo,
   imagery, Phoenix decoration…" no longer holds for imagery. The event plate
   may carry a captioned documentary photograph of the venue, bled to the
   plate's own edges, on `.hp-wcus-callout__figure` /
   `.hp-wcus-callout__caption`. The remaining bans — WordCamp palette, logo,
   gradients, a second visual identity — stand. *This is the one part of the
   amendment not yet delivered: the photograph itself is not in the
   repository.*
2. **"Add no disclosure, truncation, or default-hidden state" is narrowed.**
   The evidence register may carry a release-state filter, on the condition
   that it never hides evidence the reader has not chosen to hide: the filter
   is injected by script, defaults to "All evidence", declines to mount unless
   it can classify every row, and leaves all twelve records visible with no
   JavaScript. The rendered contract pins that condition
   (`registerVisibleRows === 12` before any interaction).
3. **The banner no longer leads the page.** The spec put the event first; the
   design file puts the hero first. The hero now opens the outline with the
   H1, and the event plate takes the second slot, so the event's own H2 can no
   longer precede the document's first heading. The event action rail is
   reduced from three actions to one — the conversation — because the résumé
   and evidence routes are already offered by the closing invitation, after
   the argument has been made.

The recruiter-brief distillation of commit `10adf63` is superseded by the same
decision. The 425-word budget, the four-block structure, and the eight-link
inventory no longer apply; `scripts/verify-job-placement-digest-source.js` now
pins the dossier instead.

Unchanged by this amendment: every factual claim, evidence state, link, date,
and contribution attribution; one H1 and a sequential outline; keyboard and
assistive-technology order; visible focus; reduced-motion behaviour; the
44px target floor; the 12px typography floor; and the rule that the live
database body is canonical while the tracked snapshot is its accepted mirror.

---

**Surface:** `/job-placement-digest/`

**Mode:** Persuade

## Goal

Make WordCamp US conversations and event actions the immediate success path of
the Job Placement Digest while preserving the page's Support Engineer
positioning, evidence-first identity, factual copy, and content-ownership
boundaries.

A WordCamp visitor should be able to recognize the event context, start a
conversation, open the one-page resume, or jump to selected WordPress evidence
before entering the deeper role argument. The layout must remain a native part
of Imladris rather than becoming a conference landing page.

## Existing Constraints

- The established visual world is the Imladris "Quiet Council Ledger":
  parchment, Ink, Evergreen, Bruinen River, restrained Mallorn Gold, editorial
  serif hierarchy, and documentary metadata.
- Existing event dates, Core AI booth wording, role claims, evidence states,
  links, and contribution attribution remain unchanged.
- The live WordPress database body is canonical. The tracked snapshot is its
  accepted mirror; the draft is the review candidate.
- The page retains one H1, sequential headings, keyboard and assistive-
  technology order, visible focus, reduced-motion behavior, and the repository's
  current containment and target-size contracts.
- No new design tokens, event brand system, imagery, logo treatment, or motion
  are needed.

## Spatial Thesis

The page opens as an event invitation followed by a role proposition.

The primary path is:

1. Global Council header
2. WordCamp status and invitation
3. Conversation, resume, and evidence actions
4. Support Engineer proposition
5. Role-fit evidence
6. Primary technical proof
7. Complete evidence reference
8. Closing invitation

The event banner leads because the visitor's immediate success is a WordCamp
conversation. The Support Engineer proposition follows without competing for
the same action space. Evidence remains complete and visible below.

## Opening Composition

### Event banner

The WordCamp banner becomes the first content inside the page main landmark. It
uses the existing 72rem wide composition, Parchment Raised surface, and fixed
Mallorn Gold inline-start rule. It does not use WordCamp colors, logos, stock
imagery, Phoenix decoration, gradients, or a second visual identity.

At 782px and wider, the banner has two columns:

- The larger column contains the existing event eyebrow, visible title, and
  booth/date copy.
- The smaller column contains a vertical action rail.
- Actions remain ordered as **Start a WordCamp conversation**, **View one-page
  resume**, and **Review selected WordPress evidence**.
- The conversation action is the only filled Evergreen control. Resume and
  evidence remain outlined.
- Each action fills the action column, may wrap to two lines, and retains a
  44px minimum target.

The banner is neither sticky nor viewport-height. It is a bounded event register
whose temporary nature is visually clear.

### Digest hero

The existing Digest hero follows immediately on the open Parchment field. Its
eyebrow, H1, experience line, current-role statement, dateline, current target,
and longer-term direction remain unchanged.

The hero receives tighter internal rhythm so those elements read as one role
proposition. It does not repeat the event actions. At 1024x1000, the complete
event banner and complete role proposition should be visible, with the next
section beginning at or near the fold.

Removing the WordCamp block after the event returns the Digest hero to the
natural first position. No empty wrapper, compensating margin, or event-specific
dependency may remain.

## Semantic Structure

The event banner precedes the page title visually and in source order, so it
must not introduce an H2 before the H1. Implement it as a labelled `aside`:

- The visible "I'll be at WordCamp US" title labels the complementary landmark
  through `aria-labelledby` but is not heading markup.
- The Digest proposition remains the page's single H1 and first semantic
  heading.
- Subsequent section headings retain their existing sequential outline.

The DOM, visual, keyboard, and assistive-technology orders are identical. CSS
`order`, duplicate mobile content, and visually reordered focus paths are not
allowed.

## Responsive Topology

### 782px and wider

- Event copy and event actions form the approved two-column banner.
- The action rail is vertical, compact, and equal-width.
- The Digest hero remains open and left-aligned below it.

### 601px through 781px

- The banner becomes one linear column at the same boundary as the Council
  header.
- Event copy precedes the three actions.
- Banner padding is 24px.
- Actions remain one full-width column rather than a compressed horizontal row.

### 600px and narrower

- Banner padding is 16px.
- Every event action is full width with visible, unclipped focus treatment.
- Long action labels wrap without shrinking type.
- Target and direction chips wrap as independent rows when necessary.
- The hero title loses any narrow maximum that would force awkward line breaks.

### Narrow and zoomed states

- At 390px and 320px, no text, chip, action, table, link, or status string
  creates horizontal page overflow.
- At 200% zoom, the layout reflows to the linear topology instead of retaining
  compressed columns.
- The existing 320px stacked role-fit table treatment remains intact.
- Long repository names and evidence links continue to wrap inside their own
  records.

Boundary verification covers 1440, 1024, 782, 781, 768, 600, 390, and 320px,
with explicit probes at the 781/782 and 1023/1024 transitions.

## Lower-Page Hierarchy

The existing section order remains unchanged after the hero. The layout divides
it into three movements:

1. **Role argument:** "Why Support Engineer now" and the fit ledger
2. **Primary proof:** three inspectable proofs and the debugging case
3. **Reference and close:** theme governance, evidence register, method link,
   and final invitation

### Wide compositions

- "Why Support Engineer now" becomes a heading-rail/prose-column composition.
- The fit ledger follows after 32px as part of the same argument rather than
  after another full section break.
- The proof cards retain their three-column composition with a 16px gap.
- The debugging proof retains its 2x2 Signal, Diagnosis, Constraint, and Result
  structure.
- Theme governance uses the same heading-rail/prose-column treatment as the
  opening role argument.
- The method introduction and final invitation form a two-column closing zone:
  supporting method on the left and the primary conversation panel on the
  right.

### Narrow compositions

- Every section returns to semantic linear order.
- Proof-card and incident-card padding becomes 16px.
- Every evidence-register row remains visible; no disclosure or default-hidden
  content is introduced.
- Repeated visual "STATE" and "DIRECT EVIDENCE" labels are removed from each
  narrow record while table headers remain available to assistive technology.
- At 390px, title and state form one compact metadata group followed by direct
  evidence links.
- At 320px, title, state, and evidence stack without a horizontal scroller.

## Rhythm

Spacing uses existing tokens and deliberate contrast:

- 64px desktop and 40px mobile before major movements
- 32px desktop and 24px mobile inside connected arguments
- 16px between peer cards, action controls, and ledger records
- 24px ordinary desktop card/register padding and 16px phone padding

Proximity establishes grouping before borders or new containers. Only the event
banner, proof cards, debugging proof, ledgers, and closing invitation retain
bounded treatments. Ordinary prose remains on the open Parchment field.

## Interaction and Accessibility Contract

- One H1; the event title is the accessible name of its `aside`, not a heading
  before the H1.
- Sequential heading order after the H1.
- Event actions retain 44px minimum targets.
- Mallorn Gold focus outlines remain visible and unclipped.
- The evidence action scrolls to and focuses `#evidence-register` through the
  existing router-scroll behavior.
- Status and event meaning never depend on color alone.
- No new animation is introduced; existing reduced-motion behavior remains.
- No mobile-only duplicate markup, hidden evidence, or CSS visual reordering.
- Long English labels and identifiers wrap without truncation.
- Containment holds at 200% zoom and the verified narrow widths.

## Implementation Scope

Expected implementation changes are limited to:

- `content/page-drafts/job-placement-digest.html` for the reviewed candidate's
  source order, landmark semantics, and layout groupings
- `assets/imladris-pages.css` for page-specific layout and responsive rules
- focused source-contract, style-contract, prominent-action, and rendered-page
  tests under `scripts/`

Existing `theme.json` tokens and component styles are sufficient. No change is
planned for `theme.json`, global navigation, the footer, resume artifacts,
factual copy, evidence claims, or unrelated pages.

The implementation must load `reference/craft-floor.md` immediately before UI
editing, as required by the Impeccable workflow.

## Content Ownership and Release Boundaries

- The live WordPress database body remains canonical.
- The candidate change is authored in
  `content/page-drafts/job-placement-digest.html`.
- `content/page-snapshots/job-placement-digest.html` remains unchanged until a
  separately authorized production publication is completed, exported, and
  proven equal to the live body.
- Applying the candidate to a local WordPress database is a separate guarded
  mutation against a matching `HPERKINS_WP_PATH` and `HPERKINS_ORIGIN`.
- Local verification, Git commit/push, theme deployment, production database
  publication, snapshot export, and public runtime verification remain
  separately reported gates.
- Approval of this design does not authorize deployment or production content
  writes.

## Verification

### Focused source and contract evidence

```powershell
node --test scripts/lib/job-placement-digest-source-contract.test.js scripts/lib/style-coverage.test.js
node scripts/verify-job-placement-digest-source.js
node scripts/verify-job-placement-pages.js --source-only --drafts
node scripts/verify-prominent-actions.js --source-only --drafts
```

The source contracts must be extended to assert event-first source order,
labelled-aside semantics, the H1 as the first heading, action order, approved
layout groupings, responsive declarations, and post-event removal safety.

### Rendered candidate evidence

With the reviewed draft applied only to the matching local site and
`HPERKINS_ORIGIN` set to that site:

```powershell
node scripts/verify-job-placement-pages.js --drafts
node scripts/verify-prominent-actions.js --drafts
```

Rendered checks must cover:

- opening reading order and first-viewport composition
- heading and landmark semantics
- keyboard order and visible focus
- evidence fragment scroll and focus behavior
- 44px targets and long action labels
- no horizontal page overflow
- proof-card, debugging-grid, evidence-row, and closing-zone adaptation
- 200% zoom and reduced motion

### Impeccable and repository closeout

Run the layout detector once after the UI is finished, resolve every unexplained
finding, and close with whitespace verification:

```powershell
node C:\Users\htper\.agents\skills\impeccable\scripts\detect.mjs --json --scope layout content/page-drafts/job-placement-digest.html assets/imladris-pages.css
git diff --check
```

Verification is bounded to one combined desktop/mobile inspection, one batch of
corrections, and at most one confirmation inspection.

## Acceptance Criteria

- WordCamp is the first content after the global header.
- The complete event invitation and its three actions are immediately
  discoverable.
- The event banner uses the approved two-column desktop and linear narrow
  topology.
- The Digest proposition remains the single H1 and first semantic heading.
- The event banner is a labelled complementary landmark.
- Event, hero, role argument, primary proof, reference, and close read as
  distinct movements.
- Every existing evidence row and factual claim remains present and visible.
- The page has no horizontal overflow at any verified width or at 200% zoom.
- Keyboard, visual, and assistive-technology order agree.
- Removing the event block leaves a complete, naturally spaced evergreen
  Digest.
- Candidate, snapshot, local runtime, Git, deployment, production publication,
  and public verification states remain distinct.

## Out of Scope

- Rewriting event, role, or evidence copy
- Changing contribution attribution or evidence state
- Adding WordCamp branding, logos, imagery, or animation
- Modifying the one-page resume, About page, navigation, footer, or global
  design tokens
- Collapsing or deleting evidence-register rows
- Editing the accepted snapshot before an authorized production publication
- Applying the candidate to production or deploying a theme release
