const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
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

test( 'prominent-action source mode reads the selected draft paths on Windows', () => {
	const result = spawnSync(
		process.execPath,
		[ path.join( themeRoot, 'scripts', 'verify-prominent-actions.js' ), '--source-only', '--drafts' ],
		{ encoding: 'utf8', env: { ...process.env, HPERKINS_ORIGIN: '' } }
	);
	assert.equal( result.status, 0, result.stderr );
	assert.match( result.stdout, /prominent action source contracts verified/ );
} );
