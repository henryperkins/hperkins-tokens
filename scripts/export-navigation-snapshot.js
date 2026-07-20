#!/usr/bin/env node

const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { runWpEval } = require( './lib/wp-cli' );
const {
	NAVIGATION_POST_ID,
	NAVIGATION_SNAPSHOT_PATH,
	normalizeNavigationContent,
} = require( './lib/navigation-content-contract' );

function getNavigationState() {
	return JSON.parse(
		runWpEval(
			'$post = get_post( ' + NAVIGATION_POST_ID + ' );' +
			'echo wp_json_encode( array(' +
				'"id" => $post ? (int) $post->ID : 0,' +
				'"type" => $post ? $post->post_type : null,' +
				'"status" => $post ? $post->post_status : null,' +
				'"content" => $post ? (string) $post->post_content : "",' +
				'"home" => home_url(),' +
			') );'
		)
	);
}

function main() {
	const state = getNavigationState();
	if ( state.id !== NAVIGATION_POST_ID || state.type !== 'wp_navigation' ) {
		throw new Error( 'Expected wp_navigation post 237.' );
	}
	fs.mkdirSync( path.dirname( NAVIGATION_SNAPSHOT_PATH ), { recursive: true } );
	const canonical = normalizeNavigationContent( state.content, state.home );
	fs.writeFileSync( NAVIGATION_SNAPSHOT_PATH, canonical + '\n', 'utf8' );
	console.log(
		'wrote ' + path.relative( process.cwd(), NAVIGATION_SNAPSHOT_PATH ) +
		' (' + state.id + ', ' + state.status + ')'
	);
}

try {
	main();
} catch ( error ) {
	console.error( error.message );
	process.exit( 1 );
}
