const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const test = require( 'node:test' );
const { execFileSync } = require( 'node:child_process' );
const { verifyPlacementBrief } = require( './placement-brief-contract' );
const source = fs.readFileSync( path.join( __dirname, '../../content/page-drafts/job-placement-digest.html' ), 'utf8' );

test( 'the consolidated brief preserves evidence, attribution, research and action hierarchy', () => {
	assert.doesNotThrow( () => verifyPlacementBrief( source ) );
} );

test( 'a supporting item cannot silently nest beneath the featured investigation', () => {
	assert.throws( () => verifyPlacementBrief( source.replace( '<h3 class="wp-block-heading" id="documentation">', '<h4 class="wp-block-heading" id="documentation">' ).replace( 'Documentation that shipped</h3>', 'Documentation that shipped</h4>' ) ), /Selected work/ );
} );

test( 'removing ownership or a carried research anchor fails the candidate contract', () => {
	assert.throws( () => verifyPlacementBrief( source.replace( 'the report and the testing are mine', 'I contributed' ) ), /attribution/ );
	assert.throws( () => verifyPlacementBrief( source.replace( 'id="live-states"', 'id="lost"' ) ), /retains/ );
} );

test( 'method redirects preserve fragments and wait for a published combined body', () => {
	const output = execFileSync( process.env.HPERKINS_PHP_BIN || 'php', [ path.join( __dirname, '../verify-placement-route.php' ) ], { encoding: 'utf8' } );
	assert.match( output, /14 placement redirect cases passed/ );
} );
