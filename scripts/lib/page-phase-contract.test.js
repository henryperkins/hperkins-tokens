const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { spawnSync } = require( 'node:child_process' );

const { DIGEST_OPENING_CONTRACTS } = require( './job-placement-page-style-contracts' );
const { deriveAboutActionContract, selectAboutSource, selectDigestSource } = require( './page-phase-contract' );

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

test( 'derives prominent-action counts for legacy, proof-first, v2, and v3 About bodies', () => {
	assert.deepEqual( deriveAboutActionContract( '<div class="hp-about-legacy"></div>' ), {
		phase: 'legacy',
		railCount: 1,
		panelCount: 0,
	} );
	assert.deepEqual( deriveAboutActionContract( '<nav class="hp-about-nav"></nav>' ), {
		phase: 'proof-first',
		railCount: 2,
		panelCount: 1,
	} );
	assert.deepEqual( deriveAboutActionContract( '<div class="hp-about-resume hp-about-nav"></div>' ), {
		phase: 'v2',
		railCount: 1,
		panelCount: 1,
	} );
	assert.deepEqual( deriveAboutActionContract( '<div class="hp-about-resume hp-about-resume-v3"></div>' ), {
		phase: 'v3',
		railCount: 2,
		panelCount: 1,
	} );
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

test( 'rendered recruiter probes pin the dossier as the only Digest shape', () => {
	const recruiter = fs.readFileSync(
		path.join( themeRoot, 'scripts', 'verify-job-placement-pages.js' ),
		'utf8'
	);
	// The Digest redesign was promoted on 2026-08-19, so candidate and accepted
	// snapshot now hold the same dossier and the shape is asserted for whichever
	// one --drafts selects. Nothing may reintroduce a second expected shape.
	assert.match( recruiter, /deriveDigestExpectations\( read\( DIGEST_SOURCE \) \)/ );
	assert.doesNotMatch( recruiter, /requireEventFirst|eventFirst/ );
	assert.match( recruiter, /document\.querySelector\('main \.hp-wcus-callout'\)/ );
	assert.match( recruiter, /primaryRail\.closest\('\.hp-wcus-callout'\)/ );
	assert.doesNotMatch( recruiter, /hero\?\.querySelector\('\.hp-wcus-callout'\)/ );
	assert.match( recruiter, /documentHeight/ );
	assert.match( recruiter, /DIGEST_HEIGHT_BUDGETS/ );
	// The dossier puts the hero first so the H1 opens the outline, then the
	// event plate, then the numbered argument.
	assert.match( recruiter, /'hero\|event\|why'/ );
	assert.doesNotMatch( recruiter, /'event\|hero\|brief'/ );
	// Two legal shapes now, not one: the accepted mirror still publishes the
	// event plate and the reviewed candidate has retired it. Both are derived
	// from the selected body, never from a flag.
	assert.match( recruiter, /'hero\|why'/ );
	assert.match( recruiter, /const hasEvent = eventIndex !== -1;/ );
	assert.doesNotMatch( recruiter, /requireEvent|--retired|--no-event/ );
	assert.match( recruiter, /result\.dossier\.registerVisibleRows === 12/ );
	assert.match( recruiter, /zoom-200-from-1024/ );

	const prominent = fs.readFileSync(
		path.join( themeRoot, 'scripts', 'verify-prominent-actions.js' ),
		'utf8'
	);
	assert.match( prominent, /\.wp-block-buttons\.hp-action-rail/ );
	assert.match( prominent, /\.hp-action-rail:not\(\.wp-block-buttons\)/ );
} );

test( 'progressive probes cover every ledger and both router history directions', () => {
	const recruiter = readRecruiterVerifier();
	const scenarios = sourceBetween(
		recruiter,
		'async function inspectProgressiveEnhancementFallbacks',
		'function assertProgressiveEnhancementFallbacks'
	);
	const assertions = sourceBetween(
		recruiter,
		'function assertProgressiveEnhancementFallbacks',
		'async function withChrome'
	);

	for ( const scenario of [
		'digestNoJs',
		'appendixNoJs',
		'digestFailClosed',
		'keywordFailClosed',
		'marketFailClosed',
		'routerRemount',
		'historyRemount',
	] ) {
		assert.match( scenarios, new RegExp( `const ${ scenario } =` ) );
		assert.match( assertions, new RegExp( `result\\.${ scenario }` ) );
	}

	const pushRemount = sourceBetween( scenarios, "{ name: 'the router-remount check' }", 'const historyRemount' );
	assert(
		pushRemount.indexOf( "history.pushState({}, '', location.pathname + '?hp-remount=1')" ) <
			pushRemount.indexOf( 'root.replaceWith(replacement)' ),
		'The push remount must replace roots only after the immediate pushState mount has run.'
	);
	assert.match( scenarios, /history\.back\(\)/ );
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
		'async function inspectLedgers'
	);

	assert.match(
		qualifier,
		/return page\.name === 'digest' &&\s*viewport\.width === 1024 &&\s*! viewport\.zoomPercent;/
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

test( 'Digest text resize proof requires the candidate actions to stay visible with nonempty four-edge-contained text', () => {
	const recruiter = readRecruiterVerifier();
	const probe = sourceBetween(
		recruiter,
		'async function inspectDigestTextResize',
		'function assertActions'
	);
	const assertMetrics = sourceBetween(
		recruiter,
		'function assertPageMetrics',
		'async function inspectLedgers'
	);

	assert.match( probe, /actionCount: actions\.length/ );
	assert.match( probe, /actionsVisible: actionMetrics\.every\(\( action \) => action\.visible\s*\)/ );
	assert.match( probe, /actionsHaveTextRects: actionMetrics\.every\(\( action \) => action\.textRectCount > 0\s*\)/ );
	assert.match( probe, /rect\.left >= box\.left - 1 &&\s*rect\.right <= box\.right \+ 1 &&\s*rect\.top >= box\.top - 1 &&\s*rect\.bottom <= box\.bottom \+ 1/ );
	assert.match( assertMetrics, /result\.textResize200\.actionCount === 1/ );
	// The 200% reflow proof measures the first-screen rail, which survives the
	// event retirement by moving into the hero. Pinning it to the derived
	// primary-action count — and pinning the probe's fallback target — is what
	// stops the accessibility proof from silently losing its subject when the
	// event plate is retired.
	assert.match( assertMetrics, /result\.textResize200\.actionCount === DIGEST_EXPECTATIONS\.primaryActions\.length/ );
	assert.match( probe, /document\.querySelector\('\.hp-digest__hero \.wp-block-buttons\.hp-action-rail'\)/ );
	assert.match( assertMetrics, /result\.textResize200\.actionsVisible/ );
	assert.match( assertMetrics, /result\.textResize200\.actionsHaveTextRects/ );
	assert.match( assertMetrics, /result\.textResize200\.actionsContained/ );
} );

test( 'the shared WCUS plate presentation stays pinned after the phase retirement', () => {
	// Retiring the hero-contained panel removed the branch that used to pin the
	// base .hp-wcus-callout rule inline. The contract moved into the shared
	// module so the declarations the --event-first modifier builds on — and
	// overrides — cannot silently disappear with it.
	const generic = DIGEST_OPENING_CONTRACTS.filter(
		( contract ) => contract.selector === '.hp-wcus-callout' && ! contract.atContext
	);

	assert.equal( generic.length, 1, 'The opening contracts must own exactly one generic WCUS callout rule.' );
	assert.deepEqual( generic[ 0 ].declarations, {
		'--hp-plate-pad': 'var(--wp--preset--spacing--6)',
		'margin-block-start': 'var(--wp--preset--spacing--6)',
		padding: 'var(--hp-plate-pad)',
		'border-inline-start': '0.25rem solid var(--wp--preset--color--gold-600)',
		background: 'color-mix(in srgb, var(--wp--preset--color--parchment-100) 88%, var(--wp--preset--color--gold-100))',
	} );

	// Neither recruiter verifier may keep a second, retired Digest topology.
	for ( const verifier of [ 'verify-job-placement-pages.js', 'verify-prominent-actions.js' ] ) {
		const source = fs.readFileSync( path.join( themeRoot, 'scripts', verifier ), 'utf8' );
		assert.doesNotMatch(
			source,
			/DIGEST_ACCEPTED_ACTION_CONTRACTS/,
			`${ verifier } still applies the retired accepted-action topology.`
		);
	}
} );

test( 'Digest evidence uses the shared stacked ledger anatomy below 782px', () => {
	const assertion = sourceBetween(
		readRecruiterVerifier(),
		'// The evidence register becomes the same labelled record anatomy',
		'assert( result.proofItems.length'
	);

	assert.match( assertion, /if \( viewport\.width < 782 \)/ );
	assert.match( assertion, /const evidenceLedger = result\.ledgerLayouts\.find/ );
	assert.match(
		assertion,
		/evidenceLedger\.headers\.join\( '\|' \) === 'Artifact\|State\|Direct evidence'/
	);
	assert.match( assertion, /evidenceLedger\.pseudoLabels\.join\( '\|' \) === evidenceLedger\.headers\.join\( '\|' \)/ );
	assert.doesNotMatch( assertion, /evidenceRecord/ );
	assert.doesNotMatch( assertion, /viewport\.width === 390/ );
} );

test( 'rendered ledger checks require painted mobile labels and visible standing text', () => {
	const source = readRecruiterVerifier();

	assert.match( source, /pseudoLabelsRendered: cells\.map\(pseudoLabelRendered\)/ );
	assert.match( source, /ledger\.pseudoLabelsRendered\.every\( Boolean \)/ );
	assert.match( source, /const isReadable = \(element\) =>/ );
	assert.match( source, /isReadable\(cell\)/ );
	assert.match( source, /ledger\.visibleStandings === ledger\.visibleRows/ );
} );

test( 'the verifier skill names the current candidate matrices and opening states', () => {
	const recruiter = readRecruiterVerifier();
	const skill = fs.readFileSync(
		path.join( themeRoot, '.claude', 'skills', 'verifiers', 'SKILL.md' ),
		'utf8'
	);
	const widths = ( startMarker, endMarker ) => [ ...sourceBetween( recruiter, startMarker, endMarker )
		.matchAll( /\bwidth: (\d+)/g ) ]
		.map( ( match ) => Number( match[ 1 ] ) );
	const digestWidths = widths( 'const DIGEST_VIEWPORTS = [', 'const DIGEST_HEIGHT_BUDGETS' );
	const appendixWidths = widths( 'const APPENDIX_VIEWPORTS = [', 'const PAGES = [' );
	const ledgers = sourceBetween( recruiter, 'const APPENDIX_LEDGERS = [', 'async function inspectLedgers' );

	assert( digestWidths.includes( 940 ), 'The Digest rendered matrix must exercise the exact masthead breakpoint.' );
	assert(
		skill.includes( `Digest ${ digestWidths.join( '/' ) }; appendix ${ appendixWidths.join( '/' ) }` ),
		'The verifier skill viewport matrices have drifted from the executable verifier.'
	);
	assert.match( ledgers, /name: 'keyword ledger'[\s\S]*?defaultState: 'demonstrated'/ );
	assert.match( ledgers, /name: 'market screen'[\s\S]*?defaultState: 'all'/ );
	assert.match(
		skill,
		/Digest register complete by default; appendix keyword ledger Demonstrated-first and market screen complete before filtering/
	);
} );
