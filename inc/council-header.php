<?php
/**
 * Theme-owned Council header renderer.
 *
 * Menu post 237 remains the navigation data source. This adapter turns its
 * block tree into one stable semantic contract for the desktop disclosures,
 * search surface, and mobile drawer.
 *
 * @package HPerkins_Tokens
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Return the reachable navigation model used when menu 237 is unavailable.
 *
 * @return array<string, mixed>
 */
function hperkins_tokens_get_council_navigation_fallback() {
	return array(
		'source'    => 'fallback',
		'work'      => array( 'label' => 'Work', 'url' => '/work/' ),
		'writing'   => array(
			'label'    => 'Writing',
			'children' => array(
				array( 'key' => 'ai', 'label' => 'AI Enablement', 'url' => '/ai-enablement/' ),
				array( 'key' => 'essays', 'label' => 'Essays', 'url' => '/essays/' ),
				array( 'key' => 'digest', 'label' => 'Job Placement Digest', 'url' => '/job-placement-digest/' ),
			),
		),
		'about'     => array( 'label' => 'About', 'url' => '/about/' ),
		'search'    => array( 'label' => 'Search', 'placeholder' => 'Search the journal' ),
		'subscribe' => array( 'label' => 'Subscribe', 'url' => '/contact/#subscribe' ),
	);
}

/**
 * Return the current repository-owned Work evidence rows.
 *
 * @return array<int, array<string, string>>
 */
function hperkins_tokens_get_council_work_items() {
	return array(
		array(
			'label'  => 'Flavor Agent',
			'url'    => '/work/flavor-agent/',
			'status' => 'Release candidate · v0.1.0-rc.1',
			'state'  => 'review',
		),
		array(
			'label'  => 'WordPress AI Stack Contributions',
			'url'    => '/work/upstream-core-ai-stack/',
			'status' => 'Merged · upstream',
			'state'  => 'done',
		),
		array(
			'label'  => 'AI Provider for Codex',
			'url'    => '/work/ai-provider-for-codex/',
			'status' => 'Shipped · v2.1',
			'state'  => 'done',
		),
		array(
			'label'  => 'DJ Lee & Voices of Judah',
			'url'    => '/work/dj-lee-voices-of-judah/',
			'status' => 'Delivered · live site',
			'state'  => 'done',
		),
	);
}

/**
 * Test whether a parsed block carries a CSS class token.
 *
 * @param array  $block      Parsed block.
 * @param string $class_name Class token.
 * @return bool
 */
function hperkins_tokens_council_block_has_class( $block, $class_name ) {
	$classes = isset( $block['attrs']['className'] ) ? (string) $block['attrs']['className'] : '';
	return in_array( $class_name, preg_split( '/\s+/', trim( $classes ) ), true );
}

/**
 * Find a parsed block by explicit class, including submenu descendants.
 *
 * @param array<int, array> $blocks     Parsed blocks.
 * @param string            $class_name Class token.
 * @return array|null
 */
function hperkins_tokens_council_find_block_by_class( $blocks, $class_name ) {
	foreach ( $blocks as $block ) {
		if ( hperkins_tokens_council_block_has_class( $block, $class_name ) ) {
			return $block;
		}

		if ( ! empty( $block['innerBlocks'] ) ) {
			$match = hperkins_tokens_council_find_block_by_class( $block['innerBlocks'], $class_name );
			if ( $match ) {
				return $match;
			}
		}
	}

	return null;
}

/**
 * Convert a navigation-link block into a small model item.
 *
 * @param array  $block Parsed navigation-link block.
 * @param string $key   Stable model key.
 * @return array<string, string>|null
 */
function hperkins_tokens_council_link_from_block( $block, $key ) {
	if ( ! $block || 'core/navigation-link' !== $block['blockName'] ) {
		return null;
	}

	$label = isset( $block['attrs']['label'] ) ? trim( (string) $block['attrs']['label'] ) : '';
	$url   = isset( $block['attrs']['url'] ) ? trim( (string) $block['attrs']['url'] ) : '';
	if ( '' === $label || '' === $url ) {
		return null;
	}

	return array(
		'key'   => $key,
		'label' => $label,
		'url'   => $url,
	);
}

/**
 * Read and validate the approved data shape from wp_navigation post 237.
 *
 * @return array<string, mixed>
 */
