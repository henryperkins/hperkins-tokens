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

function replaceOnce( source, search, replacement, label ) {
	const mutated = source.replace( search, replacement );
	assert.notEqual( mutated, source, `Mutation must change ${ label }.` );
	return mutated;
}

test( 'accepts the manual retirement source and public verification gates', () => {
	assert.equal( typeof verifyRetirementRunbook, 'function' );
	assert.doesNotThrow( () => verifyRetirementRunbook( readRunbook() ) );
} );

test( 'rejects a retirement source gate without style-token verification', () => {
	const runbook = readRunbook();
	const mutated = replaceOnce( runbook, /node scripts\/verify-style-token-usage\.js\r?\n/, '', 'style-token source gate' );
	assert.throws(
		() => verifyRetirementRunbook( mutated ),
		/complete source gate/i
	);
} );

test( 'removes style-token verification from a CRLF runbook before checking rejection', () => {
	const runbook = readRunbook().replace( /\r?\n/g, '\r\n' );
	const mutated = runbook.replace( /node scripts\/verify-style-token-usage\.js\r?\n/, '' );
	assert.notEqual( mutated, runbook, 'CRLF mutation must remove the style-token command.' );
	assert.throws(
		() => verifyRetirementRunbook( mutated ),
		/complete source gate/i
	);
} );

test( 'rejects public ownership proof that no longer compares the approved drafts', () => {
	const runbook = readRunbook();
	const mutated = replaceOnce(
		runbook,
		'node scripts/verify-deployed-content-ownership.js --drafts --page=job-placement-digest --page=about',
		'node scripts/verify-deployed-content-ownership.js --page=job-placement-digest --page=about',
		'public draft ownership command'
	);
	assert.throws(
		() => verifyRetirementRunbook( mutated ),
		/public verification command/i
	);
} );

test( 'rejects weakened retirement timing and authorization safety clauses', () => {
	const runbook = readRunbook();
	const mutations = [
		[ 'no earlier than August 21', 'as early as August 20', /manual review after August 20/i ],
		[ 'is not a conference\r\nday', 'is a conference\r\nday', /distinguish August 16-19/i ],
		[ 'Do not add cron, scheduled code, or any date-driven content mutation.', 'Add scheduled date-driven content mutation.', /prohibit automated date-driven mutation/i ],
		[ 'It neither authorizes nor performs a', 'It authorizes and performs a', /separate from write, promotion, deployment, and route-retirement authority/i ],
	];
	for ( const [ search, replacement, error ] of mutations ) {
		const normalized = runbook.replace( /\r?\n/g, '\r\n' );
		const mutated = replaceOnce( normalized, search, replacement, search );
		assert.throws( () => verifyRetirementRunbook( mutated ), error );
	}
} );
