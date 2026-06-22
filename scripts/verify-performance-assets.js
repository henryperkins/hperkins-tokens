#!/usr/bin/env node
/**
 * Verifies the low-risk mobile PageSpeed fixes for theme-owned assets.
 */
const { existsSync, readFileSync, statSync } = require( 'node:fs' );
const { join } = require( 'node:path' );

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

const themeJson = JSON.parse( readFileSync( join( themeRoot, 'theme.json' ), 'utf8' ) );
const fontFamilies = themeJson.settings.typography.fontFamilies;
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
	heroPattern.includes( 'wapuu-color.webp' ) && heroPattern.includes( 'wapuu-emblem-green.webp' ),
	'Wapuu hero pattern must offer WebP sources for hero artwork.'
);
assert(
	heroPattern.includes( 'width="962"' ) && heroPattern.includes( 'height="1024"' ),
	'Wapuu hero image needs intrinsic width and height attributes.'
);
assert(
	heroPattern.includes( 'loading="lazy"' ) && heroPattern.includes( 'decoding="async"' ),
	'Wapuu hero image needs explicit lazy async decoding attributes.'
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

console.log( 'verified performance asset contracts' );
