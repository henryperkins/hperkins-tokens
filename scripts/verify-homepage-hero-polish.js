#!/usr/bin/env node
const { spawn } = require( 'node:child_process' );
const fs = require( 'node:fs/promises' );
const os = require( 'node:os' );
const path = require( 'node:path' );

const { getOrigin } = require( './lib/site-url' );

const CHROME = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const ORIGIN = getOrigin();

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

async function inspectHomepage( cdp, viewport ) {
	const target = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
	const attached = await cdp.send( 'Target.attachToTarget', {
		targetId: target.targetId,
		flatten: true,
	} );
	const sessionId = attached.sessionId;

	await cdp.send( 'Page.enable', {}, sessionId );
	await cdp.send( 'Runtime.enable', {}, sessionId );
	if ( viewport.noScript ) {
		await cdp.send( 'Emulation.setScriptExecutionDisabled', { value: true }, sessionId );
	}
	if ( viewport.reducedMotion ) {
		await cdp.send( 'Emulation.setEmulatedMedia', { features: [ { name: 'prefers-reduced-motion', value: 'reduce' } ] }, sessionId );
	}
	await cdp.send( 'Emulation.setDeviceMetricsOverride', {
		width: viewport.width,
		height: viewport.height,
		deviceScaleFactor: 1,
		mobile: false,
	}, sessionId );

	await Promise.all( [
		cdp.once( 'Page.loadEventFired', sessionId, 30000 ),
		cdp.send( 'Page.navigate', { url: new URL( '/', ORIGIN ).href }, sessionId, 30000 ),
	] );
	await cdp.send( 'Runtime.evaluate', { expression: 'document.fonts && document.fonts.ready', awaitPromise: true }, sessionId );
	await wait( 250 );

	const expression = `(() => {
		const title = document.querySelector('.hp-wapuu-hero__title');
		const art = document.querySelector('.hp-wapuu-hero__figure img');
		const hero = document.querySelector('.hp-wapuu-hero');
		const style = title ? getComputedStyle(title) : null;
		const geometry = selector => {
			const node = document.querySelector(selector);
			if (!node) return null;
			const r = node.getBoundingClientRect();
			return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width };
		};
		const orderedHeroSelectors = [
			'.hp-wapuu-hero__eyebrow',
			'.hp-wapuu-hero__title',
			'.hp-wapuu-hero__art',
			'.hp-wapuu-hero__text:not(.hp-wapuu-hero__note)',
			'.hp-wapuu-hero__note',
			'.hp-wapuu-hero__signals',
			'.hp-wapuu-hero__cta',
		];
		const orderedHeroNodes = orderedHeroSelectors.map(selector => document.querySelector(selector));
		const sourceOrder = orderedHeroNodes
			.map((node, index) => ({ node, index }))
			.sort((a, b) => a.node.compareDocumentPosition(b.node) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
			.map(item => item.index);
		return {
			sections: ['.hp-wapuu-hero-wrap', '#framework', '#work', '.hp-front-template__commission'].map(geometry),
			edges: ['.hp-wapuu-hero__copy', '.hp-template-hero__copy', '.hp-work', '.hp-front-template__cta'].map(geometry),
			rowWidths: [...document.querySelectorAll('.hp-work__entry')].map(e => e.getBoundingClientRect().width),
			rowFonts: [...document.querySelectorAll('.hp-work__desc')].map(e => parseFloat(getComputedStyle(e).fontSize)),
			closingLinks: [...document.querySelectorAll('.hp-front-template__cta-actions a')].map(e => new URL(e.href).pathname),
			footerLinks: [...document.querySelectorAll('.hp-footer__social a')].map(e => e.textContent.trim()),
			footerSearch: !!document.querySelector('.hp-footer input[type="search"]'),
			heroSourceOrder: sourceOrder,
			heroVisualOrder: orderedHeroSelectors.map(geometry),
			heroCssOrder: orderedHeroNodes.map(node => Number.parseInt(getComputedStyle(node).order, 10)),
			heroGridColumns: hero ? getComputedStyle(hero).gridTemplateColumns.split(' ').length : 0,
			heroButtonTargets: [...document.querySelectorAll('.hp-wapuu-hero__cta a')].map(node => {
				const r = node.getBoundingClientRect();
				return { width: r.width, height: r.height };
			}),
			heroChipTargets: [...document.querySelectorAll('.hp-wapuu-hero__signals .hp-chip')].map(node => {
				const r = node.getBoundingClientRect();
				return { width: r.width, height: r.height };
			}),
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
			fidelity: (() => {
				const $ = selector => document.querySelector(selector);
				const cs = (node, pseudo) => getComputedStyle(node, pseudo || null);
				const width = node => node.getBoundingClientRect().width;
				// Resolve the tokens the template names, so each check compares like
				// with like instead of hard-coding a colour serialization.
				const ref = document.createElement('span');
				ref.style.cssText = 'color: var(--hp-artifact); border-top-color: var(--hp-gold); text-decoration-color: color-mix(in srgb, var(--hp-gold) 55%, transparent);';
				document.body.append(ref);
				const refStyle = cs(ref);
				const refColors = { artifact: refStyle.color, gold: refStyle.borderTopColor, goldSoft: refStyle.textDecorationColor };
				ref.remove();
				const lead = $('.hp-wapuu-hero__text:not(.hp-wapuu-hero__note)');
				const halo = $('.hp-wapuu-hero__star');
				const expose = $('#framework .hp-template-hero__lead a');
				const panel = $('.hp-front-template__cta');
				const emblem = cs(panel, '::after');
				const footer = $('.hp-footer');
				return {
					ref: refColors,
					leadMarginTop: parseFloat(cs(lead).marginTop),
					noteMarginTop: parseFloat(cs($('.hp-wapuu-hero__note')).marginTop),
					copyMaxWidth: cs($('.hp-wapuu-hero__copy')).maxWidth,
					copyWidth: width($('.hp-wapuu-hero__copy')),
					leadWidth: width(lead),
					leadMaxWidth: parseFloat(cs(lead).maxWidth),
					artWidth: width($('.hp-wapuu-hero__art')),
					figureWidth: width($('.hp-wapuu-hero__figure')),
					// Layout width, not the bounding box: the halo may still be
					// finishing its settle turn, and a rotated box measures wider.
					haloWidth: halo.offsetWidth,
					haloAnimation: cs(halo).animationName,
					haloDuration: parseFloat(cs(halo).animationDuration),
					haloInnerStarOpacity: halo.querySelectorAll('path')[1]?.getAttribute('opacity') ?? null,
					eyebrowTracking: parseFloat(cs($('.hp-wapuu-hero__eyebrow')).letterSpacing) / parseFloat(cs($('.hp-wapuu-hero__eyebrow')).fontSize),
					eyebrowLinkBorder: cs($('.hp-wapuu-hero__eyebrow a')).borderBottomColor,
					chips: [...document.querySelectorAll('.hp-wapuu-hero__signals .hp-chip')].map(chip => ({
						text: chip.textContent.replace(/\\s+/g, ' ').trim(),
						links: [...chip.querySelectorAll('a')].map(link => ({
							text: link.textContent.trim(),
							name: (link.getAttribute('aria-label') || link.textContent).trim(),
						})),
					})),
					ringCtas: [...document.querySelectorAll('#framework .hp-ring-card__cta:not(.is-in-review)')].map(cta => {
						const link = cta.querySelector('a');
						return {
							family: cs(cta).fontFamily,
							shadow: cs(cta).textShadow,
							linkFamily: cs(link).fontFamily,
							linkSize: parseFloat(cs(link).fontSize),
							linkShadow: cs(link).textShadow,
							linkColor: cs(link).color,
						};
					}),
					expose: {
						color: cs(expose).color,
						deco: cs(expose).textDecorationColor,
						offset: parseFloat(cs(expose).textUnderlineOffset),
						size: parseFloat(cs(expose).fontSize),
					},
					workLinkColor: cs($('#work .hp-work__footer a')).color,
					emblem: {
						mask: emblem.maskImage || emblem.webkitMaskImage || '',
						width: parseFloat(emblem.width),
						transition: emblem.transitionProperty,
						duration: parseFloat(emblem.transitionDuration),
					},
					footerInnerOffset: $('.hp-footer__inner').getBoundingClientRect().top - footer.getBoundingClientRect().top,
					footerPadTop: parseFloat(cs(footer).borderTopWidth) + parseFloat(cs(footer).paddingTop),
					anchors: ['#framework', '#work'].map(selector => parseFloat(cs($(selector)).scrollMarginTop)),
					headerHeight: $('header.wp-block-template-part').getBoundingClientRect().height,
				};
			})(),
		};
	})()`;
	const evaluated = await cdp.send( 'Runtime.evaluate', {
		expression,
		awaitPromise: true,
		returnByValue: true,
	}, sessionId );
	if ( evaluated.exceptionDetails ) {
		throw new Error( `Home probe failed at ${ viewport.width }px: ${ evaluated.exceptionDetails.exception?.description || evaluated.exceptionDetails.text }` );
	}
	const page = evaluated.result.value;

	if ( viewport.hover ) {
		page.hover = await probeHoverStates( cdp, sessionId );
	}

	await cdp.send( 'Target.closeTarget', { targetId: target.targetId } );
	return page;
}

