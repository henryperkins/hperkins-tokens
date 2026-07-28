#!/usr/bin/env node

const crypto = require( 'node:crypto' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );

const { normalizeContent } = require( './content-integrity' );
const { escapePhpString } = require( './wp-cli' );

const THEME_PATH = path.resolve( __dirname, '..', '..' );
const SNAPSHOT_DIR = path.join( THEME_PATH, 'content', 'page-snapshots' );

// Draft metadata drives the guarded local applicator; deployedIntegrity marks
// the routes served by inc/content-integrity.php and checked by
// scripts/verify-deployed-content-ownership.js, so no verifier keeps a second
// allowlist. About is deliberately applyByDefault:false — its candidate is
// selected only by an explicit --page=about — and updateExistingOnly:true, so
// local application refuses to create a page and touches only post_content.
const PAGE_CONTRACTS = [
	{
		key: 'front-page',
		label: 'front page',
		snapshotFile: 'front-page.html',
		templateId: 'front-page',
		templateFile: 'templates/front-page.html',
	},
	{
		key: 'about',
		label: 'about page',
		pagePath: 'about',
		snapshotFile: 'about.html',
		templateId: 'page-about',
		templateFile: 'templates/page-about.html',
		draft: {
			file: 'content/page-drafts/about.html',
			applyByDefault: false,
			updateExistingOnly: true,
		},
		pattern: {
			file: 'patterns/about-resume.php',
			role: 'thin-snapshot-adapter',
		},
		deployedIntegrity: true,
	},
	{
		key: 'work',
		label: 'work page',
		pagePath: 'work',
		snapshotFile: 'work.html',
		templateId: 'page-work',
		templateFile: 'templates/page-work.html',
	},
	{
		key: 'ai-enablement',
		label: 'AI Enablement page',
		pagePath: 'ai-enablement',
		snapshotFile: 'ai-enablement.html',
		templateId: 'page-ai-enablement',
		templateFile: 'templates/page-ai-enablement.html',
	},
	{
		key: 'job-placement-digest',
		label: 'Job Placement Digest page',
		pagePath: 'job-placement-digest',
		snapshotFile: 'job-placement-digest.html',
		templateId: 'page-job-placement-digest',
		templateFile: 'templates/page-job-placement-digest.html',
		draft: {
			file: 'content/page-drafts/job-placement-digest.html',
			title: 'Job Placement Digest',
			applyByDefault: true,
			updateExistingOnly: false,
		},
		deployedIntegrity: true,
	},
	{
		key: 'placement-method-evidence',
		label: 'Placement Method and Evidence page',
		pagePath: 'placement-method-and-evidence',
		snapshotFile: 'placement-method-evidence.html',
		templateId: 'page-placement-method-and-evidence',
		templateFile: 'templates/page-placement-method-and-evidence.html',
		draft: {
			file: 'content/page-drafts/placement-method-evidence.html',
			title: 'Placement Method and Evidence',
			legacyPath: 'placement-method-evidence',
			applyByDefault: true,
			updateExistingOnly: false,
		},
		deployedIntegrity: true,
	},
	{
		key: 'flavor-agent-demo',
		label: 'Flavor Agent demo page',
		pagePath: 'work/flavor-agent/demo',
		snapshotFile: 'work-flavor-agent-demo.html',
	},
];

const RETIRED_PAGE_PATHS = [
	{
		key: 'plato-artifacts',
		label: 'Plato Artifacts page',
		pagePath: 'plato-artifacts',
	},
];

