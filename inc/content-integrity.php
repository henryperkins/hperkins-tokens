<?php
/**
 * Public deployment-integrity endpoint for database-owned portfolio pages.
 *
 * The two returned bodies are already public, versioned artifacts. Exposing
 * their raw block markup lets the post-deploy gate compare the canonical
 * WordPress records with their committed mirrors without storing production
 * database credentials in GitHub.
 *
 * @package HPerkins_Tokens
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Normalize a database-owned block body for cross-platform hashing.
 *
 * This mirrors scripts/lib/content-integrity.js: convert CRLF to LF and ignore
 * only final trailing whitespace.
 *
 * @param string $content Raw post content.
 * @return string
 */
function hperkins_tokens_normalize_public_page_body( $content ) {
	return rtrim( str_replace( "\r\n", "\n", $content ) );
}

/**
 * Return the published page bodies that participate in the remote gate.
 *
 * @return array<string, array<string, int|string|bool>>
 */
function hperkins_tokens_get_public_content_integrity_state() {
	$targets = array(
		'job-placement-digest'     => 'job-placement-digest',
		'placement-method-evidence' => 'placement-method-and-evidence',
	);
	$pages   = array();

	foreach ( $targets as $key => $path ) {
		$page    = get_page_by_path( $path, OBJECT, 'page' );
		$content = $page ? hperkins_tokens_normalize_public_page_body( (string) $page->post_content ) : '';

		$pages[ $key ] = array(
			'exists'  => (bool) $page,
			'id'      => $page ? (int) $page->ID : 0,
			'path'    => $path,
			'status'  => $page ? (string) $page->post_status : 'missing',
			'bytes'   => strlen( $content ),
			'sha256'  => hash( 'sha256', $content ),
			'content' => $content,
		);
	}

	return $pages;
}

/**
 * Serve the public deployment-integrity state.
 *
 * @return WP_REST_Response
 */
function hperkins_tokens_rest_content_integrity() {
	$response = rest_ensure_response(
		array(
			'version'      => 1,
			'generated_at' => gmdate( 'c' ),
			'pages'        => hperkins_tokens_get_public_content_integrity_state(),
		)
	);
	$response->header( 'Cache-Control', 'no-store, max-age=0' );

	return $response;
}

/**
 * Register the read-only integrity endpoint.
 */
function hperkins_tokens_register_content_integrity_route() {
	register_rest_route( 'hperkins/v1', '/content-integrity', array(
		'methods'             => WP_REST_Server::READABLE,
		'callback'            => 'hperkins_tokens_rest_content_integrity',
		'permission_callback' => '__return_true',
	) );
}
add_action( 'rest_api_init', 'hperkins_tokens_register_content_integrity_route' );
