<?php
/**
 * Title: Work — index ledger
 * Slug: hperkins-tokens/work-index
 * Categories: hperkins
 * Description: The /work/ portfolio listing — a standfirst over a ProofBar summary and a ledger of engagements, each a status-ruled WorkEntry whose outcome resolves to openable artifacts. Status verified, not asserted.
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
<p class="hp-page-hero__lead">Write-ups in problem &rarr; build &rarr; outcome &rarr; artifact form. Every engagement below carries one verifiable outcome &mdash; a release, a diff, a live surface you can open yourself.</p>
<!-- /wp:paragraph -->

<!-- wp:group {"className":"hp-workindex__summary","layout":{"type":"default"}} -->
<div class="wp-block-group hp-workindex__summary"><!-- wp:group {"className":"hp-proof-bar","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"left"}} -->
<div class="wp-block-group hp-proof-bar"><!-- wp:paragraph {"className":"hp-chip is-status-merged","fontSize":"xs","fontFamily":"mono"} -->
<p class="hp-chip is-status-merged has-xs-font-size has-mono-font-family">shipped: three live</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-chip is-status-merged","fontSize":"xs","fontFamily":"mono"} -->
<p class="hp-chip is-status-merged has-xs-font-size has-mono-font-family">merged: upstream</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-chip is-status-review","fontSize":"xs","fontFamily":"mono"} -->
<p class="hp-chip is-status-review has-xs-font-size has-mono-font-family">in review: one open</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></section>
<!-- /wp:group -->

<!-- wp:group {"className":"hp-work","align":"wide","style":{"spacing":{"margin":{"top":"var:preset|spacing|8"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group alignwide hp-work" style="margin-top:var(--wp--preset--spacing--8)"><!-- wp:group {"className":"hp-work__entry is-status-review","layout":{"type":"default"}} -->
<div class="wp-block-group hp-work__entry is-status-review"><!-- wp:group {"className":"hp-work__head","layout":{"type":"flex","justifyContent":"space-between","flexWrap":"wrap"}} -->
<div class="wp-block-group hp-work__head"><!-- wp:paragraph {"className":"hp-work__label"} -->
<p class="hp-work__label">In review</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-work__meta"} -->
<p class="hp-work__meta">WordPress plugin &middot; pre-tag</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:heading {"level":3,"className":"hp-work__title"} -->
<h3 class="wp-block-heading hp-work__title"><a href="/work/flavor-agent/">Flavor Agent</a></h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"hp-work__desc"} -->
<p class="hp-work__desc">AI proposes edits inside native WordPress surfaces; WordPress keeps validation, attribution, freshness checks, and drift-safe undo. Who changed what, was it authorized, and can you prove the rollback.</p>
<!-- /wp:paragraph -->

<!-- wp:group {"className":"hp-artifact-row","layout":{"type":"default"}} -->
<div class="wp-block-group hp-artifact-row"><!-- wp:paragraph {"className":"hp-artifact-row__legend"} -->
<p class="hp-artifact-row__legend">Artifacts</p>
<!-- /wp:paragraph -->

<!-- wp:columns {"className":"hp-artifacts"} -->
<div class="wp-block-columns hp-artifacts"><!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">case study</p>
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
<p class="hp-artifact__link"><a href="https://github.com/henryperkins/flavor-agent" rel="noopener">flavor-agent</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">release</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link">pre-tag</p>
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
<p class="hp-work__meta">Released 2026-06 &middot; v0.1.5</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:heading {"level":3,"className":"hp-work__title"} -->
<h3 class="wp-block-heading hp-work__title"><a href="/work/ai-provider-for-codex/">Scriptorium AI Provider for Codex</a></h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"hp-work__desc"} -->
<p class="hp-work__desc">A localhost-sidecar Codex provider for the WP AI Client; zero Codex or ChatGPT credentials enter WordPress, and the loopback boundary is covered by regression tests.</p>
<!-- /wp:paragraph -->

<!-- wp:group {"className":"hp-artifact-row","layout":{"type":"default"}} -->
<div class="wp-block-group hp-artifact-row"><!-- wp:paragraph {"className":"hp-artifact-row__legend"} -->
<p class="hp-artifact-row__legend">Artifacts</p>
<!-- /wp:paragraph -->

<!-- wp:columns {"className":"hp-artifacts"} -->
<div class="wp-block-columns hp-artifacts"><!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">release</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link"><a href="https://github.com/henryperkins/ai-provider-for-codex/releases" rel="noopener">v0.1.5</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">source</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link"><a href="https://github.com/henryperkins/ai-provider-for-codex" rel="noopener">repo</a></p>
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
<p class="hp-work__label">Merged</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-work__meta"} -->
<p class="hp-work__meta">core/ai 1.0.1 &middot; maintainer-adjudicated</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:heading {"level":3,"className":"hp-work__title"} -->
<h3 class="wp-block-heading hp-work__title"><a href="/work/upstream-core-ai-stack/">Upstream: WordPress&rsquo;s core AI stack</a></h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"hp-work__desc"} -->
<p class="hp-work__desc">A docs PR named in the core/ai 1.0.0 changelog, a defect fixed in 1.0.1, and an open policy proposal &mdash; each adjudicated by maintainers, not by the author.</p>
<!-- /wp:paragraph -->

<!-- wp:group {"className":"hp-artifact-row","layout":{"type":"default"}} -->
<div class="wp-block-group hp-artifact-row"><!-- wp:paragraph {"className":"hp-artifact-row__legend"} -->
<p class="hp-artifact-row__legend">Artifacts</p>
<!-- /wp:paragraph -->

<!-- wp:columns {"className":"hp-artifacts"} -->
<div class="wp-block-columns hp-artifacts"><!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">diff</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link"><a href="https://github.com/WordPress/ai/pulls" rel="noopener">PR #501</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">release</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link">v1.0.1</p>
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
<p class="hp-work__label">Delivered</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-work__meta"} -->
<p class="hp-work__meta">Cloudflare Worker &middot; ~22 KB</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:heading {"level":3,"className":"hp-work__title"} -->
<h3 class="wp-block-heading hp-work__title"><a href="/work/dj-lee-voices-of-judah/">DJ Lee &amp; Voices of Judah</a></h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"hp-work__desc"} -->
<p class="hp-work__desc">A single Cloudflare Worker serving a booking-first site with one /api/booking endpoint; &ldquo;info only used to reply&rdquo; is enforced architecturally, not merely promised.</p>
<!-- /wp:paragraph -->

<!-- wp:group {"className":"hp-artifact-row","layout":{"type":"default"}} -->
<div class="wp-block-group hp-artifact-row"><!-- wp:paragraph {"className":"hp-artifact-row__legend"} -->
<p class="hp-artifact-row__legend">Artifacts</p>
<!-- /wp:paragraph -->

<!-- wp:columns {"className":"hp-artifacts"} -->
<div class="wp-block-columns hp-artifacts"><!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">live</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link"><a href="https://thevoicesofjudah.com" rel="noopener">thevoicesofjudah.com</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">write-up</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link"><a href="/work/dj-lee-voices-of-judah/">view page</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"className":"hp-artifact"} -->
<div class="wp-block-column hp-artifact"><!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
<p class="hp-artifact__verifies">scope</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-artifact__link"} -->
<p class="hp-artifact__link">~22 KB worker</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:paragraph {"className":"hp-workindex__colophon"} -->
<p class="hp-workindex__colophon">The Imladris Journal &middot; Selected work &middot; Status verified, not asserted.</p>
<!-- /wp:paragraph -->
