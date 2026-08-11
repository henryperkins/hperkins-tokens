const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const themeJson = require( '../../theme.json' );

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
	assertRuleDeclarations,
} = require( './style-coverage' );

const pagesCss = fs.readFileSync(
	path.join( __dirname, '..', '..', 'assets', 'imladris-pages.css' ),
	'utf8'
).replace( /\r\n/g, '\n' );

const DIGEST_COMPACT_CONTEXT = '@media (min-width: 601px) and (max-width: 1023px)';
const DIGEST_TABLET_CONTRACTS = [
	{
		selector: '.hp-digest-template',
		atContext: DIGEST_COMPACT_CONTEXT,
		declarations: { 'padding-block-start': 'var(--wp--preset--spacing--5) !important' },
	},
	{
		selector: '.hp-digest__hero h1',
		atContext: DIGEST_COMPACT_CONTEXT,
		declarations: {
			'max-inline-size': 'none',
			'font-size': 'var(--wp--preset--font-size--3-xl)',
		},
	},
	{
		selector: '.hp-category-bar',
		atContext: DIGEST_COMPACT_CONTEXT,
		declarations: { 'margin-block': 'var(--wp--preset--spacing--3)' },
	},
	{
		selector: '.hp-wcus-callout',
		atContext: DIGEST_COMPACT_CONTEXT,
		declarations: {
			'margin-block-start': 'var(--wp--preset--spacing--5)',
			padding: 'var(--wp--preset--spacing--5)',
			'padding-block-start': 'var(--wp--preset--spacing--4)',
		},
	},
	{
		selector: '.hp-wcus-callout > h2',
		atContext: DIGEST_COMPACT_CONTEXT,
		declarations: {
			'font-size': 'var(--wp--preset--font-size--2-xl)',
			'margin-block-start': 'var(--wp--preset--spacing--4)',
		},
	},
	{
		selector: '.hp-wcus-callout > p:not(.hp-page-hero__eyebrow)',
		atContext: DIGEST_COMPACT_CONTEXT,
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--4)' },
	},
];

function generatedFontPresetName( slug ) {
	return `--wp--preset--font-size--${ slug.replace( /^(\d+)(?=[a-z])/i, '$1-' ).toLowerCase() }`;
}

function assertFontPresetReferencesResolve( contracts, config ) {
	const fontSizes = config?.settings?.typography?.fontSizes ?? [];
	const generatedPresets = new Map(
		fontSizes.map( ( preset ) => [ generatedFontPresetName( preset.slug ), preset.size ] )
	);
	const references = new Set();
	for ( const contract of contracts ) {
		for ( const value of Object.values( contract.declarations ) ) {
			for ( const match of value.matchAll( /var\((--wp--preset--font-size--[a-z0-9-]+)\)/g ) ) {
				references.add( match[ 1 ] );
			}
		}
	}
	assert.notEqual( references.size, 0, 'Digest tablet contracts must reference generated font presets.' );
	for ( const reference of references ) {
		assert(
			generatedPresets.has( reference ) && generatedPresets.get( reference ),
			`${ reference } must resolve to a font-size preset declared in theme.json.`
		);
	}
}

function mutateDeclaration( css, contract, property, expected ) {
	const rule = parseRules( css ).find( ( candidate ) =>
		candidate.atContext === contract.atContext &&
			normalizeSelectors( candidate.prelude ).includes( contract.selector )
	);
	assert( rule, `Mutation fixture is missing ${ contract.selector } in ${ contract.atContext }.` );
	const escapedProperty = property.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
	const escapedExpected = expected.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
	const declaration = new RegExp( `${ escapedProperty }\\s*:\\s*${ escapedExpected }\\s*;` );
	const source = css.slice( rule.start, rule.end );
	const mutant = source.replace( declaration, `${ property }: initial;` );
	assert.notEqual( mutant, source, `Mutation must replace ${ property } for ${ contract.selector }.` );
	return `${ css.slice( 0, rule.start ) }${ mutant }${ css.slice( rule.end ) }`;
}

