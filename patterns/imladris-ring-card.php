<?php
/**
 * Title: Imladris Three Rings cards
 * Slug: hperkins-tokens/imladris-ring-card
 * Categories: hperkins
 * Description: Three-ring framework cards for Expose, Govern, and Attest using the Imladris Wapuu ring-bearer assets.
 */
$hperkins_ring_assets = array();
foreach (
	array(
		'vilya'       => 'wapuu-vilya.png',
		'narya'       => 'wapuu-narya.png',
		'nenya'       => 'wapuu-nenya.png',
		'badge-vilya' => 'ring-badge-vilya.png',
		'badge-narya' => 'ring-badge-narya.png',
		'badge-nenya' => 'ring-badge-nenya.png',
	) as $hperkins_ring_key => $hperkins_ring_file_name
) {
	$hperkins_ring_file = get_stylesheet_directory() . '/assets/img/' . $hperkins_ring_file_name;
	$hperkins_ring_src  = get_stylesheet_directory_uri() . '/assets/img/' . $hperkins_ring_file_name;
	if ( file_exists( $hperkins_ring_file ) ) {
		$hperkins_ring_src = add_query_arg( 'v', filemtime( $hperkins_ring_file ), $hperkins_ring_src );
	}
	$hperkins_ring_assets[ $hperkins_ring_key ] = esc_url( $hperkins_ring_src );
}
?>
<!-- wp:group {"align":"wide","className":"hp-ring-framework","layout":{"type":"default"}} -->
<div class="wp-block-group alignwide hp-ring-framework"><!-- wp:columns {"className":"hp-ring-grid"} -->
<div class="wp-block-columns hp-ring-grid"><!-- wp:column {"className":"hp-ring-card is-air"} -->
<div class="wp-block-column hp-ring-card is-air"><!-- wp:group {"className":"hp-ring-card__plate","layout":{"type":"default"}} -->
<div class="wp-block-group hp-ring-card__plate"><!-- wp:image {"sizeSlug":"full","linkDestination":"none","className":"hp-ring-card__figure"} -->
<figure class="wp-block-image size-full hp-ring-card__figure"><img src="<?php echo $hperkins_ring_assets['vilya']; ?>" alt="" /></figure>
<!-- /wp:image -->

<!-- wp:html -->
<span class="hp-ring-card__veil" aria-hidden="true"></span>
<!-- /wp:html -->

<!-- wp:group {"className":"hp-ring-card__header","layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
<div class="wp-block-group hp-ring-card__header"><!-- wp:image {"sizeSlug":"full","linkDestination":"none","className":"hp-ring-card__badge"} -->
<figure class="wp-block-image size-full hp-ring-card__badge"><img src="<?php echo $hperkins_ring_assets['badge-vilya']; ?>" alt="" /></figure>
<!-- /wp:image -->

<!-- wp:group {"className":"hp-ring-card__identity","layout":{"type":"default"}} -->
<div class="wp-block-group hp-ring-card__identity"><!-- wp:paragraph {"className":"hp-ring-card__ring"} -->
<p class="hp-ring-card__ring">Vilya</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-ring-card__element"} -->
<p class="hp-ring-card__element">Ring of Air</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:paragraph {"className":"hp-ring-card__virtues"} -->
<p class="hp-ring-card__virtues">Clarity <span aria-hidden="true">·</span> Vision <span aria-hidden="true">·</span> Insight</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"hp-ring-card__body","layout":{"type":"default"}} -->
<div class="wp-block-group hp-ring-card__body"><!-- wp:heading {"level":3,"className":"hp-ring-card__action"} -->
<h3 class="wp-block-heading hp-ring-card__action">Expose</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"hp-ring-card__description"} -->
<p class="hp-ring-card__description">Expose capability so an agent can discover it &mdash; inspectable, not asserted.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-ring-card__cta"} -->
<p class="hp-ring-card__cta"><a href="https://make.wordpress.org/core/2025/11/10/abilities-api-in-wordpress-6-9/">Inspect the schema <span aria-hidden="true">&rarr;</span></a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column {"className":"hp-ring-card is-fire"} -->
<div class="wp-block-column hp-ring-card is-fire"><!-- wp:group {"className":"hp-ring-card__plate","layout":{"type":"default"}} -->
<div class="wp-block-group hp-ring-card__plate"><!-- wp:image {"sizeSlug":"full","linkDestination":"none","className":"hp-ring-card__figure"} -->
<figure class="wp-block-image size-full hp-ring-card__figure"><img src="<?php echo $hperkins_ring_assets['narya']; ?>" alt="" /></figure>
<!-- /wp:image -->

