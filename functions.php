<?php
/**
 * HPerkins Tokens — child theme bootstrap.
 *
 * Wires the child stylesheet on the frontend and keeps the inherited editor
 * styles, font preload behavior, and pattern category aligned with this
 * token-driven child theme.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'HPERKINS_TOKENS_SUBSCRIBE_MAX_REQUESTS' ) ) {
	define( 'HPERKINS_TOKENS_SUBSCRIBE_MAX_REQUESTS', 200 );
}

if ( ! defined( 'HPERKINS_TOKENS_SUBSCRIBE_RATE_LIMIT' ) ) {
	define( 'HPERKINS_TOKENS_SUBSCRIBE_RATE_LIMIT', 5 );
}

if ( ! defined( 'HPERKINS_TOKENS_SUBSCRIBE_RATE_WINDOW' ) ) {
	define( 'HPERKINS_TOKENS_SUBSCRIBE_RATE_WINDOW', 10 * MINUTE_IN_SECONDS );
}

if ( ! defined( 'HPERKINS_TOKENS_SUBSCRIBE_REQUESTS_OPTION' ) ) {
	define( 'HPERKINS_TOKENS_SUBSCRIBE_REQUESTS_OPTION', 'hperkins_tokens_subscribe_requests' );
}

require_once get_stylesheet_directory() . '/inc/council-header.php';

if ( ! function_exists( 'hperkins_tokens_asset_url' ) ) {
	/**
	 * Return a cache-busted child-theme asset URL when the file exists.
	 *
	 * @param string $relative_path Path relative to the child theme root.
	 * @return string Asset URL.
	 */
	function hperkins_tokens_asset_url( $relative_path ) {
		$relative_path = '/' . ltrim( $relative_path, '/' );
		$file          = get_stylesheet_directory() . $relative_path;
		$url           = get_stylesheet_directory_uri() . $relative_path;

		if ( file_exists( $file ) ) {
			$url = add_query_arg( 'v', filemtime( $file ), $url );
		}

		return $url;
	}
}

