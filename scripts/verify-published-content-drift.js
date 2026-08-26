#!/usr/bin/env node

const fs = require( 'node:fs' );
const path = require( 'node:path' );

const ROOT = path.join( __dirname, '..' );
const CURRENT_RELEASE = 'v0.1.0';
const HISTORICAL_RELEASE = 'v0.1.0-rc.3';
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

// patterns/about-resume.php is a thin adapter over the accepted snapshot and
// carries no page copy of its own; the About claims are asserted against the
// snapshot and the reviewed candidate instead.
const currentReleaseFiles = [
	'inc/council-header.php',
	'patterns/wapuu-home-hero.php',
	'content/page-snapshots/about.html',
	'content/page-drafts/about.html',
	'patterns/work-index.php',
	'content/page-snapshots/work.html',
];

for ( const file of currentReleaseFiles ) {
	const contents = read( file );
	assert( contents.includes( CURRENT_RELEASE ), `${ file } must name ${ CURRENT_RELEASE }.` );
	assert( ! contents.includes( HISTORICAL_RELEASE ), `${ file } still presents ${ HISTORICAL_RELEASE } as current.` );
}

// The proof-first About body (marked by its hp-about-nav landmark) states the
// same facts with its own approved copy; the previous body keeps its original
// exact claims. Either way, retired or inflated claims must stay out.
const aboutFiles = [ 'content/page-snapshots/about.html', 'content/page-drafts/about.html' ];
for ( const file of aboutFiles ) {
	const contents = read( file );
	const redesigned = contents.includes( 'hp-about-nav' );
	assert( ! contents.includes( 'WordPress rebuild' ), `${ file } still calls DJ Lee a WordPress rebuild.` );
	assert(
		contents.includes( redesigned ? 'booking-first client site' : 'booking-first static site' ) &&
			contents.includes( 'one Cloudflare Worker' ),
		`${ file } must describe the shipped DJ Lee architecture.`
	);
	assert( /Python (?:&middot;|·) familiarity/.test( contents ), `${ file } must qualify Python as familiarity.` );
	assert(
		contents.includes( redesigned ? 'PR #757 remains open and unmerged' : 'PR #757 remains open with changes requested' ),
		`${ file } must state PR #757's review status.`
	);
	assert(
		contents.includes( redesigned ? 'in PR #49; it closed without merge on July 18, 2026' : 'PR #49 closed without merge on July 18, 2026' ),
		`${ file } must state PR #49's closed state.`
	);
	assert( ! contents.includes( 'PR #49</a> — in review' ), `${ file } still presents PR #49 as in review.` );
}

const home = read( 'content/page-snapshots/front-page.html' );
assert(
	count( home, '"className":"hp-work__entry is-status-review"' ) === 0,
	'Home block metadata must retain no review-state work entries.'
);
assert(
	count( home, 'class="wp-block-group hp-work__entry is-status-review"' ) === 0,
	'Home rendered markup must retain no review-state work entries.'
);
assert(
	count( home, '"className":"hp-work__entry is-status-merged"' ) === 4,
	'Home block metadata must assign four work entries the resolved state.'
);
assert(
	count( home, 'class="wp-block-group hp-work__entry is-status-merged"' ) === 4,
	'Home rendered markup must assign four work entries the resolved state.'
);

for ( const file of [ 'patterns/ai-enablement.php', 'content/page-snapshots/ai-enablement.html' ] ) {
	const contents = read( file );
	assert( contents.includes( `href="${ DECK_PATH }"` ), `${ file } must link the public deck.` );
	assert( ! contents.includes( '<a href="#">Download deck' ), `${ file } still has a placeholder deck link.` );
}

const demo = read( 'content/page-snapshots/work-flavor-agent-demo.html' );
assert(
	demo.includes( '17 public abilities total' ) &&
		demo.includes( 'The eight <code>recommend-*</code> and seven apply/activity tools — fifteen in all' ) &&
		demo.includes( 'Recorded 22 June 2026' ) &&
		! demo.includes( '16 public abilities' ),
	'The Flavor Agent demo must distinguish its historical recording from the final 17-public / 15-dedicated ability topology.'
);

const digest = read( 'content/page-snapshots/job-placement-digest.html' );
assert(
	digest.includes( 'Flavor Agent v0.1.0' ) &&
		! digest.includes( HISTORICAL_RELEASE ) &&
		! digest.includes( 'Flavor Agent post-RC3 main' ) &&
		! digest.includes( 'Flavor Agent v0.1.0-rc.1 contracts' ),
	'The Job Placement Digest must retain one consolidated final Flavor Agent v0.1.0 evidence row, not a retired RC or post-RC row.'
);

console.log( 'verified published content drift source contract' );
