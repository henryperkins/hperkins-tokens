#!/usr/bin/env node
/**
 * Rendered journal contract for /essays/ and every postcard loop.
 *
 * - The masthead clamp and overflow at 390/320px.
 * - Postcard titles (2026-10-06 hand-off, A1): the type sits on the heading,
 *   so a wrapped title's lines and box follow the heading's own leading in the
 *   featured lead, the rail, the grid, "Continue reading" and a term archive.
 * - The featured band (A2): 1.5fr / 1fr from 1181px, equal columns from 901 to
 *   1180px with the lead over both rows, one column from 782 to 900px with
 *   horizontal secondaries, and the stacked phone layout from 781px down.
 * - The compass-star plate (A3): one plate per card, as the media group's last
 *   child; at rest exactly where the old `background-position` star sat, in
 *   the same four treatments; a featured image still hides it; and a quarter
 *   turn on card hover and title focus over dur.slow with ease.calm, which
 *   reduced motion stills.
 *
 * Posts are simulated in the page (three featured, three grid, long titles, no
 * featured images) so the checks never depend on what the site has published.
 *
 * Usage: node scripts/verify-journal-polish.js   (HPERKINS_ORIGIN, CHROME_BIN)
 */
const { spawn } = require( 'node:child_process' );
const fs = require( 'node:fs/promises' );
const os = require( 'node:os' );
const path = require( 'node:path' );

const { selectJournalRoute } = require( './lib/journal-route-discovery' );
const { getOrigin } = require( './lib/site-url' );

