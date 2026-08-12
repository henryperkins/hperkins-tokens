const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const {
	collectChain,
	validateRedirectChain,
	verifyRenderedLinks,
	visibleHrefs,
} = require( '../verify-resume-route' );

function mockResponse( {
	status = 200,
	location = null,
	redirectBy = null,
	hostHeader = null,
	contentType = 'text/html; charset=UTF-8',
	body = '',
} = {} ) {
	const values = new Map( [
		[ 'location', location ],
		[ 'x-redirect-by', redirectBy ],
		[ 'host-header', hostHeader ],
		[ 'content-type', contentType ],
	] );
	return {
		status,
		ok: status >= 200 && status < 300,
		headers: { get: ( name ) => values.get( name.toLowerCase() ) || null },
		arrayBuffer: async () => Buffer.from( body ),
		text: async () => body,
	};
}

test( 'visibleHrefs returns actual anchors and ignores commented links', () => {
	assert.equal( typeof visibleHrefs, 'function', 'resume route must expose its anchor parser for mutation coverage' );
	assert.deepEqual(
		visibleHrefs( '<!-- <a href="/one-page-resume/">comment only</a> --><p><a href="/about/">About</a></p><!-- <a href="/retired.pdf">retired</a> -->' ),
		[ '/about/' ]
	);
} );

test( 'collectChain validates every local redirect destination before issuing its fetch', async () => {
	const requested = 'http://localhost:8882/one-page-resume/?utm_source=wcus';
	const unsafeDestinations = [
		'http://192.168.1.25/latest/meta-data/',
		'http://169.254.169.254/latest/meta-data/',
		'https://example.com/resume.pdf',
		'http://localhost:9999/one-page-resume/',
		'http://user:pass@localhost:8882/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123',
		'http://localhost:8882/wp-admin/profile.php',
		requested,
	];

	for ( const location of unsafeDestinations ) {
		const calls = [];
		const fetchImpl = async ( url, init ) => {
			calls.push( { url, init } );
			return mockResponse( {
				status: 302,
				location,
				redirectBy: 'hperkins-tokens',
			} );
		};

		await assert.rejects(
			() => collectChain( requested, 'GET', {
				expectedOrigin: 'http://localhost:8882',
				fetchImpl,
				requireLocal: true,
			} ),
			/loopback|origin|credentials|path|loop/i,
			location
		);
		assert.deepEqual(
			calls.map( ( call ) => call.url ),
			[ requested ],
			`unsafe redirect destination was requested: ${ location }`
		);
		assert.equal( calls[0].init.redirect, 'manual' );
	}
} );

test( 'collectChain rejects an unsafe initial local URL before issuing any fetch', async () => {
	const calls = [];
	await assert.rejects(
		() => collectChain( 'http://169.254.169.254/one-page-resume/', 'HEAD', {
			expectedOrigin: 'http://localhost:8882',
			fetchImpl: async ( url ) => {
				calls.push( url );
				return mockResponse();
			},
			requireLocal: true,
		} ),
		/loopback|origin/i
	);
	assert.deepEqual( calls, [] );
} );

test( 'collectChain follows a guarded loopback chain with manual redirects', async () => {
	const requested = 'http://127.0.0.1:8882/one-page-resume/?utm_source=wcus';
	const pdf = 'http://127.0.0.1:8882/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123';
	const calls = [];
	const fetchImpl = async ( url, init ) => {
		calls.push( { url, init } );
		if ( url === requested ) {
			return mockResponse( { status: 302, location: pdf, redirectBy: 'hperkins-tokens' } );
		}
		return mockResponse( { contentType: 'application/pdf', body: '%PDF-1.7' } );
	};

	const steps = await collectChain( requested, 'GET', {
		expectedOrigin: 'http://127.0.0.1:8882',
		fetchImpl,
		requireLocal: true,
	} );
	assert.deepEqual( calls.map( ( call ) => call.url ), [ requested, pdf ] );
	assert.ok( calls.every( ( call ) => call.init.redirect === 'manual' ) );
	assert.equal( steps.at( -1 ).bodyPrefix, '%PDF-' );
	assert.deepEqual(
		validateRedirectChain( steps, requested, 'http://127.0.0.1:8882', { strict: true, requireLocal: true } ),
		{ themeRedirects: 1, platformPreflights: 0 }
	);
} );

