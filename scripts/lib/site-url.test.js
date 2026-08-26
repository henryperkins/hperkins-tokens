const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const {
	assertMatchingSiteUrl,
	getOrigin,
	isLoopbackOrigin,
	normalizeSiteUrl,
	resolveSiteUrl,
	stripWpcomCacheVersionFromRenderedHref,
} = require( './site-url' );

test( 'normalizes case, default ports, and trailing slashes', () => {
	assert.equal(
		normalizeSiteUrl( 'HTTP://LOCALHOST:80/' ),
		'http://localhost'
	);
	assert.equal(
		normalizeSiteUrl( 'http://localhost/wordpress///' ),
		'http://localhost/wordpress'
	);
} );

test( 'accepts equivalent configured and WordPress site URLs', () => {
	assert.doesNotThrow( () =>
		assertMatchingSiteUrl(
			'http://localhost:8882/',
			'http://LOCALHOST:8882'
		)
	);
} );

test( 'rejects a different WordPress port before runtime mutation', () => {
	assert.throws(
		() => assertMatchingSiteUrl(
			'http://localhost:8882',
			'http://localhost:9999'
		),
		/does not match.*Refusing runtime mutation/
	);
} );

test( 'strips the default https port', () => {
	assert.equal(
		normalizeSiteUrl( 'HTTPS://Example.com:443/' ),
		'https://example.com'
	);
} );

test( 'matches path-bearing subdirectory installs exactly', () => {
	assert.doesNotThrow( () =>
		assertMatchingSiteUrl(
			'http://localhost:8882/wp/',
			'http://LOCALHOST:8882/wp'
		)
	);
	assert.throws(
		() => assertMatchingSiteUrl(
			'http://localhost:8882/wp',
			'http://localhost:8882'
		),
		/does not match.*Refusing runtime mutation/
	);
} );

test( 'rejects a scheme mismatch', () => {
	assert.throws(
		() => assertMatchingSiteUrl(
			'https://localhost:8882',
			'http://localhost:8882'
		),
		/does not match.*Refusing runtime mutation/
	);
} );

test( 'labels invalid URLs with their source', () => {
	assert.throws(
		() => normalizeSiteUrl( 'not a url', 'HPERKINS_ORIGIN' ),
		/HPERKINS_ORIGIN is not a valid URL: "not a url"/
	);
	assert.throws(
		() => assertMatchingSiteUrl( 'http://localhost:8882', 'Deprecated: junk before the URL' ),
		/the selected WordPress site's home URL is not an http\(s\) URL/
	);
} );

test( 'getOrigin falls back to the deployed site', () => {
	assert.equal( getOrigin( {} ), 'https://hperkins.blog' );
	assert.equal( getOrigin( { HPERKINS_ORIGIN: '   ' } ), 'https://hperkins.blog' );
	assert.equal(
		getOrigin( { HPERKINS_ORIGIN: ' http://localhost:8882 ' } ),
		'http://localhost:8882'
	);
} );

test( 'resolveSiteUrl keeps subdirectory installs intact', () => {
	assert.equal(
		resolveSiteUrl( 'http://localhost:8882', '/contact/' ).href,
		'http://localhost:8882/contact/'
	);
	assert.equal(
		resolveSiteUrl( 'http://localhost:8882/wp/', '/wp-admin/admin-post.php' ).href,
		'http://localhost:8882/wp/wp-admin/admin-post.php'
	);
} );

test( 'strips only the current WordPress.com cache version from rendered same-origin paths', () => {
	const documentUrl = 'https://hperkins.blog/about/?v=0b3b97fa6688';

	assert.equal(
		stripWpcomCacheVersionFromRenderedHref?.(
			'/contact/?v=0b3b97fa6688',
			documentUrl
		),
		'/contact/'
	);
	assert.equal(
		stripWpcomCacheVersionFromRenderedHref?.(
			'https://hperkins.blog/work/?v=0b3b97fa6688',
			documentUrl
		),
		'https://hperkins.blog/work/'
	);
	assert.equal(
		stripWpcomCacheVersionFromRenderedHref?.(
			'https://hperkins.blog?v=0b3b97fa6688',
			documentUrl
		),
		'https://hperkins.blog'
	);
	assert.equal(
		stripWpcomCacheVersionFromRenderedHref?.(
			'/contact/?preview=1&v=0b3b97fa6688',
			documentUrl
		),
		'/contact/?preview=1'
	);

	for ( const href of [
		'/contact/?v=different',
		'https://example.com/contact/?v=0b3b97fa6688',
		'#contact',
		'contact/?v=0b3b97fa6688',
	] ) {
		assert.equal(
			stripWpcomCacheVersionFromRenderedHref?.( href, documentUrl ),
			href
		);
	}
} );

test( 'recognizes only web origins on localhost or the IP loopback ranges', () => {
	for ( const origin of [
		'http://localhost:8882',
		'https://localhost',
		'http://127.0.0.1:8882',
		'http://127.42.9.3',
		'http://[::1]:8882',
	] ) {
		assert.equal( isLoopbackOrigin( origin ), true, origin );
	}

	for ( const origin of [
		'http://192.168.1.25',
		'https://hperkins.blog',
		'http://localhost.example.com',
		'ftp://localhost',
		'not a URL',
	] ) {
		assert.equal( isLoopbackOrigin( origin ), false, origin );
	}
} );
