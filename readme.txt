=== HPerkins Tokens ===
Contributors: Henry Perkins
Requires at least: 6.6
Tested up to: 7.0
Requires PHP: 8.0
Stable tag: 0.3.53
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
Template: assembler

Governance-first child theme for hperkins.blog. The design system is authored at the theme.json schema level — tokens are the source of truth; the render is a consequence.

== Description ==

HPerkins Tokens is a block child theme of Assembler. Its premise is that the
design system lives in theme.json as a small, named token vocabulary, and every
component is a consequence of those tokens rather than a parallel set of
hardcoded values. The visual language is a ledger: status is expressed through a
semantic palette and a shared row anatomy whose padding, left-rule width, and
radius are fixed named tokens — fixed per component, never by state — so within
a component state changes only the rule color, the surface tint, and a
filled-vs-hollow dot — never the shape of the thing.

This is a child theme. It overrides the header and footer template parts; ships
front-page.html, home.html, single.html, archive.html, search.html, 404.html,
page-about.html, page-ai-enablement.html, page-contact.html,
page-how-this-was-built.html, page-job-placement-digest.html, page-work.html,
page-placement-method-and-evidence.html, and page-case-study.html as
additive block templates (each detailed under Template overrides below); and provides its own token
vocabulary, component CSS, and patterns. Unspecified page/post templates are
inherited from the Assembler parent. The Assembler parent theme must be
installed for this theme to activate.

= Token vocabulary =

The Imladris token layer lives in theme.json and is kept in sync with the design
system — verified 1:1 at the 2026-06-20 pull, with theme-side deltas since recorded
in docs/design-system/INDEX.md; re-diff before asserting parity. style.css aliases
onto the generated --wp--preset--* / --wp--custom--* variables rather than
duplicating any hex.

Color palette (settings.color.palette — defaultPalette, defaultGradients,
defaultDuotone, custom, customGradient, and customDuotone are all false, so the
stock swatches and every custom color, gradient, and duotone picker are off and
authors choose only from these named tokens):

* Parchment — parchment-50 #FAF6EC / parchment-100 #F5EFE1 /
  parchment-200 #ECE4D2 / parchment-300 #DED2B8 (grounds, raised surfaces,
  sunken tints, hairlines)
* Mist — mist-100 #EEF1ED / mist-200 #DCE3DD (cool neutral surface and soft
  border)
* Ink — ink-900 #1B231D / ink-700 #313B33 / ink-500 #515C52 / ink-450 #656E64 /
  ink-400 #6E7A6E / ink-300 #94A095 (text, strong to disabled)
* Evergreen (brand) — green-900 #1C2E24 … green-050 #EDF3ED; green-700 #2E4A3A is
  the brand and link color, green-050 the merged-chip tint
* River (links / info) — river-900 #1E3040 … river-100 #DCE9F0; the Bruinen blue
  used for artifact links
* Gold (accent) — gold-800 #6E531B / gold-700 #9A7530 … gold-100 #F4EBCF;
  gold-500 #C29A44 is the accent, gold-800 is the accessible small-text color
  for the Digest cue, and the 3px focus-visible ring uses gold-700 so it clears
  3:1 on parchment and twilight surfaces
* Twilight (inverse plates) — twilight-900 #161D24 / twilight-800 #1E2730 /
  twilight-700 #283440 (footer and hero plates)
* Status (semantic; rule-color AND a redundant word, never color alone) —
  leaf #4E7459 (done) / amber #B7842F (review) / rust #9C4A33 (danger) /
  slate #3F6E89 (info)

Typography (defaultFontSizes disabled; non-fluid). Four self-hosted families:

* display — Cormorant Garamond (headings and hero)
* body — EB Garamond (reading copy)
* label — Marcellus (uppercase eyebrows / meta)
* mono — JetBrains Mono (status labels, code, artifact rows)
* Font sizes (rem): 2xs 0.75 / xs 0.8125 / sm 0.9375 / base 1.0625 / md 1.1875 /
  lg 1.375 / xl 1.75 / 2xl 2.25 / 3xl 3 / 4xl 4 / 5xl 5.5

Spacing slots (defaultSpacingSizes disabled; slug · pixel value):

* 1·4 / 2·8 / 3·12 / 4·16 / 5·24 / 6·32 / 7·40 / 8·48 / 9·64 / 10·80 / 12·112 /
  16·160

Layout: contentSize 44rem, wideSize 72rem.

Design tokens (settings.custom — kept out of the editor controls, consumed by the
component CSS and aliased to --hp-* names in style.css):

* surface / text / border / rule — semantic neutrals (page, raised, card, sunken,
  cool, inverse, brand surfaces; strong→disabled text; hair/soft/strong/brand
  borders; the gold rule)
* brand / accent / feedback — interaction ramps (default/hover/press/subtle) plus
  success/warning/danger/info
* status + on — the three status fills (done/review/pending) and their on-colors
* type — composite font shorthands (hero, h1–h4, lead, body, ui, meta, mono)
* weight 400/500/600/700 · leading tight 1.08 / snug 1.22 / normal 1.5 /
  relaxed 1.7 · tracking wide 0.04em / caps 0.18em
* measure prose 68ch / narrow 46ch · container text 44rem / wide 72rem /
  full 84rem
* radius xs 2px / sm 4px / md 7px / lg 12px / xl 20px / pill
* shadow xs…xl plus inset and gilt · ease calm / out / inOut · dur fast 140ms /
  base 240ms / slow 420ms / veil 700ms

