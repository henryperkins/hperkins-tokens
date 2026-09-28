<?php
/**
 * The essay reader's server half (templates/single.html).
 *
 * Implements the server side of the 2026-09-28 essay-post hand-off from the
 * Imladris design project (templates/essays/EssayPost.dc.html):
 *
 * - Read time. A block-bindings source that a paragraph in the hero's meta row
 *   binds to, so the figure is measured from the post body rather than typed.
 * - Compass plate. The postcard's fallback star carried into a hero that has no
 *   featured image. assets/js/reader.js turns it as the hero scrolls away.
 * - Section marks. Every level-2 heading in the post body gets a stable id and
 *   a § link to that id; reader.js also copies the address when one is used.
 * - Opening dek. A wholly italic first paragraph is a subtitle rather than the
 *   start of the essay, so it is marked and the drop cap moves past it.
 *
 * All of it renders complete without JavaScript: a § mark is an ordinary
 * same-page link, and the plate is simply still.
 *
 * scripts/verify-reader.php exercises these functions inside WordPress, and
 * scripts/verify-reader.js checks the rendered result.
 *
 * @package HPerkins_Tokens
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'HPERKINS_TOKENS_READ_WORDS_PER_MINUTE' ) ) {
	define( 'HPERKINS_TOKENS_READ_WORDS_PER_MINUTE', 230 );
}

/**
 * Count the words a visitor actually reads in a post body.
 *
 * Block delimiters, markup, script and style bodies, and shortcodes go first,
 * then entities are decoded, then the text is split on whitespace. That is the
 * design project's own instrument (the rendered prose's text split on
 * whitespace), applied to the stored body so that no render is needed.
 * str_word_count() would drop numerals and split words at curly apostrophes.
 *
 * @param string $content Post content.
 * @return int Word count.
 */
