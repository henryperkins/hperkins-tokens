# Condensed Council Header — Phase 1 (shell, IA, Writing menu)

**Date:** 2026-07-20
**Revised:** 2026-07-20 — after codebase review; see "Corrections from review"
**Status:** Design approved with revisions; ready for implementation planning
**Source:** `2a-final-design-review/DESIGN-SPEC.md` — "P1 Quiet precision with P2's small gold Digest cue", approved 2026-07-20
**Reference artifacts:** `2a-final-p1-digest.html`, `2a-final-p1-digest.png`, `2a-final-p1-digest-work-open.png`

## Context

The approved design specification describes a complete replacement of the site masthead: a
three-column grid shell at a fixed 68px, a reduced top-level navigation of `Work` / `Writing` /
`About`, two new disclosure surfaces (a Work evidence mega-menu and a short Writing menu), a small
gold `Digest` cue, an anchored desktop search surface, and a rebuilt mobile drawer.

The theme is further from that design than the specification's tone suggests. Menu 237 is currently
a **flat** list — `Work · Essays · About · Contact · Subscribe` — with **no submenus anywhere**. The
masthead is flex, not grid, and has no declared height: it measures roughly 60px, produced by
`spacing--2` padding in the block markup plus a 44px search button. Mobile search is a full-width
row glued beneath the bar, not a drawer row. So this is not a polish pass; it introduces structure
that does not exist.

Because the specification spans roughly eight workstreams, it is split. **This document covers
Phase 1.** The Work evidence mega-menu is deferred to its own specification.

## Corrections from review

A verification pass against the codebase confirmed most of this document's citations but overturned
two decisions and surfaced several concrete breakages. Readers of the first revision should note:

- **The Digest cue is now a pseudo-element, not an `aria-hidden` span.** Both reasons given for
  preferring the span were wrong — the verifier does not inspect aria-hidden subtrees at all, and
  `aria-hidden` does not keep the cue out of the button's accessible name. See "Digest cue".
- **`gold-800` is still correct, but it is a design standard, not a verifier requirement.** No script
  would have caught 3.02:1. Deviation 1's rationale is rewritten accordingly.
- **The `display: contents` flattening needs four existing rules neutralised**, one of which
  (`style.css:1707-1720`) sits outside the range this document originally cited. See "Flattening the
  Writing group".
- **The masthead grid is scoped to ≥782px** and requires an explicit `box-sizing: border-box`; the
  original unscoped rule would have produced an 84px bar. See "Masthead shell".
- **Drawer geometry is hardcoded to the current 60px bar** and must be recomputed. See "Mobile
  drawer".
- **Risks 1, 2 and 3 are resolved** against core source and specificity arithmetic; risk 2 gained a
  new WP-version hazard.
- Factual corrections: twelve `!important` declarations, not nine; `verify-prominent-actions.js` has
  no header comment to update; the `header-search.js` cut range is 78-134, not 87-134.

## Goals

- Replace the flex masthead with the specified `minmax(0, 1fr) auto minmax(0, 1fr)` grid at 68px, so
  navigation centring becomes structural rather than a property of balanced content widths.
- Recut menu 237 to the approved information architecture without making any destination
  unreachable.
- Introduce the Writing disclosure and the gold `Digest` cue.
- Replace the inline expanding desktop search with a right-anchored surface that cannot displace the
  centred navigation.
- Rebuild the mobile drawer to the P1 composition, including the in-drawer search row.
- Hold the line at 320px and every specified width without horizontal overflow.
- Use existing tokens; add new ones only where an accessibility contract requires it.

## Non-goals

- **The Work evidence mega-menu.** `Work` remains a plain navigation link to `/work/` in Phase 1.
  The two-column evidence panel, its status rows, and its featured-evidence column are Phase 2.
- Redesigning the footer beyond adding the single Contact link that the IA decision requires.
- Changing the sticky wrapper placement, the Interactivity Router integration, or
  `nav-close-delight.js`.
- Introducing a build step, a custom block, or a JavaScript framework.
- Changing any page body, template, or pattern outside the header part.

## Decisions taken during brainstorming

Three questions were resolved before design. They are recorded here because each one closes an
ambiguity the source specification leaves open.

### D1 — Scope is split; the mega-menu is Phase 2

Everything in Phase 1 is CSS, block markup, DB content, and modest JavaScript against surfaces that
already exist. The Work panel is the only piece requiring new render architecture, and it is the
only piece capable of forcing a rewrite of the others. Phase 1 is independently valuable and
independently verifiable.

### D2 — Grouping is desktop-only; the drawer is flat

Desktop shows `Work ▾` / `Writing ▾ [DIGEST]` / `About` exactly as specified. The drawer shows
`Work`, `Essays`, `AI Enablement`, `About` as four one-weight sibling rows, followed by the Digest
chip.

This honours §6's stated principles — minimum 50px rows, hairline-separated, one weight, no nested
accordion — rather than its exact row count. The reason for departing from the count is concrete:
`parts/footer.html` links only to *How this was built*, *Privacy*, GitHub, LinkedIn, the résumé PDF,
and a `mailto:`. It carries **no section links at all**, so the header navigation is the only route
to every section. Under §6 read literally, AI Enablement would have no mobile route whatsoever. A
drawer has vertical room and does not need the desktop's space-saving grouping.

