#!/usr/bin/env node

const fs = require( 'node:fs' );
const path = require( 'node:path' );

const THEME_ROOT = path.join( __dirname, '..' );

const RAIL_FILES = [
	'patterns/wapuu-home-hero.php',
	'patterns/about-resume.php',
	'content/page-snapshots/about.html',
	'content/page-snapshots/front-page.html',
	'patterns/job-placement-digest.php',
	'content/page-snapshots/job-placement-digest.html',
	'content/page-snapshots/work-flavor-agent-demo.html',
];

const PANEL_FILES = [
	'content/page-snapshots/front-page.html',
	'patterns/job-placement-digest.php',
	'content/page-snapshots/job-placement-digest.html',
	'content/page-snapshots/work-flavor-agent-demo.html',
];

const EXCLUDED_FILES = [
	'parts/header.html',
	'patterns/imladris-button.php',
];

const DIGEST_COPY = [
	'A next step, stated plainly',
	'Bring me the problem behind the ticket.',
	'If you need WordPress systems thinking that can survive inspection, let’s compare notes.',
	'href="/contact/"',
	'href="/work/"',
];

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function read( relativePath ) {
	return fs.readFileSync( path.join( THEME_ROOT, relativePath ), 'utf8' );
}

function classLists( contents ) {
	return Array.from( contents.matchAll( /\bclass="([^"]*)"/g ), ( match ) =>
		match[1].trim().split( /\s+/ ).filter( Boolean )
	);
}

function hasClassSet( contents, expectedClasses ) {
	return classLists( contents ).some( ( classes ) =>
		expectedClasses.every( ( className ) => classes.includes( className ) )
	);
}

function verifySourceContracts() {
	const css = read( 'style.css' );
	for ( const expected of [
		'.hp-action-rail {',
		'.hp-action-panel.is-closing {',
		'min-block-size: var(--hp-touch-min);',
		'mask: url("assets/img/emblem.svg") center / contain no-repeat;',
	] ) {
		assert( css.includes( expected ), `style.css is missing expected contract: ${ expected }` );
	}

	for ( const file of RAIL_FILES ) {
		assert(
			hasClassSet( read( file ), [ 'wp-block-buttons', 'hp-action-rail' ] ),
			`${ file } is missing hp-action-rail on its core Buttons wrapper.`
		);
	}

	for ( const file of PANEL_FILES ) {
		assert(
			hasClassSet( read( file ), [ 'hp-action-panel', 'is-closing' ] ),
			`${ file } is missing hp-action-panel is-closing.`
		);
	}

	for ( const file of EXCLUDED_FILES ) {
		const contents = read( file );
		assert( ! contents.includes( 'hp-action-rail' ), `${ file } must remain outside hp-action-rail.` );
		assert( ! contents.includes( 'hp-action-panel' ), `${ file } must remain outside hp-action-panel.` );
	}

	for ( const file of [
		'patterns/job-placement-digest.php',
		'content/page-snapshots/job-placement-digest.html',
	] ) {
		const contents = read( file );
		for ( const expected of DIGEST_COPY ) {
			assert( contents.includes( expected ), `${ file } is missing approved Digest content: ${ expected }` );
		}
		assert(
			/<h2\b[^>]*>Bring me the problem behind the ticket\.<\/h2>/.test( contents ),
			`${ file } must render the approved Digest closing heading as h2.`
		);
	}

	assert( css.includes( 'Version: 0.3.42' ), 'style.css must declare Version 0.3.42.' );
	const readme = read( 'readme.txt' );
	assert( readme.includes( 'Stable tag: 0.3.42' ), 'readme.txt must declare Stable tag 0.3.42.' );
	assert( readme.includes( '= 0.3.42 =' ), 'readme.txt must contain the 0.3.42 changelog.' );

	console.log( 'prominent action source contracts verified' );
}

try {
	verifySourceContracts();
} catch ( error ) {
	console.error( error.message );
	process.exit( 1 );
}
