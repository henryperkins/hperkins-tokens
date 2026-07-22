# Job Placement Digest integrity correction — design

**Date:** 21 July 2026  
**Branch:** `fix/job-placement-digest-integrity`

## Outcome

The public Job Placement Digest will make one recruiter-facing argument: Henry
wants Support Engineer work now and has inspectable evidence that he can
diagnose, explain, and prevent WordPress failures. Research detail will live on
a separate Placement Method and Evidence appendix. Private application
operations will remain outside the public site and public workbook.

## Source ownership

- The WordPress database body is canonical for visitor-facing page content.
- `content/page-snapshots/job-placement-digest.html` is a verified mirror of
  page 433, exported only after the deployed body is reviewed.
- The new appendix follows the same database-body-plus-snapshot contract.
- `patterns/job-placement-digest.php` is retired; it will not become a third
  copy of the full page.
- Draft bodies may be reviewed in the repository before publication, but a
  draft is not a canonical page or a deployable snapshot.

## Page structure

### Main digest

The first viewport contains the sole H1, current Support Engineer positioning,
two neutral direction chips, separate published and verified dates, and four
actions. The body then presents, in order:

1. Why Support Engineer now.
2. A six-row fit ledger with an explicit enterprise-scale gap.
3. Three primary proof cards.
4. The production focus-ring incident.
5. A narrowly scoped token-governance claim.
6. A compact evidence ledger.
7. A link to the research appendix.
8. The composed closing action panel.

### Placement Method and Evidence

The appendix contains the complete 34-term keyword ledger, taxonomy,
screening rules and denominator, reconciled market-state table, delisted rows,
overturned decisions, anonymized false-pass account, and public-sheet link. It
uses one H1, sequential headings, a meaningful `resume-keyword-bank` fragment
target, three styled disclosure rows, numbered rules, and a dated research
note.

## Artifact model

- The primary public résumé is the supplied one-page Support Engineer PDF.
- The supplied DOCX remains the editable source; the PDF is the recruiter CTA.
- The public workbook exposes only the approved seven columns.
- The private operations workbook is never committed or published.
- Evidence links use immutable commits, tags, releases, PRs, or issues when the
  source supports that. Mutable records are explicitly dated.
- Flavor Agent is described as having published RC1–RC3 prereleases and no
  final stable v0.1.0 release.

## Component and accessibility model

Existing theme primitives remain the foundation. Digest-specific CSS will
differentiate proof cards, incident cards, ledgers, research notes, numbered
rules, disclosures, and responsive tables. Status chips and neutral category
chips have separate visual semantics. Disclosure summaries are full-width
44px targets with a count, marker, hover state, cursor, and focus ring. Long
artifact labels wrap. The mobile drawer's visible trigger reaches 44px and its
functional label uses the established functional-text token.

The page keeps one H1 and a sequential H2/H3 hierarchy. Existing Council
header behavior—`aria-controls`, `aria-expanded`, Escape, Arrow Down, focus
restoration, current-page state, reduced motion, and decorative icon hiding—is
preserved and regression-checked.

## Verification model

Source verification checks the body contracts before publication. Rendered
verification checks the real site at 1440, 1024, 768, 390, and 320 CSS pixels,
plus keyboard and reduced-motion behavior. Deployment verification compares
the normalized canonical database body with the committed snapshot and prints
both SHA-256 hashes plus a useful diff on failure.

The GitHub source workflow cannot truthfully compare a private WordPress
database unless deployment credentials are provided. The repository will keep
the production verifier as an explicit release/deployment gate and will not
substitute a disposable database that never held the page under test.

## Publication boundary

Local and GitHub repository changes can be prepared and verified without a
WordPress write. Immediately before creating the appendix, uploading media, or
updating page 433 and its SEO metadata, the exact payload and affected records
must be presented for confirmation. The live body is exported to the snapshot
only after the production render is accepted.