function hperkins_tokens_get_council_navigation_model() {
	$fallback = hperkins_tokens_get_council_navigation_fallback();
	$post     = get_post( 237 );
	if ( ! $post || 'wp_navigation' !== $post->post_type ) {
		return $fallback;
	}

	$blocks    = parse_blocks( (string) $post->post_content );
	$work      = hperkins_tokens_council_find_block_by_class( $blocks, 'hp-nav-work' );
	$writing   = hperkins_tokens_council_find_block_by_class( $blocks, 'hp-nav-writing' );
	$ai        = hperkins_tokens_council_find_block_by_class( $blocks, 'hp-nav-ai' );
	$essays    = hperkins_tokens_council_find_block_by_class( $blocks, 'hp-nav-essays' );
	$digest    = hperkins_tokens_council_find_block_by_class( $blocks, 'hp-nav-digest' );
	$search    = hperkins_tokens_council_find_block_by_class( $blocks, 'hp-drawer-search' );
	$subscribe = hperkins_tokens_council_find_block_by_class( $blocks, 'hp-nav-subscribe' );
	$about     = null;

	foreach ( $blocks as $block ) {
		if (
			'core/navigation-link' === $block['blockName'] &&
			isset( $block['attrs']['label'] ) &&
			'About' === trim( (string) $block['attrs']['label'] )
		) {
			$about = $block;
			break;
		}
	}

	$work_item      = hperkins_tokens_council_link_from_block( $work, 'work' );
	$about_item     = hperkins_tokens_council_link_from_block( $about, 'about' );
	$ai_item        = hperkins_tokens_council_link_from_block( $ai, 'ai' );
	$essays_item    = hperkins_tokens_council_link_from_block( $essays, 'essays' );
	$digest_item    = hperkins_tokens_council_link_from_block( $digest, 'digest' );
	$subscribe_item = hperkins_tokens_council_link_from_block( $subscribe, 'subscribe' );

	if (
		! $work_item || ! $about_item || ! $ai_item || ! $essays_item ||
		! $digest_item || ! $subscribe_item || ! $writing || ! $search ||
		'core/navigation-submenu' !== $writing['blockName'] ||
		'core/search' !== $search['blockName']
	) {
		return $fallback;
	}

	$writing_label = isset( $writing['attrs']['label'] ) ? trim( (string) $writing['attrs']['label'] ) : '';
	if ( '' === $writing_label ) {
		return $fallback;
	}

	return array(
		// The fallback carries labels and URLs identical to the DB model, so a
		// silent detach is invisible in the rendered markup without this. The
		// Chrome suite asserts it is 'navigation'.
		'source'    => 'navigation',
		'work'      => array(
			'label' => $work_item['label'],
			'url'   => $work_item['url'],
		),
		'writing'   => array(
			'label'    => $writing_label,
			'children' => array( $ai_item, $essays_item, $digest_item ),
		),
		'about'     => array(
			'label' => $about_item['label'],
			'url'   => $about_item['url'],
		),
		'search'    => array(
			'label'       => isset( $search['attrs']['label'] ) ? (string) $search['attrs']['label'] : 'Search',
			'placeholder' => isset( $search['attrs']['placeholder'] ) ? (string) $search['attrs']['placeholder'] : 'Search the journal',
		),
		'subscribe' => array(
			'label' => $subscribe_item['label'],
			'url'   => $subscribe_item['url'],
		),
	);
}

/**
 * Resolve a model destination at render time.
 *
 * @param string $value Stored URL.
 * @return string
 */
function hperkins_tokens_council_url( $value ) {
	$value = trim( (string) $value );
	if ( '' === $value ) {
		return home_url( '/' );
	}

	// A protocol-relative value names a host, so it must reach the host
	// comparison below. home_url() would strip the leading slashes and turn
	// //cdn.example.com/x into an on-host 404.
	if ( 0 === strpos( $value, '/' ) && 0 !== strpos( $value, '//' ) ) {
		return home_url( $value );
	}

	$url_parts  = wp_parse_url( $value );
	$home_parts = wp_parse_url( home_url( '/' ) );
	if (
		is_array( $url_parts ) && is_array( $home_parts ) &&
		isset( $url_parts['host'], $home_parts['host'] ) &&
		strtolower( $url_parts['host'] ) === strtolower( $home_parts['host'] ) &&
		( $url_parts['port'] ?? null ) === ( $home_parts['port'] ?? null )
	) {
		$path = isset( $url_parts['path'] ) ? $url_parts['path'] : '/';
		$path .= isset( $url_parts['query'] ) ? '?' . $url_parts['query'] : '';
		$path .= isset( $url_parts['fragment'] ) ? '#' . $url_parts['fragment'] : '';
		return home_url( $path );
	}

	return $value;
}

