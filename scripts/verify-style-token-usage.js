#!/usr/bin/env node
/**
 * Fail when style.css references an unresolved CSS custom property without a
 * fallback. Dynamic runtime variables can be allow-listed explicitly.
 */
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { getOrigin } = require( './lib/site-url' );
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

// Resolve style.css relative to the theme root so the script works from any CWD.
const style = fs.readFileSync( path.join( __dirname, '..', 'style.css' ), 'utf8' );
const generatedVariables = runWp( [
	`--url=${ ORIGIN }`,
	'eval',
	'echo wp_get_global_stylesheet( array( "variables" ) );',
] );

const defined = new Set();
for ( const css of [ style, generatedVariables ] ) {
	for ( const match of css.matchAll( /(--[A-Za-z0-9_-]+)\s*:/g ) ) {
		defined.add( match[1] );
	}
}

const missing = new Map();
for ( const match of style.matchAll( /var\(\s*(--[A-Za-z0-9_-]+)(\s*,)?/g ) ) {
	const name = match[1];
	const hasFallback = !! match[2];
	if ( defined.has( name ) || hasFallback || ALLOWED_DYNAMIC.has( name ) ) {
		continue;
	}

	const line = style.slice( 0, match.index ).split( '\n' ).length;
	if ( ! missing.has( name ) ) {
		missing.set( name, [] );
	}
	missing.get( name ).push( line );
}

assert(
	missing.size === 0,
	[ ...missing.entries() ]
		.map( ( [ name, lines ] ) => `${ name } at ${ lines.join( ', ' ) }` )
		.join( '\n' )
);

console.log( 'checked style.css token references' );
