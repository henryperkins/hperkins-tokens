<?php
/**
 * HPerkins Tokens — child theme bootstrap.
 *
 * Wires the child stylesheet on the frontend and keeps the inherited editor
 * styles, font preload behavior, and pattern category aligned with this
 * token-driven child theme.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'wp_enqueue_scripts', function () {
	// The parent's assembler_styles() registers 'assembler-style' from
	// get_stylesheet_directory_uri(), which under a child theme resolves to
	// THIS theme's style.css — loading the child CSS a second time. Drop it
	// and load both sheets explicitly with the correct dependency order.
	wp_dequeue_style( 'assembler-style' );

	$parent       = get_template_directory_uri() . '/style.css';
	$parent_theme = wp_get_theme( get_template() );
	wp_enqueue_style( 'assembler-parent', $parent, array(), $parent_theme->get( 'Version' ) );
	wp_enqueue_style(
		'hperkins-tokens',
		get_stylesheet_uri(),
		array( 'assembler-parent' ),
		wp_get_theme()->get( 'Version' )
	);

	// Page-layout CSS for the designs pulled from the Imladris Design System
	// (ai-enablement essay, contact, work index). Kept out of style.css so the
	// hand-authored sheet stays untouched; depends on it so the cascade is right.
	$pages_css_rel  = '/assets/imladris-pages.css';
	$pages_css_file = get_stylesheet_directory() . $pages_css_rel;
	if ( file_exists( $pages_css_file ) ) {
		wp_enqueue_style(
			'hperkins-pages',
			get_stylesheet_directory_uri() . $pages_css_rel,
			array( 'hperkins-tokens' ),
			filemtime( $pages_css_file )
		);
	}

	$wapuu_mark_file = get_stylesheet_directory() . '/assets/wapuu/wapuu-mark.png';
	$wapuu_mark_url  = get_stylesheet_directory_uri() . '/assets/wapuu/wapuu-mark.png';
	if ( file_exists( $wapuu_mark_file ) ) {
		$wapuu_mark_url = add_query_arg( 'v', filemtime( $wapuu_mark_file ), $wapuu_mark_url );
	}

	$footer_backdrop_file = get_stylesheet_directory() . '/assets/img/imagery/valley-twilight.png';
	$footer_backdrop_url  = get_stylesheet_directory_uri() . '/assets/img/imagery/valley-twilight.png';
	if ( file_exists( $footer_backdrop_file ) ) {
		$footer_backdrop_url = add_query_arg( 'v', filemtime( $footer_backdrop_file ), $footer_backdrop_url );
	}

	wp_add_inline_style(
		'hperkins-tokens',
		sprintf(
			':root{--hp-wapuu-mark-url:url(%1$s);--hp-footer-backdrop-url:url(%2$s);}',
			wp_json_encode( esc_url( $wapuu_mark_url ), JSON_UNESCAPED_SLASHES ),
			wp_json_encode( esc_url( $footer_backdrop_url ), JSON_UNESCAPED_SLASHES )
		)
	);

	$nav_close_rel  = '/assets/js/nav-close-delight.js';
	$nav_close_file = get_stylesheet_directory() . $nav_close_rel;
	if ( file_exists( $nav_close_file ) ) {
		wp_enqueue_script(
			'hperkins-nav-close-delight',
			get_stylesheet_directory_uri() . $nav_close_rel,
			array(),
			filemtime( $nav_close_file ),
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);
	}
}, 20 );

add_action( 'after_setup_theme', function () {
	global $editor_styles;

	// Load BOTH stylesheets in the block editor, parent-then-child, to match the
	// frontend cascade. Assembler registers the relative "style.css"; in a child
	// theme, WordPress resolves that against both parent and child directories.
	// Drop only that fragile relative entry so earlier editor-style additions from
	// plugins or integrations survive this rewrite.
	add_theme_support( 'editor-style' );
	$editor_styles = array_values( array_diff( (array) $editor_styles, array( 'style.css' ) ) );
	add_editor_style( get_template_directory_uri() . '/style.css' );
	add_editor_style( get_stylesheet_directory_uri() . '/style.css' );
	add_editor_style( get_stylesheet_directory_uri() . '/assets/imladris-pages.css' );

	// The Assembler parent preloads InterVariable.woff2 from the stylesheet
	// directory, which under this child theme resolves to a path that does not
	// exist (404). Imladris now serves its own theme.json font faces, so that
	// preload remains wrong and unused. Drop it. (after_setup_theme runs after
	// the parent registered the hook, so remove_action here takes effect.)
	remove_action( 'wp_head', 'assembler_preload_fonts', 1 );
}, 20 );

add_action( 'init', function () {
	register_block_pattern_category(
		'hperkins',
		array( 'label' => __( 'hperkins.blog', 'hperkins-tokens' ) )
	);

	$button_styles = array(
		'secondary' => __( 'Secondary', 'hperkins-tokens' ),
		'ghost'     => __( 'Ghost', 'hperkins-tokens' ),
		'accent'    => __( 'Accent', 'hperkins-tokens' ),
		'link'      => __( 'Link', 'hperkins-tokens' ),
	);
	foreach ( $button_styles as $name => $label ) {
		register_block_style(
			'core/button',
			array(
				'name'  => $name,
				'label' => $label,
			)
		);
	}

	register_block_style(
		'core/quote',
		array(
			'name'  => 'imladris',
			'label' => __( 'Imladris', 'hperkins-tokens' ),
		)
	);
}, 9 );

/**
 * Clean up legacy global-style posts from prior theme identities and refresh the
 * theme JSON cache when this child theme is activated. This is intentionally an
 * activation-time migration, not a public-request init task.
 */
function hperkins_tokens_cleanup_legacy_global_styles() {
	$theme = wp_get_theme();
	if ( 'hperkins-tokens' !== $theme->get_stylesheet() ) {
		return;
	}

	$option_key = 'hperkins_tokens_global_styles_cleanup_v1';
	if ( get_option( $option_key ) ) {
		return;
	}

	$posts = get_posts(
		array(
			'post_type'      => 'wp_global_styles',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'fields'         => 'ids',
		)
	);

	$current_style_post = 'wp-global-styles-' . $theme->get_stylesheet();
	foreach ( $posts as $post_id ) {
		$post_name = get_post_field( 'post_name', $post_id );
		if ( ! str_starts_with( $post_name, 'wp-global-styles-' ) ) {
			continue;
		}
		if ( $post_name === $current_style_post ) {
			continue;
		}

		$decoded_name = rawurldecode( $post_name );
		if (
			str_contains( $decoded_name, 'wp-global-styles-pub/' )
			|| str_contains( $decoded_name, 'wp-global-styles-assembler' )
			|| str_contains( $post_name, 'wp-global-styles-pub%2F' )
		) {
			wp_delete_post( $post_id, true );
		}
	}

	if ( method_exists( 'WP_Theme_JSON_Resolver', 'clean_cached_data' ) ) {
		WP_Theme_JSON_Resolver::clean_cached_data();
	}

	update_option( $option_key, gmdate( 'c' ) );
}
add_action( 'after_switch_theme', 'hperkins_tokens_cleanup_legacy_global_styles' );
