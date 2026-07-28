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
 *   4. counts what the snapshot actually contains rather than expecting a
 *      phase-specific number, requiring exactly one portrait and at least one
 *      résumé action, every one of them rewritten; and
 *   5. fails closed if any occurrence survives un-rewritten.
 * It never reads the work-in-progress candidate in the drafts directory.
 *
 * Both URL matchers tolerate an absolute host and an existing ?v= query, so a
 * body that round-tripped through this pattern (inserter -> editor -> database
 * -> exported snapshot) still substitutes cleanly instead of silently
 * registering an empty pattern.
 */

$hperkins_about_snapshot_path = get_theme_file_path( 'content/page-snapshots/about.html' );
$hperkins_about_markup        = is_readable( $hperkins_about_snapshot_path )
	? (string) file_get_contents( $hperkins_about_snapshot_path )
	: '';

if ( '' === trim( $hperkins_about_markup ) ) {
	return;
}

// The portrait lives in uploads (not the theme), so hperkins_tokens_asset_url()
// can't mtime it; bust the ~30-day CDN image cache the same way by hand. The
// snapshot pins a ?v= for the DB body; the adapter re-derives it dynamically.
$hperkins_about_portrait_rel  = '/wp-content/uploads/2026/06/henry-perkins.png';
$hperkins_about_portrait_file = WP_CONTENT_DIR . '/uploads/2026/06/henry-perkins.png';
$hperkins_about_portrait_src  = file_exists( $hperkins_about_portrait_file )
	? add_query_arg( 'v', filemtime( $hperkins_about_portrait_file ), $hperkins_about_portrait_rel )
	: $hperkins_about_portrait_rel;

$hperkins_about_portrait_pattern = '#src="(?:https?://[^"/]+)?'
	. preg_quote( $hperkins_about_portrait_rel, '#' ) . '(?:\?v=\d+)?"#';
$hperkins_about_portrait_found   = preg_match_all( $hperkins_about_portrait_pattern, $hperkins_about_markup );

$hperkins_about_portrait_count = 0;
$hperkins_about_markup         = (string) preg_replace(
	$hperkins_about_portrait_pattern,
	'src="' . esc_url( $hperkins_about_portrait_src ) . '"',
	$hperkins_about_markup,
	-1,
	$hperkins_about_portrait_count
);

$hperkins_about_resume_rel     = 'assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf';
$hperkins_about_resume_pattern = '#href="(?:https?://[^"/]+)?/wp-content/themes/hperkins-tokens/'
	. preg_quote( $hperkins_about_resume_rel, '#' ) . '(?:\?v=\d+)?"#';
// Count what this snapshot actually carries. Deriving the expectation from the
// markup is rename-proof and count-proof: an accepted body with a different
// number of résumé actions still renders, while a body whose href literal has
// drifted (nothing to substitute) still fails closed.
$hperkins_about_resume_found   = preg_match_all( $hperkins_about_resume_pattern, $hperkins_about_markup );

$hperkins_about_resume_count = 0;
$hperkins_about_markup       = (string) preg_replace(
	$hperkins_about_resume_pattern,
	'href="' . esc_url( hperkins_tokens_asset_url( $hperkins_about_resume_rel ) ) . '"',
	$hperkins_about_markup,
	-1,
	$hperkins_about_resume_count
);

if (
	1 !== $hperkins_about_portrait_found
	|| 1 !== $hperkins_about_portrait_count
	|| $hperkins_about_resume_found < 1
	|| $hperkins_about_resume_found !== $hperkins_about_resume_count
) {
	return;
}

echo $hperkins_about_markup; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- trusted, versioned theme snapshot markup; only URL substitutions above are computed, and both are esc_url()-escaped.
