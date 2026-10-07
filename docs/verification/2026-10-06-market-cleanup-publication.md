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

- The initial cleanup passes **396/396** in the canonical 33-file Node
  inventory. The final download-link regressions extend this to **401/401**,
  without skips.
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
`2026-10-06T20:59:32` for the initial page-599 cleanup and
`2026-10-06T21:00:04` for page 433. A later hash-guarded section-3 update
adds the verified versioned XLSX download; its exact readback was promoted
at API timestamp `2026-10-06T21:08:45`. Final public ownership passes all
three pages.
Public ownership verification passes all three contracted pages, including
unchanged About:

| Page | Body SHA-256 |
| --- | --- |
| Archive 599 (final download link) | `719551293f93d541f4d328f90eaa2ca14e5b972e59c07f984e04c4fb81874941` |
| Digest 433 | `176490d3afb71996adcf14324e26f27c43c9d47203ef1a525365788a888b1b84` |
| About (unchanged) | `465cf02cd67ff172bf9211c5ab6cac8865f279235953b469ed53a8ca8a8b5f90` |

The no-flag artifact and recruiter source gates pass against the promoted
snapshots. Task-local backups, export comparisons and logs are under ignored
`output/market-cleanup-publication/` and `output/job-market-cleanup-2026-10-06/`;
the original 20-row validation/removal evidence remains unchanged in the
primary checkout's `output/job-market-validation-2026-10-06/`.

## Theme deployment and final public checks

The normal push to `main` published source/workbook commit
`f507c6717506e2f9f22a45d36409dd07275a36c2`; a fresh `git ls-remote` confirmed
that ref. WordPress.com's independent deployment serves the new workbook:
the public HTTP 200 response is 7,552 bytes and matches the committed XLSX
SHA-256 above exactly. The vendor dashboard's deployment-run SHA was not
observed; Git ref and actual public bytes are separate evidence.

The bare workbook URL continued serving the previous 8,746-byte edge-cached
copy during bounded checks. The archive therefore now links to
`/wp-content/themes/hperkins-tokens/assets/documents/wordpress-job-market-screen-live-states.xlsx?market-version=3a1f91995f5e`.
The content-derived key avoids the stale response and leaves WooCommerce's
`v` geolocation parameter available. Source contracts reject a stale key,
missing/duplicate download, alternate file or external-host substitution.
No caching, authentication or deployment configuration was changed.

Fresh actual public browser gates, with explicit
`HPERKINS_ORIGIN=https://hperkins.blog`, pass seven widths from 320–1440px:
34 keyword/ten market defaults, keyboard filtering/restoration, focus,
native disclosure, all five archive anchors, reduced motion, 200% text at
1024/320px, and all 44 JavaScript-disabled research rows. No runtime
exceptions were observed. SEO/share title, description, canonical and
Open Graph image pass.

After the download-link follow-up, a focused actual public check at
1440/390/320px confirms one visible native XLSX link, keyboard focus,
contained text, no document overflow, ten market rows, and a complete HTTP
GET of the page's actual link matching the cleaned workbook byte for byte.
The final no-flag artifact/source gates and public ownership readback pass.
The follow-up source/snapshot and this final evidence record are published
in a subsequent normal Git commit; the workbook bytes remain identical.

GitHub Actions Verify and Publish Website runs for the source commit did not
execute any steps. The Verify annotation says: "The job was not started
because your account is locked due to a billing issue." This does not negate
the independent WordPress.com file activation or manual public checks, and
neither establishes hosted CI success. The relevant Verify run is
https://github.com/henryperkins/hperkins-tokens/actions/runs/37560064800.

Earlier redesign evidence and the unrelated full-site header/About gate
limitations remain in `2026-10-06-placement-production-release.md`.
