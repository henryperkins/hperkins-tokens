# WordPress GitHub Activity Audit

**Window:** 2026-07-01 00:00 through 2026-08-11 03:42:16.933 America/Chicago

**Account:** [`henryperkins`](https://github.com/henryperkins)

**Status:** Read-only evidence snapshot for the WordCamp US 2026 portfolio refresh

## Purpose

Identify the WordPress-related work visible in Henry Perkins's GitHub activity since July 1, distinguish authorship from testing or review, distinguish upstream work from fork-only work, and determine what the Job Placement Digest, About page, and one-page résumé do or do not document.

This is a workstream audit, not a claim that every commit belongs on a recruiter-facing page. The public surfaces should curate the strongest evidence; this document preserves the wider inventory and the status caveats.

## Executive Findings

The current public portfolio is materially incomplete for July and August:

- It omits two authored, open upstream code contributions: [WordPress/php-ai-client PR #263](https://github.com/WordPress/php-ai-client/pull/263) and [WordPress/ai-provider-for-openai PR #40](https://github.com/WordPress/ai-provider-for-openai/pull/40).
- It understates the work on [WordPress/ai PR #757](https://github.com/WordPress/ai/pull/757). Henry did not author that PR; he performed deterministic integration testing, exposed duplicate-success and missing-failure behavior, and proposed a backward-compatible ownership split.
- It does not document the July and August hardening after Flavor Agent RC3, the `roadmaptrac` evidence system, the maintained `agent-skills` distribution, or the fork-only MCP Adapter deployment work.
- It describes the WordPress contribution record as “Two merged pull requests · one open pull request.” That wording collapses authorship: PR #593 was a maintainer fix to Henry's report, and PR #757 was opened by another contributor. Only PR #501 is Henry's merged authored PR among those three.
- It contains volatile branch counts that have already aged. Counts such as “commits ahead” and current contract totals should be replaced by stable milestones, pinned evidence, and explicit release states.

No authored upstream WordPress pull request merged during this audit window. That is not a weakness to conceal: the current record contains two authored open code changes, an authored issue with regression coverage, substantive integration testing and access-control feedback, released owned work, and extensive evidence/governance engineering.

## Publication-day refresh — 11 Aug 2026

**Retrieved:** 2026-08-11 03:42:16.933 America/Chicago (`2026-08-11T08:42:16.933Z`)

This read-only refresh extends the discoverable activity window from July 1 through the retrieval time above. Authenticated contribution collection now returns 1,150 commit contributions, 103 pull-request contributions, 1 issue contribution, 3 qualifying pull-request-review contributions, and 4 restricted contributions. Paginated authored search returns 121 pull requests. The two-PR increase from the August 10 snapshot's 101 contribution-collection PRs and 119 authored-search PRs is exactly Flavor Agent #77 and #78; no new authored upstream WordPress issue or pull request appeared.

### Newly qualifying activity

| Evidence | Exact state at retrieval | Taxonomy and treatment |
|---|---|---|
| [Flavor Agent PR #77 — Harden docs corpus validation, deletion guards, and settlement waiting](https://github.com/henryperkins/flavor-agent/pull/77) | Authored by `henryperkins`; open, unmerged, non-draft; created `2026-08-11T06:29:06Z`; updated `2026-08-11T06:35:59Z`; base `master` | **Owned work · open/in development.** Substantive corpus-validation and deletion-safety work, but neither merged nor released. Preserve in this full inventory; do not displace RC3 or merged post-RC3 proof on recruiter surfaces. |
| [Flavor Agent PR #78 — Add Gutenberg opt-in to WP 7.0 harness and fix design-token resolution](https://github.com/henryperkins/flavor-agent/pull/78) | Authored by `henryperkins`; open, unmerged, non-draft; created `2026-08-11T06:57:45Z`; updated `2026-08-11T07:27:01Z`; base `master` | **Owned WordPress/Gutenberg work · open/in development.** Substantive WordPress 7.0/Gutenberg harness, package-export-aware design-token resolution, and abilities-bridge compatibility work. Recruiter-relevant, but lower-state than the selected released/merged evidence; do not add it to the candidates or résumé while it remains open. |
| [Agent Skills commit `2817235` — docs: add skill audit and WP-Bench integration notes](https://github.com/henryperkins/agent-skills/commit/2817235c29d1e20afb23eb3fecbcf2317896bc69) | Authored and committed by Henry Perkins at `2026-08-11T01:10:53Z`; public on default branch `trunk` | **Owned maintained distribution · default-branch work.** The previously local audit and WP-Bench integration documents are now public default-branch evidence. |
| [Agent Skills commit `ff67695` — Release plugin 1.2.0 and gate version staleness in CI](https://github.com/henryperkins/agent-skills/commit/ff6769576e96f554b1929665311d0fb3b39019a0) | Authored and committed by Henry Perkins at `2026-08-11T01:47:04Z`; public on `trunk`; branch `release/plugin-1.2.0` points to the same commit; GitHub Releases remains empty and no release tag was found | **Owned maintained distribution · default-branch metadata 1.2.0 · no GitHub release/tag.** “Plugin metadata 1.2.0” remains distinct from “released 1.2.0” and does not replace stronger released evidence. |
| [Roadmaptrac commit `16dc64e` — Finish updating the refresh prompt for the issue census](https://github.com/henryperkins/roadmaptrac/commit/16dc64e3d6d6f66827a27aef68ebca08bd346b2f) | Authored and committed by Henry Perkins at `2026-08-11T01:41:50Z`; public on default branch `main` | **Active evidence tooling · no release.** Post-census prompt-documentation maintenance; it does not supersede the pinned census implementation. |
| [Roadmaptrac commit `0d4726a` — Drop the stale hardcoded path from the refresh prompt](https://github.com/henryperkins/roadmaptrac/commit/0d4726a4ea73d2ab46c1e6f62ca35102e5278512) | Authored and committed by Henry Perkins at `2026-08-11T01:44:24Z`; public on `main`; no Roadmaptrac release exists | **Active evidence tooling · no release.** A lower-signal prompt portability fix; retain the stronger census commit on recruiter surfaces. |

### Re-resolved cited evidence

All cited candidate facts remain unchanged at retrieval:

- [WordPress/ai PR #501](https://github.com/WordPress/ai/pull/501) remains Henry-authored and merged at `2026-05-18T21:03:46Z`.
- [php-ai-client issue #262](https://github.com/WordPress/php-ai-client/issues/262) remains Henry-authored and open; [PR #263](https://github.com/WordPress/php-ai-client/pull/263) remains Henry-authored, open, and unmerged.
- [ai-provider-for-openai PR #40](https://github.com/WordPress/ai-provider-for-openai/pull/40) remains Henry-authored, open, and unmerged.
- [WordPress/ai issue #529](https://github.com/WordPress/ai/issues/529) remains Henry's closed report; [PR #593](https://github.com/WordPress/ai/pull/593) remains `gziolo`-authored and merged at `2026-05-20T20:56:51Z`; [1.0.1](https://github.com/WordPress/ai/releases/tag/1.0.1) remains a stable release published `2026-05-27T22:09:28Z`.
- [WordPress/ai issue #732](https://github.com/WordPress/ai/issues/732) remains Henry-authored and open; [PR #757](https://github.com/WordPress/ai/pull/757) remains `i-anubhav-anand`-authored, open, and unmerged. Henry's [integration-test result](https://github.com/WordPress/ai/pull/757#issuecomment-4980297831) and [ownership proposal](https://github.com/WordPress/ai/pull/757#issuecomment-4981567682) remain top-level non-formal technical feedback.
- [PR #749](https://github.com/WordPress/ai/pull/749) remains `Infinite-Null`-authored, open, and unmerged; Henry's [access-control comment](https://github.com/WordPress/ai/pull/749#issuecomment-5010134375) remains non-formal design feedback.
- [Flavor Agent v0.1.0-rc.3](https://github.com/henryperkins/flavor-agent/releases/tag/v0.1.0-rc.3) remains the latest public Flavor Agent artifact and a prerelease. Post-RC3 PRs #53, #61, #66, #67, #74, and #76 remain Henry-authored and merged to owned `master`; PR #75 remains merged but Copilot-authored; #72 and #73 remain Henry-authored and open.
- [AI Provider for Codex v2.1](https://github.com/henryperkins/ai-provider-for-codex/releases/tag/v2.1) and [HPerkins Tokens v0.3.53](https://github.com/henryperkins/hperkins-tokens/releases/tag/v0.3.53) remain the latest public releases in their repositories. The later HPerkins Tokens WooCommerce/presentation commits remain merged to `main` and unreleased.
- [`roadmaptrac` census commit `b101bca`](https://github.com/henryperkins/roadmaptrac/commit/b101bca432825a34135c9b3d8a224031a1a7ad18) remains the selected active-tooling implementation evidence; the repository still has no release.

### Coverage and placement conclusion

The authenticated July-to-retrieval contribution collection, paginated authored issue/PR search, reviewed-item search, commented-item search, repository release/comparison checks, and public Events API reproduced every WordPress workstream already classified below. The newly visible activity is fully accounted for by the six items above.

Noise and exclusions remain deliberate: `community-forums#64`, Candidary, Pattern-Like, Gemini-Plato, and other adjacent application events are not WordPress implementation; WP-Bench branch pushes remain agent-authored fork evidence already confined to this audit; Henry's comments/review event on his own Flavor Agent #78 do not become independent upstream-review proof; branch creation and plugin metadata do not create a release; repository sync/fork/watch events remain non-achievements. Restricted activity is still unmappable and excluded from claims.

Taxonomy conclusion: the new items are open owned work, public default-branch distribution work without a release, or unreleased prompt-documentation maintenance. None is stronger than the candidate's authored-upstream, merged, or released proof, so no evidence selection, About candidate, DOCX, or PDF change is required. The Job Placement Digest's publication-verification dateline and its exact verifier literal advance to 11 Aug 2026 under the Task 4 freshness contract.

## Method And Coverage

The pass used authenticated GitHub GraphQL, issue/PR search, commit search, repository comparisons, release records, and per-item comment/review endpoints. America/Chicago determines the date boundary, so activity before 05:00 UTC on August 11 still belongs to August 10 locally.

Account-level discovery returned:

- 1,269 contribution-collection entries: 1,150 commits, 103 pull requests, 1 issue, 3 qualifying reviews, 8 repository creations, and 4 restricted contributions.
- 122 authored issue/PR search results: 121 pull requests and 1 issue. The 18-PR difference demonstrates that the contribution graph is eligibility-filtered rather than a complete activity log.
- 1,150 authored commit-search results.
- The Events API maximum of 300 records, with August 1 as the oldest returned event. Events therefore cannot reconstruct the full July timeline.

The four restricted contributions cannot be mapped formally by the API and are excluded from portfolio claims. Repository syncs, watches/stars, exact forks, and adjacent non-WordPress applications are recorded separately rather than presented as implementation evidence.

### Status vocabulary

- **Merged upstream** — Henry authored the code and the upstream repository merged it.
- **Open upstream code** — Henry authored the code, but it has not merged.
- **Reported / fixed upstream** — Henry authored the defect report; another contributor or maintainer authored the fix.
- **Reproduced / technical feedback** — Henry supplied testing, diagnosis, or design feedback in top-level comments but did not author the PR or submit a formal GitHub review.
- **Released owned work** — a repository Henry owns has a public tag or GitHub release.
- **Merged, unreleased owned work** — work is on the owned repository's default branch without a corresponding public release.
- **Fork-only** — work exists only in Henry's fork and is neither an upstream PR nor an upstream merge.
- **Agent-authored branch** — work exists in a repository Henry owns, but Git metadata credits an agent account rather than `henryperkins`.

## Upstream WordPress: Authored Work

| Evidence | State on Aug. 10 | What Henry owns | Portfolio treatment |
|---|---|---|---|
| [php-ai-client issue #262](https://github.com/WordPress/php-ai-client/issues/262) and [PR #263](https://github.com/WordPress/php-ai-client/pull/263) | Open; CI jobs pass on PHP 7.4, 8.0, 8.4, and 8.5 | Report, regression coverage, and code rejecting `NAN`, `INF`, and `-INF` embedding values; also documented the pending WordPress Core vendored dependency and possible 1.4.1 coordination | Add as **Open upstream code**; do not imply merge or release |
| [ai-provider-for-openai PR #40](https://github.com/WordPress/ai-provider-for-openai/pull/40) | Open; checks green when audited | Model-aware sampling compatibility metadata for OpenAI reasoning models plus tests | Add as **Open upstream code**; do not imply merge |
| [agent-skills PR #85](https://github.com/WordPress/agent-skills/pull/85) | Closed, unmerged | Attempted upstream contribution; closed after using the wrong base | Preserve in the audit only; it is not positive shipped evidence |

There were no other authored upstream PR merges, default-branch commits, or issues in Automattic, WP-CLI, WooCommerce, or other WordPress organization repositories during the window.

## Upstream WordPress: Testing, Diagnosis, And Design Feedback

| Evidence | Attribution-safe description | Portfolio treatment |
|---|---|---|
| [WordPress/ai issue #732](https://github.com/WordPress/ai/issues/732) and [PR #757 test result](https://github.com/WordPress/ai/pull/757#issuecomment-4980297831) / [ownership proposal](https://github.com/WordPress/ai/pull/757#issuecomment-4981567682) | Henry authored the June issue. Anubhav Anand authored PR #757. In July, Henry integration-tested the follow-up: it closed the zero-log gap, double-logged successes when the provider bridge remained active, and still omitted failures. He then proposed an ownership split. | Keep as compact debugging proof labeled **Reported / reproduced / technical feedback**; never call PR #757 Henry's PR or a formal review |
| [WordPress/ai PR #749 comment](https://github.com/WordPress/ai/pull/749#issuecomment-5010134375) | Henry identified that hiding an editor UI did not necessarily deny execution through Abilities or MCP surfaces, and proposed central enforcement, a stable access API, fixtures, and direct-execution denial tests. | Strong security/design-feedback evidence; include in the detailed register or About proof board, not necessarily the one-page résumé |
| [WordPress/ai issue #816 comment](https://github.com/WordPress/ai/issues/816#issuecomment-4877160808) | Henry argued that a shipped Type-Ahead/WooCommerce checkout regression warranted a 1.1.1 patch and milestone. Another contributor authored the fix in PR #820, merged July 8. | Audit-only supporting evidence unless a WooCommerce incident example is needed |

These were substantive top-level comments, not formal GitHub pull-request reviews. The public copy must not inflate the contribution-graph review count or call these “approved reviews.”

## Owned WordPress Work: Released And Default-Branch Evidence

### Flavor Agent

[`henryperkins/flavor-agent`](https://github.com/henryperkins/flavor-agent) recorded 97 Henry-attributed commit contributions, while 22 PRs merged in the repository during the window. The repository PR total includes agent-authored work and is not presented as 22 Henry-authored PRs.

- [v0.1.0-rc.3](https://github.com/henryperkins/flavor-agent/releases/tag/v0.1.0-rc.3), published July 13, is a prerelease—not final v0.1.0.
- [PR #53](https://github.com/henryperkins/flavor-agent/pull/53) added a governed external-apply lane for post/page blocks with drift checks, human approval, atomic apply, audit, and undo.
- [PR #61](https://github.com/henryperkins/flavor-agent/pull/61) extended signed Ring III attestations to template and template-part apply/undo.
- [PR #66](https://github.com/henryperkins/flavor-agent/pull/66) added content-aware template-part composition profiling and pattern ranking.
- [PR #67](https://github.com/henryperkins/flavor-agent/pull/67) fixed MCP/public block-introspection parity and client trust boundaries.
- [PR #74](https://github.com/henryperkins/flavor-agent/pull/74) hardened structured output, recursive schema normalization, `$defs` compaction, retry prompts, diagnostics, and malformed-block filtering.
- Copilot-authored [PR #75](https://github.com/henryperkins/flavor-agent/pull/75), merged in Henry's repository, repaired the scheduled WordPress developer-docs corpus validation probe. It is repository evidence, not a Henry-authored PR claim.
- [PR #76](https://github.com/henryperkins/flavor-agent/pull/76) bound apply/undo authorization to the canonical target across styles, templates, template parts, and post blocks.
- [PR #72](https://github.com/henryperkins/flavor-agent/pull/72) documents the exact-tag final-release gate and remaining blockers; [PR #73](https://github.com/henryperkins/flavor-agent/pull/73) is an open, read/recommend-only Automattic Agents API adapter.

Public treatment: retain RC3 as the latest release, then describe later work as **merged to main after RC3** or **in development**. Do not call it v0.1.0 and do not publish moving “commits ahead” counts.

### HPerkins Tokens

[`henryperkins/hperkins-tokens`](https://github.com/henryperkins/hperkins-tokens) recorded 126 authored commit contributions and 19 merged PRs in the window.

- [PR #1](https://github.com/henryperkins/hperkins-tokens/pull/1) rebuilt `/work/` as the Imladris portfolio ledger; [PR #2](https://github.com/henryperkins/hperkins-tokens/pull/2) added the prominent-action composition and source/rendered checks.
- [PR #9](https://github.com/henryperkins/hperkins-tokens/pull/9) centralized WP-CLI/site-origin verification; [PR #10](https://github.com/henryperkins/hperkins-tokens/pull/10) added fluid headings, text floors, WCAG AA semantic tokens, and typography regression checks.
- [PR #11](https://github.com/henryperkins/hperkins-tokens/pull/11) shipped recruiter artifacts and dependency-free DOCX/PDF/XLSX validation; [PR #13](https://github.com/henryperkins/hperkins-tokens/pull/13) hardened database-body/snapshot ownership and responsive verification.
- [v0.3.52](https://github.com/henryperkins/hperkins-tokens/releases/tag/v0.3.52) records the production-only focus-ring diagnosis and fix; [v0.3.53](https://github.com/henryperkins/hperkins-tokens/releases/tag/v0.3.53) is the latest public GitHub release and deployed recruiter/content-integrity release.
- [PR #14](https://github.com/henryperkins/hperkins-tokens/pull/14) repaired blog contrast and archive/single coverage; [PR #15](https://github.com/henryperkins/hperkins-tokens/pull/15) made evidence ledgers readable and keyboard-accessible on mobile; [PR #16](https://github.com/henryperkins/hperkins-tokens/pull/16) and [PR #19](https://github.com/henryperkins/hperkins-tokens/pull/19) built and promoted the proof-first About page.
- [PR #21](https://github.com/henryperkins/hperkins-tokens/pull/21) split conditional CSS and added responsive imagery, reducing the front-page stylesheet by 33% gzip with computed-style parity checks.
- [WooCommerce template commit](https://github.com/henryperkins/hperkins-tokens/commit/f82d52bf30e5576f73654e11af34bc638c28fc62) and [Imladris commerce presentation commit](https://github.com/henryperkins/hperkins-tokens/commit/0bf1e2c6e3c0b9d9bac7e725d8561c7fff289ce2) are merged to main but unreleased.

Public treatment: continue to call v0.3.53 the latest released/deployed evidence until a later tag and production deployment are independently verified. Later theme/WooCommerce work can be labeled **merged, unreleased**.

### AI Provider For Codex

[`ai-provider-for-codex` v2.1](https://github.com/henryperkins/ai-provider-for-codex/releases/tag/v2.1), released July 2, added the WordPress AI 1.1 image-generation capability hook while preserving the older localized-script fallback. This is current released evidence and is already represented publicly.

### Agent Skills

[`henryperkins/agent-skills`](https://github.com/henryperkins/agent-skills) is a maintained distribution/fork, not proof that changes landed in `WordPress/agent-skills`.

- Seven fork PRs merged during July, covering WordPress AI 1.1 source verification, standalone-skill portability, WordPress 7-era Blueprint/Playground/Abilities/MCP guidance, deterministic release conformance, `wp-patterns`, and the current tool-based WPDS MCP model.
- August 10 local commits refreshed AI skills and embedding evals, corrected MCP Adapter 0.5.0 exposure semantics, added a skill-audit/WP-Bench bridge design, and advanced plugin metadata to 1.2.0 with a CI staleness gate.
- There is no corresponding GitHub release/tag. “Plugin metadata 1.2.0” is not the same claim as “released 1.2.0.”

Public treatment: useful WordCamp evidence for technical education and agent evaluation. Label it as an **owned maintained distribution**; do not present the closed upstream PRs as landed.

### Roadmaptrac

[`henryperkins/roadmaptrac`](https://github.com/henryperkins/roadmaptrac) recorded 33 authored commit contributions and one merged PR. It is a WordPress AI ecosystem evidence system despite its Shell language and sparse repository description.

- [PR #1](https://github.com/henryperkins/roadmaptrac/pull/1) hardened the dependency-watchlist smoke test.
- July work added declarative dependency tracking, authoritative PR-roadmap relationships, readiness/coverage classification, strict audit mode, and validation-gated baselines.
- [The August 10 census commit](https://github.com/henryperkins/roadmaptrac/commit/b101bca432825a34135c9b3d8a224031a1a7ad18) expanded issue/PR/release coverage across WordPress/ai, php-ai-client, mcp-adapter, and abilities-api with pagination, fail-soft snapshots, strict project-board coverage, and offline suites.

Public treatment: add to the detailed WordPress evidence register. There is no release tag, so describe it as **active evidence tooling**, not a shipped product release.

## Fork-Only And Experimental Work

| Repository | Verified state | Treatment |
|---|---|---|
| [`henryperkins/mcp-adapter`](https://github.com/henryperkins/mcp-adapter) | Seven Henry-authored commits on fork `trunk`; seven ahead and seven behind upstream. Work covers a WordPress.com Composer artifact workflow and a Jetpack manifest guard. No upstream PR or release. | Document as **fork-only** engineering; do not imply upstream adoption |
| [`henryperkins/php-ai-client`](https://github.com/henryperkins/php-ai-client) | Two branch commits backing upstream PR #263; fork default remains aligned with upstream. | Use the upstream issue/PR as the canonical public evidence |
| [`henryperkins/ai-provider-for-openai`](https://github.com/henryperkins/ai-provider-for-openai) | Two open Copilot-authored fork PRs overlap the same problem space; upstream PR #40 is Henry-authored. | Prefer upstream PR #40; retain fork collaboration in this audit only |
| [`henryperkins/ai-wordpress-plugin`](https://github.com/henryperkins/ai-wordpress-plugin) | Open Copilot-authored PR #1 removes unconditional `temperature` with an opt-in filter; not merged. | Audit-only; do not attribute the PR authorship to Henry |
| [`henryperkins/wp-bench`](https://github.com/henryperkins/wp-bench) | Default `trunk` is an exact fork. Non-default branch `claude/wp-bench-serving-telemetry-g3cphf` is two commits ahead, covering the minimum LiteLLM version and request-observed TTFT/output-window telemetry. Git metadata credits the `claude` account; there is no upstream PR. | Record as **agent-authored branch in an owned fork**, not Henry-authored upstream work |
| `gatherpress`, `gutenberg`, and `ai-wordpress` forks | Fork creation or synchronization only; no qualifying unique default-branch implementation | Exclude from achievement copy |

## Adjacent Or Unrelated Repositories Excluded

- `patternlike-app` consumes signed WordPress editorial releases but is a Cloudflare/React application; classify it as WordPress-adjacent, not WordPress implementation.
- `my-emdash-site` is adjacent CMS work on EmDash/Cloudflare.
- `plato` uses plugin-system language but is an independent LMS.
- `community-forums`, `candidary`, `tarot`, `roadmapos`, `Gemini-Plato`, and `soc` are not WordPress projects in this window.
- `pbakaus/impeccable` activity was a watch/star event, not implementation.

## Current Documentation Gaps And Required Placement

| Evidence | Current public state | Required update |
|---|---|---|
| Merged WordPress/ai PR #501 | Present; predates this window but remains strong | Retain as **Henry-authored / merged** baseline |
| Issue #529 / maintainer PR #593 | Present | Retain, explicitly separating report authorship from maintainer fix |
| Issue #732 / contributor PR #757 | Present but overlong and easily misread | Condense to Signal → Diagnosis → Constraint → Result; name the other PR author and Henry's testing/technical-feedback role |
| php-ai-client #262 / #263 | Missing | Add to Digest, About Core AI evidence, and résumé as **open upstream code** |
| ai-provider-for-openai #40 | Missing | Add to Digest, About Core AI evidence, and résumé as **open upstream code** |
| WordPress/ai PR #749 access-control feedback | Missing | Add to detailed evidence register or About proof board, accurately labeled as non-formal technical/design feedback |
| Flavor Agent work after RC3 | Digest contains stale moving counts | Replace with stable post-RC3 milestones and explicit prerelease/unreleased language |
| HPerkins Tokens after v0.3.53 | Later main work is not distinguished from released work | Retain v0.3.53 as released/deployed; label later work merged/unreleased |
| Agent Skills distribution | Missing or represented by closed upstream PR #49 | Replace the weak closed-PR reference with current owned-distribution evidence; keep upstream status explicit |
| Roadmaptrac | Missing | Add to detailed WordPress evidence as active evidence tooling |
| MCP Adapter fork | Missing | Preserve in the full audit; surface publicly only with a clear fork-only label |
| WP-Bench branch | Missing | Preserve in the full audit only unless authorship and an upstream submission become clearer |

The Job Placement Digest should contain the selected, recruiter-relevant evidence and link directly to authoritative issues, PRs, releases, and pinned commits. The About page should show a smaller Core AI proof board. The one-page résumé should select only the strongest authored or clearly attributed items. This audit remains the complete workstream inventory; forcing all activity onto a one-page résumé would make the résumé less useful and less trustworthy.

## Freshness Rules

- Resolve every linked issue, PR, release, and commit again immediately before publication.
- Never infer authorship from repository ownership or from an issue being fixed.
- Never call open, fork-only, agent-authored, prerelease, or merged-unreleased work “shipped upstream.”
- Prefer absolute states and dates over branch-distance, contract-count, or contribution-count claims.
- Treat public release records and production deployment as separate evidence gates.
- Re-run this audit after August 10 activity if the portfolio is published later than the current evidence snapshot.

## Coverage Limits

GitHub Events is capped and did not reach July. Contribution collections omit ineligible fork and short-lived activity. Global comment search is item-based rather than reliably comment-date-based. Deleted comments, inaccessible organization activity, transferred repositories, and unmapped restricted contributions may be absent. The audit therefore establishes complete coverage of the discoverable WordPress workstreams and cited public evidence, not mathematical proof that no inaccessible activity exists.
