#!/usr/bin/env node
/**
 * Regression checks for the public subscribe endpoint.
 *
 * The probes are intentionally non-mutating: the POST uses an invalid email and
 * no nonce, so a correctly guarded handler should reject it before validation or
 * storage.
 */
const { execFileSync } = require( 'node:child_process' );
const { readFileSync } = require( 'node:fs' );
const path = require( 'node:path' );
const { assertMatchingSiteUrl } = require( './lib/site-url' );
const { runWp, tryGetWordPressPath } = require( './lib/wp-cli' );

const ORIGIN = process.env.HPERKINS_ORIGIN || 'https://hperkins.blog';
const CONTACT_URL = new URL( '/contact/', ORIGIN );
const ENDPOINT_URL = new URL( '/wp-admin/admin-post.php', ORIGIN );
const THEME_PATH = path.join( __dirname, '..' );

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

async function main() {
	const subscribePattern = readFileSync( `${ THEME_PATH }/patterns/imladris-subscribe.php`, 'utf8' );
	assert(
		! subscribePattern.includes( 'already-requested' ),
		'subscribe pattern still contains the unreachable already-requested status branch.'
	);

	const styleCss = readFileSync( `${ THEME_PATH }/style.css`, 'utf8' );
	assert(
		! /\.hp-proof-product\b/.test( styleCss ),
		'style.css still contains the legacy .hp-proof-product selector.'
	);

	const ignoredDocs = execFileSync(
		'git',
		[
			'check-ignore',
			'-v',
			'docs/howhperkins.md',
			'docs/howhperkinswasbuilt.html',
			'docs/imladris.html',
		],
		{ cwd: THEME_PATH, encoding: 'utf8' }
	);
	for ( const docPath of [ 'docs/howhperkins.md', 'docs/howhperkinswasbuilt.html', 'docs/imladris.html' ] ) {
		assert( ignoredDocs.includes( docPath ), `${ docPath } is not gitignored.` );
	}

	const contactResponse = await fetch( CONTACT_URL );
	assert( contactResponse.ok, `contact page returned HTTP ${ contactResponse.status }.` );

	const contactHtml = await contactResponse.text();
	assert(
		/name="hperkins_tokens_subscribe_nonce"\s+value="[^"]+"/.test( contactHtml ),
		'subscribe form is missing the hperkins_tokens_subscribe_nonce field.'
	);
	assert(
		/name="action"\s+value="hperkins_tokens_subscribe"/.test( contactHtml ),
		'subscribe form is missing the hperkins_tokens_subscribe action field.'
	);

	const body = new URLSearchParams();
	body.set( 'action', 'hperkins_tokens_subscribe' );
	body.set( 'email', 'not-an-email' );

	const response = await fetch( ENDPOINT_URL, {
		method: 'POST',
		redirect: 'manual',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			referer: CONTACT_URL.href,
		},
		body,
	} );

	const location = response.headers.get( 'location' ) || '';
	assert( response.status === 303, `no-nonce subscribe POST returned HTTP ${ response.status }, expected 303.` );
	assert(
		location.includes( 'hperkins_subscribe=invalid-request' ),
		`no-nonce subscribe POST redirected to "${ location }", expected invalid-request.`
	);
	assert(
		! location.includes( 'invalid-email' ) && ! location.includes( 'already-requested' ) && ! location.includes( 'success' ),
		`no-nonce subscribe POST reached business validation/status instead of failing request verification: "${ location }".`
	);

	// The runtime half mutates (then restores) options in the selected WP install.
	// Requiring an explicit path is the opt-in; matching its home URL prevents
	// an HTTP probe for one site from mutating another site's database.
	let runtimeCheck = 'runtime checks skipped (set HPERKINS_WP_PATH to opt in with a matching local site)';
	if ( tryGetWordPressPath() ) {
		const wpHomeUrl = runWp( [ 'option', 'get', 'home' ] ).trim();
		assertMatchingSiteUrl( ORIGIN, wpHomeUrl );

		runtimeCheck = runWp(
			[
			`--url=${ ORIGIN }`,
			'eval',
			`
			$option_name = 'hperkins_tokens_subscribe_requests';
			$original_exists = false !== get_option( $option_name, false );
			$original_value = get_option( $option_name, array() );

			$assert = static function ( $condition, $message ) {
				if ( ! $condition ) {
					throw new RuntimeException( $message );
				}
			};

			try {
				update_option(
					$option_name,
					array(
						array(
							'email'        => 'older@example.com',
							'source'       => 'https://hperkins.blog/contact/',
							'submitted_at' => '2026-06-22 00:00:00',
						),
						array(
							'email'        => 'kept@example.com',
							'source'       => 'https://hperkins.blog/contact/',
							'submitted_at' => '2026-06-22 00:01:00',
						),
					)
				);

				add_filter( 'hperkins_tokens_subscribe_max_requests', static fn() => 2 );
				$store_status = hperkins_tokens_store_subscribe_request( 'new@example.com', 'https://hperkins.blog/contact/' );
				$requests = get_option( $option_name, array() );
				$assert( 'stored' === $store_status, 'bounded storage did not return stored.' );
				$assert( 2 === count( $requests ), 'bounded storage did not cap the option row to 2 entries.' );
				$assert( 'kept@example.com' === $requests[0]['email'], 'bounded storage did not discard the oldest entry.' );
				$assert( 'new@example.com' === $requests[1]['email'], 'bounded storage did not append the new entry.' );
				$assert( 'duplicate' === hperkins_tokens_store_subscribe_request( 'NEW@example.com', 'https://hperkins.blog/contact/' ), 'dedupe did not catch a case-insensitive duplicate.' );
				remove_all_filters( 'hperkins_tokens_subscribe_max_requests' );

				$_SERVER['REMOTE_ADDR'] = '203.0.113.44';
				$key = hperkins_tokens_get_subscribe_rate_key();
				delete_transient( $key );
				add_filter( 'hperkins_tokens_subscribe_rate_limit', static fn() => 2 );
				add_filter( 'hperkins_tokens_subscribe_rate_window', static fn() => MINUTE_IN_SECONDS );
					$assert( hperkins_tokens_check_subscribe_rate_limit(), 'rate limit rejected the first attempt.' );
					$assert( hperkins_tokens_check_subscribe_rate_limit(), 'rate limit rejected the second attempt.' );
					$assert( ! hperkins_tokens_check_subscribe_rate_limit(), 'rate limit allowed the third attempt.' );
					delete_transient( $key );
					remove_all_filters( 'hperkins_tokens_subscribe_rate_limit' );
					remove_all_filters( 'hperkins_tokens_subscribe_rate_window' );

					$exporters = apply_filters( 'wp_privacy_personal_data_exporters', array() );
					$assert( isset( $exporters['hperkins-tokens-subscribe-requests'] ), 'subscribe requests privacy exporter is not registered.' );
					$export = call_user_func( $exporters['hperkins-tokens-subscribe-requests']['callback'], 'kept@example.com', 1 );
					$assert( ! empty( $export['done'] ), 'subscribe requests privacy exporter did not mark the export complete.' );
					$assert( 1 === count( $export['data'] ), 'subscribe requests privacy exporter did not return exactly one matching item.' );
					$assert( 'hperkins-tokens-subscribe' === $export['data'][0]['group_id'], 'subscribe requests privacy exporter used the wrong group id.' );

					$erasers = apply_filters( 'wp_privacy_personal_data_erasers', array() );
					$assert( isset( $erasers['hperkins-tokens-subscribe-requests'] ), 'subscribe requests privacy eraser is not registered.' );
					$erase = call_user_func( $erasers['hperkins-tokens-subscribe-requests']['callback'], 'kept@example.com', 1 );
					$requests_after_erase = get_option( $option_name, array() );
					$assert( ! empty( $erase['done'] ), 'subscribe requests privacy eraser did not mark the erase complete.' );
					$assert( ! empty( $erase['items_removed'] ), 'subscribe requests privacy eraser did not report a removal.' );
					$assert( 1 === count( $requests_after_erase ), 'subscribe requests privacy eraser did not remove exactly one matching item.' );
					$assert( 'new@example.com' === $requests_after_erase[0]['email'], 'subscribe requests privacy eraser removed the wrong item.' );
				} finally {
					// Cleanup must survive a mid-run assert failure: drop the test
					// filters and the synthetic rate transient, then restore the option.
					remove_all_filters( 'hperkins_tokens_subscribe_max_requests' );
					remove_all_filters( 'hperkins_tokens_subscribe_rate_limit' );
					remove_all_filters( 'hperkins_tokens_subscribe_rate_window' );
					$_SERVER['REMOTE_ADDR'] = '203.0.113.44';
					delete_transient( hperkins_tokens_get_subscribe_rate_key() );
					if ( $original_exists ) {
						update_option( $option_name, $original_value );
					} else {
						delete_option( $option_name );
					}
				}

				echo 'checked subscribe storage, rate limit, and privacy hooks';
			`,
		] ).trim();
	}

	console.log( `checked subscribe cleanup guardrails, endpoint nonce rejection; ${ runtimeCheck }` );
}

main().catch( ( error ) => {
	console.error( error.message );
	process.exit( 1 );
} );
