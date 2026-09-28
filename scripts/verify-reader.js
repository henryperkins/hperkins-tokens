#!/usr/bin/env node
/**
 * Essay reader rendered contract (templates/single.html, inc/reader.php,
 * assets/js/reader.js and the reader rules in assets/imladris-pages.css).
 *
 * Walks the 2026-09-28 essay-post hand-off's checklist against real posts,
 * discovered from /essays/ the way verify-typography.js finds its reader
 * route:
 *
 *   A1  "Continue reading" never lists the post being read.
 *   A2  Skip to content lands on the title: the hero and its H1 are inside
 *       <main>, and the next Tab stop after skipping is in the hero.
 *   A3  Three related cards at 1280 and 924px, two (the newest) at 800px, three
 *       stacked at 400px, the grid spanning its wide section as on /essays/.
 *   B1  No compass plate over a featured image; without one, at 1280px the
 *       star sits right of the text column and never under it, turns 90° as
 *       the hero scrolls away, and stays at 0° under reduced motion.
 *   B2  The first paragraph (after any dek) drops three lines.
 *   B3  The read time matches round(words / 230); the hairline is empty at the
 *       title and full at the last line of prose, whatever follows.
 *   B4  § shows on hover, on focus and on touch, and is hidden at ≤900px;
 *       clicking copies the absolute URL, updates the hash and shows the toast
 *       once, and a second copy restarts it; opening the URL marks its § in
 *       text-accent.
 *   B5  The last paragraph ends with the gold star.
 *   C   Print: black title on white; no hairline, § or star.
 *
 * Also two details of EssayPost.dc.html beyond the hand-off: "All essays" is a
 * 44px tap target, and a numbered list counts in text-accent mono at 0.8em.
 *
 * Content the site does not currently carry is simulated in the page: the
 * image-less hero by removing the cover image, adding the plate markup
 * inc/reader.php emits and swapping <main> for a copy (which is also what an
 * Interactivity Router commit does, so the controller's re-mount is checked
 * along the way); three related cards by cloning one; a numbered list by
 * adding one and removing it again. inc/reader.php's own
 * decisions are pinned by scripts/verify-reader.php.
 *
 * Usage:
 *   node scripts/verify-reader.js                    # posts linked from /essays/
 *   node scripts/verify-reader.js --url=/2026/07/x/  # one post
 * Env: HPERKINS_ORIGIN (default https://hperkins.blog), CHROME_BIN,
 *      HPERKINS_CAPTURE_DIR (screenshots; default the OS temp dir).
 */
const { spawn } = require( 'node:child_process' );
const fs = require( 'node:fs' );
const fsPromises = require( 'node:fs/promises' );
const os = require( 'node:os' );
const path = require( 'node:path' );

const { getOrigin } = require( './lib/site-url' );
const { selectJournalRoute } = require( './lib/journal-route-discovery' );

const ORIGIN = getOrigin();
const URL_ARG = ( process.argv.find( ( arg ) => arg.startsWith( '--url=' ) ) || '' ).slice( 6 ) || null;
const MAX_POSTS = 3;
const WORDS_PER_MINUTE = 230;
const DESKTOP = { width: 1280, height: 900 };
const TEXT_ACCENT = 'rgb(122, 92, 30)';
const NOT_ESSAY = '.sharedaddy, .jp-relatedposts, script, style, template';

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
			await fsPromises.rm( target, { recursive: true, force: true } );
			return;
		} catch ( error ) {
			lastError = error;
			await wait( 250 );
		}
	}
	throw lastError;
}

// --- Chrome + DevTools ---------------------------------------------------------

