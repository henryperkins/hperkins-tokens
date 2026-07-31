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
 * Comma-split selector list with runs of whitespace collapsed to one space, so
 * two spellings of the same selector compare equal.
 *
 * @param {string} prelude Selector text.
 * @return {string[]} Normalized selectors.
 */
function normalizeSelectors( prelude ) {
	return prelude
		.split( ',' )
		.map( ( selector ) => selector.replace( /\s+/g, ' ' ).trim() )
		.filter( Boolean );
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

module.exports = {
	BUNDLES,
	parseRules,
	selectorClasses,
	normalizeSelectors,
	bundleFor,
	classesInMarkup,
};
