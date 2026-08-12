#!/usr/bin/env node

const fs = require( 'node:fs' );
const path = require( 'node:path' );

const {
	getOrigin,
	isLoopbackOrigin,
	stripWpcomCacheVersionFromRenderedHref,
} = require( './lib/site-url' );

const ROOT = path.join( __dirname, '..' );
const RESUME_PATH = '/one-page-resume/';
const PDF_PATH = '/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf';
const OLD_UPLOAD_PATH = '/wp-content/uploads/2026/06/henry-perkins-wordpress-ai-open-source-resume-2026-06-30.pdf';

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function parseUrl( value, label ) {
	try {
		return new URL( value );
	} catch {
		throw new Error( `${ label } is not a valid URL: ${ value }` );
	}
}

function hasOnlyVersionQuery( url ) {
	if ( url.hash || url.username || url.password ) {
		return false;
	}
	const entries = [ ...url.searchParams.entries() ];
	if ( entries.length !== 1 || entries[0][0] !== 'v' ) {
		return false;
	}

	return /^\d+$/.test( entries[0][1] );
}

function hasDiagnosticPreflightQuery( location, requested ) {
	if ( location.hash || location.username || location.password || requested.hash || requested.username || requested.password ) {
		return false;
	}
	const inbound = [ ...requested.searchParams.entries() ];
	const forwarded = [ ...location.searchParams.entries() ];
	if ( forwarded.length !== inbound.length + 1 ) {
		return false;
	}
	const versionEntries = forwarded.filter( ( [ key ] ) => key === 'v' );
	if ( versionEntries.length !== 1 || ! /^[0-9a-f]+$/i.test( versionEntries[ 0 ][ 1 ] ) ) {
		return false;
	}
	return inbound.every( ( entry ) => forwarded.some( ( candidate ) => candidate[ 0 ] === entry[ 0 ] && candidate[ 1 ] === entry[ 1 ] ) );
}

function assertVerificationTransport( url, label, requireLocal ) {
	if ( requireLocal ) {
		assert(
			isLoopbackOrigin( url.href ),
			`${ label } must use localhost or a loopback IP in --require-local mode.`
		);
		return;
	}

	assert( url.protocol === 'https:', 'Public résumé verification requires HTTPS.' );
}

function assertSafeFetchUrl( value, expectedOrigin, options = {} ) {
	const label = options.label || 'Fetch URL';
	const requireLocal = options.requireLocal === true;
	const url = value instanceof URL ? value : parseUrl( value, label );
	const expected = expectedOrigin instanceof URL
		? expectedOrigin
		: parseUrl( expectedOrigin, 'Expected fetch origin' );

	assert( ! url.hash, `${ label } must not include a fragment.` );
	assert( ! url.username && ! url.password, `${ label } must not include credentials.` );
	assertVerificationTransport( url, label, requireLocal );
	assert( url.origin === expected.origin, `${ label } must stay on the expected origin.` );
	if ( options.allowedPaths ) {
		assert(
			options.allowedPaths.includes( url.pathname ),
			`${ label } must use an allowed résumé path.`
		);
	}

	return url;
}

