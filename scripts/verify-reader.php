<?php
/**
 * Essay reader server contract (inc/reader.php + templates/single.html).
 *
 * Run with WP-CLI eval-file against the explicitly selected local install:
 *
 *     wp --path=<local WordPress root> eval-file scripts/verify-reader.php
 *
 * It renders the real single.html around an in-memory post that is never
 * saved — cached so get_post() resolves it — so the image-less hero, the dek,
 * colliding and reserved section ids and the read time are all exercised
 * without a database write, and without depending on what the site happens to
 * have published. The related loop still reads the real posts.
 */

$checks = 0;
$verify_reader = static function ( $condition, $message ) use ( &$checks ) {
	++$checks;
	if ( ! $condition ) {
		throw new RuntimeException( $message );
	}
};

foreach ( array( 'hperkins_tokens_reader_word_count', 'hperkins_tokens_reader_section_mark', 'hperkins_tokens_reader_hero_plate', 'hperkins_tokens_reader_mark_dek' ) as $function ) {
	$verify_reader( function_exists( $function ), "{$function}() is not loaded; is hperkins-tokens the active theme?" );
}
$verify_reader(
	function_exists( 'get_block_bindings_source' ) && null !== get_block_bindings_source( 'hperkins-tokens/read-time' ),
	'The hperkins-tokens/read-time block-bindings source is not registered.'
);

// --- Word count -------------------------------------------------------------
// Whitespace-split text, as the design project measured it: block delimiters,
// tags, script bodies and shortcodes do not count; entities are decoded first.
$verify_reader(
	4 === hperkins_tokens_reader_word_count( "<!-- wp:paragraph -->\n<p>One&nbsp;two &amp; three</p>\n<!-- /wp:paragraph -->" ),
	'Word count must decode entities (&nbsp; separates, &amp; is a token) and ignore block delimiters.'
);
$verify_reader(
	2 === hperkins_tokens_reader_word_count( '<p>Two words</p><script>var ignored = "four more words";</script>[gallery ids="1,2"]' ),
	'Word count must drop script bodies and registered shortcodes.'
);
$verify_reader( 0 === hperkins_tokens_reader_word_count( "<!-- wp:separator -->\n<hr/>\n<!-- /wp:separator -->" ), 'A body with no words counts none.' );

// Minutes are round(words / 230), at least 1, and 0 only for an empty body.
// 1.5 minutes is the rounding edge: 344 words read as 1, 345 as 2.
$minutes_for = static function ( $words, $id ) {
	$post = new WP_Post(
		(object) array(
			'ID'           => $id,
			'post_type'    => 'post',
			'post_status'  => 'publish',
			'post_content' => trim( str_repeat( 'word ', $words ) ),
			'filter'       => 'raw',
		)
	);
	wp_cache_set( $id, $post, 'posts' );
	return hperkins_tokens_reader_minutes( $id );
};
$verify_reader( 1 === $minutes_for( 344, 987654330 ), '344 words must read as 1 minute.' );
$verify_reader( 2 === $minutes_for( 345, 987654331 ), '345 words must read as 2 minutes.' );
$verify_reader( 1 === $minutes_for( 12, 987654332 ), 'A short post still reads as 1 minute.' );
$verify_reader( 0 === $minutes_for( 0, 987654333 ), 'An empty post has no read time.' );

// --- A rendered reader around an unsaved post -------------------------------
$template = file_get_contents( get_stylesheet_directory() . '/templates/single.html' );
$verify_reader( is_string( $template ), 'templates/single.html is unreadable.' );
// The header and footer parts are not under test and are costly to render.
$template = preg_replace( '#<!--\s*wp:template-part\s*\{[^}]*\}\s*/-->#', '', $template );

$filler  = trim( str_repeat( 'ledger ', 600 ) );
$opening = 'Every page on this site makes the same promise and keeps it.';
$closing = 'The cheapest bug to fix is the one that never ships.';

/**
 * Block markup for one level-2 heading, optionally with an author's anchor.
 */
$heading = static function ( $text, $anchor = '' ) {
	$id = '' === $anchor ? '' : ' id="' . $anchor . '"';
	return "<!-- wp:heading -->\n<h2 class=\"wp-block-heading\"{$id}>{$text}</h2>\n<!-- /wp:heading -->";
};
$paragraph = static function ( $html, $class = '' ) {
	$attrs = '' === $class ? '' : ' {"className":"' . $class . '"}';
	$class = '' === $class ? '' : ' class="' . $class . '"';
	return "<!-- wp:paragraph{$attrs} -->\n<p{$class}>{$html}</p>\n<!-- /wp:paragraph -->";
};

$body_blocks = array(
	$paragraph( $opening ),
	$heading( 'Run it locally first' ),
	$paragraph( $filler ),
	$heading( 'Run it locally first' ),
	$heading( 'Subscribe' ),
	$heading( 'Gate' ),
	$heading( 'Gate the publish', 'gate' ),
	$heading( 'Proof &amp; &quot;provenance&quot;' ),
	"<!-- wp:heading {\"level\":3} -->\n<h3 class=\"wp-block-heading\">A level-three heading</h3>\n<!-- /wp:heading -->",
	"<!-- wp:group -->\n<div class=\"wp-block-group\">" . $heading( 'Nested inside a group' ) . "</div>\n<!-- /wp:group -->",
	$paragraph( $closing ),
);
$body = implode( "\n\n", $body_blocks );

