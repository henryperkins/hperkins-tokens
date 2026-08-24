#!/usr/bin/env node

/**
 * Phase-aware About rendered contract (proof-first and v2 résumé bodies).
 *
 * Runs against an explicit HPERKINS_ORIGIN using the repository's
 * dependency-free Chrome/CDP approach. --require-local additionally demands a
 * matching HPERKINS_WP_PATH (same site as HPERKINS_ORIGIN) and refuses the
 * default production origin, for the guarded local acceptance run.
 *
 * Covers the primary widths 1440/1024/768/390/320 plus boundary probes at
 * 895/896, 781/782, and 600/601: heading inventory and ancestry, the named
 * selected navigation and its unnamed section targets, real-keyboard fragment
 * activation with router-scroll focus and sticky-header clearance, 24px
 * navigation/action targets, phase-specific responsive grid boundaries,
 * project cards without whole-card affordances, canonical action-rail and
 * closing-panel composition, source/rendered word-count parity, and screenshots
 * at the five primary widths.
 */

const { spawn } = require( 'node:child_process' );
const fs = require( 'node:fs' );
const fsPromises = require( 'node:fs/promises' );
const os = require( 'node:os' );
const path = require( 'node:path' );

const {
	assertMatchingSiteUrl,
	getOrigin,
	normalizeSiteUrl,
	stripWpcomCacheVersionFromRenderedHref,
} = require( './lib/site-url' );
const {
	ABOUT_WORD_RANGE,
	countVisibleWords,
	countRenderedText,
	decodeCharacterReferences,
	extractExactText,
	findHeadings,
	findLinks,
	verifyCssOwnership,
} = require( './lib/about-page-contract' );
const { assertKnownOptions, selectAboutSource } = require( './lib/page-phase-contract' );
const { assertRuleDeclarations } = require( './lib/style-coverage' );

const THEME_ROOT = path.join( __dirname, '..' );
const ARGV = process.argv.slice( 2 );
assertKnownOptions( ARGV, [ '--drafts', '--source-only', '--require-local' ] );
const CHROME = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const REQUIRE_LOCAL = ARGV.includes( '--require-local' );
const SOURCE_ONLY = ARGV.includes( '--source-only' );
const PRODUCTION_ORIGIN = 'https://hperkins.blog';
const CAPTURE_DIR = process.env.HPERKINS_CAPTURE_DIR ||
	path.join( os.tmpdir(), 'hperkins-about-rendered' );

const PRIMARY_VIEWPORTS = [
	{ name: '1440', width: 1440, height: 1000, mobile: false, canonical: true },
	{ name: '1024', width: 1024, height: 1000, mobile: false },
	{ name: '768', width: 768, height: 1000, mobile: false },
	{ name: '390', width: 390, height: 844, mobile: true },
	{ name: '320', width: 320, height: 844, mobile: true },
];

// Geometry-only probes for the exclusive responsive boundaries. These produce
// no word-count records.
const BOUNDARY_VIEWPORTS = [
	{ name: 'boundary-896', width: 896, height: 1000, mobile: false },
	{ name: 'boundary-895', width: 895, height: 1000, mobile: false },
	{ name: 'boundary-782', width: 782, height: 1000, mobile: false },
	{ name: 'boundary-781', width: 781, height: 1000, mobile: false },
	{ name: 'boundary-601', width: 601, height: 1000, mobile: true },
	{ name: 'boundary-600', width: 600, height: 1000, mobile: true },
];

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function findBalancedElementsByClass( html, className, label ) {
	const escaped = className.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
	const openPattern = new RegExp(
		`<([a-z][a-z0-9-]*)\\b[^>]*class="[^"]*(?<![\\w-])${ escaped }(?![\\w-])[^"]*"[^>]*>`,
		'gi'
	);
	const results = [];

	for ( const open of html.matchAll( openPattern ) ) {
		const tag = open[ 1 ].toLowerCase();
		const tagPattern = new RegExp( `<${ tag }\\b[^>]*>|</${ tag }>`, 'gi' );
		tagPattern.lastIndex = open.index + open[ 0 ].length;
		let depth = 1;
		let closing;
		for ( let token = tagPattern.exec( html ); token; token = tagPattern.exec( html ) ) {
			depth += token[ 0 ].startsWith( '</' ) ? -1 : 1;
			if ( depth === 0 ) {
				closing = token;
				break;
			}
		}
		assert( closing, `${ label } has an unbalanced .${ className } element.` );
		results.push( {
			inner: html.slice( open.index + open[ 0 ].length, closing.index ),
			open: open[ 0 ],
			outer: html.slice( open.index, closing.index + closing[ 0 ].length ),
			start: open.index,
			end: closing.index + closing[ 0 ].length,
		} );
	}

	return results;
}

function textByClass( html, className, label ) {
	const element = findBalancedElementsByClass( html, className, label )[ 0 ];
	assert( element, `${ label } is missing .${ className }.` );
	return extractExactText( element.inner, { label } );
}

function deriveHeadingExpectations( html, label ) {
	const sections = Array.from( html.matchAll( /<section\b[^>]*\bid="([^"]+)"[^>]*>[\s\S]*?<\/section>/gi ) ).map( ( match ) => ( {
		end: match.index + match[ 0 ].length,
		id: match[ 1 ],
		start: match.index,
	} ) );

	return Array.from( html.matchAll( /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi ) ).map( ( match ) => {
		const section = sections.find( ( candidate ) => match.index > candidate.start && match.index < candidate.end );
		return {
			level: Number( match[ 1 ] ),
			text: extractExactText( match[ 2 ], { label } ),
			section: section ? section.id : 'hero',
		};
	} );
}

