# Digest and one-page résumé production release — 6 October 2026

The later market availability cleanup is recorded in
`2026-10-06-market-cleanup-publication.md`. It supersedes this release's
20-market-row / 54-total-row retention state; the original evidence below
describes the redesign as first published.

The user explicitly authorized publication of both redesigns. The release
includes the Support Engineering body at the stable Digest route, the dated
July method/evidence archive, and the editable résumé source and final PDF.

## Pre-publication verification

- The canonical 33-file Node inventory passed **387/387** tests before the
  release. The final public-verifier correction adds one regression; the
  complete inventory now passes **388/388**, with no skips.
- All **42** remaining tracked PHP files pass syntax checks. The complete
  source job's artifact, header, typography, journal, performance, recruiter,
  About, AI Enablement, action, route, ownership and design gates pass.
- The candidate Digest/archive pass seven widths from 320–1440px, keyboard
  navigation, reduced motion, 200% text and complete no-JS archive content.
- The production action verifier now derives the brief's open rail/panel
  presentation from the selected body. Legacy decorated-page checks remain.
- Résumé Letter/A4, text/link/tag parity and six embedded theme faces pass;
  21 Python regression tests pass. The only link change points the client
  label to its maintained case study. All 15 résumé HTTPS destinations and
  all 14 Digest external destinations pass completed HTTP checks.
- Anonymous GitHub API reads confirm the contribution states and published
  releases on the 6 October dateline.

## Production baseline reconciliation

Fresh edit-context reads confirmed published Digest page **433** and method
page **599**, their exact stable slugs and current modification timestamps.
The reads differ from the old tracked mirrors. The Digest differences are
editor attribute ordering and layout attributes. The method differences are
editor serialization and the absence of the historical
`delisted-and-overturned` section. Both research tables on each page are
semantically identical to the accepted mirrors after inter-element whitespace
normalization. The reviewed Option A body restores all five archive anchors
and preserves all 34 keyword terms and 20 market records.

The fresh production bodies were backed up in ignored task-local storage.
A second edit-context read before publication confirmed no intervening change.
The approved full-page rewrites supersede this reconciled baseline. Only the
two page bodies and the Digest's validated SEO/share title and description
are in scope; page status, slugs, WordPress page titles and navigation remain.

## Publication and live verification

Both database bodies were published through the authenticated WordPress.com
connector for site **253647414**, `hperkins.blog`, on its existing Atomic
hosting. Separate fresh edit-context reads matched the reviewed drafts
exactly after the repository's LF/BOM/trailing-whitespace normalization.
Snapshots were promoted only after these readbacks. Digest page 433 was
modified at `2026-10-06T20:10:17`; archive page 599 at
`2026-10-06T20:10:27`, as reported by the API.

Only the two `content.raw` fields and the Digest's existing contracted
`jetpack_seo_html_title` and `advanced_seo_description` fields were written.
The SEO title is **Job Placement Digest — Henry Perkins | WordPress Support
and Solutions Engineering**. The description is **Henry Perkins’s
evidence-backed case for enterprise WordPress support and solutions
engineering, with shipped work, verified contribution records, résumé
evidence, and a dated market screen.** Slugs, page titles, publication status
and menu data were retained.

The source/artifact release is **0.3.73**, commit
`e68123e10e7a1ccedb552ddb5a402819f583c72b`. Its normal push to `main`
succeeded, and a fresh `git ls-remote` confirmed that SHA. WordPress.com's
independent deployment then activated the new assets. The following public
responses match that commit's Git blobs byte for byte:

| File | SHA-256 |
| --- | --- |
| `style.css` | `8e7c2ed5b6532f539277b52be1b7a97acf649340cbee1bdc3aa6966190979f85` |
| `assets/imladris-pages.css` | `192b183838f1c1e0f34073c324b2ba812ee5570e88307967dabda5273f164807` |
| `assets/js/digest-register-filter.js` | `6952409234219ea18d238a56ae673dcb148701bf5f0a3390f791aa361224967a` |
| `assets/js/router-scroll.js` | `3957db23de2fbd5487106803468e0297644102e2972bd2e551aae104f45eedf7` |
| `assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf` | `6f65e5643677c1d2386937f901968fbef3778b54710403a3b3cc773567985706` |
| `assets/documents/henry-perkins-wordpress-support-engineer-resume.docx` | `bf20570dd4a3efc9501627a3bb1f7cfb7a1392c81ece4cfbcce839a2236a4b68` |

The vendor dashboard's deployment-run SHA was not available without a new
login; the proof is the independently confirmed Git ref and these exact
public file hashes. Authentication and deployment settings were not changed.
The later verifier/report follow-up changes no deployed page body or client
asset.

