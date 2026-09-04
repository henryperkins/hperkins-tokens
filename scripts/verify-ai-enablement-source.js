#!/usr/bin/env node

/**
 * AI Enablement source contract.
 *
 * /ai-enablement/ is a database-owned page body (page 175);
 * content/page-snapshots/ai-enablement.html is its export-only mirror.
 * patterns/ai-enablement.php used to be a third, hand-maintained copy of the
 * essay, and it drifted: the published body was re-voiced in the editor, the
 * snapshot captured every pass, and the pattern kept the pre-edit draft, so
 * re-inserting it on a live site would have silently reverted the route to an
 * older essay. Nothing caught that, because verify-content-ownership.js never
 * opens patterns/*.php.
 *
 * The pattern is now a thin adapter over the accepted snapshot (the
 * about-resume model). This verifier pins the contract from three sides:
 *
 *   1. the page contract names the adapter and its role, and the adapter's
 *      source keeps the policy a string check can see: it reads the accepted
 *      snapshot, derives URLs through hperkins_tokens_asset_url() and
 *      esc_url(), never reads a draft, and carries no essay markup;
 *   2. the adapter is EXECUTED, through the PHP CLI under a minimal WordPress
 *      shim, and must emit the snapshot byte for byte with only the six
 *      theme-hosted Three Rings image URLs re-derived — on the accepted body
 *      and on a body that round-tripped through the inserter (another host,
 *      no ?v=) — and must emit nothing for a missing, empty, unmatched, or
 *      duplicated snapshot, or one whose asset survives only in a non-native
 *      attribute such as a lazy-loader's data-src. A gate that only inspected the source could stay
 *      green while a seventh asset in the PHP list, or a matcher edit, made
 *      the adapter fail closed and register an empty pattern; running it is
 *      the only proof that it does not;
 *   3. the accepted snapshot carries each of those six assets exactly once as
 *      a native src/srcset the adapter matches, and no other theme-hosted URL, so a
 *      re-export cannot ship a pinned production host the adapter leaves
 *      alone.
 *
 * Needs a PHP CLI (`php` on PATH, or HPERKINS_PHP_BIN); no Chrome, no
 * WordPress install.
 *
 * Usage: node scripts/verify-ai-enablement-source.js
 */

const { spawnSync } = require( 'node:child_process' );
const fs = require( 'node:fs' );
const os = require( 'node:os' );
const path = require( 'node:path' );

const { createLineDiff } = require( './lib/content-integrity' );
const { PAGE_CONTRACTS } = require( './lib/page-content-contract' );

const themeRoot = path.join( __dirname, '..' );
const PATTERN_FILE = 'patterns/ai-enablement.php';
const SNAPSHOT_FILE = 'content/page-snapshots/ai-enablement.html';
const PHP_BIN = process.env.HPERKINS_PHP_BIN || 'php';

// Deterministic stand-in for hperkins_tokens_asset_url() inside the shim. The
// expected output is computed here from the same base, so the adapter's own
// asset list and matcher are proven against this file's rather than trusted.
const SHIM_ASSET_BASE = 'https://shim.invalid/wp-content/themes/hperkins-tokens/';
const SHIM_ASSET_VERSION = '1';

// The six theme-hosted Three Rings assets the inlined ring cards reference: a
// WebP <source> and a PNG <img> fallback per Age. The adapter names the same
// six; the execution check below fails if the two lists disagree.
const RING_CARD_ASSETS = [
	'assets/img/imagery/rivendell-second-age.webp',
	'assets/img/imagery/rivendell-second-age.png',
	'assets/img/imagery/rivendell-third-age.webp',
	'assets/img/imagery/rivendell-third-age.png',
	'assets/img/imagery/rivendell-fourth-age.webp',
	'assets/img/imagery/rivendell-fourth-age.png',
];

