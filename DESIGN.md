---
name: "HPerkins Tokens / Imladris"
description: "The Quiet Council Ledger: an evidence-first editorial system for hperkins.blog."
colors:
  primary: "#2E4A3A"
  primary-hover: "#24402F"
  primary-press: "#1C2E24"
  primary-subtle: "#EDF3ED"
  secondary: "#3F6E89"
  secondary-light: "#BAD2DF"
  secondary-subtle: "#DCE9F0"
  tertiary: "#C29A44"
  tertiary-hover: "#B08A3A"
  tertiary-focus: "#9A7530"
  tertiary-deep: "#6E531B"
  tertiary-subtle: "#F4EBCF"
  page: "#F5EFE1"
  raised: "#FAF6EC"
  sunken: "#ECE4D2"
  cool: "#EEF1ED"
  inverse: "#1E2730"
  inverse-deep: "#161D24"
  text-strong: "#1B231D"
  text-body: "#313B33"
  text-muted: "#515C52"
  text-disabled: "#94A095"
  text-inverse: "#FAF6EC"
  border-hair: "#DED2B8"
  border-soft: "#DCE3DD"
  status-done: "#4E7459"
  status-review: "#B7842F"
  status-pending: "#6E7A6E"
  danger: "#9C4A33"
typography:
  display:
    fontFamily: "'HPerkins Cormorant Garamond', 'Hoefler Text', Georgia, serif"
    fontSize: "clamp(3rem, 2.091rem + 4.545vw, 5.5rem)"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "-0.01em"
  page-title:
    fontFamily: "'HPerkins Cormorant Garamond', 'Hoefler Text', Georgia, serif"
    fontSize: "clamp(2.5rem, 1.955rem + 2.727vw, 4rem)"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "'HPerkins Cormorant Garamond', 'Hoefler Text', Georgia, serif"
    fontSize: "clamp(2rem, 1.636rem + 1.818vw, 3rem)"
    fontWeight: 500
    lineHeight: 1.22
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'HPerkins Cormorant Garamond', 'Hoefler Text', Georgia, serif"
    fontSize: "clamp(1.5rem, 1.227rem + 1.364vw, 2.25rem)"
    fontWeight: 500
    lineHeight: 1.22
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'HPerkins EB Garamond', 'Iowan Old Style', Georgia, serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0"
  ui:
    fontFamily: "'HPerkins EB Garamond', 'Iowan Old Style', Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  control:
    fontFamily: "'HPerkins Marcellus', 'Optima', 'Palatino Linotype', serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.08em"
  label:
    fontFamily: "'HPerkins Marcellus', 'Optima', 'Palatino Linotype', serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.04em"
  mono:
    fontFamily: "'HPerkins JetBrains Mono', 'SFMono-Regular', ui-monospace, monospace"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  status:
    fontFamily: "'HPerkins JetBrains Mono', 'SFMono-Regular', ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0"
  link-control:
    fontFamily: "'HPerkins EB Garamond', 'Iowan Old Style', Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0"
  scale:
    "2xs": "0.75rem"
    xs: "0.8125rem"
    sm: "0.9375rem"
    base: "1.0625rem"
    md: "1.1875rem"
    lg: "1.375rem"
    xl: "1.75rem"
    "2xl": "clamp(1.5rem, 1.227rem + 1.364vw, 2.25rem)"
    "3xl": "clamp(2rem, 1.636rem + 1.818vw, 3rem)"
    "4xl": "clamp(2.5rem, 1.955rem + 2.727vw, 4rem)"
    "5xl": "clamp(3rem, 2.091rem + 4.545vw, 5.5rem)"
