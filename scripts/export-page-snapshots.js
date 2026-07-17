#!/usr/bin/env node

const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { getWordPressPath, runWp } = require( './lib/wp-cli' );

const {
	SNAPSHOT_DIR,
	PAGE_CONTRACTS,
	normalizeContent,
} = require( './lib/page-content-contract' );

const WP_PATH = getWordPressPath();

function escapePhpString( value ) {
	return `'${ value.replace( /\\/g, '\\\\' ).replace( /'/g, "\\'" ) }'`;
}

function getTrackedPageTargetsPhp() {
	return PAGE_CONTRACTS.filter( ( contract ) => contract.pagePath )
		.map(
			( contract ) =>
				`array( 'key' => ${ escapePhpString( contract.key ) }, 'path' => ${ escapePhpString( contract.pagePath ) } )`
		)
		.join( ',\n\t\t\t\t' );
}

function runWpEval( code ) {
	return runWp( [ `--path=${ WP_PATH }`, 'eval', code ], {
		encoding: 'utf8',
		stdio: [ 'ignore', 'pipe', 'pipe' ],
	} ).trim();
}

function getLiveState() {
	const trackedPageTargets = getTrackedPageTargetsPhp();

	return JSON.parse(
		runWpEval( `
			$result = array(
				'frontPageMode' => get_option( 'show_on_front' ),
				'frontPageId' => (int) get_option( 'page_on_front' ),
				'frontPage' => null,
				'pages' => array(),
			);

			$front_page = get_post( $result['frontPageId'] );
			$result['frontPage'] = array(
				'id' => $front_page ? (int) $front_page->ID : 0,
				'slug' => $front_page ? $front_page->post_name : null,
				'content' => $front_page ? (string) $front_page->post_content : '',
			);

			foreach ( array(
				${ trackedPageTargets }
			) as $target ) {
				$page = get_page_by_path( $target['path'], OBJECT, 'page' );
				$result['pages'][ $target['key'] ] = array(
					'id' => $page ? (int) $page->ID : 0,
					'path' => $target['path'],
					'content' => $page ? (string) $page->post_content : '',
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

function main() {
	const state = getLiveState();

	if ( state.frontPageMode !== 'page' ) {
		throw new Error( `Expected show_on_front=page, got ${ state.frontPageMode || 'none' }.` );
	}

	fs.mkdirSync( SNAPSHOT_DIR, { recursive: true } );

	for ( const contract of PAGE_CONTRACTS ) {
		const record = getPageRecord( state, contract );
		if ( ! record || record.id <= 0 ) {
			throw new Error( `Expected a live ${ contract.label } before exporting snapshots.` );
		}

		const snapshotPath = path.join( SNAPSHOT_DIR, contract.snapshotFile );
		fs.writeFileSync( snapshotPath, `${ normalizeContent( record.content ) }\n`, 'utf8' );
		console.log( `wrote ${ path.relative( process.cwd(), snapshotPath ) } (${ record.id })` );
	}
}

try {
	main();
} catch ( error ) {
	console.error( error.message );
	process.exit( 1 );
}
