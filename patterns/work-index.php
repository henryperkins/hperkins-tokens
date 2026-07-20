<?php
/**
 * Title: Work — index ledger
 * Slug: hperkins-tokens/work-index
 * Categories: hperkins
 * Description: The /work/ portfolio listing — a standfirst over a ProofBar summary and a status-ruled ledger of engagements (problem → build → outcome → artifact), each a WorkEntry carrying its status word beside the rule colour and closing on its artifact row, then the "state is a design decision" rule. Status verified, not asserted. Reusable seed/reference copy of the DB-owned /work/ page body; kept byte-identical to content/page-snapshots/work.html by verify-no-duplicate-pages.js.
 */
?>
<!-- wp:group {"tagName":"section","className":"hp-page-hero","layout":{"type":"default"}} -->
<section class="wp-block-group hp-page-hero"><!-- wp:paragraph {"className":"hp-page-hero__eyebrow"} -->
<p class="hp-page-hero__eyebrow">Selected work</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1} -->
<h1 class="wp-block-heading">Work</h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"hp-page-hero__lead"} -->
<p class="hp-page-hero__lead">Write-ups in problem → build → outcome → artifact form. Every engagement carries one verifiable outcome — a release, a diff, a live surface you can open yourself.</p>
<!-- /wp:paragraph -->

