const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const themeJson = require( '../../theme.json' );
const {
	APPENDIX_LEDGER_CONTRACTS,
	DIGEST_ACCEPTED_ACTION_CONTRACTS,
	DIGEST_COMPACT_CONTEXT,
	DIGEST_COMPACT_CONTRACTS,
	DIGEST_LOWER_CONTRACTS,
	DIGEST_NARROW_CONTEXT,
	DIGEST_OPENING_CONTRACTS,
	DIGEST_PHONE_CONTEXT,
	PLACEMENT_CHASSIS_CONTRACTS,
} = require( './job-placement-page-style-contracts' );

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
		candidate.atContext === ( contract.atContext ?? null ) &&
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

function ruleForContract( css, contract ) {
	return parseRules( css ).find( ( candidate ) =>
		candidate.atContext === ( contract.atContext ?? null ) &&
			normalizeSelectors( candidate.prelude ).includes( contract.selector )
	);
}

function removeContractRule( css, contract ) {
	const rule = ruleForContract( css, contract );
	assert( rule, `Removal fixture is missing ${ contract.selector } in ${ contract.atContext }.` );
	return `${ css.slice( 0, rule.start ) }${ css.slice( rule.end ) }`;
}

function declarationValue( rule, property ) {
	const declaration = new RegExp( `(?:^|;)\\s*${ property }\\s*:\\s*([^;]+);` ).exec( rule.body );
	return declaration?.[ 1 ].replace( /\s+/g, ' ' ).trim();
}

function assertDigestPhoneRowGapWinsCascade( css ) {
	const effectiveRule = parseRules( css )
		.filter( ( rule ) =>
			normalizeSelectors( rule.prelude ).includes( '.hp-wcus-callout__inner' ) &&
				[ DIGEST_NARROW_CONTEXT, DIGEST_PHONE_CONTEXT ].includes( rule.atContext ) &&
				declarationValue( rule, 'row-gap' )
		)
		.at( -1 );
	assert( effectiveRule, 'Digest phone cascade must declare an event-plate row gap.' );
	assert.equal(
		effectiveRule.atContext,
		DIGEST_PHONE_CONTEXT,
		'The phone row-gap rule must follow any overlapping narrow rule.'
	);
	assert.equal(
		declarationValue( effectiveRule, 'row-gap' ),
		'var(--wp--preset--spacing--4)',
		'The effective <=600px event-first row gap must use spacing--4.'
	);
}