const CHROME = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const ORIGIN = getOrigin();
const THEME_PATH = path.join( __dirname, '..' );
const VIEWPORTS = [
	{ width: 390, height: 1100, maxTitlePx: 68, maxTitleHeight: 360 },
	{ width: 320, height: 1100, maxTitlePx: 64, maxTitleHeight: 420 },
];
const FEATURED_TITLES = [
	'Expose, govern, attest: three rings of trust for the AI stack',
	'The Shape of a Reversible Decision in a Governed System',
	'A Ledger Before a Promise, and a Promise Kept in Public',
];
const GRID_TITLES = [
	'AI Governance as an Operating Rhythm for Small Teams',
	'What Approval Should Feel Like When the Work Is Real',
	'Signals Worth Keeping After the Launch Is Over',
];
// The star's four placements, exactly the background-position, background-size
// and mask values .hp-postcard__media::after carried before the plate became
// its own element. Pinned here so "no plate moves" stays checkable.
const PLATE_TREATMENTS = {
	rest: { x: 118, y: 50, size: 62, mask: 'linear-gradient(105deg, rgba(0, 0, 0, 0) 2%, rgb(0, 0, 0) 52%)' },
	grid1: { x: 118, y: 44, size: 62, mask: 'linear-gradient(105deg, rgba(0, 0, 0, 0) 2%, rgb(0, 0, 0) 52%)' },
	grid2: { x: 88, y: 54, size: 54, mask: 'linear-gradient(95deg, rgba(0, 0, 0, 0) 4%, rgb(0, 0, 0) 58%)' },
	grid3: { x: 134, y: 39, size: 72, mask: 'linear-gradient(115deg, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 48%)' },
};
const PLATE_TURN_MS = 420;
const BAND_WIDTHS = [ 1440, 1280, 1181, 1180, 1100, 950, 901, 900, 850, 800, 782, 781 ];

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function approximately( value, expected, tolerance ) {
	return Math.abs( value - expected ) <= tolerance;
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

async function openPage( cdp, { width, height, route = '/essays/' } ) {
	const target = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
	const attached = await cdp.send( 'Target.attachToTarget', {
		targetId: target.targetId,
		flatten: true,
	} );
	const sessionId = attached.sessionId;

	await cdp.send( 'Page.enable', {}, sessionId );
	await cdp.send( 'Runtime.enable', {}, sessionId );
	await resize( cdp, sessionId, width, height );

	const loaded = cdp.once( 'Page.loadEventFired', sessionId );
	await cdp.send( 'Page.navigate', { url: new URL( route, ORIGIN ).href }, sessionId );
	await loaded;
	await cdp.send( 'Runtime.evaluate', { expression: 'document.fonts && document.fonts.ready', awaitPromise: true }, sessionId );
	await wait( 250 );

	return {
		sessionId,
		close: () => cdp.send( 'Target.closeTarget', { targetId: target.targetId } ),
	};
}

async function resize( cdp, sessionId, width, height ) {
	await cdp.send( 'Emulation.setDeviceMetricsOverride', {
		width,
		height,
		deviceScaleFactor: 1,
		mobile: false,
	}, sessionId );
}

async function evaluate( cdp, sessionId, expression ) {
	const evaluated = await cdp.send( 'Runtime.evaluate', {
		expression,
		awaitPromise: true,
		returnByValue: true,
	}, sessionId );
	assert( ! evaluated.exceptionDetails, `In-page evaluation threw: ${ JSON.stringify( evaluated.exceptionDetails ) }` );
	return evaluated.result.value;
}

async function movePointer( cdp, sessionId, x, y ) {
	await cdp.send( 'Input.dispatchMouseEvent', {
		type: 'mouseMoved', x, y, button: 'none', buttons: 0, pointerType: 'mouse',
	}, sessionId );
}

async function pressTab( cdp, sessionId ) {
	for ( const type of [ 'keyDown', 'keyUp' ] ) {
		await cdp.send( 'Input.dispatchKeyEvent', {
			type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9,
		}, sessionId );
	}
}

async function setReducedMotion( cdp, sessionId, reduce ) {
	await cdp.send( 'Emulation.setEmulatedMedia', {
		media: 'screen',
		features: [ { name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' } ],
	}, sessionId );
}

// Three featured and three grid cards with long titles and no featured images,
// cloned from the first published card, so every check runs on the same
// composition whatever the site holds. Only the image figure is removed: the
// server-rendered plate stays where inc/postcards.php put it.
const SIMULATE_JOURNAL = `(() => {
	const FEATURED_TITLES = ${ JSON.stringify( FEATURED_TITLES ) };
	const GRID_TITLES = ${ JSON.stringify( GRID_TITLES ) };
	const featured = document.querySelector('.hp-journal-featured .wp-block-post-template');
	const source = featured && featured.querySelector(':scope > li');
	const gridWrap = document.querySelector('.hp-journal-grid');
	if (!featured || !source || !gridWrap) {
		return { ok: false };
	}
	const unframe = (li) => li.querySelectorAll('.hp-postcard__media .wp-block-post-featured-image').forEach((figure) => figure.remove());
	const retitle = (li, text) => {
		const link = li.querySelector('.hp-postcard__title a');
		if (link) link.textContent = text;
	};
	while (featured.children.length < 3) {
		featured.appendChild(source.cloneNode(true));
	}
	Array.from(featured.children).forEach((li, index) => {
		retitle(li, FEATURED_TITLES[index % FEATURED_TITLES.length]);
		unframe(li);
	});
	let grid = gridWrap.querySelector('.wp-block-post-template');
	if (!grid) {
		grid = document.createElement('ul');
		grid.className = 'wp-block-post-template is-layout-grid wp-block-post-template-is-layout-grid';
		grid.style.display = 'grid';
		grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(min(17rem, 100%), 1fr))';
		grid.style.gap = 'var(--wp--preset--spacing--6)';
		grid.style.listStyle = 'none';
		grid.style.margin = '0';
		grid.style.padding = '0';
		gridWrap.insertBefore(grid, gridWrap.firstChild);
	}
	grid.innerHTML = '';
	GRID_TITLES.forEach((title) => {
		const li = source.cloneNode(true);
		// The grid loop renders h3 titles.
		const heading = li.querySelector('.hp-postcard__title');
		if (heading && heading.tagName !== 'H3') {
			const h3 = document.createElement('h3');
			h3.className = heading.className;
			h3.innerHTML = heading.innerHTML;
			heading.replaceWith(h3);
		}
		retitle(li, title);
		unframe(li);
		grid.appendChild(li);
	});
	return { ok: true };
})()`;

// Every postcard title on the page, with its heading's and link's type, the
// line pitch of its wrapped text, and its box height.
const TITLE_PROBE = `(() => {
	const token = (name) => {
		const probe = document.createElement('span');
		probe.style.fontSize = 'var(' + name + ')';
		document.body.appendChild(probe);
		const size = parseFloat(getComputedStyle(probe).fontSize);
		probe.remove();
		return size;
	};
	const lineTops = (element) => {
		const range = document.createRange();
		range.selectNodeContents(element);
		const tops = [];
		for (const box of range.getClientRects()) {
			if (box.width < 1) continue;
			if (!tops.some((top) => Math.abs(top - box.top) < 0.5)) tops.push(box.top);
		}
		return tops.sort((a, b) => a - b);
	};
	return {
		tokens: {
			lg: token('--wp--preset--font-size--lg'),
			xl: token('--wp--preset--font-size--xl'),
			xl2: token('--wp--preset--font-size--2-xl'),
			xl3: token('--wp--preset--font-size--3-xl'),
		},
		titles: Array.from(document.querySelectorAll('.hp-postcards .hp-postcard__title')).map((heading) => {
			const link = heading.querySelector('a');
			const li = heading.closest('li');
			const tops = lineTops(link);
			const h = getComputedStyle(heading);
			const a = getComputedStyle(link);
			return {
				loop: heading.closest('.hp-journal-featured') ? 'featured' : heading.closest('.hp-related') ? 'related' : 'grid',
				index: li ? Array.prototype.indexOf.call(li.parentElement.children, li) + 1 : 0,
				headingSize: parseFloat(h.fontSize),
				headingLeading: parseFloat(h.lineHeight),
				linkSize: parseFloat(a.fontSize),
				linkLeading: parseFloat(a.lineHeight),
				lines: tops.length,
				pitches: tops.slice(1).map((top, i) => top - tops[i]),
				box: heading.getBoundingClientRect().height,
			};
		}),
	};
})()`;

function verifyTitles( probe, context, { featured = true } = {} ) {
	assert( probe.titles.length > 0, `${ context }: no postcard titles to measure.` );
	for ( const title of probe.titles ) {
		const label = `${ context } ${ title.loop } card ${ title.index }`;
		// The link inherits the heading's type, so the heading reports it.
		assert(
			approximately( title.linkSize, title.headingSize, 0.01 ) && approximately( title.linkLeading, title.headingLeading, 0.01 ),
			`${ label }: the heading sets ${ title.headingSize }px/${ title.headingLeading }px but its link ${ title.linkSize }px/${ title.linkLeading }px; the type belongs on the heading.`
		);
		assert( title.lines >= 2, `${ label }: the simulated title did not wrap (${ title.lines } line), so its leading went unchecked.` );
		for ( const pitch of title.pitches ) {
			assert(
				approximately( pitch, title.headingLeading, 0.5 ),
				`${ label }: wrapped lines sit ${ pitch.toFixed( 2 ) }px apart; expected the heading's ${ title.headingLeading }px line height.`
			);
		}
		// No strut slack: the box is its lines and nothing more.
		assert(
			approximately( title.box, title.lines * title.headingLeading, 1 ),
			`${ label }: the title box is ${ title.box.toFixed( 2 ) }px for ${ title.lines } lines of ${ title.headingLeading }px.`
		);
		const ratio = title.headingLeading / title.headingSize;
		if ( title.loop === 'featured' ) {
			assert( featured, `${ label }: unexpected featured card.` );
			assert( approximately( ratio, 1.1, 0.005 ), `${ label }: featured titles lead at ${ ratio.toFixed( 3 ) }; expected 1.1.` );
		} else {
			assert( approximately( title.headingSize, probe.tokens.xl, 0.05 ), `${ label }: title is ${ title.headingSize }px; expected the ${ probe.tokens.xl }px xl preset.` );
			assert( approximately( ratio, 1.15, 0.005 ), `${ label }: title leads at ${ ratio.toFixed( 3 ) }; expected 1.15.` );
		}
	}
}

async function verifyTitleType( cdp ) {
	const page = await openPage( cdp, { width: 1280, height: 1000 } );
	try {
		const simulated = await evaluate( cdp, page.sessionId, SIMULATE_JOURNAL );
		assert( simulated.ok, 'Could not simulate the journal for the title checks.' );
		for ( const width of [ 1280, 900, 390 ] ) {
			await resize( cdp, page.sessionId, width, 1000 );
			await wait( 150 );
			const probe = await evaluate( cdp, page.sessionId, TITLE_PROBE );
			verifyTitles( probe, `/essays/ at ${ width }px` );
			const featured = probe.titles.filter( ( title ) => title.loop === 'featured' );
			const expected = width >= 782
				? [ probe.tokens.xl3, probe.tokens.lg, probe.tokens.lg ]
				: [ probe.tokens.xl2, probe.tokens.xl2, probe.tokens.xl2 ];
			featured.forEach( ( title, index ) => {
				assert(
					approximately( title.headingSize, expected[ index ], 0.05 ),
					`/essays/ at ${ width }px featured card ${ index + 1 } title is ${ title.headingSize }px; expected ${ expected[ index ] }px.`
				);
			} );
			console.log( `checked postcard titles on /essays/ at ${ width }px: ${ probe.titles.length } titles set on their headings` );
		}

		// "Continue reading" and a term archive, discovered from the journal.
		const hrefs = await evaluate( cdp, page.sessionId, `({
			posts: Array.from(document.querySelectorAll('.hp-postcards .hp-postcard__title a[href]'), (a) => a.getAttribute('href')),
			topics: Array.from(document.querySelectorAll('.hp-postcards .hp-postcard__topic a[href]'), (a) => a.getAttribute('href')),
		})` );
		const post = selectJournalRoute( hrefs.posts, ORIGIN, { kind: 'postcard' } );
		const topic = selectJournalRoute( hrefs.topics, ORIGIN, { kind: 'topic' } );
		assert( post.path, `/essays/ links no same-origin post: ${ post.violations.join( ' ' ) }` );
		assert( topic.path, `/essays/ links no same-origin topic archive: ${ topic.violations.join( ' ' ) }` );
		for ( const route of [ post.path, topic.path ] ) {
			const other = await openPage( cdp, { width: 1280, height: 1000, route } );
			try {
				const count = await evaluate( cdp, other.sessionId, `(() => {
					const titles = ${ JSON.stringify( GRID_TITLES ) };
					const links = document.querySelectorAll('.hp-postcards .hp-postcard__title a');
					links.forEach((link, index) => { link.textContent = titles[index % titles.length]; });
					return links.length;
				})()` );
				if ( count === 0 ) {
					// A single-post site has nothing to continue reading.
					console.log( `skipped postcard titles on ${ route }: the loop is empty` );
					continue;
				}
				const probe = await evaluate( cdp, other.sessionId, TITLE_PROBE );
				verifyTitles( probe, route, { featured: false } );
				console.log( `checked postcard titles on ${ route }: ${ probe.titles.length } titles set on their headings` );
			} finally {
				await other.close();
			}
		}
	} finally {
		await page.close();
	}
}

async function verifyFeaturedBands( cdp ) {
	const page = await openPage( cdp, { width: 1280, height: 1000 } );
	try {
		const simulated = await evaluate( cdp, page.sessionId, SIMULATE_JOURNAL );
		assert( simulated.ok, 'Could not simulate the featured band.' );
		for ( const width of BAND_WIDTHS ) {
			await resize( cdp, page.sessionId, width, 1000 );
			await wait( 150 );
			const band = await evaluate( cdp, page.sessionId, `(() => {
				const list = document.querySelector('.hp-journal-featured .wp-block-post-template');
				return {
					clientWidth: document.documentElement.clientWidth,
					scrollWidth: document.documentElement.scrollWidth,
					columns: getComputedStyle(list).gridTemplateColumns.split(' ').map(parseFloat),
					cards: Array.from(list.children).map((li) => {
						const box = li.getBoundingClientRect();
						return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, direction: getComputedStyle(li).flexDirection };
					}),
				};
			})()` );
			const [ lead, second, third ] = band.cards;
			const context = `featured band at ${ width }px`;
			assert( band.cards.length === 3, `${ context }: expected three simulated cards, got ${ band.cards.length }.` );
			assert( band.scrollWidth <= band.clientWidth + 1, `${ context }: /essays/ overflows horizontally.` );
			if ( width >= 782 && width <= 900 ) {
				// One column: the lead first, the secondaries horizontal at full width.
				assert( band.columns.length === 1, `${ context }: expected one column, got ${ band.columns.join( ' / ' ) }px.` );
				assert( lead.top < second.top && second.top < third.top, `${ context }: the cards are not stacked lead first.` );
				assert(
					band.cards.every( ( card ) => approximately( card.left, lead.left, 1 ) && approximately( card.width, lead.width, 1 ) ),
					`${ context }: the cards do not share the full width.`
				);
				assert(
					second.direction === 'row' && third.direction === 'row',
					`${ context }: the secondaries must stay horizontal (${ second.direction }, ${ third.direction }).`
				);
			} else if ( width >= 782 ) {
				const [ leadColumn, railColumn ] = band.columns;
				assert( band.columns.length === 2, `${ context }: expected two columns, got ${ band.columns.join( ' / ' ) }px.` );
				const ratio = leadColumn / railColumn;
				assert(
					width >= 1181 ? approximately( ratio, 1.5, 0.01 ) : approximately( ratio, 1, 0.01 ),
					`${ context }: columns are ${ band.columns.map( ( column ) => column.toFixed( 1 ) ).join( ' / ' ) }px (${ ratio.toFixed( 2 ) }:1); expected ${ width >= 1181 ? '1.5:1' : 'two equal columns' }.`
				);
				// The lead spans both rows: as tall as both secondaries plus the gap.
				assert(
					second.left > lead.right && third.left > lead.right && approximately( lead.bottom, third.bottom, 1 ) && lead.top <= second.top + 1,
					`${ context }: the lead does not span both rows beside the secondaries.`
				);
				assert(
					second.direction === 'row' && third.direction === 'row',
					`${ context }: the secondaries must be horizontal (${ second.direction }, ${ third.direction }).`
				);
			} else {
				assert( band.columns.length === 1, `${ context }: expected one column, got ${ band.columns.join( ' / ' ) }px.` );
				assert(
					second.direction === 'column' && third.direction === 'column',
					`${ context }: the phone layout stacks every card vertically (${ second.direction }, ${ third.direction }).`
				);
			}
			console.log( `checked ${ context }: ${ band.columns.map( ( column ) => column.toFixed( 1 ) ).join( ' / ' ) }px` );
		}
	} finally {
		await page.close();
	}
}

const PLATE_PROBE = `(() => {
	const percent = (value) => parseFloat(value) / 100;
	const root = getComputedStyle(document.documentElement);
	return {
		tokens: {
			slow: root.getPropertyValue('--wp--custom--dur--slow').trim(),
			calm: root.getPropertyValue('--wp--custom--ease--calm').trim(),
		},
		plates: Array.from(document.querySelectorAll('.hp-postcards .hp-postcard__media')).map((media) => {
			const li = media.closest('li');
			const plate = media.querySelector(':scope > .hp-postcard__plate');
			const entry = {
				loop: media.closest('.hp-journal-featured') ? 'featured' : 'grid',
				index: Array.prototype.indexOf.call(li.parentElement.children, li) + 1,
				plates: media.querySelectorAll('.hp-postcard__plate').length,
				last: media.lastElementChild === plate,
				mediaStar: getComputedStyle(media, '::after').content,
			};
			if (!plate) return entry;
			const style = getComputedStyle(plate);
			const star = getComputedStyle(plate, '::after');
			const box = media.getBoundingClientRect();
			const own = plate.getBoundingClientRect();
			const width = parseFloat(star.width);
			const height = parseFloat(star.height);
			const [tx = '0%', ty = '0%'] = star.translate === 'none' ? [] : star.translate.split(' ');
			const x = percent(style.getPropertyValue('--hp-plate-x'));
			const y = percent(style.getPropertyValue('--hp-plate-y'));
			// background-position: p% puts a W-wide image's left edge at (C - W) * p%.
			// left: p% then translate: -p% lands the same edge at p% * C - p% * W.
			return {
				...entry,
				x: parseFloat(style.getPropertyValue('--hp-plate-x')),
				y: parseFloat(style.getPropertyValue('--hp-plate-y')),
				size: parseFloat(style.getPropertyValue('--hp-plate-size')),
				mask: style.maskImage || style.webkitMaskImage,
				fillsMedia: Math.abs(own.left - box.left) < 0.5 && Math.abs(own.top - box.top) < 0.5 && Math.abs(own.width - box.width) < 0.5 && Math.abs(own.height - box.height) < 0.5,
				star: star.content,
				art: star.backgroundImage.startsWith('url("data:image/svg+xml'),
				widthShare: width / box.width,
				square: Math.abs(width - height),
				leftDrift: parseFloat(star.left) + percent(tx) * width - (box.width - width) * x,
				topDrift: parseFloat(star.top) + percent(ty) * height - (box.height - height) * y,
				rotate: star.rotate,
				transition: { property: star.transitionProperty, duration: star.transitionDuration, timing: star.transitionTimingFunction },
			};
		}),
	};
})()`;

function milliseconds( value ) {
	const number = Number.parseFloat( value ) || 0;
	return String( value ).trim().endsWith( 'ms' ) ? number : number * 1000;
}

async function readTurns( cdp, sessionId ) {
	return evaluate( cdp, sessionId, `Array.from(document.querySelectorAll('.hp-postcards .hp-postcard__plate'), (plate) => getComputedStyle(plate, '::after').rotate)` );
}

async function cardCentre( cdp, sessionId, selector ) {
	return evaluate( cdp, sessionId, `(() => {
		const card = document.querySelector(${ JSON.stringify( selector ) });
		card.scrollIntoView({ block: 'center' });
		const box = card.getBoundingClientRect();
		return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
	})()` );
}

// Two screenshots of one media box, with and without its plate showing.
async function plateChangesPixels( cdp, sessionId, selector ) {
	const clip = await evaluate( cdp, sessionId, `(async () => {
		const media = document.querySelector(${ JSON.stringify( selector ) });
		media.scrollIntoView({ block: 'center' });
		await Promise.all(Array.from(media.querySelectorAll('img'), (img) => img.decode().catch(() => {})));
		const box = media.getBoundingClientRect();
		return { x: Math.ceil(box.left + scrollX), y: Math.ceil(box.top + scrollY), width: Math.floor(box.width) - 1, height: Math.floor(box.height) - 1, scale: 1 };
	})()` );
	const shoot = async () => ( await cdp.send( 'Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true }, sessionId ) ).data;
	const toggle = ( display ) => evaluate( cdp, sessionId, `document.querySelector(${ JSON.stringify( selector ) }).querySelector('.hp-postcard__plate').style.display = ${ JSON.stringify( display ) }` );
	await wait( 100 );
	const shown = await shoot();
	await toggle( 'none' );
	await wait( 100 );
	const hidden = await shoot();
	await toggle( '' );
	return shown !== hidden;
}

async function verifyPlates( cdp ) {
	const page = await openPage( cdp, { width: 1280, height: 1000 } );
	const { sessionId } = page;
	try {
		const simulated = await evaluate( cdp, sessionId, SIMULATE_JOURNAL );
		assert( simulated.ok, 'Could not create the simulated journal grid.' );
		await movePointer( cdp, sessionId, 4, 4 );
		await wait( 100 );
		const probe = await evaluate( cdp, sessionId, PLATE_PROBE );
		assert( probe.plates.length === 6, `Expected six simulated postcards, found ${ probe.plates.length }.` );

		const turnMs = milliseconds( probe.tokens.slow );
		assert( turnMs === PLATE_TURN_MS, `--wp--custom--dur--slow is ${ probe.tokens.slow }; the plate's turn expects ${ PLATE_TURN_MS }ms.` );
		const signatures = new Set();
		for ( const plate of probe.plates ) {
			const label = `${ plate.loop } card ${ plate.index }`;
			assert(
				plate.plates === 1 && plate.last,
				`${ label } must carry exactly one plate as its media group's last child (found ${ plate.plates }, last: ${ plate.last }).`
			);
			// Exactly one star: the media group no longer paints its own, even
			// under a stale inlined copy of the old rule.
			assert( plate.mediaStar === 'none', `${ label } still paints a star on .hp-postcard__media::after.` );
			assert( plate.fillsMedia, `${ label } plate does not cover its media box.` );
			assert( plate.star === '""' && plate.art, `${ label } plate draws no compass star.` );
			const treatment = plate.loop === 'grid' ? PLATE_TREATMENTS[ `grid${ ( ( plate.index - 1 ) % 3 ) + 1 }` ] : PLATE_TREATMENTS.rest;
			assert(
				plate.x === treatment.x && plate.y === treatment.y && plate.size === treatment.size && plate.mask === treatment.mask,
				`${ label } plate is placed at ${ plate.x }% ${ plate.y }% × ${ plate.size }% under ${ plate.mask }; expected ${ treatment.x }% ${ treatment.y }% × ${ treatment.size }% under ${ treatment.mask }.`
			);
			assert(
				approximately( plate.widthShare, treatment.size / 100, 0.001 ) && plate.square < 0.01,
				`${ label } star is not a ${ treatment.size }%-wide square (width share ${ plate.widthShare.toFixed( 4 ) }, ${ plate.square.toFixed( 3 ) }px off square).`
			);
			assert(
				Math.abs( plate.leftDrift ) < 0.05 && Math.abs( plate.topDrift ) < 0.05,
				`${ label } star moved ${ plate.leftDrift.toFixed( 3 ) }px, ${ plate.topDrift.toFixed( 3 ) }px from where background-position put it.`
			);
			assert( plate.rotate === 'none', `${ label } star rests turned (${ plate.rotate }).` );
			assert(
				plate.transition.property === 'rotate' && milliseconds( plate.transition.duration ) === turnMs &&
					plate.transition.timing.replace( /\s+/g, '' ) === probe.tokens.calm.replace( /\s+/g, '' ),
				`${ label } star turns over ${ plate.transition.property } ${ plate.transition.duration } ${ plate.transition.timing }; expected rotate over dur.slow (${ probe.tokens.slow }) with ease.calm (${ probe.tokens.calm }).`
			);
			signatures.add( `${ plate.loop }:${ plate.x }|${ plate.y }|${ plate.size }|${ plate.mask }` );
		}
		// Without JavaScript, Jetpack Boost's inlined critical CSS stays on beside
		// the full sheet, and until it is regenerated it paints the old star.
		const staleCopy = await evaluate( cdp, sessionId, `(() => {
			const critical = document.getElementById('jetpack-boost-critical-css');
			if (!critical) return null;
			const media = critical.media;
			critical.media = 'all';
			const stars = Array.from(document.querySelectorAll('.hp-postcards .hp-postcard__media'), (box) => getComputedStyle(box, '::after').content);
			critical.media = media;
			return stars;
		})()` );
		assert(
			! staleCopy || staleCopy.every( ( content ) => content === 'none' ),
			`With Jetpack Boost's critical CSS left on, as without JavaScript, a card paints a second star: ${ JSON.stringify( staleCopy ) }.`
		);
		const gridSignatures = [ ...signatures ].filter( ( signature ) => signature.startsWith( 'grid:' ) );
		const featuredSignatures = [ ...signatures ].filter( ( signature ) => signature.startsWith( 'featured:' ) );
		assert( gridSignatures.length === 3, `Expected three distinct grid plate treatments; found ${ gridSignatures.length }.` );
		assert( featuredSignatures.length === 1, 'Featured plates should keep one consistent treatment.' );
		console.log( `checked simulated plates at rest: ${ gridSignatures.length } grid treatments, ${ featuredSignatures.length } featured treatment, each where background-position put it` );

		// A featured image still hides the star; with none, the plate shows.
		assert(
			await plateChangesPixels( cdp, sessionId, '.hp-journal-grid .wp-block-post-template > li:nth-child(2) .hp-postcard__media' ),
			'An image-less card looks the same with and without its plate: the star is not drawn.'
		);
		await evaluate( cdp, sessionId, `(() => {
			const media = document.querySelector('.hp-journal-featured .wp-block-post-template > li:first-child .hp-postcard__media');
			const figure = document.createElement('figure');
			figure.className = 'wp-block-post-featured-image';
			figure.innerHTML = '<img class="wp-post-image" alt="" src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%279%27%3E%3Crect width=%2716%27 height=%279%27 fill=%27%23556b5d%27/%3E%3C/svg%3E">';
			media.insertBefore(figure, media.firstChild);
		})()` );
		assert(
			! await plateChangesPixels( cdp, sessionId, '.hp-journal-featured .wp-block-post-template > li:first-child .hp-postcard__media' ),
			'A featured image no longer hides the star: the plate shows through.'
		);
		// Behind a figure the plate is no longer the first child, so flow layout
		// hands it a block-gap margin that would push it off the box.
		const behindImage = ( await evaluate( cdp, sessionId, PLATE_PROBE ) ).plates[ 0 ];
		assert(
			behindImage.last && behindImage.fillsMedia,
			'Behind a featured image the plate must stay the last child and still cover its media box.'
		);
		console.log( 'checked plate stacking: a featured image hides the star' );

		// A quarter turn on card hover, for featured and grid cards alike.
		for ( const [ selector, index ] of [
			[ '.hp-journal-grid .wp-block-post-template > li:nth-child(2)', 4 ],
			[ '.hp-journal-featured .wp-block-post-template > li:nth-child(3)', 2 ],
		] ) {
			const centre = await cardCentre( cdp, sessionId, selector );
			await movePointer( cdp, sessionId, centre.x, centre.y );
			await wait( PLATE_TURN_MS + 180 );
			const turned = await readTurns( cdp, sessionId );
			assert(
				turned[ index ] === '90deg' && turned.every( ( turn, other ) => other === index || turn === 'none' ),
				`Hovering ${ selector } must turn its star alone a quarter: ${ JSON.stringify( turned ) }.`
			);
			await movePointer( cdp, sessionId, 4, 4 );
			await wait( PLATE_TURN_MS + 180 );
			const settled = await readTurns( cdp, sessionId );
			assert( settled.every( ( turn ) => turn === 'none' ), `Stars stayed turned after the pointer left: ${ JSON.stringify( settled ) }.` );
		}

		// The title link is the card's one tab stop, so its focus turns the star.
		// A keypress first, so the scripted focus counts as keyboard focus.
		await pressTab( cdp, sessionId );
		await evaluate( cdp, sessionId, `document.querySelector('.hp-journal-grid .wp-block-post-template > li:nth-child(3) .hp-postcard__title a').focus()` );
		await wait( PLATE_TURN_MS + 180 );
		const focused = await readTurns( cdp, sessionId );
		assert(
			focused[ 5 ] === '90deg' && focused.slice( 0, 5 ).every( ( turn ) => turn === 'none' ),
			`Keyboard focus on a title must turn its card's star alone a quarter: ${ JSON.stringify( focused ) }.`
		);
		await evaluate( cdp, sessionId, 'document.activeElement && document.activeElement.blur()' );
		await wait( PLATE_TURN_MS + 180 );
		console.log( 'checked plate turn: a quarter on hover and on title focus, alone, settling back' );

		// Reduced motion stills the star, hovered or focused.
		await setReducedMotion( cdp, sessionId, true );
		const centre = await cardCentre( cdp, sessionId, '.hp-journal-grid .wp-block-post-template > li:nth-child(1)' );
		await movePointer( cdp, sessionId, centre.x, centre.y );
		await pressTab( cdp, sessionId );
		await evaluate( cdp, sessionId, `document.querySelector('.hp-journal-grid .wp-block-post-template > li:nth-child(2) .hp-postcard__title a').focus()` );
		await wait( 200 );
		const still = await evaluate( cdp, sessionId, `Array.from(document.querySelectorAll('.hp-postcards .hp-postcard__plate'), (plate) => {
			const star = getComputedStyle(plate, '::after');
			return { rotate: star.rotate, duration: star.transitionDuration };
		})` );
		// The site-wide reduced-motion rule leaves a 0.01ms duration: still.
		assert(
			still.every( ( star ) => star.rotate === 'none' && milliseconds( star.duration ) <= 1 ),
			`Reduced motion still turns a star: ${ JSON.stringify( still ) }.`
		);
		console.log( 'checked plate turn under reduced motion: nothing turns' );
	} finally {
		await page.close();
	}
}

async function inspectJournalPage( cdp, viewport ) {
	const page = await openPage( cdp, viewport );

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

	try {
		return await evaluate( cdp, page.sessionId, expression );
	} finally {
		await page.close();
	}
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
			new RegExp( `\\.hp-journal-grid[^{}]*nth-child\\(${ variant }\\)[^{}]*\\.hp-postcard__plate\\s*\\{[^}]*--hp-plate-y` ).test( css ),
			`Journal grid plates must set a placement for nth-child(${ variant.replace( '\\+', '+' ) }); the values are asserted live below.`
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

		await verifyTitleType( cdp );
		await verifyFeaturedBands( cdp );
		await verifyPlates( cdp );
	} );
}

main().catch( ( error ) => {
	console.error( error.message );
	process.exit( 1 );
} );