/**
 * Return the current request path, normalised with a trailing slash.
 *
 * The retired core Navigation block emitted aria-current and its current-menu
 * classes for free. This renderer owns its own markup, so it has to say where
 * the visitor is.
 *
 * @return string
 */
function hperkins_tokens_council_current_path() {
	$request = isset( $_SERVER['REQUEST_URI'] )
		? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) )
		: '/';
	$path    = (string) wp_parse_url( $request, PHP_URL_PATH );

	return '' === $path ? '/' : trailingslashit( $path );
}

/**
 * Return a model destination as a normalised path.
 *
 * @param string $url Stored URL.
 * @return string
 */
function hperkins_tokens_council_path( $url ) {
	$path = (string) wp_parse_url( hperkins_tokens_council_url( $url ), PHP_URL_PATH );

	return '' === $path ? '/' : trailingslashit( $path );
}

/**
 * Return the aria-current attribute for a destination the visitor is on.
 *
 * @param string $url          Stored URL.
 * @param string $current_path Normalised current request path.
 * @return string Literal attribute markup, or an empty string.
 */
function hperkins_tokens_council_current_attr( $url, $current_path ) {
	return hperkins_tokens_council_path( $url ) === $current_path ? ' aria-current="page"' : '';
}

/**
 * Test whether the visitor is on a destination or anywhere beneath it.
 *
 * @param string $url          Stored section URL.
 * @param string $current_path Normalised current request path.
 * @return bool
 */
function hperkins_tokens_council_in_section( $url, $current_path ) {
	$path = hperkins_tokens_council_path( $url );
	if ( '/' === $path ) {
		return '/' === $current_path;
	}

	return 0 === strpos( $current_path, $path );
}

/**
 * Return one Writing destination by key.
 *
 * @param array<string, mixed> $model Navigation model.
 * @param string               $key   Destination key.
 * @return array<string, string>
 */
function hperkins_tokens_council_writing_item( $model, $key ) {
	foreach ( $model['writing']['children'] as $item ) {
		if ( isset( $item['key'] ) && $key === $item['key'] ) {
			return $item;
		}
	}

	return array( 'key' => $key, 'label' => '', 'url' => '/' );
}

/**
 * Render the Council header.
 *
 * @return string
 */
