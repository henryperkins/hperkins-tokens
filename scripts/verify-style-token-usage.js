#!/usr/bin/env node
/**
 * Fail when style.css references an unresolved CSS custom property without a
 * fallback. Dynamic runtime variables can be allow-listed explicitly.
 */
const { execFileSync } = require( 'node:child_process' );
const fs = require( 'node:fs' );

const WP_PATH = '/home/dev/hperkinsblog';
const ALLOWED_DYNAMIC = new Set( [
	'--hp-footer-backdrop-url',
	'--hp-neutral-200',
] );

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

const style = fs.readFileSync( 'style.css', 'utf8' );
const generatedVariables = execFileSync(
	'wp',
	[
		`--path=${ WP_PATH }`,
		'--url=https://hperkins.blog',
		'eval',
		'echo wp_get_global_stylesheet( array( "variables" ) );',
	],
	{ encoding: 'utf8' }
);

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
