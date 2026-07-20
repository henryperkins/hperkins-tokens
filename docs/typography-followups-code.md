# Typography 0.3.46 — code-review follow-ups (repo-fixable)

Findings from the code review of the 0.3.46 typography implementation (the
branch/PR that shipped the items in
[`typography-followups.md`](./typography-followups.md)). Unlike that file — which
lists **database-side** work the theme cannot reach — everything here is a bug or
polish item **in the theme's own files** (`scripts/verify-typography.js`,
`style.css`, `templates/*.html`, `readme.txt`), so it can be fixed on the branch
before or after merge.

Each item was verified against the actual files (adversarial refute-by-default
review); line numbers are approximate and may drift as the sheet changes — match
on the described selector/code.

## Low severity — worth fixing

- [ ] **Verifier can abort a `--report` run mid-audit** — `scripts/verify-typography.js`
  (`inspectPage`, ~L564). `const loaded = cdp.once('Page.loadEventFired', …)` is
  created *before* `await cdp.send('Page.navigate', …)`. If that navigate `send`
  rejects (its 15s timeout or a CDP error), the function throws before
  `await loaded`, orphaning `loaded` with its 30s timer armed; ~30s later it
  rejects unhandled and (Node's default `unhandled-rejections=throw`) exits the
  process — defeating `--report` mode's "keep going past one bad page" intent.
  *Fix:* `loaded.catch(() => {})` before the navigate `await`, or await navigate
  before registering the load listener.

- [ ] **Prose-measure rule over-matches aligned children** — `style.css`
  (global-typography-pass block, ~L4463). `.hp-prose > :where(p, ul, ol, blockquote)`
  and the `.wp-block-post-content.is-layout-constrained > …` twin set
  `max-inline-size: 68ch; margin-inline: auto` with no
  `:not(.alignwide):not(.alignfull)` exclusion (WP core's own constrained rule
  has it). A direct-child bare `<blockquote class="alignfull">` / `<ul class="alignwide">`
  (Classic-migrated post, raw `wp:html`, or plugin markup) gets clamped to 68ch
  and re-centered, defeating its full-bleed/wide intent. Core Paragraph/List/Quote
  blocks don't expose wide/full on a bare tag, so standard content is safe.
  *Fix:* mirror core's `:not(.alignwide):not(.alignfull)`, or drop
  `margin-inline: auto` (constrained layout already centers non-aligned children).

- [ ] **Duplicate `role="search"` landmarks** — `templates/search.html` (L11) and
  `templates/404.html` (L19). Both include `parts/header.html` (the `hp-site-search`
  core/search block, rendered at every width) *and* add an in-content
  `hp-content-search` block. `core/search` always emits `<form role="search">`, so
  a screen-reader landmarks list shows two indistinguishable search regions.
  *Fix:* give the content-search form a distinct `aria-label` (the `label`
  attribute names the input, not the form landmark), or expose only one search
  landmark.

## Nits / polish

- [ ] **Verifier's general loop mishandles SVG `<text>`/`<tspan>`** —
  `scripts/verify-typography.js` (~L399). SVG text enters the general
  family/floor/contrast loop, where the 12px floor reads `getComputedStyle().fontSize`
  without the `getScreenCTM` scale the dedicated SVG loop uses, contrast reads
  `color` instead of `fill`, and a display font used only in SVG trips the family
  allowlist. Latent — no audited page has SVG `<text>` today (ironically the
  Flavor Agent diagram from followups §2 is exactly what would trigger it).
  *Fix:* `if (el.namespaceURI === 'http://www.w3.org/2000/svg') continue;` in the
  general loop.

- [ ] **15px long-copy floor misses inline-wrapped text** —
  `scripts/verify-typography.js` (~L422). `hasDirectText` requires a direct text
  node, so `<p><span>…140+ chars…</span></p>` at 14px escapes the reading-size
  floor. Compound-conditional coverage gap.

- [ ] **`body.archive/search` excerpt rule out-specifies the postcard component** —
  `style.css` (~L4478). On the theme's own archive/search templates,
  `body.archive .wp-block-post-excerpt__excerpt` (targets the inner `<p>`) wins over
  `.hp-postcard__excerpt` (targets the outer wrapper). A visual no-op today, but a
  latent sync-trap: retuning `.hp-postcard__excerpt` silently won't apply on
  `/archive` and `/search`. *Fix:* scope the body rules away from the postcard
  subtree, or add a sync comment.

- [ ] **`perPage:9` inert under `inherit:true`** — `templates/archive.html` and
  `templates/search.html` (query block, L14). With `inherit:true` WP uses the main
  query and the site's posts-per-page (default 10), so the 3-col grid designed
  around 9 renders 10 and paginates on 10. Behavior is correct/idiomatic; the
  `perPage`/`order`/`offset` keys are misleading dead config. *Fix:* drop them for
  clarity.

- [ ] **Changelog overstates the 404 role CSS** — `readme.txt` (0.3.46 changelog
  entry). Says role CSS is "keyed to the archive/search/**error404** body classes,"
  but no `body.error404` rule exists — the 404 surface is styled through shared
  `hp-archive-hero__title` / `hp-content-search` classes only. *Fix:* reword.

- [ ] **`readme.txt` "Template overrides" section is out of sync** — the intro now
  lists `archive.html` / `search.html` / `404.html` and says "each detailed under
  Template overrides below," but that section still says the theme owns "**eleven**
  block templates" and doesn't document the three new ones. *Fix:* update the count
  and add their bullets.

## Investigated and dismissed (do not re-file)

- **Desktop nav / bar-Subscribe `xs→sm` (13→15px) overflow** in the 782–1440px band
  the verifier skips — refuted: the nav `flex-wrap`s under pressure (`.hp-site-brand`
  / `.hp-site-nav` have `min-width:0`), the raise is deliberate and documented, and
  no concrete overflow case exists.
- **Fire ring-card `gold-200` on rust reads ~4.4:1 (sub-AA)** — refuted: `--hp-ring-base`
  (rust) is never a solid text background; it's a 26%-opacity veil stop over the dark
  `surface--inverse`, so actual text contrast is ~8–9:1 (plus a `text-shadow` halo).