The 1px hairline rules and a few documented one-off literals (the browser-chrome
traffic-light dots and the dark artifact-embed frame's canvas/halo) are the only
visual values intentionally left literal; everything else resolves from a named
token.

= Patterns =

All patterns register under the "hperkins.blog" category:

* Proof bar (status ledger) — a vertical ledger of status lines; state is the
  semantic token plus a filled vs. hollow dot, never color alone.
* Artifact row — the fixed terminus of a Work entry; each cell is a ledger line
  labeled by what it verifies (release tag, diff, live page).
* Client pull-quote — a testimonial capped at body scale; the typographic
  ceiling keeps anything a client says from rendering larger than the work.
* Work entry (ledger) — the ledger spine the other components attach to. Each
  entry opens with a mono status label (the status word is text, so it is
  conveyed without relying on color), then the title link, then the consequence,
  with the artifact row as the entry's terminus.
* Evidence First case board - a site-owned operations board for work where the
  proof is primarily releases, issues, pull requests, reviews, docs, or policy
  records rather than screenshots.
* Proof + Product hero - a visual case-study opening that pairs a compact
  evidence board with a framed product-media slot the author fills in. Use for
  VOJ, plugin UI, frontend interfaces, and client work where the finished
  surface is part of the proof.
* Operational Story feature - a featured narrative treatment reserved for the
  Flavor Agent AI Governance and Demo pages, where evidence, signals, diagrams,
  and author-supplied product media recur through the page as one connected
  plugin demonstration.
* Wapuu homepage hero - a homepage or portfolio landing treatment that uses the
  custom HPerkins Wapuu as the primary signature artwork, paired with concise
  positioning copy and restrained proof chips.
* Case-study lead - the shared muted, large-scale opening paragraph for a
  case-study or section page (the .hp-lead class and the matching pattern), so
  every write-up opens with one tokenized treatment instead of hand-styled copies.

The CSS also exposes an author-applied state hook, `.hp-quote.is-reserved`, for a
provisional, not-yet-final quote (dashed rule, muted italic). Apply it via the
block's Advanced → Additional CSS class(es) field.

= Composition contract =

The Wapuu homepage hero owns the single page h1. Section-level patterns such as
Evidence First and Proof + Product open with h2 titles, while nested boards inside
an already-titled section, such as Operational Story, use h3. Work entry (ledger)
takes its level from whatever encloses it. On /work/ the entries are the page's
top-level sections and their titles are h2: the "Selected work" standfirst is the
hero eyebrow, not a heading, so there is nothing to nest under and an h3 would
skip a level. Where the ledger does sit inside a titled section, keep the entry
titles at h3 beneath that section's h2.

Starter pattern links use href="#" placeholders. Replace them with live release,
pull request, page, review, or documentation URLs before publishing the pattern
unchanged.

= Template overrides =

The child theme owns fourteen block templates (page-case-study is also registered
as a selectable "Case study" template in theme.json; the others map by the
WordPress template hierarchy):

* front-page.html — the portfolio landing shell; renders the theme-owned Wapuu
  hero, then the stored Home page body via `wp:post-content`, then the
  theme-owned Three Rings framework. The current live middle section is
  versioned at `content/page-snapshots/front-page.html`.
* home.html — the journal index: masthead, category filter, a featured essay,
  then a grid of recent essay postcards.
* single.html — the essay reader: a twilight cover hero (title, standfirst, meta)
  over constrained prose, post tags, the subscribe block, and a "Continue
  reading" related-posts grid.
* archive.html — category, tag, author, and date archives: a hero masthead with
  a proper H1 (`wp:query-title`), then journal postcards for the matched posts
  (query ID 13, inheriting the main query).
* search.html — search results: the same masthead and postcard grid keyed to the
  search query (query ID 14), plus an in-content search control.
* 404.html — the "Page not found" surface: a hero H1, a short lead, and a search
  control, styled through the shared archive-hero and content-search classes.
* page-about.html — wraps the stored About page content in the narrow/wide About
  composition shell. The current live content is versioned at
  `content/page-snapshots/about.html`.
* page-ai-enablement.html — the AI-enablement essay shell; renders the stored
  page body in the 44/72rem reading column. The current live content is
  versioned at `content/page-snapshots/ai-enablement.html`.
* page-contact.html — the contact page; renders the "contact" pattern in a 72rem
  column.
* page-how-this-was-built.html — the build report; fully theme-owned (it embeds
  the how-this-was-built pattern and the DB page carries an empty body, so the
  pattern file is the source of record — deliberately outside the snapshot
  contract).
* page-job-placement-digest.html — the Job Placement Digest shell; renders the
  stored page body in the 44/72rem reading column. The current live content is
  versioned at `content/page-snapshots/job-placement-digest.html`.
* page-placement-method-and-evidence.html — the research appendix shell; renders
  the stored Placement Method and Evidence body in the 44/72rem reading
  column. Its verified mirror is tracked at
  `content/page-snapshots/placement-method-evidence.html`.
* page-work.html — the work index shell; renders the stored page body in the
  44/72rem composition. The current live content is versioned at
  `content/page-snapshots/work.html`.
* page-case-study.html — supplies the case-study header, title, and constrained
  content column only. Evidence boards, proof bars, artifact rows, and links must
  live in the page content so every published case study carries real, editable
  proof rather than starter placeholders.

Unspecified page/post templates are inherited from the Assembler parent.

The public About, Work, AI Enablement, Job Placement Digest, and Placement
Method and Evidence routes are DB-owned page bodies. The WordPress database
body is canonical for visitor-facing content; each committed HTML snapshot is
an automatically verified mirror, not another authoring source. The public
front page is hybrid: `front-page.html` keeps
the Wapuu hero and Three Rings framework theme-owned, while the middle Home
section remains DB-owned and tracked at
`content/page-snapshots/front-page.html`. The published Flavor Agent demo route
(`/work/flavor-agent/demo/`) likewise keeps its iframe embed and explanatory
copy in the database; because it inherits the generic page shell, its tracked
mirror lives at `content/page-snapshots/work-flavor-agent-demo.html` rather
than a theme-owned wrapper template. Keep the verified mirrors in sync at
`content/page-snapshots/front-page.html`,
`content/page-snapshots/about.html`, `content/page-snapshots/work.html`,
`content/page-snapshots/ai-enablement.html`,
`content/page-snapshots/job-placement-digest.html`,
`content/page-snapshots/placement-method-evidence.html`, and
`content/page-snapshots/work-flavor-agent-demo.html`. After an intentional
page-body edit, refresh the files with `node scripts/export-page-snapshots.js`
and verify with `node scripts/verify-content-ownership.js`. The older
filesystem patterns (`about-resume`, `work-index`, and `ai-enablement`) remain
reusable seeds/reference copies rather than the live route owners for those
pages. The former full-page `job-placement-digest` pattern is retired so it
cannot drift into a third maintained body. `wapuu-home-hero` remains the live
front-page hero.

= Condensed Council header =

The header template part renders `[hperkins_council_header]`; the theme-owned
renderer in `inc/council-header.php` treats WordPress Navigation post 237 as DB
data rather than rendering its core Navigation markup directly. The portable
source copy is `content/nav-snapshots/nav-237.html`. Refresh it with
`node scripts/export-navigation-snapshot.js`, prove live parity with
`node scripts/verify-content-ownership.js`, and use only the pinned,
hash-guarded `node scripts/apply-council-navigation.js` for the approved recut.

Desktop Work and Writing disclosures, anchored search, and the flat mobile
drawer share one mutually exclusive state in `assets/js/header-controller.js`.
The state is `closed|work|writing|search|drawer`, and the controller also owns
focus restoration, breakpoint settlement, and Interactivity Router cleanup.
`node scripts/verify-header.js` checks the source contract plus eight-width
geometry, interactions, focus, reduced motion, containment, and screenshots.
The mobile drawer intentionally exposes the real Work, Essays, AI Enablement,
About, Job Placement Digest, Search, and Subscribe destinations; it does not
invent a dead `/writing/` route. Contact remains reachable in the footer.

= Portfolio art direction =

The portfolio uses a light operations-desk art system. Site-owned visuals use
neutral surfaces, hairline rules, mono labels, status accents, evidence rows,
signal strips, and framed media. Client palettes stay inside screenshots; they
do not become theme tokens, page backgrounds, navigation colors, artifact rows,
or site-owned diagrams.

The Proof + Product and Operational Story patterns ship a framed media slot
rather than embedded images. Bundled starter screenshots live in
assets/screenshots/; insert them as image blocks with the hp-shot
hp-shot--browser (desktop) or hp-shot hp-shot--phone (mobile) classes when you
build out the Flavor Agent pages.

The custom HPerkins Wapuu master art lives at assets/wapuu/hperkins-wapuu.png
(opaque white field), with historical derivatives beside it. What the theme
renders today is assets/img/wapuu-color.png (and its WebP variant) — the full
figure in the theme-owned Wapuu homepage hero pattern. The header brand is the
inline eight-pointed star SVG emblem (hp-site-brand__emblem in
parts/header.html), not a Wapuu mark, so the mascot appears exactly once per
page: large on the home hero, nowhere else. It should not replace proof boards,
artifact rows, screenshots, or project-specific evidence.

The masthead is one sticky, frosted Council bar on every page: star emblem +
site-title lockup, an optically centered nav, an inline click-to-expand search,
and the evergreen Subscribe pill (which moves to the mobile drawer foot below
782px as the hp-nav-subscribe link in menu 237).

Use Evidence First for non-visual proof work such as GitHub contributions,
provider architecture, upstream fixes, documentation grounding, and review
records.

Use Proof + Product for visual work such as VOJ, plugin UI, frontend interfaces,
and client projects where screenshots materially prove what shipped.

Use Operational Story for featured multi-page narratives that reconcile to one
operating surface: the Flavor Agent AI Governance and Demo pages (one plugin
demonstration) and the Job Placement Digest's support-first path (one career
register).

== Installation ==

1. Install and keep active the Assembler parent theme (Automattic).
2. Place this theme in wp-content/themes/hperkins-tokens/.
3. Activate "HPerkins Tokens" under Appearance → Themes.

Note on stylesheet loading: Assembler registers its own stylesheet from
get_stylesheet_directory_uri(), which under a child theme resolves to this
theme's style.css. functions.php compensates by dequeuing the parent's
'assembler-style' handle and enqueuing the real parent sheet ('assembler-parent')
and this theme's sheet ('hperkins-tokens') explicitly, in dependency order. Do
not remove that wiring.

== Frequently Asked Questions ==

= Can I add my own colors or font sizes in the editor? =

	No. The palette, custom gradients, custom duotones, and the custom color picker
	are intentionally locked to the named tokens so the design system stays the
	single source of truth. To change a color or size, edit theme.json — not
	individual blocks.

= Where is the Work list styled if there's no Work block? =

The Work ledger is a pattern: insert "Work entry (ledger)" from the hperkins.blog
pattern category. It emits the .hp-work markup the stylesheet expects.

== Changelog ==

= 0.3.53 =
* Rebuild the Job Placement Digest as a concise Support Engineer case with
  neutral career-direction labels, explicit evidence states, a compact fit
  ledger, three primary proof cards, and the production focus-regression case.
* Separate the research notebook into the database-owned Placement Method and
  Evidence appendix and retire the stale full-page digest pattern so the live
  WordPress body has one automatically verified repository mirror, not a third
  maintained copy.
* Add a public read-only content-integrity endpoint plus local, CI, and
  deployment verifiers that report both hashes and a useful line diff when a
  database body diverges from its committed snapshot.
* Ship the one-page Support Engineer résumé and seven-column public market
  ledger with package-level privacy, page-count, searchable-text, version, and
  link contracts.
* Accessibility: register versioned proof-card, incident, ledger, disclosure,
  numbered-rule, and research-note block styles; give disclosures a 44px
  keyboard target; raise mobile Council controls to 44px; preserve long labels
  without page-level overflow down to 320px.
* Deployment record (verified 21 Jul 2026): theme v0.3.53 at deployed commit
  `43d9ef603a6715b23af0b4fdce6076010e4b824a`; Job Placement Digest snapshot
  SHA-256 `2b44c39ef580f9ff65bad3605cf4a82fdcb4b5b812a654c47be819c5d710caf1`;
  Placement Method and Evidence snapshot SHA-256
  `e807165705153e7561fc51fc258c8c7ac1b008822533983507674a790c431327`;
  About snapshot SHA-256
  `a43af8fd352bab041835231150f07df9199f6a426a560bde4e04211e2ac61edf`;
  primary résumé SHA-256
  `6b02d9d8dfed65656c5d4597e7d3cd17c7160c5958c899a25b542289585d086d`;
  deployed content-ownership result: pass.

= 0.3.52 =
* Accessibility: restore the keyboard focus ring on every button in production.
  Assembler's theme.json `styles.css` string emits
  `button:focus-visible, .wp-block-button__link:focus-visible { outline: 2px
  solid var(--wp--preset--color--theme-4) }` into global-styles-inline-css.
  `theme-4` belongs to Assembler's colour variations, which this theme hides and
  whose palette it replaces, so the token resolves to nothing — the shorthand is
  invalid at computed-value time and `outline-style` falls back to its initial
  `none`. The ring was removed outright rather than recoloured; the reported
  `outline: none 3px` is that fallback, since `medium` computes to 3px.