rounded:
  xs: "2px"
  sm: "4px"
  md: "7px"
  lg: "12px"
  xl: "20px"
  pill: "999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.5rem"
  "6": "2rem"
  "7": "2.5rem"
  "8": "3rem"
  "9": "4rem"
  "10": "5rem"
  "12": "7rem"
  "16": "10rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-inverse}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "0.72em 1.5em"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.text-inverse}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "0.72em 1.5em"
  button-primary-active:
    backgroundColor: "{colors.primary-press}"
    textColor: "{colors.text-inverse}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "0.72em 1.5em"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "0.72em 1.5em"
  button-secondary-hover:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.primary}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "0.72em 1.5em"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "0.72em 1.5em"
  button-ghost-hover:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.primary}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "0.72em 1.5em"
  button-accent:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.text-strong}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "0.72em 1.5em"
  button-accent-hover:
    backgroundColor: "{colors.tertiary-hover}"
    textColor: "{colors.text-strong}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "0.72em 1.5em"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.link-control}"
    rounded: "0"
    padding: "0.72em 0"
  field:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text-strong}"
    typography: "{typography.ui}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  chip-done:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.text-strong}"
    typography: "{typography.status}"
    rounded: "{rounded.xs}"
    padding: "0.5rem 0.85rem"
  chip-review:
    backgroundColor: "{colors.tertiary-subtle}"
    textColor: "{colors.text-strong}"
    typography: "{typography.status}"
    rounded: "{rounded.xs}"
    padding: "0.5rem 0.85rem"
  chip-pending:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.text-strong}"
    typography: "{typography.status}"
    rounded: "{rounded.xs}"
    padding: "0.5rem 0.85rem"
  action-rail:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.lg}"
    padding: "0.25rem"
  evidence-board:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text-strong}"
    rounded: "{rounded.md}"
    padding: "1rem 1.5rem"
  ring-card:
    backgroundColor: "{colors.inverse}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.lg}"
    padding: "2rem 1.5rem"
  council-subscribe:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-inverse}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "42px"
    width: "116px"
---

# Design System: HPerkins Tokens / Imladris

## Overview

**Creative North Star: "The Quiet Council Ledger"**

Imladris should feel like a quiet council chamber whose working record is open on the table: warm, literate, deliberate, and organized around evidence. The visual system translates the product commitment “Trust is structural.” into visible relationships between claims, states, sources, and next actions. It is editorial enough to reward reading and operational enough to make provenance immediately scannable.

Parchment is the persistent field; Ink carries the argument; Evergreen marks identity and primary action; Bruinen River identifies openable evidence; Mallorn Gold signals focus, active navigation, and rare ceremonial emphasis; Twilight creates the inverse plates reserved for signature moments. Typography moves between literary voice and documentary precision without collapsing into either fantasy pastiche or a generic software dashboard.

Components are restrained evidence instruments. Hairlines, left rules, tonal registers, and redundant status marks do most of the structural work. Ambient shadows appear only where a surface is genuinely raised. The system rejects generic SaaS gloss, neon AI spectacle, unsupported fantasy ornament, and decoration that competes with proof.

**Key Characteristics:**

- Warm parchment fields with disciplined Evergreen action and sparing Mallorn Gold signals.
- Editorial serif hierarchy paired with machine-set labels for state, provenance, and evidence.
- Records and registers whose text, dot shape, rule width, and color communicate together.
- Registered depth: flat documents by default, selectively lifted menus, controls, and feature plates.
- Responsive, keyboard-operable behavior that preserves the repository’s currently verified accessibility contracts without implying broader certification.

## Colors

The palette is a natural archive: warm paper, botanical action, river-blue evidence, muted gold signals, and deep Twilight inverse surfaces.

### Primary

