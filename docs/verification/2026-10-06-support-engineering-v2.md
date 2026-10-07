# Support Engineering candidate verification — 6 October 2026

The later market availability cleanup is recorded in
`2026-10-06-market-cleanup-publication.md`. It supersedes the original
20-market-row / 54-total-row preview state documented below.

The Option A implementation is in the managed worktree
`C:\Users\htper\.codex\worktrees\support-engineering-v2\hperkins-tokens`,
based on `9f892761012a32bab4949a61a55623a097233cad`. The primary checkout,
accepted page snapshots and WordPress database bodies were left unchanged.
No commit, push, publication or deployment occurred.

## Reviewed result

- The stable Digest route holds the native Support Engineering draft with
  three equal examples, direct evidence links, Contact/PDF actions and a
  closed research summary.
- The supplied ZIP specified a 30rem column. Henry requested more width
  after viewing the preview; the candidate now uses 40rem (640px), with
  responsive gutters and space for desktop outdented numbers.
- The separate July archive retains all 34 keyword rows, 20 market records
  and five section anchors. Its table bodies match the accepted snapshot
  byte for byte; exactly five copy substitutions date and connect the archive.
- The method-to-Digest redirect is retired. Fragment navigation opens
  ancestor disclosures while a direct disclosure target stays closed.

Source provenance and publication sequencing are recorded in
[`../runbooks/2026-09-28-placement-consolidation.md`](../runbooks/2026-09-28-placement-consolidation.md)
and [`../design-system/INDEX.md`](../design-system/INDEX.md).

## Verification

- All **384** tests in the canonical 33-file source inventory passed with
  zero failures or skips. This includes historical dossier fixtures, both
  candidate contracts and the 14-test router suite.
- All **42** remaining tracked PHP files passed syntax checks.
- Candidate and accepted page source checks passed. Prominent-action source
  checks, header, typography, résumé-route and journal-template source
  checks passed.
- Performance assets, content ownership, Impeccable artifacts and CSS token
  resolution passed. Token checks covered all five authored sheets.
- The installed WordPress core block parser registered 113 core block types
  and validated all **177** draft blocks: 76 Digest blocks and 101 archive
  blocks, with zero invalid blocks.
- Rendered checks cover **1440, 1024, 782, 781, 600, 390 and 320px** for both
  routes: the 40rem measure, heading hierarchy, number placement, 15px
  metadata, 44px actions, keyboard/focus, archive filtering and links,
  disclosure behavior and horizontal overflow.
- Both routes passed 200% text checks at 1024px and 320px. Reduced-motion
  behavior and native fragment clearance without JavaScript were checked;
  all 54 archive rows remain readable with no generated filter controls.
- Independent diff and final CSS review found no actionable issues.
  `git diff --check` passed.

## Local evidence and preview limits

The preview uses the installed local WordPress **7.1.1-RC1** renderer,
the production theme header/footer and global styles, and unsaved candidate
posts. It is served on loopback at
[`http://127.0.0.1:60719/job-placement-digest/`](http://127.0.0.1:60719/job-placement-digest/)
and
[`http://127.0.0.1:60719/placement-method-and-evidence/`](http://127.0.0.1:60719/placement-method-and-evidence/).
Theme assets come from this worktree. Rendering skips plugins to keep the
standalone CLI boot within the local resource limit.

Local logs are retained under `.design-pull/support-engineering-v2/`:
`unit-tests.txt`, `block-validation.json` and `rendered-verification.txt`.
Fresh captures are under `output/support-engineering-v2/`, including
`native-top-1440.png`, `native-top-390.png` and the full Digest/archive captures.
These generated files are local evidence, not shipped theme assets.

Core block validation does not establish a saved editor round trip. The
preview does not prove the production plugin stack, full router integration,
external PDF/Contact/case-study availability or physical-device behavior.
Those remain publication checks in the runbook; production is unchanged.