function getTrackedPageTargetsPhp( { includeTemplate = false } = {} ) {
	return PAGE_CONTRACTS.filter( ( contract ) => contract.pagePath )
		.map( ( contract ) => {
			const entries = [
				`'key' => ${ escapePhpString( contract.key ) }`,
				`'path' => ${ escapePhpString( contract.pagePath ) }`,
			];

			if ( includeTemplate && contract.templateId ) {
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

function getPageRecord( state, contract ) {
	if ( contract.key === 'front-page' ) {
		return state.frontPage;
	}

	return state.pages[ contract.key ];
}

// Every --page surface either mutates the database or mints a committed
// mirror, and each one falls back to a broad default when no key is selected.
// A silently-ignored argument therefore turns a typo into a wider operation
// than the operator asked for: `--pages=about` selected nothing, fell back to
// the default, and wrote two unrelated pages. Reject anything unrecognised
// before selection resolves.
function assertKnownFlags( argv, knownFlags ) {
	for ( const argument of argv ) {
		if ( argument === '--page' || argument.startsWith( '--page=' ) || knownFlags.includes( argument ) ) {
			continue;
		}
		throw new Error(
			`Unknown option: ${ argument }. Accepted: --page=<key>, ${ knownFlags.join( ', ' ) }.`
		);
	}
}

// One selector implementation backs every explicit --page=<key> surface, so
// empty, malformed, unknown, duplicate, and wrong-kind keys all fail the same
// way before any WP-CLI process starts.
function resolveSelection( keys, { pool, kind } ) {
	const selected = [];
	const seen = new Set();
	for ( const key of keys ) {
		if ( typeof key !== 'string' || key.length === 0 ) {
			throw new Error(
				`Empty --page selector; use --page=<key> with one of: ${ pool.map( ( c ) => c.key ).join( ', ' ) }.`
			);
		}
		if ( ! /^[a-z0-9][a-z0-9-]*$/.test( key ) ) {
			throw new Error( `Malformed page selector: ${ JSON.stringify( key ) }.` );
		}
		if ( seen.has( key ) ) {
			throw new Error( `Duplicate page contract: ${ key }.` );
		}
		const contract = PAGE_CONTRACTS.find( ( candidate ) => candidate.key === key );
		if ( ! contract ) {
			throw new Error( `Unknown page contract: ${ key }.` );
		}
		if ( ! pool.includes( contract ) ) {
			throw new Error( `Page contract "${ key }" is not ${ kind }.` );
		}
		seen.add( key );
		selected.push( contract );
	}

	return selected;
}

function selectPageContracts( keys = [] ) {
	if ( keys.length === 0 ) {
		return PAGE_CONTRACTS;
	}

	return resolveSelection( keys, { pool: PAGE_CONTRACTS, kind: 'a tracked page' } );
}

// Local draft application: with no explicit keys this selects exactly the
// applyByDefault drafts (the two recruiter pages). An explicit selection is
// exactly the named drafts, in argument order — it never unions with the
// defaults, which is how --page=about stays an explicit-only operation.
function selectDraftContracts( keys = [] ) {
	const pool = PAGE_CONTRACTS.filter( ( contract ) => contract.draft );
	if ( keys.length === 0 ) {
		return pool.filter( ( contract ) => contract.draft.applyByDefault );
	}

	return resolveSelection( keys, { pool, kind: 'a reviewable draft' } );
}

function selectDeployedIntegrityContracts( keys = [] ) {
	const pool = PAGE_CONTRACTS.filter( ( contract ) => contract.deployedIntegrity );
	if ( keys.length === 0 ) {
		return pool;
	}

	return resolveSelection( keys, { pool, kind: 'a deployed-integrity page' } );
}

// Node-side preflight for the guarded applicator: resolve each draft inside
// the theme, read it, require a nonempty body, and hash the raw bytes. Only
// the relative path and the hash travel to WP-CLI; PHP re-reads the file and
// re-verifies the hash before mutating, closing the time-of-check/time-of-use
// gap without ever putting a ~40 KB body on the command line.
function prepareDraftPayloads( contracts, { themePath = THEME_PATH } = {} ) {
	return contracts.map( ( contract ) => {
		const relative = contract.draft.file;
		const absolute = path.resolve( themePath, relative );
		const containment = path.relative( themePath, absolute );
		if ( containment.startsWith( '..' ) || path.isAbsolute( containment ) ) {
			throw new Error( `Draft file escapes the theme root: ${ relative }.` );
		}

		const body = fs.readFileSync( absolute );
		if ( body.toString( 'utf8' ).trim() === '' ) {
			throw new Error( `Draft file is empty: ${ relative }.` );
		}

		return {
			key: contract.key,
			pagePath: contract.pagePath,
			legacyPath: contract.draft.legacyPath || '',
			title: contract.draft.title || '',
			updateExistingOnly: contract.draft.updateExistingOnly === true,
			file: relative.split( path.sep ).join( '/' ),
			sha256: crypto.createHash( 'sha256' ).update( body ).digest( 'hex' ),
			bytes: body.length,
		};
	} );
}

// The PHP evaluation embeds only bounded metadata (key, theme-relative path,
// expected SHA-256). PHP resolves and reads every body itself, verifies every
// hash, and only then begins the mutation loop, so a half-readable selection
// can never leave the site half-applied.
function buildApplyLocalDraftsPhp( payloads ) {
	const targets = payloads
		.map( ( payload ) => [
			`'key' => ${ escapePhpString( payload.key ) }`,
			`'path' => ${ escapePhpString( payload.pagePath ) }`,
			`'legacy_path' => ${ escapePhpString( payload.legacyPath ) }`,
			`'title' => ${ escapePhpString( payload.title ) }`,
			`'update_existing_only' => ${ payload.updateExistingOnly ? 'true' : 'false' }`,
			`'file' => ${ escapePhpString( payload.file ) }`,
			`'sha256' => ${ escapePhpString( payload.sha256 ) }`,
		].join( ', ' ) )
		.map( ( entry ) => `array( ${ entry } )` )
		.join( ',\n\t\t\t' );

	return `
		$host = strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) );
		$local_hosts = array( 'localhost', '127.0.0.1', '::1' );
		$is_local = in_array( $host, $local_hosts, true ) || str_ends_with( $host, '.local' );
		if ( ! $is_local ) {
			throw new RuntimeException( 'Refusing to apply review drafts to non-local host: ' . $host );
		}
		if ( 'hperkins-tokens' !== get_stylesheet() ) {
			throw new RuntimeException( 'Expected hperkins-tokens to be active, got: ' . get_stylesheet() );
		}

		$drafts = array(
			${ targets }
		);

		// Second read + hash verification: every selected body must re-read
		// clean and match the Node preflight hash before any page mutates.
		foreach ( $drafts as $index => $draft ) {
			$file = get_theme_file_path( $draft['file'] );
			$content = file_get_contents( $file );
			if ( false === $content || '' === trim( $content ) ) {
				throw new RuntimeException( 'Missing reviewed draft: ' . $file );
			}
			if ( hash( 'sha256', $content ) !== $draft['sha256'] ) {
				throw new RuntimeException( 'Draft changed since preflight: ' . $file );
			}
			$drafts[ $index ]['content'] = $content;
		}

		$result = array();

		foreach ( $drafts as $draft ) {
			$content = $draft['content'];

			$page = get_page_by_path( $draft['path'], OBJECT, 'page' );
			if ( ! $page && ! empty( $draft['legacy_path'] ) ) {
				$page = get_page_by_path( $draft['legacy_path'], OBJECT, 'page' );
			}

			if ( $draft['update_existing_only'] ) {
				if ( ! $page ) {
					throw new RuntimeException( 'Refusing to create a page; expected an existing page at: ' . $draft['path'] );
				}
				// Update only post_content — title, slug, status, parent, and
				// template assignment stay exactly as the live page has them.
				$post_id = wp_update_post( array(
					'ID' => $page->ID,
					'post_content' => wp_slash( $content ),
				), true );
			} else {
				$postarr = array(
					'post_type' => 'page',
					'post_status' => 'publish',
					'post_name' => $draft['path'],
					'post_title' => $draft['title'],
					'post_content' => wp_slash( $content ),
				);
				if ( $page ) {
					$postarr['ID'] = $page->ID;
				}
				$post_id = wp_insert_post( $postarr, true );
			}

			if ( is_wp_error( $post_id ) ) {
				throw new RuntimeException( $post_id->get_error_message() );
			}
			$result[ $draft['path'] ] = array(
				'id' => $post_id,
				'url' => get_permalink( $post_id ),
				'bytes' => strlen( $content ),
			);
		}

		echo wp_json_encode( $result );
	`;
}

module.exports = {
	THEME_PATH,
	SNAPSHOT_DIR,
	PAGE_CONTRACTS,
	RETIRED_PAGE_PATHS,
	assertKnownFlags,
	buildApplyLocalDraftsPhp,
	getPageRecord,
	getRetiredPageTargetsPhp,
	getTrackedPageTargetsPhp,
	normalizeContent,
	prepareDraftPayloads,
	selectDeployedIntegrityContracts,
	selectDraftContracts,
	selectPageContracts,
};
