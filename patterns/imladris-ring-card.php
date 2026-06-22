<?php
/**
 * Title: Imladris Three Rings cards
 * Slug: hperkins-tokens/imladris-ring-card
 * Categories: hperkins
 * Description: Three-ring framework cards for Expose, Govern, and Attest set on faded Rivendell-era backdrops (Second, Third, and Fourth Age).
 */
$hperkins_ring_assets = array();
foreach (
	array(
		'air'   => array(
			'png'  => 'imagery/rivendell-second-age.png',
			'webp' => 'imagery/rivendell-second-age.webp',
		),
		'fire'  => array(
			'png'  => 'imagery/rivendell-third-age.png',
			'webp' => 'imagery/rivendell-third-age.webp',
		),
		'water' => array(
			'png'  => 'imagery/rivendell-fourth-age.png',
			'webp' => 'imagery/rivendell-fourth-age.webp',
		),
	) as $hperkins_ring_key => $hperkins_ring_file_name
) {
	$hperkins_ring_assets[ $hperkins_ring_key ] = array(
		'png'  => esc_url( hperkins_tokens_asset_url( 'assets/img/' . $hperkins_ring_file_name['png'] ) ),
		'webp' => esc_url( hperkins_tokens_asset_url( 'assets/img/' . $hperkins_ring_file_name['webp'] ) ),
	);
}
?>
<!-- wp:group {"align":"wide","className":"hp-ring-framework","layout":{"type":"default"}} -->
<div class="wp-block-group alignwide hp-ring-framework"><!-- wp:columns {"className":"hp-ring-grid"} -->
<div class="wp-block-columns hp-ring-grid"><!-- wp:column {"className":"hp-ring-card is-air"} -->
<div class="wp-block-column hp-ring-card is-air"><!-- wp:html -->
<figure class="wp-block-image size-full hp-ring-card__figure"><picture><source srcset="<?php echo $hperkins_ring_assets['air']['webp']; ?>" type="image/webp" /><img src="<?php echo $hperkins_ring_assets['air']['png']; ?>" alt="" width="1672" height="941" loading="lazy" decoding="async" /></picture></figure>
<!-- /wp:html -->

<!-- wp:html -->
<span class="hp-ring-card__veil" aria-hidden="true"></span>
<!-- /wp:html -->

<!-- wp:group {"className":"hp-ring-card__head","layout":{"type":"default"}} -->
<div class="wp-block-group hp-ring-card__head"><!-- wp:paragraph {"className":"hp-ring-card__ring"} -->
<p class="hp-ring-card__ring">Vilya</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-ring-card__element"} -->
<p class="hp-ring-card__element">Ring of Air</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:heading {"level":3,"className":"hp-ring-card__action"} -->
<h3 class="wp-block-heading hp-ring-card__action">Expose</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"hp-ring-card__virtues"} -->
<p class="hp-ring-card__virtues">Clarity <span aria-hidden="true">·</span> Vision <span aria-hidden="true">·</span> Insight</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-ring-card__description"} -->
<p class="hp-ring-card__description">Expose capability so an agent can discover it &mdash; inspectable, not asserted.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-ring-card__cta"} -->
<p class="hp-ring-card__cta"><a href="https://make.wordpress.org/core/2025/11/10/abilities-api-in-wordpress-6-9/">Inspect the schema <span aria-hidden="true">&rarr;</span></a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"className":"hp-ring-card is-fire"} -->
<div class="wp-block-column hp-ring-card is-fire"><!-- wp:html -->
<figure class="wp-block-image size-full hp-ring-card__figure"><picture><source srcset="<?php echo $hperkins_ring_assets['fire']['webp']; ?>" type="image/webp" /><img src="<?php echo $hperkins_ring_assets['fire']['png']; ?>" alt="" width="1672" height="941" loading="lazy" decoding="async" /></picture></figure>
<!-- /wp:html -->

<!-- wp:html -->
<span class="hp-ring-card__veil" aria-hidden="true"></span>
<!-- /wp:html -->

<!-- wp:group {"className":"hp-ring-card__head","layout":{"type":"default"}} -->
<div class="wp-block-group hp-ring-card__head"><!-- wp:paragraph {"className":"hp-ring-card__ring"} -->
<p class="hp-ring-card__ring">Narya</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-ring-card__element"} -->
<p class="hp-ring-card__element">Ring of Fire</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:heading {"level":3,"className":"hp-ring-card__action"} -->
<h3 class="wp-block-heading hp-ring-card__action">Govern</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"hp-ring-card__virtues"} -->
<p class="hp-ring-card__virtues">Warmth <span aria-hidden="true">·</span> Courage <span aria-hidden="true">·</span> Renewal</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-ring-card__description"} -->
<p class="hp-ring-card__description">Govern usage and access so the owner can audit it &mdash; read, not trusted.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-ring-card__cta"} -->
<p class="hp-ring-card__cta"><a href="https://make.wordpress.org/ai/2026/05/21/whats-new-in-ai-1-0-0/">Audit the log <span aria-hidden="true">&rarr;</span></a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"className":"hp-ring-card is-water"} -->
<div class="wp-block-column hp-ring-card is-water"><!-- wp:html -->
<figure class="wp-block-image size-full hp-ring-card__figure"><picture><source srcset="<?php echo $hperkins_ring_assets['water']['webp']; ?>" type="image/webp" /><img src="<?php echo $hperkins_ring_assets['water']['png']; ?>" alt="" width="1672" height="941" loading="lazy" decoding="async" /></picture></figure>
<!-- /wp:html -->

<!-- wp:html -->
<span class="hp-ring-card__veil" aria-hidden="true"></span>
<!-- /wp:html -->

<!-- wp:group {"className":"hp-ring-card__head","layout":{"type":"default"}} -->
<div class="wp-block-group hp-ring-card__head"><!-- wp:paragraph {"className":"hp-ring-card__ring"} -->
<p class="hp-ring-card__ring">Nenya</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-ring-card__element"} -->
<p class="hp-ring-card__element">Ring of Water</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:heading {"level":3,"className":"hp-ring-card__action"} -->
<h3 class="wp-block-heading hp-ring-card__action">Attest</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"hp-ring-card__virtues"} -->
<p class="hp-ring-card__virtues">Depth <span aria-hidden="true">·</span> Wisdom <span aria-hidden="true">·</span> Protection</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-ring-card__description"} -->
<p class="hp-ring-card__description">Attest the output&rsquo;s provenance so a stranger can verify it &mdash; signed, not claimed.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-ring-card__cta is-in-review"} -->
<p class="hp-ring-card__cta is-in-review"><span class="hp-ring-card__cta-text">Verify the signature</span><span class="hp-ring-card__pill"><span class="hp-ring-card__pill-dot" aria-hidden="true"></span>In review</span></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->