// Counted independently of the implementation: the words the fixture was
// built from, single-spaced. "Proof & "provenance"" is three tokens and
// "level-three" is one.
$visible_words = str_word_count( $opening ) + 600 + str_word_count( $closing )
	+ 4 + 4 + 1 + 1 + 3 + 3 + 3 + 4;
$expected_read = sprintf( '%d min read', max( 1, (int) round( $visible_words / HPERKINS_TOKENS_READ_WORDS_PER_MINUTE ) ) );

/**
 * Render single.html around an unsaved post, the way get_the_block_template_html()
 * does for a singular route: inside the main loop, one iteration.
 */
$render_reader = static function ( $content, $thumbnail_id = 0 ) use ( $template ) {
	$post = new WP_Post(
		(object) array(
			'ID'             => 987654321,
			'post_author'    => 1,
			'post_date'      => '2026-06-21 12:00:00',
			'post_date_gmt'  => '2026-06-21 17:00:00',
			'post_content'   => $content,
			'post_title'     => 'Verify before you ship',
			'post_excerpt'   => 'A hand-written standfirst.',
			'post_status'    => 'publish',
			'comment_status' => 'closed',
			'ping_status'    => 'closed',
			'post_name'      => 'verify-before-you-ship',
			'post_type'      => 'post',
			'filter'         => 'raw',
		)
	);
	wp_cache_set( $post->ID, $post, 'posts' );
	wp_cache_set( $post->ID, $thumbnail_id ? array( '_thumbnail_id' => array( (string) $thumbnail_id ) ) : array(), 'post_meta' );

	$query = new WP_Query();
	// Fills the query vars and sets is_single/is_singular the way a real
	// singular request does; nothing is queried.
	$query->parse_query( array( 'p' => $post->ID ) );
	// the_post() primes caches from two vars only get_posts() would set; the
	// fixture's caches are already primed by hand above.
	$query->query_vars['update_post_term_cache'] = false;
	$query->query_vars['update_post_meta_cache'] = false;
	$query->queried_object    = $post;
	$query->queried_object_id = $post->ID;
	$query->posts             = array( $post );
	$query->post_count        = 1;
	$GLOBALS['wp_query']      = $query;
	$GLOBALS['wp_the_query']  = $query;

	hperkins_tokens_reader_reset();
	$html = '';
	while ( have_posts() ) {
		the_post();
		$html = do_blocks( $template );
	}
	wp_reset_postdata();

	return $html;
};

$html = $render_reader( $body );

// A2 — the skip link targets <main>, so the hero and its H1 must be inside it,
// ahead of the back link.
$main_at  = strpos( $html, '<main' );
$hero_at  = strpos( $html, 'hp-reader-hero' );
$h1_at    = strpos( $html, '<h1' );
$back_at  = strpos( $html, 'hp-reader__back' );
$main_end = strpos( $html, '</main>' );
$verify_reader( false !== $main_at && false !== $main_end, 'The rendered reader has no <main>.' );
$verify_reader( $main_at < $hero_at && $hero_at < $main_end, 'The reader hero must render inside <main>, the skip link\'s target.' );
$verify_reader( $main_at < $h1_at && $h1_at < $back_at, 'The H1 must come before "All essays" inside <main>.' );

// B3 — the read time is measured, not typed.
$verify_reader(
	1 === preg_match( '#<p class="hp-reader-hero__readtime[^"]*">([^<]*)</p>#', $html, $read ) && $expected_read === $read[1],
	sprintf( 'Read time must be "%s" for %d words; got %s.', $expected_read, $visible_words, isset( $read[1] ) ? '"' . $read[1] . '"' : 'no read-time paragraph' )
);

// B4 — every level-2 heading in the body, and only those, gets an id and a §
// link to it; collisions with each other, with the template's #subscribe and
// with an author's anchor further down are all suffixed.
preg_match_all( '#<div class="hp-sec"><a class="hp-sec__link" href="\#([^"]+)" aria-label="([^"]*)">&sect;</a>\s*<h2\b([^>]*)>#', $html, $sections, PREG_SET_ORDER );
$expected_ids = array( 'run-it-locally-first', 'run-it-locally-first-2', 'subscribe-2', 'gate-2', 'gate', 'proof-provenance', 'nested-inside-a-group' );
$found_ids    = array_map(
	static function ( $section ) {
		return $section[1];
	},
	$sections
);
$verify_reader( $expected_ids === $found_ids, 'Section ids must be ' . implode( ', ', $expected_ids ) . '; got ' . implode( ', ', $found_ids ) . '.' );
foreach ( $sections as $section ) {
	$verify_reader(
		false !== strpos( $section[3], 'id="' . $section[1] . '"' ),
		"The § link #{$section[1]} must point at its own heading's id."
	);
}
$verify_reader(
	'Link to the section Proof &amp; &quot;provenance&quot;' === $sections[5][2],
	'A section label must carry the heading text, escaped once: got ' . $sections[5][2] . '.'
);
$verify_reader( 1 === substr_count( $html, 'id="subscribe"' ), 'The subscribe plate must keep the only #subscribe.' );
$verify_reader( false !== strpos( $html, '<h3 class="wp-block-heading">A level-three heading</h3>' ), 'Only level-2 headings take a § mark.' );
$verify_reader( 1 === preg_match( '#<h2 class="wp-block-heading hp-related__title">#', $html ), 'The template\'s "Continue reading" heading is not part of the essay.' );
$verify_reader( false === strpos( $html, '<div class="hp-sec"><a class="hp-sec__link" href="#hp-subscribe' ), 'The subscribe plate\'s heading is not part of the essay.' );

