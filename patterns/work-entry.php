<?php
/**
 * Title: Work entry (ledger)
 * Slug: hperkins-tokens/work-entry
 * Categories: hperkins
 * Description: The ledger spine the other components attach to. Each entry shares one row anatomy — a mono status label, the title link, then the consequence — with state carried by the left rule color and a redundant status word in the label, never color alone. The artifact row is the fixed terminus of an entry.
 */
?>
<!-- wp:group {"className":"hp-work","layout":{"type":"default"}} -->
<div class="wp-block-group hp-work">
	<!-- wp:group {"className":"hp-work__entry is-status-merged","layout":{"type":"default"}} -->
	<div class="wp-block-group hp-work__entry is-status-merged">
		<!-- wp:paragraph {"className":"hp-work__label"} -->
		<p class="hp-work__label">Merged</p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"level":3,"className":"hp-work__title"} -->
		<h3 class="wp-block-heading hp-work__title"><a href="#">Token-driven status ledger</a></h3>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"className":"hp-work__desc"} -->
		<p class="hp-work__desc">Shipped the governance layer: every status on the page resolves to an artifact a reader can open. State is the rule color, not decoration.</p>
		<!-- /wp:paragraph -->

		<!-- wp:group {"className":"hp-artifact-row","layout":{"type":"constrained"}} -->
		<div class="wp-block-group hp-artifact-row">
			<!-- wp:paragraph {"className":"hp-artifact-row__legend"} -->
			<p class="hp-artifact-row__legend">Artifacts</p>
			<!-- /wp:paragraph -->

			<!-- wp:columns {"className":"hp-artifacts"} -->
			<div class="wp-block-columns hp-artifacts">
				<!-- wp:column {"className":"hp-artifact"} -->
				<div class="wp-block-column hp-artifact">
					<!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
					<p class="hp-artifact__verifies">release</p>
					<!-- /wp:paragraph -->
					<!-- wp:paragraph {"className":"hp-artifact__link"} -->
					<p class="hp-artifact__link"><a href="#">v0.7.0</a></p>
					<!-- /wp:paragraph -->
				</div>
				<!-- /wp:column -->

				<!-- wp:column {"className":"hp-artifact"} -->
				<div class="wp-block-column hp-artifact">
					<!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
					<p class="hp-artifact__verifies">diff</p>
					<!-- /wp:paragraph -->
					<!-- wp:paragraph {"className":"hp-artifact__link"} -->
					<p class="hp-artifact__link"><a href="#">PR #142</a></p>
					<!-- /wp:paragraph -->
				</div>
				<!-- /wp:column -->

				<!-- wp:column {"className":"hp-artifact"} -->
				<div class="wp-block-column hp-artifact">
					<!-- wp:paragraph {"className":"hp-artifact__verifies"} -->
					<p class="hp-artifact__verifies">live</p>
					<!-- /wp:paragraph -->
					<!-- wp:paragraph {"className":"hp-artifact__link"} -->
					<p class="hp-artifact__link"><a href="#">view page</a></p>
					<!-- /wp:paragraph -->
				</div>
				<!-- /wp:column -->
			</div>
			<!-- /wp:columns -->
		</div>
		<!-- /wp:group -->
	</div>
	<!-- /wp:group -->

	<!-- wp:group {"className":"hp-work__entry is-status-review","layout":{"type":"default"}} -->
	<div class="wp-block-group hp-work__entry is-status-review">
		<!-- wp:paragraph {"className":"hp-work__label"} -->
		<p class="hp-work__label">In review</p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"level":3,"className":"hp-work__title"} -->
		<h3 class="wp-block-heading hp-work__title"><a href="#">Proposal: artifact retention policy</a></h3>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"className":"hp-work__desc"} -->
		<p class="hp-work__desc">Open for review. Nothing is asserted here that the linked diff does not already show.</p>
		<!-- /wp:paragraph -->

		<!-- wp:paragraph {"className":"hp-work__footer"} -->
		<p class="hp-work__footer">Opened 2026-05 · awaiting sign-off</p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->

	<!-- wp:group {"className":"hp-work__entry is-status-pending","layout":{"type":"default"}} -->
	<div class="wp-block-group hp-work__entry is-status-pending">
		<!-- wp:paragraph {"className":"hp-work__label"} -->
		<p class="hp-work__label">Pending</p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"level":3,"className":"hp-work__title"} -->
		<h3 class="wp-block-heading hp-work__title"><a href="#">Scheduled: search index rebuild</a></h3>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"className":"hp-work__desc"} -->
		<p class="hp-work__desc">Not yet started. The slot is reserved so the gap is conspicuous, not merely absent.</p>
		<!-- /wp:paragraph -->

		<!-- wp:paragraph {"className":"hp-work__footer"} -->
		<p class="hp-work__footer">Queued · no artifact yet</p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
