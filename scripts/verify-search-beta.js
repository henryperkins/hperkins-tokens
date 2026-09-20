#!/usr/bin/env node

// Real Jetpack blocks beta modules hydrate an anonymous captured server template.
// No fixture code implements Clear, filters, pills, query state, or dialog close.
// HPERKINS_WP_PATH serves installed public plugin files; otherwise they are fetched
// from the public site. --serve keeps the loopback endpoint open for manual QA.
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const http = require( 'node:http' );
const os = require( 'node:os' );
const path = require( 'node:path' );
const { execFileSync } = require( 'node:child_process' );
const { tokens } = require( './verify-search' );
const { withChrome, evaluate, pressKey, wait } = require( './lib/search-browser' );

const ROOT = path.join( __dirname, '..' );
const BASELINE = process.argv.includes( '--baseline' );
const CAPTURE = process.env.HPERKINS_CAPTURE_DIR || path.join( os.tmpdir(), 'hp-search-beta-verification', BASELINE ? 'baseline' : 'candidate' );
const FIXTURE = JSON.parse( fs.readFileSync( path.join( __dirname, 'fixtures/search/jetpack-beta.json' ), 'utf8' ) );
const PUBLIC = 'https://hperkins.blog';
const results = [];
const read = ( file ) => fs.readFileSync( path.join( ROOT, file ), 'utf8' );
const asset = ( file ) => BASELINE ? execFileSync( 'git', [ 'show', `HEAD:${ file }` ], { cwd: ROOT, encoding: 'utf8' } ) : read( file );
const SELECTOR = {
	overlay: '#jetpack-search-block-overlay', query: '.jetpack-search-input__field', clear: '.jetpack-search-input__clear',
	close: '.jetpack-search-block-overlay__close', image: '.jetpack-search-results__image',
	filter: '.jetpack-search-filters-popover__trigger', panel: '.jetpack-search-filters-popover__panel',
};

