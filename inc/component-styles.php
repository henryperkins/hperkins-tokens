<?php
/**
 * Conditional component stylesheets.
 *
 * style.css carries only what every route needs. Component CSS lives in
 * assets/c/*.css and loads when the content actually being rendered uses it.
 *
 * The gate is content, not page identity. These components come from patterns
 * an editor inserts into post content, so an is_page() allowlist would leave
 * them unstyled the first time someone used one somewhere new. Resolution
 * happens on wp_enqueue_scripts so the sheets print in <head> and nothing
 * renders unstyled.
 *
 * The null-haystack path loads every bundle, restoring the pre-split transfer
 * profile. It is a backstop, not the routine safety net: WordPress sets
 * $_wp_current_template_content for effectively every front-end request on a
 * block theme — falling back to the PARENT template when this theme owns no
 * match — so the haystack is almost never null. A parent-served route without
 * a queried post therefore resolves to zero bundles rather than all three.
 * Every route this theme serves is theme-owned today; keep it that way, or
 * give the new route a template here.
 *
 * @package hperkins-tokens
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class-name prefixes owned by each bundle.
 *
 * Must stay in sync with BUNDLES in scripts/lib/style-coverage.js;
 * scripts/verify-performance-assets.js fails the build if they diverge.
 *
 * @return array<string, string[]> Bundle name => class prefixes.
 */
function hperkins_tokens_bundle_map() {
	return array(
		'evidence'    => array(
			'hp-operational-story',
			'hp-evidence-row',
			'hp-evidence-board',
			'hp-product-hero',
			'hp-artifact',
			'hp-signal',
			'hp-shot',
			'hp-quote',
			'hp-spoke-nav',
			'hp-case-study-template',
			'hp-lead',
		),
		'interactive' => array(
			'hp-disclosure',
			// Core details block wearing the disclosure style.
			'is-style-hperkins-disclosure',
			'hp-subscribe',
			'hp-input',
			'hp-icon-button',
			'hp-content-search',
			'hp-callout',
			'hp-badge',
			'hp-tag',
			'hp-avatar',
		),
		'longform'    => array(
			'wp-block-table',
			'hp-reader-hero',
			'hp-archive-hero',
			'hp-skill-group',
			'hp-work-template',
		),
	);
}

/**
 * Candidate template slugs for the current request, most specific first.
 *
 * This mirrors WordPress's own block-template hierarchy. It cannot use
 * get_page_template_slug() alone: block themes resolve page-{slug}.html by
 * convention, so pages that render through a dedicated template still report
 * no assigned slug. Reading only the assigned slug would send every such page
 * down the fail-open path and load every bundle.
 *
 * @return string[] Slugs to try, in priority order.
 */
function hperkins_tokens_template_candidates() {
	if ( is_front_page() ) {
		return array( 'front-page', 'home', 'index' );
	}
	if ( is_home() ) {
		return array( 'home', 'index' );
	}
	if ( is_404() ) {
		return array( '404', 'index' );
	}
	if ( is_search() ) {
		return array( 'search', 'index' );
	}
	if ( is_singular() ) {
		$post       = get_queried_object();
		$candidates = array();

		$assigned = get_page_template_slug();
		if ( $assigned ) {
			$candidates[] = preg_replace( '/\.html$/', '', $assigned );
		}

		if ( $post instanceof WP_Post ) {
			if ( is_page() ) {
				$candidates[] = 'page-' . $post->post_name;
				$candidates[] = 'page-' . $post->ID;
				$candidates[] = 'page';
			} else {
				$candidates[] = 'single-' . $post->post_type . '-' . $post->post_name;
				$candidates[] = 'single-' . $post->post_type;
				$candidates[] = 'single';
			}
		}

		$candidates[] = 'singular';
		$candidates[] = 'index';
		return $candidates;
	}
	if ( is_archive() ) {
		return array( 'archive', 'index' );
	}

	return array();
}

/**
 * First candidate template that exists in this theme, as an absolute path.
 *
 * @return string|null Path, or null when no candidate is theme-owned.
 */
function hperkins_tokens_resolve_template_file() {
	foreach ( hperkins_tokens_template_candidates() as $slug ) {
		$file = get_stylesheet_directory() . '/templates/' . $slug . '.html';
		if ( file_exists( $file ) ) {
			return $file;
		}
	}
	return null;
}

/**
 * Theme pattern slugs a block-markup string names.
 *
 * @param string $markup Block markup.
 * @return string[] Pattern slugs, without the namespace.
 */
function hperkins_tokens_pattern_slugs( $markup ) {
	if ( ! preg_match_all( '/wp:pattern\s*\{"slug":"hperkins-tokens\/([\w-]+)"/', $markup, $matches ) ) {
		return array();
	}
	return array_unique( $matches[1] );
}