* Both that rule and ours were (0,1,1), so source order alone decided the
  winner, and the environments disagreed: locally the child sheet prints after
  global styles and won, while in production Page Optimize concatenates the
  file-based sheets and hoists the bundle above the inline global styles, so the
  dead declaration won and `<button>` and `.wp-block-button__link` had no visible
  focus ring at all. Links were unaffected — Assembler's rule does not match
  them — which is why the site otherwise looked correct. Overriding Assembler's
  whole `styles.css` string from this theme.json would discard its
  disabled-button and WooCommerce rules with it, so the two selectors are lifted
  to (0,2,1) and win on specificity in either order.
* Verification: verify-header.js now replays Assembler's declaration last and
  re-asserts the ring, so the local run measures production's stylesheet order
  instead of assuming its own. A same-order check passes locally however fragile
  the ring is, which is how this reached production unseen — it was the first
  defect found by running the Chrome half against the live site rather than the
  dev site.

= 0.3.51 =
* Fix: the mobile menu button no longer draws its close glyph on top of the
  hamburger while the menu is shut. Both icons share one grid cell so exactly
  one may be visible, but the blanket `.hp-council-header svg { display: block }`
  rule (0,1,1) out-specified the unscoped hide rule (0,1,0), so the close icon
  stayed visible. Scoping the hide rule to the trigger raises it to (0,2,0).
  Only the closed state was affected — the expanded rules were already (0,2,1).
* Verification: verify-header.js now asserts that exactly one drawer-trigger
  icon is visible in each state, at every mobile width. The whole icon swap
  previously had no coverage, which is why a purely visual regression shipped.
* Fix: /how-this-was-built/ recovers three margins that had been silently dead
  for the same reason. `.hp-buildreport p` (0,1,1) out-specified the bare-class
  eyebrow, standfirst, and steps-intro rules (0,1,0), so their spacing never
  applied: measured 14px where 18px, 26px, and 0 were authored. The steps intro
  was the most visible, adding 14px on top of the 22px flex gap that is meant
  to own that spacing on its own.

= 0.3.50 =
* Design: ship the selected Condensed Council header with a calm, genuinely
  centred desktop bar, current-data Work evidence panel, Writing disclosure,
  restrained Digest signal, and non-displacing anchored search.
* Mobile: replace the nested overlay treatment with a flat, reachable drawer
  containing Work, Essays, AI Enablement, About, Job Placement Digest, Search,
  and an outlined Subscribe action across the exact 781/782 boundary.
* Data safety: track and verify menu 237 at
  `content/nav-snapshots/nav-237.html`, with repeatable export and guarded,
  idempotent apply commands instead of an untracked design-pull backup.
* Interaction: replace the two competing header listeners with the single
  router-safe `header-controller.js` owner for disclosures, drawer, search,
  focus restoration, history settlement, and reduced motion.
* Verification: `verify-header.js` covers eight widths from 320px through
  1440px, accessibility and interaction behavior, viewport containment, and
  state-specific screenshots.
* Accessibility: the header says where the visitor is again. All ten
  destinations carry `aria-current="page"`, and the Work and Writing items take
  `is-current` for any route beneath them — the retired core Navigation block
  supplied this, so rendering our own markup had dropped it.
* Accessibility: keyboard focus is no longer lost or stolen. Escape restores
  focus only when focus is inside the header, so a hover-opened panel cannot rip
  it away; the hover close stands down while focus is inside a panel; the drawer
  close rescues focus only when stranded, leaving a router-focused hash target
  alone; and tabbing past an open panel closes it.
* Fix: a pending hover close can no longer shut a panel that was just reopened,
  and a route swap that detaches the header no longer leaves stale state that
  swallowed the next drawer click.
* Fix: Work panel rows draw an inset focus ring, so the panel's rounded-corner
  clipping no longer cuts off its leading and trailing edges. The drawer
  contains its own overscroll, and the reduced-motion reset covers the closing
  and chosen-link states in CSS rather than relying on the controller's gate.
* Fix: the shortcode block re-renders in both branches, so stored header markup
  can never freeze the site name, the menu-237 model, or the URLs. A
  protocol-relative destination no longer collapses into an on-host 404.
* Fix: the two Council search fields keep the site's 3px gold-700 focus ring.
  The parent theme styles search inputs through an attribute selector, which
  outranked the site-wide rule and left them with a 1px parent outline.
* Fix: a long site name truncates instead of running into the centred nav. The
  brand name already had an ellipsis, but a flex item cannot shrink below its
  longest word without `min-width: 0`, so the ellipsis never engaged.
* Verification: the header root now reports `data-hp-header-source`, so a silent
  detach from menu 237 onto the identical-looking fallback is detectable. The
  suite also asserts the noscript navigation, the four Work status words and
  their fixed row anatomy, focus rings that are painted but clipped, and the
  four pinned sub-12px type exemptions. `verify-no-duplicate-pages.js`
  cross-checks the header's five hardcoded /work/ routes against the tracked
  Work snapshot.

= 0.3.49 =
* Accessibility: the /job-placement-digest/ operational-story title is h2 in the
  stored page body, so the rendered order is h1 -> h2 with no skipped level.
  This is the same failure /work/ had in 0.3.48 — 61e1140 promoted the heading
  in content/page-snapshots/job-placement-digest.html only, a mirror WordPress
  never reads, so production kept rendering h1 -> h3 for a further day.
* Accessibility: #resume-keyword-bank is a reachable jump target. It had been an
  empty aria-hidden div — hidden from the accessibility tree, so the "Read the
  verified artifacts" link scrolled to something assistive tech could not land
  on. The anchor now rides the section group, and router-scroll.js gives
  fragment targets a programmatic tabstop and moves focus to them, for native
  #hash navigation as well as router pushes.
* Content: the digest's closing action panel is restored. The stored body ended
  in bare buttons while patterns/job-placement-digest.php and
  scripts/verify-prominent-actions.js both expected .hp-digest-cta — the
  verifier had been failing on the missing panel, rail and heading.
* Content: the hero dateline carries the verification date (18 Jul) rather than
  the authoring date (13 Jul), which contradicted the screening notes below it.
* Mobile: halve the side padding on the digest's three bordered sections at
  <=600px. Their spacing-6 inline padding left a ~261px text column at 390px.

= 0.3.48 =
* Content identity: /work/ is one page again. The four-project, artifact-bearing
  ledger that had been stranded on the duplicate /work-2/ record is merged into
  the canonical page 13 — DJ Lee & Voices of Judah restored as a fourth entry,
  and an artifact row (the documented terminus of a Work entry) added to all
  four. Twelve artifact links where the page previously promised "a release, a
  diff, a live surface you can open yourself" and delivered none.
* Accessibility: the /work/ entry titles are h2 in the stored page body, so the
  rendered order is h1 -> h2 -> h2 -> h2 -> h2. The 0.3.34 promotion was reverted
  by the 2026-07-14 redesign and re-fixed in the snapshot layer only on
  2026-07-19; this is the first release in which the page body itself carries it.
* Duplicate pages retired: /work-2/, /about-2/, /ai-enablement-2/ and
  /privacy-policy-2/, plus the second AI Governance record that shared page 12's
  parent, slug and permalink and was therefore unreachable at any public URL.
  All four -2 bodies were hash-compared first: about-2 and ai-enablement-2 were
  byte-identical to their canonicals, the extra AI Governance record byte-
  identical to page 12, and privacy-policy-2 a strictly older revision.
