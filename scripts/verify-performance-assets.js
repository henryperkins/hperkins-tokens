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
assert(
	/@media \(max-width: 781px\)[\s\S]*?\.hp-wapuu-hero-wrap::before\s*\{[^}]*background-image:\s*none;[^}]*\}/.test( styleCss ),
	'Mobile hero CSS must keep the decorative backdrop image out of the critical path.'
);

const themeJson = JSON.parse( readFileSync( join( themeRoot, 'theme.json' ), 'utf8' ) );
const fontFamilies = themeJson.settings.typography.fontFamilies;
const bodyFontFamily = fontFamilies.find( ( family ) => family.slug === 'body' );
assert( bodyFontFamily, 'theme.json must define the body font family.' );
assert(
	bodyFontFamily.fontFamily.startsWith( "'HPerkins EB Garamond'," ),
	'Body typography must prefer the uniquely named self-hosted HPerkins EB Garamond family.'
);
assert(
	bodyFontFamily.fontFace.every( ( fontFace ) => fontFace.fontFamily === 'HPerkins EB Garamond' ),
	'Every body font face must use the unique HPerkins EB Garamond family name.'
);
for ( const family of fontFamilies ) {
	if ( ! Array.isArray( family.fontFace ) ) {
		continue;
	}
	for ( const fontFace of family.fontFace ) {
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

const functionsPhp = readFileSync( join( themeRoot, 'functions.php' ), 'utf8' );
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
