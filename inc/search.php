<?php
/**
 * Visitor search policy shared by Jetpack and the native search fallback.
 *
 * These are request-time integration filters. They do not update Jetpack
 * settings, page content, or the remote search index.
 *
 * @package HPerkins_Tokens
 */

defined( 'ABSPATH' ) || exit;

/**
 * Detect the active beta renderer, including Jetpack's asset/module gates.
 *
 * The overlay style is queued before Jetpack renders its block template.
 * Checking it avoids changing embedded blocks when the beta is unavailable.
 *
 * @return bool Whether the blocks overlay is actually enqueued.
 */
function hperkins_tokens_search_blocks_enabled() {
	return function_exists( 'wp_enqueue_script_module' ) &&
		is_callable( array( '\\Automattic\\Jetpack\\Search\\Search_Blocks', 'is_block_template_overlay_enabled' ) ) &&
		\Automattic\Jetpack\Search\Search_Blocks::is_block_template_overlay_enabled() &&
		wp_style_is( 'jetpack-search-block-overlay', 'enqueued' );
}

/**
 * Enqueue the adapter for the selected Jetpack experience.
 *
 * Called after the header controller is registered at enqueue priority 20.
 */
function hperkins_tokens_search_enqueue_assets() {
	$legacy = wp_script_is( 'jetpack-instant-search', 'registered' );
	$blocks = hperkins_tokens_search_blocks_enabled();
	$file   = get_stylesheet_directory() . '/assets/js/search-enhance.js';
	if ( ( ! $legacy && ! $blocks ) || ! file_exists( $file ) ) {
		return;
	}
	$deps = array( 'hperkins-header-controller' );
	if ( $legacy ) {
		$deps[] = 'wp-hooks';
	}
	wp_enqueue_script(
		'hperkins-search-enhance',
		get_stylesheet_directory_uri() . '/assets/js/search-enhance.js',
		$deps,
		filemtime( $file ),
		array( 'in_footer' => true, 'strategy' => 'defer' )
	);
	wp_add_inline_script(
		'hperkins-search-enhance',
		'window.hpSearchConfig = ' . wp_json_encode( hperkins_tokens_search_client_config(), JSON_HEX_TAG | JSON_HEX_AMP ) . ';',
		'before'
	);
	if ( $legacy ) {
		// Keep the supported image hook ahead of the legacy app's first render.
		$scripts = wp_scripts();
		if ( ! in_array( 'hperkins-search-enhance', $scripts->registered['jetpack-instant-search']->deps, true ) ) {
			$scripts->registered['jetpack-instant-search']->deps[] = 'hperkins-search-enhance';
		}
	}
	if ( $blocks ) {
		$module = get_stylesheet_directory() . '/assets/js/search-blocks.js';
		if ( file_exists( $module ) ) {
			wp_enqueue_script_module(
				'hperkins-tokens/search-blocks',
				get_stylesheet_directory_uri() . '/assets/js/search-blocks.js',
				array(
					'@wordpress/interactivity',
					'jetpack-search/store',
					array( 'id' => 'jetpack-search/overlay-bootstrap', 'import' => 'dynamic' ),
				),
				filemtime( $module )
			);
			// Keep Jetpack's registered module available through the import map,
			// but let our module start it after WordPress's initial DOM scan.
			wp_dequeue_script_module( 'jetpack-search/overlay-bootstrap' );
		}
	}
}

/**
 * Bind beta result templates to an additive presentation getter.
 *
 * Jetpack still owns the query, result records, actions and template. Only its
 * result iteration reads our non-mutating view of image URLs/author labels.
 *
 * @param string $html Rendered Jetpack results-list block.
 * @return string Markup with the theme presentation binding when supported.
 */
function hperkins_tokens_search_blocks_results( $html ) {
	if ( ! hperkins_tokens_search_blocks_enabled() ||
		! file_exists( get_stylesheet_directory() . '/assets/js/search-blocks.js' ) ||
		! function_exists( 'wp_interactivity_state' ) || ! class_exists( 'WP_HTML_Tag_Processor' ) ) {
		return $html;
	}
	$tags = new WP_HTML_Tag_Processor( $html );
	if ( ! $tags->next_tag() ) {
		return $html;
	}
	$tags->set_attribute( 'data-wp-bind--data-hp-search-state', 'state.hperkinsSearchState' );
	$tags->set_attribute( 'data-hp-search-state', 'loading' );
	$changed = false;
	while ( $tags->next_tag() ) {
		if ( 'TEMPLATE' === $tags->get_tag() && 'state.results' === $tags->get_attribute( 'data-wp-each--result' ) ) {
			$tags->set_attribute( 'data-wp-each--result', 'state.hperkinsSearchResults' );
			$changed = true;
		}
	}
	if ( ! $changed ) {
		return $html;
	}
	// Script Modules can finish loading in either order. An early hydration
	// must wait for our getter, rather than briefly requesting malformed media.
	wp_interactivity_state( 'jetpack-search', array( 'hperkinsSearchResults' => array(), 'hperkinsSearchState' => 'loading' ) );
	return $tags->get_updated_html();
}
add_filter( 'render_block_jetpack-search/results-list', 'hperkins_tokens_search_blocks_results' );

