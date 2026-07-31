const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const {
	BUNDLES,
	parseRules,
	selectorClasses,
	normalizeSelectors,
	bundleFor,
	classesInMarkup,
} = require( './style-coverage' );

test( 'parseRules returns top-level rules with original offsets', () => {
	const css = '.a { color: red; }\n.b { color: blue; }';
	const rules = parseRules( css );
	assert.equal( rules.length, 2 );
	assert.equal( rules[ 0 ].prelude, '.a' );
	assert.equal( css.slice( rules[ 1 ].start, rules[ 1 ].end ), '.b { color: blue; }' );
} );

test( 'parseRules descends into @media and records the context', () => {
	const css = '@media (max-width: 781px) { .a { color: red; } }';
	const rules = parseRules( css );
	assert.equal( rules.length, 1 );
	assert.equal( rules[ 0 ].prelude, '.a' );
	assert.equal( rules[ 0 ].atContext, '@media (max-width: 781px)' );
} );

test( 'parseRules ignores braces inside comments', () => {
	const css = '/* .fake { } */\n.real { color: red; }';
	const rules = parseRules( css );
	assert.equal( rules.length, 1 );
	assert.equal( rules[ 0 ].prelude, '.real' );
} );

test( 'parseRules keeps at-rules without selectors out of the rule list', () => {
	const css = '@font-face { font-family: X; }\n.a { color: red; }';
	const rules = parseRules( css ).filter( ( r ) => ! r.prelude.startsWith( '@' ) );
	assert.equal( rules.length, 1 );
} );

test( 'selectorClasses extracts class names and skips pseudo-elements', () => {
	assert.deepEqual( selectorClasses( '.hp-card:hover .hp-card__title::before' ), [
		'hp-card',
		'hp-card__title',
	] );
	assert.deepEqual( selectorClasses( 'a[href]' ), [] );
} );

test( 'normalizeSelectors splits on commas and collapses whitespace', () => {
	assert.deepEqual( normalizeSelectors( '.a  .b,\n\t.c' ), [ '.a .b', '.c' ] );
} );

test( 'normalizeSelectors does not split commas inside functional pseudo-classes', () => {
	// Splitting `:is(th, td)` naively yields `:is(th` and `td)`, which emits
	// invalid CSS and makes a browser discard the rest of the stylesheet.
	assert.deepEqual( normalizeSelectors( '.ledger :is(th, td)' ), [ '.ledger :is(th, td)' ] );
	assert.deepEqual( normalizeSelectors( ':where(.a, .b) p, .c' ), [ ':where(.a, .b) p', '.c' ] );
	assert.deepEqual( normalizeSelectors( 'li:nth-child(2n, 3n)' ), [ 'li:nth-child(2n, 3n)' ] );
} );

test( 'normalizeSelectors does not split commas inside attribute values', () => {
	assert.deepEqual( normalizeSelectors( '[data-x="a,b"], .c' ), [ '[data-x="a,b"]', '.c' ] );
} );

test( 'bundleFor matches on prefix so BEM suffixes resolve', () => {
	assert.equal( bundleFor( 'hp-callout' ), 'interactive' );
	assert.equal( bundleFor( 'hp-callout--warn' ), 'interactive' );
	assert.equal( bundleFor( 'hp-evidence-row__item' ), 'evidence' );
	assert.equal( bundleFor( 'hp-work-template' ), 'longform' );
	assert.equal( bundleFor( 'hp-wapuu-hero' ), null );
} );

test( 'every bundle prefix is unique across bundles', () => {
	const seen = new Map();
	for ( const [ name, prefixes ] of Object.entries( BUNDLES ) ) {
		for ( const prefix of prefixes ) {
			assert.equal( seen.has( prefix ), false, `${ prefix } is in two bundles` );
			seen.set( prefix, name );
		}
	}
} );

test( 'classesInMarkup reads class attributes and block JSON attributes', () => {
	const found = classesInMarkup( [
		'<div class="a b"></div>',
		'<!-- wp:group {"className":"c d"} -->',
	] );
	assert.deepEqual( [ ...found ].sort(), [ 'a', 'b', 'c', 'd' ] );
} );
