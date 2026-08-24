#!/usr/bin/env node

const { spawn } = require( 'node:child_process' );
const fs = require( 'node:fs' );
const fsPromises = require( 'node:fs/promises' );
const os = require( 'node:os' );
const path = require( 'node:path' );

const { findHeadings } = require( './lib/about-page-contract' );
const { assertKnownOptions, deriveAboutActionContract, selectAboutSource, selectDigestSource } = require( './lib/page-phase-contract' );
const { getOrigin } = require( './lib/site-url' );
const { assertRuleDeclarations } = require( './lib/style-coverage' );

const THEME_ROOT = path.join( __dirname, '..' );
const ARGV = process.argv.slice( 2 );
assertKnownOptions( ARGV, [ '--source-only', '--drafts' ] );
const CHROME = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const ORIGIN = getOrigin();
const SOURCE_ONLY = ARGV.includes( '--source-only' );
const USE_DRAFTS = ARGV.includes( '--drafts' );
const CAPTURE_DIR = process.env.HPERKINS_CAPTURE_DIR ||
	path.join( os.tmpdir(), 'hperkins-prominent-actions' );
const DIGEST_SOURCE = selectDigestSource( ARGV );
// About body copy lives in the selected candidate or accepted snapshot;
// patterns/about-resume.php is a thin adapter over the snapshot and carries
// no rail/panel markup of its own (it is asserted clean below).
const ABOUT_SOURCE = selectAboutSource( { drafts: USE_DRAFTS } );
const ACTION_RAIL_CLASSES = [ 'wp-block-buttons', 'hp-action-rail' ];
const ACTION_RAIL_SELECTOR = '.wp-block-buttons.hp-action-rail';
const MALFORMED_ACTION_RAIL_SELECTOR = '.hp-action-rail:not(.wp-block-buttons)';
// Derive the selected body's action topology so legacy snapshots, the earlier
// proof-first redesign, and the v2 résumé candidate can each be verified
// without conflating their deliberately different rail counts.
const ABOUT_ACTION_CONTRACT = ( () => {
	try {
		return deriveAboutActionContract( fs.readFileSync( ABOUT_SOURCE, 'utf8' ) );
	} catch ( cause ) {
		throw new Error( `About source ${ ABOUT_SOURCE } is missing; the prominent-action contract derives its /about/ expectation from it.`, { cause } );
	}
} )();

const RAIL_FILES = [
	'patterns/wapuu-home-hero.php',
	ABOUT_SOURCE,
	'content/page-snapshots/front-page.html',
	DIGEST_SOURCE,
	'content/page-snapshots/work-flavor-agent-demo.html',
];

const PANEL_FILES = [
	'content/page-snapshots/front-page.html',
	DIGEST_SOURCE,
	'content/page-snapshots/work-flavor-agent-demo.html',
	...( ABOUT_ACTION_CONTRACT.panelCount > 0 ? [ ABOUT_SOURCE ] : [] ),
];

const EXCLUDED_FILES = [
	'parts/header.html',
	'patterns/imladris-button.php',
	'patterns/about-resume.php',
];

const DIGEST_BODY = fs.readFileSync( DIGEST_SOURCE, 'utf8' );
const DIGEST_CLOSING_HEADING = findHeadings( DIGEST_BODY, 'selected Digest body' )
	.filter( ( heading ) => heading.level === 2 )
	.at( -1 )?.text;
if ( ! DIGEST_CLOSING_HEADING ) {
	throw new Error( `Selected Digest body ${ DIGEST_SOURCE } has no closing H2.` );
}
const DIGEST_ACTION_COUNTS = {
	railCount: classLists( DIGEST_BODY ).filter( ( classes ) =>
		ACTION_RAIL_CLASSES.every( ( className ) => classes.includes( className ) )
	).length,
	panelCount: classLists( DIGEST_BODY ).filter( ( classes ) =>
		[ 'hp-action-panel', 'is-closing' ].every( ( className ) => classes.includes( className ) )
	).length,
};

const LIVE_PAGES = [
	{ route: '/', railCount: 2, panelCount: 1 },
	{
		route: '/about/',
		railCount: ABOUT_ACTION_CONTRACT.railCount,
		panelCount: ABOUT_ACTION_CONTRACT.panelCount,
	},
	{ route: '/job-placement-digest/', ...DIGEST_ACTION_COUNTS, digest: true },
	{ route: '/work/flavor-agent/demo/', railCount: 1, panelCount: 1 },
];

