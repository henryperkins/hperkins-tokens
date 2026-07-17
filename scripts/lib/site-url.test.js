const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const {
	assertMatchingSiteUrl,
	normalizeSiteUrl,
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
