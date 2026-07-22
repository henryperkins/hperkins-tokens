const { getOrigin, resolveSiteUrl } = require( './site-url' );

const EXPECTED_TITLE = 'Job Placement Digest — Henry Perkins | WordPress Support and Solutions Engineering';
const EXPECTED_DESCRIPTION = 'Henry Perkins’s evidence-backed case for enterprise WordPress support and solutions engineering, with shipped work, verified contribution records, résumé evidence, and a dated market screen.';

const NAMED_ENTITIES = new Map( [
	[ 'amp', '&' ],
	[ 'apos', "'" ],
	[ 'gt', '>' ],
	[ 'lt', '<' ],
	[ 'mdash', '—' ],
	[ 'nbsp', '\u00a0' ],
	[ 'quot', '"' ],
	[ 'rsquo', '’' ],
] );

function decodeHtmlEntities( value ) {
	return value.replace( /&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, ( entity, decimal, hexadecimal, named ) => {
		if ( decimal ) {
			return String.fromCodePoint( Number.parseInt( decimal, 10 ) );
		}
		if ( hexadecimal ) {
			return String.fromCodePoint( Number.parseInt( hexadecimal, 16 ) );
		}
		return NAMED_ENTITIES.get( named.toLowerCase() ) ?? entity;
	} );
}

function normalizeText( value ) {
	return decodeHtmlEntities( value ).replace( /\s+/g, ' ' ).trim();
}

function parseAttributes( tag ) {
	const attributes = new Map();
	const attributeExpression = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
	const start = tag.indexOf( ' ' );

	if ( start === -1 ) {
		return attributes;
	}

	for ( const match of tag.slice( start, -1 ).matchAll( attributeExpression ) ) {
		const value = match[ 2 ] ?? match[ 3 ] ?? match[ 4 ] ?? '';
		attributes.set( match[ 1 ].toLowerCase(), normalizeText( value ) );
	}

	return attributes;
}

function findTags( head, tagName, predicate ) {
	const expression = new RegExp( `<${ tagName }\\b[^>]*>`, 'gi' );
	return [ ...head.matchAll( expression ) ]
		.map( ( match ) => parseAttributes( match[ 0 ] ) )
		.filter( predicate );
}

function getSingleValue( matches, attribute, label, errors ) {
	if ( matches.length !== 1 ) {
		errors.push( `${ label }: expected exactly one tag, found ${ matches.length }.` );
		return '';
	}

	const value = matches[ 0 ].get( attribute ) ?? '';
	if ( ! value ) {
		errors.push( `${ label }: ${ attribute } is empty.` );
	}
	return value;
}

function assertExact( label, actual, expected, errors ) {
	if ( actual && actual !== expected ) {
		errors.push( `${ label } mismatch:\n  expected: ${ expected }\n  received: ${ actual }` );
	}
}

function verifyJobPlacementDigestMetadata( html, pageUrl ) {
	const headMatch = html.match( /<head\b[^>]*>([\s\S]*?)<\/head>/i );
	if ( ! headMatch ) {
		throw new Error( 'Job Placement Digest metadata verification failed:\n- Document has no complete <head> element.' );
	}

	const head = headMatch[ 1 ];
	const errors = [];
	const titles = [ ...head.matchAll( /<title\b[^>]*>([\s\S]*?)<\/title>/gi ) ];
	let title = '';
	if ( titles.length !== 1 ) {
		errors.push( `document title: expected exactly one tag, found ${ titles.length }.` );
	} else {
		title = normalizeText( titles[ 0 ][ 1 ] );
		if ( ! title ) {
			errors.push( 'document title is empty.' );
		}
	}

	const description = getSingleValue(
		findTags( head, 'meta', ( attributes ) => attributes.get( 'name' )?.toLowerCase() === 'description' ),
		'content',
		'meta description',
		errors
	);
	const canonical = getSingleValue(
		findTags( head, 'link', ( attributes ) =>
			( attributes.get( 'rel' ) || '' ).toLowerCase().split( /\s+/ ).includes( 'canonical' )
		),
		'href',
		'canonical URL',
		errors
	);
	const ogTitle = getSingleValue(
		findTags( head, 'meta', ( attributes ) => attributes.get( 'property' )?.toLowerCase() === 'og:title' ),
		'content',
		'og:title',
		errors
	);
	const ogDescription = getSingleValue(
		findTags( head, 'meta', ( attributes ) => attributes.get( 'property' )?.toLowerCase() === 'og:description' ),
		'content',
		'og:description',
		errors
	);
	const ogImage = getSingleValue(
		findTags( head, 'meta', ( attributes ) => attributes.get( 'property' )?.toLowerCase() === 'og:image' ),
		'content',
		'og:image',
		errors
	);

	assertExact( 'document title', title, EXPECTED_TITLE, errors );
	assertExact( 'meta description', description, EXPECTED_DESCRIPTION, errors );
	assertExact( 'canonical URL', canonical, pageUrl.href, errors );
	assertExact( 'og:title', ogTitle, EXPECTED_TITLE, errors );
	assertExact( 'og:description', ogDescription, EXPECTED_DESCRIPTION, errors );

	if ( ogImage ) {
		try {
			const imageUrl = new URL( ogImage );
			if ( imageUrl.protocol !== 'http:' && imageUrl.protocol !== 'https:' ) {
				throw new Error( 'non-web protocol' );
			}
		} catch ( error ) {
			errors.push( `og:image must be an absolute http(s) URL, received: ${ ogImage }` );
		}
	}

	if ( errors.length ) {
		throw new Error( `Job Placement Digest metadata verification failed:\n- ${ errors.join( '\n- ' ) }` );
	}

	return {
		title,
		description,
		canonical,
		ogTitle,
		ogDescription,
		ogImage,
	};
}

function getDigestPageUrl( args = process.argv.slice( 2 ), env = process.env ) {
	let override = '';
	let hasOverride = false;

	for ( let index = 0; index < args.length; index += 1 ) {
		const argument = args[ index ];
		if ( argument === '--url' ) {
			if ( hasOverride ) {
				throw new Error( '--url may only be provided once.' );
			}
			override = args[ index + 1 ] || '';
			if ( ! override ) {
				throw new Error( '--url requires an absolute http(s) URL.' );
			}
			hasOverride = true;
			index += 1;
		} else if ( argument.startsWith( '--url=' ) ) {
			if ( hasOverride ) {
				throw new Error( '--url may only be provided once.' );
			}
			override = argument.slice( '--url='.length );
			if ( ! override ) {
				throw new Error( '--url requires an absolute http(s) URL.' );
			}
			hasOverride = true;
		} else {
			throw new Error( `Unknown argument: ${ argument }` );
		}
	}

	const pageUrl = override ? new URL( override ) : resolveSiteUrl( getOrigin( env ), '/job-placement-digest/' );
	if ( pageUrl.protocol !== 'http:' && pageUrl.protocol !== 'https:' ) {
		throw new Error( `Job Placement Digest URL must be an http(s) URL: ${ pageUrl.href }` );
	}
	if ( pageUrl.search || pageUrl.hash ) {
		throw new Error( `Job Placement Digest URL must not include a query string or fragment: ${ pageUrl.href }` );
	}

	return pageUrl;
}

module.exports = {
	EXPECTED_DESCRIPTION,
	EXPECTED_TITLE,
	getDigestPageUrl,
	verifyJobPlacementDigestMetadata,
};
