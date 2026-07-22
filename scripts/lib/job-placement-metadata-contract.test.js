const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const {
	EXPECTED_DESCRIPTION,
	EXPECTED_TITLE,
	getDigestPageUrl,
	verifyJobPlacementDigestMetadata,
} = require( './job-placement-metadata-contract' );

function createValidDocument( pageUrl = 'https://hperkins.blog/job-placement-digest/' ) {
	return `<!doctype html>
<html>
	<head>
		<title>${ EXPECTED_TITLE.replace( '—', '&mdash;' ) }</title>
		<meta content="${ EXPECTED_DESCRIPTION.replace( '’', '&#8217;' ) }" name="description">
		<link href="${ pageUrl }" rel="alternate canonical">
		<meta content="${ EXPECTED_TITLE }" property="og:title">
		<meta property="og:description" content="${ EXPECTED_DESCRIPTION }">
		<meta content="https://hperkins.blog/social/job-placement-digest.png" property="og:image">
	</head>
	<body></body>
</html>`;
}

test( 'accepts the exact recruiter SEO and sharing contract', () => {
	const pageUrl = new URL( 'https://hperkins.blog/job-placement-digest/' );
	const metadata = verifyJobPlacementDigestMetadata( createValidDocument(), pageUrl );

	assert.equal( metadata.title, EXPECTED_TITLE );
	assert.equal( metadata.description, EXPECTED_DESCRIPTION );
	assert.equal( metadata.canonical, pageUrl.href );
	assert.equal( metadata.ogTitle, EXPECTED_TITLE );
	assert.equal( metadata.ogDescription, EXPECTED_DESCRIPTION );
	assert.equal( metadata.ogImage, 'https://hperkins.blog/social/job-placement-digest.png' );
} );

test( 'reports every actionable mismatch in one failure', () => {
	const html = createValidDocument()
		.replace( EXPECTED_TITLE.replace( '—', '&mdash;' ), 'Generic title' )
		.replace( `content="${ EXPECTED_DESCRIPTION.replace( '’', '&#8217;' ) }" name="description"`, 'content="Generic description" name="description"' )
		.replace( 'https://hperkins.blog/job-placement-digest/', 'https://hperkins.blog/wrong/' )
		.replace( '<meta content="https://hperkins.blog/social/job-placement-digest.png" property="og:image">', '' );

	assert.throws(
		() => verifyJobPlacementDigestMetadata(
			html,
			new URL( 'https://hperkins.blog/job-placement-digest/' )
		),
		( error ) => {
			assert.match( error.message, /document title mismatch/ );
			assert.match( error.message, /meta description mismatch/ );
			assert.match( error.message, /canonical URL mismatch/ );
			assert.match( error.message, /og:image: expected exactly one tag, found 0/ );
			return true;
		}
	);
} );

test( 'rejects duplicate metadata and a non-public Open Graph image URL', () => {
	const html = createValidDocument()
		.replace( '</head>', `<meta name="description" content="${ EXPECTED_DESCRIPTION }">
		<meta property="og:image" content="/relative-preview.png">
	</head>` );

	assert.throws(
		() => verifyJobPlacementDigestMetadata(
			html,
			new URL( 'https://hperkins.blog/job-placement-digest/' )
		),
		( error ) => {
			assert.match( error.message, /meta description: expected exactly one tag, found 2/ );
			assert.match( error.message, /og:image: expected exactly one tag, found 2/ );
			return true;
		}
	);
} );

test( 'rejects a relative Open Graph image URL', () => {
	const html = createValidDocument().replace(
		'https://hperkins.blog/social/job-placement-digest.png',
		'/relative-preview.png'
	);

	assert.throws(
		() => verifyJobPlacementDigestMetadata(
			html,
			new URL( 'https://hperkins.blog/job-placement-digest/' )
		),
		/og:image must be an absolute http\(s\) URL/
	);
} );

test( 'uses HPERKINS_ORIGIN as a base and supports an exact --url override', () => {
	assert.equal(
		getDigestPageUrl( [], { HPERKINS_ORIGIN: 'http://localhost:8882/wp/' } ).href,
		'http://localhost:8882/wp/job-placement-digest/'
	);
	assert.equal(
		getDigestPageUrl(
			[ '--url', 'http://localhost:8882/custom-digest/' ],
			{ HPERKINS_ORIGIN: 'https://ignored.example' }
		).href,
		'http://localhost:8882/custom-digest/'
	);
	assert.equal(
		getDigestPageUrl( [ '--url=https://preview.example/digest/' ], {} ).href,
		'https://preview.example/digest/'
	);
} );

test( 'rejects ambiguous, invalid, and non-web URL overrides', () => {
	assert.throws( () => getDigestPageUrl( [ '--url' ], {} ), /--url requires/ );
	assert.throws( () => getDigestPageUrl( [ '--url=mailto:test@example.com' ], {} ), /http\(s\)/ );
	assert.throws(
		() => getDigestPageUrl( [ '--url=https://one.example/', '--url=https://two.example/' ], {} ),
		/only be provided once/
	);
	assert.throws(
		() => getDigestPageUrl( [ '--url=https://preview.example/digest/?preview=true' ], {} ),
		/must not include a query string or fragment/
	);
	assert.throws( () => getDigestPageUrl( [ '--unknown' ], {} ), /Unknown argument/ );
} );
