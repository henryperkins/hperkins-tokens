#!/usr/bin/env node
/**
 * Dependency-free rendered contract for the recruiter page and its appendix.
 *
 * Chrome is driven directly over the DevTools Protocol. The check deliberately
 * targets the real rendered routes: source markup alone cannot prove heading
 * order after WordPress filters, native details keyboard behavior, fragment
 * ownership, computed focus treatment, or narrow-screen containment.
 */
const { spawn } = require( 'node:child_process' );
const fs = require( 'node:fs' );
const fsPromises = require( 'node:fs/promises' );
const os = require( 'node:os' );
const path = require( 'node:path' );

const { findHeadings, findLinks, extractExactText, parseTopLevelBlocks } = require( './lib/about-page-contract' );
const {
	APPENDIX_LEDGER_CONTRACTS,
	DIGEST_COMPACT_CONTRACTS,
	DIGEST_LOWER_CONTRACTS,
	DIGEST_OPENING_CONTRACTS,
	PLACEMENT_CHASSIS_CONTRACTS,
	PLACEMENT_LEDGER_LABEL_CONTRACTS,
} = require( './lib/job-placement-page-style-contracts' );
const { getClassCount } = require( './lib/page-markup-contract' );
const {
	assertKnownOptions,
	selectDigestSource,
	selectPlacementMethodSource,
} = require( './lib/page-phase-contract' );
const { getOrigin, stripWpcomCacheVersionFromRenderedHref } = require( './lib/site-url' );
const { assertRuleDeclarations } = require( './lib/style-coverage' );

const ROOT = path.join( __dirname, '..' );
const ARGV = process.argv.slice( 2 );
assertKnownOptions( ARGV, [ '--source-only', '--drafts' ] );
const ORIGIN = getOrigin();
const SOURCE_ONLY = ARGV.includes( '--source-only' );
const DIGEST_SOURCE = selectDigestSource( ARGV );
const APPENDIX_SOURCE = selectPlacementMethodSource( ARGV );
// Studio's single-process preview can take longer than the generic CDP request
// ceiling while WordPress warms. DOM/style readiness still has its own bounded
// polling below; this only prevents Page.navigate from expiring first.
const NAVIGATION_RESPONSE_TIMEOUT_MS = 30000;

function read( sourcePath ) {
	const resolved = path.isAbsolute( sourcePath ) ? sourcePath : path.join( ROOT, sourcePath );
	return fs.readFileSync( resolved, 'utf8' ).replace( /\r\n/g, '\n' );
}

function findWpBlocksByClass( html, blockName, className ) {
	const blocks = [];
	const pattern = new RegExp(
		`<!-- wp:${ blockName }(?: ({[^\n]*}))? -->([\\s\\S]*?)<!-- \/wp:${ blockName } -->`,
		'g'
	);
	for ( const match of html.matchAll( pattern ) ) {
		const attrs = match[ 1 ] ? JSON.parse( match[ 1 ] ) : {};
		if ( ( attrs.className || '' ).split( /\s+/ ).includes( className ) ) {
			blocks.push( match[ 2 ] );
		}
	}
	return blocks;
}

function deriveDigestExpectations( html ) {
	const headings = findHeadings( html, 'selected Digest body' );
	const h1 = headings.find( ( heading ) => heading.level === 1 );
	const actionRails = findWpBlocksByClass( html, 'buttons', 'hp-action-rail' );
	const eyebrow = /<p\b[^>]*class="[^"]*\bhp-page-hero__eyebrow\b[^"]*"[^>]*>([\s\S]*?)<\/p>/g;
	const eyebrows = [ ...html.matchAll( eyebrow ) ];
	const wcusActions = findWpBlocksByClass( html, 'buttons', 'hp-wcus-callout__actions' )[ 0 ] || null;
	const rootCauseSection = /<section\b[^>]*\bid="root-cause-investigation"[^>]*>([\s\S]*?)<\/section>/i.exec( html );
	const topLevelBlocks = parseTopLevelBlocks( html );
	const hasBlockClass = ( block, className ) =>
		( block.attrs.className || '' ).split( /\s+/ ).includes( className );
	const eventIndex = topLevelBlocks.findIndex( ( block ) => hasBlockClass( block, 'hp-wcus-callout' ) );
	const heroIndex = topLevelBlocks.findIndex( ( block ) => hasBlockClass( block, 'hp-digest__hero' ) );
	const whyIndex = topLevelBlocks.findIndex( ( block ) => block.attrs.anchor === 'why-support-engineer-now' );
	const supportBriefIndex = topLevelBlocks.findIndex( ( block ) => block.attrs.anchor === 'support-brief' );
	const briefProofs = findWpBlocksByClass( html, 'list', 'hp-digest-brief__proofs' )[ 0 ] || null;
	// The accepted mirror still carries the event plate while the reviewed
	// candidate has retired it, so the shape is derived from the selected body
	// rather than flagged. The first-screen rail survives the retirement — it
	// moves from the plate into the hero — so it is resolved from whichever
	// container owns it here instead of from the plate's own class.
	const hasEvent = eventIndex !== -1;
	const primaryRail = hasEvent
		? findWpBlocksByClass( html, 'buttons', 'hp-digest__primary-actions' )[ 0 ]
		: findWpBlocksByClass( topLevelBlocks[ heroIndex ]?.outer || '', 'buttons', 'hp-action-rail' )[ 0 ];

	assert( h1, 'Selected Digest body has no H1.' );
	assert( primaryRail, 'Selected Digest body has no primary action rail.' );
	assert( actionRails.length >= 2, 'Selected Digest body has no closing action rail.' );
	assert( eyebrows.length > 0, 'Selected Digest body has no closing eyebrow.' );

	const event = topLevelBlocks[ eventIndex ];
	// The dossier opens on its own H1 and hands the WordCamp invitation the
	// second slot, so the event never introduces a heading ahead of the
	// outline. The numbered argument starts immediately after it.
	assert( heroIndex === 0, 'Selected Digest body must begin with the hero, so the H1 opens the outline.' );
	assert( whyIndex === ( hasEvent ? 2 : 1 ), 'The first numbered section must immediately follow the opening.' );
	assert( topLevelBlocks.length === ( hasEvent ? 10 : 9 ), `The selected dossier must contain ${ hasEvent ? 'ten' : 'nine' } top-level blocks.` );
	assert( supportBriefIndex === -1, 'The selected dossier must not retain the retired recruiter brief.' );
	assert(
		getClassCount( topLevelBlocks[ heroIndex ].outer, 'hp-wcus-callout' ) === 0,
		'Selected Digest hero must not contain the WordCamp aside.'
	);
	if ( hasEvent ) {
		assert( eventIndex === 1, 'Selected Digest WordCamp aside must immediately follow the hero.' );
		assert( event.attrs.tagName === 'aside', 'Selected Digest WordCamp Group must serialize as an aside.' );
		assert(
			event.attrs.ariaLabel === 'I’ll be at WordCamp US.',
			'Selected Digest WordCamp aside has the wrong accessible name.'
		);
		assert(
			event.attrs.anchor === 'wordcamp-us-2026',
			'Selected Digest WordCamp aside must own the wordcamp-us-2026 fragment.'
		);
		assert(
			getClassCount( event.outer, 'hp-digest__primary-actions' ) === 1,
			'Selected Digest WordCamp aside must own the first-screen action rail.'
		);
		assert(
			getClassCount( topLevelBlocks[ heroIndex ].outer, 'hp-digest__primary-actions' ) === 0,
			'Selected Digest hero must not repeat event actions.'
		);
		assert( wcusActions, 'Selected Digest WordCamp aside has no .hp-wcus-callout__actions.' );
	} else {
		// Retiring the plate must not cost the dossier its only above-the-fold
		// action; the rail moves into the hero and keeps its 44px target there.
		assert(
			getClassCount( topLevelBlocks[ heroIndex ].outer, 'hp-action-rail' ) === 1,
			'With the WordCamp aside retired, the Digest hero must own the first-screen action rail.'
		);
	}
	assert( ! briefProofs, 'Selected Digest dossier must not retain the recruiter brief proof list.' );
	assert( rootCauseSection, 'Selected Digest dossier has no #root-cause-investigation section.' );
	assert(
		[ ...html.matchAll( /<p class="hp-digest-kicker">/g ) ].length === 7,
		'Selected Digest dossier must number all seven sections.'
	);

	const proofLabels = rootCauseSection
		? [ ...rootCauseSection[ 1 ].matchAll( /<div\b[^>]*\bhp-debug-proof__item\b[^>]*>[\s\S]*?<dt\b[^>]*>[\s\S]*?<p\b[^>]*>([^<]+)<\/p>[\s\S]*?<\/dt>/gi ) ]
			.map( ( match ) => match[ 1 ].trim() )
		: [];

	return {
		h1: h1.text,
		hasEvent,
		primaryActions: findLinks( primaryRail, 'selected Digest primary actions' ),
		closingActions: findLinks( actionRails.at( -1 ), 'selected Digest closing actions' ),
		closingEyebrow: extractExactText( eyebrows.at( -1 )[ 1 ], { label: 'selected Digest closing eyebrow' } ),
		closingHeading: headings.filter( ( heading ) => heading.level === 2 ).at( -1 ).text,
		wcusActions: wcusActions ? findLinks( wcusActions, 'selected Digest WCUS actions' ) : [],
		briefProofs: briefProofs ? findLinks( briefProofs, 'selected Digest proof list' ) : [],
		proofLabels,
	};
}

const DIGEST_EXPECTATIONS = deriveDigestExpectations( read( DIGEST_SOURCE ) );

const DIGEST_VIEWPORTS = [
	{ name: 'desktop-1440', width: 1440, height: 1000, mobile: false },
	{ name: 'desktop-1024', width: 1024, height: 1000, mobile: false },
	{ name: 'compact-upper-1023', width: 1023, height: 1000, mobile: false },
	{ name: 'masthead-break-940', width: 940, height: 1000, mobile: false },
	{ name: 'event-wide-782', width: 782, height: 1000, mobile: false },
	{ name: 'event-linear-781', width: 781, height: 1000, mobile: true },
	{ name: 'tablet-768', width: 768, height: 1000, mobile: true },
	{ name: 'phone-boundary-600', width: 600, height: 1000, mobile: true },
	{ name: 'mobile-390', width: 390, height: 1000, mobile: true },
	{ name: 'mobile-320', width: 320, height: 1000, mobile: true },
	{ name: 'zoom-200-from-1024', width: 512, height: 500, mobile: false, zoomPercent: 200 },
];

// The previous ceilings were half the accepted snapshot's measured height,
// because their job was to enforce a distillation. The dossier restores the
// full argument, so these are no longer a target — they are a runaway guard.
// Each is 2.2x the old half-budget, i.e. about 10% above the accepted
// production page's own measured height at that width. That leaves room for
// the kickers, the gap callout, the artifact row, and the filter row while
// still failing if a section is duplicated or a table doubles.
//
// Measured, not derived: taken from the isolated WordPress candidate renderer
// on 2026-08-24 after the placement-system round trip, then carried at +5%
// rounded up to the nearest 50px. The headroom absorbs font-metric and
// image-decode jitter while staying far below the cost of a duplicated section
// or a doubled table, which is what this budget exists to catch.
const DIGEST_HEIGHT_BUDGETS = {
	'desktop-1440': 9100,
	'desktop-1024': 9300,
	'compact-upper-1023': 9300,
	'masthead-break-940': 9450,
	'event-wide-782': 10200,
	'event-linear-781': 12100,
	'tablet-768': 12050,
	'phone-boundary-600': 12900,
	'mobile-390': 15250,
	'mobile-320': 17950,
};

const APPENDIX_VIEWPORTS = [
	{ name: 'desktop-1440', width: 1440, height: 1000, mobile: false },
	{ name: 'desktop-1024', width: 1024, height: 1000, mobile: false },
	{ name: 'masthead-break-940', width: 940, height: 1000, mobile: false },
	{ name: 'ledger-table-782', width: 782, height: 1000, mobile: false },
	{ name: 'ledger-stacked-781', width: 781, height: 1000, mobile: true },
	{ name: 'tablet-768', width: 768, height: 1000, mobile: true },
	{ name: 'filter-wrap-600', width: 600, height: 1000, mobile: true },
	{ name: 'filter-snap-599', width: 599, height: 1000, mobile: true },
	{ name: 'mobile-390', width: 390, height: 1000, mobile: true },
	{ name: 'mobile-320', width: 320, height: 1000, mobile: true },
	{ name: 'zoom-200-from-1024', width: 512, height: 500, mobile: false, zoomPercent: 200 },
];

