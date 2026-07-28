# About Page Proof-First Redesign

**Date:** 2026-07-28
**Status:** Visual and content direction approved; written specification awaiting review
**Selected direction:** Proof-first portfolio and résumé hybrid

## Context

The About page already establishes unusual credibility through public projects,
upstream WordPress records, a coherent visual system, and a career narrative
that connects support, implementation, documentation, and operations. Its
current composition asks one page to act as an introduction, résumé, evidence
register, capability inventory, credential statement, and project index.

At approximately 1,300 visible words, the page repeats its positioning across
the hero, role tags, impact strip, AI Leaders paragraph, Throughline section,
self-quotation, and capability cards. The strongest work appears after the
experience, skills, and education sections. Five small impact cells and several
successive bordered-card treatments make the first half dense and flatten the
relative importance of the evidence.

The redesign keeps the existing Imladris identity and proof vocabulary while
changing the page's editorial order. Visitors should understand the kind of
work, inspect the strongest proof, and find a next action before they encounter
the compact résumé detail.

## Goals

- Establish one memorable positioning statement for WordPress and AI work.
- Put selected shipped work and externally controlled evidence before the
  résumé chronology.
- Reduce visible copy by roughly 25–35%, targeting 850–950 words.
- Replace five broad impact claims with three concrete, defensible signals.
- Preserve the portrait, evidence board, experience record, skills, education,
  résumé download, and public artifact links.
- Promote the named DJ Lee & Voices of Judah client delivery into selected work.
- Make the remaining long page easy to scan with compact in-page navigation.
- End with a deliberate contact invitation rather than an unrenewed project
  grid.
- Preserve accessible heading order, keyboard navigation, focus visibility,
  44px prominent actions, and overflow-free layouts down to 320px.

## Non-goals

- Redesigning the global header, footer, Button primitive, EvidenceBoard,
  experience-row anatomy, or design-token vocabulary.
- Adding JavaScript, animation, a new Gutenberg block, or a new external
  dependency.
- Rewriting the Work index or the individual case-study pages.
- Inventing metrics that do not have a public or otherwise verifiable source.
- Changing the résumé PDF or presenting this page as a complete employment
  chronology.
- Publishing directly to production before the candidate body has passed local
  source and rendered review.

## Positioning and hero copy

The hero uses a professional category, a concise audience statement, and one
plain-language delivery promise. It does not use a conventional job title as
the page's primary heading.

- **Eyebrow:** `About · Henry Perkins`
- **H1:** `WordPress / AI Implementation & Enablement`
- **Strapline:** `For teams building stuff with tokens.`
- **Lead:** `I turn emerging AI capabilities into shipped, WordPress-shaped systems—and build workflows teams can own after handoff.`
- **Primary action:** `Get in touch` → `/contact/`
- **Secondary action:** `View résumé (PDF)` → the existing one-page résumé

“WordPress-shaped” is deliberate. It distinguishes systems designed around
WordPress conventions, extensibility, governance, and operational realities
from generic AI wrappers. “Building stuff with tokens” is also deliberate: it
connects LLM tokens with the design-token system demonstrated by this site.

The existing role-tag row is removed. The H1, strapline, and lead now carry the
positioning without a second list of overlapping labels. The portrait remains
in the hero and keeps its existing accessible alternative text.

## Information architecture

The page follows this order:

| Order | Section | Purpose |
|---|---|---|
| 1 | Hero | State the category, audience, delivery promise, and two actions. |
| 2 | Proof signals | Establish three concrete facts without a five-cell wall of claims. |
| 3 | On-this-page navigation | Link to Work, Contributions, Experience, Skills, and Contact. |
| 4 | Selected work | Show four shipped/public projects before résumé history. |
| 5 | Core AI contributions | Preserve externally controlled upstream evidence. |
| 6 | Capabilities | Explain implementation, enablement, and durable handoff in three concise units. |
| 7 | Selected experience | Retain the relevant chronology with fewer, stronger bullets. |
| 8 | Skills and foundations | Combine toolkit, AI Leaders credential, and education in a balanced composition. |
| 9 | Closing invitation | Renew the contact and résumé actions after the long scroll. |

