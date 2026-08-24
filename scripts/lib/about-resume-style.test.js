#!/usr/bin/env node

const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const test = require( 'node:test' );

const themeRoot = path.join( __dirname, '..', '..' );
const theme = JSON.parse( fs.readFileSync( path.join( themeRoot, 'theme.json' ), 'utf8' ) );
const css = fs.readFileSync( path.join( themeRoot, 'assets', 'imladris-pages.css' ), 'utf8' );
const draft = fs.readFileSync( path.join( themeRoot, 'content', 'page-drafts', 'about.html' ), 'utf8' );
const marker = '/* About v2: resume-first evidence index.';
const aboutV2Css = css.slice( css.indexOf( marker ) );

function slugs( items ) {
	return new Set( ( items || [] ).map( ( item ) => item.slug ) );
}

test( 'About v2 CSS references only registered theme.json preset tokens', () => {
	assert.notEqual( css.indexOf( marker ), -1, 'About v2 CSS marker must exist.' );

	const registered = {
		color: slugs( theme.settings?.color?.palette ),
		'font-family': slugs( theme.settings?.typography?.fontFamilies ),
		'font-size': slugs( theme.settings?.typography?.fontSizes ),
		spacing: slugs( theme.settings?.spacing?.spacingSizes ),
	};
	const missing = Array.from(
		aboutV2Css.matchAll( /var\(\s*--wp--preset--(color|font-family|font-size|spacing)--([a-z0-9-]+)/g )
	).map( ( match ) => `${ match[ 1 ] }:${ match[ 2 ] }` )
		.filter( ( reference ) => {
			const [ category, slug ] = reference.split( ':' );
			return ! registered[ category ].has( slug );
		} );

	assert.deepEqual( [ ...new Set( missing ) ].sort(), [] );
	assert.doesNotMatch( aboutV2Css, /var\(\s*--spacing\d+/ );
} );

test( 'About v2 impact cards do not reuse the accepted snapshot breakout class', () => {
	assert.doesNotMatch( draft, /class="[^"]*\shp-about-impact(?:\s|")/ );
	assert.equal(
		( draft.match( /class="[^"]*\bhp-about-v2-impact\b/g ) || [] ).length,
		3
	);
	assert.match( aboutV2Css, /\.hp-about-v2-impact\s*\{/ );
} );

test( 'About v2 identity follows the approved first-viewport handoff', () => {
	assert.match( draft, />Developer relations &amp; enablement<\/p>/ );
	assert.match(
		draft,
		/I ship WordPress AI work in public — merged core contributions, provider tooling other developers install, and the documentation that makes both usable\./
	);
	assert.match(
		draft,
		/Open to WordPress AI, developer-enablement, and support-engineering work — full-time or contract, remote or Chicago\./
	);
	assert.match( draft, /href="mailto:htperkins@gmail\.com">htperkins@gmail\.com<\/a>/ );
	assert.match( draft, />github\.com\/henryperkins<\/a>/ );
	assert.match( draft, />linkedin\.com\/in\/henryperkins<\/a>/ );
	assert.doesNotMatch( draft, /<p class="hp-about-kicker">About \/ Résumé<\/p>/ );
	assert.doesNotMatch( aboutV2Css, /100vw\s*-\s*\(2\s*\*/ );
	assert.match( aboutV2Css, /--hp-about-gutter:/ );
} );