const VIEWPORTS = [
	{ name: 'desktop', width: 1440, height: 1000, mobile: false },
	{ name: 'mobile-390', width: 390, height: 844, mobile: true },
	{ name: 'mobile-320', width: 320, height: 844, mobile: true },
];

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function read( relativePath ) {
	const resolved = path.isAbsolute( relativePath ) ? relativePath : path.join( THEME_ROOT, relativePath );
	return fs.readFileSync( resolved, 'utf8' );
}

function classLists( contents ) {
	return Array.from( contents.matchAll( /\bclass="([^"]*)"/g ), ( match ) =>
		match[1].trim().split( /\s+/ ).filter( Boolean )
	);
}

function hasClassSet( contents, expectedClasses ) {
	return classLists( contents ).some( ( classes ) =>
		expectedClasses.every( ( className ) => classes.includes( className ) )
	);
}

function verifySourceContracts() {
	const css = read( 'style.css' );
	const pageCss = read( 'assets/imladris-pages.css' );
	for ( const expected of [
		'.hp-action-rail {',
		'.hp-action-panel.is-closing {',
		'min-block-size: var(--hp-touch-min);',
		'mask: url("assets/img/emblem.svg") center / contain no-repeat;',
		'.wp-block-button__link:focus-visible',
	] ) {
		assert( css.includes( expected ), `style.css is missing expected contract: ${ expected }` );
	}
	assertRuleDeclarations( pageCss, {
		selector: '.hp-wcus-callout',
		declarations: {
			'--hp-plate-pad': 'var(--wp--preset--spacing--6)',
			padding: 'var(--hp-plate-pad)',
		},
	} );
	assertRuleDeclarations( pageCss, {
		selector: '.hp-wcus-callout--event-first',
		declarations: {
			display: 'block',
			'max-inline-size': 'none',
			padding: '2.5rem 1rem',
			'border-inline-start': '0',
		},
	} );
	assertRuleDeclarations( pageCss, {
		selector: '.hp-wcus-callout__inner',
		declarations: {
			display: 'grid',
			'grid-template-columns': 'minmax(0, 1fr)',
			'column-gap': '0',
			'row-gap': 'var(--wp--preset--spacing--5)',
			padding: 'var(--hp-plate-pad)',
			'border-inline-start': '0.25rem solid var(--wp--preset--color--gold-600)',
		},
	} );
	assertRuleDeclarations( pageCss, {
		selector: '.hp-wcus-callout--event-first .hp-wcus-callout__actions',
		declarations: {
			display: 'grid',
			'grid-template-columns': 'minmax(0, 1fr)',
			gap: 'var(--wp--preset--spacing--4)',
		},
	} );
	assertRuleDeclarations( pageCss, {
		selector: '.hp-wcus-callout__inner',
		atContext: '@media (min-width: 782px)',
		declarations: {
			'grid-template-columns': 'minmax(0, 1.35fr) minmax(16rem, 0.65fr)',
			'column-gap': 'var(--wp--preset--spacing--6)',
			'row-gap': '0',
		},
	} );
	if ( read( ABOUT_SOURCE ).includes( 'hp-about-wcus' ) ) {
		assertRuleDeclarations( pageCss, {
			selector: '.hp-about-wcus',
			declarations: {
				padding: 'var(--wp--preset--spacing--4)',
				'border-inline-start': '0.25rem solid var(--wp--preset--color--gold-600)',
			},
		} );
	}

	for ( const file of RAIL_FILES ) {
		assert(
			hasClassSet( read( file ), ACTION_RAIL_CLASSES ),
			`${ file } is missing hp-action-rail on its core Buttons wrapper.`
		);
	}

	for ( const file of PANEL_FILES ) {
		assert(
			hasClassSet( read( file ), [ 'hp-action-panel', 'is-closing' ] ),
			`${ file } is missing hp-action-panel is-closing.`
		);
	}

	for ( const file of EXCLUDED_FILES ) {
		const contents = read( file );
		assert( ! contents.includes( 'hp-action-rail' ), `${ file } must remain outside hp-action-rail.` );
		assert( ! contents.includes( 'hp-action-panel' ), `${ file } must remain outside hp-action-panel.` );
	}

	// The Version <-> Stable tag <-> changelog release-sync contract lives in
	// verify-performance-assets.js (a source-only verifier). Here we only pin the
	// 0.3.42 changelog entry — the prominent-action system's own release — so its
	// history can never be dropped from readme.txt.
	assert( read( 'readme.txt' ).includes( '= 0.3.42 =' ), 'readme.txt must retain the 0.3.42 changelog.' );

	console.log( 'prominent action source contracts verified' );
}

