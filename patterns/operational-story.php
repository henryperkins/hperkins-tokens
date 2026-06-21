<?php
/**
 * Title: Operational Story feature
 * Slug: hperkins-tokens/operational-story
 * Categories: hperkins
 * Description: A featured operations narrative for the Flavor Agent AI Governance and Demo pages. Use when evidence, signals, diagrams, and product media need to recur through the page.
 */
?>
<!-- wp:group {"className":"hp-operational-story","layout":{"type":"constrained"}} -->
<div class="wp-block-group hp-operational-story">
	<!-- wp:columns {"className":"hp-operational-story__grid","verticalAlignment":"stretch"} -->
	<div class="wp-block-columns are-vertically-aligned-stretch hp-operational-story__grid">
		<!-- wp:column {"verticalAlignment":"stretch","width":"56%"} -->
		<div class="wp-block-column is-vertically-aligned-stretch" style="flex-basis:56%">
			<!-- wp:group {"className":"hp-operational-story__panel","layout":{"type":"default"}} -->
			<div class="wp-block-group hp-operational-story__panel">
				<!-- wp:paragraph {"className":"hp-operational-story__kicker"} -->
				<p class="hp-operational-story__kicker">Flavor Agent feature</p>
				<!-- /wp:paragraph -->

				<!-- wp:heading {"className":"hp-operational-story__title"} -->
				<h2 class="wp-block-heading hp-operational-story__title">Governance, demo, and proof as one operating surface</h2>
				<!-- /wp:heading -->

				<!-- wp:paragraph {"className":"hp-operational-story__text"} -->
				<p class="hp-operational-story__text">The AI Governance and Demo pages describe one Flavor Agent demonstration: AI proposes changes, WordPress records the trail, and approval stays with the site owner.</p>
				<!-- /wp:paragraph -->

				<!-- wp:html -->
				<div class="hp-mini-diagram" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
				<!-- /wp:html -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"verticalAlignment":"stretch","width":"44%"} -->
		<div class="wp-block-column is-vertically-aligned-stretch" style="flex-basis:44%">
			<!-- wp:group {"className":"hp-evidence-board hp-evidence-board--compact","layout":{"type":"constrained"}} -->
			<div class="wp-block-group hp-evidence-board hp-evidence-board--compact">
				<!-- wp:group {"className":"hp-evidence-board__header","layout":{"type":"default"}} -->
				<div class="wp-block-group hp-evidence-board__header">
					<!-- wp:paragraph {"className":"hp-evidence-board__kicker"} -->
					<p class="hp-evidence-board__kicker">Feature state</p>
					<!-- /wp:paragraph -->

					<!-- wp:heading {"level":3,"className":"hp-evidence-board__title"} -->
					<h3 class="wp-block-heading hp-evidence-board__title">Operational checks</h3>
					<!-- /wp:heading -->
				</div>
				<!-- /wp:group -->

				<!-- wp:group {"className":"hp-evidence-board__rows","layout":{"type":"default"}} -->
				<div class="wp-block-group hp-evidence-board__rows">
					<!-- wp:group {"className":"hp-evidence-row is-kind-governance","layout":{"type":"default"}} -->
					<div class="wp-block-group hp-evidence-row is-kind-governance">
						<!-- wp:paragraph {"className":"hp-evidence-row__label"} -->
						<p class="hp-evidence-row__label">governance</p>
						<!-- /wp:paragraph -->

						<!-- wp:paragraph {"className":"hp-evidence-row__title"} -->
						<p class="hp-evidence-row__title">Policy path visible</p>
						<!-- /wp:paragraph -->

						<!-- wp:paragraph {"className":"hp-evidence-row__meta"} -->
						<p class="hp-evidence-row__meta">The governance page states the review, audit, bounded-action, and rollback contracts in production terms.</p>
						<!-- /wp:paragraph -->
					</div>
					<!-- /wp:group -->

					<!-- wp:group {"className":"hp-evidence-row is-kind-demo","layout":{"type":"default"}} -->
					<div class="wp-block-group hp-evidence-row is-kind-demo">
						<!-- wp:paragraph {"className":"hp-evidence-row__label"} -->
						<p class="hp-evidence-row__label">demo</p>
						<!-- /wp:paragraph -->

						<!-- wp:paragraph {"className":"hp-evidence-row__title"} -->
						<p class="hp-evidence-row__title">Product flow visible</p>
						<!-- /wp:paragraph -->

						<!-- wp:paragraph {"className":"hp-evidence-row__meta"} -->
						<p class="hp-evidence-row__meta">The demo page carries the walkthrough evidence and activity-log surface for the same plugin.</p>
						<!-- /wp:paragraph -->
					</div>
					<!-- /wp:group -->
				</div>
				<!-- /wp:group -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->

	<!-- wp:group {"className":"hp-signal-strip","layout":{"type":"default"}} -->
	<div class="wp-block-group hp-signal-strip">
		<!-- wp:group {"className":"hp-signal","layout":{"type":"default"}} -->
		<div class="wp-block-group hp-signal">
			<!-- wp:paragraph {"className":"hp-signal__value"} -->
			<p class="hp-signal__value">01</p>
			<!-- /wp:paragraph -->
			<!-- wp:paragraph {"className":"hp-signal__label"} -->
			<p class="hp-signal__label">governance page</p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:group -->

		<!-- wp:group {"className":"hp-signal","layout":{"type":"default"}} -->
		<div class="wp-block-group hp-signal">
			<!-- wp:paragraph {"className":"hp-signal__value"} -->
			<p class="hp-signal__value">02</p>
			<!-- /wp:paragraph -->
			<!-- wp:paragraph {"className":"hp-signal__label"} -->
			<p class="hp-signal__label">demo page</p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:group -->

		<!-- wp:group {"className":"hp-signal is-emphasis","layout":{"type":"default"}} -->
		<div class="wp-block-group hp-signal is-emphasis">
			<!-- wp:paragraph {"className":"hp-signal__value"} -->
			<p class="hp-signal__value">FA</p>
			<!-- /wp:paragraph -->
			<!-- wp:paragraph {"className":"hp-signal__label"} -->
			<p class="hp-signal__label">same plugin demonstration</p>
			<!-- /wp:paragraph -->
		</div>
		<!-- /wp:group -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
