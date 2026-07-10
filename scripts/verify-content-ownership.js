#!/usr/bin/env node

const { execFileSync } = require( 'node:child_process' );
const crypto = require( 'node:crypto' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );

const {
	WP_PATH,
	THEME_PATH,
	SNAPSHOT_DIR,
	PAGE_CONTRACTS,
	RETIRED_PAGE_PATHS,
	normalizeContent,
} = require( './lib/page-content-contract' );

function escapePhpString( value ) {
	return `'${ value.replace( /\\/g, '\\\\' ).replace( /'/g, "\\'" ) }'`;
}

function getTrackedPageTargetsPhp() {
	return PAGE_CONTRACTS.filter( ( contract ) => contract.pagePath )
		.map( ( contract ) => {
			const entries = [
				`'key' => ${ escapePhpString( contract.key ) }`,
				`'path' => ${ escapePhpString( contract.pagePath ) }`,
			];

			if ( contract.templateId ) {
				entries.push( `'template' => ${ escapePhpString( contract.templateId ) }` );
			}

			return `array( ${ entries.join( ', ' ) } )`;
		} )
		.join( ',\n\t\t\t' );
}

function getRetiredPageTargetsPhp() {
	return RETIRED_PAGE_PATHS.map( ( contract ) =>
		`array( 'key' => ${ escapePhpString( contract.key ) }, 'path' => ${ escapePhpString( contract.pagePath ) } )`
	).join( ',\n\t\t\t' );
}

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function runWpEval( code ) {
	return execFileSync( 'wp', [ `--path=${ WP_PATH }`, 'eval', code ], {
		encoding: 'utf8',
		stdio: [ 'ignore', 'pipe', 'pipe' ],
	} ).trim();
}

function readTemplate( relativePath ) {
	return fs.readFileSync( path.join( THEME_PATH, relativePath ), 'utf8' );
}

function getOwnershipState() {
	const trackedPageTargets = getTrackedPageTargetsPhp();
	const retiredPageTargets = getRetiredPageTargetsPhp();

	return JSON.parse(
		runWpEval(`
			$result = array(
				'frontPageMode' => get_option( 'show_on_front' ),
				'frontPageId' => (int) get_option( 'page_on_front' ),
				'frontPage' => null,
				'pages' => array(),
				'retiredPages' => array(),
			);

			$front_page = get_post( $result['frontPageId'] );
			$front_template = get_block_template( 'hperkins-tokens//front-page', 'wp_template' );
			$result['frontPage'] = array(
				'id' => $front_page ? (int) $front_page->ID : 0,
				'slug' => $front_page ? $front_page->post_name : null,
				'content' => $front_page ? (string) $front_page->post_content : '',
				'contentLength' => $front_page ? strlen( $front_page->post_content ) : 0,
				'templateSource' => $front_template ? $front_template->source : null,
				'templateId' => $front_template ? $front_template->id : null,
			);

			foreach ( array(
				${ trackedPageTargets }
			) as $target ) {
				$page = get_page_by_path( $target['path'], OBJECT, 'page' );
				$template = ! empty( $target['template'] )
					? get_block_template( 'hperkins-tokens//' . $target['template'], 'wp_template' )
					: null;

				$result['pages'][ $target['key'] ] = array(
					'path' => $target['path'],
					'id' => $page ? (int) $page->ID : 0,
					'content' => $page ? (string) $page->post_content : '',
					'contentLength' => $page ? strlen( $page->post_content ) : 0,
					'templateSource' => $template ? $template->source : null,
					'templateId' => $template ? $template->id : null,
				);
			}

			foreach ( array(
				${ retiredPageTargets }
			) as $target ) {
				$page = get_page_by_path( $target['path'], OBJECT, 'page' );
				$result['retiredPages'][ $target['key'] ] = array(
					'path' => $target['path'],
					'id' => $page ? (int) $page->ID : 0,
					'status' => $page ? $page->post_status : null,
				);
			}

			echo wp_json_encode( $result );
		` )
	);
}

