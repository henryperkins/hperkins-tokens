#!/usr/bin/env node
/**
 * Verifies page identity and Work-ledger parity.
 *
 * Two failure modes reached production in July 2026 and neither was reachable by
 * the existing verifiers:
 *
 *  1. Five duplicate published-page groups, one of which (AI Governance, posts 12
 *     and 443) shared a parent, a slug and a permalink. A "-2" suffix heuristic
 *     finds four of five and misses the one that is silently unreachable, so the
 *     checks below compare resolved permalinks and (parent, slug) tuples instead.
 *  2. patterns/work-index.php drifted from content/page-snapshots/work.html for
 *     seventeen days — different heading levels, labels and version strings —
 *     while verify-content-ownership.js stayed green, because that script never
 *     opens patterns/*.php.
 *
 * Database access goes through runWpEval rather than `wp db query`: the local
 * Studio clone runs on SQLite, where the db command dies on an undefined DB_HOST.
 *
 * Usage: node scripts/verify-no-duplicate-pages.js
 */

const fs = require( 'fs' );
const path = require( 'path' );

const { runWpEval } = require( './lib/wp-cli' );
const {
	SNAPSHOT_DIR,
	THEME_PATH,
	normalizeContent,
} = require( './lib/page-content-contract' );

const PATTERN_FILE = path.join( THEME_PATH, 'patterns', 'work-index.php' );
const WORK_SNAPSHOT = path.join( SNAPSHOT_DIR, 'work.html' );
const FRONT_PAGE_SNAPSHOT = path.join( SNAPSHOT_DIR, 'front-page.html' );

const NUMBER_WORDS = {
	one: 1,
	two: 2,
	three: 3,
	four: 4,
	five: 5,
	six: 6,
	seven: 7,
	eight: 8,
	nine: 9,
	ten: 10,
};

/**
 * Which entry labels each summary chip speaks for.
 *
 * The mapping is editorial, so it is declared rather than inferred: "Shipped" and
 * "Delivered" are both public builds, "Merged" is an upstream contribution, and
 * "Release candidate" is the one open item. Every entry label must be claimed by
 * exactly one chip, and a chip that states a count must state the right one --
 * that is what stops "shipped: three live" surviving a fourth entry.
 */
const CHIP_EXPECTATIONS = [
	{ prefix: 'shipped:', labels: [ 'Shipped', 'Delivered' ] },
	{ prefix: 'merged:', labels: [ 'Merged' ] },
	{ prefix: 'open:', labels: [ 'Release candidate' ] },
];

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function readFile( filePath, label ) {
	assert( fs.existsSync( filePath ), `Expected the ${ label } at "${ filePath }".` );
	return normalizeContent( fs.readFileSync( filePath, 'utf8' ) );
}

function getPublishedPages() {
	const php = `
			$result = array( 'pages' => array() );

			foreach ( get_posts( array(
				'post_type' => 'page',
				'post_status' => 'publish',
				'posts_per_page' => -1,
				'orderby' => 'ID',
				'order' => 'ASC',
			) ) as $page ) {
				$result['pages'][] = array(
					'id' => (int) $page->ID,
					'title' => $page->post_title,
					'slug' => $page->post_name,
					'parent' => (int) $page->post_parent,
					'permalink' => get_permalink( $page->ID ),
				);
			}

			echo wp_json_encode( $result );
		`;

	return JSON.parse( runWpEval( php ) ).pages;
}

function groupBy( items, keyOf ) {
	const groups = new Map();

	for ( const item of items ) {
		const key = keyOf( item );
		groups.set( key, [ ...( groups.get( key ) || [] ), item ] );
	}

	return groups;
}

function describeGroup( pages ) {
	return pages.map( ( page ) => `#${ page.id }` ).join( ', ' );
}

function verifyNoDuplicates( pages, label, keyOf ) {
	const duplicates = [ ...groupBy( pages, keyOf ).entries() ].filter(
		( [ , group ] ) => group.length > 1
	);

	assert(
		duplicates.length === 0,
		`Found ${ duplicates.length } published ${ label } collision(s): ` +
			duplicates
				.map( ( [ key, group ] ) => `"${ key }" held by ${ describeGroup( group ) }` )
				.join( '; ' ) +
			'. Retire the duplicate, or give it its own slug.'
	);
}

