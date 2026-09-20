// Dependency-free Chrome transport, matching verify-header.js.
const { spawn } = require( 'node:child_process' );
const fs = require( 'node:fs' );
const fsPromises = require( 'node:fs/promises' );
const os = require( 'node:os' );
const path = require( 'node:path' );
const assert = require( 'node:assert/strict' );

function wait( milliseconds ) {
	return new Promise( ( resolve ) => setTimeout( resolve, milliseconds ) );
}

async function rmRetry( target ) {
	const resolved = path.resolve( target );
	assert.equal( path.dirname( resolved ), path.resolve( os.tmpdir() ), 'Chrome cleanup must stay within the temporary directory.' );
	assert( path.basename( resolved ).startsWith( 'hp-search-chrome-' ), 'Refusing to remove an unrelated directory.' );
	let lastError;
	for ( let attempt = 0; attempt < 8; attempt++ ) {
		try {
			await fsPromises.rm( resolved, { recursive: true, force: true } );
			return;
		} catch ( error ) {
			lastError = error;
			await wait( 250 );
		}
	}
	throw lastError;
}

async function waitForDevToolsUrl( chrome, chromePath ) {
	let buffer = '';
	return new Promise( ( resolve, reject ) => {
		const timer = setTimeout(
			() => reject( new Error( 'Timed out waiting for Chrome DevTools URL.' ) ),
			10000
		);
		chrome.on( 'error', ( error ) => {
			clearTimeout( timer );
			reject( new Error( `Chrome failed to launch (${ chromePath }): ${ error.message }` ) );
		} );
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
	assert( typeof WebSocket !== 'undefined', 'This verifier needs Node.js v22+ for global WebSocket.' );
	const ws = new WebSocket( wsUrl );
	let nextId = 1;
	const pending = new Map();
	const listeners = new Map();
	const subscriptions = new Map();

	ws.addEventListener( 'message', ( event ) => {
		const message = JSON.parse( event.data );
		if ( message.id && pending.has( message.id ) ) {
			const handlers = pending.get( message.id );
			pending.delete( message.id );
			if ( message.error ) {
				handlers.reject( new Error( message.error.message ) );
			} else {
				handlers.resolve( message.result || {} );
			}
			return;
		}
		if ( message.method ) {
			const key = `${ message.sessionId || '' }:${ message.method }`;
			for ( const callback of subscriptions.get( key ) || [] ) callback( message.params || {} );
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
		ws.addEventListener( 'open', () => resolve( {
			send, once,
			on: ( method, callback, sessionId ) => {
				const key = `${ sessionId || '' }:${ method }`;
				const callbacks = subscriptions.get( key ) || new Set();
				callbacks.add( callback );
				subscriptions.set( key, callbacks );
				return () => callbacks.delete( callback );
			},
			close: () => ws.close(),
		} ) );
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

async function pressKey( cdp, sessionId, key ) {
	const keys = {
		Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' },
		Space: { key: ' ', code: 'Space', windowsVirtualKeyCode: 32, text: ' ' },
		ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 },
		Escape: { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 },
		Tab: { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 },
	};
	const value = keys[ key ];
	assert( value, `Unsupported verifier key ${ key }.` );
	await cdp.send( 'Input.dispatchKeyEvent', {
		type: 'keyDown',
		...value,
	}, sessionId );
	await cdp.send( 'Input.dispatchKeyEvent', {
		type: 'keyUp',
		key: value.key,
		code: value.code,
		windowsVirtualKeyCode: value.windowsVirtualKeyCode,
	}, sessionId );
	await wait( 30 );
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

async function withChrome( callback ) {
	const chromePath = resolveChrome();
	const userDataDir = await fsPromises.mkdtemp( path.join( os.tmpdir(), 'hp-search-chrome-' ) );
	const args = [
		'--headless=new',
		'--disable-gpu',
		'--no-sandbox',
		'--remote-debugging-port=0',
		`--user-data-dir=${ userDataDir }`,
	];
	if ( process.env.HTTPS_PROXY ) {
		args.push( `--proxy-server=${ process.env.HTTPS_PROXY }`, '--ssl-version-max=tls1.2' );
	}
	args.push( 'about:blank' );
	const chrome = spawn( chromePath, args, { stdio: [ 'ignore', 'ignore', 'pipe' ] } );

	try {
		const wsUrl = await waitForDevToolsUrl( chrome, chromePath );
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


module.exports = { withChrome, evaluate, pressKey, wait };
