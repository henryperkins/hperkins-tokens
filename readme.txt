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

This is a child theme. It overrides only the header and footer template parts and
ships its own token vocabulary, component CSS, and patterns; all page/post
templates are inherited from the Assembler parent. The Assembler parent theme
must be installed for this theme to activate.

= Token vocabulary =

Color palette (settings.color.palette — default palette, custom gradients,
custom duotones, and the custom color picker are disabled, so authors pick only
from these named tokens):

* base            #ffffff   page background
* surface         #f6f7f9   raised surface / neutral chip
* hairline        #e9ecf1   1px rules and dividers
* muted           #545d6e   secondary text (6.6:1 on base — passes WCAG AA)
* contrast        #14181f   primary text
* action          #1a4dbe   links and buttons (ink blue)
* status-merged   #1f7a4d   resolved / shipped
* status-review   #a56408   in review (4.7:1 for white-on-fill — passes WCAG AA)
* status-pending  #6b7280   not yet started
* surface-merged  #f1f8f4   merged chip tint
* surface-review  #fbf6ed   review chip tint

Typography (defaultFontSizes disabled; fluid where noted):

* Font families: system-text (Text), mono (Mono)
* Font sizes: micro 0.6875 / xs 0.75 / small 0.8125 / medium 1 / large 1.25 / x-large 1.75 / xx-large 2.5 (rem)

Spacing slots (defaultSpacingSizes disabled; slots are named for where they are
spent):

* 10 Chip row 0.5rem / 20 Inline 0.75rem / 30 Quote indent 1.25rem /
  40 Stack 1.5rem / 50 Artifact terminus 2rem / 60 Section 3.5rem / 70 Band 5rem

Layout: contentSize 720px, wideSize 1080px.

Geometry, weight, and label rhythm (settings.custom — kept out of the editor
controls, used only by the component CSS, aliased to --hp-* names in style.css):

* Status rule width: rule-chip 7px / rule-entry 3px / rule-evidence 5px /
  rule-quote 2px (the left rule is a fixed width per component; state only
  swaps its color)
* Radius: radius-chip 2px / radius-register 3px / radius-tile 4px /
  radius-panel 5px / radius-card 6px / radius-frame 8px / radius-phone 30px /
  radius-pill 999px
* Weight: weight-title 650 / weight-strong 700
* Label gap: gap-xs 0.25rem / gap-sm 0.35rem (intra-block vertical rhythm)
* Grid: grid-pitch 32px / grid-action-tint 6% / grid-status-tint 5%
* Elevation: shadow-frame / shadow-phone / shadow-panel / shadow-mark /
  shadow-mascot
* Tracking: tracking-label 0.08em (every uppercase mono micro-label)
* Leading: leading-lead 1.45 (the calmer line-height of the .hp-lead opening
  paragraph — the one recurring non-body leading, so it lives as a token)

1px hairline rules, the chrome-dot hexes, and the mini-diagram bar percentages
are the only visual values intentionally left literal.

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