Contact leaves the navigation, per §2's three-item goal, and gains a footer link so it retains a
labelled route. The Subscribe action does land on `/contact/#subscribe`, but a control marked
*Subscribe* is not a route anyone seeking to make contact will find.

### D3 — Full specification fidelity on mobile search

A `core/search` block returns to menu 237 as a drawer row between the Digest chip and Subscribe, and
the bar search icon is dropped at ≤781px.

This **overturns a recorded decision**. `docs/design-system/INDEX.md:179-181`, dated 2026-06-24
(0.3.24), reads: *"`hp-nav-search` was removed from menu 237; search is theme-owned in
`parts/header.html` … Do **not** re-add a search block to the menu."* That note will be superseded
in the same change rather than left contradicting the build.

The accepted costs are: search becomes two taps instead of one; the search field becomes DB content
that does not travel with the theme, in the same way `hp-nav-subscribe` already does not.

## Deviations from DESIGN-SPEC.md

Deviations 1 and 2 follow standards this repository declares — the typography verifier's contrast
and size floors — though, as Verification records, neither would actually be *caught* by a script in
these particular positions. Deviations 3 and 4 are information-architecture judgements, not contract
consequences. They are listed together so review can accept or reject them as a set.

| # | Specification says | This design does | Why |
|---|---|---|---|
| 1 | §4: Digest cue text is "gold-700/dark-gold" | Adds `gold-800: #6E531B` and uses it | `gold-700 #9A7530` on `gold-200 #EAD9A8` is **3.02:1**. `verify-typography.js:537-538` allows 3:1 only at ≥24px, or ≥18.66px at weight ≥700; an 8px cue needs **4.5:1**. No existing gold-family token clears it — `accent.press` is the same value, `feedback.warning #855F1E` reaches only 4.10:1. `#6E531B` measures **5.14:1** and is what the mockup actually uses (`2a-final-p1-digest.html:75`); the specification prose is looser than its own artifact. **Held as a design standard, not a verifier requirement** — no script inspects this cue. See "Digest cue". |
| 2 | Mockup `:103`: drawer Digest chip at 11px | Renders at 12px | `verify-typography.js:418` enforces a 12px floor on any element with direct text that is not `aria-hidden`. The chip is a real link (`hp-nav-digest`). 12px is the smallest passing value. |
| 3 | §3: drawer shows Work / Writing / About | Drawer shows Work / Essays / AI Enablement / About | See D2. Prevents AI Enablement becoming unreachable on mobile. |
| 4 | §3: Contact absent from the IA entirely | Contact moves to the footer | See D2. Preserves a labelled route. |

**Not a deviation, though the mockup makes it look like one:** the drawer appears to contain its own
brand row. §6 in fact states "Drawer opens below the sticky top bar", and its "Top row"
specification — 64px, 15px padding, 20px star, 13px wordmark, 38px close control — describes *the
bar*, not drawer content. The existing anchoring (`position: absolute; top: 100%`,
`style.css:1458-1462`) already produces that composition. No markup injection, and no second brand
lockup in the DOM.

## Information architecture

Menu 237 becomes:

| Item | Type | Destination | Class |
|---|---|---|---|
| Work | navigation-link | `/work/` | `hp-nav-work` |
| Writing | navigation-submenu | none (disclosure only) | — |
| — AI Enablement | navigation-link | `/ai-enablement/` | `hp-nav-ai` |
| — Essays | navigation-link | `/essays/` | `hp-nav-essays` |
| — Job Placement Digest | navigation-link | `/job-placement-digest/` | `hp-nav-digest` |
| About | navigation-link | `/about/` | — |
| Search | core/search | — | `hp-drawer-search` |
| Subscribe | navigation-link | `/contact/#subscribe` | `hp-nav-subscribe` |

`parts/header.html:14` currently reads `<!-- wp:navigation {"ref":237} /-->` — a single attribute.
This change adds `"openSubmenusOnClick": true`, which makes core render the Writing trigger as a real
`<button aria-expanded>` rather than a link. That satisfies §8's "appropriate disclosure button"
using core's own Interactivity API keyboard handling, Escape behaviour, and focus management, instead
of a competing implementation.

Confirmed against core (`wp-includes/blocks/navigation-submenu.php:218`): in the click branch the
button is emitted with `class="wp-block-navigation-item__content wp-block-navigation-submenu__toggle"`
and `aria-expanded="false"`, and `$attributes['url']` is **never read** — so a `Writing` submenu with
no destination renders as a button with no `href`, exactly as designed. The only render-blocking
condition is an empty label (`:87-90`). The chevron is emitted as a **sibling** `<span
class="wp-block-navigation__submenu-icon">` after the button, not inside it — which is what the
Digest cue anchors to. `core/navigation-link` does not consume this context and is unaffected.