/**
 * Resolve utility pages that are destinations in a workflow, not search results.
 *
 * WooCommerce settings win over default slugs so renamed checkout/account pages
 * stay excluded. Missing settings and pages are harmless without WooCommerce.
 * Products, the real Contact page, and Privacy Policy remain searchable.
 *
 * @return int[] Current-site utility page IDs.
 */
function hperkins_tokens_search_excluded_page_ids() {
	static $ids = null;
	if ( null !== $ids ) {
		return $ids;
	}

	$ids   = array();
	$pages = array(
		'cart'         => 'woocommerce_cart_page_id',
		'checkout'     => 'woocommerce_checkout_page_id',
		'my-account'   => 'woocommerce_myaccount_page_id',
		'review-order' => '',
		'contact2'     => '',
	);
	foreach ( $pages as $path => $option ) {
		$id   = '' !== $option ? (int) get_option( $option, 0 ) : 0;
		$page = $id > 0 ? get_post( $id ) : null;
		if ( ! $page || 'page' !== $page->post_type ) {
			$page = get_page_by_path( $path, OBJECT, 'page' );
		}
		if ( $page && 'page' === $page->post_type && (int) $page->ID > 0 ) {
			$ids[] = (int) $page->ID;
		}
	}

	$ids = array_values( array_unique( $ids ) );
	return $ids;
}

/**
 * Keep optional AI failures out of ordinary search and align the public query.
 *
 * Jetpack's adminQueryFilter is an Elasticsearch filter consumed by both its
 * overlay and Theme experience. staticFilters configures visitor-facing facets
 * and must not be replaced with a query. Preserve any existing query predicate
 * as a complete must clause, including its should/minimum_should_match rules.
 *
 * @param array $options Jetpack Instant Search options.
 * @return array Filtered options.
 */
function hperkins_tokens_search_options( $options ) {
	if ( ! is_array( $options ) ) {
		return $options;
	}

	$options['aiAnswersEnabled'] = false;
	$palette                     = wp_get_global_settings( array( 'color', 'palette', 'theme' ) );
	foreach ( (array) $palette as $color ) {
		if ( 'gold-100' !== ( $color['slug'] ?? '' ) ) {
			continue;
		}
		$highlight = sanitize_hex_color( $color['color'] ?? '' );
		if ( $highlight ) {
			$options['overlayOptions']['highlightColor'] = $highlight;
		}
		break;
	}

	$ids = hperkins_tokens_search_excluded_page_ids();
	if ( $ids ) {
		$filter = array(
			'bool' => array(
				'must_not' => array( array( 'terms' => array( 'post_id' => $ids ) ) ),
			),
		);
		if ( ! empty( $options['adminQueryFilter'] ) && is_array( $options['adminQueryFilter'] ) ) {
			$filter['bool']['must'] = array( $options['adminQueryFilter'] );
		}
		$options['adminQueryFilter'] = $filter;
	}

	return $options;
}
add_filter( 'jetpack_search_ai_answers_enabled', '__return_false', 20 );
add_filter( 'jetpack_instant_search_options', 'hperkins_tokens_search_options', 20 );

/**
 * Keep the no-JavaScript/native main search consistent with Jetpack results.
 *
 * @param WP_Query $query The current query.
 */
function hperkins_tokens_search_native_query( $query ) {
	if ( is_admin() || ! $query->is_main_query() || ! $query->is_search() ) {
		return;
	}
	$ids = hperkins_tokens_search_excluded_page_ids();
	if ( $ids ) {
		$excluded = array_merge( (array) $query->get( 'post__not_in', array() ), $ids );
		$query->set( 'post__not_in', array_values( array_unique( array_map( 'intval', $excluded ) ) ) );
	}
}
add_action( 'pre_get_posts', 'hperkins_tokens_search_native_query', 20 );

/**
 * Localized recovery controls for the progressive search enhancement.
 *
 * @return array Client configuration with URLs resolved for this installation.
 */
function hperkins_tokens_search_client_config() {
	return array(
		'homeUrl'       => home_url( '/' ),
		'recoveryLinks' => array(
			array( 'label' => __( 'Work', 'hperkins-tokens' ), 'url' => home_url( '/work/' ) ),
			array( 'label' => __( 'Essays', 'hperkins-tokens' ), 'url' => home_url( '/essays/' ) ),
			array( 'label' => __( 'About', 'hperkins-tokens' ), 'url' => home_url( '/about/' ) ),
		),
		'strings'       => array(
			'emptyTitle'     => __( 'Search the site', 'hperkins-tokens' ),
			'emptyText'      => __( 'Find projects, essays, and background.', 'hperkins-tokens' ),
			'noResultsTitle' => __( 'No matching pages', 'hperkins-tokens' ),
			'noResultsText'  => __( 'Try a broader term, or browse one of these sections.', 'hperkins-tokens' ),
			'filterClose'    => __( 'Back to results', 'hperkins-tokens' ),
			'searchLabel'    => __( 'Search the site', 'hperkins-tokens' ),
			'clearLabel'     => __( 'Clear search', 'hperkins-tokens' ),
		),
	);
}
