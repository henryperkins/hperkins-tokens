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
			// About proof-first ownership model (Phase A): one candidate, an
			// export-only snapshot, a thin pattern adapter, and page-layout CSS
			// in the pages sheet.
			'one human-authored candidate at `content/page-drafts/about.html`',
			'thin inserter adapter that reads the',
			'--confirm-local --page=about',
			'--expect-draft',
			'assets/imladris-pages.css',
		],
		exclude: [
			/then appends the Three Rings \(Vilya \/ Narya \/ Nenya\) framework section\./,
			/renders the\s+"ai-enablement" pattern/i,
			/wraps the "work-index" pattern/i,
			// Retired: about-resume presented as one more reusable full-page
			// seed. It is a thin adapter over the accepted snapshot now.
			/filesystem patterns \(`about-resume`/,
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
			// About proof-first ownership model (Phase A).
			'content/page-drafts/about.html',
			'thin adapter over the accepted snapshot',
			'--page=about',
			'verify-about-page-source.js',
			'verify-about-page-rendered.js',
			'.hp-about-template` selector anymore',
		],
		exclude: [
			/page-ai-enablement\.html is a \*\*shadow template\*\*/i,
			// Retired: about-resume listed among the reusable full-page seeds.
			/`\/about\/`, `\/work\/`, and `\/ai-enablement\/` content patterns/,
			// Retired: the pages-sheet scope list without About — the About
			// page layer lives in assets/imladris-pages.css now.
			/design system \(ai-enablement essay, contact, work index, job-placement digest\)/,
		],
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
			// About proof-first ownership model (Phase A): the candidate is
			// mapped but never presented as deployed.
			'content/page-drafts/about.html',
			'thin accepted-snapshot adapter',
			'About page layer in `assets/imladris-pages.css`',
			'not the deployed body until it passes review and controlled promotion',
		],
		exclude: [
			/\*\*Shadow template\*\* over live page 175/i,
			/appended to live \*\*Work\*\* page 13/i,
			/\*\*add\*\* `job-placement-digest\.php`/i,
			// Retired: the two-artifact About row without the candidate,
			// adapter, and page-layout CSS mapping.
			/\| `templates\/about` \| `content\/page-snapshots\/about\.html`, `templates\/page-about\.html` \|/,
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
