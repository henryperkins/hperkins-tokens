<?php
/**
 * Keep the About page's dynamic Gravatar card in the document outline.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Determine whether a parsed block is the template-owned About Gravatar card.
 *
 * @param array $parsed_block Parsed block data.
 * @return bool
 */
function hperkins_tokens_is_about_gravatar_block( $parsed_block ) {
	if (
		! isset( $parsed_block['blockName'], $parsed_block['attrs']['className'] ) ||
		'gravatar/block' !== $parsed_block['blockName']
	) {
		return false;
	}

	$classes = preg_split( '/\s+/', trim( (string) $parsed_block['attrs']['className'] ) );

	return is_array( $classes ) && in_array( 'hp-about-gravatar-card', $classes, true );
}

/**
 * Prefix the target Gravatar card with its accessible outline bridge.
 *
 * The plugin hydrates its profile name as an H4 in the browser. A visually
 * hidden H3 keeps that third-party heading beneath the section's H2 without
 * changing the card's own server-rendered markup.
 *
 * @param string $block_content Rendered block markup.
 * @param array  $parsed_block  Parsed block data.
 * @return string
 */
function hperkins_tokens_render_about_gravatar_heading( $block_content, $parsed_block ) {
	if ( ! hperkins_tokens_is_about_gravatar_block( $parsed_block ) ) {
		return $block_content;
	}

	return '<h3 class="screen-reader-text">Profile details</h3>' . $block_content;
}
add_filter( 'render_block_gravatar/block', 'hperkins_tokens_render_about_gravatar_heading', 10, 2 );
