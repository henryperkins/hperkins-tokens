#!/usr/bin/env node

const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const test = require( 'node:test' );

const { verifyMain, visibleWordCount } = require( '../verify-job-placement-digest-source' );
const { parseTopLevelBlocks } = require( './about-page-contract' );

const THEME_ROOT = path.join( __dirname, '..', '..' );
const DIGEST = fs.readFileSync(
	path.join( THEME_ROOT, 'content', 'page-drafts', 'job-placement-digest.html' ),
	'utf8'
).replace( /\r\n/g, '\n' );
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
	return value.slice( 0, event.start ) + value.slice( event.end, hero.end ) + '\n\n' + event.outer + value.slice( hero.end );
}

test( 'keeps the recruiter brief between 250 and 425 visible words with at most eight links', () => {
	const words = visibleWordCount( DIGEST );
	const links = [ ...DIGEST.matchAll( /<a\b[^>]*href=/g ) ].length;

	assert( words >= 250, `The recruiter brief contains only ${ words } visible words; expected a substantive brief.` );
	assert( words <= 425, `The recruiter brief contains ${ words } visible words; expected at most 425.` );
	assert.equal( links, 8, 'The recruiter brief must expose exactly eight decision-ready links.' );
	assert.doesNotThrow( () => verifyMain( DIGEST ) );
} );

test( 'reduces the page to event, hero, one support brief, and one closing invitation', () => {
	const blocks = parseTopLevelBlocks( DIGEST );

	assert.equal( blocks.length, 4 );
	assert( hasBlockClass( blocks[ 0 ], 'hp-wcus-callout' ) );
	assert( hasBlockClass( blocks[ 1 ], 'hp-digest__hero' ) );
	assert.equal( blocks[ 2 ].attrs.anchor, 'support-brief' );
	assert( hasBlockClass( blocks[ 2 ], 'hp-digest-brief' ) );
	assert( hasBlockClass( blocks[ 3 ], 'hp-digest-cta' ) );
	assert( hasBlockClass( blocks[ 3 ], 'hp-action-panel' ) );
	assert( hasBlockClass( blocks[ 3 ], 'is-closing' ) );
	assert.doesNotMatch( DIGEST, /<(?:table|figure)\b/i );
	assert.doesNotMatch(
		DIGEST,
		/hp-(?:fit-table|incident-card|evidence-ledger|theme-governance|method-link|digest-closing-zone)/
	);
} );

test( 'keeps the native labelled WordCamp aside before the first-heading hero', () => {
	const blocks = parseTopLevelBlocks( DIGEST );
	const event = blocks[ 0 ];
	const hero = blocks[ 1 ];
	const brief = blocks[ 2 ];

	assert.equal( event.name, 'group' );
	assert.equal( event.attrs.tagName, 'aside' );
	assert.equal( event.attrs.ariaLabel, 'I’ll be at WordCamp US.' );
	assert( hasBlockClass( event, 'hp-wcus-callout--event-first' ) );
	assert( hasBlockClass( hero, 'hp-digest__hero' ) );
	assert.equal( brief.attrs.anchor, 'support-brief' );
	assert.match( event.outer, /<aside\b[^>]*aria-label="I’ll be at WordCamp US\."[^>]*>/ );
	assert.doesNotMatch( event.outer, /<h[1-6]\b/ );
	assert.doesNotMatch( hero.outer, /hp-wcus-callout/ );

	assert.throws(
		() => verifyMain( moveEventAfterHero( DIGEST ) ),
		/WordCamp aside must be the first top-level block/
	);
} );

test( 'keeps the evergreen brief valid when the event block is removed', () => {
	const evergreen = removeEventBlock( DIGEST );
	const blocks = parseTopLevelBlocks( evergreen );

	assert.equal( blocks.length, 3 );
	assert( hasBlockClass( blocks[ 0 ], 'hp-digest__hero' ) );
	assert.equal( blocks[ 1 ].attrs.anchor, 'support-brief' );
	assert( hasBlockClass( blocks[ 2 ], 'hp-digest-cta' ) );
	assert.doesNotMatch( evergreen, /hp-wcus-callout/ );
	assert.doesNotThrow( () => verifyMain( evergreen, undefined, undefined, { requireEvent: false } ) );
} );

