#!/usr/bin/env node
/**
 * Verifies the low-risk mobile PageSpeed fixes for theme-owned assets.
 */
const { existsSync, readFileSync, statSync } = require( 'node:fs' );
const { join } = require( 'node:path' );

const { SNAPSHOT_DIR } = require( './lib/page-content-contract' );

const themeRoot = join( __dirname, '..' );

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function assertFileSmallerThan( relativePath, maxBytes ) {
	const file = join( themeRoot, relativePath );
	assert( existsSync( file ), `${ relativePath } is missing.` );
	const size = statSync( file ).size;
	assert(
		size <= maxBytes,
		`${ relativePath } is ${ size } bytes; expected <= ${ maxBytes } bytes.`
	);
}

const modernArtworkBudgets = {
	'assets/img/imagery/rivendell-second-age.webp': 180000,
	'assets/img/imagery/rivendell-third-age.webp': 180000,
	'assets/img/imagery/rivendell-fourth-age.webp': 180000,
	'assets/img/imagery/valley-twilight.webp': 180000,
	'assets/img/wapuu-color.webp': 60000,
	'assets/img/wapuu-emblem-green.webp': 12000,
};

for ( const [ relativePath, maxBytes ] of Object.entries( modernArtworkBudgets ) ) {
	assertFileSmallerThan( relativePath, maxBytes );
}

const styleCss = readFileSync( join( themeRoot, 'style.css' ), 'utf8' );

// Collect the body of each `@media (max-width: 781px)` block by brace-matching,
// so the hero check is scoped to the mobile query instead of a whole-file scan
// that could match a ::before rule living in unrelated (e.g. desktop) CSS.
function extractMediaBlocks( css, mediaQuery ) {
	const source = css.replace( /\/\*[\s\S]*?\*\//g, '' );
	const blocks = [];
	let from = 0;
	for (
		let start = source.indexOf( mediaQuery, from );
		start !== -1;
		start = source.indexOf( mediaQuery, from )
	) {
		const open = source.indexOf( '{', start );
		let depth = 1;
		let index = open + 1;
		while ( depth > 0 && index < source.length ) {
			if ( source[ index ] === '{' ) {
				depth += 1;
			} else if ( source[ index ] === '}' ) {
				depth -= 1;
			}
			index += 1;
		}
		blocks.push( source.slice( open + 1, index - 1 ) );
		from = index;
	}
	return blocks;
}

const mobileHeroDisabled = extractMediaBlocks( styleCss, '@media (max-width: 781px)' ).some( ( block ) => {
	const rule = block.match( /\.hp-wapuu-hero-wrap::before\s*\{([^}]*)\}/ );
	return !! rule && /(?:display:\s*none|background-image:\s*none)\s*;/.test( rule[1] );
} );
assert(
	mobileHeroDisabled,
	'A @media (max-width: 781px) block must disable .hp-wapuu-hero-wrap::before (display: none or background-image: none).'
);

const themeJson = JSON.parse( readFileSync( join( themeRoot, 'theme.json' ), 'utf8' ) );
const fontFamilies = themeJson.settings.typography.fontFamilies;
// Every self-hosted family must lead with a unique "HPerkins …" internal name so
// WordPress.com's same-named remote @font-face rules can't join the family and
// win selection over the smaller local subset (see the 0.3.44 body isolation).
for ( const family of fontFamilies ) {
	if ( ! Array.isArray( family.fontFace ) ) {
		continue;
	}
	assert(
		family.fontFamily.startsWith( "'HPerkins " ),
		`theme.json "${ family.slug }" family must lead with a unique 'HPerkins …' internal name (got: ${ family.fontFamily }).`
	);
	for ( const fontFace of family.fontFace ) {
		assert(
			fontFace.fontFamily.startsWith( 'HPerkins ' ),
			`theme.json "${ family.slug }" font face must use the unique HPerkins-prefixed name (got: ${ fontFace.fontFamily }).`
		);
		assert(
			[ 'swap', 'optional' ].includes( fontFace.fontDisplay ),
			`${ family.slug } font face is missing fontDisplay: swap|optional.`
		);
	}
}