add_action( 'wp_enqueue_scripts', function () {
	// The parent's assembler_styles() registers 'assembler-style' from
	// get_stylesheet_directory_uri(), which under a child theme resolves to
	// THIS theme's style.css — loading the child CSS a second time. Drop it
	// and load both sheets explicitly with the correct dependency order.
	wp_dequeue_style( 'assembler-style' );

	$parent       = get_template_directory_uri() . '/style.css';
	$parent_theme = wp_get_theme( get_template() );
	wp_enqueue_style( 'assembler-parent', $parent, array(), $parent_theme->get( 'Version' ) );

	// Bust the child sheet on file mtime, matching every other hand-authored
	// asset below. The `Version:` header is still the theme's declared version
	// (and the readme changelog source-of-truth), but it is no longer the cache
	// key — so editing style.css ships under a fresh key without a manual bump.
	$style_css_file = get_stylesheet_directory() . '/style.css';
	wp_enqueue_style(
		'hperkins-tokens',
		get_stylesheet_uri(),
		array( 'assembler-parent' ),
		file_exists( $style_css_file ) ? filemtime( $style_css_file ) : wp_get_theme()->get( 'Version' )
	);

	// Page-layout CSS for the designs pulled from the Imladris Design System
	// (ai-enablement essay, contact, work index). Kept out of style.css so the
	// hand-authored sheet stays untouched; depends on it so the cascade is right.
	$pages_css_rel  = '/assets/imladris-pages.css';
	$pages_css_file = get_stylesheet_directory() . $pages_css_rel;
	if ( ! is_front_page() && file_exists( $pages_css_file ) ) {
		wp_enqueue_style(
			'hperkins-pages',
			get_stylesheet_directory_uri() . $pages_css_rel,
			array( 'hperkins-tokens' ),
			filemtime( $pages_css_file )
		);
	}

	$footer_backdrop_png_file  = get_stylesheet_directory() . '/assets/img/imagery/valley-twilight.png';
	$footer_backdrop_webp_file = get_stylesheet_directory() . '/assets/img/imagery/valley-twilight.webp';
	$footer_backdrop_png_url   = hperkins_tokens_asset_url( 'assets/img/imagery/valley-twilight.png' );
	$footer_backdrop_image     = 'url(' . wp_json_encode( esc_url( $footer_backdrop_png_url ), JSON_UNESCAPED_SLASHES ) . ')';
	$hero_backdrop_png_url     = hperkins_tokens_asset_url( 'assets/img/imagery/elvenbook.png' );
	$hero_backdrop_image       = 'url(' . wp_json_encode( esc_url( $hero_backdrop_png_url ), JSON_UNESCAPED_SLASHES ) . ')';

	// Serve a webp for the hero backdrop when present (it renders blurred at low
	// opacity, so an aggressive webp is visually identical to the 2.5MB PNG).
	// Mirrors the footer-backdrop image-set branch below.
	$hero_backdrop_webp_file = get_stylesheet_directory() . '/assets/img/imagery/elvenbook.webp';
	if ( file_exists( $hero_backdrop_webp_file ) ) {
		$hero_backdrop_webp_url = hperkins_tokens_asset_url( 'assets/img/imagery/elvenbook.webp' );
		$hero_backdrop_image    = sprintf(
			'image-set(url(%1$s) type("image/webp"), url(%2$s) type("image/png"))',
			wp_json_encode( esc_url( $hero_backdrop_webp_url ), JSON_UNESCAPED_SLASHES ),
			wp_json_encode( esc_url( $hero_backdrop_png_url ), JSON_UNESCAPED_SLASHES )
		);
	}

	if ( file_exists( $footer_backdrop_png_file ) && file_exists( $footer_backdrop_webp_file ) ) {
		$footer_backdrop_webp_url = hperkins_tokens_asset_url( 'assets/img/imagery/valley-twilight.webp' );
		$footer_backdrop_image    = sprintf(
			'image-set(url(%1$s) type("image/webp"), url(%2$s) type("image/png"))',
			wp_json_encode( esc_url( $footer_backdrop_webp_url ), JSON_UNESCAPED_SLASHES ),
			wp_json_encode( esc_url( $footer_backdrop_png_url ), JSON_UNESCAPED_SLASHES )
		);
	}

	wp_add_inline_style(
		'hperkins-tokens',
		sprintf(
			':root{--hp-footer-backdrop-url:%1$s;--hp-council-hero-backdrop-url:%2$s;}',
			$footer_backdrop_image,
			$hero_backdrop_image
		)
	);

	$nav_close_rel  = '/assets/js/nav-close-delight.js';
	$nav_close_file = get_stylesheet_directory() . $nav_close_rel;
	if ( file_exists( $nav_close_file ) ) {
		wp_enqueue_script(
			'hperkins-nav-close-delight',
			get_stylesheet_directory_uri() . $nav_close_rel,
			array(),
			filemtime( $nav_close_file ),
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);
	}

	// Progressive enhancement for the contact + subscribe forms: inline email
	// validation. The contact form keeps the mail-client handoff/confirmation
	// state; the subscribe form now posts to WordPress over HTTPS so the browser
	// never needs to submit the address through a `mailto:` action.
	$form_enhance_rel  = '/assets/js/form-enhance.js';
	$form_enhance_file = get_stylesheet_directory() . $form_enhance_rel;
	if ( file_exists( $form_enhance_file ) ) {
		wp_enqueue_script(
			'hperkins-form-enhance',
			get_stylesheet_directory_uri() . $form_enhance_rel,
			array(),
			filemtime( $form_enhance_file ),
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);
	}

	// Progressive enhancement for the Council masthead search: collapse the inline
	// expanding field on Escape or an outside click. The core/search "button only"
	// toggle (open/close on click) is the no-JS fallback this only refines.
	$header_search_rel  = '/assets/js/header-search.js';
	$header_search_file = get_stylesheet_directory() . $header_search_rel;
	if ( file_exists( $header_search_file ) ) {
		wp_enqueue_script(
			'hperkins-header-search',
			get_stylesheet_directory_uri() . $header_search_rel,
			array(),
			filemtime( $header_search_file ),
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);
	}

	// The Interactivity Router swaps pages without managing scroll at all —
	// hash links never reach their target (both Subscribe pills →
	// /contact/#subscribe) and plain navigations keep the old page's scroll
	// offset. This restores native full-load scroll parity for client swaps.
	$router_scroll_rel  = '/assets/js/router-scroll.js';
	$router_scroll_file = get_stylesheet_directory() . $router_scroll_rel;
	if ( file_exists( $router_scroll_file ) ) {
		wp_enqueue_script(
			'hperkins-router-scroll',
			get_stylesheet_directory_uri() . $router_scroll_rel,
			array(),
			filemtime( $router_scroll_file ),
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);
	}
}, 20 );