The old standalone `AI Leaders, first cohort` and `Throughline` sections are
removed. Their strongest facts move into Skills and foundations and the
Capabilities introduction. The self-attributed quotation is removed rather
than restyled.

## Proof signals

The impact strip contains exactly three cells:

1. **WordPress since 2012**
   Support, delivery, and product work across the WordPress ecosystem.
2. **4 public projects**
   Shipped work across WordPress AI, Cloudflare, and the web.
3. **2 upstream outcomes**
   One merged contribution and one reported defect fixed.

The cells use the existing signal-strip anatomy but gain more room per item.
They do not introduce new claims about volume, team size, revenue, performance,
or support throughput.

## In-page navigation

A compact `On this page` landmark follows the proof signals. It links to stable
anchors for:

- `Work` → `#selected-work`
- `Contributions` → `#core-ai-contributions`
- `Experience` → `#selected-experience`
- `Skills` → `#skills-and-foundations`
- `Contact` → `#contact`

The landmark has an accessible name, uses ordinary same-page links, exposes a
visible focus state, and wraps without horizontal scrolling. No sticky
behavior, scroll animation, or active-section tracking is added.

## Selected work

Selected work moves directly below the page navigation and contains four
projects in this order:

1. **Flavor Agent** — governed WordPress AI actions and review-gated mutation.
2. **AI Provider for Codex** — a WordPress AI Client provider with a local
   sidecar and per-user authentication.
3. **DJ Lee & Voices of Judah** — the named booking-first client delivery,
   served by one Cloudflare Worker with a validated booking endpoint.
4. **Tableau** — the deployed React and Cloudflare AI application.

`HPerkins.com` leaves this grid. The site remains implicit proof of the work and
does not need to occupy one of four scarce project positions.

Each project keeps a concise impact statement of no more than 50 words, a
compact technology row, and explicit text links chosen from this vocabulary:

- `View case study`
- `Open live site`
- `View source`

Cards are not whole-card links because several contain more than one
destination. The existing whole-card hover illusion is removed; hover and focus
feedback belongs to the actual links. At the wide measure, the four cards form a
balanced two-by-two grid instead of a three-column row with one orphaned card.

## Core AI contributions

The existing EvidenceBoard remains immediately after Selected work. It retains
the three current evidence rows and their status/kind treatments:

- WordPress/ai PR #501, merged and credited in AI Plugin 1.0.0.
- WordPress/ai issue #529, reported and fixed upstream in 1.0.1.
- The current request-logging and agent-skills record, with open/closed state
  stated accurately rather than implied as merged.

The introduction is shortened to one sentence. Externally controlled links,
dates, release states, and the fixed ledger-row anatomy remain unchanged unless
fresh verification proves a claim has moved.

## Capabilities

The section heading becomes:

> **AI workflows, WordPress delivery, and durable handoffs**

One short introduction carries the former Throughline idea: support,
consulting, community, and operations all shaped a practice of turning
ambiguous inputs into inspectable systems another person can maintain.

Three capability units remain:

1. **AI implementation and governed workflows** — model/API integration,
   agent boundaries, evaluation, review gates, and safe mutation.
2. **WordPress delivery and support** — discovery, implementation,
   troubleshooting, deployment, and post-launch ownership.
3. **Documentation and developer enablement** — reusable guidance,
   maintainable handoffs, onboarding, and translation between users,
   support, product, and engineering.

Each unit is limited to one short paragraph. The cards continue to use existing
tokens and do not gain new decorative states.

## Selected experience

The heading becomes `Selected experience`, making the page's intentionally
curated chronology explicit. It retains four entries:

- Independent Technology Consultant, Lakefront Digital.
- Shift Supervisor, Starbucks.
- Happiness Engineer, Automattic / WordPress.com.
- Developer Community Manager, PageLines.

The Micro Center entry moves out of the page; the résumé remains the complete
chronology. Each retained entry uses one or two outcome-oriented bullets.
Lakefront Digital keeps the named DJ Lee delivery and public WordPress artifact
references. The remaining entries keep only evidence that supports
implementation, enablement, troubleshooting, documentation, community, or
repeatable operations.