const heroPattern = readFileSync( join( themeRoot, 'patterns/wapuu-home-hero.php' ), 'utf8' );
assert(
	heroPattern.includes( 'wapuu-color.webp' ),
	'Wapuu hero pattern must offer WebP sources for hero artwork.'
);
assert(
	heroPattern.includes( 'width="962"' ) && heroPattern.includes( 'height="1024"' ),
	'Wapuu hero image needs intrinsic width and height attributes.'
);
// Keep the above-the-fold signature artwork eager. The decorative CSS backdrop
// is disabled on mobile separately so it cannot compete in the LCP path.
assert(
	heroPattern.includes( 'fetchpriority="high"' ) && heroPattern.includes( 'decoding="async"' ),
	'Wapuu hero image must stay eager (fetchpriority="high" + decoding="async").'
);
assert(
	! heroPattern.includes( 'loading="lazy"' ),
	'Wapuu hero image must not be lazy-loaded because it is above the fold.'
);

const frontPageSnapshot = readFileSync( join( SNAPSHOT_DIR, 'front-page.html' ), 'utf8' );
assert(
	! frontPageSnapshot.includes( 'hp-wapuu-hero__figure' ) && ! frontPageSnapshot.includes( 'hp-ring-card__figure' ),
	'Front-page snapshot should keep the Wapuu hero and Three Rings asset sections theme-rendered.'
);
assert(
	! /https:\/\/hperkins\.blog\/wp-content\/themes\/hperkins-tokens\/assets\//.test( frontPageSnapshot ),
	'Front-page snapshot should not pin production theme asset URLs.'
);

const ringPattern = readFileSync( join( themeRoot, 'patterns/imladris-ring-card.php' ), 'utf8' );
for ( const file of [
	'rivendell-second-age.webp',
	'rivendell-third-age.webp',
	'rivendell-fourth-age.webp',
] ) {
	assert( ringPattern.includes( file ), `Ring-card pattern must offer ${ file }.` );
}
assert(
	( ringPattern.match( /loading="lazy"/g ) || [] ).length >= 3,
	'Ring-card images need explicit lazy loading.'
);
assert(
	( ringPattern.match( /width="1672"/g ) || [] ).length >= 3 &&
		( ringPattern.match( /height="941"/g ) || [] ).length >= 3,
	'Ring-card images need intrinsic dimensions.'
);

// --- Component bundle split contracts --------------------------------------
// style.css carries only what every route needs; component CSS lives in
// assets/c/*.css and is enqueued from the content being rendered. These
// assertions keep that split honest: the two bundle maps agreeing, no rule
// living on both sides of the load order, and the front page resolving to
// nothing.
const {
	BUNDLES,
	parseRules,
	anchorClasses,
	normalizeSelectors,
	classesInMarkup,
	bundleFor,
} = require( './lib/style-coverage' );

const bundleNames = Object.keys( BUNDLES );
const componentPhp = readFileSync( join( themeRoot, 'inc/component-styles.php' ), 'utf8' );

for ( const [ name, prefixes ] of Object.entries( BUNDLES ) ) {
	assert(
		componentPhp.includes( `'${ name }'` ),
		`inc/component-styles.php is missing the "${ name }" bundle.`
	);
	for ( const prefix of prefixes ) {
		assert(
			componentPhp.includes( `'${ prefix }'` ),
			`inc/component-styles.php is missing the "${ prefix }" prefix from the ${ name } bundle.`
		);
	}
}

for ( const name of bundleNames ) {
	assert(
		existsSync( join( themeRoot, `assets/c/${ name }.css` ) ),
		`assets/c/${ name }.css is missing.`
	);
}