**Version hazard.** `openSubmenusOnClick` is correct for this theme's `Requires at least: 6.6`. It is
deprecated in WP 7.1 in favour of `"submenuVisibility": "click"`, and still works there only because
`WP_Block_Type::prepare_attributes_for_render()` skips rather than strips unregistered attributes.
Under 7.1+ the editor's JS deprecation rewrites the attribute on first Site Editor save of the header
part, which would silently drop click-to-open for 6.6–7.0 visitors. Record both names in the
`CLAUDE.md` note and re-check the attribute after any Site Editor edit to `parts/header.html`.

Explicit per-item classes exist so CSS never depends on `:nth-child`, which would break the first
time the menu is edited in the Site Editor. They drive the drawer ordering described below, and
`hp-nav-work` additionally reserves the Phase 2 hook so the mega-menu does not require a second
destructive menu edit.

The search block is named `hp-drawer-search`, **not** the retired `hp-nav-search`. The old class has
no remaining CSS or JavaScript anywhere in the theme — confirmed, six surviving references, all prose
(`docs/design-system/INDEX.md` ×5, `readme.txt:577`, `CLAUDE.md:105`) — but it names a superseded
concept; reusing it would make the history unreadable.

Its block attributes are specified rather than left to default, because they decide whether the row
is a persistent field or a toggle:

```
{"label":"Search","showLabel":false,"placeholder":"Search the journal",
 "buttonText":"Search","buttonPosition":"button-inside","buttonUseIcon":true,
 "className":"hp-drawer-search"}
```

`button-inside` gives an always-open field with a trailing icon, which is the drawer composition —
distinct from the bar's `button-only` toggle (`parts/header.html:18`). This matters for JavaScript
scoping: `header-search.js` targets `.hp-site-header .hp-site-search`, so the drawer field is outside
its remit by construction and needs no collapse behaviour.

## Structural design

### Masthead shell

`.hp-site-header__inner` is a block group with `layout: flex` (`parts/header.html:2`), so WordPress
emits `.is-layout-flex { display: flex }`. The markup is left alone and overridden from the
stylesheet using a two-class selector. **The grid is scoped to ≥782px**; below that the existing flex
composition is kept and only the height token changes:

```css
@media (min-width: 782px) {
	.hp-site-header .hp-site-header__inner {
		box-sizing: border-box;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		gap: 0;
		min-height: var(--hp-header-h);
		align-items: center;
		padding-inline: var(--hp-header-pad);
	}
}
```

Keeping the flex layout in markup preserves a sane fallback in the editor and with the stylesheet
absent.

**Why the grid is scoped rather than global.** At ≤781px the composition is brand + hamburger, with
`style.css:1436-1439` reordering `.hp-site-nav` to `order: 3` and both Subscribe (`:4155-4157`) and —
per D3 — the search icon hidden. A three-column `minmax(0,1fr) auto minmax(0,1fr)` grid would auto-place
those children into columns whose middle track is empty, making the mobile bar's layout depend on
`order` interacting with grid auto-placement for no benefit. The mobile bar does not need centring.

**`box-sizing: border-box` is not optional.** There is no global box-sizing reset in `style.css` —
all eight occurrences are local defensive declarations — and the block markup carries inline
`padding-top`/`padding-bottom: var:preset|spacing|2` (8px each) that a stylesheet cannot override.
Under `content-box`, `min-height: 68px` renders an **84px** bar. Under `border-box` the 16px sits
inside the 68px and the tallest child (the 42px Subscribe pill) clears it comfortably. The inline
padding is block-axis only, so `padding-inline` applies without conflict.

`gap: 0` is likewise explicit. The inner group declares no `blockGap`, so it inherits core's
flex-layout default, which would carry into the grid as a column gap. The leftover `justify-content:
space-between` and `flex-wrap: nowrap` from WordPress's layout class are inert on grid and can be left
alone.

`1fr` flanks make centring structural. Today's equal-flex flanks (`style.css:1174-1185`) let a wide
actions cluster shove the navigation off-centre, which is exactly what §4's grid is for. It also
means the Digest cue widening the centre column consumes both flanks symmetrically, so §4's "must
not materially widen the nav" requires no manual policing.

Brand takes `justify-self: start`, actions `justify-self: end`, and all three children `min-width: 0`
so a long wordmark truncates its column rather than breaking the grid.

### New component tokens

Added to the `:root` block in `style.css`, alongside the existing `--hp-touch-min: 44px`
(`style.css:31`):

| Token | Value | Use |
|---|---|---|
| `--hp-header-h` | `68px` | Desktop and intermediate masthead height |
| `--hp-header-h-compact` | `64px` | ≤781px bar height |
| `--hp-header-pad` | `24px` | Desktop horizontal padding |
| `--hp-nav-gap` | `28px` | Top-level navigation gap |
| `--hp-nav-label` | `0.84375rem` | 13.5px navigation label |
| `--hp-nav-rule-w` | `26px` | Active/hover indicator width |

These are raw literals, consistent with established practice — component geometry lives in
`style.css`, and §4 states the navigation label "should stay a component value; no new global type
token is required." Palette values continue to go through `theme.json` first.

All six are confirmed new — `style.css` currently defines exactly one `--hp-*` header/navigation
token, `--hp-touch-min` at `:31` — so none of these collides with an existing name.
`--hp-header-h-compact` does double duty: it is both the ≤781px bar height and the term the drawer's
`max-height` should be expressed in (see "Drawer geometry" below).