function getPageRecord( state, contract ) {
	if ( contract.key === 'front-page' ) {
		return state.frontPage;
	}

	return state.pages[ contract.key ];
}

function getSha256( value ) {
	return crypto.createHash( 'sha256' ).update( value ).digest( 'hex' );
}

function verifySnapshot( contract, page ) {
	const snapshotPath = path.join( SNAPSHOT_DIR, contract.snapshotFile );
	assert(
		fs.existsSync( snapshotPath ),
		`Expected snapshot ${ path.relative( THEME_PATH, snapshotPath ) } for the ${ contract.label }. Run node scripts/export-page-snapshots.js.`
	);

	const snapshot = normalizeContent( fs.readFileSync( snapshotPath, 'utf8' ) );
	const liveContent = normalizeContent( page.content );

	assert(
		snapshot === liveContent,
		[
			`${ contract.label } no longer matches its versioned snapshot ${ path.relative( THEME_PATH, snapshotPath ) }.`,
			`live   sha256: ${ getSha256( liveContent ) }`,
			`stored sha256: ${ getSha256( snapshot ) }`,
			'If the DB body change is intentional, re-export with node scripts/export-page-snapshots.js.',
		].join( '\n' )
	);
}

function verifyTrackedMarkup( contract, page ) {
	const liveContent = normalizeContent( page.content );

	assert(
		! /<blockquote\b[^>]*>\s*<\/blockquote>/.test( liveContent ),
		`Expected the ${ contract.label } to avoid empty blockquote markup.`
	);

	if ( contract.key === 'front-page' ) {
		assert(
			! liveContent.includes( 'hp-wapuu-hero__figure' ) && ! liveContent.includes( 'hp-ring-card__figure' ),
			'Expected the front page DB body to avoid theme-owned hero/ring asset markup.'
		);
	}
}

function verifyPageOwnership( state, contract ) {
	const page = getPageRecord( state, contract );

	assert(
		page && page.id > 0,
		`Expected a live ${ contract.label } for ${ contract.templateId || contract.pagePath }.`
	);
	assert(
		page.contentLength > 0,
		`Expected the ${ contract.label } to keep visitor-facing body content in post_content.`
	);

	if ( contract.templateFile && contract.templateId ) {
		const template = readTemplate( contract.templateFile );

		assert(
			page.templateSource === 'theme',
			`Expected "${ contract.templateId }" to resolve from the theme, got ${ page.templateSource || 'none' }.`
		);
		assert(
			template.includes( '<!-- wp:post-content' ),
			`Expected ${ contract.templateFile } to render wp:post-content.`
		);
	}

	verifyTrackedMarkup( contract, page );
	verifySnapshot( contract, page );
}

function main() {
	const state = getOwnershipState();

	assert(
		state.frontPageMode === 'page',
		`Expected show_on_front=page, got ${ state.frontPageMode || 'none' }.`
	);

	for ( const contract of RETIRED_PAGE_PATHS ) {
		const page = state.retiredPages[ contract.key ];
		assert(
			page && page.id === 0,
			`Expected the retired ${ contract.label } at "${ contract.pagePath }" to be absent, found post ${ page?.id || 'unknown' } (${ page?.status || 'unknown status' }).`
		);
	}

	for ( const contract of PAGE_CONTRACTS ) {
		verifyPageOwnership( state, contract );
	}

	console.log( 'Content ownership verified.' );
	console.log(
		PAGE_CONTRACTS.map( ( contract ) => {
			const page = getPageRecord( state, contract );
			return `${ contract.key }:${ page.templateSource }:${ page.contentLength }:${ getSha256( normalizeContent( page.content ) ).slice( 0, 12 ) }`;
		} ).join( '\n' )
	);
}

try {
	main();
} catch ( error ) {
	console.error( error.message );
	process.exit( 1 );
}
