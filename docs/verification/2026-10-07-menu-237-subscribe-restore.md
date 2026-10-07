# Menu 237 Subscribe restore — 7 October 2026

Every production page rendered the Condensed Council header from its
fallback model (`data-hp-header-source="fallback"`), so `verify-header.js`
stopped at its source assertion against production. The fallback carries the
same labels and URLs, so visitors saw no difference. What had been lost was
the header following menu post 237.

## Cause

`hperkins_tokens_get_council_navigation_model()` accepts menu 237 only when
every Council item resolves. Production's menu had no block with the
`hp-nav-subscribe` class, so `hperkins_tokens_council_find_block_by_class()`
returned null, `hperkins_tokens_council_link_from_block()` rejected it, and the
`! $subscribe_item` test returned the fallback. Running the theme's model code
under WordPress's own block parser reproduced it: the live markup produced
`fallback`, while `content/nav-snapshots/nav-237.html`, and the live markup
with only the Subscribe block appended, both produced `navigation`.

The live menu (`post_modified_gmt` 2026-08-27 10:14:12) was exactly the recut
target without its trailing Subscribe link, re-serialized with the block
editor's blank lines: 944 bytes, SHA-256
`f0db939c812fe4bc4d33d55c1cd6c7b8c2e65579d90715b9d7edfd99e3fcea5a`. No Studio
sync ran after 2026-08-26, no local agent transcript wrote post 237, and the
Activity Log records no navigation writes, so the writer is unknown; the
formatting points to an editor save. 0.3.36 records the same loss once before.
The production `verify-header.js` job in `.github/workflows/verify.yml` would
have caught it, but Actions has not run since 2026-08-24.

`apply-council-navigation.js` refused this state, which matched neither its
2026-07-20 pin nor the target.

## Change

- `content/nav-snapshots/nav-237.production-2026-08-27.html` keeps the
  byte-exact read.
- `apply-council-navigation.js` accepts a list of pinned states, each with its
  backup. The contract test derives every pin from its backup and asserts that
  the 2026-08-27 state is the target without the Subscribe link. A wrong pin
  and a backup that drifts from that shape each fail it.
- The production write was approved by the owner. This machine has no WP-CLI
  or SSH route to the Atomic site, so the script's transaction ran through the
  WordPress.com connector: a fresh read was byte-identical to the backup,
  `navigation.update` wrote the script's exact `NEW_CONTENT`, and a fresh
  re-read equalled it, canonical SHA-256
  `1e88af1854abfbe51d753a59b5decf5a4cedb41d00caf09f386415702c79ebaa` (the
  snapshot's). Unlike the script's PHP, the connector cannot compare and write
  in one process.

## Verification

Before the write, the full header rendered from the snapshot and from the live
markup in one local WordPress request differed only in
`data-hp-header-source`. No production route renders a core Navigation block:
only `index` is customized, and it includes the theme's header and footer
parts. Unmodified, `verify-header.js` failed against production at the source
assertion; with only that assertion relaxed, every other check passed.

After the write, cache-busted and plain requests to `/`, `/about/` and
`/essays/` render `data-hp-header-source="navigation"`. Unmodified,
`HPERKINS_ORIGIN=https://hperkins.blog node scripts/verify-header.js` passes:
the source contract and all eight widths (1440, 1280, 1024, 960, 782, 781, 390
and 320px), exit 0.

A smoke run of the edited script against the local Studio mirror exited 0,
which the script does only when post 237 ends at the target, either already
current or recut from a pinned state. Its output was not read.

Rollback: write the backup's bytes back to post 237.
