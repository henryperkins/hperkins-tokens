# Job-market availability cleanup — 6 October 2026

The user authorized removal of unavailable applications and extended that
cleanup to what is published on hperkins.blog. The previous action removed
ten rows from the Google Sheet only. This follow-up synchronizes the archive,
its downloadable XLSX and the Support Engineering page's archive reference.

## Availability and data integrity

The ten confirmed unavailable original listings are VIP Support Engineer,
VIP Customer Success Engineer, Kinsta Support Engineer, Alley Software
Developer, Pressable Technical Support Engineer, VIP Solutions Engineer,
Pressable Technical Support Team Lead, NBCUniversal News Software Engineer,
Multidots Sr. WordPress Engineer (the original `-4/` URL), and rtCamp
Technical Support Engineer. Employer/ATS responses showed removed listings,
404s or, for NBCUniversal, an explicit expiration. Similar replacement jobs
were not substituted for the original requisitions.

The remaining ten records comprise two current named applications (Newspack
and Syde), three future talent pools (Fueled, XWP and Human Made), and five
original identities whose availability cannot be resolved from the missing
posting URLs. Syde's current role does not prove continuity with its July
requisition. Current availability, role fit and candidate qualification are
separate findings. The archive explicitly qualifies its unchanged July
status/date/verdict cells as historical observations.

The Sheet is `1Nwxt-g5fMPkzbNaBPD7GPuvzsP4DoWFxoFkTyre7XLg`, tab
`Live States` (`727626174`). Removed original worksheet rows were
2, 3, 5, 6, 11, 12, 17, 18, 20 and 21. Retained original rows were
4, 7, 8, 9, 10, 13, 14, 15, 16 and 19, in that order.

The native XLSX export matches all 77 retained cells, including the header,
after normal Excel date normalization. It has one visible sheet, seven
columns, ten data rows and a frozen header. No formulas, hidden records,
private application data or removed URLs remain in the export package.
The hidden `_FilterDatabase` defined name is normal autofilter metadata for
`A1:G11`, not a hidden sheet or record. XLSX SHA-256:
`3a1f91995f5ecd98d6ea0389c4d3fae0c68d3636dfbe42df4c8e15b3a6f03c6e`.

Retained archive rows preserve exact row HTML and workbook values. All 34
keyword terms and five original anchors remain. Date counts now derive from
the ten retained rows: July 20 = 4, July 18 = 4, unrecorded = 2. Two retained
rows failed the historical manual screen, including the overturned AI pass.
The full July screen originally contained three manual failures and 20 jobs.

## Candidate verification

- The canonical 33-file Node inventory passes **396/396**, without skips.
- All **42** tracked PHP files pass syntax checks. All 14 source-job gates
  pass; candidate-aware gates use `--drafts` before snapshot promotion.
- The unsaved native WordPress preview passes seven widths from 320–1440px,
  filtering, focus/keyboard navigation, reduced motion, 200% text and all
  **44** research rows without JavaScript (34 terms and ten market records).
- Core Gutenberg parsing reports 76 Digest blocks and 102 archive blocks,
  with zero invalid blocks against 113 registered core types. This is a
  parse/serialization check, not a fresh full-plugin saved-editor round trip.
- Independent review confirms Sheet/XLSX/archive parity and rejects removed
  identities, altered URLs, reordering, private notes, changed historical
  cells, lost anchors and unrelated layout edits through focused regressions.

## Database publication

Fresh authenticated reads confirmed site **253647414**, hperkins.blog,
published pages **599** and **433**, and exact accepted-snapshot parity.
Hash-guarded `page-sections.update` replaced only archive sections 0, 3 and 4
and the Digest's root group (whose sole content change is its research
paragraph). Title, slug, status, metadata, navigation and other pages were
preserved. The API returned no content warnings.

Fresh edit-context readbacks match the reviewed drafts exactly after the
repository's line-ending/trailing-whitespace normalization. Snapshots were
promoted only after these comparisons. The API modification timestamps are
`2026-10-06T20:59:32` for page 599 and `2026-10-06T21:00:04` for page 433.
Public ownership verification passes all three contracted pages, including
unchanged About:

| Page | Body SHA-256 |
| --- | --- |
| Archive 599 | `a1390ec209325634dc8a648771831f6b22d0b22ef6fbdf2bf2a4d9bd590309a4` |
| Digest 433 | `176490d3afb71996adcf14324e26f27c43c9d47203ef1a525365788a888b1b84` |
| About (unchanged) | `465cf02cd67ff172bf9211c5ab6cac8865f279235953b469ed53a8ca8a8b5f90` |

The no-flag artifact and recruiter source gates pass against the promoted
snapshots. Task-local backups, export comparisons and logs are under ignored
`output/market-cleanup-publication/` and `output/job-market-cleanup-2026-10-06/`;
the original 20-row validation/removal evidence remains unchanged in the
primary checkout's `output/job-market-validation-2026-10-06/`.

## Theme deployment and final public checks

The workbook theme deployment and public browser verification are pending.
This record will be updated after checking the actual public file bytes and
page behavior. Earlier redesign evidence and unrelated production-gate
limitations remain in `2026-10-06-placement-production-release.md`.
