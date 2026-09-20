#!/usr/bin/env node

/*
 * Theme search adapter regression, not a substitute for a live Jetpack check.
 * The fixture is anonymous Jetpack 15aceed9 markup captured 2026-09-20, reduced
 * to two original result cards. Its styles are the actual pinned public plugin
 * and Assembler styles, fetched without cookies. Only plugin-owned transitions
 * are emulated: mounting, query/results, clear, modal-filter toggle and close.
 * All theme behavior comes from the real local CSS and enhancement scripts.
 *
 * node scripts/verify-search.js
 * node scripts/verify-search.js --baseline  # HEAD CSS, no adapter; expected red
 * HPERKINS_CAPTURE_DIR selects evidence output. No WordPress writes or API mocks.
 */

const assert = require( 'node:assert/strict' );
const { execFileSync } = require( 'node:child_process' );
const fs = require( 'node:fs' );
const http = require( 'node:http' );
const path = require( 'node:path' );
const { withChrome, evaluate, pressKey, wait } = require( './lib/search-browser' );

const ROOT = path.join( __dirname, '..' );
const BASELINE = process.argv.includes( '--baseline' );
const NAVIGATION_ONLY = process.argv.includes( '--navigation-only' );
const CAPTURE_DIR = process.env.HPERKINS_CAPTURE_DIR || path.join( ROOT, 'output', 'search-regression', ( BASELINE ? 'baseline' : 'candidate' ) + ( NAVIGATION_ONLY ? '-navigation' : '' ) );
const UPSTREAM = {
	jetpack: 'https://hperkins.blog/wp-content/plugins/jetpack/jetpack_vendor/automattic/jetpack-search/build/instant-search/jp-search.chunk-main-payload.css?minify=false&ver=b7564314fc3fe5ac70f3',
	parent: 'https://hperkins.blog/wp-content/themes/assembler/style.css?ver=0.0.121',
	hooks: 'https://hperkins.blog/wp-content/plugins/gutenberg/build/scripts/hooks/index.min.js?ver=f0f188028580e8dc1255',
};
const SELECTOR = {
	overlay: '.jetpack-instant-search__overlay',
	query: '.jetpack-instant-search__box-input',
	clear: '.jetpack-instant-search__box input[type="button"]',
	filter: '.jetpack-instant-search__search-results-filter-button',
	panel: '.jetpack-instant-search__search-results-secondary',
	close: '.jetpack-instant-search__overlay-close',
	list: '.jetpack-instant-search__search-results-list',
};
const reports = [];

function read( file ) {
	return fs.readFileSync( path.join( ROOT, file ), 'utf8' );
}

function baseline( file ) {
	return execFileSync( 'git', [ 'show', `HEAD:${ file }` ], { cwd: ROOT, encoding: 'utf8' } );
}

// WordPress emits these tokens from theme.json. Generate them from the current
// source instead of freezing a second copy of the design-system values.
function tokens() {
	const theme = JSON.parse( read( 'theme.json' ) );
	const settings = theme.settings;
	const values = [];
	// Match WordPress _wp_to_kebab_case for this theme's ASCII token keys,
	// including h3 => h-3 and 2xl => 2-xl (not merely camelCase boundaries).
	const kebab = ( value ) => value
		.replace( /([a-z0-9])([A-Z])/g, '$1-$2' )
		.replace( /([a-zA-Z])([0-9])/g, '$1-$2' )
		.replace( /([0-9])([a-zA-Z])/g, '$1-$2' ).toLowerCase();
	const custom = ( value, keys = [] ) => {
		for ( const [ key, item ] of Object.entries( value ) ) {
			const nested = [ ...keys, kebab( key ) ];
			if ( item && typeof item === 'object' ) custom( item, nested );
			else values.push( `--wp--custom--${ nested.join( '--' ) }:${ item };` );
		}
	};
	custom( settings.custom );
	for ( const item of settings.color.palette ) values.push( `--wp--preset--color--${ kebab( item.slug ) }:${ item.color };` );
	for ( const item of settings.typography.fontSizes ) values.push( `--wp--preset--font-size--${ kebab( item.slug ) }:${ item.size };` );
	for ( const item of settings.typography.fontFamilies ) values.push( `--wp--preset--font-family--${ kebab( item.slug ) }:${ item.fontFamily };` );
	for ( const item of settings.spacing.spacingSizes ) values.push( `--wp--preset--spacing--${ kebab( item.slug ) }:${ item.size };` );
	const typography = ( value ) => Object.entries( value ).map( ( [ key, item ] ) => `${ kebab( key ) }:${ item };` ).join( '' );
	const faces = settings.typography.fontFamilies.flatMap( ( family ) => family.fontFace ).map( ( face ) => {
		const { src, ...properties } = face;
		return `@font-face{${ typography( properties ) }src:${ src.map( ( file ) => `url("${ file.replace( 'file:.', '' ) }") format("woff2")` ).join( ',' ) };}`;
	} ).join( '' );
	return `:root{${ values.join( '' ) }}${ faces }body{margin:0;${ typography( theme.styles.typography ) }}h1,h2,h3,h4,h5,h6{${ typography( theme.styles.elements.heading.typography ) }} .screen-reader-text{border:0;clip-path:inset(50%);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px;word-wrap:normal!important}`;
}