A short footer points to the PDF for the full chronology. No date is concealed
or rewritten, and no unverified scale metric is added.

## Skills and foundations

The unbalanced Skills/Education split becomes a two-column
`Skills and foundations` section:

- The larger column contains four compact skill groups: WordPress and web
  delivery; AI and automation; support and enablement; tools and workflow.
- The smaller column stacks the AI Leaders credential above the two existing
  education records.

The AI Leaders copy is reduced to the verifiable facts: finalist in the first
UIC and WordPress Foundation cohort supported by Automattic, with the existing
public showcase link. The longer philosophy paragraph is not repeated here.

Skill tags are pruned to demonstrated or explicitly qualified capabilities.
Python remains labeled as familiarity. The section stacks into one column at
the existing mobile breakpoint and must not leave an isolated Education column
with a large blank lower half at desktop widths.

## Closing invitation

The page ends with the existing shared `hp-action-panel is-closing`
composition:

- **Anchor:** `contact`
- **Eyebrow:** `Work together`
- **H2:** `Build the handoff into the system.`
- **Body:** `If your team is shaping WordPress and AI systems that need to ship—and stay operable—let’s compare notes.`
- **Primary action:** `Start a conversation` → `/contact/`
- **Secondary action:** `View résumé (PDF)` → the existing one-page résumé

The action order remains primary then secondary in both DOM and visual order.
The panel reuses the established action rail, decorative emblem, responsive
stacking, and 44px target contract.

## Visual treatment

- Keep narrative copy at the established 44rem measure and dashboard-like
  evidence/project sections at the established 72rem wide measure.
- Preserve the parchment, evergreen, gold, river, serif, mono, and ledger
  vocabulary already implemented by the About template.
- Reduce the signal strip from five cells to three larger cells.
- Use a two-column project grid at the wide breakpoint and one column below
  56rem.
- Remove project-card hover elevation because the card itself is not a link.
- Reuse existing EvidenceBoard, capability, experience, tag, Button,
  action-rail, and closing-panel primitives.
- Add only the scoped styles needed for the strapline, page navigation,
  two-column project grid, and revised Skills/foundations balance.
- Introduce no new color, spacing, type, radius, shadow, or motion token.

The existing `style.css` About composition is adjusted in place rather than
split across both stylesheets. This avoids making one already-established page
layer depend on competing rules in `assets/imladris-pages.css`. Because
`style.css` changes, its theme version must advance and be mirrored in
`readme.txt` with an accurate changelog entry.

## Content ownership and review flow

The visitor-facing `/about/` body is database-owned. The repository artifacts
have distinct roles:

- `content/page-drafts/about.html` is the reviewed candidate body.
- `patterns/about-resume.php` is the reusable seed/reference copy.
- `content/page-snapshots/about.html` remains an exported mirror of the
  canonical database body; it is not hand-authored as the candidate.
- `templates/page-about.html` remains the post-content shell and does not
  absorb the page body.

Implementation extends the existing guarded local-draft workflow so
`scripts/apply-local-page-drafts.js --confirm-local --page=about` applies only
the About candidate to a local WordPress installation. The default behavior for
the two existing recruiter drafts must not silently begin applying About.

The required sequence is:

1. Author and source-verify the About candidate and seed pattern.
2. Apply only the About candidate to a disposable local WordPress site.
3. Render-review desktop and mobile compositions.
4. Export only About with
   `node scripts/export-page-snapshots.js --page=about`.
5. Confirm the export matches the accepted candidate after normalization.
6. Run the content-ownership verifier against the local database.
7. Publish the accepted body through the site's normal deployment workflow.
8. Re-run the public rendered checks before calling the page live.

No `HPERKINS_WP_PATH` is configured in the current session. Filesystem and
source-verifier work can therefore complete here, but database parity and live
deployment remain explicit later gates unless a matching local installation is
provided.

## Accessibility and responsive behavior

- The page contains exactly one H1 and no skipped heading levels.
- The on-page navigation has an accessible name and remains keyboard operable.
- Every anchor target receives normal scroll positioning and can be identified
  by its heading; no script moves focus automatically.
