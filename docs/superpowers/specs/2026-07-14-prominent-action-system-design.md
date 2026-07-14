# Prominent Action System Redesign

**Date:** 2026-07-14
**Status:** Visual direction approved; written specification awaiting review
**Selected direction:** Adaptive action system — shared action rail plus an editorial closing-panel modifier

## Context

The Job Placement Digest ends with a default `core/buttons` row immediately after a structured artifact register. The primary and secondary buttons use the Imladris button vocabulary, but the group has no surface, boundary, or narrative handoff, so the page appears to stop rather than conclude.

The same issue recurs outside the Digest. Prominent button groups appear in the homepage hero, About hero, front-page closing invitation, and Flavor Agent demo close. Applying one global rule to every `core/buttons` block would also affect compact controls such as the header Subscribe button and the design-system button specimen, which already have appropriate context-specific treatment.

The chosen design therefore introduces a reusable, explicitly opted-in action system for prominent page actions. It improves grouping everywhere and reserves the stronger editorial panel for closing invitations.

## Goals

- Make every prominent page-action group read as a deliberate component instead of a loose row of buttons.
- Preserve the selected Direction A treatment for the Job Placement Digest closing invitation.
- Reuse one component contract across theme-owned patterns and DB-owned page bodies.
- Keep compact header, form, and specimen controls unchanged.
- Use the existing Imladris tokens, button variants, focus behavior, and emblem asset.
- Remain responsive and overflow-free at 320px without JavaScript.

## Non-goals

- Redesigning the global `core/button` primitive or its primary, secondary, ghost, accent, and link variants.
- Changing header Subscribe, navigation, search, contact-form submit, newsletter submit, or icon buttons.
- Changing button labels or destinations outside the new Digest closing invitation.
- Adding tokens, animation, client-side behavior, or a new Gutenberg block.
- Wrapping every hero in a panel; heroes retain their existing composition.

## Usage inventory and rollout

| Context | Source ownership | Treatment |
|---|---|---|
| Homepage Wapuu hero | `patterns/wapuu-home-hero.php` | Add the shared action rail to the existing primary/secondary group. No closing panel. |
| About hero | `patterns/about-resume.php` plus `content/page-snapshots/about.html` | Add the shared action rail. No closing panel. |
| Front-page closing invitation | `content/page-snapshots/front-page.html` | Add the shared action rail and closing-panel classes to the existing section. Keep its current copy and single action. |
| Job Placement Digest close | `patterns/job-placement-digest.php` plus `content/page-snapshots/job-placement-digest.html` | Replace the loose button row with the approved editorial closing panel and shared action rail. |
| Flavor Agent demo close | `content/page-snapshots/work-flavor-agent-demo.html` | Add the closing panel and shared action rail around the existing eyebrow, paragraph, and two actions. Keep its current copy. |
| Header Subscribe | `parts/header.html` | Explicitly unchanged. |
| Button specimen | `patterns/imladris-button.php` | Explicitly unchanged so it continues to demonstrate the primitive variants without compositional styling. |

## Component design

### 1. Shared action rail

Prominent `core/buttons` blocks opt in with the class `hp-action-rail`, retaining any existing context class such as `hp-wapuu-hero__cta` or `hp-about-hero__cta`.

The rail:

- uses `inline-flex`, `width: fit-content`, and `max-width: 100%` so it hugs its actions without overflowing;
- groups actions on a subtle card-to-sunken parchment surface;
- uses the existing hairline border, `radius.lg`, `shadow.sm`, spacing-1 inset, and spacing-1 gap;
- preserves the existing primary and secondary button styles rather than redefining their colors;
- guarantees a minimum 44px target height for its button links;
- keeps one-button groups visually intentional instead of forcing a two-button layout.

Below 600px, the rail becomes full-width, its button blocks stack, and each link fills the available width. Existing page-specific alignment rules may constrain the rail further, as the Wapuu hero already does with its 19rem mobile measure.

Conceptual markup:

```html
<!-- wp:buttons {"className":"hp-action-rail"} -->
<div class="wp-block-buttons hp-action-rail">
	<!-- existing core/button blocks -->
</div>
<!-- /wp:buttons -->
```

### 2. Editorial closing panel

Closing invitations opt in with `hp-action-panel is-closing`. This is a semantic `core/group`, normally rendered as a `section`, containing existing eyebrow, heading or body copy, and an `hp-action-rail`.

The closing panel:

- uses the 44rem content measure already established by the affected pages;
- applies spacing-5 padding on larger screens and spacing-4 on narrow screens;
- uses a card-to-sunken parchment gradient, hairline border, `radius.lg`, and `shadow.md`;
- uses the existing fixed `--hp-rule-entry` width for its gold left rule, preserving the theme’s fixed-anatomy invariant;
- displays the existing `assets/img/emblem.svg` as a low-emphasis gold CSS mask in the upper-right corner, making it decorative and absent from the accessibility tree;
- leaves heading level and copy ownership to each page rather than inventing a rigid content schema;
- contains no animation or interactive behavior beyond the existing link states.

