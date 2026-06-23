<?php
/**
 * Title: Wapuu homepage hero
 * Slug: hperkins-tokens/wapuu-home-hero
 * Categories: hperkins
 * Description: A homepage or portfolio landing hero featuring the HPerkins Wapuu as signature artwork with restrained proof chips.
 */
// Signature mascot floating over the elven-star halo, matching the Imladris Home
// composition (same framed Wapuu-Dalf medallion the design uses).
$hperkins_wapuu_png_url  = esc_url( hperkins_tokens_asset_url( 'assets/img/wapuu-color.png' ) );
$hperkins_wapuu_webp_url = esc_url( hperkins_tokens_asset_url( 'assets/img/wapuu-color.webp' ) );
?>
<!-- wp:group {"align":"full","className":"hp-wapuu-hero-wrap","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull hp-wapuu-hero-wrap">
	<!-- wp:columns {"align":"wide","className":"hp-wapuu-hero","verticalAlignment":"center"} -->
	<div class="wp-block-columns alignwide are-vertically-aligned-center hp-wapuu-hero">
		<!-- wp:column {"verticalAlignment":"center","width":"55%","className":"hp-wapuu-hero__copy"} -->
		<div class="wp-block-column is-vertically-aligned-center hp-wapuu-hero__copy" style="flex-basis:55%">
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

			<!-- wp:buttons {"className":"hp-wapuu-hero__cta","layout":{"type":"flex","flexWrap":"wrap"}} -->
			<div class="wp-block-buttons hp-wapuu-hero__cta">
				<!-- wp:button -->
				<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="/work/">See the work</a></div>
				<!-- /wp:button -->

				<!-- wp:button {"className":"is-style-secondary"} -->
				<div class="wp-block-button is-style-secondary"><a class="wp-block-button__link wp-element-button" href="/about/">About</a></div>
				<!-- /wp:button -->
			</div>
			<!-- /wp:buttons -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"verticalAlignment":"center","width":"45%","className":"hp-wapuu-hero__art"} -->
		<div class="wp-block-column is-vertically-aligned-center hp-wapuu-hero__art" style="flex-basis:45%">
			<!-- wp:html -->
			<span class="hp-wapuu-hero__star" aria-hidden="true"><svg viewBox="0 0 100 100" fill="none"><g stroke="currentColor" stroke-width="0.9" stroke-linejoin="round" stroke-linecap="round"><path d="M50 3 L63.8 16.7 L83.2 16.8 L83.3 36.2 L97 50 L83.3 63.8 L83.2 83.2 L63.8 83.3 L50 97 L36.2 83.3 L16.8 83.2 L16.7 63.8 L3 50 L16.7 36.2 L16.8 16.8 L36.2 16.7 Z"></path><path d="M50 21 L57.5 42.5 L79 50 L57.5 57.5 L50 79 L42.5 57.5 L21 50 L42.5 42.5 Z" opacity="0.6"></path><circle cx="50" cy="50" r="4.5" fill="currentColor" stroke="none"></circle></g></svg></span>
			<!-- /wp:html -->

			<!-- wp:html -->
			<figure class="wp-block-image size-full hp-wapuu-hero__figure"><picture><source srcset="<?php echo $hperkins_wapuu_webp_url; ?>" type="image/webp" /><img src="<?php echo $hperkins_wapuu_png_url; ?>" alt="Wapuu dressed as a grey-robed wizard with a pointed hat, long beard, and wooden staff, holding a WordPress logo orb." width="962" height="1024" loading="lazy" decoding="async" /></picture></figure>
			<!-- /wp:html -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->