add_action( 'after_setup_theme', function () {
	global $editor_styles;

	// Load BOTH stylesheets in the block editor, parent-then-child, to match the
	// frontend cascade. Assembler registers the relative "style.css"; in a child
	// theme, WordPress resolves that against both parent and child directories.
	// Drop only that fragile relative entry so earlier editor-style additions from
	// plugins or integrations survive this rewrite.
	add_theme_support( 'editor-style' );
	$editor_styles = array_values( array_diff( (array) $editor_styles, array( 'style.css' ) ) );
	add_editor_style( get_template_directory_uri() . '/style.css' );
	add_editor_style( get_stylesheet_directory_uri() . '/style.css' );
	// Guard the page-layout sheet the way the frontend enqueue does (lines
	// 76-85). add_editor_style() registers globally, so — unlike the frontend
	// — it cannot be suppressed on the front page; the editor deliberately
	// previews the page CSS on every template.
	if ( file_exists( get_stylesheet_directory() . '/assets/imladris-pages.css' ) ) {
		add_editor_style( get_stylesheet_directory_uri() . '/assets/imladris-pages.css' );
	}

	// The Assembler parent preloads InterVariable.woff2 from the stylesheet
	// directory, which under this child theme resolves to a path that does not
	// exist (404). Imladris now serves its own theme.json font faces, so that
	// preload remains wrong and unused. Drop it. (after_setup_theme runs after
	// the parent registered the hook, so remove_action here takes effect.)
	remove_action( 'wp_head', 'assembler_preload_fonts', 1 );
}, 20 );

add_action( 'init', function () {
	register_block_pattern_category(
		'hperkins',
		array( 'label' => __( 'hperkins.blog', 'hperkins-tokens' ) )
	);

	$button_styles = array(
		'secondary' => __( 'Secondary', 'hperkins-tokens' ),
		'ghost'     => __( 'Ghost', 'hperkins-tokens' ),
		'accent'    => __( 'Accent', 'hperkins-tokens' ),
		'link'      => __( 'Link', 'hperkins-tokens' ),
	);
	foreach ( $button_styles as $name => $label ) {
		register_block_style(
			'core/button',
			array(
				'name'  => $name,
				'label' => $label,
			)
		);
	}

	register_block_style(
		'core/quote',
		array(
			'name'  => 'imladris',
			'label' => __( 'Imladris', 'hperkins-tokens' ),
		)
	);
}, 9 );

/**
 * Send the agent-owned seed page to the public demo page.
 */
function hperkins_tokens_redirect_flavor_agent_demo_seed() {
	if ( is_admin() || ! is_page( 'flavor-agent-demo' ) ) {
		return;
	}

	wp_safe_redirect( home_url( '/work/flavor-agent/demo/' ), 301, 'hperkins-tokens' );
	exit;
}
add_action( 'template_redirect', 'hperkins_tokens_redirect_flavor_agent_demo_seed' );

/**
 * Preload the above-the-fold display font (Cormorant Garamond) on the front page
 * so the hero headline paints without a fallback-serif swap. Scoped to the front
 * page and matched to the theme.json @font-face URL (no cache-bust query) so the
 * browser dedupes the preload against the actual font fetch.
 */
function hperkins_tokens_preload_display_font() {
	if ( ! is_front_page() ) {
		return;
	}

	$font_rel  = '/assets/fonts/cormorant-garamond.woff2';
	$font_file = get_stylesheet_directory() . $font_rel;
	if ( ! file_exists( $font_file ) ) {
		return;
	}

	printf(
		'<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>' . "\n",
		esc_url( get_stylesheet_directory_uri() . $font_rel )
	);
}
add_action( 'wp_head', 'hperkins_tokens_preload_display_font', 1 );

/**
 * Exclude the current post from the "Continue reading" related loop in
 * single.html. That Query Loop uses inherit:false with an empty exclude list, so
 * core does not drop the post being viewed; without this a recent essay lists
 * itself. Keyed on the template's queryId (12) so it only touches that loop.
 *
 * @param array    $query The query vars built from the block.
 * @param WP_Block $block The block instance (its context carries the queryId).
 * @return array
 */