* Summary chips now partition the ledger instead of miscounting it ("shipped:
  three live" survived the drop to three entries and then the return to four).
* Seed parity: patterns/work-index.php is regenerated from
  content/page-snapshots/work.html and is byte-identical to it. It had drifted
  for seventeen days — h3 headings, stale labels, and a v0.1.5 version string
  where the live page said v2.1.
* New gate: scripts/verify-no-duplicate-pages.js asserts no two published pages
  share a resolved permalink or a (parent, slug) tuple or a title, that every
  Work entry carries a real artifact link, that the homepage and /work/ list the
  same projects, and that the seed pattern matches the snapshot. Permalink
  comparison is the load-bearing one: a "-2" suffix heuristic would have found
  four of the five duplicate groups and missed the invisible one.
* Docs: corrected the 0.3.34 changelog claim about the work-index headings, and
  reconciled the composition contract with the heading level actually shipped.

= 0.3.47 =
* Typography: exclude components that set their own measure (.hp-lead) and
  wide/full-aligned children from the 68ch prose measure, so the constrained
  post-content rule no longer widens the case-study/demo lead from 46ch to 68ch.
* Docs: correct the readme block-template count (thirteen) and document the new
  archive.html / search.html / 404.html overrides; sharpen the 0.3.46 note on
  the 404's role CSS (it rides shared classes, not an error404 body class).
* Tooling: harden scripts/verify-typography.js — swallow the orphaned
  Page.loadEventFired rejection so a navigate failure can't abort a --report
  run, and skip SVG <text>/<tspan> in the general text pass (the dedicated
  getScreenCTM loop already measures them with the right effective size).
* Accessibility: add !important to the AI Enablement dateline override so it
  actually applies — WordPress emits the .has-ink-400-color preset class with
  !important, so the plain 0.3.46 rule silently no-oped and the dateline stayed
  at ink-400 (~3.9:1); it now renders at muted ink until the stored body is
  re-authored.

= 0.3.46 =
* Typography: make the 2xl–5xl heading presets fluid in theme.json
  (clamp 24–36 / 32–48 / 40–64 / 48–88px), so every template and stored
  page body inherits responsive headings from the token layer instead of
  page-scoped corrections; the custom.type mirrors carry the same clamps.
* Typography: apply the 68ch prose measure to narrative flow content
  (.hp-prose and constrained post content), raise the desktop nav and
  Subscribe pill from 13px to 15px Marcellus, give the Button primitive an
  explicit 17px/1.2 role (mirrored in theme.json styles.elements.button),
  and set the footer name's own 1.15 display leading with 13px links and
  colophon.
* Typography: enforce a floor for meaningful text — 17px for explanatory
  copy (About capability/impact/résumé bullets, work-entry descriptions,
  build-report takeaways, journal excerpts, work-index note), 15px for
  supporting notes (evidence meta and summaries, artifact-embed captions,
  About stat labels, the contact form's standalone privacy note), 13px for
  functional metadata (postcard/reader
  topic-and-date lines, proof links, footer colophon), and 12px minimum for
  the build report's label register (artifact/takeaway/stat/section
  labels, up from 10–11.5px) with eased tracking on long uppercase labels.
* Accessibility: darken the text.faint token to the ink-500 value so faint
  metadata clears WCAG AA on parchment surfaces; split the ring-card tint
  into decoration and text variables (river-200/gold-200 text on the dark
  cards); set the digest's marked ask in strong ink on its gold wash;
  re-point the AI Enablement stored dateline's ink-400 at muted ink; stop
  requesting synthetic bold (Marcellus 600 ring CTA and mono 700 signal
  values now use real weights, font-synthesis-weight none site-wide).
* Templates: add theme-owned archive.html, search.html, and 404.html with a
  proper H1 on each (query-title / "Page not found"), journal postcard
  results at 28px titles and 17px excerpts, a canonical search control, and
  role CSS keyed to the archive and search body classes (the 404 reuses the
  shared archive-hero and content-search classes); restyle Jetpack share/like
  headings as Marcellus labels.
* Typography: lower the journal masthead's mobile slope to a 44px floor
  (~47px at 390px) and give the homepage hero's governance status note its
  own supporting-copy role (17px muted, no longer a second lead).
* Tooling: add scripts/verify-typography.js — browser-based typography
  regression assertions (single H1, no heading skips, text floors, the
  prose measure, the four approved families, no synthetic Marcellus bold,
  bounded contrast spot checks, overflow at 320–1440px, effective SVG text
  size via getScreenCTM, and document.fonts checks) with --report and
  --source-only modes.
* Docs: record the typography-pass deltas in docs/design-system/INDEX.md,
  re-scope the stale design-sync plan note to 0.3.46, and add
  docs/typography-followups.md for the database-side work the theme cannot
  fix (duplicate pages, the Flavor Agent loop diagram, stored-body sizes).

= 0.3.45 =
* Typography: extend the self-hosted font isolation from 0.3.44 to the
  display (Cormorant Garamond), label (Marcellus), and mono (JetBrains Mono)
  families, so WordPress.com's same-named remote faces cannot join and win
  selection over the local subsets — the hero display face included.
* Performance: drop the decorative hero backdrop pseudo-element outright on
  mobile (it already painted nothing) instead of only nulling its image.
* Content: replace the stale "agent-skills PR #49" home-hero proof chip
  (the PR was closed unmerged) with the maintained agent-skills fork, and
  point the AI Leaders finalist eyebrow at the WordPress News story.
* Tooling: harden the dependency-free verifiers — runWp targets the
  configured install by construction, origin/site coherence is checked
  before any database-backed probe, the release-version sync check moved to
  the always-on verifier, and the subscribe runtime check seeds its option
  the way the endpoint does so it passes on fresh local installs.

= 0.3.44 =
* Performance: keep the decorative council hero bitmap out of the mobile
  critical path while preserving the gradient composition.
* Typography: isolate the self-hosted EB Garamond family from WordPress.com
  font declarations to avoid the larger remote face.

= 0.3.43 =
* Claim-accuracy pass over theme-owned copy (per the 2026-07-15 site claim
  audit). Corrections are limited to files this theme owns; database-owned page
  bodies (About, Work, AI Governance, Privacy, etc.) are out of the theme's
  reach and are unchanged here.
* How-this-was-built build report (patterns/how-this-was-built.php): rewrote the
  platform section and colophon for the current WordPress.com Business/Atomic
  deployment that runs Flavor Agent, dropping the self-hosted DigitalOcean
  narrative; replaced enforced "every pull" language with the documented
  /design-pull and recorded-delta workflow; corrected the Cormorant Garamond
  label; removed unsupported 14-component, six-template, and 11k-line counts;
  retained the indexed 19-component count; and dated the 30-commit build window.
* Footer and home hero: corrected the WordPress history line to "WordPress.org
  member since 2007 · professional WordPress work since 2012"; changed the hero
  proof and Flavor Agent trust claims to their supported wording; marked
  agent-skills PR #49 "open, unreviewed" with pending status; dated the Flavor
  Agent release; and updated the AI Leaders label to "2026 Finalist".
* Subscribe and contact: changed the unsupported fortnightly cadence to
  occasional across public copy, notification mail, privacy export/erase
  labels, and verification; disclosed that the contact form opens the visitor's
  email app and that the site does not receive or store its fields.
* Design-system docs (docs/design-system/README.md, readme.txt): softened the
  bare "1:1 / zero drift" assertions to "verified 1:1 at the 2026-06-20 pull,
  with theme-side deltas recorded in INDEX.md; re-diff before asserting parity",
  matching what INDEX.md already documents.
* Release verification now compares the current style.css Version and readme
  Stable tag/changelog dynamically while retaining the 0.3.42 history check.

= 0.3.42 =
* Prominent actions: added the opted-in hp-action-rail composition for the
  homepage and About heroes plus the front-page, Job Placement Digest, and
  Flavor Agent demo invitations. Compact header, form, icon, and specimen
  controls remain on the canonical Button primitive without the rail.
* Closing invitations: added the hp-action-panel is-closing parchment panel,
  fixed gold rule, Imladris emblem, and responsive full-width action stack.
  The Digest now ends with the approved "Bring me the problem behind the
  ticket" invitation instead of an uncontained button row.
* Accessibility: prominent actions keep the existing gold focus-visible
  treatment, guarantee 44px targets, and stack without horizontal overflow at
  600px and below.

= 0.3.41 =
* Job Placement Digest: implemented the canonical Imladris DS Digest design
  (claude.ai/design project b844cbab, templates/digest) as the
  /job-placement-digest/ route — a new page-job-placement-digest.html shell
  (44/72rem reading column), a job-placement-digest seed pattern, and the
  versioned page-body snapshot + content-ownership contract entry. The body is
  composed entirely from existing evidence components: gold-marked eyebrow,
  ProofBar target/aim/proof chips, insight Callout, an OperationalStory
  support-first path (12 → 01 → 02, target rung gilt-emphasised), and a
  "Verify the claims yourself" ArtifactRow closing on real, openable links.
* Page CSS (imladris-pages.css): digest hero flows into the pitch (no
  hairline), gold-200 eyebrow mark on radius-xs, mono dateline.
* Component CSS: artifact links now carry overflow-wrap:anywhere per the
  canonical DS ArtifactRow spec, so long single-token labels (repo slugs,
  file paths) break inside their cell instead of overflowing at narrow
  widths.
* Docs: recorded the canonical merged "Imladris Design System" project
  (b844cbab — the settlement of the journal ancestor 89e0d236 and the
  RetroBoards dialect c3e02753) in docs/design-system/; token settlement
  verified as a no-op for theme.json (it already carries the superset the
  settlement standardises on).

= 0.3.40 =
* Removed the discarded Plato Artifacts page and its dedicated block template,
  versioned page-body snapshot, and active content-ownership contract.
* Added a retired-page regression check so `plato-artifacts` cannot silently
  return as a draft or published page without failing theme verification.

= 0.3.39 =
* Token lockdown: added typography.customFontSize=false and
  spacing.customSpacingSize=false to theme.json so the block editor no longer
  offers custom font-size or custom spacing inputs — authors now choose only
  from the named type and spacing token scales, matching the already-locked
  color controls (custom/gradient/duotone plus default palette/gradients/
  duotone, all false). Editor settings only; no change to any rendered page.
* Templates: the wp:post-content block in the ai-enablement, work, and
  plato-artifacts page shells now carries align:full, so alignfull blocks in
  those page bodies reach the wide/full spine instead of the text column.

= 0.3.38 =
* Comprehensive review remediation across security, accessibility, content,
  verification, and docs.
* Security: moved the pre-redaction governance-artifact source zip out of the
  web docroot; redacted the admin username and internal hostname from the
  published Claude Code transcript + session artifact and refreshed the
  evidence-manifest hash (which had already drifted from the 0.3.30 password
  redaction and no longer matched the shipped transcript).
* Accessibility: the 32 decorative tag hashes on /about/ are aria-hidden now
  (DB body + about-resume seed, matching the imladris-tag component);
  /contact/'s h1→h3 jump fixed by promoting the subscribe title to h2 (order
  stays correct on home/single); callout icons/titles and the build report's
  small gold text moved from gold-700 (~3.9:1) to the AA text.accent token,
  the caution tone to feedback.warning, and the theme.json link hover color to
  text.accent; the avatar/badge/tag/icon-button reference patterns gained real
  roles (role="img" avatars, role="group" specimen rows).
