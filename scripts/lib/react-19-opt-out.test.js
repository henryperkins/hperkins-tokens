const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const path = require( 'node:path' );
const { spawnSync } = require( 'node:child_process' );

const root = path.join( __dirname, '..', '..' );
const optOutPath = path.join( root, 'inc', 'react-19-opt-out.php' ).replaceAll( '\\', '/' );

function exerciseOptOut( fixture = {} ) {
	const encoded = Buffer.from( JSON.stringify( fixture ) ).toString( 'base64' );
	const phpPath = optOutPath.replaceAll( '\\', '\\\\' ).replaceAll( "'", "\\'" );
	const php = `
		define( 'ABSPATH', __DIR__ . '/' );
		$fixture = json_decode( base64_decode( '${ encoded }' ), true );
		$hooks = array();
		$registered = array();
		function add_filter( $hook, $callback, $priority = 10 ) {
			$GLOBALS['hooks'][ $hook ][ $priority ][] = $callback;
		}
		function apply_filters( $hook, $value ) {
			$priorities = $GLOBALS['hooks'][ $hook ] ?? array();
			ksort( $priorities );
			foreach ( $priorities as $callbacks ) {
				foreach ( $callbacks as $callback ) {
					$value = $callback( $value );
				}
			}
			return $value;
		}
		// The WordPress.com rollout (jetpack-mu-wpcom) filters the option before the theme loads.
		$rollout = function ( $experiments ) {
			if ( ! is_array( $experiments ) ) { $experiments = array(); }
			$experiments['gutenberg-react-19'] = true;
			return $experiments;
		};
		add_filter( 'option_gutenberg-experiments', $rollout );
		add_filter( 'default_option_gutenberg-experiments', $rollout );
		function get_option( $name ) {
			$options = $GLOBALS['fixture']['options'] ?? array();
			return array_key_exists( $name, $options )
				? apply_filters( "option_{$name}", $options[ $name ] )
				: apply_filters( "default_option_{$name}", array() );
		}
		function gutenberg_is_experiment_enabled( $name ) {
			$experiments = get_option( 'gutenberg-experiments' );
			return ! empty( $experiments[ $name ] );
		}
		function did_action( $hook ) {
			return 'wp_default_scripts' === $hook && ! empty( $GLOBALS['fixture']['scriptsInitialized'] ) ? 1 : 0;
		}
		function wp_scripts() { return new stdClass(); }
		function gutenberg_register_vendor_scripts( $scripts ) {
			$GLOBALS['registered'][] = gutenberg_is_experiment_enabled( 'gutenberg-react-19' ) ? 'react-19' : 'react';
		}
		if ( is_file( '${ phpPath }' ) ) { require '${ phpPath }'; }
		echo json_encode( array(
			'react19' => gutenberg_is_experiment_enabled( 'gutenberg-react-19' ),
			'experiments' => get_option( 'gutenberg-experiments' ),
			'registered' => $registered,
			'nonArray' => function_exists( 'hperkins_tokens_disable_react_19_experiment' ) ? hperkins_tokens_disable_react_19_experiment( false ) : null,
		) );
	`;
	const result = spawnSync( process.env.HPERKINS_PHP_BIN || 'php', [ '-r', php ], { cwd: root, encoding: 'utf8' } );
	assert.equal( result.status, 0, result.stderr || result.error?.message );
	return JSON.parse( result.stdout );
}

test( 'the WordPress.com rollout cannot turn on React 19', () => {
	const stored = exerciseOptOut( {
		options: { 'gutenberg-experiments': { 'gutenberg-guidelines': true, 'gutenberg-react-19': true } },
	} );
	assert.equal( stored.react19, false );
	assert.deepEqual( stored.experiments, { 'gutenberg-guidelines': true } );

	const unstored = exerciseOptOut();
	assert.equal( unstored.react19, false );
	assert.deepEqual( unstored.experiments, [] );
} );

test( 'non-array option values pass through untouched', () => {
	assert.equal( exerciseOptOut().nonArray, false );
} );

test( 'React vendor scripts registered before the theme loaded are registered again as React 18', () => {
	assert.deepEqual( exerciseOptOut( { scriptsInitialized: true } ).registered, [ 'react' ] );
	assert.deepEqual( exerciseOptOut().registered, [] );
} );
