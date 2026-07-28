#!/usr/bin/env node

const { assertMatchingSiteUrl, getOrigin } = require( './lib/site-url' );
const { runWp, runWpEval } = require( './lib/wp-cli' );
const {
	assertKnownFlags,
	buildApplyLocalDraftsPhp,
	prepareDraftPayloads,
	selectDraftContracts,
} = require( './lib/page-content-contract' );

if ( ! process.argv.includes( '--confirm-local' ) ) {
	console.error( 'Refusing to write. Re-run with --confirm-local after checking HPERKINS_WP_PATH.' );
	process.exit( 1 );
}

try {
	// Selection first: with no --page this is exactly the two recruiter
	// drafts; --page=about is the only way to select the About candidate, and
	// an explicit list never unions with the defaults. Bad keys fail here,
	// before any WP-CLI process starts.
	assertKnownFlags( process.argv.slice( 2 ), [ '--confirm-local' ] );
	const requestedKeys = process.argv
		.filter( ( argument ) => argument === '--page' || argument.startsWith( '--page=' ) )
		.map( ( argument ) => argument.slice( '--page='.length ) );
	const contracts = selectDraftContracts( requestedKeys );

	// Refuse to touch a site other than the one HPERKINS_ORIGIN names — before
	// any draft-file read or database mutation. Combined with the PHP-side
	// local-host guard this keeps the applicator localhost-only by identity,
	// not just by convention.
	assertMatchingSiteUrl( getOrigin(), runWp( [ 'option', 'get', 'home' ] ).trim() );

	// Node preflight: containment, nonempty, SHA-256 for every selected draft.
	// Only the relative paths and hashes travel to WP-CLI; PHP re-reads and
	// re-hashes each file before the first mutation.
	const payloads = prepareDraftPayloads( contracts );
	const result = runWpEval( buildApplyLocalDraftsPhp( payloads ) );

	console.log( result );
} catch ( error ) {
	console.error( error.message );
	process.exit( 1 );
}
