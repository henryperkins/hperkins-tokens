<?php
/**
 * Title: Artifact row
 * Slug: hperkins-tokens/artifact-row
 * Categories: hperkins
 * Description: The fixed terminus of a Work entry. Each cell is a ledger line labeled by what it verifies (release tag, diff, live page). The slot repeats identically, so a missing artifact is conspicuous, not merely absent.
 */
?>
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
