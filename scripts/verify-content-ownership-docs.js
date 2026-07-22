#!/usr/bin/env node

const fs = require( 'node:fs' );
const path = require( 'node:path' );

const { PAGE_CONTRACTS } = require( './lib/page-content-contract' );

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
			'content/page-snapshots/job-placement-digest.html',
			'content/page-snapshots/placement-method-evidence.html',
			'content/page-snapshots/work-flavor-agent-demo.html',
			'theme-owned Wapuu',
			'hp-action-rail',
			'hp-action-panel',
			'content/nav-snapshots/nav-237.html',
			'scripts/export-navigation-snapshot.js',
			'scripts/apply-council-navigation.js',
			'header-controller.js',
			'verify-header.js',
		],
		exclude: [
			/then appends the Three Rings \(Vilya \/ Narya \/ Nenya\) framework section\./,
			/renders the\s+"ai-enablement" pattern/i,
			/wraps the "work-index" pattern/i,
		],
	},
	{
		file: 'CLAUDE.md',
		include: [
			'content/page-snapshots/',
			'content/page-snapshots/job-placement-digest.html',
			'content/page-snapshots/placement-method-evidence.html',
			'content/page-snapshots/work-flavor-agent-demo.html',
			'theme-owned `wapuu-home-hero` pattern',
			'verify-prominent-actions.js',
			'hp-action-rail',
			'[hperkins_council_header]',
			'inc/council-header.php',
			'content/nav-snapshots/nav-237.html',
			'closed|work|writing|search|drawer',
			'verify-header.js',
		],
		exclude: [ /page-ai-enablement\.html is a \*\*shadow template\*\*/i ],
	},
	{
		file: 'docs/design-system/INDEX.md',
		include: [
			'content/page-snapshots/ai-enablement.html',
			'content/page-snapshots/work.html',
			'content/page-snapshots/job-placement-digest.html',
			'content/page-snapshots/placement-method-evidence.html',
			'content/page-snapshots/work-flavor-agent-demo.html',
			'hybrid mode: theme-owned Wapuu hero + Three Rings shell',
			'`hp-action-rail`',
			'`hp-action-panel is-closing`',
			'Condensed Council',
			'Work evidence panel',
			'gold-800',
			'hp-drawer-search',
			'header-controller.js',
		],
		exclude: [
			/\*\*Shadow template\*\* over live page 175/i,
			/appended to live \*\*Work\*\* page 13/i,
			/\*\*add\*\* `job-placement-digest\.php`/i,
		],
	},
	{
		file: 'docs/design-system/ALIGNMENT-PLAN.md',
		include: [
			'Superseded route-ownership instructions (2026-07-21)',
			'content/page-snapshots/job-placement-digest.html',
			'content/page-snapshots/placement-method-evidence.html',
			'must not recreate a third full-page copy',
		],
		exclude: [
			/\*\*Add the two Job Placement Digest files\*\*/i,
			/\| `patterns\/job-placement-digest\.php` \| `_source\/theme\/patterns\/job-placement-digest\.php` \|/i,
			/job-placement-digest\.php now exists/i,
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

const readmeCurrentContract = fs.readFileSync( path.join( themeRoot, 'readme.txt' ), 'utf8' )
	.split( '== Changelog ==' )[ 0 ];
assert(
	! /plato[- ]artifacts/i.test( readmeCurrentContract ),
	'readme.txt still advertises the retired Plato Artifacts page in its current theme contract.'
);
assert(
	! readmeCurrentContract.includes( '`job-placement-digest`) remain reusable seeds/reference copies' ),
	'readme.txt still presents the retired Job Placement Digest pattern as a maintained page copy.'
);

const appendixContract = PAGE_CONTRACTS.find( ( contract ) => contract.key === 'placement-method-evidence' );
assert( appendixContract, 'Page ownership contracts do not track Placement Method and Evidence.' );
assert(
	appendixContract.pagePath === 'placement-method-and-evidence' &&
	appendixContract.snapshotFile === 'placement-method-evidence.html' &&
	appendixContract.templateFile === 'templates/page-placement-method-and-evidence.html',
	'Placement Method and Evidence must use the database-body, snapshot, and slug-template contract.'
);

const retiredDigestPattern = path.join( themeRoot, 'patterns', 'job-placement-digest.php' );
assert(
	! fs.existsSync( retiredDigestPattern ),
	'patterns/job-placement-digest.php must be retired instead of maintained as a third full-page copy.'
);

console.log( 'verified content-ownership docs contract' );
