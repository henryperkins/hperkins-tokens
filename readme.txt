=== HPerkins Tokens ===
Contributors: Henry Perkins
Requires at least: 6.6
Tested up to: 7.0
Requires PHP: 8.0
Stable tag: 0.3.36
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
front-page.html, home.html, single.html, page-about.html,
page-ai-enablement.html, page-contact.html, page-work.html,
page-plato-artifacts.html, and page-case-study.html as additive block templates
(each detailed under Template overrides below); and provides its own token
vocabulary, component CSS, and patterns. Unspecified page/post templates are
inherited from the Assembler parent. The Assembler parent theme must be
installed for this theme to activate.

= Token vocabulary =

The Imladris token layer lives in theme.json and round-trips 1:1 with the design
system; style.css aliases onto the generated --wp--preset--* / --wp--custom--*
variables rather than duplicating any hex.

Color palette (settings.color.palette — defaultPalette, defaultGradients,
defaultDuotone, custom, customGradient, and customDuotone are all false, so the
stock swatches and every custom color, gradient, and duotone picker are off and
authors choose only from these named tokens):

* Parchment — parchment-50 #FAF6EC / parchment-100 #F5EFE1 /
  parchment-200 #ECE4D2 / parchment-300 #DED2B8 (grounds, raised surfaces,
  sunken tints, hairlines)
* Mist — mist-100 #EEF1ED / mist-200 #DCE3DD (cool neutral surface and soft
  border)
* Ink — ink-900 #1B231D / ink-700 #313B33 / ink-500 #515C52 / ink-400 #6E7A6E /
  ink-300 #94A095 (text, strong to disabled)
* Evergreen (brand) — green-900 #1C2E24 … green-050 #EDF3ED; green-700 #2E4A3A is
  the brand and link color, green-050 the merged-chip tint
* River (links / info) — river-900 #1E3040 … river-100 #DCE9F0; the Bruinen blue
  used for artifact links
* Gold (accent) — gold-700 #9A7530 … gold-100 #F4EBCF; gold-500 #C29A44 is the
  accent and the 3px focus ring
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

The 1px hairline rules and the mini-diagram bar percentages are the only visual
values intentionally left literal; everything else resolves from a named token.

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
is composed under a section heading; insert a section heading before the pattern
when a page does not already provide one.

Starter pattern links use href="#" placeholders. Replace them with live release,
pull request, page, review, or documentation URLs before publishing the pattern
unchanged.

= Template overrides =

The child theme owns nine block templates (page-case-study is also registered as
a selectable "Case study" template in theme.json; the others map by the WordPress
template hierarchy):

* front-page.html — the portfolio landing shell; renders the theme-owned Wapuu
  hero, then the stored Home page body via `wp:post-content`, then the
  theme-owned Three Rings framework. The current live middle section is
  versioned at `content/page-snapshots/front-page.html`.
* home.html — the journal index: masthead, category filter, a featured essay,
  then a grid of recent essay postcards.
* single.html — the essay reader: a twilight cover hero (title, standfirst, meta)
  over constrained prose, post tags, the subscribe block, and a "Continue
  reading" related-posts grid.
* page-about.html — wraps the stored About page content in the narrow/wide About
  composition shell. The current live content is versioned at
  `content/page-snapshots/about.html`.
* page-ai-enablement.html — the AI-enablement essay shell; renders the stored
  page body in the 44/72rem reading column. The current live content is
  versioned at `content/page-snapshots/ai-enablement.html`.
* page-contact.html — the contact page; renders the "contact" pattern in a 72rem
  column.
* page-work.html — the work index shell; renders the stored page body in the
  44/72rem composition. The current live content is versioned at
  `content/page-snapshots/work.html`.
* page-plato-artifacts.html — the Plato Artifacts portfolio-source index;
  preserves the stored page content while applying the same 44/72rem
  work-template shell used by the ledger pages. The current live content is
  versioned at `content/page-snapshots/plato-artifacts.html`.
* page-case-study.html — supplies the case-study header, title, and constrained
  content column only. Evidence boards, proof bars, artifact rows, and links must
  live in the page content so every published case study carries real, editable
  proof rather than starter placeholders.

Unspecified page/post templates are inherited from the Assembler parent.

The public About, Work, AI Enablement, and Plato Artifacts routes are DB-owned
page bodies. The public front page is hybrid: `front-page.html` keeps the Wapuu
hero and Three Rings framework theme-owned, while the middle Home section
remains DB-owned and tracked at `content/page-snapshots/front-page.html`. The
published Flavor Agent demo route (`/work/flavor-agent/demo/`) likewise keeps
its iframe embed and explanatory copy in the database; because it inherits the
generic page shell, its tracked source lives at
`content/page-snapshots/work-flavor-agent-demo.html` rather than a theme-owned
wrapper template. Keep the tracked source copies in sync at
`content/page-snapshots/front-page.html`,
`content/page-snapshots/about.html`, `content/page-snapshots/work.html`,
`content/page-snapshots/ai-enablement.html`,
`content/page-snapshots/plato-artifacts.html`, and
`content/page-snapshots/work-flavor-agent-demo.html`. After an intentional
page-body edit, refresh the files with `node scripts/export-page-snapshots.js`
and verify with `node scripts/verify-content-ownership.js`. The older
filesystem patterns (`about-resume`, `work-index`, and `ai-enablement`) remain
reusable seeds/reference copies rather than the live route owners for those
pages, while `wapuu-home-hero` remains the live front-page hero.

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
(opaque white field). Two transparent, trimmed derivatives are cut from it and
are what the theme actually renders: wapuu-hero.png (full figure, used by the
Wapuu homepage hero pattern) and wapuu-mark.png (square head crop, used as the
compact header brand mark). Regenerate the derivatives from the master rather
than hand-editing them.

The header is one system in two tiers. Inner pages get a compact utility bar:
the wapuu-mark.png head on a clean disc next to the wordmark. The home page
(body.home) promotes that bar into the hero — the bar drops its own surface and
divider to share the hero's grid band, and the small mark is hidden so the full
wapuu-hero.png figure carries the brand. The mascot therefore appears exactly
once per page: large on home, a quiet chip elsewhere. It should not replace
proof boards, artifact rows, screenshots, or project-specific evidence.

Use Evidence First for non-visual proof work such as GitHub contributions,
provider architecture, upstream fixes, documentation grounding, and review
records.

Use Proof + Product for visual work such as VOJ, plugin UI, frontend interfaces,
and client projects where screenshots materially prove what shipped.

Use Operational Story only for the Flavor Agent AI Governance and Demo pages so
that pair reads as one featured plugin demonstration.

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