const retainedRules = parseRules( styleCss );
for ( const rule of retainedRules ) {
	if ( rule.prelude.startsWith( '@' ) ) {
		continue;
	}
	for ( const selector of normalizeSelectors( rule.prelude ) ) {
		const owners = [
			...new Set( anchorClasses( selector ).map( bundleFor ).filter( Boolean ) ),
		];
		assert(
			owners.length !== 1,
			`style.css still styles bundle-owned selector "${ selector }" (belongs in ${ owners[ 0 ] }).`
		);
	}
}

// Bundles load after style.css, so a selector present in both would silently
// invert which rule wins.
const retainedSelectors = new Set();
for ( const rule of retainedRules ) {
	normalizeSelectors( rule.prelude ).forEach( ( selector ) => retainedSelectors.add( selector ) );
}
for ( const name of bundleNames ) {
	const bundleCss = readFileSync( join( themeRoot, `assets/c/${ name }.css` ), 'utf8' );
	for ( const rule of parseRules( bundleCss ) ) {
		for ( const selector of normalizeSelectors( rule.prelude ) ) {
			assert(
				! retainedSelectors.has( selector ),
				`Selector "${ selector }" is in both style.css and assets/c/${ name }.css; the cascade order inverts.`
			);
		}
	}
}

// The front page must resolve to zero bundles, and template parts render on
// every route, so neither may reference a bundle-owned class.
const frontMarkup = [
	readFileSync( join( themeRoot, 'templates/front-page.html' ), 'utf8' ),
	readFileSync( join( themeRoot, 'patterns/wapuu-home-hero.php' ), 'utf8' ),
	ringPattern,
	frontPageSnapshot,
];
for ( const className of classesInMarkup( frontMarkup ) ) {
	const owner = bundleFor( className );
	assert(
		owner === null,
		`Front-page class "${ className }" belongs to the ${ owner } bundle, so the front page would load it.`
	);
}
for ( const part of [ 'parts/header.html', 'parts/footer.html' ] ) {
	for ( const className of classesInMarkup( [ readFileSync( join( themeRoot, part ), 'utf8' ) ] ) ) {
		const owner = bundleFor( className );
		assert(
			owner === null,
			`${ part } uses "${ className }" from the ${ owner } bundle, but template parts render on every route.`
		);
	}
}

const functionsPhp = readFileSync( join( themeRoot, 'functions.php' ), 'utf8' );
assert(
	functionsPhp.includes( "/inc/component-styles.php" ),
	'functions.php must require inc/component-styles.php.'
);
assert(
	functionsPhp.includes( '! is_front_page()' ),
	'Page-layout CSS should not be enqueued on the front page.'
);
assert(
	functionsPhp.includes( 'valley-twilight.webp' ) && functionsPhp.includes( 'image-set(' ),
	'Footer backdrop should prefer the WebP asset via image-set().'
);

// Release-sync contract: style.css Version, readme.txt Stable tag, and the
// matching changelog entry must agree. filemtime() busts the cache, but the
// declared Version is the theme's release source of truth.
const styleVersionMatch = styleCss.match( /^Version:\s*(\S+)/m );
assert( styleVersionMatch, 'style.css must declare a Version.' );
const currentVersion = styleVersionMatch[1];
const readmeTxt = readFileSync( join( themeRoot, 'readme.txt' ), 'utf8' );
const stableTagMatch = readmeTxt.match( /^Stable tag:\s*(\S+)/m );
assert( stableTagMatch, 'readme.txt must declare a Stable tag.' );
assert(
	stableTagMatch[1] === currentVersion,
	`readme.txt Stable tag ${ stableTagMatch[1] } must match style.css Version ${ currentVersion }.`
);
assert(
	readmeTxt.includes( `= ${ currentVersion } =` ),
	`readme.txt must contain the ${ currentVersion } changelog.`
);

console.log( 'verified performance asset contracts' );
