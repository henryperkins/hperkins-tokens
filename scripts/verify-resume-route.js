#!/usr/bin/env node

const fs = require( 'node:fs' );
const path = require( 'node:path' );

const ROOT = path.join( __dirname, '..' );
const RESUME_PATH = '/one-page-resume/';
const PDF_PATH = '/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf';

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

function hasOnlyVersionQuery( url, requireHex = false ) {
	const entries = [ ...url.searchParams.entries() ];
	if ( entries.length !== 1 || entries[0][0] !== 'v' ) {
		return false;
	}

	return ! requireHex || /^[0-9a-f]+$/i.test( entries[0][1] );
}

function validateRedirectChain( steps, requestedUrl, expectedOrigin, options = { strict: true } ) {
	assert( Array.isArray( steps ) && steps.length > 0, 'Redirect chain must include at least one response.' );

	const strict = options.strict !== false;
	const requested = parseUrl( requestedUrl, 'Requested URL' );
	const origin = parseUrl( expectedOrigin, 'Expected origin' ).origin;
	assert( requested.origin === origin, 'Requested URL must use the expected origin.' );
	assert( requested.pathname === RESUME_PATH, `Requested URL must use ${ RESUME_PATH }.` );

	let themeRedirects = 0;
	let platformPreflights = 0;
	let finalResponses = 0;
	let previousLocation = null;
	const seenRequestUrls = new Set();

	for ( const [ index, step ] of steps.entries() ) {
		const request = parseUrl( step.requestUrl, `Step ${ index + 1 } request URL` );
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
		previousLocation = location.href;

		if ( step.status === 307 && step.redirectBy === 'WordPress' ) {
			platformPreflights += 1;
			assert( platformPreflights <= 1, 'Redirect chain contains more than one WordPress preflight.' );
			assert( location.origin === origin, 'WordPress preflight Location must stay on the expected origin.' );
			assert( location.pathname === RESUME_PATH, 'WordPress preflight must retain the résumé route path.' );
			assert( hasOnlyVersionQuery( location, true ), 'WordPress preflight query must contain only v=<hex>.' );
			continue;
		}

		assert( step.status === 302, 'Theme résumé redirect must use status 302.' );
		assert( step.redirectBy === 'hperkins-tokens', 'Résumé redirect must be owned by hperkins-tokens.' );
		themeRedirects += 1;
		assert( location.origin === origin, 'Résumé PDF Location must stay on the expected origin.' );
		assert( location.pathname === PDF_PATH, `Résumé redirect Location must use the expected PDF path: ${ PDF_PATH }` );
		assert(
			location.search === '' || hasOnlyVersionQuery( location ),
			'Résumé PDF query may contain only the destination v key; inbound query parameters must not propagate.'
		);
	}

	assert( themeRedirects === 1, 'Redirect chain must contain exactly one theme-owned 302.' );
	assert( finalResponses === 1, 'Redirect chain must end with one final PDF response.' );
	if ( strict ) {
		assert( platformPreflights === 0, 'Strict verification allows one redirect and rejects a WordPress preflight.' );
	}

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
	assertIncludes( 'parts/footer.html', [
		'<a href="/one-page-resume/">',
		'One-page résumé PDF',
	] );

	const footer = read( 'parts/footer.html' );
	assert( ! footer.includes( `href="${ PDF_PATH }"` ), 'Footer must link to the semantic résumé route, not the PDF asset.' );
}

if ( require.main === module ) {
	try {
		verifySource();
		console.log( 'Resume route source verification passed: semantic footer link and temporary safe redirect are present.' );
	} catch ( error ) {
		console.error( error.message );
		process.exitCode = 1;
	}
}

module.exports = { validateRedirectChain };