### New palette token

`theme.json` gains `gold-800: #6E531B` in the gold ramp, aliased in `style.css`. This is the
"darkened accessible text tokens" pattern that `docs/design-system/INDEX.md` already records as a
deliberate theme-side delta from the design system. Per `CLAUDE.md`, the `settings.custom` tree
repeats palette hexes as literals, so the same edit must check whether any `custom` twin needs the
new value.

Checked: `#6E531B` appears nowhere in the repo today, so the addition creates no twin obligation. The
existing ramp is `gold-700 · 600 · 500 · 400 · 200 · 100` — there is no `gold-300`, so extending
past 700 is consistent with a ramp that already has gaps. Two adjacent facts worth knowing before
touching anything gold: `gold-200 #EAD9A8` has **no** `settings.custom` twin (the grep-the-hex rule
does not apply to it), and `feedback.warning #855F1E` is an orphan literal with no palette entry at
all — it cannot be found by grepping from the palette side, and it has already diverged from
`amber #B7842F`. Neither blocks this change; both would ambush a later one.

### Invariant that must not break

`.hp-site-header` keeps `position: relative` (`style.css:1093`). The mobile drawer
(`style.css:1458-1462`), the mobile search row (`style.css:4175-4179`), and the new desktop search
surface all anchor to it via `top: 100%`. Sticky positioning stays on the
`header.wp-block-template-part` wrapper (`style.css:1105-1109`), never on `.hp-site-header` — its
parent is the page-height scroller, and moving it silently breaks the stick.

## Component detail

### Brand

22px star, 11px gap, 18px uppercase wordmark in the existing display face at 0.17em tracking. The
whole lockup links home. The existing `line-height: 1.1` on the site title is retained — it is not
1.0 deliberately, because 1.0 clips ascenders.

### Primary navigation

28px gap between items; label at `--hp-nav-label` in the label family, uppercase, approximately
0.065em tracking; 40px interaction box; chevron at 9px aligned optically to cap height.

Current and hover state is a centred gold rule, `--hp-nav-rule-w` wide and 1.5px high. Note that
hover and current are visually identical today (`style.css:1210-1219`) and remain so — §4 specifies
one indicator for both. A distinct current-page treatment is out of scope and recorded as a possible
future refinement.

### Digest cue

A decorative pseudo-element on the Writing chevron — `.wp-block-navigation__submenu-icon::after`,
`content: "Digest"` — placing it immediately after the chevron as §4 describes: `gold-200`
background, `gold-800` text, 2px radius (`--wp--custom--radius--xs`), mono, uppercase, 8px, 0.08em
tracking, 3px 5px padding, offset ~2px from the chevron and 1px upward. §4 explicitly sanctions a
pseudo-element. Because the anchor is the chevron, `showSubmenuIcon` must stay at its default `true`,
and the flattening rules below must hide the chevron — and with it the cue — at ≤781px.

**This reverses the earlier decision to use an `aria-hidden` span in the DB label.** Both halves of
that argument turned out to be wrong.

*"The span is explicitly exempt from the 12px floor, whereas contrast has no such exemption."*
`verify-typography.js:406` gates the entire walk on `isVisible`, and `isVisible` at `:321` calls
`el.closest('[aria-hidden="true"]')` — which excludes every aria-hidden subtree, at any depth, from
`textElements` (`:411`). The contrast loop at `:512` iterates `textElements`. An `aria-hidden` cue is
therefore **never contrast-checked at all**, and the `:418` floor waiver is dead code, since
`ariaHiddenNearby`'s depth-3 walk is a strict subset of what `:321` already removed. The span and the
pseudo-element are equally invisible to the verifier; the span's stated advantage does not exist.

*"`aria-hidden` keeps the cue out of the accessible name."* It does not.
`navigation-submenu.php:147-151` builds the button's name as
`sprintf( __( '%s submenu' ), wp_strip_all_tags( $label ) )`, and `aria-label` overrides the
element's subtree entirely. A span in the label yields the accessible name **"Writing Digest
submenu"** regardless of `aria-hidden`; suppressing it would need the `render_block` filter this
phase defers. The pseudo-element yields "Writing submenu".

For the record, the span *would* have survived: labels pass through `wp_kses_post`
(`navigation-submenu.php:141-145`), `span` is in the post allowlist, `class` and `aria-hidden` are
global kses attributes, and the JSON delimiter escaping makes the editor round-trip lossless. Risk 1
is resolved and now moot. The pseudo-element additionally keeps the cue in the theme instead of
adding more unbacked DB content to menu 237.

The cue is a discoverability signal, not a destination. It creates no tab stop and no second
competing link. The real Job Placement Digest link stays inside the Writing menu.

**No script enforces any of this.** Generated content carries no DOM node with direct text, so
`verify-typography.js:406` skips it — exactly as it would have skipped the aria-hidden span. The
5.14:1 contrast and the 8px size are held on principle. This is recorded as a coverage gap under
Verification rather than presented as a passing check.

### Actions

