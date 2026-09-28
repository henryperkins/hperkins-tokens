<?php
/**
 * Retire the method route only after the consolidated body is published.
 */
function hperkins_tokens_placement_redirect_target(): string {
	if ( is_admin() || wp_doing_ajax() ) {
		return '';
	}

	$method = isset( $_SERVER['REQUEST_METHOD'] )
		? strtoupper( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) )
		: 'GET';
	if ( ! in_array( $method, array( 'GET', 'HEAD' ), true ) ) {
		return '';
	}

	$request_uri  = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '';
	$request_path = wp_parse_url( $request_uri, PHP_URL_PATH );
	if ( ! is_string( $request_path ) ) {
		return '';
	}
	$matched = false;
	foreach ( array( '/placement-method-and-evidence/', '/placement-method-evidence/' ) as $route ) {
		$route_path = wp_parse_url( home_url( $route ), PHP_URL_PATH );
		if ( is_string( $route_path ) && untrailingslashit( $request_path ) === untrailingslashit( $route_path ) ) {
			$matched = true;
			break;
		}
	}
	if ( ! $matched ) {
		return '';
	}

	$page = get_page_by_path( 'job-placement-digest' );
	if ( ! $page || 'publish' !== $page->post_status ||
		! preg_match( '/<div\b[^>]*\sclass=(["\'])(?:[^"\']*\s)?hp-placement-brief(?:\s[^"\']*)?\1/i', $page->post_content ) ) {
		return '';
	}

	// No fragment: the browser carries an old section fragment to this URL.
	return home_url( '/job-placement-digest/' );
}

function hperkins_tokens_redirect_placement_method(): void {
	$target = hperkins_tokens_placement_redirect_target();
	if ( $target && wp_safe_redirect( $target, 301, 'hperkins-tokens' ) ) {
		exit;
	}
}

add_action( 'template_redirect', 'hperkins_tokens_redirect_placement_method', 1 );
