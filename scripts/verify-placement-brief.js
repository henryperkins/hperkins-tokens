#!/usr/bin/env node
/** Source and rendered checks for Support Engineering and its separate archive. */
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { selectDigestSource, selectPlacementMethodSource, assertKnownOptions } = require( './lib/page-phase-contract' );
const { verifyPlacementBrief, verifyPlacementArchive, RESEARCH_ANCHORS, EXAMPLES } = require( './lib/placement-brief-contract' );
const { getOrigin } = require( './lib/site-url' );
const { withChrome, evaluate, pressKey } = require( './lib/search-browser' );

const WIDTHS = [ 1440, 1024, 782, 781, 600, 390, 320 ];
const DIGEST_ROUTE = '/job-placement-digest/';
const ARCHIVE_ROUTE = '/placement-method-and-evidence/';

function matchesRouteLink( href, currentUrl, expectedPath, expectedHash = '' ) {
	try {
		const current = new URL( currentUrl );
		const target = new URL( href, current );
		// WooCommerce may append its geolocation query to native internal links.
		return target.origin === current.origin && target.pathname === expectedPath && target.hash === expectedHash;
	} catch {
		return false;
	}
}

function inspectBrief( width ) {
	const root = document.querySelector( '.hp-placement-brief' );
	if ( ! root ) throw Error( 'Rendered route does not contain the selected brief' );
	const rect = ( element ) => {
		const box = element.getBoundingClientRect();
		return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
	};
	const articles = [ ...root.querySelectorAll( 'article.hp-placement-brief__example' ) ];
	const articleMetrics = articles.map( ( article ) => {
		const body = article.querySelector( '.hp-placement-brief__example-body' );
		return { article: rect( article ), numeral: rect( article.querySelector( '.hp-placement-brief__number' ) ), body: rect( body ), fontWeight: getComputedStyle( article.querySelector( 'h3' ) ).fontWeight };
	} );
	const sizes = ( selector ) => [ ...root.querySelectorAll( selector ) ].map( ( element ) => parseFloat( getComputedStyle( element ).fontSize ) );
	const controls = [ ...root.querySelectorAll( '.wp-block-button__link, summary, .hp-placement-brief__jump-list a' ) ];
	const evidence = [ ...root.querySelectorAll( '.hp-placement-brief__links a, .hp-placement-brief__aside a' ) ].filter( ( element ) => ! element.closest( 'details' ) );
	// Henry widened the reviewed candidate to 40rem after viewing the local preview.
	const readingWidth = 40 * parseFloat( getComputedStyle( document.documentElement ).fontSize );
	const rootStyle = getComputedStyle( root );
	const availableWidth = document.documentElement.clientWidth - parseFloat( rootStyle.paddingLeft ) - parseFloat( rootStyle.paddingRight );
	const column = root.querySelector( '.hp-placement-brief__hero' ).getBoundingClientRect();
	return {
		outline: [ ...root.querySelectorAll( 'h1,h2,h3,h4' ) ].filter( ( element ) => ! element.closest( 'details' ) ).map( ( element ) => Number( element.tagName.slice( 1 ) ) ),
		overflow: document.documentElement.scrollWidth > innerWidth + 1,
		measure: Math.abs( column.width - Math.min( readingWidth, availableWidth ) ) <= 1,
		centered: Math.abs( column.left - ( document.documentElement.clientWidth - column.right ) ) <= 1,
		closed: ! root.querySelector( 'details' ).open,
		articles: articleMetrics,
		sizes: { facts: sizes( '.hp-placement-brief__fact-value' ), chips: sizes( '.hp-chip' ), links: sizes( '.hp-placement-brief__links a' ), identity: sizes( '.hp-placement-brief__identity' ) },
		jumps: [ ...root.querySelectorAll( '.hp-placement-brief__jump-list a' ) ].map( ( link ) => link.hash ),
		controls: controls.map( ( element ) => rect( element ).height ),
		evidenceTargets: evidence.map( ( element ) => rect( element ).height ),
		proofHierarchy: articles.every( ( article ) => parseFloat( getComputedStyle( article.querySelector( 'h3' ) ).fontSize ) < parseFloat( getComputedStyle( root.querySelector( 'h1' ) ).fontSize ) ),
		rows: root.querySelectorAll( 'tbody tr' ).length,
		width,
	};
}

