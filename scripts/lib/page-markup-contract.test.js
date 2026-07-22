const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const {
	findHeadingLevels,
	findHeadingOutlineJumps,
	getClassCount,
	hasMeaningfulFragmentTarget,
} = require( './page-markup-contract' );

test( 'findHeadingLevels ignores heading text and returns document order', () => {
	assert.deepEqual(
		findHeadingLevels( '<h1>One</h1><section><h2>Two</h2><h3>Three</h3></section>' ),
		[ 1, 2, 3 ]
	);
} );

test( 'findHeadingOutlineJumps reports skipped levels', () => {
	assert.deepEqual( findHeadingOutlineJumps( [ 1, 3, 2, 4 ] ), [
		{ from: 1, to: 3, index: 1 },
		{ from: 2, to: 4, index: 3 },
	] );
} );

test( 'getClassCount matches complete class tokens only', () => {
	const markup = '<div class="hp-proof-card"></div><div class="hp-proof-card hp-proof-card--wide"></div>';
	assert.equal( getClassCount( markup, 'hp-proof-card' ), 2 );
	assert.equal( getClassCount( markup, 'proof-card' ), 0 );
} );

test( 'hasMeaningfulFragmentTarget rejects empty hidden anchors', () => {
	assert.equal(
		hasMeaningfulFragmentTarget( '<div id="resume-keyword-bank" aria-hidden="true"></div>', 'resume-keyword-bank' ),
		false
	);
	assert.equal(
		hasMeaningfulFragmentTarget( '<section id="resume-keyword-bank"><h2>Keyword bank</h2></section>', 'resume-keyword-bank' ),
		true
	);
} );

