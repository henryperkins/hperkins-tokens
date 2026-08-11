const fs = require( 'node:fs' );
const path = require( 'node:path' );
const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const {
	verifyRetirementRunbook,
} = require( '../verify-content-ownership-docs' );

const runbookPath = path.join(
	__dirname,
	'..',
	'..',
	'docs',
	'runbooks',
	'2026-08-20-wcus-event-copy-retirement.md'
);

function readRunbook() {
	return fs.readFileSync( runbookPath, 'utf8' );
}

test( 'accepts the manual retirement source and public verification gates', () => {
	assert.equal( typeof verifyRetirementRunbook, 'function' );
	assert.doesNotThrow( () => verifyRetirementRunbook( readRunbook() ) );
} );

test( 'rejects a retirement source gate without style-token verification', () => {
	const mutated = readRunbook().replace( 'node scripts/verify-style-token-usage.js\n', '' );
	assert.throws(
		() => verifyRetirementRunbook( mutated ),
		/complete source gate/i
	);
} );

test( 'rejects public ownership proof that no longer compares the approved drafts', () => {
	const mutated = readRunbook().replace(
		'node scripts/verify-deployed-content-ownership.js --drafts --page=job-placement-digest --page=about',
		'node scripts/verify-deployed-content-ownership.js --page=job-placement-digest --page=about'
	);
	assert.throws(
		() => verifyRetirementRunbook( mutated ),
		/public verification command/i
	);
} );
