<?php
/**
 * Title: About / Resume
 * Slug: hperkins-tokens/about-resume
 * Categories: hperkins
 * Description: Inserter seed for the About page. A thin adapter over the accepted database snapshot (content/page-snapshots/about.html): it emits that trusted markup with theme-correct portrait and résumé asset URLs, and deliberately contains no second About composition of its own. The visitor-facing /about/ body is database-owned; the snapshot is its verified mirror.
 */

/*
 * Thin accepted-snapshot adapter. The pattern:
 *   1. reads content/page-snapshots/about.html;
 *   2. fails closed (emits nothing) if the snapshot is absent or empty;
 *   3. replaces only the known portrait URL and résumé asset URL occurrences
 *      with the existing filemtime()-derived URLs;
 *   4. expects exactly one portrait substitution, and exactly two résumé
 *      substitutions for the current body (three once the proof-first body
 *      with its closing invitation is the accepted snapshot); and
 *   5. fails closed if the phase-specific substitution counts do not match.
 * It never reads the work-in-progress candidate in the drafts directory.
 */

$hperkins_about_snapshot_path = get_theme_file_path( 'content/page-snapshots/about.html' );
$hperkins_about_markup        = is_readable( $hperkins_about_snapshot_path )
	? (string) file_get_contents( $hperkins_about_snapshot_path )
	: '';

if ( '' === trim( $hperkins_about_markup ) ) {
	return;
}

// The proof-first body carries the page navigation landmark and a closing
// invitation with a third résumé action; the current body has two.
$hperkins_about_expected_resume_links = str_contains( $hperkins_about_markup, 'hp-about-nav' ) ? 3 : 2;

// The portrait lives in uploads (not the theme), so hperkins_tokens_asset_url()
// can't mtime it; bust the ~30-day CDN image cache the same way by hand. The
// snapshot pins a ?v= for the DB body; the adapter re-derives it dynamically.
$hperkins_about_portrait_rel  = '/wp-content/uploads/2026/06/henry-perkins.png';
$hperkins_about_portrait_file = WP_CONTENT_DIR . '/uploads/2026/06/henry-perkins.png';
$hperkins_about_portrait_src  = file_exists( $hperkins_about_portrait_file )
	? add_query_arg( 'v', filemtime( $hperkins_about_portrait_file ), $hperkins_about_portrait_rel )
	: $hperkins_about_portrait_rel;

$hperkins_about_portrait_count = 0;
$hperkins_about_markup         = (string) preg_replace(
	'#src="' . preg_quote( $hperkins_about_portrait_rel, '#' ) . '(?:\?v=\d+)?"#',
	'src="' . esc_url( $hperkins_about_portrait_src ) . '"',
	$hperkins_about_markup,
	-1,
	$hperkins_about_portrait_count
);

$hperkins_about_resume_rel   = 'assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf';
$hperkins_about_resume_count = 0;
$hperkins_about_markup       = str_replace(
	'href="/wp-content/themes/hperkins-tokens/' . $hperkins_about_resume_rel . '"',
	'href="' . esc_url( hperkins_tokens_asset_url( $hperkins_about_resume_rel ) ) . '"',
	$hperkins_about_markup,
	$hperkins_about_resume_count
);

if ( 1 !== $hperkins_about_portrait_count || $hperkins_about_expected_resume_links !== $hperkins_about_resume_count ) {
	return;
}

echo $hperkins_about_markup; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- trusted, versioned theme snapshot markup; only URL substitutions above are computed, and both are esc_url()-escaped.
