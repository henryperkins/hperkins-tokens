'use strict';

/**
 * Class-name prefixes owned by each conditionally loaded bundle.
 *
 * Matching is prefix-based because live classes carry BEM suffixes
 * (hp-callout--warn, hp-evidence-row__item). A prefix must never appear in
 * more than one bundle; the unit test pins that, and
 * scripts/verify-performance-assets.js pins that this list stays in sync with
 * hperkins_tokens_bundle_map() in inc/component-styles.php.
 */
const BUNDLES = {
	evidence: [
		'hp-operational-story',
		'hp-evidence-row',
		'hp-evidence-board',
		'hp-product-hero',
		'hp-artifact',
		'hp-signal',
		'hp-shot',
		'hp-quote',
		'hp-spoke-nav',
		'hp-case-study-template',
		'hp-lead',
	],
	interactive: [
		'hp-disclosure',
		// Core details block wearing the disclosure style; keeps its grouped rule
		// with .hp-disclosure > summary instead of splitting the pair across files.
		'is-style-hperkins-disclosure',
		'hp-subscribe',
		'hp-input',
		'hp-icon-button',
		'hp-content-search',
		'hp-callout',
		'hp-badge',
		'hp-tag',
		'hp-avatar',
	],
	longform: [
		'wp-block-table',
		'hp-reader-hero',
		'hp-archive-hero',
		'hp-skill-group',
		'hp-work-template',
	],
};

/**
 * Split CSS into rules, descending through @media/@supports/@layer/@container
 * so nested rules come back flat with their at-rule context attached.
 *
 * Offsets index the ORIGINAL string, comments included, so a caller can excise
 * a rule from the source file without reformatting anything around it.
 *
 * @param {string} css Stylesheet source.
 * @return {Array<{prelude: string, body: string, start: number, end: number, atContext: string|null}>} Rules.
 */
