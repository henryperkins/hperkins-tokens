# WordCamp US 2026 Production Proof

**Site:** `https://hperkins.blog` (WordPress.com site `253647414`)

**Publication completed:** 12 Aug 2026 at 13:03:47.955 America/Chicago

**Scope:** Production Pages 433 and 6 were published from their reviewed WCUS candidates. The custom footer changed only its résumé href from the old Media Library URL to `/one-page-resume/`. Titles, slugs, publish status, all other footer markup, and the old media file were preserved.

## Theme deployment and route readiness

- WCUS theme/PDF merge: [`c060458356e6745943416e80707c7e93b524ef4c`](https://github.com/henryperkins/hperkins-tokens/commit/c060458356e6745943416e80707c7e93b524ef4c), merged through [PR #22](https://github.com/henryperkins/hperkins-tokens/pull/22) at `2026-08-11T14:33:35Z` and published by [Actions run 31502193428](https://github.com/henryperkins/hperkins-tokens/actions/runs/31502193428).
- First successful strict public GET/HEAD route probe after that deployment: `2026-08-11T09:37:20.941` America/Chicago (`2026-08-11T14:37:20.941Z`).
- Post-merge contract hardening: [`cb7077638aac063133e23a1c6348c55e8d9ceaa4`](https://github.com/henryperkins/hperkins-tokens/commit/cb7077638aac063133e23a1c6348c55e8d9ceaa4), merged through [PR #23](https://github.com/henryperkins/hperkins-tokens/pull/23) at `2026-08-11T21:10:22Z` and published by [Actions run 31536613514](https://github.com/henryperkins/hperkins-tokens/actions/runs/31536613514).
- Deployed theme version: `0.3.58`.

The theme deployment did not publish either database-owned page body or the custom footer override. Those separately authorized writes occurred on 12 Aug.

## Guarded production publication

| Surface | Preserved identity | Production time | Normalized SHA-256 | Equality proof |
|---|---|---:|---|---|
| Job Placement Digest | Page `433`; slug `job-placement-digest`; status `publish` | modified `2026-08-12T12:46:20` America/Chicago | `8f0dffe0aa93dcc7d218e6356535323de86fddef2b45e1c6eed3e0e73d064b69` | authenticated and public raw body = reviewed candidate = local dev body = accepted snapshot |
| About | Page `6`; slug `about`; status `publish` | modified `2026-08-12T13:02:27` America/Chicago | `54c00b141082d188bc3bd21e8dda91ad8d1823250bb0e5176b517fa5445ca359` | authenticated and public raw body = reviewed candidate = local dev body = accepted snapshot |
| Footer | template part `hperkins-tokens//footer`; status `publish` | update invocation `2026-08-12T13:03:42.502` and exact re-read by `13:03:47.955` America/Chicago | `d55bcf38a3182ad929ba47b9bb8fb2433a509599544f0bef96d03b3fccd636ec` | old href count `1 → 0`; `/one-page-resume/` count `0 → 1`; every other normalized byte equals the authenticated baseline |

The template-part connector does not expose a `modified` field for this record, so no footer modification timestamp is invented. The table records the connector's update-invocation and exact re-read times instead. The preserved pre-write footer hash was `f9453acb3b99dac13b0421a718e5875ea4bc2dae5784934efff618440d6dcd66`.

Two full-body About updates exposed WordPress.com's CRDT merge behavior and were each rolled back immediately to the exact authenticated baseline. The successful write replaced only changed top-level blocks with fresh page, content, and block locks; every intermediate full body matched its locally synthesized expectation. The final About body contains exactly one WCUS panel and no duplicated sections.

## Public résumé route and artifact

Fresh strict verification on 12 Aug 2026 established the same chain for GET and HEAD:

```text
/one-page-resume/?utm_source=wcus
  302 Found
  X-Redirect-By: hperkins-tokens
  Location: /wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=1786482656

final URL
  200 OK
  Content-Type: application/pdf
```

Inbound tracking parameters do not propagate to the PDF destination. The redirect stays same-origin and contains only the deliberate numeric artifact-version key.

| Artifact check | Result |
|---|---|
| DOCX SHA-256 | `45de95f691fe34e626bcb3802956c9ab752c09faa13609d417eba09208970dfb` |
| PDF SHA-256 | `1c869f8afe223a00007c529f763a58bae65c9f31287481f8fbbdf2b7fa1ce4a0`; public bytes equal the committed artifact |
| Page count | one page |
| Text/link parity | pass; 3,058 normalized characters and 17 external link annotations |
| PDF tags/searchability | pass; tagged structure includes `H1:2`, `H2:5`, ToUnicode text, and extractable WCUS copy |
| Live links | pass; checked destinations returned successful `200`/`206` responses |

The old Media Library PDF was not deleted. A fresh HEAD at `2026-08-12T13:22:00.539` America/Chicago returned `200 OK`, `Content-Type: application/pdf`, and `Content-Length: 76931`.

## Rendered and accessibility acceptance

Targeted accepted-mode production checks passed for exact WCUS body ownership, Digest and About source contracts, strict résumé GET/HEAD, prominent actions, and the full responsive browser matrices. The broader local `verify-content-ownership.js` gate remains red only because the isolated site's unrelated front-page database body (`e08216f…`) predates its accepted snapshot (`1155d0a…`); no out-of-scope front-page write was made. The rendered checks cover heading order, one H1, 44px controls, keyboard/focus behavior, fragment navigation, reduced motion, non-color state text, and horizontal overflow.

Retained captures are under:

- `output/playwright/wcus-production-acceptance/public/` — Digest and About at desktop, tablet, and phone widths.
- `output/playwright/wcus-production-acceptance/local/` — local candidate comparisons at 1440 and 390 widths plus the one-page résumé render.

Public footer verification on `/`, `/about/`, and `/job-placement-digest/` found exactly one `/one-page-resume/` link and zero old upload links within each page's footer. About and Digest also contain their separately reviewed in-body résumé actions.

## Publication-day evidence and attribution

The [publication-day GitHub activity audit](./2026-08-10-wordpress-github-activity.md) was refreshed at `2026-08-11T03:42:16.933` America/Chicago. Re-resolved candidate claims retained their exact states: Henry-authored PR #501 remains merged; PRs #263 and #40 remain authored open upstream code; issue #529 remains Henry's report while PR #593 remains a maintainer-authored merged fix; issue #732 remains Henry-authored while PR #757 remains Anubhav Anand-authored open work with Henry's role limited to integration testing and technical feedback; Flavor Agent RC3 remains a prerelease; later owned work is labeled merged/unreleased, open, default-branch, maintained-distribution, or fork-only as applicable.

No public copy inflates issue authorship into fix authorship, another contributor's PR into Henry's PR, top-level comments into formal reviews, or open/unreleased/fork-only work into shipped upstream work.

## Remaining lifecycle action

WCUS event copy is intentionally live through the event window. The separate [20 Aug retirement runbook](../runbooks/2026-08-20-wcus-event-copy-retirement.md) governs any later removal; `/one-page-resume/` remains the stable semantic destination.
