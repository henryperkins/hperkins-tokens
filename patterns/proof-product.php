<?php
/**
 * Title: Proof + Product hero
 * Slug: hperkins-tokens/proof-product
 * Categories: hperkins
 * Description: A case-study opening for visual work. It pairs a compact evidence board with framed product media so client visuals prove the work without becoming the site palette.
 */
// Default framed surface for the hero. Swap this screenshot per case study; the
// browser chrome around it is supplied by `.hp-shot--browser` in style.css.
// Cache-bust on the file mtime like the theme's other image assets.
$hperkins_shot_file = get_stylesheet_directory() . '/assets/screenshots/flavor-agent-activity-log.png';
$hperkins_shot_src  = get_stylesheet_directory_uri() . '/assets/screenshots/flavor-agent-activity-log.png';
$hperkins_shot_url  = esc_url( file_exists( $hperkins_shot_file ) ? $hperkins_shot_src . '?v=' . filemtime( $hperkins_shot_file ) : $hperkins_shot_src );
?>
<!-- wp:columns {"className":"hp-proof-product","verticalAlignment":"top"} -->
<div class="wp-block-columns are-vertically-aligned-top hp-proof-product">
	<!-- wp:column {"verticalAlignment":"top","width":"42%"} -->
	<div class="wp-block-column is-vertically-aligned-top" style="flex-basis:42%">
		<!-- wp:group {"className":"hp-evidence-board hp-evidence-board--compact","layout":{"type":"constrained"}} -->
		<div class="wp-block-group hp-evidence-board hp-evidence-board--compact">
			<!-- wp:group {"className":"hp-evidence-board__header","layout":{"type":"default"}} -->
			<div class="wp-block-group hp-evidence-board__header">
				<!-- wp:paragraph {"className":"hp-evidence-board__kicker"} -->
				<p class="hp-evidence-board__kicker">Proof + Product</p>
				<!-- /wp:paragraph -->

				<!-- wp:heading {"level":2,"className":"hp-evidence-board__title"} -->
				<h2 class="wp-block-heading hp-evidence-board__title">Finished surface, verified path</h2>
				<!-- /wp:heading -->

				<!-- wp:paragraph {"className":"hp-evidence-board__summary"} -->
				<p class="hp-evidence-board__summary">Use for visual client work, plugin UI, frontend interfaces, or cases where screenshots materially prove what shipped.</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->

			<!-- wp:group {"className":"hp-evidence-board__rows","layout":{"type":"default"}} -->
			<div class="wp-block-group hp-evidence-board__rows">
				<!-- wp:group {"className":"hp-evidence-row is-kind-live","layout":{"type":"default"}} -->
				<div class="wp-block-group hp-evidence-row is-kind-live">
					<!-- wp:paragraph {"className":"hp-evidence-row__label"} -->
					<p class="hp-evidence-row__label">live</p>
					<!-- /wp:paragraph -->

					<!-- wp:paragraph {"className":"hp-evidence-row__title"} -->
					<p class="hp-evidence-row__title"><a href="#">Production surface</a></p>
					<!-- /wp:paragraph -->

					<!-- wp:paragraph {"className":"hp-evidence-row__meta"} -->
					<p class="hp-evidence-row__meta">Link the live site, admin surface, demo, or published interface.</p>
					<!-- /wp:paragraph -->
				</div>
				<!-- /wp:group -->

				<!-- wp:group {"className":"hp-evidence-row is-kind-source","layout":{"type":"default"}} -->
				<div class="wp-block-group hp-evidence-row is-kind-source">
					<!-- wp:paragraph {"className":"hp-evidence-row__label"} -->
					<p class="hp-evidence-row__label">source</p>
					<!-- /wp:paragraph -->

					<!-- wp:paragraph {"className":"hp-evidence-row__title"} -->
					<p class="hp-evidence-row__title"><a href="#">Build artifact</a></p>
					<!-- /wp:paragraph -->

					<!-- wp:paragraph {"className":"hp-evidence-row__meta"} -->
					<p class="hp-evidence-row__meta">Link the repository, release, diff, or deployment record.</p>
					<!-- /wp:paragraph -->
				</div>
				<!-- /wp:group -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:group -->
	</div>
	<!-- /wp:column -->

	<!-- wp:column {"verticalAlignment":"top","width":"58%","className":"hp-shot-stack"} -->
	<div class="wp-block-column is-vertically-aligned-top hp-shot-stack" style="flex-basis:58%">
		<!-- wp:image {"sizeSlug":"large","linkDestination":"none","className":"hp-shot hp-shot--browser"} -->
		<figure class="wp-block-image size-large hp-shot hp-shot--browser"><img src="<?php echo $hperkins_shot_url; ?>" alt="Flavor Agent attributed AI request log in the WordPress admin — each AI action tied to a user and reviewable." /></figure>
		<!-- /wp:image -->

		<!-- wp:group {"className":"hp-signal-strip","layout":{"type":"default"}} -->
		<div class="wp-block-group hp-signal-strip">
			<!-- wp:group {"className":"hp-signal","layout":{"type":"default"}} -->
			<div class="wp-block-group hp-signal">
				<!-- wp:paragraph {"className":"hp-signal__value"} -->
				<p class="hp-signal__value">live</p>
				<!-- /wp:paragraph -->
				<!-- wp:paragraph {"className":"hp-signal__label"} -->
				<p class="hp-signal__label">published surface</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->

			<!-- wp:group {"className":"hp-signal","layout":{"type":"default"}} -->
			<div class="wp-block-group hp-signal">
				<!-- wp:paragraph {"className":"hp-signal__value"} -->
				<p class="hp-signal__value">src</p>
				<!-- /wp:paragraph -->
				<!-- wp:paragraph {"className":"hp-signal__label"} -->
				<p class="hp-signal__label">source linked</p>
				<!-- /wp:paragraph -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:group -->
	</div>
	<!-- /wp:column -->
</div>
<!-- /wp:columns -->