The panel is a composition of existing Imladris primitives, not a replacement for `core/button` and not a new canonical design-system primitive.

## Job Placement Digest copy

The new Digest closing panel uses the approved copy:

- **Eyebrow:** “A next step, stated plainly”
- **Heading:** “Bring me the problem behind the ticket.”
- **Body:** “If you need WordPress systems thinking that can survive inspection, let’s compare notes.”
- **Primary action:** “Start a conversation” → `/contact/`
- **Secondary action:** “See the work” → `/work/`

The heading is an `h2`, giving the page a clear final section after its `h1`. The buttons remain links because they navigate rather than submit an action.

## CSS ownership

Both components are reused across pages, so their tokens and component rules belong in `style.css`, not `assets/imladris-pages.css`.

Existing page-specific CSS remains responsible only for context:

- Wapuu hero sizing and alignment stay under `.hp-wapuu-hero__cta`.
- About hero rhythm stays under `.hp-about-hero__cta`.
- Front-page closing typography stays under `.hp-front-template__cta*`, while its old bare top-rule and top-padding surface declarations are removed or reduced so they do not compete with `hp-action-panel`.
- Digest hero and dateline rules remain in `assets/imladris-pages.css`; the new shared closing treatment adds no Digest-only CSS.

No `theme.json` change is required. The `style.css` version advances from `0.3.41` to `0.3.42`, mirrored in `readme.txt` with a changelog entry.

## Content ownership and deployment

The live About, front page, Job Placement Digest, and Flavor Agent demo bodies are DB-owned. Their tracked files are source copies, not the rendered route owners.

Implementation must therefore:

1. Update every theme-owned pattern and tracked snapshot listed in the rollout table.
2. Apply the corresponding snapshot markup to each live DB-owned page body using the repository’s existing WP-CLI workflow.
3. Run `node scripts/export-page-snapshots.js` after the live DB updates.
4. Confirm the export is byte-for-byte stable with the intended tracked snapshots.
5. Run `node scripts/verify-content-ownership.js` to prove route ownership and snapshot parity.

If the live WordPress checkout is unavailable during implementation, the filesystem patch may be completed and verified statically, but the task must be reported as awaiting deployment rather than fully live.

## Accessibility and responsive behavior

- Existing global `:focus-visible` rules remain the focus treatment; the rail and panel do not suppress outlines.
- Every prominent button link has a minimum 44px block size.
- Primary and secondary variants keep their current WCAG-AA token combinations.
- The decorative emblem is CSS-only and has no spoken label.
- Button order remains primary then secondary in both visual and DOM order.
- At 600px and below, actions stack and become full-width.
- At 320px, no rail, panel, label, or long button may create horizontal overflow.
- Existing reduced-motion rules continue to neutralize button transitions for users who request it.

## Verification strategy

Implementation follows test-first development by adding or extending a focused verifier before changing component markup and CSS.

The focused verification must cover:

- the five intended prominent-action contexts contain `hp-action-rail`;
- the three closing contexts contain `hp-action-panel is-closing`;
- header Subscribe and `patterns/imladris-button.php` do not acquire either class;
- the Digest contains the approved copy, links, and `h2` hierarchy;
- all CSS values resolve through existing Imladris variables;
- button targets are at least 44px high;
- `/`, `/about/`, `/job-placement-digest/`, and `/work/flavor-agent/demo/` render without horizontal overflow at 1440px, 390px, and 320px;
- the primary/secondary order, focus visibility, and mobile stacking remain correct.

Repository checks:

```text
php -l patterns/wapuu-home-hero.php
php -l patterns/about-resume.php
php -l patterns/job-placement-digest.php
node scripts/verify-style-token-usage.js
node scripts/verify-content-ownership.js
node scripts/verify-content-ownership-docs.js
git diff --check
```

The final live proof includes desktop and mobile screenshots of at least one hero rail and every closing panel. The implementation should document the action rail in `docs/design-system/INDEX.md` as a theme composition built from the canonical Button primitive.

## Acceptance criteria

- Every intended prominent action group uses the shared rail and no compact control changes appearance.
- The Digest matches the approved Direction A visual and copy.
- Closing invitations feel related but keep their page-specific content.
- Heroes gain grouping without being boxed into closing panels.
- The system uses no new tokens, JavaScript, or hardcoded palette values.
- Tracked snapshots match the live DB bodies after deployment.
- Focus, contrast, target size, stacking, and overflow checks pass.
- Theme version and documentation accurately describe the shipped component.

## Alternatives considered

### Universal panel

Using the same framed panel in heroes and closings offers one simple recipe, but it boxes in the homepage and About compositions and competes with their imagery. Rejected.

### Button-only upgrade

Changing button geometry and adding directional marks requires less markup, but closing groups still float without hierarchy and arrows overstate actions that are not directional. Rejected.

### Global `core/buttons` styling with exclusions

Broad selectors would be fragile as new buttons are added and would risk compact controls. Explicit opt-in classes provide a stable component boundary. Rejected.