const PAGES = [
	{
		name: 'digest',
		route: '/job-placement-digest/',
		h1: DIGEST_EXPECTATIONS.h1,
		viewports: DIGEST_VIEWPORTS,
	},
	{
		name: 'appendix',
		route: '/placement-method-and-evidence/',
		h1: 'Placement Method and Evidence',
		viewports: APPENDIX_VIEWPORTS,
	},
];

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function verifySourceContracts() {
	// Component CSS is style.css plus the conditionally loaded bundles under
	// assets/c/. The disclosure and reduced-motion rules below moved into the
	// interactive bundle in 0.3.57; the contract is that they exist in the
	// theme's component layer, not that they sit in one particular file.
	const componentCss = [
		'style.css',
		'assets/c/evidence.css',
		'assets/c/interactive.css',
		'assets/c/longform.css',
	]
		.map( ( relativePath ) => read( relativePath ) )
		.join( '\n' );
	const pageCss = read( 'assets/imladris-pages.css' );

	for ( const expected of [
		'.hp-disclosure > summary,',
		'min-block-size: var(--hp-touch-min);',
		'cursor: pointer;',
		'.hp-disclosure > summary:focus-visible,',
		'outline: 3px solid var(--wp--preset--color--gold-700);',
		'overflow-wrap: anywhere;',
		'word-break: break-word;',
		'@media (prefers-reduced-motion: reduce)',
		'transition-duration: 0.01ms !important;',
	] ) {
		assert( componentCss.includes( expected ), `Theme component CSS (style.css + assets/c/*.css) is missing recruiter-page contract: ${ expected }` );
	}

	for ( const expected of [
		'.hp-digest__primary-actions.hp-action-rail {',
		'.hp-evidence-table table {',
		'min-inline-size: 50rem;',
		'.hp-keyword-table table {',
		'min-inline-size: 48rem;',
	] ) {
		assert( pageCss.includes( expected ), `assets/imladris-pages.css is missing recruiter-page contract: ${ expected }` );
	}
	for ( const contract of [
		...DIGEST_OPENING_CONTRACTS,
		...DIGEST_COMPACT_CONTRACTS,
		...DIGEST_LOWER_CONTRACTS,
	] ) {
		assertRuleDeclarations( pageCss, contract );
	}
	for ( const contract of [
		{
			selector: '.hp-debug-proof__grid',
			declarations: {
				display: 'grid',
				'grid-template-columns': 'repeat(2, minmax(0, 1fr))',
				gap: 'var(--wp--preset--spacing--4)',
				margin: 'var(--wp--preset--spacing--5) 0 0',
			},
		},
		{
			selector: '.hp-debug-proof__item',
			declarations: {
				'min-inline-size': '0',
				'padding-block-start': 'var(--wp--preset--spacing--3)',
				'border-block-start': '2px solid var(--wp--preset--color--river-500)',
			},
		},
		{ selector: '.hp-debug-proof__grid > .hp-debug-proof__item', declarations: { 'margin-block': '0' } },
		{
			selector: '.hp-debug-proof__item dt',
			declarations: {
				color: 'var(--wp--preset--color--green-700)',
				'font-family': 'var(--wp--preset--font-family--mono)',
				'font-size': 'var(--wp--preset--font-size--xs)',
				'font-weight': '700',
				'letter-spacing': '0.06em',
				'text-transform': 'uppercase',
			},
		},
		{ selector: '.hp-debug-proof__item dd', declarations: { margin: 'var(--wp--preset--spacing--2) 0 0', 'overflow-wrap': 'anywhere' } },
		{ selector: '.hp-debug-proof__item :is(dt, dd) > p', declarations: { margin: '0' } },
		{ selector: '.hp-debug-proof__grid', atContext: '@media (max-width: 781px)', declarations: { 'grid-template-columns': 'minmax(0, 1fr)' } },
	] ) {
		assertRuleDeclarations( pageCss, contract );
	}
	if ( DIGEST_EXPECTATIONS.hasEvent ) {
		// The dossier's event plate carries one action — the conversation. The
		// résumé and evidence routes belong to the closing invitation, where the
		// reader has already been given the argument.
		assert(
			DIGEST_EXPECTATIONS.wcusActions.length === 1,
			`Selected Digest WCUS callout exposes ${ DIGEST_EXPECTATIONS.wcusActions.length } actions; expected one.`
		);
	}
	// The debugging grid's proof order describes the root-cause section, not the
	// event plate. It used to sit inside the plate's guard, so retiring the
	// event would have silently stopped asserting it.
	assert(
		DIGEST_EXPECTATIONS.proofLabels.join( '|' ) === 'Signal|Diagnosis|Constraint|Result',
		`Selected Digest proof order is ${ DIGEST_EXPECTATIONS.proofLabels.join( ', ' ) }; expected Signal, Diagnosis, Constraint, Result.`
	);
	// The first-screen rail exists in both shapes, so its single action is
	// pinned outside the event branch.
	assert(
		DIGEST_EXPECTATIONS.primaryActions.length === 1,
		`Selected Digest first-screen rail exposes ${ DIGEST_EXPECTATIONS.primaryActions.length } actions; expected one.`
	);

	// The appendix ledgers are filtered by the same script as the register, so
	// the declarations that make filtering safe are pinned the same way.
	for ( const contract of APPENDIX_LEDGER_CONTRACTS ) {
		assertRuleDeclarations( pageCss, contract );
	}
	for ( const contract of PLACEMENT_CHASSIS_CONTRACTS ) {
		assertRuleDeclarations( pageCss, contract );
	}

	verifyStackedLedgerLabels( pageCss );

	console.log( 'recruiter rendered-page source contracts verified' );
}

/** Column headers of every `<figure>` carrying `className`, in document order. */
function ledgerHeaders( html, className ) {
	const figures = [];
	const figure = new RegExp( `<figure[^>]*\\b${ className }\\b[^>]*>([\\s\\S]*?)</figure>`, 'g' );
	let match;
	while ( ( match = figure.exec( html ) ) !== null ) {
		const thead = /<thead>([\s\S]*?)<\/thead>/.exec( match[1] );
		figures.push(
			thead
				? Array.from( thead[1].matchAll( /<th[^>]*>([\s\S]*?)<\/th>/g ) ).map( ( cell ) =>
						cell[1].replace( /<[^>]+>/g, '' ).replace( /\s+/g, ' ' ).trim()
				  )
				: []
		);
	}
	return figures;
}

/**
 * Below 782px all three placement ledgers become labelled records. Core/table
 * cannot serialize arbitrary cell data attributes, so the real header remains
 * in the accessibility tree and a mutation-pinned CSS contract reproduces its
 * fixed columns visually. Every authored cell stays schema-safe.
 */
function verifyStackedLedgerLabels() {
	const digest = read( DIGEST_SOURCE );
	const appendix = read( APPENDIX_SOURCE );
	const ledgers = [
		{ source: digest, table: 'hp-evidence-table', expectedRows: 11 },
		{ source: appendix, table: 'hp-keyword-table', expectedRows: 34 },
		{ source: appendix, table: 'hp-market-table', expectedRows: 20 },
	];

	for ( const { source, table, expectedRows } of ledgers ) {
		const headers = ledgerHeaders( source, table );
		assert( headers.length === 1 && headers[ 0 ].length > 0, `${ table } must expose one real header row.` );
		const figure = new RegExp( `<figure[^>]*\\b${ table }\\b[^>]*>([\\s\\S]*?)</figure>`, 'i' ).exec( source );
		const body = figure && /<tbody>([\s\S]*?)<\/tbody>/i.exec( figure[ 1 ] );
		assert( body, `${ table } must expose one tbody.` );
		const rows = [ ...body[ 1 ].matchAll( /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi ) ];
		assert( rows.length === expectedRows, `${ table } carries ${ rows.length } labelled rows; expected ${ expectedRows}.` );
		for ( const [ rowIndex, row ] of rows.entries() ) {
			const cells = [ ...row[ 1 ].matchAll( /<(th|td)\b([^>]*)>/gi ) ];
			assert(
				cells.length === headers[ 0 ].length && cells[ 0 ][ 1 ].toLowerCase() === 'th' && cells.slice( 1 ).every( ( cell ) => cell[ 1 ].toLowerCase() === 'td' ),
				`${ table } row ${ rowIndex + 1 } must keep one row header and ${ headers[ 0 ].length - 1 } data cells.`
			);
			assert( cells.every( ( cell ) => ! /\bdata-label\s*=/.test( cell[ 2 ] ) ), `${ table } row ${ rowIndex + 1 } contains a non-serializable data-label attribute.` );
		}
		const cssLabels = PLACEMENT_LEDGER_LABEL_CONTRACTS
			.filter( ( contract ) => contract.selector.includes( table ) )
			.map( ( contract ) => contract.declarations.content.slice( 1, -1 ) );
		assert(
			JSON.stringify( cssLabels ) === JSON.stringify( headers[ 0 ] ),
			`${ table } phone labels ${ JSON.stringify( cssLabels ) }; expected source headers ${ JSON.stringify( headers[ 0 ] ) }.`
		);
	}
}

function wait( milliseconds ) {
	return new Promise( ( resolve ) => setTimeout( resolve, milliseconds ) );
}

async function rmRetry( target ) {
	let lastError;
	for ( let attempt = 0; attempt < 8; attempt++ ) {
		try {
			await fsPromises.rm( target, { recursive: true, force: true } );
			return;
		} catch ( error ) {
			lastError = error;
			await wait( 250 );
		}
	}
	throw lastError;
}

