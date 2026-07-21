#!/usr/bin/env node

const { spawn } = require( 'node:child_process' );
const fs = require( 'node:fs' );
const fsPromises = require( 'node:fs/promises' );
const os = require( 'node:os' );
const path = require( 'node:path' );

const { getOrigin } = require( './lib/site-url' );

const ROOT = path.join( __dirname, '..' );
const ORIGIN = getOrigin();
const SOURCE_ONLY = process.argv.includes( '--source-only' );

const VIEWPORTS = [
	{ name: 'desktop-1440', width: 1440, height: 1000 },
	{ name: 'desktop-1280', width: 1280, height: 900 },
	{ name: 'desktop-1024', width: 1024, height: 900 },
	{ name: 'desktop-960', width: 960, height: 900 },
	{ name: 'desktop-edge', width: 782, height: 900 },
	{ name: 'mobile-edge', width: 781, height: 900 },
	{ name: 'mobile-390', width: 390, height: 844 },
	{ name: 'mobile-320', width: 320, height: 800 },
];

const WORK_LABELS = [
	'Flavor Agent',
	'WordPress AI Stack Contributions',
	'AI Provider for Codex',
	'DJ Lee & Voices of Judah',
];
// Status is a semantic colour PLUS a redundant word — never colour alone. These
// are the words, and they must stay in the link's accessible name.
const WORK_STATUSES = [
	'Release candidate · v0.1.0-rc.1',
	'Merged · upstream',
	'Shipped · v2.1',
	'Delivered · live site',
];
const WRITING_LABELS = [ 'AI Enablement', 'Essays', 'Job Placement Digest' ];
// Four Council values sit below the site-wide 12px type floor by deliberate,
// documented exemption (see CLAUDE.md). They are pinned here so the exemption
// stays a decision rather than drift.
const SUB_FLOOR_TYPE = {
	'.hp-council-work-row__status': 9,
	'.hp-council-work-panel__eyebrow': 9,
	'.hp-council-drawer__legend': 10,
	'.hp-council-digest-cue': 8,
};
const DRAWER_LABELS = [
	'Work',
	'Essays',
	'AI Enablement',
	'About',
	'Job Placement Digest',
	'Search the journal',
	'Subscribe',
];

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function approximately( value, expected, tolerance = 1 ) {
	return Math.abs( value - expected ) <= tolerance;
}

function maximumDurationSeconds( value ) {
	return Math.max( ...value.split( ',' ).map( ( part ) => {
		const duration = Number.parseFloat( part ) || 0;
		return part.trim().endsWith( 'ms' ) ? duration / 1000 : duration;
	} ) );
}

function read( file ) {
	// Normalise line endings: git's autocrlf checks these files out as CRLF on
	// Windows, which would otherwise fail every assertion spanning a newline.
	return fs.readFileSync( path.join( ROOT, file ), 'utf8' ).replace( /\r\n/g, '\n' );
}

function exists( file ) {
	return fs.existsSync( path.join( ROOT, file ) );
}

function assertIncludes( file, needles ) {
	const value = read( file );
	for ( const needle of needles ) {
		assert( value.includes( needle ), `${ file } is missing: ${ needle }` );
	}
}

function assertNotIncludes( file, needles ) {
	const value = read( file );
	for ( const needle of needles ) {
		assert( ! value.includes( needle ), `${ file } still contains retired source: ${ needle }` );
	}
}

