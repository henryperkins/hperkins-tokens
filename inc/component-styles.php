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
 * renders unstyled, and it fails open: when the request cannot be classified,
 * every bundle loads and the transfer profile is simply what it was before the
 * split.
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
 * Markup that will render for this request: the post body, the template file,
 * and the patterns that template names, expanded one level.
 *
 * Template parts are deliberately excluded. They render on every route, so
 * anything they use has to live in style.css; verify-performance-assets.js
 * pins that they reference no bundle-owned class.
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

	if ( preg_match_all( '/wp:pattern\s*\{"slug":"hperkins-tokens\/([\w-]+)"/', $template_markup, $matches ) ) {
		foreach ( array_unique( $matches[1] ) as $pattern_slug ) {
			$pattern_file = get_stylesheet_directory() . '/patterns/' . $pattern_slug . '.php';
			if ( file_exists( $pattern_file ) ) {
				$parts[] = (string) file_get_contents( $pattern_file );
			}
		}
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
// Priority 20 so the 'hperkins-tokens' dependency is registered first.
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