function fixtureScript( navigationOnClose = false, closeDestination = '/' ) {
	// This intentionally does not implement focus restoration, recovery links,
	// thumbnail repair, accessible names, or the theme's filter-close button.
	// Those are the behaviors the candidate must supply, not fixture shortcuts.
	return `(() => {
		const template = document.querySelector('#overlay-template');
		const q = (s) => document.querySelector(s);
		const overlay = () => q('.jetpack-instant-search__overlay');
		const title = () => q('.jetpack-instant-search__search-results-title');
		const list = () => q('.jetpack-instant-search__search-results-list');
		function render(value, mode) {
			const box = q('.jetpack-instant-search__box-input');
			box.value = value;
			history.replaceState(null, '', value ? '?s=' + encodeURIComponent(value) : location.pathname);
			const content = q('.jetpack-instant-search__search-results-content');
			content.setAttribute('aria-busy', mode === 'loading' ? 'true' : 'false');
			q('.jetpack-instant-search__search-results-pagination').hidden = mode === 'loading' || value === 'zz-no-results-zz';
			if (mode === 'loading') { title().textContent = 'Searching…'; list().innerHTML = ''; }
			else if (value === 'zz-no-results-zz') { title().textContent = 'No results found'; list().innerHTML = ''; }
			else if (!value) { title().textContent = 'Popular posts'; list().innerHTML = '<li class="jetpack-instant-search__search-result"><h3><a href="/placement-method-and-evidence/">Placement Method and Evidence</a></h3></li>'; }
			else { title().textContent = 'Found 2 results'; list().innerHTML = template.content.querySelector('.jetpack-instant-search__search-results-list').innerHTML; }
		}
		function open(value) {
			if (overlay()) overlay().remove();
			document.body.appendChild(template.content.cloneNode(true));
			render(value);
			q('.jetpack-instant-search__box-input').focus();
		}
		function close() {
			if (${ navigationOnClose }) { location.assign(${ JSON.stringify( closeDestination ) }); return; }
			if (overlay()) overlay().setAttribute('aria-hidden', 'true');
		}
		document.addEventListener('input', (event) => {
			if (event.target.matches('[data-hp-header-root] input[type="search"]')) open(event.target.value);
			else if (event.target.matches('.jetpack-instant-search__box-input')) render(event.target.value);
		});
		document.addEventListener('click', (event) => {
			if (event.target.closest('.jetpack-instant-search__box input[type="button"]')) render('');
			if (event.target.closest('.jetpack-instant-search__search-results-filter-button')) {
				q('.jetpack-instant-search__search-results-secondary').classList.toggle('jetpack-instant-search__search-results-secondary--show-as-modal');
			}
			if (event.target.closest('.jetpack-instant-search__overlay-close')) close();
			if (event.target.closest('.jetpack-instant-search__clear-filters-link')) {
				document.querySelectorAll('.jetpack-instant-search__search-filter-list-input').forEach(input => { input.checked = false; });
				event.target.closest('.jetpack-instant-search__clear-filters-link').remove();
			}
		});
		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape' && !event.defaultPrevented) close();
		});
		window.searchFixture = { render, open };
		if (${ navigationOnClose }) open(new URL(location.href).searchParams.get('s') || 'resume');
	})();`;
}