function deriveLegacyRenderedExpectations( html, label ) {
	const headings = deriveHeadingExpectations( html, label );
	const navs = findBalancedElementsByClass( html, 'hp-about-nav', label );
	assert( navs.length === 1, `${ label } must contain one .hp-about-nav, got ${ navs.length }.` );
	const navLabelMatch = /\baria-label="([^"]+)"/i.exec( navs[ 0 ].open );
	assert( navLabelMatch, `${ label } .hp-about-nav has no aria-label.` );
	const navLinks = findLinks( navs[ 0 ].inner, label );
	assert( navLinks.length > 0, `${ label } .hp-about-nav has no links.` );

	const projects = findBalancedElementsByClass( html, 'hp-work-card', label ).map( ( card ) => {
		const actions = findBalancedElementsByClass( card.inner, 'hp-work-card__actions', label )[ 0 ];
		assert( actions, `${ label } project card has no .hp-work-card__actions.` );
		return {
			title: textByClass( card.inner, 'hp-work-card__title', label ),
			status: textByClass( card.inner, 'hp-work-card__status', label ),
			actions: findLinks( actions.inner, label ),
		};
	} );
	const rails = findBalancedElementsByClass( html, 'hp-action-rail', label ).map( ( rail ) =>
		findLinks( rail.inner, label )
	);
	assert( rails.length > 0, `${ label } has no .hp-action-rail.` );

	const avatar = findBalancedElementsByClass( html, 'hp-about-avatar', label )[ 0 ];
	const portrait = avatar && /<img\b[^>]*\balt="([^"]*)"/i.exec( avatar.inner );
	assert( portrait, `${ label } has no portrait alternative text to compare with the render.` );
	const foundations = findBalancedElementsByClass( html, 'hp-about-foundations-grid', label )[ 0 ];
	assert( foundations, `${ label } has no .hp-about-foundations-grid.` );
	const wcus = findBalancedElementsByClass( html, 'hp-about-wcus', label )[ 0 ] || null;
	const coreAi = findBalancedElementsByClass( html, 'hp-about-core-ai', label )[ 0 ] || null;
	let wcusActions = [];
	if ( wcus ) {
		assert(
			findBalancedElementsByClass( html, 'hp-about-hero__copy', label )[ 0 ]?.inner.includes( wcus.outer ),
			`${ label } must place .hp-about-wcus inside .hp-about-hero__copy.`
		);
		const actionRails = findBalancedElementsByClass( html, 'hp-action-rail', label );
		assert(
			! actionRails.some( ( rail ) => rail.start < wcus.end && rail.end > wcus.start ),
			`${ label } .hp-about-wcus and its action must stay outside any hp-action-rail ancestor or descendant.`
		);
		const wcusActionElements = findBalancedElementsByClass( wcus.inner, 'hp-about-wcus__action', label );
		assert( wcusActionElements.length === 1, `${ label } .hp-about-wcus must contain exactly one .hp-about-wcus__action.` );
		const buttons = findBalancedElementsByClass( wcusActionElements[ 0 ].inner, 'wp-block-button', label );
		assert( buttons.length === 1, `${ label } .hp-about-wcus__action must contain exactly one core Button .wp-block-button.` );
		wcusActions = findLinks( buttons[ 0 ].inner, label );
		assert( wcusActions.length === 1, `${ label } .hp-about-wcus must expose exactly one action.` );
		assert( coreAi, `${ label } with a WCUS callout has no .hp-about-core-ai section.` );
		assert(
			findBalancedElementsByClass( coreAi.inner, 'hp-evidence-row', label ).length === 4,
			`${ label } .hp-about-core-ai must contain exactly four evidence rows.`
		);
	}

	return {
		version: 'proof-first',
		closingActionLabels: rails.at( -1 ).map( ( action ) => action.text ),
		foundationsOrder: findHeadings( foundations.inner, label )
			.filter( ( heading ) => heading.level === 3 )
			.map( ( heading ) => heading.text ),
		fragments: navLinks.map( ( link ) => link.href.slice( 1 ) ),
		headings,
		heroActionLabels: rails[ 0 ].map( ( action ) => action.text ),
		navLabel: decodeCharacterReferences( navLabelMatch[ 1 ] ),
		navLinks,
		portraitAlt: decodeCharacterReferences( portrait[ 1 ] ),
		projects,
		sourceWordCount: countVisibleWords( html, { label } ),
		wcusActionLabels: wcusActions.map( ( action ) => action.text ),
	};
}

function deriveV2RenderedExpectations( html, label ) {
	const headings = deriveHeadingExpectations( html, label );
	const navs = findBalancedElementsByClass( html, 'hp-about-rail', label );
	assert( navs.length === 1, `${ label } must contain one .hp-about-rail, got ${ navs.length }.` );
	const navLabelMatch = /\baria-label="([^"]+)"/i.exec( navs[ 0 ].open );
	assert( navLabelMatch, `${ label } .hp-about-rail has no aria-label.` );
	const navLinks = findLinks( navs[ 0 ].inner, label );
	assert( navLinks.length > 0, `${ label } .hp-about-rail has no links.` );

	const projects = findBalancedElementsByClass( html, 'hp-about-showcase-card', label ).map( ( card ) => {
		const actions = findBalancedElementsByClass( card.inner, 'hp-about-showcase-card__link', label )[ 0 ];
		assert( actions, `${ label } showcase card has no .hp-about-showcase-card__link.` );
		const title = findHeadings( card.inner, label ).find( ( heading ) => heading.level === 3 );
		assert( title, `${ label } showcase card has no H3 title.` );
		return {
			title: title.text,
			status: textByClass( card.inner, 'hp-about-showcase-card__type', label ),
			actions: findLinks( actions.inner, label ),
		};
	} );
	assert( projects.length === 5, `${ label } must contain five showcase cards, got ${ projects.length }.` );

	const rails = findBalancedElementsByClass( html, 'hp-action-rail', label ).map( ( rail ) =>
		findLinks( rail.inner, label )
	);
	assert( rails.length === 1, `${ label } must contain one closing .hp-action-rail, got ${ rails.length }.` );
	const portraitElement = findBalancedElementsByClass( html, 'hp-about-v2-hero__portrait', label )[ 0 ];
	const portrait = portraitElement && /<img\b[^>]*\balt="([^"]*)"/i.exec( portraitElement.inner );
	assert( portrait, `${ label } has no portrait alternative text to compare with the render.` );

	return {
		version: 'v2',
		closingActionLabels: rails[ 0 ].map( ( action ) => action.text ),
		foundationsOrder: [],
		fragments: navLinks.map( ( link ) => link.href.slice( 1 ) ),
		headings,
		heroActionLabels: [],
		navLabel: decodeCharacterReferences( navLabelMatch[ 1 ] ),
		navLinks,
		portraitAlt: decodeCharacterReferences( portrait[ 1 ] ),
		projects,
		sourceWordCount: countVisibleWords( html, { label } ),
		wcusActionLabels: [],
	};
}

function deriveRenderedExpectations( html, { label = 'selected About body' } = {} ) {
	return html.includes( 'hp-about-resume' )
		? deriveV2RenderedExpectations( html, label )
		: deriveLegacyRenderedExpectations( html, label );
}

