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

const { getOrigin } = require( './lib/site-url' );

const ROOT = path.join( __dirname, '..' );
const ORIGIN = getOrigin();
const SOURCE_ONLY = process.argv.includes( '--source-only' );

const PAGES = [
	{
		name: 'digest',
		route: '/job-placement-digest/',
		h1: 'I debug WordPress systems, document root causes, and turn recurring failures into constraints.',
	},
	{
		name: 'appendix',
		route: '/placement-method-and-evidence/',
		h1: 'Placement Method and Evidence',
	},
];

const VIEWPORTS = [
	{ name: 'desktop-1440', width: 1440, height: 1000 },
	{ name: 'desktop-1024', width: 1024, height: 1000 },
	{ name: 'tablet-768', width: 768, height: 1000 },
	{ name: 'mobile-390', width: 390, height: 1000 },
	{ name: 'mobile-320', width: 320, height: 1000 },
];

const PRIMARY_ACTIONS = [
	{
		text: 'View one-page résumé',
		href: '/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf',
	},
	{ text: 'Review GitHub evidence', href: '#evidence-register' },
	{ text: 'Read the production debugging case', href: '#production-debugging' },
	{ text: 'Contact Henry', href: '/contact/' },
];

const CLOSING_ACTIONS = [
	{ text: 'Contact Henry', href: '/contact/' },
	{
		text: 'View one-page résumé',
		href: '/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf',
	},
	{ text: 'Review GitHub evidence', href: '#evidence-register' },
];

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function read( relativePath ) {
	return fs.readFileSync( path.join( ROOT, relativePath ), 'utf8' ).replace( /\r\n/g, '\n' );
}

function verifySourceContracts() {
	const componentCss = read( 'style.css' );
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
		assert( componentCss.includes( expected ), `style.css is missing recruiter-page contract: ${ expected }` );
	}

	for ( const expected of [
		'.hp-digest__primary-actions.hp-action-rail {',
		'grid-template-columns: repeat(4, minmax(0, 1fr));',
		'.hp-evidence-table table {',
		'min-inline-size: 50rem;',
		'.hp-keyword-table table {',
		'min-inline-size: 48rem;',
	] ) {
		assert( pageCss.includes( expected ), `assets/imladris-pages.css is missing recruiter-page contract: ${ expected }` );
	}

	console.log( 'recruiter rendered-page source contracts verified' );
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