function wait( ms ) {
	return new Promise( ( resolve ) => setTimeout( resolve, ms ) );
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

function routeSlug( route ) {
	return route === '/'
		? 'home'
		: route.replace( /^\/|\/$/g, '' ).replace( /[^a-z0-9]+/gi, '-' );
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
		await cdp.send( 'Emulation.setDeviceMetricsOverride', {
			width: viewport.width,
			height: viewport.height,
			deviceScaleFactor: 1,
			mobile: viewport.mobile,
		}, sessionId );

		const loaded = cdp.once( 'Page.loadEventFired', sessionId );
		const url = new URL( page.route, ORIGIN ).href;
		await cdp.send( 'Page.navigate', { url }, sessionId );
		await loaded;
		await cdp.send( 'Runtime.evaluate', {
			expression: 'document.fonts && document.fonts.ready',
			awaitPromise: true,
		}, sessionId );
		await wait( 300 );

		await cdp.send( 'Input.dispatchKeyEvent', {
			type: 'keyDown',
			key: 'Tab',
			code: 'Tab',
			windowsVirtualKeyCode: 9,
		}, sessionId );
		await cdp.send( 'Input.dispatchKeyEvent', {
			type: 'keyUp',
			key: 'Tab',
			code: 'Tab',
			windowsVirtualKeyCode: 9,
		}, sessionId );

		const expression = `(() => {
			const number = (value) => Number.parseFloat(value) || 0;
			const rect = (element) => {
				const value = element.getBoundingClientRect();
				return {
					left: value.left,
					top: value.top,
					right: value.right,
					bottom: value.bottom,
					width: value.width,
					height: value.height,
				};
			};

			const rails = Array.from(document.querySelectorAll('${ ACTION_RAIL_SELECTOR }')).map((rail) => {
				const style = getComputedStyle(rail);
				return {
					rect: rect(rail),
					backgroundColor: style.backgroundColor,
					backgroundImage: style.backgroundImage,
					borderTopWidth: number(style.borderTopWidth),
					boxShadow: style.boxShadow,
					links: Array.from(rail.querySelectorAll('.wp-block-button__link')).map((link) => ({
						text: link.textContent.trim(),
						rect: rect(link),
					})),
				};
			});

			const panels = Array.from(document.querySelectorAll('.hp-action-panel.is-closing')).map((panel) => {
				const style = getComputedStyle(panel);
				return {
					rect: rect(panel),
					borderLeftWidth: number(style.borderLeftWidth),
					backgroundImage: style.backgroundImage,
					boxShadow: style.boxShadow,
				};
			});

			// Focus pass runs after every rect above is captured, and with
			// preventScroll, so focusing cannot shift the measured geometry.
			// Every link in every rail must expose the keyboard ring — on the
			// About page that iterates both the hero and closing rails.
			const railElements = Array.from(document.querySelectorAll('${ ACTION_RAIL_SELECTOR }'));
			railElements.forEach((railElement, railIndex) => {
				Array.from(railElement.querySelectorAll('.wp-block-button__link')).forEach((link, linkIndex) => {
					try {
						link.focus({ preventScroll: true });
					} catch (error) {
						link.focus();
					}
					const style = getComputedStyle(link);
					rails[railIndex].links[linkIndex].focus = {
						matchesFocusVisible: link.matches(':focus-visible'),
						outlineStyle: style.outlineStyle,
						outlineWidth: number(style.outlineWidth),
					};
				});
			});

			const digestHeading = document.querySelector('.hp-digest-cta h2');
			return {
				clientWidth: document.documentElement.clientWidth,
				scrollWidth: document.documentElement.scrollWidth,
				rails,
				panels,
				malformedRailCount: document.querySelectorAll('${ MALFORMED_ACTION_RAIL_SELECTOR }').length,
				compactLeakCount: document.querySelectorAll(
					'.hp-site-subscribe.hp-action-rail, .hp-site-subscribe.hp-action-panel'
				).length,
				digestHeading: digestHeading ? digestHeading.textContent.trim() : null,
			};
		})()`;

		const evaluated = await cdp.send( 'Runtime.evaluate', {
			expression,
			awaitPromise: true,
			returnByValue: true,
		}, sessionId );

		await fsPromises.mkdir( CAPTURE_DIR, { recursive: true } );
		const metrics = await cdp.send( 'Page.getLayoutMetrics', {}, sessionId );
		const contentSize = metrics.cssContentSize || metrics.contentSize;
		const capture = await cdp.send( 'Page.captureScreenshot', {
			format: 'png',
			fromSurface: true,
			captureBeyondViewport: true,
			clip: {
				x: 0,
				y: 0,
				width: viewport.width,
				height: Math.min(
					12000,
					Math.max( viewport.height, Math.ceil( contentSize.height ) )
				),
				scale: 1,
			},
		}, sessionId, 30000 );
		const capturePath = path.join(
			CAPTURE_DIR,
			`${ routeSlug( page.route ) }-${ viewport.name }.png`
		);
		await fsPromises.writeFile( capturePath, Buffer.from( capture.data, 'base64' ) );

		return {
			...evaluated.result.value,
			url,
			capturePath,
		};
	} finally {
		await cdp.send( 'Target.closeTarget', { targetId: target.targetId } );
	}
}

