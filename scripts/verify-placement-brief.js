#!/usr/bin/env node
/** Source and rendered checks for the consolidated phase of the placement page. */
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { selectDigestSource, assertKnownOptions } = require( './lib/page-phase-contract' );
const { verifyPlacementBrief, RESEARCH_ANCHORS } = require( './lib/placement-brief-contract' );
const { getOrigin } = require( './lib/site-url' );
const { withChrome, evaluate, pressKey } = require( './lib/search-browser' );

async function main() {
	const args = process.argv.slice( 2 );
	assertKnownOptions( args, [ '--source-only', '--drafts' ] );
	verifyPlacementBrief( fs.readFileSync( selectDigestSource( args ), 'utf8' ) );
	console.log( 'Consolidated placement source contract verified.' );
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
		async function navigate( hash = '' ) {
			// A same-document hash change emits no load event. Start deep-link
			// cases from a different document to test the actual initial load.
			if ( hash ) {
				const blank = cdp.once( 'Page.loadEventFired', sessionId );
				await cdp.send( 'Page.navigate', { url: 'about:blank' }, sessionId );
				await blank;
			}
			const loaded = cdp.once( 'Page.loadEventFired', sessionId, 30000 );
			await cdp.send( 'Page.navigate', { url: `${ origin }/job-placement-digest/${ hash }` }, sessionId, 30000 );
			await loaded;
			await run( 'document.fonts.ready.then(() => true)' );
		}
		for ( const width of [ 1440, 1024, 782, 781, 600, 390, 320 ] ) {
			await cdp.send( 'Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId );
			await navigate();
			const result = await run( `(() => {
				const root = document.querySelector('.hp-placement-brief');
				if (!root) throw Error('Rendered route does not contain the selected brief');
				const visible = [...root.querySelectorAll('h1,h2,h3,h4')].filter(e=>!e.closest('details'));
				return {
					outline: visible.map(e=>Number(e.tagName.slice(1))),
					overflow: document.documentElement.scrollWidth > innerWidth + 1,
					measure: [...root.querySelectorAll('p')].every(e=>e.getBoundingClientRect().width <= 36 * parseFloat(getComputedStyle(document.documentElement).fontSize) + 1),
					closed: !root.querySelector('details').open,
					featureSmaller: parseFloat(getComputedStyle(root.querySelector('h3')).fontSize) < parseFloat(getComputedStyle(root.querySelector('h1')).fontSize),
					targets: [...root.querySelectorAll('.wp-block-button__link, summary')].every(e=>e.getBoundingClientRect().height >= 44),
					columns: getComputedStyle(root.querySelector('.hp-placement-brief__supporting')).gridTemplateColumns.split(' ').length
				};
			})()` );
			assert.deepEqual( result.outline, [ 1, 2, 3, 3, 3, 2, 2 ] );
			assert( ! result.overflow && result.measure && result.closed && result.featureSmaller && result.targets, `${ width }px geometry: ${ JSON.stringify( result ) }` );
			assert.equal( result.columns, width <= 781 ? 1 : 2 );
			if ( [ 1440, 390 ].includes( width ) ) {
				const image = await cdp.send( 'Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sessionId );
				fs.writeFileSync( path.join( capture, `placement-${ width }.png` ), Buffer.from( image.data, 'base64' ) );
			}
			await run( 'document.querySelector(".hp-placement-brief summary").focus()' );
			await pressKey( cdp, sessionId, 'Enter' );
			assert( await run( 'document.querySelector(".hp-placement-brief details").open' ), 'Keyboard opens the native disclosure.' );
			assert( await run( 'document.documentElement.scrollWidth <= innerWidth + 1' ), `Expanded research fits ${ width }px.` );
			console.log( `${ width }px: outline, measure, hierarchy, controls and expanded research passed.` );
		}
		await cdp.send( 'Emulation.setEmulatedMedia', { features: [ { name: 'prefers-reduced-motion', value: 'reduce' } ] }, sessionId );
		for ( const anchor of RESEARCH_ANCHORS ) {
			await navigate( `#${ anchor }` );
			assert( await run( 'document.querySelector(".hp-placement-brief details").open' ), `Direct #${ anchor } opens research.` );
			const targetTop = await run( `document.getElementById(${ JSON.stringify( anchor ) }).getBoundingClientRect().top` );
			assert( targetTop >= 0 && targetTop < 400, `#${ anchor } scrolls into view (${ targetTop }).` );
		}
		await navigate();
		await run( 'document.documentElement.style.fontSize = "200%"; document.querySelector(".hp-placement-brief details").open = true' );
		assert( await run( 'document.documentElement.scrollWidth <= innerWidth + 1' ), '200% root text size remains contained.' );
		await cdp.send( 'Emulation.setScriptExecutionDisabled', { value: true }, sessionId );
		await navigate();
		// Runtime evaluation remains available; page JavaScript is disabled.
		assert.equal( await run( 'document.querySelectorAll(".hp-placement-brief tbody tr").length' ), 54 );
		await run( 'document.querySelector(".hp-placement-brief summary").focus()' );
		await pressKey( cdp, sessionId, 'Enter' );
		assert( await run( 'document.querySelector(".hp-placement-brief details").open' ), 'No-JS keyboard access retains all research.' );
		assert.deepEqual( errors, [], 'No runtime exceptions.' );
		console.log( 'Direct research links, reduced motion, 200% text and no-JS disclosure passed.' );
	} );
}

if ( require.main === module ) main().catch( ( error ) => { console.error( error ); process.exitCode = 1; } );
module.exports = { main };
