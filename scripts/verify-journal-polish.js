#!/usr/bin/env node
const { spawn } = require( 'node:child_process' );
const fs = require( 'node:fs/promises' );
const os = require( 'node:os' );
const path = require( 'node:path' );

const { getOrigin } = require( './lib/site-url' );

const CHROME = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const ORIGIN = getOrigin();
const THEME_PATH = path.join( __dirname, '..' );
const VIEWPORTS = [
	{ width: 390, height: 1100, maxTitlePx: 68, maxTitleHeight: 360 },
	{ width: 320, height: 1100, maxTitlePx: 64, maxTitleHeight: 420 },
];

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

async function inspectJournalPage( cdp, viewport ) {
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
	await cdp.send( 'Page.navigate', { url: new URL( '/essays/', ORIGIN ).href }, sessionId );
	await loaded;
	await cdp.send( 'Runtime.evaluate', { expression: 'document.fonts && document.fonts.ready', awaitPromise: true }, sessionId );
	await wait( 250 );

	const expression = `(() => {
		const round = (value) => Math.round(value * 10) / 10;
		const rect = (element) => {
			const r = element.getBoundingClientRect();
			return { top: round(r.top), width: round(r.width), height: round(r.height) };
		};
		const px = (value) => Number.parseFloat(value || '0') || 0;
		const h1 = document.querySelector('.hp-masthead__title');
		const filter = document.querySelector('.hp-topic-filter');
		const h1Style = h1 ? getComputedStyle(h1) : null;
		const filterStyle = filter ? getComputedStyle(filter) : null;
		const measureTitleWord = (word) => {
			const probe = document.createElement('span');
			probe.textContent = word;
			probe.style.position = 'absolute';
			probe.style.visibility = 'hidden';
			probe.style.whiteSpace = 'nowrap';
			probe.style.fontFamily = h1Style.fontFamily;
			probe.style.fontSize = h1Style.fontSize;
			probe.style.fontWeight = h1Style.fontWeight;
			probe.style.letterSpacing = h1Style.letterSpacing;
			document.body.appendChild(probe);
			const width = rect(probe).width;
			probe.remove();
			return width;
		};
		return {
			clientWidth: document.documentElement.clientWidth,
			scrollWidth: document.documentElement.scrollWidth,
			h1: h1 ? {
				rect: rect(h1),
				fontSize: px(h1Style.fontSize),
				lineHeight: px(h1Style.lineHeight),
				wordWidths: {
					stewardship: measureTitleWord('stewardship'),
					artificial: measureTitleWord('artificial'),
				},
			} : null,
			filter: filter ? {
				rect: rect(filter),
				display: filterStyle.display,
				visibility: filterStyle.visibility,
				categoryCount: document.querySelectorAll('.hp-topic-filter .wp-block-categories > li').length,
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

async function inspectFallbackVariation( cdp ) {
	const target = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
	const attached = await cdp.send( 'Target.attachToTarget', {
		targetId: target.targetId,
		flatten: true,
	} );
	const sessionId = attached.sessionId;

	await cdp.send( 'Page.enable', {}, sessionId );
	await cdp.send( 'Runtime.enable', {}, sessionId );
	await cdp.send( 'Emulation.setDeviceMetricsOverride', {
		width: 1440,
		height: 1200,
		deviceScaleFactor: 1,
		mobile: false,
	}, sessionId );

	const loaded = cdp.once( 'Page.loadEventFired', sessionId );
	await cdp.send( 'Page.navigate', { url: new URL( '/essays/', ORIGIN ).href }, sessionId );
	await loaded;
	await cdp.send( 'Runtime.evaluate', { expression: 'document.fonts && document.fonts.ready', awaitPromise: true }, sessionId );
	await wait( 250 );

	const expression = `(() => {
		const setText = (root, selector, text) => {
			const el = root.querySelector(selector);
			if (el) el.textContent = text;
		};
		const featured = document.querySelector('.hp-journal-featured .wp-block-post-template');
		const source = featured && featured.querySelector(':scope > li');
		const gridWrap = document.querySelector('.hp-journal-grid');
		if (!featured || !source || !gridWrap) {
			return { ok: false };
		}
		while (featured.children.length < 3) {
			featured.appendChild(source.cloneNode(true));
		}
		Array.from(featured.children).slice(1, 3).forEach((li, index) => {
			setText(li, '.hp-postcard__title a', index ? 'A Ledger Before a Promise' : 'The Shape of a Reversible Decision');
			const media = li.querySelector('.hp-postcard__media');
			if (media) media.innerHTML = '';
		});
		let grid = gridWrap.querySelector('.wp-block-post-template');
		if (!grid) {
			grid = document.createElement('ul');
			grid.className = 'wp-block-post-template is-layout-grid wp-block-post-template-is-layout-grid';
			grid.style.display = 'grid';
			grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(min(17rem, 100%), 1fr))';
			grid.style.gap = 'var(--wp--preset--spacing--6)';
			grid.style.listStyle = 'none';
			grid.style.margin = '0';
			grid.style.padding = '0';
			gridWrap.insertBefore(grid, gridWrap.firstChild);
		}
		grid.innerHTML = '';
		for (let index = 0; index < 3; index += 1) {
			const li = source.cloneNode(true);
			setText(li, '.hp-postcard__title a', ['AI Governance as an Operating Rhythm', 'What Approval Should Feel Like', 'Signals Worth Keeping'][index]);
			const media = li.querySelector('.hp-postcard__media');
			if (media) media.innerHTML = '';
			grid.appendChild(li);
		}
		const pseudo = (el) => {
			const style = getComputedStyle(el, '::after');
			return {
				position: style.backgroundPosition,
				size: style.backgroundSize,
				mask: style.maskImage || style.webkitMaskImage || '',
			};
		};
		return {
			ok: true,
			featuredFallbacks: Array.from(featured.querySelectorAll(':scope > li:nth-child(n+2) .hp-postcard__media')).map(pseudo),
			gridFallbacks: Array.from(grid.querySelectorAll(':scope > li .hp-postcard__media')).map(pseudo),
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
	const userDataDir = await fs.mkdtemp( path.join( os.tmpdir(), 'hp-journal-polish-' ) );
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

async function verifyStaticContract() {
	const template = await fs.readFile( path.join( THEME_PATH, 'templates/home.html' ), 'utf8' );
	const css = await fs.readFile( path.join( THEME_PATH, 'assets/imladris-pages.css' ), 'utf8' );

	assert(
		! template.includes( 'hp-masthead" style="padding-top:var(--wp--preset--spacing--10);padding-bottom:var(--wp--preset--spacing--7)' ),
		'Journal masthead template should not keep the old spacing-7 bottom padding.'
	);
	assert(
		/\.hp-topic-filter:has\(\s*\.wp-block-categories\s*>\s*li:only-child\s*\)/.test( css ),
		'Journal CSS must hide or collapse the one-category topic-filter state.'
	);
	// Bounded, not file-spanning: the clamp must live INSIDE a 600px media
	// block's own .hp-masthead__title rule ([^@]* keeps the match within the
	// media block; [^}]* within the rule), so unrelated matches can't satisfy it.
	assert(
		/@media\s*\(max-width:\s*600px\)\s*\{[^@]*\.hp-masthead__title\s*\{[^}]*clamp\(/.test( css ),
		'Journal CSS must clamp the masthead title at mobile widths.'
	);
	for ( const variant of [ '3n\\+1', '3n\\+2', '3n\\+3' ] ) {
		assert(
			new RegExp( `\\.hp-journal-grid[^{}]*nth-child\\(${ variant }\\)[^{}]*\\{[^}]*background-position` ).test( css ),
			`Journal grid fallback media must set a plate crop for nth-child(${ variant.replace( '\\+', '+' ) }); distinctness is asserted live below.`
		);
	}
}

async function main() {
	await verifyStaticContract();
	await withChrome( async ( cdp ) => {
		for ( const viewport of VIEWPORTS ) {
			const metrics = await inspectJournalPage( cdp, viewport );
			assert( metrics.h1, 'Journal masthead title was not found.' );
			assert(
				metrics.scrollWidth <= metrics.clientWidth + 1,
				`/essays/ overflows horizontally at ${ viewport.width }px: clientWidth=${ metrics.clientWidth }, scrollWidth=${ metrics.scrollWidth }.`
			);
			assert(
				metrics.h1.fontSize <= viewport.maxTitlePx,
				`Journal masthead title font-size is ${ metrics.h1.fontSize }px at ${ viewport.width }px; expected <= ${ viewport.maxTitlePx }px.`
			);
			assert(
				metrics.h1.rect.height <= viewport.maxTitleHeight,
				`Journal masthead title is ${ metrics.h1.rect.height }px tall at ${ viewport.width }px; expected <= ${ viewport.maxTitleHeight }px.`
			);
			for ( const word of [ 'stewardship', 'artificial' ] ) {
				assert(
					metrics.h1.wordWidths[ word ] <= metrics.h1.rect.width + 1,
					`Journal masthead word "${ word }" is ${ metrics.h1.wordWidths[ word ] }px wide in a ${ metrics.h1.rect.width }px title column at ${ viewport.width }px.`
				);
			}
			if ( metrics.filter && metrics.filter.categoryCount === 1 ) {
				assert(
					metrics.filter.display === 'none' || metrics.filter.rect.height <= 1 || metrics.filter.visibility === 'hidden',
					`One-category topic filter should collapse at ${ viewport.width }px, but display=${ metrics.filter.display }, height=${ metrics.filter.rect.height }.`
				);
			}
			console.log(
				`checked /essays/ at ${ viewport.width }px: h1=${ metrics.h1.fontSize }px/${ metrics.h1.rect.height }px, scrollWidth=${ metrics.scrollWidth }`
			);
		}

		const fallback = await inspectFallbackVariation( cdp );
		assert( fallback.ok, 'Could not create the simulated journal grid.' );
		const gridPositions = new Set( fallback.gridFallbacks.map( ( item ) => `${ item.position }|${ item.size }|${ item.mask }` ) );
		const featuredPositions = new Set( fallback.featuredFallbacks.map( ( item ) => `${ item.position }|${ item.size }|${ item.mask }` ) );
		assert(
			gridPositions.size >= 3,
			`Expected three distinct grid fallback plate treatments; found ${ gridPositions.size }.`
		);
		assert(
			featuredPositions.size === 1,
			'Featured secondary fallback plates should keep one consistent treatment.'
		);
		console.log( `checked simulated fallback plates: ${ gridPositions.size } grid treatments, ${ featuredPositions.size } featured treatment` );
	} );
}

main().catch( ( error ) => {
	console.error( error.message );
	process.exit( 1 );
} );
