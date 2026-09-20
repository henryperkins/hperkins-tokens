<?php
/** Execute the actual theme filter with the installed WordPress HTML processor. */
define( 'ABSPATH', rtrim( $argv[1] ?? '', '/\\' ) . '/' );
define( 'HP_SEARCH_THEME_ROOT', dirname( __DIR__, 3 ) );
eval( 'namespace Automattic\\Jetpack\\Search; class Search_Blocks { public static function is_block_template_overlay_enabled() { return true; } }' );
function add_filter() {}
function add_action() {}
function wp_enqueue_script_module( $id, $src = '', $deps = array(), $version = false ) { $GLOBALS['hp_search_test_modules'][ $id ] = compact( 'src', 'deps', 'version' ); }
function wp_dequeue_script_module( $id ) { $GLOBALS['hp_search_test_dequeued'][] = $id; }
function wp_script_is() { return false; }
function wp_enqueue_script() {}
function wp_add_inline_script() {}
function wp_style_is() { return true; }
function get_stylesheet_directory() { return HP_SEARCH_THEME_ROOT; }
function get_stylesheet_directory_uri() { return $GLOBALS['input']['origin']; }
function home_url( $path = '/' ) { return $GLOBALS['input']['origin'] . $path; }
function __( $text ) { return $text; }
function wp_json_encode( $value, $flags = 0 ) { return json_encode( $value, $flags ); }
function wp_kses_uri_attributes() { return array(); }
function wp_interactivity_state( $namespace, $state = array() ) { $GLOBALS['hp_search_test_state'][ $namespace ] = $state; }
function _doing_it_wrong( $function, $message, $version ) { throw new RuntimeException( $function . ': ' . $message ); }

$api = ABSPATH . 'wp-includes/html-api/';
if ( is_file( $api . 'class-wp-html-tag-processor.php' ) ) {
	require_once ABSPATH . 'wp-includes/utf8.php';
	foreach ( array( 'attribute-token', 'span', 'text-replacement', 'decoder', 'doctype-info', 'tag-processor' ) as $name ) {
		require_once $api . 'class-wp-html-' . $name . '.php';
	}
	$processor = 'wordpress';
} else {
	require __DIR__ . '/html-tag-processor.php';
	$processor = 'test-shim';
}
require HP_SEARCH_THEME_ROOT . '/inc/search.php';
$input = json_decode( file_get_contents( 'php://stdin' ), true );
hperkins_tokens_search_enqueue_assets();
$html = hperkins_tokens_search_blocks_results( $input['html'] );
echo json_encode( array(
	'html' => $html,
	'state' => $GLOBALS['hp_search_test_state'] ?? array(),
	'processor' => $processor,
	'modules' => $GLOBALS['hp_search_test_modules'] ?? array(),
	'dequeued' => $GLOBALS['hp_search_test_dequeued'] ?? array(),
	'config' => hperkins_tokens_search_client_config(),
) );
