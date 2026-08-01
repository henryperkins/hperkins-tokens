const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const {
	BUNDLES,
	parseRules,
	selectorClasses,
	stripFunctionalPseudos,
	anchorClasses,
	normalizeSelectors,
	bundleFor,
	classesInMarkup,
	patternSlugsIn,
	expandPatternChain,
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

test( 'stripFunctionalPseudos removes pseudo-class argument lists but keeps plain pseudos', () => {
	assert.equal( stripFunctionalPseudos( '.a:not(.b) .c' ), '.a .c' );
	assert.equal( stripFunctionalPseudos( '.a:hover' ), '.a:hover' );
	assert.equal( stripFunctionalPseudos( '.a::before' ), '.a::before' );
	assert.equal( stripFunctionalPseudos( '.a:is(.b:not(.c)) .d' ), '.a .d' );
} );

test( 'anchorClasses ignores classes that only appear inside :not() and :where()', () => {
	// The class must be PRESENT for the selector to match. A negated class is
	// the opposite, and counting it moved a global prose rule into a bundle.
	assert.deepEqual(
		anchorClasses( '.hp-prose > :where(p, li):not(.alignwide):not(.hp-lead)' ),
		[ 'hp-prose' ]
	);
	assert.deepEqual( anchorClasses( '.hp-shot .wp-element-caption a' ), [
		'hp-shot',
		'wp-element-caption',
	] );
	// Every anchor living inside :is() means there is no guaranteed anchor.
	assert.deepEqual( anchorClasses( ':is(.hp-callout, .hp-badge) p' ), [] );
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

test( 'patternSlugsIn reads theme pattern references and ignores other namespaces', () => {
	const markup =
		'<!-- wp:pattern {"slug":"hperkins-tokens/contact"} /-->\n' +
		'<!-- wp:pattern {"slug":"core/three-columns"} /-->\n' +
		'<!-- wp:pattern {"slug":"hperkins-tokens/contact"} /-->';
	assert.deepEqual( patternSlugsIn( markup ), [ 'contact' ] );
} );

test( 'expandPatternChain follows nested patterns past the first level', () => {
	// The live shape: page-contact.html names contact, which names
	// imladris-subscribe, which is the only source of .hp-subscribe.
	const sources = {
		contact: '<div class="hp-input"></div><!-- wp:pattern {"slug":"hperkins-tokens/imladris-subscribe"} /-->',
		'imladris-subscribe': '<div class="hp-subscribe"></div>',
	};
	const collected = expandPatternChain(
		[ '<!-- wp:pattern {"slug":"hperkins-tokens/contact"} /-->' ],
		( slug ) => sources[ slug ] ?? null
	);
	const classes = classesInMarkup( collected );
	assert.equal( classes.has( 'hp-input' ), true );
	assert.equal( classes.has( 'hp-subscribe' ), true, 'level-2 pattern must be reached' );
} );

test( 'expandPatternChain terminates on a pattern cycle and skips missing files', () => {
	const sources = {
		a: '<!-- wp:pattern {"slug":"hperkins-tokens/b"} /-->',
		b: '<!-- wp:pattern {"slug":"hperkins-tokens/a"} /--><div class="hp-callout"></div>',
	};
	const collected = expandPatternChain(
		[ '<!-- wp:pattern {"slug":"hperkins-tokens/a"} /--><!-- wp:pattern {"slug":"hperkins-tokens/gone"} /-->' ],
		( slug ) => sources[ slug ] ?? null
	);
	assert.equal( collected.length, 3, 'seed plus each pattern exactly once' );
	assert.equal( classesInMarkup( collected ).has( 'hp-callout' ), true );
} );
