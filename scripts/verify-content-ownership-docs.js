#!/usr/bin/env node

const fs = require( 'node:fs' );
const path = require( 'node:path' );

const themeRoot = path.join( __dirname, '..' );

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

const checks = [
	{
		file: 'readme.txt',
		include: [
			'content/page-snapshots/front-page.html',
			'content/page-snapshots/about.html',
			'content/page-snapshots/work.html',
			'content/page-snapshots/ai-enablement.html',
			'content/page-snapshots/work-flavor-agent-demo.html',
			'theme-owned Wapuu',
		],
		exclude: [
			/then appends the Three Rings \(Vilya \/ Narya \/ Nenya\) framework section\./,
			/renders the\s+"ai-enablement" pattern/i,
			/wraps the "work-index" pattern/i,
		],
	},
	{
		file: 'CLAUDE.md',
		include: [ 'content/page-snapshots/', 'content/page-snapshots/work-flavor-agent-demo.html', 'theme-owned `wapuu-home-hero` pattern' ],
		exclude: [ /page-ai-enablement\.html is a \*\*shadow template\*\*/i ],
	},
	{
		file: 'docs/design-system/INDEX.md',
		include: [
			'content/page-snapshots/ai-enablement.html',
			'content/page-snapshots/work.html',
			'content/page-snapshots/work-flavor-agent-demo.html',
			'hybrid mode: theme-owned Wapuu hero + Three Rings shell',
		],
		exclude: [
			/\*\*Shadow template\*\* over live page 175/i,
			/appended to live \*\*Work\*\* page 13/i,
		],
	},
];

for ( const check of checks ) {
	const filePath = path.join( themeRoot, check.file );
	const contents = fs.readFileSync( filePath, 'utf8' );

	for ( const expected of check.include ) {
		assert( contents.includes( expected ), `${ check.file } is missing expected content-contract note: ${ expected }` );
	}

	for ( const forbidden of check.exclude ) {
		assert( ! forbidden.test( contents ), `${ check.file } still documents the retired page-ownership contract: ${ forbidden }` );
	}
}

console.log( 'verified content-ownership docs contract' );
