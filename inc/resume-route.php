<?php
/**
 * Stable semantic route for the current one-page résumé artifact.
 */

function hperkins_tokens_is_one_page_resume_request(): bool {
	if ( is_admin() || wp_doing_ajax() ) {
		return false;
	}

	$method = isset( $_SERVER['REQUEST_METHOD'] )
		? strtoupper( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) )
		: 'GET';
	if ( ! in_array( $method, array( 'GET', 'HEAD' ), true ) ) {
		return false;
	}

	$request_uri  = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '';
	$request_path = wp_parse_url( $request_uri, PHP_URL_PATH );
	$route_path   = wp_parse_url( home_url( '/one-page-resume/' ), PHP_URL_PATH );

	return is_string( $request_path )
		&& is_string( $route_path )
		&& untrailingslashit( $request_path ) === untrailingslashit( $route_path );
}

function hperkins_tokens_redirect_one_page_resume(): void {
	if ( ! hperkins_tokens_is_one_page_resume_request() ) {
		return;
	}

	$target = hperkins_tokens_asset_url(
		'assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf'
	);
	if ( wp_safe_redirect( $target, 302, 'hperkins-tokens' ) ) {
		exit;
	}
}

add_action( 'template_redirect', 'hperkins_tokens_redirect_one_page_resume', 1 );
