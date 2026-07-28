#!/usr/bin/env node

const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { runWp, runWpEval } = require( './lib/wp-cli' );
const { getSha256 } = require( './lib/content-integrity' );
const { assertMatchingSiteUrl, getOrigin } = require( './lib/site-url' );

const {
	SNAPSHOT_DIR,
	THEME_PATH,
	assertKnownFlags,
	getPageRecord,
	getTrackedPageTargetsPhp,
	normalizeContent,
	selectPageContracts,
} = require( './lib/page-content-contract' );

const EXPECT_DRAFT = process.argv.includes( '--expect-draft' );
const CHECK_ONLY = process.argv.includes( '--check' );

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

// Atomic snapshot write: create a sibling temporary file with exclusive
// creation, re-read and hash it, and rename over the snapshot only once the
// hash matches what was intended. Every failure path removes the temporary
// file, so no partial write can ever masquerade as an accepted snapshot.
function writeSnapshotAtomically( snapshotPath, content ) {
	const temporaryPath = `${ snapshotPath }.tmp-${ process.pid }`;
	// A killed earlier run can orphan our pid-suffixed temp file; clear it so
	// 'wx' exclusivity only ever refuses files owned by a concurrent writer.
	fs.rmSync( temporaryPath, { force: true } );
	fs.writeFileSync( temporaryPath, content, { encoding: 'utf8', flag: 'wx' } );
	try {
		const written = fs.readFileSync( temporaryPath, 'utf8' );
		if ( getSha256( written ) !== getSha256( content ) ) {
			throw new Error( `Temporary snapshot ${ temporaryPath } does not hash to the exported content.` );
		}
		fs.renameSync( temporaryPath, snapshotPath );
	} catch ( error ) {
		fs.rmSync( temporaryPath, { force: true } );
		throw error;
	}
}

function main() {
	// Selector validation happens before any WordPress query.
	assertKnownFlags( process.argv.slice( 2 ), [ '--expect-draft', '--check' ] );
	const requestedKeys = process.argv
		.filter( ( argument ) => argument === '--page' || argument.startsWith( '--page=' ) )
		.map( ( argument ) => argument.slice( '--page='.length ) );
	const contracts = selectPageContracts( requestedKeys );

	if ( EXPECT_DRAFT ) {
		for ( const contract of contracts ) {
			if ( ! contract.draft ) {
				throw new Error( `--expect-draft requires a draft contract; ${ contract.key } has none.` );
			}
		}
	}

	// These files are the accepted mirror the deployed integrity gate compares
	// production against, so they may only ever be minted from the install
	// HPERKINS_ORIGIN names — the same identity guard the draft applicator
	// runs. Without it a bare run against a drifted dev install silently
	// rewrites every committed snapshot.
	assertMatchingSiteUrl( getOrigin(), runWp( [ 'option', 'get', 'home' ] ).trim() );

	const state = getLiveState();

	if ( state.frontPageMode !== 'page' ) {
		throw new Error( `Expected show_on_front=page, got ${ state.frontPageMode || 'none' }.` );
	}

	fs.mkdirSync( SNAPSHOT_DIR, { recursive: true } );

	for ( const contract of contracts ) {
		const record = getPageRecord( state, contract );
		if ( ! record || record.id <= 0 ) {
			throw new Error( `Expected a live ${ contract.label } before exporting snapshots.` );
		}

		const database = normalizeContent( record.content );
		const databaseHash = getSha256( database );
		const snapshotPath = path.join( SNAPSHOT_DIR, contract.snapshotFile );

		// Pre-export parity: the exporter refuses to mint an accepted snapshot
		// from a database body that does not equal the reviewed candidate.
		if ( EXPECT_DRAFT ) {
			const draftPath = path.join( THEME_PATH, contract.draft.file );
			const draft = normalizeContent( fs.readFileSync( draftPath, 'utf8' ) );
			const draftHash = getSha256( draft );
			console.log( `${ contract.key } draft    sha256: ${ draftHash }` );
			console.log( `${ contract.key } database sha256: ${ databaseHash }` );
			if ( draft !== database ) {
				throw new Error(
					`${ contract.key } database body does not match ${ contract.draft.file }; refusing to export. Apply the reviewed draft first.`
				);
			}
		} else {
			console.log( `${ contract.key } database sha256: ${ databaseHash }` );
		}

		const snapshotContent = `${ database }\n`;
		console.log( `${ contract.key } snapshot sha256: ${ getSha256( snapshotContent ) }` );

		if ( CHECK_ONLY ) {
			console.log( `checked ${ path.relative( process.cwd(), snapshotPath ) } (${ record.id }); nothing written` );
			continue;
		}

		writeSnapshotAtomically( snapshotPath, snapshotContent );
		console.log( `wrote ${ path.relative( process.cwd(), snapshotPath ) } (${ record.id })` );
	}
}

try {
	main();
} catch ( error ) {
	console.error( error.message );
	process.exit( 1 );
}
