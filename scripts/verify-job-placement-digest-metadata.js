#!/usr/bin/env node

const {
	getDigestPageUrl,
	verifyJobPlacementDigestMetadata,
} = require( './lib/job-placement-metadata-contract' );

async function main() {
	const pageUrl = getDigestPageUrl();
	const requestUrl = new URL( pageUrl );
	requestUrl.searchParams.set( 'hp_metadata_check', Date.now().toString() );

	const response = await fetch( requestUrl, {
		cache: 'no-store',
		headers: {
			accept: 'text/html',
			'cache-control': 'no-cache',
		},
		signal: AbortSignal.timeout( 20000 ),
	} );

	if ( ! response.ok ) {
		throw new Error( `Job Placement Digest returned HTTP ${ response.status }: ${ requestUrl.href }` );
	}

	const contentType = response.headers.get( 'content-type' ) || '';
	if ( ! contentType.toLowerCase().includes( 'text/html' ) ) {
		throw new Error( `Job Placement Digest returned ${ contentType || 'no Content-Type' } instead of text/html: ${ requestUrl.href }` );
	}

	const metadata = verifyJobPlacementDigestMetadata( await response.text(), pageUrl );
	console.log( `Job Placement Digest SEO/share metadata verified: ${ pageUrl.href }` );
	console.log( `title:       ${ metadata.title }` );
	console.log( `description: ${ metadata.description }` );
	console.log( `canonical:   ${ metadata.canonical }` );
	console.log( `og:image:    ${ metadata.ogImage }` );
}

main().catch( ( error ) => {
	console.error( error.message );
	process.exitCode = 1;
} );