// Hover is forced through DevTools rather than a synthetic pointer, so each
// state is read in isolation. The wait outlasts --dur-slow (420ms), the
// longest transition these rules run.
const HOVER_PROBES = [
	[ 'eyebrow', '.hp-wapuu-hero__eyebrow a', `getComputedStyle(document.querySelector('.hp-wapuu-hero__eyebrow a')).borderBottomColor` ],
	[ 'ringCta', '#framework .hp-ring-card.is-air .hp-ring-card__cta a', `(() => { const s = getComputedStyle(document.querySelector('#framework .hp-ring-card.is-air .hp-ring-card__cta a')); return { color: s.color, border: s.borderBottomColor }; })()` ],
	[ 'expose', '#framework .hp-template-hero__lead a', `(() => { const s = getComputedStyle(document.querySelector('#framework .hp-template-hero__lead a')); return { color: s.color, deco: s.textDecorationColor }; })()` ],
	[ 'work', '#work .hp-work__footer a', `getComputedStyle(document.querySelector('#work .hp-work__footer a')).color` ],
	[ 'emblem', '.hp-front-template__cta', `(() => { const t = getComputedStyle(document.querySelector('.hp-front-template__cta'), '::after').transform; if (t === 'none') return 0; const m = new DOMMatrixReadOnly(t); return Math.round(Math.atan2(m.b, m.a) * 180 / Math.PI); })()` ],
];