async function withChrome( callback ) {
	const userDataDir = await fsPromises.mkdtemp(
		path.join( os.tmpdir(), 'hp-prominent-actions-chrome-' )
	);
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

async function verifyLiveContracts() {
	await withChrome( async ( cdp ) => {
		for ( const page of LIVE_PAGES ) {
			for ( const viewport of VIEWPORTS ) {
				const result = await inspectPage( cdp, page, viewport );

				assert(
					result.scrollWidth <= result.clientWidth + 1,
					`${ result.url } overflows at ${ viewport.width }px: client=${ result.clientWidth }, scroll=${ result.scrollWidth }.`
				);
				assert(
					result.rails.length === page.railCount,
					`${ result.url } renders ${ result.rails.length } action rails at ${ viewport.width }px; expected ${ page.railCount }.`
				);
				assert(
					result.malformedRailCount === 0,
					`${ result.url } renders ${ result.malformedRailCount } hp-action-rail elements outside a core Buttons wrapper.`
				);
				assert(
					result.panels.length === page.panelCount,
					`${ result.url } renders ${ result.panels.length } closing panels at ${ viewport.width }px; expected ${ page.panelCount }.`
				);
				assert( result.compactLeakCount === 0, `${ result.url } applied the prominent system to header Subscribe.` );

				for ( const rail of result.rails ) {
					assert( rail.borderTopWidth >= 1, `${ result.url } action rail has no hairline border.` );
					assert(
						rail.backgroundImage !== 'none' || rail.backgroundColor !== 'rgba(0, 0, 0, 0)',
						`${ result.url } action rail has no owned surface.`
					);
					assert( rail.boxShadow !== 'none', `${ result.url } action rail has no shadow.` );
					assert( rail.links.length >= 1, `${ result.url } action rail contains no links.` );
					for ( const link of rail.links ) {
						assert(
							link.rect.height >= 44,
							`${ result.url } "${ link.text }" is ${ link.rect.height }px high; expected at least 44px.`
						);
					}

					if ( viewport.width <= 600 && rail.links.length > 1 ) {
						for ( let index = 0; index < rail.links.length; index++ ) {
							const link = rail.links[ index ];
							assert(
								link.rect.width >= rail.rect.width - 12,
								`${ result.url } "${ link.text }" does not fill its mobile action rail.`
							);
							if ( index > 0 ) {
								assert(
									link.rect.top >= rail.links[ index - 1 ].rect.bottom - 1,
									`${ result.url } action links do not stack at ${ viewport.width }px.`
								);
							}
						}
					}
				}

				for ( const panel of result.panels ) {
					assert( panel.borderLeftWidth >= 3, `${ result.url } closing panel lost its fixed gold rule.` );
					assert( panel.backgroundImage !== 'none', `${ result.url } closing panel lost its parchment surface.` );
					assert( panel.boxShadow !== 'none', `${ result.url } closing panel lost its owned shadow.` );
				}

				const focusedLinks = result.rails.flatMap( ( rail ) => rail.links );
				assert( focusedLinks.length >= 1, `${ result.url } exposes no focusable prominent action.` );
				for ( const link of focusedLinks ) {
					assert(
						link.focus &&
						link.focus.matchesFocusVisible &&
						link.focus.outlineStyle !== 'none' &&
						link.focus.outlineWidth >= 3,
						`${ result.url } "${ link.text }" does not expose the 3px keyboard focus ring.`
					);
				}

				if ( page.digest ) {
					assert(
						result.digestHeading === DIGEST_CLOSING_HEADING,
						`${ result.url } rendered the wrong Digest closing h2.`
					);
				}

				console.log(
					`checked ${ result.url } at ${ viewport.width }px: ${ result.rails.length } rail(s), ${ result.panels.length } panel(s), ${ result.capturePath }`
				);
			}
		}
	} );
}

async function main() {
	verifySourceContracts();
	if ( SOURCE_ONLY ) {
		return;
	}
	await verifyLiveContracts();
	console.log( `prominent action screenshots: ${ CAPTURE_DIR }` );
}

main().catch( ( error ) => {
	console.error( error.message );
	process.exit( 1 );
} );