test( 'collectChain preserves guarded public GET and HEAD chains', async () => {
	const requested = 'https://hperkins.blog/one-page-resume/?utm_source=wcus';
	const pdf = 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123';

	for ( const method of [ 'GET', 'HEAD' ] ) {
		const calls = [];
		const steps = await collectChain( requested, method, {
			expectedOrigin: 'https://hperkins.blog',
			fetchImpl: async ( url, init ) => {
				calls.push( { url, init } );
				return url === requested
					? mockResponse( { status: 302, location: pdf, redirectBy: 'hperkins-tokens' } )
					: mockResponse( { contentType: 'application/pdf', body: '%PDF-1.7' } );
			},
		} );

		assert.deepEqual( calls.map( ( call ) => call.url ), [ requested, pdf ] );
		assert.ok( calls.every( ( call ) => call.init.method === method && call.init.redirect === 'manual' ) );
		assert.equal( steps.at( -1 ).bodyPrefix, method === 'GET' ? '%PDF-' : undefined );
		assert.doesNotThrow( () => validateRedirectChain( steps, requested, 'https://hperkins.blog' ) );
	}
} );

test( 'rendered-link probes request every page with automatic redirects disabled', async () => {
	const calls = [];
	await verifyRenderedLinks( 'https://hperkins.blog', {
		fetchImpl: async ( url, init ) => {
			calls.push( { url, init } );
			return mockResponse( { body: '<a href="/one-page-resume/">Résumé</a>' } );
		},
		snapshotsPublished: true,
	} );

	assert.deepEqual(
		calls.map( ( call ) => new URL( call.url ).pathname ),
		[ '/', '/about/', '/job-placement-digest/' ]
	);
	assert.ok( calls.every( ( call ) => call.init.redirect === 'manual' ) );
} );

test( 'rendered-link probes follow one guarded WordPress cache preflight and normalize its propagated key', async () => {
	const version = '0b3b97fa6688';
	const calls = [];
	await verifyRenderedLinks( 'https://hperkins.blog', {
		fetchImpl: async ( url, init ) => {
			calls.push( { url, init } );
			const parsed = new URL( url );
			if ( ! parsed.search ) {
				return mockResponse( {
					status: 307,
					location: `${ parsed.pathname }?v=${ version }`,
					hostHeader: 'WordPress.com',
				} );
			}
			return mockResponse( {
				body: `<a href="/one-page-resume/?v=${ version }">Résumé</a>`,
			} );
		},
		snapshotsPublished: true,
	} );

	assert.deepEqual(
		calls.map( ( call ) => call.url ),
		[
			'https://hperkins.blog/',
			`https://hperkins.blog/?v=${ version }`,
			'https://hperkins.blog/about/',
			`https://hperkins.blog/about/?v=${ version }`,
			'https://hperkins.blog/job-placement-digest/',
			`https://hperkins.blog/job-placement-digest/?v=${ version }`,
		]
	);
	assert.ok( calls.every( ( call ) => call.init.redirect === 'manual' ) );
} );

test( 'rendered-link probes never follow an external Location', async () => {
	const calls = [];
	await assert.rejects(
		() => verifyRenderedLinks( 'https://hperkins.blog', {
			fetchImpl: async ( url, init ) => {
				calls.push( { url, init } );
				return mockResponse( { status: 302, location: 'https://example.com/capture' } );
			},
			snapshotsPublished: true,
		} ),
		/redirect|302/i
	);
	assert.equal( calls.length, 1 );
	assert.equal( calls[0].init.redirect, 'manual' );
} );