function resolveChrome() {
	let candidate;
	if ( process.env.CHROME_BIN ) {
		candidate = path.resolve( process.env.CHROME_BIN );
	} else if ( process.platform !== 'win32' ) {
		candidate = '/usr/bin/google-chrome';
	} else {
		const candidates = [
			process.env.PROGRAMFILES && path.join( process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe' ),
			process.env[ 'PROGRAMFILES(X86)' ] && path.join( process.env[ 'PROGRAMFILES(X86)' ], 'Google', 'Chrome', 'Application', 'chrome.exe' ),
			process.env.LOCALAPPDATA && path.join( process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe' ),
		].filter( Boolean );
		candidate = candidates.find( ( value ) => fs.existsSync( value ) );
	}

	assert(
		candidate && fs.existsSync( candidate ) && fs.statSync( candidate ).isFile(),
		'Chrome was not found. Set CHROME_BIN to a Chrome or Chromium executable.'
	);
	return candidate;
}

async function waitForDevToolsUrl( chrome ) {
	let buffer = '';
	return new Promise( ( resolve, reject ) => {
		const timer = setTimeout(
			() => reject( new Error( 'Timed out waiting for Chrome DevTools URL.' ) ),
			10000
		);
		chrome.stderr.on( 'data', ( chunk ) => {
			buffer += chunk.toString();
			const match = buffer.match( /(ws:\/\/127\.0\.0\.1:\d+\/devtools\/browser\/[^\s]+)/ );
			if ( match ) {
				clearTimeout( timer );
				resolve( match[1] );
			}
		} );
		chrome.once( 'error', ( error ) => {
			clearTimeout( timer );
			reject( new Error( `Chrome failed to launch: ${ error.message }` ) );
		} );
		chrome.once( 'exit', ( code ) => {
			clearTimeout( timer );
			reject( new Error( `Chrome exited before DevTools was ready (code ${ code }).` ) );
		} );
	} );
}

function createCdpClient( wsUrl ) {
	if ( typeof WebSocket === 'undefined' ) {
		throw new Error( 'Global WebSocket is unavailable; run these browser contracts on Node 22 or newer.' );
	}
	const ws = new WebSocket( wsUrl );
	let nextId = 1;
	const pending = new Map();
	const listeners = new Map();

	ws.addEventListener( 'message', ( event ) => {
		const message = JSON.parse( event.data );
		if ( message.id && pending.has( message.id ) ) {
			const { resolve, reject } = pending.get( message.id );
			pending.delete( message.id );
			if ( message.error ) {
				reject( new Error( message.error.message ) );
			} else {
				resolve( message.result || {} );
			}
			return;
		}

		if ( message.method ) {
			const key = `${ message.sessionId || '' }:${ message.method }`;
			const callbacks = listeners.get( key ) || [];
			listeners.delete( key );
			callbacks.forEach( ( callback ) => callback( message.params || {} ) );
		}
	} );

	function send( method, params = {}, sessionId, timeout = 15000 ) {
		const id = nextId++;
		ws.send( JSON.stringify( { id, method, params, sessionId } ) );
		return new Promise( ( resolve, reject ) => {
			const timer = setTimeout( () => {
				pending.delete( id );
				reject( new Error( `Timed out waiting for ${ method } response.` ) );
			}, timeout );
			pending.set( id, {
				resolve: ( value ) => {
					clearTimeout( timer );
					resolve( value );
				},
				reject: ( error ) => {
					clearTimeout( timer );
					reject( error );
				},
			} );
		} );
	}

	function once( method, sessionId, timeout = 10000 ) {
		const key = `${ sessionId || '' }:${ method }`;
		return new Promise( ( resolve, reject ) => {
			const timer = setTimeout(
				() => reject( new Error( `Timed out waiting for ${ method }.` ) ),
				timeout
			);
			const callback = ( params ) => {
				clearTimeout( timer );
				resolve( params );
			};
			listeners.set( key, [ ...( listeners.get( key ) || [] ), callback ] );
		} );
	}

	return new Promise( ( resolve, reject ) => {
		ws.addEventListener( 'open', () => resolve( { send, once, close: () => ws.close() } ) );
		ws.addEventListener( 'error', reject );
	} );
}

async function evaluate( cdp, sessionId, expression ) {
	const result = await cdp.send( 'Runtime.evaluate', {
		expression,
		awaitPromise: true,
		returnByValue: true,
	}, sessionId );
	if ( result.exceptionDetails ) {
		throw new Error( result.exceptionDetails.exception?.description || 'Runtime evaluation failed.' );
	}
	return result.result.value;
}

async function waitForDocumentMain( cdp, sessionId, expectedUrl, timeout = 45000 ) {
	const expectedPath = new URL( expectedUrl ).pathname;
	const deadline = Date.now() + timeout;
	let lastDocumentUrl = '';

	while ( Date.now() < deadline ) {
		try {
			const { root } = await cdp.send( 'DOM.getDocument', { depth: 1, pierce: true }, sessionId );
			lastDocumentUrl = root?.documentURL || '';
			if ( lastDocumentUrl && new URL( lastDocumentUrl ).pathname === expectedPath ) {
				const { nodeId } = await cdp.send( 'DOM.querySelector', {
					nodeId: root.nodeId,
					selector: 'main .hp-placement-masthead',
				}, sessionId );
				const { nodeId: scriptNodeId } = await cdp.send( 'DOM.querySelector', {
					nodeId: root.nodeId,
					selector: 'script[src*="digest-register-filter.js"]',
				}, sessionId );
				if ( nodeId && scriptNodeId ) {
					return;
				}
			}
		} catch ( error ) {
			// Navigation can replace the document between DOM calls. Retry against
			// the new document until the requested route owns a real main landmark.
		}
		await wait( 100 );
	}

	throw new Error( `Timed out waiting for ${ expectedPath } DOM (last URL: ${ lastDocumentUrl || 'none' }).` );
}

async function waitForPlacementStyles( cdp, sessionId, timeout = 45000 ) {
	const deadline = Date.now() + timeout;
	let lastState = null;

	while ( Date.now() < deadline ) {
		try {
			lastState = await evaluate( cdp, sessionId, `(() => {
				const masthead = document.querySelector('.hp-placement-masthead');
				return {
					pageSheet: Array.from(document.styleSheets).some((sheet) => (sheet.href || '').includes('/assets/imladris-pages.css')),
					mastheadDisplay: masthead ? getComputedStyle(masthead).display : null,
				};
			})()` );
			if ( lastState?.pageSheet && lastState.mastheadDisplay === 'grid' ) {
				return;
			}
		} catch ( error ) {
			// The execution context can turn over during a redirect. Retry it.
		}
		await wait( 100 );
	}

	throw new Error( `Timed out waiting for placement styles: ${ JSON.stringify( lastState ) }.` );
}

async function pressKey( cdp, sessionId, key ) {
	const keys = {
		Enter: {
			key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13,
			nativeVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r',
		},
		Space: {
			key: ' ', code: 'Space', windowsVirtualKeyCode: 32,
			nativeVirtualKeyCode: 32, text: ' ', unmodifiedText: ' ',
		},
		Tab: { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 },
	};
	const value = keys[ key ];
	assert( value, `Unsupported key: ${ key }` );
	await cdp.send( 'Input.dispatchKeyEvent', { type: 'keyDown', ...value }, sessionId );
	await cdp.send( 'Input.dispatchKeyEvent', {
		type: 'keyUp',
		key: value.key,
		code: value.code,
		windowsVirtualKeyCode: value.windowsVirtualKeyCode,
		nativeVirtualKeyCode: value.nativeVirtualKeyCode,
	}, sessionId );
	await wait( 40 );
}

function shouldInspectDigestTextResize( page, viewport ) {
	return page.name === 'digest' &&
		viewport.width === 1024 &&
		! viewport.zoomPercent;
}

async function inspectDigestTextResize( cdp, sessionId ) {
	const previousRootFontSize = await evaluate(
		cdp,
		sessionId,
		'document.documentElement.style.fontSize'
	);
	try {
		await evaluate( cdp, sessionId, "document.documentElement.style.fontSize = '200%'" );
		await wait( 50 );
		return await evaluate( cdp, sessionId, `(() => {
			const root = document.documentElement;
			const rail = document.querySelector('.hp-wcus-callout__actions') ||
				document.querySelector('.hp-digest__hero .wp-block-buttons.hp-action-rail');
			const actions = Array.from(rail?.querySelectorAll('.wp-block-button__link') || []);
			const actionMetrics = actions.map((link) => {
				const box = link.getBoundingClientRect();
				const range = document.createRange();
				range.selectNodeContents(link);
				const textRects = Array.from(range.getClientRects());
				const style = getComputedStyle(link);
				return {
					visible: style.display !== 'none' &&
						style.visibility !== 'hidden' &&
						link.getClientRects().length > 0 &&
						box.width > 0 &&
						box.height > 0,
					textRectCount: textRects.length,
					contained: textRects.length > 0 && textRects.every((rect) =>
						rect.left >= box.left - 1 &&
						rect.right <= box.right + 1 &&
						rect.top >= box.top - 1 &&
						rect.bottom <= box.bottom + 1
					),
				};
			});
			return {
				clientWidth: root.clientWidth,
				scrollWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
				actionCount: actions.length,
				actionsVisible: actionMetrics.every(( action ) => action.visible),
				actionsHaveTextRects: actionMetrics.every(( action ) => action.textRectCount > 0),
				actionsContained: actionMetrics.every(( action ) => action.contained),
			};
		})()` );
	} finally {
		await evaluate(
			cdp,
			sessionId,
			`document.documentElement.style.fontSize = ${ JSON.stringify( previousRootFontSize ) }`
		);
	}
}

function assertActions( actual, expected, context, documentUrl ) {
	assert( actual.length === expected.length, `${ context } has ${ actual.length } actions; expected ${ expected.length }.` );
	for ( let index = 0; index < expected.length; index++ ) {
		const action = actual[ index ];
		const contract = expected[ index ];
		const renderedHref = stripWpcomCacheVersionFromRenderedHref( action.href, documentUrl );
		assert( action.text === contract.text, `${ context } action ${ index + 1 } is "${ action.text }"; expected "${ contract.text }".` );
		assert( renderedHref === contract.href, `${ context } "${ action.text }" points to ${ action.href}; expected ${ contract.href}.` );
		assert( action.height >= 44, `${ context } "${ action.text }" is ${ action.height}px high; expected at least 44px.` );
	}
}

function assertLinks( actual, expected, context, documentUrl ) {
	assert( actual.length === expected.length, `${ context } has ${ actual.length } links; expected ${ expected.length }.` );
	for ( let index = 0; index < expected.length; index++ ) {
		const link = actual[ index ];
		const contract = expected[ index ];
		const renderedHref = stripWpcomCacheVersionFromRenderedHref( link.href, documentUrl );
		assert( link.text === contract.text, `${ context } link ${ index + 1 } is "${ link.text }"; expected "${ contract.text }".` );
		assert( renderedHref === contract.href, `${ context } "${ link.text }" points to ${ link.href}; expected ${ contract.href}.` );
	}
}

function approximatelyEqual( actual, expected, tolerance = 1 ) {
	return Math.abs( actual - expected ) <= tolerance;
}

function assertPlacementGeometry( result, viewport, context ) {
	const expectedGutter = viewport.width >= 600 ? 32 : 16;
	const expectedScrollOffset = viewport.width >= 782 ? 84 : 72;
	assert( result.placementGeometry, `${ context } did not collect placement chassis geometry.` );
	const masthead = result.placementGeometry.masthead;

	assert( masthead?.root && masthead.main && masthead.side, `${ context } is missing placement masthead geometry.` );
	assert(
		approximatelyEqual( masthead.paddingLeft, expectedGutter ) &&
			approximatelyEqual( masthead.paddingRight, expectedGutter ),
		`${ context } masthead gutters are ${ masthead.paddingLeft }px/${ masthead.paddingRight }px; expected ${ expectedGutter }px.`
	);
	if ( viewport.width >= 940 ) {
		assert(
			masthead.main.right <= masthead.side.left + 1 && approximatelyEqual( masthead.main.top, masthead.side.top, 2 ),
			`${ context } does not render the masthead's main and reference panels as columns at the 940px breakpoint.`
		);
	} else {
		assert(
			masthead.side.top >= masthead.main.bottom - 1 &&
				approximatelyEqual( masthead.side.left, masthead.main.left, 2 ) &&
				approximatelyEqual( masthead.side.width, masthead.main.width, 2 ),
			`${ context } does not stack the masthead's reference panel below the main copy.`
		);
	}

	assert( result.placementGeometry.textSections.length > 0, `${ context } has no text-width placement sections.` );
	for ( const section of result.placementGeometry.textSections ) {
		assert(
			section.width <= result.placementGeometry.rootFontSize * 44 + 1,
			`${ context } text section ${ section.id || '(unlabelled)' } is ${ section.width }px wide; expected at most 44rem.`
		);
	}
	assert( result.placementGeometry.wideSections.length > 0, `${ context } has no wide placement sections.` );
	for ( const section of result.placementGeometry.wideSections ) {
		assert(
			section.width <= result.placementGeometry.rootFontSize * 72 + 1,
			`${ context } wide section ${ section.id || '(unlabelled)' } is ${ section.width }px wide; expected at most 72rem.`
		);
	}

	assert( result.placementGeometry.bands.length > 0, `${ context } has no full-width placement bands.` );
	for ( const band of result.placementGeometry.bands ) {
		assert(
			approximatelyEqual( band.left, 0, 2 ) && approximatelyEqual( band.right, result.clientWidth, 2 ),
			`${ context } ${ band.name } band spans ${ band.left }px–${ band.right }px inside a ${ result.clientWidth }px viewport.`
		);
		assert( band.inner, `${ context } ${ band.name } band has no constrained inner wrapper.` );
		const maximumRem = band.market ? 84 : 72;
		assert(
			band.inner.width <= result.placementGeometry.rootFontSize * maximumRem + 1,
			`${ context } ${ band.name } band inner is ${ band.inner.width }px wide; expected at most ${ maximumRem }rem.`
		);
	}

	assert( result.placementGeometry.sections.length > 0, `${ context } has no placement sections to measure.` );
	for ( const section of result.placementGeometry.sections ) {
		assert(
			approximatelyEqual( section.paddingLeft, expectedGutter ) &&
				approximatelyEqual( section.paddingRight, expectedGutter ),
			`${ context } section ${ section.id || '(unlabelled)' } gutters are ${ section.paddingLeft }px/${ section.paddingRight }px; expected ${ expectedGutter }px.`
		);
		assert(
			approximatelyEqual( section.scrollMarginBlockStart, expectedScrollOffset ),
			`${ context } section ${ section.id || '(unlabelled)' } scroll offset is ${ section.scrollMarginBlockStart }px; expected ${ expectedScrollOffset }px.`
		);
	}
	for ( const nested of result.placementGeometry.nestedTargets ) {
		assert(
			approximatelyEqual( nested.scrollMarginBlockStart, expectedScrollOffset ),
			`${ context } nested target ${ nested.id } scroll offset is ${ nested.scrollMarginBlockStart }px; expected ${ expectedScrollOffset }px.`
		);
	}
	assert(
		approximatelyEqual( result.placementGeometry.nestedProbeScrollMargin, expectedScrollOffset ),
		`${ context } nested placement-target probe has a ${ result.placementGeometry.nestedProbeScrollMargin }px scroll offset; expected ${ expectedScrollOffset }px.`
	);

	for ( const ledger of result.ledgerLayouts ) {
		assert(
			ledger.headers.length === ledger.cells.length,
			`${ context } ${ ledger.name } renders ${ ledger.cells.length } first-row cells for ${ ledger.headers.length } headers.`
		);
		if ( viewport.width < 782 ) {
			assert( ledger.headerVisuallyHidden, `${ context } ${ ledger.name } leaves its repeated header row visible in stacked mode.` );
			assert(
				ledger.pseudoLabels.join( '|' ) === ledger.headers.join( '|' ),
				`${ context } ${ ledger.name } mobile labels are ${ JSON.stringify( ledger.pseudoLabels ) }; expected ${ JSON.stringify( ledger.headers ) }.`
			);
			assert(
				ledger.pseudoLabelsRendered.every( Boolean ),
				`${ context } ${ ledger.name } defines mobile labels that are not visibly painted: ${ JSON.stringify( ledger.pseudoLabelsRendered ) }.`
			);
			for ( let index = 1; index < ledger.cells.length; index++ ) {
				assert(
					ledger.cells[ index ].top >= ledger.cells[ index - 1 ].bottom - 1,
					`${ context } ${ ledger.name } does not stack cell ${ index + 1 } after cell ${ index }.`
				);
			}
		} else {
			assert( ledger.headerVisible && ! ledger.headerVisuallyHidden, `${ context } ${ ledger.name } hides its column headers in table mode.` );
			assert(
				ledger.pseudoLabels.every( ( label ) => label === '' ),
				`${ context } ${ ledger.name } renders mobile pseudo-labels in table mode: ${ JSON.stringify( ledger.pseudoLabels ) }.`
			);
		}
	}
}

function assertPageMetrics( result, page, viewport ) {
	const context = `${ result.url } at ${ viewport.width }px`;
	assert( result.pathname === page.route, `${ context } resolved to unexpected path ${ result.pathname}.` );
	assert( result.h1s.length === 1, `${ context } renders ${ result.h1s.length } H1 elements: ${ JSON.stringify( result.h1s ) }.` );
	assert( result.h1s[0] === page.h1, `${ context } renders the wrong H1: "${ result.h1s[0] || '' }".` );
	assert( result.firstHeadingLevel === 1, `${ context } begins its visible heading outline at H${ result.firstHeadingLevel }.` );
	assert( result.headingSkips.length === 0, `${ context } has heading-level skips: ${ JSON.stringify( result.headingSkips ) }.` );
	assert(
		result.scrollWidth <= result.clientWidth + 1,
		`${ context } overflows the document: client=${ result.clientWidth}, scroll=${ result.scrollWidth}.`
	);
	assert( result.linkFailures.length === 0, `${ context } has uncontained evidence links: ${ JSON.stringify( result.linkFailures ) }.` );
	assert( result.reducedMotion.matches, `${ context } did not honor reduced-motion emulation.` );
	assert(
		result.reducedMotion.offenders.length === 0,
		`${ context } retains visible motion under reduced motion: ${ JSON.stringify( result.reducedMotion.offenders.slice( 0, 8 ) ) }.`
	);
	assertPlacementGeometry( result, viewport, context );
	if ( shouldInspectDigestTextResize( page, viewport ) ) {
		assert( result.textResize200, context + ' did not collect the required 200% root-text metrics.' );
		assert(
			result.textResize200.actionCount === 1,
			context + ` found ${ result.textResize200.actionCount } event actions at 200% root text; expected exactly 1.`
		);
		assert(
			result.textResize200.actionCount === DIGEST_EXPECTATIONS.primaryActions.length,
			context + ' changed the expected first-screen action count at 200% root text.'
		);
		assert(
			result.textResize200.actionsVisible,
			context + ' hides an event action at 200% root text.'
		);
		assert(
			result.textResize200.actionsHaveTextRects,
			context + ' renders an event action without measurable text at 200% root text.'
		);
		assert(
			result.textResize200.scrollWidth <= result.textResize200.clientWidth + 1,
			context + ' overflows when root text is resized to 200%.'
		);
		assert(
			result.textResize200.actionsContained,
			context + ' clips an event action when root text is resized to 200%.'
		);
	}

	if ( page.name === 'digest' ) {
		assert( result.primaryActions, `${ context } is missing the first-screen action rail.` );
		assertActions( result.primaryActions.actions, DIGEST_EXPECTATIONS.primaryActions, `${ context } first-screen rail`, result.url );
		assert( result.primaryActions.top >= -1, context + ' first-screen actions begin above the viewport.' );
		// The probe samples three opening children; the retired shape has one
		// fewer opening block, so the comparison takes the matching slice.
		const expectedOpening = DIGEST_EXPECTATIONS.hasEvent ? 'hero|event|why' : 'hero|why';
		assert(
			result.mainOpening.slice( 0, expectedOpening.split( '|' ).length ).join( '|' ) === expectedOpening,
			`${ context } opens on ${ result.mainOpening.join( '|' ) }; expected ${ expectedOpening }.`
		);
		assert( result.closing, `${ context } is missing the composed closing panel.` );
		assert( result.closing.eyebrow === DIGEST_EXPECTATIONS.closingEyebrow, `${ context } has the wrong closing eyebrow.` );
		assert( result.closing.heading === DIGEST_EXPECTATIONS.closingHeading, `${ context } has the wrong closing heading.` );
		assertActions( result.closing.actions, DIGEST_EXPECTATIONS.closingActions, `${ context } closing panel`, result.url );
	}

	if ( page.name === 'digest' && ! DIGEST_EXPECTATIONS.hasEvent ) {
		assert( result.primaryActions.inHero, context + ' first-screen actions are outside the hero.' );
		assert(
			result.primaryActions.focusIndexes.join( '|' ) === '0',
			context + ' does not make the single first-screen action the first keyboard stop in main.'
		);
		assert( ! result.eventLandmark, context + ' still renders the retired WordCamp landmark.' );
		assert( ! result.wcus, context + ' still renders the retired WordCamp action region.' );
	}

	if ( page.name === 'digest' && DIGEST_EXPECTATIONS.hasEvent ) {
		assert( result.eventLandmark, context + ' is missing the WordCamp complementary landmark.' );
		assert( result.eventLandmark.tagName === 'ASIDE', context + ' does not render WordCamp as an aside.' );
		assert(
			result.eventLandmark.ariaLabel === 'I’ll be at WordCamp US.',
			context + ' renders the wrong WordCamp accessible name.'
		);
		assert(
			result.eventLandmark.title === result.eventLandmark.ariaLabel,
			context + ' does not keep the visible event title and accessible name identical.'
		);
		assert(
			! result.eventLandmark.beforeH1,
			context + ' puts the WordCamp landmark ahead of the H1, so its own H2 opens the outline.'
		);
		assert( result.primaryActions.inEvent, context + ' first-screen actions are outside the WordCamp landmark.' );
		assert(
			result.primaryActions.focusIndexes.join( '|' ) === String( result.primaryActions.mastheadFocusCount ) &&
				result.primaryActions.mastheadFocusCount === 7,
			context + ' does not place the event action immediately after the masthead’s seven contents links in keyboard order.'
		);
		assert( result.wcus, `${ context } is missing the .hp-wcus-callout action region.` );
		assertActions( result.wcus.actions, DIGEST_EXPECTATIONS.wcusActions, `${ context } WCUS callout`, result.url );
		assert( result.wcus.actions.every( ( action ) => action.textContained ), `${ context } clips a WCUS action label.` );
		assert( result.wcus.rail, `${ context } is missing WCUS action-rail geometry.` );

		assert( result.wcus.copy, context + ' is missing event-copy geometry.' );
		for ( let index = 1; index < result.wcus.actions.length; index++ ) {
			assert(
				result.wcus.actions[ index ].top >= result.wcus.actions[ index - 1 ].bottom - 1,
				context + ' does not keep the event action rail vertical.'
			);
		}

		if ( viewport.width >= 782 ) {
			assert(
				result.wcus.copy.right <= result.wcus.rail.left + 2,
				context + ' does not render event copy left of the action rail.'
			);
		} else {
			assert(
				result.wcus.rail.top >= result.wcus.copy.bottom - 1,
				context + ' does not stack event actions after event copy.'
			);
			for ( const action of result.wcus.actions ) {
				assert(
					action.width >= result.wcus.rail.width - 12,
					context + ' contains an event action that does not fill its row.'
				);
			}
		}

		if ( viewport.zoomPercent === 200 ) {
			assert(
				result.wcus.rail.top >= result.wcus.copy.bottom - 1,
				context + ' keeps compressed columns in the 200% zoom-equivalent reflow.'
			);
		}
	}

	// Everything below describes the dossier itself, so it holds whether or not
	// the event plate is still published.
	if ( page.name === 'digest' ) {
		if ( viewport.width === 1024 && ! viewport.zoomPercent ) {
			assert( result.opening.hero && result.opening.why, context + ' is missing opening-section geometry.' );
			assert(
				result.opening.hero.bottom <= viewport.height + 1,
				context + ' does not keep the complete role proposition in the first 1000px.'
			);
		}

		if ( viewport.zoomPercent === 200 ) {
			assert(
				result.scrollWidth <= result.clientWidth + 1,
				context + ' overflows in the 200% zoom-equivalent reflow.'
			);
		}

		assert( ! result.supportBrief, context + ' still renders the retired recruiter brief.' );
		assert( result.dossier.kickers === 7, `${ context } renders ${ result.dossier.kickers } numbered kickers; the dossier has seven.` );
		assert( result.dossier.fitRows === 5, `${ context } renders ${ result.dossier.fitRows } fit rows; the ledger holds the five with proof.` );
		assert( result.dossier.gap, context + ' does not render the named gap outside the fit ledger.' );
		assert( result.dossier.proofCards === 3, `${ context } renders ${ result.dossier.proofCards } proof cards; expected three.` );
		assert( result.dossier.artifactCells === 6, `${ context } renders ${ result.dossier.artifactCells } incident artifacts; expected six.` );
		assert( result.dossier.registerRows === 11, `${ context } renders ${ result.dossier.registerRows } register rows; the register publishes eleven.` );
		assert(
			result.longformCount >= 5,
			context + ' does not render the dossier\'s long-form sections.'
		);

		// The filter is an enhancement over a complete register. Either it
		// mounted — four states, a live status, and every row still shown
		// because "All evidence" is the default — or it declined to mount and
		// the register renders unfiltered. A mounted filter that starts by
		// hiding evidence is the failure this pins.
		assert(
			result.dossier.registerFilterButtons === 0 || result.dossier.registerFilterButtons === 4,
			`${ context } renders ${ result.dossier.registerFilterButtons } register filter controls; expected none or all four.`
		);
		assert(
			result.dossier.registerVisibleRows === 11,
			`${ context } hides ${ 11 - result.dossier.registerVisibleRows } register rows before the reader has filtered anything.`
		);
		if ( result.dossier.registerFilterButtons === 4 ) {
			assert(
				result.dossier.registerStatusLive === 'polite',
				context + ' does not announce the filtered register count politely.'
			);
		}

		if ( ! viewport.zoomPercent ) {
			const heightBudget = DIGEST_HEIGHT_BUDGETS[ viewport.name ];
			assert( heightBudget, context + ' has no dossier height budget.' );
			assert(
				result.documentHeight <= heightBudget,
				`${ context } is ${ result.documentHeight }px tall; dossier runaway budget is ${ heightBudget }px.`
			);
		}

		// The evidence register becomes the same labelled record anatomy as the
		// appendix ledgers below 782px. This used to permit a special 390px
		// title/state metadata row, which no longer matches the shared chassis.
		if ( viewport.width < 782 ) {
			const evidenceLedger = result.ledgerLayouts.find( ( ledger ) => ledger.name === 'evidence register' );
			assert( evidenceLedger, context + ' is missing stacked evidence-ledger geometry.' );
			assert(
				evidenceLedger.headers.join( '|' ) === 'Artifact|State|Direct evidence' &&
					evidenceLedger.pseudoLabels.join( '|' ) === evidenceLedger.headers.join( '|' ),
				context + ' does not render the Digest evidence row as an Artifact / State / Direct evidence record.'
			);
		}

		assert( result.proofItems.length === 4, `${ context } renders ${ result.proofItems.length } root-cause proof items; expected 4.` );
		assert(
			result.proofItems.map( ( item ) => item.label ).join( '|' ) === DIGEST_EXPECTATIONS.proofLabels.join( '|' ),
			`${ context } changes the Signal → Diagnosis → Constraint → Result proof order.`
		);
		if ( viewport.width < 782 ) {
			for ( let index = 1; index < result.proofItems.length; index++ ) {
				assert(
					result.proofItems[ index ].top >= result.proofItems[ index - 1 ].bottom - 1,
					`${ context } does not stack proof item ${ index + 1 } below item ${ index }.`
				);
			}
		}
		assert( result.rootCauseFragment, `${ context } did not exercise #root-cause-investigation.` );
		assert( result.rootCauseFragment.hash === '#root-cause-investigation', `${ context } did not retain the root-cause fragment hash.` );
		assert( result.rootCauseFragment.focused, `${ context } did not focus the root-cause proof section.` );
		assert( result.rootCauseFragment.tabindex === '-1', `${ context } did not keep fragment focus programmatic-only.` );
		assert( result.rootCauseFragment.headerPresent, `${ context } is missing the masthead used by the fragment-clearance contract.` );
		assert( result.rootCauseFragment.headerPosition === 'sticky', `${ context } masthead is ${ result.rootCauseFragment.headerPosition || 'missing' }, not sticky.` );
		assert(
			result.rootCauseFragment.targetTop >= result.rootCauseFragment.headerBottom - 1 &&
				result.rootCauseFragment.targetTop < viewport.height,
			`${ context } did not scroll the root-cause proof section clear of the sticky header.`
		);
		assert( result.rootCauseFragment.headingOutlineUnchanged, `${ context } changed the heading outline during fragment focus.` );
	} else {
		assert( result.fragment, `${ context } is missing #resume-keyword-bank.` );
		assert( result.fragment.tagName === 'SECTION', `${ context } assigns #resume-keyword-bank to ${ result.fragment.tagName}, not SECTION.` );
		assert( result.fragment.visible, `${ context } assigns #resume-keyword-bank to an empty or hidden element.` );
		assert( result.fragment.heading === 'The 34-term keyword ledger', `${ context } fragment target does not own the keyword-ledger H2.` );
		assert( result.fragment.isTarget, `${ context } #resume-keyword-bank does not become the meaningful :target.` );
		assert( result.marketScrollHint.exists, `${ context } is missing the market-table scroll hint.` );
		const expectsScrollHint = viewport.width >= 782 && viewport.width <= 1180;
		assert(
			result.marketScrollHint.visible === expectsScrollHint,
			`${ context } market scroll hint is ${ result.marketScrollHint.visible ? 'visible' : 'hidden' }; expected ${ expectsScrollHint ? 'visible' : 'hidden' }.`
		);

		// Both ledgers remain complete in the source. Once enhancement mounts,
		// the keyword ledger intentionally opens on Demonstrated while the market
		// screen opens on All; their all-state counts still have to equal source.
		assert( result.ledgers.length === 2, `${ context } renders ${ result.ledgers.length } filterable ledgers; expected 2.` );
		for ( const ledger of result.ledgers ) {
			assert(
				ledger.visibleRows === ledger.expectedInitialRows,
				`${ context } ${ ledger.name } opens with ${ ledger.visibleRows } rows shown; expected ${ ledger.expectedInitialRows } for ${ ledger.defaultState }.`
			);
			assert( ledger.rows === ledger.expectedRows, `${ context } ${ ledger.name } holds ${ ledger.rows } rows; expected ${ ledger.expectedRows }.` );
			assert(
				ledger.standings === ledger.rows,
				`${ context } ${ ledger.name } states a standing on ${ ledger.standings } of ${ ledger.rows } rows; state may never rest on colour alone.`
			);
			assert(
				ledger.visibleStandings === ledger.visibleRows,
				`${ context } ${ ledger.name } visibly exposes standing text on ${ ledger.visibleStandings } of ${ ledger.visibleRows } shown rows.`
			);
			assert( ledger.chips.length === ledger.expectedOrder.length, `${ context } ${ ledger.name } offers ${ ledger.chips.length } filters; expected ${ ledger.expectedOrder.length }.` );
			assert(
				ledger.chips.map( ( chip ) => chip.state ).join( ',' ) === ledger.expectedOrder.join( ',' ),
				`${ context } ${ ledger.name } filter order is ${ ledger.chips.map( ( chip ) => chip.state ).join( ' → ' ) }; expected ${ ledger.expectedOrder.join( ' → ' ) }.`
			);
			assert( ledger.group === 'group' && ledger.groupLabel, `${ context } ${ ledger.name } filter row is not a labelled group.` );
			assert( ledger.statusLive === 'polite', `${ context } ${ ledger.name } filter has no polite status region.` );
			assert(
				ledger.openingStatus === ledger.expectedOpeningStatus,
				`${ context } ${ ledger.name } opening status is "${ ledger.openingStatus }"; expected "${ ledger.expectedOpeningStatus }".`
			);
			if ( viewport.width < 600 ) {
				assert(
					ledger.filterLayout.flexWrap === 'nowrap' && ledger.filterLayout.overflowX === 'auto' &&
						ledger.filterLayout.scrollSnapType.startsWith( 'x' ),
					`${ context } ${ ledger.name } filter does not become a no-wrap horizontal snap rail below 600px.`
				);
			} else {
				assert(
					ledger.filterLayout.flexWrap === 'wrap' && ledger.filterLayout.overflowX === 'visible' &&
						ledger.filterLayout.scrollSnapType === 'none',
					`${ context } ${ ledger.name } filter does not restore wrapping, non-scrolling controls at 600px and above.`
				);
			}
			assert( ledger.chipsSum === ledger.rows, `${ context } ${ ledger.name } chip counts total ${ ledger.chipsSum }, not the ${ ledger.rows } rows published.` );
			assert( ledger.allCount === ledger.rows, `${ context } ${ ledger.name } All count is ${ ledger.allCount }, not ${ ledger.rows }.` );
			assert( ledger.openingPressedState === ledger.defaultState, `${ context } ${ ledger.name } opens on ${ ledger.openingPressedState || 'no state' }, not ${ ledger.defaultState }.` );
			for ( const chip of ledger.chips ) {
				assert( chip.height >= 44, `${ context } ${ ledger.name } filter "${ chip.label }" is ${ chip.height }px high; expected at least 44px.` );
				assert( chip.cursor === 'pointer', `${ context } ${ ledger.name } filter "${ chip.label }" cursor is ${ chip.cursor }, not pointer.` );
				assert( chip.pressed !== null, `${ context } ${ ledger.name } filter "${ chip.label }" does not expose aria-pressed.` );
			}
			assert( ledger.focusVisible, `${ context } ${ ledger.name } filter does not match :focus-visible after keyboard entry.` );
			assert(
				ledger.outlineStyle !== 'none' && ledger.outlineWidth >= 2,
				`${ context } ${ ledger.name } filter has no visible keyboard outline.`
			);
			assert(
				ledger.narrowed === ledger.expectedNarrowRows,
				`${ context } ${ ledger.name } ${ ledger.narrowState || 'held' } filter shows ${ ledger.narrowed } rows; expected ${ ledger.expectedNarrowRows }.`
			);
			assert( ledger.narrowedPressed, `${ context } ${ ledger.name } filter did not mark the held state pressed.` );
			assert(
				ledger.narrowedStatus === ledger.expectedNarrowStatus,
				`${ context } ${ ledger.name } narrowed status is "${ ledger.narrowedStatus }"; expected "${ ledger.expectedNarrowStatus }" while ${ ledger.narrowed } rows are shown.`
			);
			assert( ledger.restored === ledger.rows, `${ context } ${ ledger.name } did not restore every row when the filter was released.` );
		}
	}
}

/**
 * Both appendix ledgers publish complete in markup and are narrowed by an
 * injected filter row (assets/js/digest-register-filter.js). The keyword
 * ledger opens Demonstrated-first after a successful mount; the market screen
 * opens on All. Nothing here is read from the script's own bookkeeping: row
 * totals, standing words, and chip counts come back off the rendered page.
 */
const DIGEST_LEDGER = {
	name: 'evidence register',
	root: '.hp-evidence-ledger',
	table: '.hp-evidence-table table',
	rows: 11,
	initialRows: 11,
	defaultState: 'all',
	openingStatus: 'Showing all 11 records · states verified 26 Aug 2026',
	standing: 'td:first-of-type',
};

const APPENDIX_LEDGERS = [
	{
		name: 'keyword ledger',
		root: '.hp-resume-keyword-bank',
		table: '.hp-keyword-table table',
		rows: 34,
		initialRows: 10,
		defaultState: 'demonstrated',
		openingStatus: 'Showing 10 of 34 terms · demonstrated',
		narrowState: 'partial',
		narrowRows: 11,
		narrowStatus: 'Showing 11 of 34 terms · partial',
		order: [ 'demonstrated', 'partial', 'gap', 'all' ],
		standing: 'th strong',
	},
	{
		name: 'market screen',
		root: '.hp-live-states',
		table: '.hp-market-table table',
		rows: 20,
		initialRows: 20,
		defaultState: 'all',
		openingStatus: 'Showing all 20 rows',
		narrowState: 'live',
		narrowRows: 9,
		narrowStatus: 'Showing 9 of 20 rows · live passes',
		order: [ 'all', 'live', 'historical', 'recheck', 'failed' ],
		standing: 'td:nth-of-type(4)',
	},
];

async function inspectLedgers( cdp, sessionId ) {
	const ledgers = [];

	for ( const ledger of APPENDIX_LEDGERS ) {
		const present = await evaluate( cdp, sessionId, `!!document.querySelector('${ ledger.root } .hp-evidence-filter')` );
		if ( ! present ) {
			ledgers.push( {
				name: ledger.name,
				rows: 0,
				visibleRows: 0,
				expectedRows: ledger.rows,
				expectedInitialRows: ledger.initialRows,
				defaultState: ledger.defaultState,
				expectedOpeningStatus: ledger.openingStatus,
				expectedNarrowStatus: ledger.narrowStatus,
				expectedNarrowRows: ledger.narrowRows,
				narrowState: ledger.narrowState,
				expectedOrder: ledger.order,
				standings: 0,
				visibleStandings: 0,
				chips: [],
				chipsSum: 0,
			} );
			continue;
		}

		// Establish keyboard modality before focusing a specific chip.
		await pressKey( cdp, sessionId, 'Tab' );
		const opening = await evaluate( cdp, sessionId, `(() => {
			const root = document.querySelector('${ ledger.root }');
			const group = root.querySelector('.hp-evidence-filter');
			const status = root.querySelector('.hp-evidence-filter__status');
			const rows = Array.from(root.querySelectorAll('${ ledger.table } tbody tr'));
			const isShown = (el) => {
				const style = getComputedStyle(el);
				return !el.hidden && style.display !== 'none' && style.visibility !== 'hidden' &&
					el.getClientRects().length > 0;
			};
			const isReadable = (element) => {
				if (!element || !element.textContent.trim() || !isShown(element)) return false;
				const bounds = element.getBoundingClientRect();
				if (bounds.width <= 1 || bounds.height <= 1) return false;
				for (let current = element; current; current = current.parentElement) {
					const style = getComputedStyle(current);
					if (current.getAttribute('aria-hidden') === 'true' || style.display === 'none' ||
						style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
				}
				return true;
			};
			const chips = Array.from(group.querySelectorAll('.hp-evidence-filter__button'));
			const focusChip = group.querySelector('[data-state="${ ledger.narrowState }"]');
			focusChip.focus();
			const style = getComputedStyle(focusChip);
			const groupStyle = getComputedStyle(group);
			return {
				rows: rows.length,
				visibleRows: rows.filter(isShown).length,
				standings: rows.filter((row) => {
					const cell = row.querySelector('${ ledger.standing }');
					return !!cell && cell.textContent.trim().length > 0;
				}).length,
				visibleStandings: rows.filter((row) => {
					const cell = row.querySelector('${ ledger.standing }');
					return isReadable(cell);
				}).length,
				group: group.getAttribute('role'),
				groupLabel: group.getAttribute('aria-label'),
				statusLive: status ? status.getAttribute('aria-live') : null,
				openingStatus: status ? status.textContent.trim() : null,
				filterLayout: {
					flexWrap: groupStyle.flexWrap,
					overflowX: groupStyle.overflowX,
					scrollSnapType: groupStyle.scrollSnapType,
					clientWidth: group.clientWidth,
					scrollWidth: group.scrollWidth,
				},
				chips: chips.map((chip) => ({
					label: chip.textContent.trim(),
					state: chip.dataset.state,
					count: Number(chip.querySelector('.hp-evidence-filter__count').textContent),
					height: chip.getBoundingClientRect().height,
					cursor: getComputedStyle(chip).cursor,
					pressed: chip.getAttribute('aria-pressed'),
				})),
				openingPressedState: (chips.find((chip) => chip.getAttribute('aria-pressed') === 'true') || {}).dataset?.state || null,
				focusVisible: focusChip.matches(':focus-visible'),
				outlineStyle: style.outlineStyle,
				outlineWidth: parseFloat(style.outlineWidth) || 0,
			};
		})()` );

		// Hold a non-default state, then restore the explicit All state.
		await pressKey( cdp, sessionId, 'Enter' );
		const narrowed = await evaluate( cdp, sessionId, `(() => {
			const root = document.querySelector('${ ledger.root }');
			const rows = Array.from(root.querySelectorAll('${ ledger.table } tbody tr'));
			const chips = Array.from(root.querySelectorAll('.hp-evidence-filter__button'));
			const isShown = (el) => {
				const style = getComputedStyle(el);
				return !el.hidden && style.display !== 'none' && style.visibility !== 'hidden' &&
					el.getClientRects().length > 0;
			};
			return {
				shown: rows.filter(isShown).length,
				pressed: root.querySelector('[data-state="${ ledger.narrowState }"]').getAttribute('aria-pressed') === 'true',
				status: root.querySelector('.hp-evidence-filter__status').textContent,
			};
		})()` );

		const restored = await evaluate( cdp, sessionId, `(() => {
			const root = document.querySelector('${ ledger.root }');
			root.querySelector('.hp-evidence-filter__button[data-state="all"]').click();
			const rows = Array.from(root.querySelectorAll('${ ledger.table } tbody tr'));
			const isShown = (el) => {
				const style = getComputedStyle(el);
				return !el.hidden && style.display !== 'none' && style.visibility !== 'hidden' &&
					el.getClientRects().length > 0;
			};
			return rows.filter(isShown).length;
		})()` );

		ledgers.push( {
			name: ledger.name,
			expectedRows: ledger.rows,
			expectedInitialRows: ledger.initialRows,
			defaultState: ledger.defaultState,
			expectedOpeningStatus: ledger.openingStatus,
			expectedNarrowStatus: ledger.narrowStatus,
			expectedNarrowRows: ledger.narrowRows,
			narrowState: ledger.narrowState,
			expectedOrder: ledger.order,
			...opening,
			// "All" repeats the total, so the states themselves have to add up
			// to it — a chip counting rows no other chip claims would pass a
			// simple sum.
			chipsSum: opening.chips.filter( ( chip ) => chip.state !== 'all' ).reduce( ( total, chip ) => total + chip.count, 0 ),
			allCount: ( opening.chips.find( ( chip ) => chip.state === 'all' ) || { count: 0 } ).count,
			narrowed: narrowed.shown,
			narrowedPressed: narrowed.pressed,
			narrowedStatus: narrowed.status,
			restored,
		} );
	}

	return ledgers;
}

async function inspectPage( cdp, page, viewport ) {
	const target = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
	const attached = await cdp.send( 'Target.attachToTarget', {
		targetId: target.targetId,
		flatten: true,
	} );
	const sessionId = attached.sessionId;

	try {
		await cdp.send( 'Page.enable', {}, sessionId );
		await cdp.send( 'Runtime.enable', {}, sessionId );
		await cdp.send( 'DOM.enable', {}, sessionId );
		await cdp.send( 'Emulation.setDeviceMetricsOverride', {
			width: viewport.width,
			height: viewport.height,
			deviceScaleFactor: 1,
			mobile: viewport.mobile,
		}, sessionId );

		const url = new URL( page.route, ORIGIN ).href;
		const navigation = await cdp.send( 'Page.navigate', { url }, sessionId, NAVIGATION_RESPONSE_TIMEOUT_MS );
		assert( ! navigation.errorText, `${ url } failed to navigate: ${ navigation.errorText }` );
		await waitForDocumentMain( cdp, sessionId, url );
		await waitForPlacementStyles( cdp, sessionId );
		await evaluate( cdp, sessionId, `document.fonts ? Promise.race([
			document.fonts.ready,
			new Promise((resolve) => setTimeout(resolve, 8000)),
		]) : Promise.resolve()` );
		await wait( 250 );

		let ledgers = [];
		if ( page.name === 'appendix' ) {
			ledgers = await inspectLedgers( cdp, sessionId );
		}
		await evaluate( cdp, sessionId, 'scrollTo(0, 0)' );

		const metrics = await evaluate( cdp, sessionId, `(() => {
			const round = (value) => Math.round(value * 100) / 100;
			const rect = (element) => {
				if (!element) {
					return null;
				}
				const bounds = element.getBoundingClientRect();
				return {
					left: round(bounds.left),
					right: round(bounds.right),
					top: round(bounds.top),
					bottom: round(bounds.bottom),
					width: round(bounds.width),
					height: round(bounds.height),
				};
			};
			const isVisible = (element) => {
				const style = getComputedStyle(element);
				return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
			};
			const pseudoLabel = (element) => {
				const content = getComputedStyle(element, '::before').content;
				if (!content || content === 'none' || content === 'normal') {
					return '';
				}
				return content.replace(/^["']|["']$/g, '');
			};
			const pseudoLabelRendered = (element) => {
				const style = getComputedStyle(element, '::before');
				return pseudoLabel(element).length > 0 && style.display !== 'none' &&
					style.visibility !== 'hidden' && style.contentVisibility !== 'hidden' &&
					Number(style.opacity) > 0 && parseFloat(style.fontSize) > 0 &&
					style.clipPath === 'none' && style.color !== 'transparent' &&
					!style.color.endsWith(', 0)') && !style.color.includes('/ 0)');
			};
			const linkSelector = [
				'.hp-evidence-table a',
				'.hp-proof-card a',
				'.hp-incident-card a',
				'.hp-market-table a',
				'main a[href*="github.com"]',
			].join(',');
			const linkFailures = Array.from(document.querySelectorAll(linkSelector))
				.filter(isVisible)
				.map((link) => {
					const container = link.closest('td, th, p, li, .hp-proof-card, .hp-incident-card') || link.parentElement;
					const bounds = container.getBoundingClientRect();
					const range = document.createRange();
					range.selectNodeContents(link);
					const fragments = Array.from(range.getClientRects());
					const contained = fragments.every((rect) => rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1);
					const style = getComputedStyle(link);
					const wrappable = style.overflowWrap === 'anywhere' || ['break-word', 'break-all'].includes(style.wordBreak);
					return {
						text: link.textContent.trim().replace(/\\s+/g, ' '),
						href: link.href,
						contained,
						wrappable,
						fragments: fragments.length,
					};
				})
				// Narrow-screen geometry is the rendered proof. A spaced label can
				// wrap safely with overflow-wrap: normal; token-like labels in the
				// dense ledgers receive the explicit anywhere/break-word source rule
				// pinned above. Fail only when a rendered fragment escapes its owner.
				.filter((link) => !link.contained);

			const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
				.filter(isVisible)
				.map((heading) => ({
					level: Number(heading.tagName.slice(1)),
					text: heading.textContent.trim().replace(/\\s+/g, ' '),
				}));
			const headingSkips = [];
			for (let index = 1; index < headings.length; index++) {
				if (headings[index].level > headings[index - 1].level + 1) {
					headingSkips.push({ from: headings[index - 1], to: headings[index] });
				}
			}

			const actions = (root) => root ? Array.from(root.querySelectorAll('.wp-block-button__link')).map((link) => {
				const bounds = link.getBoundingClientRect();
				const range = document.createRange();
				range.selectNodeContents(link);
				return {
					text: link.textContent.trim().replace(/\\s+/g, ' '),
					href: link.getAttribute('href'),
					height: round(bounds.height),
					width: round(bounds.width),
					left: round(bounds.left),
					top: round(bounds.top),
					bottom: round(bounds.bottom),
					textContained: Array.from(range.getClientRects()).every((rect) => rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1 && rect.top >= bounds.top - 1 && rect.bottom <= bounds.bottom + 1),
				};
			}) : [];
			const primaryRail = document.querySelector('.hp-digest__primary-actions') ||
				document.querySelector('.hp-digest__hero .wp-block-buttons.hp-action-rail');
			const primaryRect = primaryRail?.getBoundingClientRect();
			const closing = document.querySelector('.hp-digest-cta');
			const anchor = document.getElementById('resume-keyword-bank');
			const hero = document.querySelector('.hp-digest__hero');
			const wcus = document.querySelector('main .hp-wcus-callout');
			const wcusCopy = wcus?.querySelector('.hp-wcus-callout__copy');
			const wcusActionsRoot = wcus?.querySelector('.hp-wcus-callout__actions');
			const why = document.getElementById('why-support-engineer-now');
			const supportBrief = document.getElementById('support-brief');
			const briefFit = supportBrief?.querySelector('.hp-digest-brief__fit');
			const briefProof = supportBrief?.querySelector('.hp-digest-brief__proof');
			const debugProofItems = Array.from(document.querySelectorAll('#root-cause-investigation .hp-debug-proof__item'));
			const firstEvidenceRow = document.querySelector('.hp-evidence-table tbody tr');
			const eventLinks = Array.from(primaryRail?.querySelectorAll('a') || []);
			const focusables = Array.from(document.querySelectorAll('main a[href], main button:not([disabled]), main summary'))
				.filter(isVisible);
			const contentRoot = document.querySelector('main .wp-block-post-content') || document.querySelector('main');
			const proofItems = debugProofItems.map((item) => {
				const bounds = item.getBoundingClientRect();
				return {
					label: item.querySelector('dt')?.textContent.trim() || '',
					top: round(bounds.top),
					bottom: round(bounds.bottom),
				};
			});
			const masthead = document.querySelector('.hp-placement-masthead');
			const mastheadMain = masthead?.querySelector(':scope > .hp-placement-masthead__main');
			const mastheadSide = masthead?.querySelector(':scope > .hp-placement-contents, :scope > .hp-placement-audit');
			const mastheadStyle = masthead ? getComputedStyle(masthead) : null;
			const sectionMetric = (section) => {
				const style = getComputedStyle(section);
				return {
					id: section.id || null,
					...rect(section),
					paddingLeft: round(parseFloat(style.paddingLeft) || 0),
					paddingRight: round(parseFloat(style.paddingRight) || 0),
					scrollMarginBlockStart: round(parseFloat(style.scrollMarginBlockStart) || 0),
				};
			};
			const placementSections = Array.from(document.querySelectorAll('.hp-placement-section'));
			const nestedTargets = Array.from(document.querySelectorAll('.hp-placement-section [id]')).map((target) => ({
				id: target.id,
				scrollMarginBlockStart: round(parseFloat(getComputedStyle(target).scrollMarginBlockStart) || 0),
			}));
			let nestedProbeScrollMargin = null;
			if (placementSections[0]) {
				const probe = document.createElement('span');
				probe.id = 'hp-placement-scroll-offset-probe';
				probe.hidden = true;
				placementSections[0].appendChild(probe);
				nestedProbeScrollMargin = round(parseFloat(getComputedStyle(probe).scrollMarginBlockStart) || 0);
				probe.remove();
			}
			const bands = Array.from(document.querySelectorAll('.hp-placement-band')).map((band) => {
				const inner = band.querySelector(':scope > .hp-placement-part, :scope > .hp-placement-band__inner');
				return {
					name: Array.from(band.classList).find((name) => name.startsWith('hp-placement-band--')) || 'placement',
					market: band.classList.contains('hp-placement-band--market'),
					...rect(band),
					inner: rect(inner),
				};
			});
			const ledgerLayouts = Array.from(document.querySelectorAll('.hp-placement-ledger')).map((figure) => {
				const table = figure.querySelector('table');
				const head = table?.querySelector('thead');
				const headRect = rect(head);
				const headStyle = head ? getComputedStyle(head) : null;
				const firstRow = table?.querySelector('tbody tr:not([hidden])') || table?.querySelector('tbody tr');
				const cells = firstRow ? Array.from(firstRow.children).filter((cell) => cell.matches('th, td')) : [];
				let name = 'placement ledger';
				if (figure.classList.contains('hp-evidence-table')) name = 'evidence register';
				if (figure.classList.contains('hp-keyword-table')) name = 'keyword ledger';
				if (figure.classList.contains('hp-market-table')) name = 'market screen';
				const headerVisuallyHidden = !!headStyle && !!headRect && headStyle.position === 'absolute' &&
					headRect.width <= 1.5 && headRect.height <= 1.5 && headStyle.overflow === 'hidden';
				return {
					name,
					headers: Array.from(table?.querySelectorAll('thead th') || []).map((cell) => cell.textContent.trim().replace(/\\s+/g, ' ')),
					cells: cells.map(rect),
					pseudoLabels: cells.map(pseudoLabel),
					pseudoLabelsRendered: cells.map(pseudoLabelRendered),
					headerVisible: !!head && isVisible(head) && !headerVisuallyHidden,
					headerVisuallyHidden,
				};
			});
			const marketScrollHint = document.querySelector('.hp-market-scroll-hint');

			return {
				url: location.href,
				pathname: location.pathname,
				clientWidth: document.documentElement.clientWidth,
				scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
				documentHeight: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
				h1s: Array.from(document.querySelectorAll('h1')).map((heading) => heading.textContent.trim().replace(/\\s+/g, ' ')),
				firstHeadingLevel: headings[0]?.level || null,
				headingSkips,
				linkFailures,
				placementGeometry: {
					rootFontSize: round(parseFloat(getComputedStyle(document.documentElement).fontSize) || 16),
					masthead: masthead ? {
						root: rect(masthead),
						main: rect(mastheadMain),
						side: rect(mastheadSide),
						gridTemplateColumns: mastheadStyle.gridTemplateColumns,
						paddingLeft: round(parseFloat(mastheadStyle.paddingLeft) || 0),
						paddingRight: round(parseFloat(mastheadStyle.paddingRight) || 0),
					} : null,
					textSections: Array.from(document.querySelectorAll('.hp-placement-section--text')).map(sectionMetric),
					wideSections: Array.from(document.querySelectorAll('.hp-placement-section--wide')).map(sectionMetric),
					sections: placementSections.map(sectionMetric),
					nestedTargets,
					nestedProbeScrollMargin,
					bands,
				},
				ledgerLayouts,
				marketScrollHint: {
					exists: !!marketScrollHint,
					visible: !!marketScrollHint && isVisible(marketScrollHint),
					display: marketScrollHint ? getComputedStyle(marketScrollHint).display : null,
				},
				eventLandmark: wcus ? {
					tagName: wcus.tagName,
					ariaLabel: wcus.getAttribute('aria-label'),
					title: wcus.querySelector('.hp-wcus-callout__title')?.textContent.trim() || null,
					beforeH1: !!(wcus.compareDocumentPosition(document.querySelector('h1')) & Node.DOCUMENT_POSITION_FOLLOWING),
				} : null,
				mainOpening: Array.from(contentRoot?.children || [])
					.filter(isVisible)
					.slice(0, 3)
					.map((element) => {
						if (element.matches('.hp-wcus-callout')) return 'event';
						if (element.matches('.hp-digest__hero')) return 'hero';
						if (element.matches('#why-support-engineer-now')) return 'why';
						if (element.matches('#support-brief')) return 'brief';
						return element.className || element.tagName;
					}),
				primaryActions: primaryRail ? {
					inHero: !!primaryRail.closest('.hp-digest__hero'),
					inEvent: !!primaryRail.closest('.hp-wcus-callout'),
					top: round(primaryRect.top),
					bottom: round(primaryRect.bottom),
					actions: actions(primaryRail),
					focusIndexes: eventLinks.map((link) => focusables.indexOf(link)),
					mastheadFocusCount: masthead ? Array.from(masthead.querySelectorAll('a[href], button:not([disabled]), summary')).filter(isVisible).length : 0,
				} : null,
				closing: closing ? {
					eyebrow: closing.querySelector('.hp-page-hero__eyebrow')?.textContent.trim() || null,
					heading: closing.querySelector('h2')?.textContent.trim() || null,
					actions: actions(closing),
				} : null,
				wcus: wcusActionsRoot ? {
					callout: rect(wcus),
					copy: rect(wcusCopy),
					rail: rect(wcusActionsRoot),
					actions: actions(wcusActionsRoot),
				} : null,
				opening: {
					hero: rect(hero),
					why: rect(why),
					brief: rect(supportBrief),
				},
				supportBrief: supportBrief ? {
					section: rect(supportBrief),
					fit: rect(briefFit),
					proof: rect(briefProof),
					fitItemCount: briefFit?.querySelectorAll('li').length || 0,
					proofItemCount: briefProof?.querySelectorAll('li').length || 0,
					proofLinks: Array.from(briefProof?.querySelectorAll('a') || []).map((link) => ({
						text: link.textContent.trim().replace(/\\s+/g, ' '),
						href: link.getAttribute('href'),
					})),
				} : null,
				// The dossier's own inventory. Row and card counts are read from
				// the rendered page so a section that fails to render — or a
				// register the filter script has wrongly emptied — is caught here
				// and not only in the source contract.
				dossier: {
					kickers: document.querySelectorAll('.hp-digest-kicker').length,
					fitRows: document.querySelectorAll('.hp-fit-table tbody tr').length,
					gap: rect(document.querySelector('.hp-digest-gap')),
					proofCards: document.querySelectorAll('.hp-primary-proof .hp-proof-card').length,
					artifactCells: document.querySelectorAll('#root-cause-investigation .hp-artifact').length,
					registerRows: document.querySelectorAll('.hp-evidence-table tbody tr').length,
					registerVisibleRows: Array.from(document.querySelectorAll('.hp-evidence-table tbody tr'))
						.filter((row) => !row.hidden && isVisible(row)).length,
					registerFilterButtons: document.querySelectorAll('.hp-evidence-filter__button').length,
					registerStatusLive: document.querySelector('.hp-evidence-filter__status')?.getAttribute('aria-live') || null,
				},
				longformCount: document.querySelectorAll('.hp-fit-ledger, .hp-incident-card, .hp-theme-governance, .hp-evidence-ledger, .hp-method-link').length,
				proofItems,
				fragment: anchor ? {
					tagName: anchor.tagName,
					// Meaningful means the section carries its heading and the
					// ledger the heading promises — not merely that the anchor
					// resolves. The ledger used to be three <details>; it is one
					// table now, so the ledger is what is looked for.
					visible: isVisible(anchor) && !!anchor.querySelector('h2') && !!anchor.querySelector('.hp-keyword-table table tbody tr'),
					heading: anchor.querySelector('h2')?.textContent.trim() || null,
				} : null,
			};
		})()` );

		if ( page.name === 'appendix' ) {
			await evaluate( cdp, sessionId, `location.hash = 'resume-keyword-bank'` );
			await wait( 50 );
			// metrics.fragment is null when the #resume-keyword-bank anchor is
			// absent — exactly the regression this check guards. Leave it null so
			// the downstream `assert( result.fragment, ... )` reports it cleanly
			// instead of throwing a TypeError here.
			if ( metrics.fragment ) {
				metrics.fragment.isTarget = await evaluate(
					cdp,
					sessionId,
					`document.querySelector(':target') === document.getElementById('resume-keyword-bank')`
				);
			}
		}
		if ( page.name === 'digest' ) {
			const initialOutline = await evaluate( cdp, sessionId, `Array.from(document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6')).map((heading) => heading.tagName + '|' + heading.textContent.trim().replace(/\\s+/g, ' ')).join('\\n')` );
			await evaluate( cdp, sessionId, `location.hash = 'root-cause-investigation'` );
			for ( let attempt = 0; attempt < 20; attempt++ ) {
				if ( await evaluate( cdp, sessionId, `document.activeElement === document.getElementById('root-cause-investigation')` ) ) {
					break;
				}
				await wait( 50 );
			}
			metrics.rootCauseFragment = await evaluate( cdp, sessionId, `(() => {
				const target = document.getElementById('root-cause-investigation');
				const header = document.querySelector('header.wp-block-template-part');
				return {
					hash: location.hash,
					focused: document.activeElement === target,
					tabindex: target?.getAttribute('tabindex') || null,
					targetTop: target?.getBoundingClientRect().top ?? null,
					headerPresent: !!header,
					headerPosition: header ? getComputedStyle(header).position : null,
					headerBottom: header?.getBoundingClientRect().bottom ?? null,
				};
			})()` );
			const finalOutline = await evaluate( cdp, sessionId, `Array.from(document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6')).map((heading) => heading.tagName + '|' + heading.textContent.trim().replace(/\\s+/g, ' ')).join('\\n')` );
			metrics.rootCauseFragment.headingOutlineUnchanged = initialOutline === finalOutline;
		}

		if ( shouldInspectDigestTextResize( page, viewport ) ) {
			metrics.textResize200 = await inspectDigestTextResize( cdp, sessionId );
		}

		await cdp.send( 'Emulation.setEmulatedMedia', {
			media: 'screen',
			features: [ { name: 'prefers-reduced-motion', value: 'reduce' } ],
		}, sessionId );
		await wait( 250 );
		const reducedMotion = await evaluate( cdp, sessionId, `(() => {
			const maximumSeconds = (value) => Math.max(...value.split(',').map((part) => {
				const number = parseFloat(part) || 0;
				return part.trim().endsWith('ms') ? number / 1000 : number;
			}));
			const root = document.querySelector('main') || document.body;
			const visible = Array.from(root.querySelectorAll('*')).filter((element) => {
				const style = getComputedStyle(element);
				return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
			});
			const offenders = [];
			for (const element of visible) {
				for (const pseudo of [null, '::before', '::after']) {
					const style = getComputedStyle(element, pseudo);
					const animation = maximumSeconds(style.animationDuration);
					const transition = maximumSeconds(style.transitionDuration);
					if (animation > 0.001 || transition > 0.001) {
						offenders.push({
							element: element.tagName.toLowerCase() + (element.id ? '#' + element.id : '') + (element.classList.length ? '.' + Array.from(element.classList).join('.') : ''),
							pseudo: pseudo || 'element',
							animation,
							transition,
						});
					}
				}
			}
			return {
				matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
				offenders,
			};
		})()` );
		await cdp.send( 'Emulation.setEmulatedMedia', { media: 'screen', features: [] }, sessionId );

		return { ...metrics, ledgers, reducedMotion };
	} finally {
		await cdp.send( 'Target.closeTarget', { targetId: target.targetId } );
	}
}

function ledgerSnapshotExpression( ledgers ) {
	const contracts = ledgers.map( ( ledger ) => ( {
		name: ledger.name,
		root: ledger.root,
		table: ledger.table,
		standing: ledger.standing,
	} ) );
	return `(() => {
		const contracts = ${ JSON.stringify( contracts ) };
		const isShown = (element) => {
			const style = getComputedStyle(element);
			return !element.hidden && style.display !== 'none' && style.visibility !== 'hidden' &&
				element.getClientRects().length > 0;
		};
		const isReadable = (element) => {
			if (!element || !element.textContent.trim() || !isShown(element)) return false;
			const bounds = element.getBoundingClientRect();
			if (bounds.width <= 1 || bounds.height <= 1) return false;
			for (let current = element; current; current = current.parentElement) {
				const style = getComputedStyle(current);
				if (current.getAttribute('aria-hidden') === 'true' || style.display === 'none' ||
					style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
			}
			return true;
		};
		return {
			url: location.href,
			pathname: location.pathname,
			ledgers: contracts.map((contract) => {
				const root = document.querySelector(contract.root);
				const rows = root ? Array.from(root.querySelectorAll(contract.table + ' tbody tr')) : [];
				const pressed = root?.querySelector('.hp-evidence-filter__button[aria-pressed="true"]');
				return {
					name: contract.name,
					rootPresent: !!root,
					rows: rows.length,
					visibleRows: rows.filter(isShown).length,
					standings: rows.filter((row) => isReadable(row.querySelector(contract.standing))).length,
					filterGroups: root?.querySelectorAll('.hp-evidence-filter').length || 0,
					statuses: root?.querySelectorAll('.hp-evidence-filter__status').length || 0,
					dataStates: rows.filter((row) => row.querySelector('th')?.hasAttribute('data-state')).length,
					pressedState: pressed?.dataset.state || null,
					statusText: root?.querySelector('.hp-evidence-filter__status')?.textContent.trim() || null,
				};
			}),
		};
	})()`;
}

function appendixLedgerSnapshotExpression() {
	return ledgerSnapshotExpression( APPENDIX_LEDGERS );
}

function digestLedgerSnapshotExpression() {
	return ledgerSnapshotExpression( [ DIGEST_LEDGER ] );
}

async function withPlacementScenarioTarget( cdp, options, callback ) {
	const target = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
	const attached = await cdp.send( 'Target.attachToTarget', {
		targetId: target.targetId,
		flatten: true,
	} );
	const sessionId = attached.sessionId;

	try {
		await cdp.send( 'Page.enable', {}, sessionId );
		await cdp.send( 'Runtime.enable', {}, sessionId );
		await cdp.send( 'DOM.enable', {}, sessionId );
		await cdp.send( 'Emulation.setDeviceMetricsOverride', {
			width: 1024,
			height: 1000,
			deviceScaleFactor: 1,
			mobile: false,
		}, sessionId );
		if ( options.preloadScript ) {
			await cdp.send( 'Page.addScriptToEvaluateOnNewDocument', {
				source: options.preloadScript,
			}, sessionId );
		}
		if ( options.disableScripts ) {
			await cdp.send( 'Emulation.setScriptExecutionDisabled', { value: true }, sessionId );
		}

		const url = new URL( options.route || '/placement-method-and-evidence/', ORIGIN ).href;
		const navigation = await cdp.send( 'Page.navigate', { url }, sessionId, NAVIGATION_RESPONSE_TIMEOUT_MS );
		assert( ! navigation.errorText, `${ url } failed to navigate during ${ options.name }: ${ navigation.errorText }` );
		await waitForDocumentMain( cdp, sessionId, url );
		if ( options.disableScripts ) {
			// Re-enable CDP evaluation only after load. Scripts skipped while the
			// document parsed are not replayed, preserving the deliberate no-JS case.
			await cdp.send( 'Emulation.setScriptExecutionDisabled', { value: false }, sessionId );
			await waitForPlacementStyles( cdp, sessionId );
		} else {
			await waitForPlacementStyles( cdp, sessionId );
			await evaluate( cdp, sessionId, `document.fonts ? Promise.race([
				document.fonts.ready,
				new Promise((resolve) => setTimeout(resolve, 8000)),
			]) : Promise.resolve()` );
			await wait( 250 );
		}
		return await callback( sessionId );
	} finally {
		await cdp.send( 'Target.closeTarget', { targetId: target.targetId } );
	}
}

async function inspectProgressiveEnhancementFallbacks( cdp ) {
	const digestNoJs = await withPlacementScenarioTarget(
		cdp,
		{ name: 'the Digest no-JavaScript check', route: '/job-placement-digest/', disableScripts: true },
		( sessionId ) => evaluate( cdp, sessionId, digestLedgerSnapshotExpression() )
	);

	const appendixNoJs = await withPlacementScenarioTarget(
		cdp,
		{ name: 'the appendix no-JavaScript check', disableScripts: true },
		( sessionId ) => evaluate( cdp, sessionId, appendixLedgerSnapshotExpression() )
	);

	const digestFailClosed = await withPlacementScenarioTarget(
		cdp,
		{
			name: 'the Digest fail-closed check',
			route: '/job-placement-digest/',
			preloadScript: `new MutationObserver(function (records, observer) {
				var state = document.querySelector('.hp-evidence-ledger .hp-evidence-table tbody td');
				if (state) {
					state.textContent = 'Unclassifiable';
					window.__hpVerifierPoisonedDigestState = true;
					observer.disconnect();
				}
			}).observe(document, { childList: true, subtree: true });`,
		},
		async ( sessionId ) => {
			const snapshot = await evaluate( cdp, sessionId, digestLedgerSnapshotExpression() );
			snapshot.poisonedState = await evaluate(
				cdp,
				sessionId,
				`window.__hpVerifierPoisonedDigestState === true && document.querySelector('.hp-evidence-table tbody td')?.textContent === 'Unclassifiable'`
			);
			return snapshot;
		}
	);

	const keywordFailClosed = await withPlacementScenarioTarget(
		cdp,
		{
			name: 'the keyword fail-closed check',
			preloadScript: `new MutationObserver(function (records, observer) {
				var standing = document.querySelector('.hp-resume-keyword-bank .hp-keyword-table tbody th strong');
				if (standing) {
					standing.textContent = 'Unclassifiable';
					window.__hpVerifierPoisonedStanding = true;
					observer.disconnect();
				}
			}).observe(document, { childList: true, subtree: true });`,
		},
		async ( sessionId ) => {
			const snapshot = await evaluate( cdp, sessionId, appendixLedgerSnapshotExpression() );
			snapshot.poisonedStanding = await evaluate(
				cdp,
				sessionId,
				`window.__hpVerifierPoisonedStanding === true && document.querySelector('.hp-keyword-table tbody th strong')?.textContent === 'Unclassifiable'`
			);
			return snapshot;
		}
	);

	const marketFailClosed = await withPlacementScenarioTarget(
		cdp,
		{
			name: 'the market fail-closed check',
			preloadScript: `new MutationObserver(function (records, observer) {
				var state = document.querySelector('.hp-live-states .hp-market-table tbody td:nth-of-type(4)');
				if (state) {
					state.textContent = 'Unclassifiable';
					window.__hpVerifierPoisonedMarketState = true;
					observer.disconnect();
				}
			}).observe(document, { childList: true, subtree: true });`,
		},
		async ( sessionId ) => {
			const snapshot = await evaluate( cdp, sessionId, appendixLedgerSnapshotExpression() );
			snapshot.poisonedState = await evaluate(
				cdp,
				sessionId,
				`window.__hpVerifierPoisonedMarketState === true && document.querySelector('.hp-market-table tbody td:nth-of-type(4)')?.textContent === 'Unclassifiable'`
			);
			return snapshot;
		}
	);

	const routerRemount = await withPlacementScenarioTarget(
		cdp,
		{ name: 'the router-remount check' },
		async ( sessionId ) => {
			const replacedRoots = await evaluate( cdp, sessionId, `(() => {
				history.pushState({}, '', location.pathname + '?hp-remount=1');
				const selectors = ['.hp-resume-keyword-bank', '.hp-live-states'];
				let replaced = 0;
				for (const selector of selectors) {
					const root = document.querySelector(selector);
					if (!root) continue;
					const replacement = root.cloneNode(true);
					replacement.querySelectorAll('.hp-evidence-filter, .hp-evidence-filter__status').forEach((node) => node.remove());
					replacement.querySelectorAll('tbody tr').forEach((row) => row.hidden = false);
					replacement.querySelectorAll('tbody th[data-state]').forEach((header) => header.removeAttribute('data-state'));
					root.replaceWith(replacement);
					replaced++;
				}
				return replaced;
			})()` );
			await wait( 250 );
			const snapshot = await evaluate( cdp, sessionId, appendixLedgerSnapshotExpression() );
			snapshot.replacedRoots = replacedRoots;
			return snapshot;
		}
	);

	const historyRemount = await withPlacementScenarioTarget(
		cdp,
		{ name: 'the history-remount check' },
		async ( sessionId ) => {
			const initialSearch = await evaluate( cdp, sessionId, `location.search` );
			await evaluate( cdp, sessionId, `history.pushState({}, '', location.pathname + '?hp-history=forward')` );
			// Let every delayed pushState mount settle before replacing the roots;
			// otherwise that pending timer could mask a missing popstate listener.
			await wait( 250 );
			const replacedRoots = await evaluate( cdp, sessionId, `(() => {
				const selectors = ['.hp-resume-keyword-bank', '.hp-live-states'];
				let replaced = 0;
				for (const selector of selectors) {
					const root = document.querySelector(selector);
					if (!root) continue;
					const replacement = root.cloneNode(true);
					replacement.querySelectorAll('.hp-evidence-filter, .hp-evidence-filter__status').forEach((node) => node.remove());
					replacement.querySelectorAll('tbody tr').forEach((row) => row.hidden = false);
					replacement.querySelectorAll('tbody th[data-state]').forEach((header) => header.removeAttribute('data-state'));
					root.replaceWith(replacement);
					replaced++;
				}
				return replaced;
			})()` );
			const traversal = await evaluate( cdp, sessionId, `new Promise((resolve) => {
				const timeout = setTimeout(() => resolve({ popstate: false, search: location.search }), 1500);
				addEventListener('popstate', () => {
					clearTimeout(timeout);
					resolve({ popstate: true, search: location.search });
				}, { once: true });
				history.back();
			})` );
			await wait( 250 );
			const snapshot = await evaluate( cdp, sessionId, appendixLedgerSnapshotExpression() );
			snapshot.replacedRoots = replacedRoots;
			snapshot.initialSearch = initialSearch;
			snapshot.traversal = traversal;
			return snapshot;
		}
	);

	return {
		digestNoJs,
		appendixNoJs,
		digestFailClosed,
		keywordFailClosed,
		marketFailClosed,
		routerRemount,
		historyRemount,
	};
}

function assertProgressiveEnhancementFallbacks( result ) {
	const byName = ( snapshot, name ) => snapshot.ledgers.find( ( ledger ) => ledger.name === name );
	const assertNoJsLedger = ( snapshot, contract, pageLabel ) => {
		const ledger = byName( snapshot, contract.name );
		assert( ledger?.rootPresent, `No-JS ${ pageLabel } is missing the ${ contract.name }.` );
		assert(
			ledger.rows === contract.rows && ledger.visibleRows === contract.rows,
			`No-JS ${ contract.name } shows ${ ledger.visibleRows } of ${ ledger.rows } rows; expected all ${ contract.rows }.`
		);
		assert( ledger.standings === contract.rows, `No-JS ${ contract.name } loses explicit standing text.` );
		assert(
			ledger.filterGroups === 0 && ledger.statuses === 0 && ledger.dataStates === 0,
			`No-JS ${ contract.name } retains injected filter state.`
		);
	};
	const assertCompleteAndUnmounted = ( ledger, contract, label ) => {
		assert( ledger?.rootPresent, `${ label } is missing the ${ contract.name } root.` );
		assert(
			ledger.rows === contract.rows && ledger.visibleRows === contract.rows &&
				ledger.filterGroups === 0 && ledger.statuses === 0 && ledger.dataStates === 0,
			`${ label } did not leave the complete ${ contract.name } untouched: ${ JSON.stringify( ledger ) }.`
		);
	};
	const assertMountedAtDefault = ( ledger, contract, label ) => {
		assert( ledger?.rootPresent, `${ label } is missing the ${ contract.name } root.` );
		assert(
			ledger.filterGroups === 1 && ledger.statuses === 1 && ledger.dataStates === contract.rows &&
				ledger.visibleRows === contract.initialRows && ledger.pressedState === contract.defaultState &&
				ledger.statusText === contract.openingStatus,
			`${ label } did not keep the independent ${ contract.name } enhancement at its exact default.`
		);
	};

	assert(
		result.digestNoJs.pathname === '/job-placement-digest/',
		`No-JS Digest check resolved to ${ result.digestNoJs.pathname }.`
	);
	assertNoJsLedger( result.digestNoJs, DIGEST_LEDGER, 'Digest' );

	assert(
		result.appendixNoJs.pathname === '/placement-method-and-evidence/',
		`No-JS appendix check resolved to ${ result.appendixNoJs.pathname }.`
	);
	for ( const contract of APPENDIX_LEDGERS ) {
		assertNoJsLedger( result.appendixNoJs, contract, 'appendix' );
	}

	assert( result.digestFailClosed.poisonedState, 'Fail-closed scenario did not poison the Digest state before mount.' );
	assertCompleteAndUnmounted(
		byName( result.digestFailClosed, DIGEST_LEDGER.name ),
		DIGEST_LEDGER,
		'Digest fail-closed scenario'
	);

	assert( result.keywordFailClosed.poisonedStanding, 'Fail-closed scenario did not poison the keyword standing before mount.' );
	assertCompleteAndUnmounted(
		byName( result.keywordFailClosed, 'keyword ledger' ),
		APPENDIX_LEDGERS[ 0 ],
		'Keyword fail-closed scenario'
	);
	assertMountedAtDefault(
		byName( result.keywordFailClosed, 'market screen' ),
		APPENDIX_LEDGERS[ 1 ],
		'Keyword fail-closed scenario'
	);

	assert( result.marketFailClosed.poisonedState, 'Fail-closed scenario did not poison the market state before mount.' );
	assertCompleteAndUnmounted(
		byName( result.marketFailClosed, 'market screen' ),
		APPENDIX_LEDGERS[ 1 ],
		'Market fail-closed scenario'
	);
	assertMountedAtDefault(
		byName( result.marketFailClosed, 'keyword ledger' ),
		APPENDIX_LEDGERS[ 0 ],
		'Market fail-closed scenario'
	);

	assert( result.routerRemount.replacedRoots === 2, 'Router-remount scenario did not replace both appendix ledger roots.' );
	for ( const contract of APPENDIX_LEDGERS ) {
		const ledger = byName( result.routerRemount, contract.name );
		assert( ledger?.rootPresent, `Router-remount scenario is missing the ${ contract.name } root.` );
		assert(
			ledger.filterGroups === 1 && ledger.statuses === 1 && ledger.dataStates === contract.rows,
			`Router remount left ${ contract.name } with ${ ledger.filterGroups } filter groups, ${ ledger.statuses } statuses, and ${ ledger.dataStates } classified rows.`
		);
		assert(
			ledger.visibleRows === contract.initialRows && ledger.pressedState === contract.defaultState &&
				ledger.statusText === contract.openingStatus,
			`Router remount did not restore the ${ contract.name } ${ contract.defaultState } default exactly.`
		);
	}

	assert( result.historyRemount.replacedRoots === 2, 'History-remount scenario did not replace both appendix ledger roots.' );
	assert(
		result.historyRemount.traversal?.popstate &&
			result.historyRemount.traversal.search === result.historyRemount.initialSearch,
		`History-remount scenario did not complete an actual Back traversal: ${ JSON.stringify( result.historyRemount.traversal ) }.`
	);
	for ( const contract of APPENDIX_LEDGERS ) {
		const ledger = byName( result.historyRemount, contract.name );
		assert( ledger?.rootPresent, `History-remount scenario is missing the ${ contract.name } root.` );
		assert(
			ledger.filterGroups === 1 && ledger.statuses === 1 && ledger.dataStates === contract.rows,
			`History traversal left ${ contract.name } with ${ ledger.filterGroups } filter groups, ${ ledger.statuses } statuses, and ${ ledger.dataStates } classified rows.`
		);
		assert(
			ledger.visibleRows === contract.initialRows && ledger.pressedState === contract.defaultState &&
				ledger.statusText === contract.openingStatus,
			`History traversal did not restore the ${ contract.name } ${ contract.defaultState } default exactly.`
		);
	}
}

async function withChrome( callback ) {
	const userDataDir = await fsPromises.mkdtemp( path.join( os.tmpdir(), 'hp-recruiter-pages-chrome-' ) );
	const chrome = spawn( resolveChrome(), [
		'--headless=new',
		'--disable-gpu',
		'--no-sandbox',
		'--remote-debugging-port=0',
		`--user-data-dir=${ userDataDir }`,
		'about:blank',
	], { stdio: [ 'ignore', 'ignore', 'pipe' ] } );

	try {
		const wsUrl = await waitForDevToolsUrl( chrome );
		const cdp = await createCdpClient( wsUrl );
		try {
			await callback( cdp );
		} finally {
			cdp.close();
		}
	} finally {
		if ( ! chrome.killed ) {
			chrome.kill( 'SIGTERM' );
			await new Promise( ( resolve ) => {
				const timer = setTimeout( resolve, 2000 );
				chrome.once( 'exit', () => {
					clearTimeout( timer );
					resolve();
				} );
			} );
		}
		await rmRetry( userDataDir );
	}
}

async function verifyRenderedContracts() {
	await withChrome( async ( cdp ) => {
		const failures = [];
		for ( const page of PAGES ) {
			for ( const viewport of page.viewports ) {
				try {
					const result = await inspectPage( cdp, page, viewport );
					assertPageMetrics( result, page, viewport );
					const heightSummary =
						page.name === 'digest' && ! viewport.zoomPercent
							? `, document height ${ result.documentHeight }px/${ DIGEST_HEIGHT_BUDGETS[ viewport.name ] }px budget`
							: '';
					console.log(
						`verified ${ result.url } at ${ viewport.width }px: one H1, sequential outline, no document overflow, reduced motion${ heightSummary }`
					);
				} catch ( error ) {
					failures.push( `${ page.name }/${ viewport.name }: ${ error.message }` );
					console.error( `failed ${ page.name }/${ viewport.name }: ${ error.message }` );
				}
			}
		}
		try {
			const enhancementFallbacks = await inspectProgressiveEnhancementFallbacks( cdp );
			assertProgressiveEnhancementFallbacks( enhancementFallbacks );
			console.log( 'verified placement progressive enhancement: complete no-JS ledgers, per-ledger fail-closed behavior, and push/back remounts' );
		} catch ( error ) {
			failures.push( `progressive enhancement: ${ error.message }` );
			console.error( `failed progressive enhancement: ${ error.message }` );
		}
		if ( failures.length > 0 ) {
			throw new Error( `${ failures.length } rendered contract failure(s):\n- ${ failures.join( '\n- ' ) }` );
		}
	} );
}

async function main() {
	verifySourceContracts();
	if ( SOURCE_ONLY ) {
		return;
	}
	await verifyRenderedContracts();
}

main().catch( ( error ) => {
	console.error( error.message );
	process.exit( 1 );
} );
