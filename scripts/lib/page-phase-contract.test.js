const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { spawnSync } = require( 'node:child_process' );

const { selectAboutSource, selectDigestSource } = require( './page-phase-contract' );

const themeRoot = path.join( __dirname, '..', '..' );

test( 'selects the reviewed Digest candidate only when drafts are explicit', () => {
	assert.equal(
		selectDigestSource( [ '--drafts' ] ),
		path.join( themeRoot, 'content', 'page-drafts', 'job-placement-digest.html' )
	);
	assert.equal(
		selectDigestSource( [] ),
		path.join( themeRoot, 'content', 'page-snapshots', 'job-placement-digest.html' )
	);
} );

test( 'keeps local About acceptance on drafts and deployed About on snapshots', () => {
	assert.equal(
		selectAboutSource( { drafts: true, requireLocal: false } ),
		path.join( themeRoot, 'content', 'page-drafts', 'about.html' )
	);
	assert.equal(
		selectAboutSource( { drafts: false, requireLocal: true } ),
		path.join( themeRoot, 'content', 'page-drafts', 'about.html' )
	);
	assert.equal(
		selectAboutSource( { drafts: false, requireLocal: false } ),
		path.join( themeRoot, 'content', 'page-snapshots', 'about.html' )
	);
} );

test( 'phase-aware page verifiers reject unknown options', () => {
	for ( const verifier of [
		'verify-job-placement-pages.js',
		'verify-prominent-actions.js',
		'verify-about-page-rendered.js',
	] ) {
		const result = spawnSync(
			process.execPath,
			[ path.join( themeRoot, 'scripts', verifier ), '--unknown' ],
			{ encoding: 'utf8', env: { ...process.env, HPERKINS_ORIGIN: '' } }
		);
		assert.equal( result.status, 1, `${ verifier } unexpectedly accepted --unknown.` );
		assert.match( result.stderr, /Unknown option: --unknown/, `${ verifier } failed for the wrong reason.` );
	}
} );

test( 'prominent-action source mode reads the selected absolute draft paths across platforms', () => {
	const result = spawnSync(
		process.execPath,
		[ path.join( themeRoot, 'scripts', 'verify-prominent-actions.js' ), '--source-only', '--drafts' ],
		{ encoding: 'utf8', env: { ...process.env, HPERKINS_ORIGIN: '' } }
	);
	assert.equal( result.status, 0, result.stderr );
	assert.match( result.stdout, /prominent action source contracts verified/ );
} );

test( 'rendered recruiter probes keep snapshot and event-first draft phases distinct', () => {
	const recruiter = fs.readFileSync(
		path.join( themeRoot, 'scripts', 'verify-job-placement-pages.js' ),
		'utf8'
	);
	assert.match( recruiter, /requireEventFirst: USE_DRAFTS/ );
	assert.match( recruiter, /if \( requireEventFirst \)/ );
	assert.match( recruiter, /document\.querySelector\('main \.hp-wcus-callout'\)/ );
	assert.match( recruiter, /primaryRail\.closest\('\.hp-wcus-callout'\)/ );
	assert.doesNotMatch( recruiter, /hero\?\.querySelector\('\.hp-wcus-callout'\)/ );
	assert.match( recruiter, /evidenceFragment/ );
	assert.match( recruiter, /zoom-200-from-1024/ );

	const prominent = fs.readFileSync(
		path.join( themeRoot, 'scripts', 'verify-prominent-actions.js' ),
		'utf8'
	);
	assert.match( prominent, /\.wp-block-buttons\.hp-action-rail/ );
	assert.match( prominent, /\.hp-action-rail:not\(\.wp-block-buttons\)/ );
} );

test( 'default recruiter source acceptance pins the complete shared WCUS presentation', () => {
	const recruiter = fs.readFileSync(
		path.join( themeRoot, 'scripts', 'verify-job-placement-pages.js' ),
		'utf8'
	);
	const defaultContract = /\} else \{\s*assertRuleDeclarations\( pageCss, \{\s*selector: '\.hp-wcus-callout',\s*declarations: \{([\s\S]*?)\r?\n\s*\},\r?\n\s*\} \);/.exec( recruiter );

	assert( defaultContract, 'Default recruiter source acceptance has no generic WCUS callout contract.' );
	assert.match(
		defaultContract[ 1 ],
		/'margin-block-start': 'var\(--wp--preset--spacing--6\)'/
	);
	assert.match(
		defaultContract[ 1 ],
		/background: 'color-mix\(in srgb, var\(--wp--preset--color--parchment-100\) 88%, var\(--wp--preset--color--gold-100\)\)'/
	);
} );
