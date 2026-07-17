function normalizeSiteUrl( value ) {
	const url = new URL( value );
	const pathname = url.pathname.replace( /\/+$/, '' );

	return `${ url.origin }${ pathname }`;
}

function assertMatchingSiteUrl( configuredOrigin, wordpressUrl ) {
	const normalizedOrigin = normalizeSiteUrl( configuredOrigin );
	const normalizedWordPressUrl = normalizeSiteUrl( wordpressUrl );

	if ( normalizedOrigin !== normalizedWordPressUrl ) {
		throw new Error(
			`HPERKINS_ORIGIN "${ normalizedOrigin }" does not match the selected WordPress site's home URL "${ normalizedWordPressUrl }". Refusing runtime mutation.`
		);
	}
}

module.exports = {
	assertMatchingSiteUrl,
	normalizeSiteUrl,
};
