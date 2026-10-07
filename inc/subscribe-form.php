<?php
/**
 * The newsletter subscribe form's per-request parts.
 *
 * patterns/imladris-subscribe.php prints three things that belong to the
 * request rendering it: the nonce the handler verifies, the
 * `_wp_http_referer` it redirects back to, and the status line for the
 * redirect it answered with. The Site Editor saves a template with its
 * patterns resolved (the REST templates endpoint renders each `wp:pattern`
 * block into markup), so a saved template, or a page that inserted the
 * pattern, keeps all three as the editor's REST request left them: a nonce no
 * visitor can verify, a referer that sends the visitor to a REST URL, and no
 * status line. Production's `home` template did exactly that, and every
 * subscription from /essays/ failed until the copy was reverted on 2026-10-07:
 * docs/verification/2026-10-07-unshipped-refinements-publication.md.
 *
 * A frozen copy is a Custom HTML block, so a render filter on that block
 * re-mints the three parts wherever the form renders from one. The live
 * pattern's markup passes through byte for byte, and the rest of a frozen
 * copy (its wording, ids and classes) stays as it was saved.
 *
 * scripts/lib/subscribe-form.test.js exercises this under a PHP shim, and
 * scripts/verify-subscribe-form.php runs it inside WordPress, freezing a copy
 * through the REST templates endpoint as the Site Editor does.
 *
 * @package HPerkins_Tokens
 */

defined( 'ABSPATH' ) || exit;

/**
 * The status the subscribe handler redirected this request with.
 *
 * The handler answers with a 303 to `?hperkins_subscribe=<status>#subscribe`.
 * A missing or unknown status has no message. The pattern and the filter
 * below both read their line from here, and verify-contact-form-styling.js
 * reads the expected wording from this source.
 *
 * @return array{message: string, role: string} The line's text and ARIA role.
 */
function hperkins_tokens_subscribe_status() {
	$subscribe_status  = isset( $_GET['hperkins_subscribe'] ) ? sanitize_key( wp_unslash( $_GET['hperkins_subscribe'] ) ) : '';
	$subscribe_message = '';
	$subscribe_role    = 'status';

	if ( 'success' === $subscribe_status ) {
		$subscribe_message = 'Request received. I will review the address and add it to the occasional dispatch shortly.';
	} elseif ( 'invalid-email' === $subscribe_status ) {
		$subscribe_message = 'Enter a valid email to join the dispatch.';
		$subscribe_role    = 'alert';
	} elseif ( 'invalid-request' === $subscribe_status ) {
		$subscribe_message = 'Refresh the page and try again so the request can be verified.';
		$subscribe_role    = 'alert';
	} elseif ( 'rate-limited' === $subscribe_status ) {
		$subscribe_message = 'Too many attempts just now. Wait a few minutes and try again.';
		$subscribe_role    = 'alert';
	} elseif ( 'save-error' === $subscribe_status ) {
		$subscribe_message = sprintf(
			'Something went wrong recording the request. Email %s directly and I will add you manually.',
			hperkins_tokens_contact_email()
		);
		$subscribe_role    = 'alert';
	}

	return array(
		'message' => $subscribe_message,
		'role'    => $subscribe_role,
	);
}

/**
 * The status line for this request, or an empty string when there is none.
 *
 * The same paragraph the pattern prints after the form's button.
 *
 * @return string
 */
function hperkins_tokens_subscribe_status_markup() {
	$status = hperkins_tokens_subscribe_status();
	if ( '' === $status['message'] ) {
		return '';
	}

	return sprintf(
		'<p class="hp-subscribe__status" role="%1$s" tabindex="-1">%2$s</p>',
		esc_attr( $status['role'] ),
		esc_html( $status['message'] )
	);
}

/**
 * The nonce and referer the subscribe form carries in this request.
 *
 * Read back out of wp_nonce_field() with the pattern's own arguments, so the
 * values are exactly what the pattern prints: the action and field the
 * handler verifies, and core's referer for this request.
 *
 * @return array<string, string> Input name => value.
 */
function hperkins_tokens_subscribe_fresh_fields() {
	$fields = array();
	$inputs = new WP_HTML_Tag_Processor( wp_nonce_field( 'hperkins_tokens_subscribe', 'hperkins_tokens_subscribe_nonce', true, false ) );
	while ( $inputs->next_tag( 'INPUT' ) ) {
		$name  = $inputs->get_attribute( 'name' );
		$value = $inputs->get_attribute( 'value' );
		if ( is_string( $name ) && is_string( $value ) ) {
			$fields[ $name ] = $value;
		}
	}

	return $fields;
}

/**
 * Re-mint a frozen subscribe form's nonce, referer and status line.
 *
 * Only inputs inside a `.hp-subscribe__form` form are read. A form rendered by
 * the pattern in this request already carries this request's values and is
 * returned untouched. Values that differ mark a frozen copy: they are
 * replaced, and its status line is rebuilt for this request.
 *
 * @param string $block_content Rendered Custom HTML block.
 * @return string
 */
function hperkins_tokens_refresh_subscribe_form( $block_content ) {
	if ( ! is_string( $block_content ) || false === strpos( $block_content, 'hperkins_tokens_subscribe_nonce' ) ) {
		return $block_content;
	}

	$fresh     = hperkins_tokens_subscribe_fresh_fields();
	$tags      = new WP_HTML_Tag_Processor( $block_content );
	$in_form   = false;
	$refreshed = false;

	while ( $tags->next_tag( array( 'tag_closers' => 'visit' ) ) ) {
		if ( 'FORM' === $tags->get_tag() ) {
			$in_form = ! $tags->is_tag_closer() && $tags->has_class( 'hp-subscribe__form' );
			continue;
		}
		if ( ! $in_form || 'INPUT' !== $tags->get_tag() ) {
			continue;
		}

		$name = $tags->get_attribute( 'name' );
		if ( is_string( $name ) && isset( $fresh[ $name ] ) && $fresh[ $name ] !== $tags->get_attribute( 'value' ) ) {
			$tags->set_attribute( 'value', $fresh[ $name ] );
			$refreshed = true;
		}
	}

	if ( ! $refreshed ) {
		return $block_content;
	}

	return hperkins_tokens_subscribe_status_line( $tags->get_updated_html() );
}
add_filter( 'render_block_core/html', 'hperkins_tokens_refresh_subscribe_form' );

/**
 * Give a frozen subscribe form this request's status line.
 *
 * A copy saved from the editor has none, so a visitor coming back from the
 * handler would get no word on what happened. Any line the copy carries is
 * dropped first, so a stale one is never shown, and the current line, if
 * there is one, closes the form as it does in the pattern.
 *
 * @param string $html Custom HTML block with the form's fields re-minted.
 * @return string
 */
function hperkins_tokens_subscribe_status_line( $html ) {
	$stripped = preg_replace( '#\s*<p class="hp-subscribe__status"[^>]*>.*?</p>#s', '', $html );
	if ( is_string( $stripped ) ) {
		$html = $stripped;
	}

	$status = hperkins_tokens_subscribe_status_markup();
	$form   = strpos( $html, 'hp-subscribe__form' );
	$close  = false === $form ? false : stripos( $html, '</form>', $form );
	if ( '' === $status || false === $close ) {
		return $html;
	}

	return substr_replace( $html, $status . "\n\t", $close, 0 );
}