function validateRedirectChain( steps, requestedUrl, expectedOrigin, options = { strict: true } ) {
	assert( Array.isArray( steps ) && steps.length > 0, 'Redirect chain must include at least one response.' );

	const strict = options.strict !== false;
	const requireLocal = options.requireLocal === true;
	assert( ! ( requireLocal && ! strict ), 'Local résumé verification is strict and cannot enable diagnostic preflights.' );
	const requested = parseUrl( requestedUrl, 'Requested URL' );
	const expected = parseUrl( expectedOrigin, 'Expected origin' );
	assert( ! expected.hash && ! expected.username && ! expected.password, 'Expected origin must not include a fragment or credentials.' );
	assertVerificationTransport( expected, 'Expected origin', requireLocal );
	const origin = expected.origin;
	assert( ! requested.hash, 'Requested URL must not include a fragment.' );
	assert( ! requested.username && ! requested.password, 'Requested URL must not include credentials.' );
	assertVerificationTransport( requested, 'Requested URL', requireLocal );
	assert( requested.origin === origin, 'Requested URL must use the expected origin.' );
	assert( requested.pathname === RESUME_PATH, `Requested URL must use ${ RESUME_PATH }.` );

	let themeRedirects = 0;
	let platformPreflights = 0;
	let finalResponses = 0;
	let previousLocation = null;
	const seenRequestUrls = new Set();

	for ( const [ index, step ] of steps.entries() ) {
		const request = parseUrl( step.requestUrl, `Step ${ index + 1 } request URL` );
		assert( ! request.hash, `Step ${ index + 1 } request URL must not include a fragment.` );
		assert( ! request.username && ! request.password, `Step ${ index + 1 } request URL must not include credentials.` );
		assertVerificationTransport( request, `Step ${ index + 1 } request URL`, requireLocal );
		assert( request.origin === origin, `Step ${ index + 1 } must stay on the expected origin.` );
		assert( ! seenRequestUrls.has( request.href ), `Redirect loop repeats request URL: ${ request.href }` );
		seenRequestUrls.add( request.href );

		if ( index === 0 ) {
			assert( request.href === requested.href, 'First redirect step does not match the requested URL.' );
		} else {
			assert( request.href === previousLocation, 'Redirect Location does not match the next request URL.' );
		}

		const isFinal = ! step.location;
		if ( isFinal ) {
			finalResponses += 1;
			assert( step.status === 200 || step.status === 206, 'Final PDF response must be 200 or 206.' );
			assert( /^application\/pdf(?:\s*;|$)/i.test( step.contentType || '' ), 'Final response content type must be application/pdf.' );
			assert( request.origin === origin, 'Final PDF request must stay on the expected origin.' );
			assert( request.pathname === PDF_PATH, `Final response must use the expected PDF path: ${ PDF_PATH }` );
			continue;
		}

		assert( typeof step.location === 'string' && step.location.length > 0, `Redirect step ${ index + 1 } is missing a Location.` );
		const location = parseUrl( step.location, `Step ${ index + 1 } Location` );
		assert( ! location.hash, `Step ${ index + 1 } Location must not include a fragment.` );
		assert( ! location.username && ! location.password, `Step ${ index + 1 } Location must not include credentials.` );
		previousLocation = location.href;

		if ( step.status === 307 && step.redirectBy === 'WordPress' ) {
			platformPreflights += 1;
			assert( ! strict, 'Strict verification allows one redirect and rejects a WordPress preflight.' );
			assert( platformPreflights <= 1, 'Redirect chain contains more than one WordPress preflight.' );
			assert( location.origin === origin, 'WordPress preflight Location must stay on the expected origin.' );
			assert( location.pathname === RESUME_PATH, 'WordPress preflight must retain the résumé route path.' );
			assert(
				hasDiagnosticPreflightQuery( location, requested ),
				'WordPress preflight query may only preserve the requested query and append v=<hex>.'
			);
			continue;
		}

		assert( step.status === 302, 'Theme résumé redirect must use status 302.' );
		assert( step.redirectBy === 'hperkins-tokens', 'Résumé redirect must be owned by hperkins-tokens.' );
		themeRedirects += 1;
		assert( location.origin === origin, 'Résumé PDF Location must stay on the expected origin.' );
		assert( location.pathname === PDF_PATH, `Résumé redirect Location must use the expected PDF path: ${ PDF_PATH }` );
		assert( hasOnlyVersionQuery( location ), 'Résumé PDF query must contain only the deliberate v=<mtime> cache key; inbound query parameters must not propagate.' );
	}

	assert( themeRedirects === 1, 'Redirect chain must contain exactly one theme-owned 302.' );
	assert( finalResponses === 1, 'Redirect chain must end with one final PDF response.' );

	return { themeRedirects, platformPreflights };
}

function read( file ) {
	return fs.readFileSync( path.join( ROOT, file ), 'utf8' ).replace( /\r\n/g, '\n' );
}

function assertIncludes( file, values ) {
	const source = read( file );
	for ( const value of values ) {
		assert( source.includes( value ), `${ file } is missing: ${ value }` );
	}
}

function visibleHrefs( source ) {
	const html = String( source || '' ).replace( /<!--[\s\S]*?-->/g, '' );
	return [ ...html.matchAll( /<a\b([^>]*)>/gi ) ].flatMap( ( anchor ) => {
		const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec( anchor[ 1 ] );
		return href ? [ href[ 1 ] || href[ 2 ] ] : [];
	} );
}

function assertSemanticResumeLinks( file ) {
	const hrefs = visibleHrefs( read( file ) );
	assert( hrefs.includes( RESUME_PATH ), `${ file } must link visibly to ${ RESUME_PATH }.` );
	for ( const href of hrefs ) {
		const pathname = new URL( href, 'https://source.invalid' ).pathname;
		assert( pathname !== PDF_PATH, `${ file } must not link visibly to the theme PDF asset.` );
		assert(
			pathname !== OLD_UPLOAD_PATH,
			`${ file } must not retain the old uploaded résumé URL: ${ href }`
		);
	}
}

