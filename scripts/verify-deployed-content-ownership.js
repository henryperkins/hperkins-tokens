#!/usr/bin/env node

const fs = require( 'node:fs' );
const path = require( 'node:path' );

const { createLineDiff, getSha256, normalizeContent } = require( './lib/content-integrity' );
const { getOrigin, resolveSiteUrl } = require( './lib/site-url' );
const { selectDeployedIntegrityContracts } = require( './lib/page-content-contract' );

const themeRoot = path.join( __dirname, '..' );
const endpointSourcePath = path.join( themeRoot, 'inc', 'content-integrity.php' );
const functionsPath = path.join( themeRoot, 'functions.php' );

// Targets derive from the shared deployedIntegrity page metadata — this
// verifier keeps no allowlist of its own. --page=<key> narrows the run with
// the same selector rejection rules as the draft applicator and exporter.
const requestedKeys = process.argv
	.filter( ( argument ) => argument === '--page' || argument.startsWith( '--page=' ) )
	.map( ( argument ) => argument.slice( '--page='.length ) );
const contracts = selectDeployedIntegrityContracts( requestedKeys ).map( ( contract ) => ( {
	key: contract.key,
	pagePath: contract.pagePath,
	snapshot: `content/page-snapshots/${ contract.snapshotFile }`,
	draft: contract.draft ? contract.draft.file : null,
} ) );

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
		"'publish' !== get_post_status( $page )",
		"hash( 'sha256'",
	] ) {
		assert( endpointSource.includes( required ), `Content-integrity endpoint source is missing: ${ required }` );
	}

	// Every deployed-integrity contract must be served by the endpoint with
	// its exact key → path mapping. The endpoint has no other source of truth.
	for ( const contract of selectDeployedIntegrityContracts() ) {
		const mapping = new RegExp( `'${ contract.key }'\\s*=>\\s*'${ contract.pagePath }'` );
		assert(
			mapping.test( endpointSource ),
			`Content-integrity endpoint source is missing the ${ contract.key } => ${ contract.pagePath } target.`
		);
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
		assert( expectedRelativePath, `${ contract.key } has no reviewed draft to compare with --drafts.` );
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