// Executes the adapter outside WordPress. The three WordPress-provided
// functions it calls are stubbed deterministically; each scenario includes
// the file once and captures what it echoed. Notices go to stderr, which the
// runner treats as a failure, so a warning inside the adapter cannot hide in
// the captured output.
const SHIM_HARNESS = `<?php
error_reporting( E_ALL );
ini_set( 'display_errors', 'stderr' );

$config = json_decode( file_get_contents( $argv[1] ), true );
$GLOBALS['hperkins_shim_theme_root']    = $config['themeRoot'];
$GLOBALS['hperkins_shim_asset_base']    = $config['assetBase'];
$GLOBALS['hperkins_shim_asset_version'] = $config['assetVersion'];
$GLOBALS['hperkins_shim_snapshot']      = null;

function get_theme_file_path( $file ) {
	if ( 'content/page-snapshots/ai-enablement.html' === $file && null !== $GLOBALS['hperkins_shim_snapshot'] ) {
		return $GLOBALS['hperkins_shim_snapshot'];
	}
	return $GLOBALS['hperkins_shim_theme_root'] . '/' . ltrim( $file, '/' );
}

function esc_url( $url ) {
	return $url;
}

function hperkins_tokens_asset_url( $relative_path ) {
	return $GLOBALS['hperkins_shim_asset_base'] . ltrim( $relative_path, '/' ) . '?v=' . $GLOBALS['hperkins_shim_asset_version'];
}

$results = array();
foreach ( $config['scenarios'] as $scenario ) {
	$GLOBALS['hperkins_shim_snapshot'] = $scenario['snapshot'];
	ob_start();
	include $config['pattern'];
	$output = (string) ob_get_clean();
	$results[ $scenario['name'] ] = array(
		'bytes'  => strlen( $output ),
		'output' => base64_encode( $output ),
	);
}
echo json_encode( $results );
`;

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function read( relative ) {
	return fs.readFileSync( path.join( themeRoot, relative ), 'utf8' );
}