function assertBriefMetrics( result, width ) {
	const context = width + 'px brief: ' + JSON.stringify( result );
	assert.deepEqual( result.outline, [ 1, 2, 3, 3, 3, 2, 2 ], context );
	assert( ! result.overflow && result.measure && result.centered && result.closed && result.proofHierarchy, context );
	assert.equal( result.articles.length, 3, context );
	assert.equal( result.rows, 0, 'Digest contains a research summary, without full tables.' );
	assert.deepEqual( result.jumps, EXAMPLES.map( ( [ anchor ] ) => '#' + anchor ) );
	assert( result.controls.every( ( height ) => height >= 43.9 ), 'Actions, jump links and summary meet the 44px floor: ' + context );
	for ( const [ name, sizes ] of Object.entries( result.sizes ) ) {
		assert( sizes.length > 0 && sizes.every( ( size ) => Math.abs( size - 15 ) < 0.1 ), '15px ' + name + ': ' + context );
	}
	assert.equal( result.sizes.facts.length, 6 );
	assert.equal( result.sizes.chips.length, 3 );
	result.articles.forEach( ( article, index ) => {
		assert( Number( article.fontWeight ) === 600, 'Example headings use the reviewed 600 weight: ' + context );
		if ( index ) assert( article.article.top >= result.articles[ index - 1 ].article.bottom + 24, 'Examples stack without a featured/supporting split: ' + context );
		if ( width >= 782 ) {
			assert( article.numeral.right <= article.body.left - 15 && article.numeral.left < article.body.left - 48, 'Numeral hangs from 782px: ' + context );
			assert( Math.abs( article.body.left - result.articles[ 0 ].body.left ) < 1, 'Equal article text aligns: ' + context );
		} else {
			assert( article.numeral.bottom <= article.body.top + 1 && Math.abs( article.numeral.left - article.body.left ) < 1, 'Numeral stacks below 782px: ' + context );
		}
	} );
	if ( width <= 781 ) assert( result.evidenceTargets.every( ( height ) => height >= 43.9 ), 'Phone evidence links meet the 44px floor: ' + context );
}

function inspectArchive() {
	const tables = [ '.hp-keyword-table', '.hp-market-table' ].map( ( selector ) => {
		const table = document.querySelector( selector );
		if ( ! table ) throw Error( 'Archive is missing ' + selector );
		const root = table.closest( '.hp-resume-keyword-bank, .hp-live-states' );
		const rows = [ ...table.querySelectorAll( 'tbody tr' ) ];
		const pressed = root.querySelector( '.hp-evidence-filter button[aria-pressed="true"]' );
		return { rows: rows.length, visible: rows.filter( ( row ) => ! row.hidden && getComputedStyle( row ).display !== 'none' ).length, state: pressed?.dataset.state || pressed?.getAttribute( 'data-filter' ) || pressed?.textContent.trim(), controls: root.querySelectorAll( '.hp-evidence-filter' ).length };
	} );
	return {
		path: location.pathname,
		title: document.querySelector( 'main h1' )?.textContent.trim(),
		overflow: document.documentElement.scrollWidth > innerWidth + 1,
		tables,
		copy: document.querySelector( 'main' ).textContent.includes( 'Availability cleanup 6 October 2026' ),
	};
}

function inspectFocus() {
	const active = document.activeElement;
	const style = getComputedStyle( active );
	return { focused: !! active && active !== document.body, outlineWidth: parseFloat( style.outlineWidth ), outlineStyle: style.outlineStyle };
}

function inspectFragment( anchor ) {
	const target = document.getElementById( anchor );
	const header = document.querySelector( 'header.wp-block-template-part' );
	const bounds = target?.getBoundingClientRect();
	return { hash: location.hash, exists: !! target, top: bounds?.top, bottom: bounds?.bottom, headerExists: !! header, headerBottom: header?.getBoundingClientRect().bottom || 0, focused: document.activeElement === target, tabindex: target?.getAttribute( 'tabindex' ), inTabOrder: target?.tabIndex >= 0 };
}

