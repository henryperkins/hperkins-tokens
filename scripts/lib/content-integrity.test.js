const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const {
	createLineDiff,
	getSha256,
	normalizeContent,
} = require( './content-integrity' );

test( 'normalizeContent makes line endings and the final newline deterministic', () => {
	assert.equal(
		normalizeContent( 'first\r\nsecond\r\n\r\n' ),
		'first\nsecond'
	);
} );

test( 'getSha256 hashes the normalized value supplied by the caller', () => {
	assert.equal(
		getSha256( 'Job Placement Digest' ),
		'a77372aa8ae5a4f65f8d169a4b61abcd70e2a9e7afa336b78a1f308ff294cf6f'
	);
} );

test( 'createLineDiff identifies changed, removed, and added lines', () => {
	assert.equal(
		createLineDiff(
			'one\ntwo\nthree',
			'one\nTWO\nthree\nfour',
			{ actualLabel: 'live', expectedLabel: 'snapshot' }
		),
		[
			'--- live',
			'+++ snapshot',
			'@@ line 2 @@',
			'- two',
			'+ TWO',
			'@@ line 4 @@',
			'- <missing>',
			'+ four',
		].join( '\n' )
	);
} );
