const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const path = require( 'node:path' );
const { spawnSync } = require( 'node:child_process' );

const root = path.join( __dirname, '..', '..' );
const policyPath = path.join( root, 'inc', 'search.php' ).replaceAll( '\\', '/' );

function exercisePolicy( fixture = {} ) {
	const encoded = Buffer.from( JSON.stringify( fixture ) ).toString( 'base64' );
	const phpPath = policyPath.replaceAll( '\\', '\\\\' ).replaceAll( "'", "\\'" );
	const php = `
		define( 'ABSPATH', __DIR__ . '/' );
		define( 'OBJECT', 'OBJECT' );
		$fixture = json_decode( base64_decode( '${ encoded }' ), true );
		$hooks = array();
		function add_filter( $hook, $callback, $priority = 10, $accepted_args = 1 ) {
			$GLOBALS['hooks'][ $hook ][ $priority ][] = array( $callback, $accepted_args );
		}
		function add_action( $hook, $callback, $priority = 10, $accepted_args = 1 ) {
			add_filter( $hook, $callback, $priority, $accepted_args );
		}
		function apply_filters( $hook, $value, ...$args ) {
			$priorities = $GLOBALS['hooks'][ $hook ] ?? array();
			ksort( $priorities );
			foreach ( $priorities as $callbacks ) {
				foreach ( $callbacks as $entry ) {
					$value = call_user_func_array( $entry[0], array_slice( array_merge( array( $value ), $args ), 0, $entry[1] ) );
				}
			}
			return $value;
		}
		function get_option( $name, $default = false ) { return $GLOBALS['fixture']['options'][ $name ] ?? $default; }
		function get_post( $id ) {
			foreach ( $GLOBALS['fixture']['pages'] ?? array() as $page ) {
				if ( (int) $page['ID'] === (int) $id ) { return (object) $page; }
			}
			return null;
		}
		function get_page_by_path( $path, $output = OBJECT, $post_type = 'page' ) {
			if ( OBJECT !== $output || 'page' !== $post_type ) { throw new Exception( 'Page resolution must be limited to pages.' ); }
			$page = $GLOBALS['fixture']['pages'][ $path ] ?? null;
			return $page && 'page' === $page['post_type'] ? (object) $page : null;
		}
		function wp_get_global_settings( $path = array() ) {
			if ( array( 'color', 'palette', 'theme' ) !== $path ) { throw new Exception( 'Read the theme palette through its public path.' ); }
			return $GLOBALS['fixture']['palette'] ?? array();
		}
		function sanitize_hex_color( $color ) { return preg_match( '/^#(?:[a-f0-9]{3}){1,2}$/i', $color ) ? $color : null; }
		function home_url( $path = '/' ) { return rtrim( $GLOBALS['fixture']['homeUrl'] ?? 'https://example.test', '/' ) . '/' . ltrim( $path, '/' ); }
		function __( $text, $domain ) {
			if ( 'hperkins-tokens' !== $domain ) { throw new Exception( 'Use the theme translation domain.' ); }
			return ! empty( $GLOBALS['fixture']['translate'] ) ? '[translated] ' . $text : $text;
		}
		function is_admin() { return ! empty( $GLOBALS['fixture']['admin'] ); }
		function __return_false() { return false; }
		class WP_Query {
			public $query_vars;
			private $main;
			private $search;
			public function __construct( $data ) { $this->query_vars = $data['vars'] ?? array(); $this->main = $data['main'] ?? true; $this->search = $data['search'] ?? true; }
			public function is_main_query() { return $this->main; }
			public function is_search() { return $this->search; }
			public function get( $name, $default = '' ) { return $this->query_vars[ $name ] ?? $default; }
			public function set( $name, $value ) { $this->query_vars[ $name ] = $value; }
		}
		if ( is_file( '${ phpPath }' ) ) { require '${ phpPath }'; }
		$query = new WP_Query( $fixture['query'] ?? array() );
		apply_filters( 'pre_get_posts', $query );
		echo json_encode( array(
			'aiEnabled' => apply_filters( 'jetpack_search_ai_answers_enabled', true ),
			'options' => apply_filters( 'jetpack_instant_search_options', $fixture['searchOptions'] ?? array() ),
			'query' => $query->query_vars,
			'clientConfig' => function_exists( 'hperkins_tokens_search_client_config' ) ? hperkins_tokens_search_client_config() : null,
		) );
	`;
	const result = spawnSync( process.env.HPERKINS_PHP_BIN || 'php', [ '-r', php ], { cwd: root, encoding: 'utf8' } );
	assert.equal( result.status, 0, result.stderr || result.error?.message );
	return JSON.parse( result.stdout );
}

const pages = {
	'bag': { ID: 501, post_type: 'page' },
	'cart': { ID: 91, post_type: 'page' },
	'checkout': { ID: 92, post_type: 'page' },
	'my-account': { ID: 93, post_type: 'page' },
	'review-order': { ID: 94, post_type: 'page' },
	'contact2': { ID: 95, post_type: 'page' },
	'privacy-policy': { ID: 3, post_type: 'page' },
	'product': { ID: 503, post_type: 'product' },
};
const options = {
	woocommerce_cart_page_id: 501,
	woocommerce_checkout_page_id: -1,
	woocommerce_myaccount_page_id: 503,
};