/**
 * Markup that will render for this request: the post body, the template file,
 * and every theme pattern reachable from either, expanded transitively.
 *
 * Expansion has to follow the whole chain, not one level: page-contact.html
 * names hperkins-tokens/contact, and that pattern names
 * hperkins-tokens/imladris-subscribe, which is the only place .hp-subscribe
 * appears. A one-level walk resolves /contact/ correctly today only because
 * contact.php happens to use .hp-input from the same bundle — move either
 * prefix and the subscribe form renders unstyled. The visited set bounds the
 * walk at the number of pattern files, so a pattern cycle terminates.
 *
 * Template parts are deliberately excluded. They render on every route, so
 * anything they use has to live in style.css; verify-performance-assets.js
 * pins that they — and the pattern and shortcode markup they delegate to —
 * reference no bundle-owned class.
 *
 * @return string|null Concatenated markup, or null when it cannot be resolved.
 */
function hperkins_tokens_render_haystack() {
	$parts = array();

	$queried = get_queried_object();
	if ( $queried instanceof WP_Post ) {
		$parts[] = (string) $queried->post_content;
	}

	// Prefer the template WordPress has actually resolved for this request.
	// locate_block_template() sets $_wp_current_template_content during
	// template_include, which runs before wp_head() and therefore before
	// wp_enqueue_scripts. It reflects a Site Editor customisation stored in
	// wp_template, which shadows the theme file and can differ from it — this
	// site carries such an override for front-page, with its patterns already
	// expanded. Reading the file instead would resolve bundles from markup
	// that is not what renders.
	$template_markup = '';
	if ( isset( $GLOBALS['_wp_current_template_content'] ) && is_string( $GLOBALS['_wp_current_template_content'] ) ) {
		$template_markup = (string) $GLOBALS['_wp_current_template_content'];
	}

	if ( '' === $template_markup ) {
		$template = hperkins_tokens_resolve_template_file();
		if ( null === $template ) {
			// A route this theme serves from the parent theme or from core. Its
			// markup cannot be resolved here, so the caller falls open.
			return null;
		}
		$template_markup = (string) file_get_contents( $template );
	}

	$parts[] = $template_markup;

	// Seed from everything collected so far: a stored post body can name a
	// pattern too, not just the template.
	$pending = array();
	foreach ( $parts as $markup ) {
		$pending = array_merge( $pending, hperkins_tokens_pattern_slugs( $markup ) );
	}

	$seen = array();
	while ( $pending ) {
		$pattern_slug = array_shift( $pending );
		if ( isset( $seen[ $pattern_slug ] ) ) {
			continue;
		}
		$seen[ $pattern_slug ] = true;

		$pattern_file = get_stylesheet_directory() . '/patterns/' . $pattern_slug . '.php';
		if ( ! file_exists( $pattern_file ) ) {
			continue;
		}

		$pattern_markup = (string) file_get_contents( $pattern_file );
		$parts[]        = $pattern_markup;
		$pending        = array_merge( $pending, hperkins_tokens_pattern_slugs( $pattern_markup ) );
	}

	return implode( "\n", $parts );
}

/**
 * Bundles this request needs. Every bundle when content cannot be resolved.
 *
 * @return string[] Bundle names.
 */
function hperkins_tokens_component_bundles() {
	$map      = hperkins_tokens_bundle_map();
	$haystack = hperkins_tokens_render_haystack();

	if ( null === $haystack ) {
		return array_keys( $map );
	}

	$needed = array();
	foreach ( $map as $bundle => $prefixes ) {
		foreach ( $prefixes as $prefix ) {
			if ( false !== strpos( $haystack, $prefix ) ) {
				$needed[] = $bundle;
				break;
			}
		}
	}

	return $needed;
}

/**
 * Enqueue the resolved bundles after the main sheet so the cascade holds.
 */
function hperkins_tokens_enqueue_component_styles() {
	foreach ( hperkins_tokens_component_bundles() as $bundle ) {
		$relative = '/assets/c/' . $bundle . '.css';
		$file     = get_stylesheet_directory() . $relative;
		if ( ! file_exists( $file ) ) {
			continue;
		}
		wp_enqueue_style(
			'hperkins-c-' . $bundle,
			get_stylesheet_directory_uri() . $relative,
			array( 'hperkins-tokens' ),
			filemtime( $file )
		);
	}
}
// Priority 20 to sit with the theme's other style work. It does NOT guarantee
// this runs after functions.php's main enqueue — same-priority callbacks fire
// in registration order, and the require_once for this file precedes that
// add_action(), so this one actually runs first. Order is safe because the
// 'hperkins-tokens' dependency below is resolved by WP_Dependencies at print
// time, not at enqueue time. Keep the dependency; do not lean on the priority.
add_action( 'wp_enqueue_scripts', 'hperkins_tokens_enqueue_component_styles', 20 );

/**
 * The editor has no single resolvable route, so it gets every bundle.
 */
function hperkins_tokens_component_editor_styles() {
	foreach ( array_keys( hperkins_tokens_bundle_map() ) as $bundle ) {
		$relative = '/assets/c/' . $bundle . '.css';
		if ( file_exists( get_stylesheet_directory() . $relative ) ) {
			add_editor_style( get_stylesheet_directory_uri() . $relative );
		}
	}
}
add_action( 'after_setup_theme', 'hperkins_tokens_component_editor_styles', 20 );