test( 'rendered-link probes reject malformed or unowned cache preflights before a second fetch', async () => {
	for ( const candidate of [
		{ status: 302, location: '/?v=0b3b97fa6688', hostHeader: 'WordPress.com' },
		{ status: 307, location: '/about/?v=0b3b97fa6688', hostHeader: 'WordPress.com' },
		{ status: 307, location: '/?v=0b3b97fa6688&extra=1', hostHeader: 'WordPress.com' },
		{ status: 307, location: '/?v=not-hex', hostHeader: 'WordPress.com' },
		{ status: 307, location: '/?v=0b3b97fa6688', hostHeader: 'other' },
		{ status: 307, location: '/?v=0b3b97fa6688', hostHeader: 'WordPress.com', redirectBy: 'other' },
	] ) {
		const calls = [];
		await assert.rejects(
			() => verifyRenderedLinks( 'https://hperkins.blog', {
				fetchImpl: async ( url, init ) => {
					calls.push( { url, init } );
					return mockResponse( candidate );
				},
				snapshotsPublished: true,
			} ),
			/307|path|query|WordPress|owned/i
		);
		assert.equal( calls.length, 1, JSON.stringify( candidate ) );
	}
} );

test( 'rendered-link probes accept the optional WordPress owner header and reject a second redirect', async () => {
	const version = '0b3b97fa6688';
	const calls = [];
	await assert.rejects(
		() => verifyRenderedLinks( 'https://hperkins.blog', {
			fetchImpl: async ( url, init ) => {
				calls.push( { url, init } );
				const parsed = new URL( url );
				return mockResponse( {
					status: 307,
					location: `${ parsed.pathname }?v=${ version }`,
					hostHeader: 'WordPress.com',
					redirectBy: 'WordPress',
				} );
			},
			snapshotsPublished: true,
		} ),
		/second redirect/i
	);
	assert.equal( calls.length, 2 );
	assert.ok( calls.every( ( call ) => call.init.redirect === 'manual' ) );
} );

test( 'accepts exactly one theme-owned 302 to the same-origin PDF', () => {
	const result = validateRedirectChain( [
		{
			requestUrl: 'https://hperkins.blog/one-page-resume/?utm_source=wcus',
			status: 302,
			location: 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123',
			redirectBy: 'hperkins-tokens',
			contentType: 'text/html; charset=UTF-8',
		},
		{
			requestUrl: 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123',
			status: 200,
			location: null,
			redirectBy: null,
			contentType: 'application/pdf',
		},
	], 'https://hperkins.blog/one-page-resume/?utm_source=wcus', 'https://hperkins.blog' );
	assert.equal( result.themeRedirects, 1 );
	assert.equal( result.platformPreflights, 0 );
} );

test( 'permits HTTP only for an explicitly required loopback run', () => {
	const requested = 'http://localhost:8882/one-page-resume/?utm_source=wcus';
	const pdf = 'http://localhost:8882/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123';
	const steps = [
		{ requestUrl: requested, status: 302, location: pdf, redirectBy: 'hperkins-tokens', contentType: 'text/html; charset=UTF-8' },
		{ requestUrl: pdf, status: 200, location: null, redirectBy: null, contentType: 'application/pdf' },
	];

	assert.throws(
		() => validateRedirectChain( steps, requested, 'http://localhost:8882' ),
		/Public.*HTTPS/
	);
	assert.deepEqual(
		validateRedirectChain( steps, requested, 'http://localhost:8882', { strict: true, requireLocal: true } ),
		{ themeRedirects: 1, platformPreflights: 0 }
	);
	assert.throws(
		() => validateRedirectChain( steps, requested, 'http://localhost:8882', { strict: false, requireLocal: true } ),
		/strict|diagnostic/
	);
} );

