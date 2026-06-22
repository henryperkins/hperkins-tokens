<?php
/**
 * Title: Proof + Product hero
 * Slug: hperkins-tokens/proof-product
 * Categories: hperkins
 * Description: The design-system ProductHero — "Proof + Product." A compact evidence board (live / source rows) paired with framed product media, so client visuals prove the work without becoming the page palette. The case-study opening for visual work (plugin UI, frontend surfaces, sites).
 */
// Default framed surface for the hero. Swap this screenshot per case study; the
// browser chrome around it is supplied by `.hp-shot--browser` in style.css.
// Cache-bust on the file mtime like the theme's other image assets.
$hperkins_shot_file = get_stylesheet_directory() . '/assets/screenshots/flavor-agent-activity-log.png';
$hperkins_shot_src  = get_stylesheet_directory_uri() . '/assets/screenshots/flavor-agent-activity-log.png';
$hperkins_shot_url  = esc_url( file_exists( $hperkins_shot_file ) ? $hperkins_shot_src . '?v=' . filemtime( $hperkins_shot_file ) : $hperkins_shot_src );
?>
<!-- wp:columns {"className":"hp-product-hero","verticalAlignment":"center"} -->
<div class="wp-block-columns are-vertically-aligned-center hp-product-hero">
	<!-- wp:column {"verticalAlignment":"center","width":"42%","className":"hp-product-hero__board"} -->
	<div class="wp-block-column is-vertically-aligned-center hp-product-hero__board" style="flex-basis:42%">
		<!-- wp:paragraph {"className":"hp-product-hero__eyebrow"} -->
		<p class="hp-product-hero__eyebrow">Proof + Product</p>
		<!-- /wp:paragraph -->

		<!-- wp:heading {"level":2,"className":"hp-product-hero__title"} -->
		<h2 class="wp-block-heading hp-product-hero__title">Finished surface, verified path</h2>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"className":"hp-product-hero__intro"} -->
		<p class="hp-product-hero__intro">Use for visual client work, plugin UI, frontend interfaces, or cases where screenshots materially prove what shipped.</p>
		<!-- /wp:paragraph -->

		<!-- wp:group {"className":"hp-product-hero__rows","layout":{"type":"default"}} -->
		<div class="wp-block-group hp-product-hero__rows">
			<!-- wp:group {"className":"hp-product-hero__row is-kind-live","layout":{"type":"default"}} -->
			<div class="wp-block-group hp-product-hero__row is-kind-live">
				<!-- wp:paragraph {"className":"hp-product-hero__kind"} -->
				<p class="hp-product-hero__kind">live</p>
				<!-- /wp:paragraph -->

				<!-- wp:group {"className":"hp-product-hero__row-body","layout":{"type":"default"}} -->
				<div class="wp-block-group hp-product-hero__row-body">
					<!-- wp:paragraph {"className":"hp-product-hero__row-title"} -->
					<p class="hp-product-hero__row-title"><a href="#">Production surface</a></p>
					<!-- /wp:paragraph -->

					<!-- wp:paragraph {"className":"hp-product-hero__row-meta"} -->
					<p class="hp-product-hero__row-meta">Link the live site, admin surface, demo, or published interface.</p>
					<!-- /wp:paragraph -->
				</div>
				<!-- /wp:group -->
			</div>
			<!-- /wp:group -->

			<!-- wp:group {"className":"hp-product-hero__row is-kind-source","layout":{"type":"default"}} -->
			<div class="wp-block-group hp-product-hero__row is-kind-source">
				<!-- wp:paragraph {"className":"hp-product-hero__kind"} -->
				<p class="hp-product-hero__kind">source</p>
				<!-- /wp:paragraph -->

				<!-- wp:group {"className":"hp-product-hero__row-body","layout":{"type":"default"}} -->
				<div class="wp-block-group hp-product-hero__row-body">
					<!-- wp:paragraph {"className":"hp-product-hero__row-title"} -->
					<p class="hp-product-hero__row-title"><a href="#">Build artifact</a></p>
					<!-- /wp:paragraph -->

					<!-- wp:paragraph {"className":"hp-product-hero__row-meta"} -->
					<p class="hp-product-hero__row-meta">Link the repository, release, diff, or deployment record.</p>
					<!-- /wp:paragraph -->
				</div>
				<!-- /wp:group -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:group -->
	</div>
	<!-- /wp:column -->

	<!-- wp:column {"verticalAlignment":"center","width":"58%","className":"hp-product-hero__media"} -->
	<div class="wp-block-column is-vertically-aligned-center hp-product-hero__media" style="flex-basis:58%">
		<!-- wp:image {"sizeSlug":"large","linkDestination":"none","className":"hp-shot hp-shot--browser"} -->
		<figure class="wp-block-image size-large hp-shot hp-shot--browser"><img src="<?php echo $hperkins_shot_url; ?>" alt="Flavor Agent attributed AI request log in the WordPress admin — each AI action tied to a user and reviewable." /></figure>
		<!-- /wp:image -->
	</div>
	<!-- /wp:column -->
</div>
<!-- /wp:columns -->
