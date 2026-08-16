# About Page Impeccable Refinement

**Date:** 2026-08-14

**Status:** Implemented as a reviewed post-WCUS candidate; not published

**Selected direction:** Evaluator-first proof path

## Decision

The accepted About snapshot remains the event-window production mirror. The
human-authored draft is now an explicit post-WCUS candidate that applies the
Impeccable critique sequence `layout → distill → clarify → harden → polish`.
This phase split is deliberate: candidate verification does not authorize an
About database write, snapshot promotion, theme deployment, or early removal
of the live WordCamp US panel.

The earlier [proof-first redesign
specification](./2026-07-28-about-page-proof-first-design.md) remains the record
for the accepted 927-word body. This document supersedes its exact candidate
copy, order, action hierarchy, editorial budgets, and candidate-verifier
expectations.

## Audience and path

The primary reader is a hiring evaluator making a 60–90 second fit decision.
The candidate must sequence:

1. fit and practical outcome;
2. independently controlled proof;
3. representative delivery;
4. relevant experience;
5. a clear contact or résumé next step.

The page keeps the Imladris visual language, evidence-state semantics, exact
authorship qualifications, stable résumé route, native Gutenberg blocks, and
database-owned body model.

## Candidate changes

### Layout

- Move `Core AI Contributions` immediately after the proof strip and page
  navigation, before `Selected Work`.
- Keep Capabilities, Selected Experience, Skills and Foundations, and Contact
  in their existing relative order.
- Reduce the page navigation to four evaluator destinations in this order:
  `Proof`, `Work`, `Experience`, `Contact`.
- Remove the empty trailing paragraph block.

### Distillation

- Retain three selected roles: Independent Technology Consultant, Happiness
  Engineer, and Developer Community Manager. The PDF résumé owns the complete
  chronology.
- Retain three skill groups with four items each:
  - WordPress and web delivery: WordPress, PHP, JavaScript, Cloudflare Workers.
  - AI and automation: WordPress AI Client, Abilities API, MCP, OpenAI API
    integrations.
  - Support and enablement: Technical support, Escalation triage,
    Documentation, Developer enablement.
- Preserve all four project cards and all four upstream evidence records.

### Clarification

- Strapline: `For teams shipping practical WordPress and AI systems.`
- Lead: `I turn emerging AI capabilities into reliable WordPress tools,
  workflows, and documentation that teams can operate after handoff.`
- Shorten project impact copy while preserving actual release/deployment
  states, exact destinations, technologies, and attribution.
- Give every project one visually primary default action. Place the remaining
  release, live-site, and source destinations beneath the visible label
  `Inspect evidence:`.

| Project | Primary action | Inspect evidence |
|---|---|---|
| Flavor Agent | `Read case study` | `Release v0.1.0-rc.3`; `Source` |
| AI Provider for Codex | `Read case study` | `Release v2.1`; `Source` |
| DJ Lee & Voices of Judah | `Read case study` | `Live site`; `Source` |
| Tableau | `Open live application` | `Source` |

### Hardening

- The candidate contains no `.hp-about-wcus` block. This represents the
  post-event composition only.
- The accepted contract continues to require the exact WCUS label, copy, and
  action. The accepted snapshot remains unchanged until a fresh production
  read, direct publication approval, exact write, re-read, and equality proof.
- `verify-about-page-source.js` always validates both bodies against their
  named phases and reports both normalized hashes. Intentional review-stage
  divergence is neither parity nor promotion.
- The manual retirement runbook remains the timing and authorization boundary;
  no cron, scheduled mutation, or automatic date behavior is introduced.

### Polish and accessibility

- Navigation and every project action use the shared 44px touch minimum.
- Project cards remain inert surfaces: only real action links receive hover and
  focus affordances.
- The primary project action uses existing brand, inverse-text, radius, shadow,
  typography, spacing, and touch tokens. No design token or dependency is
  added.
- Secondary links keep artifact-link semantics and remain in the same browsing
  context.
- Heading order contains one H1 and 20 total H1–H3 headings.

## Deterministic editorial contract

The implemented candidate contains exactly 801 visible words under the shared
Node `Intl.Segmenter` algorithm:

| Content area | Implemented count | Maximum |
|---|---:|---:|
| Hero | 39 | 45 |
| Proof signals and page navigation | 46 | 50 |
| Core AI Contributions | 170 | 210 |
| Selected Work | 168 | 180 |
| Capabilities | 112 | 120 |
| Selected Experience | 151 | 160 |
| Skills and Foundations | 82 | 85 |
| Closing invitation | 33 | 40 |
| **Total** | **801** | **760–820 inclusive target** |

The accepted event-window body retains its independent 850–950 range and
currently measures 927 words. A future promotion must deliberately retire or
replace the accepted phase; it must not silently reinterpret the current live
snapshot as the candidate.

## Verification and publication boundary

Candidate source and rendered-source gates:

```powershell
node --test scripts/lib/about-page-contract.test.js scripts/lib/about-page-rendered-probe.test.js
node scripts/verify-about-page-source.js --drafts
node scripts/verify-about-page-rendered.js --source-only --drafts
node scripts/verify-style-token-usage.js
git diff --check
```

The complete repository source gate and the matched-local browser matrix must
also pass before publication review. Applying the draft to a local WordPress
database requires the existing explicit `--confirm-local --page=about` guard.
Publishing production requires a later fresh-read and direct-confirmation gate;
only a successful production re-read may be exported as the accepted snapshot.

