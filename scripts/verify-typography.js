#!/usr/bin/env node
const { spawn } = require( 'node:child_process' );
const fs = require( 'node:fs/promises' );
const os = require( 'node:os' );
const path = require( 'node:path' );

const { getOrigin } = require( './lib/site-url' );

const CHROME = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const ORIGIN = getOrigin();
const THEME_PATH = path.join( __dirname, '..' );
const SOURCE_ONLY = process.argv.includes( '--source-only' );
const REPORT = process.argv.includes( '--report' );

const PROBE_404 = '/hp-typography-404-probe/';
const PAGES = [
	'/',
	'/about/',
	'/essays/',
	'/work/',
	'/ai-enablement/',
	'/job-placement-digest/',
	'/how-this-was-built/',
	'/contact/',
	'/privacy-policy/',
	'/?s=AI',
	PROBE_404,
];
const FULL_VIEWPORTS = [
	{ width: 1440, height: 1000 },
	{ width: 390, height: 844 },
];
const OVERFLOW_VIEWPORTS = [
	{ width: 320, height: 900 },
	{ width: 768, height: 1000 },
];

let totalViolations = 0;

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

async function withChrome( callback ) {
	const userDataDir = await fs.mkdtemp( path.join( os.tmpdir(), 'hp-typography-' ) );
	const args = [
		'--headless=new',
		'--disable-gpu',
		'--no-sandbox',
		'--remote-debugging-port=0',
		`--user-data-dir=${ userDataDir }`,
	];
	// Sandboxed CI sessions route HTTPS through an egress proxy that Chrome only
	// honors via an explicit flag. That relay resets Chrome's TLS 1.3 ClientHello
	// (curl's smaller hello passes), so cap the version at 1.2 — certificate
	// verification stays fully enabled; never --ignore-certificate-errors.
	if ( process.env.HTTPS_PROXY ) {
		args.push( `--proxy-server=${ process.env.HTTPS_PROXY }`, '--ssl-version-max=tls1.2' );
	}
	args.push( 'about:blank' );
	const chrome = spawn( CHROME, args, { stdio: [ 'ignore', 'ignore', 'pipe' ] } );

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

// In --report mode print every violation and keep going; otherwise assert-empty.
function handleViolations( label, violations ) {
	totalViolations += violations.length;
	if ( REPORT ) {
		for ( const violation of violations ) {
			console.log( `REPORT ${ label }: ${ violation }` );
		}
		return;
	}
	assert(
		violations.length === 0,
		`${ label }: ${ violations.length } violation(s):\n- ${ violations.join( '\n- ' ) }`
	);
}

async function verifyStaticContract() {
	const violations = [];

	let themeJson = null;
	try {
		themeJson = JSON.parse( await fs.readFile( path.join( THEME_PATH, 'theme.json' ), 'utf8' ) );
	} catch ( error ) {
		violations.push( `theme.json could not be parsed: ${ error.message }` );
	}
	if ( themeJson ) {
		const fontSizes = ( ( ( themeJson.settings || {} ).typography || {} ).fontSizes ) || [];
		const bySlug = new Map( fontSizes.map( ( entry ) => [ entry.slug, entry.size ] ) );
		for ( const slug of [ '2xl', '3xl', '4xl', '5xl' ] ) {
			const size = bySlug.get( slug );
			if ( typeof size !== 'string' || ! size.startsWith( 'clamp(' ) ) {
				violations.push( `theme.json fontSizes ${ slug } must be a fluid clamp() size; found ${ JSON.stringify( size ) }.` );
			}
		}
		const pinned = { md: '1.1875rem', base: '1.0625rem' };
		for ( const slug of Object.keys( pinned ) ) {
			if ( bySlug.get( slug ) !== pinned[ slug ] ) {
				violations.push( `theme.json fontSizes ${ slug } must stay ${ pinned[ slug ] }; found ${ JSON.stringify( bySlug.get( slug ) ) }.` );
			}
		}
	}

	const css = await fs.readFile( path.join( THEME_PATH, 'style.css' ), 'utf8' );
	if ( ! css.includes( '--wp--custom--measure--prose' ) ) {
		violations.push( 'style.css must reference --wp--custom--measure--prose (the 68ch prose measure).' );
	}
	if ( ! /\.hp-site-header \.wp-block-navigation\s*\{[^}]*var\(--wp--preset--font-size--sm\)/.test( css ) ) {
		violations.push( 'style.css desktop nav rule .hp-site-header .wp-block-navigation must set var(--wp--preset--font-size--sm).' );
	}

	return violations;
}

// One self-contained in-page battery. No backticks and no dollar-brace inside
// the page code — the only interpolation is the OPTS literal injected below.
function buildExpression( opts ) {
	return `(() => {
		const OPTS = ${ JSON.stringify( opts ) };
		const out = {
			violations: { overflow: [] },
			counts: { textElements: 0, headings: 0 },
			scrollWidth: document.documentElement.scrollWidth,
			innerWidth: window.innerWidth,
			is404: /404/.test(document.title || '') || document.body.classList.contains('error404'),
		};
		if (out.scrollWidth > out.innerWidth + 1) {
			out.violations.overflow.push('document scrollWidth ' + out.scrollWidth + 'px exceeds viewport ' + out.innerWidth + 'px');
		}
		if (!OPTS.fullBattery) {
			return out;
		}

		const ALLOWED = ['hperkins eb garamond', 'hperkins cormorant garamond', 'hperkins marcellus', 'hperkins jetbrains mono'];
		const EXEMPT = 'input, textarea, select, button[type], .wp-block-search, [class*="jetpack"]';
		const truncate = (text, max) => {
			const clean = (text || '').replace(/\\s+/g, ' ').trim();
			return clean.length > max ? clean.slice(0, max) + '…' : clean;
		};
		const describe = (el) => {
			const cls = (typeof el.className === 'string' && el.className.trim())
				? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.')
				: '';
			return el.tagName.toLowerCase() + cls;
		};
		const isVisible = (el) => {
			if (!el.getClientRects || el.getClientRects().length === 0) return false;
			if (getComputedStyle(el).visibility === 'hidden') return false;
			if (el.closest('[aria-hidden="true"]')) return false;
			return true;
		};
		const firstFamily = (style) => (style.fontFamily.split(',')[0] || '').trim().replace(/^["']+|["']+$/g, '').toLowerCase();
		const hasDirectText = (el) => {
			for (const node of el.childNodes) {
				if (node.nodeType === 3 && node.nodeValue.replace(/\\s+/g, '').length >= 3) return true;
			}
			return false;
		};
		const ariaHiddenNearby = (el) => {
			let node = el;
			for (let depth = 0; node && depth <= 3; depth++) {
				if (node.getAttribute && node.getAttribute('aria-hidden') === 'true') return true;
				node = node.parentElement;
			}
			return false;
		};

		// a. exactly one visible h1.
		const h1Violations = [];
		const h1All = Array.from(document.querySelectorAll('h1')).filter(isVisible);
		if (h1All.length !== 1) {
			h1Violations.push('expected exactly one visible h1, found ' + h1All.length +
				(h1All.length ? ': ' + h1All.map((el) => '"' + truncate(el.textContent, 40) + '"').join(', ') : ''));
		}
		out.violations.h1 = h1Violations;

		// b. no heading-level skips in document order.
		const headingViolations = [];
		const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).filter(isVisible);
		out.counts.headings = headings.length;
		for (let index = 1; index < headings.length; index++) {
			const prev = Number.parseInt(headings[index - 1].tagName.slice(1), 10);
			const next = Number.parseInt(headings[index].tagName.slice(1), 10);
			if (next > prev + 1) {
				headingViolations.push('h' + prev + ' "' + truncate(headings[index - 1].textContent, 40) +
					'" skips to h' + next + ' "' + truncate(headings[index].textContent, 40) + '"');
			}
		}
		out.violations.headings = headingViolations;

		// c. the four theme faces must actually be loaded.
		const fontsLoadedViolations = [];
		const faces = ['19px "HPerkins EB Garamond"', '19px "HPerkins Cormorant Garamond"', '16px "HPerkins Marcellus"', '13px "HPerkins JetBrains Mono"'];
		for (const face of faces) {
			let ok = false;
			try { ok = !!(document.fonts && document.fonts.check(face)); } catch (error) { ok = false; }
			if (!ok) fontsLoadedViolations.push('document.fonts.check failed for ' + face);
		}
		out.violations.fontsLoaded = fontsLoadedViolations;

		// d/e/f. one pass over every visible element with direct text.
		const familyViolations = [];
		const floorViolations = [];
		const marcellusViolations = [];
		const textElements = [];
		for (const el of document.body.querySelectorAll('*')) {
			const tag = el.tagName;
			if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEMPLATE') continue;
			if (!hasDirectText(el) || !isVisible(el)) continue;
			const style = getComputedStyle(el);
			const family = firstFamily(style);
			const fontSize = Number.parseFloat(style.fontSize) || 0;
			const fontWeight = Number.parseFloat(style.fontWeight) || 400;
			textElements.push({ el, style, family, fontSize, fontWeight });

			if (ALLOWED.indexOf(family) === -1 && !el.closest(EXEMPT)) {
				if (familyViolations.length < 10) {
					familyViolations.push(describe(el) + ' "' + truncate(el.textContent, 30) + '" → ' + family);
				}
			}
			if (fontSize < 12 && !ariaHiddenNearby(el)) {
				floorViolations.push(describe(el) + ' "' + truncate(el.textContent, 30) + '" is ' + fontSize + 'px; expected >= 12px');
			}
			if ((tag === 'P' || tag === 'LI') && el.textContent.replace(/\\s+/g, ' ').trim().length >= 140 && fontSize < 15) {
				floorViolations.push('long copy ' + describe(el) + ' "' + truncate(el.textContent, 40) + '" is ' + fontSize + 'px; expected >= 15px');
			}
			if (family === 'hperkins marcellus' && fontWeight >= 600) {
				marcellusViolations.push(describe(el) + ' "' + truncate(el.textContent, 40) + '" renders Marcellus at weight ' + fontWeight + ' (400-only face; synthetic bold banned)');
			}
		}
		out.counts.textElements = textElements.length;
		out.violations.families = familyViolations;
		out.violations.floor = floorViolations;
		out.violations.marcellus = marcellusViolations;

		// g. prose measure (desktop viewport only).
		const proseViolations = [];
		if (OPTS.proseMeasure) {
			for (const p of document.querySelectorAll('.hp-prose p, .wp-block-post-content p')) {
				if (!isVisible(p)) continue;
				if (p.textContent.replace(/\\s+/g, ' ').trim().length < 140) continue;
				const style = getComputedStyle(p);
				const probe = document.createElement('span');
				probe.textContent = '0'.repeat(10);
				probe.style.position = 'absolute';
				probe.style.visibility = 'hidden';
				probe.style.whiteSpace = 'nowrap';
				probe.style.fontFamily = style.fontFamily;
				probe.style.fontSize = style.fontSize;
				probe.style.fontWeight = style.fontWeight;
				probe.style.fontStyle = style.fontStyle;
				probe.style.letterSpacing = style.letterSpacing;
				document.body.appendChild(probe);
				const chWidth = probe.getBoundingClientRect().width / 10;
				probe.remove();
				if (chWidth <= 0) continue;
				const measure = p.getBoundingClientRect().width / chWidth;
				if (measure > 72) {
					proseViolations.push(describe(p) + ' "' + truncate(p.textContent, 40) + '" measures ' + Math.round(measure) + 'ch; expected <= 72ch');
				}
			}
		}
		out.violations.prose = proseViolations;

		// i. SVG text effective size after transforms.
		const svgViolations = [];
		for (const el of document.querySelectorAll('svg text, svg tspan')) {
			if ((el.textContent || '').trim().length < 2) continue;
			if (el.closest('[aria-hidden="true"]')) continue;
			let scale = 1;
			try {
				const m = el.getScreenCTM();
				scale = m ? Math.hypot(m.a, m.b) : 1;
			} catch (error) { scale = 1; }
			const effective = (Number.parseFloat(getComputedStyle(el).fontSize) || 0) * scale;
			if (effective > 0 && effective < 12) {
				svgViolations.push('svg ' + el.tagName.toLowerCase() + ' "' + truncate(el.textContent, 30) + '" renders at ' + (Math.round(effective * 10) / 10) + 'px effective; expected >= 12px');
			}
		}
		out.violations.svg = svgViolations;

		// j. bounded WCAG contrast spot check on solid backgrounds.
		const contrastViolations = [];
		const parseColor = (value) => {
			const match = /rgba?\\(([^)]+)\\)/.exec(value || '');
			if (!match) return null;
			const parts = match[1].split(',').map((part) => Number.parseFloat(part));
			if (parts.some((part) => Number.isNaN(part))) return null;
			return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
		};
		const luminance = (color) => {
			const channel = (value) => {
				const s = value / 255;
				return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
			};
			return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
		};
		for (const item of textElements) {
			if (item.fontSize >= 24) continue;
			if (item.el.closest('.wp-block-cover')) continue;
			const fg = parseColor(item.style.color);
			if (!fg || fg.a < 1) continue;
			let node = item.el;
			let bg = null;
			let skip = false;
			while (node) {
				const style = node === item.el ? item.style : getComputedStyle(node);
				if (style.backgroundImage && style.backgroundImage !== 'none') { skip = true; break; }
				const parsed = parseColor(style.backgroundColor);
				if (parsed && parsed.a > 0) {
					if (parsed.a < 1) skip = true;
					bg = parsed;
					break;
				}
				node = node.parentElement;
			}
			if (skip || !bg) continue;
			const lighter = Math.max(luminance(fg), luminance(bg));
			const darker = Math.min(luminance(fg), luminance(bg));
			const ratio = (lighter + 0.05) / (darker + 0.05);
			const needed = (item.fontWeight < 600 && item.fontSize < 18.66) ? 4.5 : 3;
			if (ratio < needed && contrastViolations.length < 10) {
				contrastViolations.push(describe(item.el) + ' "' + truncate(item.el.textContent, 30) + '" ' + item.style.color +
					' vs rgb(' + bg.r + ', ' + bg.g + ', ' + bg.b + ') = ' + (Math.round(ratio * 100) / 100) + ' (needs ' + needed + ')');
			}
		}
		out.violations.contrast = contrastViolations;

		return out;
	})()`;
}

async function inspectPage( cdp, pagePath, viewport, opts ) {
	const target = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
	try {
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

		const loaded = cdp.once( 'Page.loadEventFired', sessionId, 30000 );
		await cdp.send( 'Page.navigate', { url: new URL( pagePath, ORIGIN ).href }, sessionId );
		await loaded;
		await cdp.send( 'Runtime.evaluate', { expression: 'document.fonts && document.fonts.ready', awaitPromise: true }, sessionId );
		await wait( 250 );

		const evaluated = await cdp.send( 'Runtime.evaluate', {
			expression: buildExpression( opts ),
			awaitPromise: true,
			returnByValue: true,
		}, sessionId );
		if ( evaluated.exceptionDetails ) {
			const detail = ( evaluated.exceptionDetails.exception || {} ).description || evaluated.exceptionDetails.text || 'unknown error';
			throw new Error( `In-page battery threw on ${ pagePath } at ${ viewport.width }px: ${ detail }` );
		}
		return evaluated.result.value;
	} finally {
		await cdp.send( 'Target.closeTarget', { targetId: target.targetId } );
	}
}

const BATTERY_ORDER = [
	[ 'h1', 'h1' ],
	[ 'headings', 'heading order' ],
	[ 'fontsLoaded', 'fonts loaded' ],
	[ 'families', 'font-family allowlist' ],
	[ 'floor', 'text size floor' ],
	[ 'marcellus', 'marcellus weight' ],
	[ 'prose', 'prose measure' ],
	[ 'overflow', 'overflow' ],
	[ 'svg', 'svg text size' ],
	[ 'contrast', 'contrast' ],
];

async function main() {
	const staticViolations = await verifyStaticContract();
	handleViolations( 'static contract', staticViolations );
	if ( staticViolations.length === 0 ) {
		console.log( 'checked static source contract: fluid heading clamps, pinned md/base sizes, prose measure, sm nav font-size' );
	}
	if ( SOURCE_ONLY ) {
		return;
	}

	await withChrome( async ( cdp ) => {
		for ( const pagePath of PAGES ) {
			for ( const viewport of FULL_VIEWPORTS ) {
				const result = await inspectPage( cdp, pagePath, viewport, {
					fullBattery: true,
					proseMeasure: viewport.width === 1440,
				} );
				if ( pagePath === PROBE_404 && viewport === FULL_VIEWPORTS[0] && ! result.is404 ) {
					console.log( `warning: ${ pagePath } did not present as a 404 (title/body class); typography battery still applies.` );
				}
				for ( const [ key, name ] of BATTERY_ORDER ) {
					handleViolations( `${ pagePath } @${ viewport.width }px ${ name }`, result.violations[ key ] || [] );
				}
				console.log(
					`checked ${ pagePath } at ${ viewport.width }px: ${ result.counts.textElements } text elements, ${ result.counts.headings } headings, scrollWidth=${ result.scrollWidth }`
				);
			}
			for ( const viewport of OVERFLOW_VIEWPORTS ) {
				const result = await inspectPage( cdp, pagePath, viewport, { fullBattery: false } );
				handleViolations( `${ pagePath } @${ viewport.width }px overflow`, result.violations.overflow );
				console.log( `checked ${ pagePath } at ${ viewport.width }px: overflow only, scrollWidth=${ result.scrollWidth }` );
			}
		}
	} );

	if ( REPORT ) {
		console.log( `report complete: ${ totalViolations } violation(s) across static contract + ${ PAGES.length } pages` );
	}
}

main().catch( ( error ) => {
	console.error( error.message );
	process.exit( 1 );
} );
