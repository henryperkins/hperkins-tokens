<?php
/**
 * Title: Wapuu homepage hero
 * Slug: hperkins-tokens/wapuu-home-hero
 * Categories: hperkins
 * Description: A homepage or portfolio landing hero featuring the HPerkins Wapuu as signature artwork with restrained proof chips.
 */
$hperkins_wapuu_file = get_stylesheet_directory() . '/assets/wapuu/wapuu-hero.png';
$hperkins_wapuu_src  = get_stylesheet_directory_uri() . '/assets/wapuu/wapuu-hero.png';
// Cache-bust on the file's mtime: assets are served with a 30-day max-age, so a
// swapped image keeps the same filename and would otherwise stay cached as stale.
$hperkins_wapuu_url  = esc_url( file_exists( $hperkins_wapuu_file ) ? $hperkins_wapuu_src . '?v=' . filemtime( $hperkins_wapuu_file ) : $hperkins_wapuu_src );
?>
<!-- wp:group {"align":"full","className":"hp-wapuu-hero-wrap","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull hp-wapuu-hero-wrap">
	<!-- wp:columns {"align":"wide","className":"hp-wapuu-hero","verticalAlignment":"center"} -->
	<div class="wp-block-columns alignwide are-vertically-aligned-center hp-wapuu-hero">
		<!-- wp:column {"verticalAlignment":"center","width":"58%","className":"hp-wapuu-hero__copy"} -->
		<div class="wp-block-column is-vertically-aligned-center hp-wapuu-hero__copy" style="flex-basis:58%">
			<!-- wp:paragraph {"className":"hp-wapuu-hero__eyebrow"} -->
			<p class="hp-wapuu-hero__eyebrow">Portfolio system</p>
			<!-- /wp:paragraph -->

			<!-- wp:heading {"level":1,"className":"hp-wapuu-hero__title"} -->
			<h1 class="wp-block-heading hp-wapuu-hero__title">Trust must be structural.</h1>
			<!-- /wp:heading -->

			<!-- wp:paragraph {"className":"hp-wapuu-hero__text"} -->
			<p class="hp-wapuu-hero__text">I build WordPress AI tooling where the governance is part of the architecture, not a promise in the readme. Scope, build, deploy, explain — and every claim has an artifact behind it.</p>
			<!-- /wp:paragraph -->

			<!-- wp:group {"className":"hp-proof-bar hp-wapuu-hero__signals","layout":{"type":"flex","flexWrap":"wrap"}} -->
			<div class="wp-block-group hp-proof-bar hp-wapuu-hero__signals">
				<!-- wp:paragraph {"className":"hp-chip is-status-merged"} -->
				<p class="hp-chip is-status-merged"><a href="https://github.com/WordPress/ai/pull/501">core/ai PR #501</a> — merged</p>
				<!-- /wp:paragraph -->

				<!-- wp:paragraph {"className":"hp-chip is-status-merged"} -->
				<p class="hp-chip is-status-merged"><a href="https://github.com/WordPress/ai/issues/529">core/ai #529</a> — fixed in 1.0.1</p>
				<!-- /wp:paragraph -->

				<!-- wp:paragraph {"className":"hp-chip is-status-review"} -->
				<p class="hp-chip is-status-review"><a href="https://github.com/WordPress/agent-skills/pull/49">agent-skills PR #49</a> — in review</p>
				<!-- /wp:paragraph -->

				<!-- wp:paragraph {"className":"hp-chip is-status-review"} -->
				<p class="hp-chip is-status-review"><a href="/work/flavor-agent/">flavor-agent</a> — 0.1.0 RC</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"verticalAlignment":"center","width":"42%","className":"hp-wapuu-hero__art"} -->
		<div class="wp-block-column is-vertically-aligned-center hp-wapuu-hero__art" style="flex-basis:42%">
			<!-- wp:image {"sizeSlug":"full","linkDestination":"none","className":"hp-wapuu-hero__figure"} -->
			<figure class="wp-block-image size-full hp-wapuu-hero__figure"><img src="<?php echo $hperkins_wapuu_url; ?>" alt="Wapuu dressed as a grey-robed wizard with a pointed hat, long beard, and wooden staff, holding a WordPress logo orb." /></figure>
			<!-- /wp:image -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->
