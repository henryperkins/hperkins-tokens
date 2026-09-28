# Consolidated placement brief candidate

The selected option 3 becomes the candidate body at
`content/page-drafts/job-placement-digest.html`. Keep `/job-placement-digest/`
as the canonical route. The hero names Support Engineer work, offers the
résumé PDF, and dates the former Happiness Engineer role to 2012. Selected work
contains one featured investigation and two supporting H3 items. Prose is
limited to 36rem; the existing four fonts, header, and footer remain in use.

## Evidence checked on 28 September 2026

- [PR #757](https://github.com/WordPress/ai/pull/757) is open and unmerged;
  Anubhav Anand authored it. Henry's
  [integration test comment](https://github.com/WordPress/ai/pull/757#issuecomment-4980297831)
  records restored success rows, duplicate successes with the provider bridge,
  and absent failure events. This describes that test, not a new test of the
  latest PR head or a live authenticated Codex account.
- [Issue #529](https://github.com/WordPress/ai/issues/529) was resolved by the
  maintainer-authored [PR #593](https://github.com/WordPress/ai/pull/593), credited
  in the [1.0.1 release](https://github.com/WordPress/ai/releases/tag/1.0.1).
- Henry authored [PR #501](https://github.com/WordPress/ai/pull/501); it changed
  eight files, was merged, and appears in the
  [1.0.0 release notes](https://github.com/WordPress/ai/releases/tag/1.0.0).
- [Provider v2.1](https://github.com/henryperkins/ai-provider-for-codex/releases/tag/v2.1)
  is a published stable release. Its README describes a local sidecar and
  ChatGPT-managed authentication. The page also links the theme source and
  `/how-this-was-built/`.

## Research and old links

The native “Placement research, July 2026” disclosure retains all 34 keyword
rows, all 20 market rows, and the screening rationale. Its dated archive notice
does not recertify old vacancies. Filter controls, numbered spines, and status
tiles are removed. These method-page anchors retain their identities:

- `resume-keyword-bank`
- `what-i-optimize-for`
- `screening-funnel`
- `live-states`
- `delisted-and-overturned`

`inc/placement-route.php` redirects the two method-route spellings with a 301
only after the Digest's actual published body contains the combined-page class.
The target has no fragment, allowing a browser to carry the incoming fragment.
`router-scroll.js` opens ancestor disclosures for initial loads, fragment
changes, router pushes, history traversal, and repeat clicks on the same hash.

## Candidate verification

The old dossier remains an explicitly dated test fixture at
`scripts/fixtures/placement-dossier-2026-08.html`; its mutation tests still run.
New candidate and redirect tests are in the canonical unit-test inventory and
CI. Source checks dispatch according to the selected page phase.

```powershell
node scripts/verify-job-placement-digest-source.js
node scripts/verify-job-placement-pages.js --source-only --drafts
node scripts/verify-prominent-actions.js --source-only --drafts
php scripts/verify-placement-route.php
# Point HPERKINS_ORIGIN at the rendered candidate before this command:
node scripts/verify-job-placement-pages.js --drafts
```

The review preview uses an unsaved WordPress render with the public header,
footer, and global-style shell, plus this worktree's CSS and controllers. It is
not a saved local page. The preview's redirect is an equivalent HTTP fixture;
PHP tests separately exercise the actual redirect's request and publication
guard. Verify the complete WordPress router and production redirects after
publication. The design detector's remaining findings refer to existing CSS
outside this candidate, plus an unstyled standalone-HTML color advisory; the
rendered candidate uses the theme palette.

## Publication boundary

No database body, accepted snapshot, primary checkout, or production route is
changed by this candidate. Publish only after explicit publication approval.
Deploy the theme change and apply only the reviewed Digest body; freshly read
the published body and prove equality before promoting its snapshot. The
method redirect then activates. Retain the old method body for recovery rather
than deleting it. Recheck the canonical route, PDF, contact, case study, old
section links, and the full router in production. Run the public ownership,
typography, and selected-page gates against the published result; the local
preview does not establish those production results.