test( 'assertRuleDeclarations rejects comment-only, empty, wrong-value, and wrong-media CSS', () => {
	assert.equal( typeof assertRuleDeclarations, 'function', 'style coverage must expose declaration-aware rule validation' );
	const contract = {
		selector: '.hp-example',
		atContext: '@media (max-width: 781px)',
		declarations: { 'grid-template-columns': 'minmax(0, 1fr)' },
	};
	assert.doesNotThrow( () => assertRuleDeclarations(
		'@media (max-width: 781px) { .hp-example { grid-template-columns: minmax(0, 1fr); } }',
		contract
	) );
	for ( const css of [
		'/* @media (max-width: 781px) { .hp-example { grid-template-columns: minmax(0, 1fr); } } */',
		'@media (max-width: 781px) { .hp-example {} }',
		'@media (max-width: 781px) { .hp-example { grid-template-columns: repeat(2, 1fr); } }',
		'@media (max-width: 782px) { .hp-example { grid-template-columns: minmax(0, 1fr); } }',
	] ) {
		assert.throws( () => assertRuleDeclarations( css, contract ), /hp-example|grid-template-columns|781px/ );
	}
} );

test( 'native proof-grid items neutralize WordPress flow margins', () => {
	const contract = {
		selector: '.hp-debug-proof__grid > .hp-debug-proof__item',
		declarations: { 'margin-block': '0' },
	};
	assert.doesNotThrow( () => assertRuleDeclarations( pagesCss, contract ) );

	const mutant = pagesCss.replace(
		/\.hp-debug-proof__grid > \.hp-debug-proof__item\s*\{[\s\S]*?\}\s*/,
		''
	);
	assert.notEqual( mutant, pagesCss, 'The reset-removal mutation must change the stylesheet.' );
	assert.throws(
		() => assertRuleDeclarations( mutant, contract ),
		/hp-debug-proof__grid|margin-block/
	);
} );

test( 'Digest tablet and small-laptop fold use a bounded token-based compact treatment', () => {
	assert.doesNotThrow( () => assertFontPresetReferencesResolve( DIGEST_TABLET_CONTRACTS, themeJson ) );
	const missingTokenTheme = structuredClone( themeJson );
	missingTokenTheme.settings.typography.fontSizes = missingTokenTheme.settings.typography.fontSizes.filter(
		( preset ) => preset.slug !== '3xl'
	);
	assert.throws(
		() => assertFontPresetReferencesResolve( DIGEST_TABLET_CONTRACTS, missingTokenTheme ),
		/--wp--preset--font-size--3-xl.*theme\.json/
	);

	for ( const contract of DIGEST_TABLET_CONTRACTS ) {
		assert.doesNotThrow( () => assertRuleDeclarations( pagesCss, contract ) );
		for ( const [ property, expected ] of Object.entries( contract.declarations ) ) {
			const mutant = mutateDeclaration( pagesCss, contract, property, expected );
			assert.throws(
				() => assertRuleDeclarations( mutant, contract ),
				/Digest|hp-|padding|margin|font-size|max-inline-size|601px|781px/
			);
		}
	}

	const calloutContract = DIGEST_TABLET_CONTRACTS.find( ( contract ) => contract.selector === '.hp-wcus-callout' );
	const withoutTopPadding = pagesCss.replace(
		/\n\s*padding-block-start:\s*var\(--wp--preset--spacing--4\);/,
		''
	);
	assert.notEqual( withoutTopPadding, pagesCss, 'The rail-affecting top-padding removal must change the stylesheet.' );
	assert.throws(
		() => assertRuleDeclarations( withoutTopPadding, calloutContract ),
		/hp-wcus-callout|padding-block-start/
	);

	const wrongUpperBound = pagesCss.replace(
		DIGEST_COMPACT_CONTEXT,
		'@media (min-width: 601px) and (max-width: 1024px)'
	);
	assert.notEqual( wrongUpperBound, pagesCss, 'The compact-band boundary mutation must change the stylesheet.' );
	assert.throws(
		() => assertRuleDeclarations( wrongUpperBound, calloutContract ),
		/hp-wcus-callout|601px|1023px/
	);
} );

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
