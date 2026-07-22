const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const { PAGE_CONTRACTS, selectPageContracts } = require( './page-content-contract' );

test( 'selectPageContracts keeps the full historical export when no keys are supplied', () => {
	assert.deepEqual( selectPageContracts(), PAGE_CONTRACTS );
} );

test( 'selectPageContracts returns only explicitly requested page contracts', () => {
	assert.deepEqual(
		selectPageContracts( [ 'job-placement-digest', 'placement-method-evidence' ] ).map( ( contract ) => contract.key ),
		[ 'job-placement-digest', 'placement-method-evidence' ]
	);
} );

test( 'selectPageContracts rejects unknown and duplicate keys', () => {
	assert.throws( () => selectPageContracts( [ 'missing-page' ] ), /Unknown page contract/ );
	assert.throws(
		() => selectPageContracts( [ 'job-placement-digest', 'job-placement-digest' ] ),
		/Duplicate page contract/
	);
} );

