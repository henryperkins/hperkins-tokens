#!/usr/bin/env node
/**
 * Dependency-free mobile regression check for the Expose/Govern/Attest cards.
 *
 * Launches the installed Chrome through the DevTools Protocol, visits the live
 * pages that render the shared RingCard pattern, and fails if text blocks inside
 * a card collide or if a page introduces horizontal overflow at phone width.
 */
const { spawn } = require( 'node:child_process' );
const fs = require( 'node:fs/promises' );
const http = require( 'node:http' );
const os = require( 'node:os' );
const path = require( 'node:path' );

const CHROME = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const ORIGIN = process.env.HPERKINS_ORIGIN || 'https://hperkins.blog';
const PAGES = [ '/', '/ai-enablement/' ];
const VIEWPORT = { width: 320, height: 800, deviceScaleFactor: 1, mobile: true };

function wait( ms ) {
	return new Promise( ( resolve ) => setTimeout( resolve, ms ) );
}

async function rmRetry( target ) {
	let lastError;
	for ( let attempt = 0; attempt < 8; attempt++ ) {
		try {
			await fs.rm( target, { recursive: true, force: true } );
			return;
		} catch ( error ) {
			lastError = error;
			await wait( 250 );
		}
	}
	throw lastError;
}

async function waitForDevToolsUrl( chrome ) {
	let buffer = '';
	return new Promise( ( resolve, reject ) => {
		const timer = setTimeout( () => reject( new Error( 'Timed out waiting for Chrome DevTools URL.' ) ), 10000 );
		chrome.stderr.on( 'data', ( chunk ) => {
			buffer += chunk.toString();
			const match = buffer.match( /(ws:\/\/127\.0\.0\.1:\d+\/devtools\/browser\/[^\s]+)/ );
			if ( match ) {
				clearTimeout( timer );
				resolve( match[1] );
			}
		} );
		chrome.on( 'exit', ( code ) => {
			clearTimeout( timer );
			reject( new Error( `Chrome exited before DevTools was ready (code ${ code }).` ) );
		} );
	} );
}

function createCdpClient( wsUrl ) {
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
			// A dropped CDP response must fail the run, not hang it forever.
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
			const timer = setTimeout( () => reject( new Error( `Timed out waiting for ${ method }.` ) ), timeout );
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

async function inspectPage( cdp, url ) {
	const target = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
	const attached = await cdp.send( 'Target.attachToTarget', {
		targetId: target.targetId,
		flatten: true,
	} );
	const sessionId = attached.sessionId;

	await cdp.send( 'Page.enable', {}, sessionId );
	await cdp.send( 'Runtime.enable', {}, sessionId );
	await cdp.send( 'Emulation.setDeviceMetricsOverride', VIEWPORT, sessionId );

	const loaded = cdp.once( 'Page.loadEventFired', sessionId );
	await cdp.send( 'Page.navigate', { url }, sessionId );
	await loaded;
	await wait( 500 );

	const expression = `(() => {
		const round = (n) => Math.round(n * 10) / 10;
		const rect = (el) => {
			const r = el.getBoundingClientRect();
			return { left: round(r.left), top: round(r.top), right: round(r.right), bottom: round(r.bottom), width: round(r.width), height: round(r.height) };
		};
		const intersects = (a, b) => (
			Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
			Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
		);
		const selector = '.hp-ring-card__head, .hp-ring-card__action, .hp-ring-card__virtues, .hp-ring-card__description, .hp-ring-card__cta';
		const cards = Array.from(document.querySelectorAll('.hp-ring-card')).map((card, cardIndex) => {
			const pieces = Array.from(card.querySelectorAll(selector)).map((el) => ({
				name: Array.from(el.classList).find((name) => name.startsWith('hp-ring-card__')) || el.tagName.toLowerCase(),
				text: el.textContent.trim().replace(/\\s+/g, ' '),
				rect: rect(el),
			})).filter((piece) => piece.rect.width > 0 && piece.rect.height > 0);
			const overlaps = [];
			for (let i = 0; i < pieces.length; i++) {
				for (let j = i + 1; j < pieces.length; j++) {
					if (intersects(pieces[i].rect, pieces[j].rect)) {
						overlaps.push({ cardIndex, first: pieces[i], second: pieces[j] });
					}
				}
			}
			return { cardIndex, rect: rect(card), overlaps };
		});
		return {
			url: location.href,
			viewport: { width: innerWidth, height: innerHeight },
			scrollWidth: document.documentElement.scrollWidth,
			cardCount: cards.length,
			cards,
		};
	})()`;

	const evaluated = await cdp.send( 'Runtime.evaluate', {
		expression,
		awaitPromise: true,
		returnByValue: true,
	}, sessionId );

	await cdp.send( 'Target.closeTarget', { targetId: target.targetId } );
	return evaluated.result.value;
}

async function main() {
	const userDataDir = await fs.mkdtemp( path.join( os.tmpdir(), 'hp-ring-card-chrome-' ) );
	const chrome = spawn( CHROME, [
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
		const failures = [];
		for ( const page of PAGES ) {
			const url = new URL( page, ORIGIN ).href;
			const result = await inspectPage( cdp, url );
			// Guard against a vacuous pass: both pages must actually render the
			// three-ring section for the overlap checks to mean anything.
			if ( result.cardCount < 3 ) {
				failures.push( `${ url } renders ${ result.cardCount } ring cards, expected the three-ring section.` );
			}
			const horizontalOverflow = result.scrollWidth - result.viewport.width;
			if ( horizontalOverflow > 1 ) {
				failures.push( `${ url } has ${ horizontalOverflow }px horizontal overflow at ${ result.viewport.width }px.` );
			}
			for ( const card of result.cards ) {
				for ( const overlap of card.overlaps ) {
					failures.push(
						`${ url } card ${ overlap.cardIndex + 1 } overlaps ${ overlap.first.name } (${ overlap.first.text }) with ${ overlap.second.name } (${ overlap.second.text }).`
					);
				}
			}
			console.log( `checked ${ url }: ${ result.cardCount } ring cards` );
		}
		cdp.close();
		if ( failures.length ) {
			throw new Error( failures.join( '\n' ) );
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

main().catch( ( error ) => {
	console.error( error.message );
	process.exit( 1 );
} );