function assertActions( actual, expected, context ) {
	assert( actual.length === expected.length, `${ context } has ${ actual.length } actions; expected ${ expected.length }.` );
	for ( let index = 0; index < expected.length; index++ ) {
		const action = actual[ index ];
		const contract = expected[ index ];
		assert( action.text === contract.text, `${ context } action ${ index + 1 } is "${ action.text }"; expected "${ contract.text }".` );
		assert( action.href === contract.href, `${ context } "${ action.text }" points to ${ action.href}; expected ${ contract.href}.` );
		assert( action.height >= 44, `${ context } "${ action.text }" is ${ action.height}px high; expected at least 44px.` );
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

	if ( page.name === 'digest' ) {
		assert( result.primaryActions, `${ context } is missing the first-screen action rail.` );
		assertActions( result.primaryActions.actions, PRIMARY_ACTIONS, `${ context } first-screen rail` );
		assert( result.primaryActions.inHero, `${ context } first-screen action rail is outside the recruiter hero.` );
		assert( result.primaryActions.top >= -1, `${ context } first-screen rail begins above the viewport.` );
		// Phone height is intentionally not part of the requested matrix (the
		// four controls stack, so a 320px-wide device can be 568px or 1000px
		// tall). At tablet/desktop widths, the fixed verification height is a
		// useful literal fold and all four actions must clear it.
		if ( viewport.width >= 768 ) {
			assert(
				result.primaryActions.bottom <= viewport.height + 1,
				`${ context } first-screen rail ends at ${ result.primaryActions.bottom}px, below the ${ viewport.height}px viewport.`
			);
		}
		assert( result.closing, `${ context } is missing the composed closing panel.` );
		assert( result.closing.eyebrow === 'A next step, stated plainly.', `${ context } has the wrong closing eyebrow.` );
		assert( result.closing.heading === 'Bring me the problem behind the ticket.', `${ context } has the wrong closing heading.` );
		assertActions( result.closing.actions, CLOSING_ACTIONS, `${ context } closing panel` );
	} else {
		assert( result.fragment, `${ context } is missing #resume-keyword-bank.` );
		assert( result.fragment.tagName === 'SECTION', `${ context } assigns #resume-keyword-bank to ${ result.fragment.tagName}, not SECTION.` );
		assert( result.fragment.visible, `${ context } assigns #resume-keyword-bank to an empty or hidden element.` );
		assert( result.fragment.heading === 'The 34-term keyword ledger', `${ context } fragment target does not own the keyword-ledger H2.` );
		assert( result.fragment.isTarget, `${ context } #resume-keyword-bank does not become the meaningful :target.` );
		assert( result.disclosures.length === 3, `${ context } renders ${ result.disclosures.length } disclosures; expected 3.` );
		for ( const disclosure of result.disclosures ) {
			assert( disclosure.height >= 44, `${ context } ${ disclosure.label } summary is ${ disclosure.height}px high; expected at least 44px.` );
			assert( disclosure.fullWidth, `${ context } ${ disclosure.label } summary is not a full-width control.` );
			assert( disclosure.cursor === 'pointer', `${ context } ${ disclosure.label } summary cursor is ${ disclosure.cursor}, not pointer.` );
			assert( disclosure.focusVisible, `${ context } ${ disclosure.label } summary does not match :focus-visible after keyboard entry.` );
			assert(
				disclosure.outlineStyle !== 'none' && disclosure.outlineWidth >= 3,
				`${ context } ${ disclosure.label } summary has no 3px visible keyboard outline.`
			);
			assert( disclosure.enterOpened, `${ context } Enter did not open ${ disclosure.label }.` );
			assert( disclosure.spaceClosed, `${ context } Space did not close ${ disclosure.label }.` );
			assert( disclosure.closedMarker.includes( '+' ), `${ context } ${ disclosure.label } has no collapsed marker.` );
			assert(
				disclosure.openMarker.includes( '−' ) || disclosure.openMarker.includes( '\\2212' ),
				`${ context } ${ disclosure.label } has no expanded marker.`
			);
		}
	}
}

async function inspectDisclosures( cdp, sessionId ) {
	const count = await evaluate( cdp, sessionId, `document.querySelectorAll('details.hp-disclosure > summary').length` );
	const disclosures = [];
	for ( let index = 0; index < count; index++ ) {
		// Establish keyboard modality before focusing a specific native summary.
		await pressKey( cdp, sessionId, 'Tab' );
		const closed = await evaluate( cdp, sessionId, `(() => {
			const summary = document.querySelectorAll('details.hp-disclosure > summary')[${ index }];
			const details = summary.parentElement;
			details.open = false;
			summary.focus();
			const style = getComputedStyle(summary);
			const summaryRect = summary.getBoundingClientRect();
			const detailsRect = details.getBoundingClientRect();
			return {
				label: summary.querySelector('span')?.textContent.trim() || summary.textContent.trim(),
				height: summaryRect.height,
				// The details border owns one pixel on each side, so a summary that
				// fills the inner box is two CSS pixels narrower than the outer rect.
				fullWidth: Math.abs(summaryRect.width - detailsRect.width) <= 2.1,
				cursor: style.cursor,
				focusVisible: summary.matches(':focus-visible'),
				outlineStyle: style.outlineStyle,
				outlineWidth: parseFloat(style.outlineWidth) || 0,
				closedMarker: getComputedStyle(summary, '::after').content,
			};
		})()` );

		await pressKey( cdp, sessionId, 'Enter' );
		const opened = await evaluate( cdp, sessionId, `(() => {
			const summary = document.querySelectorAll('details.hp-disclosure > summary')[${ index }];
			return {
				open: summary.parentElement.open,
				marker: getComputedStyle(summary, '::after').content,
			};
		})()` );

		await pressKey( cdp, sessionId, 'Space' );
		const closedAgain = await evaluate( cdp, sessionId, `document.querySelectorAll('details.hp-disclosure')[${ index }].open === false` );
		disclosures.push( {
			...closed,
			enterOpened: opened.open,
			openMarker: opened.marker,
			spaceClosed: closedAgain,
		} );
	}
	return disclosures;
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
			mobile: viewport.width < 782,
		}, sessionId );

		const loaded = cdp.once( 'Page.loadEventFired', sessionId );
		const url = new URL( page.route, ORIGIN ).href;
		const navigation = await cdp.send( 'Page.navigate', { url }, sessionId );
		assert( ! navigation.errorText, `${ url } failed to navigate: ${ navigation.errorText }` );
		await loaded;
		await evaluate( cdp, sessionId, 'document.fonts ? document.fonts.ready : Promise.resolve()' );
		await wait( 250 );

		let disclosures = [];
		if ( page.name === 'appendix' ) {
			disclosures = await inspectDisclosures( cdp, sessionId );
		}

		const metrics = await evaluate( cdp, sessionId, `(() => {
			const round = (value) => Math.round(value * 100) / 100;
			const isVisible = (element) => {
				const style = getComputedStyle(element);
				return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
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

			const actions = (root) => root ? Array.from(root.querySelectorAll('.wp-block-button__link')).map((link) => ({
				text: link.textContent.trim().replace(/\\s+/g, ' '),
				href: link.getAttribute('href'),
				height: round(link.getBoundingClientRect().height),
			})) : [];
			const primaryRail = document.querySelector('.hp-digest__primary-actions');
			const primaryRect = primaryRail?.getBoundingClientRect();
			const closing = document.querySelector('.hp-digest-cta');
			const anchor = document.getElementById('resume-keyword-bank');

			return {
				url: location.href,
				pathname: location.pathname,
				clientWidth: document.documentElement.clientWidth,
				scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
				h1s: Array.from(document.querySelectorAll('h1')).map((heading) => heading.textContent.trim().replace(/\\s+/g, ' ')),
				firstHeadingLevel: headings[0]?.level || null,
				headingSkips,
				linkFailures,
				primaryActions: primaryRail ? {
					inHero: !!primaryRail.closest('.hp-digest__hero'),
					top: round(primaryRect.top),
					bottom: round(primaryRect.bottom),
					actions: actions(primaryRail),
				} : null,
				closing: closing ? {
					eyebrow: closing.querySelector('.hp-page-hero__eyebrow')?.textContent.trim() || null,
					heading: closing.querySelector('h2')?.textContent.trim() || null,
					actions: actions(closing),
				} : null,
				fragment: anchor ? {
					tagName: anchor.tagName,
					visible: isVisible(anchor) && !!anchor.querySelector('h2') && !!anchor.querySelector('details'),
					heading: anchor.querySelector('h2')?.textContent.trim() || null,
				} : null,
			};
		})()` );

		if ( page.name === 'appendix' ) {
			await evaluate( cdp, sessionId, `location.hash = 'resume-keyword-bank'` );
			await wait( 50 );
			metrics.fragment.isTarget = await evaluate(
				cdp,
				sessionId,
				`document.querySelector(':target') === document.getElementById('resume-keyword-bank')`
			);
		}

		await cdp.send( 'Emulation.setEmulatedMedia', {
			media: 'screen',
			features: [ { name: 'prefers-reduced-motion', value: 'reduce' } ],
		}, sessionId );
		await wait( 30 );
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

		return { ...metrics, disclosures, reducedMotion };
	} finally {
		await cdp.send( 'Target.closeTarget', { targetId: target.targetId } );
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
		for ( const page of PAGES ) {
			for ( const viewport of VIEWPORTS ) {
				const result = await inspectPage( cdp, page, viewport );
				assertPageMetrics( result, page, viewport );
				console.log(
					`verified ${ result.url } at ${ viewport.width }px: one H1, sequential outline, no document overflow, reduced motion`
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
	await verifyRenderedContracts();
}

main().catch( ( error ) => {
	console.error( error.message );
	process.exit( 1 );
} );
