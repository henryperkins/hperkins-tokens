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

	// Bust the child sheet on file mtime, matching every other hand-authored
	// asset below. The `Version:` header is still the theme's declared version
	// (and the readme changelog source-of-truth), but it is no longer the cache
	// key — so editing style.css ships under a fresh key without a manual bump.
	$style_css_file = get_stylesheet_directory() . '/style.css';
	wp_enqueue_style(
		'hperkins-tokens',
		get_stylesheet_uri(),
		array( 'assembler-parent' ),
		file_exists( $style_css_file ) ? filemtime( $style_css_file ) : wp_get_theme()->get( 'Version' )
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

	// Progressive enhancement for the contact + subscribe forms: inline email
	// validation and a confirmation-state swap (the Imladris Design System's
	// Contact/Subscribe interaction). With JS off, the visible direct-email
	// links are the no-JS fallback while the form action remains a `mailto:` URL.
	$form_enhance_rel  = '/assets/js/form-enhance.js';
	$form_enhance_file = get_stylesheet_directory() . $form_enhance_rel;
	if ( file_exists( $form_enhance_file ) ) {
		wp_enqueue_script(
			'hperkins-form-enhance',
			get_stylesheet_directory_uri() . $form_enhance_rel,
			array(),
			filemtime( $form_enhance_file ),
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
 * Hide inherited Assembler style variations from this child theme's Site Editor
 * variations endpoint. The token contract lives in hperkins-tokens/theme.json;
 * parent style variations would reintroduce generic palettes and font pairings.
 *
 * @param mixed           $dispatch_result Short-circuit response, or null.
 * @param WP_REST_Request $request         Current REST request.
 * @return mixed
 */
function hperkins_tokens_filter_global_style_variations( $dispatch_result, $request ) {
	if ( null !== $dispatch_result ) {
		return $dispatch_result;
	}

	if ( ! $request instanceof WP_REST_Request ) {
		return $dispatch_result;
	}

	if ( 'GET' !== $request->get_method() ) {
		return $dispatch_result;
	}

	if ( 'hperkins-tokens' !== get_stylesheet() ) {
		return $dispatch_result;
	}

	if ( 'hperkins-tokens' !== $request['stylesheet'] ) {
		return $dispatch_result;
	}

	if ( ! preg_match( '#^/wp/v2/global-styles/themes/[^/]+/variations$#', $request->get_route() ) ) {
		return $dispatch_result;
	}

	return array();
}
add_filter( 'rest_dispatch_request', 'hperkins_tokens_filter_global_style_variations', 10, 2 );

/**
 * Blocks that inherit Assembler's generic section style partials unless this
 * child theme removes them.
 *
 * @return string[]
 */
function hperkins_tokens_get_inherited_assembler_section_blocks() {
	return array( 'core/group', 'core/columns', 'core/column', 'core/cover' );
}

/**
 * Style slugs used by Assembler's inherited section partials.
 *
 * @return string[]
 */
function hperkins_tokens_get_inherited_assembler_section_styles() {
	return array( 'section-1', 'section-2', 'section-3' );
}

/**
 * Remove inherited Assembler section variations from the block-style registry.
 */
function hperkins_tokens_unregister_inherited_assembler_section_styles() {
	if ( ! class_exists( 'WP_Block_Styles_Registry' ) ) {
		return;
	}

	$registry = WP_Block_Styles_Registry::get_instance();
	foreach ( hperkins_tokens_get_inherited_assembler_section_blocks() as $block_name ) {
		foreach ( hperkins_tokens_get_inherited_assembler_section_styles() as $style_name ) {
			if ( $registry->is_registered( $block_name, $style_name ) ) {
				$registry->unregister( $block_name, $style_name );
			}
		}
	}
}
add_action( 'init', 'hperkins_tokens_unregister_inherited_assembler_section_styles', 100 );
add_action( 'admin_init', 'hperkins_tokens_unregister_inherited_assembler_section_styles', 0 );

/**
 * Remove inherited Assembler section variation data from a theme.json-shaped
 * array.
 *
 * @param array $data Theme JSON data.
 * @return array
 */
function hperkins_tokens_without_inherited_assembler_section_variations( $data ) {
	if ( ! is_array( $data ) ) {
		return $data;
	}

	foreach ( hperkins_tokens_get_inherited_assembler_section_blocks() as $block_name ) {
		foreach ( hperkins_tokens_get_inherited_assembler_section_styles() as $style_name ) {
			unset( $data['styles']['blocks'][ $block_name ]['variations'][ $style_name ] );
		}

		if ( empty( $data['styles']['blocks'][ $block_name ]['variations'] ) ) {
			unset( $data['styles']['blocks'][ $block_name ]['variations'] );
		}
	}

	return $data;
}

/**
 * Strip inherited Assembler section variations from the theme-origin JSON before
 * the merged global-styles payload reaches the editor.
 *
 * @param WP_Theme_JSON_Data $theme_json Theme-origin JSON data.
 * @return WP_Theme_JSON_Data
 */
function hperkins_tokens_filter_theme_json_data( $theme_json ) {
	if ( 'hperkins-tokens' !== get_stylesheet() ) {
		return $theme_json;
	}

	if ( ! $theme_json instanceof WP_Theme_JSON_Data ) {
		return $theme_json;
	}

	$data = hperkins_tokens_without_inherited_assembler_section_variations( $theme_json->get_data() );

	hperkins_tokens_unregister_inherited_assembler_section_styles();

	return new WP_Theme_JSON_Data( $data, 'theme' );
}
add_filter( 'wp_theme_json_data_theme', 'hperkins_tokens_filter_theme_json_data', 20 );

/**
 * Strip inherited Assembler section variations from the global-styles REST
 * response after core assembles the editor-facing payload.
 *
 * @param mixed           $response REST response.
 * @param array           $handler  Route handler.
 * @param WP_REST_Request $request  REST request.
 * @return mixed
 */
function hperkins_tokens_filter_global_styles_response( $response, $handler, $request ) {
	if ( 'hperkins-tokens' !== get_stylesheet() ) {
		return $response;
	}

	if ( ! $response instanceof WP_REST_Response || ! $request instanceof WP_REST_Request ) {
		return $response;
	}

	if ( 'GET' !== $request->get_method() ) {
		return $response;
	}

	if ( 'hperkins-tokens' !== $request['stylesheet'] ) {
		return $response;
	}

	if ( ! preg_match( '#^/wp/v2/global-styles/themes/[^/]+$#', $request->get_route() ) ) {
		return $response;
	}

	$data = hperkins_tokens_without_inherited_assembler_section_variations( $response->get_data() );
	$response->set_data( $data );

	hperkins_tokens_unregister_inherited_assembler_section_styles();

	return $response;
}
add_filter( 'rest_request_after_callbacks', 'hperkins_tokens_filter_global_styles_response', 10, 3 );

/**
 * Remove inherited Assembler section styles from block-type REST responses.
 *
 * @param WP_REST_Response $response   Block type response.
 * @param WP_Block_Type    $block_type Block type object.
 * @return WP_REST_Response
 */
function hperkins_tokens_filter_block_type_styles_response( $response, $block_type ) {
	if ( 'hperkins-tokens' !== get_stylesheet() ) {
		return $response;
	}

	if ( ! $response instanceof WP_REST_Response || ! $block_type instanceof WP_Block_Type ) {
		return $response;
	}

	if ( ! in_array( $block_type->name, hperkins_tokens_get_inherited_assembler_section_blocks(), true ) ) {
		return $response;
	}

	$data = $response->get_data();
	if ( empty( $data['styles'] ) || ! is_array( $data['styles'] ) ) {
		return $response;
	}

	$inherited_style_names = hperkins_tokens_get_inherited_assembler_section_styles();
	$data['styles']       = array_values(
		array_filter(
			$data['styles'],
			static function ( $style ) use ( $inherited_style_names ) {
				return ! in_array( $style['name'] ?? '', $inherited_style_names, true );
			}
		)
	);

	$response->set_data( $data );

	return $response;
}
add_filter( 'rest_prepare_block_type', 'hperkins_tokens_filter_block_type_styles_response', 10, 2 );

/**
 * Stop editor/admin styles from printing font faces for inherited Assembler
 * style variations that this child theme deliberately hides.
 */
function hperkins_tokens_remove_inherited_style_variation_font_faces() {
	remove_action( 'admin_print_styles', 'wp_print_font_faces_from_style_variations', 50 );
}
add_action( 'init', 'hperkins_tokens_remove_inherited_style_variation_font_faces', 100 );
add_action( 'admin_init', 'hperkins_tokens_remove_inherited_style_variation_font_faces', 0 );

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
