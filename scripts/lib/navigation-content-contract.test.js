#!/usr/bin/env node

const crypto = require( 'node:crypto' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const {
	NAVIGATION_POST_ID,
	NAVIGATION_SNAPSHOT_PATH,
	EXPECTED_COUNCIL_SHAPE,
	normalizeNavigationContent,
} = require( './navigation-content-contract' );
const {
	ACCEPTED_BEFORE_STATES,
	buildNavigationUpdatePhp,
	NEW_CONTENT,
} = require( '../apply-council-navigation' );

function readPinnedBackup( state ) {
	return fs.readFileSync( path.join( path.dirname( NAVIGATION_SNAPSHOT_PATH ), state.backup ), 'utf8' );
}

function getCanonicalSha256( content ) {
	return crypto
		.createHash( 'sha256' )
		.update( normalizeNavigationContent( content, 'https://hperkins.blog' ) )
		.digest( 'hex' );
}

function parseNavigationBlocks( content ) {
	const roots = [];
	const stack = [ { name: null, children: roots } ];
	const tokens = content.matchAll( /<!--\s+(\/?)wp:([a-z0-9-]+)(?:\s+(\{.*?\}))?\s*(\/?)-->/g );

	for ( const token of tokens ) {
		if ( token[1] === '/' ) {
			assert.ok( stack.length > 1, `Unexpected closing block ${ token[2] }.` );
			const openBlock = stack[ stack.length - 1 ];
			assert.equal( token[2], openBlock.name, `Expected closing ${ openBlock.name }, got ${ token[2] }.` );
			stack.pop();
			continue;
		}

		const block = {
			blockName: `core/${ token[2] }`,
			attrs: token[3] ? JSON.parse( token[3] ) : {},
			children: [],
		};
		stack[ stack.length - 1 ].children.push( block );
		if ( token[4] !== '/' ) {
			stack.push( { name: token[2], children: block.children } );
		}
	}

	assert.equal( stack.length, 1, 'Expected every navigation block to close.' );
	return roots;
}

test( 'navigation contract is pinned to post 237', () => {
	assert.equal( NAVIGATION_POST_ID, 237 );
	assert.deepEqual(
		EXPECTED_COUNCIL_SHAPE.map( ( item ) => item.key ),
		[ 'work', 'writing', 'about', 'search', 'subscribe' ]
	);
} );

test( 'navigation contract pins all four simplified fields including required nulls', () => {
	assert.deepEqual(
		EXPECTED_COUNCIL_SHAPE,
		[
			{ key: 'work', blockName: 'core/navigation-link', label: 'Work', url: '/work/', className: 'hp-nav-work' },
			{ key: 'writing', blockName: 'core/navigation-submenu', label: 'Writing', url: null, className: 'hp-nav-writing' },
			{ key: 'about', blockName: 'core/navigation-link', label: 'About', url: '/about/', className: null },
			{ key: 'search', blockName: 'core/search', label: 'Search', url: null, className: 'hp-drawer-search' },
			{ key: 'subscribe', blockName: 'core/navigation-link', label: 'Subscribe', url: '/contact/#subscribe', className: 'hp-nav-subscribe' },
		]
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

test( 'normalization preserves a same-host URL with a different scheme', () => {
	const source = '<!-- wp:navigation-link {"label":"Work","url":"http://hperkins.blog/work/"} /-->';
	assert.equal(
		normalizeNavigationContent( source, 'https://hperkins.blog' ),
		source
	);
} );

test( 'normalization treats an explicit default port as the same origin', () => {
	const source = '<!-- wp:navigation-link {"label":"Work","url":"https://hperkins.blog:443/work/"} /-->';
	assert.equal(
		normalizeNavigationContent( source, 'https://hperkins.blog' ),
		'<!-- wp:navigation-link {"label":"Work","url":"/work/"} /-->'
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

test( 'Council migration exports the guarded exact navigation tree', () => {
	// Tie every pin to a state we actually have on disk. Asserting the literals
	// only restated the constants; this fails if a pin is ever moved to a hash
	// that matches no recorded navigation, which is exactly the mistake that let
	// the pin sit on a synthetic local menu that production never had.
	assert.deepEqual(
		ACCEPTED_BEFORE_STATES.map( ( state ) => state.backup ),
		[ 'nav-237.production.html', 'nav-237.production-2026-08-27.html' ]
	);
	for ( const state of ACCEPTED_BEFORE_STATES ) {
		assert.equal(
			state.sha256,
			getCanonicalSha256( readPinnedBackup( state ) ),
			`The recut guard must pin the canonical hash of content/nav-snapshots/${ state.backup }.`
		);
	}
	assert.doesNotMatch( NEW_CONTENT, /-->\s+<!--/, 'Navigation blocks must not carry blank text between them.' );

	const topLevel = parseNavigationBlocks( NEW_CONTENT );
	assert.deepEqual(
		topLevel.map( ( block ) => ( {
			blockName: block.blockName,
			label: block.attrs.label || null,
			url: block.attrs.url || null,
			className: block.attrs.className || null,
		} ) ),
		[
			{ blockName: 'core/navigation-link', label: 'Work', url: '/work/', className: 'hp-nav-work' },
			{ blockName: 'core/navigation-submenu', label: 'Writing', url: null, className: 'hp-nav-writing' },
			{ blockName: 'core/navigation-link', label: 'About', url: '/about/', className: null },
			{ blockName: 'core/search', label: 'Search', url: null, className: 'hp-drawer-search' },
			{ blockName: 'core/navigation-link', label: 'Subscribe', url: '/contact/#subscribe', className: 'hp-nav-subscribe' },
		]
	);
	assert.equal(
		topLevel.some( ( block ) => block.attrs.label === 'Contact' ),
		false,
		'Contact must not remain a top-level Council navigation item.'
	);

	assert.deepEqual(
		topLevel[1].children.map( ( block ) => ( {
			blockName: block.blockName,
			label: block.attrs.label,
			url: block.attrs.url,
			className: block.attrs.className,
		} ) ),
		[
			{ blockName: 'core/navigation-link', label: 'AI Enablement', url: '/ai-enablement/', className: 'hp-nav-ai' },
			{ blockName: 'core/navigation-link', label: 'Essays', url: '/essays/', className: 'hp-nav-essays' },
			{ blockName: 'core/navigation-link', label: 'Job Placement Digest', url: '/job-placement-digest/', className: 'hp-nav-digest' },
		]
	);
} );

test( 'the 2026-08-27 pinned state is the recut target without its Subscribe link', () => {
	// The renderer validates menu 237 all or nothing: with every other Council
	// item in place, the missing hp-nav-subscribe link alone sends production to
	// the fallback model. Pinning this state lets the recut restore one block,
	// and the pin cannot quietly come to stand for a different drift.
	const drifted = readPinnedBackup( ACCEPTED_BEFORE_STATES[1] );
	const target = parseNavigationBlocks( NEW_CONTENT );
	const subscribe = target[ target.length - 1 ];

	assert.equal( subscribe.attrs.className, 'hp-nav-subscribe' );
	assert.doesNotMatch( drifted, /hp-nav-subscribe/ );
	assert.deepEqual( parseNavigationBlocks( drifted ), target.slice( 0, -1 ) );
	assert.match( drifted, /-->\n\n<!--/, 'The drifted state carries the block editor serializer\'s blank lines.' );
} );

test( 'test block parser rejects a mismatched closing block name', () => {
	assert.throws(
		() => parseNavigationBlocks( '<!-- wp:navigation-submenu {"label":"Writing"} --><!-- /wp:group -->' ),
		/Expected closing navigation-submenu, got group/
	);
} );

test( 'migration compares the previously read raw content immediately before its same-process write', () => {
	assert.equal( typeof buildNavigationUpdatePhp, 'function' );
	const php = buildNavigationUpdatePhp( 'selected raw content' );
	const readIndex = php.indexOf( '$post = get_post( 237 );' );
	const compareIndex = php.indexOf( 'hash_equals( $expected_content, (string) $post->post_content )' );
	const writeIndex = php.indexOf( 'wp_update_post( wp_slash( array(' );

	assert.match( php, /\$expected_content = 'selected raw content';/ );
	assert.ok( readIndex >= 0, 'Expected the update process to re-read post 237.' );
	assert.ok( compareIndex > readIndex, 'Expected the raw compare after the re-read.' );
	assert.ok( writeIndex > compareIndex, 'Expected wp_update_post immediately after the accepted raw compare.' );
} );

test( 'tracked navigation snapshot matches the selected post-migration content', () => {
	const snapshot = normalizeNavigationContent(
		fs.readFileSync( NAVIGATION_SNAPSHOT_PATH, 'utf8' ),
		'https://hperkins.blog'
	);
	const selected = normalizeNavigationContent( NEW_CONTENT, 'https://hperkins.blog' );
	const snapshotSha256 = crypto.createHash( 'sha256' ).update( snapshot ).digest( 'hex' );
	assert.equal( snapshot, selected );
	assert.equal( snapshotSha256, '1e88af1854abfbe51d753a59b5decf5a4cedb41d00caf09f386415702c79ebaa' );
} );
