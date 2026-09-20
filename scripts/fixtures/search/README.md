# Search adapter fixture

Captured anonymously from `https://hperkins.blog/?s=flavor+agent` on
2026-09-20 using isolated headless Chrome, with no signed-in browser state.
The public Jetpack payload version was `15aceed9a0ffd4ac0dfd`.

`jetpack-overlay.html` retains the real overlay, query controls, first two
result cards, pagination and filter sidebar. Later results were removed,
and the displayed count was reduced to two. Pagination is intentionally
retained so empty-query checks catch a stray Load more control. The second card preserves the
actual malformed Photon URL that triggered the thumbnail defect.
`council-header.html` is the actual public Council header at capture time.
These fixtures contain public HTML only, with no credentials or API nonce.

`scripts/verify-search.js` serves them on a temporary loopback origin, rewrites
site links to that origin and loads current theme CSS, token values and scripts.
It serves the theme's real local fonts and emits its token/typography values from
`theme.json`. Candidate markup uses the gold-100 highlight configured by the PHP
search policy; baseline markup retains the captured plugin default pink.
It fetches the pinned public Jetpack and Assembler stylesheets and actual
WordPress hooks library without cookies. Image failure routes are deterministic
loopback resources. The one exact corrected Photon image request receives a
small fixture image through CDP: the public image service cannot fetch a
deliberately private loopback origin. No search API endpoints are intercepted.

The harness emulates only Jetpack-owned state transitions; theme enhancements
must come from the real candidate script. It deliberately leaves broken names,
focus, thumbnails, empty states and filter-close behavior for that script to fix.
The direct-query scenario performs a real `location.assign('/')` on close and
checks focus in the new document. Additional cases deny session storage, use an
unrelated destination, and advance the arriving document's clock beyond the
ten-second intent lifetime. A later home visit must not replay consumed intent.
This verifies the theme adapter's DOM and CSS contract, not live Jetpack API,
ranking, indexing, localization or Preact lifecycle integration. Pair it with an
anonymous real-plugin browser check before claiming those work.

Run `node scripts/verify-search.js`. The `--baseline` option uses `HEAD` CSS and
omits the adapter, so the same behavioral checks should fail before the fix.
The baseline reference is meaningful before committing the correction; it is
not a permanent historic version pin.
Use `--navigation-only` to run just the full-navigation focus checks.

## Blocks beta integration fixture

`jetpack-beta.json` contains the anonymous public beta shell, inert block
template, bootstrap selectors, module import map, relevant WordPress global/core
layout CSS, and Interactivity state captured on 2026-09-20. The nonce is removed,
tracking is disabled, and no browser cookies or credentials are included.

`node scripts/verify-search-beta.js` runs actual Jetpack and Gutenberg modules
against the live public Search API. With `HPERKINS_WP_PATH` set, the loopback
server reads those installed public module assets; otherwise it fetches public
assets. Candidate markup executes the actual theme render filter through
`render-beta-results.php`, using the installed WordPress HTML Tag Processor when
available, and falls back to the isolated test processor when no install is set.
The candidate script, CSS and additive store getter are read from this checkout.
The same PHP helper executes the actual enqueue callback; its module dependencies
and dequeues determine the fixture's import map and script tags. Plugin roots
precede the theme module, matching WordPress's enqueue order.

`--baseline` reads theme assets from Git HEAD and preserves the original beta
template, omitting the additive getter and its state seeds. `--serve` leaves a
loopback endpoint running for manual browser checks; it prints its URL. Evidence
defaults to the operating system temporary directory under
`hp-search-beta-verification`, never a published site or repository report.

Unlike the legacy transition fixture, beta Clear, filtering, pill removal,
query updates and Close/reload behavior are performed by the actual plugin.
Network/index availability can affect this integration check. The broken-image
case changes only one result URL in the isolated browser's public store to a
loopback 404 resource; it does not write to WordPress or alter the remote index.
The optional `HPERKINS_SEARCH_ENHANCER_OVERRIDE` file is for explicit hydration
diagnosis only and must be unset for acceptance runs.
`--startup-only` runs the eight desktop/mobile direct-query and submitted-header
startup checks. Half delay the actual theme module and Jetpack's hydration chunk
downloads to exercise their DOMContentLoaded ordering; no module implementation
or API response is substituted. The full verifier includes these checks.