function verifySource() {
	assertIncludes( 'functions.php', [
		"require_once get_stylesheet_directory() . '/inc/resume-route.php';",
	] );
	assertIncludes( 'inc/resume-route.php', [
		"home_url( '/one-page-resume/' )",
		"'GET', 'HEAD'",
		'wp_safe_redirect( $target, 302, \'hperkins-tokens\' )',
		"'assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf'",
		"add_action( 'template_redirect', 'hperkins_tokens_redirect_one_page_resume', 1 );",
	] );
	for ( const file of [
		'parts/footer.html',
		'content/page-drafts/job-placement-digest.html',
		'content/page-drafts/about.html',
	] ) {
		assertSemanticResumeLinks( file );
	}
	assert( read( 'parts/footer.html' ).includes( 'One-page résumé PDF' ), 'Footer must retain the one-page résumé label.' );
}

async function collectChain( requestedUrl, method, options = {} ) {
	const fetchImpl = options.fetchImpl || globalThis.fetch;
	assert( typeof fetchImpl === 'function', 'A fetch implementation is required.' );
	const requireLocal = options.requireLocal === true;
	const expected = parseUrl(
		options.expectedOrigin || parseUrl( requestedUrl, 'Requested URL' ).origin,
		'Expected fetch origin'
	);
	assert( ! expected.hash && ! expected.username && ! expected.password, 'Expected fetch origin must not include a fragment or credentials.' );
	assertVerificationTransport( expected, 'Expected fetch origin', requireLocal );
	const initial = assertSafeFetchUrl( requestedUrl, expected, {
		allowedPaths: [ RESUME_PATH ],
		label: 'Initial résumé request URL',
		requireLocal,
	} );
	const steps = [];
	const fetchedUrls = new Set();
	let current = initial.href;
	for ( let index = 0; index < 4; index++ ) {
		assert( ! fetchedUrls.has( current ), `Redirect loop repeats fetch URL: ${ current }` );
		fetchedUrls.add( current );
		let response;
		try {
			response = await fetchImpl( current, { method, redirect: 'manual' } );
		} catch ( cause ) {
			throw new Error( `${ method } ${ current } failed: ${ cause.message }`, { cause } );
		}
		const rawLocation = response.headers.get( 'location' );
		let location = null;
		if ( rawLocation ) {
			const resolved = assertSafeFetchUrl( new URL( rawLocation, current ), expected, {
				allowedPaths: [ RESUME_PATH, PDF_PATH ],
				label: `Redirect ${ index + 1 } destination`,
				requireLocal,
			} );
			assert( ! fetchedUrls.has( resolved.href ), `Redirect loop repeats fetch URL: ${ resolved.href }` );
			location = resolved.href;
		}
		const step = {
			requestUrl: current,
			status: response.status,
			location,
			redirectBy: response.headers.get( 'x-redirect-by' ),
			contentType: response.headers.get( 'content-type' ),
		};
		if ( ! location && method === 'GET' ) {
			step.bodyPrefix = Buffer.from( await response.arrayBuffer() ).subarray( 0, 5 ).toString( 'ascii' );
		}
		steps.push( step );
		if ( ! location ) {
			return steps;
		}
		current = location;
	}
	throw new Error( `${ method } résumé route exceeded the four-response diagnostic limit.` );
}

async function verifyHttpMethod( origin, method, options ) {
	const requestedUrl = new URL( `${ RESUME_PATH }?utm_source=wcus`, origin ).href;
	const steps = await collectChain( requestedUrl, method, {
		expectedOrigin: origin,
		requireLocal: options.requireLocal,
	} );
	const result = validateRedirectChain( steps, requestedUrl, origin, options );
	assert( result.themeRedirects === 1, `${ method } must contain exactly one theme redirect.` );
	if ( method === 'GET' ) {
		assert( steps.at( -1 ).bodyPrefix === '%PDF-', `Final GET body begins ${ JSON.stringify( steps.at( -1 ).bodyPrefix ) }, not %PDF-.` );
	}
	return steps;
}

function acceptedSnapshotsPublished() {
	return [
		'content/page-snapshots/job-placement-digest.html',
		'content/page-snapshots/about.html',
	].every( ( file ) => visibleHrefs( read( file ) ).includes( RESUME_PATH ) );
}

