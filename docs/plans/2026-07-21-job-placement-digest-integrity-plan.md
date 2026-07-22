# Job Placement Digest integrity correction — implementation plan

> Execute on `fix/job-placement-digest-integrity`. Preserve the user-supplied
> ZIP as read-only input and never commit its private workbook.

## 1. Freeze and prove the baseline

- Record branch, commits, version, release, live/snapshot/pattern hashes,
  résumé identity, current project releases, sheet counts, and baseline
  screenshots in a dated diagnostic note.
- Keep the pre-correction page-433 export under `docs/diagnostics/`; do not use
  it as the new snapshot.
- Byte-compare public theme assets with the claimed deployed commit.

## 2. Add failing source contracts

- Add a digest/page-draft verifier covering the sole H1, sequential headings,
  required copy, proof-card count, meaningful keyword anchor, disclosure
  anatomy, evidence states, forbidden stale wording, placeholders, and retired
  full-page pattern.
- Extend page ownership contracts for the appendix snapshot.
- Add unit coverage for normalized hash/diff diagnostics before changing the
  ownership verifier.
- Run the new checks and preserve the expected failures.

## 3. Prepare recruiter and research artifacts

- Copy the supplied one-page résumé DOCX/PDF into a public-artifact source
  directory; do not copy the private workbook.
- Correct the DJ Lee routing sentence to describe configured wiring rather
  than independently verified delivery, then regenerate and reverify the PDF
  if the source changes.
- Retain the sanitized public workbook as a publishable artifact and record its
  seven-column, 20-row contract.
- Adapt the supplied main and appendix HTML drafts into reviewed repository
  drafts, replacing only claims that current primary-source checks disprove.
- Resolve all publish-time placeholders before any live write.

## 4. Implement stable theme components

- Add digest/method component styles in `assets/imladris-pages.css` using
  existing theme tokens.
- Separate neutral category chips from status chips.
- Style proof cards, incident card, compact ledgers, disclosures, numbered
  rules, dated research note, and responsive tables.
- Raise the visible mobile drawer trigger and functional label to the existing
  accessibility floors without changing the Council state machine.
- Retire `patterns/job-placement-digest.php` after confirming no documented or
  runtime dependency.
- Update ownership documentation so it names the database and snapshot only.

## 5. Verify the local/rendered implementation

- Run PHP lint, Node unit tests, source verifiers, content docs verification,
  version checks, and browser verifiers.
- Load reviewed drafts into the local WordPress database solely for render QA;
  capture 1440, 1024, 768, 390, and 320 widths.
- Perform heading-outline, overflow, link wrapping, disclosure, keyboard,
  focus, and reduced-motion checks.
- Visually inspect the résumé and programmatically confirm one page,
  searchable text, exact versions, and reachable links.

## 6. Prepare exact live-write payloads

- Determine final public résumé media filename/URL.
- Determine the sanitized public-sheet URL or document the external publishing
  dependency if no authorized Google write surface exists.
- Prepare the appendix title, slug, status, body, excerpt, and SEO fields.
- Prepare page 433's body, excerpt, SEO title, SEO description, canonical and
  social metadata that the available WordPress surface can safely set.
- Present exact records, URLs, hashes, and material diffs for immediate
  confirmation before writes.

## 7. Publish and restore source integrity

- Upload/replace the public résumé and publish the sanitized market sheet.
- Create and review the appendix, then apply the final body and metadata to
  page 433.
- Review the uncached public render and every public link.
- Export the accepted database bodies to their snapshots.
- Run production content ownership and require identical normalized hashes.

## 8. Release and close out

- Bump the theme version because component CSS and verification contracts
  changed; align `style.css`, `readme.txt`, changelog, README, evidence ledger,
  release tag, and deployed identity.
- Run all source, browser, content, résumé, accessibility, SEO, cache, and
  viewport gates on the exact release commit.
- Commit only intended files, push the branch, open the pull request, and
  publish/merge/deploy only when the five user-specified launch gates pass.
- Record release version, deployed commit, verification date, snapshot hash,
  résumé checksum, and ownership result.

