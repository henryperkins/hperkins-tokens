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

const HERO_CLOSE = '\n</section>\n<!-- /wp:group -->\n\n';
const WCUS_BLOCK_START = '<!-- wp:group {"tagName":"section","align":"wide","className":"hp-wcus-callout hp-action-panel","layout":{"type":"constrained"}} -->';
const WHY_BLOCK_START = '<!-- wp:group {"tagName":"section","align":"wide","className":"hp-digest-section hp-support-now","layout":{"type":"constrained"},"anchor":"why-support-engineer-now"} -->';

function containWcusPanel( value ) {
	const siblingBoundary = `${ HERO_CLOSE }${ WCUS_BLOCK_START }`;
	if ( ! value.includes( siblingBoundary ) ) {
		return value;
	}

	const wcusStart = value.indexOf( WCUS_BLOCK_START );
	const whyStart = value.indexOf( WHY_BLOCK_START );
	assert( whyStart > wcusStart, 'Fixture must place Why Support Engineer after the WCUS panel.' );
	const wcusBlock = value.slice( wcusStart, whyStart ).trimEnd();
	const withoutWcus = `${ value.slice( 0, wcusStart ) }${ value.slice( whyStart ) }`;
	const heroClose = withoutWcus.indexOf( HERO_CLOSE );
	assert.notEqual( heroClose, -1, 'Fixture must contain the Digest hero closer.' );

	return `${ withoutWcus.slice( 0, heroClose ) }\n\n${ wcusBlock }${ withoutWcus.slice( heroClose ) }`;
}

function moveWcusPanelOutsideHero( value ) {
	const wcusStart = value.indexOf( WCUS_BLOCK_START );
	const whyStart = value.indexOf( WHY_BLOCK_START );
	assert( whyStart > wcusStart, 'Fixture must place Why Support Engineer after the WCUS panel.' );
	const heroClose = value.lastIndexOf( HERO_CLOSE, whyStart );
	assert( heroClose > wcusStart, 'Fixture must contain the WCUS panel before the Digest hero closer.' );
	const wcusBlock = value.slice( wcusStart, heroClose ).trim();
	const withoutWcus = `${ value.slice( 0, wcusStart ) }${ value.slice( heroClose ) }`;
	const nextHeroClose = withoutWcus.indexOf( HERO_CLOSE );
	assert.notEqual( nextHeroClose, -1, 'Fixture must retain the Digest hero closer.' );
	const afterHero = nextHeroClose + HERO_CLOSE.length;

	return `${ withoutWcus.slice( 0, afterHero ) }${ wcusBlock }\n\n${ withoutWcus.slice( afterHero ) }`;
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

test( 'requires the WCUS panel and recruiter actions inside the Digest hero', () => {
	const contained = containWcusPanel( DIGEST );
	const outsideHero = moveWcusPanelOutsideHero( contained );
	assert.notEqual( outsideHero, contained, 'Containment mutation must move the WCUS panel.' );

	assert.doesNotThrow( () => verifyMain( contained, THEME_VERSION, DEPLOYED_COMMIT ) );
	assert.throws(
		() => verifyMain( outsideHero, THEME_VERSION, DEPLOYED_COMMIT ),
		/WCUS panel and its recruiter actions must be contained by the Digest hero/
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