// B1 — the compass plate, only when there is no featured image, directly
// after the dim overlay.
$verify_reader(
	1 === preg_match( '#<span aria-hidden="true" class="wp-block-cover__background[^"]*"></span><span class="hp-reader-hero__plate" aria-hidden="true"><span></span></span>#', $html ),
	'An image-less reader hero must carry the plate directly after its dim overlay.'
);
$verify_reader( false === strpos( $html, 'wp-block-cover__image-background' ), 'The image-less fixture must render no cover image.' );

// B2 — an ordinary first paragraph is not a dek.
$verify_reader( false === strpos( $html, 'hp-prose__dek' ), 'An ordinary opening paragraph must not be marked as a dek.' );

// With a featured image: no plate.
$attachment = get_posts(
	array(
		'post_type'      => 'attachment',
		'post_mime_type' => 'image',
		'post_status'    => 'inherit',
		'posts_per_page' => 1,
		'fields'         => 'ids',
	)
);
if ( $attachment ) {
	$with_image = $render_reader( $body, (int) $attachment[0] );
	$verify_reader( false !== strpos( $with_image, 'wp-block-cover__image-background' ), 'The featured-image fixture must render its cover image.' );
	$verify_reader( false === strpos( $with_image, 'hp-reader-hero__plate' ), 'A hero with a featured image must not carry the plate.' );
} else {
	echo "note: no image attachment on this site, so the with-image plate check was skipped.\n";
}

// B2 — a wholly italic opening paragraph is a dek; the drop cap moves past it.
$with_dek = $render_reader( $paragraph( '<em>Binding governance to the artifact a reader can verify</em>' ) . "\n\n" . $body );
$verify_reader( 1 === preg_match( '#<p class="[^"]*\bhp-prose__dek\b[^"]*"><em>Binding#', $with_dek ), 'A wholly italic opening paragraph must be marked hp-prose__dek.' );
$verify_reader( 1 === substr_count( $with_dek, 'hp-prose__dek' ), 'Only the opening paragraph may be marked as a dek.' );
$not_dek = $render_reader( $paragraph( 'We have grown wary of the word <em>permanent</em>.' ) . "\n\n" . $body );
$verify_reader( false === strpos( $not_dek, 'hp-prose__dek' ), 'Text outside the italic run makes an ordinary paragraph, not a dek.' );
$verify_reader(
	hperkins_tokens_reader_mark_dek( '<div class="hp-prose"><p><em>One</em> and <em>two</em></p></div>' ) === '<div class="hp-prose"><p><em>One</em> and <em>two</em></p></div>',
	'Two italic runs with text between them are not a dek.'
);

// A password keeps the length of a protected body to itself.
$protected = new WP_Post(
	(object) array(
		'ID'            => 987654322,
		'post_type'     => 'post',
		'post_status'   => 'publish',
		'post_password' => 'secret',
		'post_content'  => $filler,
		'filter'        => 'raw',
	)
);
wp_cache_set( $protected->ID, $protected, 'posts' );
$bound = new WP_Block( array( 'blockName' => 'core/paragraph', 'attrs' => array(), 'innerBlocks' => array(), 'innerHTML' => '', 'innerContent' => array() ), array( 'postId' => $protected->ID ) );
$verify_reader( null === hperkins_tokens_reader_read_time( array(), $bound ), 'A password-protected post must not reveal its read time.' );

// Outside the reader nothing is touched: the filters key off the post-body
// bracket, which only a singular post opens.
$GLOBALS['wp_query'] = new WP_Query();
hperkins_tokens_reader_reset();
$plain = "\n<h2 class=\"wp-block-heading\">Anywhere else</h2>\n";
$verify_reader(
	$plain === hperkins_tokens_reader_section_mark( $plain, array( 'blockName' => 'core/heading', 'attrs' => array() ) ),
	'A heading outside the reader\'s post body must render unchanged.'
);
$other_cover = '<div class="wp-block-cover"><span aria-hidden="true" class="wp-block-cover__background"></span></div>';
$verify_reader(
	$other_cover === hperkins_tokens_reader_hero_plate( $other_cover, array( 'blockName' => 'core/cover', 'attrs' => array( 'className' => 'hp-page-hero' ) ) ),
	'Only the reader hero takes the plate.'
);

echo "Essay reader behavior: {$checks} checks passed.\n";