function verifySource() {
	assertIncludes( 'parts/header.html', [ '[hperkins_council_header]' ] );
	assertIncludes( 'inc/council-header.php', [
		'hperkins_tokens_get_council_navigation_model',
		'hperkins_tokens_get_council_work_items',
		'hperkins_tokens_render_council_header',
		'data-hp-header-root',
		'data-hp-header-trigger="work"',
		'data-hp-header-panel="work"',
		'data-hp-header-hover="work"',
		'data-hp-header-trigger="writing"',
		"aria-label=\"<?php echo esc_attr( $model['writing']['label'] ); ?>\"",
		'data-hp-header-panel="writing"',
		'data-hp-header-hover="writing"',
		'data-hp-header-trigger="search"',
		'data-hp-header-panel="search"',
		'data-hp-header-trigger="drawer"',
		'data-hp-header-panel="drawer"',
		"'label'  => 'Flavor Agent'",
		"'url'    => '/work/flavor-agent/'",
		"'status' => 'Release candidate · v0.1.0-rc.1'",
		"'label'  => 'WordPress AI Stack Contributions'",
		"'url'    => '/work/upstream-core-ai-stack/'",
		"'status' => 'Merged · upstream'",
		"'label'  => 'AI Provider for Codex'",
		"'url'    => '/work/ai-provider-for-codex/'",
		"'status' => 'Shipped · v2.1'",
		"'label'  => 'DJ Lee & Voices of Judah'",
		"'url'    => '/work/dj-lee-voices-of-judah/'",
		"'status' => 'Delivered · live site'",
		"'state'  => 'review'",
		"'state'  => 'done'",
		'is-state-review',
		'is-state-done',
		"preg_replace( '/>\\s+</', '><', $html )",
		'null === $compact_html ? $html : $compact_html',
		'hperkins_tokens_pre_render_council_header_block',
		'if ( null !== $pre_render )',
		"'core/shortcode' !== $parsed_block['blockName']",
		"'[hperkins_council_header]' === $inner_html",
		"0 === strpos( $inner_html, '<div class=\"hp-council-header alignwide\" data-hp-header-root' )",
		"1 === substr_count( $inner_html, 'data-hp-header-root' )",
		"add_filter( 'pre_render_block', 'hperkins_tokens_pre_render_council_header_block', 10, 2 );",
		// Current-page indication: the retired core Navigation block emitted this
		// for free, so the renderer has to say where the visitor is.
		'function hperkins_tokens_council_current_path()',
		'function hperkins_tokens_council_current_attr( $url, $current_path )',
		'function hperkins_tokens_council_in_section( $url, $current_path )',
		' aria-current="page"',
		'aria-labelledby="hp-council-drawer-legend"',
		'id="hp-council-drawer-legend"',
		// A protocol-relative value names a host and must reach the host compare.
		"if ( 0 === strpos( $value, '/' ) && 0 !== strpos( $value, '//' ) )",
		// The no-JS fallback is a documented contract, not decoration.
		'<noscript>',
		'class="hp-council-noscript"',
		"'source'    => 'fallback',",
		"'source'    => 'navigation',",
		'data-hp-header-source="<?php echo esc_attr( $model[\'source\'] ); ?>"',
	] );
	const renderer = read( 'inc/council-header.php' );
	// The already-rendered branch is a recognition signal only. Echoing stored
	// markup back would freeze the site name, the menu-237 model, and every URL,
	// and no edit to the renderer would reach the page.
	assert(
		! /return \$is_rendered_header \? \$inner_html/.test( renderer ),
		'pre_render_block must re-render in both branches, never echo stored header markup.'
	);
	// Ten destinations carry aria-current: the three desktop nav links, the three
	// Writing panel links, and the four drawer rows.
	assert(
		( renderer.match( /hperkins_tokens_council_current_attr\(/g ) || [] ).length === 11,
		'Every Council destination must carry an aria-current attribute (1 definition + 10 call sites).'
	);
	// The noscript nav is the whole navigation when the controller never runs.
	// Every route the drawer reaches has to be reachable there too, plus Contact,
	// which is a labelled footer route with no drawer row.
	const noscript = renderer.slice( renderer.indexOf( '<noscript>' ), renderer.indexOf( '</noscript>' ) );
	assert( noscript.length > 0, 'inc/council-header.php is missing its <noscript> navigation.' );
	assert(
		( noscript.match( /<a href=/g ) || [] ).length === 7,
		`The noscript nav exposes ${ ( noscript.match( /<a href=/g ) || [] ).length } routes; expected 7.`
	);
	for ( const route of [ 'work', 'essays', 'ai', 'about', 'digest', 'subscribe' ] ) {
		assert(
			noscript.includes( `$${ route }['url']` ) || noscript.includes( `$model['${ route }']['url']` ),
			`The noscript nav does not reach ${ route }.`
		);
	}
	assert(
		noscript.includes( "home_url( '/contact/' )" ),
		'The noscript nav does not reach Contact.'
	);
	assertIncludes( 'style.css', [
		'--hp-header-h: 68px;',
		'--hp-header-h-compact: 62px;',
		'--hp-nav-gap: 28px;',
		'--hp-nav-label: var(--wp--preset--font-size--sm);',
		'.hp-council-nav {\n\tposition: relative;',
		'.hp-council-work-panel',
		'.hp-council-writing-panel',
		'.hp-council-search-panel',
		'.hp-council-drawer',
		'.hp-council-header [data-hp-header-panel][hidden]',
		'@keyframes hp-council-drawer-collapse',
		'.hp-council-header.is-hp-closing .hp-council-drawer:not([hidden])',
		'.hp-council-drawer a.is-hp-chosen',
	] );
	assertNotIncludes( 'inc/council-header.php', [ 'aria-haspopup=' ] );
	assertNotIncludes( 'style.css', [
		'.hp-council-nav__item {\n\tposition: relative;',
		'.hp-site-header__inner',
		'.hp-site-brand',
		'.hp-site-nav',
		'.hp-site-actions',
		'.hp-site-search',
		'.hp-site-subscribe',
		'.wp-block-navigation__responsive-container',
	] );
	assertIncludes( 'parts/footer.html', [ '<a href="/contact/">Contact</a>' ] );
	assertIncludes( 'theme.json', [ '"slug": "gold-800"', '"color": "#6E531B"' ] );

	assert( exists( 'assets/js/header-controller.js' ), 'assets/js/header-controller.js is missing.' );
	assertIncludes( 'assets/js/header-controller.js', [
		"var REGISTRY = '__hpCouncilHeaderController';",
		"if ( existing && typeof existing.settle === 'function' )",
		'registry.settle = settle;',
		"var STATES = [ 'closed', 'work', 'writing', 'search', 'drawer' ];",
		"node.setAttribute( 'data-hp-header-state', next );",
		'applyState( \'closed\', { restoreFocus: inside } );',
		"window.matchMedia( '(min-width: 782px)' )",
		"wrapHistory( 'pushState' );",
		"wrapHistory( 'replaceState' );",
		"window.addEventListener( 'popstate', settle );",
		"window.addEventListener( 'pageshow', settle );",
		"node.classList.add( 'is-hp-closing' );",
		"drawerLink.classList.add( 'is-hp-chosen' );",
		'event.defaultPrevented ||',
		'event.button !== 0 ||',
		'event.metaKey ||',
		'event.ctrlKey ||',
		'event.shiftKey ||',
		'event.altKey ||',
		"drawerLink.target === '_blank' ||",
		"drawerLink.hasAttribute( 'download' )",
		'var input = searchPanel',
		"var first = panel ? panel.querySelector( 'a[href]' ) : null;",
		'! node.contains( trigger )',
		'! node.contains( group )',
	] );
	const controller = read( 'assets/js/header-controller.js' );
	assert(
		( controller.match( /\.hidden\s*=/g ) || [] ).length === 1,
		'header-controller.js must assign panel.hidden only inside applyState().'
	);
	assert(
		( controller.match( /setAttribute\( 'aria-expanded'/g ) || [] ).length === 1,
		'header-controller.js must assign aria-expanded only inside applyState().'
	);
	// Every path that opens a panel, and every route settlement, must cancel a
	// pending hover close — toggle(), the ArrowDown branch, settle(), and
	// pointerover itself. A survivor shuts the panel the visitor just opened.
	assert(
		( controller.match( /window\.clearTimeout\( hoverTimer \);/g ) || [] ).length === 4,
		'header-controller.js must clear hoverTimer in toggle(), the ArrowDown branch, settle(), and pointerover.'
	);
	// applyState() returns early when the router has detached the header, so
	// settle() has to reset the closure itself or a stale state reads the next
	// trigger click as a close.
	assert(
		/function settle\(\) \{[^]*?state = 'closed';[^]*?origin = null;[^]*?\}/.test( controller ),
		'settle() must reset state and origin unconditionally, not only via applyState().'
	);
	// Focus ownership: a hover-opened panel records an origin the visitor never
	// focused, so Escape must not restore to it, and a drifting pointer must not
	// close a panel the visitor has tabbed into.
	assert(
		! /restoreFocus:\s*true/.test( controller ),
		'header-controller.js must not restore focus unconditionally — a hover-only open would steal it.'
	);
	assert(
		/if \( state === next && ! focusIsInside\(\) \)/.test( controller ),
		'The hover close must not fire while focus is inside the header.'
	);
	assert(
		/if \( ! focusIsInside\(\) \) \{\s*origin = triggerFor\( next \);/.test( controller ),
		'pointerover must not overwrite an origin established by the keyboard.'
	);
	assert(
		/var stranded = ! active \|\| active === document\.body \|\| drawerLink === active;/.test( controller ),
		'The drawer close must rescue focus only when it was stranded, so it cannot steal a router-scroll hash target.'
	);
	// Tabbing past an open panel closes it, the way a disclosure does.
	assert(
		/document\.addEventListener\( 'focusin'/.test( controller ),
		'header-controller.js must close an open panel when focus leaves it.'
	);
	assertIncludes( 'functions.php', [
		"$header_controller_rel  = '/assets/js/header-controller.js';",
		"'hperkins-header-controller'",
		'filemtime( $header_controller_file )',
	] );
	assertNotIncludes( 'functions.php', [
		'nav-close-delight.js',
		'hperkins-nav-close-delight',
		'header-search.js',
		'hperkins-header-search',
	] );
	assert( ! exists( 'assets/js/header-search.js' ), 'assets/js/header-search.js must be removed.' );
	assert( ! exists( 'assets/js/nav-close-delight.js' ), 'assets/js/nav-close-delight.js must be removed.' );
	assertIncludes( 'scripts/verify-header.js', [
		'history.back();',
		"verifyHoverCorridor( cdp, sessionId, 'work' );",
		"verifyHoverCorridor( cdp, sessionId, 'writing' );",
		"type: 'mousePressed', x: 10, y: 300",
		'fs.statSync( candidate ).isFile()',
		"fsPromises.mkdtemp( path.join( captureRoot, 'hperkins-header-' ) )",
	] );
	console.log( 'verified Council header source contract' );
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

async function dispatchMouseClick( cdp, sessionId, x, y, options = {} ) {
	const button = options.button || 'left';
	const buttons = { left: 1, right: 2, middle: 4 }[ button ] || 0;
	const modifiers = options.modifiers || 0;
	await cdp.send( 'Input.dispatchMouseEvent', {
		type: 'mouseMoved', x, y, button: 'none', buttons: 0, modifiers, pointerType: 'mouse',
	}, sessionId );
	await cdp.send( 'Input.dispatchMouseEvent', {
		type: 'mousePressed', x, y, button, buttons, modifiers, clickCount: 1, pointerType: 'mouse',
	}, sessionId );
	await cdp.send( 'Input.dispatchMouseEvent', {
		type: 'mouseReleased', x, y, button, buttons: 0, modifiers, clickCount: 1, pointerType: 'mouse',
	}, sessionId );
	await wait( 30 );
}

// Panels drop in over 160ms from translateY(-6px). Measuring geometry inside
// that window reads a position the visitor never settles on — and reads a
// different one on every run. Let the element's own animations finish first.
async function waitForAnimations( cdp, sessionId, selector ) {
	await evaluate( cdp, sessionId, `(() => {
		const target = document.querySelector(${ JSON.stringify( selector ) });
		if (!target || !target.getAnimations) return Promise.resolve();
		return Promise.all(target.getAnimations().map((animation) => animation.finished.catch(() => {})));
	})()` );
}

async function waitForPageCondition( cdp, sessionId, expression, label, timeout = 5000 ) {
	const started = Date.now();
	while ( Date.now() - started < timeout ) {
		if ( await evaluate( cdp, sessionId, expression ) ) {
			return;
		}
		await wait( 50 );
	}
	throw new Error( `Timed out waiting for ${ label }.` );
}

async function assertFocusVisible( cdp, sessionId, selector, label ) {
	const focus = await evaluate( cdp, sessionId, `(() => {
		const target = document.querySelector(${ JSON.stringify( selector ) });
		if (!target) return null;
		const describe = (node) => node
			? node.tagName.toLowerCase() + (node.className && typeof node.className === 'string' ? '.' + node.className.trim().split(/\\s+/).join('.') : '')
			: 'none';
		const before = describe(document.activeElement);
		target.focus();
		const style = getComputedStyle(target);
		const width = parseFloat(style.outlineWidth) || 0;
		const offset = parseFloat(style.outlineOffset) || 0;
		// A ring can be fully specified and still never reach the screen: an
		// ancestor that clips (overflow other than visible) cuts off whichever
		// sides fall outside its box. Inflate the target by the ring's reach and
		// compare against every clipping ancestor.
		const rect = target.getBoundingClientRect();
		// The ring's outer edge sits offset+width from the border box. A negative
		// offset draws it inside, so it cannot be clipped however tight the
		// ancestor is — clamp at 0 rather than treating the width as reach.
		const reach = Math.max( offset + width, 0 );
		const ring = {
			top: rect.top - reach, left: rect.left - reach,
			bottom: rect.bottom + reach, right: rect.right + reach,
		};
		let clipped = null;
		for (let node = target.parentElement; node && !clipped; node = node.parentElement) {
			const nodeStyle = getComputedStyle(node);
			const clips = [nodeStyle.overflowX, nodeStyle.overflowY].some((value) => value !== 'visible');
			if (!clips) continue;
			const box = node.getBoundingClientRect();
			const sides = [];
			if (ring.left < box.left - 0.5) sides.push('left');
			if (ring.right > box.right + 0.5) sides.push('right');
			if (ring.top < box.top - 0.5) sides.push('top');
			if (ring.bottom > box.bottom + 0.5) sides.push('bottom');
			if (sides.length) clipped = { by: node.className || node.tagName, sides };
		}
		return {
			matches: target.matches(':focus-visible'),
			outlineStyle: style.outlineStyle,
			outlineWidth: width,
			clipped,
			focusedBefore: before,
		};
	})()` );
	assert( focus, `${ label } focus target is missing.` );
	// :focus-visible is a modality heuristic, not a state we control directly —
	// say so when it is the reason, otherwise the message blames the outline for
	// a selector that never matched.
	assert(
		focus.matches,
		`${ label } did not match :focus-visible after programmatic focus (focus was on ${ focus.focusedBefore } before). ` +
			'The browser only treats scripted focus as visible while the last input modality was the keyboard.'
	);
	assert(
		focus.outlineStyle !== 'none' && focus.outlineWidth >= 3,
		`${ label } focus-visible outline is ${ focus.outlineStyle } ${ focus.outlineWidth }px.`
	);
	assert(
		! focus.clipped,
		`${ label } focus ring is painted but clipped on its ${ focus.clipped && focus.clipped.sides.join( '/' ) } side(s) by ${ focus.clipped && focus.clipped.by }.`
	);
}

async function stateSnapshot( cdp, sessionId ) {
	return evaluate( cdp, sessionId, `(() => {
		const root = document.querySelector('[data-hp-header-root]');
		const panels = root ? Array.from(root.querySelectorAll('[data-hp-header-panel]')) : [];
		return {
			state: root && root.getAttribute('data-hp-header-state'),
			unhidden: panels.filter((panel) => !panel.hidden).map((panel) => panel.dataset.hpHeaderPanel),
			expanded: root ? Array.from(root.querySelectorAll('[data-hp-header-trigger]')).filter((trigger) => trigger.getAttribute('aria-expanded') === 'true').map((trigger) => trigger.dataset.hpHeaderTrigger) : [],
			leakingHidden: panels.filter((panel) => {
				const rect = panel.getBoundingClientRect();
				return panel.hidden && getComputedStyle(panel).display !== 'none' && rect.width > 0 && rect.height > 0;
			}).map((panel) => panel.dataset.hpHeaderPanel),
		};
	})()` );
}

async function assertState( cdp, sessionId, expected, context ) {
	const snapshot = await stateSnapshot( cdp, sessionId );
	const expectedOpen = expected === 'closed' ? [] : [ expected ];
	assert( snapshot.state === expected, `${ context }: state is ${ snapshot.state }; expected ${ expected }.` );
	assert(
		JSON.stringify( snapshot.unhidden ) === JSON.stringify( expectedOpen ),
		`${ context }: unhidden panels are ${ snapshot.unhidden.join( ', ' ) || 'none' }.`
	);
	assert(
		JSON.stringify( snapshot.expanded ) === JSON.stringify( expectedOpen ),
		`${ context }: expanded triggers are ${ snapshot.expanded.join( ', ' ) || 'none' }.`
	);
	assert(
		snapshot.leakingHidden.length === 0,
		`${ context }: hidden panels remain visually rendered: ${ snapshot.leakingHidden.join( ', ' ) }.`
	);
}

async function clickTrigger( cdp, sessionId, state ) {
	await evaluate( cdp, sessionId, `document.querySelector('[data-hp-header-trigger="${ state }"]').click()` );
	await wait( 30 );
}

async function closeCurrent( cdp, sessionId ) {
	await evaluate( cdp, sessionId, `(() => {
		const trigger = document.querySelector('[data-hp-header-trigger][aria-expanded="true"]');
		if (trigger) trigger.click();
	})()` );
	await wait( 30 );
}

async function accessibleName( cdp, sessionId, selector ) {
	const target = await cdp.send( 'Runtime.evaluate', {
		expression: `document.querySelector(${ JSON.stringify( selector ) })`,
	}, sessionId );
	assert( target.result.objectId, `Could not resolve accessibility target ${ selector }.` );
	const described = await cdp.send( 'DOM.describeNode', {
		objectId: target.result.objectId,
	}, sessionId );
	const tree = await cdp.send( 'Accessibility.getPartialAXTree', {
		backendNodeId: described.node.backendNodeId,
		fetchRelatives: false,
	}, sessionId );
	await cdp.send( 'Runtime.releaseObject', { objectId: target.result.objectId }, sessionId );
	const node = tree.nodes.find( ( item ) => item.role?.value === 'button' ) || tree.nodes[0];
	return node?.name?.value || '';
}

async function capture( cdp, sessionId, captureDir, name, viewport ) {
	await wait( 180 );
	const screenshot = await cdp.send( 'Page.captureScreenshot', {
		format: 'png',
		fromSurface: true,
		clip: { x: 0, y: 0, width: viewport.width, height: viewport.height, scale: 1 },
	}, sessionId, 30000 );
	const destination = path.join( captureDir, `${ name }.png` );
	await fsPromises.writeFile( destination, Buffer.from( screenshot.data, 'base64' ) );
	return destination;
}

async function verifyDesktopGeometry( cdp, sessionId, viewport, captureDir ) {
	const initial = await evaluate( cdp, sessionId, `(() => {
		const rect = (element) => {
			const value = element.getBoundingClientRect();
			return { left: value.left, right: value.right, width: value.width, height: value.height };
		};
		const root = document.querySelector('[data-hp-header-root]');
		const nav = root.querySelector('.hp-council-nav');
		const search = root.querySelector('.hp-council-search-trigger');
		const brand = root.querySelector('.hp-council-brand');
		const actions = root.querySelector('.hp-council-actions');
		return {
			clientWidth: document.documentElement.clientWidth,
			scrollWidth: document.documentElement.scrollWidth,
			bar: (() => {
				const element = root.querySelector('.hp-council-header__bar');
				const style = getComputedStyle(element);
				return {
					...rect(element), display: style.display, minHeight: style.minHeight,
					paddingTop: style.paddingTop, paddingBottom: style.paddingBottom,
					children: Array.from(element.children).map((child) => ({ tag: child.tagName, className: child.className, ...rect(child) })),
				};
			})(),
			nav: rect(nav),
			brand: rect(brand),
			actions: rect(actions),
			navDisplay: getComputedStyle(nav).display,
			labels: Array.from(nav.querySelectorAll('.hp-council-nav__label')).filter((label) => getComputedStyle(label).display !== 'none').map((label) => ({ text: label.textContent.trim(), size: parseFloat(getComputedStyle(label).fontSize), clientWidth: label.clientWidth, scrollWidth: label.scrollWidth })),
			disclosureHeights: Array.from(nav.querySelectorAll('.hp-council-nav__trigger')).map((trigger) => trigger.getBoundingClientRect().height),
			search: rect(search),
			disc: rect(root.querySelector('.hp-council-search-trigger__disc')),
			subscribe: rect(root.querySelector('.hp-council-subscribe')),
			drawerDisplay: getComputedStyle(root.querySelector('.hp-council-drawer-trigger')).display,
		};
	})()` );
	const navCenter = ( initial.nav.left + initial.nav.right ) / 2;
	assert( initial.scrollWidth <= initial.clientWidth + 1, `${ viewport.name } horizontally overflows.` );
	assert( approximately( initial.bar.height, 68 ), `${ viewport.name } bar is ${ initial.bar.height }px; expected 68px (${ JSON.stringify( initial.bar ) }).` );
	assert( initial.navDisplay !== 'none', `${ viewport.name } desktop nav is hidden.` );
	assert( approximately( navCenter, initial.clientWidth / 2 ), `${ viewport.name } nav centre is ${ navCenter }; expected ${ initial.clientWidth / 2 }.` );
	assert(
		initial.brand.right <= initial.nav.left + 1,
		`${ viewport.name } brand overlaps the centered nav by ${ ( initial.brand.right - initial.nav.left ).toFixed( 1 ) }px ` +
			`(brand ends ${ initial.brand.right.toFixed( 1 ) }, nav starts ${ initial.nav.left.toFixed( 1 ) }).`
	);
	assert(
		initial.nav.right <= initial.actions.left + 1,
		`${ viewport.name } nav overlaps desktop actions by ${ ( initial.nav.right - initial.actions.left ).toFixed( 1 ) }px ` +
			`(nav ends ${ initial.nav.right.toFixed( 1 ) }, actions start ${ initial.actions.left.toFixed( 1 ) }).`
	);
	// Without these counts the two loops below pass vacuously: rename either
	// selector and every size, clipping and height check silently stops running.
	assert(
		initial.labels.length === 3,
		`${ viewport.name } exposes ${ initial.labels.length } nav labels; expected 3 (Work, Writing, About).`
	);
	assert(
		initial.disclosureHeights.length === 2,
		`${ viewport.name } exposes ${ initial.disclosureHeights.length } disclosure triggers; expected 2 (Work, Writing).`
	);
	for ( const label of initial.labels ) {
		assert( approximately( label.size, 15, 0.1 ), `${ viewport.name } ${ label.text } is ${ label.size }px; expected 15px.` );
		assert( label.scrollWidth <= label.clientWidth + 1, `${ viewport.name } ${ label.text } is clipped.` );
	}
	for ( const height of initial.disclosureHeights ) {
		assert( approximately( height, 40 ), `${ viewport.name } disclosure trigger is ${ height }px; expected selected 40px exception.` );
	}
	assert( initial.search.width >= 44 && initial.search.height >= 44, `${ viewport.name } search target is smaller than 44px.` );
	assert( approximately( initial.disc.width, 38 ) && approximately( initial.disc.height, 38 ), `${ viewport.name } search disc is not 38px.` );
	assert( approximately( initial.subscribe.width, 116 ) && approximately( initial.subscribe.height, 42 ), `${ viewport.name } Subscribe is not 116×42px.` );
	assert( initial.drawerDisplay === 'none', `${ viewport.name } exposes the drawer trigger.` );

	await clickTrigger( cdp, sessionId, 'work' );
	await assertState( cdp, sessionId, 'work', `${ viewport.name } Work` );
	await wait( 180 );
	const work = await evaluate( cdp, sessionId, `(() => {
		const panel = document.querySelector('[data-hp-header-panel="work"]');
		const value = panel.getBoundingClientRect();
		const nav = document.querySelector('.hp-council-nav').getBoundingClientRect();
		return {
			left: value.left, right: value.right, width: value.width,
			navCenter: (nav.left + nav.right) / 2,
			rows: Array.from(panel.querySelectorAll('.hp-council-work-row__label')).map((label) => label.textContent.trim()),
			// The design invariant: status is a semantic colour PLUS a redundant
			// word, and the row anatomy is fixed per component, never per state.
			statuses: Array.from(panel.querySelectorAll('.hp-council-work-row__status')).map((status) => ({
				text: status.textContent.trim(),
				size: parseFloat(getComputedStyle(status).fontSize),
				hidden: status.getAttribute('aria-hidden') === 'true',
			})),
			anatomy: Array.from(panel.querySelectorAll('.hp-council-work-row')).map((row) => {
				const style = getComputedStyle(row);
				return {
					state: row.classList.contains('is-state-review') ? 'review' : 'done',
					padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].join(' '),
					radius: style.borderRadius,
					borderLeftWidth: style.borderLeftWidth,
					minBlockSize: style.minBlockSize,
				};
			}),
			eyebrowSize: (() => {
				const eyebrow = panel.querySelector('.hp-council-work-panel__eyebrow');
				return eyebrow ? parseFloat(getComputedStyle(eyebrow).fontSize) : null;
			})(),
		};
	})()` );
	assert( approximately( work.navCenter, navCenter ), `${ viewport.name } Work opening moved the nav centre.` );
	assert( approximately( work.width, 592 ), `${ viewport.name } Work panel is ${ work.width }px; expected 592px.` );
	assert( JSON.stringify( work.rows ) === JSON.stringify( WORK_LABELS ), `${ viewport.name } Work evidence rows are stale or out of order.` );
	// Status must survive as words in the accessible name — colour and dot shape
	// alone would fail every colour-blind and screen-reader visitor.
	assert(
		JSON.stringify( work.statuses.map( ( status ) => status.text ) ) === JSON.stringify( WORK_STATUSES ),
		`${ viewport.name } Work status words are stale or out of order: ${ JSON.stringify( work.statuses.map( ( s ) => s.text ) ) }.`
	);
	assert(
		work.statuses.every( ( status ) => ! status.hidden ),
		`${ viewport.name } hides a Work status from assistive technology, leaving state as colour alone.`
	);
	assert(
		work.statuses.every( ( status ) => approximately( status.size, SUB_FLOOR_TYPE[ '.hp-council-work-row__status' ], 0.1 ) ),
		`${ viewport.name } Work status type drifted from its pinned ${ SUB_FLOOR_TYPE[ '.hp-council-work-row__status' ] }px exemption.`
	);
	assert(
		approximately( work.eyebrowSize, SUB_FLOOR_TYPE[ '.hp-council-work-panel__eyebrow' ], 0.1 ),
		`${ viewport.name } Work panel eyebrow is ${ work.eyebrowSize }px; pinned at ${ SUB_FLOOR_TYPE[ '.hp-council-work-panel__eyebrow' ] }px.`
	);
	// Row anatomy is fixed per component, never per state: only the rule colour,
	// the surface tint and the filled-vs-hollow dot may change.
	assert(
		work.anatomy.length === WORK_LABELS.length,
		`${ viewport.name } exposes ${ work.anatomy.length } Work rows; expected ${ WORK_LABELS.length }.`
	);
	assert(
		new Set( work.anatomy.map( ( row ) => row.state ) ).size > 1,
		`${ viewport.name } Work rows no longer cover more than one state, so the fixed-anatomy check proves nothing.`
	);
	for ( const key of [ 'padding', 'radius', 'borderLeftWidth', 'minBlockSize' ] ) {
		const values = new Set( work.anatomy.map( ( row ) => row[ key ] ) );
		assert(
			values.size === 1,
			`${ viewport.name } Work row ${ key } varies by state (${ [ ...values ].join( ' vs ' ) }); anatomy is fixed per component.`
		);
	}
	assert( work.left >= -1 && work.right <= initial.clientWidth + 1, `${ viewport.name } Work panel exceeds the viewport.` );
	if ( viewport.name === 'desktop-edge' ) {
		// Derive the gutter from the client width rather than the viewport: at
		// this width the vertical scrollbar takes ~15px, so a hardcoded 95px
		// (782 minus the 592px panel, halved) is short by half the scrollbar.
		const gutter = ( initial.clientWidth - work.width ) / 2;
		assert(
			approximately( work.left, gutter, 1 ),
			`${ viewport.name } Work left gutter is ${ work.left }px; expected ${ gutter.toFixed( 1 ) }px (client ${ initial.clientWidth }px).`
		);
		assert(
			approximately( initial.clientWidth - work.right, gutter, 1 ),
			`${ viewport.name } Work right gutter is ${ initial.clientWidth - work.right }px; expected ${ gutter.toFixed( 1 ) }px.`
		);
	}
	if ( viewport.name === 'desktop-1440' ) {
		await capture( cdp, sessionId, captureDir, 'desktop-1440-work-open', viewport );
	}

	await clickTrigger( cdp, sessionId, 'writing' );
	await assertState( cdp, sessionId, 'writing', `${ viewport.name } Writing` );
	await wait( 180 );
	const writing = await evaluate( cdp, sessionId, `(() => {
		const panel = document.querySelector('[data-hp-header-panel="writing"]');
		const value = panel.getBoundingClientRect();
		return {
			left: value.left, right: value.right, width: value.width,
			links: Array.from(panel.querySelectorAll('a[href]')).map((link) => link.textContent.trim()),
		};
	})()` );
	assert( approximately( writing.width, 262 ), `${ viewport.name } Writing panel is ${ writing.width }px; expected 262px.` );
	assert( JSON.stringify( writing.links ) === JSON.stringify( WRITING_LABELS ), `${ viewport.name } Writing destinations are stale or out of order.` );
	assert( writing.left >= -1 && writing.right <= initial.clientWidth + 1, `${ viewport.name } Writing panel exceeds the viewport.` );
	if ( viewport.name === 'desktop-1440' ) {
		await capture( cdp, sessionId, captureDir, 'desktop-1440-writing-open', viewport );
	}

	await clickTrigger( cdp, sessionId, 'search' );
	await assertState( cdp, sessionId, 'search', `${ viewport.name } search` );
	await wait( 180 );
	const search = await evaluate( cdp, sessionId, `(() => {
		const panel = document.querySelector('[data-hp-header-panel="search"]');
		const value = panel.getBoundingClientRect();
		const actions = document.querySelector('.hp-council-actions').getBoundingClientRect();
		return {
			left: value.left, right: value.right, width: value.width,
			actionsRight: actions.right,
			focused: document.activeElement === panel.querySelector('input[type="search"]'),
		};
	})()` );
	assert( approximately( search.width, 278 ), `${ viewport.name } search panel is ${ search.width }px; expected 278px.` );
	assert( approximately( search.right, search.actionsRight ), `${ viewport.name } search panel is not right-anchored.` );
	assert( search.focused, `${ viewport.name } search input did not receive focus.` );
	assert( search.left >= -1 && search.right <= initial.clientWidth + 1, `${ viewport.name } search panel exceeds the viewport.` );
	if ( viewport.name === 'desktop-1440' ) {
		await capture( cdp, sessionId, captureDir, 'desktop-1440-search-open', viewport );
	}
	await closeCurrent( cdp, sessionId );
	await assertState( cdp, sessionId, 'closed', `${ viewport.name } cleanup` );
}

async function verifyMobileGeometry( cdp, sessionId, viewport, captureDir ) {
	const initial = await evaluate( cdp, sessionId, `(() => {
		const rect = (element) => {
			const value = element.getBoundingClientRect();
			return { width: value.width, height: value.height };
		};
		const root = document.querySelector('[data-hp-header-root]');
		return {
			clientWidth: document.documentElement.clientWidth,
			scrollWidth: document.documentElement.scrollWidth,
			bar: rect(root.querySelector('.hp-council-header__bar')),
			navDisplay: getComputedStyle(root.querySelector('.hp-council-nav')).display,
			searchDisplay: getComputedStyle(root.querySelector('.hp-council-search-trigger')).display,
			subscribeDisplay: getComputedStyle(root.querySelector('.hp-council-subscribe')).display,
			drawerDisplay: getComputedStyle(root.querySelector('.hp-council-drawer-trigger')).display,
			drawerTrigger: rect(root.querySelector('.hp-council-drawer-trigger')),
			drawerControl: rect(root.querySelector('.hp-council-drawer-trigger__control')),
			// Both icons share grid-area 1/1, so "visible" must mean exactly one.
			// A blanket rule elsewhere can out-specify the hide rule and stack the
			// close glyph on the hamburger without changing any geometry.
			drawerIcons: {
				open: getComputedStyle(root.querySelector('.hp-council-drawer-trigger__open')).display,
				close: getComputedStyle(root.querySelector('.hp-council-drawer-trigger__close')).display,
			},
			brand: (() => { const value = root.querySelector('.hp-council-brand').getBoundingClientRect(); return { left: value.left, right: value.right }; })(),
			drawerPosition: (() => { const value = root.querySelector('.hp-council-drawer-trigger').getBoundingClientRect(); return { left: value.left, right: value.right }; })(),
		};
	})()` );
	assert( initial.scrollWidth <= initial.clientWidth + 1, `${ viewport.name } horizontally overflows.` );
	assert( approximately( initial.bar.height, 62 ), `${ viewport.name } bar is ${ initial.bar.height }px; expected 62px.` );
	assert( initial.navDisplay === 'none', `${ viewport.name } desktop nav remains visible.` );
	assert( initial.searchDisplay === 'none' && initial.subscribeDisplay === 'none', `${ viewport.name } desktop actions remain visible.` );
	assert( initial.drawerDisplay !== 'none', `${ viewport.name } drawer trigger is hidden.` );
	assert( initial.drawerTrigger.width >= 44 && initial.drawerTrigger.height >= 44, `${ viewport.name } drawer trigger is smaller than 44px.` );
	assert( approximately( initial.drawerControl.width, 38 ) && approximately( initial.drawerControl.height, 38 ), `${ viewport.name } drawer control is not 38px.` );
	assert( initial.brand.right <= initial.drawerPosition.left + 1, `${ viewport.name } brand overlaps the drawer trigger.` );
	assert(
		initial.drawerIcons.open !== 'none' && initial.drawerIcons.close === 'none',
		`${ viewport.name } closed drawer trigger shows open=${ initial.drawerIcons.open } close=${ initial.drawerIcons.close }; ` +
			'expected the hamburger alone. Both icons occupy grid-area 1/1, so showing both stacks the close glyph on top of it.'
	);

	await clickTrigger( cdp, sessionId, 'drawer' );
	await assertState( cdp, sessionId, 'drawer', `${ viewport.name } drawer` );
	const openedIcons = await evaluate( cdp, sessionId, `(() => {
		const root = document.querySelector('[data-hp-header-root]');
		return {
			open: getComputedStyle(root.querySelector('.hp-council-drawer-trigger__open')).display,
			close: getComputedStyle(root.querySelector('.hp-council-drawer-trigger__close')).display,
		};
	})()` );
	assert(
		openedIcons.close !== 'none' && openedIcons.open === 'none',
		`${ viewport.name } open drawer trigger shows open=${ openedIcons.open } close=${ openedIcons.close }; expected the close glyph alone.`
	);
	await wait( 190 );
	const drawer = await evaluate( cdp, sessionId, `(() => {
		const panel = document.querySelector('[data-hp-header-panel="drawer"]');
		const value = panel.getBoundingClientRect();
		const listLinks = Array.from(panel.querySelectorAll('.hp-council-drawer__list a'));
		const search = panel.querySelector('.hp-council-drawer__search');
		const subscribe = panel.querySelector('.hp-council-drawer__subscribe');
		return {
			clientWidth: document.documentElement.clientWidth,
			scrollWidth: document.documentElement.scrollWidth,
			left: value.left, top: value.top, right: value.right, bottom: value.bottom, width: value.width,
			labels: [ ...listLinks.map((link) => link.textContent.trim()), search.querySelector('input').placeholder, subscribe.textContent.trim() ],
			rowHeights: listLinks.map((link) => link.getBoundingClientRect().height),
			digestHeight: panel.querySelector('.hp-council-drawer__digest a').getBoundingClientRect().height,
			searchHeight: search.getBoundingClientRect().height,
			subscribeHeight: subscribe.getBoundingClientRect().height,
			digestSize: parseFloat(getComputedStyle(panel.querySelector('.hp-council-drawer__digest span')).fontSize),
		};
	})()` );
	assert( drawer.scrollWidth <= drawer.clientWidth + 1, `${ viewport.name } open drawer causes horizontal overflow.` );
	assert( JSON.stringify( drawer.labels ) === JSON.stringify( DRAWER_LABELS ), `${ viewport.name } drawer labels are wrong: ${ drawer.labels.join( ' | ' ) }.` );
	for ( const height of drawer.rowHeights ) {
		assert( height >= 49.99, `${ viewport.name } drawer link row is ${ height }px; expected at least 50px.` );
	}
	assert( drawer.digestHeight >= 51.99, `${ viewport.name } Digest row is ${ drawer.digestHeight }px; expected at least 52px.` );
	assert( approximately( drawer.searchHeight, 46 ), `${ viewport.name } search is ${ drawer.searchHeight }px; expected 46px.` );
	assert( approximately( drawer.subscribeHeight, 48 ), `${ viewport.name } Subscribe is ${ drawer.subscribeHeight }px; expected 48px.` );
	assert( drawer.digestSize >= 12, `${ viewport.name } Digest is ${ drawer.digestSize }px; expected at least 12px.` );
	assert( drawer.width <= drawer.clientWidth + 1 && drawer.left >= -1 && drawer.right <= drawer.clientWidth + 1, `${ viewport.name } drawer exceeds the viewport horizontally.` );
	assert( drawer.top >= -1 && drawer.bottom <= viewport.height + 1, `${ viewport.name } drawer exceeds the available viewport height.` );
	if ( viewport.name === 'mobile-390' || viewport.name === 'mobile-320' ) {
		await capture( cdp, sessionId, captureDir, `${ viewport.name }-drawer-open`, viewport );
	}
	await closeCurrent( cdp, sessionId );
	await assertState( cdp, sessionId, 'closed', `${ viewport.name } cleanup` );
}

async function verifyDesktopInteractions( cdp, sessionId ) {
	const writingName = await accessibleName( cdp, sessionId, '[data-hp-header-trigger="writing"]' );
	assert( writingName === 'Writing', `Writing accessible name is "${ writingName }"; expected exactly "Writing".` );
	await pressKey( cdp, sessionId, 'Tab' );
	await assertFocusVisible( cdp, sessionId, '[data-hp-header-trigger="work"]', 'Work trigger' );

	for ( const next of [ 'work', 'writing', 'search' ] ) {
		for ( const key of [ 'Enter', 'Space' ] ) {
			await evaluate( cdp, sessionId, `document.querySelector('[data-hp-header-trigger="${ next }"]').focus()` );
			await pressKey( cdp, sessionId, key );
			await assertState( cdp, sessionId, next, `${ next } ${ key } activation` );
			await closeCurrent( cdp, sessionId );
		}
	}

	for ( const next of [ 'work', 'writing' ] ) {
		await evaluate( cdp, sessionId, `document.querySelector('[data-hp-header-trigger="${ next }"]').focus()` );
		await pressKey( cdp, sessionId, 'ArrowDown' );
		await assertState( cdp, sessionId, next, `${ next } ArrowDown` );
		const firstFocused = await evaluate( cdp, sessionId, `document.activeElement === document.querySelector('[data-hp-header-panel="${ next }"] a[href]')` );
		assert( firstFocused, `${ next } ArrowDown did not focus the first link.` );
		await pressKey( cdp, sessionId, 'Escape' );
		await assertState( cdp, sessionId, 'closed', `${ next } Escape` );
		const restored = await evaluate( cdp, sessionId, `document.activeElement === document.querySelector('[data-hp-header-trigger="${ next }"]')` );
		assert( restored, `${ next } Escape did not restore trigger focus.` );
	}

	await clickTrigger( cdp, sessionId, 'search' );
	await assertState( cdp, sessionId, 'search', 'search Escape setup' );
	const searchInputFocused = await evaluate( cdp, sessionId, `document.activeElement === document.querySelector('[data-hp-header-panel="search"] input[type="search"]')` );
	assert( searchInputFocused, 'Search did not place focus in its input before Escape.' );
	await pressKey( cdp, sessionId, 'Escape' );
	await assertState( cdp, sessionId, 'closed', 'search Escape' );
	assert(
		await evaluate( cdp, sessionId, `document.activeElement === document.querySelector('[data-hp-header-trigger="search"]')` ),
		'Search Escape did not restore its trigger.'
	);

	await clickTrigger( cdp, sessionId, 'work' );
	await clickTrigger( cdp, sessionId, 'writing' );
	await evaluate( cdp, sessionId, `document.querySelector('[data-hp-header-panel="writing"] a[href]').focus()` );
	await pressKey( cdp, sessionId, 'Escape' );
	await assertState( cdp, sessionId, 'closed', 'second-surface Escape' );
	assert(
		await evaluate( cdp, sessionId, `document.activeElement === document.querySelector('[data-hp-header-trigger="writing"]')` ),
		'Opening Writing after Work did not transfer the Escape focus origin.'
	);

	await clickTrigger( cdp, sessionId, 'work' );
	await assertFocusVisible( cdp, sessionId, '[data-hp-header-panel="work"] a[href]', 'Work panel link' );
	await closeCurrent( cdp, sessionId );
	await clickTrigger( cdp, sessionId, 'search' );
	await assertFocusVisible( cdp, sessionId, '[data-hp-header-panel="search"] input[type="search"]', 'Search input' );
	await pressKey( cdp, sessionId, 'Escape' );
	await assertFocusVisible( cdp, sessionId, '.hp-council-subscribe', 'Desktop Subscribe' );

	await clickTrigger( cdp, sessionId, 'work' );
	await cdp.send( 'Input.dispatchMouseEvent', {
		type: 'mousePressed', x: 10, y: 300, button: 'left', buttons: 1, clickCount: 1,
	}, sessionId );
	await cdp.send( 'Input.dispatchMouseEvent', {
		type: 'mouseReleased', x: 10, y: 300, button: 'left', buttons: 0, clickCount: 1,
	}, sessionId );
	await wait( 30 );
	await assertState( cdp, sessionId, 'closed', 'real outside click' );
	assert(
		! await evaluate( cdp, sessionId, `document.activeElement === document.querySelector('[data-hp-header-trigger="work"]')` ),
		'Outside click incorrectly restored focus to the Work trigger.'
	);

	for ( const next of [ 'work', 'writing', 'search', 'drawer' ] ) {
		await clickTrigger( cdp, sessionId, next );
		await assertState( cdp, sessionId, next, `single-open transition to ${ next }` );
	}
	await closeCurrent( cdp, sessionId );

	for ( const method of [ 'pushState', 'replaceState' ] ) {
		await clickTrigger( cdp, sessionId, 'work' );
		await evaluate( cdp, sessionId, `history.${ method }({}, '', location.pathname + location.search + '#hp-${ method }')` );
		await wait( 90 );
		await assertState( cdp, sessionId, 'closed', `${ method } settle` );
	}
	await evaluate( cdp, sessionId, `history.pushState({}, '', location.pathname + location.search + '#hp-real-popstate')` );
	await wait( 90 );
	await clickTrigger( cdp, sessionId, 'writing' );
	const poppedUrl = await evaluate( cdp, sessionId, `new Promise((resolve) => {
		const timer = setTimeout(() => resolve(null), 2000);
		window.addEventListener('popstate', () => {
			clearTimeout(timer);
			resolve(location.href);
		}, { once: true });
		history.back();
	})` );
	assert( poppedUrl, 'history.back() did not dispatch a real popstate event.' );
	await wait( 90 );
	await assertState( cdp, sessionId, 'closed', 'real history.back popstate settle' );
	await clickTrigger( cdp, sessionId, 'writing' );
	await evaluate( cdp, sessionId, `window.dispatchEvent(new PageTransitionEvent('pageshow'))` );
	await wait( 90 );
	await assertState( cdp, sessionId, 'closed', 'pageshow settle' );

	await evaluate( cdp, sessionId, `(() => {
		window.__hpHeaderPushBeforeReevaluation = history.pushState;
		window.__hpHeaderReplaceBeforeReevaluation = history.replaceState;
		window.__hpHeaderAddedDuringReevaluation = 0;
		window.__hpHeaderOriginalAddEventListener = EventTarget.prototype.addEventListener;
		EventTarget.prototype.addEventListener = function () {
			window.__hpHeaderAddedDuringReevaluation++;
			return window.__hpHeaderOriginalAddEventListener.apply(this, arguments);
		};
	})()` );
	const controllerSource = read( 'assets/js/header-controller.js' );
	await evaluate( cdp, sessionId, controllerSource );
	await wait( 90 );
	const reevaluation = await evaluate( cdp, sessionId, `(() => {
		EventTarget.prototype.addEventListener = window.__hpHeaderOriginalAddEventListener;
		return {
			samePushWrapper: history.pushState === window.__hpHeaderPushBeforeReevaluation,
			sameReplaceWrapper: history.replaceState === window.__hpHeaderReplaceBeforeReevaluation,
			hasRouterScroll: history.pushState.__hpRouterScroll === true,
			hasRegistry: !!(window.__hpCouncilHeaderController && window.__hpCouncilHeaderController.settle),
			addedListeners: window.__hpHeaderAddedDuringReevaluation,
		};
	})()` );
	assert(
		reevaluation.samePushWrapper && reevaluation.sameReplaceWrapper && reevaluation.hasRouterScroll && reevaluation.hasRegistry && reevaluation.addedListeners === 0,
		`Controller reevaluation duplicated initialization or broke wrapper composition: ${ JSON.stringify( reevaluation ) }.`
	);
	await clickTrigger( cdp, sessionId, 'work' );
	await assertState( cdp, sessionId, 'work', 'single listener after controller reevaluation' );
	await closeCurrent( cdp, sessionId );

	await cdp.send( 'Emulation.setEmulatedMedia', {
		media: 'screen',
		features: [ { name: 'prefers-reduced-motion', value: 'reduce' } ],
	}, sessionId );
	assert(
		await evaluate( cdp, sessionId, `matchMedia('(prefers-reduced-motion: reduce)').matches` ),
		'Reduced-motion emulation did not match in the page.'
	);
	for ( const next of [ 'work', 'writing', 'search' ] ) {
		await clickTrigger( cdp, sessionId, next );
		const sample = async () => evaluate( cdp, sessionId, `(() => {
			const panel = document.querySelector('[data-hp-header-panel="${ next }"]');
			const style = getComputedStyle(panel);
			const rect = panel.getBoundingClientRect();
			return {
				animation: style.animationName, transition: style.transitionDuration,
				transform: style.transform, opacity: parseFloat(style.opacity),
				left: rect.left, top: rect.top, width: rect.width, height: rect.height,
			};
		})()` );
		const motionStart = await sample();
		await wait( 80 );
		const motionEnd = await sample();
		assert( motionStart.animation === 'none' && motionEnd.animation === 'none', `Reduced motion still runs ${ next } animation.` );
		assert( maximumDurationSeconds( motionStart.transition ) <= 0.001, `Reduced-motion ${ next } transition is ${ motionStart.transition }.` );
		assert(
			motionStart.transform === motionEnd.transform &&
			approximately( motionStart.opacity, motionEnd.opacity, 0.001 ) &&
			approximately( motionStart.left, motionEnd.left, 0.1 ) &&
			approximately( motionStart.top, motionEnd.top, 0.1 ) &&
			approximately( motionStart.width, motionEnd.width, 0.1 ) &&
			approximately( motionStart.height, motionEnd.height, 0.1 ),
			`Reduced motion changes ${ next } geometry, opacity, or transform across frames.`
		);
		await closeCurrent( cdp, sessionId );
	}
	await cdp.send( 'Emulation.setEmulatedMedia', { media: 'screen', features: [] }, sessionId );
}

async function verifyMobileInteractions( cdp, sessionId ) {
	for ( const key of [ 'Enter', 'Space' ] ) {
		await evaluate( cdp, sessionId, `document.querySelector('[data-hp-header-trigger="drawer"]').focus()` );
		await pressKey( cdp, sessionId, key );
		await assertState( cdp, sessionId, 'drawer', `drawer ${ key } activation` );
		await closeCurrent( cdp, sessionId );
	}

	await clickTrigger( cdp, sessionId, 'drawer' );
	const guardedClicks = await evaluate( cdp, sessionId, `(() => {
		const root = document.querySelector('[data-hp-header-root]');
		const panel = root.querySelector('[data-hp-header-panel="drawer"]');
		const link = document.createElement('a');
		link.href = '#hp-controller-guard-test';
		link.textContent = 'Guard test';
		panel.appendChild(link);
		const cases = [
			{ event: { button: 1 } },
			{ event: { ctrlKey: true } },
			{ event: { metaKey: true } },
			{ event: { shiftKey: true } },
			{ event: { altKey: true } },
			{ event: {}, target: '_blank' },
			{ event: {}, download: true },
		];
		const results = cases.map((testCase) => {
			link.removeAttribute('target');
			link.removeAttribute('download');
			if (testCase.target) link.target = testCase.target;
			if (testCase.download) link.setAttribute('download', 'guard-test.txt');
			const preventDefault = (event) => event.preventDefault();
			window.addEventListener('click', preventDefault, { once: true });
			const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...testCase.event });
			link.dispatchEvent(event);
			return {
				state: root.getAttribute('data-hp-header-state'),
				closing: root.classList.contains('is-hp-closing'),
				chosen: link.classList.contains('is-hp-chosen'),
			};
		});
		const prevented = new MouseEvent('click', { bubbles: true, cancelable: true });
		prevented.preventDefault();
		link.dispatchEvent(prevented);
		results.push({
			state: root.getAttribute('data-hp-header-state'),
			closing: root.classList.contains('is-hp-closing'),
			chosen: link.classList.contains('is-hp-chosen'),
		});
		link.remove();
		return results;
	})()` );
	assert(
		guardedClicks.every( ( result ) => result.state === 'drawer' && ! result.closing && ! result.chosen ),
		`Modified, non-primary, or prevented drawer clicks started the close treatment: ${ JSON.stringify( guardedClicks ) }.`
	);

	const clickResult = await evaluate( cdp, sessionId, `(() => {
		const root = document.querySelector('[data-hp-header-root]');
		const panel = root.querySelector('[data-hp-header-panel="drawer"]');
		const link = document.createElement('a');
		link.href = '#hp-controller-link-test';
		link.textContent = 'Controller test link';
		panel.appendChild(link);
		const event = new MouseEvent('click', { bubbles: true, cancelable: true });
		const allowed = link.dispatchEvent(event);
		return {
			allowed,
			defaultPrevented: event.defaultPrevented,
			closing: root.classList.contains('is-hp-closing'),
			chosen: link.classList.contains('is-hp-chosen'),
		};
	})()` );
	assert( clickResult.allowed && ! clickResult.defaultPrevented, 'Normal drawer link navigation was prevented.' );
	assert( clickResult.closing && clickResult.chosen, 'Normal drawer link did not begin the close treatment.' );
	await wait( 180 );
	await assertState( cdp, sessionId, 'closed', 'drawer internal-link close' );
	const cleaned = await evaluate( cdp, sessionId, `(() => {
		const root = document.querySelector('[data-hp-header-root]');
		const link = root.querySelector('[href="#hp-controller-link-test"]');
		const clean = !root.classList.contains('is-hp-closing') && link && !link.classList.contains('is-hp-chosen');
		if (link) link.remove();
		return clean;
	})()` );
	assert( cleaned, 'Drawer close treatment was not cleaned up.' );

	// Tabbing past the end of the drawer closes it, the way a disclosure should.
	await clickTrigger( cdp, sessionId, 'drawer' );
	await assertState( cdp, sessionId, 'drawer', 'drawer tab-out open' );
	await evaluate( cdp, sessionId, `(() => {
		const outside = document.createElement('button');
		outside.id = 'hp-tab-out-probe';
		outside.textContent = 'Outside';
		document.body.appendChild(outside);
		outside.focus();
	})()` );
	await wait( 60 );
	await assertState( cdp, sessionId, 'closed', 'drawer tab-out close' );
	await evaluate( cdp, sessionId, `document.getElementById('hp-tab-out-probe').remove()` );

	// The drawer's own closing and chosen-link rules outrank the bare selectors
	// in the reduced-motion reset, so they have to be exercised directly rather
	// than assumed from the desktop panels.
	await cdp.send( 'Emulation.setEmulatedMedia', {
		media: 'screen',
		features: [ { name: 'prefers-reduced-motion', value: 'reduce' } ],
	}, sessionId );
	assert(
		await evaluate( cdp, sessionId, `matchMedia('(prefers-reduced-motion: reduce)').matches` ),
		'Reduced-motion emulation did not match for the drawer pass.'
	);
	await clickTrigger( cdp, sessionId, 'drawer' );
	const drawerMotion = await evaluate( cdp, sessionId, `(() => {
		const root = document.querySelector('[data-hp-header-root]');
		const panel = root.querySelector('[data-hp-header-panel="drawer"]');
		const link = document.createElement('a');
		link.href = '#hp-reduced-motion-probe';
		link.textContent = 'Reduced motion probe';
		panel.appendChild(link);
		// Force the two states the reset must also neutralise.
		root.classList.add('is-hp-closing');
		link.classList.add('is-hp-chosen');
		const panelStyle = getComputedStyle(panel);
		const linkStyle = getComputedStyle(link);
		const result = {
			panelAnimation: panelStyle.animationName,
			panelTransition: panelStyle.transitionDuration,
			linkAnimation: linkStyle.animationName,
			linkTransition: linkStyle.transitionDuration,
		};
		root.classList.remove('is-hp-closing');
		link.remove();
		return result;
	})()` );
	assert(
		drawerMotion.panelAnimation === 'none' && drawerMotion.linkAnimation === 'none',
		`Reduced motion still animates the closing drawer or its chosen link: ${ JSON.stringify( drawerMotion ) }.`
	);
	assert(
		maximumDurationSeconds( drawerMotion.panelTransition ) <= 0.001 &&
		maximumDurationSeconds( drawerMotion.linkTransition ) <= 0.001,
		`Reduced-motion drawer transitions are ${ drawerMotion.panelTransition } / ${ drawerMotion.linkTransition }.`
	);
	await closeCurrent( cdp, sessionId );
	await cdp.send( 'Emulation.setEmulatedMedia', { media: 'screen', features: [] }, sessionId );

	// The drawer legend and the Digest cue carry the two remaining pinned
	// sub-floor type exemptions.
	await clickTrigger( cdp, sessionId, 'drawer' );
	const drawerType = await evaluate( cdp, sessionId, `(() => {
		const pick = (selector) => {
			const node = document.querySelector(selector);
			return node ? parseFloat(getComputedStyle(node).fontSize) : null;
		};
		return {
			legend: pick('.hp-council-drawer__legend'),
			cue: pick('.hp-council-digest-cue'),
			overscroll: getComputedStyle(document.querySelector('.hp-council-drawer')).overscrollBehaviorY,
		};
	})()` );
	assert(
		approximately( drawerType.legend, SUB_FLOOR_TYPE[ '.hp-council-drawer__legend' ], 0.1 ),
		`Drawer legend is ${ drawerType.legend }px; pinned at ${ SUB_FLOOR_TYPE[ '.hp-council-drawer__legend' ] }px.`
	);
	assert(
		approximately( drawerType.cue, SUB_FLOOR_TYPE[ '.hp-council-digest-cue' ], 0.1 ),
		`Digest cue is ${ drawerType.cue }px; pinned at ${ SUB_FLOOR_TYPE[ '.hp-council-digest-cue' ] }px.`
	);
	assert(
		drawerType.overscroll === 'contain',
		`Drawer overscroll-behavior is ${ drawerType.overscroll }; expected contain so its scroll does not chain to the page.`
	);
	await closeCurrent( cdp, sessionId );
}

async function verifyHoverCorridor( cdp, sessionId, next ) {
	await assertState( cdp, sessionId, 'closed', `${ next } hover corridor initial state` );
	const finePointer = await evaluate( cdp, sessionId, `matchMedia('(min-width: 782px) and (hover: hover) and (pointer: fine)').matches` );
	assert( finePointer, 'Desktop hover-corridor checks require a matching fine-pointer media query.' );
	const trigger = await evaluate( cdp, sessionId, `(() => {
		const value = document.querySelector('[data-hp-header-trigger="${ next }"]').getBoundingClientRect();
		return { x: (value.left + value.right) / 2, y: (value.top + value.bottom) / 2, bottom: value.bottom };
	})()` );
	await cdp.send( 'Input.dispatchMouseEvent', {
		type: 'mouseMoved', x: trigger.x, y: trigger.y, button: 'none', pointerType: 'mouse',
	}, sessionId );
	await wait( 40 );
	await assertState( cdp, sessionId, next, `${ next } pointerover` );
	await waitForAnimations( cdp, sessionId, `[data-hp-header-panel="${ next }"]` );
	const panel = await evaluate( cdp, sessionId, `(() => {
		const value = document.querySelector('[data-hp-header-panel="${ next }"]').getBoundingClientRect();
		return { x: (value.left + value.right) / 2, top: value.top };
	})()` );
	const gap = panel.top - trigger.bottom;
	assert( approximately( gap, 12, 1 ), `${ next } trigger-to-panel gap is ${ gap }px; expected 12px.` );
	await cdp.send( 'Input.dispatchMouseEvent', {
		type: 'mouseMoved', x: trigger.x, y: trigger.bottom + ( gap / 2 ), button: 'none', pointerType: 'mouse',
	}, sessionId );
	await wait( 50 );
	await cdp.send( 'Input.dispatchMouseEvent', {
		type: 'mouseMoved', x: panel.x, y: panel.top + 4, button: 'none', pointerType: 'mouse',
	}, sessionId );
	await wait( 170 );
	await assertState( cdp, sessionId, next, `${ next } hover corridor` );
	await cdp.send( 'Input.dispatchMouseEvent', {
		type: 'mouseMoved', x: 10, y: 300, button: 'none', buttons: 0, pointerType: 'mouse',
	}, sessionId );
	await wait( 170 );
	await assertState( cdp, sessionId, 'closed', `${ next } pointer exit` );
}

async function verifyBoundarySettlement( cdp, sessionId, originalViewport ) {
	await cdp.send( 'Emulation.setDeviceMetricsOverride', {
		width: 782, height: 900, deviceScaleFactor: 1, mobile: false,
	}, sessionId );
	await wait( 80 );
	await clickTrigger( cdp, sessionId, 'work' );
	await assertState( cdp, sessionId, 'work', '782px boundary Work open' );
	await cdp.send( 'Emulation.setDeviceMetricsOverride', {
		width: 781, height: 900, deviceScaleFactor: 1, mobile: false,
	}, sessionId );
	await wait( 100 );
	await assertState( cdp, sessionId, 'closed', '782→781 boundary settle' );
	await clickTrigger( cdp, sessionId, 'drawer' );
	await assertState( cdp, sessionId, 'drawer', '781px boundary drawer open' );
	await cdp.send( 'Emulation.setDeviceMetricsOverride', {
		width: 782, height: 900, deviceScaleFactor: 1, mobile: false,
	}, sessionId );
	await wait( 100 );
	await assertState( cdp, sessionId, 'closed', '781→782 boundary settle' );
	await cdp.send( 'Emulation.setDeviceMetricsOverride', {
		width: originalViewport.width,
		height: originalViewport.height,
		deviceScaleFactor: 1,
		mobile: false,
	}, sessionId );
	await wait( 80 );
}

async function inspectViewport( cdp, viewport, captureDir ) {
	const target = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
	const attached = await cdp.send( 'Target.attachToTarget', {
		targetId: target.targetId,
		flatten: true,
	} );
	const sessionId = attached.sessionId;

	try {
		await cdp.send( 'Page.enable', {}, sessionId );
		await cdp.send( 'Runtime.enable', {}, sessionId );
		await cdp.send( 'DOM.enable', {}, sessionId );
		await cdp.send( 'Accessibility.enable', {}, sessionId );
		await cdp.send( 'Emulation.setDeviceMetricsOverride', {
			width: viewport.width,
			height: viewport.height,
			deviceScaleFactor: 1,
			mobile: viewport.width <= 781,
		}, sessionId );
		await cdp.send( 'Emulation.setEmulatedMedia', { media: 'screen', features: [] }, sessionId );

		const loaded = cdp.once( 'Page.loadEventFired', sessionId );
		const url = new URL( '/', ORIGIN ).href;
		await cdp.send( 'Page.navigate', { url }, sessionId );
		await loaded;
		await cdp.send( 'Runtime.evaluate', {
			expression: 'document.fonts && document.fonts.ready',
			awaitPromise: true,
		}, sessionId );
		await waitForPageCondition(
			cdp,
			sessionId,
			`!!document.querySelector('[data-hp-header-root][data-hp-header-state="closed"]')`,
			'the initialized Council header'
		);
		// settle() re-closes at load, next frame, and again 60ms later, because
		// the Interactivity Router's render/pushState order varies. Interacting
		// inside that window lets a late settle close the panel a click just
		// opened, which no real visitor could reproduce but which makes this
		// suite flaky. Let the window drain first.
		await wait( 150 );

		const loadedState = await evaluate( cdp, sessionId, `({
			href: location.href,
			hasRoot: !!document.querySelector('[data-hp-header-root]'),
			hasController: !!document.querySelector('[data-hp-header-root][data-hp-header-state="closed"]'),
			breakCount: document.querySelectorAll('[data-hp-header-root] br').length,
			strayParagraphCount: document.querySelectorAll('[data-hp-header-root] p > .hp-council-brand, [data-hp-header-root] p > button, [data-hp-header-root] p > nav, [data-hp-header-root] p > div, [data-hp-header-root] p > ul, [data-hp-header-root] p > form').length,
			source: document.querySelector('[data-hp-header-root]') && document.querySelector('[data-hp-header-root]').getAttribute('data-hp-header-source'),
			noscript: (() => {
				// noscript content is inert text under a scripting UA, so read it
				// as markup rather than querying for elements that do not exist.
				const node = document.querySelector('[data-hp-header-root] noscript');
				if (!node) return null;
				const parsed = new DOMParser().parseFromString(node.textContent, 'text/html');
				const nav = parsed.querySelector('.hp-council-noscript');
				return {
					hasNav: !!nav,
					hrefs: nav ? Array.from(nav.querySelectorAll('a[href]')).map((a) => a.getAttribute('href')) : [],
					labels: nav ? Array.from(nav.querySelectorAll('a[href]')).map((a) => a.textContent.trim()) : [],
				};
			})(),
		})` );
		assert( loadedState.hasRoot, `${ url } did not render the Council header (loaded ${ loadedState.href }).` );
		// The fallback model carries labels and URLs identical to the DB model, so
		// without this signal a silent detach from menu 237 passes every other
		// rendered assertion in this file.
		assert(
			loadedState.source === 'navigation',
			`${ url } rendered the Council header from the '${ loadedState.source }' model; expected 'navigation' (menu 237 did not validate).`
		);
		assert( loadedState.noscript && loadedState.noscript.hasNav, `${ url } is missing its noscript Council navigation.` );
		assert(
			loadedState.noscript.hrefs.length === 7,
			`${ url } noscript nav exposes ${ loadedState.noscript.hrefs.length } routes; expected 7 (got ${ JSON.stringify( loadedState.noscript.labels ) }).`
		);
		assert(
			loadedState.noscript.hrefs.every( ( href ) => /^https?:\/\//.test( href ) ),
			`${ url } noscript nav has unresolved routes: ${ JSON.stringify( loadedState.noscript.hrefs ) }.`
		);
		assert( loadedState.hasController, `${ url } rendered the header without the controller's closed state.` );
		assert( loadedState.breakCount === 0, `${ url } contains ${ loadedState.breakCount } wpautop-injected Council header BR elements.` );
		assert( loadedState.strayParagraphCount === 0, `${ url } contains ${ loadedState.strayParagraphCount } stray Council header paragraph wrappers.` );
		await assertState( cdp, sessionId, 'closed', `${ viewport.name } initial state` );

		if ( viewport.width >= 782 ) {
			await verifyDesktopGeometry( cdp, sessionId, viewport, captureDir );
			if ( viewport.name === 'desktop-1440' ) {
				await verifyDesktopInteractions( cdp, sessionId );
				await verifyHoverCorridor( cdp, sessionId, 'work' );
				await verifyHoverCorridor( cdp, sessionId, 'writing' );
				await verifyBoundarySettlement( cdp, sessionId, viewport );
			}
		} else {
			await verifyMobileGeometry( cdp, sessionId, viewport, captureDir );
			if ( viewport.name === 'mobile-390' ) {
				await verifyMobileInteractions( cdp, sessionId );
			}
		}
		console.log( `verified ${ viewport.name } (${ viewport.width }×${ viewport.height })` );
	} finally {
		await cdp.send( 'Target.closeTarget', { targetId: target.targetId } );
	}
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
	const userDataDir = await fsPromises.mkdtemp( path.join( os.tmpdir(), 'hp-header-chrome-' ) );
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

async function verifyRendered() {
	const captureRoot = process.env.HPERKINS_CAPTURE_DIR
		? path.resolve( process.env.HPERKINS_CAPTURE_DIR )
		: os.tmpdir();
	await fsPromises.mkdir( captureRoot, { recursive: true } );
	const captureDir = await fsPromises.mkdtemp( path.join( captureRoot, 'hperkins-header-' ) );
	await withChrome( async ( cdp ) => {
		for ( const viewport of VIEWPORTS ) {
			await inspectViewport( cdp, viewport, captureDir );
		}
	} );
	console.log( `Council header screenshots: ${ captureDir }` );
}

async function main() {
	verifySource();
	if ( SOURCE_ONLY ) {
		return;
	}
	await verifyRendered();
}

main().catch( ( error ) => {
	console.error( error.message );
	process.exit( 1 );
} );
