<?php
/**
 * Subscribe form refresh contract (inc/subscribe-form.php) inside WordPress.
 *
 * Run with WP-CLI eval-file against the explicitly selected local install:
 *
 *     wp --path=<local WordPress root> eval-file scripts/verify-subscribe-form.php
 *
 * It freezes the subscribe form the way the Site Editor does: an administrator
 * reads the theme's `home` template through the REST templates endpoint,
 * which resolves its `wp:pattern` blocks into rendered markup. That frozen
 * Custom HTML block is then rendered for a logged-out visitor, without the
 * refresh (reproducing the 2026-10-07 production failure) and with it. Nothing
 * is written: no template is saved and no subscription is posted.
 *
 * The script plays several requests in one process. The pattern registry
 * renders a pattern once and keeps that markup for the rest of the request,
 * so the freeze runs before anything else touches the registry, and every
 * other render includes the pattern file afresh, as a new request would.
 */

$checks = 0;
$verify_subscribe = static function ( $condition, $message ) use ( &$checks ) {
	++$checks;
	if ( ! $condition ) {
		throw new RuntimeException( $message );
	}
};

foreach ( array( 'hperkins_tokens_subscribe_status', 'hperkins_tokens_subscribe_status_markup', 'hperkins_tokens_subscribe_fresh_fields', 'hperkins_tokens_refresh_subscribe_form' ) as $function ) {
	$verify_subscribe( function_exists( $function ), "{$function}() is not loaded; is hperkins-tokens the active theme?" );
}
$verify_subscribe(
	10 === has_filter( 'render_block_core/html', 'hperkins_tokens_refresh_subscribe_form' ),
	'The refresh must be hooked to render_block_core/html at priority 10.'
);

// The form's request fields, read with the real Tag Processor.
$form_fields = static function ( $html ) {
	$fields = array();
	$tags   = new WP_HTML_Tag_Processor( $html );
	while ( $tags->next_tag( 'INPUT' ) ) {
		$name = $tags->get_attribute( 'name' );
		if ( is_string( $name ) ) {
			$fields[ $name ] = $tags->get_attribute( 'value' );
		}
	}
	return $fields;
};
// The same markup with both request fields blanked, to compare what remains.
$without_fields = static function ( $html ) {
	$tags = new WP_HTML_Tag_Processor( $html );
	while ( $tags->next_tag( 'INPUT' ) ) {
		if ( in_array( $tags->get_attribute( 'name' ), array( 'hperkins_tokens_subscribe_nonce', '_wp_http_referer' ), true ) ) {
			$tags->set_attribute( 'value', '' );
		}
	}
	return $tags->get_updated_html();
};
$status_lines = static function ( $html ) {
	preg_match_all( '#<p class="hp-subscribe__status"[^>]*>.*?</p>#s', $html, $matches );
	return $matches[0];
};
$render_pattern = static function () {
	ob_start();
	include get_theme_file_path( 'patterns/imladris-subscribe.php' );
	return ob_get_clean();
};
$visitor_referer = '/essays/?utm_source=dispatch&v=0b3b97fa6688';
$visit = static function ( $status = '' ) use ( $visitor_referer ) {
	wp_set_current_user( 0 );
	$_SERVER['REQUEST_URI'] = $visitor_referer;
	$_GET                   = '' === $status ? array() : array( 'hperkins_subscribe' => $status );
};

// --- Freezing a copy as the Site Editor does ---------------------------------
$admins = get_users(
	array(
		'role'   => 'administrator',
		'number' => 1,
		'fields' => 'ID',
	)
);
$verify_subscribe( ! empty( $admins ), 'The local install needs an administrator to read templates in edit context.' );
wp_set_current_user( (int) $admins[0] );
$_SERVER['REQUEST_URI'] = '/wp-json/wp/v2/templates/lookup?slug=home&_locale=user';
$_GET                   = array();
$template_request       = new WP_REST_Request( 'GET', '/wp/v2/templates/' . get_stylesheet() . '//home' );
$template_request->set_param( 'context', 'edit' );
$template = rest_get_server()->response_to_data( rest_do_request( $template_request ), false );
$raw      = $template['content']['raw'] ?? '';
$verify_subscribe(
	false !== strpos( $raw, 'hperkins_tokens_subscribe_nonce' ),
	'The REST templates endpoint no longer resolves the subscribe pattern in edit context; the freeze this guards against may be gone, so revisit inc/subscribe-form.php.'
);

