<?php
/**
 * The postcard's compass-star plate.
 *
 * Implements A3 of the 2026-10-06 unshipped-refinements hand-off from the
 * Imladris design project (components/content/ArticleCard.jsx). A postcard
 * with no featured image shows the compass star on its twilight plate. The
 * star used to be painted on .hp-postcard__media::after, which also carried
 * the diagonal mask and the background-position that places it, so turning
 * it would have turned the mask and the placement too. The star is now the
 * ::after of its own element, appended here as the media group's last child:
 * it turns a quarter on hover and title focus while the mask, on the
 * element, stays still. The CSS lives with the postcard rules in
 * assets/imladris-pages.css.
 *
 * A render filter rather than an empty group in each template: the plate then
 * reaches every postcard loop whatever the template's source, including a
 * Site Editor copy saved before the plate existed, and the Site Editor shows
 * no empty group. The reader hero's plate is added the same way
 * (inc/reader.php).
 *
 * scripts/lib/postcard-plate.test.js exercises the filter under a PHP shim,
 * and scripts/verify-journal-polish.js checks the rendered plate.
 *
 * @package HPerkins_Tokens
 */

defined( 'ABSPATH' ) || exit;

/**
 * Append the star plate to a postcard media group.
 *
 * Last, not first: the media group uses flow layout, so the plate takes the
 * block-gap margin a later child gets (the CSS resets it) and the featured
 * image stays where it was. A post with no featured image renders no figure,
 * and the plate is then the group's only child.
 *
 * @param string $block_content Rendered group markup.
 * @param array  $block         Parsed block.
 * @return string
 */
function hperkins_tokens_postcard_plate( $block_content, $block ) {
	$class_name = isset( $block['attrs']['className'] ) ? (string) $block['attrs']['className'] : '';
	$classes    = preg_split( '/\s+/', trim( $class_name ) );
	if ( ! is_array( $classes ) || ! in_array( 'hp-postcard__media', $classes, true ) ) {
		return $block_content;
	}

	// One plate per card, even where a template already carries its own.
	if ( false !== strpos( $block_content, 'hp-postcard__plate' ) ) {
		return $block_content;
	}

	// Close inside the group's own wrapper, whatever its tagName.
	if ( ! preg_match( '/^\s*<([a-z][a-z0-9-]*)\b/i', $block_content, $wrapper ) ) {
		return $block_content;
	}
	$close = strripos( $block_content, '</' . $wrapper[1] . '>' );
	if ( false === $close ) {
		return $block_content;
	}

	return substr_replace( $block_content, '<span class="hp-postcard__plate" aria-hidden="true"></span>', $close, 0 );
}
add_filter( 'render_block_core/group', 'hperkins_tokens_postcard_plate', 10, 2 );