function hperkins_tokens_reader_word_count( $content ) {
	$text  = wp_strip_all_tags( strip_shortcodes( (string) $content ) );
	$text  = html_entity_decode( $text, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	$words = preg_split( '/[\s\x{00A0}]+/u', $text, -1, PREG_SPLIT_NO_EMPTY );

	// preg_split() returns false on invalid UTF-8; count bytes-wise instead.
	return is_array( $words ) ? count( $words ) : str_word_count( $text );
}

/**
 * Whole minutes a post takes to read, or 0 when there is nothing to read.
 *
 * @param int|WP_Post|null $post Post ID or object.
 * @return int Minutes, at least 1 for any post with words in it.
 */
function hperkins_tokens_reader_minutes( $post ) {
	$post = get_post( $post );
	if ( ! $post instanceof WP_Post ) {
		return 0;
	}

	$words = hperkins_tokens_reader_word_count( $post->post_content );
	if ( $words < 1 ) {
		return 0;
	}

	return max( 1, (int) round( $words / HPERKINS_TOKENS_READ_WORDS_PER_MINUTE ) );
}

/**
 * Block-bindings value for the reader hero's read time.
 *
 * Returning null leaves the paragraph's saved (empty) content in place, and
 * the meta row hides an empty item, so a post with nothing to read, or one
 * behind a password, shows no figure rather than a wrong one.
 *
 * @param array    $source_args    Binding arguments (unused).
 * @param WP_Block $block_instance The bound block.
 * @return string|null
 */
function hperkins_tokens_reader_read_time( $source_args, $block_instance ) {
	$post_id = isset( $block_instance->context['postId'] ) ? (int) $block_instance->context['postId'] : 0;
	if ( ! $post_id || post_password_required( $post_id ) ) {
		return null;
	}

	$minutes = hperkins_tokens_reader_minutes( $post_id );
	if ( $minutes < 1 ) {
		return null;
	}

	return sprintf(
		/* translators: %d: estimated reading time in whole minutes. */
		_n( '%d min read', '%d min read', $minutes, 'hperkins-tokens' ),
		$minutes
	);
}

/**
 * Register the read-time bindings source that templates/single.html uses.
 */
function hperkins_tokens_register_reader_bindings() {
	if ( ! function_exists( 'register_block_bindings_source' ) ) {
		return;
	}

	register_block_bindings_source(
		'hperkins-tokens/read-time',
		array(
			'label'              => __( 'Read time', 'hperkins-tokens' ),
			'get_value_callback' => 'hperkins_tokens_reader_read_time',
			'uses_context'       => array( 'postId' ),
		)
	);
}
add_action( 'init', 'hperkins_tokens_register_reader_bindings' );

/**
 * Carry the postcard's compass star into a reader hero with no featured image.
 *
 * Only then: the plate is painted between the dim overlay and the type, the
 * layer verify-typography.js leaves out of its worst-case contrast model. Over
 * the flat twilight ground it composites darker than that model; over a light
 * photograph it would not. The plate is an element rather than a pseudo-element
 * because it needs both a hero-wide mask and its own rotation.
 *
 * @param string $block_content Rendered cover markup.
 * @param array  $block         Parsed block.
 * @return string
 */
function hperkins_tokens_reader_hero_plate( $block_content, $block ) {
	$class_name = isset( $block['attrs']['className'] ) ? (string) $block['attrs']['className'] : '';
	$classes    = preg_split( '/\s+/', trim( $class_name ) );
	if ( ! is_array( $classes ) || ! in_array( 'hp-reader-hero', $classes, true ) ) {
		return $block_content;
	}

	// A featured image covers this layer; core only emits the image element
	// when the post has one.
	if ( false !== strpos( $block_content, 'wp-block-cover__image-background' ) ) {
		return $block_content;
	}

	$plate  = '<span class="hp-reader-hero__plate" aria-hidden="true"><span></span></span>';
	$result = preg_replace(
		'#(<span\b[^>]*\bwp-block-cover__background\b[^>]*>\s*</span>)#',
		'$1' . $plate,
		$block_content,
		1,
		$count
	);

	return ( is_string( $result ) && 1 === $count ) ? $result : $block_content;
}
add_filter( 'render_block_core/cover', 'hperkins_tokens_reader_hero_plate', 10, 2 );

/**
 * Whether this request renders the essay reader.
 *
 * @return bool
 */
function hperkins_tokens_is_reader_request() {
	return ! is_admin() && is_singular( 'post' );
}

/**
 * Reset the per-request reader state: how deep the renderer is inside the post
 * body, and which element ids the page already holds.
 *
 * The seeded ids are the template's own hash targets. #subscribe is the
 * site-wide subscribe anchor, so a heading that happened to read "Subscribe"
 * must not take that id from the plate below the essay.
 *
 * @param string[] $reserved Further ids to treat as taken.
 */
function hperkins_tokens_reader_reset( $reserved = array() ) {
	$GLOBALS['hperkins_tokens_reader'] = array(
		'depth' => 0,
		'ids'   => array_fill_keys( array_merge( array( 'subscribe', 'wp--skip-link--target' ), (array) $reserved ), true ),
	);
}

/**
 * Current reader state, created on first use.
 *
 * @return array{depth:int, ids:array<string,bool>}
 */
function hperkins_tokens_reader_state() {
	if ( ! isset( $GLOBALS['hperkins_tokens_reader'] ) || ! is_array( $GLOBALS['hperkins_tokens_reader'] ) ) {
		hperkins_tokens_reader_reset();
	}

	return $GLOBALS['hperkins_tokens_reader'];
}

/**
 * Claim an id for a section heading, suffixing -2, -3… on a collision.
 *
 * @param string $base Preferred id.
 * @return string The id to use.
 */
function hperkins_tokens_reader_claim_id( $base ) {
	$state = hperkins_tokens_reader_state();
	$base  = '' === $base ? 'section' : $base;
	$id    = $base;

	for ( $n = 2; isset( $state['ids'][ $id ] ); $n++ ) {
		$id = $base . '-' . $n;
	}

	$GLOBALS['hperkins_tokens_reader']['ids'][ $id ] = true;

	return $id;
}

/**
 * Open the post-body bracket when the reader's post-content block starts.
 *
 * Every block inside the body renders between this filter and the matching
 * render_block_core/post-content filter below, so a heading can tell whether
 * it belongs to the essay rather than to the template around it (the related
 * section's "Continue reading", the subscribe plate's title).
 *
 * @param array $parsed_block Parsed block.
 * @return array Unchanged block.
 */
function hperkins_tokens_reader_open_body( $parsed_block ) {
	if (
		! isset( $parsed_block['blockName'] ) ||
		'core/post-content' !== $parsed_block['blockName'] ||
		! hperkins_tokens_is_reader_request()
	) {
		return $parsed_block;
	}

	$state = hperkins_tokens_reader_state();
	if ( 0 === $state['depth'] ) {
		// Author-set anchors anywhere in the body are taken before any heading
		// renders, so a generated id cannot claim one that appears later.
		$post = get_queried_object();
		if ( $post instanceof WP_Post && preg_match_all( '/\sid\s*=\s*(["\'])([^"\']+)\1/i', $post->post_content, $matches ) ) {
			foreach ( $matches[2] as $id ) {
				$GLOBALS['hperkins_tokens_reader']['ids'][ $id ] = true;
			}
		}
	}

	++$GLOBALS['hperkins_tokens_reader']['depth'];

	return $parsed_block;
}
add_filter( 'render_block_data', 'hperkins_tokens_reader_open_body' );

/**
 * Close the post-body bracket and mark an opening dek.
 *
 * @param string $block_content Rendered post content, wrapper included.
 * @return string
 */
function hperkins_tokens_reader_close_body( $block_content ) {
	if ( ! hperkins_tokens_is_reader_request() ) {
		return $block_content;
	}

	$state = hperkins_tokens_reader_state();
	if ( $state['depth'] > 0 ) {
		--$GLOBALS['hperkins_tokens_reader']['depth'];
	}

	return hperkins_tokens_reader_mark_dek( $block_content );
}
add_filter( 'render_block_core/post-content', 'hperkins_tokens_reader_close_body' );

/**
 * Mark a first paragraph that is one italic run and nothing else.
 *
 * An essay that opens on a set-off italic subtitle would otherwise take its
 * three-line drop cap on a one-line dek. The class moves the drop cap to the
 * paragraph after it (assets/imladris-pages.css); a paragraph with any text
 * outside the italic run is ordinary prose and is left alone.
 *
 * @param string $html Rendered post content, starting at its wrapper.
 * @return string
 */
function hperkins_tokens_reader_mark_dek( $html ) {
	if ( ! preg_match( '#^\s*<div\b[^>]*>\s*<p\b[^>]*>\s*<(em|i)\b[^>]*>(?:(?!</?(?:em|i)\b).)*</\1>\s*</p>#is', $html ) ) {
		return $html;
	}

	$tags = new WP_HTML_Tag_Processor( $html );
	if ( $tags->next_tag() && $tags->next_tag( 'P' ) ) {
		$tags->add_class( 'hp-prose__dek' );
		return $tags->get_updated_html();
	}

	return $html;
}

/**
 * Give each level-2 heading in the essay an id and a § link to it.
 *
 * The link is the heading's sibling, not its child, so the heading's
 * accessible name stays its own text. Its label names navigation; reader.js
 * upgrades it to "Copy a link…" only where the browser can actually copy.
 *
 * @param string $block_content Rendered heading.
 * @param array  $block         Parsed block.
 * @return string
 */
function hperkins_tokens_reader_section_mark( $block_content, $block ) {
	$state = hperkins_tokens_reader_state();
	if ( $state['depth'] < 1 ) {
		return $block_content;
	}

	$level = isset( $block['attrs']['level'] ) ? (int) $block['attrs']['level'] : 2;
	if ( 2 !== $level ) {
		return $block_content;
	}

	$tags = new WP_HTML_Tag_Processor( $block_content );
	if ( ! $tags->next_tag( 'H2' ) ) {
		return $block_content;
	}

	$text = html_entity_decode( wp_strip_all_tags( $block_content ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	$text = trim( (string) preg_replace( '/[\s\x{00A0}]+/u', ' ', $text ) );
	if ( '' === $text ) {
		return $block_content;
	}

	// An author's anchor is kept verbatim: someone may already link to it.
	$id = $tags->get_attribute( 'id' );
	if ( ! is_string( $id ) || '' === trim( $id ) ) {
		$id = hperkins_tokens_reader_claim_id( sanitize_title( $text ) );
		$tags->set_attribute( 'id', $id );
	}

	return sprintf(
		'<div class="hp-sec"><a class="hp-sec__link" href="#%1$s" aria-label="%2$s">&sect;</a>%3$s</div>',
		esc_attr( $id ),
		esc_attr(
			sprintf(
				/* translators: %s: the section heading's text. */
				__( 'Link to the section %s', 'hperkins-tokens' ),
				$text
			)
		),
		$tags->get_updated_html()
	);
}
add_filter( 'render_block_core/heading', 'hperkins_tokens_reader_section_mark', 10, 2 );