- **Evergreen** (#2E4A3A): the brand and default primary-action color. Evergreen Hover (#24402F) and Evergreen Press (#1C2E24) carry interaction; Evergreen Wash (#EDF3ED) is the restrained hover or completed-state surface.
- **Evergreen Success** (#4E7459): the completed-state mark. Use it on a fixed rule or filled dot beside a written status, never as the only carrier of meaning.

### Secondary

- **Bruinen River** (#3F6E89): identifies openable proof references and informational records. Bruinen River Light (#BAD2DF) keeps compact text legible on Twilight; Bruinen River Wash (#DCE9F0) supplies quiet supporting surfaces.

### Tertiary

- **Mallorn Gold** (#C29A44): provides accent fills and rules. Mallorn Hover (#B08A3A) deepens accent controls; Mallorn Focus (#9A7530) is the verified focus-ring and active-navigation color; Mallorn Deep (#6E531B) keeps small gold labels readable; Mallorn Wash (#F4EBCF) carries review surfaces.
- **Mallorn Review** (#B7842F): marks an unresolved review state beside a written label and hollow dot.

### Neutral

- **Parchment Page** (#F5EFE1): the persistent canvas. Parchment Raised (#FAF6EC) holds cards, Parchment Sunken (#ECE4D2) creates recessed bands, and Parchment Hairline (#DED2B8) draws warm boundaries.
- **Ink Strong** (#1B231D): headings and decisive labels. Ink Body (#313B33) carries reading copy, Ink Muted (#515C52) carries support, and Ink Disabled (#94A095) marks unavailable or quiet boundaries.
- **Mist** (#EEF1ED): a cool neutral for secondary evidence areas. Mist Border (#DCE3DD) separates cool regions without importing another accent.
- **Twilight** (#1E2730): the inverse surface for ring cards, the footer, and deliberate feature plates. Twilight Deep (#161D24) strengthens scrims; neither is a second page background.
- **Rust Danger** (#9C4A33): the invalid-state color. It stays local to the affected field or message.
- **Ink Pending** (#6E7A6E): a neutral unresolved state, always accompanied by its written label and hollow mark.

### Named Rules

**The Gold Signal Rule.** Mallorn Gold marks focus, active position, review, or a deliberate accent; it does not become a broad decorative fill.

**The Evidence Hue Rule.** Status color is always reinforced by a written state and a filled or hollow mark, fixed-width rule, or both.

**The Parchment Field Rule.** The default experience remains a warm document. Cool Mist and dark Twilight are bounded supporting regions, not competing canvases.

## Typography

**Display Font:** HPerkins Cormorant Garamond (with Hoefler Text, Georgia, and serif fallbacks)

**Body Font:** HPerkins EB Garamond (with Iowan Old Style, Georgia, and serif fallbacks)

**Label Font:** HPerkins Marcellus (with Optima, Palatino Linotype, and serif fallbacks)

**Mono Font:** HPerkins JetBrains Mono (with SFMono-Regular, system monospace, and monospace fallbacks)

**Character:** Cormorant provides the council voice, EB Garamond carries sustained explanation, Marcellus names destinations and actions with lapidary restraint, and JetBrains Mono records status and provenance. The pairing feels literary because the hierarchy is typographic, not because the interface imitates a manuscript.

### Hierarchy

- **Display** (500, fluid 48–88px, 1.08): the one exceptional hero statement above the page title — today the journal masthead; tightly tracked and balanced.
- **Page Title** (500, fluid 40–64px, 1.08): the primary `<h1>`, set by the `h1` element style in `theme.json`, and therefore the opening heading on every ordinary route.
- **Headline** (500, fluid 32–48px, 1.22): major page sections and editorial turns.
- **Title** (500, fluid 24–36px, 1.22): cards, feature groups, and subordinate sections.
- **Body** (400, 19px, 1.7): primary reading copy with a 68ch maximum measure.
- **Lead** (400, 22px, 1.7): opening summaries with a narrower 46ch measure where emphasis benefits comprehension.
- **UI** (400, 17px, 1.5): controls and explanatory interface copy.
- **Label** (400, 13px, 1.5, 0.04em): Marcellus labels; uppercase only when the control or landmark needs a compact engraved voice.
- **Mono** (400, 15px, 1.5): artifacts and technical data. Compact statuses use 13px; exceptional Council cues may use 8–9px only where their meaning is repeated elsewhere.

The roles name the jobs; `typography.scale` in the frontmatter is the ramp itself, mirroring the
`theme.json` font-size presets step for step — fixed steps at 12, 13, 15, 17, 19, 22, and 28px,
then four fluid heading clamps at 24–36, 32–48, 40–64, and 48–88px. Authors choose from that ramp
and nothing else: the editor offers no arbitrary type size.

### Named Rules

**The Four Voices Rule.** Cormorant speaks titles, EB Garamond explains, Marcellus names and acts, and JetBrains Mono records state. Do not exchange their jobs for novelty.

**The Reading Floor Rule.** Reading copy stays at 19px, controls at 17px, and explanatory evidence at 15px or larger; smaller type is reserved for redundant metadata and the documented Council-header exceptions.

**The One-H1 Rule.** Each rendered page preserves one primary heading and a semantic heading order; visual scale never substitutes for document structure.

## Layout

The spatial model is a document with registers. Primary prose lives in a centered 44rem column, wide editorial and evidence compositions may grow to 72rem, and exceptional full compositions stop at 84rem. The spacing scale starts at 4px and advances through 8, 12, 16, 24, 32, 40, 48, 64, 80, 112, and 160px. Most component interiors use 12–24px; section changes use the larger steps.

The Council header is a centered three-column bar at desktop widths: brand at the start, navigation on the optical center, and search plus subscription at the end. It is 68px high with 24px inline padding. At 781px and below it becomes a 62px bar and a flat, full-width drawer with 50px navigation rows, a 46px search control, and a 48px subscription action.

At 600px and below, prominent action rails and other multi-control groups stack to full width. The 781/782px boundary governs the principal navigation and column transition. The 56rem boundary governs wider editorial compositions, while 359px, 400px, 680px, and 920px exceptions remain local to the surfaces that need them. Long headings, paths, and identifiers wrap rather than creating horizontal overflow.

**The Register Rhythm Rule.** Align titles, state labels, artifacts, and explanatory copy to the same spacing scale so evidence reads as one record rather than a pile of cards.

**The Mobile Reach Rule.** Interactive controls retain the implemented 44px target floor where pinned; mobile layouts stack before text, controls, or evidence can overflow.

## Elevation & Depth

The system uses **registered depth**. Ordinary prose, ledger entries, artifacts, and status records remain flat and gain structure from warm tonal changes, hairlines, and fixed-width status rules. Small ambient shadows mark controls and contained registers; medium shadows mark closing panels and inverse cards; large shadows are reserved for menus, drawers, and genuinely floating overlays. Inset shadows belong to form controls, while the gilt inset is a quiet edge treatment for signature inverse plates.

### Shadow Vocabulary

- **Control trace** (`0 1px 2px rgba(27,35,29,0.06)`): primary and subscription controls.
- **Register lift** (`0 1px 3px rgba(27,35,29,0.07), 0 1px 2px rgba(27,35,29,0.05)`): action rails and evidence boards.
- **Panel lift** (`0 4px 14px rgba(27,35,29,0.08), 0 2px 5px rgba(27,35,29,0.05)`): closing invitations and ring cards.
- **Overlay lift** (`0 12px 32px rgba(27,35,29,0.12), 0 4px 10px rgba(27,35,29,0.06)`): Council menus and the mobile drawer.
- **Feature lift** (`0 24px 60px rgba(22,29,36,0.18), 0 8px 18px rgba(22,29,36,0.08)`): rare large inverse or showcase surfaces.
- **Field inset** (`inset 0 1px 2px rgba(27,35,29,0.07)`): input interiors.
- **Gilt edge** (`inset 0 0 0 1px rgba(194,154,68,0.38)`): signature Twilight plates, paired with another structural cue.

### Named Rules

**The Flat Record Rule.** A document record does not float merely because it is bounded. Add elevation only when the surface changes interaction or stacking context.

**The One-Level Lift Rule.** Use the smallest shadow that explains the surface. Do not stack ambient shadows to create spectacle.

**The Calm Motion Rule.** State transitions use 140–240ms calm easing; larger veils may use 420–700ms. Reduced-motion preference removes decorative menu, drawer, and chosen-link animation.

## Shapes

The form language is gently architectural rather than pill-heavy. Two-pixel corners belong to chips and tiny cues; 4px corners belong to registers and compact tiles; 7px corners belong to controls and ordinary cards; 12px corners belong to grouped rails, closing panels, and signature cards; 20px corners are rare; full pills are limited to categorical or social tokens. A 30px radius is reserved for the phone-frame silhouette.

Hairlines define paper regions. State-bearing rules keep a fixed anatomy by component: 7px on chips, 3px on work entries and quotations, and 5px on evidence rows. State changes the rule color, not its width.

**The Registered Edge Rule.** Small, repeated records use small corners; broader feature surfaces earn broader corners. Do not round every object to the same generic radius.

**The Fixed Anatomy Rule.** State changes color, fill, and wording while geometry remains stable. A review item cannot look structurally larger than a completed item.

## Components

### Buttons

Buttons are confident labels, not glossy capsules.

- **Shape:** gently curved (7px) with 0.72em × 1.5em padding and a 44px minimum target in content.
- **Primary:** Evergreen surface, Parchment text, Marcellus at 17px, uppercase with 0.08em tracking, and the control-trace shadow.
- **Hover / Active:** darken through the Evergreen scale; active state presses by 0.5px and scales to 0.99 without a theatrical bounce.
- **Focus:** a 3px Gold 700 outline with a 2px offset, preserved even when parent-theme rules change source order.
- **Secondary:** transparent with Evergreen text and a one-pixel inset brand border; the hover surface is pale Evergreen.
- **Ghost:** transparent Evergreen text without a shadow; pale Evergreen appears only on hover.
- **Accent:** Mallorn Gold with strong Ink text; use only when the action is meaningfully distinct from the primary path.
- **Link:** EB Garamond, sentence case, no horizontal padding, no radius, and no shadow.

### Prominent Action Rails

An action rail groups an opted-in set of major page actions without redefining every button. It uses 4px padding and gap, a 12px corner, a Parchment-sunken-to-raised wash, a warm hairline, and register lift. At 600px and below, its actions stack and become full width. Closing invitations may place the rail inside a 12px panel with 24px padding, a 3px Mallorn rule, panel lift, and a faint emblem.

### Inputs / Fields

Fields are quiet ledger controls: a Marcellus 13px uppercase label above a Parchment 50 control with a 1.5px Ink border, 7px corners, 12px inline inset, 10px vertical input padding, and a restrained inset shadow. Focus moves the border to Gold 700 and adds a 2px Gold 700 outline with a 2px offset. Invalid state changes the border and helper copy to Rust while preserving the written message.

### Chips

Status chips are machine-set labels with a 13px mono voice, 8px × 13.6px padding, 2px corners, and a fixed 7px leading rule. Completed states use a filled dot and pale Evergreen; review and pending states use hollow dots with Mallorn or neutral surfaces. Category chips deliberately remove the status rule and dot and may use the pill silhouette.

### Work Registers

Work entries sit in a 4px clipped register separated by warm hairlines. Each row uses 16px × 24px padding and a fixed 3px state rule. The mono uppercase label records state; the serif title names the work; supporting copy explains it at the 17px UI floor. Links use a restrained evidence-colored underline rather than a button treatment.

### Evidence Boards

The evidence board is the clearest expression of the Quiet Council Ledger. It uses a 7px corner, warm hairline, faint 32px technical grid, raised Parchment, and register lift. Its 16px × 24px header establishes the claim; rows use the same inset plus a fixed 5px state rule, a mono status label, a serif evidence title, and explanatory metadata at 15px or larger.

### Artifact Registers

Artifacts form a flat, hairline-bounded row with 4px corners. Mono legends state what each artifact verifies; Bruinen River links identify the openable proof. Long repository names and paths may break inside their cell. On stacked layouts, internal dividers rotate from vertical to horizontal rather than disappearing.

### Ring Cards

Ring cards are the deliberate inverse exception: Twilight plates with 12px corners, 32px × 24px padding, panel lift, and a gilt inset edge. A faint image or element-tinted veil may sit behind the content at roughly 22% image opacity, but the dark foot must preserve text contrast. Cormorant carries the action word; Marcellus and mono carry compact identity and state. The grid stacks before a card becomes too narrow.

### Navigation

The Council header uses Marcellus labels, a small Evergreen star, and a centered 26px Gold 700 rule for hover, current, and expanded states. Desktop menus are raised Parchment sheets with the 7px control corner and overlay lift. The small Digest cue uses a pale Mallorn surface and deep Mallorn text. Mobile navigation becomes a flat reachable drawer rather than a miniature desktop menu; disclosure state, focus restoration, keyboard operation, and reduced motion remain part of the component contract.

### Footer

The footer is a bounded Twilight plate with a faint backdrop, a Mallorn top rule, Cormorant identity, Marcellus metadata, mono colophon details, and restrained pill-shaped social links. It closes the document; it does not introduce a competing visual world.

## Do's and Don'ts

### Do:

- **Do** treat `theme.json` as the normative source for color, type, spacing, radius, shadow, and motion tokens.
- **Do** place visible state and inspectable evidence beside material claims.
- **Do** preserve the four typographic voices and the 44rem reading measure.
- **Do** reinforce status with words, dot shape, and fixed-width rules in addition to color.
- **Do** preserve the implemented Gold 700 focus treatments, keyboard-operable disclosures, focus restoration, and reduced-motion behavior.
- **Do** test containment at the repository’s narrow viewports and let long headings, paths, and labels wrap safely.
- **Do** distinguish a flat record from a raised overlay through both border and depth treatment.

### Don't:

- **Don't** introduce arbitrary colors, gradients, type sizes, spacing, or radii outside the governed token system.
- **Don't** turn Mallorn Gold into a dominant background or decorative wash; its rarity is part of its meaning.
- **Don't** use generic white floating cards, glossy SaaS controls, neon AI effects, or unsupported fantasy ornament.
- **Don't** rely on color alone for completion, review, pending, danger, current navigation, or focus.
- **Don't** wrap compact header, form, or specimen controls in a prominent action rail; the composition is selective and opt-in.
- **Don't** hide focus outlines, shrink pinned touch targets, or animate past a reduced-motion preference.
- **Don't** describe these safeguards as comprehensive WCAG certification; they document the accessibility behavior currently verified by this repository.