function hperkins_tokens_render_council_header() {
	$model      = hperkins_tokens_get_council_navigation_model();
	$work_items = hperkins_tokens_get_council_work_items();
	$ai         = hperkins_tokens_council_writing_item( $model, 'ai' );
	$essays     = hperkins_tokens_council_writing_item( $model, 'essays' );
	$digest     = hperkins_tokens_council_writing_item( $model, 'digest' );
	$site_name  = get_bloginfo( 'name' );

	$here            = hperkins_tokens_council_current_path();
	$in_work         = hperkins_tokens_council_in_section( $model['work']['url'], $here );
	$in_writing      =
		hperkins_tokens_council_in_section( $ai['url'], $here ) ||
		hperkins_tokens_council_in_section( $essays['url'], $here ) ||
		hperkins_tokens_council_in_section( $digest['url'], $here );
	$work_item_class = $in_work ? ' is-current' : '';
	$writing_class   = $in_writing ? ' is-current' : '';

	ob_start();
	?>
	<div class="hp-council-header alignwide" data-hp-header-root data-hp-header-source="<?php echo esc_attr( $model['source'] ); ?>">
		<div class="hp-council-header__bar">
			<a class="hp-council-brand" href="<?php echo esc_url( home_url( '/' ) ); ?>">
				<span class="hp-council-brand__star" aria-hidden="true"><svg viewBox="0 0 100 100" fill="none" focusable="false"><g stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M50 6 L59 41 L94 50 L59 59 L50 94 L41 59 L6 50 L41 41 Z"></path><circle cx="50" cy="50" r="6" fill="currentColor" stroke="none"></circle></g></svg></span>
				<span class="hp-council-brand__name"><?php echo esc_html( $site_name ); ?></span>
			</a>

			<nav class="hp-council-nav" aria-label="<?php echo esc_attr__( 'Primary', 'hperkins-tokens' ); ?>">
				<ul class="hp-council-nav__list">
					<li class="hp-council-nav__item<?php echo esc_attr( $work_item_class ); ?>" data-hp-header-hover="work">
						<button id="hp-council-work-trigger" class="hp-council-nav__trigger" type="button" data-hp-header-trigger="work" aria-controls="hp-council-work-panel" aria-expanded="false">
							<span class="hp-council-nav__label"><?php echo esc_html( $model['work']['label'] ); ?></span>
							<svg class="hp-council-nav__chevron" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="m1.5 4 4.5 4 4.5-4"></path></svg>
						</button>
						<div id="hp-council-work-panel" class="hp-council-work-panel" data-hp-header-panel="work" aria-labelledby="hp-council-work-trigger" hidden>
							<div class="hp-council-work-panel__ledger">
								<?php foreach ( $work_items as $item ) : ?>
									<?php $state_class = 'review' === $item['state'] ? 'is-state-review' : 'is-state-done'; ?>
									<a class="hp-council-work-row <?php echo esc_attr( $state_class ); ?>" href="<?php echo esc_url( hperkins_tokens_council_url( $item['url'] ) ); ?>">
										<span class="hp-council-work-row__dot" aria-hidden="true"></span>
										<span class="hp-council-work-row__label"><?php echo esc_html( $item['label'] ); ?></span>
										<span class="hp-council-work-row__status"><?php echo esc_html( $item['status'] ); ?></span>
									</a>
								<?php endforeach; ?>
								<a class="hp-council-work-panel__all" href="<?php echo esc_url( hperkins_tokens_council_url( $model['work']['url'] ) ); ?>"<?php echo hperkins_tokens_council_current_attr( $model['work']['url'], $here ); ?>><?php echo esc_html__( 'View all work', 'hperkins-tokens' ); ?> <span aria-hidden="true">&rarr;</span></a>
							</div>
							<div class="hp-council-work-panel__evidence">
								<p class="hp-council-work-panel__eyebrow"><?php echo esc_html__( 'Featured evidence', 'hperkins-tokens' ); ?></p>
								<p class="hp-council-work-panel__title"><?php echo esc_html__( 'Trust is structural.', 'hperkins-tokens' ); ?></p>
								<p class="hp-council-work-panel__copy"><?php echo esc_html__( 'A selected artifact with a concise account of the decision, the constraint, and the shipped result.', 'hperkins-tokens' ); ?></p>
								<a class="hp-council-work-panel__case" href="<?php echo esc_url( home_url( '/work/flavor-agent/' ) ); ?>"><?php echo esc_html__( 'Open the case study', 'hperkins-tokens' ); ?> <span aria-hidden="true">&rarr;</span></a>
							</div>
						</div>
					</li>

					<li class="hp-council-nav__item hp-council-nav__item--writing<?php echo esc_attr( $writing_class ); ?>" data-hp-header-hover="writing">
						<button id="hp-council-writing-trigger" class="hp-council-nav__trigger" type="button" data-hp-header-trigger="writing" aria-controls="hp-council-writing-panel" aria-expanded="false" aria-label="<?php echo esc_attr( $model['writing']['label'] ); ?>">
							<span class="hp-council-nav__label"><?php echo esc_html( $model['writing']['label'] ); ?></span>
							<svg class="hp-council-nav__chevron" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="m1.5 4 4.5 4 4.5-4"></path></svg>
						</button>
						<span class="hp-council-digest-cue" aria-hidden="true"><?php echo esc_html__( 'Digest', 'hperkins-tokens' ); ?></span>
						<div id="hp-council-writing-panel" class="hp-council-writing-panel" data-hp-header-panel="writing" aria-labelledby="hp-council-writing-trigger" hidden>
							<a class="hp-council-writing-panel__link" href="<?php echo esc_url( hperkins_tokens_council_url( $ai['url'] ) ); ?>"<?php echo hperkins_tokens_council_current_attr( $ai['url'], $here ); ?>><?php echo esc_html( $ai['label'] ); ?></a>
							<a class="hp-council-writing-panel__link" href="<?php echo esc_url( hperkins_tokens_council_url( $essays['url'] ) ); ?>"<?php echo hperkins_tokens_council_current_attr( $essays['url'], $here ); ?>><?php echo esc_html( $essays['label'] ); ?></a>
							<a class="hp-council-writing-panel__link hp-council-writing-panel__link--digest" href="<?php echo esc_url( hperkins_tokens_council_url( $digest['url'] ) ); ?>"<?php echo hperkins_tokens_council_current_attr( $digest['url'], $here ); ?>><span><?php echo esc_html( $digest['label'] ); ?></span></a>
						</div>
					</li>

					<li class="hp-council-nav__item">
						<a class="hp-council-nav__link" href="<?php echo esc_url( hperkins_tokens_council_url( $model['about']['url'] ) ); ?>"<?php echo hperkins_tokens_council_current_attr( $model['about']['url'], $here ); ?>><span class="hp-council-nav__label"><?php echo esc_html( $model['about']['label'] ); ?></span></a>
					</li>
				</ul>
			</nav>

			<div class="hp-council-actions">
				<button id="hp-council-search-trigger" class="hp-council-search-trigger" type="button" data-hp-header-trigger="search" aria-controls="hp-council-search-panel" aria-expanded="false" aria-label="<?php echo esc_attr( $model['search']['label'] ); ?>">
					<span class="hp-council-search-trigger__disc"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.4 15.4 4.1 4.1"></path></svg></span>
				</button>
				<a class="hp-council-subscribe" href="<?php echo esc_url( hperkins_tokens_council_url( $model['subscribe']['url'] ) ); ?>"><?php echo esc_html( $model['subscribe']['label'] ); ?></a>
				<button class="hp-council-drawer-trigger" type="button" data-hp-header-trigger="drawer" aria-controls="hp-council-drawer" aria-expanded="false" aria-label="<?php echo esc_attr__( 'Toggle navigation', 'hperkins-tokens' ); ?>">
					<span class="hp-council-drawer-trigger__control">
						<svg class="hp-council-drawer-trigger__open" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>
						<svg class="hp-council-drawer-trigger__close" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"></path></svg>
					</span>
				</button>
				<div id="hp-council-search-panel" class="hp-council-search-panel" data-hp-header-panel="search" aria-labelledby="hp-council-search-trigger" hidden>
					<form class="hp-council-search-form" role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>">
						<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.4 15.4 4.1 4.1"></path></svg>
						<label class="screen-reader-text" for="hp-council-search-input"><?php echo esc_html( $model['search']['label'] ); ?></label>
						<input id="hp-council-search-input" type="search" name="s" placeholder="<?php echo esc_attr( $model['search']['placeholder'] ); ?>">
						<kbd><?php echo esc_html__( 'esc', 'hperkins-tokens' ); ?></kbd>
					</form>
				</div>
			</div>
		</div>

		<div id="hp-council-drawer" class="hp-council-drawer" data-hp-header-panel="drawer" aria-labelledby="hp-council-drawer-legend" hidden>
			<div class="hp-council-drawer__body">
				<p id="hp-council-drawer-legend" class="hp-council-drawer__legend"><?php echo esc_html__( 'Sections', 'hperkins-tokens' ); ?></p>
				<nav aria-label="<?php echo esc_attr__( 'Mobile', 'hperkins-tokens' ); ?>">
					<ul class="hp-council-drawer__list">
						<li><a href="<?php echo esc_url( hperkins_tokens_council_url( $model['work']['url'] ) ); ?>"<?php echo hperkins_tokens_council_current_attr( $model['work']['url'], $here ); ?>><?php echo esc_html( $model['work']['label'] ); ?></a></li>
						<li><a href="<?php echo esc_url( hperkins_tokens_council_url( $essays['url'] ) ); ?>"<?php echo hperkins_tokens_council_current_attr( $essays['url'], $here ); ?>><?php echo esc_html( $essays['label'] ); ?></a></li>
						<li><a href="<?php echo esc_url( hperkins_tokens_council_url( $ai['url'] ) ); ?>"<?php echo hperkins_tokens_council_current_attr( $ai['url'], $here ); ?>><?php echo esc_html( $ai['label'] ); ?></a></li>
						<li><a href="<?php echo esc_url( hperkins_tokens_council_url( $model['about']['url'] ) ); ?>"<?php echo hperkins_tokens_council_current_attr( $model['about']['url'], $here ); ?>><?php echo esc_html( $model['about']['label'] ); ?></a></li>
						<li class="hp-council-drawer__digest"><a href="<?php echo esc_url( hperkins_tokens_council_url( $digest['url'] ) ); ?>"<?php echo hperkins_tokens_council_current_attr( $digest['url'], $here ); ?>><span><?php echo esc_html( $digest['label'] ); ?></span></a></li>
					</ul>
				</nav>
				<form class="hp-council-drawer__search" role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>">
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.4 15.4 4.1 4.1"></path></svg>
					<label class="screen-reader-text" for="hp-council-drawer-search-input"><?php echo esc_html( $model['search']['label'] ); ?></label>
					<input id="hp-council-drawer-search-input" type="search" name="s" placeholder="<?php echo esc_attr( $model['search']['placeholder'] ); ?>">
				</form>
				<a class="hp-council-drawer__subscribe" href="<?php echo esc_url( hperkins_tokens_council_url( $model['subscribe']['url'] ) ); ?>"><?php echo esc_html( $model['subscribe']['label'] ); ?></a>
			</div>
		</div>

		<noscript>
			<nav class="hp-council-noscript" aria-label="<?php echo esc_attr__( 'Primary navigation without JavaScript', 'hperkins-tokens' ); ?>">
				<a href="<?php echo esc_url( hperkins_tokens_council_url( $model['work']['url'] ) ); ?>"><?php echo esc_html( $model['work']['label'] ); ?></a>
				<a href="<?php echo esc_url( hperkins_tokens_council_url( $essays['url'] ) ); ?>"><?php echo esc_html( $essays['label'] ); ?></a>
				<a href="<?php echo esc_url( hperkins_tokens_council_url( $ai['url'] ) ); ?>"><?php echo esc_html( $ai['label'] ); ?></a>
				<a href="<?php echo esc_url( hperkins_tokens_council_url( $model['about']['url'] ) ); ?>"><?php echo esc_html( $model['about']['label'] ); ?></a>
				<a href="<?php echo esc_url( hperkins_tokens_council_url( $digest['url'] ) ); ?>"><?php echo esc_html( $digest['label'] ); ?></a>
				<a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"><?php echo esc_html__( 'Contact', 'hperkins-tokens' ); ?></a>
				<a href="<?php echo esc_url( hperkins_tokens_council_url( $model['subscribe']['url'] ) ); ?>"><?php echo esc_html( $model['subscribe']['label'] ); ?></a>
			</nav>
		</noscript>
	</div>
	<?php
	$html         = (string) ob_get_clean();
	$compact_html = preg_replace( '/>\s+</', '><', $html );

	return null === $compact_html ? $html : $compact_html;
}