8px gap. Search closed state is a 38px visible circle with a quiet green-subtle hover wash, its
effective hit area brought to at least 44px by an invisible wrapper. Search icon 18px. Subscribe is
116px × 42px, evergreen fill, parchment text, 7px radius, restrained shadow, hover darkening to
`green-800` with at most a 1px lift.

### Desktop search surface

The inline expanding input is replaced by a right-anchored surface using the mechanism the mobile row
already proves — absolute positioning against `.hp-site-header`:

```css
position: absolute;
top: 100%;
right: 0;
width: min(330px, calc(100vw - 32px));
```

The existing input rules carry **twelve** `!important` declarations — `style.css:4105-4108` (4),
`:4118-4119` (2), `:4181` (1), `:4184-4192` (5, the last being the tail of a multi-line `color-mix()`
closing at `:4192`) — purely to defeat the Assembler parent's `input:not([type=…])` border rule. That
is twelve of the twenty-two in the whole sheet. The fight is inherited, not resolved, by this change.

One rule should be revisited: the `:focus` handler at `style.css:4116-4119` kills the outline and
substitutes a bottom border, bypassing the global gold focus ring at `style.css:2213-2224`. Note the
mechanism — `outline: none` at `:4117` is unqualified, not `:focus-visible`-scoped, so it wins against
the global ring by matching a broader state rather than by specificity. §8 requires visible focus that
meets contrast and does not rely on a thin underline alone, so the anchored surface adopts the global
ring and this override is removed.

### Writing menu

Approximately 260px wide, parchment surface, hairline border, 7px radius, large shadow, rows using
the same calm hover wash as the rest of the header. Job Placement Digest uses the full gold chip
treatment inside the menu.

## Mobile drawer

At ≤781px the bar becomes 64px with 15px horizontal padding, a 20px star, and a 13px wordmark at
approximately 0.09em tracking. The close control is a 38px box with hairline border and 7px radius,
retaining a 44px effective hit area. The bar search icon is removed.

Drawer content keeps its current anchoring and gains a `::before` "Sections" legend. Rows are
minimum 50px, hairline-separated, one weight, no nested accordion. Subscribe flips from filled
`green-700` (`style.css:1659-1662`) to an outline treatment at 48px, mirroring the registered
`secondary` button style.

### Drawer geometry is hardcoded to today's 60px bar

Two rules reconstruct the current bar height from its parts and must be recomputed against
`--hp-header-h-compact`, or the drawer will be four pixels too tall:

| Rule | Today | Resolves to | After |
|---|---|---|---|
| `style.css:1465-1468` | `max-height: calc(100svh - var(--hp-touch-min) - spacing-2 - spacing-2)` | `100svh - 60px` (44 + 8 + 8) | `calc(100svh - var(--hp-header-h-compact))` |
| `style.css:1498` | `padding-top: calc(var(--hp-touch-min) + spacing-3)` | `56px` | recompute against the 64px bar and the 38px close control |

The comment at `style.css:1454-1457` is easy to misread here: absolute `top: 100%` against the
relative `.hp-site-header` auto-aligns the drawer's **position** to the real bar height, including
with the admin bar present. Its **height** is hand-computed and does not follow. Introducing
`--hp-header-h-compact` lets both become single-token expressions, which is a net simplification.

### Row height must not come from `--hp-touch-min`

Drawer rows are currently `min-height: var(--hp-touch-min)` (44px, `style.css:1533`). That token is
shared with the open/close buttons (`:1241-1242`) and the accordion chevron toggle (`:1685-1686`), so
raising it to reach the specified 50px rows would resize three unrelated controls. Use a
drawer-scoped value and leave `--hp-touch-min` at 44px as the accessibility floor it is.

### Flattening the Writing group

Core renders one markup tree for both breakpoints. Rather than maintain a second navigation block, at
≤781px the Writing wrapper collapses with `display: contents` on both the `<li>` and its nested
`<ul>`, the Writing trigger and its chevron are hidden, and the three grandchildren become flex items
of the drawer column. Order is assigned explicitly:

```
Work 1 · Essays 2 · AI Enablement 3 · About 4 · Digest chip 5 · Search 6 · Subscribe 7
```

**The "Digest chip" is not an eighth item.** It is `hp-nav-digest` — the third Writing grandchild —
restyled as a chip and reordered after About. Seven rows, not eight.

Four existing rules stand in the way. Each must be neutralised, and every one of these overrides must
sit inside `@media (max-width: 781px)`:

