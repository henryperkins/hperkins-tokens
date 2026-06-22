<?php
/**
 * Title: Operational Story feature
 * Slug: hperkins-tokens/operational-story
 * Categories: hperkins
 * Description: The design-system OperationalStory — the featured narrative where several pages reconcile to one operating surface. A single bordered card in three bands: header, a feature-state / operational-checks panel, and a numbered path index whose unifying node is gilt-emphasised. Built for the Flavor Agent governance + demo pages.
 */
?>
<!-- wp:group {"className":"hp-operational-story","layout":{"type":"constrained"}} -->
<div class="wp-block-group hp-operational-story">
	<!-- wp:group {"tagName":"header","className":"hp-operational-story__header","layout":{"type":"default"}} -->
	<header class="wp-block-group hp-operational-story__header">
		<!-- wp:paragraph {"className":"hp-operational-story__eyebrow"} -->
		<p class="hp-operational-story__eyebrow">Flavor Agent feature</p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"level":3,"className":"hp-operational-story__title"} -->
		<h3 class="wp-block-heading hp-operational-story__title">Governance, demo, and proof as one operating surface</h3>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"className":"hp-operational-story__intro"} -->
		<p class="hp-operational-story__intro">The AI Governance and Demo pages describe one Flavor Agent demonstration: AI proposes changes, WordPress records the trail, and approval stays with the site owner.</p>
		<!-- /wp:paragraph -->
	</header>
	<!-- /wp:group -->

	<!-- wp:group {"className":"hp-operational-story__panel","layout":{"type":"default"}} -->
	<div class="wp-block-group hp-operational-story__panel">
		<!-- wp:group {"className":"hp-operational-story__panel-head","layout":{"type":"flex","justifyContent":"space-between","flexWrap":"nowrap"}} -->
		<div class="wp-block-group hp-operational-story__panel-head">
			<!-- wp:paragraph {"className":"hp-operational-story__panel-label"} -->
			<p class="hp-operational-story__panel-label">Feature state</p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph {"className":"hp-operational-story__panel-label"} -->
			<p class="hp-operational-story__panel-label">Operational checks</p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:group -->

		<!-- wp:group {"className":"hp-operational-story__check is-kind-governance","layout":{"type":"default"}} -->
		<div class="wp-block-group hp-operational-story__check is-kind-governance">
			<!-- wp:paragraph {"className":"hp-operational-story__kind-label"} -->
			<p class="hp-operational-story__kind-label">governance</p>
			<!-- /wp:paragraph -->

			<!-- wp:group {"className":"hp-operational-story__check-body","layout":{"type":"default"}} -->
			<div class="wp-block-group hp-operational-story__check-body">
				<!-- wp:paragraph {"className":"hp-operational-story__check-title"} -->
				<p class="hp-operational-story__check-title">Policy path visible</p>
				<!-- /wp:paragraph -->

				<!-- wp:paragraph {"className":"hp-operational-story__check-meta"} -->
				<p class="hp-operational-story__check-meta">The governance page states the review, audit, bounded-action, and rollback contracts in production terms.</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:group -->

		<!-- wp:group {"className":"hp-operational-story__check is-kind-demo","layout":{"type":"default"}} -->
		<div class="wp-block-group hp-operational-story__check is-kind-demo">
			<!-- wp:paragraph {"className":"hp-operational-story__kind-label"} -->
			<p class="hp-operational-story__kind-label">demo</p>
			<!-- /wp:paragraph -->

			<!-- wp:group {"className":"hp-operational-story__check-body","layout":{"type":"default"}} -->
			<div class="wp-block-group hp-operational-story__check-body">
				<!-- wp:paragraph {"className":"hp-operational-story__check-title"} -->
				<p class="hp-operational-story__check-title">Product flow visible</p>
				<!-- /wp:paragraph -->

				<!-- wp:paragraph {"className":"hp-operational-story__check-meta"} -->
				<p class="hp-operational-story__check-meta">The demo page carries the walkthrough evidence and activity-log surface for the same plugin.</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:group -->
	</div>
	<!-- /wp:group -->

	<!-- wp:html -->
	<div class="hp-operational-story__path">
		<span class="hp-operational-story__node"><span class="hp-operational-story__marker">01</span><span class="hp-operational-story__node-label">governance page</span></span>
		<span class="hp-operational-story__connector" aria-hidden="true"></span>
		<span class="hp-operational-story__node"><span class="hp-operational-story__marker">02</span><span class="hp-operational-story__node-label">demo page</span></span>
		<span class="hp-operational-story__connector" aria-hidden="true"></span>
		<span class="hp-operational-story__node is-emphasis"><span class="hp-operational-story__marker">FA</span><span class="hp-operational-story__node-label">same plugin demonstration</span></span>
	</div>
	<!-- /wp:html -->
</div>
<!-- /wp:group -->
