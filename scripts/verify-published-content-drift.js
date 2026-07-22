#!/usr/bin/env node

const fs = require( 'node:fs' );
const path = require( 'node:path' );

const ROOT = path.join( __dirname, '..' );
const CURRENT_RELEASE = 'v0.1.0-rc.3';
const HISTORICAL_RELEASE = 'v0.1.0-rc.1';
const DECK_PATH = '/wp-content/uploads/2026/06/ExposeGovernAttest.pptx';

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function read( file ) {
	return fs.readFileSync( path.join( ROOT, file ), 'utf8' ).replace( /\r\n/g, '\n' );
}

function count( value, needle ) {
	return value.split( needle ).length - 1;
}

const currentReleaseFiles = [
	'inc/council-header.php',
	'patterns/wapuu-home-hero.php',
	'patterns/about-resume.php',
	'content/page-snapshots/about.html',
	'patterns/work-index.php',
	'content/page-snapshots/work.html',
];

for ( const file of currentReleaseFiles ) {
	const contents = read( file );
	assert( contents.includes( CURRENT_RELEASE ), `${ file } must name ${ CURRENT_RELEASE }.` );
	assert( ! contents.includes( HISTORICAL_RELEASE ), `${ file } still presents ${ HISTORICAL_RELEASE } as current.` );
}

const aboutFiles = [ 'patterns/about-resume.php', 'content/page-snapshots/about.html' ];
for ( const file of aboutFiles ) {
	const contents = read( file );
	assert( ! contents.includes( 'WordPress rebuild' ), `${ file } still calls DJ Lee a WordPress rebuild.` );
	assert(
		contents.includes( 'booking-first static site' ) && contents.includes( 'one Cloudflare Worker' ),
		`${ file } must describe the shipped DJ Lee architecture.`
	);
	assert( /Python (?:&middot;|·) familiarity/.test( contents ), `${ file } must qualify Python as familiarity.` );
	assert( contents.includes( 'PR #757 remains open with changes requested' ), `${ file } must state PR #757's review status.` );
	assert( contents.includes( 'PR #49 closed without merge on July 18, 2026' ), `${ file } must state PR #49's closed state.` );
	assert( ! contents.includes( 'PR #49</a> — in review' ), `${ file } still presents PR #49 as in review.` );
}

const home = read( 'content/page-snapshots/front-page.html' );
assert(
	count( home, '"className":"hp-work__entry is-status-review"' ) === 1,
	'Home block metadata must retain exactly one review-state work entry.'
);
assert(
	count( home, 'class="wp-block-group hp-work__entry is-status-review"' ) === 1,
	'Home rendered markup must retain exactly one review-state work entry.'
);
assert(
	count( home, '"className":"hp-work__entry is-status-merged"' ) === 3,
	'Home block metadata must assign three work entries the resolved state.'
);
assert(
	count( home, 'class="wp-block-group hp-work__entry is-status-merged"' ) === 3,
	'Home rendered markup must assign three work entries the resolved state.'
);

for ( const file of [ 'patterns/ai-enablement.php', 'content/page-snapshots/ai-enablement.html' ] ) {
	const contents = read( file );
	assert( contents.includes( `href="${ DECK_PATH }"` ), `${ file } must link the public deck.` );
	assert( ! contents.includes( '<a href="#">Download deck' ), `${ file } still has a placeholder deck link.` );
}

const digest = read( 'content/page-snapshots/job-placement-digest.html' );
assert(
	digest.includes( 'Flavor Agent v0.1.0-rc.1 contracts' ),
	'The Job Placement Digest must retain the pinned RC1 contracts evidence row.'
);

console.log( 'verified published content drift source contract' );