function parseRules( css ) {
	const rules = [];
	let i = 0;

	function skipComment() {
		if ( ! css.startsWith( '/*', i ) ) {
			return false;
		}
		const close = css.indexOf( '*/', i + 2 );
		i = close === -1 ? css.length : close + 2;
		return true;
	}

	function walk( end, atContext ) {
		while ( i < end ) {
			if ( skipComment() ) {
				continue;
			}
			const start = i;
			while ( i < end && css[ i ] !== '{' && css[ i ] !== '}' ) {
				if ( skipComment() ) {
					continue;
				}
				i++;
			}
			if ( i >= end ) {
				return;
			}
			if ( css[ i ] === '}' ) {
				i++;
				return;
			}

			const rawPrelude = css.slice( start, i );
			const prelude = rawPrelude.replace( /\/\*[\s\S]*?\*\//g, '' ).trim();
			// Anchor start at the selector itself rather than at the whitespace
			// separating it from the previous rule, so an excised span leaves the
			// surrounding formatting intact.
			const preludeStart = start + rawPrelude.match( /^\s*/ )[ 0 ].length;

			const open = i + 1;
			let depth = 1;
			let j = open;
			while ( j < end && depth > 0 ) {
				if ( css.startsWith( '/*', j ) ) {
					const close = css.indexOf( '*/', j + 2 );
					j = close === -1 ? end : close + 2;
					continue;
				}
				if ( css[ j ] === '{' ) {
					depth++;
				} else if ( css[ j ] === '}' ) {
					depth--;
				}
				j++;
			}

			if ( /^@(media|supports|layer|container)/i.test( prelude ) ) {
				i = open;
				walk( j - 1, prelude );
				i = j;
			} else {
				rules.push( {
					prelude,
					body: css.slice( open, j - 1 ),
					start: preludeStart,
					end: j,
					atContext: atContext || null,
				} );
				i = j;
			}
		}
	}

	walk( css.length, null );
	return rules;
}

/**
 * Distinct class names in a selector. Attributes and pseudo-elements are not
 * classes, and a leading digit cannot start a class, so the pattern requires a
 * letter after the dot.
 *
 * @param {string} prelude Selector text.
 * @return {string[]} Class names.
 */
function selectorClasses( prelude ) {
	return [
		...new Set( [ ...prelude.matchAll( /\.([a-zA-Z][\w-]*)/g ) ].map( ( m ) => m[ 1 ] ) ),
	];
}

/**
 * Remove the argument list of every functional pseudo-class, so only the
 * "plain" part of a selector remains.
 *
 * @param {string} selector Selector text.
 * @return {string} Selector with :not(...)/:is(...)/etc. arguments removed.
 */
function stripFunctionalPseudos( selector ) {
	let out = '';
	for ( let i = 0; i < selector.length; i++ ) {
		if ( selector[ i ] === ':' ) {
			let nameStart = i + 1;
			if ( selector[ nameStart ] === ':' ) {
				nameStart++;
			}
			let nameEnd = nameStart;
			while ( nameEnd < selector.length && /[\w-]/.test( selector[ nameEnd ] ) ) {
				nameEnd++;
			}
			if ( selector[ nameEnd ] === '(' ) {
				let depth = 1;
				let scan = nameEnd + 1;
				while ( scan < selector.length && depth > 0 ) {
					if ( selector[ scan ] === '(' ) {
						depth++;
					} else if ( selector[ scan ] === ')' ) {
						depth--;
					}
					scan++;
				}
				i = scan - 1;
				continue;
			}
		}
		out += selector[ i ];
	}
	return out;
}

/**
 * Classes that must be PRESENT for a selector to match.
 *
 * Classes inside functional pseudo-classes do not qualify. In
 * `.hp-prose > :where(p, li):not(.hp-lead)` the only anchor is `.hp-prose`;
 * `.hp-lead` is a negation, and treating it as an anchor moved a global prose
 * rule into a component bundle, silently dropping it from every page that did
 * not load that bundle.
 *
 * @param {string} selector A single selector (not a comma-separated list).
 * @return {string[]} Anchoring class names.
 */
function anchorClasses( selector ) {
	return selectorClasses( stripFunctionalPseudos( selector ) );
}

/**
 * Comma-split selector list with runs of whitespace collapsed to one space, so
 * two spellings of the same selector compare equal.
 *
 * Splits only at bracket depth zero and outside quotes. A naive split breaks
 * `:is(th, td)` into `:is(th` and `td)`, and re-emitting those halves produces
 * invalid CSS that makes a browser discard the remainder of the stylesheet.
 *
 * @param {string} prelude Selector text.
 * @return {string[]} Normalized selectors.
 */
function normalizeSelectors( prelude ) {
	const parts = [];
	let current = '';
	let depth = 0;
	let quote = null;

	for ( let i = 0; i < prelude.length; i++ ) {
		const char = prelude[ i ];

		if ( quote ) {
			current += char;
			if ( char === quote && prelude[ i - 1 ] !== '\\' ) {
				quote = null;
			}
			continue;
		}

		if ( char === '"' || char === "'" ) {
			quote = char;
		} else if ( char === '(' || char === '[' ) {
			depth++;
		} else if ( char === ')' || char === ']' ) {
			depth--;
		} else if ( char === ',' && depth === 0 ) {
			parts.push( current );
			current = '';
			continue;
		}

		current += char;
	}
	parts.push( current );

	return parts
		.map( ( selector ) => selector.replace( /\s+/g, ' ' ).trim() )
		.filter( Boolean );
}

/**
 * Require one effective selector in one exact at-rule context with the
 * declarations a source-only browser contract depends on. This deliberately
 * uses parseRules(), so comments and empty lookalike rules cannot satisfy it.
 *
 * @param {string} css Stylesheet source.
 * @param {{selector:string, atContext?:string|null, declarations:Object<string,string>}} contract Contract.
 */
function assertRuleDeclarations( css, contract ) {
	const atContext = contract.atContext || null;
	const matches = parseRules( css ).filter( ( rule ) =>
		rule.atContext === atContext && normalizeSelectors( rule.prelude ).includes( contract.selector )
	);
	if ( matches.length !== 1 ) {
		throw new Error(
			`CSS contract ${ contract.selector } in ${ atContext || 'the top level' } matched ${ matches.length } rules; expected exactly one.`
		);
	}

	const declarations = new Map();
	const body = matches[ 0 ].body.replace( /\/\*[\s\S]*?\*\//g, '' );
	for ( const statement of body.split( ';' ) ) {
		const colon = statement.indexOf( ':' );
		if ( colon < 0 ) {
			continue;
		}
		const property = statement.slice( 0, colon ).trim();
		const value = statement.slice( colon + 1 ).replace( /\s+/g, ' ' ).trim();
		if ( property ) {
			declarations.set( property, value );
		}
	}

	for ( const [ property, expected ] of Object.entries( contract.declarations ) ) {
		const actual = declarations.get( property );
		if ( actual !== expected ) {
			throw new Error(
				`CSS contract ${ contract.selector } in ${ atContext || 'the top level' } requires ${ property}: ${ expected }; got ${ actual || '<missing>' }.`
			);
		}
	}
}

/**
 * The bundle owning a class name, or null when the class stays in style.css.
 *
 * @param {string} className Class to resolve.
 * @return {string|null} Bundle name.
 */
function bundleFor( className ) {
	for ( const [ name, prefixes ] of Object.entries( BUNDLES ) ) {
		if ( prefixes.some( ( prefix ) => className.startsWith( prefix ) ) ) {
			return name;
		}
	}
	return null;
}

/**
 * Every class named by an HTML class attribute or a block comment's className.
 *
 * @param {string[]} sources Markup strings.
 * @return {Set<string>} Class names.
 */
function classesInMarkup( sources ) {
	const found = new Set();
	for ( const source of sources ) {
		if ( ! source ) {
			continue;
		}
		for ( const match of source.matchAll( /class(?:Name)?=["']([^"']+)["']/g ) ) {
			match[ 1 ].split( /\s+/ ).forEach( ( c ) => c && found.add( c ) );
		}
		for ( const match of source.matchAll( /"className":"([^"]+)"/g ) ) {
			match[ 1 ].split( /\s+/ ).forEach( ( c ) => c && found.add( c ) );
		}
	}
	return found;
}

/**
 * Theme pattern slugs a block-markup string names.
 *
 * Mirrors hperkins_tokens_pattern_slugs() in inc/component-styles.php.
 *
 * @param {string} markup Block markup.
 * @return {string[]} Pattern slugs, without the namespace.
 */
function patternSlugsIn( markup ) {
	return [
		...new Set(
			[ ...String( markup || '' ).matchAll( /wp:pattern\s*\{"slug":"hperkins-tokens\/([\w-]+)"/g ) ].map(
				( m ) => m[ 1 ]
			)
		),
	];
}

/**
 * Markup for a set of seed sources plus every theme pattern reachable from
 * them, expanded transitively.
 *
 * Mirrors the pattern walk in hperkins_tokens_render_haystack(): a template
 * names a content pattern which names a component pattern, and stopping at one
 * level misses the component. The visited set bounds the walk, so a pattern
 * cycle terminates.
 *
 * @param {string[]} seeds       Markup strings to start from.
 * @param {Function} readPattern Given a slug, returns its source or null.
 * @return {string[]} Seeds followed by each reached pattern's source.
 */
function expandPatternChain( seeds, readPattern ) {
	const collected = [ ...seeds ];
	const pending = collected.flatMap( patternSlugsIn );
	const seen = new Set();

	while ( pending.length ) {
		const slug = pending.shift();
		if ( seen.has( slug ) ) {
			continue;
		}
		seen.add( slug );

		const source = readPattern( slug );
		if ( source === null || source === undefined ) {
			continue;
		}
		collected.push( source );
		pending.push( ...patternSlugsIn( source ) );
	}

	return collected;
}

module.exports = {
	BUNDLES,
	parseRules,
	selectorClasses,
	stripFunctionalPseudos,
	anchorClasses,
	normalizeSelectors,
	assertRuleDeclarations,
	bundleFor,
	classesInMarkup,
	patternSlugsIn,
	expandPatternChain,
};
