<?php
/**
 * Title: Proof bar (status ledger)
 * Slug: hperkins-tokens/proof-bar
 * Categories: hperkins
 * Description: A vertical ledger of status lines. Each line shares one anatomy (size, weight, rule width, tinted surface); state is expressed only through the semantic status token and a filled vs. hollow dot. Verification, not assertion.
 */
?>
<!-- wp:group {"className":"hp-proof-bar","layout":{"type":"flex","orientation":"vertical","justifyContent":"left"}} -->
<div class="wp-block-group hp-proof-bar">
	<!-- wp:paragraph {"className":"hp-chip is-status-merged","fontSize":"xs","fontFamily":"mono"} -->
	<p class="hp-chip is-status-merged has-xs-font-size has-mono-font-family">release: tagged</p>
	<!-- /wp:paragraph -->

	<!-- wp:paragraph {"className":"hp-chip is-status-merged","fontSize":"xs","fontFamily":"mono"} -->
	<p class="hp-chip is-status-merged has-xs-font-size has-mono-font-family">defect: fixed</p>
	<!-- /wp:paragraph -->

	<!-- wp:paragraph {"className":"hp-chip is-status-review","fontSize":"xs","fontFamily":"mono"} -->
	<p class="hp-chip is-status-review has-xs-font-size has-mono-font-family">proposal: in review</p>
	<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
