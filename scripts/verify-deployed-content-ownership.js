#!/usr/bin/env node

const fs = require( 'node:fs' );
const path = require( 'node:path' );

const { createLineDiff, getSha256, normalizeContent } = require( './lib/content-integrity' );
const { getOrigin, resolveSiteUrl } = require( './lib/site-url' );

const themeRoot = path.join( __dirname, '..' );
const endpointSourcePath = path.join( themeRoot, 'inc', 'content-integrity.php' );
const functionsPath = path.join( themeRoot, 'functions.php' );
const contracts = [
	{
		key: 'job-placement-digest',
		snapshot: 'content/page-snapshots/job-placement-digest.html',
		draft: 'content/page-drafts/job-placement-digest.html',
	},
	{
		key: 'placement-method-evidence',
		snapshot: 'content/page-snapshots/placement-method-evidence.html',
		draft: 'content/page-drafts/placement-method-evidence.html',
	},
];

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function verifySource() {
	assert( fs.existsSync( endpointSourcePath ), 'Expected inc/content-integrity.php.' );
	const endpointSource = fs.readFileSync( endpointSourcePath, 'utf8' );
	const functionsSource = fs.readFileSync( functionsPath, 'utf8' );

	for ( const required of [
		"register_rest_route( 'hperkins/v1', '/content-integrity'",
		"'methods'",
		'WP_REST_Server::READABLE',
		"'permission_callback'",
		"'__return_true'",
		"'job-placement-digest'",
		"'placement-method-evidence'",
		"'publish' !== get_post_status( $page )",
		"hash( 'sha256'",
	] ) {
		assert( endpointSource.includes( required ), `Content-integrity endpoint source is missing: ${ required }` );
	}
	assert(
		functionsSource.includes( "require_once get_stylesheet_directory() . '/inc/content-integrity.php';" ),
		'functions.php must load the content-integrity endpoint.'
	);
	console.log( 'Deployed content-ownership endpoint source verified.' );
}

async function verifyRemote() {
	const compareDrafts = process.argv.includes( '--drafts' );
	const endpointUrl = resolveSiteUrl( getOrigin(), '/wp-json/hperkins/v1/content-integrity' );
	endpointUrl.searchParams.set( 'cache_bust', Date.now().toString() );
	const response = await fetch( endpointUrl, {
		headers: {
			accept: 'application/json',
			'cache-control': 'no-cache',
		},
		signal: AbortSignal.timeout( 20000 ),
	} );
	assert( response.ok, `Content-integrity endpoint returned HTTP ${ response.status }: ${ endpointUrl }` );
	const payload = await response.json();

	for ( const contract of contracts ) {
		const expectedRelativePath = compareDrafts ? contract.draft : contract.snapshot;
		const expectedPath = path.join( themeRoot, expectedRelativePath );
		assert( fs.existsSync( expectedPath ), `Missing ${ expectedRelativePath }.` );
		const expected = normalizeContent( fs.readFileSync( expectedPath, 'utf8' ) );
		const remote = payload.pages?.[ contract.key ];
		assert( remote, `Endpoint did not return ${ contract.key }.` );
		const live = normalizeContent( remote.content || '' );
		const liveHash = getSha256( live );
		const expectedHash = getSha256( expected );

		assert(
			remote.sha256 === liveHash,
			`${ contract.key } endpoint hash ${ remote.sha256 || '<missing>' } does not describe its returned content ${ liveHash }.`
		);
		assert(
			live === expected,
			[
				`${ contract.key } deployed database body does not match ${ expectedRelativePath }.`,
				`live     sha256: ${ liveHash }`,
				`expected sha256: ${ expectedHash }`,
				createLineDiff( live, expected, {
					actualLabel: `${ contract.key } deployed database body`,
					expectedLabel: `${ contract.key } ${ compareDrafts ? 'reviewed draft' : 'committed snapshot' }`,
				} ),
			].join( '\n' )
		);

		console.log( `${ contract.key }: ${ liveHash } (${ Buffer.byteLength( live ) } bytes)` );
	}

	console.log( `Deployed content ownership verified at ${ endpointUrl.origin }.` );
}

async function main() {
	verifySource();
	if ( process.argv.includes( '--source-only' ) ) {
		return;
	}
	await verifyRemote();
}

main().catch( ( error ) => {
	console.error( error.message );
	process.exit( 1 );
} );