async function verifyRenderedLinks( origin, options = {} ) {
	const snapshotsPublished = options.snapshotsPublished ?? acceptedSnapshotsPublished();
	if ( ! snapshotsPublished ) {
		console.log( 'candidate prepared; accepted snapshots still prepublication' );
		return;
	}
	const fetchImpl = options.fetchImpl || globalThis.fetch;
	assert( typeof fetchImpl === 'function', 'A fetch implementation is required.' );
	const requireLocal = options.requireLocal === true;
	const expected = parseUrl( origin, 'Expected rendered-page origin' );
	assertVerificationTransport( expected, 'Expected rendered-page origin', requireLocal );

	for ( const pathname of [ '/', '/about/', '/job-placement-digest/' ] ) {
		const url = assertSafeFetchUrl( new URL( pathname, origin ), expected, {
			allowedPaths: [ pathname ],
			label: `Rendered-page probe ${ pathname }`,
			requireLocal,
		} ).href;
		let documentUrl = url;
		let response = await fetchImpl( documentUrl, { redirect: 'manual' } );
		const location = response.headers.get( 'location' );
		if ( location ) {
			assert( ! requireLocal, `${ url } returned an unexpected redirect in local verification.` );
			assert( response.status === 307, `${ url } returned redirect ${ response.status }; expected the WordPress cache preflight to use 307.` );
			assert( response.headers.get( 'host-header' ) === 'WordPress.com', `${ url } redirect is not served by WordPress.com.` );
			assert(
				[ null, 'WordPress' ].includes( response.headers.get( 'x-redirect-by' ) ),
				`${ url } redirect declares a non-WordPress owner.`
			);
			const destination = assertSafeFetchUrl( new URL( location, documentUrl ), expected, {
				allowedPaths: [ pathname ],
				label: `Rendered-page cache preflight ${ pathname }`,
				requireLocal,
			} );
			assert( destination.pathname === pathname, `${ url } cache preflight changed the page path.` );
			assert(
				hasDiagnosticPreflightQuery( destination, new URL( documentUrl ) ),
				`${ url } cache preflight may only append one v=<hex> query key.`
			);
			documentUrl = destination.href;
			response = await fetchImpl( documentUrl, { redirect: 'manual' } );
			assert(
				! response.headers.get( 'location' ),
				`${ documentUrl } returned a second redirect; refusing to follow its Location.`
			);
		}
		assert( response.ok, `${ url } returned ${ response.status } while checking rendered résumé links.` );
		const hrefs = visibleHrefs( await response.text() ).map( ( href ) =>
			stripWpcomCacheVersionFromRenderedHref( href, documentUrl )
		);
		assert( hrefs.includes( RESUME_PATH ), `${ url } has no rendered ${ RESUME_PATH } link.` );
		assert(
			hrefs.every( ( href ) => ! [ PDF_PATH, OLD_UPLOAD_PATH ].includes( new URL( href, url ).pathname ) ),
			`${ url } exposes a retired direct résumé link.`
		);
	}
}

async function main() {
	const argv = process.argv.slice( 2 );
	for ( const option of argv ) {
		assert( [ '--source-only', '--diagnostic', '--require-local' ].includes( option ), `Unknown option: ${ option }.` );
	}
	const diagnostic = argv.includes( '--diagnostic' );
	const requireLocal = argv.includes( '--require-local' );
	assert( ! ( diagnostic && requireLocal ), '--diagnostic and --require-local are mutually exclusive.' );
	verifySource();
	if ( argv.includes( '--source-only' ) ) {
		console.log( 'Resume route source verification passed: footer and both candidates use the semantic route.' );
		return;
	}

	const strict = ! diagnostic;
	const origin = getOrigin();
	assertVerificationTransport( parseUrl( origin, 'HPERKINS_ORIGIN' ), 'HPERKINS_ORIGIN', requireLocal );
	const options = { strict, requireLocal };
	const getSteps = await verifyHttpMethod( origin, 'GET', options );
	const headSteps = await verifyHttpMethod( origin, 'HEAD', options );
	assert(
		getSteps.at( -2 ).location === headSteps.at( -2 ).location,
		'GET and HEAD must redirect to the same versioned PDF URL.'
	);
	await verifyRenderedLinks( origin, { requireLocal } );
	const mode = requireLocal ? 'strict local' : ( strict ? 'strict public' : 'diagnostic public' );
	console.log( `Resume route ${ mode } verification passed at ${ origin } for GET and HEAD.` );
}

if ( require.main === module ) {
	main().catch( ( error ) => {
		console.error( error.message );
		process.exitCode = 1;
	} );
}

module.exports = { collectChain, validateRedirectChain, verifyRenderedLinks, visibleHrefs };