async function serve() {
	const assets = await Promise.all( Object.entries( UPSTREAM ).map( async ( [ name, url ] ) => {
		const response = await fetch( url, { signal: AbortSignal.timeout( 20000 ), credentials: 'omit' } );
		assert( response.ok, `Cannot fetch real upstream ${ name } stylesheet: ${ response.status }` );
		return [ `/${ name }.${ name === 'hooks' ? 'js' : 'css' }`, await response.text() ];
	} ) );
	const styles = Object.fromEntries( assets );
	styles[ '/theme.css' ] = BASELINE ? baseline( 'style.css' ) : read( 'style.css' );
	styles[ '/tokens.css' ] = tokens();
	const theme = JSON.parse( read( 'theme.json' ) );
	const fonts = new Set( theme.settings.typography.fontFamilies.flatMap( ( family ) => family.fontFace ).flatMap( ( face ) => face.src ).map( ( file ) => file.replace( 'file:.', '' ) ) );
	const controller = BASELINE ? baseline( 'assets/js/header-controller.js' ) : read( 'assets/js/header-controller.js' );
	const enhancer = ! BASELINE && fs.existsSync( path.join( ROOT, 'assets/js/search-enhance.js' ) ) ? read( 'assets/js/search-enhance.js' ) : '';
	const server = http.createServer( ( request, response ) => {
		const url = new URL( request.url, 'http://localhost' );
		if ( fonts.has( url.pathname ) ) {
			response.writeHead( 200, { 'Content-Type': 'font/woff2' } );
			response.end( fs.readFileSync( path.join( ROOT, url.pathname.slice( 1 ) ) ) );
			return;
		}
		if ( styles[ url.pathname ] ) {
			response.writeHead( 200, { 'Content-Type': url.pathname.endsWith( '.js' ) ? 'application/javascript' : 'text/css' } );
			response.end( styles[ url.pathname ] );
			return;
		}
		if ( url.pathname === '/controller.js' || url.pathname === '/enhancer.js' ) {
			response.writeHead( 200, { 'Content-Type': 'application/javascript' } );
			response.end( url.pathname === '/controller.js' ? controller : enhancer );
			return;
		}
		if ( url.pathname.startsWith( '/wp-content/uploads/' ) ) {
			if ( url.pathname.endsWith( '/missing.png' ) ) { response.writeHead( 404 ); response.end(); return; }
			response.writeHead( 200, { 'Content-Type': 'image/svg+xml' } );
			response.end( '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#225344"/></svg>' );
			return;
		}
		if ( url.pathname !== '/' && url.pathname !== '/unrelated/' ) { response.writeHead( 404 ); response.end(); return; }
		const origin = `http://127.0.0.1:${ server.address().port }`;
		const localize = ( value ) => value.replaceAll( 'https://hperkins.blog', origin ).replaceAll( '//hperkins.blog', origin );
		const header = localize( read( 'scripts/fixtures/search/council-header.html' ) );
		let overlay = localize( read( 'scripts/fixtures/search/jetpack-overlay.html' ) );
		if ( ! BASELINE ) {
			const highlight = theme.settings.color.palette.find( ( color ) => color.slug === 'gold-100' ).color;
			overlay = overlay.replaceAll( '#f78da7', highlight );
		}
		const config = {
			homeUrl: origin,
			recoveryLinks: [ { label: 'Work', url: `${ origin }/work/` }, { label: 'Essays', url: `${ origin }/essays/` }, { label: 'About', url: `${ origin }/about/` } ],
		};
		response.writeHead( 200, { 'Content-Type': 'text/html; charset=utf-8' } );
		response.end( `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Search adapter regression fixture</title><link rel="stylesheet" href="/parent.css"><link rel="stylesheet" href="/tokens.css"><link rel="stylesheet" href="/theme.css"><link rel="stylesheet" href="/jetpack.css"></head><body class="theme-assembler"><header>${ header }</header><main><h1>Search adapter regression fixture</h1></main><template id="overlay-template">${ overlay }</template><script>window.hpSearchConfig=${ JSON.stringify( config ) };</script><script src="/hooks.js"></script><script src="/controller.js"></script><script src="/enhancer.js"></script><script>${ url.searchParams.get( 'plugin' ) === 'off' ? '' : fixtureScript( url.searchParams.has( 'close-navigation' ), url.searchParams.get( 'close-destination' ) === '/unrelated/' ? '/unrelated/' : '/' ) }</script></body></html>` );
	} );
	await new Promise( ( resolve ) => server.listen( 0, '127.0.0.1', resolve ) );
	return { server, origin: `http://127.0.0.1:${ server.address().port }` };
}

async function inspect( cdp, sessionId, expression ) {
	return evaluate( cdp, sessionId, `(() => { const q = s => document.querySelector(s); const visible = el => !!el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden' && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0 && !el.closest('[aria-hidden="true"]'); ${ expression } })()` );
}