test( 'the local opt-in refuses non-loopback HTTP and keeps the PDF contract strict', () => {
	const requested = 'http://192.168.1.25/one-page-resume/?utm_source=wcus';
	const pdf = 'http://192.168.1.25/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123';
	const steps = [
		{ requestUrl: requested, status: 302, location: pdf, redirectBy: 'hperkins-tokens', contentType: 'text/html' },
		{ requestUrl: pdf, status: 200, location: null, redirectBy: null, contentType: 'application/pdf' },
	];

	assert.throws(
		() => validateRedirectChain( steps, requested, 'http://192.168.1.25', { strict: true, requireLocal: true } ),
		/localhost|loopback/
	);

	const localRequested = requested.replaceAll( '192.168.1.25', '[::1]:8882' );
	const localPdf = pdf.replaceAll( '192.168.1.25', '[::1]:8882' );
	const wrongType = [
		{ requestUrl: localRequested, status: 302, location: localPdf, redirectBy: 'hperkins-tokens', contentType: 'text/html' },
		{ requestUrl: localPdf, status: 200, location: null, redirectBy: null, contentType: 'text/html' },
	];
	assert.throws(
		() => validateRedirectChain( wrongType, localRequested, 'http://[::1]:8882', { strict: true, requireLocal: true } ),
		/application\/pdf/
	);
} );

test( 'local mode changes only transport and retains query, loop, and same-origin enforcement', () => {
	const requested = 'http://127.0.0.1:8882/one-page-resume/?utm_source=wcus';
	const pdf = 'http://127.0.0.1:8882/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123';
	const options = { strict: true, requireLocal: true };

	assert.throws( () => validateRedirectChain( [
		{ requestUrl: requested, status: 302, location: `${ pdf }&utm_source=wcus`, redirectBy: 'hperkins-tokens', contentType: 'text/html' },
		{ requestUrl: `${ pdf }&utm_source=wcus`, status: 200, location: null, redirectBy: null, contentType: 'application/pdf' },
	], requested, 'http://127.0.0.1:8882', options ), /query|v/ );

	assert.throws( () => validateRedirectChain( [
		{ requestUrl: requested, status: 302, location: 'http://localhost:8882/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123', redirectBy: 'hperkins-tokens', contentType: 'text/html' },
	], requested, 'http://127.0.0.1:8882', options ), /origin/ );

	assert.throws( () => validateRedirectChain( [
		{ requestUrl: requested, status: 302, location: pdf, redirectBy: 'hperkins-tokens', contentType: 'text/html' },
		{ requestUrl: pdf, status: 302, location: pdf, redirectBy: 'hperkins-tokens', contentType: 'text/html' },
		{ requestUrl: pdf, status: 200, location: null, redirectBy: null, contentType: 'application/pdf' },
	], requested, 'http://127.0.0.1:8882', options ), /loop/ );
} );