| Rule | What it does | What this change must do |
|---|---|---|
| `style.css:1707-1720` | `@supports selector(:has(*))` accordion: `display: none` on the collapsed submenu container, `display: flex` when the toggle is `aria-expanded="true"` | The flattened drawer needs the three grandchildren permanently visible, so this accordion is **deliberately disabled** for this menu, not preserved. It sets the same property on the same element as the flattening, so the override must beat both the collapsed and the `[aria-expanded="true"]` variant. **Outside the `:1544-1643` range and easy to miss.** |
| `style.css:1595-1619` | `.wp-block-navigation-submenu { display: grid; grid-template-columns: 1fr auto }`, children pinned via `grid-column: 1` and `1 / -1` | `display: contents` targets this same element, so the override has to land. Once trigger and chevron are hidden the grid has no work left and the `grid-column` declarations go inert. Do not delete the rule — `:1598` records that grid was chosen because flex-wrap "mis-grew and centred"; scope it to ≥782px instead. |
| `style.css:1548-1554`, `:1623-1636` | `background`, `border-bottom`, `margin-left`, and the second-level `border-left: 2px` painted on the submenu `<ul>` | All vanish under `display: contents`. Intended, but should be removed deliberately rather than discovered as a side effect. |
| `style.css:4215-4217` | `@media (min-width: 782px) { .hp-site-nav .hp-nav-subscribe { display: none } }`, specificity (0,2,0) | Any unscoped or higher-specificity `display: contents` / `order` rule un-hides the drawer Subscribe on desktop, producing **both** Subscribe controls — the state `style.css:4212` forbids and `readme.txt:571` records as a shipped regression. |

The rest of the indented-submenu treatment in `style.css:1544-1643` — the `parchment-100` tint,
body-font switch and muted colour — must also be neutralised for this menu at ≤781px.

**The drawer column's flex context belongs to core, not to us.** The theme never declares
`display: flex; flex-direction: column` on `.wp-block-navigation__container`; the `gap: 0` and
`align-items: stretch` at `:1512-1513` are no-ops without it, which is the evidence that core's
block-library CSS supplies it. `order` therefore rests on an undeclared upstream implementation
detail. Declare the column flex explicitly in the theme as part of this change.

Two things work in our favour. The row hairline lives on the `<a>` (`:1540`), not the `<li>`, so
flattening the `<li>` preserves the separators; and `gap: 0` means reordering produces no orphaned
spacing between rows.

**Known trade-off:** `display: contents` on `<ul>`/`<li>` removed list semantics from the
accessibility tree in Chrome <89, Firefox <88, and Safari <15.4. All are four or more years old and
the theme targets WP 7.0 / PHP 8.0, so this is accepted. The alternative — a `render_block` filter
restructuring markup per breakpoint — is the custom-rendering work deferred to Phase 2, which can
upgrade this if desired.

## Intermediate width band

For 782–960px: 16px horizontal padding, ~16.5px wordmark, 20px navigation gap, ~12.5px navigation
label, 36px search circle, ~106px × 40px Subscribe, Digest cue reduced to 2px 4px padding and 7px
per mockup `:142`. Height stays 68px; §7 does not vary it.

No label truncation is permitted. §7's contingency is explicit: if real font metrics still collide,
**switch to the drawer earlier rather than hide the cue or squeeze the wordmark**. Raising that
boundary means touching the 600–781 patch at `style.css:1821-1835` and every 781/782 edge together,
as one coordinated change.

## Interaction and accessibility

- Writing supports click, tap, and keyboard activation via core's disclosure button.
- Enter/Space opens; ArrowDown moves to the first item; Escape closes and restores focus to the
  trigger; outside click closes.
- Only one of Writing, Search, or the mobile drawer may be open at a time.
- Focus is not trapped in the desktop menu; it is managed coherently inside the drawer.
- Visible focus meets contrast and does not rely on the thin active underline alone.
- `prefers-reduced-motion` is respected; the drawer's transform animation is disabled under it.
- The Digest cue is generated content: not focusable, no tab stop, no second link, and it leaves the
  disclosure button's accessible name as "Writing submenu". Whether Chromium exposes `::after`
  content as an adjacent static-text node is a detail to confirm with a screen reader during the
  accessibility pass — it is the one thing the pseudo-element does not settle by construction.

### JavaScript coordination

Because the bar search icon disappears at ≤781px, the two controls never coexist in the bar again.
That makes the hamburger↔search coordination dead code. It is **removed** and replaced with
disclosure↔search exclusion, which is the coordination §5 actually requires.

**The cut is lines 78-134, not 87-134.** The section comment at `:78-79` and the phantom-keyboard
rationale at `:81-86` document only the code being removed; cutting at 87 leaves them dangling
immediately before the closing `}() );`. The file goes 135 → 78 lines. Note also that only the first
listener (`:87-112`, search icon → dismiss drawer) is capture-phase; the second (`:116-134`, hamburger
→ dispatch `Escape` at open search forms) registers on the bubble phase. Describing the block
wholesale as capture-phase is inaccurate.

Removing `:81-86` removes a real mobile mitigation, not just its comment: the phantom-keyboard fix
exists because a search-icon tap while the drawer was open left a focused-but-hidden field. That
failure mode disappears with the icon itself, which is why the removal is safe — but it is a
behaviour change contingent on D3, not a pure cleanup, and should be reverted together with D3 if D3
is ever reversed.

Per §9 this extends the existing file rather than adding competing global listeners. The
document-delegated pattern is retained so behaviour survives Interactivity Router body swaps. Net
effect: `header-search.js` gets smaller. The stale comment at `:12` referring to the long-removed
in-overlay search is corrected in the same pass. The file's advertised behaviour — Escape-to-collapse
(`:51-59`) and outside-click-to-collapse (`:61-76`) — is untouched.

Any new script follows the existing deferred, `filemtime`-versioned enqueue pattern
(`functions.php:125-194`).

