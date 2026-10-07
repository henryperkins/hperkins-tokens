#!/usr/bin/env node

const crypto = require( 'node:crypto' );

const { escapePhpString, runWpEval } = require( './lib/wp-cli' );
const {
	NAVIGATION_POST_ID,
	normalizeNavigationContent,
} = require( './lib/navigation-content-contract' );

// The states this recut may overwrite. Each is the canonical sha256 of a
// byte-exact backup under content/nav-snapshots/, so every pin names a menu
// that was actually read and kept. Any other state is unverified and refused.
// normalizeNavigationContent() rewrites same-origin URLs to paths, so these
// hashes are home-agnostic and hold whichever site computes them.
//
// 2026-07-20 — PRODUCTION's pre-recut menu, read from https://hperkins.blog
// via the authenticated REST route with context=edit. The previous pin
// (29d2a38e…) was taken against the local Studio site's synthetic menu, which
// never existed on production — so the guard would have refused the real
// recut, correctly.
//
// 2026-08-27 — production after an editor save dropped the trailing Subscribe
// link (post_modified 2026-08-27 10:14:12 GMT; read 2026-10-07 through the
// WordPress.com connector's navigation.get content.raw). It is NEW_CONTENT
// minus that one block, re-serialized with the block editor's blank lines.
// Without the hp-nav-subscribe link the renderer serves its fallback model.
//
// A site already at the target short-circuits before this guard, so pinning a
// state never disturbs a site that is already recut.
const ACCEPTED_BEFORE_STATES = [
	{
		sha256: '19c48c289376456803975a3cf64e831230a90488d11fb31d56ee4deb54f2ca88',
		backup: 'nav-237.production.html',
	},
	{
		sha256: 'f0db939c812fe4bc4d33d55c1cd6c7b8c2e65579d90715b9d7edfd99e3fcea5a',
		backup: 'nav-237.production-2026-08-27.html',
	},
];
const NEW_CONTENT = [
	'<!-- wp:navigation-link {"label":"Work","url":"/work/","kind":"custom","isTopLevelLink":true,"className":"hp-nav-work"} /-->',
	'<!-- wp:navigation-submenu {"label":"Writing","kind":"custom","isTopLevelItem":true,"className":"hp-nav-writing"} -->',
	'<!-- wp:navigation-link {"label":"AI Enablement","url":"/ai-enablement/","kind":"custom","className":"hp-nav-ai"} /-->',
	'<!-- wp:navigation-link {"label":"Essays","url":"/essays/","kind":"custom","className":"hp-nav-essays"} /-->',
	'<!-- wp:navigation-link {"label":"Job Placement Digest","url":"/job-placement-digest/","kind":"custom","className":"hp-nav-digest"} /-->',
	'<!-- /wp:navigation-submenu -->',
	'<!-- wp:navigation-link {"label":"About","url":"/about/","kind":"custom","isTopLevelLink":true} /-->',
	'<!-- wp:search {"label":"Search","showLabel":false,"placeholder":"Search the journal","buttonText":"Search","buttonPosition":"button-inside","buttonUseIcon":true,"className":"hp-drawer-search"} /-->',
	'<!-- wp:navigation-link {"label":"Subscribe","url":"/contact/#subscribe","kind":"custom","isTopLevelLink":true,"className":"hp-nav-subscribe"} /-->',
].join( '' );

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function getSha256( value ) {
	return crypto.createHash( 'sha256' ).update( value ).digest( 'hex' );
}

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

function getCanonicalNavigation( state ) {
	assert( state.id === NAVIGATION_POST_ID, `Expected navigation post ${ NAVIGATION_POST_ID }, got ${ state.id || 'none' }.` );
	assert( state.type === 'wp_navigation', `Expected post ${ NAVIGATION_POST_ID } to be wp_navigation, got ${ state.type || 'none' }.` );
	assert( state.status === 'publish', `Expected navigation post ${ NAVIGATION_POST_ID } to be published, got ${ state.status || 'none' }.` );
	assert( typeof state.home === 'string' && state.home.length > 0, 'Expected WordPress home_url().' );
	return normalizeNavigationContent( state.content, state.home );
}

function buildNavigationUpdatePhp( expectedRawContent ) {
	return (
		'$expected_content = ' + escapePhpString( expectedRawContent ) + ';' +
		'$post = get_post( ' + NAVIGATION_POST_ID + ' );' +
		'$response = array( "id" => 0, "error" => null );' +
		'if ( ! $post || "wp_navigation" !== $post->post_type || "publish" !== $post->post_status ) {' +
			'$response["error"] = "Navigation 237 identity or status changed before update.";' +
		'} elseif ( ! hash_equals( $expected_content, (string) $post->post_content ) ) {' +
			'$response["error"] = "Navigation 237 content changed after the guarded read; refusing update.";' +
		'} else {' +
			'$result = wp_update_post( wp_slash( array(' +
				'"ID" => ' + NAVIGATION_POST_ID + ',' +
				'"post_content" => ' + escapePhpString( NEW_CONTENT ) + ',' +
			') ), true );' +
			'$response = is_wp_error( $result )' +
				'? array( "id" => 0, "error" => $result->get_error_message() )' +
				': array( "id" => (int) $result, "error" => null );' +
		'}' +
		'echo wp_json_encode( $response );'
	);
}

function updateNavigation( expectedRawContent ) {
	const updateResult = JSON.parse(
		runWpEval( buildNavigationUpdatePhp( expectedRawContent ) )
	);

	assert(
		updateResult.id === NAVIGATION_POST_ID,
		`Failed to update navigation post ${ NAVIGATION_POST_ID }: ${ updateResult.error || 'unknown error' }.`
	);
}

function main() {
	const beforeState = getNavigationState();
	const beforeCanonical = getCanonicalNavigation( beforeState );
	const targetCanonical = normalizeNavigationContent( NEW_CONTENT, beforeState.home );
	const targetSha256 = getSha256( targetCanonical );

	if ( beforeCanonical === targetCanonical ) {
		console.log( `navigation ${ NAVIGATION_POST_ID } already current (${ targetSha256 })` );
		return;
	}

	const beforeSha256 = getSha256( beforeCanonical );
	const acceptedState = ACCEPTED_BEFORE_STATES.find( ( state ) => state.sha256 === beforeSha256 );
	assert(
		acceptedState,
		`Refusing to update navigation ${ NAVIGATION_POST_ID }: canonical sha256 ${ beforeSha256 } matches no pinned state (${ ACCEPTED_BEFORE_STATES.map( ( state ) => state.sha256 ).join( ', ' ) }).`
	);

	updateNavigation( beforeState.content );

	const afterState = getNavigationState();
	const afterCanonical = getCanonicalNavigation( afterState );
	assert(
		afterCanonical === targetCanonical,
		`Navigation ${ NAVIGATION_POST_ID } update did not persist exact canonical content: expected ${ targetSha256 }, got ${ getSha256( afterCanonical ) }.`
	);

	console.log( `updated navigation ${ NAVIGATION_POST_ID } from ${ acceptedState.backup } (${ targetSha256 })` );
}

if ( require.main === module ) {
	try {
		main();
	} catch ( error ) {
		console.error( error.message );
		process.exitCode = 1;
	}
}

module.exports = {
	ACCEPTED_BEFORE_STATES,
	buildNavigationUpdatePhp,
	NEW_CONTENT,
	main,
};
