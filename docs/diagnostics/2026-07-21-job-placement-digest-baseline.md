# Job Placement Digest correction baseline

Captured on **21 July 2026** before the correction was applied to production.
This is diagnostic evidence, not a replacement snapshot.

## Ownership and repository identity

- Working branch: `fix/job-placement-digest-integrity`
- Branch checkpoint at capture: `e7e2d1f`
- Repository `main`, tag `v0.3.52`, and sampled deployed theme assets:
  `c5dc3a1e5dea0d6fd922f15542ee2b2a799f4a29`
- Theme version declared at repository HEAD: `0.3.52`
- Theme version visibly claimed in page 433 prose: `0.3.42`
- Live theme version from public `style.css`: `0.3.52`
- Seven sampled production files byte-matched `c5dc3a1`: `style.css`,
  `readme.txt`, `theme.json`, `assets/imladris-pages.css`, and the three
  enqueued JavaScript files.

The operating contract for this correction is:

> The WordPress database body is the visitor-facing canonical source.
> `content/page-snapshots/job-placement-digest.html` is its verified mirror.
> A release or deployment fails when the normalized bodies differ.

`patterns/job-placement-digest.php` was a stale third copy and was marked for
retirement, not synchronization.

## Page 433 baseline

- Public URL: `https://hperkins.blog/job-placement-digest/`
- Status: published
- Last modified before correction: `2026-07-21T13:17:32`
- Pre-correction database-body export:
  `docs/diagnostics/2026-07-21-job-placement-digest-live-body-pre-correction.html`
- Live body: 28,597 normalized UTF-8 bytes; SHA-256
  `660f439bc1aeebec718e0d7056259b0a4640dce165196bd2381804dece02673b`
- Existing snapshot: 29,307 normalized UTF-8 bytes; SHA-256
  `464642392ab98e977814f20522840d038606063ad416ea89dd6111c49b7e86b6`
- Retired pattern before deletion: 13,025 normalized UTF-8 bytes; SHA-256
  `a2f36671f3f1f1941bc8c2408d1f93c4e7b8eaae182c9bffe9777b4ac36797fa`

Normalization converts CRLF to LF and removes final trailing whitespace. The
live and stored hashes did not match.

Visible defects at capture included an H1-to-H3 outline jump, an empty hidden
`resume-keyword-bank` target, a stale release claim, no verification date, no
appendix link, and two unsupported plain closing buttons. Custom SEO title and
description fields were empty; generated search and social descriptions used
the generic third-person excerpt.

## Public résumé baseline

- Filename: `henry-perkins-wordpress-ai-open-source-resume-2026-06-30.pdf`
- Public URL:
  `https://hperkins.blog/wp-content/uploads/2026/06/henry-perkins-wordpress-ai-open-source-resume-2026-06-30.pdf`
- Size: 76,931 bytes
- Page count: 2
- SHA-256:
  `9d6cacbbdf8a257a45f4054cadd95c2f822e627bc0894500c3445ab14655125f`
- Known stale claim: AI Provider for Codex `v2.0`

## External evidence baseline

- AI Provider for Codex stable release: `v2.1`, commit `2827bb5`.
- Flavor Agent latest prerelease: `v0.1.0-rc.3`, commit `e6a7fb3`.
- Flavor Agent current branch at capture: `a924b9b`, 54 commits ahead of RC3,
  with 35 unique Ability identifiers. RC1 historically defined 30.
- HPerkins Tokens release: `v0.3.52`, commit `c5dc3a1`.
- WordPress/ai PR #501: merged.
- WordPress/ai issue #529: closed; maintainer fix shipped in 1.0.1.
- WordPress/ai issue #732: open; proposed PR #757 open.

## Public market-sheet baseline

- Document title: `Validated 50 — Job Digest (hperkins.blog)`
- Rows: 20
- Current live passes: 9
- Unresolved: 2
- Historical or otherwise not-current passes: 5
- Replaced: 1
- Human-failed or dropped: 3
- Latest recorded row check: 20 Jul 2026
- Last-checked distribution: 11 rows on 20 Jul 2026, 4 rows on 18 Jul
  2026, and 5 rows without a recorded date.

The public export still mixed public screening data with private application
operations in its notes. The replacement workbook separates a seven-column,
20-row public ledger from a private operations workbook.

## Baseline screenshots

- `docs/diagnostics/2026-07-21-job-placement-digest-baseline/desktop-1440x1000.png`
  — SHA-256
  `9662a04bbf17e1ac16a8bac52ec14371a90058f86e0e1bc2d05813b9dbd4cf5d`
- `docs/diagnostics/2026-07-21-job-placement-digest-baseline/mobile-390x844.png`
  — SHA-256
  `c83a6701c68b15ed2ad8a98d866ca31f0bd006811d7de8f1e150b6e0f7cf2c8d`
