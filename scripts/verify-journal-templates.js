#!/usr/bin/env node
/**
 * Journal template source contract.
 *
 * The blog surfaces are the part of this theme with the thinnest rendered
 * coverage: verify-journal-polish.js loads /essays/ only, and until the
 * discovery pass was added to verify-typography.js nothing loaded a single post
 * or a term archive at all. This verifier is the static half of that gap. It
 * needs neither Chrome nor a WordPress install, so it can run anywhere, and it
 * pins the couplings that are invisible in a rendered page: query IDs against
 * the filters in functions.php, the sticky-post mode, the seed offset, and the
 * per-loop postcard shape.
 *
 * Usage: node scripts/verify-journal-templates.js
 */
const fs = require( 'node:fs' );
const path = require( 'node:path' );

const THEME_PATH = path.join( __dirname, '..' );
const violations = [];

function read( relative ) {
	return fs.readFileSync( path.join( THEME_PATH, relative ), 'utf8' );
}

function check( condition, message ) {
	if ( ! condition ) {
		violations.push( message );
	}
}

/**
 * Pull the JSON attribute object off a `wp:query` comment for a given queryId.
 *
 * @param {string} markup  Template source.
 * @param {number} queryId The queryId to find.
 * @return {Object|null} Parsed attributes, or null when absent/unparseable.
 */
function readQueryBlock( markup, queryId ) {
	for ( const match of markup.matchAll( /<!--\s*wp:query\s+(\{.*?\})\s*-->/g ) ) {
		let attrs;
		try {
			attrs = JSON.parse( match[ 1 ] );
		} catch ( error ) {
			continue;
		}
		if ( attrs.queryId === queryId ) {
			return attrs;
		}
	}
	return null;
}

