const { isLoopbackOrigin } = require( './site-url' );

function filesystemLikePathname( pathname ) {
	let decoded;
	try {
		decoded = decodeURIComponent( pathname );
	} catch {
		return false;
	}

	return /^\/[a-z]:(?:[\\/]|$)/i.test( decoded );
}

function selectJournalRoute( hrefs, origin, options = {} ) {
	const expected = new URL( origin );
	const requireLocal = options.requireLocal === true;
	const kind = options.kind || 'journal';

	if ( requireLocal && ! isLoopbackOrigin( expected.href ) ) {
		throw new Error( '--require-local journal discovery requires a localhost or loopback origin.' );
	}

	const result = {
		path: null,
		quarantined: [],
		violations: [],
	};

	for ( const href of Array.isArray( hrefs ) ? hrefs : [] ) {
		let url;
		try {
			url = new URL( href, expected );
		} catch {
			result.violations.push( `${ kind } href ${ JSON.stringify( href ) } is not a valid URL.` );
			continue;
		}

		if ( url.origin !== expected.origin ) {
			result.violations.push( `${ kind } href ${ JSON.stringify( href ) } must be same-origin with ${ expected.origin }.` );
			continue;
		}
		if ( url.hash || url.username || url.password ) {
			result.violations.push( `${ kind } href ${ JSON.stringify( href ) } must not include a fragment or credentials.` );
			continue;
		}
		if ( filesystemLikePathname( url.pathname ) ) {
			const message = `${ kind } href ${ JSON.stringify( href ) } has filesystem-like pathname ${ JSON.stringify( decodeURIComponent( url.pathname ) ) }.`;
			if ( requireLocal ) {
				result.quarantined.push( message );
			} else {
				result.violations.push( message );
			}
			continue;
		}

		if ( result.path === null ) {
			result.path = url.pathname + url.search;
		}
	}

	return result;
}

module.exports = { filesystemLikePathname, selectJournalRoute };
