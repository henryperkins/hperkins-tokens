<?php
/**
 * Title: Evidence First case board
 * Slug: hperkins-tokens/evidence-first
 * Categories: hperkins
 * Description: A site-owned operations board for non-visual proof work. Use for GitHub contributions, provider architecture, documentation grounding, upstream fixes, and review records.
 */
?>
<!-- wp:group {"className":"hp-evidence-board","layout":{"type":"constrained"}} -->
<div class="wp-block-group hp-evidence-board">
	<!-- wp:group {"className":"hp-evidence-board__header","layout":{"type":"default"}} -->
	<div class="wp-block-group hp-evidence-board__header">
		<!-- wp:paragraph {"className":"hp-evidence-board__kicker"} -->
		<p class="hp-evidence-board__kicker">Evidence first</p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"level":2,"className":"hp-evidence-board__title"} -->
		<h2 class="wp-block-heading hp-evidence-board__title">Operational proof before presentation</h2>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"className":"hp-evidence-board__summary"} -->
		<p class="hp-evidence-board__summary">Use this board when the work is best verified by releases, issues, pull requests, reviews, docs, or policy records rather than screenshots.</p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->

	<!-- wp:group {"className":"hp-evidence-board__rows","layout":{"type":"default"}} -->
	<div class="wp-block-group hp-evidence-board__rows">
		<!-- wp:group {"className":"hp-evidence-row is-kind-release","layout":{"type":"default"}} -->
		<div class="wp-block-group hp-evidence-row is-kind-release">
			<!-- wp:paragraph {"className":"hp-evidence-row__label"} -->
			<p class="hp-evidence-row__label">release</p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph {"className":"hp-evidence-row__title"} -->
			<p class="hp-evidence-row__title"><a href="#">Tagged build shipped</a></p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph {"className":"hp-evidence-row__meta"} -->
			<p class="hp-evidence-row__meta">Link the release, changelog, or versioned artifact that proves the work is complete.</p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:group -->

		<!-- wp:group {"className":"hp-evidence-row is-kind-source","layout":{"type":"default"}} -->
		<div class="wp-block-group hp-evidence-row is-kind-source">
			<!-- wp:paragraph {"className":"hp-evidence-row__label"} -->
			<p class="hp-evidence-row__label">source</p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph {"className":"hp-evidence-row__title"} -->
			<p class="hp-evidence-row__title"><a href="#">Repository or pull request</a></p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph {"className":"hp-evidence-row__meta"} -->
			<p class="hp-evidence-row__meta">Link the diff, branch, issue, review thread, or source record that supports the claim.</p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:group -->

		<!-- wp:group {"className":"hp-evidence-row is-kind-review","layout":{"type":"default"}} -->
		<div class="wp-block-group hp-evidence-row is-kind-review">
			<!-- wp:paragraph {"className":"hp-evidence-row__label"} -->
			<p class="hp-evidence-row__label">review</p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph {"className":"hp-evidence-row__title"} -->
			<p class="hp-evidence-row__title"><a href="#">Maintainer or stakeholder review</a></p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph {"className":"hp-evidence-row__meta"} -->
			<p class="hp-evidence-row__meta">Use this row when the honest state is still in review, pending confirmation, or awaiting merge.</p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:group -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
