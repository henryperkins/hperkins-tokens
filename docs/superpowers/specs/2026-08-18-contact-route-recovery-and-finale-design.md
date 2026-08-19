# Contact Route Recovery and Finale Design

**Date:** 2026-08-18

**Status:** Approved by the user on 2026-08-19

**Selected direction:** Preserve-and-return mail handoff with recovery tools,
named profile links, governed contact measures, and a contact-only bridge into
the unchanged shared subscribe plate

## Context

The 0.3.60 Contact fidelity pass gives `/contact/` the right composition: the
hero and message panel share a centred 600px column, the lead keeps its own
54ch reading measure, and the 44rem Twilight subscribe plate closes on a wider
spine. That alignment is accepted. It is not reopened by this specification.

The review found five remaining problems around that composition:

1. The enhanced form replaces the visitor's completed message with a handoff
   panel, then `Compose another` resets every field. If the external mail client
   did not open, the visitor loses the message at the moment recovery matters.
2. `Send message` describes a completed delivery, but the page only asks the
   browser to open an email draft. The site cannot know whether a handler
   opened, whether the draft survived, or whether the visitor sent it.
3. Direct channels are visible only as brand marks. Their accessible names are
   sound, but a sighted visitor still has to recognize three unlabeled icons.
4. The new 600px and 54ch dimensions are literals beside a `theme.json` tree
   that already owns named containers and measures.
5. The subscribe plate is visually successful but becomes the route's strongest
   closing moment without explaining why a visitor who came to make contact is
   being offered a newsletter.

This design resolves all five without turning the mailto form into a site-side
submission system, weakening the accepted alignment, duplicating the subscribe
pattern, or claiming that an external application did something the browser
cannot verify.

## Job and audience

The route serves hiring leads, prospective clients, collaborators, and readers
who have decided to contact Henry or inspect another direct channel. They may
have no desktop mail handler, may return from an interrupted app switch, or may
prefer webmail and need to copy the prepared message manually.

The primary job is to leave the visitor with a usable message and an honest next
step. The page succeeds when the visitor can open an email draft, recover every
entered value if that handoff fails, or choose a clearly named alternative
without retyping anything. Subscription remains a secondary follow-the-work
path, not the implied completion of the contact task.

The visitor mode is **Operate** through the message handoff and **Persuade** only
at the final optional subscribe plate. Operational clarity wins whenever the
two modes compete.

## Goals

- Preserve every entered form value until the visitor explicitly edits or
  clears it.
- Describe the mailto handoff before and after activation without presenting
  `sent`, `delivered`, or another unverifiable outcome as a positive result.
- Give a failed handoff three bounded recovery actions: return to the message,
  copy the prepared message, or copy the recipient address.
- Make GitHub, LinkedIn, and WordPress.org recognizable from visible text as
  well as icons.
- Move the contact column and lead measure into the normative token source.
- Add a narrative bridge between Direct channels and the shared subscribe
  plate while leaving the plate's shared copy and behavior unchanged.
- Preserve keyboard use, focus visibility, no-JavaScript mailto behavior,
  mobile containment, and the site's no-storage privacy statement.

## Non-goals

- Sending, proxying, storing, autosaving, or logging contact-form values on the
  site.
- Adding a form plugin, server endpoint, CRM integration, attachment upload, or
  delivery receipt.
- Detecting whether an operating-system mail handler opened or whether a
  message was sent; the browser cannot prove either event reliably.
- Persisting draft values in cookies, local storage, session storage, the
  WordPress database, analytics, or a remote service.
- Redesigning the accepted 600px hero/form alignment, the 54ch lead, field
  styling, direct-channel destinations, subscribe endpoint, or global footer.
- Changing the shared subscribe plate's kicker, title, blurb, form, status
  copy, or appearances on `/essays/` and single-post routes.
- Creating a second contact-specific subscribe pattern.
- Expanding this specification into an implementation plan.

## Selected experience

### 1. Form entry

