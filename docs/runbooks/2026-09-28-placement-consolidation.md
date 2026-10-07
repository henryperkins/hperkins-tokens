# Support Engineering and the dated placement archive

The 6 October 2026 Imladris handoff replaces the September consolidated
candidate. Henry selected **Option A**: keep the full July research at
`/placement-method-and-evidence/`, with a closed summary linking to it from
the Support Engineering page at the stable `/job-placement-digest/` route.

## Candidate composition

`content/page-drafts/job-placement-digest.html` uses native blocks, a centred
40rem reading column, the production header/footer, existing fonts and tokens,
three equal numbered examples, a jump list, two Contact/résumé action pairs,
and a closed native research disclosure. Roles, status words and artifact
links separate attribution from release state. The general Support Engineer
positioning follows the reviewed handoff.

The supplied handoff specified 30rem. After viewing the local candidate,
Henry requested a wider content column on 6 October; the implementation uses
40rem (640px) with 64px desktop gutters to keep the outdented numbers inside
the viewport. Narrow screens retain responsive gutters.

`content/page-drafts/placement-method-evidence.html` is a guarded archive
candidate based on the accepted method snapshot. Its H1 remains Placement
Method and Evidence. Five copy edits date the archive and point back to Support
Engineering. Existing tables, anchors and filters remain intact. The keyword
ledger starts on **all 34 terms**. After the separately authorized 6 October
availability cleanup, the market screen retains 10 posting records: two
current named applications, three future talent pools and five unresolved
original listings. The ten confirmed unavailable listings are removed from
the Sheet, website and downloadable workbook. July state labels remain
historical observations, qualified by the October validation note.

The ZIP's HTML previews and DC templates are design references. Their runtime,
design-system bundle, stand-in shell and exploration controls do not ship.
Page styling lives in `assets/imladris-pages.css`.

## Evidence checked on 6 October 2026

- [PR #757](https://github.com/WordPress/ai/pull/757) remains open and unmerged,
  authored by Anubhav Anand. The anonymous GitHub API reported head
  `92ddff8b548b3dfc6099e146994bbe6cceed162f` and last update
  `2026-09-17T17:48:10Z`. This rechecks publication state, not the latest code.
  Henry's [integration test comment](https://github.com/WordPress/ai/pull/757#issuecomment-4980297831)
  records restored successes, duplicate successes with the provider bridge,
  and missing failures. The candidate qualifies this as the version tested.
- Existing evidence retained from the 28 September review: maintainer PR #593
  resolved Henry's issue #529 and shipped in WordPress AI 1.0.1; Henry's
  eight-file documentation PR #501 was merged and credited in the 1.0.0
  release notes; Provider v2.1 is a stable release describing a local sidecar
  and ChatGPT-managed authentication. Recheck release claims and the single
  States checked dateline on publication day.

## Research and old links

The method page stays reachable. The Digest disclosure links to the archive
and contains the short Q1/Q2/Q3 summary, not a second copy of the research
tables. These five original archive targets remain:

- `resume-keyword-bank`
- `what-i-optimize-for`
- `screening-funnel`
- `live-states`
- `delisted-and-overturned`

The method-to-Digest redirect and its PHP verifier are retired. A published
`.hp-placement-brief` body must never redirect the archive back to its own
referring page. `router-scroll.js` retains generic fragment/disclosure support.

## Candidate verification

The old dossier remains a dated fixture at
`scripts/fixtures/placement-dossier-2026-08.html`; its mutation tests still run.
Phase-aware brief checks cover both reviewed drafts. Accepted-source checks
continue to read published mirrors.

```powershell
node --test scripts/lib/placement-brief-contract.test.js scripts/lib/job-placement-digest-source-contract.test.js scripts/lib/page-phase-contract.test.js
node scripts/verify-job-placement-digest-source.js
node scripts/verify-job-placement-pages.js --source-only --drafts
node scripts/verify-prominent-actions.js --source-only --drafts
# Point HPERKINS_ORIGIN at the unsaved candidate preview:
node scripts/verify-job-placement-pages.js --drafts
```

Rendered checks cover 320–1440px, the 40rem measure, heading outline, three
stacked examples and their 782px outdent, jumps, 15px facts/chips/evidence links,
44px controls, keyboard/focus, reduced motion, 200% text, closed disclosure,
and all 44 retained archive rows with and without JavaScript. The original
20-market-row / 54-total-row preview results are
recorded in `docs/verification/2026-10-06-support-engineering-v2.md`.

## Publication boundary

Implementation does not promote database bodies or accepted snapshots.
Publication is a separate explicitly approved step. Apply only the two
reviewed bodies, read each back and prove equality before promoting its
snapshot. Deploy redirect retirement with Option A; preserve the method route
and old section links. Navigation labels and SEO records need a deliberate
publication decision if they become Support Engineering; menu 237 uses the
hash-guarded flow.

After publication, recheck the canonical route, archive/back links, PDF,
Contact, case study, all five old section links and the full WordPress router.
Run public ownership, typography, metadata and selected-page gates. Local
preview proof does not establish production behavior.