Fresh public checks completed successfully with
`HPERKINS_ORIGIN=https://hperkins.blog`:

- `node scripts/verify-deployed-content-ownership.js`: all three bodies,
  including unchanged About, match accepted snapshots. Digest body SHA-256
  is `77673cb951e964b2b7e218c61c04a489e4e668f0d2d17999dda8a3c741044705`;
  archive is `fd69dfddb096a7d9bbdffa584c2667154d5e534e198f0bc0e5f375997c1d1390`.
- `node scripts/verify-job-placement-digest-metadata.js`: exact title,
  description, canonical URL and Open Graph title/description/image pass.
- `node scripts/verify-resume-route.js`: strict public GET and HEAD checks
  reach the new one-page PDF through `/one-page-resume/`.
- `node scripts/verify-placement-artifacts.js --check-links`: the completed
  fresh pass checks all 15 HTTPS destinations and the mailto action. The
  maintained DJ Lee case study returns HTTP 200.
- `node scripts/verify-job-placement-pages.js`: 1440, 1024, 782, 781, 600,
  390 and 320px; 40rem prose, hierarchy, numbered examples, 15px metadata,
  44px targets, keyboard/focus, native research disclosure, all archive
  anchors, filtering, reduced motion, 200% text and all 54 no-JS rows pass.
- The accepted Digest's exported prominent-action render helpers pass at
  1440, 390 and 320px, including focus, geometry and mobile stacking.
- `node scripts/verify-about-page-rendered.js`: its full five-width and
  boundary/navigation/no-JS contract passes on the unchanged public page.
- `node scripts/verify-typography.js`: all 14 discovered routes pass the
  eight-width matrix; complete text/heading audits run at 1440 and 390px,
  with overflow checks at the remaining six widths.

WooCommerce appends a geolocation query such as `?v=0b3b97fa6688` to internal
action links after loading. The rendered page verifier previously used exact
raw href selectors and stopped at 1024px. Its correction resolves each URL
and requires the exact same origin, pathname and intended fragment, while
permitting that query. It requires exactly one matching action. Regression
tests reject foreign origins, wrong paths and unexpected fragments. The
full public matrix above passed after this correction; no page body or
production configuration was changed to satisfy it.

Public navigation uses native document loads: the full-page Interactivity
router module and router body region are absent. Actual-config route,
Back/Forward, two filter mounts, complete 34/20 rows, a single header,
disclosure state, direct fragment focus and header clearance pass with zero
runtime exceptions. This establishes ordinary public navigation, not
production client-side router swaps.

Local full-plugin editor acceptance independently verifies 76 Digest blocks
and 101 archive blocks against 403 registered block types, zero invalid
blocks before/after saving, and exact saved/reloaded serialization and REST
readbacks. A temporary local request filter enabled the full-page router
without changing site options; local swap/Back/Forward/remount/focus checks
pass. Two local Jetpack Boost generated script URLs returned HTML and caused
syntax errors outside the candidate assets. The temporary filter and local
authentication were removed, the original theme junction restored, and
Studio stopped. This local router result is separate from the actual public
navigation mode above.

Task-local logs and captures are under
`output/production-release-0.3.73/`; deployment hashes and baseline backups
under `.design-pull/publication-2026-10-06/`; editor/router evidence under
`.design-pull/support-engineering-v2/`. Generated evidence and the primary
checkout's unrelated untracked files are excluded from commits.

## Remaining limits

The redesigns are published and their specific live checks pass. The overall
site production gate is **not fully green**:

- GitHub Actions Verify and Publish Website runs did not execute any steps.
  Their annotation says the account is locked due to a billing issue. Manual
  local/public passes and independent WordPress.com asset activation are
  recorded separately; they do not establish hosted CI success. Local Node
  24 checks do not establish the workflow's normative Linux/Node 22 result.
- `verify-header.js` stops at the public header's `data-hp-header-source="fallback"`
  assertion because menu 237 does not satisfy its navigation-model contract.
  The fallback exposes the expected Work, Writing, About and Digest routes,
  but the full header interaction matrix was not reached. Header/menu source
  and menu data were not changed by this release.
- The full `verify-prominent-actions.js` stops on About at 390px. Its gold
  border expectation conflicts with the already-approved mobile rule at
  `assets/imladris-pages.css` that removes contact-panel border/background/
  shadow. That rule predates this release. The dedicated public About and
  selected Digest action checks pass. No About styling or assertion was
  weakened as part of publication.
- The résumé was inspected in native Word export and color/grayscale/A4
  renders, with exact text/link/tag/font parity. Physical printing and other
  office renderers were not tested.

The earlier Support Engineering and résumé refinement reports describe
pre-publication captures. This record supplies their completed database,
Git, deployment and public-verification outcomes.
