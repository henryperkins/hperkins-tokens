#!/usr/bin/env node

const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const {
	NAVIGATION_POST_ID,
	EXPECTED_COUNCIL_SHAPE,
	normalizeNavigationContent,
} = require( './navigation-content-contract' );

test( 'navigation contract is pinned to post 237', () => {
	assert.equal( NAVIGATION_POST_ID, 237 );
	assert.deepEqual(
		EXPECTED_COUNCIL_SHAPE.map( ( item ) => item.key ),
		[ 'work', 'writing', 'about', 'search', 'subscribe' ]
	);
} );

test( 'normalization removes only the selected home origin', () => {
	const source = [
		'<!-- wp:navigation-link {"label":"Work","url":"http://localhost:8882/work/"} /-->',
		'<!-- wp:navigation-link {"label":"GitHub","url":"https://github.com/henryperkins"} /-->',
	].join( "\r\n" );
	assert.equal(
		normalizeNavigationContent( source, 'http://localhost:8882' ),
		[
			'<!-- wp:navigation-link {"label":"Work","url":"/work/"} /-->',
			'<!-- wp:navigation-link {"label":"GitHub","url":"https://github.com/henryperkins"} /-->',
		].join( "\n" )
	);
} );