function hperkins_tokens_exclude_current_from_related( $query, $block ) {
	if ( ! is_singular() ) {
		return $query;
	}

	$query_id = isset( $block->context['queryId'] ) ? (int) $block->context['queryId'] : 0;
	if ( 12 !== $query_id ) {
		return $query;
	}

	$current_id = get_queried_object_id();
	if ( $current_id ) {
		$excluded              = isset( $query['post__not_in'] ) ? (array) $query['post__not_in'] : array();
		$excluded[]            = $current_id;
		$query['post__not_in'] = array_values( array_unique( array_map( 'intval', $excluded ) ) );
	}

	return $query;
}
add_filter( 'query_loop_block_query_vars', 'hperkins_tokens_exclude_current_from_related', 10, 2 );

/**
 * Tag the journal grid Query Loop (home.html, queryId 11) with its static seed
 * offset. The grid starts at offset 3 because the featured loop above it shows
 * the first three posts; core computes max_num_pages from found_posts without
 * subtracting that offset, which fabricates a trailing empty pagination page at
 * post counts like 7-9 or 13-15. The var set here is consumed by the
 * found_posts filter below, for both the grid render and its pagination count.
 *
 * @param array    $query The query vars built from the block.
 * @param WP_Block $block The block instance (its context carries the queryId).
 * @return array
 */
function hperkins_tokens_tag_journal_grid_query( $query, $block ) {
	$query_id = isset( $block->context['queryId'] ) ? (int) $block->context['queryId'] : 0;
	if ( 11 === $query_id ) {
		$query['hperkins_tokens_offset_base'] = 3;
	}

	return $query;
}
add_filter( 'query_loop_block_query_vars', 'hperkins_tokens_tag_journal_grid_query', 10, 2 );

/**
 * Subtract a tagged query's seed offset from found_posts so max_num_pages
 * counts only the posts that loop can actually show.
 *
 * @param int      $found_posts Total matching rows, ignoring LIMIT/OFFSET.
 * @param WP_Query $query       The query object.
 * @return int
 */
function hperkins_tokens_offset_found_posts( $found_posts, $query ) {
	$offset_base = (int) $query->get( 'hperkins_tokens_offset_base' );
	if ( $offset_base > 0 ) {
		return max( 0, (int) $found_posts - $offset_base );
	}

	return $found_posts;
}
add_filter( 'found_posts', 'hperkins_tokens_offset_found_posts', 10, 2 );

/**
 * Store newsletter subscription requests even when mail delivery is unavailable.
 *
 * @param string $email   Subscriber email address.
 * @param string $referer Source page URL.
 * @return string stored|duplicate|save-error
 */
function hperkins_tokens_store_subscribe_request( $email, $referer ) {
	global $wpdb;

	$option_name = HPERKINS_TOKENS_SUBSCRIBE_REQUESTS_OPTION;
	$source      = $referer ? esc_url_raw( $referer ) : home_url( '/' );
	$max_entries = max( 1, (int) apply_filters( 'hperkins_tokens_subscribe_max_requests', HPERKINS_TOKENS_SUBSCRIBE_MAX_REQUESTS ) );

	$normalized_email = strtolower( $email );

	for ( $attempt = 0; $attempt < 3; $attempt++ ) {
		if ( false === get_option( $option_name, false ) ) {
			add_option( $option_name, array(), '', false );
		}

		$requests = get_option( $option_name, array() );
		if ( ! is_array( $requests ) ) {
			$requests = array();
		}

		foreach ( $requests as $request ) {
			if ( ! empty( $request['email'] ) && strtolower( (string) $request['email'] ) === $normalized_email ) {
				return 'duplicate';
			}
		}

		$next_requests   = $requests;
		$next_requests[] = array(
			'email'        => $normalized_email,
			'source'       => $source,
			'submitted_at' => current_time( 'mysql', true ),
		);

		if ( count( $next_requests ) > $max_entries ) {
			$next_requests = array_slice( $next_requests, -$max_entries );
		}

		$updated = $wpdb->query(
			$wpdb->prepare(
				"UPDATE {$wpdb->options} SET option_value = %s WHERE option_name = %s AND option_value = %s",
				maybe_serialize( $next_requests ),
				$option_name,
				maybe_serialize( $requests )
			)
		);

		if ( false === $updated ) {
			return 'save-error';
		}

		if ( $updated > 0 ) {
			wp_cache_delete( $option_name, 'options' );
			// The raw UPDATE bypasses the options API, so if the option was ever
			// created autoloaded the per-key delete alone leaves alloptions stale.
			wp_cache_delete( 'alloptions', 'options' );
			return 'stored';
		}

		wp_cache_delete( $option_name, 'options' );
		wp_cache_delete( 'alloptions', 'options' );
	}

	return 'save-error';
}

