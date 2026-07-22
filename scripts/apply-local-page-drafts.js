#!/usr/bin/env node

const { runWpEval } = require( './lib/wp-cli' );

if ( ! process.argv.includes( '--confirm-local' ) ) {
	console.error( 'Refusing to write. Re-run with --confirm-local after checking HPERKINS_WP_PATH.' );
	process.exit( 1 );
}

const result = runWpEval(`
	$host = strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) );
	$local_hosts = array( 'localhost', '127.0.0.1', '::1' );
	$is_local = in_array( $host, $local_hosts, true ) || str_ends_with( $host, '.local' );
	if ( ! $is_local ) {
		throw new RuntimeException( 'Refusing to apply review drafts to non-local host: ' . $host );
	}
	if ( 'hperkins-tokens' !== get_stylesheet() ) {
		throw new RuntimeException( 'Expected hperkins-tokens to be active, got: ' . get_stylesheet() );
	}

	$drafts = array(
		array(
			'path' => 'job-placement-digest',
			'title' => 'Job Placement Digest',
			'file' => 'content/page-drafts/job-placement-digest.html',
		),
		array(
			'path' => 'placement-method-and-evidence',
			'legacy_path' => 'placement-method-evidence',
			'title' => 'Placement Method and Evidence',
			'file' => 'content/page-drafts/placement-method-evidence.html',
		),
	);
	$result = array();

	foreach ( $drafts as $draft ) {
		$file = get_theme_file_path( $draft['file'] );
		$content = file_get_contents( $file );
		if ( false === $content || '' === trim( $content ) ) {
			throw new RuntimeException( 'Missing reviewed draft: ' . $file );
		}

		$page = get_page_by_path( $draft['path'], OBJECT, 'page' );
		if ( ! $page && ! empty( $draft['legacy_path'] ) ) {
			$page = get_page_by_path( $draft['legacy_path'], OBJECT, 'page' );
		}
		$postarr = array(
			'post_type' => 'page',
			'post_status' => 'publish',
			'post_name' => $draft['path'],
			'post_title' => $draft['title'],
			'post_content' => wp_slash( $content ),
		);
		if ( $page ) {
			$postarr['ID'] = $page->ID;
		}

		$post_id = wp_insert_post( $postarr, true );
		if ( is_wp_error( $post_id ) ) {
			throw new RuntimeException( $post_id->get_error_message() );
		}
		$result[ $draft['path'] ] = array(
			'id' => $post_id,
			'url' => get_permalink( $post_id ),
			'bytes' => strlen( $content ),
		);
	}

	echo wp_json_encode( $result );
` );

console.log( result );
