#!/usr/bin/env node
const { spawn } = require( 'node:child_process' );
const fs = require( 'node:fs/promises' );
const os = require( 'node:os' );
const path = require( 'node:path' );

const CHROME = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const ORIGIN = process.env.HPERKINS_ORIGIN || 'https://hperkins.blog';

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

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

	function send( method, params = {}, sessionId ) {
		const id = nextId++;
		ws.send( JSON.stringify( { id, method, params, sessionId } ) );
		return new Promise( ( resolve, reject ) => pending.set( id, { resolve, reject } ) );
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

async function inspectHomepage( cdp, viewport ) {
	const target = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
	const attached = await cdp.send( 'Target.attachToTarget', {
		targetId: target.targetId,
		flatten: true,
	} );
	const sessionId = attached.sessionId;

	await cdp.send( 'Page.enable', {}, sessionId );
	await cdp.send( 'Runtime.enable', {}, sessionId );
	await cdp.send( 'Emulation.setDeviceMetricsOverride', {
		width: viewport.width,
		height: viewport.height,
		deviceScaleFactor: 1,
		mobile: false,
	}, sessionId );

	const loaded = cdp.once( 'Page.loadEventFired', sessionId );
	await cdp.send( 'Page.navigate', { url: new URL( '/', ORIGIN ).href }, sessionId );
	await loaded;
	await cdp.send( 'Runtime.evaluate', { expression: 'document.fonts && document.fonts.ready', awaitPromise: true }, sessionId );
	await wait( 250 );

	const expression = `(() => {
		const title = document.querySelector('.hp-wapuu-hero__title');
		const art = document.querySelector('.hp-wapuu-hero__figure img');
		const style = title ? getComputedStyle(title) : null;
		return {
			titleFound: !! title,
			artFound: !! art,
			clientWidth: document.documentElement.clientWidth,
			scrollWidth: document.documentElement.scrollWidth,
			title: title ? {
				text: title.textContent.trim(),
				fontWeight: Number.parseInt(style.fontWeight, 10),
				fontSize: Number.parseFloat(style.fontSize),
				lineHeight: Number.parseFloat(style.lineHeight),
				width: Math.round(title.getBoundingClientRect().width),
				height: Math.round(title.getBoundingClientRect().height),
			} : null,
			art: art ? {
				width: Math.round(art.getBoundingClientRect().width),
				height: Math.round(art.getBoundingClientRect().height),
			} : null,
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

async function withChrome( callback ) {
	const userDataDir = await fs.mkdtemp( path.join( os.tmpdir(), 'hp-home-hero-' ) );
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

async function main() {
	await withChrome( async ( cdp ) => {
		const desktop = await inspectHomepage( cdp, { width: 1440, height: 1000 } );
		assert( desktop.titleFound, 'Homepage Wapuu hero title was not found at desktop.' );
		assert( desktop.artFound, 'Homepage Wapuu hero artwork was not found at desktop.' );
		assert(
			desktop.scrollWidth <= desktop.clientWidth + 1,
			`Homepage overflows horizontally at desktop: clientWidth=${ desktop.clientWidth }, scrollWidth=${ desktop.scrollWidth }.`
		);
		assert(
			desktop.title.fontWeight >= 600,
			`Homepage Wapuu hero title should be semibold on desktop; got font-weight ${ desktop.title.fontWeight }.`
		);
		assert(
			desktop.title.fontWeight < 700,
			`Homepage Wapuu hero title should be slightly bolder, not bold; got font-weight ${ desktop.title.fontWeight }.`
		);

		const mobile = await inspectHomepage( cdp, { width: 390, height: 1000 } );
		assert( mobile.titleFound, 'Homepage Wapuu hero title was not found at mobile.' );
		assert(
			mobile.title.fontWeight < 600,
			`Homepage Wapuu hero title should keep the lighter mobile treatment; got font-weight ${ mobile.title.fontWeight }.`
		);
		assert(
			mobile.scrollWidth <= mobile.clientWidth + 1,
			`Homepage overflows horizontally at mobile: clientWidth=${ mobile.clientWidth }, scrollWidth=${ mobile.scrollWidth }.`
		);

		console.log(
			`checked homepage hero: desktop weight=${ desktop.title.fontWeight }, mobile weight=${ mobile.title.fontWeight }`
		);
	} );
}

main().catch( ( error ) => {
	console.error( error.message );
	process.exit( 1 );
} );
