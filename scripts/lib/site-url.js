const DEFAULT_ORIGIN = 'https://hperkins.blog';

function getOrigin( env = process.env ) {
	return env.HPERKINS_ORIGIN?.trim() || DEFAULT_ORIGIN;
}

function parseUrl( value, label ) {
	try {
		return new URL( value );
	} catch ( cause ) {
		throw new Error( `${ label } is not a valid URL: "${ value }".`, { cause } );
	}
}

function normalizeSiteUrl( value, label = 'site URL' ) {
	const url = parseUrl( value, label );

	// Reject non-web schemes: text like "Deprecated: notice" parses as a URL
	// with scheme "deprecated:", which would otherwise surface as a baffling
	// "null…" origin mismatch instead of a labeled parse failure.
	if ( url.protocol !== 'http:' && url.protocol !== 'https:' ) {
		throw new Error( `${ label } is not an http(s) URL: "${ value }".` );
	}

	const pathname = url.pathname.replace( /\/+$/, '' );

	return `${ url.origin }${ pathname }`;
}

function assertMatchingSiteUrl( configuredOrigin, wordpressUrl ) {
	const normalizedOrigin = normalizeSiteUrl( configuredOrigin, 'HPERKINS_ORIGIN' );
	const normalizedWordPressUrl = normalizeSiteUrl( wordpressUrl, "the selected WordPress site's home URL" );

	if ( normalizedOrigin !== normalizedWordPressUrl ) {
		throw new Error(
			`HPERKINS_ORIGIN "${ normalizedOrigin }" does not match the selected WordPress site's home URL "${ normalizedWordPressUrl }". Refusing runtime mutation.`
		);
	}
}

function resolveSiteUrl( origin, relativePath ) {
	const base = normalizeSiteUrl( origin, 'HPERKINS_ORIGIN' );

	return new URL( `${ base }/${ relativePath.replace( /^\/+/, '' ) }` );
}

module.exports = {
	assertMatchingSiteUrl,
	getOrigin,
	normalizeSiteUrl,
	resolveSiteUrl,
};