## Safety: menu 237 is unbacked

`CLAUDE.md:105` points at `.design-pull/header-and-navigation-redesign/backup/nav-post-237.after.html`.
Verified: not just that file but the **entire `.design-pull/` tree is absent**, and `.gitignore`
excludes it — so that pointer names a path which cannot exist on a fresh checkout and can never
travel with the repo. It has been dead guidance for some time. The recut is destructive to DB content
with no recovery path.

Before any menu edit:

1. Export the current menu to a tracked `content/nav-snapshots/nav-237.html`.
2. Commit it before the recut, so the pre-change state is recoverable from git alone.
3. Add assertions to `verify-content-ownership.js` (already wp-cli-backed) that the live menu still
   carries `hp-nav-subscribe`, `hp-drawer-search`, and `hp-nav-digest`.
4. Correct `CLAUDE.md:105` to name the tracked snapshot instead of the gitignored path, in the same
   change — otherwise the dead pointer survives alongside its replacement.

Two scoping notes for the implementation plan. **The snapshot must be refreshable, not a one-shot
export**: extend `scripts/export-page-snapshots.js` or add a sibling, following the pattern it
already establishes for page bodies. A snapshot with no refresh path goes stale exactly the way
`.design-pull` did. And **step 3 is net-new capability, not an extension**: nothing anywhere in
`scripts/` currently asserts anything about menu 237, `hp-nav-subscribe`, or navigation content —
`verify-content-ownership.js`'s entire surface today is page `post_content` plus `wp_template`
resolution. It is the right home, but budget it as new work.

`CLAUDE.md:105` records that the mobile Subscribe link was lost once already and had to be restored
on 2026-07-06; `readme.txt:571` records the same regression from the 0.3.36 side, where "the
drawer-foot pill CSS was matching nothing". A tracked snapshot plus an assertion is what prevents a
second occurrence.

Work happens against the local Studio site first
(`$env:HPERKINS_WP_PATH = "$env:USERPROFILE\Studio\hperkins-tokens-dev"`), never directly against
production.

## Verification

Checks extend the existing scripts rather than adding a new verifier.

| Script | Added checks |
|---|---|
| `verify-typography.js` | Add 782 / 960 / 1024 / 1280 to `OVERFLOW_VIEWPORTS` (`:33-35`), which currently holds only 320 and 768; 390 and 1440 are already covered by `FULL_VIEWPORTS` (`:29-31`) |
| `verify-prominent-actions.js` | 44px effective targets and focus treatment for the search button, close control, Subscribe pill, and Writing disclosure |
| `verify-content-ownership.js` | Menu 237 shape: `hp-nav-subscribe`, `hp-drawer-search`, and `hp-nav-digest` all present |

The typography floor, contrast, and family checks pick up the header's ordinary text automatically —
they run site-wide over every visible element with direct text. They do **not** pick up the two
pieces this design most needs checked.

**Three blind spots.** None is a reason to skip the corresponding fix, but none should be described
as covered:

- **The Digest cue is inspected nowhere.** `verify-typography.js:406` gates on `isVisible`, which at
  `:321` excludes any `aria-hidden` subtree, and generated content has no DOM node with direct text
  at all. Neither the original span nor the adopted pseudo-element would ever be measured. The
  earlier claim that "the existing contrast check would fail it at 3.02:1" was wrong, and deviation 1
  is a design standard rather than a mechanical requirement.
- **Drawer contents are never inspected.** They are `display: none` while closed, so `isVisible`
  excludes them. Deviation 2's 12px chip floor is honoured on principle, not enforced.
- **The full checks run only at `FULL_VIEWPORTS`** (1440 and 390). Adding widths to
  `OVERFLOW_VIEWPORTS` buys overflow coverage at the new bands, not floor/contrast coverage.

Closing the first two would mean teaching `verify-typography.js` to evaluate `aria-hidden` and
generated content deliberately — a real change to its model of what "text" is, and out of scope here.
Recorded as a gap, not scheduled.

**Known gap — interaction.** Escape, focus restoration, outside-click, and reduced-motion fit none of
the three scripts. They land in `verify-prominent-actions.js` because focus is already its remit.
Feasibility, checked rather than assumed:

- Escape is cheap: the script already dispatches real keyboard events over CDP
  (`Input.dispatchKeyEvent` at `:281-292`, used to prime focus-visible modality), so a second key is
  the same call.
- Focus restoration is readable from `document.activeElement` inside the existing `Runtime.evaluate`
  expression (`:294-357`).
- Outside-click needs `Input.dispatchMouseEvent` — new, same CDP session.
- Reduced motion needs `Emulation.setEmulatedMedia` — new, but the script already calls
  `Emulation.setDeviceMetricsOverride` (`:261-269`), so the pattern exists.
- The real constraint is architectural: the script takes **one snapshot per page per viewport**.
  Before/after interaction state needs a second round-trip per page, which its current single-
  expression shape does not do.

