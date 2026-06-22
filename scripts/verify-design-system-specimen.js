#!/usr/bin/env node
/**
 * Regression checks for the DB-backed /design-system/ specimen page.
 *
 * The page should reference the live filesystem patterns for components that
 * are actively maintained in this theme, rather than carrying stale inline
 * copies whose classes can drift away from style.css.
 */
const { execFileSync } = require( 'node:child_process' );

const ORIGIN = process.env.HPERKINS_ORIGIN || 'https://hperkins.blog';
const DESIGN_SYSTEM_URL = new URL( '/design-system/', ORIGIN );
const WP_PATH = '/home/dev/hperkinsblog';

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
	const postContent = execFileSync(
		'wp',
		[
			`--path=${ WP_PATH }`,
			`--url=${ ORIGIN }`,
			'post',
			'get',
			'79',
			'--field=post_content',
		],
		{ encoding: 'utf8' }
	);

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