function splitWorkEntries( html ) {
	return html
		.split( /(?=<div class="wp-block-group hp-work__entry)/ )
		.filter( ( part ) => part.startsWith( '<div class="wp-block-group hp-work__entry' ) );
}

function getEntryTitle( entry ) {
	const match = entry.match(
		/<h([1-6]) class="wp-block-heading hp-work__title"><a href="([^"]*)"[^>]*>(.*?)<\/a>/
	);

	if ( ! match ) {
		return null;
	}

	return { level: Number( match[ 1 ] ), href: match[ 2 ], text: match[ 3 ] };
}

function getEntryLabel( entry ) {
	const match = entry.match( /<p class="hp-work__label[^"]*">([^<]*)<\/p>/ );
	return match ? match[ 1 ].trim() : null;
}

function getArtifactLinks( entry ) {
	return [ ...entry.matchAll( /<p class="hp-artifact__link[^"]*"><a href="([^"]*)"/g ) ].map(
		( match ) => match[ 1 ]
	);
}

function getChips( html ) {
	return [ ...html.matchAll( /<p class="hp-chip ([^"]*)"[^>]*>([^<]*)<\/p>/g ) ].map(
		( match ) => ( { classes: match[ 1 ], text: match[ 2 ].trim() } )
	);
}

function verifyWorkLedger( snapshot ) {
	const entries = splitWorkEntries( snapshot );

	assert(
		entries.length > 0,
		'The tracked Work snapshot contains no hp-work__entry blocks. Re-export it with scripts/export-page-snapshots.js.'
	);

	for ( const entry of entries ) {
		const title = getEntryTitle( entry );
		assert( title, 'A Work entry in the tracked snapshot has no hp-work__title heading.' );

		// The page's own H1 is the page title, so entries must sit at H2. An entry
		// at H3 reintroduces the H1 -> H3 skip that shipped on /work/ in July 2026.
		assert(
			title.level === 2,
			`Work entry "${ title.text }" is an H${ title.level } in the tracked snapshot; entry titles must be H2 so /work/ has no heading-level skip.`
		);

		const real = getArtifactLinks( entry ).filter( ( href ) => href && href !== '#' );
		assert(
			real.length > 0,
			`Work entry "${ title.text }" carries no artifact link with a real href. /work/ opens by promising "a release, a diff, a live surface you can open yourself" -- every entry has to keep that promise.`
		);
	}

	return entries;
}

function verifyChipCounts( snapshot, entries ) {
	const chips = getChips( snapshot );
	const labels = entries.map( ( entry ) => getEntryLabel( entry ) ).filter( Boolean );

	assert(
		labels.length === entries.length,
		`Only ${ labels.length } of ${ entries.length } Work entries carry an hp-work__label.`
	);

	const claimed = new Set();

	for ( const expectation of CHIP_EXPECTATIONS ) {
		const chip = chips.find( ( candidate ) => candidate.text.startsWith( expectation.prefix ) );
		assert(
			chip,
			`The Work summary has no chip starting "${ expectation.prefix }". Chips present: ${ chips
				.map( ( candidate ) => `"${ candidate.text }"` )
				.join( ', ' ) || 'none' }.`
		);

		const expected = labels.filter( ( label ) => expectation.labels.includes( label ) ).length;
		expectation.labels.forEach( ( label ) => claimed.add( label ) );

		const stated = chip.text
			.split( /\W+/ )
			.map( ( word ) => NUMBER_WORDS[ word.toLowerCase() ] )
			.find( ( value ) => value !== undefined );

		if ( stated !== undefined ) {
			assert(
				stated === expected,
				`Chip "${ chip.text }" states ${ stated } but ${ expected } entr${
					expected === 1 ? 'y' : 'ies'
				} carry the label(s) ${ expectation.labels.join( '/' ) }.`
			);
		}
	}

	const unclaimed = [ ...new Set( labels ) ].filter( ( label ) => ! claimed.has( label ) );
	assert(
		unclaimed.length === 0,
		`Work entry label(s) ${ unclaimed
			.map( ( label ) => `"${ label }"` )
			.join( ', ' ) } are not represented by any summary chip. Add a chip or extend CHIP_EXPECTATIONS in this script.`
	);
}