async function click( cdp, sessionId, selector ) {
	const point = await inspect( cdp, sessionId, `const el=q(${ JSON.stringify( selector ) }); if(!el)return null; el.scrollIntoView({block:'nearest'}); const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2};` );
	assert( point, `Missing click target ${ selector }` );
	await cdp.send( 'Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point }, sessionId );
	await cdp.send( 'Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point }, sessionId );
	await wait( 150 );
}

async function setQuery( cdp, sessionId, query ) {
	await inspect( cdp, sessionId, `const input=q(${ JSON.stringify( SELECTOR.query ) }); input.focus(); input.value=${ JSON.stringify( query ) }; input.dispatchEvent(new Event('input',{bubbles:true}));` );
	await wait( 200 );
}

async function check( viewport, name, run ) {
	try {
		const details = await run();
		reports.push( { viewport, name, passed: true, details } );
	} catch ( error ) {
		reports.push( { viewport, name, passed: false, error: error.message } );
		console.error( `FAIL ${ viewport } ${ name }: ${ error.message }` );
	}
}

async function snapshot( cdp, sessionId, name ) {
	const { data } = await cdp.send( 'Page.captureScreenshot', { format: 'png' }, sessionId );
	fs.writeFileSync( path.join( CAPTURE_DIR, `${ name }.png` ), Buffer.from( data, 'base64' ) );
}

async function accessibleName( cdp, sessionId, selector ) {
	const { root } = await cdp.send( 'DOM.getDocument', {}, sessionId );
	const { nodeId } = await cdp.send( 'DOM.querySelector', { nodeId: root.nodeId, selector }, sessionId );
	const { nodes } = await cdp.send( 'Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false }, sessionId );
	return nodes[ 0 ]?.name?.value || '';
}

async function viewportChecks( cdp, origin, width ) {
	const { targetId } = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
	const { sessionId } = await cdp.send( 'Target.attachToTarget', { targetId, flatten: true } );
	const mobile = width < 782;
	const trigger = mobile ? '[data-hp-header-trigger="drawer"]' : '[data-hp-header-trigger="search"]';
	const councilInput = mobile ? '#hp-council-drawer-search-input' : '#hp-council-search-input';
	await cdp.send( 'Page.enable', {}, sessionId );
	// Only the exact repaired thumbnail path receives a deterministic image.
	// This proves the adapter requested a well-formed same-site Photon URL while
	// avoiding a public image service fetching our deliberately private loopback.
	const expectedImage = `https://i0.wp.com/${ new URL( origin ).host }/wp-content/uploads/2026/06/flavor-agent-bounded-global-styles-failed.png?ssl=1&resize=600%2C600`;
	const imageRequests = [];
	const networkErrors = [];
	const stopImages = cdp.on( 'Fetch.requestPaused', ( event ) => {
		imageRequests.push( event.request.url );
		cdp.send( 'Fetch.fulfillRequest', {
			requestId: event.requestId, responseCode: 200,
			responseHeaders: [ { name: 'Content-Type', value: 'image/svg+xml' } ],
			body: Buffer.from( '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#225344"/></svg>' ).toString( 'base64' ),
		}, sessionId ).catch( ( error ) => networkErrors.push( error.message ) );
	}, sessionId );
	await cdp.send( 'Fetch.enable', { patterns: [ { urlPattern: expectedImage, requestStage: 'Request' } ] }, sessionId );
	await cdp.send( 'Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId );
	const loaded = cdp.once( 'Page.loadEventFired', sessionId );
	await cdp.send( 'Page.navigate', { url: origin }, sessionId );
	await loaded;
	await evaluate( cdp, sessionId, 'document.fonts.ready' );
	await wait( 200 );
	async function open() {
		await click( cdp, sessionId, trigger );
		await inspect( cdp, sessionId, `const input=q(${ JSON.stringify( councilInput ) });input.focus();input.value='flavor agent';input.dispatchEvent(new Event('input',{bubbles:true}));` );
		await wait( 250 );
	}
	await open();
	await check( width, 'readable query and compact Clear', async () => {
		const metrics = await inspect( cdp, sessionId, `const input=q(${ JSON.stringify( SELECTOR.query ) });const clear=q(${ JSON.stringify( SELECTOR.clear ) }); const box=clear.closest('.jetpack-instant-search__box');return {fontSize:parseFloat(getComputedStyle(input).fontSize),queryWidth:input.getBoundingClientRect().width,clearWidth:clear.getBoundingClientRect().width,clearHeight:clear.getBoundingClientRect().height,rowWidth:box.getBoundingClientRect().width};` );
		assert( metrics.fontSize >= 16, `Query font ${ metrics.fontSize }px is below 16px` );
		assert( metrics.clearWidth >= 44 && metrics.clearHeight >= 44, `Clear target ${ metrics.clearWidth }×${ metrics.clearHeight } is below 44px` );
		assert( metrics.clearWidth <= 80 && metrics.clearWidth < metrics.queryWidth, `Clear consumes ${ metrics.clearWidth }px beside ${ metrics.queryWidth }px query` );
		return metrics;
	} );
	await check( width, 'query accessible name', async () => {
		const name = await accessibleName( cdp, sessionId, SELECTOR.query );
		assert( /search/i.test( name ) && ! /magnifying|clear/i.test( name ), `Unexpected accessible name: ${ name }` );
		return { name };
	} );
	await check( width, 'results recovery stays hidden', async () => {
		assert( await inspect( cdp, sessionId, `return q(${ JSON.stringify( SELECTOR.overlay ) }).dataset.hpSearchState==='results' && !visible(q('.hp-search-recovery'));` ), 'Results must remain visible without empty-state recovery' );
	} );
	await check( width, 'malformed same-site thumbnail repair', async () => {
		await wait( 300 );
		const result = await inspect( cdp, sessionId, `const img=q('.jetpack-instant-search__search-result-expanded__image');return {src:img?.src,loaded:img?.naturalWidth>0,hidden:img?.hidden};` );
		assert.equal( result.src, expectedImage );
		assert( imageRequests.includes( expectedImage ), 'Browser never requested the repaired image URL' );
		assert.deepEqual( networkErrors, [] );
		assert( result.loaded && ! result.hidden, 'Repaired source must load and stay visible' );
		return result;
	} );
	await check( width, 'supported image hook normalizes source and uses first alt only', async () => {
		const imagePath = '/wp-content/uploads/2026/06/flavor-agent-bounded-global-styles-failed.png';
		const result = await evaluate( cdp, sessionId, `({sameSite:wp.hooks.applyFilters('jetpack.instantSearch.searchResultImageUrl',${ JSON.stringify( imagePath ) },{fields:{'image.alt_text':['First thumbnail description','Unrelated second image']}}),external:wp.hooks.applyFilters('jetpack.instantSearch.searchResultImageUrl','https://images.example.test/photo.png?size=small',{fields:{'image.alt_text':['External image'],'permalink.url.raw':'another-site.example.test/story/'}}),multisite:wp.hooks.applyFilters('jetpack.instantSearch.searchResultImageUrl','/wp-content/uploads/multisite.png',{fields:{'permalink.url.raw':'another-site.example.test/story/'}}),malformedPermalink:wp.hooks.applyFilters('jetpack.instantSearch.searchResultImageUrl','/wp-content/uploads/fallback.png',{fields:{'permalink.url.raw':'https://['}})})` );
		assert.equal( result.sameSite, new URL( origin ).host + imagePath );
		assert.equal( result.external, 'images.example.test/photo.png?size=small' );
		assert.equal( result.multisite, 'another-site.example.test/wp-content/uploads/multisite.png' );
		assert.equal( result.malformedPermalink, new URL( origin ).host + '/wp-content/uploads/fallback.png' );
		await setQuery( cdp, sessionId, 'flavor agent' );
		assert.equal( await inspect( cdp, sessionId, "return q('.jetpack-instant-search__search-result-expanded__image').alt;" ), 'First thumbnail description' );
		return result;
	} );
	await snapshot( cdp, sessionId, `${ width }-results` );
	if ( mobile ) {
		await click( cdp, sessionId, SELECTOR.filter );
		await check( width, 'filter panel containment', async () => {
			const r = await inspect( cdp, sessionId, `const panel=q(${ JSON.stringify( SELECTOR.panel ) });const r=panel.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,scrollWidth:panel.scrollWidth,clientWidth:panel.clientWidth};` );
			assert( r.left >= 0 && r.right <= width && r.scrollWidth <= r.clientWidth + 1, `Filter overflows ${ width }px viewport: ${ JSON.stringify( r ) }` );
			return r;
		} );
		await snapshot( cdp, sessionId, `${ width }-filters` );
		await check( width, 'filter close keeps search open and restores filter focus', async () => {
			await click( cdp, sessionId, '.hp-search-filter-close' );
			assert( await inspect( cdp, sessionId, `return visible(q(${ JSON.stringify( SELECTOR.overlay ) })) && !q(${ JSON.stringify( SELECTOR.panel ) }).classList.contains('jetpack-instant-search__search-results-secondary--show-as-modal') && document.activeElement===q(${ JSON.stringify( SELECTOR.filter ) });` ), 'Close filters must only close the filter panel and focus Filters' );
		} );
		// Independent subsequent checks must not inherit a failed close control.
		await inspect( cdp, sessionId, `q(${ JSON.stringify( SELECTOR.panel ) }).classList.remove('jetpack-instant-search__search-results-secondary--show-as-modal');` );
		await check( width, 'filter Escape closes only filters and restores filter focus', async () => {
			await click( cdp, sessionId, SELECTOR.filter );
			await pressKey( cdp, sessionId, 'Escape' );
			await wait( 150 );
			assert( await inspect( cdp, sessionId, `return visible(q(${ JSON.stringify( SELECTOR.overlay ) })) && !q(${ JSON.stringify( SELECTOR.panel ) }).classList.contains('jetpack-instant-search__search-results-secondary--show-as-modal') && document.activeElement===q(${ JSON.stringify( SELECTOR.filter ) });` ), 'Filter Escape closed all search or lost Filters focus' );
		} );
		// Restore plugin-owned visibility even when the baseline mishandles Esc.
		await inspect( cdp, sessionId, `q(${ JSON.stringify( SELECTOR.overlay ) }).setAttribute('aria-hidden','false');q(${ JSON.stringify( SELECTOR.panel ) }).classList.remove('jetpack-instant-search__search-results-secondary--show-as-modal');` );
	}
	await check( width, 'Clear returns focus to query', async () => {
		await click( cdp, sessionId, SELECTOR.clear );
		assert( await inspect( cdp, sessionId, `return document.activeElement===q(${ JSON.stringify( SELECTOR.query ) }) && q(${ JSON.stringify( SELECTOR.query ) }).value==='';` ), 'Clear did not empty/refocus query' );
	} );
	async function recovery( state ) {
		const result = await inspect( cdp, sessionId, `const root=q(${ JSON.stringify( SELECTOR.overlay ) });const el=q('.hp-search-recovery');return {state:root.dataset.hpSearchState,visible:visible(el),links:el?[...el.querySelectorAll('a')].map(a=>({label:a.textContent.trim(),path:new URL(a.href).pathname})):[],listVisible:visible(q(${ JSON.stringify( SELECTOR.list ) }))};` );
		assert.equal( result.state, state );
		assert( result.visible, `${ state } recovery is not visible` );
		assert.deepEqual( result.links, [ { label: 'Work', path: '/work/' }, { label: 'Essays', path: '/essays/' }, { label: 'About', path: '/about/' } ] );
		assert( ! result.listVisible, `${ state } still displays the plugin list` );
		return result;
	}
	await check( width, 'empty query shows direct navigation without popular utility results', () => recovery( 'empty' ) );
	await check( width, 'empty query hides popular-result pagination', async () => {
		assert( await inspect( cdp, sessionId, "const pagination=q('.jetpack-instant-search__search-results-pagination');return !!pagination && !pagination.hidden && !visible(pagination) && !visible(pagination.querySelector('button'));" ), 'Empty query still exposes Load more for the suppressed popular-results list' );
	} );
	await snapshot( cdp, sessionId, `${ width }-empty` );
	await setQuery( cdp, sessionId, 'zz-no-results-zz' );
	await check( width, 'no-results recovery links', () => recovery( 'no-results' ) );
	await snapshot( cdp, sessionId, `${ width }-no-results` );
	await check( width, 'active filters stay available in no-results', async () => {
		await inspect( cdp, sessionId, `const panel=q(${ JSON.stringify( SELECTOR.panel ) });const input=panel.querySelector('input[type="checkbox"]');input.checked=true;const clear=document.createElement('button');clear.className='jetpack-instant-search__clear-filters-link';clear.textContent='Clear filters';panel.querySelector('.jetpack-instant-search__search-filters').appendChild(clear);` );
		await wait( 150 );
		if ( mobile ) await click( cdp, sessionId, SELECTOR.filter );
		assert( await inspect( cdp, sessionId, "return visible(q('.jetpack-instant-search__clear-filters-link'));" ), 'No-results recovery hides active-filter controls' );
		await click( cdp, sessionId, '.jetpack-instant-search__clear-filters-link' );
		assert( await inspect( cdp, sessionId, "return ![...document.querySelectorAll('.jetpack-instant-search__search-filter-list-input')].some(input=>input.checked);" ), 'Clear filters is unavailable or not clickable' );
		if ( mobile ) await click( cdp, sessionId, '.hp-search-filter-close' );
	} );
	await inspect( cdp, sessionId, `q(${ JSON.stringify( SELECTOR.panel ) }).classList.remove('jetpack-instant-search__search-results-secondary--show-as-modal');` );
	await check( width, 'loading does not masquerade as no results', async () => {
		await evaluate( cdp, sessionId, "searchFixture.render('pending query','loading')" );
		await wait( 150 );
		assert( await inspect( cdp, sessionId, `return q(${ JSON.stringify( SELECTOR.overlay ) }).dataset.hpSearchState==='loading' && !visible(q('.hp-search-recovery'));` ), 'Loading presented recovery/no-results prematurely' );
	} );
	await check( width, 'upstream error remains visible without no-results recovery', async () => {
		await inspect( cdp, sessionId, "q('.jetpack-instant-search__search-results-content').setAttribute('aria-busy','false');q('.jetpack-instant-search__search-results-title').textContent='There was an error loading results. Please try again.';" );
		await wait( 150 );
		assert( await inspect( cdp, sessionId, "return visible(q('.jetpack-instant-search__search-results-title')) && !visible(q('.hp-search-recovery'));" ), 'Adapter hid or relabelled an upstream failure as no results' );
	} );
	await setQuery( cdp, sessionId, 'flavor agent' );
	await check( width, 'failed thumbnail becomes text-only without hiding result', async () => {
		await inspect( cdp, sessionId, `const img=q('.jetpack-instant-search__search-result-expanded__image');img.removeAttribute('srcset');img.src='/wp-content/uploads/missing.png';img.loading='eager';` );
		await wait( 250 );
		assert( await inspect( cdp, sessionId, `const img=q('.jetpack-instant-search__search-result-expanded__image');return img.hasAttribute('data-hp-search-image-failed') && !visible(img) && visible(img.closest('.jetpack-instant-search__search-result').querySelector('h3 a'));` ), 'Failed thumbnail remains exposed or result link is hidden' );
	} );
	await check( width, 'Escape restores originating Council control', async () => {
		await inspect( cdp, sessionId, `q(${ JSON.stringify( SELECTOR.query ) }).focus();` );
		await pressKey( cdp, sessionId, 'Escape' );
		await wait( 200 );
		assert( await inspect( cdp, sessionId, `return !visible(q(${ JSON.stringify( SELECTOR.overlay ) })) && document.activeElement===q(${ JSON.stringify( trigger ) });` ), 'Escape did not close overlay and restore Council trigger focus' );
	} );
	await check( width, 'remount stays enhanced without duplicate controls', async () => {
		if ( ! BASELINE ) await evaluate( cdp, sessionId, read( 'assets/js/search-enhance.js' ) );
		await open();
		await click( cdp, sessionId, SELECTOR.clear );
		await recovery( 'empty' );
		assert( await inspect( cdp, sessionId, "return document.querySelectorAll('.hp-search-recovery').length===1 && document.querySelectorAll('.hp-search-filter-close').length<=1;" ), 'Remount duplicated enhancement controls' );
	} );
	stopImages();
	await cdp.send( 'Target.closeTarget', { targetId } );
}

async function fallbackChecks( cdp, origin ) {
	const { targetId } = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
	const { sessionId } = await cdp.send( 'Target.attachToTarget', { targetId, flatten: true } );
	await cdp.send( 'Page.enable', {}, sessionId );
	await cdp.send( 'Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId );
	const loaded = cdp.once( 'Page.loadEventFired', sessionId );
	await cdp.send( 'Page.navigate', { url: `${ origin }/?plugin=off` }, sessionId );
	await loaded;
	await wait( 200 );
	await check( 1440, 'plugin-unavailable native GET search fallback', async () => {
		await click( cdp, sessionId, '[data-hp-header-trigger="search"]' );
		await inspect( cdp, sessionId, "const input=q('#hp-council-search-input');input.focus();input.value='native fallback';" );
		const navigated = cdp.once( 'Page.loadEventFired', sessionId );
		await pressKey( cdp, sessionId, 'Enter' );
		await navigated;
		const result = await inspect( cdp, sessionId, "return {query:new URL(location.href).searchParams.get('s'),overlay:!!q('.jetpack-instant-search__overlay')};" );
		assert.equal( result.query, 'native fallback' );
		assert.equal( result.overlay, false );
		return result;
	} );
	await cdp.send( 'Target.closeTarget', { targetId } );
}

async function navigationChecks( cdp, origin, width, mode = 'restore' ) {
	const { targetId } = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
	const { sessionId } = await cdp.send( 'Target.attachToTarget', { targetId, flatten: true } );
	await cdp.send( 'Page.enable', {}, sessionId );
	await cdp.send( 'Runtime.enable', {}, sessionId );
	const exceptions = [];
	const stopExceptions = cdp.on( 'Runtime.exceptionThrown', ( event ) => exceptions.push( event.exceptionDetails.exception?.description || event.exceptionDetails.text ), sessionId );
	if ( mode === 'storage-unavailable' ) {
		await cdp.send( 'Page.addScriptToEvaluateOnNewDocument', { source: "Object.defineProperty(window,'sessionStorage',{get(){throw new DOMException('Storage unavailable','SecurityError');}});" }, sessionId );
	}
	await cdp.send( 'Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId );
	const loaded = cdp.once( 'Page.loadEventFired', sessionId );
	const destination = mode === 'unrelated' ? '/unrelated/' : '/';
	await cdp.send( 'Page.navigate', { url: `${ origin }/?s=resume&close-navigation=1&close-destination=${ encodeURIComponent( destination ) }` }, sessionId );
	await loaded;
	await wait( 200 );
	if ( mode === 'expired' ) {
		// Advance only the arriving document's clock. The departing document
		// records its intent with real time, so this exercises the expiry guard.
		await cdp.send( 'Page.addScriptToEvaluateOnNewDocument', { source: 'const originalNow=Date.now;Date.now=()=>originalNow()+11000;' }, sessionId );
	}
	const labels = {
		restore: 'direct-query Escape restores focus after full navigation',
		'storage-unavailable': 'full-navigation close tolerates unavailable session storage',
		unrelated: 'close intent does not steal focus on unrelated navigation',
		expired: 'expired close intent does not steal focus',
	};
	await check( width, labels[ mode ], async () => {
		assert( await inspect( cdp, sessionId, `return visible(q(${ JSON.stringify( SELECTOR.overlay ) }));` ), 'Direct search query did not open overlay' );
		const previousDocument = await evaluate( cdp, sessionId, 'performance.timeOrigin' );
		const navigated = cdp.once( 'Page.loadEventFired', sessionId );
		await pressKey( cdp, sessionId, 'Escape' );
		await navigated;
		await wait( 250 );
		const result = await inspect( cdp, sessionId, "return {path:location.pathname,search:location.search,document:performance.timeOrigin,focusedTag:document.activeElement.tagName,focusedTrigger:document.activeElement.getAttribute('data-hp-header-trigger')};" );
		assert.notEqual( result.document, previousDocument, 'Fixture must create a new document, not emulate a DOM-only close' );
		assert.equal( result.path, destination );
		assert.equal( result.search, '' );
		assert.deepEqual( exceptions, [], 'Search close caused an unhandled browser exception' );
		if ( mode === 'restore' ) assert.equal( result.focusedTrigger, width < 782 ? 'drawer' : 'search', `Full navigation lost search-close focus to ${ result.focusedTag }` );
		else assert.equal( result.focusedTrigger, null, `Search-close intent stole focus in ${ mode } state` );
		return result;
	} );
	if ( mode === 'restore' || mode === 'unrelated' ) {
		await check( width, mode === 'restore' ? 'consumed close intent does not replay on reload' : 'unrelated navigation consumes stale close intent', async () => {
			const navigated = cdp.once( 'Page.loadEventFired', sessionId );
			await cdp.send( 'Page.navigate', { url: origin + '/' }, sessionId );
			await navigated;
			await wait( 250 );
			assert( await inspect( cdp, sessionId, "return !document.activeElement.hasAttribute('data-hp-header-trigger');" ), 'A consumed/stale close intent replayed on a later home visit' );
		} );
	}
	stopExceptions();
	await cdp.send( 'Target.closeTarget', { targetId } );
}

async function main() {
	fs.mkdirSync( CAPTURE_DIR, { recursive: true } );
	const { server, origin } = await serve();
	try {
		await withChrome( async ( cdp ) => {
			if ( ! NAVIGATION_ONLY ) {
				for ( const width of [ 1440, 390, 320 ] ) await viewportChecks( cdp, origin, width );
				await fallbackChecks( cdp, origin );
			}
			for ( const width of [ 1440, 390 ] ) await navigationChecks( cdp, origin, width );
			await navigationChecks( cdp, origin, 390, 'storage-unavailable' );
			await navigationChecks( cdp, origin, 390, 'unrelated' );
			await navigationChecks( cdp, origin, 1440, 'expired' );
		} );
	} finally {
		await new Promise( ( resolve ) => server.close( resolve ) );
	}
	fs.writeFileSync( path.join( CAPTURE_DIR, 'results.json' ), JSON.stringify( { mode: BASELINE ? 'baseline' : 'candidate', upstream: UPSTREAM, checks: reports }, null, 2 ) + '\n' );
	const failures = reports.filter( ( item ) => ! item.passed );
	console.log( `${ reports.length - failures.length }/${ reports.length } search adapter browser checks passed (${ BASELINE ? 'baseline' : 'candidate' }). Evidence: ${ CAPTURE_DIR }` );
	if ( failures.length ) process.exitCode = 1;
}

if ( require.main === module ) {
	main().catch( ( error ) => { console.error( error ); process.exitCode = 1; } );
}

module.exports = { tokens };
