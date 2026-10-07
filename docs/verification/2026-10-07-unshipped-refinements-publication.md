# Unshipped-refinements page bodies and the `/essays/` template — 7 October 2026

The user explicitly approved two production changes from the 2026-10-06
unshipped-refinements hand-off (recorded in `docs/design-system/INDEX.md`):
the hand-off's two page-body edits (D1, D2), and reverting production's Site
Editor copy of the `home` template to `templates/home.html`. Both were made
through the authenticated WordPress.com connector for site **253647414**,
`hperkins.blog`. The deployed theme stayed at **0.3.73** throughout; 0.3.74 is
a separate theme release and writes neither change.

## Page bodies

| Edit | Page | Block replaced | `modified` before → after | content SHA-1 before → after |
| --- | --- | --- | --- | --- |
| D1, `/work/` | 13 | index 1, `core/group` `.hp-work` | `2026-09-11T04:34:58` → `2026-10-07T03:03:48` | `441f951a5f57554ba83d2d65a2804ff073247da0` → `26cc0e8c402097583c496f3850f64ff1ef36ecc5` |
| D2, `/ai-enablement/` | 175 | index 3, `core/group` `.hp-aie__ringsmap` | `2026-09-11T04:35:45` → `2026-10-07T04:12:19` | `4e5b5501bd8e1cf42374c88b03881f22b7828baf` → `99e6423f96682fb9e1bb8f549ef4e09010397bb4` |

- **Baseline.** Each live body was rebuilt from its committed snapshot and
  proven against the live `content_hash` and the target block's `block_hash`
  from `page-sections.list`. The Work body equalled its snapshot. The AI
  Enablement body did not: production's artifact row (block 2) carried
  `align: wide`, 60/50 padding, a 50 block gap and the `artifact-row` anchor
  in its opening comment and `<div>`, which the snapshot lacked. With that one
  substitution the rebuilt body hashed to the live value, and nothing else
  differed.
- **Writes.** Each edit is the brief's single substitution in one top-level
  block, sent with `page-sections.replace` under all four locks
  (`expected_modified`, `expected_content_hash`, `expected_block_hash`,
  `expected_block_type`), so any intervening change would have refused it.
  Block SHA-1s: Work `e3d081651f7c9e2ba4e8061f891e2af50c319fd3` →
  `7cc30f48587264d278a1ac7140485b134a8291c9`; AI Enablement
  `3e2e18fb936688fce841ecfd652d4c0da392d521` →
  `7b03e91bade2c74a2380c7496d2e795cb44bc62b`. No other block, title, slug or
  status changed.
- **Payload pre-flight.** The AI Enablement block carries 16 literal `-`
  escapes, the `--` spelling Gutenberg uses inside block-comment JSON. A dry
  run through a read-only connector call showed the agent's tool-call path
  decoding them to `-`, so the payload was re-encoded and dry-run again until
  its SHA-1 matched the expected block. Pre-flight any agent-driven section
  write the same way before sending it.
- **Readback.** Each write returned the full body with the expected
  `content_hash` and no content warnings. A separate `page-sections.list`
  afterwards reported the same `modified` and `content_hash` for both pages.
  Anonymous, cache-busted reads: `/work/` serves the `1.0.1` link and no
  `v1.0.1`; `/ai-enablement/` serves all three maturity chips with
  `has-mono-font-family has-xs-font-size` and keeps the `artifact-row` anchor.

## Mirrors

- `content/page-snapshots/work.html` and
  `content/page-snapshots/ai-enablement.html` are the live bodies plus one
  trailing LF; each body's SHA-1 equals the live `content_hash`. This session
  had no WP-CLI access to the production install, so they were written from
  the hash-verified reads; `export-page-snapshots.js` produces the same bytes.
- `patterns/work-index.php` takes the D1 edit and is byte-identical to the
  Work snapshot.
- The AI Enablement mirror also takes production's artifact row, so
  `patterns/ai-enablement.php`, which serves the snapshot, now emits the same
  anchor and padding.

## The `/essays/` template

- **Before.** `hperkins-tokens//home` was `source: custom` with
  `has_theme_file: true`: 7,195 bytes, SHA-1
  `2f5adbc8161329241002f813c157d9db15238432`. Against `templates/home.html` it
  used default-layout post templates instead of the 18rem/17rem grids, linked
  its featured images, set featured excerpts at 20 words with `sm` and a
  `spacing|30` margin, and carried editor serialization (`excludeCurrent:
  null`, `post-date` bindings, template-part `theme`). Its subscribe pattern
  was frozen into a `core/html` block holding a nonce minted in the editing
  session, whose `_wp_http_referer` was
  `/wp-json/wp/v2/templates/lookup?slug=home&_locale=user`. The handler in
  `functions.php` answers a failed nonce with `invalid-request`, so a visitor
  could not subscribe from `/essays/` while the copy was live. Only `home` and
  `index` were customized among the site's 30 templates.
- **Backup.** The copy and its full `templates.get` response were saved before
  the change to ignored task-local storage
  (`.superpowers/backups/2026-10-07/`, local to the session that made the
  change). The connector's delete moved the `wp_template` post to the trash
  (`status: trash`) rather than erasing it.
- **Reset.** `templates.delete` returned `has_theme_file: true`, and a fresh
  `templates.get` reports `source: theme`. `index` was not touched.
- **Live check.** Two anonymous, cache-busted reads of `/essays/` render the
  featured loop as `is-layout-grid` with unlinked featured images. The journal
  loop shows its empty state, because production has two posts and that loop
  starts at offset 3. The subscribe form carries a nonce minted for the
  request with the page's own referer; the frozen nonce and the
  `templates/lookup` referer are gone. Nothing was posted to the subscribe
  endpoint.
- **Critical CSS.** Jetpack Boost's inlined critical CSS for `/essays/`
  already carries the theme's class-based `.hp-journal-featured` grid rules,
  so the reset does not depend on it. It still holds pre-0.3.74 postcard
  rules, so regenerate it after the 0.3.74 deploy.
- **Recurrence.** The REST templates endpoint resolves `wp:pattern` blocks into
  rendered markup: read after the reset, `home` came back with the subscribe
  form expanded and a nonce minted for that API request. Saving `home`,
  `single` or `page-contact` in the Site Editor would freeze one again, so do
  not save those templates there until the theme re-mints the nonce at render
  time.

## Verification in this session

- `verify-ai-enablement-source.js`, `verify-journal-templates.js`,
  `verify-content-ownership-docs.js` and `verify-impeccable-artifacts.js`
  pass.
- `verify-no-duplicate-pages.js`'s pattern-to-snapshot comparison, run on its
  own, passes; `php -l patterns/work-index.php` reports no syntax errors.
- The shared-library inventory passes 411 of 412 tests. The one failure,
  `support-resume-cleanup.test.js`, requires PowerShell (`pwsh`), which this
  environment lacks; it exercises no file this change touches.
- Not run here: `verify-content-ownership.js` and the WP-CLI half of
  `verify-no-duplicate-pages.js`, which need WP-CLI access to the production
  install. Run both from a checkout that has it.