test( 'uses native columns and two three-item lists for fit and selected proof', () => {
	assert.equal( [ ...DIGEST.matchAll( /<!-- wp:column\b/g ) ].length, 2 );
	assert.equal( [ ...DIGEST.matchAll( /<!-- wp:list \{"className":"hp-digest-brief__(?:list|proofs)"\} -->/g ) ].length, 2 );
	assert.equal( [ ...DIGEST.matchAll( /<!-- wp:list-item -->/g ) ].length, 6 );
	assert.equal( [ ...DIGEST.matchAll( /<ul\b[^>]*\bhp-digest-brief__(?:list|proofs)\b/g ) ].length, 2 );
	assert.match( DIGEST, /WordPress\/ai PR #501<\/a>: documentation I authored, refined through review, and merged upstream\./ );
	assert.match( DIGEST, /WordPress\/ai issue #732<\/a>:[^<]*another contributor’s proposed fix\./ );
} );

test( 'preserves the event action hierarchy without CSS reordering', () => {
	const event = parseTopLevelBlocks( DIGEST )[ 0 ];
	assert.equal( [ ...event.outer.matchAll( /<!-- wp:button -->/g ) ].length, 1 );
	assert.equal( [ ...event.outer.matchAll( /<!-- wp:button \{"className":"is-style-secondary"\} -->/g ) ].length, 2 );
	assert.match( event.outer, /Start a WordCamp conversation[\s\S]*View one-page résumé[\s\S]*Review selected work/ );

	const pagesCss = fs.readFileSync( path.join( THEME_ROOT, 'assets', 'imladris-pages.css' ), 'utf8' );
	for ( const rule of pagesCss.matchAll( /\.hp-(?:wcus-callout|digest)[^{]*\{([^}]*)\}/g ) ) {
		assert.doesNotMatch( rule[ 1 ], /(?:^|;)\s*order\s*:/ );
	}
} );

test( 'requires the current publication-verification date', () => {
	assert( DIGEST.includes( CURRENT_PUBLICATION_DATELINE ) );
	const staleDate = replaceOnce( DIGEST, CURRENT_PUBLICATION_DATELINE, STALE_PUBLICATION_DATELINE );

	assert.doesNotThrow( () => verifyMain( DIGEST ) );
	assert.throws( () => verifyMain( staleDate ), /missing required brief copy: Published/ );
} );

test( 'rejects the retired investigation route and any ninth link', () => {
	const closingMarker = '<!-- wp:group {"tagName":"section","align":"wide","className":"hp-digest-section hp-action-panel is-closing hp-digest-cta"';
	const retiredLink = '<!-- wp:paragraph -->\n<p><a href="/root-cause-investigation/">Open the investigation</a></p>\n<!-- /wp:paragraph -->\n\n';
	const mutant = replaceOnce( DIGEST, closingMarker, `${ retiredLink }${ closingMarker }` );

	assert.throws(
		() => verifyMain( mutant ),
		/eight decision-ready links|retired standalone root-cause route|removed long-form structure/
	);
} );

test( 'requires attribution-safe wording for the open request-log fix', () => {
	const mutant = replaceOnce(
		DIGEST,
		'another contributor’s proposed fix',
		'my proposed fix'
	);

	assert.throws( () => verifyMain( mutant ), /attribution-safe context/ );
} );

test( 'rejects reintroduced long-form sections and copy', () => {
	const marker = '<section class="wp-block-group alignwide hp-digest-section hp-digest-brief"';
	const mutant = replaceOnce(
		DIGEST,
		marker,
		'<section class="wp-block-group alignwide hp-digest-section hp-evidence-ledger" data-retired="true"></section>\n' + marker
	);

	assert.throws( () => verifyMain( mutant ), /removed long-form structure: hp-evidence-ledger/ );
} );

test( 'rejects copy growth beyond the recruiter-brief budget', () => {
	const repeated = Array.from( { length: 150 }, () => 'redundant' ).join( ' ' );
	const marker = '<!-- wp:group {"tagName":"section","align":"wide","className":"hp-digest-section hp-action-panel is-closing hp-digest-cta"';
	const mutant = replaceOnce(
		DIGEST,
		marker,
		`<!-- wp:paragraph -->\n<p>${ repeated }</p>\n<!-- /wp:paragraph -->\n\n${ marker }`
	);

	assert.throws( () => verifyMain( mutant ), /visible words; the recruiter brief budget is 425/ );
} );
