#!/usr/bin/env node

const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const test = require( 'node:test' );

const { verifyMain } = require( '../verify-job-placement-digest-source' );

const THEME_ROOT = path.join( __dirname, '..', '..' );
const DIGEST = fs.readFileSync(
	path.join( THEME_ROOT, 'content', 'page-drafts', 'job-placement-digest.html' ),
	'utf8'
).replace( /\r\n/g, '\n' );
const THEME_VERSION = '0.3.53';
const DEPLOYED_COMMIT = '43d9ef603a6715b23af0b4fdce6076010e4b824a';

function replaceOnce( value, search, replacement ) {
	assert.notEqual( value.indexOf( search ), -1, `Mutation fixture is missing: ${ search }` );
	return value.replace( search, replacement );
}

test( 'serializes the debugging proof as editable native blocks', () => {
	assert.doesNotMatch(
		DIGEST,
		/<!--\s+wp:html\s*-->/,
		'The candidate must not depend on a Studio-policy-incompatible Custom HTML block.'
	);
	assert.match(
		DIGEST,
		/<!-- wp:group \{[^\n]*"className":"hp-debug-proof__grid"/,
		'The proof grid must be a native Group block.'
	);
	assert.equal(
		[ ...DIGEST.matchAll( /<!-- wp:group \{[^\n]*"className":"hp-debug-proof__item"/g ) ].length,
		4,
		'The proof grid must expose four editable native Group items.'
	);
} );

test( 'rejects an interposed sibling between the WCUS panel and Support Engineer section', () => {
	const whyBlock = '<!-- wp:group {"tagName":"section","align":"wide","className":"hp-digest-section hp-support-now","layout":{"type":"constrained"},"anchor":"why-support-engineer-now"} -->';
	const interposed = '<!-- wp:group {"tagName":"section"} -->\n<section class="wp-block-group"><!-- wp:paragraph -->\n<p>Interposed sibling.</p>\n<!-- /wp:paragraph --></section>\n<!-- /wp:group -->\n\n';
	const mutant = replaceOnce( DIGEST, whyBlock, `${ interposed }${ whyBlock }` );

	assert.throws(
		() => verifyMain( mutant, THEME_VERSION, DEPLOYED_COMMIT ),
		/WCUS panel must be the immediate HTML sibling before Why Support Engineer now/
	);
} );

test( 'rejects the retired standalone investigation route in any link', () => {
	const themeSection = '<!-- wp:group {"tagName":"section","align":"wide","className":"hp-digest-section hp-theme-governance"';
	const retiredLink = '<!-- wp:paragraph -->\n<p><a href="/root-cause-investigation/">Open the investigation</a></p>\n<!-- /wp:paragraph -->\n\n';
	const mutant = replaceOnce( DIGEST, themeSection, `${ retiredLink }${ themeSection }` );

	assert.throws(
		() => verifyMain( mutant, THEME_VERSION, DEPLOYED_COMMIT ),
		/retired standalone root-cause route/
	);
} );

test( 'rejects evidence context moved to the wrong artifact row', () => {
	const phrases = [
		'finite-vector validation and regression coverage',
		'model-aware sampling compatibility and tests',
		'governed apply/undo, schema hardening, and canonical target authorization',
	];
	const mutants = [
		[ phrases[ 0 ], phrases[ 1 ] ],
		[ phrases[ 1 ], phrases[ 2 ] ],
		[ phrases[ 2 ], phrases[ 0 ] ],
	].map( ( [ first, second ] ) => {
		const placeholder = '__EVIDENCE_CONTEXT_SWAP__';
		return replaceOnce(
			replaceOnce( replaceOnce( DIGEST, first, placeholder ), second, first ),
			placeholder,
			second
		);
	} );

	for ( const mutant of mutants ) {
		assert.throws(
			() => verifyMain( mutant, THEME_VERSION, DEPLOYED_COMMIT ),
			/Evidence context for .* is missing required copy/
		);
	}
} );
