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
	// The Job Placement Digest's event photograph. It arrived as a 3.4 MB PNG
	// and shipped that way until this budget existed; the recruiter route is
	// the one most likely to be opened on a phone on conference wifi.
	'assets/img/imagery/wcus-2026-phoenix.webp': 180000,
	// The About showcase's two evidence screenshots. They are card thumbnails —
	// the figure is never wider than ~372px — so the sources are downscaled
	// WebP, not the 2082w and 1440w PNGs the case studies keep.
	'assets/screenshots/flavor-agent-activity-log.webp': 90000,
	'assets/screenshots/ai-provider-codex-runtime-settings.webp': 40000,
	// The About showcase's theme card shows the mascot, not a screenshot. Alpha
	// WebP is dearer than opaque, so it carries its own budget.
	'assets/wapuu/wapuu-hero.webp': 90000,
	// Supplied Tableau mark, retained byte-for-byte from the design ZIP.
	'assets/img/marks/tableu.png': 400000,
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
	expandPatternChain,
} = require( './lib/style-coverage' );

// Patterns are read by slug the way the PHP resolver reads them, so a check
// below follows the same chain the runtime does.
function readPatternSource( slug ) {
	const file = join( themeRoot, 'patterns', `${ slug }.php` );
	return existsSync( file ) ? readFileSync( file, 'utf8' ) : null;
}

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

// The front page must resolve to zero bundles. Follow the pattern chain the
// resolver follows, so a class introduced two patterns deep is still caught.
const frontMarkup = expandPatternChain(
	[
		readFileSync( join( themeRoot, 'templates/front-page.html' ), 'utf8' ),
		frontPageSnapshot,
	],
	readPatternSource
);
for ( const className of classesInMarkup( frontMarkup ) ) {
	const owner = bundleFor( className );
	assert(
		owner === null,
		`Front-page class "${ className }" belongs to the ${ owner } bundle, so the front page would load it.`
	);
}