function verifyHomepageParity( workEntries, frontPageSnapshot ) {
	const workHrefs = workEntries
		.map( ( entry ) => getEntryTitle( entry ) )
		.filter( Boolean )
		.map( ( title ) => title.href )
		.sort();

	const homeHrefs = splitWorkEntries( frontPageSnapshot )
		.map( ( entry ) => getEntryTitle( entry ) )
		.filter( Boolean )
		.map( ( title ) => title.href )
		.sort();

	assert(
		homeHrefs.length > 0,
		'The tracked front-page snapshot contains no Work entries to compare against.'
	);

	const missingFromHome = workHrefs.filter( ( href ) => ! homeHrefs.includes( href ) );
	const missingFromWork = homeHrefs.filter( ( href ) => ! workHrefs.includes( href ) );

	assert(
		missingFromHome.length === 0 && missingFromWork.length === 0,
		'The homepage and /work/ list different projects. ' +
			`Absent from the homepage: ${ missingFromHome.join( ', ' ) || 'none' }. ` +
			`Absent from /work/: ${ missingFromWork.join( ', ' ) || 'none' }. ` +
			'A visitor who follows "See the full Work index" must not find less work than they came from.'
	);
}

function verifyPatternMatchesSnapshot( snapshot ) {
	const raw = readFile( PATTERN_FILE, 'work-index pattern' );
	const headerEnd = raw.indexOf( '?>' );

	assert(
		headerEnd !== -1,
		'patterns/work-index.php has no PHP header block to strip before comparison.'
	);

	const body = normalizeContent( raw.slice( headerEnd + 2 ).replace( /^\n/, '' ) );

	// Report the structural divergence first: the byte comparison below is the
	// backstop, but "H3 not H2" is a far more useful failure than "differs".
	const patternEntries = splitWorkEntries( body );
	const snapshotEntries = splitWorkEntries( snapshot );

	assert(
		patternEntries.length === snapshotEntries.length,
		`patterns/work-index.php has ${ patternEntries.length } Work entries but content/page-snapshots/work.html has ${ snapshotEntries.length }.`
	);

	patternEntries.forEach( ( entry, index ) => {
		const patternTitle = getEntryTitle( entry );
		const snapshotTitle = getEntryTitle( snapshotEntries[ index ] );

		assert(
			patternTitle && snapshotTitle,
			`Work entry ${ index + 1 } is missing a title in the pattern or the snapshot.`
		);
		assert(
			patternTitle.level === snapshotTitle.level,
			`Work entry ${ index + 1 } is an H${ patternTitle.level } in patterns/work-index.php but an H${ snapshotTitle.level } in content/page-snapshots/work.html.`
		);
		assert(
			patternTitle.href === snapshotTitle.href,
			`Work entry ${ index + 1 } links to "${ patternTitle.href }" in the pattern but "${ snapshotTitle.href }" in the snapshot.`
		);
		assert(
			getArtifactLinks( entry ).length === getArtifactLinks( snapshotEntries[ index ] ).length,
			`Work entry "${ patternTitle.text }" has a different artifact-link count in the pattern than in the snapshot.`
		);
	} );

	assert(
		body === snapshot,
		'patterns/work-index.php no longer matches content/page-snapshots/work.html byte for byte. The pattern is the seed copy of the DB-owned page; re-sync it from the snapshot.'
	);
}

function main() {
	const pages = getPublishedPages();

	assert( pages.length > 0, 'No published pages returned from the database.' );

	verifyNoDuplicates( pages, 'permalink', ( page ) => page.permalink );
	verifyNoDuplicates( pages, '(parent, slug)', ( page ) => `${ page.parent }|${ page.slug }` );
	verifyNoDuplicates( pages, 'title', ( page ) => page.title );

	const workSnapshot = readFile( WORK_SNAPSHOT, 'Work snapshot' );
	const frontPageSnapshot = readFile( FRONT_PAGE_SNAPSHOT, 'front-page snapshot' );

	const workEntries = verifyWorkLedger( workSnapshot );
	verifyChipCounts( workSnapshot, workEntries );
	verifyHomepageParity( workEntries, frontPageSnapshot );
	verifyPatternMatchesSnapshot( workSnapshot );

	console.log( 'Page identity verified.' );
	console.log( `published pages: ${ pages.length }` );
	console.log( `work entries: ${ workEntries.length }` );
	console.log(
		`artifact links: ${ workEntries.reduce(
			( total, entry ) => total + getArtifactLinks( entry ).length,
			0
		) }`
	);
}

try {
	main();
} catch ( error ) {
	console.error( error.message );
	process.exit( 1 );
}
