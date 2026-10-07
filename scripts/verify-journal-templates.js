#!/usr/bin/env node
/**
 * Journal template source contract.
 *
 * The blog surfaces are the part of this theme with the thinnest rendered
 * coverage: verify-journal-polish.js works on /essays/ and visits one post and
 * one term archive only for their postcard titles, and until the discovery
 * pass was added to verify-typography.js nothing loaded a single post or a
 * term archive at all. This verifier is the static half of that gap. It
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

// --- Postcard star plate (2026-10-06 hand-off, A3) -------------------------
// The star turns on its own element, which inc/postcards.php appends to every
// postcard media group at render time. A template-borne plate would never
// reach a Site Editor copy of the template saved before it existed, and
// production's /essays/ renders exactly such a copy.
const postcardsPhp = fs.existsSync( path.join( THEME_PATH, 'inc/postcards.php' ) ) ? read( 'inc/postcards.php' ) : '';
check( postcardsPhp !== '', 'inc/postcards.php, which appends the postcard star plate, is missing.' );
check( /\/inc\/postcards\.php/.test( functions ), 'functions.php must require inc/postcards.php.' );
check(
	/add_filter\(\s*'render_block_core\/group',\s*'hperkins_tokens_postcard_plate',\s*10,\s*2\s*\)/.test( postcardsPhp ),
	'inc/postcards.php must hook hperkins_tokens_postcard_plate to render_block_core/group with the parsed block.'
);
for ( const [ file, markup ] of [
	[ 'templates/home.html', home ],
	[ 'templates/single.html', single ],
	[ 'templates/archive.html', archive ],
] ) {
	check(
		markup.includes( '"className":"hp-postcard__media"' ),
		`${ file } must keep its postcard media groups; the plate filter attaches to them.`
	);
	check(
		! markup.includes( 'hp-postcard__plate' ),
		`${ file } must not carry its own plate; inc/postcards.php appends the one plate each card gets.`
	);
}
// Jetpack Boost inlines critical CSS generated from this sheet. Its stale copy
// of the old ::after star stays on without JavaScript, and only this reset
// keeps it from drawing a second star beside the plate's.
check(
	/\.hp-postcard__media::after\s*\{\s*content:\s*none;\s*\}/.test( pagesDeclarations ),
	'assets/imladris-pages.css must reset .hp-postcard__media::after, or a stale inlined copy of the old star rule draws a second star.'
);
check(
	! /\.hp-postcard__media::after\s*\{[^}]*background/.test( pagesDeclarations ),
	'The compass star belongs to .hp-postcard__plate::after, not .hp-postcard__media::after.'
);

// --- Postcard titles (A1) ----------------------------------------------------
// The type sits on the heading and the link inherits it. A size set on the link
// alone still sits on a line box with the heading's h2/h3 strut.
for ( const rule of pagesDeclarations.matchAll( /([^{}]*\.hp-postcard__title a[^{}]*)\{([^}]*)\}/g ) ) {
	check(
		! /font-size|line-height/.test( rule[ 2 ] ),
		`assets/imladris-pages.css sets type on a postcard title link (${ rule[ 1 ].trim() }); set it on .hp-postcard__title and let the link inherit.`
	);
}
const styleDeclarations = read( 'style.css' ).replace( /\/\*[\s\S]*?\*\//g, '' );
for ( const context of [ 'archive', 'search' ] ) {
	check(
		new RegExp( `body\\.${ context } \\.wp-block-query \\.wp-block-post-title:not\\(\\.hp-postcard__title\\)` ).test( styleDeclarations ),
		`style.css's body.${ context } title role must exclude .hp-postcard__title, or it loosens postcard titles from 1.15 to 1.2.`
	);
}

// --- Featured band (A2) ------------------------------------------------------
// The two mid-width steps repeat the 782px rules' selectors exactly, so source
// order is what lets them win: both must come after the 782px block.
const featuredWide = pagesDeclarations.search(
	/\.hp-journal-featured \.wp-block-post-template:has\(> li:nth-child\(2\)\)\s*\{\s*grid-template-columns:\s*minmax\(0, 1\.5fr\) minmax\(0, 1fr\)/
);
const featuredOne = pagesDeclarations.search(
	/@media \(min-width: 782px\) and \(max-width: 900px\)\s*\{\s*\.hp-journal-featured \.wp-block-post-template:has\(> li:nth-child\(2\)\)\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\);\s*grid-auto-rows:\s*auto;\s*\}\s*\.hp-journal-featured \.wp-block-post-template:has\(> li:nth-child\(3\)\) > li:first-child\s*\{\s*grid-row:\s*auto;/
);
const featuredEven = pagesDeclarations.search(
	/@media \(min-width: 901px\) and \(max-width: 1180px\)\s*\{\s*\.hp-journal-featured \.wp-block-post-template:has\(> li:nth-child\(2\)\)\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1fr\);/
);
check( featuredWide !== -1, 'assets/imladris-pages.css must keep the 1.5fr / 1fr featured band from 782px.' );
check(
	featuredOne > featuredWide && featuredEven > featuredWide,
	'assets/imladris-pages.css must step the featured band to one column at 782–900px and to two equal columns at 901–1180px, after the 782px block they override.'
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

// --- Essay reader (2026-09-28 essay-post hand-off) -------------------------
// Core's skip link targets the template's first <main>. With the hero before
// it, a keyboard visitor skipped straight past the H1 to "All essays"; the
// hero now opens <main>. verify-reader.js checks the rendered result, and
// verify-reader.php the server half; these are the couplings in source.
const mainOpen = single.search( /<main\b/ );
const mainClose = single.indexOf( '</main>' );
const coverAt = single.search( /<!--\s*wp:cover\b/ );
const titleAt = single.search( /<!--\s*wp:post-title\s+\{[^}]*"level":1/ );
const backAt = single.indexOf( 'hp-reader__back' );
check(
	mainOpen !== -1 && mainOpen < coverAt && coverAt < mainClose,
	'templates/single.html must render the reader hero inside <main>, the skip link\'s target.'
);
check(
	coverAt < titleAt && titleAt < backAt,
	'templates/single.html must keep the H1 inside the hero, ahead of the "All essays" back link.'
);
check(
	/<!--\s*wp:paragraph\s+\{"metadata":\{"bindings":\{"content":\{"source":"hperkins-tokens\/read-time"\}\}\}[^}]*"className":"hp-reader-hero__readtime"/.test( single ) &&
		single.indexOf( 'hp-reader-hero__readtime' ) > single.indexOf( 'hp-reader-hero__meta' ),
	'templates/single.html must bind the hero meta row\'s read time to the hperkins-tokens/read-time source.'
);
const readerPhp = read( 'inc/reader.php' );
check(
	/register_block_bindings_source\(\s*'hperkins-tokens\/read-time'/.test( readerPhp ),
	'inc/reader.php must register the hperkins-tokens/read-time block-bindings source the template binds.'
);
for ( const [ hook, callback ] of [
	[ 'render_block_core/cover', 'hperkins_tokens_reader_hero_plate' ],
	[ 'render_block_data', 'hperkins_tokens_reader_open_body' ],
	[ 'render_block_core/post-content', 'hperkins_tokens_reader_close_body' ],
	[ 'render_block_core/heading', 'hperkins_tokens_reader_section_mark' ],
] ) {
	check(
		new RegExp( `add_filter\\(\\s*'${ hook.replace( /\//g, '\\/' ) }',\\s*'${ callback }'` ).test( readerPhp ),
		`inc/reader.php must hook ${ callback } to ${ hook }.`
	);
}
check( /\/inc\/reader\.php/.test( functions ), 'functions.php must require inc/reader.php.' );
// Enqueued everywhere, not only on single posts: the Interactivity Router
// swaps a post in without loading the scripts that page would have enqueued.
check(
	/'hperkins-reader',[\s\S]{0,200}\/assets\/js\/reader\.js|\$reader_rel\s*=\s*'\/assets\/js\/reader\.js'/.test( functions ) &&
		! /is_singular\(\s*'post'\s*\)[\s\S]{0,300}hperkins-reader/.test( functions ),
	'functions.php must enqueue assets/js/reader.js on every route so a router swap into a post finds it loaded.'
);
check(
	/\.hp-related \.wp-block-post-template\s*\{\s*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/.test( pagesDeclarations ),
	'assets/imladris-pages.css must fix "Continue reading" at three columns (the 18rem auto-fill orphans a third card).'
);
// Those columns share the wide column, as the /essays/ grids do. A constrained
// group narrows its children to the 44rem content size: three 213px cards.
check(
	/<!--\s*wp:group\s+\{[^}]*"className":"hp-related"[^\n]*"layout":\{"type":"default"\}/.test( single ),
	'templates/single.html must lay "Continue reading" out in its wide group ("layout":{"type":"default"}); a constrained group squeezes the three cards into the 44rem text column.'
);

// --- Empty states ---------------------------------------------------------
// A Query Loop with no wp:query-no-results renders nothing at all when it has
// no posts — including under a heading that promises results, and inside the
// pagination chrome a stale ?query-N-page=… still draws. Every loop owns its
// own empty state; the block is invisible until the day it is needed, which is
// exactly why it goes missing.
for ( const [ file, markup ] of [
	[ 'templates/home.html', home ],
	[ 'templates/single.html', single ],
	[ 'templates/archive.html', archive ],
	[ 'templates/search.html', search ],
] ) {
	// wp:query-pagination and wp:query-title share the prefix; the lookahead
	// keeps this counting the loop wrapper only.
	const loops = [ ...markup.matchAll( /<!--\s*wp:query(?=[\s{])/g ) ].length;
	const emptyStates = [ ...markup.matchAll( /<!--\s*wp:query-no-results\b/g ) ].length;
	check(
		emptyStates === loops,
		`${ file } declares ${ loops } Query Loop(s) but ${ emptyStates } wp:query-no-results block(s); every loop needs its own empty state.`
	);
}

// --- Pagination arrows ----------------------------------------------------
// An arrow typed into the label is part of the link's accessible name, so a
// screen reader reads "left arrow Newer". core's paginationArrow renders the
// same glyph in its own aria-hidden span, which is the idiom the Council header
// already follows for every decorative mark.
for ( const [ file, markup ] of [
	[ 'templates/home.html', home ],
	[ 'templates/archive.html', archive ],
	[ 'templates/search.html', search ],
] ) {
	for ( const label of markup.matchAll( /wp:query-pagination-(?:previous|next)\s+(\{.*?\})\s*\/-->/g ) ) {
		let attrs = {};
		try {
			attrs = JSON.parse( label[ 1 ] );
		} catch ( error ) {
			violations.push( `${ file } has an unparseable pagination label: ${ label[ 1 ] }.` );
			continue;
		}
		check(
			! /[\u2190\u2192\u00ab\u00bb]/.test( attrs.label || '' ),
			`${ file } keeps an arrow inside the pagination label "${ attrs.label }"; it belongs in core's aria-hidden paginationArrow span.`
		);
	}
	check(
		! /"paginationArrow"\s*:\s*"none"/.test( markup ),
		`${ file } disables core's aria-hidden pagination arrow; the glyph then has to be typed into an accessible name.`
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
	'verified journal template contract: query identity + filter coupling, sticky mode, seed offset, postcard link shape, star-plate filter + stale-critical-CSS reset, title type on the heading, featured-band steps, reader hero inside <main>, read-time binding, reader hooks + global reader.js, related columns in the wide column, per-loop empty states, arrow-free pagination labels, reader-hero dim ratio, data-URI palette hexes, pagination touch token'
);
