# Placement Method and Evidence Redesign Design

**Date:** 2026-08-16

**Status:** Approved by the user on 2026-08-16. **Supersedes** the appendix
retention requirements in
`docs/plans/2026-07-21-job-placement-digest-integrity-design.md` — see
"What this retires" below.

## Source

The appendix was re-derived from the Imladris Design System project's
`templates/placement-method/PlacementMethod.dc.html`, the companion handoff to
`templates/digest/Digest.dc.html` that produced the Digest dossier on
2026-08-16. The two pages now share one visual language: numbered kickers, a
ledger that publishes complete and filters down, and a closing invitation on the
shared action panel.

The handoff is a *design reference*, not a source of data. Where its mock data
and the published workbook disagree, the workbook wins; every such case is
recorded under "Deliberate deviations".

## The move

The appendix used to state a fact and then state it again in a second
vocabulary. Standing was carried by *which of three disclosures a row sat in*,
and again by three differently worded boundary columns. Row state was carried by
a Current state column, a Screen verdict column, and a seven-row funnel table
that recounted both. The redesign says each fact once:

1. **One keyword ledger, 34 rows.** The three `<details>` disclosures are gone.
   Standing rides in the row header beside the keyword and is the only place it
   is written. A three-item definition list defines the standings once, before
   the ledger, and a filter narrows the ledger to one standing at a time.
2. **One State column.** `Current state` and `Screen verdict` are shown merged
   as `Live · Pass`, `Delisted · Pass — historical`, and so on.
3. **The denominator is the filter.** The "Screening denominator and funnel"
   section is deleted. Its six buckets are re-expressed as the market filter's
   four chip counts — All rows 20, Live passes 9, Historical 5, Needs a new
   check 3, Screened out 3 — which are *derived from the workbook and asserted*
   rather than typed.
4. **Section 04 is prose.** The two blockquotes, the three-item overturn list,
   and the three `<h3>`s condense into three paragraphs: the delistings, the
   overturn, and the corrective control.
5. **Four numbered kickers**, `01 · The vocabulary` through
   `04 · What I took back`, matching the Digest's spine.

## What this retires

`docs/plans/2026-07-21-job-placement-digest-integrity-design.md` required the
appendix to retain a screening denominator, three styled disclosure rows, and an
overturned-decisions section. The first two are retired here; the third is kept
in substance but condensed to prose. The integrity requirement underneath them —
that the appendix publish the whole screen, dated, with nothing hidden — is
unchanged and is now enforced by stronger checks than the ones it replaces:

- Every keyword row must carry a standing the filter can classify, and the three
  standings must total 10 / 11 / 13.
- Every market row's merged State cell must classify, and the four resulting
  group counts must equal the counts derived from the workbook's six funnel
  buckets. The exactly-one-bucket invariant on the workbook still runs.
- Both ledgers must render every row before any filtering
  (`ledger.rows === ledger.visibleRows` at load), on every viewport.

## Deliberate deviations from the handoff

Each of these is a case where the handoff and an existing contract disagreed and
the contract won.

1. **The six non-URL market fields reproduce the workbook verbatim.** The
   handoff shortens the reasoning strings, lowercases the verdicts, and adds
   editorial qualifier sub-lines ("overturned an AI pass", "needs a new check",
   "not screened"). The page's own published promise is that these fields are
   the workbook's displayed values, and `verifyAppendixWorkbookParity` compares
   them cell for cell. The rendered State cell is exactly
   `Current state · Screen verdict`.
2. **No `#note-nbcu` footnote.** The handoff moves NBCUniversal's comp and
   location detail into a note. That text is workbook column G for that row, so
   it stays in the cell.
3. **Empty cells stay empty in the source.** The handoff renders an em-dash "so
   an empty cell reads as a decision, not a gap". Ten workbook cells are
   genuinely empty; an authored em-dash would compare as `"—"` and read back as
   data. The dash is drawn by CSS on `td:empty::after` at ≥782px only, where
   there is a column header to be empty under.
4. **Standing is always visible.** The handoff shows the standing word only
   while the "All terms" filter is held. `DESIGN.md`'s ledger rule is that state
   never rests on colour alone, so the word is unconditional and the status rule
   colour is the redundant second signal.
