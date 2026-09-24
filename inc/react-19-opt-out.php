<?php
/**
 * Keep the editor on React 18 while WordPress.com rolls out React 19.
 *
 * WordPress.com turns on the Gutenberg plugin's `gutenberg-react-19` experiment
 * for a share of Atomic sites by filtering the `gutenberg-experiments` option
 * (jetpack-mu-wpcom), so the stored setting cannot switch it off. Under React 19
 * the block editor crashed with React error #130, so this removes the flag after
 * every other filter has run. Drop the require in functions.php to rejoin.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Remove the React 19 experiment from Gutenberg's experiment list.
 *
 * @param mixed $experiments Value of the `gutenberg-experiments` option.
 * @return mixed The experiments without `gutenberg-react-19`.
 */
function hperkins_tokens_disable_react_19_experiment( $experiments ) {
	if ( is_array( $experiments ) ) {
		unset( $experiments['gutenberg-react-19'] );
	}

	return $experiments;
}
add_filter( 'option_gutenberg-experiments', 'hperkins_tokens_disable_react_19_experiment', PHP_INT_MAX );
add_filter( 'default_option_gutenberg-experiments', 'hperkins_tokens_disable_react_19_experiment', PHP_INT_MAX );

// Gutenberg picks the React build when WP_Scripts initializes. If a plugin
// initialized it before the theme loaded, register the vendor scripts again.
if ( did_action( 'wp_default_scripts' ) && function_exists( 'gutenberg_register_vendor_scripts' ) ) {
	gutenberg_register_vendor_scripts( wp_scripts() );
}