* Journal: single.html's "Continue reading" section now hides when the related
  loop is empty (fail-open :has(), the hp-journal-more idiom) and its back link
  points at /essays/ — the actual posts index — instead of /; a found_posts
  filter keyed to the journal grid (queryId 11, seed offset 3) stops core
  pagination fabricating a trailing empty page at post counts like 7–9.
* Patterns: removed the invalid verticalAlignment:"baseline" layout attribute
  from about-resume (core ignores it; the About CSS owns baseline alignment);
  the uploads-hosted About portrait is cache-busted (?v= mtime — computed live
  in the seed, pinned in the DB body); quote-block dropped its literal cite
  dash (the About-scoped cite::before supplies it, ending the double-dash);
  subscribe title/input ids are per-render unique via wp_unique_id (the
  #subscribe anchor is unchanged); the ai-enablement seed + body fixed the
  "2-xl" fontSize slug (→ 2xl) and anchored the orphan Article-50 footnote
  marker in the text; how-this-was-built re-indented to tabs with its
  base-size specimen literal tokenized; ring-card dropped the unstyled
  cta-text hook.
* Tokens: the journal plate-frame border literal rgba(194,154,68,.16) is now
  color-mix() on gold-500; the artifact-embed's dark canvas and warm halo are
  documented one-off literals.
* Verification suite — all ten scripts now pass against a healthy theme:
  verify-performance-assets expects the eager LCP hero (fetchpriority="high",
  forbids loading="lazy" — it had still demanded the attribute 0.3.33 removed);
  verify-contact-form-styling expects the 0.3.34 focus ring (gold-700 border
  plus the 2px gold-700 outline), selects the subscribe email by class, and
  reports labeled failures when the form is missing; verify-design-system-
  specimen keeps its DB-content checks and skips rendered-page checks while
  post 79 is draft; verify-ring-cards-mobile asserts the three-ring section
  actually renders (no vacuous pass); verify-subscribe-endpoint no longer
  touches the production DB when HPERKINS_ORIGIN points elsewhere and cleans
  up its test filters/transient even on assert failure; verify-style-token-
  usage and verify-journal-polish resolve paths from the script location and
  honor the origin/path env vars; every CDP send() times out instead of
  hanging on a dropped response, and journal-polish's static regexes are
  bounded to their actual rule blocks.
* Hygiene: deleted ~19MB of unreferenced tracked imagery (image/image22/
  elfdoor/lothlorien/rivendell-night/wapuu-cirdan PNGs, the root elvenbook.png
  duplicate, and three unused Wapuu webp portraits — zero references in theme
  files or the DB); removed the stale docs/CLAUDE.md duplicate; corrected this
  readme's template inventory (ten templates incl. page-how-this-was-built),
  the retired wapuu-hero/wapuu-mark + body.home art-direction copy, the
  focus-ring color note (gold-700), the Ink ramp (ink-450), and the
  literal-values note (the mini-diagram is long gone); CLAUDE.md and
  docs/design-system/INDEX.md refreshed to the shipped architecture.

= 0.3.37 =
* Router scroll parity: the full-page Interactivity Router swaps pages without
  managing scroll at all, breaking parity with native loads in both directions
  — hash links never reached their target (both Subscribe pills →
  /contact/#subscribe left visitors at the top of the contact page) and plain
  navigations from a scrolled page opened the next page mid-document. New
  router-scroll.js hooks pushState (the nav-close-delight.js wrap pattern) and
  settles the scroll across the commit window: hash → its target (smooth as a
  reveal; instant under prefers-reduced-motion; a stale anchor falls back to
  top like a full load), changed path without a hash → top, instantly. Full
  loads, history traversal, and same-path pushes stay native/untouched.
* Anchor targets now reserve the sticky masthead's height ([id] {
  scroll-margin-top: spacing-10 } beside the sticky rule) so fragment scrolls
  — native loads included, which previously tucked the section top under the
  frosted bar — land clear of it. scroll-margin only affects scroll-into-view
  operations, so the blanket [id] coverage has no other rendering effect.

= 0.3.36 =
* Mobile subscribe restored (companion DB fix): a later Site Editor menu edit
  had deleted the trailing hp-nav-subscribe link from nav menu 237, leaving no
  subscribe affordance below 782px (the bar pill is hidden there by design;
  the drawer-foot pill CSS was matching nothing). Re-added the link verbatim
  from the redesign backup. CLAUDE.md now documents the dependency, the backup
  path, and a one-line survival check to run after any menu edit.
* Docs: the CLAUDE.md navigation note still described the pre-Council overlay
  search (an hp-nav-search block in menu 237); rewritten for the current
  contract — search is theme-owned in the header bar at every width, and the
  menu carries the nav links plus the Subscribe foot link only. Also noted the
  intra-theme.json drift edge: settings.custom repeats palette hexes as
  literals, so palette changes must update the custom twins in the same edit.
* Hygiene: removed the no-op load_child_theme_textdomain() call (no languages/
  directory has ever shipped); moved ink-450 into scale position in the
  theme.json palette so the picker lists the Ink ramp monotonically. Token
  values unchanged (design-system 1:1 preserved).

