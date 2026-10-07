# Requested blog market-row removal — 6 October 2026

The user requested removal of WP Engine from the blog. This follow-up removes
the Technical Support L1 / WP Engine record from the published archive and
its theme-owned XLSX, and updates the Support Engineering page's archive
reference. It is a requested selection change, not an eleventh confirmed
unavailable application. The preceding ten unavailable findings remain true.
The Google Sheet is outside this blog-only request and remains unchanged.

## Reviewed candidate

The archive retains nine records: two named applications, three future talent
pools and four unresolved original listings. Each retained row's HTML and
historical workbook values exactly match the preceding ten-record selection.
All 34 keyword terms and five anchors remain intact. The historical date
distribution is July 20 = 3, July 18 = 4, not recorded = 2; historical filters
contain four Live, two needs-check, one historical and two failed rows.
Current availability, role fit and candidate qualification remain separate.

The workbook has one visible Live States sheet, seven columns, nine data rows,
a frozen header and the autofilter range A1:G10. Its 70 cells preserve all
retained values, including the header. The removed record and its unused
shared strings are absent from every ZIP member. The workbook is 6,960 bytes;
SHA-256: `93297bf33d5d144c412ce1672169f203fec67a4208f76f20a52dc1fd33e3ef3b`.
The final published link uses the complete SHA-256 as its `market-version`
value, derived from those bytes.

Independent read-only review confirmed retained row, keyword and XLSX parity.
Native core Gutenberg parsing validated 76 Digest blocks and 102 archive
blocks against 113 registered types, with zero invalid blocks. This does not
claim a new full-plugin saved-editor round trip.

## Publication evidence

The canonical 33-file Node inventory passed 404/404 tests with no skips.
All 14 source gates and all 42 tracked PHP syntax checks passed. The native
preview passed seven widths from 320–1440px, filtering, keyboard/focus,
anchors, reduced motion, 200% text and all 43 research rows without JavaScript.

Fresh authenticated reads confirmed accepted-snapshot parity on site
253647414 before writing. Hash-guarded section updates replaced archive
sections 0, 3 and 4 and the Digest root group. The only Digest copy change is
its archive-reference paragraph. The API returned no content warnings.
Fresh edit-context readbacks exactly match the reviewed drafts after normal
line-ending/trailing-whitespace normalization. Title, slug, status, link and
template remain unchanged. Accepted snapshots were promoted only after
these comparisons. Final API modification timestamps are
`2026-10-06T22:10:03` (initial archive599) and `2026-10-06T22:10:16` (Digest433).
The subsequent download-key-only archive readback at
`2026-10-06T22:16:27` again matches the draft exactly before snapshot promotion.

| Page | Body SHA-256 |
| --- | --- |
| Archive599 (final full-SHA download key) | `d7d1538f7004d399d85ed6ebcb44a83a48ffa0f4b2010b8f785dde3277792f1e` |
| Digest433 | `44ee02f2dbee46ff31884c529e7fe20e2aa4ce5e7e2d9aafd57f62608489116f` |

The actual public pages also pass the seven-width matrix, filters, keyboard
and focus, all five archive anchors, reduced motion, 200% text and all 43
JavaScript-disabled research rows. Public ownership confirms the two hashes
above and the unchanged About hash
`465cf02cd67ff172bf9211c5ab6cac8865f279235953b469ed53a8ca8a8b5f90`.
The promoted 33-file inventory passes 404/404 again; no-flag source and
artifact checks pass against the accepted snapshots.

## Workbook activation and cache correction

The normal push published commit
`1ad720b967e3e406b834ac3829686acff75b72f5` to `main`, confirmed by a fresh
`git ls-remote`. WordPress.com's independent deployment activated the new
workbook. A GET made before that activation cached the preceding ten-row
workbook at the initial 12-character query key. After activation, a complete
HTTP 200 GET using the full SHA query returns exactly 6,960 bytes matching
the committed workbook. The published link and verifier now require that
verified full query. No cache configuration, authentication or infrastructure
was changed. Older URLs can retain cached downloads; the current published
link is the file checked here.

Fresh GitHub Actions runs for that source commit executed no steps because
the account is locked by a billing issue. This is separate from observed
WordPress.com file activation and manual public checks; hosted CI success is
not claimed. Verify run:
https://github.com/henryperkins/hperkins-tokens/actions/runs/37565687998.
The earlier full-site header/About limitations remain recorded in
`2026-10-06-placement-production-release.md` and were outside this row removal.

Task-local backups and verification logs are retained under ignored
`output/wp-engine-removal/`.

After the full-key correction, all 406 tests in the canonical 33-file
inventory pass without skips, and the no-flag artifact and source gates pass.
Focused actual public checks at 1440/390/320px confirm one visible native
download link, keyboard focus, contained text, no page overflow and nine
market rows. Complete GETs of the page's actual link at all three widths
return HTTP 200, 6,960 bytes and the exact workbook SHA-256 above. The final
public ownership check confirms both accepted bodies and unchanged About.
The final follow-up commit publishes this evidence, full-key source guards
and the matching snapshots; it does not change the workbook bytes.