Two corrections to the original plan for this file: it has **no header comment** to update — it opens
with a shebang and `require`s, and its stated purpose lives externally in `CLAUDE.md:47` — so the
purpose note must be created, and `CLAUDE.md:47` updated alongside. It also has `--source-only` but
no `--report`, so it is assert-and-throw only. If the fit proves poor, the fallback is to verify
manually this pass and say so in the changelog, not to claim coverage that does not exist.

**Prerequisite: the suite is currently red.** `readme.txt:6` declares `Stable tag: 0.3.47` while
`style.css:9` declares `Version: 0.3.48`, and `verify-performance-assets.js:173-176` asserts they
match — the 0.3.48 release bumped the version and changelog but not the tag. Fix that before starting,
so "full existing suite must pass unchanged" is a meaningful gate rather than a known-failing one.

Full existing suite must pass, in particular `verify-typography.js` and
`verify-no-duplicate-pages.js`.

## Documentation and release

- **Prerequisite:** `readme.txt` `Stable tag:` → `0.3.48` to match the already-released
  `style.css` `Version:`, restoring the release-sync assertion at
  `verify-performance-assets.js:173-176`. Separate commit, before this work starts.
- `style.css` `Version:` → **0.3.49**, mirrored in `readme.txt` `Stable tag:` with a changelog entry.
- `docs/design-system/INDEX.md:179-181` superseded with a dated note explaining the reversal. Note
  that `:170-177` above it still reads as live guidance ("CSS hides it on desktop…", "To enable
  elsewhere, add a Search block…") and is only contradicted by the note beneath — revise that passage
  too rather than stacking a third layer of supersession on it.
- `INDEX.md` records the new `gold-800` token as a theme-side delta, alongside the existing
  "darkened accessible text tokens" entries. `gold-200` has no `settings.custom` twin, so the
  palette edit stands alone; `gold-700`'s twin at `accent.press` is untouched by this change.
- `CLAUDE.md`'s header/navigation section updated: new IA, search relocation, menu 237 contract, the
  disclosure attribute (**recording both `openSubmenusOnClick` and its 7.1 successor
  `submenuVisibility`**, and which WP versions each serves), and the Phase 2 boundary.
- `CLAUDE.md:105` corrected — it points at the gitignored, absent
  `.design-pull/…/nav-post-237.after.html`; it should name `content/nav-snapshots/nav-237.html`.
- `CLAUDE.md:47` updated for `verify-prominent-actions.js`'s widened remit, since that script carries
  no header comment of its own.
- Cache-busting remains `filemtime()`-based; the `Version:` bump is release tracking only.

## Risks and assumptions to validate

1. ~~**`wp_kses_post` on navigation labels.**~~ **Resolved, and moot.** Labels do pass through
   `wp_kses_post` (`navigation-submenu.php:141-145`) and a `<span class aria-hidden>` survives intact.
   The cue moved to a pseudo-element for unrelated reasons; see "Digest cue".
2. ~~**`openSubmenusOnClick` interaction with the drawer.**~~ **Resolved for rendering; a new hazard
   replaces it.** Core emits the `<button aria-expanded="false">` unconditionally in the click branch,
   ignoring `url`. The residual risks are (a) the WP 7.1 deprecation rewriting the attribute on Site
   Editor save — see "Information architecture" — and (b) the flattening overrides in "Flattening the
   Writing group", which is where the drawer behaviour is actually decided.
3. ~~**Grid override specificity.**~~ **Resolved by arithmetic.** `.hp-site-header
   .hp-site-header__inner` is (0,2,0); `.is-layout-flex` is (0,1,0). Higher specificity wins
   irrespective of source order, so this was never load-order dependent. Still worth an eyes-on check
   in the rendered page, but not a risk.
4. **Assembler input `!important` fight.** The anchored search surface inherits it. Confirm the
   global focus ring actually applies once the current `:focus` override is removed — note the
   override wins by matching `:focus` rather than `:focus-visible`, not by specificity.
5. **Undeclared core CSS under the drawer ordering.** `order: 1..7` depends on core's block-library
   sheet making `.wp-block-navigation__container` a column flex container; the theme never declares
   it. Declare it, then confirm the ordering still holds if core's rule is removed.
6. **Admin bar.** §10 requires the logged-in admin bar not to offset the sticky header incorrectly.
   The drawer's `top: 100%` anchoring should handle its *position*; its recomputed `max-height` is the
   part to watch, since that is hand-derived rather than anchored.
7. **Cross-browser.** §10 requires Safari, Firefox, and Chromium to preserve layout, backdrop frost,
   and menu positioning. The verifiers drive Chromium only, so Safari and Firefox are manual.
8. **`box-sizing` inheritance.** The masthead grid declares `border-box` locally because the theme has
   no global reset. Confirm the rendered bar measures 68px, not 84px, before styling anything that
   depends on the height.

## Phase 2 seam

Phase 2 converts `Work` from a navigation link to a disclosure carrying the two-column evidence
panel. Two consequences are already visible:

- The drawer must show `Work` as a plain row, so Phase 2's flattening rules differ from Writing's —
  the panel is suppressed and the `<a>` shown, rather than the wrapper collapsed.
- A `render_block` filter introduced for the panel could also upgrade the Digest cue to injected
  markup and replace the `display: contents` flattening, if either proves unsatisfactory.
