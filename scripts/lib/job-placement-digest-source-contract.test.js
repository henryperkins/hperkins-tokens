#!/usr/bin/env node

const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const test = require( 'node:test' );

const { verifyMain } = require( '../verify-job-placement-digest-source' );
const { parseTopLevelBlocks } = require( './about-page-contract' );
const { readReleaseRecord } = require( './release-record' );

const THEME_ROOT = path.join( __dirname, '..', '..' );
const DIGEST = fs.readFileSync(
	path.join( THEME_ROOT, 'content', 'page-drafts', 'job-placement-digest.html' ),
	'utf8'
).replace( /\r\n/g, '\n' );
const RELEASE_RECORD = readReleaseRecord( THEME_ROOT );
const THEME_VERSION = RELEASE_RECORD.version;
const DEPLOYED_COMMIT = RELEASE_RECORD.deployedCommit;
const CURRENT_PUBLICATION_DATELINE = 'Published 13 Jul 2026 · Last verified 11 Aug 2026';
const STALE_PUBLICATION_DATELINE = 'Published 13 Jul 2026 · Last verified 10 Aug 2026';

function replaceOnce( value, search, replacement ) {
	assert.notEqual( value.indexOf( search ), -1, `Mutation fixture is missing: ${ search }` );
	return value.replace( search, replacement );
}

function hasBlockClass( block, className ) {
	return ( block.attrs.className || '' ).split( /\s+/ ).includes( className );
}

function removeEventBlock( value ) {
	const blocks = parseTopLevelBlocks( value );
	const event = blocks.find( ( block ) => hasBlockClass( block, 'hp-wcus-callout' ) );
	assert( event, 'Fixture must contain the top-level WordCamp block.' );
	return value.slice( 0, event.start ) + value.slice( event.end );
}