<!-- wp:group {"className":"hp-workindex__summary","layout":{"type":"default"}} -->
<div class="wp-block-group hp-workindex__summary"><!-- wp:group {"className":"hp-proof-bar","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"left"}} -->
<div class="wp-block-group hp-proof-bar"><!-- wp:paragraph {"className":"hp-chip is-status-merged","fontSize":"xs","fontFamily":"mono"} -->
<p class="hp-chip is-status-merged has-mono-font-family has-xs-font-size">shipped: two live</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-chip is-status-merged","fontSize":"xs","fontFamily":"mono"} -->
<p class="hp-chip is-status-merged has-mono-font-family has-xs-font-size">merged: upstream</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-chip is-status-review","fontSize":"xs","fontFamily":"mono"} -->
<p class="hp-chip is-status-review has-mono-font-family has-xs-font-size">open: one release candidate</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></section>
<!-- /wp:group -->

<!-- wp:group {"align":"wide","className":"hp-work","style":{"spacing":{"margin":{"top":"var:preset|spacing|8"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group alignwide hp-work" style="margin-top:var(--wp--preset--spacing--8)"><!-- wp:group {"className":"hp-work__entry is-status-review","layout":{"type":"default"}} -->
<div class="wp-block-group hp-work__entry is-status-review"><!-- wp:group {"className":"hp-work__head","layout":{"type":"flex","justifyContent":"space-between","flexWrap":"wrap"}} -->
<div class="wp-block-group hp-work__head"><!-- wp:paragraph {"className":"hp-work__label"} -->
<p class="hp-work__label">Release candidate</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-work__meta"} -->
<p class="hp-work__meta">v0.1.0-rc.1</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:heading {"level":2,"className":"hp-work__title"} -->
<h2 class="wp-block-heading hp-work__title"><a href="/work/flavor-agent/">Flavor Agent</a></h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"hp-work__desc"} -->
<p class="hp-work__desc">AI proposes supported edits inside native WordPress surfaces; WordPress keeps validation, attribution, freshness checks, and drift-safe undo for eligible Flavor Agent operations.</p>
<!-- /wp:paragraph -->

<!-- wp:group {"className":"hp-artifact-row","layout":{"type":"constrained"}} -->
<div class="wp-block-group hp-artifact-row"><!-- wp:paragraph {"className":"hp-artifact-row__legend"} -->
<p class="hp-artifact-row__legend">Artifacts</p>
<!-- /wp:paragraph -->

<!-- wp:columns {"className":"hp-artifacts"} -->
<div class="wp-block-columns hp-artifacts"><!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">write-up</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link"><a href="/work/flavor-agent/">view page</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">source</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link"><a href="https://github.com/henryperkins/flavor-agent">flavor-agent</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">release</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link"><a href="https://github.com/henryperkins/flavor-agent/releases/tag/v0.1.0-rc.1">v0.1.0-rc.1</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"hp-work__entry is-status-merged","layout":{"type":"default"}} -->
<div class="wp-block-group hp-work__entry is-status-merged"><!-- wp:group {"className":"hp-work__head","layout":{"type":"flex","justifyContent":"space-between","flexWrap":"wrap"}} -->
<div class="wp-block-group hp-work__head"><!-- wp:paragraph {"className":"hp-work__label"} -->
<p class="hp-work__label">Merged</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-work__meta"} -->
<p class="hp-work__meta">upstream</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:heading {"level":2,"className":"hp-work__title"} -->
<h2 class="wp-block-heading hp-work__title"><a href="/work/upstream-core-ai-stack/">WordPress AI Stack Contributions</a></h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"hp-work__desc"} -->
<p class="hp-work__desc">Documentation merged and defects resolved in WordPress/ai; additional work remains open or tracked in agent-skills and php-ai-client.</p>
<!-- /wp:paragraph -->

<!-- wp:group {"className":"hp-artifact-row","layout":{"type":"constrained"}} -->
<div class="wp-block-group hp-artifact-row"><!-- wp:paragraph {"className":"hp-artifact-row__legend"} -->
<p class="hp-artifact-row__legend">Artifacts</p>
<!-- /wp:paragraph -->

<!-- wp:columns {"className":"hp-artifacts"} -->
<div class="wp-block-columns hp-artifacts"><!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">diff</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link"><a href="https://github.com/WordPress/ai/pull/501">PR #501</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">release</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link"><a href="https://github.com/WordPress/ai/releases/tag/v1.0.1">v1.0.1</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">write-up</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link"><a href="/work/upstream-core-ai-stack/">view page</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"hp-work__entry is-status-merged","layout":{"type":"default"}} -->
<div class="wp-block-group hp-work__entry is-status-merged"><!-- wp:group {"className":"hp-work__head","layout":{"type":"flex","justifyContent":"space-between","flexWrap":"wrap"}} -->
<div class="wp-block-group hp-work__head"><!-- wp:paragraph {"className":"hp-work__label"} -->
<p class="hp-work__label">Shipped</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-work__meta"} -->
<p class="hp-work__meta">v2.1</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:heading {"level":2,"className":"hp-work__title"} -->
<h2 class="wp-block-heading hp-work__title"><a href="/work/ai-provider-for-codex/">AI Provider for Codex</a></h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"hp-work__desc"} -->
<p class="hp-work__desc">A local-runtime Codex provider for WordPress AI Client text and capability-gated image-generation workloads; OpenAI account credentials stay in the sidecar.</p>
<!-- /wp:paragraph -->

<!-- wp:group {"className":"hp-artifact-row","layout":{"type":"constrained"}} -->
<div class="wp-block-group hp-artifact-row"><!-- wp:paragraph {"className":"hp-artifact-row__legend"} -->
<p class="hp-artifact-row__legend">Artifacts</p>
<!-- /wp:paragraph -->

<!-- wp:columns {"className":"hp-artifacts"} -->
<div class="wp-block-columns hp-artifacts"><!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">release</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link"><a href="https://github.com/henryperkins/ai-provider-for-codex/releases/tag/v2.1">v2.1</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">source</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link"><a href="https://github.com/henryperkins/ai-provider-for-codex">repo</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">write-up</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link"><a href="/work/ai-provider-for-codex/">view page</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"hp-work__entry is-status-merged","layout":{"type":"default"}} -->
<div class="wp-block-group hp-work__entry is-status-merged"><!-- wp:group {"className":"hp-work__head","layout":{"type":"flex","justifyContent":"space-between","flexWrap":"wrap"}} -->
<div class="wp-block-group hp-work__head"><!-- wp:paragraph {"className":"hp-work__label"} -->
<p class="hp-work__label">Delivered</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-work__meta"} -->
<p class="hp-work__meta">live site</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:heading {"level":2,"className":"hp-work__title"} -->
<h2 class="wp-block-heading hp-work__title"><a href="/work/dj-lee-voices-of-judah/">DJ Lee &amp; Voices of Judah</a></h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"hp-work__desc"} -->
<p class="hp-work__desc">A single Cloudflare Worker serving a booking-first static front with one <code>/api/booking</code> endpoint; submissions are validated and forwarded by email without writing booking fields to an application database or browser storage.</p>
<!-- /wp:paragraph -->

<!-- wp:group {"className":"hp-artifact-row","layout":{"type":"constrained"}} -->
<div class="wp-block-group hp-artifact-row"><!-- wp:paragraph {"className":"hp-artifact-row__legend"} -->
<p class="hp-artifact-row__legend">Artifacts</p>
<!-- /wp:paragraph -->

<!-- wp:columns {"className":"hp-artifacts"} -->
<div class="wp-block-columns hp-artifacts"><!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">live</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link"><a href="https://thevoicesofjudah.com">thevoicesofjudah.com</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">source</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link"><a href="https://github.com/henryperkins/dj-judas-v2">repo</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">write-up</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link"><a href="/work/dj-lee-voices-of-judah/">view page</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:paragraph {"align":"wide","className":"hp-workindex__note"} -->
<p class="hp-workindex__note alignwide">Same rule across every entry: where state lives is a design decision, and the boundary is testable.</p>
<!-- /wp:paragraph -->