function resolveChrome() {
	let candidate;
	if ( process.env.CHROME_BIN ) {
		candidate = path.resolve( process.env.CHROME_BIN );
	} else if ( process.platform !== 'win32' ) {
		candidate = '/usr/bin/google-chrome';
	} else {
		candidate = [
			process.env.PROGRAMFILES && path.join( process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe' ),
			process.env[ 'PROGRAMFILES(X86)' ] && path.join( process.env[ 'PROGRAMFILES(X86)' ], 'Google', 'Chrome', 'Application', 'chrome.exe' ),
			process.env.LOCALAPPDATA && path.join( process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe' ),
		].filter( Boolean ).find( ( value ) => fs.existsSync( value ) );
	}
	assert(
		candidate && fs.existsSync( candidate ) && fs.statSync( candidate ).isFile(),
		'Chrome was not found. Set CHROME_BIN to a Chrome or Chromium executable.'
	);
	return candidate;
}

function waitForDevToolsUrl( chrome ) {
	let buffer = '';
	return new Promise( ( resolve, reject ) => {
		const timer = setTimeout( () => reject( new Error( 'Timed out waiting for Chrome DevTools URL.' ) ), 15000 );
		chrome.stderr.on( 'data', ( chunk ) => {
			buffer += chunk.toString();
			const match = buffer.match( /(ws:\/\/127\.0\.0\.1:\d+\/devtools\/browser\/[^\s]+)/ );
			if ( match ) {
				clearTimeout( timer );
				resolve( match[ 1 ] );
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
	const waiters = new Map();
	const subscribers = new Map();

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
			( subscribers.get( key ) || [] ).forEach( ( callback ) => callback( message.params || {} ) );
			const callbacks = waiters.get( key ) || [];
			waiters.delete( key );
			callbacks.forEach( ( callback ) => callback( message.params || {} ) );
		}
	} );

	function send( method, params = {}, sessionId, timeout = 30000 ) {
		const id = nextId++;
		ws.send( JSON.stringify( { id, method, params, sessionId } ) );
		return new Promise( ( resolve, reject ) => {
			// A dropped response must fail the run, not hang it.
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

	function once( method, sessionId, timeout = 30000 ) {
		const key = `${ sessionId || '' }:${ method }`;
		return new Promise( ( resolve, reject ) => {
			const timer = setTimeout( () => reject( new Error( `Timed out waiting for ${ method }.` ) ), timeout );
			waiters.set( key, [
				...( waiters.get( key ) || [] ),
				( params ) => {
					clearTimeout( timer );
					resolve( params );
				},
			] );
		} );
	}

	function on( method, sessionId, callback ) {
		const key = `${ sessionId || '' }:${ method }`;
		subscribers.set( key, [ ...( subscribers.get( key ) || [] ), callback ] );
	}

	return new Promise( ( resolve, reject ) => {
		ws.addEventListener( 'open', () => resolve( { send, once, on, close: () => ws.close() } ) );
		ws.addEventListener( 'error', reject );
	} );
}

async function withChrome( callback ) {
	const userDataDir = await fsPromises.mkdtemp( path.join( os.tmpdir(), 'hp-reader-chrome-' ) );
	const args = [
		'--headless=new',
		'--disable-gpu',
		'--no-sandbox',
		'--remote-debugging-port=0',
		`--user-data-dir=${ userDataDir }`,
		'about:blank',
	];
	const chrome = spawn( resolveChrome(), args, { stdio: [ 'ignore', 'ignore', 'pipe' ] } );
	try {
		const cdp = await createCdpClient( await waitForDevToolsUrl( chrome ) );
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

// --- A page under test ---------------------------------------------------------

async function openPage( cdp, viewport, { touch = false } = {} ) {
	const target = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
	const { sessionId } = await cdp.send( 'Target.attachToTarget', { targetId: target.targetId, flatten: true } );
	const readerErrors = [];
	// Other plugins' scripts are not under test; only reader.js failures count.
	cdp.on( 'Runtime.exceptionThrown', sessionId, ( { exceptionDetails = {} } ) => {
		const frames = ( exceptionDetails.stackTrace && exceptionDetails.stackTrace.callFrames ) || [];
		const where = [ exceptionDetails.url, ...frames.map( ( frame ) => frame.url ) ].join( ' ' );
		if ( where.includes( '/assets/js/reader.js' ) ) {
			readerErrors.push( ( exceptionDetails.exception && exceptionDetails.exception.description ) || exceptionDetails.text );
		}
	} );
	await cdp.send( 'Page.enable', {}, sessionId );
	await cdp.send( 'Runtime.enable', {}, sessionId );
	// Headless pages are unfocused by default, and the clipboard refuses an
	// unfocused document.
	await cdp.send( 'Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId );
	if ( touch ) {
		await cdp.send( 'Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 }, sessionId );
	}

	const page = {
		sessionId,
		readerErrors,
		async evaluate( expression ) {
			const result = await cdp.send( 'Runtime.evaluate', {
				expression,
				awaitPromise: true,
				returnByValue: true,
			}, sessionId );
			if ( result.exceptionDetails ) {
				const details = result.exceptionDetails;
				throw new Error( `page evaluation failed: ${ ( details.exception && details.exception.description ) || details.text }` );
			}
			return result.result.value;
		},
		async resize( next ) {
			await cdp.send( 'Emulation.setDeviceMetricsOverride', {
				width: next.width,
				height: next.height,
				deviceScaleFactor: 1,
				mobile: next.width < 782,
			}, sessionId );
			await page.frames( 3 );
		},
		async media( type = '', features = [] ) {
			await cdp.send( 'Emulation.setEmulatedMedia', { media: type, features }, sessionId );
			await page.frames( 3 );
		},
		async load( url ) {
			const loaded = cdp.once( 'Page.loadEventFired', sessionId, 60000 );
			await cdp.send( 'Page.navigate', { url }, sessionId );
			await loaded;
			await page.evaluate( 'document.fonts ? document.fonts.ready.then(() => true) : true' );
			// reader.js settles at once, next frame and 120ms later.
			await wait( 250 );
		},
		frames( count = 2 ) {
			return page.evaluate( `new Promise((resolve) => {
				let left = ${ count };
				const step = () => (--left <= 0 ? resolve(true) : requestAnimationFrame(step));
				requestAnimationFrame(step);
			})` );
		},
		async scrollTo( y ) {
			await page.evaluate( `window.scrollTo(0, ${ Math.max( 0, Math.round( y ) ) }), true` );
			await page.frames( 3 );
		},
		async key( name ) {
			const keys = {
				Tab: { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 },
				Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r' },
			};
			const value = keys[ name ];
			await cdp.send( 'Input.dispatchKeyEvent', { type: 'keyDown', ...value }, sessionId );
			await cdp.send( 'Input.dispatchKeyEvent', { type: 'keyUp', key: value.key, code: value.code, windowsVirtualKeyCode: value.windowsVirtualKeyCode }, sessionId );
			await wait( 30 );
		},
		async hover( x, y ) {
			await cdp.send( 'Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0, pointerType: 'mouse' }, sessionId );
			await wait( 30 );
		},
		async click( x, y ) {
			await page.hover( x, y );
			await cdp.send( 'Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' }, sessionId );
			await cdp.send( 'Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' }, sessionId );
			await wait( 30 );
		},
		async screenshot( file ) {
			const shot = await cdp.send( 'Page.captureScreenshot', { format: 'png' }, sessionId );
			await fsPromises.writeFile( file, Buffer.from( shot.data, 'base64' ) );
		},
		close: () => cdp.send( 'Target.closeTarget', { targetId: target.targetId } ),
	};
	await page.resize( viewport );
	return page;
}

// --- Page probes ---------------------------------------------------------------

// Everything a static reading of the rendered reader can settle.
const STRUCTURE = `(() => {
	const NOT_ESSAY = ${ JSON.stringify( NOT_ESSAY ) };
	const main = document.querySelector('main.hp-reader');
	const hero = document.querySelector('.hp-reader-hero');
	const h1 = document.querySelector('h1');
	const back = document.querySelector('.hp-reader__back');
	const skip = document.querySelector('.skip-link[href^="#"]');
	let skipTarget = null;
	if (skip) {
		try { skipTarget = document.getElementById(decodeURIComponent(skip.getAttribute('href').slice(1))); } catch (e) {}
	}
	const prose = document.querySelector('.hp-reader .hp-prose');
	const children = prose ? Array.from(prose.children) : [];
	const reading = children.filter((el) => !el.matches(NOT_ESSAY));
	const dek = children[0] && children[0].matches('p.hp-prose__dek') ? children[0] : null;
	const opener = dek ? children[1] : children[0];
	const letter = (el) => {
		if (!el) return null;
		const style = getComputedStyle(el, '::first-letter');
		return { initialLetter: style.initialLetter || '', float: style.float, fontSize: parseFloat(style.fontSize), bodySize: parseFloat(getComputedStyle(el).fontSize) };
	};
	const last = reading[reading.length - 1] || null;
	const after = last ? getComputedStyle(last, '::after') : null;
	let words = 0;
	if (prose) {
		const copy = prose.cloneNode(true);
		copy.querySelectorAll(NOT_ESSAY + ', .hp-sec__link').forEach((node) => node.remove());
		words = copy.textContent.split(/\\s+/).filter(Boolean).length;
	}
	const readTime = document.querySelector('.hp-reader-hero__readtime');
	const sections = Array.from(document.querySelectorAll('.hp-sec')).map((sec) => {
		const link = sec.querySelector(':scope > .hp-sec__link');
		const heading = sec.querySelector(':scope > h2');
		return {
			inProse: !!(prose && prose.contains(sec)),
			href: link ? link.getAttribute('href') : null,
			label: link ? link.getAttribute('aria-label') : null,
			id: heading ? heading.id : null,
			text: heading ? heading.textContent.replace(/\\s+/g, ' ').trim() : null,
			siblingOrder: !!(link && heading && link.nextElementSibling === heading),
			linkInHeading: !!(heading && heading.querySelector('.hp-sec__link')),
		};
	});
	const ids = Array.from(document.querySelectorAll('[id]'), (el) => el.id).filter(Boolean);
	const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
	const firstHeading = main ? main.querySelector('h1, h2, h3, h4, h5, h6') : null;
	return {
		path: location.pathname,
		heroInMain: !!(main && hero && main.contains(hero)),
		h1InMain: !!(main && h1 && main.contains(h1)),
		h1BeforeBack: !!(h1 && back && (h1.compareDocumentPosition(back) & Node.DOCUMENT_POSITION_FOLLOWING)),
		firstHeadingIsH1: firstHeading === h1,
		skipTargetsMain: !!(skipTarget && skipTarget === main),
		related: Array.from(document.querySelectorAll('.hp-related .hp-postcard__title a[href]'), (a) => new URL(a.href, location.href).pathname),
		hasImage: !!(hero && hero.querySelector('.wp-block-cover__image-background')),
		hasPlate: !!(hero && hero.querySelector('.hp-reader-hero__plate')),
		dekLetter: letter(dek),
		opener: opener ? { tag: opener.tagName, letter: letter(opener) } : null,
		last: last ? { tag: last.tagName, content: after.content, background: after.backgroundImage } : null,
		jetpackBlocks: children.filter((el) => el.matches(NOT_ESSAY)).length,
		words,
		readTime: readTime ? readTime.textContent.trim() : null,
		proseH2: prose ? prose.querySelectorAll('h2').length : 0,
		sections,
		duplicateIds: Array.from(new Set(duplicateIds)),
		canCopy: !!(navigator.clipboard && navigator.clipboard.writeText),
		hoverNone: matchMedia('(hover: none)').matches,
		controller: !!window.__hpReaderController,
		backHeight: back && back.querySelector('a') ? back.querySelector('a').getBoundingClientRect().height : 0,
	};
})()`;

// The first § mark's state and where to point at it.
const FIRST_MARK = `(() => {
	const sec = document.querySelector('.hp-prose .hp-sec');
	if (!sec) return null;
	const link = sec.querySelector(':scope > .hp-sec__link');
	const heading = sec.querySelector(':scope > h2');
	const style = getComputedStyle(link);
	const box = link.getBoundingClientRect();
	const headingBox = heading.getBoundingClientRect();
	return {
		id: heading.id,
		opacity: parseFloat(style.opacity),
		display: style.display,
		color: style.color,
		focused: document.activeElement === link,
		focusVisible: link.matches(':focus-visible'),
		link: { x: box.left + box.width / 2, y: box.top + box.height / 2 },
		heading: { x: headingBox.left + Math.min(40, headingBox.width / 2), y: headingBox.top + headingBox.height / 2, top: headingBox.top, bottom: headingBox.bottom },
		gutter: box.right <= headingBox.left + 0.5,
	};
})()`;

const PROGRESS = `(() => {
	const fill = document.querySelector('.hp-reader-progress > span');
	if (!fill) return null;
	const matrix = getComputedStyle(fill).transform;
	const match = /^matrix\\(([^,]+)/.exec(matrix);
	return match ? parseFloat(match[1]) : (matrix === 'none' ? 1 : null);
})()`;

// Where the essay ends, in document coordinates, and where the page does.
const ESSAY_EXTENT = `(() => {
	const NOT_ESSAY = ${ JSON.stringify( NOT_ESSAY ) };
	const prose = document.querySelector('.hp-reader .hp-prose');
	const reading = Array.from(prose.children).filter((el) => !el.matches(NOT_ESSAY));
	const last = reading[reading.length - 1];
	return {
		top: prose.getBoundingClientRect().top + scrollY,
		end: last.getBoundingClientRect().bottom + scrollY,
		max: document.scrollingElement.scrollHeight - innerHeight,
		readingLine: innerHeight * 0.4,
	};
})()`;

const PLATE = `(() => {
	const hero = document.querySelector('.hp-reader-hero');
	const plate = hero && hero.querySelector('.hp-reader-hero__plate');
	if (!plate) return null;
	const star = plate.firstElementChild;
	const heroBox = hero.getBoundingClientRect();
	const starBox = star.getBoundingClientRect();
	const column = hero.querySelector('.wp-block-cover__inner-container').getBoundingClientRect();
	const probe = document.createElement('div');
	probe.style.width = 'var(--wp--custom--container--text)';
	document.body.appendChild(probe);
	const columnToken = probe.getBoundingClientRect().width;
	probe.remove();
	return {
		heroWidth: heroBox.width,
		heroHeight: hero.offsetHeight,
		starWidth: starBox.width,
		starCentre: starBox.left + starBox.width / 2 - heroBox.left,
		columnRight: column.right - heroBox.left,
		columnToken,
		rotate: getComputedStyle(star).rotate,
		opacity: parseFloat(getComputedStyle(plate).opacity),
		display: getComputedStyle(plate).display,
	};
})()`;

const SIMULATE_IMAGELESS_HERO = `(() => {
	const hero = document.querySelector('.hp-reader-hero');
	hero.querySelectorAll('.wp-block-cover__image-background').forEach((node) => node.remove());
	if (!hero.querySelector('.hp-reader-hero__plate')) {
		hero.querySelector('.wp-block-cover__background').insertAdjacentHTML('afterend',
			'<span class="hp-reader-hero__plate" aria-hidden="true"><span></span></span>');
	}
	// A router commit swaps the region for fresh nodes; do the same.
	const main = document.querySelector('main.hp-reader');
	main.replaceWith(main.cloneNode(true));
	window.__hpReaderController.settle();
	return true;
})()`;

const RELATED_LAYOUT = `(() => {
	const list = document.querySelector('.hp-related .wp-block-post-template');
	if (!list || !list.children.length) return null;
	while (list.children.length < 3) list.appendChild(list.children[0].cloneNode(true));
	const visible = Array.from(list.children).filter((li) => getComputedStyle(li).display !== 'none' && li.getBoundingClientRect().width > 0);
	return {
		cards: visible.map((li) => { const box = li.getBoundingClientRect(); return { top: Math.round(box.top), left: Math.round(box.left), width: Math.round(box.width) }; }),
		grid: list.getBoundingClientRect().width,
		section: document.querySelector('.hp-related').getBoundingClientRect().width,
	};
})()`;

// No published essay has a numbered list yet, so one is added for the reading
// and removed again.
const LIST_MARKER = `(() => {
	const prose = document.querySelector('.hp-reader .hp-prose');
	if (!prose) return null;
	const list = document.createElement('ol');
	list.className = 'wp-block-list';
	list.innerHTML = '<li>One</li>';
	prose.appendChild(list);
	const item = list.firstElementChild;
	const marker = getComputedStyle(item, '::marker');
	const probe = document.createElement('span');
	probe.style.fontFamily = 'var(--wp--preset--font-family--mono)';
	item.appendChild(probe);
	const result = {
		color: marker.color,
		mono: marker.fontFamily === getComputedStyle(probe).fontFamily,
		ratio: parseFloat(marker.fontSize) / parseFloat(getComputedStyle(item).fontSize),
	};
	list.remove();
	return result;
})()`;

function rotation( value ) {
	if ( ! value || value === 'none' ) {
		return 0;
	}
	const match = /(-?[\d.]+)deg/.exec( value );
	return match ? parseFloat( match[ 1 ] ) : NaN;
}

// --- The battery ---------------------------------------------------------------

// PHP marks nested H2s too. Check their actual gutter geometry, including
// keyboard reachability, so positioning only direct children cannot pass.
async function verifyNestedSections( page, check ) {
	await page.evaluate( `(() => {
		const prose = document.querySelector('.hp-prose');
		const source = prose.querySelector('.hp-sec');
		if (!source) throw new Error('A rendered section is required for the nested-heading fixture.');
		for (const [name, classes] of [
			['group', ['wp-block-group']],
			['column', ['wp-block-columns', 'wp-block-column', 'wp-block-group']],
		]) {
			const wrapper = document.createElement('div');
			wrapper.className = classes[0];
			wrapper.dataset.hpNestedProbe = name;
			let parent = wrapper;
			for (const className of classes.slice(1)) {
				const child = document.createElement('div');
				child.className = className;
				parent.appendChild(child);
				parent = child;
			}
			const section = source.cloneNode(true);
			const heading = section.querySelector('h2');
			heading.id = 'hp-nested-' + name;
			section.querySelector('.hp-sec__link').setAttribute('href', '#' + heading.id);
			parent.appendChild(section);
			prose.appendChild(wrapper);
		}
	})()` );
	try {
		for ( const width of [ 1280, 901, 900, 390 ] ) {
			await page.resize( { width, height: 900 } );
			await page.key( 'Tab' );
			for ( const name of [ 'group', 'column' ] ) {
				await page.evaluate( `(() => {
					const section = document.querySelector('[data-hp-nested-probe="${ name }"] .hp-sec');
					section.scrollIntoView({ block: 'center', behavior: 'instant' });
					section.querySelector('.hp-sec__link').focus({ preventScroll: true });
				})()` );
				await wait( 200 );
				const mark = await page.evaluate( `(() => {
					const section = document.querySelector('[data-hp-nested-probe="${ name }"] .hp-sec');
					const link = section.querySelector('.hp-sec__link');
					const heading = section.querySelector('h2').getBoundingClientRect();
					const box = link.getBoundingClientRect();
					const style = getComputedStyle(link);
					const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
					return {
						display: style.display,
						aligned: Math.abs(box.top - heading.top) < 1 && box.right <= heading.left && box.left >= 0,
						reachable: document.activeElement === link && Number(style.opacity) === 1 && (hit === link || link.contains(hit)),
						left: box.left, top: box.top, headingTop: heading.top,
					};
				})()` );
				check(
					width <= 900 ? mark.display === 'none' : mark.aligned && mark.reachable,
					`The nested ${ name } section mark must ${ width <= 900 ? 'hide without a gutter' : 'stay beside its heading and remain reachable' } at ${ width }px: ${ JSON.stringify( mark ) }.`
				);
			}
		}
	} finally {
		await page.evaluate( `document.querySelectorAll('[data-hp-nested-probe]').forEach((node) => node.remove())` );
		await page.resize( DESKTOP );
	}
}

async function verifyPost( cdp, postPath, captureDir, violations ) {
	const url = new URL( postPath, ORIGIN ).href;
	const slug = postPath.replace( /\W+/g, '-' ).replace( /^-|-$/g, '' ) || 'post';
	const check = ( condition, message ) => {
		if ( ! condition ) {
			violations.push( `${ postPath }: ${ message }` );
		}
	};

	const page = await openPage( cdp, DESKTOP );
	try {
		await page.load( url );
		const facts = await page.evaluate( STRUCTURE );
		check( facts.controller, 'assets/js/reader.js did not load (window.__hpReaderController is missing).' );

		// A1
		check( ! facts.related.includes( facts.path ), `"Continue reading" lists the post being read (${ facts.path }).` );

		// A2
		check( facts.heroInMain && facts.h1InMain, 'The reader hero and its H1 must be inside <main>, the skip link\'s target.' );
		check( facts.skipTargetsMain, 'Skip to content must target <main.hp-reader>.' );
		check( facts.firstHeadingIsH1 && facts.h1BeforeBack, 'The H1 must be the first heading in <main>, ahead of "All essays".' );
		await page.key( 'Tab' );
		const skipFocused = await page.evaluate( `document.activeElement && document.activeElement.matches('.skip-link')` );
		check( skipFocused, 'The first Tab stop must be Skip to content.' );
		if ( skipFocused ) {
			await page.key( 'Enter' );
			await wait( 200 );
			await page.key( 'Tab' );
			const landed = await page.evaluate( `(() => {
				const active = document.activeElement;
				const hero = document.querySelector('.hp-reader-hero');
				const focusable = hero && hero.querySelector('a[href], button, [tabindex]:not([tabindex="-1"])');
				return { inHero: !!(hero && hero.contains(active)), heroHasStop: !!focusable, label: active ? (active.textContent || '').trim().slice(0, 40) : '' };
			})()` );
			check(
				! landed.heroHasStop || landed.inHero,
				`After Skip to content, the next Tab stop must be in the hero above the title; it was "${ landed.label }".`
			);
		}

		// B3 read time
		const minutes = /^(\d+) min read$/.exec( facts.readTime || '' );
		check( minutes, `The hero must show a measured read time ("N min read"); got ${ JSON.stringify( facts.readTime ) }.` );
		if ( minutes ) {
			const expected = Math.max( 1, Math.round( facts.words / WORDS_PER_MINUTE ) );
			check(
				Math.abs( Number( minutes[ 1 ] ) - expected ) <= 1,
				`Read time "${ facts.readTime }" does not match round(${ facts.words } words / ${ WORDS_PER_MINUTE }) = ${ expected }.`
			);
		}

		// B2 drop cap
		const dropped = ( letter ) => !! letter && ( letter.initialLetter.startsWith( '3' ) || ( letter.float === 'left' && letter.fontSize > letter.bodySize * 3 ) );
		if ( facts.opener && facts.opener.tag === 'P' ) {
			check( dropped( facts.opener.letter ), `The essay's first paragraph must drop three lines (initial-letter ${ JSON.stringify( facts.opener.letter ) }).` );
		}
		if ( facts.dekLetter ) {
			check( ! dropped( facts.dekLetter ), 'An opening dek must not take the drop cap.' );
		}

		// B5 end mark
		if ( facts.last && facts.last.tag === 'P' ) {
			check(
				facts.last.content === '""' && facts.last.background.includes( 'data:image/svg+xml' ),
				`The essay's last paragraph must end with the gold star${ facts.jetpackBlocks ? ', past the Jetpack blocks after it' : '' }.`
			);
		}

		// Design details beyond the hand-off: the back link's tap target and the
		// numbered-list figures.
		check( facts.backHeight >= 43.5, `"All essays" must be a 44px tap target (it is ${ Math.round( facts.backHeight ) }px tall).` );
		const marker = await page.evaluate( LIST_MARKER );
		if ( marker ) {
			check(
				marker.color === TEXT_ACCENT && marker.mono && Math.abs( marker.ratio - 0.8 ) < 0.01,
				`A numbered list must count in text-accent mono at 0.8em (got ${ JSON.stringify( marker ) }).`
			);
		}

		// B4 structure
		check( facts.sections.length === facts.proseH2, `Every level-2 heading in the essay needs a § mark: ${ facts.sections.length } of ${ facts.proseH2 }.` );
		for ( const section of facts.sections ) {
			check( section.inProse, `§ mark #${ section.id } is outside the essay body.` );
			check( section.id && section.href === `#${ section.id }`, `§ mark ${ section.href } must link to its heading's id (#${ section.id }).` );
			check( section.siblingOrder && ! section.linkInHeading, `§ mark #${ section.id } must be the heading's sibling, so the heading keeps its own name.` );
			const verb = facts.canCopy ? 'Copy a link to the section' : 'Link to the section';
			check( section.label === `${ verb } ${ section.text }`, `§ mark #${ section.id } is labelled ${ JSON.stringify( section.label ) }; expected "${ verb } ${ section.text }".` );
		}
		check( facts.duplicateIds.length === 0, `Duplicate ids on the page: ${ facts.duplicateIds.join( ', ' ) }.` );

		// B1 real content
		check( facts.hasImage !== facts.hasPlate, facts.hasImage ? 'A hero with a featured image must not carry the plate.' : 'An image-less hero must carry the plate.' );

		// B4 visibility and copy
		if ( facts.sections.length ) {
			await page.evaluate( `document.querySelector('.hp-prose .hp-sec').scrollIntoView({ block: 'center' }), true` );
			await page.hover( 5, DESKTOP.height - 5 );
			await wait( 250 );
			let mark = await page.evaluate( FIRST_MARK );
			check( mark.gutter, '§ must hang in the gutter left of its heading.' );
			check(
				mark.opacity === ( facts.hoverNone ? 1 : 0 ),
				`§ must be ${ facts.hoverNone ? 'shown where there is no hover' : 'hidden at rest' } (opacity ${ mark.opacity }).`
			);
			await page.hover( mark.heading.x, mark.heading.y );
			await wait( 250 );
			mark = await page.evaluate( FIRST_MARK );
			check( mark.opacity === 1, `§ must show while its section is hovered (opacity ${ mark.opacity }).` );
			await page.screenshot( path.join( captureDir, `${ slug }-section-hover.png` ) );
			await page.hover( 5, DESKTOP.height - 5 );

			// Focus: walk the tab order to the first mark.
			await page.evaluate( `document.activeElement && document.activeElement.blur(), window.scrollTo(0, 0), true` );
			let reached = false;
			for ( let presses = 0; presses < 80 && ! reached; presses++ ) {
				await page.key( 'Tab' );
				reached = await page.evaluate( `!!(document.activeElement && document.activeElement.matches('.hp-prose .hp-sec__link'))` );
			}
			check( reached, 'The first § mark must be reachable with Tab.' );
			if ( reached ) {
				await wait( 250 );
				mark = await page.evaluate( FIRST_MARK );
				check( mark.focused && mark.focusVisible && mark.opacity === 1, `A keyboard-focused § must show (opacity ${ mark.opacity }, :focus-visible ${ mark.focusVisible }).` );
			}

			if ( facts.canCopy ) {
				await cdp.send( 'Browser.grantPermissions', {
					origin: new URL( ORIGIN ).origin,
					permissions: [ 'clipboardReadWrite', 'clipboardSanitizedWrite' ],
				} );
				await page.evaluate( `document.activeElement && document.activeElement.blur(), document.querySelector('.hp-prose .hp-sec').scrollIntoView({ block: 'center' }), true` );
				await page.frames( 2 );
				mark = await page.evaluate( FIRST_MARK );
				const expectedUrl = new URL( `#${ mark.id }`, url ).href;
				await page.click( mark.link.x, mark.link.y );
				await wait( 300 );
				const copied = await page.evaluate( `(async () => ({
					hash: location.hash,
					clipboard: await navigator.clipboard.readText().catch((error) => 'ERR ' + error.message),
					messages: Array.from(document.querySelectorAll('.hp-toast > p'), (p) => p.textContent),
					toasts: document.querySelectorAll('.hp-toast').length,
					live: (document.querySelector('.hp-toast') || {}).getAttribute ? document.querySelector('.hp-toast').getAttribute('aria-live') : null,
					targetColor: (() => { const link = document.querySelector('.hp-sec:has(:target) > .hp-sec__link'); return link ? getComputedStyle(link).color : null; })(),
				}))()` );
				check( copied.hash === `#${ mark.id }`, `Clicking § must update the hash to #${ mark.id } (got ${ copied.hash || 'none' }).` );
				check( copied.clipboard === expectedUrl, `Clicking § must copy ${ expectedUrl } (clipboard: ${ copied.clipboard }).` );
				check( copied.toasts === 1 && copied.live === 'polite', 'The page must hold exactly one polite live region for the toast.' );
				check(
					copied.messages.length === 1 && copied.messages[ 0 ] === 'Link to this section copied',
					`The toast must say "Link to this section copied" once (got ${ JSON.stringify( copied.messages ) }).`
				);
				check( copied.targetColor === TEXT_ACCENT, `The addressed section's § must turn text-accent (got ${ copied.targetColor }).` );
				await page.screenshot( path.join( captureDir, `${ slug }-copied.png` ) );

				// A second copy ~1s later restarts the 1.8s: still showing 1s after
				// it (past 2s after the first), gone 1.1s after that. The first
				// click scrolled its heading to the top, so aim again.
				await wait( 700 );
				mark = await page.evaluate( FIRST_MARK );
				await page.click( mark.link.x, mark.link.y );
				await wait( 1000 );
				const restarted = await page.evaluate( `document.querySelectorAll('.hp-toast > p').length` );
				check( restarted === 1, `A second copy must restart the toast's timer and show one message (showing ${ restarted }).` );
				await wait( 1100 );
				const cleared = await page.evaluate( `document.querySelector('.hp-toast').textContent.trim()` );
				check( cleared === '', 'The toast must empty 1.8s after the last copy.' );
			} else {
				console.log( `note: ${ postPath }: this browser exposes no clipboard API, so the copy checks were skipped.` );
			}
		}

		if ( facts.sections.length ) {
			await verifyNestedSections( page, check );
		}

		// B3 progress hairline
		await page.scrollTo( 0 );
		const extent = await page.evaluate( ESSAY_EXTENT );
		const atTop = await page.evaluate( PROGRESS );
		check( atTop !== null && atTop <= 0.001, `The hairline must be empty at the title (scaleX ${ atTop }).` );
		const start = extent.top - extent.readingLine;
		const finish = extent.end - extent.readingLine;
		if ( finish <= extent.max ) {
			await page.scrollTo( start + ( finish - start ) / 2 );
			const middle = await page.evaluate( PROGRESS );
			check( Math.abs( middle - 0.5 ) < 0.03, `Halfway through the essay the hairline must be half full (scaleX ${ middle }).` );
			await page.scrollTo( finish - 40 );
			const nearly = await page.evaluate( PROGRESS );
			check( nearly > 0.9 && nearly < 1, `Just short of the last line the hairline must be nearly full (scaleX ${ nearly }).` );
			await page.scrollTo( finish );
			const full = await page.evaluate( PROGRESS );
			check( full >= 0.995, `The hairline must be full at the last line of prose (scaleX ${ full }).` );
			await page.screenshot( path.join( captureDir, `${ slug }-essay-end.png` ) );
		} else {
			console.log( `note: ${ postPath }: the page cannot scroll the essay's end to the reading line; mid-range checks skipped.` );
		}
		await page.scrollTo( extent.max );
		const bottom = await page.evaluate( PROGRESS );
		check( bottom >= 0.995, `Past the essay — related cards, subscribe, footer — the hairline stays full (scaleX ${ bottom }).` );

		// B1 simulated image-less hero, with a router-style swap of <main>.
		await page.scrollTo( 0 );
		await page.evaluate( SIMULATE_IMAGELESS_HERO );
		await wait( 250 );
		const chrome = await page.evaluate( `({ bars: document.querySelectorAll('.hp-reader-progress').length, toasts: document.querySelectorAll('.hp-toast').length })` );
		check( chrome.bars === 1, `After a swap of <main> there must be one progress hairline (found ${ chrome.bars }).` );
		check( chrome.toasts === ( facts.sections.length ? 1 : 0 ), `After a swap of <main> there must be ${ facts.sections.length ? 'one toast region' : 'no toast region' } (found ${ chrome.toasts }).` );
		let plate = await page.evaluate( PLATE );
		check( plate && plate.display !== 'none', 'The simulated image-less hero must show its plate.' );
		if ( plate ) {
			const gutter = plate.heroWidth / 2 - plate.columnToken / 2;
			const width = Math.min( Math.max( 320, gutter * 1.6 ), 704 );
			check( Math.abs( plate.starWidth - width ) < 1.5, `The star must be 1.6 × the gutter, 320–704px: ${ plate.starWidth.toFixed( 1 ) }px, expected ${ width.toFixed( 1 ) }px.` );
			check(
				Math.abs( plate.starCentre - ( plate.heroWidth * 0.75 + plate.columnToken / 4 ) ) < 1.5,
				`The star must centre on the right gutter's midpoint: ${ plate.starCentre.toFixed( 1 ) }px.`
			);
			check(
				plate.heroWidth / 2 + plate.columnToken / 2 >= plate.columnRight - 0.5,
				'The plate mask must stay transparent across the whole text column, so the star never sits behind type.'
			);
			check( Math.abs( plate.opacity - 0.45 ) < 0.001, `The plate paints at 45% (got ${ plate.opacity }).` );
			check( Math.abs( rotation( plate.rotate ) ) < 0.5, `The star starts square (rotate ${ plate.rotate }).` );
			await page.screenshot( path.join( captureDir, `${ slug }-imageless-hero.png` ) );
			await page.scrollTo( plate.heroHeight / 2 );
			plate = await page.evaluate( PLATE );
			check( Math.abs( rotation( plate.rotate ) - 45 ) < 1, `Halfway out of the hero the star has turned 45° (rotate ${ plate.rotate }).` );
			await page.scrollTo( plate.heroHeight * 2 );
			plate = await page.evaluate( PLATE );
			check( Math.abs( rotation( plate.rotate ) - 90 ) < 0.5, `Past the hero the star has turned a quarter (rotate ${ plate.rotate }).` );
			await page.media( '', [ { name: 'prefers-reduced-motion', value: 'reduce' } ] );
			await page.scrollTo( plate.heroHeight / 2 );
			plate = await page.evaluate( PLATE );
			check( Math.abs( rotation( plate.rotate ) ) < 0.5, `Under reduced motion the star stays square (rotate ${ plate.rotate }).` );
			await page.media();
		}

		// C print
		await page.scrollTo( 0 );
		await page.media( 'print' );
		const print = await page.evaluate( `(() => {
			const shown = (selector) => Array.from(document.querySelectorAll(selector)).filter((el) => getComputedStyle(el).display !== 'none').length;
			const hero = document.querySelector('.hp-reader-hero');
			return {
				title: getComputedStyle(document.querySelector('.hp-reader-hero__title')).color,
				heroImage: getComputedStyle(hero).backgroundImage,
				heroColour: getComputedStyle(hero).backgroundColor,
				shown: shown('.hp-reader-progress, .hp-toast, .hp-sec__link, .hp-reader-hero__plate, .hp-reader-hero .wp-block-cover__background'),
			};
		})()` );
		check( print.title === 'rgb(0, 0, 0)', `In print the title must be black (got ${ print.title }).` );
		check( print.heroImage === 'none' && /rgba\(0, 0, 0, 0\)|transparent/.test( print.heroColour ), `In print the hero ground must drop (background ${ print.heroColour } ${ print.heroImage }).` );
		check( print.shown === 0, `In print the hairline, toast, § marks, plate and overlay must not show (${ print.shown } visible).` );
		await page.media();

		// B4 at the breakpoint, A3 related columns, and a phone.
		await page.resize( { width: 900, height: 900 } );
		const hiddenAt900 = await page.evaluate( `Array.from(document.querySelectorAll('.hp-sec__link')).every((a) => getComputedStyle(a).display === 'none')` );
		check( hiddenAt900, 'At 900px and below the § marks have no gutter and must not show.' );
		await page.resize( { width: 901, height: 900 } );
		const shownAt901 = await page.evaluate( `Array.from(document.querySelectorAll('.hp-sec__link')).every((a) => getComputedStyle(a).display !== 'none')` );
		check( shownAt901, 'Above 900px the § marks must render.' );

		for ( const [ width, count, rows ] of [ [ 1280, 3, 1 ], [ 924, 3, 1 ], [ 800, 2, 1 ], [ 400, 3, 3 ] ] ) {
			await page.resize( { width, height: 900 } );
			const layout = await page.evaluate( RELATED_LAYOUT );
			if ( ! layout ) {
				console.log( `note: ${ postPath }: no related cards to lay out, so the column checks were skipped.` );
				break;
			}
			const { cards } = layout;
			const tops = new Set( cards.map( ( card ) => card.top ) );
			check(
				cards.length === count && tops.size === rows,
				`At ${ width }px "Continue reading" must show ${ count } card(s) in ${ rows } row(s); got ${ cards.length } in ${ tops.size }.`
			);
			// As on /essays/, the cards take the wide column; a constrained group
			// held them to the 44rem text column, three 213px cards at 1280px.
			check(
				Math.abs( layout.grid - layout.section ) < 1,
				`At ${ width }px "Continue reading" must span its wide section (${ Math.round( layout.section ) }px); the grid is ${ Math.round( layout.grid ) }px.`
			);
			if ( width !== 400 ) {
				await page.evaluate( `document.querySelector('.hp-related').scrollIntoView({ block: 'start' }), true` );
				await page.frames( 2 );
				await page.screenshot( path.join( captureDir, `${ slug }-related-${ width }.png` ) );
			}
		}

		await page.resize( { width: 390, height: 844 } );
		await page.scrollTo( 0 );
		const phone = await page.evaluate( `({
			overflow: document.documentElement.scrollWidth - innerWidth,
			marks: Array.from(document.querySelectorAll('.hp-sec__link')).filter((a) => getComputedStyle(a).display !== 'none').length,
		})` );
		check( phone.overflow <= 0, `At 390px the reader overflows horizontally by ${ phone.overflow }px.` );
		check( phone.marks === 0, 'At 390px no § mark may show.' );
		await page.screenshot( path.join( captureDir, `${ slug }-390.png` ) );

		check( page.readerErrors.length === 0, `reader.js threw: ${ page.readerErrors.join( ' | ' ) }` );
	} finally {
		await page.close();
	}

	// A shared link lands on a marked heading.
	const first = await ( async () => {
		const probe = await openPage( cdp, DESKTOP );
		try {
			await probe.load( url );
			const id = await probe.evaluate( `(document.querySelector('.hp-prose .hp-sec > h2') || {}).id || null` );
			if ( ! id ) {
				return null;
			}
			await probe.load( new URL( `#${ id }`, url ).href );
			const landed = await probe.evaluate( FIRST_MARK );
			const clearance = await probe.evaluate( `(() => {
				const header = document.querySelector('header.wp-block-template-part');
				return header ? header.getBoundingClientRect().bottom : 0;
			})()` );
			return { landed, clearance };
		} finally {
			await probe.close();
		}
	} )();
	if ( first ) {
		check( first.landed.color === TEXT_ACCENT && first.landed.opacity === 1, `Opening a § address must mark its § in text-accent (color ${ first.landed.color }, opacity ${ first.landed.opacity }).` );
		check( first.landed.heading.top >= first.clearance, `A shared § address must land its heading clear of the sticky masthead (heading top ${ Math.round( first.landed.heading.top ) }px, masthead bottom ${ Math.round( first.clearance ) }px).` );
	}

	// A4: no hover means an always-visible mark.
	const touch = await openPage( cdp, DESKTOP, { touch: true } );
	try {
		await touch.load( url );
		const touchState = await touch.evaluate( `({ hoverNone: matchMedia('(hover: none)').matches, mark: ${ FIRST_MARK } })` );
		if ( ! touchState.mark ) {
			// No sections on this post.
		} else if ( touchState.hoverNone ) {
			check( touchState.mark.opacity === 1, `On a device without hover the § must always show (opacity ${ touchState.mark.opacity }).` );
		} else {
			console.log( `note: ${ postPath }: touch emulation did not switch (hover) off in this Chrome, so A4 was not observed.` );
		}
	} finally {
		await touch.close();
	}
}

async function discoverPosts( cdp ) {
	if ( URL_ARG ) {
		return [ new URL( URL_ARG, ORIGIN ).pathname ];
	}
	const page = await openPage( cdp, DESKTOP );
	try {
		await page.load( new URL( '/essays/', ORIGIN ).href );
		const hrefs = await page.evaluate( `Array.from(document.querySelectorAll('.hp-postcards .hp-postcard__title a[href]'), (a) => a.getAttribute('href'))` );
		const paths = [];
		for ( const href of hrefs ) {
			const found = selectJournalRoute( [ href ], ORIGIN, { kind: 'post' } );
			assert( ! found.violations.length, found.violations.join( ' ' ) );
			if ( found.path && ! paths.includes( found.path ) ) {
				paths.push( found.path );
			}
		}
		return paths.slice( 0, MAX_POSTS );
	} finally {
		await page.close();
	}
}

async function main() {
	const captureRoot = process.env.HPERKINS_CAPTURE_DIR ? path.resolve( process.env.HPERKINS_CAPTURE_DIR ) : os.tmpdir();
	await fsPromises.mkdir( captureRoot, { recursive: true } );
	const captureDir = await fsPromises.mkdtemp( path.join( captureRoot, 'hperkins-reader-' ) );
	const violations = [];
	let checked = [];

	await withChrome( async ( cdp ) => {
		checked = await discoverPosts( cdp );
		if ( ! checked.length ) {
			console.log( 'note: /essays/ published no posts, so the reader was not audited this run.' );
			return;
		}
		for ( const postPath of checked ) {
			await verifyPost( cdp, postPath, captureDir, violations );
		}
	} );

	if ( violations.length ) {
		violations.forEach( ( violation ) => console.error( `essay reader: ${ violation }` ) );
		console.error( `${ violations.length } violation(s). Screenshots: ${ captureDir }` );
		process.exit( 1 );
	}
	console.log( `verified essay reader on ${ checked.join( ', ' ) || 'no posts' } (A1–A4, B1–B5, C). Screenshots: ${ captureDir }` );
}

main().catch( ( error ) => {
	console.error( error );
	process.exit( 1 );
} );