test( 'disables optional AI answers without changing the global AI feature or search settings', () => {
	const searchOptions = { aiAnswersEnabled: true, aiMasterEnabled: true, postsPerPage: 10, overlayOptions: { defaultSort: 'relevance', enableSort: true } };
	const observed = exercisePolicy( { searchOptions } );
	assert.equal( observed.aiEnabled, false );
	assert.deepEqual( observed.options, { ...searchOptions, aiAnswersEnabled: false } );
} );

test( 'derives matching-term highlights from the current theme palette and preserves overlay settings', () => {
	const observed = exercisePolicy( { palette: [ { slug: 'gold-100', color: '#AACCAA' } ], searchOptions: { overlayOptions: { highlightColor: '#f78da7', enableSort: true, resultFormat: 'expanded' } } } );
	assert.deepEqual( observed.options.overlayOptions, { highlightColor: '#AACCAA', enableSort: true, resultFormat: 'expanded' } );
	const noToken = exercisePolicy( { palette: [ { slug: 'gold-100', color: 'var(--missing)' } ], searchOptions: { overlayOptions: { highlightColor: '#abc' } } } );
	assert.equal( noToken.options.overlayOptions.highlightColor, '#abc' );
} );

test( 'excludes resolved utility pages without excluding products or legitimate public pages', () => {
	const observed = exercisePolicy( { pages, options } );
	assert.deepEqual( observed.options.adminQueryFilter, { bool: { must_not: [ { terms: { post_id: [ 501, 92, 93, 94, 95 ] } } ] } } );
	assert.deepEqual( observed.query.post__not_in, [ 501, 92, 93, 94, 95 ] );
} );

test( 'composes exclusions with existing query restrictions and leaves facets and products configured', () => {
	const prior = { bool: { should: [ { term: { post_type: 'post' } }, { term: { post_type: 'product' } } ], minimum_should_match: 1 } };
	const searchOptions = { adminQueryFilter: prior, staticFilters: [ { filter_id: 'kind', values: [ 'post', 'product' ] } ], overlayOptions: { excludedPostTypes: [ 'attachment' ] }, customResults: [ { pattern: 'resume', ids: [ 6 ] } ] };
	const observed = exercisePolicy( { pages, options, searchOptions } );
	assert.deepEqual( observed.options.adminQueryFilter, { bool: { must: [ prior ], must_not: [ { terms: { post_id: [ 501, 92, 93, 94, 95 ] } } ] } } );
	assert.deepEqual( observed.options.staticFilters, searchOptions.staticFilters );
	assert.deepEqual( observed.options.overlayOptions, searchOptions.overlayOptions );
	assert.deepEqual( observed.options.customResults, searchOptions.customResults );
} );

test( 'does not fabricate exclusions when pages and commerce are absent', () => {
	const prior = { term: { post_type: 'product' } };
	const observed = exercisePolicy( { options: { woocommerce_cart_page_id: -1 }, searchOptions: { adminQueryFilter: prior } } );
	assert.deepEqual( observed.options.adminQueryFilter, prior );
	assert.equal( observed.query.post__not_in, undefined );
} );

test( 'native main search preserves existing exclusions while other queries stay unchanged', () => {
	const query = { vars: { s: 'resume', post__not_in: [ 77, 92 ] } };
	const observed = exercisePolicy( { pages, options, query } );
	assert.deepEqual( observed.query, { s: 'resume', post__not_in: [ 77, 92, 501, 93, 94, 95 ] } );
	for ( const fixture of [ { admin: true, query }, { query: { ...query, main: false } }, { query: { ...query, search: false } } ] ) {
		assert.deepEqual( exercisePolicy( { pages, options, ...fixture } ).query, query.vars );
	}
} );

test( 'client recovery links use the current WordPress origin and labels can be translated', () => {
	const config = exercisePolicy( { homeUrl: 'https://example.test/subsite', translate: true } ).clientConfig;
	assert.ok( config, 'Search client configuration is missing.' );
	assert.equal( config.homeUrl, 'https://example.test/subsite/' );
	assert.deepEqual( config.recoveryLinks, [
		{ label: '[translated] Work', url: 'https://example.test/subsite/work/' },
		{ label: '[translated] Essays', url: 'https://example.test/subsite/essays/' },
		{ label: '[translated] About', url: 'https://example.test/subsite/about/' },
	] );
	assert.deepEqual( config.strings, {
		emptyTitle: '[translated] Search the site',
		emptyText: '[translated] Find projects, essays, and background.',
		noResultsTitle: '[translated] No matching pages',
		noResultsText: '[translated] Try a broader term, or browse one of these sections.',
		filterClose: '[translated] Back to results',
		searchLabel: '[translated] Search the site',
		clearLabel: '[translated] Clear search',
	} );
} );
