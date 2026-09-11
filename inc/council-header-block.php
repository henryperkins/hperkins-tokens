<?php
/**
 * Native block adapter for the existing Council renderer.
 *
 * @package HPerkins_Tokens
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'init', function () {
	// Declare the canvas dependency explicitly. add_editor_style() alone relies
	// on WordPress fetching absolute stylesheet URLs while building editor settings.
	wp_register_style(
		'hperkins-council-editor-theme',
		get_stylesheet_uri(),
		array(),
		filemtime( get_stylesheet_directory() . '/style.css' )
	);
	wp_register_style(
		'hperkins-council-editor',
		get_stylesheet_directory_uri() . '/blocks/council-header/editor.css',
		array( 'hperkins-council-editor-theme' ),
		filemtime( get_stylesheet_directory() . '/blocks/council-header/editor.css' )
	);
	register_block_type(
		get_stylesheet_directory() . '/blocks/council-header',
		array( 'render_callback' => 'hperkins_tokens_render_council_header_block' )
	);
} );

/**
 * Render current site data; preview-only attributes never affect public output.
 *
 * @param array $attributes Block attributes.
 * @return string
 */
function hperkins_tokens_render_council_header_block( $attributes ) {
	$is_preview = defined( 'REST_REQUEST' ) && REST_REQUEST && isset( $attributes['previewId'] );
	$options    = array(
		'wrapper_attributes' => get_block_wrapper_attributes( array( 'class' => 'hp-council-header alignwide' ) ),
	);
	if ( $is_preview ) {
		// A block-renderer REST URL does not identify the page being designed.
		$options['current_path'] = '';
	}
	$html = hperkins_tokens_render_council_header( $options );
	if ( ! $is_preview ) {
		return $html;
	}

	$panel = isset( $attributes['previewPanel'] ) && in_array( $attributes['previewPanel'], array( 'work', 'writing', 'search', 'drawer' ), true )
		? $attributes['previewPanel'] : 'closed';
	$prefix = 'hp-preview-' . sanitize_html_class( $attributes['previewId'] ) . '-';
	$tags   = new WP_HTML_Tag_Processor( $html );
	while ( $tags->next_tag() ) {
		// Multiple editor previews must not share IDs or label targets.
		foreach ( array( 'id', 'for', 'aria-controls', 'aria-labelledby' ) as $attribute ) {
			$value = $tags->get_attribute( $attribute );
			if ( is_string( $value ) && '' !== $value ) {
				$tags->set_attribute( $attribute, implode( ' ', array_map( static function ( $id ) use ( $prefix ) {
					return $prefix . $id;
				}, preg_split( '/\s+/', trim( $value ) ) ) ) );
			}
		}
		$trigger = $tags->get_attribute( 'data-hp-header-trigger' );
		if ( is_string( $trigger ) ) {
			$tags->set_attribute( 'aria-expanded', $trigger === $panel ? 'true' : 'false' );
		}
		$surface = $tags->get_attribute( 'data-hp-header-panel' );
		if ( is_string( $surface ) && $surface === $panel ) {
			$tags->remove_attribute( 'hidden' );
		}
	}
	return $tags->get_updated_html();
}
