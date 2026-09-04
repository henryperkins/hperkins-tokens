<?php
/**
 * Title: AI Enablement — Expose, Govern, Attest essay
 * Slug: hperkins-tokens/ai-enablement
 * Categories: hperkins
 * Description: Inserter seed for the /ai-enablement/ essay. A thin adapter over the accepted database snapshot (content/page-snapshots/ai-enablement.html): it re-derives exactly the six theme-hosted Three Rings image URLs from this theme's own files, fails closed on any mismatch, and otherwise emits that trusted markup unchanged. The visitor-facing /ai-enablement/ body is database-owned; the snapshot is its verified mirror.
 */

/*
 * Thin accepted-snapshot adapter (the about-resume model). The pattern:
 *   1. reads content/page-snapshots/ai-enablement.html;
 *   2. fails closed (emits nothing) if the snapshot is absent or empty;
 *   3. re-derives exactly the six known Three Rings image URLs — a WebP
 *      <source> and a PNG <img> fallback per Age — through
 *      hperkins_tokens_asset_url(), so each carries this site's host and a
 *      current filemtime() cache key instead of the exporting site's;
 *   4. fails closed unless every one of them was found and rewritten exactly
 *      once; and
 *   5. emits the accepted snapshot unchanged otherwise.
 * It carries no essay markup of its own and never reads a draft, so the
 * published essay cannot acquire a third maintained copy. The previous
 * hand-maintained copy of this file drifted behind the database body, and
 * re-inserting it would have silently reverted /ai-enablement/ to an older
 * draft.
 *
 * Each matcher tolerates an absolute host and an existing ?v= query, so a
 * body that round-tripped through this pattern (inserter -> editor ->
 * database -> exported snapshot) still substitutes cleanly instead of
 * silently registering an empty pattern. scripts/verify-ai-enablement-source.js
 * executes this file under a WordPress shim and pins both this contract and
 * the snapshot's side of it.
 */

$hperkins_aie_snapshot_path = get_theme_file_path( 'content/page-snapshots/ai-enablement.html' );
$hperkins_aie_markup        = is_readable( $hperkins_aie_snapshot_path )
	? (string) file_get_contents( $hperkins_aie_snapshot_path )
	: '';

if ( '' === trim( $hperkins_aie_markup ) ) {
	return;
}

// Keep this list identical to RING_CARD_ASSETS in
// scripts/verify-ai-enablement-source.js.
$hperkins_aie_ring_assets = array(
	'assets/img/imagery/rivendell-second-age.webp',
	'assets/img/imagery/rivendell-second-age.png',
	'assets/img/imagery/rivendell-third-age.webp',
	'assets/img/imagery/rivendell-third-age.png',
	'assets/img/imagery/rivendell-fourth-age.webp',
	'assets/img/imagery/rivendell-fourth-age.png',
);

// Native src/srcset only: the lookbehind requires whitespace before the
// attribute, so a lazy-loader's data-src (or any other prefixed attribute)
// cannot satisfy the exactly-once check. A browser never loads those.
foreach ( $hperkins_aie_ring_assets as $hperkins_aie_asset ) {
	$hperkins_aie_asset_pattern = '#(?<=\s)(src|srcset)="(?:https?://[^"/]+)?'
		. preg_quote( '/wp-content/themes/hperkins-tokens/' . $hperkins_aie_asset, '#' )
		. '(?:\?v=\d+)?"#';
	$hperkins_aie_asset_found   = preg_match_all( $hperkins_aie_asset_pattern, $hperkins_aie_markup );
	$hperkins_aie_asset_url     = esc_url( hperkins_tokens_asset_url( $hperkins_aie_asset ) );

	$hperkins_aie_asset_count = 0;
	$hperkins_aie_markup      = (string) preg_replace_callback(
		$hperkins_aie_asset_pattern,
		static function ( $matches ) use ( $hperkins_aie_asset_url ) {
			return $matches[1] . '="' . $hperkins_aie_asset_url . '"';
		},
		$hperkins_aie_markup,
		-1,
		$hperkins_aie_asset_count
	);

	if ( 1 !== $hperkins_aie_asset_found || 1 !== $hperkins_aie_asset_count ) {
		return;
	}
}

echo $hperkins_aie_markup; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- trusted, versioned theme snapshot markup; only the six asset URL substitutions above are computed and esc_url()-escaped.
