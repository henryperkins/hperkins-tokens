=== HPerkins Tokens ===
Contributors: Henry Perkins
Requires at least: 6.6
Tested up to: 7.0
Requires PHP: 8.0
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
page-ai-enablement.html, page-contact.html, page-work.html, and
page-case-study.html as additive block templates (each detailed under Template
overrides below); and provides its own token vocabulary, component CSS, and
patterns. Unspecified page/post templates are inherited from the Assembler
parent. The Assembler parent theme must be installed for this theme to
activate.

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
* radius xs 2px / sm 4px / md 7px / lg 12px / xl 20px / pill · borderWidth
  thin 1px / regular 1.5px / thick 2px
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

The child theme owns eight block templates (page-case-study is also registered as
a selectable "Case study" template in theme.json; the others map by the WordPress
template hierarchy):

* front-page.html — the portfolio landing: renders the stored Home page content,
  then appends the Three Rings (Vilya / Narya / Nenya) framework section.
* home.html — the journal index: masthead, category filter, a featured essay,
  then a grid of recent essay postcards.
* single.html — the essay reader: a twilight cover hero (title, standfirst, meta)
  over constrained prose, post tags, the subscribe block, and a "Continue
  reading" related-posts grid.
* page-about.html — wraps the stored About page content in the narrow/wide About
  composition shell.
* page-ai-enablement.html — the AI-enablement essay page; renders the
  "ai-enablement" pattern in the 44/72rem reading column.
* page-contact.html — the contact page; renders the "contact" pattern in a 72rem
  column.
* page-work.html — the work index page; wraps the "work-index" pattern in a
  44/72rem composition with ledger cards and proof sections.
* page-case-study.html — supplies the case-study header, title, and constrained
  content column only. Evidence boards, proof bars, artifact rows, and links must
  live in the page content so every published case study carries real, editable
  proof rather than starter placeholders.

Unspecified page/post templates are inherited from the Assembler parent.

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
