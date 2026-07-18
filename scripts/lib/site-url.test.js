const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const {
	assertMatchingSiteUrl,
	getOrigin,
	normalizeSiteUrl,
	resolveSiteUrl,
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
