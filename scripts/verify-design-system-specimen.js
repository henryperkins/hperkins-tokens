#!/usr/bin/env node
/**
 * Regression checks for the DB-backed /design-system/ specimen page.
 *
 * The page should reference the live filesystem patterns for components that
 * are actively maintained in this theme, rather than carrying stale inline
 * copies whose classes can drift away from style.css.
 */
const { assertMatchingSiteUrl, getOrigin } = require( './lib/site-url' );
const { runWp } = require( './lib/wp-cli' );

const ORIGIN = getOrigin();
const DESIGN_SYSTEM_URL = new URL( '/design-system/', ORIGIN );

const LEGACY_MARKERS = [
	'hp-operational-story__grid',
	'hp-mini-diagram',
	'hp-operational-story__kicker',
	'hp-operational-story__text',
	'hp-proof-product',
];

const REQUIRED_CONTENT_MARKERS = [
	'wp:pattern {"slug":"hperkins-tokens/proof-product"}',
	'wp:pattern {"slug":"hperkins-tokens/operational-story"}',
];

const REQUIRED_RENDERED_MARKERS = [
	'hp-product-hero',
	'hp-operational-story__header',
	'hp-operational-story__panel-head',
	'hp-operational-story__path',
];

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

async function main() {
	// This verifier reads the DB at HPERKINS_WP_PATH and fetches ORIGIN over
	// HTTP; a mismatched pair silently mixes two different sites' conclusions.
	const wpHomeUrl = runWp( [ `--url=${ ORIGIN }`, 'option', 'get', 'home' ] ).trim();
	assertMatchingSiteUrl( ORIGIN, wpHomeUrl );

	const postContent = runWp( [
		`--url=${ ORIGIN }`,
		'post',
		'get',
		'79',
		'--field=post_content',
	] );

	for ( const marker of LEGACY_MARKERS ) {
		assert(
			! postContent.includes( marker ),
			`design-system post content still contains legacy marker "${ marker }".`
		);
	}

	for ( const marker of REQUIRED_CONTENT_MARKERS ) {
		assert(
			postContent.includes( marker ),
			`design-system post content is missing pattern reference "${ marker }".`
		);
	}

	// The specimen page is an internal reference and may deliberately sit in
	// draft. The DB-content checks above always run; the rendered-page checks
	// only make sense once the page is published.
	const postStatus = runWp(
		[ `--url=${ ORIGIN }`, 'post', 'get', '79', '--field=post_status' ]
	).trim();
	if ( 'publish' !== postStatus ) {
		console.log( `checked design-system specimen post content; post 79 is "${ postStatus }" — rendered-page checks skipped until it is published` );
		return;
	}

	const response = await fetch( DESIGN_SYSTEM_URL );
	assert( response.ok, `/design-system/ returned HTTP ${ response.status }.` );

	const html = await response.text();
	for ( const marker of LEGACY_MARKERS ) {
		assert(
			! html.includes( marker ),
			`/design-system/ still renders legacy marker "${ marker }".`
		);
	}

	for ( const marker of REQUIRED_RENDERED_MARKERS ) {
		assert(
			html.includes( marker ),
			`/design-system/ is missing current rendered marker "${ marker }".`
		);
	}

	console.log( 'checked design-system specimen pattern fidelity' );
}

main().catch( ( error ) => {
	console.error( error.message );
	process.exit( 1 );
} );
