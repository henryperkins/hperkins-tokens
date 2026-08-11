const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );

const { selectJournalRoute } = require( './journal-route-discovery' );

const ORIGIN = 'http://localhost:8882';
const FILESYSTEM_FIXTURES = [
	'http://localhost:8882/C:/Program%20Files/Git/local-essay-8/',
	'http://localhost:8882/C:/Programcategory/uncategorized/',
];

test( 'typography discovers every journal candidate before deterministic selection', () => {
	const source = fs.readFileSync( path.join( __dirname, '..', 'verify-typography.js' ), 'utf8' );
	assert.match( source, /querySelectorAll\(selector\)/ );
	assert.match( source, /selectJournalRoute\( found\.posts/ );
	assert.match( source, /selectJournalRoute\( found\.topics/ );
	assert.match( source, /no valid same-origin \.hp-postcard__title permalink/ );
} );

test( 'local mode quarantines only filesystem-like fixture paths and selects the first valid same-origin route', () => {
	const result = selectJournalRoute(
		[ FILESYSTEM_FIXTURES[0], '/a-valid-post/', '/another-valid-post/' ],
		ORIGIN,
		{ kind: 'post', requireLocal: true }
	);

	assert.equal( result.path, '/a-valid-post/' );
	assert.deepEqual( result.violations, [] );
	assert.equal( result.quarantined.length, 1 );
	assert.match( result.quarantined[0], /C:.*Program.*Git/ );
} );

test( 'public mode rejects filesystem-like permalinks instead of silently skipping them', () => {
	const publicOrigin = 'https://hperkins.blog';
	const result = selectJournalRoute(
		[ `${ publicOrigin }/C:/Program%20Files/Git/local-essay-8/`, '/a-valid-post/' ],
		publicOrigin,
		{ kind: 'post' }
	);

	assert.equal( result.path, '/a-valid-post/' );
	assert.equal( result.quarantined.length, 0 );
	assert.equal( result.violations.length, 1 );
	assert.match( result.violations[0], /filesystem-like.*C:/ );
} );

test( 'local mode does not quarantine foreign or malformed links', () => {
	const result = selectJournalRoute(
		[ 'https://example.com/not-a-post/', 'http://[::1' ],
		ORIGIN,
		{ kind: 'post', requireLocal: true }
	);

	assert.equal( result.path, null );
	assert.equal( result.quarantined.length, 0 );
	assert.equal( result.violations.length, 2 );
	assert.match( result.violations.join( '\n' ), /same-origin/ );
	assert.match( result.violations.join( '\n' ), /valid URL/ );
} );

test( 'local mode returns no route when every candidate is quarantined so the caller cannot claim single-post coverage', () => {
	const result = selectJournalRoute(
		FILESYSTEM_FIXTURES,
		ORIGIN,
		{ kind: 'post', requireLocal: true }
	);

	assert.equal( result.path, null );
	assert.equal( result.quarantined.length, 2 );
	assert.deepEqual( result.violations, [] );
} );

test( 'the local quarantine cannot be enabled for a public origin', () => {
	assert.throws(
		() => selectJournalRoute(
			[ 'https://hperkins.blog/C:/Program%20Files/Git/local-essay-8/' ],
			'https://hperkins.blog',
			{ kind: 'post', requireLocal: true }
		),
		/localhost|loopback/
	);
} );