5. **The type floor wins twice.** Section kickers are 12px (`--2-xs`), not the
   handoff's 11px — the same decision already recorded on `.hp-digest-kicker`.
   Ledger column headers stay at the 13px `xs` the ledger style already uses.
6. **The filter is the register's filter.** Chips are the injected
   `.hp-evidence-filter` component from `assets/js/digest-register-filter.js`,
   generalized from one ledger to three, rather than a second inline chip
   component. It defaults to "All", not to "Demonstrated": a ledger that opens
   filtered would publish less than it claims, and would also narrow what the
   rendered contracts measure.
7. **Q1/Q2/Q3 stay inside their headings.** The handoff pulls the numeral into
   its own column. It is kept in the `<h3>` so it reaches the accessible name,
   and placed in a grid column visually — the market screen links these exact
   strings, and a reader arriving from a failed row has to find the label they
   clicked.
8. **Section 03 is a wide plate, not a full-bleed band.** Same intent, without a
   full-bleed element to defend at 320px.
9. **No inline SVG in the closing panel.** `.hp-action-panel.is-closing` already
   paints the gradient and masks the gold emblem. A second glyph would be two
   glyphs, and would commit decoration into a database-owned page body.

## Interaction

`assets/js/digest-register-filter.js` becomes config-driven and drives three
ledgers: the Digest evidence register, the keyword ledger, and the market
screen. The properties that made it safe for one ledger are unchanged and now
hold per ledger:

- **It never hides evidence the page has not already published.** With no
  JavaScript no filter row is built and every row stays visible.
- **It fails closed.** If any row's classifying cell cannot be classified, that
  ledger declines to mount and renders exactly as it does without JS. A filter
  that is 33/34 correct is worse than no filter.
- **State is read from the row, not from a list in the script.** The keyword
  ledger classifies `th strong`; the market screen classifies the merged State
  cell. A copy edit cannot silently mis-file a row without failing the source
  contract, which holds the same token lists and asserts them against the
  script, in order.
- **It survives the Interactivity Router.** `pushState` stays wrapped, guarded
  against double-wrapping, and `mount()` is idempotent and re-attempted across
  the commit window.

Rows are hidden with the `hidden` attribute. `.wp-block-table.hp-keyword-table
tbody tr[hidden]` and its market twin carry the extra class because the ≤781px
stacked layout re-declares `tbody tr` as `display:block` and would otherwise beat
the UA sheet at equal specificity.

## Counts are claims

Deleting the funnel table removed the only place a derived number on this page
was checked against the workbook, and the first draft of the hero's scope chips
proved why that mattered: they read "20 market rows screened, every state dated"
while five workbook rows carry no Last checked value at all — contradicting the
page's own derived distribution paragraph, on the same screen. The corrective
control is the same one section 04 describes for the screen itself: a count has
to cite the evidence that produces it.

`verifyAppendixScopeChips()` now derives all three chips from the workbook and
the keyword ledger and compares them verbatim, alongside the existing
last-checked distribution. The filter's own status line carries no date claim
for the same reason.

## Phases

The appendix now has the same two phases as the Digest, and
`selectPlacementMethodSource()` selects between them. Source-side contracts that
compare the stylesheet against the page body read the candidate under
`--drafts`; without it they read the published mirror. Until the production body
is rewritten and `content/page-snapshots/placement-method-evidence.html` is
re-exported, the no-flag form of `verify-job-placement-pages.js` describes
production, not the candidate, and will disagree with the stylesheet. That is
the expected pre-promotion state.

**The stylesheet and the body must reach production together.** The theme
deploys independently of the database, and the stacked-ledger labels are the
seam: the published body still ships three keyword tables whose third columns
read "Evidence boundary", "Exact boundary" and "Current boundary", while the new
sheet declares one unscoped "Evidence boundary" label for all of them. Ship the
CSS first and, below 782px, two thirds of the published ledger announces the
wrong column name over the right value — on the one layout where the header row
is off screen to contradict it. Rewrite the production body, then deploy, then
export the snapshot.
