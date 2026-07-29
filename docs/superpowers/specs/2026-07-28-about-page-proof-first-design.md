# About Page Proof-First Redesign

**Date:** 2026-07-28

**Status:** Revised after independent review; awaiting written-spec approval

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
changing the editorial order. Visitors should understand the kind of work,
inspect the strongest proof, and find a next action before they encounter the
compact résumé detail.

## Review resolutions

The independent content, UX/accessibility, and WordPress feasibility reviews
identified gaps in the first written draft. This revision resolves them with
explicit contracts for project states and destinations, headings, fragment
focus, responsive boundaries, word counting, CSS ownership, database
promotion, rollback, and deployed parity.

The section name **Core AI Contributions** is intentionally retained. Core AI
is the official name used by the [Make WordPress AI
Team](https://make.wordpress.org/ai/), and the heading identifies work in that
recognized project area adjacent to Core. It does not claim that every listed
artifact was merged into the WordPress Core codebase.

## Goals

- Establish one memorable positioning statement for WordPress and AI work.
- Put selected released, live, and public work plus externally controlled
  evidence before résumé chronology.
- Reduce visible copy by roughly 25–35%, targeting 850–950 words.
- Replace five broad impact claims with three concrete, defensible signals.
- Preserve the portrait, EvidenceBoard, a clearly labeled four-role selected
  experience record, skills, education, résumé download, and public artifact
  links.
- Promote the named DJ Lee & Voices of Judah client delivery into Selected
  Work.
- Make the remaining long page easy to scan with compact in-page navigation.
- End with a deliberate contact invitation rather than ending abruptly on the
  project grid.
- Preserve accessible heading order, keyboard navigation, focus visibility,
  44px prominent actions, and overflow-free layouts down to 320px.
- Keep one human-authored About candidate and prevent the seed pattern from
  becoming a third maintained copy of the page body.

## Non-goals

- Redesigning the global header, footer, Button primitive, EvidenceBoard,
  experience-row anatomy, or design-token vocabulary.
- Adding JavaScript, animation, a new Gutenberg block, or an external
  dependency.
- Rewriting the Work index or individual case-study pages.
- Inventing metrics that do not have a public or otherwise verifiable source.
- Changing the résumé PDF or presenting this page as a complete employment
  chronology.
- Calling a release candidate stable, implying that every featured project is
  shipped, or implying that every Core AI artifact landed in WordPress Core.
- Weakening the localhost-only draft-application guard or adding production
  database credentials to this theme repository.
- Publishing the candidate body before source, local database, rendered, and
  factual-evidence review has passed.

## Positioning and hero copy

The hero uses a professional category, a concise audience statement, and one
plain-language delivery promise. It does not use a conventional job title as
the page's primary heading.

- **Eyebrow:** `About · Henry Perkins`
- **H1:** `WordPress / AI Implementation & Enablement`
- **Strapline:** `For teams building stuff with tokens.`
- **Lead:** `I turn emerging AI capabilities into shipped, WordPress-shaped systems—and build workflows teams can own after handoff.`
- **Primary action:** `Get in touch` → `/contact/`
- **Secondary action:** `View résumé (PDF)` →
  `/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf`

“WordPress-shaped” is deliberate. It distinguishes systems designed around
WordPress conventions, extensibility, governance, and operational realities
from generic AI wrappers. “Building stuff with tokens” is also deliberate: it
connects LLM tokens with the design-token system demonstrated by this site.

The existing role-tag row is removed. The H1, strapline, and lead carry the
positioning without a second list of overlapping labels. The portrait remains
in the hero and keeps the alternative text `Henry Perkins`.

## Information architecture

The page follows this order:

| Order | Section | Purpose |
|---|---|---|
| 1 | Hero | State the category, audience, delivery promise, and two actions. |
| 2 | Proof signals | Establish three concrete facts without a five-cell wall of claims. |
| 3 | On-this-page navigation | Link to Work, Contributions, Capabilities, Experience, Skills, and Contact. |
| 4 | Selected Work | Show four featured projects with their actual release or deployment states. |
| 5 | Core AI Contributions | Preserve externally controlled upstream evidence. |
| 6 | Capabilities | Explain implementation, enablement, and durable handoff in three concise units. |
| 7 | Selected Experience | Retain the relevant chronology with fewer, stronger bullets. |
| 8 | Skills and Foundations | Combine toolkit, AI Leaders credential, and education in a balanced composition. |
| 9 | Closing invitation | Renew the contact and résumé actions after the long scroll. |

The old standalone `AI Leaders, first cohort` and `Throughline` sections are
removed. Their strongest facts move into Skills and Foundations and the
Capabilities introduction. The self-attributed quotation is removed rather
than restyled.

## Proof signals

The impact strip contains exactly three cells:

1. **WordPress work dating to 2012**

   Support, delivery, and product work across the WordPress ecosystem.
2. **4 featured projects**

   One stable release, two live deployments, and one public release candidate.
3. **2 upstream outcomes**

   One contribution merged; one reported defect fixed upstream.

The cells use the existing signal-strip anatomy but gain more room per item.
They do not introduce new claims about volume, team size, revenue, performance,
or support throughput. The second signal describes the four curated items on
this page, not the total number of public projects in the wider portfolio.

## In-page navigation

A compact navigation landmark labeled `On this page` follows the proof signals.
It is authored as one core Custom HTML block (`core/html`, serialized between
`<!-- wp:html -->` and `<!-- /wp:html -->` comments). The block has exactly one
root element: `<nav class="hp-about-nav" aria-label="On this page">`. Inside
that root, a visible non-heading `On this page` label precedes one list of
exactly six ordinary same-page links in this DOM and visual order:

1. `Work` → `#selected-work`
2. `Contributions` → `#core-ai-contributions`
3. `Capabilities` → `#capabilities`
4. `Experience` → `#selected-experience`
5. `Skills` → `#skills-and-foundations`
6. `Contact` → `#contact`

The navigation does not use the core Navigation block, create a navigation
entity, or add a new block type. Custom HTML is already an established
repository precedent and keeps the navigation landmark editor-stable without
serializing an unsupported Group attribute.

Each fragment identifier is unique. Each target is a core Group block with
`tagName:"section"` and the corresponding H2 as its first heading. The target
sections do not receive `aria-label` or `aria-labelledby`; fragment targets do
not need accessible names, and six extra named regions would add landmark
noise. `router-scroll.js` focuses the section itself, after which its H2 is the
first heading in reading order.

Links remain in document flow and may wrap to multiple rows without
reordering. Every link renders at least 24px wide and 24px high, exposes the
existing focus-visible treatment, and causes no horizontal scrolling. No
sticky positioning, active-section tracking, or new scroll behavior is added.

## Heading and section outline

The page body contains exactly one H1 and only the following H2 and H3
headings. Each section H2 is the first heading in its section. Evidence-row
titles, skill-group labels, education records, eyebrows, the strapline, signal
values, and `On this page` remain non-heading text.

| Level | Exact text | Required ancestor |
|---|---|---|
| H1 | `WordPress / AI Implementation & Enablement` | `.hp-about-hero` |
| H2 | `Selected Work` | `section#selected-work` |
| H3 | `Flavor Agent` | `section#selected-work` |
| H3 | `AI Provider for Codex` | `section#selected-work` |
| H3 | `DJ Lee & Voices of Judah` | `section#selected-work` |
| H3 | `Tableu` | `section#selected-work` |
| H2 | `Core AI Contributions` | `section#core-ai-contributions` |
| H2 | `AI workflows, WordPress delivery, and durable handoffs` | `section#capabilities` |
| H3 | `AI implementation and governed workflows` | `section#capabilities` |
| H3 | `WordPress delivery and support` | `section#capabilities` |
| H3 | `Documentation and developer enablement` | `section#capabilities` |
| H2 | `Selected Experience` | `section#selected-experience` |
| H3 | `Independent Technology Consultant` | `section#selected-experience` |
| H3 | `Shift Supervisor` | `section#selected-experience` |
| H3 | `Happiness Engineer` | `section#selected-experience` |
| H3 | `Developer Community Manager` | `section#selected-experience` |
| H2 | `Skills and Foundations` | `section#skills-and-foundations` |
| H3 | `Skills` | first column of `section#skills-and-foundations` |
| H3 | `AI Leaders` | second column of `section#skills-and-foundations` |
| H3 | `Education` | after `AI Leaders` in the second column |
| H2 | `Build the handoff into the system.` | `section#contact` |

Every project, capability, and résumé-entry H3 is a descendant of its governing
H2 section. `Core AI Contributions` is exact, including capitalization.

## Selected Work

Selected Work moves directly below the page navigation. Its eyebrow is
`Public proof`. The four projects appear in the following order with exact
visible copy:

`HPerkins.com` leaves this grid. This hperkins.blog implementation remains
ambient proof and does not occupy one of four scarce project positions.

Project titles are plain-text H3s. Every project action link renders at least
24px wide and 24px high. Actions remain in the same browsing context.

| Project | Exact status and impact | Exact technology tags | Exact ordered actions |
|---|---|---|---|
| Flavor Agent | `Release candidate · v0.1.0-rc.3`<br>`Builds governed WordPress AI actions around bounded operations, human review, server-side attribution, freshness checks, and drift-safe rollback before an agent changes live settings or content.` | `WordPress`; `AI governance`; `Abilities API`; `MCP` | `View Flavor Agent case study` → `/work/flavor-agent/`; `View Flavor Agent release` → `https://github.com/henryperkins/flavor-agent/releases/tag/v0.1.0-rc.3`; `View Flavor Agent source` → `https://github.com/henryperkins/flavor-agent` |
| AI Provider for Codex | `Released · stable v2.1`<br>`Connects Codex text and image models to the WordPress AI Client through a local sidecar, per-user device login, and a read-only connector status screen inside WordPress.` | `WordPress`; `PHP`; `AI Client`; `Codex` | `View AI Provider for Codex case study` → `/work/ai-provider-for-codex/`; `View AI Provider for Codex release` → `https://github.com/henryperkins/ai-provider-for-codex/releases/tag/v2.1`; `View AI Provider for Codex source` → `https://github.com/henryperkins/ai-provider-for-codex` |
| DJ Lee & Voices of Judah | `Delivered · live site`<br>`Carries a booking-first client site from discovery through launch and support, with one Cloudflare Worker serving the frontend and a validated booking API for inquiries.` | `Cloudflare Workers`; `JavaScript`; `Booking API`; `Static site` | `View DJ Lee case study` → `/work/dj-lee-voices-of-judah/`; `Open DJ Lee live site` → `https://thevoicesofjudah.com`; `View DJ Lee source` → `https://github.com/henryperkins/dj-judas-v2` |
| Tableu | `Deployed · live application`<br>`Delivers multiple tarot spreads and LLM-generated reading narratives through a React interface backed by Cloudflare Workers, D1, KV, and R2 services in a live application.` | `React`; `Cloudflare Workers`; `D1 / KV / R2`; `LLM` | `Open Tableu live application` → `https://tarot.lakefrontdev.com/`; `View Tableu source` → `https://github.com/henryperkins/tarot` |

Cards are not whole-card links. Hover and focus feedback belongs only to the
actual links. Hovering a non-link portion of a card must not change the card's
border, background, shadow, transform, or elevation. At the wide measure, the
four cards form a balanced two-by-two grid.

## Core AI Contributions

The existing EvidenceBoard remains immediately after Selected Work with this
exact header copy:

- **Kicker:** `Externally verified WordPress AI work`
- **H2:** `Core AI Contributions`
- **Summary:** `The strongest proof lives in records I do not control: merged upstream work, release notes, maintainer fixes, and open review threads.`

It retains exactly three evidence rows with this exact copy, link structure,
and status/kind treatment:

| Row | Status/kind classes | Exact label | Exact linked title | Exact meta |
|---|---|---|---|---|
| 1 | `is-status-merged is-kind-docs` | `WordPress/ai PR #501 · merged May 18, 2026` | `Experiment documentation credited in AI Plugin 1.0.0` → `https://github.com/WordPress/ai/pull/501` | `Authored Content Resizing and Title Generation experiment docs; the 1.0.0 release notes list PR #501 under Various documentation updates.` |
| 2 | `is-status-merged is-kind-issue` | `WordPress/ai issue #529 · fixed in 1.0.1` | `Guidelines content-type defect reported and fixed upstream` → `https://github.com/WordPress/ai/issues/529` | `Reported the defect; a maintainer fixed it in PR #593, and AI Plugin 1.0.1 records the change.` |
| 3 | `is-status-review is-kind-review` | `Current state · request logging and agent skills` | `Issue #732` → `https://github.com/WordPress/ai/issues/732`; `PR #757` → `https://github.com/WordPress/ai/pull/757`; `agent-skills PR #49` → `https://github.com/WordPress/agent-skills/pull/49` | `Filed the sidecar/custom-transport request-logging issue; PR #757 remains open and unmerged. Authored WordPress 7.0+ AI Client, Connectors, AI Plugin, Abilities, and MCP guidance in PR #49; it closed without merge on July 18, 2026.` |

Externally controlled links, dates, release states, redundant textual status
labels, and the fixed ledger-row anatomy remain. A change in external state
updates the affected exact copy; it does not change the three-row composition
without a new design decision.

### Evidence baseline and freshness gate

The following states were checked on 2026-07-28 through the public GitHub REST
API and redirect-following HTTP requests. The live-site checks returned HTTP
200. The table is the persisted review record for this specification, but it
is not permission to assume the same state at publication time.

| Claim | 2026-07-28 baseline | Evidence |
|---|---|---|
| Core AI name | Official Make WordPress AI team/project language | `https://make.wordpress.org/ai/` |
| WordPress/ai PR #501 | Merged 18 May 2026 | `https://github.com/WordPress/ai/pull/501` |
| WordPress/ai issue #529 | Closed; linked fix shipped in 1.0.1 | `https://github.com/WordPress/ai/issues/529` |
| WordPress/ai issue #732 | Open | `https://github.com/WordPress/ai/issues/732` |
| WordPress/ai PR #757 | Open and unmerged | `https://github.com/WordPress/ai/pull/757` |
| WordPress/agent-skills PR #49 | Closed without merge on 18 July 2026 | `https://github.com/WordPress/agent-skills/pull/49` |
| Flavor Agent | Latest named card release is public RC `v0.1.0-rc.3` | `https://github.com/henryperkins/flavor-agent/releases/tag/v0.1.0-rc.3` |
| AI Provider for Codex | Stable release `v2.1` | `https://github.com/henryperkins/ai-provider-for-codex/releases/tag/v2.1` |
| DJ Lee & Voices of Judah | Public site responds; source is public; booking-email delivery was not tested | `https://thevoicesofjudah.com`; `https://github.com/henryperkins/dj-judas-v2` |
| Tableu | Public application responds; source is public; public title and canonical README identify the product as `Tableu` | `https://tarot.lakefrontdev.com/`; `https://github.com/henryperkins/tarot` |

Immediately before production promotion, a reviewer revisits every URL, records
the check date and observed state in the implementation review notes, and
updates this specification and the candidate if any release tag, pull request,
issue, date, credit, or live destination changed. An unresolved or unreachable
proof blocks publication. Automated exact-copy checks establish conformance;
they do not replace this factual review.

The publication freshness gate ran on 2026-07-29. It confirmed the planned
evidence states and corrected the public product name from `Tableau` to
`Tableu` in the candidate and exact contract, matching the live application
title and the canonical `henryperkins/tarot` README.

## Capabilities

The exact H2 is:

> **AI workflows, WordPress delivery, and durable handoffs**

The eyebrow is `Capabilities`. The exact introduction is:

> Support, consulting, community, and operations taught me to turn ambiguous
> inputs into inspectable systems another person can maintain.

Three capability units remain with exactly one paragraph each:

| H3 | Exact paragraph |
|---|---|
| `AI implementation and governed workflows` | `I connect models and APIs to bounded agent workflows, then add evaluation, review gates, attribution, and safe mutation paths before anything reaches a live system.` |
| `WordPress delivery and support` | `I carry WordPress work from discovery and troubleshooting through implementation, deployment, and post-launch support, keeping operational ownership visible before and after handoff.` |
| `Documentation and developer enablement` | `I write reusable guidance and onboarding paths that translate between users, support, product, and engineering, so another person can operate and improve the system confidently.` |

Capability copy describes transferable practice and does not repeat project
feature lists. The units continue to use existing tokens and gain no
decorative state.

## Selected Experience

The eyebrow is `Selected résumé`. The exact H2 is `Selected Experience`,
making the intentionally curated chronology explicit. It retains these four
entries and exactly six bullets:

| H3 role | Dates | Organization/location | Exact bullets |
|---|---|---|---|
| `Independent Technology Consultant` | `Oct 2022 – Present` | `Lakefront Digital · Greater Chicago Area, IL` | `Delivered the DJ Lee & Voices of Judah booking-first site from discovery through launch and post-launch support on one Cloudflare Worker.`<br>`Maintains public WordPress work with versioned releases, source verification, deployment checks, and documentation that teams can own after handoff.` |
| `Shift Supervisor` | `Apr 2019 – Sep 2022` | `Starbucks · Greater Chicago Area, IL` | `Coordinated frontline teams through high-volume shifts, handled escalations, and coached repeatable routines that preserved service, safety, and workflow standards under pressure.` |
| `Happiness Engineer` | `Oct 2012 – Nov 2012` | `Automattic, Inc. (WordPress.com) · Remote` | `Resolved WordPress.com publishing, site configuration, billing, domain, and DNS issues while capturing reproducible details for product and engineering teams to inspect.`<br>`Wrote clear troubleshooting that addressed root causes, reduced account and site-configuration confusion, and gave customers practical next steps they could follow.` |
| `Developer Community Manager` | `May 2012 – Oct 2012` | `PageLines, Inc. · Remote` | `Supported WordPress professionals through onboarding, tutorials, daily community work, and WordCamp representation while translating feedback into clearer product guidance for developers.` |

The Micro Center entry moves out of the page; the résumé remains the complete
chronology. Selected Work owns all project and artifact links. The Lakefront
DJ Lee bullet remains unlinked because it is employment evidence. The existing
Experience artifacts paragraph that repeats Flavor Agent, AI Provider for
Codex, and Core AI links is removed.

The exact footer is `Full chronology, including earlier roles, is in the PDF
résumé.`, with `PDF résumé` linked to the same résumé destination used in the
hero. No date is concealed or rewritten, and no unverified scale metric is
added.

## Skills and Foundations

`Skills and Foundations` uses a two-column grid at 782px and above. After the
inter-column gap is removed from the available width, its tracks use an exact
`2fr 1fr` ratio. Both tracks and their children use `min-width: 0`.

The first column contains H3 `Skills`, followed by exactly four compact skill
groups in this order:

| Exact group legend | Exact ordered tags |
|---|---|
| `WordPress and web delivery` | `WordPress`; `PHP`; `JavaScript`; `TypeScript`; `React`; `Cloudflare Workers` |
| `AI and automation` | `WordPress AI Client`; `Abilities API`; `MCP`; `OpenAI API integrations`; `Agent workflow prototyping`; `Prompt design` |
| `Support and enablement` | `Technical support`; `Escalation triage`; `Documentation`; `Customer onboarding`; `Developer enablement`; `Team coaching` |
| `Tools and workflow` | `Git`; `GitHub`; `REST APIs`; `Webhook configuration`; `Vite`; `Python · familiarity` |

The second column contains H3 `AI Leaders` and this exact sentence:

> Finalist in the first AI Leaders cohort, a University of Illinois Chicago and
> WordPress Foundation program supported by Automattic; view my portfolio on
> the program showcase.

The text `view my portfolio on the program showcase` links to
`https://aileaderswp.blog/`.

H3 `Education` follows with exactly these two records:

1. `A.S., Business Administration & Management` — `College of DuPage` —
   `2013`.
2. `Studies in Journalism & Mass Communications` — `Columbia College Chicago`
   — `2007 – 2008`.

The longer philosophy paragraph is not repeated.

At 781px and below, the grid becomes one column without CSS `order`. Mobile
reading order is therefore: section H2; Skills and its four groups; AI Leaders
and its showcase link; Education and its two records. The second desktop column
does not interleave with the skill groups.

## Closing invitation

The page ends with the existing shared `hp-action-panel is-closing`
composition:

- **Section anchor:** `contact`
- **Accessible section name:** `Build the handoff into the system.`
- **Eyebrow:** `Work together`
- **H2:** `Build the handoff into the system.`
- **Body:** `If your team is shaping WordPress and AI systems that need to ship—and stay operable—let’s compare notes.`
- **Primary action:** `Start a conversation` → `/contact/`
- **Secondary action:** `View résumé (PDF)` →
  `/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf`

The action order remains primary then secondary in both DOM and visual order.
The panel reuses the established action rail, decorative emblem, responsive
stacking, and 44px target contract.

## Editorial budget and deterministic word count

The inclusive visitor-facing target is 850–950 words, with approximately 900
preferred. These section caps keep the edit controlled:

| Content area | Projected exact-copy count | Maximum visible words |
|---|---:|---:|
| Hero | 37 | 45 |
| Proof signals and page navigation | 45 | 50 |
| Selected Work | 215 | 225 |
| Core AI Contributions | 147 | 150 |
| Capabilities | 112 | 120 |
| Selected Experience | 184 | 190 |
| Skills and Foundations | 105 | 110 |
| Closing invitation | 33 | 40 |
| **Projected / planned maximum** | **878** | **930** |

The projection applies the specified `Intl.Segmenter` algorithm to the exact
copy in this document before block markup is authored. The candidate and
rendered checks, not the projection, remain authoritative; the 20-word reserve
between the section maxima and the 950-word page ceiling is not permission to
add unspecific copy.

The shared About contract counts the selected About body, not the global
header, footer, or template shell. It:

1. rejects PHP, `script`, `style`, `template`, and elements carrying the HTML
   `hidden` attribute in the candidate;
2. allows decorative `aria-hidden="true"` descendants but removes those
   descendants in both source and rendered extraction;
3. removes Gutenberg and HTML comments plus HTML tags while preserving
   boundaries between adjacent text nodes;
4. decodes decimal and hexadecimal character references plus the named
   references used by the candidate, failing on an unknown named reference;
5. normalizes text to Unicode NFC, converts non-breaking spaces to spaces, and
   collapses Unicode whitespace;
6. segments English text with
   `Intl.Segmenter("en", { granularity: "word" })`; and
7. counts only segments where `isWordLike` is true.

Normative About word-count acceptance runs under Node 22.x. Both the source
and deployed-production CI jobs pin `node-version: '22'`, and the workflow
contract test asserts that agreement so their ICU data cannot drift by job. A
word count produced under another Node major is diagnostic only, not
acceptance evidence.

Visible headings, paragraphs, list items, signal copy, dates, statuses,
technology tags, navigation labels, and action labels count. HTML attributes,
URLs, alt text, ARIA labels, block metadata, comments, decorative
`aria-hidden` text, and CSS-generated content do not.

Unit fixtures cover entities, Unicode punctuation, `résumé`,
em-dash-separated words, comments, nested inline links, and action labels. The
source extractor removes `aria-hidden="true"` subtrees before stripping tags.
The rendered verifier clones
`.hp-about-template .wp-block-post-content`, removes `[hidden]` and
`[aria-hidden="true"]` descendants, and counts its `innerText` with the same
segmenter. Its canonical reported measurement uses a 1440 × 1000 CSS-pixel
viewport with `deviceScaleFactor: 1`. It repeats the extraction at the other
four primary viewports so responsive CSS cannot silently remove counted text;
every rendered total must equal the source total and fall within the inclusive
range. The boundary-only geometry probes do not produce additional word-count
records.

## Visual treatment and responsive boundaries

- Keep narrative copy at the established 44rem measure and dashboard-like
  evidence/project sections at the established 72rem wide measure.
- Preserve the parchment, evergreen, gold, river, serif, mono, and ledger
  vocabulary already implemented by the About template.
- Reduce the signal strip from five cells to three larger cells.
- Reuse existing EvidenceBoard, signal, experience, tag, Button, action-rail,
  and closing-panel primitives.
- Add only scoped page-layout styles for the strapline, page navigation,
  project/action grids, capability grid, and Skills and Foundations balance.
- Introduce no new color, spacing, type, radius, shadow, or motion token.

Responsive boundaries are exclusive and non-overlapping:

- At widths of 56rem and above, Selected Work renders as two columns and
  Capabilities as three columns. Below 56rem, both render as exactly one
  column. The implementation keeps the existing
  `@media (max-width: 55.99rem)` collapse convention; under the verifier's
  default CSS pixel scale, 896px is wide and 895px is narrow.
- At 782px and above, the hero copy and portrait render side by side, and
  Skills and Foundations renders two tracks. At 781px and below, the hero
  regions and Skills and Foundations each render as one column.
- At 782px and above, the three proof signals remain in one row. At 781px and
  below, they stack in one column using the existing signal-strip behavior.
- At 601px and above, each multi-action rail renders horizontally. At 600px
  and below, every multi-action rail stacks in DOM order and every action fills
  the rail width.
- Page-navigation and project-action rows wrap without reordering at every
  width.
- At 320px, no heading, link, card, tag, action, section, or navigation item
  increases `document.documentElement.scrollWidth` beyond
  `document.documentElement.clientWidth + 1px`.

Boundary verification covers 895/896px, 781/782px, and 600/601px in addition
to the primary 1440, 1024, 768, 390, and 320px viewports.

## CSS ownership

The current About page layer is a legacy exception inside `style.css`.
Implementation resolves that exception instead of extending it:

- Move every About-specific `.hp-about-template…` composition and layout rule
  from `style.css` to `assets/imladris-pages.css`.
- Split combined selectors where necessary so shared front-page or case-study
  component rules remain in `style.css`.
- Keep shared EvidenceBoard, signal, Button/action rail, ledger-row, tag,
  focus, and other component primitives in `style.css`.
- Delete moved selectors from `style.css`; do not leave compatibility
  duplicates.
- Add new About navigation, grid, and breakpoint rules only to
  `assets/imladris-pages.css`.

The source contract asserts that `style.css` contains no
`.hp-about-template` selector and that required About selectors occur in
`assets/imladris-pages.css`. `verify-style-token-usage.js` expands its authored
CSS scan to cover both sheets so moved rules do not lose token validation.

Because the migration removes rules from `style.css`, the theme `Version`
advances, `readme.txt` receives the same Stable tag and a truthful changelog
entry, and existing release-version checks remain green. File modification
times continue to provide asset cache keys.

### Documentation synchronization

Phase A updates the repository's current-state documentation in the same
commit as the ownership and CSS migration:

- `CLAUDE.md` adds About to the `assets/imladris-pages.css` page-layout list,
  describes `patterns/about-resume.php` as a thin adapter over the accepted
  snapshot, documents the explicit-only About draft command, and lists the new
  About source/rendered checks.
- `readme.txt` records the same About draft/snapshot/pattern ownership model
  and CSS location, alongside the Stable tag and changelog update.
- `docs/design-system/INDEX.md` maps the About candidate, accepted snapshot,
  thin pattern adapter, database-owned route, and page-layout stylesheet
  without presenting the candidate as deployed.
- `scripts/verify-content-ownership-docs.js` pins those three current-state
  descriptions and rejects the retired full-pattern-copy and
  About-in-`style.css` claims.

The Phase A wording describes the unchanged production body with its new
plumbing. It does not claim that the redesigned candidate is live before Phase
B promotion.

## Content ownership

The visitor-facing `/about/` body is database-owned. The repository keeps one
human-authored candidate and one export-only mirror:

| Artifact | Role | Hand-edit policy |
|---|---|---|
| `content/page-drafts/about.html` | Only human-authored candidate and guarded local-apply input | Editable while redesigning |
| Local and production `about.post_content` | Canonical visitor-facing body for that environment | Mutated only through controlled promotion |
| `content/page-snapshots/about.html` | Atomic export of the accepted database body | Never hand-edited |
| `patterns/about-resume.php` | Thin inserter adapter over the accepted snapshot | Adapter code only; no page markup |
| `templates/page-about.html` | Existing `wp:post-content` shell | No body content |

The candidate and snapshot may be byte-distinct only while review is in
progress. Acceptance requires normalized candidate ↔ local database ↔ snapshot
parity. Production acceptance additionally requires snapshot ↔ production
database parity.

### Thin About pattern adapter

`patterns/about-resume.php` keeps its WordPress pattern header but no longer
contains a second full About composition. It:

1. reads `content/page-snapshots/about.html`;
2. fails closed if the snapshot is absent or empty;
3. replaces only the known portrait URL and résumé asset URL occurrences with
   the existing `filemtime()`-derived URLs;
4. expects exactly one portrait and two résumé substitutions in Phase A,
   then exactly one portrait and three résumé substitutions in Phase B/final;
5. fails if the phase-specific substitution counts do not match; and
6. emits the trusted repository markup.

The adapter never reads the work-in-progress draft. It contains no H1,
EvidenceBoard row, project card, capability, experience entry, or education
record. Source verifiers inspect the selected candidate or snapshot for page
copy and inspect the pattern separately for this adapter contract.

## Guarded local candidate flow

The About entry in `scripts/lib/page-content-contract.js` gains draft metadata,
`applyByDefault: false`, `updateExistingOnly: true`, pattern metadata, and a
deployed-integrity flag. The two existing recruiter draft contracts gain their
current draft metadata and `applyByDefault: true`.

One shared `selectDraftContracts()` function drives local application.
Selector behavior is exact:

- no `--page` argument selects exactly the two existing recruiter drafts;
- `--page=about` selects only About and never unions it with defaults;
- repeated distinct `--page=<key>` arguments preserve argument order;
- empty, unknown, duplicate, malformed, or non-draft keys fail before WP-CLI
  runs;
- every selected file is resolved within the theme, read, checked nonempty,
  and hashed before the first mutation; and
- About requires an existing `/about/` page and updates only `post_content`;
  it does not rewrite title, slug, status, parent, or template assignment.

The implementation adds the repository's existing `assertMatchingSiteUrl()`
helper before any draft-file read or database mutation. Node then performs the
selection, path-containment, nonempty, and SHA-256 preflight for every draft.
It passes only bounded metadata—the contract key, theme-relative file path,
and expected hash—to `runWpEval`; draft bodies are never serialized into the
PHP source argv element or sent through stdin.

PHP retains responsibility for reading the bodies, as it does today. Before
the first mutation, the PHP evaluation resolves every validated relative path
with `get_theme_file_path()`, reads every file with `file_get_contents()`,
checks it is nonempty, verifies its SHA-256 against Node's expected hash, and
keeps the validated bodies in PHP memory. Only after every selected body
passes does the mutation loop begin. This second read closes the
Node-to-WP-CLI time-of-check/time-of-use gap while keeping the roughly 40 KB
About body off the Windows command line.

The applicator retains the current `--confirm-local`, local-host, and
active-child-theme checks. A greater-than-40-KB unit fixture proves that
generated WP-CLI arguments contain the relative path and expected hash but
not the draft body. No production mode is added to
`scripts/apply-local-page-drafts.js`.

## Pre-export parity and atomic snapshot writes

`scripts/export-page-snapshots.js` gains `--expect-draft` and `--check`.

For:

```text
node scripts/export-page-snapshots.js --page=about --expect-draft
```

the exporter:

1. validates selectors before querying WordPress;
2. reads the About draft and local database body;
3. normalizes only a leading UTF-8 BOM, CRLF line endings, and final trailing
   whitespace through the existing content-integrity helper;
4. aborts without writing unless draft and database body are identical;
5. writes a sibling temporary file with exclusive creation;
6. reads and hashes the temporary file;
7. renames it over the snapshot only after its hash matches; and
8. removes the temporary file on every failure path.

`--check` performs the selector, read, normalization, parity, and hash steps
without writing. Both modes print the draft, database, and resulting snapshot
SHA-256 values. No tracked snapshot is overwritten before candidate/database
parity is established.

## Production promotion, release order, and rollback

The theme repository does not own production database operations. Production
promotion uses the authenticated WordPress admin Code editor; the
localhost-only applicator remains unchanged.

To avoid a period in which new database markup and its theme plumbing disagree,
deployment uses three phases:

### Phase A: plumbing release with no About body change

1. Generalize the shared draft/export/deployed-integrity contracts.
2. Seed `content/page-drafts/about.html` from the unchanged accepted snapshot
   so the new explicit About draft contract references a real, parity-checked
   file without introducing the redesign.
3. Add About to the read-only integrity endpoint while the committed snapshot
   still matches the current production body.
4. Convert the pattern to the thin accepted-snapshot adapter and update
   prominent-action source inspection to read the accepted snapshot rather
   than expecting body markup inside the adapter.
5. Move the current About CSS to `assets/imladris-pages.css` without changing
   its rendered behavior.
6. Add the future selectors needed by the redesign while retaining the
   current selectors until content promotion.
7. Keep the current prominent-action expectation of one rail and no closing
   panel. Do not activate the final About source contract, `2/1` action
   expectation, dedicated About production-browser gate, or redesigned
   candidate/snapshot parity in this phase.
8. Update `CLAUDE.md`, `readme.txt`, `docs/design-system/INDEX.md`, and
   `scripts/verify-content-ownership-docs.js` with the Phase A ownership, thin
   pattern-adapter, CSS-location, draft-command, and verifier contracts. Apply
   the required `style.css`/`readme.txt` version and changelog update in this
   step.
9. Deploy and prove that the existing production About body still matches its
   unchanged snapshot and renders without regression.

### Phase B: reviewed content release

1. Add the redesigned candidate, exact About source/rendered contracts, final
   snapshot, Phase B pattern substitution count, and CI gates.
2. Switch the prominent-action About expectation to two rails and one closing
   panel.
3. Complete source review, guarded local application, rendered review, factual
   evidence review, and atomic snapshot export on the content branch.
4. Retain the old body’s compatibility selectors in
   `assets/imladris-pages.css` throughout the rollback window.
5. Make the branch merge-ready before opening the production maintenance
   window.
6. Read the current raw About body from the integrity endpoint, store it in a
   timestamped secure and gitignored backup, record its SHA-256, and record the
   current WordPress revision ID.
7. Confirm the production target is the published `/about/` page, currently
   expected as page ID 6; abort if path, title, or identity is unexpected.
8. In Pages → About → Code editor, replace `post_content` with the exact
   accepted `content/page-snapshots/about.html`; never paste pattern PHP.
9. Update once, record the new WordPress revision ID, and verify production
   against the branch candidate with `--drafts --page=about`.
10. Run the rendered About and prominent-action contracts against production.
11. Merge and deploy the content release, then verify production against the
    committed snapshot.

### Phase C: compatibility cleanup

After the agreed rollback window closes and the redesigned production body has
remained hash-identical to its snapshot, remove selectors used only by the old
body from `assets/imladris-pages.css`. Run the final source and production
browser gates again. This cleanup never moves About rules back to `style.css`.

Before Phase C, rollback restores the recorded pre-change WordPress revision
and requires that revision’s normalized body hash to equal the captured old
SHA-256. If it does not, paste the exact captured backup instead. After Phase C,
rollback first redeploys the recorded Phase A compatibility theme commit, then
restores the old database body. In both cases the integrity endpoint must
return the recorded old SHA-256 before rollback is complete. The private backup
is recovery evidence, not another maintained page source.

## Deployed content parity

About joins the existing public database-body integrity contract:

- `inc/content-integrity.php` adds `about` → `about`.
- Shared page-contract metadata identifies every route that participates in
  deployed integrity; Node verifiers derive their targets from that metadata
  rather than maintaining another allowlist.
- `scripts/verify-deployed-content-ownership.js` accepts `--page=about` and
  `--drafts`, reuses the shared selector rejection rules, verifies the endpoint
  hash describes the returned body, and compares exact normalized content.
- The default production invocation checks all deployed-integrity contracts,
  including About.
- Workflow-contract tests prove About participates in source and deployed
  gates.

## Accessibility and fragment behavior

- The exact heading inventory and section ancestry above is normative.
- The on-page navigation is a named landmark containing an actual list.
- The six fragment targets are semantic sections whose H2 is their first
  heading, not named region landmarks; they carry neither `aria-label` nor
  `aria-labelledby`.
- Actual project links, not surrounding cards, own hover and focus
  affordances.
- Existing global focus-visible outlines remain unsuppressed.
- Hero and closing prominent actions remain at least 44px high.
- Every project-action and page-navigation link renders at least 24px wide and
  24px high and exposes a visible focus indicator.
- The portrait alternative text remains `Henry Perkins`.
- Status continues to be expressed with words as well as color.
- No CSS `order` changes semantic reading order.
- Reduced-motion behavior remains unchanged because the redesign adds no
  animation.

Same-page navigation uses ordinary fragment links and adds no JavaScript
listener. On same-page `hashchange`, the existing `router-scroll.js` behavior
resolves the fragment target, adds `tabindex="-1"` when needed, and moves focus
to that target after native fragment scrolling. Existing Interactivity Router
fragment handling and reduced-motion behavior also remain. The global `[id]`
scroll margin keeps targets clear of the sticky header.

The redesign must not add a second fragment handler, put section targets in the
sequential tab order, suppress target focus, or change reduced-motion behavior.
For each navigation link, keyboard verification asserts the final hash,
matching focused target, programmatic-only `tabindex="-1"`, sticky-header
clearance, and logical continuation when Tab is pressed again.

## Verification architecture

Implementation follows test-first development. The About contract and its
tests are written and observed failing before candidate markup or CSS behavior
changes.

### Source contract

`scripts/lib/about-page-contract.js` owns reusable parsing, exact-content,
outline, destination, ordering, and word-count helpers.
`scripts/lib/about-page-contract.test.js` covers both positive fixtures and
one failure fixture for every normative rule.

`scripts/verify-about-page-source.js --drafts` validates the candidate;
without `--drafts`, it validates the accepted snapshot. It asserts:

- exact hero copy, portrait alt, résumé destination, and action order;
- the complete heading inventory, order, levels, section ancestry, one-H1
  rule, and absence of any additional page-body headings;
- exactly three proof signals with the approved claims;
- exactly one `core/html` block containing one root
  `nav[aria-label="On this page"]`, one visible label, one six-item link list
  in the approved order, six approved hrefs, and six unique matching
  `section` targets without `aria-label` or `aria-labelledby`;
- Selected Work before Core AI Contributions before Capabilities;
- exactly four project cards in the approved order;
- each exact project status, impact, technology-tag sequence, and ordered
  label/href pair in the project table, with plain-text project-title H3s and
  no whole-card anchor;
- DJ Lee present and HPerkins.com absent from Selected Work;
- the exact EvidenceBoard kicker, summary, three row texts/links, and
  status/kind classes;
- the exact capability eyebrow, introduction, H3s, and one paragraph per unit;
- the exact Experience eyebrow, metadata, six bullets, footer link, and
  absence of the repeated artifact paragraph;
- the exact four skill legends/tag sequences, AI Leaders sentence/link, two
  education records, and approved content order;
- the old `AI all day. Everything else too.`, `Throughline`, role-tag row,
  self-quotation, and standalone AI Leaders section absent;
- the closing panel, exact copy, action order, and destinations;
- the deterministic 850–950-word count and every section cap;
- About draft metadata and explicit-only local selection without changing the
  default recruiter selection;
- the thin pattern-adapter contract and absence of page markup from the
  adapter;
- exclusive About CSS ownership in `assets/imladris-pages.css`; and
- candidate/snapshot normalized parity in accepted mode.

### Dedicated rendered contract

`scripts/verify-about-page-rendered.js` runs against explicit
`HPERKINS_ORIGIN` using the repository's dependency-free Chrome/CDP approach.
Local mode also requires `HPERKINS_WP_PATH`, proves it identifies the same
local site, and refuses the default production origin.

It covers primary widths 1440, 1024, 768, 390, and 320px plus geometry probes
at 895/896px, 781/782px, and 600/601px. It asserts:

- the exact heading inventory, order, and ancestry;
- one named six-link navigation and six unique matching unnamed section
  targets;
- keyboard focus visibility and Enter activation for every jump link;
- existing router-scroll target focus and sticky-header clearance;
- at least 24px rendered width and height for every navigation and project
  action link;
- no horizontal overflow;
- two project columns and three capability columns at 56rem and above, and one
  column below 56rem;
- side-by-side hero regions and three proof-signal columns at 782px, then one
  hero column and one proof-signal column at 781px;
- a 2:1 Skills and Foundations track ratio within a 1.98–2.02 tolerance at
  1440 and 1024px, two tracks at 782px, one column at 781px and below, and
  approved DOM order;
- four project cards in the approved order, explicit links, wrapping action
  rows, and no whole-card anchor;
- no card-level hover change on a non-link portion of a project card;
- a visible focus indicator on every project action;
- exactly two About action rails and one closing panel;
- primary-before-secondary DOM and visual order in both action rails;
- at least 44px height for all four prominent action links;
- horizontal rails at 601px and above and full-width stacked rails at 600px
  and below;
- a canonical source/rendered word-count match at 1440 × 1000 CSS pixels and
  the same match at the other four primary viewports;
- the portrait alt text and redundant textual status labels; and
- screenshots for the five primary widths as review artifacts.

Keyboard requirements use actual keyboard input. Programmatic `.focus()` alone
does not satisfy them.

### Shared verifier and CI updates

In Phase B, `scripts/verify-prominent-actions.js` changes the `/about/`
expectation to `railCount: 2` and `panelCount: 1`. About source selection uses
`content/page-drafts/about.html` with `--drafts` and
`content/page-snapshots/about.html` otherwise. The pattern adapter is checked
separately rather than treated as a body copy. Focus and target-size checks
iterate through every link in both About rails.

Also in Phase B, the source CI job adds the About unit/source contracts, the
production browser job adds `verify-about-page-rendered.js`, and
both jobs pin Node 22.x. `scripts/lib/production-gates-workflow.test.js` pins
the two verifier additions and the matching Node majors. Phase A retains the
old one-rail/no-panel browser contract and does not invoke the final About
source or rendered verifier.

## Verification commands

### Phase A plumbing source gate

```text
node --test scripts/lib/content-integrity.test.js scripts/lib/page-content-contract.test.js scripts/lib/production-gates-workflow.test.js
node scripts/verify-deployed-content-ownership.js --source-only
node scripts/verify-prominent-actions.js --source-only
node scripts/verify-typography.js --source-only
node scripts/verify-performance-assets.js
node scripts/verify-content-ownership-docs.js
php -l patterns/about-resume.php
find . -name '*.php' -print0 | xargs -0 -n1 php -l
git diff --check
```

Phase A intentionally does not run `about-page-contract`,
`verify-about-page-source.js`, or `verify-about-page-rendered.js`, and its
prominent-action verifier still expects one About rail and no closing panel.

### Phase A post-deploy gate

```text
HPERKINS_ORIGIN=https://hperkins.blog node scripts/verify-deployed-content-ownership.js --page=about
HPERKINS_ORIGIN=https://hperkins.blog node scripts/verify-prominent-actions.js
HPERKINS_ORIGIN=https://hperkins.blog node scripts/verify-typography.js
```

### Phase B candidate/source gate

```text
node --test scripts/lib/content-integrity.test.js scripts/lib/page-content-contract.test.js scripts/lib/about-page-contract.test.js scripts/lib/production-gates-workflow.test.js
node scripts/verify-about-page-source.js --drafts
node scripts/verify-prominent-actions.js --source-only --drafts
node scripts/verify-deployed-content-ownership.js --source-only
node scripts/verify-typography.js --source-only
node scripts/verify-performance-assets.js
node scripts/verify-content-ownership-docs.js
php -l patterns/about-resume.php
find . -name '*.php' -print0 | xargs -0 -n1 php -l
git diff --check
```

### Phase B matching local WordPress acceptance

```text
node scripts/apply-local-page-drafts.js --confirm-local --page=about
node scripts/export-page-snapshots.js --page=about --expect-draft --check
node scripts/verify-about-page-rendered.js --require-local
node scripts/verify-prominent-actions.js --drafts
node scripts/export-page-snapshots.js --page=about --expect-draft
node scripts/verify-about-page-source.js
node scripts/verify-content-ownership.js
node scripts/verify-style-token-usage.js
node scripts/verify-prominent-actions.js
node scripts/verify-typography.js
```

These commands require matching `HPERKINS_WP_PATH` and `HPERKINS_ORIGIN`.
Neither is configured in the current specification session, so implementation
cannot claim local database or rendered acceptance until they are supplied.

### Phase B production immediately after content promotion

```text
HPERKINS_ORIGIN=https://hperkins.blog node scripts/verify-deployed-content-ownership.js --page=about --drafts
HPERKINS_ORIGIN=https://hperkins.blog node scripts/verify-about-page-rendered.js
HPERKINS_ORIGIN=https://hperkins.blog node scripts/verify-prominent-actions.js
```

### Phase B post-deploy final gate

```text
HPERKINS_ORIGIN=https://hperkins.blog node scripts/verify-deployed-content-ownership.js --page=about
HPERKINS_ORIGIN=https://hperkins.blog node scripts/verify-about-page-rendered.js
HPERKINS_ORIGIN=https://hperkins.blog node scripts/verify-prominent-actions.js
HPERKINS_ORIGIN=https://hperkins.blog node scripts/verify-typography.js
```

### Phase C compatibility-cleanup gate

```text
node scripts/verify-about-page-source.js
node scripts/verify-prominent-actions.js --source-only
node scripts/verify-performance-assets.js
node scripts/verify-content-ownership-docs.js
git diff --check
HPERKINS_ORIGIN=https://hperkins.blog node scripts/verify-deployed-content-ownership.js --page=about
HPERKINS_ORIGIN=https://hperkins.blog node scripts/verify-about-page-rendered.js
HPERKINS_ORIGIN=https://hperkins.blog node scripts/verify-prominent-actions.js
```

## Acceptance criteria

- The hero uses the approved WordPress / AI implementation-and-enablement
  positioning and no competing role-tag list.
- A visitor reaches four featured projects and Core AI proof before résumé
  chronology.
- `Core AI Contributions` remains the exact heading and accurately names work
  in the official Make WordPress Core AI project area.
- The page contains 850–950 deterministic visible words and none of the
  removed repetitive sections.
- The signal strip contains three defensible facts and does not call the
  release-candidate portfolio item shipped.
- DJ Lee replaces HPerkins.com in Selected Work.
- Every project shows its actual state and exact destinations; cards do not
  pretend to be whole-card links.
- Experience is visibly selected, retains four roles, and does not duplicate
  the project link register.
- Skills, AI Leaders, and Education form an exact 2:1 desktop composition and
  coherent mobile stack.
- The closing invitation restores clear contact and résumé actions.
- No new token, dependency, JavaScript behavior, unsupported factual claim, or
  independent full-body pattern copy is introduced.
- About-specific page layout lives only in `assets/imladris-pages.css`.
- Candidate, local database, atomic snapshot, and production database reach
  the required normalized hash parity.
- Source, accessibility, responsive, PHP, workflow, and production checks
  pass with fresh evidence.

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
to scan, but it would discard the externally controlled evidence and
distinctive WordPress/AI point of view that make this portfolio credible.
Rejected.

### Retain three full About bodies

Maintaining the candidate, snapshot, and full pattern markup independently
would preserve the current pattern implementation but create a recurring drift
edge. Rejected in favor of the thin pattern adapter over the accepted snapshot.

### Retire the About pattern

Deleting `patterns/about-resume.php` would also remove the third body copy, but
it would discard a useful inserter seed. Rejected because the thin adapter
preserves that capability without preserving duplicated page markup.