// Template parts render on every route and are deliberately excluded from the
// resolver's haystack, so a bundle-owned class anywhere in their markup is
// unstyled everywhere. Checking the part files alone is not enough: header.html
// is a bare [hperkins_council_header] shortcode whose markup lives in
// inc/council-header.php, and footer.html delegates to the footer-colophon
// pattern. Follow both delegations or the guard passes over the very files that
// carry the markup.
const alwaysRenderedSources = [
	...expandPatternChain(
		[ 'parts/header.html', 'parts/footer.html' ].map( ( part ) =>
			readFileSync( join( themeRoot, part ), 'utf8' )
		),
		readPatternSource
	),
	readFileSync( join( themeRoot, 'inc/council-header.php' ), 'utf8' ),
];
for ( const className of classesInMarkup( alwaysRenderedSources ) ) {
	const owner = bundleFor( className );
	assert(
		owner === null,
		`Always-rendered markup (template parts, their patterns, or the Council header renderer) uses "${ className }" from the ${ owner } bundle, but that markup is excluded from bundle resolution.`
	);
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

// --- Responsive candidates -------------------------------------------------
// Candidate widths come from the layout rules, not from a measured display
// size. Home uses the full mobile copy column and caps the art at 440px;
// both 448w and 640w sources remain available for the browser's density choice.
// The shared ring grid uses three columns above 920px (Home: 900px), and
// one column below; its 768w source avoids the full 1100w image on phones.
// The Digest event photograph spans the alignwide plate — its figure margins
// cancel the plate padding — so it is calc(100vw - 4rem) up to a 1216px
// viewport and 72rem above it. A phone lays it out near 326px and takes 768w at
// 2x, landing on the same candidate width as the ring cards. Unlike the hero
// and the ring cards, its srcset is not authored in markup: the photograph sits
// in a wp:image block that core/image cannot serialize an srcset into, so
// inc/content-images.php adds one on wp_content_img_tag instead. That file is
// asserted below.
const responsiveVariants = {
	'assets/img/wapuu-color-448.webp': 30000,
	'assets/img/imagery/rivendell-second-age-768.webp': 90000,
	'assets/img/imagery/rivendell-third-age-768.webp': 90000,
	'assets/img/imagery/rivendell-fourth-age-768.webp': 90000,
	'assets/img/imagery/wcus-2026-phoenix-768.webp': 90000,
	'assets/screenshots/flavor-agent-activity-log-640.webp': 45000,
	'assets/screenshots/ai-provider-codex-runtime-settings-640.webp': 20000,
	'assets/wapuu/wapuu-hero-448.webp': 45000,
};
for ( const [ relativePath, maxBytes ] of Object.entries( responsiveVariants ) ) {
	assertFileSmallerThan( relativePath, maxBytes );
}

assert(
	heroPattern.includes( 'wapuu-color-448.webp' ) &&
		/srcset="[^"]*448w[^"]*640w/.test( heroPattern ),
	'Wapuu hero WebP source needs a 448w/640w srcset.'
);
assert(
	heroPattern.includes( 'sizes="(max-width: 504px) calc(100vw - 4rem), (max-width: 900px) 27.5rem, (max-width: 1152px) calc((100vw - 9rem) * 0.45), 27.5rem"' ),
	'Wapuu hero sizes must follow the mobile gutter, 900px grid transition, and 440px cap.'
);
assert(
	( ringPattern.match( /srcset="[^"]*768w[^"]*1100w/g ) || [] ).length >= 3,
	'All three ring-card WebP sources need a 768w/1100w srcset.'
);
assert(
	( ringPattern.match( /sizes="\(max-width: 920px\) 92vw, 23rem"/g ) || [] ).length >= 3,
	'Ring-card sizes must match .hp-ring-grid (one column under 920px, ~23rem per column above).'
);

// The Digest event photograph gets its candidates at render time. Nothing in
// the page body shows that, so the contract is pinned against the filter file.
const contentImages = readFileSync( join( themeRoot, 'inc/content-images.php' ), 'utf8' );
assert(
	functionsPhp.includes( '/inc/content-images.php' ),
	'functions.php must require inc/content-images.php.'
);
assert(
	contentImages.includes( "add_filter( 'wp_content_img_tag'" ),
	'inc/content-images.php must register its candidates on wp_content_img_tag.'
);
for ( const file of [
	'assets/img/imagery/wcus-2026-phoenix.webp',
	'assets/img/imagery/wcus-2026-phoenix-768.webp',
	'assets/screenshots/flavor-agent-activity-log.webp',
	'assets/screenshots/flavor-agent-activity-log-640.webp',
	'assets/screenshots/ai-provider-codex-runtime-settings.webp',
	'assets/screenshots/ai-provider-codex-runtime-settings-640.webp',
	'assets/wapuu/wapuu-hero.webp',
	'assets/wapuu/wapuu-hero-448.webp',
] ) {
	assert(
		contentImages.includes( file ),
		`inc/content-images.php must name ${ file } as a responsive candidate.`
	);
}
// The showcase cards are two to a row at every width, so the figure is half the
// content column less the grid gap and the card's inline padding. Both
// screenshots sit in that same box and share one sizes string.
assert(
	contentImages.includes( "'(max-width: 1023px) 50vw, 32rem'" ),
	'Showcase screenshot sizes must cover the full two-up card backdrop, capped at 32rem.'
);
assert(
	contentImages.includes( "'small_width' => 768" ) && contentImages.includes( "'width'       => 1448" ),
	'The Digest photograph needs a 768w candidate against the 1448w full frame.'
);
assert(
	contentImages.includes( "'sizes'       => '(max-width: 1216px) calc(100vw - 4rem), 72rem'" ),
	'Digest photograph sizes must match the alignwide plate (calc(100vw - 4rem) below 1216px, 72rem above).'
);
// Core decides loading and fetchpriority for this one. It is the first content
// image on the route, which wp_get_loading_optimization_attributes() already
// keeps eager; hardcoding either here would override that on a likely LCP image.
assert(
	! /\bloading=|\bfetchpriority=/.test( contentImages ),
	'inc/content-images.php must leave loading and fetchpriority to core.'
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