The current privacy sentence stays above the form. It continues to state that
the site does not receive or store the entered fields and that an email the
visitor chooses to send is handled by the two email providers.

The field inventory stays Name, Email, Subject, and Message. The Email field
remains required because the prepared message carries it as the explicit reply
address; a value the interface requires must not disappear from the handoff.

The primary control label becomes:

> **Open email draft**

This label is identical with and without JavaScript. It describes the browser's
requested action rather than a delivery result. The adjacent direct-email link
and canonical address remain visible as the immediate fallback.

### 2. Prepared message

One prepared-message record owns the canonical recipient, the visitor's subject
or existing default subject, and a body in this order:

```text
<message>

— <name, when supplied>
Reply to: <required email address>
```

The enhanced mailto request encodes that record's subject and body. `Copy
message` returns a portable recovery block that includes the subject before the
same body:

```text
Subject: <subject>

<body from the prepared-message record>
```

There is one prepared-message record, not separate mailto and clipboard models
that can drift. `Copy email address` returns its canonical recipient. Empty
optional Name and Subject values do not create empty labels or extra separators;
the default subject is present in both the mailto request and recovery block.

The native no-JavaScript form remains a real `mailto:` fallback. JavaScript may
prepare a cleaner subject and body, but enhancement never changes the privacy
boundary: no form value is posted to the site.

### 3. Handoff panel

After a valid enhanced submit, the form is replaced visually by the light
Imladris handoff card already selected for 0.3.60. The original form node and
all of its values remain intact in memory for the life of the page. This state
is a handoff, not a success state.

The exact card copy is:

- **Title:** `Message ready to send`
- **Body:** `Nothing was sent from this page. If a draft opened, review and
  send it in your mail app. If nothing opened, return to your message or copy
  it below.`

The card receives focus when it replaces the form so keyboard and screen-reader
users encounter the result of their action. Its live/status semantics announce
the handoff once without repeatedly announcing later focus movement.

The card presents exactly three recovery actions, in this order:

1. **Return to message** — restores the completed form with every field intact
   and places focus in the Message field. It never calls form reset.
2. **Copy message** — copies the subject and prepared body as the specified
   portable recovery block.
3. **Copy email address** — copies the canonical recipient address.

`Return to message` is the visually strongest recovery action. The two copy
actions are quieter controls but retain the 44px target floor and visible focus.
No fourth action, dismiss control, or automatic reset is added.

The visitor can edit the restored form and activate `Open email draft` again.
Starting another message means editing or clearing the restored fields by
choice; the interface never interprets recovery as consent to erase them.

### 4. Clipboard feedback

Each copy action reports one local result beside the action group:

- `Message copied.`
- `Email address copied.`
- `Copy failed. Return to your message and copy it manually.`

Success uses status semantics; failure uses alert semantics. Feedback does not
move focus away from the activated control. If browser clipboard access is
unavailable or denied, the failure state leaves the message recoverable through
`Return to message` and does not hide either copy control.

Copying is a browser-local action. It must not introduce storage, telemetry, or
a network request.

### 5. Direct channels

The Direct channels row keeps the current three destinations and outline icon
family, but each target becomes a compact named pill:

- `GitHub`
- `LinkedIn`
- `WordPress.org`

The icon reinforces the visible word and stays decorative. The link text
provides the accessible name, so a redundant `aria-label` is unnecessary unless
it is byte-identical to that text. Each pill retains at least a 44px block size,
wraps as a whole, and never truncates a destination name.

At the contact-column width all three may sit in one row. On narrow screens they
wrap in source order without shrinking text or targets. A two-plus-one wrap is
acceptable; icon-only fallback is not.

### 6. Contact-specific subscribe bridge

The route adds one contact-owned sentence between Direct channels and the
shared subscribe plate:

> **Not ready to start a conversation? Follow the work through the occasional
> dispatch.**

This is a narrative hinge, not a new heading, button, or second subscription
component. It aligns to the governed contact column, then hands off to the wider
44rem Twilight plate. The plate keeps the accepted symmetric desktop overhang
and naturally collapses to the available width on mobile.

The bridge belongs to the Contact pattern and appears only on `/contact/`. The
existing `hperkins-tokens/imladris-subscribe` pattern remains the sole owner of
the plate and keeps its shared copy byte-for-byte. The bridge therefore requires
no pattern duplication and cannot change essays or single posts accidentally.

## Token and layout contract

`theme.json` becomes the normative owner of the two accepted Contact values:

```text
settings.custom.container.contact = 600px
settings.custom.measure.contactLead = 54ch
```

They generate and are consumed as:

```text
--wp--custom--container--contact
--wp--custom--measure--contact-lead
```

The hero, message panel, and contact-only subscribe bridge use the contact
container token. The lead uses the contact-lead measure token. The shared
subscribe plate keeps the template's 44rem content container.

The 600px contact container and the existing 600px component-stack breakpoint
have different meanings even though their current numeric values match. The
container is a design token usable in declarations; the breakpoint remains the
established responsive boundary for the two-column Name/Email row. Neither one
is derived from the other, and documentation must not describe them as one
token.

Because these values enter `theme.json`, the downstream design narrative and
generated `.impeccable/design.json` sidecar must reflect them. The current
0.3.60 candidate version remains valid while unreleased; a later implementation
must not assume a version bump beyond 0.3.60 unless that version has already
shipped.

## Hierarchy and responsive behavior

The accepted desktop hierarchy remains:

1. 600px hero and closing hairline
2. 600px message form and Direct channels
3. 600px contact-to-subscribe bridge
4. 44rem Twilight subscribe plate

At 600px and below, the Name/Email row stacks. At narrower viewports, all four
regions resolve to the available main-column width; the plate no longer
overhangs because there is no spare spine. The handoff card and its three
actions stack before their labels can wrap into ambiguous fragments.

The contract is overflow-free at 320px, 390px, 600px, 601px, and the established
desktop probe. The confirmation card's spacing may respond at the narrowest
widths, but its gold ring, check mark, title hierarchy, and action order remain
unchanged.

## Accessibility and privacy

- Native labels, required state, inline invalid-email feedback, and the gold
  focus treatment remain intact.
- The handoff panel is focusable and announced once; clipboard status is
  announced without stealing focus.
- All four handoff controls—the original submit plus three recovery actions—
  retain the established 44px target floor where they render.
- Direct-channel icons are decorative because visible text names every link.
- No state relies on color alone, and no clipboard result relies on iconography
  alone.
- Returning to the form restores the full editable state and a predictable
  focus location.
- No draft data survives reload, route navigation, or tab closure. That is an
  intentional consequence of the no-storage promise, not an autosave defect.
- The page never says or implies that the site sent, received, delivered,
  retained, or verified the visitor's message.

## Source ownership and boundaries

- The Contact pattern owns form copy, visible channel labels, and the
  contact-only subscribe bridge.
- The progressive-enhancement script owns mailto formatting, the transient
  handoff state, preservation and restoration, clipboard behavior, and local
  feedback.
- `theme.json` owns contact container and lead-measure values.
- The Contact section of the page stylesheet owns route composition using those
  generated variables.
- Shared confirmation primitives remain in the always-on stylesheet; the light
  Contact card stays scoped away from the inverse subscribe variant.
- `hperkins-tokens/imladris-subscribe` remains the sole subscribe-plate source
  and the existing endpoint remains the sole storage/network path on the route.
- `docs/design-system/INDEX.md` records the final Contact mapping and deliberate
  deviations once the design is implemented.

## Material states

The finished route defines these states explicitly:

| State | Required result |
|---|---|
| No JavaScript | `Open email draft` uses the native mailto form; direct email, named channels, bridge, and subscribe plate remain usable. |
| Invalid email | Existing inline error appears, the field receives focus, and no handoff or clipboard state mounts. |
| Valid enhanced submit | Browser receives the prepared mailto request; the non-success handoff panel replaces the form visually while preserving it intact. |
| External app switch and return | Handoff panel remains; all original values are recoverable. |
| Return to message | Original values reappear unchanged and Message receives focus. |
| Copy succeeds | Matching local status is announced; focus stays on the copy control. |
| Copy fails | Actionable alert is announced; Return to message remains available. |
| Repeated submit | The latest edited values produce both the mailto body and clipboard body. No duplicate listeners or panels appear. |
| Router navigation back to Contact | A fresh form renders; no previous visitor data is restored. |
| Subscribe result | Existing success and error behavior remains unchanged and independent of the contact handoff state. |

## Verification contract

The focused Contact verifier must prove behavior rather than merely pinning
copy or CSS source:

- the hero, message panel, and bridge resolve to the contact container token and
  hang on one left edge at desktop width;
- the lead resolves to the contact-lead measure token;
- the submit control reads `Open email draft` with and without enhancement;
- the prepared mailto body contains Message, optional Name, and required reply
  address in the specified order, while the copied recovery block also contains
  the resolved subject;
- the handoff panel uses the exact non-delivery copy and receives focus;
- a valid submit followed by `Return to message` restores every original value
  byte-for-byte and does not reset the form;
- clipboard success and forced failure both produce the specified feedback and
  retain a recovery path;
- the three profile destinations render visible names, decorative outline
  icons, 44px targets, and intact wrapping;
- the contact-only bridge renders once on `/contact/` and nowhere the shared
  subscribe pattern appears independently;
- the shared subscribe pattern's copy, endpoint, statuses, and inverse anatomy
  remain unchanged;
- the route has no horizontal overflow and no clipped action labels at 320px,
  390px, 600px, 601px, and desktop width;
- source checks reject a literal Contact column or lead measure outside the
  owning `theme.json` values;
- no form value is written to browser storage or sent to an HTTP endpoint.

The runtime cannot prove that an external mail client opened or that mail was
sent, so neither condition is an acceptance criterion. The testable contract is
the attempted mailto handoff plus complete local recovery.

## Acceptance criteria

- The accepted 600px/54ch alignment and 44rem subscribe plate remain visually
  intact.
- No visitor action after valid submission erases entered values implicitly.
- The interface says `Open email draft` and never describes the mail as sent.
- Return, message-copy, and address-copy recovery work from the handoff panel
  with clear accessible feedback.
- The mailto request and copied recovery block derive from one prepared-message
  record and include the required reply address; the recovery block also
  includes the resolved subject.
- GitHub, LinkedIn, and WordPress.org are visibly named.
- Contact dimensions resolve from `theme.json`, not parallel literals.
- A single contact-only bridge explains the newsletter transition while the
  shared subscribe pattern remains unchanged everywhere.
- No new storage, analytics, server submission, pattern duplicate, or privacy
  claim is introduced.
- Keyboard, focus, target-size, reduced-motion, responsive, and overflow
  contracts continue to pass.

## Alternatives considered

### Preserve only

Restoring the completed form without copy actions avoids data loss but still
leaves visitors with no efficient webmail path after a failed handler. Rejected
in favor of the approved preserve-plus-recovery model.

### Keep the form visible beneath confirmation

Leaving the full form on screen makes recovery obvious, but it duplicates the
active task beneath a status card, weakens focus management, and makes the
handoff state visually noisy. Rejected.

### Reset through `Compose another`

The current model is compact but treats recovery as a request to destroy data.
Rejected. No automatic reset remains in the selected design.

### Change the shared subscribe copy

A contact-specific kicker or blurb inside the reusable plate would require a
new invocation interface and create a risk of changing essay and single-post
instances. A duplicate pattern would create a second maintained component.
Rejected in favor of one external Contact-owned bridge sentence.

### Reduce the subscribe plate

Narrowing or visually muting the Twilight plate would remove its deliberate
closing role and reopen the accepted composition. Rejected. The selected bridge
clarifies the transition without weakening the plate.