- Actual project links, not their surrounding cards, own hover and focus
  affordances.
- Existing global focus-visible outlines remain unsuppressed.
- Prominent action links remain at least 44px high.
- The portrait alternative text remains `Henry Perkins`.
- Status continues to be expressed with words as well as color.
- At 56rem and below, project and capability grids become one column.
- At 781px and below, hero and Skills/foundations columns stack.
- At 600px and below, action rails stack their actions full-width.
- At 320px, headings, links, cards, tags, and navigation wrap without
  horizontal overflow.
- Reduced-motion behavior remains unchanged because the redesign adds no
  animation.

## Verification strategy

Implementation follows test-first development. A focused About source verifier
is written and observed failing before candidate markup or CSS changes.

The source verifier must assert:

- the exact H1, strapline, lead, and action labels;
- one H1 and a valid H1/H2/H3 outline;
- exactly three proof signals with the approved claims;
- five valid on-page navigation links and five matching unique anchors;
- Selected work precedes Core AI contributions and contains the four approved
  projects in the approved order;
- DJ Lee is present and HPerkins.com is absent from Selected work;
- project actions use only the approved vocabulary;
- the old `AI all day. Everything else too.`, `Throughline`, and self-quotation
  copy are absent;
- the heading `Selected experience` and exactly four experience entries;
- the AI Leaders credential remains linked;
- the closing panel, exact closing copy, action order, and destinations;
- 850–950 visible words;
- the candidate draft is registered for explicit local application without
  changing the script's default recruiter-draft selection.

Rendered verification must cover `/about/` at 1440px, 1024px, 768px, 390px,
and 320px and assert:

- no horizontal overflow;
- two-by-two projects at the wide breakpoint and one column below 56rem;
- focus visibility for jump links, project links, and both action rails;
- no project-card hover-only affordance;
- 44px prominent action targets;
- correct target scrolling for all five page-navigation links;
- sensible stacking of the hero and Skills/foundations composition.

Repository checks include:

```text
php -l patterns/about-resume.php
node --test scripts/lib/about-page-contract.test.js
node scripts/verify-about-page-source.js
node scripts/verify-prominent-actions.js
node scripts/verify-typography.js --source-only
node scripts/verify-performance-assets.js
node scripts/verify-content-ownership-docs.js
find . -name '*.php' -print0 | xargs -0 -n1 php -l
git diff --check
```

After a matching local database is available:

```text
node scripts/apply-local-page-drafts.js --confirm-local --page=about
node scripts/export-page-snapshots.js --page=about
node scripts/verify-content-ownership.js
```

## Acceptance criteria

- The hero uses the approved WordPress / AI implementation-and-enablement
  positioning and no competing role-tag list.
- A visitor reaches four selected projects and upstream proof before résumé
  chronology.
- The page contains 850–950 visible words and none of the removed repetitive
  sections.
- The signal strip contains three defensible facts.
- DJ Lee replaces HPerkins.com in Selected work.
- Project destinations and actions are explicit; cards no longer pretend to be
  whole-card links.
- Experience is visibly labeled as selected rather than exhaustive.
- Skills, AI Leaders, and education form a balanced desktop section and a
  coherent mobile stack.
- The closing invitation restores clear contact and résumé actions.
- No new token, dependency, JavaScript behavior, or unsupported factual claim is
  introduced.
- Source, accessibility, responsive, PHP, and repository checks pass.
- The tracked snapshot is updated only by exporting an accepted database body.

## Alternatives considered

### Narrative-first biography

Leading with Throughline and AI Leaders would preserve more personality before
the portfolio evidence, but it would continue delaying the work visitors are
most likely to inspect. Rejected.

### Project-only showcase

Expanding the page into deep project case studies would foreground engineering
proof, but it would duplicate the Work index and individual case-study routes
while obscuring support and enablement experience. Rejected.

### Conventional résumé page

A short professional summary followed immediately by chronology would be easy
to scan, but it would discard the externally controlled evidence and distinctive
WordPress/AI point of view that make this portfolio credible. Rejected.