const home = read( 'templates/home.html' );
const single = read( 'templates/single.html' );
const archive = read( 'templates/archive.html' );
const search = read( 'templates/search.html' );
const functions = read( 'functions.php' );
const pagesCss = read( 'assets/imladris-pages.css' );
// Value assertions run against declarations only. Comments in this sheet
// routinely quote the very literals a rule is there to forbid ("not a
// hand-typed 42px"), and matching those would make documenting a decision fail
// the check that enforces it.
const pagesDeclarations = pagesCss.replace( /\/\*[\s\S]*?\*\//g, '' );
const themeJson = JSON.parse( read( 'theme.json' ) );

// --- Query identity -------------------------------------------------------
// functions.php keys two filters to literal query IDs. Renumber a template
// without renumbering the filter and the coupling fails silently: the related
// loop stops excluding the current post, and the journal grid regains its
// fabricated trailing pagination page.
const FEATURED = readQueryBlock( home, 10 );
const GRID = readQueryBlock( home, 11 );
const RELATED = readQueryBlock( single, 12 );

check( FEATURED, 'templates/home.html must keep the featured loop at queryId 10.' );
check( GRID, 'templates/home.html must keep the journal grid at queryId 11.' );
check( RELATED, 'templates/single.html must keep the related loop at queryId 12.' );

check(
	/11 === \$query_id/.test( functions ),
	'functions.php must still tag queryId 11 with the journal grid seed offset.'
);
check(
	/\b12 [!=]== \$query_id/.test( functions ),
	'functions.php must still exclude the current post from queryId 12.'
);

if ( GRID ) {
	const offset = ( GRID.query || {} ).offset;
	check(
		offset === 3,
		`templates/home.html queryId 11 must keep offset 3 (found ${ JSON.stringify( offset ) }); the found_posts filter subtracts a hardcoded 3.`
	);
	check(
		/\$query\['hperkins_tokens_offset_base'\] = 3;/.test( functions ),
		'functions.php must subtract the same seed offset (3) that home.html queryId 11 declares.'
	);
}

// The archive and search loops must never reuse 11 or 12, whose filters would
// then fire on a query they were never written for.
for ( const [ file, markup, expected ] of [
	[ 'templates/archive.html', archive, 13 ],
	[ 'templates/search.html', search, 14 ],
] ) {
	check( readQueryBlock( markup, expected ), `${ file } must keep its loop at queryId ${ expected }.` );
	for ( const reserved of [ 10, 11, 12 ] ) {
		check(
			! readQueryBlock( markup, reserved ),
			`${ file } must not reuse queryId ${ reserved } — it is keyed to a functions.php filter.`
		);
	}
}

// --- Sticky posts ---------------------------------------------------------
// WordPress 6.6 treats an unrecognised non-empty sticky mode as exclusion, so
// the templates keep the compatible empty value and the query-ID filter sets
// ignore_sticky_posts. That preserves sticky posts in normal chronological
// order without letting core prepend one to either composition.
for ( const [ label, attrs ] of [ [ 'queryId 10', FEATURED ], [ 'queryId 11', GRID ] ] ) {
	if ( ! attrs ) {
		continue;
	}
	const sticky = ( attrs.query || {} ).sticky;
	check(
		sticky === '',
		`templates/home.html ${ label } must keep the WordPress 6.6-compatible empty sticky mode (found ${ JSON.stringify( sticky ) }).`
	);
}
check(
	/in_array\(\s*\$query_id,\s*array\(\s*10,\s*11\s*\),\s*true\s*\)/.test( functions ) &&
		/\$query\['ignore_sticky_posts'\] = true;/.test( functions ),
	'functions.php must set ignore_sticky_posts for journal queryIds 10 and 11.'
);
if ( RELATED ) {
	check(
		( RELATED.query || {} ).sticky === 'exclude',
		'templates/single.html queryId 12 must keep "sticky":"exclude".'
	);
}

// --- Postcard shape -------------------------------------------------------
// A linked featured image is a second anchor to the same permalink as the
// title: a duplicate tab stop whose accessible name is empty whenever the
// attachment carries no alt text, and whose focus ring the media box's
// overflow:hidden clips away entirely. The whole card is the title link's
// stretched target instead.
for ( const [ file, markup ] of [
	[ 'templates/home.html', home ],
	[ 'templates/single.html', single ],
	[ 'templates/archive.html', archive ],
	[ 'templates/search.html', search ],
] ) {
	check(
		! /post-featured-image\s+\{[^}]*"isLink"\s*:\s*true/.test( markup ),
		`${ file } must not link postcard featured images; the stretched title link owns the card.`
	);
}

check(
	/\.hp-postcard__title a::after/.test( pagesCss ),
	'assets/imladris-pages.css must keep the stretched .hp-postcard__title a::after target that replaced the image link.'
);
check(
	/\.hp-postcard__media \.wp-block-post-featured-image/.test( pagesCss ),
	'assets/imladris-pages.css must keep the featured-image height rule; without it the cards\' object-fit is inert.'
);

// --- Reader hero ----------------------------------------------------------
// core rounds dimRatio to the nearest ten and only ships dim classes in those
// steps, so any other value silently renders at the 0.5 fallback — well below
// what the hero's palette steps were chosen against.
const cover = /<!--\s*wp:cover\s+(\{.*?\})\s*-->/.exec( single );
check( cover, 'templates/single.html must keep its reader-hero cover block.' );
if ( cover ) {
	let attrs = {};
	try {
		attrs = JSON.parse( cover[ 1 ] );
	} catch ( error ) {
		violations.push( 'templates/single.html reader-hero cover attributes are not valid JSON.' );
	}
	const ratio = attrs.dimRatio;
	check(
		Number.isInteger( ratio ) && ratio % 10 === 0,
		`templates/single.html cover dimRatio must be a multiple of 10 (found ${ JSON.stringify( ratio ) }); core has no CSS for other values and falls back to 0.5.`
	);
	check(
		single.includes( `has-background-dim-${ ratio }` ),
		`templates/single.html serialized overlay class must match dimRatio ${ ratio }.`
	);
}

// --- Token discipline -----------------------------------------------------
// verify-style-token-usage.js reads style.css only, so nothing else looks at
// the literals in this sheet. Colours inside a data: URI cannot be var()s, so
// pin them to the palette instead: a hex that no longer names a real token is
// exactly the drift the tokens-first rule exists to prevent.
const paletteHexes = new Set(
	( ( ( themeJson.settings || {} ).color || {} ).palette || [] ).map( ( entry ) => String( entry.color ).toUpperCase() )
);
for ( const match of pagesDeclarations.matchAll( /%23([0-9A-Fa-f]{6})/g ) ) {
	const hex = `#${ match[ 1 ] }`.toUpperCase();
	check(
		paletteHexes.has( hex ),
		`assets/imladris-pages.css encodes ${ hex } inside a data: URI, which is not a theme.json palette colour.`
	);
}

check(
	! /\.hp-pagination[^}]*\b4[02]px/.test( pagesDeclarations ),
	'assets/imladris-pages.css pagination must size from var(--hp-touch-min), not a literal px value.'
);

// --- Report ---------------------------------------------------------------
if ( violations.length > 0 ) {
	for ( const violation of violations ) {
		console.error( `journal template contract: ${ violation }` );
	}
	console.error( `${ violations.length } violation(s).` );
	process.exit( 1 );
}

console.log(
	'verified journal template contract: query identity + filter coupling, sticky mode, seed offset, postcard link shape, reader-hero dim ratio, data-URI palette hexes, pagination touch token'
);
