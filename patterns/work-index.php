<?php
/**
 * Title: Work — index ledger
 * Slug: hperkins-tokens/work-index
 * Categories: hperkins
 * Description: The /work/ portfolio listing — a standfirst over a ProofBar summary and a status-ruled ledger of engagements (problem → build → outcome → artifact), each a WorkEntry carrying its status word beside the rule colour, closing on the "state is a design decision" rule. Status verified, not asserted. Reusable seed/reference copy of the DB-owned /work/ page body.
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
<p class="hp-page-hero__lead">Write-ups in problem &rarr; build &rarr; outcome &rarr; artifact form. Every engagement carries one verifiable outcome &mdash; a release, a diff, a live surface you can open yourself.</p>
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
<p class="hp-work__desc">AI proposes edits inside native WordPress surfaces; WordPress keeps validation, attribution, freshness checks, and drift-safe undo.</p>
<!-- /wp:paragraph --></div>
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

<!-- wp:heading {"level":3,"className":"hp-work__title"} -->
<h3 class="wp-block-heading hp-work__title"><a href="/work/upstream-core-ai-stack/">WordPress&rsquo;s Core AI Contributions</a></h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"hp-work__desc"} -->
<p class="hp-work__desc">Fixes and features landed in WordPress&rsquo;s core AI and agent-skills repositories, each tied to a merged or tracked artifact.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"hp-work__entry is-status-merged","layout":{"type":"default"}} -->
<div class="wp-block-group hp-work__entry is-status-merged"><!-- wp:group {"className":"hp-work__head","layout":{"type":"flex","justifyContent":"space-between","flexWrap":"wrap"}} -->
<div class="wp-block-group hp-work__head"><!-- wp:paragraph {"className":"hp-work__label"} -->
<p class="hp-work__label">Shipped</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-work__meta"} -->
<p class="hp-work__meta">v0.1.5</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:heading {"level":3,"className":"hp-work__title"} -->
<h3 class="wp-block-heading hp-work__title"><a href="/work/ai-provider-for-codex/">AI Provider for Codex</a></h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"hp-work__desc"} -->
<p class="hp-work__desc">A local-runtime Codex provider for the WordPress AI Client; the boundary has tests.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:paragraph {"align":"wide","className":"hp-workindex__note"} -->
<p class="hp-workindex__note alignwide">Same rule across every entry: where state lives is a design decision, and the boundary is testable.</p>
<!-- /wp:paragraph -->