function verifySourceContracts( selectedAboutBody, pageCss, label ) {
	const expectations = deriveRenderedExpectations( selectedAboutBody, { label } );
	verifyCssOwnership(
		fs.readFileSync( path.join( THEME_ROOT, 'style.css' ), 'utf8' ),
		pageCss
	);
	if ( expectations.wcusActionLabels.length > 0 ) {
		for ( const contract of [
			{
				selector: '.hp-about-wcus',
				declarations: {
					'margin-block-start': 'var(--wp--preset--spacing--4)',
					padding: 'var(--wp--preset--spacing--4)',
					'border-inline-start': '0.25rem solid var(--wp--preset--color--gold-600)',
					background: 'color-mix(in srgb, var(--wp--preset--color--parchment-100) 90%, var(--wp--preset--color--gold-100))',
				},
			},
			{
				selector: '.hp-about-wcus__label',
				declarations: {
					margin: '0',
					color: 'var(--wp--preset--color--green-700)',
					'font-family': 'var(--wp--preset--font-family--mono)',
					'font-size': 'var(--wp--preset--font-size--xs)',
					'font-weight': '700',
					'letter-spacing': '0.06em',
					'text-transform': 'uppercase',
				},
			},
			{ selector: '.hp-about-wcus__copy', declarations: { 'margin-block-start': 'var(--wp--preset--spacing--3)' } },
			{ selector: '.hp-about-wcus__action', declarations: { 'margin-block-start': 'var(--wp--preset--spacing--3)' } },
		] ) {
			assertRuleDeclarations( pageCss, contract );
		}
	}
	console.log( 'About rendered-page source contracts verified.' );
	return expectations;
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
		// A missing or non-executable CHROME_BIN surfaces as a spawn 'error'
		// event, never 'exit'; without this listener Node crashes unhandled.
		chrome.on( 'error', ( error ) => {
			clearTimeout( timer );
			reject( new Error( `Chrome failed to start (${ CHROME }): ${ error.message }` ) );
		} );
	} );
}