$find_frozen = static function ( $blocks ) use ( &$find_frozen ) {
	foreach ( $blocks as $block ) {
		if ( 'core/html' === $block['blockName'] && false !== strpos( $block['innerHTML'], 'hperkins_tokens_subscribe_nonce' ) ) {
			return $block;
		}
		$inner = $find_frozen( $block['innerBlocks'] );
		if ( $inner ) {
			return $inner;
		}
	}
	return null;
};
$frozen = $find_frozen( parse_blocks( $raw ) );
$verify_subscribe( null !== $frozen, 'The frozen home template must hold the subscribe form as a Custom HTML block.' );
$verify_subscribe(
	'hperkins-tokens/imladris-subscribe' === ( $frozen['attrs']['metadata']['patternName'] ?? '' ),
	'The frozen block should record the pattern it came from, as production\'s copy did.'
);

// --- The live pattern --------------------------------------------------------
$visit();
$live_markup = $render_pattern();
$live_fields = $form_fields( do_blocks( $live_markup ) );
$verify_subscribe(
	1 === wp_verify_nonce( $live_fields['hperkins_tokens_subscribe_nonce'] ?? '', 'hperkins_tokens_subscribe' ),
	'The live pattern must carry a nonce a logged-out visitor can verify.'
);
$verify_subscribe(
	$visitor_referer === ( $live_fields['_wp_http_referer'] ?? null ),
	'The live pattern must refer back to the page it rendered on.'
);

$pattern   = parse_blocks( $live_markup );
$live_html = $pattern[0]['innerHTML'] ?? '';
$verify_subscribe( 'core/html' === ( $pattern[0]['blockName'] ?? '' ), 'The subscribe pattern must still be a single Custom HTML block.' );
$verify_subscribe(
	$live_html === hperkins_tokens_refresh_subscribe_form( $live_html ),
	'A form rendered in this request must pass through the refresh byte for byte.'
);

// --- A visitor meets the frozen copy -------------------------------------------
remove_filter( 'render_block_core/html', 'hperkins_tokens_refresh_subscribe_form' );
$unrefreshed = $form_fields( render_block( $frozen ) );
add_filter( 'render_block_core/html', 'hperkins_tokens_refresh_subscribe_form' );
$verify_subscribe(
	false === wp_verify_nonce( $unrefreshed['hperkins_tokens_subscribe_nonce'] ?? '', 'hperkins_tokens_subscribe' ),
	'Without the refresh a frozen nonce must fail for a visitor; otherwise this check no longer reproduces the failure.'
);
$verify_subscribe(
	0 === strpos( (string) ( $unrefreshed['_wp_http_referer'] ?? '' ), '/wp-json/' ),
	'Without the refresh a frozen copy must still refer to the editor\'s REST request.'
);

$refreshed        = render_block( $frozen );
$refreshed_fields = $form_fields( $refreshed );
$verify_subscribe(
	1 === wp_verify_nonce( $refreshed_fields['hperkins_tokens_subscribe_nonce'] ?? '', 'hperkins_tokens_subscribe' ),
	'A refreshed frozen copy must carry a nonce the visitor can verify.'
);
$verify_subscribe(
	$visitor_referer === ( $refreshed_fields['_wp_http_referer'] ?? null ),
	'A refreshed frozen copy must refer back to the visitor\'s page, not to a REST URL.'
);
$verify_subscribe( array() === $status_lines( $refreshed ), 'With no redirect status a refreshed copy shows no status line.' );
$verify_subscribe(
	$without_fields( $frozen['innerHTML'] ) === $without_fields( $refreshed ),
	'Only the two field values may change in a refreshed copy.'
);

// The status line the handler's redirect asks for, worded as the pattern words it.
foreach ( array( 'success', 'invalid-email', 'invalid-request', 'rate-limited', 'save-error' ) as $status ) {
	$visit( $status );
	$expected    = hperkins_tokens_subscribe_status_markup();
	$from_frozen = $status_lines( render_block( $frozen ) );
	$from_live   = $status_lines( do_blocks( $render_pattern() ) );
	$verify_subscribe( '' !== $expected, "The {$status} status must have a line." );
	$verify_subscribe( array( $expected ) === $from_frozen, "A frozen copy must show exactly the {$status} line." );
	$verify_subscribe( array( $expected ) === $from_live, "The live pattern must print the same {$status} line as the helper." );
}

// --- Everything else stays as it was ----------------------------------------
$visit();
$other = parse_blocks( '<!-- wp:html --><form class="hp-other-form" method="post"><input type="hidden" name="_wp_http_referer" value="/other/" /></form><!-- /wp:html -->' )[0];
$verify_subscribe( $other['innerHTML'] === render_block( $other ), 'A Custom HTML block without the subscribe form must render unchanged.' );

echo "Subscribe form refresh: {$checks} checks passed.\n";