function moveEventAfterHero( value ) {
	const blocks = parseTopLevelBlocks( value );
	const event = blocks.find( ( block ) => hasBlockClass( block, 'hp-wcus-callout' ) );
	const hero = blocks.find( ( block ) => hasBlockClass( block, 'hp-digest__hero' ) );
	assert( event && hero && event.end <= hero.start, 'Fixture must put WordCamp before the Digest hero.' );
	return (
		value.slice( 0, event.start ) +
		value.slice( event.end, hero.end ) +
		'\n\n' +
		event.outer +
		value.slice( hero.end )
	);
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

test( 'requires the native labelled WordCamp aside before the first-heading hero', () => {
	const blocks = parseTopLevelBlocks( DIGEST );
	const event = blocks[ 0 ];
	const hero = blocks[ 1 ];
	const why = blocks[ 2 ];

	assert.equal( event.name, 'group' );
	assert.equal( event.attrs.tagName, 'aside' );
	assert.equal( event.attrs.ariaLabel, 'I’ll be at WordCamp US.' );
	assert( hasBlockClass( event, 'hp-wcus-callout' ) );
	assert( hasBlockClass( event, 'hp-wcus-callout--event-first' ) );
	assert( hasBlockClass( hero, 'hp-digest__hero' ) );
	assert.equal( why.attrs.anchor, 'why-support-engineer-now' );
	assert.match( event.outer, /<aside\b[^>]*aria-label="I’ll be at WordCamp US\."[^>]*>/ );
	assert.match( event.outer, /<p class="hp-wcus-callout__title">I’ll be at WordCamp US\.<\/p>/ );
	assert.doesNotMatch( event.outer, /<h[1-6]\b/ );
	assert.doesNotMatch( hero.outer, /hp-wcus-callout/ );
	assert.doesNotThrow( () => verifyMain( DIGEST, THEME_VERSION, DEPLOYED_COMMIT ) );

	const reordered = moveEventAfterHero( DIGEST );
	assert.throws(
		() => verifyMain( reordered, THEME_VERSION, DEPLOYED_COMMIT ),
		/WordCamp aside must be the first top-level block/
	);
} );

test( 'keeps the evergreen Digest structurally valid when the event block is removed', () => {
	const evergreen = removeEventBlock( DIGEST );
	const blocks = parseTopLevelBlocks( evergreen );

	assert( hasBlockClass( blocks[ 0 ], 'hp-digest__hero' ) );
	assert.equal( blocks[ 1 ].attrs.anchor, 'why-support-engineer-now' );
	assert.doesNotMatch( evergreen, /hp-wcus-callout/ );
	assert.doesNotThrow(
		() => verifyMain(
			evergreen,
			THEME_VERSION,
			DEPLOYED_COMMIT,
			{ requireEvent: false }
		)
	);
} );

test( 'groups editorial prose and the final two-part close with native blocks', () => {
	assert.equal(
		[ ...DIGEST.matchAll( /"className":"hp-digest-section__body"/g ) ].length,
		2
	);
	assert.match( DIGEST, /"className":"hp-digest-section hp-support-now hp-digest-editorial-split"/ );
	assert.match( DIGEST, /"className":"hp-digest-section hp-theme-governance hp-digest-editorial-split"/ );
	assert.match( DIGEST, /"className":"hp-digest-closing-zone"/ );
} );

test( 'preserves the approved event action styles and excludes layout reordering', () => {
	const event = parseTopLevelBlocks( DIGEST ).find( ( block ) =>
		hasBlockClass( block, 'hp-wcus-callout--event-first' )
	);
	assert( event, 'Fixture must contain the event-first WordCamp block.' );
	assert.equal(
		[ ...event.outer.matchAll( /<!-- wp:button -->/g ) ].length,
		1
	);
	assert.equal(
		[ ...event.outer.matchAll( /<!-- wp:button \{"className":"is-style-secondary"\} -->/g ) ].length,
		2
	);
	assert.match(
		event.outer,
		/<!-- wp:button -->[\s\S]*?Start a WordCamp conversation[\s\S]*?<!-- \/wp:button -->/
	);

	const pagesCss = fs.readFileSync(
		path.join( THEME_ROOT, 'assets', 'imladris-pages.css' ),
		'utf8'
	);
	for ( const rule of pagesCss.matchAll( /\.hp-(?:wcus-callout|digest)[^{]*\{([^}]*)\}/g ) ) {
		assert.doesNotMatch( rule[ 1 ], /(?:^|;)\s*order\s*:/ );
	}
} );

test( 'requires the Task 10 publication-verification date and rejects the stale date', () => {
	assert(
		DIGEST.includes( CURRENT_PUBLICATION_DATELINE ),
		'The candidate must use the 11 Aug 2026 publication-verification date.'
	);
	const currentDate = DIGEST.replace(
		/Published 13 Jul 2026 · Last verified (?:10|11) Aug 2026/,
		CURRENT_PUBLICATION_DATELINE
	);
	const staleDate = DIGEST.replace(
		/Published 13 Jul 2026 · Last verified (?:10|11) Aug 2026/,
		STALE_PUBLICATION_DATELINE
	);

	assert.doesNotThrow( () => verifyMain( currentDate, THEME_VERSION, DEPLOYED_COMMIT ) );
	assert.throws(
		() => verifyMain( staleDate, THEME_VERSION, DEPLOYED_COMMIT ),
		/publication-verification date/
	);
} );

test( 'rejects the retired standalone investigation route in any link', () => {
	const themeSection = '<!-- wp:group {"tagName":"section","align":"wide","className":"hp-digest-section hp-theme-governance hp-digest-editorial-split"';
	const retiredLink = '<!-- wp:paragraph -->\n<p><a href="/root-cause-investigation/">Open the investigation</a></p>\n<!-- /wp:paragraph -->\n\n';
	const mutant = replaceOnce( DIGEST, themeSection, `${ retiredLink }${ themeSection }` );

	assert.throws(
		() => verifyMain( mutant, THEME_VERSION, DEPLOYED_COMMIT ),
		/retired standalone root-cause route/
	);
} );

test( 'requires attribution-safe security and design feedback wording for PR #749', () => {
	const safeState = 'Security and design feedback · non-formal';
	const safeLinkLabel = 'Read the security and design feedback on PR #749';
	const unsafeState = replaceOnce(
		DIGEST,
		`${ safeState }</td><td><a href="https://github.com/WordPress/ai/pull/749#issuecomment-5010134375">`,
		'Reproduced · integration-tested · technical feedback (non-formal)</td><td><a href="https://github.com/WordPress/ai/pull/749#issuecomment-5010134375">'
	);
	const unsafeLabel = replaceOnce(
		DIGEST,
		safeLinkLabel,
		'Read the integration-test feedback on PR #749'
	);

	assert.doesNotThrow( () => verifyMain( DIGEST, THEME_VERSION, DEPLOYED_COMMIT ) );
	for ( const mutant of [ unsafeState, unsafeLabel ] ) {
		assert.throws(
			() => verifyMain( mutant, THEME_VERSION, DEPLOYED_COMMIT ),
			/evidence register/i
		);
	}
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