function createCdpClient( wsUrl ) {
	// The dependency-free CDP client rides on Node's global WebSocket; fail
	// with a version message instead of a bare ReferenceError on older Node.
	if ( typeof WebSocket === 'undefined' ) {
		throw new Error( 'Global WebSocket is unavailable; the rendered About contract requires Node 22 or newer.' );
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

	function send( method, params = {}, sessionId, timeout = 20000 ) {
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

	function once( method, sessionId, timeout = 15000 ) {
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

async function withChrome( callback ) {
	const userDataDir = await fsPromises.mkdtemp(
		path.join( os.tmpdir(), 'hp-about-rendered-chrome-' )
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

async function dispatchKey( cdp, sessionId, key, code, keyCode, text ) {
	// Enter carries its text payload ('\r') so Chrome performs the default
	// action (link activation), matching a physical keypress.
	await cdp.send( 'Input.dispatchKeyEvent', {
		type: 'keyDown',
		key,
		code,
		windowsVirtualKeyCode: keyCode,
		...( text ? { text } : {} ),
	}, sessionId );
	await cdp.send( 'Input.dispatchKeyEvent', {
		type: 'keyUp',
		key,
		code,
		windowsVirtualKeyCode: keyCode,
	}, sessionId );
}

function buildInspectionExpression( opts ) {
	// One self-contained battery. Only the OPTS literal is interpolated.
	return `(async () => {
		const OPTS = ${ JSON.stringify( opts ) };
		const out = { violations: [], pageUrl: location.href };
		const rect = (el) => {
			const value = el.getBoundingClientRect();
			return { left: value.left, top: value.top, right: value.right, bottom: value.bottom, width: value.width, height: value.height };
		};

		out.clientWidth = document.documentElement.clientWidth;
		out.scrollWidth = document.documentElement.scrollWidth;

		const content = document.querySelector('.hp-about-template .wp-block-post-content');
		if (!content) { out.violations.push('missing .hp-about-template .wp-block-post-content'); return out; }

		// --- heading inventory (level, text, owning fragment section) -----
		out.headings = Array.from(content.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((heading) => {
			const section = heading.closest('section[id]');
			return {
				level: Number(heading.tagName.slice(1)),
				text: heading.textContent.replace(/\\s+/gu, ' ').trim(),
				section: section ? section.id : 'hero',
			};
		});

		// --- named navigation + unnamed section targets -------------------
		const isV2 = OPTS.version === 'v2';
		const navs = content.querySelectorAll(isV2 ? '.hp-about-rail' : '.hp-about-nav');
		out.navCount = navs.length;
		const nav = navs[0] || null;
		out.nav = null;
		if (nav) {
			const label = nav.querySelector(isV2 ? '.hp-about-rail__label' : '.hp-about-nav__label');
			const lists = nav.querySelectorAll('ul');
			out.nav = {
				labelText: label ? label.textContent.trim() : null,
				labelIsHeading: !!nav.querySelector('h1,h2,h3,h4,h5,h6'),
				listCount: lists.length,
				links: Array.from(nav.querySelectorAll('a')).map((link) => ({
					text: link.textContent.trim(),
					hash: link.getAttribute('href'),
					rect: rect(link),
				})),
			};
		}
		out.targets = OPTS.fragments.map((fragment) => {
			const target = document.getElementById(fragment);
			return target ? {
				id: fragment,
				tag: target.tagName.toLowerCase(),
				hasAriaLabel: target.hasAttribute('aria-label') || target.hasAttribute('aria-labelledby'),
				firstHeadingLevel: (() => {
					const heading = target.querySelector('h1,h2,h3,h4,h5,h6');
					return heading ? Number(heading.tagName.slice(1)) : null;
				})(),
			} : null;
		});

		// --- project cards --------------------------------------------------
		out.cards = Array.from(content.querySelectorAll(isV2 ? '.hp-about-showcase-card' : '.hp-work-card')).map((card) => ({
			rect: rect(card),
			title: (card.querySelector(isV2 ? 'h3' : '.hp-work-card__title') || {}).textContent?.trim?.() || null,
			titleHasAnchor: !!card.querySelector(isV2 ? 'h3 a' : '.hp-work-card__title a'),
			status: (card.querySelector(isV2 ? '.hp-about-showcase-card__type' : '.hp-work-card__status') || {}).textContent?.trim?.() || null,
			insideAnchor: !!card.closest('a'),
			actions: Array.from(card.querySelectorAll(isV2 ? '.hp-about-showcase-card__link a' : '.hp-work-card__actions a')).map((link) => ({
				text: link.textContent.trim(),
				href: link.getAttribute('href'),
				rect: rect(link),
			})),
		}));

		// --- capabilities / hero / signals / foundations geometry ----------
		const capabilityColumns = isV2 ? [] : Array.from(content.querySelectorAll('.hp-capability')).map(rect);
		out.capabilityColumns = capabilityColumns;
		const heroCopy = content.querySelector(isV2 ? '.hp-about-v2-hero__nameplate' : '.hp-about-hero__copy');
		const heroPortrait = content.querySelector(isV2 ? '.hp-about-v2-hero__portrait' : '.hp-about-hero__portrait');
		out.hero = heroCopy && heroPortrait ? { copy: rect(heroCopy), portrait: rect(heroPortrait) } : null;
		out.signals = Array.from(content.querySelectorAll(isV2 ? '.hp-about-impact-strip .hp-about-v2-impact' : '.hp-about-impact .hp-signal')).map(rect);
		const wcus = content.querySelector('.hp-about-hero__copy .hp-about-wcus');
		out.wcus = wcus ? {
			insideActionRail: wcus.matches('.hp-action-rail') || !!wcus.closest('.hp-action-rail') || !!wcus.querySelector('.hp-action-rail'),
			actions: Array.from(wcus.querySelectorAll('.hp-about-wcus__action .wp-block-button__link')).map((link) => {
				const bounds = link.getBoundingClientRect();
				const range = document.createRange();
				range.selectNodeContents(link);
				return {
					text: link.textContent.trim(),
					rect: rect(link),
					textContained: Array.from(range.getClientRects()).every((value) => value.left >= bounds.left - 1 && value.right <= bounds.right + 1 && value.top >= bounds.top - 1 && value.bottom <= bounds.bottom + 1),
				};
			}),
		} : null;
		out.coreAiEvidenceRows = content.querySelectorAll('.hp-about-core-ai .hp-evidence-row').length;
		const foundationColumns = Array.from(
			content.querySelectorAll('.hp-about-foundations-grid > .wp-block-column')
		);
		out.foundations = foundationColumns.map(rect);
		out.foundationsOrder = [];
		if (foundationColumns.length === 2) {
			out.foundationsOrder =
				foundationColumns[0].querySelector('h3') && foundationColumns[1].querySelector('h3')
					? [
						foundationColumns[0].querySelector('h3').textContent.trim(),
						...Array.from(foundationColumns[1].querySelectorAll('h3')).map((h) => h.textContent.trim()),
					]
					: [];
		}

		// --- action rails and closing panel --------------------------------
		out.rails = Array.from(content.querySelectorAll('.hp-action-rail')).map((rail) => ({
			rect: rect(rail),
			links: Array.from(rail.querySelectorAll('.wp-block-button__link')).map((link) => ({
				text: link.textContent.trim(),
				rect: rect(link),
			})),
		}));
		out.panelCount = content.querySelectorAll('.hp-action-panel.is-closing').length;

		// --- portrait -------------------------------------------------------
		const portraitImg = content.querySelector(isV2 ? '.hp-about-v2-hero__portrait img' : '.hp-about-avatar img');
		out.portraitAlt = portraitImg ? portraitImg.getAttribute('alt') : null;

		// --- focus-visible pass (rects above are already captured) --------
		out.focus = [];
		const focusTargets = [
			...(nav ? Array.from(nav.querySelectorAll('a')) : []),
			...Array.from(content.querySelectorAll(isV2 ? '.hp-about-showcase-card__link a' : '.hp-work-card__actions a')),
			...Array.from(content.querySelectorAll('.hp-action-rail .wp-block-button__link')),
			...Array.from(content.querySelectorAll('.hp-about-wcus__action .wp-block-button__link')),
		];
		for (const link of focusTargets) {
			try { link.focus({ preventScroll: true }); } catch (error) { link.focus(); }
			const style = getComputedStyle(link);
			out.focus.push({
				text: link.textContent.trim(),
				matchesFocusVisible: link.matches(':focus-visible'),
				outlineStyle: style.outlineStyle,
				outlineWidth: Number.parseFloat(style.outlineWidth) || 0,
			});
		}
		if (document.activeElement && document.activeElement.blur) { document.activeElement.blur(); }

		// --- canonical word count (skipped on boundary probes) --------------
		// The page hands its rendered text back verbatim; Node segments it, so
		// Chrome's ICU version can never move the count on its own.
		out.renderedText = null;
		if (OPTS.countWords) {
			const clone = content.cloneNode(true);
			clone.querySelectorAll('[hidden], [aria-hidden="true"]').forEach((node) => node.remove());
			const shellMain = document.createElement('main');
			shellMain.className = 'hp-about-template';
			shellMain.style.position = 'fixed';
			shellMain.style.left = '0';
			shellMain.style.top = '0';
			shellMain.style.width = document.documentElement.clientWidth + 'px';
			shellMain.style.opacity = '0';
			shellMain.style.pointerEvents = 'none';
			shellMain.style.zIndex = '-1';
			const shellContent = document.createElement('div');
			shellContent.className = 'hp-about-template__content';
			shellMain.appendChild(shellContent);
			shellContent.appendChild(clone);
			document.body.appendChild(shellMain);
			out.renderedText = clone.innerText;
			shellMain.remove();
		}

		const maximumSeconds = (value) => Math.max(...value.split(',').map((part) => {
			const number = Number.parseFloat(part) || 0;
			return part.trim().endsWith('ms') ? number / 1000 : number;
		}));
		out.reducedMotion = {
			matches: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
			offenders: Array.from(content.querySelectorAll('*')).filter((element) => {
				const style = getComputedStyle(element);
				return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0 &&
					(maximumSeconds(style.animationDuration) > 0.001 || maximumSeconds(style.transitionDuration) > 0.001);
			}).map((element) => element.tagName.toLowerCase() + (element.className ? '.' + String(element.className).trim().replace(/\\s+/g, '.') : '')),
		};

		return out;
	})()`;
}

function assertColumnsSideBySide( rects, count, label ) {
	assert( rects.length >= count, `${ label }: expected ${ count } tracked elements, got ${ rects.length }.` );
	const firstRow = rects.slice( 0, count );
	for ( let index = 1; index < firstRow.length; index++ ) {
		assert(
			Math.abs( firstRow[ index ].top - firstRow[ 0 ].top ) <= 2 &&
				firstRow[ index ].left > firstRow[ index - 1 ].left,
			`${ label }: element ${ index + 1 } is not beside element ${ index } (top ${ firstRow[ index ].top } vs ${ firstRow[ 0 ].top }).`
		);
	}
}

function assertStacked( rects, label ) {
	for ( let index = 1; index < rects.length; index++ ) {
		assert(
			rects[ index ].top >= rects[ index - 1 ].bottom - 1,
			`${ label }: element ${ index + 1 } does not stack below element ${ index }.`
		);
	}
}

function verifyGeometry( result, viewport, expectations ) {
	const width = viewport.width;
	const label = `${ width }px`;
	const isV2 = expectations.version === 'v2';

	assert(
		result.scrollWidth <= result.clientWidth + 1,
		`${ label }: horizontal overflow (client=${ result.clientWidth }, scroll=${ result.scrollWidth }).`
	);

	// Boundary probes skip verifyContent, so the card and capability counts
	// must hold here too before any positional indexing below.
	assert(
		result.cards.length === expectations.projects.length,
		`${ label }: expected ${ expectations.projects.length } project cards, got ${ result.cards.length }.`
	);
	if ( ! isV2 ) {
		assert(
			result.capabilityColumns.length === 3,
			`${ label }: expected three capability units, got ${ result.capabilityColumns.length }.`
		);
	}
	if ( expectations.wcusActionLabels.length > 0 ) {
		assert( result.wcus, `${ label }: missing .hp-about-hero__copy .hp-about-wcus.` );
		assert( ! result.wcus.insideActionRail, `${ label }: .hp-about-wcus is inside hp-action-rail.` );
		assert( result.wcus.actions.length === 1, `${ label }: WCUS callout must expose exactly one action.` );
		assert( result.wcus.actions[ 0 ].text === expectations.wcusActionLabels[ 0 ], `${ label }: WCUS action label or order changed.` );
		assert( result.wcus.actions[ 0 ].rect.height >= 44, `${ label }: WCUS action is shorter than 44px.` );
		assert( result.wcus.actions[ 0 ].textContained, `${ label }: WCUS action label clips instead of wrapping.` );
		assert( result.coreAiEvidenceRows === 4, `${ label }: Core AI evidence renders ${ result.coreAiEvidenceRows } rows; expected 4.` );
	}
	assert( result.reducedMotion.matches, `${ label }: reduced-motion emulation did not apply.` );
	assert( result.reducedMotion.offenders.length === 0, `${ label }: visible motion remains under reduced motion: ${ result.reducedMotion.offenders.slice( 0, 8 ).join( ', ' ) }.` );
	const cardRects = result.cards.map( ( card ) => card.rect );
	const capabilityRects = result.capabilityColumns;
	if ( isV2 ) {
		if ( width >= 640 ) {
			assertColumnsSideBySide( cardRects.slice( 0, 2 ), 2, `${ label } showcase row 1` );
			assertColumnsSideBySide( cardRects.slice( 2, 4 ), 2, `${ label } showcase row 2` );
			assert( cardRects[ 4 ].top >= cardRects[ 2 ].bottom - 1, `${ label }: wide final showcase card does not occupy the last row.` );
			assert( cardRects[ 4 ].width >= cardRects[ 0 ].width * 1.9, `${ label }: wide final showcase card does not span both columns.` );
		} else {
			assertStacked( cardRects, `${ label } showcase grid` );
		}
	} else if ( width >= 896 ) {
		assertColumnsSideBySide( cardRects, 2, `${ label } Selected Work grid` );
		assert(
			cardRects[ 2 ].top >= cardRects[ 0 ].bottom - 1,
			`${ label }: Selected Work is not a two-by-two grid (card 3 shares row 1).`
		);
		assertColumnsSideBySide( capabilityRects, 3, `${ label } capability grid` );
	} else {
		assertStacked( cardRects, `${ label } Selected Work grid` );
		assertStacked( capabilityRects, `${ label } capability grid` );
	}

	assert( result.hero, `${ label }: hero regions missing.` );
	if ( isV2 ) {
		assert( result.signals.length === 3, `${ label }: expected three v2 impact signals, got ${ result.signals.length }.` );
		assert(
			result.hero.copy.left >= result.hero.portrait.right - 1 && result.hero.copy.top < result.hero.portrait.bottom,
			`${ label }: v2 portrait and nameplate must render side by side.`
		);
		if ( width >= 640 ) {
			assertColumnsSideBySide( result.signals, 3, `${ label } impact strip` );
		} else {
			assertStacked( result.signals, `${ label } impact strip` );
		}
	} else if ( width >= 782 ) {
		assert(
			result.hero.portrait.left >= result.hero.copy.right - 1 &&
				result.hero.portrait.top < result.hero.copy.bottom,
			`${ label }: hero copy and portrait must render side by side.`
		);
		assertColumnsSideBySide( result.signals, 3, `${ label } proof signals` );
		assert( result.foundations.length === 2, `${ label }: Skills and Foundations must keep two tracks.` );
		assertColumnsSideBySide( result.foundations, 2, `${ label } foundations tracks` );
	} else {
		assert(
			result.hero.portrait.top >= result.hero.copy.bottom - 1,
			`${ label }: hero must stack into one column.`
		);
		assertStacked( result.signals, `${ label } proof signals` );
		assertStacked( result.foundations, `${ label } foundations tracks` );
	}

	// Exact 2:1 foundations ratio at the two wide primary widths, after the
	// inter-column gap is removed from the available width.
	if ( ! isV2 && ( width === 1440 || width === 1024 ) ) {
		const [ first, second ] = result.foundations;
		const ratio = first.width / second.width;
		assert(
			ratio >= 1.98 && ratio <= 2.02,
			`${ label }: Skills and Foundations track ratio ${ ratio.toFixed( 3 ) } outside 1.98–2.02.`
		);
	}

	// Multi-action rails: horizontal at 601px and above, stacked and
	// rail-filling at 600px and below.
	for ( const rail of result.rails ) {
		if ( rail.links.length < 2 ) {
			continue;
		}
		if ( width >= 601 ) {
			assert(
				Math.abs( rail.links[ 1 ].rect.top - rail.links[ 0 ].rect.top ) <= 2,
				`${ label }: multi-action rail does not lay out horizontally.`
			);
		} else {
			assertStacked( rail.links.map( ( link ) => link.rect ), `${ label } action rail` );
			for ( const link of rail.links ) {
				assert(
					link.rect.width >= rail.rect.width - 12,
					`${ label }: "${ link.text }" does not fill its stacked action rail.`
				);
			}
		}
		// Primary before secondary in visual order at every width.
		assert(
			rail.links[ 0 ].rect.top < rail.links[ 1 ].rect.top + 2 &&
				rail.links[ 0 ].rect.left <= rail.links[ 1 ].rect.left + 2,
			`${ label }: primary action does not precede secondary visually.`
		);
	}

	// Navigation and project-action rows wrap without reordering: left-to-
	// right, top-to-bottom reading order must match DOM order.
	if ( result.nav ) {
		const links = result.nav.links;
		for ( let index = 1; index < links.length; index++ ) {
			const previous = links[ index - 1 ].rect;
			const current = links[ index ].rect;
			assert(
				current.top >= previous.top - 2 &&
					( current.top > previous.bottom - 2 || current.left >= previous.left ),
				`${ label }: page-navigation links reorder when wrapping.`
			);
		}
	}
}

function verifyContent( result, viewport, expectations ) {
	const label = `${ viewport.width }px`;
	const isV2 = expectations.version === 'v2';

	// Heading inventory, order, levels, and section ancestry.
	const actual = result.headings.map( ( heading ) => `${ heading.level }|${ heading.text }|${ heading.section }` );
	const expected = expectations.headings.map( ( heading ) => `${ heading.level }|${ heading.text }|${ heading.section }` );
	assert(
		actual.length === expected.length && expected.every( ( entry, index ) => actual[ index ] === entry ),
		`${ label }: heading inventory mismatch.\nexpected:\n${ expected.join( '\n' ) }\nactual:\n${ actual.join( '\n' ) }`
	);

	// One named navigation with the phase-derived links and unnamed section
	// targets whose first heading is their H2.
	assert( result.navCount === 1, `${ label }: expected one named page navigation, got ${ result.navCount }.` );
	assert( result.nav.labelText === expectations.navLabel, `${ label }: nav label reads "${ result.nav.labelText }".` );
	assert( ! result.nav.labelIsHeading, `${ label }: the nav label must not be a heading.` );
	assert( result.nav.listCount === 1, `${ label }: the nav must contain one list.` );
	assert(
		result.nav.links.length === expectations.navLinks.length,
		`${ label }: the nav must contain ${ expectations.navLinks.length } links.`
	);
	expectations.navLinks.forEach( ( expectedLink, index ) => {
		const link = result.nav.links[ index ];
		assert(
			link.text === expectedLink.text && link.hash === expectedLink.href,
			`${ label }: nav link ${ index + 1 } is "${ link.text }" → ${ link.hash }; expected "${ expectedLink.text }" → ${ expectedLink.href }.`
		);
		assert(
			link.rect.width >= 24 && link.rect.height >= 24,
			`${ label }: nav link "${ link.text }" renders ${ link.rect.width }×${ link.rect.height }; the floor is 24×24.`
		);
	} );
	result.targets.forEach( ( target, index ) => {
		assert( target, `${ label }: fragment target ${ expectations.fragments[ index ] } is missing.` );
		assert( target.tag === 'section', `${ label }: #${ target.id } must be a section, got ${ target.tag }.` );
		assert( ! target.hasAriaLabel, `${ label }: #${ target.id } must not carry aria-label/aria-labelledby.` );
		assert( target.firstHeadingLevel === 2, `${ label }: #${ target.id } must open with its H2.` );
	} );

	// Project cards: order, explicit links, 24px targets, no whole-card
	// anchor, plain-text titles, redundant status words.
	assert(
		result.cards.length === expectations.projects.length,
		`${ label }: expected ${ expectations.projects.length } project cards, got ${ result.cards.length }.`
	);
	expectations.projects.forEach( ( project, index ) => {
		const card = result.cards[ index ];
		assert( card.title === project.title, `${ label }: card ${ index + 1 } is "${ card.title }"; expected "${ project.title }".` );
		assert( ! card.titleHasAnchor, `${ label }: "${ project.title }" title must stay plain text.` );
		assert( ! card.insideAnchor, `${ label }: "${ project.title }" card must not sit inside an anchor.` );
		assert( card.status === project.status, `${ label }: "${ project.title }" status reads "${ card.status }".` );
		assert(
			card.actions.length === project.actions.length,
			`${ label }: "${ project.title }" exposes ${ card.actions.length } actions; expected ${ project.actions.length }.`
		);
		project.actions.forEach( ( expectedAction, actionIndex ) => {
			const action = card.actions[ actionIndex ];
			const renderedHref = stripWpcomCacheVersionFromRenderedHref(
				action.href,
				result.pageUrl
			);
			assert(
				action.text === expectedAction.text && renderedHref === expectedAction.href,
				`${ label }: "${ project.title }" action ${ actionIndex + 1 } is "${ action.text }" → ${ action.href }.`
			);
			assert(
				action.rect.width >= 24 && action.rect.height >= 24,
				`${ label }: action "${ action.text }" renders ${ action.rect.width }×${ action.rect.height }; the floor is 24×24.`
			);
		} );
	} );

	// Foundations DOM order (Skills, then AI Leaders, then Education).
	if ( ! isV2 ) {
		assert(
			( result.foundationsOrder || [] ).join( '|' ) === expectations.foundationsOrder.join( '|' ),
			`${ label }: Skills and Foundations column order is ${ ( result.foundationsOrder || [] ).join( ', ' ) }.`
		);
	}

	// Phase-derived rail count, one closing panel, 44px prominent actions,
	// and primary-before-secondary DOM order.
	const expectedRailLabels = isV2
		? [ expectations.closingActionLabels ]
		: [ expectations.heroActionLabels, expectations.closingActionLabels ];
	assert(
		result.rails.length === expectedRailLabels.length,
		`${ label }: expected ${ expectedRailLabels.length } About action rail(s), got ${ result.rails.length }.`
	);
	assert( result.panelCount === 1, `${ label }: expected one closing panel, got ${ result.panelCount }.` );
	const railLabels = result.rails.map( ( rail ) => rail.links.map( ( link ) => link.text ) );
	expectedRailLabels.forEach( ( expectedLabels, index ) => {
		assert(
			railLabels[ index ].join( '|' ) === expectedLabels.join( '|' ),
			`${ label }: action rail ${ index + 1 } order is [${ railLabels[ index ].join( ', ' ) }].`
		);
	} );
	for ( const rail of result.rails ) {
		for ( const link of rail.links ) {
			assert(
				link.rect.height >= 44,
				`${ label }: prominent action "${ link.text }" is ${ link.rect.height }px high; the floor is 44px.`
			);
		}
	}

	// Portrait and focus indicators.
	assert( result.portraitAlt === expectations.portraitAlt, `${ label }: portrait alt reads "${ result.portraitAlt }".` );
	for ( const focus of result.focus ) {
		assert(
			focus.matchesFocusVisible && focus.outlineStyle !== 'none' && focus.outlineWidth >= 2,
			`${ label }: "${ focus.text }" exposes no visible focus indicator.`
		);
	}
}

async function inspectViewport( cdp, sessionId, url, viewport, expectations ) {
	await cdp.send( 'Emulation.setDeviceMetricsOverride', {
		width: viewport.width,
		height: viewport.height,
		deviceScaleFactor: 1,
		mobile: viewport.mobile,
	}, sessionId );
	await cdp.send( 'Emulation.setEmulatedMedia', {
		media: 'screen',
		features: [ { name: 'prefers-reduced-motion', value: 'reduce' } ],
	}, sessionId );

	const loaded = cdp.once( 'Page.loadEventFired', sessionId );
	await cdp.send( 'Page.navigate', { url }, sessionId );
	await loaded;
	await cdp.send( 'Runtime.evaluate', {
		expression: 'document.fonts && document.fonts.ready',
		awaitPromise: true,
	}, sessionId );
	await wait( 300 );

	// A real keystroke puts the page in keyboard modality so :focus-visible
	// reflects what a keyboard visitor sees.
	await dispatchKey( cdp, sessionId, 'Tab', 'Tab', 9 );

	const evaluated = await cdp.send( 'Runtime.evaluate', {
		expression: buildInspectionExpression( {
			fragments: expectations.fragments,
			countWords: ! viewport.name.startsWith( 'boundary-' ),
			version: expectations.version,
		} ),
		awaitPromise: true,
		returnByValue: true,
	}, sessionId );
	assert( ! evaluated.exceptionDetails, `In-page inspection threw: ${ JSON.stringify( evaluated.exceptionDetails ) }` );
	const result = evaluated.result.value;
	assert( result.violations.length === 0, `${ viewport.width }px: ${ result.violations.join( '; ' ) }` );

	verifyGeometry( result, viewport, expectations );
	if ( ! viewport.name.startsWith( 'boundary-' ) ) {
		verifyContent( result, viewport, expectations );

		assert(
			typeof result.renderedText === 'string' && result.renderedText.trim() !== '',
			`${ viewport.width }px: the page returned no rendered text to count.`
		);
		const wordCount = countRenderedText( result.renderedText );
		assert(
			wordCount === expectations.sourceWordCount,
			`${ viewport.width }px: rendered word count ${ wordCount } does not equal the source count ${ expectations.sourceWordCount }.`
		);
		if ( expectations.version !== 'v2' ) {
			assert(
				wordCount >= ABOUT_WORD_RANGE.min && wordCount <= ABOUT_WORD_RANGE.max,
				`${ viewport.width }px: rendered word count ${ wordCount } outside ${ ABOUT_WORD_RANGE.min }–${ ABOUT_WORD_RANGE.max }.`
			);
		}
	}

	return result;
}

// The non-link hover contract: hovering a card's own surface (its status
// line's empty right side, well away from any link) must not change border,
// background, shadow, transform, or elevation.
async function verifyCardHoverInertia( cdp, sessionId ) {
	const probe = await cdp.send( 'Runtime.evaluate', {
		expression: `(() => {
			const card = document.querySelector('.hp-work-card');
			const impact = card && card.querySelector('.hp-work-card__impact');
			if (!card || !impact) {
				return { error: 'hover probe found no .hp-work-card with an impact paragraph' };
			}
			// Selected Work sits far below the fold, so the card has to be
			// scrolled into view before its rect can name a point the browser
			// will hit-test — CDP dispatches at viewport coordinates.
			card.scrollIntoView({ block: 'center' });
			const style = getComputedStyle(card);
			const snapshot = {
				border: style.borderColor + '|' + style.borderWidth,
				background: style.backgroundColor + '|' + style.backgroundImage,
				shadow: style.boxShadow,
				transform: style.transform,
			};
			const rect = impact.getBoundingClientRect();
			return {
				snapshot,
				x: rect.right - 8,
				y: rect.top + 4,
				viewport: { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight },
			};
		})()`,
		returnByValue: true,
	}, sessionId );
	assert(
		! probe.exceptionDetails,
		`Hover probe setup threw: ${ JSON.stringify( probe.exceptionDetails ) }`
	);
	assert( ! probe.result.value.error, probe.result.value.error );
	const { snapshot, x, y, viewport } = probe.result.value;
	// Fail on the real cause rather than on the hover that could not land.
	assert(
		x >= 0 && y >= 0 && x < viewport.width && y < viewport.height,
		`Hover probe point (${ Math.round( x ) }, ${ Math.round( y ) }) falls outside the ${ viewport.width }x${ viewport.height } viewport.`
	);
	await cdp.send( 'Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, sessionId );
	await wait( 250 );
	const after = await cdp.send( 'Runtime.evaluate', {
		expression: `(() => {
			const card = document.querySelector('.hp-work-card');
			const style = getComputedStyle(card);
			return {
				border: style.borderColor + '|' + style.borderWidth,
				background: style.backgroundColor + '|' + style.backgroundImage,
				shadow: style.boxShadow,
				transform: style.transform,
				hovering: card.matches(':hover'),
			};
		})()`,
		returnByValue: true,
	}, sessionId );
	assert(
		! after.exceptionDetails,
		`Hover probe follow-up threw: ${ JSON.stringify( after.exceptionDetails ) }`
	);
	const state = after.result.value;
	assert( state.hovering, 'Hover probe did not land on the project card.' );
	for ( const property of [ 'border', 'background', 'shadow', 'transform' ] ) {
		assert(
			state[ property ] === snapshot[ property ],
			`Hovering a non-link card area changed ${ property }: ${ snapshot[ property ] } → ${ state[ property ] }.`
		);
	}
	await cdp.send( 'Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 }, sessionId );
}

// Real-keyboard fragment behavior for every jump link: Enter activates the
// link, the final hash matches, router-scroll focuses the section with a
// programmatic-only tabindex, the target clears the sticky header, and the
// next Tab continues logically from the section.
async function verifyKeyboardFragments( cdp, sessionId, navLinks, version = 'proof-first' ) {
	const navSelector = version === 'v2' ? '.hp-about-rail a' : '.hp-about-nav a';
	for ( const [ index, link ] of navLinks.entries() ) {
		const fragment = link.href.slice( 1 );

		await cdp.send( 'Runtime.evaluate', {
			expression: `(() => {
				const links = document.querySelectorAll(${ JSON.stringify( navSelector ) });
				links[${ index }].focus();
				return document.activeElement === links[${ index }];
			})()`,
			returnByValue: true,
		}, sessionId );
		await dispatchKey( cdp, sessionId, 'Enter', 'Enter', 13, '\r' );
		await wait( 600 );

		const landed = await cdp.send( 'Runtime.evaluate', {
			expression: `(() => {
				const target = document.getElementById(${ JSON.stringify( fragment ) });
				const header = document.querySelector('header.wp-block-template-part');
				const active = document.activeElement;
				return {
					hash: window.location.hash,
					focusedId: active ? active.id || null : null,
					isSection: active ? active.tagName.toLowerCase() === 'section' : false,
					tabindex: target ? target.getAttribute('tabindex') : null,
					inTabOrder: target ? target.tabIndex >= 0 : true,
					targetTop: target ? target.getBoundingClientRect().top : null,
					headerFound: !! header,
					headerBottom: header ? header.getBoundingClientRect().bottom : 0,
				};
			})()`,
			returnByValue: true,
		}, sessionId );
		const state = landed.result.value;
		// Without this the clearance check below degrades to `targetTop >= -1`,
		// which no post-scroll layout can violate — a renamed masthead would
		// turn the scroll-margin regression this probe exists to catch green.
		assert(
			state.headerFound,
			`Jump link ${ link.text }: no header.wp-block-template-part to measure sticky clearance against.`
		);
		assert( state.hash === `#${ fragment }`, `Jump link ${ link.text }: hash is ${ state.hash }.` );
		assert(
			state.focusedId === fragment && state.isSection,
			`Jump link ${ link.text }: focus landed on ${ state.focusedId || 'nothing' }, not the section.`
		);
		assert(
			state.tabindex === '-1' && ! state.inTabOrder,
			`Jump link ${ link.text }: target must carry programmatic-only tabindex="-1".`
		);
		assert(
			state.targetTop >= state.headerBottom - 1,
			`Jump link ${ link.text }: target top ${ state.targetTop } sits under the sticky header (bottom ${ state.headerBottom }).`
		);

		await dispatchKey( cdp, sessionId, 'Tab', 'Tab', 9 );
		const continued = await cdp.send( 'Runtime.evaluate', {
			expression: `(() => {
				const section = document.getElementById(${ JSON.stringify( fragment ) });
				const active = document.activeElement;
				if (!active || active === document.body) { return { ok: false, at: 'body' }; }
				const position = section.compareDocumentPosition(active);
				return {
					ok: section.contains(active) || !!(position & Node.DOCUMENT_POSITION_FOLLOWING),
					at: active.textContent.trim().slice(0, 40),
				};
			})()`,
			returnByValue: true,
		}, sessionId );
		assert(
			continued.result.value.ok,
			`Jump link ${ link.text }: Tab does not continue logically (landed at ${ continued.result.value.at }).`
		);
	}
}

async function captureScreenshot( cdp, sessionId, viewport ) {
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
			height: Math.min( 12000, Math.max( viewport.height, Math.ceil( contentSize.height ) ) ),
			scale: 1,
		},
	}, sessionId, 30000 );
	const capturePath = path.join( CAPTURE_DIR, `about-${ viewport.name }.png` );
	await fsPromises.writeFile( capturePath, Buffer.from( capture.data, 'base64' ) );
	return capturePath;
}

async function main() {
	const selectedSource = selectAboutSource( {
		drafts: ARGV.includes( '--drafts' ),
		requireLocal: REQUIRE_LOCAL,
	} );
	const sourceRelative = path.relative( THEME_ROOT, selectedSource ).replace( /\\/g, '/' );
	const sourceHtml = fs.readFileSync( selectedSource, 'utf8' );

	// Preserve the pre-redesign accepted-snapshot compatibility gate. Draft
	// mode never skips: candidate source failures must stay visible in CI.
	if (
		! ARGV.includes( '--drafts' ) &&
		! REQUIRE_LOCAL &&
		! sourceHtml.includes( 'hp-about-nav' ) &&
		! sourceHtml.includes( 'hp-about-resume' )
	) {
		console.log(
			`${ sourceRelative } is still the pre-redesign body; the rendered About contract ` +
			'applies from the promotion onward. Skipping.'
		);
		return;
	}

	const pageCss = fs.readFileSync( path.join( THEME_ROOT, 'assets', 'imladris-pages.css' ), 'utf8' );
	const expectations = verifySourceContracts( sourceHtml, pageCss, sourceRelative );
	if ( SOURCE_ONLY ) {
		return;
	}

	assert(
		process.env.HPERKINS_ORIGIN?.trim(),
		'HPERKINS_ORIGIN must be set explicitly for the rendered About contract.'
	);
	const origin = getOrigin();

	if ( REQUIRE_LOCAL ) {
		assert(
			normalizeSiteUrl( origin ) !== normalizeSiteUrl( PRODUCTION_ORIGIN ),
			'--require-local refuses the default production origin.'
		);
		const { runWp } = require( './lib/wp-cli' );
		assertMatchingSiteUrl( origin, runWp( [ 'option', 'get', 'home' ] ).trim() );
	}

	console.log( `source word count (${ sourceRelative }): ${ expectations.sourceWordCount }` );

	const url = new URL( '/about/', origin ).href;

	await withChrome( async ( cdp ) => {
		const target = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
		const attached = await cdp.send( 'Target.attachToTarget', {
			targetId: target.targetId,
			flatten: true,
		} );
		const sessionId = attached.sessionId;
		await cdp.send( 'Page.enable', {}, sessionId );
		await cdp.send( 'Runtime.enable', {}, sessionId );

		try {
			for ( const viewport of PRIMARY_VIEWPORTS ) {
				await inspectViewport( cdp, sessionId, url, viewport, expectations );
				if ( viewport.canonical ) {
					if ( expectations.version !== 'v2' ) {
						await verifyCardHoverInertia( cdp, sessionId );
					}
					await verifyKeyboardFragments( cdp, sessionId, expectations.navLinks, expectations.version );
					// Re-navigate so keyboard-era state never leaks forward.
					const reloaded = cdp.once( 'Page.loadEventFired', sessionId );
					await cdp.send( 'Page.navigate', { url }, sessionId );
					await reloaded;
				}
				const capturePath = await captureScreenshot( cdp, sessionId, viewport );
				console.log( `checked /about/ at ${ viewport.width }px → ${ capturePath }` );
			}

			for ( const viewport of BOUNDARY_VIEWPORTS ) {
				await inspectViewport( cdp, sessionId, url, viewport, expectations );
				console.log( `checked /about/ boundary at ${ viewport.width }px` );
			}
		} finally {
			await cdp.send( 'Target.closeTarget', { targetId: target.targetId } );
		}
	} );

	console.log( `About rendered contract verified at ${ origin }. Screenshots: ${ CAPTURE_DIR }` );
}

if ( require.main === module ) {
	main().catch( ( error ) => {
		console.error( error.message );
		process.exit( 1 );
	} );
}

module.exports = { deriveRenderedExpectations, verifyCardHoverInertia };