<!-- wp:html -->
<span class="hp-ring-card__veil" aria-hidden="true"></span>
<!-- /wp:html -->

<!-- wp:group {"className":"hp-ring-card__header","layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
<div class="wp-block-group hp-ring-card__header"><!-- wp:image {"sizeSlug":"full","linkDestination":"none","className":"hp-ring-card__badge"} -->
<figure class="wp-block-image size-full hp-ring-card__badge"><img src="<?php echo $hperkins_ring_assets['badge-narya']; ?>" alt="" /></figure>
<!-- /wp:image -->

<!-- wp:group {"className":"hp-ring-card__identity","layout":{"type":"default"}} -->
<div class="wp-block-group hp-ring-card__identity"><!-- wp:paragraph {"className":"hp-ring-card__ring"} -->
<p class="hp-ring-card__ring">Narya</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-ring-card__element"} -->
<p class="hp-ring-card__element">Ring of Fire</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:paragraph {"className":"hp-ring-card__virtues"} -->
<p class="hp-ring-card__virtues">Warmth <span aria-hidden="true">·</span> Courage <span aria-hidden="true">·</span> Renewal</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"hp-ring-card__body","layout":{"type":"default"}} -->
<div class="wp-block-group hp-ring-card__body"><!-- wp:heading {"level":3,"className":"hp-ring-card__action"} -->
<h3 class="wp-block-heading hp-ring-card__action">Govern</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"hp-ring-card__description"} -->
<p class="hp-ring-card__description">Govern usage and access so the owner can audit it &mdash; read, not trusted.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-ring-card__cta"} -->
<p class="hp-ring-card__cta"><a href="https://make.wordpress.org/ai/2026/05/21/whats-new-in-ai-1-0-0/">Audit the log <span aria-hidden="true">&rarr;</span></a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column {"className":"hp-ring-card is-water"} -->
<div class="wp-block-column hp-ring-card is-water"><!-- wp:group {"className":"hp-ring-card__plate","layout":{"type":"default"}} -->
<div class="wp-block-group hp-ring-card__plate"><!-- wp:image {"sizeSlug":"full","linkDestination":"none","className":"hp-ring-card__figure"} -->
<figure class="wp-block-image size-full hp-ring-card__figure"><img src="<?php echo $hperkins_ring_assets['nenya']; ?>" alt="" /></figure>
<!-- /wp:image -->

<!-- wp:html -->
<span class="hp-ring-card__veil" aria-hidden="true"></span>
<!-- /wp:html -->

<!-- wp:group {"className":"hp-ring-card__header","layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"center"}} -->
<div class="wp-block-group hp-ring-card__header"><!-- wp:image {"sizeSlug":"full","linkDestination":"none","className":"hp-ring-card__badge"} -->
<figure class="wp-block-image size-full hp-ring-card__badge"><img src="<?php echo $hperkins_ring_assets['badge-nenya']; ?>" alt="" /></figure>
<!-- /wp:image -->

<!-- wp:group {"className":"hp-ring-card__identity","layout":{"type":"default"}} -->
<div class="wp-block-group hp-ring-card__identity"><!-- wp:paragraph {"className":"hp-ring-card__ring"} -->
<p class="hp-ring-card__ring">Nenya</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-ring-card__element"} -->
<p class="hp-ring-card__element">Ring of Water</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:paragraph {"className":"hp-ring-card__virtues"} -->
<p class="hp-ring-card__virtues">Depth <span aria-hidden="true">·</span> Wisdom <span aria-hidden="true">·</span> Protection</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"hp-ring-card__body","layout":{"type":"default"}} -->
<div class="wp-block-group hp-ring-card__body"><!-- wp:heading {"level":3,"className":"hp-ring-card__action"} -->
<h3 class="wp-block-heading hp-ring-card__action">Attest</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"hp-ring-card__description"} -->
<p class="hp-ring-card__description">Attest the output&rsquo;s provenance so a stranger can verify it &mdash; signed, not claimed.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-ring-card__cta is-in-review"} -->
<p class="hp-ring-card__cta is-in-review"><span class="hp-ring-card__cta-text">Verify the signature</span><span class="hp-ring-card__pill"><span class="hp-ring-card__pill-dot" aria-hidden="true"></span>In review</span></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->
