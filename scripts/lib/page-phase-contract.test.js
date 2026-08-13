const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { spawnSync } = require( 'node:child_process' );

const { selectAboutSource, selectDigestSource } = require( './page-phase-contract' );

const themeRoot = path.join( __dirname, '..', '..' );

function readRecruiterVerifier() {
	return fs.readFileSync(
		path.join( themeRoot, 'scripts', 'verify-job-placement-pages.js' ),
		'utf8'
	);
}

function sourceBetween( source, startMarker, endMarker ) {
	const normalizedSource = source.replace( /\r\n?/g, '\n' );
	const start = normalizedSource.indexOf( startMarker );
	const end = normalizedSource.indexOf( endMarker, start + startMarker.length );
	assert.notEqual( start, -1, `Missing source seam: ${ startMarker }` );
	assert.notEqual( end, -1, `Missing source seam: ${ endMarker }` );
	return normalizedSource.slice( start, end );
}

test( 'extracts source seams from Windows CRLF checkouts', () => {
	assert.equal(
		sourceBetween( 'before\r\ninside\r\nafter', 'before\n', '\nafter' ),
		'before\ninside'
	);
} );

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

test( 'Digest text resize qualification is exact and requires a collected result', () => {
	const recruiter = readRecruiterVerifier();
	const qualifier = sourceBetween(
		recruiter,
		'function shouldInspectDigestTextResize',
		'async function inspectDigestTextResize'
	);
	const inspectPage = sourceBetween(
		recruiter,
		'async function inspectPage',
		'async function withChrome'
	);
	const assertMetrics = sourceBetween(
		recruiter,
		'function assertPageMetrics',
		'async function inspectDisclosures'
	);

	assert.match(
		qualifier,
		/return page\.name === 'digest' &&\s*DIGEST_EXPECTATIONS\.eventFirst &&\s*viewport\.width === 1024 &&\s*! viewport\.zoomPercent;/
	);
	assert.match(
		inspectPage,
		/if \( shouldInspectDigestTextResize\( page, viewport \) \) \{\s*metrics\.textResize200 = await inspectDigestTextResize\( cdp, sessionId \);\s*\}/
	);
	assert.match(
		assertMetrics,
		/if \( shouldInspectDigestTextResize\( page, viewport \) \) \{\s*assert\( result\.textResize200, context \+ ' did not collect the required 200% root-text metrics\.' \);/
	);
	assert.doesNotMatch( assertMetrics, /if \( result\.textResize200 \)/ );
} );

test( 'Digest text resize probe restores the prior inline root size before returning', () => {
	const probe = sourceBetween(
		readRecruiterVerifier(),
		'async function inspectDigestTextResize',
		'function assertActions'
	);

	assert.match( probe, /const previousRootFontSize = await evaluate\([\s\S]*document\.documentElement\.style\.fontSize/ );
	assert.match(
		probe,
		/try \{[\s\S]*document\.documentElement\.style\.fontSize = '200%'[\s\S]*return await evaluate[\s\S]*\} finally \{[\s\S]*document\.documentElement\.style\.fontSize = [\s\S]*previousRootFontSize/
	);
} );

test( 'Digest text resize proof requires three visible actions with nonempty four-edge-contained text', () => {
	const recruiter = readRecruiterVerifier();
	const probe = sourceBetween(
		recruiter,
		'async function inspectDigestTextResize',
		'function assertActions'
	);
	const assertMetrics = sourceBetween(
		recruiter,
		'function assertPageMetrics',
		'async function inspectDisclosures'
	);

	assert.match( probe, /actionCount: actions\.length/ );
	assert.match( probe, /actionsVisible: actionMetrics\.every\(\( action \) => action\.visible\s*\)/ );
	assert.match( probe, /actionsHaveTextRects: actionMetrics\.every\(\( action \) => action\.textRectCount > 0\s*\)/ );
	assert.match( probe, /rect\.left >= box\.left - 1 &&\s*rect\.right <= box\.right \+ 1 &&\s*rect\.top >= box\.top - 1 &&\s*rect\.bottom <= box\.bottom \+ 1/ );
	assert.match( assertMetrics, /result\.textResize200\.actionCount === 3/ );
	assert.match( assertMetrics, /result\.textResize200\.actionCount === DIGEST_EXPECTATIONS\.wcusActions\.length/ );
	assert.match( assertMetrics, /result\.textResize200\.actionsVisible/ );
	assert.match( assertMetrics, /result\.textResize200\.actionsHaveTextRects/ );
	assert.match( assertMetrics, /result\.textResize200\.actionsContained/ );
} );

test( 'default recruiter source acceptance pins the complete shared WCUS presentation', () => {
	const sourceContracts = sourceBetween(
		readRecruiterVerifier(),
		'function verifySourceContracts',
		'function verifyStackedLedgerLabels'
	);
	const defaultBranch = sourceBetween(
		sourceContracts,
		'} else {',
		'\n\t}\n\tfor ( const contract of ['
	);
	const defaultContract = /assertRuleDeclarations\( pageCss, \{\s*selector: '\.hp-wcus-callout',\s*declarations: \{([\s\S]*?)\r?\n\s*\},\r?\n\s*\} \);/.exec( defaultBranch );

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

test( 'both default Digest source branches apply the shared accepted-action topology', () => {
	for ( const verifier of [
		'verify-job-placement-pages.js',
		'verify-prominent-actions.js',
	] ) {
		const source = fs.readFileSync( path.join( themeRoot, 'scripts', verifier ), 'utf8' );
		const sourceContracts = sourceBetween(
			source,
			'function verifySourceContracts',
			verifier === 'verify-job-placement-pages.js'
				? 'function verifyStackedLedgerLabels'
				: 'function wait'
		);

		assert.match(
			source,
			/const \{[\s\S]*DIGEST_ACCEPTED_ACTION_CONTRACTS[\s\S]*\} = require\( '\.\/lib\/job-placement-page-style-contracts' \);/,
			`${ verifier } must import the shared accepted-action topology.`
		);
		assert.match(
			sourceContracts,
			/\} else \{\s*for \( const contract of DIGEST_ACCEPTED_ACTION_CONTRACTS \) \{\s*assertRuleDeclarations\( pageCss, contract \);\s*\}/,
			`${ verifier } default branch must apply every shared accepted-action contract.`
		);
	}
} );

test( '390px evidence must clear the taller metadata cell', () => {
	const assertion = sourceBetween(
		sourceBetween(
			readRecruiterVerifier(),
			'function assertPageMetrics',
			'async function inspectDisclosures'
		),
		'if ( viewport.width === 390 )',
		'if ( viewport.width === 320 )'
	);

	assert.match(
		assertion,
		/Math\.max\( result\.evidenceRecord\.title\.bottom, result\.evidenceRecord\.state\.bottom \) - 1/
	);
	assert.doesNotMatch( assertion, /Math\.min\(/ );
} );