/**
 * Return a privacy-preserving transient key for the current submitter.
 *
 * @return string
 */
function hperkins_tokens_get_subscribe_rate_key() {
	$remote_addr = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	if ( '' === $remote_addr || false === filter_var( $remote_addr, FILTER_VALIDATE_IP ) ) {
		$remote_addr = 'unknown';
	}

	return 'hperkins_tokens_subscribe_rate_' . md5( $remote_addr . '|' . wp_salt( 'nonce' ) );
}

/**
 * Rate-limit public subscribe attempts before validation/storage work.
 *
 * @return bool Whether the current request is allowed to continue.
 */
function hperkins_tokens_check_subscribe_rate_limit() {
	$limit = max( 1, (int) apply_filters( 'hperkins_tokens_subscribe_rate_limit', HPERKINS_TOKENS_SUBSCRIBE_RATE_LIMIT ) );
	$ttl   = max( MINUTE_IN_SECONDS, (int) apply_filters( 'hperkins_tokens_subscribe_rate_window', HPERKINS_TOKENS_SUBSCRIBE_RATE_WINDOW ) );
	$key   = hperkins_tokens_get_subscribe_rate_key();
	$count = (int) get_transient( $key );

	if ( $count >= $limit ) {
		return false;
	}

	set_transient( $key, $count + 1, $ttl );
	return true;
}

/**
 * Handle secure newsletter subscription requests from the frontend.
 */