async function serve() {
	const parentResponse = await fetch( `${ PUBLIC }/wp-content/themes/assembler/style.css?ver=0.0.121`, { credentials: 'omit', signal: AbortSignal.timeout( 20000 ) } );
	assert( parentResponse.ok, 'Cannot fetch Assembler public stylesheet' );
	const parent = await parentResponse.text();
	const cache = new Map();
	const fontPaths = new Set( JSON.parse( read( 'theme.json' ) ).settings.typography.fontFamilies.flatMap( ( family ) => family.fontFace ).flatMap( ( face ) => face.src ).map( ( source ) => source.replace( 'file:.', '' ) ) );
	const server = http.createServer( async ( request, response ) => {
		try {
			const url = new URL( request.url, 'http://localhost' );
			const origin = `http://127.0.0.1:${ server.address().port }`;
			const plain = ( type, body ) => { response.writeHead( 200, { 'Content-Type': type, 'Cache-Control': 'no-store' } ); response.end( body ); };
			if ( url.pathname === '/theme.css' ) return plain( 'text/css', asset( 'style.css' ) );
			if ( url.pathname === '/tokens.css' ) return plain( 'text/css', tokens() );
			if ( url.pathname === '/parent.css' ) return plain( 'text/css', parent );
			if ( url.pathname === '/header-controller.js' ) return plain( 'application/javascript', asset( 'assets/js/header-controller.js' ) );
			if ( url.pathname === '/search-enhance.js' ) return plain( 'application/javascript', process.env.HPERKINS_SEARCH_ENHANCER_OVERRIDE ? fs.readFileSync( process.env.HPERKINS_SEARCH_ENHANCER_OVERRIDE, 'utf8' ) : asset( 'assets/js/search-enhance.js' ) );
			if ( url.pathname === '/search-blocks.js' ) return plain( 'application/javascript', read( 'assets/js/search-blocks.js' ) );
			if ( fontPaths.has( url.pathname ) ) return plain( 'font/woff2', fs.readFileSync( path.join( ROOT, url.pathname.slice( 1 ) ) ) );
			if ( url.pathname.startsWith( '/wp-content/plugins/' ) ) {
				const type = url.pathname.endsWith( '.css' ) ? 'text/css' : 'application/javascript';
				if ( process.env.HPERKINS_WP_PATH ) {
					const pluginRoot = path.resolve( process.env.HPERKINS_WP_PATH, 'wp-content/plugins' );
					const file = path.resolve( process.env.HPERKINS_WP_PATH, '.' + url.pathname );
					assert( file.startsWith( pluginRoot + path.sep ), 'Plugin asset escaped configured root' );
					if ( fs.existsSync( file ) ) return plain( type, fs.readFileSync( file ) );
				}
				if ( ! cache.has( url.pathname ) ) {
					const upstream = await fetch( PUBLIC + url.pathname + url.search, { credentials: 'omit', signal: AbortSignal.timeout( 20000 ) } );
					assert( upstream.ok, `Missing public module ${ url.pathname }: ${ upstream.status }` );
					cache.set( url.pathname, await upstream.text() );
				}
				return plain( type, cache.get( url.pathname ) );
			}
			if ( url.pathname !== '/' ) { response.writeHead( 404 ); response.end(); return; }
			const localize = ( value ) => value.replaceAll( PUBLIC, origin );
			const state = structuredClone( FIXTURE.data );
			const search = state.state[ 'jetpack-search' ];
			search.searchQuery = url.searchParams.get( 'q' ) || '';
			search.hasSearchParam = url.searchParams.has( 'q' );
			search.disableTracking = true;
			const imports = Object.fromEntries( Object.entries( FIXTURE.imports.imports ).map( ( [ key, value ] ) => [ key, localize( value ) ] ) );
			// A formerly standalone plugin root enters WordPress's import map once
			// the theme declares it as a dynamic dependency. Retain its captured URL.
			imports[ 'jetpack-search/overlay-bootstrap' ] = localize( FIXTURE.modules.find( ( source ) => source.includes( '/overlay-bootstrap/index.js' ) ) );
			let template = FIXTURE.template;
			let enqueued = [];
			let dequeued = [];
			let config = { homeUrl: origin, recoveryLinks: [ { label: 'Work', url: origin + '/work/' }, { label: 'Essays', url: origin + '/essays/' }, { label: 'About', url: origin + '/about/' } ] };
			const betaAdapter = ! BASELINE && fs.existsSync( path.join( ROOT, 'assets/js/search-blocks.js' ) );
			if ( betaAdapter ) {
				assert( template.includes( FIXTURE.resultBlock ), 'Captured result block is absent from its template' );
				const rendered = JSON.parse( execFileSync( process.env.HPERKINS_PHP_BIN || 'php', [ path.join( __dirname, 'fixtures/search/render-beta-results.php' ), process.env.HPERKINS_WP_PATH || '' ], { encoding: 'utf8', input: JSON.stringify( { html: FIXTURE.resultBlock, origin } ) } ) );
				template = template.replace( FIXTURE.resultBlock, rendered.html );
				Object.assign( search, rendered.state[ 'jetpack-search' ] );
				config = rendered.config;
				dequeued = rendered.dequeued;
				enqueued = Object.entries( rendered.modules ).map( ( [ id, module ] ) => {
					const source = module.src.replace( '/assets/js/search-blocks.js', '/search-blocks.js' );
					imports[ id ] = source;
					for ( const dependency of module.deps ) {
						const dependencyId = typeof dependency === 'string' ? dependency : dependency.id;
						assert( imports[ dependencyId ], `Captured import map lacks ${ dependencyId }` );
					}
					return source;
				} );
			}
			const removed = dequeued.map( ( id ) => new URL( imports[ id ], origin ).pathname );
			const modules = [ ...FIXTURE.modules.filter( ( source ) => ! removed.includes( new URL( source, origin ).pathname ) ), ...enqueued ].map( ( source ) => `<script type="module" src="${ localize( source ) }"></script>` ).join( '' );
			// Match WordPress enqueue order: plugin roots at priority 10, then the
			// theme's additive module at priority 20. Module order affects hydration.
			plain( 'text/html; charset=utf-8', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Jetpack beta search verification</title>${ FIXTURE.layoutStyles.join( '' ) }<link rel="stylesheet" href="/parent.css"><link rel="stylesheet" href="/tokens.css"><link rel="stylesheet" href="/theme.css">${ FIXTURE.styles.join( '' ) }${ [ ...new Set( FIXTURE.css ) ].map( ( source ) => `<link rel="stylesheet" href="${ localize( source ) }">` ).join( '' ) }<script type="importmap">${ JSON.stringify( { imports } ) }</script><script type="application/json" id="wp-script-module-data-@wordpress/interactivity">${ JSON.stringify( state ) }</script></head><body class="theme-assembler"><header>${ localize( read( 'scripts/fixtures/search/council-header.html' ) ) }</header><main><h1>Jetpack beta search verification</h1></main>${ FIXTURE.overlay }${ template }<script>window.hpSearchConfig=${ JSON.stringify( config ) };window.JetpackSearchBlockOverlay=${ JSON.stringify( FIXTURE.bootstrap ) };</script><script src="/header-controller.js"></script><script src="/search-enhance.js"></script>${ modules }</body></html>` );
		} catch ( error ) {
			response.writeHead( 500, { 'Content-Type': 'text/plain' } );
			response.end( error.message );
		}
	} );
	await new Promise( ( resolve ) => server.listen( Number( process.env.HPERKINS_SEARCH_PORT ) || 0, '127.0.0.1', resolve ) );
	return { server, origin: `http://127.0.0.1:${ server.address().port }` };
}

async function inspect( cdp, session, source ) {
	return evaluate( cdp, session, `(()=>{const q=s=>document.querySelector(s);const visible=e=>!!e&&!e.closest('[hidden]')&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden'&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;${ source }})()` );
}

async function condition( cdp, session, expression, label, timeout = 20000 ) {
	const start = Date.now();
	while ( Date.now() - start < timeout ) {
		if ( await inspect( cdp, session, `return (${ expression });` ) ) return;
		await wait( 100 );
	}
	throw new Error( `Timed out waiting for ${ label }` );
}

async function check( width, name, callback ) {
	try { const details = await callback(); results.push( { width, name, passed: true, details } ); }
	catch ( error ) { results.push( { width, name, passed: false, error: error.message } ); console.error( `FAIL ${ width } ${ name }: ${ error.message }` ); }
}

async function click( cdp, session, selector ) {
	const point = await inspect( cdp, session, `const el=[...document.querySelectorAll(${ JSON.stringify( selector ) })].find(visible);if(!el)return null;el.scrollIntoView({block:'nearest'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};` );
	assert( point, `Visible control is missing: ${ selector }` );
	await cdp.send( 'Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point }, session );
	await cdp.send( 'Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point }, session );
	await wait( 200 );
}

async function settled( cdp, session ) {
	await wait( 450 );
	const start = Date.now();
	while ( Date.now() - start < 20000 ) {
		const done = await evaluate( cdp, session, "import('@wordpress/interactivity').then(({store})=>!store('jetpack-search').state.isLoading)" );
		if ( done ) return;
		await wait( 100 );
	}
	throw new Error( 'Search API did not settle' );
}

async function query( cdp, session, value ) {
	await inspect( cdp, session, `const input=q(${ JSON.stringify( SELECTOR.query ) });input.focus();input.value=${ JSON.stringify( value ) };input.dispatchEvent(new Event('input',{bubbles:true}));` );
	await settled( cdp, session );
}

async function screenshot( cdp, session, name ) {
	const { data } = await cdp.send( 'Page.captureScreenshot', { format: 'png' }, session );
	fs.writeFileSync( path.join( CAPTURE, `${ name }.png` ), Buffer.from( data, 'base64' ) );
}

async function startup( cdp, origin, width, journey, delayed ) {
	const { targetId } = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
	const { sessionId: session } = await cdp.send( 'Target.attachToTarget', { targetId, flatten: true } );
	await cdp.send( 'Page.enable', {}, session );
	await cdp.send( 'Page.bringToFront', {}, session );
	await cdp.send( 'Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false }, session );
	const requests = [];
	let stopDelays = () => {};
	if ( delayed ) {
		// Delay real module downloads, without replacing their implementation or
		// Search API. This exposes the pre-DCL/core/manual hydration overlap.
		stopDelays = cdp.on( 'Fetch.requestPaused', ( event ) => {
			requests.push( ( async () => {
				await wait( event.request.url.includes( '/833.js' ) ? 500 : 250 );
				await cdp.send( 'Fetch.continueRequest', { requestId: event.requestId }, session );
			} )() );
		}, session );
		await cdp.send( 'Fetch.enable', { patterns: [ { urlPattern: '*/search-blocks.js*' }, { urlPattern: '*/833.js*' } ] }, session );
	}
	try {
		const loaded = cdp.once( 'Page.loadEventFired', session );
		await cdp.send( 'Page.navigate', { url: origin + ( journey === 'direct' ? '/?q=resume' : '/' ) }, session );
		await loaded;
		if ( journey === 'header' ) {
			// Council intentionally settles its pageshow state again after 60ms.
			// Begin this search journey after that existing header lifecycle ends.
			await wait( 120 );
			await evaluate( cdp, session, 'document.fonts.ready.then(()=>true)' );
			await evaluate( cdp, session, 'new Promise(resolve=>requestAnimationFrame(()=>resolve(true)))' );
			await click( cdp, session, `[data-hp-header-trigger="${ width < 782 ? 'drawer' : 'search' }"]` );
			await condition( cdp, session, "[...document.querySelectorAll('input[name=s]')].some(visible)", 'opened Council search field' );
			await inspect( cdp, session, "const input=[...document.querySelectorAll('input[name=s]')].find(visible);input.focus();input.value='resume';input.dispatchEvent(new Event('input',{bubbles:true}));" );
			await pressKey( cdp, session, 'Enter' );
		}
		await condition( cdp, session, "visible(q('#jetpack-search-block-overlay')) && !!q('.jetpack-search-results__title a[href]') && !!q('input[type=checkbox]')", 'both hydrated beta lists' );
		await settled( cdp, session );
		const observed = await evaluate( cdp, session, "import('@wordpress/interactivity').then(({store})=>{const state=store('jetpack-search').state;return {query:state.searchQuery,records:state.results.length,rendered:document.querySelectorAll('.jetpack-search-results__title a[href]').length,filters:document.querySelectorAll('input[type=checkbox]').length};})" );
		assert.equal( observed.query, 'resume' );
		assert( observed.records > 0 && observed.rendered === observed.records && observed.filters > 0, JSON.stringify( observed ) );
		return observed;
	} catch ( error ) {
		await screenshot( cdp, session, `${ width }-${ journey }-startup-failure` );
		const details = await inspect( cdp, session, "return {url:location.href,header:q('[data-hp-header-root]')?.dataset.hpHeaderState,focus:document.activeElement?.tagName,inputs:[...document.querySelectorAll('input[name=s]')].map(e=>({visible:visible(e),width:e.getBoundingClientRect().width,hidden:!!e.closest('[hidden]')}))};" );
		throw new Error( error.message + ': ' + JSON.stringify( details ) );
	} finally {
		await Promise.all( requests );
		stopDelays();
		await cdp.send( 'Target.closeTarget', { targetId } );
	}
}

async function verify( cdp, origin, width ) {
	const { targetId } = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
	const { sessionId: session } = await cdp.send( 'Target.attachToTarget', { targetId, flatten: true } );
	await cdp.send( 'Page.enable', {}, session );
	await cdp.send( 'Runtime.enable', {}, session );
	const exceptions = [];
	const stopErrors = cdp.on( 'Runtime.exceptionThrown', ( event ) => exceptions.push( event.exceptionDetails.exception?.description || event.exceptionDetails.text ), session );
	await cdp.send( 'Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false }, session );
	await cdp.send( 'Page.navigate', { url: origin + '/?q=resume' }, session );
	await condition( cdp, session, "visible(q('#jetpack-search-block-overlay')) && !!q('.jetpack-search-results__title a[href]')", 'real beta results' );
	await settled( cdp, session );
	await check( width, 'readable beta query', async () => {
		const size = await inspect( cdp, session, "return parseFloat(getComputedStyle(q('.jetpack-search-input__field')).fontSize);" );
		assert( size >= 17, `Beta query font is ${ size }px` );
		return size;
	} );
	await check( width, 'beta controls meet 44px touch floor', async () => {
		const measurements = await inspect( cdp, session, `return [...document.querySelectorAll('${ SELECTOR.query },${ SELECTOR.clear },${ SELECTOR.close },.wp-block-jetpack-search-results-sort select,${ SELECTOR.filter }')].filter(visible).map(e=>({control:e.className||e.tagName,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));` );
		assert( measurements.every( ( item ) => item.width >= 44 && item.height >= 44 ), JSON.stringify( measurements ) );
		return measurements;
	} );
	await check( width, 'root-relative beta image is normalized before rendering', async () => {
		const image = await inspect( cdp, session, "const img=[...document.querySelectorAll('.jetpack-search-results__image')].find(e=>e.getAttribute('src'));return {src:img.src,loaded:img.naturalWidth>0,alt:img.alt};" );
		assert( /i[0-3]\.wp\.com\/hperkins\.blog\/wp-content\/uploads\//.test( image.src ), `Malformed Photon source: ${ image.src }` );
		assert( image.loaded, 'Corrected public thumbnail did not load' );
		assert.equal( image.alt, '' );
		return image;
	} );
	await check( width, 'invalid User 0 byline is suppressed and Henry remains', async () => {
		const authors = await inspect( cdp, session, "return [...document.querySelectorAll('.jetpack-search-results__author')].filter(visible).map(e=>e.textContent.trim());" );
		assert( ! authors.includes( 'User 0' ) && authors.includes( 'Henry' ), JSON.stringify( authors ) );
		return authors;
	} );
	await check( width, 'control row fits without breaking Sort midword', async () => {
		const shape = await inspect( cdp, session, "const row=q('.jetpack-search-layout__results-header-controls');const r=row.getBoundingClientRect();const label=q('.wp-block-jetpack-search-results-sort label');const node=[...label.childNodes].find(n=>n.nodeType===3&&n.textContent.includes('Sort'));const at=node.textContent.indexOf('Sort');const range=document.createRange();range.setStart(node,at);range.setEnd(node,at+4);return {left:r.left,right:r.right,viewport:innerWidth,wordLines:range.getClientRects().length,scroll:row.scrollWidth,client:row.clientWidth};" );
		assert( shape.left >= 0 && shape.right <= width && shape.wordLines === 1 && shape.scroll <= shape.client + 1, JSON.stringify( shape ) );
		return shape;
	} );
	await screenshot( cdp, session, `${ width }-results` );
	if ( width < 992 ) {
		await check( width, 'filter Escape dismisses only filters and preserves query', async () => {
			await click( cdp, session, SELECTOR.filter );
			await inspect( cdp, session, `q(${ JSON.stringify( SELECTOR.panel ) }).querySelector('input[type="checkbox"]').focus();` );
			await pressKey( cdp, session, 'Escape' );
			await wait( 300 );
			assert( await inspect( cdp, session, `return visible(q(${ JSON.stringify( SELECTOR.overlay ) }))&&!visible(q(${ JSON.stringify( SELECTOR.panel ) }))&&q(${ JSON.stringify( SELECTOR.query ) }).value==='resume'&&document.activeElement===q(${ JSON.stringify( SELECTOR.filter ) });` ), 'Escape closed search, lost the query, or failed to restore filter trigger' );
		} );
		// A failed nested-Escape must not erase the remaining independent checks.
		if ( ! await inspect( cdp, session, `return visible(q(${ JSON.stringify( SELECTOR.overlay ) }));` ) ) {
			await cdp.send( 'Page.navigate', { url: origin + '/?q=resume' }, session );
			await condition( cdp, session, "!!q('.jetpack-search-results__title a[href]')", 'results after baseline close' );
			await settled( cdp, session );
		}
	}
	await check( width, 'removing last active pill preserves useful focus', async () => {
		if ( width < 992 ) await click( cdp, session, SELECTOR.filter );
		await click( cdp, session, 'input[type="checkbox"][value="page"]' );
		await settled( cdp, session );
		await click( cdp, session, '.jetpack-search-active-filters__pill' );
		await settled( cdp, session );
		const focus = await inspect( cdp, session, `const active=document.activeElement;return {tag:active.tagName,visible:visible(active),useful:active.matches('${ SELECTOR.filter },${ SELECTOR.query },.jetpack-search-active-filters__pill,input[type="checkbox"]')};` );
		assert( focus.visible && focus.useful, JSON.stringify( focus ) );
		return focus;
	} );
	if ( width < 992 && await inspect( cdp, session, `return visible(q(${ JSON.stringify( SELECTOR.panel ) }));` ) ) await click( cdp, session, SELECTOR.filter );
	await check( width, 'Clear returns focus to beta query', async () => {
		await click( cdp, session, SELECTOR.clear );
		await settled( cdp, session );
		assert( await inspect( cdp, session, `return document.activeElement===q(${ JSON.stringify( SELECTOR.query ) })&&q(${ JSON.stringify( SELECTOR.query ) }).value==='';` ), 'Disappearing Clear control lost input focus' );
	} );
	async function recovery( state ) {
		const found = await inspect( cdp, session, "const recovery=q('.hp-search-recovery');return {visible:visible(recovery),links:recovery?[...recovery.querySelectorAll('a')].map(a=>({label:a.textContent.trim(),path:new URL(a.href).pathname})):[],resultsVisible:[...document.querySelectorAll('.jetpack-search-results__item:not(.jetpack-search-results__item--skeleton)')].some(visible)};" );
		assert( found.visible && ! found.resultsVisible, `${ state }: ${ JSON.stringify( found ) }` );
		assert.deepEqual( found.links, [ { label: 'Work', path: '/work/' }, { label: 'Essays', path: '/essays/' }, { label: 'About', path: '/about/' } ] );
		return found;
	}
	await check( width, 'empty beta query offers direct recovery without popular utility results', () => recovery( 'empty' ) );
	await screenshot( cdp, session, `${ width }-empty` );
	await query( cdp, session, 'zz-hperkins-no-results-20260920' );
	await check( width, 'beta no-results offers direct recovery', () => recovery( 'no-results' ) );
	await screenshot( cdp, session, `${ width }-no-results` );
	await query( cdp, session, 'resume' );
	await check( width, 'broken beta image becomes text-only', async () => {
		// Change a record in this isolated browser's public store, not a bound DOM
		// attribute that Interactivity may legitimately restore on its next render.
		await evaluate( cdp, session, "import('@wordpress/interactivity').then(({store})=>{const result=store('jetpack-search').state.results.find(result=>result.imageUrl);result.imageUrl=location.origin+'/missing-search-image.png';result.imageBackgroundImage='url('+JSON.stringify(result.imageUrl)+')';})" );
		await condition( cdp, session, "!![...document.querySelectorAll('.jetpack-search-results__image')].find(e=>e.getAttribute('src')?.includes('missing-search-image'))", 'fault-injected result image' );
		await inspect( cdp, session, "[...document.querySelectorAll('.jetpack-search-results__image')].find(e=>e.getAttribute('src')?.includes('missing-search-image')).loading='eager';" );
		await wait( 350 );
		assert( await inspect( cdp, session, "const img=[...document.querySelectorAll('.jetpack-search-results__image')].find(e=>e.getAttribute('src')?.includes('missing-search-image'));return img&&!visible(img)&&visible(img.closest('.jetpack-search-results__item').querySelector('.jetpack-search-results__title-link'));" ), 'Broken image remains exposed or hides its result title' );
	} );
	await check( width, 'populated Close restores visible Council trigger after reload', async () => {
		const previous = await evaluate( cdp, session, 'performance.timeOrigin' );
		const loaded = cdp.once( 'Page.loadEventFired', session );
		await click( cdp, session, SELECTOR.close );
		await loaded;
		await wait( 250 );
		const state = await inspect( cdp, session, "return {query:location.search,document:performance.timeOrigin,trigger:document.activeElement.getAttribute('data-hp-header-trigger'),visible:visible(document.activeElement)};" );
		assert( state.document !== previous && ! new URLSearchParams( state.query ).has( 'q' ), 'Close did not follow the real beta reload path' );
		assert( state.visible && state.trigger === ( width < 782 ? 'drawer' : 'search' ), JSON.stringify( state ) );
		return state;
	} );
	assert.deepEqual( exceptions, [] );
	stopErrors();
	await cdp.send( 'Target.closeTarget', { targetId } );
}

async function main() {
	const { server, origin } = await serve();
	console.log( `Jetpack beta fixture: ${ origin }/?q=resume` );
	if ( process.argv.includes( '--serve' ) ) return;
	fs.mkdirSync( CAPTURE, { recursive: true } );
	try { await withChrome( async ( cdp ) => {
		for ( const width of [ 1440, 390 ] ) {
			for ( const journey of [ 'direct', 'header' ] ) {
				for ( const delayed of [ false, true ] ) {
					await check( width, `${ journey } startup hydrates results and filters${ delayed ? ' with delayed real modules' : '' }`, () => startup( cdp, origin, width, journey, delayed ) );
				}
			}
		}
		if ( ! process.argv.includes( '--startup-only' ) ) {
			for ( const width of [ 1440, 390, 320 ] ) await verify( cdp, origin, width );
		}
	} ); }
	finally { await new Promise( ( resolve ) => server.close( resolve ) ); }
	fs.writeFileSync( path.join( CAPTURE, 'results.json' ), JSON.stringify( { mode: BASELINE ? 'baseline' : 'candidate', actualModules: true, checks: results }, null, 2 ) + '\n' );
	const failures = results.filter( ( result ) => ! result.passed );
	console.log( `${ results.length - failures.length }/${ results.length } beta checks passed. Evidence: ${ CAPTURE }` );
	if ( failures.length ) process.exitCode = 1;
}

main().catch( ( error ) => { console.error( error ); process.exitCode = 1; } );
