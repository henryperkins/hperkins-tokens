#!/usr/bin/env node
/**
 * Fail when an authored sheet (style.css or assets/imladris-pages.css)
 * references an unresolved CSS custom property without a fallback. Dynamic
 * runtime variables can be allow-listed explicitly.
 */
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { assertMatchingSiteUrl, getOrigin } = require( './lib/site-url' );
const { runWp } = require( './lib/wp-cli' );

const ORIGIN = getOrigin();
const ALLOWED_DYNAMIC = new Set( [
	'--hp-footer-backdrop-url',
] );

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

// Resolve the authored sheets relative to the theme root so the script works
// from any CWD. imladris-pages.css loads after style.css (handle dependency),
// so aliases defined in style.css's :root are in scope for both sheets.
const AUTHORED_SHEETS = [ 'style.css', 'assets/imladris-pages.css' ].map( ( relative ) => ( {
	relative,
	css: fs.readFileSync( path.join( __dirname, '..', relative ), 'utf8' ),
} ) );
const STYLE_CSS = AUTHORED_SHEETS[ 0 ].css;
const PAGES_CSS = AUTHORED_SHEETS[ 1 ].css;

// The generated variables come from the DB at HPERKINS_WP_PATH while ORIGIN
// names the site under test; refuse a mismatched pair instead of mixing sites.
assertMatchingSiteUrl(
	ORIGIN,
	runWp( [ `--url=${ ORIGIN }`, 'option', 'get', 'home' ] ).trim()
);

const generatedVariables = runWp( [
	`--url=${ ORIGIN }`,
	'eval',
	'echo wp_get_global_stylesheet( array( "variables" ) );',
] );

function collectDefinitions( sources ) {
	const defined = new Set();
	for ( const css of sources ) {
		for ( const match of css.matchAll( /(--[A-Za-z0-9_-]+)\s*:/g ) ) {
			defined.add( match[1] );
		}
	}
	return defined;
}

// Resolution is scoped per sheet, matching the real load order. style.css is
// enqueued on every route; assets/imladris-pages.css is skipped on the front
// page, so a style.css var() that only imladris-pages.css defines is
// invalid-at-computed-value-time wherever the pages sheet is absent. A single
// union across both sheets would call that reference satisfied.
const stylesheetScopes = new Map( [
	[ 'style.css', collectDefinitions( [ STYLE_CSS, generatedVariables ] ) ],
	[ 'assets/imladris-pages.css', collectDefinitions( [ STYLE_CSS, PAGES_CSS, generatedVariables ] ) ],
] );

const missing = new Map();
for ( const sheet of AUTHORED_SHEETS ) {
	const defined = stylesheetScopes.get( sheet.relative );
	for ( const match of sheet.css.matchAll( /var\(\s*(--[A-Za-z0-9_-]+)(\s*,)?/g ) ) {
		const name = match[1];
		const hasFallback = !! match[2];
		if ( defined.has( name ) || hasFallback || ALLOWED_DYNAMIC.has( name ) ) {
			continue;
		}

		const line = sheet.css.slice( 0, match.index ).split( '\n' ).length;
		const label = `${ name } (${ sheet.relative })`;
		if ( ! missing.has( label ) ) {
			missing.set( label, [] );
		}
		missing.get( label ).push( line );
	}
}

assert(
	missing.size === 0,
	[ ...missing.entries() ]
		.map( ( [ label, lines ] ) => `${ label } at ${ lines.join( ', ' ) }` )
		.join( '\n' )
);

console.log( 'checked style.css and assets/imladris-pages.css token references' );