test( 'rejects a loop, a permanent redirect, a foreign origin, or inbound query propagation', () => {
	assert.throws( () => validateRedirectChain( [
		{ requestUrl: 'https://hperkins.blog/one-page-resume/', status: 302, location: 'https://hperkins.blog/one-page-resume/', redirectBy: 'hperkins-tokens', contentType: 'text/html' },
	], 'https://hperkins.blog/one-page-resume/', 'https://hperkins.blog' ), /loop|PDF/ );
	assert.throws( () => validateRedirectChain( [
		{ requestUrl: 'https://hperkins.blog/one-page-resume/', status: 301, location: 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf', redirectBy: 'hperkins-tokens', contentType: 'text/html' },
	], 'https://hperkins.blog/one-page-resume/', 'https://hperkins.blog' ), /302/ );
	assert.throws( () => validateRedirectChain( [
		{ requestUrl: 'https://hperkins.blog/one-page-resume/', status: 302, location: 'https://example.com/resume.pdf', redirectBy: 'hperkins-tokens', contentType: 'text/html' },
	], 'https://hperkins.blog/one-page-resume/', 'https://hperkins.blog' ), /origin/ );
	assert.throws( () => validateRedirectChain( [
		{ requestUrl: 'https://hperkins.blog/one-page-resume/?utm_source=wcus', status: 302, location: 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?utm_source=wcus', redirectBy: 'hperkins-tokens', contentType: 'text/html' },
	], 'https://hperkins.blog/one-page-resume/?utm_source=wcus', 'https://hperkins.blog' ), /query|v/ );
} );

test( 'classifies one WordPress cache-key preflight for diagnostics but not strict acceptance', () => {
	const steps = [
		{ requestUrl: 'https://hperkins.blog/one-page-resume/?utm_source=wcus', status: 307, location: 'https://hperkins.blog/one-page-resume/?utm_source=wcus&v=0b3b97fa6688', redirectBy: 'WordPress', contentType: 'text/html' },
		{ requestUrl: 'https://hperkins.blog/one-page-resume/?utm_source=wcus&v=0b3b97fa6688', status: 302, location: 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123', redirectBy: 'hperkins-tokens', contentType: 'text/html' },
		{ requestUrl: 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123', status: 200, location: null, redirectBy: null, contentType: 'application/pdf' },
	];
	const diagnostic = validateRedirectChain( steps, steps[0].requestUrl, 'https://hperkins.blog', { strict: false } );
	assert.equal( diagnostic.platformPreflights, 1 );
	assert.throws( () => validateRedirectChain( steps, steps[0].requestUrl, 'https://hperkins.blog', { strict: true } ), /preflight|one redirect/ );
} );

test( 'diagnostic preflights preserve only the inbound query plus one version key', () => {
	const requested = 'https://hperkins.blog/one-page-resume/?utm_source=wcus';
	const validLocation = 'https://hperkins.blog/one-page-resume/?utm_source=wcus&v=0b3b97fa6688';
	const pdf = 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123';
	const makeSteps = ( location ) => [
		{ requestUrl: requested, status: 307, location, redirectBy: 'WordPress', contentType: 'text/html' },
		{ requestUrl: location, status: 302, location: pdf, redirectBy: 'hperkins-tokens', contentType: 'text/html' },
		{ requestUrl: pdf, status: 200, location: null, redirectBy: null, contentType: 'application/pdf' },
	];
	for ( const location of [
		'https://hperkins.blog/one-page-resume/?v=0b3b97fa6688',
		`${ validLocation }&extra=1`,
		`${ validLocation }&v=abcd`,
		`${ validLocation }#extra`,
	] ) {
		assert.throws(
			() => validateRedirectChain( makeSteps( location ), requested, 'https://hperkins.blog', { strict: false } ),
			/query|fragment|hash|Location/
		);
	}
} );

test( 'rejects fragments and credentials on the requested, preflight, and PDF URLs', () => {
	const pdf = 'https://hperkins.blog/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf?v=123';
	for ( const requested of [
		'https://hperkins.blog/one-page-resume/?utm_source=wcus#extra',
		'https://user:pass@hperkins.blog/one-page-resume/?utm_source=wcus',
	] ) {
		assert.throws( () => validateRedirectChain( [
			{ requestUrl: requested, status: 302, location: pdf, redirectBy: 'hperkins-tokens', contentType: 'text/html' },
			{ requestUrl: pdf, status: 200, location: null, redirectBy: null, contentType: 'application/pdf' },
		], requested, 'https://hperkins.blog' ), /fragment|hash|credentials|username/ );
	}
	for ( const destination of [ `${ pdf }#extra`, pdf.replace( 'https://', 'https://user:pass@' ) ] ) {
		assert.throws( () => validateRedirectChain( [
			{ requestUrl: 'https://hperkins.blog/one-page-resume/?utm_source=wcus', status: 302, location: destination, redirectBy: 'hperkins-tokens', contentType: 'text/html' },
			{ requestUrl: destination, status: 200, location: null, redirectBy: null, contentType: 'application/pdf' },
		], 'https://hperkins.blog/one-page-resume/?utm_source=wcus', 'https://hperkins.blog' ), /fragment|hash|credentials|username/ );
	}
} );