function hperkins_tokens_handle_subscribe_request() {
	$email   = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	$nonce   = isset( $_POST['hperkins_tokens_subscribe_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['hperkins_tokens_subscribe_nonce'] ) ) : '';
	$referer = wp_get_referer();
	$status  = 'success';

	if ( ! wp_verify_nonce( $nonce, 'hperkins_tokens_subscribe' ) ) {
		$status = 'invalid-request';
	} elseif ( ! is_email( $email ) ) {
		$status = 'invalid-email';
	} elseif ( ! hperkins_tokens_check_subscribe_rate_limit() ) {
		$status = 'rate-limited';
	} else {
		$store_status = hperkins_tokens_store_subscribe_request( $email, $referer );
		if ( 'duplicate' === $store_status ) {
			$status = 'success';
		} else {
			$message = sprintf(
				"Please add %s to the occasional dispatch.\n\nSubmitted from: %s",
				$email,
				$referer ? $referer : home_url( '/' )
			);

			// Filterable so the recipient is not hardcoded; defaults to the
			// existing address to preserve delivery behavior.
			$recipient = apply_filters( 'hperkins_tokens_subscribe_notify_email', 'htperkins@gmail.com' );
			$mail_sent = wp_mail(
				$recipient,
				'Occasional dispatch subscription',
				$message,
				array( 'Reply-To: ' . $email )
			);

			if ( 'stored' !== $store_status && ! $mail_sent ) {
				$status = 'save-error';
			}
		}
	}

	$redirect_to = $referer ? $referer : home_url( '/contact/' );
	$redirect_to = remove_query_arg( 'hperkins_subscribe', $redirect_to );
	$redirect_to = add_query_arg( 'hperkins_subscribe', $status, $redirect_to );

	wp_safe_redirect( $redirect_to . '#subscribe', 303, 'hperkins-tokens' );
	exit;
}
add_action( 'admin_post_hperkins_tokens_subscribe', 'hperkins_tokens_handle_subscribe_request' );
add_action( 'admin_post_nopriv_hperkins_tokens_subscribe', 'hperkins_tokens_handle_subscribe_request' );

/**
 * Register stored subscribe requests with WordPress personal data exports.
 *
 * @param array $exporters Existing privacy exporters.
 * @return array
 */
function hperkins_tokens_register_subscribe_privacy_exporter( $exporters ) {
	$exporters['hperkins-tokens-subscribe-requests'] = array(
		'exporter_friendly_name' => __( 'Occasional dispatch subscription requests', 'hperkins-tokens' ),
		'callback'               => 'hperkins_tokens_export_subscribe_request_personal_data',
	);

	return $exporters;
}
add_filter( 'wp_privacy_personal_data_exporters', 'hperkins_tokens_register_subscribe_privacy_exporter' );

/**
 * Export a stored subscribe request for a matching email address.
 *
 * @param string $email_address Email address being exported.
 * @param int    $page          Export page number.
 * @return array
 */
function hperkins_tokens_export_subscribe_request_personal_data( $email_address, $page = 1 ) {
	$normalized_email = strtolower( sanitize_email( $email_address ) );
	$export_items     = array();

	if ( 1 !== (int) $page || ! is_email( $normalized_email ) ) {
		return array(
			'data' => $export_items,
			'done' => true,
		);
	}

	$requests = get_option( HPERKINS_TOKENS_SUBSCRIBE_REQUESTS_OPTION, array() );
	if ( ! is_array( $requests ) ) {
		$requests = array();
	}

	foreach ( $requests as $index => $request ) {
		$request_email = isset( $request['email'] ) ? strtolower( (string) $request['email'] ) : '';
		if ( $request_email !== $normalized_email ) {
			continue;
		}

		$source       = isset( $request['source'] ) ? (string) $request['source'] : '';
		$submitted_at = isset( $request['submitted_at'] ) ? (string) $request['submitted_at'] : '';

		$export_items[] = array(
			'group_id'    => 'hperkins-tokens-subscribe',
			'group_label' => __( 'Occasional dispatch subscription requests', 'hperkins-tokens' ),
			'item_id'     => 'hperkins-tokens-subscribe-' . md5( $request_email . '|' . $index . '|' . $submitted_at ),
			'data'        => array(
				array(
					'name'  => __( 'Email address', 'hperkins-tokens' ),
					'value' => $request_email,
				),
				array(
					'name'  => __( 'Source URL', 'hperkins-tokens' ),
					'value' => $source,
				),
				array(
					'name'  => __( 'Submitted at', 'hperkins-tokens' ),
					'value' => $submitted_at,
				),
			),
		);
	}

	return array(
		'data' => $export_items,
		'done' => true,
	);
}

/**
 * Register stored subscribe requests with WordPress personal data erasure.
 *
 * @param array $erasers Existing privacy erasers.
 * @return array
 */
function hperkins_tokens_register_subscribe_privacy_eraser( $erasers ) {
	$erasers['hperkins-tokens-subscribe-requests'] = array(
		'eraser_friendly_name' => __( 'Occasional dispatch subscription requests', 'hperkins-tokens' ),
		'callback'             => 'hperkins_tokens_erase_subscribe_request_personal_data',
	);

	return $erasers;
}
add_filter( 'wp_privacy_personal_data_erasers', 'hperkins_tokens_register_subscribe_privacy_eraser' );

/**
 * Remove stored subscribe requests for a matching email address.
 *
 * @param string $email_address Email address being erased.
 * @param int    $page          Erasure page number.
 * @return array
 */
function hperkins_tokens_erase_subscribe_request_personal_data( $email_address, $page = 1 ) {
	$normalized_email = strtolower( sanitize_email( $email_address ) );
	$items_removed    = false;

	if ( 1 !== (int) $page || ! is_email( $normalized_email ) ) {
		return array(
			'items_removed'  => false,
			'items_retained' => false,
			'messages'       => array(),
			'done'           => true,
		);
	}

	$requests = get_option( HPERKINS_TOKENS_SUBSCRIBE_REQUESTS_OPTION, array() );
	if ( ! is_array( $requests ) ) {
		$requests = array();
	}

	$next_requests = array();
	foreach ( $requests as $request ) {
		$request_email = isset( $request['email'] ) ? strtolower( (string) $request['email'] ) : '';
		if ( $request_email === $normalized_email ) {
			$items_removed = true;
			continue;
		}

		$next_requests[] = $request;
	}

	if ( $items_removed ) {
		update_option( HPERKINS_TOKENS_SUBSCRIBE_REQUESTS_OPTION, array_values( $next_requests ), false );
	}

	return array(
		'items_removed'  => $items_removed,
		'items_retained' => false,
		'messages'       => array(),
		'done'           => true,
	);
}

/**
 * Hide inherited Assembler style variations from this child theme's Site Editor
 * variations endpoint. The token contract lives in hperkins-tokens/theme.json;
 * parent style variations would reintroduce generic palettes and font pairings.
 *
 * @param mixed           $dispatch_result Short-circuit response, or null.
 * @param WP_REST_Request $request         Current REST request.
 * @return mixed
 */
function hperkins_tokens_filter_global_style_variations( $dispatch_result, $request ) {
	if ( null !== $dispatch_result ) {
		return $dispatch_result;
	}

	if ( ! $request instanceof WP_REST_Request ) {
		return $dispatch_result;
	}

	if ( 'GET' !== $request->get_method() ) {
		return $dispatch_result;
	}

	if ( 'hperkins-tokens' !== get_stylesheet() ) {
		return $dispatch_result;
	}

	if ( 'hperkins-tokens' !== $request['stylesheet'] ) {
		return $dispatch_result;
	}

	if ( ! preg_match( '#^/wp/v2/global-styles/themes/[^/]+/variations$#', $request->get_route() ) ) {
		return $dispatch_result;
	}

	return array();
}
add_filter( 'rest_dispatch_request', 'hperkins_tokens_filter_global_style_variations', 10, 2 );

/**
 * Blocks that inherit Assembler's generic section style partials unless this
 * child theme removes them.
 *
 * @return string[]
 */
function hperkins_tokens_get_inherited_assembler_section_blocks() {
	return array( 'core/group', 'core/columns', 'core/column', 'core/cover' );
}

/**
 * Style slugs used by Assembler's inherited section partials.
 *
 * @return string[]
 */
function hperkins_tokens_get_inherited_assembler_section_styles() {
	return array( 'section-1', 'section-2', 'section-3' );
}

/**
 * Remove inherited Assembler section variations from the block-style registry.
 */
function hperkins_tokens_unregister_inherited_assembler_section_styles() {
	if ( ! class_exists( 'WP_Block_Styles_Registry' ) ) {
		return;
	}

	$registry = WP_Block_Styles_Registry::get_instance();
	foreach ( hperkins_tokens_get_inherited_assembler_section_blocks() as $block_name ) {
		foreach ( hperkins_tokens_get_inherited_assembler_section_styles() as $style_name ) {
			if ( $registry->is_registered( $block_name, $style_name ) ) {
				$registry->unregister( $block_name, $style_name );
			}
		}
	}
}
add_action( 'init', 'hperkins_tokens_unregister_inherited_assembler_section_styles', 100 );
add_action( 'admin_init', 'hperkins_tokens_unregister_inherited_assembler_section_styles', 0 );

/**
 * Remove inherited Assembler section variation data from a theme.json-shaped
 * array.
 *
 * @param array $data Theme JSON data.
 * @return array
 */
function hperkins_tokens_without_inherited_assembler_section_variations( $data ) {
	if ( ! is_array( $data ) ) {
		return $data;
	}

	foreach ( hperkins_tokens_get_inherited_assembler_section_blocks() as $block_name ) {
		foreach ( hperkins_tokens_get_inherited_assembler_section_styles() as $style_name ) {
			unset( $data['styles']['blocks'][ $block_name ]['variations'][ $style_name ] );
		}

		if ( empty( $data['styles']['blocks'][ $block_name ]['variations'] ) ) {
			unset( $data['styles']['blocks'][ $block_name ]['variations'] );
		}
	}

	return $data;
}

/**
 * Strip inherited Assembler section variations from the theme-origin JSON before
 * the merged global-styles payload reaches the editor.
 *
 * @param WP_Theme_JSON_Data $theme_json Theme-origin JSON data.
 * @return WP_Theme_JSON_Data
 */
function hperkins_tokens_filter_theme_json_data( $theme_json ) {
	if ( 'hperkins-tokens' !== get_stylesheet() ) {
		return $theme_json;
	}

	if ( ! $theme_json instanceof WP_Theme_JSON_Data ) {
		return $theme_json;
	}

	$data = hperkins_tokens_without_inherited_assembler_section_variations( $theme_json->get_data() );

	hperkins_tokens_unregister_inherited_assembler_section_styles();

	return new WP_Theme_JSON_Data( $data, 'theme' );
}
add_filter( 'wp_theme_json_data_theme', 'hperkins_tokens_filter_theme_json_data', 20 );

/**
 * Strip inherited Assembler section variations from the global-styles REST
 * response after core assembles the editor-facing payload.
 *
 * @param mixed           $response REST response.
 * @param array           $handler  Route handler.
 * @param WP_REST_Request $request  REST request.
 * @return mixed
 */
function hperkins_tokens_filter_global_styles_response( $response, $handler, $request ) {
	if ( 'hperkins-tokens' !== get_stylesheet() ) {
		return $response;
	}

	if ( ! $response instanceof WP_REST_Response || ! $request instanceof WP_REST_Request ) {
		return $response;
	}

	if ( 'GET' !== $request->get_method() ) {
		return $response;
	}

	if ( 'hperkins-tokens' !== $request['stylesheet'] ) {
		return $response;
	}

	if ( ! preg_match( '#^/wp/v2/global-styles/themes/[^/]+$#', $request->get_route() ) ) {
		return $response;
	}

	$data = hperkins_tokens_without_inherited_assembler_section_variations( $response->get_data() );
	$response->set_data( $data );

	hperkins_tokens_unregister_inherited_assembler_section_styles();

	return $response;
}
add_filter( 'rest_request_after_callbacks', 'hperkins_tokens_filter_global_styles_response', 10, 3 );

/**
 * Remove inherited Assembler section styles from block-type REST responses.
 *
 * @param WP_REST_Response $response   Block type response.
 * @param WP_Block_Type    $block_type Block type object.
 * @return WP_REST_Response
 */
function hperkins_tokens_filter_block_type_styles_response( $response, $block_type ) {
	if ( 'hperkins-tokens' !== get_stylesheet() ) {
		return $response;
	}

	if ( ! $response instanceof WP_REST_Response || ! $block_type instanceof WP_Block_Type ) {
		return $response;
	}

	if ( ! in_array( $block_type->name, hperkins_tokens_get_inherited_assembler_section_blocks(), true ) ) {
		return $response;
	}

	$data = $response->get_data();
	if ( empty( $data['styles'] ) || ! is_array( $data['styles'] ) ) {
		return $response;
	}

	$inherited_style_names = hperkins_tokens_get_inherited_assembler_section_styles();
	$data['styles']       = array_values(
		array_filter(
			$data['styles'],
			static function ( $style ) use ( $inherited_style_names ) {
				return ! in_array( $style['name'] ?? '', $inherited_style_names, true );
			}
		)
	);

	$response->set_data( $data );

	return $response;
}
add_filter( 'rest_prepare_block_type', 'hperkins_tokens_filter_block_type_styles_response', 10, 2 );

/**
 * Stop editor/admin styles from printing font faces for inherited Assembler
 * style variations that this child theme deliberately hides.
 */
function hperkins_tokens_remove_inherited_style_variation_font_faces() {
	remove_action( 'admin_print_styles', 'wp_print_font_faces_from_style_variations', 50 );
}
add_action( 'init', 'hperkins_tokens_remove_inherited_style_variation_font_faces', 100 );
add_action( 'admin_init', 'hperkins_tokens_remove_inherited_style_variation_font_faces', 0 );

/**
 * Clean up legacy global-style posts from prior theme identities and refresh the
 * theme JSON cache when this child theme is activated. This is intentionally an
 * activation-time migration, not a public-request init task.
 */
function hperkins_tokens_cleanup_legacy_global_styles() {
	$theme = wp_get_theme();
	if ( 'hperkins-tokens' !== $theme->get_stylesheet() ) {
		return;
	}

	$option_key = 'hperkins_tokens_global_styles_cleanup_v1';
	if ( get_option( $option_key ) ) {
		return;
	}

	$posts = get_posts(
		array(
			'post_type'      => 'wp_global_styles',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'fields'         => 'ids',
		)
	);

	$current_style_post = 'wp-global-styles-' . $theme->get_stylesheet();
	foreach ( $posts as $post_id ) {
		$post_name = get_post_field( 'post_name', $post_id );
		if ( ! str_starts_with( $post_name, 'wp-global-styles-' ) ) {
			continue;
		}
		if ( $post_name === $current_style_post ) {
			continue;
		}

		$decoded_name = rawurldecode( $post_name );
		if (
			str_contains( $decoded_name, 'wp-global-styles-pub/' )
			|| str_contains( $decoded_name, 'wp-global-styles-assembler' )
			|| str_contains( $post_name, 'wp-global-styles-pub%2F' )
		) {
			wp_delete_post( $post_id, true );
		}
	}

	if ( method_exists( 'WP_Theme_JSON_Resolver', 'clean_cached_data' ) ) {
		WP_Theme_JSON_Resolver::clean_cached_data();
	}

	update_option( $option_key, gmdate( 'c' ) );
}
add_action( 'after_switch_theme', 'hperkins_tokens_cleanup_legacy_global_styles' );