function escapeRegExp( value ) {
	return value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

// Mirrors the PHP matcher: a native src or srcset attribute (whitespace
// before it, so data-src and other prefixed attributes never count), an
// optional scheme and host, the fixed theme path, and an optional ?v= cache
// key. Used for the snapshot preconditions and to compute the expected
// output; the execution check is what proves the PHP matcher agrees with it.
function assetMatcher( relative ) {
	return new RegExp(
		`(?<=\\s)(src|srcset)="(?:https?://[^"/]+)?/wp-content/themes/hperkins-tokens/${ escapeRegExp( relative ) }(?:\\?v=\\d+)?"`,
		'g'
	);
}

function rewriteAssetUrls( snapshot, toUrl ) {
	let output = snapshot;
	for ( const relative of RING_CARD_ASSETS ) {
		output = output.replace( assetMatcher( relative ), ( match, attribute ) => `${ attribute }="${ toUrl( relative ) }"` );
	}
	return output;
}

function verifyContractMetadata() {
	const contract = PAGE_CONTRACTS.find( ( candidate ) => candidate.key === 'ai-enablement' );
	assert( contract, 'Page contracts must track AI Enablement.' );
	assert(
		contract.pagePath === 'ai-enablement' && contract.snapshotFile === 'ai-enablement.html',
		'The AI Enablement contract must keep the ai-enablement page path and snapshot.'
	);
	assert(
		contract.pattern?.file === PATTERN_FILE && contract.pattern.role === 'thin-snapshot-adapter',
		`The AI Enablement contract must name ${ PATTERN_FILE } as a thin-snapshot-adapter.`
	);
}

function verifyPatternSourcePolicy( source ) {
	const headerEnd = source.indexOf( '*/' );
	assert( headerEnd !== -1, `${ PATTERN_FILE } has no pattern header block.` );
	const header = source.slice( 0, headerEnd );
	for ( const required of [ 'Slug: hperkins-tokens/ai-enablement', 'Categories: hperkins' ] ) {
		assert( header.includes( required ), `${ PATTERN_FILE } header must keep: ${ required }` );
	}

	for ( const required of [
		`get_theme_file_path( '${ SNAPSHOT_FILE }' )`,
		'hperkins_tokens_asset_url(',
		'esc_url(',
	] ) {
		assert( source.includes( required ), `${ PATTERN_FILE } adapter is missing: ${ required }` );
	}
	assert(
		! source.includes( 'content/page-drafts/' ),
		'The adapter must never read a work-in-progress draft.'
	);
	for ( const forbidden of [ '<!-- wp:', '<h1', '<h2', 'hp-page-hero', 'hp-aie__', 'hp-ring-card', 'hp-artifact' ] ) {
		assert( ! source.includes( forbidden ), `${ PATTERN_FILE } must not carry essay markup (${ forbidden }).` );
	}
}

function verifySnapshotPreconditions( snapshot ) {
	assert( snapshot.trim() !== '', `${ SNAPSHOT_FILE } is empty; the adapter would fail closed.` );

	// An asset that survives only in a lazy-loader's data-src (or any other
	// prefixed attribute) is not one a browser loads, so it must not count
	// toward the exactly-once contract on either side of the gate.
	const nonNative = `<img data-src="https://hperkins.blog/wp-content/themes/hperkins-tokens/${ RING_CARD_ASSETS[ 0 ] }?v=1" alt="" />`;
	assert(
		! assetMatcher( RING_CARD_ASSETS[ 0 ] ).test( nonNative ),
		'assetMatcher must reject non-native source attributes such as data-src.'
	);

	for ( const relative of RING_CARD_ASSETS ) {
		const matches = snapshot.match( assetMatcher( relative ) ) || [];
		assert(
			matches.length === 1,
			`${ SNAPSHOT_FILE } must reference ${ relative } exactly once as a src/srcset the adapter can re-derive; found ${ matches.length }. ` +
				`A mismatch makes ${ PATTERN_FILE } fail closed and register an empty pattern.`
		);
	}

	// The adapter rewrites only those six. Any other theme-hosted URL would
	// ship pinned to the exporting site's host and cache key, so there must be
	// none: extend the adapter's asset list and RING_CARD_ASSETS together.
	const themeUrls = snapshot.match( /(?:https?:\/\/[^"\s/]+)?\/wp-content\/themes\/[^"\s]*/g ) || [];
	assert(
		themeUrls.length === RING_CARD_ASSETS.length,
		`${ SNAPSHOT_FILE } carries ${ themeUrls.length } theme-hosted URLs but the adapter re-derives ${ RING_CARD_ASSETS.length }.`
	);
}

function runAdapter( workDir, scenarios ) {
	const harnessPath = path.join( workDir, 'harness.php' );
	const configPath = path.join( workDir, 'config.json' );
	fs.writeFileSync( harnessPath, SHIM_HARNESS );
	fs.writeFileSync( configPath, JSON.stringify( {
		themeRoot,
		pattern: path.join( themeRoot, PATTERN_FILE ),
		assetBase: SHIM_ASSET_BASE,
		assetVersion: SHIM_ASSET_VERSION,
		scenarios: scenarios.map( ( scenario ) => ( { name: scenario.name, snapshot: scenario.snapshot } ) ),
	} ) );

	const result = spawnSync( PHP_BIN, [ harnessPath, configPath ], {
		encoding: 'utf8',
		maxBuffer: 16 * 1024 * 1024,
	} );
	if ( result.error ) {
		throw new Error(
			`Could not run ${ PHP_BIN } (${ result.error.code || result.error.message }). ` +
				'The adapter contract executes patterns/ai-enablement.php and needs a PHP CLI: install one or set HPERKINS_PHP_BIN.'
		);
	}
	assert(
		result.status === 0 && result.stderr.trim() === '',
		`${ PHP_BIN } reported a problem while executing ${ PATTERN_FILE } (exit ${ result.status }):\n${ ( result.stderr || result.stdout ).trim() }`
	);

	let parsed;
	try {
		parsed = JSON.parse( result.stdout );
	} catch ( error ) {
		throw new Error( `The adapter harness produced no readable result: ${ result.stdout.slice( 0, 400 ) }` );
	}
	return Object.fromEntries( Object.entries( parsed ).map( ( [ name, entry ] ) => [
		name,
		{ bytes: entry.bytes, output: Buffer.from( entry.output, 'base64' ).toString( 'utf8' ) },
	] ) );
}

function verifyAdapterBehaviour( snapshot ) {
	const expected = rewriteAssetUrls( snapshot, ( relative ) => `${ SHIM_ASSET_BASE }${ relative }?v=${ SHIM_ASSET_VERSION }` );
	assert( expected !== snapshot, `${ SNAPSHOT_FILE } yielded no asset URL to re-derive; the expected adapter output could not be built.` );

	// A body that round-tripped through the inserter carries the inserting
	// site's host and no ?v=; the adapter must still find every asset.
	const roundTripped = rewriteAssetUrls( snapshot, ( relative ) => `http://localhost:8881/wp-content/themes/hperkins-tokens/${ relative }` );
	assert( roundTripped !== snapshot, 'The round-tripped variant did not apply.' );
	const unmatched = snapshot.replace( 'rivendell-third-age.png', 'rivendell-third-age.jpg' );
	assert( unmatched !== snapshot, 'The unmatched-asset variant did not apply.' );
	const duplicated = `${ snapshot }\n<!-- wp:html -->\n<img src="https://hperkins.blog/wp-content/themes/hperkins-tokens/${ RING_CARD_ASSETS[ 1 ] }?v=1" alt="" />\n<!-- /wp:html -->`;
	// The third-age PNG keeps its URL but only in data-src: a non-native
	// attribute must not be counted as the asset's one occurrence.
	const nonNative = snapshot.replace( assetMatcher( RING_CARD_ASSETS[ 3 ] ), ( match ) => `data-${ match }` );
	assert( nonNative !== snapshot, 'The non-native-attribute variant did not apply.' );

	const workDir = fs.mkdtempSync( path.join( os.tmpdir(), 'hperkins-aie-' ) );
	try {
		const variant = ( name, contents ) => {
			const file = path.join( workDir, `${ name }.html` );
			fs.writeFileSync( file, contents );
			return file;
		};
		const scenarios = [
			{ name: 'accepted', snapshot: null, expect: expected, describe: 'the accepted snapshot' },
			{ name: 'round-tripped', snapshot: variant( 'round-tripped', roundTripped ), expect: expected, describe: 'a round-tripped snapshot (another host, no ?v=)' },
			{ name: 'missing', snapshot: path.join( workDir, 'missing.html' ), expect: '', describe: 'missing' },
			{ name: 'empty', snapshot: variant( 'empty', '  \n' ), expect: '', describe: 'empty' },
			{ name: 'unmatched', snapshot: variant( 'unmatched', unmatched ), expect: '', describe: 'missing one of the six assets' },
			{ name: 'duplicated', snapshot: variant( 'duplicated', duplicated ), expect: '', describe: 'carrying one of the six assets twice' },
			{ name: 'non-native', snapshot: variant( 'non-native', nonNative ), expect: '', describe: 'carrying one of the six assets only in a non-native attribute (data-src)' },
		];

		const results = runAdapter( workDir, scenarios );

		for ( const scenario of scenarios ) {
			const result = results[ scenario.name ];
			assert( result, `The adapter harness returned no result for the ${ scenario.name } scenario.` );

			if ( scenario.expect === '' ) {
				assert(
					result.bytes === 0,
					`${ PATTERN_FILE } must emit nothing when the snapshot is ${ scenario.describe }; it emitted ${ result.bytes } bytes.`
				);
				continue;
			}

			if ( result.output !== scenario.expect ) {
				const detail = result.bytes === 0
					? 'It emitted nothing: the inserter would register an empty pattern. Check the asset list and matcher in the adapter against RING_CARD_ASSETS here.'
					: createLineDiff( result.output, scenario.expect, { actualLabel: 'adapter output', expectedLabel: 'expected' } )
						.split( '\n' )
						.slice( 0, 14 )
						.join( '\n' );
				throw new Error(
					`${ PATTERN_FILE } does not emit ${ scenario.describe } with only the six asset URLs re-derived (${ result.bytes } bytes).\n${ detail }`
				);
			}
		}
	} finally {
		fs.rmSync( workDir, { recursive: true, force: true } );
	}
}

function main() {
	verifyContractMetadata();
	verifyPatternSourcePolicy( read( PATTERN_FILE ) );
	const snapshot = read( SNAPSHOT_FILE );
	verifySnapshotPreconditions( snapshot );
	verifyAdapterBehaviour( snapshot );
	console.log(
		`AI Enablement source contract verified: ${ PATTERN_FILE } executed under the shim emits ${ SNAPSHOT_FILE } ` +
			`with only the ${ RING_CARD_ASSETS.length } asset URLs re-derived, and emits nothing for a missing, empty, unmatched, duplicated, or non-native-attribute snapshot.`
	);
}

try {
	main();
} catch ( error ) {
	console.error( error.message );
	process.exit( 1 );
}
