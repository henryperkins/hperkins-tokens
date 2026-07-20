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

test( 'normalization makes an exact selected home origin root-relative', () => {
	const source = [
		'<!-- wp:navigation-link {"label":"Work","url":"https://hperkins.blog/work/"} /-->',
		'<!-- wp:navigation-link {"label":"GitHub","url":"https://github.com/henryperkins"} /-->',
	].join( "\r\n" );
	assert.equal(
		normalizeNavigationContent( source, 'https://hperkins.blog' ),
		[
			'<!-- wp:navigation-link {"label":"Work","url":"/work/"} /-->',
			'<!-- wp:navigation-link {"label":"GitHub","url":"https://github.com/henryperkins"} /-->',
		].join( "\n" )
	);
} );

test( 'normalization preserves a lookalike external origin byte-for-byte', () => {
	const source = '<!-- wp:navigation-link {"label":"External","url":"https://hperkins.blog.example/path"} /-->';
	assert.equal(
		normalizeNavigationContent( source, 'https://hperkins.blog' ),
		source
	);
} );

test( 'normalization preserves selected-origin bytes in an external query value', () => {
	const source = '<!-- wp:navigation-link {"label":"External","url":"https://example.com/redirect?next=https://hperkins.blog/work/"} /-->';
	assert.equal(
		normalizeNavigationContent( source, 'https://hperkins.blog' ),
		source
	);
} );

test( 'normalization preserves selected-origin text outside URL fields', () => {
	const source = '<!-- wp:paragraph --><p>See https://hperkins.blog for details.</p><!-- /wp:paragraph -->';
	assert.equal(
		normalizeNavigationContent( source, 'https://hperkins.blog' ),
		source
	);
} );