add_shortcode( 'hperkins_council_header', 'hperkins_tokens_render_council_header' );

/**
 * Render the dedicated Council shortcode block before core applies wpautop().
 *
 * The Shortcode block wraps its inner content in paragraphs before the normal
 * shortcode pass. Returning this one known renderer at the block boundary keeps
 * its semantic HTML intact without changing any other shortcode block.
 *
 * @param string|null $pre_render   Short-circuit value from an earlier filter.
 * @param array       $parsed_block Parsed block data.
 * @return string|null
 */
function hperkins_tokens_pre_render_council_header_block( $pre_render, $parsed_block ) {
	if ( null !== $pre_render ) {
		return $pre_render;
	}

	if (
		! isset( $parsed_block['blockName'], $parsed_block['innerHTML'] ) ||
		'core/shortcode' !== $parsed_block['blockName']
	) {
		return $pre_render;
	}

	$inner_html          = trim( (string) $parsed_block['innerHTML'] );
	$is_shortcode_marker = '[hperkins_council_header]' === $inner_html;
	$is_rendered_header  =
		0 === strpos( $inner_html, '<div class="hp-council-header alignwide" data-hp-header-root' ) &&
		1 === substr_count( $inner_html, 'data-hp-header-root' );
	if ( ! $is_shortcode_marker && ! $is_rendered_header ) {
		return $pre_render;
	}

	// Both branches re-render. A block that already holds rendered header HTML
	// is only a signal that the block is ours — echoing it back would serve a
	// frozen site name, a frozen menu-237 model, and frozen URLs, and no edit to
	// this file would reach the page.
	return hperkins_tokens_render_council_header();
}
add_filter( 'pre_render_block', 'hperkins_tokens_pre_render_council_header_block', 10, 2 );