function assertNativeAlignfullOwnsBreakoutGeometry( css ) {
	for ( const selector of [
		'.hp-wcus-callout--event-first',
		'.hp-placement-section',
		'.hp-placement-band',
	] ) {
		const rule = ruleForContract( css, { selector } );
		assert( rule, `${ selector } must have a top-level rule.` );
		assert.equal(
			declarationValue( rule, 'inline-size' ),
			undefined,
			`${ selector } must leave inline-size to WordPress's native alignfull geometry.`
		);
	}

	const band = ruleForContract( css, { selector: '.hp-placement-band' } );
	assert.equal(
		declarationValue( band, 'margin-inline' ),
		undefined,
		'.hp-placement-band must leave breakout margins to WordPress alignfull.'
	);
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
	assert.doesNotThrow( () => assertRuleDeclarations(
		'@media   ( max-width:781px ) { .hp-example { grid-template-columns: minmax(0, 1fr); } }',
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

test( 'Digest opening uses the approved token-based event-first topology', () => {
	const contracts = [ ...DIGEST_OPENING_CONTRACTS, ...DIGEST_COMPACT_CONTRACTS ];
	const typographyContracts = contracts.filter( ( contract ) =>
		Object.values( contract.declarations ).some( ( value ) =>
			value.includes( '--wp--preset--font-size--' )
		)
	);
	assert.doesNotThrow( () => assertFontPresetReferencesResolve( typographyContracts, themeJson ) );

	for ( const contract of contracts ) {
		assert.doesNotThrow( () => assertRuleDeclarations( pagesCss, contract ) );
		for ( const [ property, expected ] of Object.entries( contract.declarations ) ) {
			const mutant = mutateDeclaration( pagesCss, contract, property, expected );
			assert.throws(
				() => assertRuleDeclarations( mutant, contract ),
				/Digest|hp-|padding|margin|font|grid|gap|width|align|border/
			);
		}
	}

	assert.equal(
		pagesCss.split( DIGEST_COMPACT_CONTEXT ).length - 1,
		1,
		'The compact band must have one exact source context.'
	);
	const wrongUpperBound = pagesCss.replace(
		DIGEST_COMPACT_CONTEXT,
		'@media (min-width: 601px) and (max-width: 1024px)'
	);
	assert.throws(
		() => assertRuleDeclarations( wrongUpperBound, DIGEST_COMPACT_CONTRACTS[ 0 ] ),
		/601px|1023px|hp-digest-template/
	);
} );

test( 'accepted Digest actions keep three desktop columns and one narrow column', () => {
	const contracts = DIGEST_ACCEPTED_ACTION_CONTRACTS;

	for ( const contract of contracts ) {
		assert.doesNotThrow( () => assertRuleDeclarations( pagesCss, contract ) );
		const mutant = mutateDeclaration(
			pagesCss,
			contract,
			'grid-template-columns',
			contract.declarations[ 'grid-template-columns' ]
		);
		assert.throws(
			() => assertRuleDeclarations( mutant, contract ),
			/hp-wcus-callout__actions|grid-template-columns|781px/
		);
		assert.throws(
			() => assertRuleDeclarations( removeContractRule( pagesCss, contract ), contract ),
			/hp-wcus-callout__actions|grid-template-columns|781px/
		);
	}

	const baseRule = ruleForContract( pagesCss, contracts[ 0 ] );
	const eventRule = ruleForContract( pagesCss, {
		selector: '.hp-wcus-callout--event-first .hp-wcus-callout__actions',
	} );
	assert(
		baseRule.end <= eventRule.start,
		'The generic accepted action topology must precede the more-specific event-first override.'
	);

	const baseInMedia = `${ pagesCss.slice( 0, baseRule.start ) }@media (min-width: 1px) { ${ pagesCss.slice( baseRule.start, baseRule.end ) } }${ pagesCss.slice( baseRule.end ) }`;
	assert.throws(
		() => assertRuleDeclarations( baseInMedia, contracts[ 0 ] ),
		/hp-wcus-callout__actions|grid-template-columns/
	);

	const wrongNarrowContext = pagesCss.replace(
		DIGEST_NARROW_CONTEXT,
		'@media (max-width: 782px)'
	);
	assert.throws(
		() => assertRuleDeclarations( wrongNarrowContext, contracts[ 1 ] ),
		/hp-wcus-callout__actions|grid-template-columns|781px/
	);
} );

test( 'Digest phone row gap wins the overlapping narrow cascade', () => {
	assertDigestPhoneRowGapWinsCascade( pagesCss );

	const laterNarrowOverride = `${ pagesCss }\n${ DIGEST_NARROW_CONTEXT } {\n  .hp-wcus-callout__inner {\n    row-gap: var(--wp--preset--spacing--5);\n  }\n}\n`;
	assert.throws(
		() => assertDigestPhoneRowGapWinsCascade( laterNarrowOverride ),
		/phone row-gap rule must follow|spacing--4/
	);
} );

test( 'Digest lower-page hierarchy and evidence records are declaration-pinned', () => {
	for ( const contract of DIGEST_LOWER_CONTRACTS ) {
		assert.doesNotThrow( () => assertRuleDeclarations( pagesCss, contract ) );
		for ( const [ property, expected ] of Object.entries( contract.declarations ) ) {
			const mutant = mutateDeclaration( pagesCss, contract, property, expected );
			assert.throws(
				() => assertRuleDeclarations( mutant, contract ),
				/Digest|hp-|margin|padding|grid|gap|align/
			);
		}
	}

} );

test( 'placement chassis and phone-label declarations are mutation-pinned', () => {
	for ( const contract of PLACEMENT_CHASSIS_CONTRACTS ) {
		assert.doesNotThrow( () => assertRuleDeclarations( pagesCss, contract ) );
		for ( const [ property, expected ] of Object.entries( contract.declarations ) ) {
			assert.throws(
				() => assertRuleDeclarations( mutateDeclaration( pagesCss, contract, property, expected ), contract ),
				/hp-|placement|content|display|grid|padding|scroll|overflow|font|border|align/
			);
		}
	}
} );

test( 'placement bands preserve WordPress root-padding-aware alignfull breakout', () => {
	assert.doesNotThrow( () => assertNativeAlignfullOwnsBreakoutGeometry( pagesCss ) );

	for ( const selector of [ '.hp-wcus-callout--event-first', '.hp-placement-section', '.hp-placement-band' ] ) {
		const rule = ruleForContract( pagesCss, { selector } );
		const mutant = `${ pagesCss.slice( 0, rule.end - 1 ) }\n  inline-size: 100%;\n${ pagesCss.slice( rule.end - 1 ) }`;
		assert.throws(
			() => assertNativeAlignfullOwnsBreakoutGeometry( mutant ),
			/native alignfull geometry/
		);
	}
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

/* --------------------------------------------------------------------------
   Placement Method appendix ledgers.

   Both appendix ledgers are narrowed by the same injected filter as the Digest
   register, so the declarations that make filtering safe have to hold. The
   rendered pass cannot substitute for these: it drives the filter through one
   ledger at one width, while a missing [hidden] guard only shows up as a row
   that refuses to leave the flow on a phone, and a missing narrow-layout rule
   only shows up as a value column too small to read.
   ----------------------------------------------------------------------- */

test( 'appendix ledger declarations are present in the page sheet', () => {
	assert( APPENDIX_LEDGER_CONTRACTS.length > 0 );
	for ( const contract of APPENDIX_LEDGER_CONTRACTS ) {
		assert.doesNotThrow(
			() => assertRuleDeclarations( pagesCss, contract ),
			`missing appendix ledger contract: ${ contract.selector }`
		);
	}
} );

/**
 * Empty the declaration block that `selector` belongs to. Mutating by property
 * name alone is not enough: `display: none` occurs dozens of times in this
 * sheet, so a blind first-match replace edits an unrelated rule and the
 * contract passes anyway, which is exactly the false confidence these mutation
 * tests exist to catch.
 */
function emptyRuleContaining( css, selector, atContext ) {
	// Parse rather than string-search. The same selector can appear once per
	// breakpoint — the market screen's label/value line is declared at ≤781px
	// and re-declared at ≤600px — and this sheet has several `@media
	// (max-width: 600px)` blocks, so neither the selector nor the at-rule text
	// identifies a rule on its own.
	const rule = parseRules( css ).find(
		( candidate ) =>
			normalizeSelectors( candidate.prelude ).includes( selector ) &&
			( candidate.atContext || null ) === ( atContext || null )
	);
	assert( rule, `mutation fixture never found ${ selector } in ${ atContext || 'top level' }` );
	const open = css.indexOf( '{', rule.start );
	return css.slice( 0, open + 1 ) + '\n' + css.slice( rule.end - 1 );
}

test( 'every appendix ledger contract fails when its rule is emptied', () => {
	for ( const contract of APPENDIX_LEDGER_CONTRACTS ) {
		const mutated = emptyRuleContaining( pagesCss, contract.selector, contract.atContext );
		assert.notEqual( mutated, pagesCss, `mutation was a no-op for ${ contract.selector }` );
		assert.throws(
			() => assertRuleDeclarations( mutated, contract ),
			`${ contract.selector } is not actually pinned`
		);
	}
} );

test( 'a filtered-out appendix row leaves the flow at every width', () => {
	// The narrow layout re-declares rows as display:block, which ties with the
	// UA sheet's [hidden] rule at equal specificity. Losing the extra class is
	// invisible on desktop and leaves a "hidden" row rendering on a phone.
	for ( const table of [ 'hp-keyword-table', 'hp-market-table', 'hp-evidence-table' ] ) {
		assert.doesNotThrow( () =>
			assertRuleDeclarations( pagesCss, {
				selector: `.wp-block-table.${ table } tbody tr[hidden]`,
				declarations: { display: 'none' },
			} )
		);
	}
} );
