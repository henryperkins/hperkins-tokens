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