function inspectTextResize() {
	const root = document.querySelector( 'main' );
	const actions = [ ...root.querySelectorAll( '.hp-placement-brief .wp-block-button__link' ) ];
	return {
		overflow: document.documentElement.scrollWidth > innerWidth + 1,
		actionCount: actions.length,
		actions: actions.map( ( element ) => {
			const box = element.getBoundingClientRect();
			const range = document.createRange();
			range.selectNodeContents( element );
			const textRects = [ ...range.getClientRects() ];
			return { visible: box.width > 0 && box.height >= 44, rectCount: textRects.length, contained: textRects.every( ( rect ) => rect.left >= box.left - 1 && rect.right <= box.right + 1 && rect.top >= box.top - 1 && rect.bottom <= box.bottom + 1 ) };
		} ),
	};
}

async function main() {
	const args = process.argv.slice( 2 );
	assertKnownOptions( args, [ '--source-only', '--drafts' ] );
	verifyPlacementBrief( fs.readFileSync( selectDigestSource( args ), 'utf8' ) );
	verifyPlacementArchive( fs.readFileSync( selectPlacementMethodSource( args ), 'utf8' ), fs.readFileSync( selectPlacementMethodSource(), 'utf8' ) );
	console.log( 'Support Engineering and separate archive source contracts verified.' );
	if ( args.includes( '--source-only' ) ) return;
	const origin = getOrigin();
	const capture = path.resolve( process.env.HPERKINS_CAPTURE_DIR || path.join( __dirname, '../output/placement-brief' ) );
	fs.mkdirSync( capture, { recursive: true } );
	await withChrome( async ( cdp ) => {
		const { targetId } = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
		const { sessionId } = await cdp.send( 'Target.attachToTarget', { targetId, flatten: true } );
		await cdp.send( 'Page.enable', {}, sessionId );
		await cdp.send( 'Runtime.enable', {}, sessionId );
		const errors = [];
		cdp.on( 'Runtime.exceptionThrown', ( event ) => errors.push( event.exceptionDetails.text ), sessionId );
		const run = ( expression ) => evaluate( cdp, sessionId, expression );
		const probe = ( fn, argument ) => run( '(' + fn.toString() + ')(' + JSON.stringify( argument ) + ')' );
		async function settle() {
			await run( 'document.fonts.ready' );
			// A page timer never fires when script execution is disabled. Keep
			// verifier settling outside the page so no-JS proof stays genuinely disabled.
			await new Promise( ( resolve ) => setTimeout( resolve, 120 ) );
		}
		async function navigate( route = DIGEST_ROUTE, hash = '' ) {
			// Use a different document for actual initial-load fragment proof.
			const blank = cdp.once( 'Page.loadEventFired', sessionId );
			await cdp.send( 'Page.navigate', { url: 'about:blank' }, sessionId );
			await blank;
			const loaded = cdp.once( 'Page.loadEventFired', sessionId, 30000 );
			await cdp.send( 'Page.navigate', { url: origin + route + hash }, sessionId, 30000 );
			await loaded;
			await settle();
			assert.equal( await run( 'location.pathname' ), route, 'The archive route must remain directly reachable without a method redirect.' );
		}
		async function assertFocus( selector, route = null ) {
			await pressKey( cdp, sessionId, 'Tab' );
			if ( route ) {
				await run( '(() => { const links = [...document.querySelectorAll(' + JSON.stringify( selector ) + ')].filter(a => (' + matchesRouteLink.toString() + ')(a.getAttribute("href"), location.href, ' + JSON.stringify( route ) + ')); if (links.length !== 1) throw Error("Expected one same-origin route action, found " + links.length); links[0].focus(); })()' );
			} else {
				await run( 'document.querySelector(' + JSON.stringify( selector ) + ').focus()' );
			}
			const focus = await probe( inspectFocus );
			assert( focus.focused && focus.outlineWidth >= 2 && focus.outlineStyle !== 'none', 'Keyboard focus is visible on ' + selector + ': ' + JSON.stringify( focus ) );
		}
		async function assertFragment( anchor, requireFocus = false ) {
			await new Promise( ( resolve ) => setTimeout( resolve, 650 ) );
			const state = await probe( inspectFragment, anchor );
			assert( state.exists && state.hash === '#' + anchor, 'Fragment resolves to #' + anchor );
			assert( state.headerExists && state.top >= state.headerBottom - 1 && state.top < 500, '#' + anchor + ' clears the sticky header: ' + JSON.stringify( state ) );
			if ( requireFocus ) assert( state.focused && state.tabindex === '-1' && ! state.inTabOrder, 'Keyboard jump transfers programmatic-only focus to #' + anchor + ': ' + JSON.stringify( state ) );
		}
		async function screenshot( name ) {
			const result = await cdp.send( 'Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sessionId );
			fs.writeFileSync( path.join( capture, name + '.png' ), Buffer.from( result.data, 'base64' ) );
		}
		for ( const width of WIDTHS ) {
			await cdp.send( 'Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId );
			await navigate();
			assertBriefMetrics( await probe( inspectBrief, width ), width );
			if ( [ 1440, 390 ].includes( width ) ) await screenshot( 'placement-' + width );
			for ( const [ anchor ] of EXAMPLES ) {
				const selector = '.hp-placement-brief__jump-list a[href="#' + anchor + '"]';
				await assertFocus( selector );
				await pressKey( cdp, sessionId, 'Enter' );
				await assertFragment( anchor, true );
				await pressKey( cdp, sessionId, 'Tab' );
				const continuation = await run( '(() => { const target = document.getElementById(' + JSON.stringify( anchor ) + '); const active = document.activeElement; return active !== document.body && (target.contains(active) || !!(target.compareDocumentPosition(active) & Node.DOCUMENT_POSITION_FOLLOWING)); })()' );
				assert( continuation, 'Tab continues logically after #' + anchor );
			}
			await assertFocus( '.hp-placement-brief summary' );
			await pressKey( cdp, sessionId, 'Enter' );
			assert( await run( 'document.querySelector(".hp-placement-brief details").open' ), 'Keyboard opens native research.' );
			assert( await run( 'document.documentElement.scrollWidth <= innerWidth + 1' ), 'Expanded summary fits ' + width + 'px.' );
			if ( width <= 781 ) assert( await run( '[...document.querySelectorAll(".hp-placement-brief details .hp-placement-brief__links a")].every(e => e.getBoundingClientRect().height >= 43.9)' ), 'Expanded archive links meet the phone touch floor.' );
			await assertFocus( '.hp-placement-brief details a', ARCHIVE_ROUTE );
			await assertFocus( '.hp-placement-brief__hero a', '/contact/' );
			await assertFocus( '.hp-placement-brief__closing a', '/one-page-resume/' );
			await pressKey( cdp, sessionId, 'Tab' );
			await run( 'document.querySelector(".hp-placement-brief summary").focus()' );
			await pressKey( cdp, sessionId, 'Enter' );
			assert( ! await run( 'document.querySelector(".hp-placement-brief details").open' ), 'Keyboard closes native research.' );
			await navigate( ARCHIVE_ROUTE );
			const archive = await probe( inspectArchive );
			assert.equal( archive.title, 'Placement Method and Evidence' );
			assert( ! archive.overflow && archive.copy, width + 'px archive: ' + JSON.stringify( archive ) );
			assert.deepEqual( archive.tables.map( ( table ) => [ table.rows, table.visible ] ), [ [ 34, 34 ], [ 10, 10 ] ], 'Archive defaults to all 44 records.' );
			assert( archive.tables.every( ( table ) => table.controls === 1 && /all/i.test( table.state ) ), 'Both archive filters mount once on All: ' + JSON.stringify( archive ) );
			if ( [ 1440, 390 ].includes( width ) ) await screenshot( 'archive-' + width );
			for ( const [ root, state, expected ] of [ [ '.hp-resume-keyword-bank', 'partial', [ 11, 10 ] ], [ '.hp-live-states', 'live', [ 34, 5 ] ] ] ) {
				const selector = root + ' .hp-evidence-filter button[data-state="' + state + '"]';
				await assertFocus( selector );
				await pressKey( cdp, sessionId, 'Enter' );
				assert.deepEqual( ( await probe( inspectArchive ) ).tables.map( ( table ) => table.visible ), expected, 'Keyboard narrows the archive ' + root );
				await assertFocus( root + ' .hp-evidence-filter button[data-state="all"]' );
				await pressKey( cdp, sessionId, 'Enter' );
				assert.deepEqual( ( await probe( inspectArchive ) ).tables.map( ( table ) => table.visible ), [ 34, 10 ], 'All restores every archive record.' );
			}
			console.log( width + 'px: Digest hierarchy, 40rem measure, numbered articles, 15px metadata, 44px controls, keyboard/focus and complete archive passed.' );
		}
		await cdp.send( 'Emulation.setEmulatedMedia', { features: [ { name: 'prefers-reduced-motion', value: 'reduce' } ] }, sessionId );
		for ( const anchor of RESEARCH_ANCHORS ) {
			await navigate( ARCHIVE_ROUTE, '#' + anchor );
			await assertFragment( anchor );
			assert.deepEqual( ( await probe( inspectArchive ) ).tables.map( ( table ) => table.visible ), [ 34, 10 ], 'Direct archive fragments retain all records.' );
		}
		for ( const anchor of [ 'appendix', 'research-notes' ] ) {
			await navigate( DIGEST_ROUTE, '#' + anchor );
			await assertFragment( anchor );
			assert( ! await run( 'document.querySelector(".hp-placement-brief details").open' ), 'Summary target stays closed for #' + anchor );
		}
		await navigate();
		const motion = await run( '(() => { const root = document.querySelector(".hp-placement-brief"); return { reduce: matchMedia("(prefers-reduced-motion: reduce)").matches, animations: root.getAnimations({subtree:true}).filter(a => a.playState === "running").length }; })()' );
		assert( motion.reduce && motion.animations === 0, 'Reduced motion adds no running page animations.' );
		for ( const route of [ DIGEST_ROUTE, ARCHIVE_ROUTE ] ) {
			for ( const width of [ 1024, 320 ] ) {
				await cdp.send( 'Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId );
				await navigate( route );
				await run( 'document.documentElement.style.fontSize = "200%"; const details = document.querySelector(".hp-placement-brief details"); if(details) details.open = true' );
				await settle();
				const resized = await probe( inspectTextResize );
				assert( ! resized.overflow, route + ' 200% text fits ' + width + 'px: ' + JSON.stringify( resized ) );
				if ( route === DIGEST_ROUTE ) assert( resized.actionCount === 4 && resized.actions.every( ( action ) => action.visible && action.rectCount > 0 && action.contained ), '200% actions remain visible with contained text: ' + JSON.stringify( resized ) );
				else assert.deepEqual( ( await probe( inspectArchive ) ).tables.map( ( table ) => table.visible ), [ 34, 10 ] );
			}
		}
		await cdp.send( 'Emulation.setScriptExecutionDisabled', { value: true }, sessionId );
		await navigate();
		assert.equal( await run( 'document.querySelectorAll(".hp-placement-brief article").length' ), 3 );
		await run( 'document.querySelector(".hp-placement-brief summary").focus()' );
		await pressKey( cdp, sessionId, 'Enter' );
		assert( await run( 'document.querySelector(".hp-placement-brief details").open' ), 'No-JS keyboard opens the summary.' );
		for ( const [ anchor ] of EXAMPLES ) {
			await navigate( DIGEST_ROUTE, '#' + anchor );
			await assertFragment( anchor );
		}
		for ( const anchor of [ '', ...RESEARCH_ANCHORS ] ) {
			await navigate( ARCHIVE_ROUTE, anchor ? '#' + anchor : '' );
			const archive = await probe( inspectArchive );
			assert.deepEqual( archive.tables.map( ( table ) => [ table.rows, table.visible, table.controls ] ), [ [ 34, 34, 0 ], [ 10, 10, 0 ] ], 'No-JS archive retains all 44 readable rows without generated controls.' );
			if ( anchor ) await assertFragment( anchor );
		}
		assert.deepEqual( errors, [], 'No runtime exceptions.' );
		console.log( 'Direct archive anchors, closed summary targets, reduced motion, 200% text and no-JS content passed.' );
	} );
}

if ( require.main === module ) main().catch( ( error ) => { console.error( error ); process.exitCode = 1; } );
module.exports = { main, WIDTHS, assertBriefMetrics, matchesRouteLink };