= 0.3.35 =
* Accessibility (WCAG AA / 1.4.11): the current-page and hover navigation
  underlines now use gold-700 (#9A7530, 3.69:1 on parchment) so the active-item
  state indicator clears the 3:1 non-text contrast threshold — matching the
  header search-field focus underline. The current-page underline was a solid
  gold-500 (#C29A44, 2.29:1); the hover underline was a fainter translucent
  gold-500 mix, so both improve.
* theme.json: pinned styles.elements h5/h6 font sizes (lg / md) so the lower
  headings ride the Imladris type scale instead of falling through to the
  Assembler parent's font-size slugs, which this child theme's scale no longer
  defines. Token vocabulary unchanged (design-system 1:1 preserved).
* Journal index (assets/imladris-pages.css): the "More from the journal" divider
  and the single-post featured layout now degrade fail-open on engines without
  :has() (divider stays visible; the lone lead uses one full-width column)
  instead of fail-closed (missing divider / empty right rail).
* Robustness & hygiene: dropped the stale --hp-neutral-200 entry from
  verify-style-token-usage.js's runtime allow-list (it had masked reintroduction
  of that removed token); guarded the editor enqueue of imladris-pages.css with
  file_exists to match the frontend path; corrected the radius--lg fallback
  literal (14px -> 12px) to match the token; and removed the borderWidth token
  group from the readme vocabulary (it was dropped from theme.json in 0.3.34).

= 0.3.34 =
* Accessibility (WCAG AA): darkened the gold/amber text tokens so accent
  eyebrows/labels/badges and the "review"/warning status words clear 4.5:1 on
  parchment (text.accent, feedback.warning, on.review). Restored the gold
  focus-visible ring on the contact inputs, textarea, and header search (the
  latter now a 2px gold-700 underline >=3:1), and raised form-field borders to
  >=3:1 (the subscribe email input was effectively borderless at rest).
* Performance: the front-page hero backdrop now serves elvenbook.webp (~131KB)
  via image-set() instead of the 2.5MB PNG, mirroring the footer backdrop, and
  the Cormorant display face is preloaded on the front page. Pruned ~19MB of
  unreferenced source imagery from the theme package.
* single.html: the "Continue reading" related loop no longer lists the current
  post (excluded server-side via query_loop_block_query_vars on queryId 12), and
  its section heading is now h2. work-index pattern headings promoted h3 -> h2.
  (Superseded: the 2026-07-14 "leaner ledger" redesign reverted those pattern
  headings to h3 and dropped an entry. Both were restored in 0.3.48.)
* Tokens: promoted the four hand-tuned ring/footer scrim colors into theme.json
  (custom.scrim.*) so no raw hex bypasses the token layer; named the faint text
  color (ink-450); type.* shorthands now reference the preset font-family vars;
  dropped the unused borderWidth token group; removed dead var() fallbacks
  (#fff, --hp-neutral-200, the nonexistent "contrast" preset).
* Robustness: subscribe recipient is filterable
  (hperkins_tokens_subscribe_notify_email), email validation runs before the
  rate-limit budget is spent, form-enhance merges rather than clobbers
  aria-describedby, and nav-close can no longer latch its guard on a throw.

= 0.3.33 =
* form-enhance.js rebuilt on document-level delegation: the contact form's
  mailto handoff + confirmation panel and both forms' inline email validation
  now survive Interactivity Router client navigations. The router swaps the
  whole body without re-running scripts, so the old element-bound listeners
  died on the first client-side navigation (reproduced on /contact/ after a
  client swap, fixed, re-verified).
* Homepage hero Wapuu loads eagerly with fetchpriority="high" — it is the LCP
  candidate on desktop and mobile, and loading="lazy" was delaying it. The
  below-the-fold ring-card backdrops stay lazy.
* functions.php no longer computes/injects --hp-wapuu-mark-url: nothing has
  consumed it since the star SVG emblem replaced the header's wapuu mark.
* imladris-pages.css: repointed four phantom var(--wp--custom--text--default)
  references to the real text--body token (rendered color unchanged), and the
  artifact-embed frame keeps its warm halo as a documented one-off literal
  instead of referencing the nonexistent shadow--raised token.
* style.css: fixed two var(--dur-fast, 140ms) typos to
  var(--wp--custom--dur--fast) so the project-card hover transition reads the
  real duration token (same 140ms).

= 0.3.32 =
* Posts index (/essays/) redesigned to the evolved "Posts Page" design (claude.ai/design
  project 65d2dbc2 "WordPress portfolio posts template", which imports the Imladris DS
  SiteHeader/Subscribe/SiteFooter). The featured area becomes an asymmetric composition —
  a photo lead beside two stacked plate secondaries — driven by CSS :has() so it degrades
  by post count; adds a "More from the journal" hairline divider (auto-hidden when the grid
  is empty), a plate-cover fallback (gold compass-star over the twilight gradient) for
  image-less posts, the topic filter restyled from pills to an underline bar, and styled
  Newer/Older pagination. The "Three Rings of governance" section is dropped from the index
  to match the design (front-page.html still carries it). templates/home.html +
  assets/imladris-pages.css only; no theme.json change.

= 0.3.31 =
* AI Leaders credential surfaced as verifiable proof across three surfaces. The
  homepage hero eyebrow is now a link — "AI Leaders — First Cohort Finalist" to
  the program showcase (aileaderswp.blog, which lists the portfolio) — with a new
  hairline-rule eyebrow-link style so it keeps the lapidary caps instead of going
  link-blue (patterns/wapuu-home-hero.php, style.css). /about/ (DB page 6) gains
  an "AI Leaders, first cohort" section — method, not badge — tied to the evidence
  board above it. /ai-enablement/ (DB page 175) links its existing "AI Leaders"
  mention to the showcase for consistency. DB page bodies +
  content/page-snapshots/{about,ai-enablement}.html; style.css version bump for
  the eyebrow-link rule.

= 0.3.30 =
* /work/flavor-agent/demo/ embedded artifact — security hardening. Redacted a
  demo admin password that had been published in the Claude Code session
  artifact (both Formatted and Raw views) and the companion transcript; the
  WP-CLI line now reads --user_pass='[redacted]'. Hardened the artifact iframe
  sandbox: dropped allow-same-origin so the same-origin document can no longer
  script the parent page (the frame is now an opaque origin — verified that
  parent.document is unreachable), and added allow="fullscreen" so present
  mode still works. Bumped the page-11 iframe cache-buster to the redacted
  asset's mtime. Artifact assets (assets/artifacts/flavor-agent-governance/),
  DB page 11 post_content, and the page-snapshots/work-flavor-agent-demo.html
  mirror; no theme.json or style.css/CSS change beyond the version bump.

= 0.3.29 =
* /work/flavor-agent/demo/ embedded artifact — the three oversized ASCII
  box-drawing tables in the Claude Code session (one up to 252 chars wide) were
  breaking the terminal's reading sequence and forcing horizontal scroll. The
  formatted view now renders them as semantic, wrapping HTML tables
  (.hp-term-table) that fit the column, keep the terminal palette, and collapse
  to stacked label/value rows on phones; the long prose column wraps instead of
  scrolling. The Raw view and companion transcript still carry the original
  box-drawing ASCII byte-for-byte, and the decorative footer rule now clips
  rather than scrolling. Artifact asset only
  (assets/artifacts/flavor-agent-governance/), plus the iframe cache-buster on
  page 11; no theme.json or style.css/CSS change beyond the version bump.

= 0.3.28 =
* /ai-enablement/ responsive + rhythm polish (no copy or links changed). Mobile
  type scale: the hero dek and section H2s now clamp down on narrow viewports
  (capped at the 2-xl / 3-xl tokens, page-scoped to .hp-aie-template) so they
  stop overpowering the essay on phones, mirroring the hero H1 that already
  clamps. The governance callout stacks its icon/body and tightens its inset
  below 600px. The maturity proof bar is centered as a row on desktop (a coda
  to the centered rings) and stacks on phones; chip anatomy unchanged. The deck
  download in the Portfolio-artifact register is marked as the primary action
  (solid action-colored underline + a download glyph). The thesis pull-quote
  ("Real impact is whatever survives an external instrument") gets a centered,
  hairline-framed treatment for presence through space — without breaking the
  body-scale quote ceiling. Pattern markup + pages CSS + style.css version; no
  theme.json change.

= 0.3.27 =
* /work/flavor-agent/demo/ now leads with the embedded Claude Code governed-AI
  session artifact ("Governed AI + Human Approval + Attestation"). The
  self-contained interactive document (Formatted/Raw toggle, present mode, and
  the five human-admin evidence screenshots) ships as a static theme asset under
  assets/artifacts/flavor-agent-governance/ and is loaded in an isolated,
  sandboxed iframe so its dark CSS/JS never collides with the parchment theme.
  Adds the .hp-artifact-embed frame/caption styling to assets/imladris-pages.css;
  the demo page's existing in-editor/MCP walkthrough is trimmed to a "What the
  session shows" summary beneath the embed, with the DB-owned source tracked at
  `content/page-snapshots/work-flavor-agent-demo.html`. Page-content snapshot +
  asset + pages CSS; no theme.json change.

= 0.3.26 =
* /ai-enablement/ essay — line edits for density and rhythm (no meaning or
  links changed). The intro splits the trust-model sentence and turns the
  exposure/governance/attestation triple into a "Three moves recur" list, then
  recasts the three-rings synthesis as two sentences ("That synthesis is
  mine"). In Attest, the Durable-credentials line breaks into two sentences. In
  the closing, the "targets that move faster" passage is rebuilt around "match
  the source to the job" with the living-roadmaps clause split off. Prose only,
  in patterns/ai-enablement.php; no theme.json or style.css change.

= 0.3.25 =
* /how-this-was-built/ reframed as a builder's field guide. The page keeps the
  real build of the site as the worked example but now teaches the method: each
  section gains a "For your build" takeaway, the theme/token and build-loop
  sections gain numbered "do it yourself" steps, and a closing checklist distills
  a design system that won't drift. Tools used are linked inline to their official
  first-party documentation (WordPress block-theme / theme.json / patterns /
  templates / child-theme handbooks and the theme.json reference, WP-CLI wp
  server, WordPress Studio, Playwright, DigitalOcean Droplets, the Assembler
  parent, and Claude Design's get-started and design-system articles). New scoped
  components in assets/imladris-pages.css (.hp-buildreport__takeaway,
  __takeaway-label, __steps-intro, __checklist; the __steps grid was already
  defined). No theme.json change.

= 0.3.24 =
* Council masthead — mobile navigation + search UX (completes the 0.3.23 desktop
  pass). Search is decoupled from the menu: the bar's search icon now opens a
  full-width row that drops below the bar (its own home) instead of living inside
  the nav overlay. The mobile overlay is restyled into the Council drawer — a
  full-width parchment sheet glued to the bar's underside (twilight scrim, soft
  shadow) with real accordions: the submenu chevrons are re-shown and each section
  stays collapsed until tapped (rotating chevron; nested Work / Flavor Agent Hub
  indents), gated on :has() so browsers without it keep core's always-expanded
  list. Subscribe moves to the drawer foot as a full-width evergreen CTA, so the
  mobile bar reads lockup + search + menu. Search and the drawer are mutually
  exclusive (assets/js/header-search.js, via core's own controls). Navigation menu
  237: dropped the in-overlay search block, added a hp-nav-subscribe link. All
  against tokens that already resolve to theme.json (no theme.json change).

= 0.3.23 =
* Header + hero redesign (Imladris "Council Masthead" direction, pulled from the
  Header & navigation redesign design project). The masthead is now a frosted,
  sticky bar on every page with a star-emblem + Site Title lockup, an optically
  centered nav, a click-to-expand inline search (gold underline; Escape and
  outside-click collapse via assets/js/header-search.js), and an evergreen
  Subscribe pill. Dropped the old home-only "merge the bar into the hero grid"
  treatment. The homepage hero is re-tuned to the Council two-column layout and
  re-composed on mobile so the Wapuu rides on top over a contained halo, with
  centered copy, compact wrapping status chips, and full-width stacked CTAs. Real
  content and the editable core Navigation/Search blocks are preserved; the design
  reuses tokens that already resolve 1:1 to theme.json (no theme.json change).

= 0.3.22 =
* Portfolio review remediation: pointed the Work index `PR #501` artifact link at
  the specific pull request (`WordPress/ai/pull/501`) instead of the generic pulls
  list; normalized the About signal strip to `WordPress since 2012` to match the
  footer (clearing the `Since 2007` year inconsistency); and added an explicit,
  operational bias statement to the AI Enablement ethics stance (consequential
  output stays review-first, no claimed automated bias detection).

= 0.3.21 =
* Mobile performance: added WebP variants for homepage/footer artwork, lazy
  loaded the below-fold ring-card images, gave the hero mascot intrinsic
  dimensions, skipped the page-layout CSS on the front page, and set theme font
  faces to `fontDisplay: swap`.

= 0.3.20 =
* Subscribe privacy hygiene: registered WordPress personal data export and erase
  callbacks for the bounded hperkins_tokens_subscribe_requests option, and removed
  the unreachable already-requested display status now that duplicate requests
  intentionally resolve to the generic success message.
* Cleanup: removed the legacy .hp-proof-product CSS selector after the
  /design-system specimen moved to the live Product Hero pattern, and gitignored
  local source/draft docs that are not runtime theme assets.

= 0.3.19 =
* Homepage Work summary: bumped the entry description + footer from XS (13px) to
  SM (15px) so the teaser reads comfortably. Base .hp-work rules only; the /work/
  index template (descriptions at MD/19px) is unaffected.
* /how-this-was-built/: build-report body paragraphs now fill the full content
  column (dropped the 66ch cap) to align with the Palette/Typography grid, which
  also gains hairline rules above and below. Scoped .hp-buildreport CSS in
  assets/imladris-pages.css.

= 0.3.18 =
* New /how-this-was-built/ page: a public "build report" telling the making-of
  hperkins.blog end to end — the premise, the WordPress.com -> DigitalOcean
  droplet platform move (forced by Flavor Agent's plugin needs), the two design
  systems (tokens-kit -> Imladris), the theme.json source of truth, the content
  system, the verify-first build loop, the git-evidenced build, and the
  discipline. Authored from the Imladris design project (docs/imladris.html) as a
  parchment "dossier", ported to the theme idiom: every hardcoded hex re-pointed
  to theme tokens, self-hosted fonts (no Google Fonts), no React/bundle. Ships as
  patterns/how-this-was-built.php + templates/page-how-this-was-built.html (shadow
  template, binds by slug) with scoped .hp-buildreport layout CSS in
  assets/imladris-pages.css. theme.json unchanged.
* Footer: added a "How this site was built" link on the colophon line (AA
  gold-underline treatment) pointing at the new page.

= 0.3.17 =
* Contact polish: collapsed the message form to a single readable column on the
  hero's content measure (the former two-up grid left a tall empty rail beside
  the form on desktop); the direct-channels icons now sit in a hairline-ruled
  row beneath the form instead of a sparse sidebar. The newsletter block now uses
  box-sizing:border-box on /contact/ so its padded width lands on the form's
  44rem spine instead of bleeding ~40px wider on each side (scoped; the same
  block on home/single is unchanged).
* Accessibility: darkened the text--faint token (#6E7A6E -> #656E64) so caption,
  helper, and hint text clears WCAG AA (4.5:1) on parchment everywhere it is
  used; gave the contact inputs and message textarea a themed AA placeholder
  (the faint token, opacity:1) in place of the browser-default grey.
* Contact form detail: matched the message textarea's text inset to the
  .hp-input control (spacing-3) so it lines up with the fields above it.

= 0.3.16 =
* Subscribe endpoint hardening: added a public nonce, per-IP transient
  throttling, bounded non-autoloaded request storage, optimistic option updates,
  and generic received messaging for duplicate requests. Server status copy now
  uses .hp-subscribe__status so JS validation helpers can clear independently.
* Product Hero / Operational Story cleanup: corrected the generated type token
  to --wp--custom--type--h-4, gave .hp-product-hero__board an owned layout rule,
  removed the unused Operational Story signal-kind selector, and let the panel
  header wrap on narrow screens.
* Design-system specimen guard: migrated the DB-backed /design-system specimen
  to the live Product Hero and Operational Story filesystem patterns and added a
  verifier that fails if legacy inline specimen markup returns.

= 0.3.15 =
* Product Hero: rebuilt patterns/proof-product.php and added .hp-product-hero CSS
  to match the design-system ProductHero component (a compact evidence board —
  live/source rows — paired with framed product media). Deployed it on the
  DJ Lee & Voices of Judah case study, where the desktop homepage shot now opens
  as proof + product instead of a bare captioned image; the phone shot stays
  inline. At 0.3.15 the older .hp-proof-product treatment was retained for the
  /design-system specimen; it is migrated in 0.3.16. theme.json unchanged.

= 0.3.14 =
* Operational Story: rebuilt patterns/operational-story.php and its CSS to match
  the design-system OperationalStory component 1:1 — a single bordered card in
  three bands (header · feature-state/operational-checks panel · numbered path
  index with a gilt-emphasised unifying node). Replaces the earlier drifted
  two-column treatment (a fabricated hp-mini-diagram and a detached signal
  strip that exist in no component). The Flavor Agent demo page references the
  pattern, so it now renders the real component with no content edit; the
  governance page was already composed from real components. theme.json
  unchanged (design-system 1:1 preserved).

= 0.3.13 =
* Width system: consolidated the centered prose widths onto the two Imladris
  measure tokens. Leads, standfirsts, and forms now resolve from
  --wp--custom--measure--narrow (46ch) and descriptive copy from
  --measure--prose (68ch), replacing eight drifting ch/rem literals; the shared
  .hp-lead is capped at the narrow measure. Removed the per-template inner
  contentSize overrides on the home masthead (64ch), the Three Rings intro
  (56ch), and the ai-enablement ringsmap-head (46ch) / maturity (44rem) groups,
  so their headings ride the 44rem reading spine. theme.json unchanged
  (design-system 1:1 preserved).
* Content: added a footer Resume PDF link, relabeled an About experience date,
  and un-linked a superseded reference in the AI-enablement footnote.

= 0.3.12 =
* Site Editor contract: hide inherited Assembler style variations from the
  hperkins-tokens global-styles variations endpoint so the editor cannot switch
  the child theme onto parent palettes or font pairings that bypass the locked
  theme.json token vocabulary; also stop the editor/admin styles pass from
  printing inherited variation font faces that are no longer selectable, and
  strip Assembler's inherited section block styles from global-styles and
  block-type REST responses.

= 0.3.11 =
* Accessibility + portability follow-ups from the theme review:
  - Subscribe form (form-enhance.js): an invalid email now shows the same
    worded, announced error as the contact form (setError/clearError +
    role="alert" + aria-describedby) instead of silently blocking submit. New
    style.css rules render that helper full-width and legible (amber) on the
    dark twilight panel, with a matching error border.
  - imladris-input pattern: the error-state field gains aria-invalid="true" and
    an aria-describedby link to its helper text, and the email field's helper is
    linked too, so assistive tech announces the error instead of a normal field.
  - about-resume pattern: the avatar image and the two PDF resume links now use
    root-relative /wp-content/uploads/... paths instead of the absolute
    production hostname, so they resolve on local / staging / migration hosts
    (the external hperkins.com interactive resume link is unchanged).
  - Release surface: page-plato-artifacts.html is now part of the versioned
    template inventory instead of a live-only file, and the template list names
    the page-slug archive explicitly.

= 0.3.10 =
* Work page type regression: style.css referenced var(--wp--custom--type--h1)
  and --h4, but WordPress kebab-cases the slug at the letter/digit boundary, so
  the generated custom properties are --type--h-1 / --h-4. The no-fallback var()
  collapsed the `font` shorthand on the /work/ hero <h1> and every work-entry
  title, dropping them to UA fonts. Pointed both rules at the correct --h-1 / --h-4
  names and added literal Cormorant Garamond fallbacks so future kebab drift
  degrades instead of disappearing. Version bumped so the fix ships under a fresh
  cache key.
* Contact-form accessibility (form-enhance.js): inline validation errors now wire
  aria-describedby from the input to the error helper and announce via role="alert"
  (cleared on input); on submit-success and "Compose another", focus moves to the
  confirmation panel / first field instead of being dropped to <body>.

= 0.3.9 =
* Mobile header cache-bust: the SiteHeader fidelity passes iterated style.css
  repeatedly while the Version header stayed at 0.3.8, so style.css?ver=0.3.8
  became a moving target — clients that had cached an earlier 0.3.8 kept the
  pre-fix masthead (mark visible, action cluster hidden, nav wrapped to a second
  row) and so the mobile header no longer matched desktop. Bumped the Version so
  the finalized header CSS ships under a fresh cache key; the rules themselves
  were already correct (verified overflow-free with 44px targets at 1440/375/320,
  and the in-nav search field correctly hidden on desktop).

= 0.3.8 =
* Ring cards: restored a phone-width flow for the full-bleed Expose / Govern /
  Attest cards so the ring label no longer overlaps the action heading, body
  copy scales down to the mobile text token, and linked CTA rows keep a 44px
  touch target.
* Contact and subscribe: restored the no-JS mailto fallbacks, kept the JS
  confirmation flow, and standardized the public contact address on
  htperkins@gmail.com.

= 0.3.7 =
* Mobile header: the desktop search + Subscribe action cluster now reliably hides
  below 781px. WordPress layout support emits a single-class display:flex for the
  flex group, which tied the equal-specificity hide rule and won on source order,
  so the cluster stayed visible at 320px and overlapped the nav sheet; the hide is
  now scoped to .hp-site-header and wins regardless of source order.
* theme.json: restored the locked color contract — defaultDuotone, custom,
  customGradient, and customDuotone are false, so the editor exposes only the
  named palette (the Imladris migration had reopened the custom pickers).
* Tracked the contact/subscribe progressive-enhancement script
  assets/js/form-enhance.js that functions.php enqueues.
* Docs: refreshed the readme token vocabulary and template list to the Imladris
  design system and marked the migration hand-off note completed.

= 0.3.0–0.3.6 — Imladris design system =
* Re-skinned the theme to the Imladris design system — a Rivendell-inspired
  parchment / evergreen / mallorn-gold serif editorial language with a
  status-verified evidence layer — authored at the theme.json token level so the
  tokens round-trip 1:1 with the design system.
* theme.json: adopted the Imladris palette, the Cormorant Garamond / EB Garamond /
  Marcellus / JetBrains Mono families, the 2xs–5xl type scale, the 1–16 spacing
  slots, the 44/72rem layout, and the settings.custom design-token tree; style.css
  re-pointed its --hp-* alias layer onto the new tokens.
* Self-hosted the four font families as theme.json @font-face (latin variable
  woff2) and added the Imladris imagery (Wapuu, Ring-bearers, ring badges, valley
  and twilight art).
* Rebuilt parts/footer.html as the twilight footer plate; added the imladris-*
  component patterns (RingCard, Callout, Subscribe, and the page patterns) and the
  page/blog templates (front-page, home, single, page-about, page-ai-enablement,
  page-contact, page-case-study).

= 0.2.9 =
* Aligned the mobile navigation close-on-tap source comments and implementation
  plan with the shipped router-aware behavior. No runtime behavior changed.

= 0.2.2 =
* Tightened the editor stylesheet rewrite so it removes only Assembler's fragile
  relative style.css entry, preserving any editor styles another integration
  already registered, while still loading the parent and child sheets once each.
* Replaced the hardcoded Assembler slug in the parent stylesheet cache-buster
  with the active parent template slug.
* Fully locked the color UI by disabling custom gradients and custom duotones in
  addition to the palette and custom color picker.
* Moved the recurring grid pitch, grid tint, and elevation recipes into
  theme.json custom tokens and aliased them from style.css.
* Added restrained link/button transitions, now covered by the existing
  prefers-reduced-motion override.
* Gave the footer's component hooks real rules for spacing, link treatment, and
  tagline measure.
* Optimized the Wapuu mark and hero derivatives and switched the header mark to
  filemtime-based cache-busting, matching the homepage hero image.
* Added a child-theme screenshot for Appearance → Themes.

= 0.2.1 =
* Editor stylesheet parity: the child theme now rewrites the editor stylesheet
  list after Assembler's setup runs, so the block editor loads the Assembler
  parent stylesheet once and the HPerkins Tokens child stylesheet once.
* Mobile screenshot frames: phone-framed product screenshots now shrink inside
  narrow content columns, including their padding and border, so the DJ Lee
  booking screenshot no longer creates horizontal scroll on 320px phones.

= 0.2.0 =
* Heading scale ownership: pinned styles.elements.h1–h6 font sizes in theme.json
  so headings follow this theme's type scale (h1 x-large, h2 large, h3 medium,
  h4 small, h5 xs, h6 micro). The sizes were previously inherited from the
  Assembler parent, which left a bare h3 rendering at body size and an h4 larger
  than h3 (an off-token clamp). Headings now have a real h1 > h2 > body ladder by
  default, and authors no longer set per-block fontSize to compensate.
* Heading hygiene: the case-study and governance pages opened their sections with
  h3, skipping h2 and breaking the document outline; those section headings are
  now h2. The redundant inline fontSize overrides were removed across pages, so
  heading size comes from the tokens, not inline values.
* Promoted the case-study lead into one place: a leading-lead token (1.45), the
  .hp-lead component class, and a "Case-study lead" pattern. The four hand-styled
  lead paragraphs — plus the Flavor Agent hub and demo leads that had drifted off
  the treatment — now share it, and the 1.45 leading lives in a single token.
* Naming: the Codex provider is now "Scriptorium AI Provider for Codex"
  consistently across the page title, the h1, the navigation, and both Work
  ledgers (it had appeared under four different names).
* Housekeeping: unpublished the leftover Nav preview render-check page and the
  default Hello World post so they leave the public site.

= 0.1.8 =
* Closed the remaining token-discipline gaps so the CSS no longer carries
  parallel hardcoded scales alongside theme.json. Named tokens were added under
  settings.custom and aliased to --hp-* in style.css for: the status left-rule
  widths (rule-chip/entry/evidence/quote), border radii
  (radius-chip/register/tile/panel/card/frame/phone/pill), heading/emphasis
  weights (weight-title 650 / weight-strong 700), the two intra-block label gaps
  (gap-xs 0.25rem / gap-sm 0.35rem), and the uppercase mono-label tracking
  (tracking-label). The heading element's fontWeight now references
  weight-title, so 650 lives in exactly one place.
* Routed the two sub-slot margins that duplicated existing spacing slots
  (0.5rem, 0.75rem) through spacing 10 and 20, normalized the three drifting
  mono-label tracking values (0.06/0.07/0.08em) to one tracking-label token, and
  replaced the off-scale 0.875rem artifact-link size with the small preset.
* Softened the "one rule width" wording in the description: the left rule is a
  fixed width PER component (a named token), and state still only swaps its
  color. Documented the new geometry/weight/rhythm tokens in the vocabulary.
* Accessibility: darkened the status-review token (#b06a08 → #a56408) so white
  text on the review fill clears WCAG AA (was 4.28:1, now 4.7:1). This was the
  only token whose white-on-fill label failed; the in-review accent rule and dot
  are a touch crisper as a consequence. Updated the documented hex and the
  Design Tokens swatch label to match.
* Editor parity, for real this time: the child now registers BOTH the parent and
  child stylesheets with add_editor_style (parent by absolute URL, child by
  relative path). The parent's lone add_editor_style('style.css') resolves
  child-first, so it had only ever loaded the child sheet — the Assembler base
  never reached the editor, despite the 0.1.2 note. Patterns now preview as they
  render. Corrected the misleading code comment.
* Gave the provisional artifact marker a deliberate treatment: .hp-artifact__link
  em now renders muted, so a placeholder like "pre-tag" reads as an owed,
  unverified slot distinct from a real action-colored link instead of incidental
  body italic. The :empty em-dash fallback stays for genuinely empty slots.
* Completed the Design Tokens reference and the readme token list: added the
  micro (0.6875rem) preset row/entry that both had omitted, so they fully mirror
  theme.json's seven font sizes.

= 0.1.7 =
* Added quiet footer links to the Design System and Design Tokens reference
  pages, so the theme's own documentation is reachable without crowding the
  primary navigation.

= 0.1.6 =
* Gave real styles to three component hooks that previously rendered on browser
  defaults: the case-study spoke cross-link (.hp-spoke-nav), and the Design
  Tokens reference tiles (.hp-token-swatches / .hp-swatch) and type-scale samples
  (.hp-type-samples). The near-white swatches now carry a hairline edge so they
  stay visible on the page background.

= 0.1.5 =
* Made the mono family part of the base proof-bar chip anatomy, so status chips
  render as machine-set labels even where the block markup omits the mono font
  class (fixes the Wapuu homepage hero signal chips, which were rendering in the
  body font).

= 0.1.4 =
* Tightened editor-style inheritance so the parent and child styles load once in
  parent-then-child order.
* Added the micro font-size preset and routed recurring mono labels through it.
* Strengthened title-link underlines, darkened empty artifact markers, and
  keyed the button focus color swap to :focus-visible.
* Documented pattern heading composition and placeholder-link publishing rules.

= 0.1.3 =
* Added the custom HPerkins Wapuu asset.
* Added a compact Wapuu mark to the global header.
* Added the Wapuu homepage hero pattern for the large portfolio landing
  treatment.
* Documented Wapuu usage rules for large homepage artwork and quieter repeated
  header contexts.

= 0.1.2 =
* Editor parity: the Assembler parent stylesheet is now loaded in the block
  editor as well (previously child-only), so patterns preview as they render on
  the front end.
* Accessibility: evidence-board rows carry the proof-bar's filled vs. hollow
  status dot, so merged vs. review/pending no longer relies on the left-rule
  color alone.
* Accessibility: pattern section and entry titles render as real headings
  (h2/h3) instead of styled paragraphs, restoring the document outline for
  assistive technology and search engines.
* Removed the inherited Inter font preload (it 404'd under this child theme,
  which ships no fonts and renders in system type).
* Token hygiene: dropped the hardcoded hex fallbacks that duplicated the
  surface-merged / surface-review tokens, removed the unused surface-pending
  token, and replaced literal rgba() shadow and overlay colors with
  token-derived color-mix() values.
* Added a solid underline fallback before color-mix() on links, so the
  underline affordance survives on engines without color-mix support.
* Documentation: clarified that Proof + Product and Operational Story ship an
  author-filled media slot, and noted the bundled starter screenshots in
  assets/screenshots/.
* Corrected the stylesheet header version so it matches the shipped feature set
  and the CSS cache-buster.

= 0.1.1 =
* Added portfolio operations art primitives.
* Added Evidence First, Proof + Product, and Operational Story patterns.
* Documented the hybrid portfolio treatment rules for non-visual work, visual
  product work, and the Flavor Agent featured demonstration.

= 0.1.0 =
* Initial release.
* theme.json token system: semantic status palette, one action color on a
  neutral base, named type scale and spacing slots.
* Patterns: proof bar, artifact row, client pull-quote, work entry.
* Header and footer template parts overriding the Assembler parent.
* Single mono font family and single hairline color token (no duplicate slugs).
* Keyboard focus ring on links as well as buttons.

== Copyright ==

HPerkins Tokens WordPress Theme, (C) 2026 Henry Perkins
HPerkins Tokens is distributed under the terms of the GNU GPL.

This theme is a derivative of the Assembler theme:
Assembler WordPress Theme, (C) 2023 Automattic — distributed under the GNU GPL.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