async function probeHoverStates( cdp, sessionId ) {
	await cdp.send( 'DOM.enable', {}, sessionId );
	await cdp.send( 'CSS.enable', {}, sessionId );
	const states = {};
	for ( const [ key, selector, probe ] of HOVER_PROBES ) {
		const { root } = await cdp.send( 'DOM.getDocument', { depth: 0 }, sessionId );
		const { nodeId } = await cdp.send( 'DOM.querySelector', { nodeId: root.nodeId, selector }, sessionId );
		assert( nodeId, `Home hover probe could not find ${ selector }.` );
		await cdp.send( 'CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [ 'hover' ] }, sessionId );
		await wait( 600 );
		states[ key ] = ( await cdp.send( 'Runtime.evaluate', { expression: probe, returnByValue: true }, sessionId ) ).result.value;
		await cdp.send( 'CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] }, sessionId );
	}
	return states;
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

function verifyComposition( page, width ) {
	assert( page.scrollWidth <= page.clientWidth + 1, `Home overflows at ${ width }px.` );
	assert( page.heroSourceOrder.join( ',' ) === '0,1,2,3,4,5,6', `Home hero source order must be eyebrow, H1, Wapuu, then supporting content at ${ width }px.` );
	assert( page.heroCssOrder.every( order => order === 0 ), `Home hero must not use CSS order to rewrite its reading sequence at ${ width }px.` );
	assert( page.heroGridColumns === ( width <= 900 ? 1 : 2 ), `Home hero must use a one-column grid through 900px and two columns above it (${ width }px).` );
	assert( page.sections.every( Boolean ), `Home is missing a body section at ${ width }px.` );
	page.sections.forEach( ( section, index ) => {
		if ( index ) {
			assert( section.y >= page.sections[ index - 1 ].bottom - 1, `Home sections are out of order or overlap at ${ width }px.` );
		}
	} );
	assert( page.edges.every( edge => edge && Math.abs( edge.x - page.edges[ 0 ].x ) < 1 ), `Home sections do not share a left edge at ${ width }px.` );
	assert( Math.abs( page.edges[ 1 ].right - page.edges[ 2 ].right ) < 1 && Math.abs( page.edges[ 2 ].right - page.edges[ 3 ].right ) < 1, `Rings, Work and closing panel do not share a right edge at ${ width }px.` );
	assert( page.rowWidths.length === 4 && page.rowWidths.every( row => Math.abs( row - page.edges[ 2 ].width + 2 ) < 1 ), `Home ledger rows do not fill their register at ${ width }px.` );
	assert( page.rowFonts.every( size => size >= 17 ), 'Home ledger descriptions must retain the reading floor.' );
	assert( page.closingLinks.join( ',' ) === '/contact/,/one-page-resume/', 'Home closing actions must reach Contact and the stable resume route.' );
	assert( page.footerLinks.length === 4 && page.footerLinks.every( Boolean ) && !page.footerSearch, 'Home must render the labelled footer without the retired search field.' );
	assert(
		page.heroButtonTargets.every( target => target.width >= 44 && target.height >= 44 ),
		`Home hero actions must retain 44px targets at ${ width }px.`
	);
	if ( width <= 900 ) {
		page.heroVisualOrder.forEach( ( item, index ) => {
			if ( index ) {
				assert( item.y >= page.heroVisualOrder[ index - 1 ].bottom - 1, `Home hero must render eyebrow, H1, Wapuu, then supporting content at ${ width }px.` );
			}
		} );
		if ( width <= 781 ) {
			assert(
				page.heroChipTargets.every( target => target.width >= 44 && target.height >= 44 ),
				`Home hero proof chips must retain 44px touch targets at ${ width }px.`
			);
		}
	} else {
		assert( page.heroVisualOrder[ 2 ].x >= page.heroVisualOrder[ 1 ].right - 1, `Home Wapuu must occupy the desktop grid's second column at ${ width }px.` );
	}
}

// The values templates/home/Home.dc.html declares, pinned after the
// 2026-09-28 fidelity pass. The deliberate theme deltas docs/design-system/
// INDEX.md records (17px ledger copy, 44px actions, the mobile weight, the
// ring text tints, the hidden mobile bitmap) are asserted above, not here.
function verifyTemplateFidelity( page, width ) {
	const f = page.fidelity;
	const near = ( actual, expected, tolerance = 0.5 ) => Math.abs( actual - expected ) <= tolerance;
	assert(
		near( f.leadMarginTop, 24 ) && near( f.noteMarginTop, 16 ),
		`Home lead must sit 24px under the title and the note 16px under the lead at ${ width }px; got ${ f.leadMarginTop }px / ${ f.noteMarginTop }px.`
	);
	assert(
		f.copyMaxWidth === 'none' && near( f.leadWidth, Math.min( f.copyWidth, f.leadMaxWidth ), 1 ),
		`Home copy must cap each paragraph at its own measure, not the whole column, at ${ width }px; lead ${ f.leadWidth }px, column ${ f.copyWidth }px, cap ${ f.copyMaxWidth }.`
	);
	if ( width <= 600 ) {
		assert(
			f.figureWidth <= 240.5 && near( f.haloWidth, Math.min( 288, f.artWidth * 1.18 ), 1 ),
			`Home phone Wapuu must shrink to 15rem inside an 18rem halo at ${ width }px; got ${ f.figureWidth }px / ${ f.haloWidth }px in a ${ f.artWidth }px column.`
		);
	} else {
		assert( near( f.figureWidth, Math.min( 440, f.artWidth ), 1 ), `Home Wapuu must fill its column up to 27.5rem at ${ width }px; got ${ f.figureWidth }px.` );
	}
	assert( f.haloAnimation === 'hp-halo-settle', `Home halo must settle in with hp-halo-settle at ${ width }px; got ${ f.haloAnimation }.` );
	assert( f.haloInnerStarOpacity === '0.45', `Home halo's inner star must draw at 0.45; got ${ f.haloInnerStarOpacity }.` );
	assert( near( f.eyebrowTracking, 0.2, 0.005 ), `Home eyebrow must track at 0.2em; got ${ f.eyebrowTracking.toFixed( 3 ) }em.` );
	assert(
		f.chips.length === 4 && f.chips.every( ( chip ) =>
			chip.links.length === 1 &&
			chip.links[ 0 ].text === '↗' &&
			chip.links[ 0 ].name !== '↗' &&
			chip.text.includes( chip.links[ 0 ].name )
		),
		'Home proof chips must set the full label as text, then one ↗ link named after the artifact it opens.'
	);
	assert(
		f.ringCtas.length === 2 && f.ringCtas.every( ( cta ) =>
			! /Marcellus/.test( cta.family ) &&
			cta.shadow === 'none' &&
			/Marcellus/.test( cta.linkFamily ) &&
			near( cta.linkSize, 13 ) &&
			cta.linkShadow === 'none'
		),
		`Home ring CTAs must keep the body line with only the link in 13px Marcellus and no shadow at ${ width }px.`
	);
	assert(
		f.expose.color === f.ref.artifact && f.expose.deco === f.ref.goldSoft && near( f.expose.offset, f.expose.size * 0.14, 0.15 ),
		`Home "Expose · Govern · Attest" must be an artifact link with a 55% gold underline at 0.14em (${ width }px).`
	);
	assert( f.workLinkColor === f.ref.artifact, `Home "See the full Work index." must use the artifact link colour at ${ width }px; got ${ f.workLinkColor }.` );
	assert(
		/emblem-commission\.svg/.test( f.emblem.mask ) && near( f.emblem.width, 32 ) && /transform/.test( f.emblem.transition ),
		`Home closing emblem must be the 32px commission emblem, ready to turn, at ${ width }px; got ${ f.emblem.width }px, ${ f.emblem.mask.slice( -40 ) }.`
	);
	assert(
		near( f.footerInnerOffset, f.footerPadTop ),
		`Footer content must start at the plate's padding, with no flow gap, at ${ width }px; got ${ f.footerInnerOffset }px for ${ f.footerPadTop }px of rule and padding.`
	);
	assert(
		f.anchors.every( ( margin ) => near( margin, f.headerHeight + 12 ) ),
		`#framework and #work must clear the ${ f.headerHeight }px masthead by 12px at ${ width }px; got ${ f.anchors.join( '/' ) }px.`
	);
}

function verifyHoverFidelity( page ) {
	const f = page.fidelity;
	const h = page.hover;
	assert( h.eyebrow === f.eyebrowLinkBorder, 'Home eyebrow link must not change on hover.' );
	assert(
		h.ringCta.color === f.ringCtas[ 0 ].linkColor && h.ringCta.border === h.ringCta.color,
		`Home ring CTA hover must turn its underline solid in its own colour; got ${ h.ringCta.color } / ${ h.ringCta.border }.`
	);
	assert(
		h.expose.color === f.ref.artifact && h.expose.deco === f.ref.gold,
		`Home "Expose · Govern · Attest" hover must keep its colour and turn the underline solid gold; got ${ h.expose.color } / ${ h.expose.deco }.`
	);
	assert( h.work === f.ref.artifact, `Home "See the full Work index." must keep the artifact colour on hover; got ${ h.work }.` );
	assert( h.emblem === 90, `Home closing emblem must turn a quarter on panel hover; got ${ h.emblem }deg.` );
}

async function main() {
	await withChrome( async ( cdp ) => {
		const desktop = await inspectHomepage( cdp, { width: 1440, height: 1000, hover: true } );
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

		const widths = [ 320, 390, 600, 601, 781, 900, 901, 1024, 1440 ];
		for ( const width of widths ) {
			const page = width === 1440 ? desktop : width === 390 ? mobile : await inspectHomepage( cdp, { width, height: 1000 } );
			verifyComposition( page, width );
			verifyTemplateFidelity( page, width );
		}
		verifyHoverFidelity( desktop );
		const still = await inspectHomepage( cdp, { width: 390, height: 1000, reducedMotion: true } );
		assert(
			still.fidelity.haloDuration <= 0.001 && still.fidelity.emblem.duration <= 0.001,
			`Reduced motion must cut the halo settle and the emblem turn to their end states; got ${ still.fidelity.haloDuration }s / ${ still.fidelity.emblem.duration }s.`
		);
		for ( const width of [ 320, 390, 600, 601, 781, 900, 1440 ] ) {
			const noScript = await inspectHomepage( cdp, { width, height: 1000, noScript: true } );
			verifyComposition( noScript, width );
		}
		console.log( 'checked Home composition at 9 widths and 7 no-JavaScript widths: accessible hero order, responsive grid, touch targets, overflow, section order, shared edges, complete ledger, paired actions, labelled footer' );
		console.log( 'checked Home template fidelity at 9 widths plus desktop hover and reduced motion: hero rhythm and measure, phone Wapuu, halo settle, eyebrow, proof chips, ring CTAs, artifact links, closing emblem, footer inset, anchor clearance' );

		console.log(
			`checked homepage hero: desktop weight=${ desktop.title.fontWeight }, mobile weight=${ mobile.title.fontWeight }`
		);
	} );
}

main().catch( ( error ) => {
	console.error( error.message );
	process.exit( 1 );
} );
