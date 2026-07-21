const assert = require( 'node:assert/strict' );
const test = require( 'node:test' );

const { verifyLinks } = require( '../verify-placement-artifacts' );

test( 'link verification reports every result before failing the batch', async () => {
	const visited = [];
	const messages = [];
	const inspect = async ( url ) => {
		visited.push( url );
		if ( url === 'https://example.test/broken' ) {
			throw new Error( 'temporary network failure' );
		}
		return { url, status: 200, finalUrl: url };
	};

	await assert.rejects(
		verifyLinks(
			[
				'https://example.test/first',
				'https://example.test/broken',
				'https://example.test/last',
			],
			inspect,
			( message ) => messages.push( message )
		),
		/One or more links failed verification/
	);

	assert.deepEqual( visited.sort(), [
		'https://example.test/broken',
		'https://example.test/first',
		'https://example.test/last',
	] );
	assert.equal( messages.length, 3 );
	assert( messages.some( ( message ) => message.includes( 'broken - temporary network failure' ) ) );
} );
