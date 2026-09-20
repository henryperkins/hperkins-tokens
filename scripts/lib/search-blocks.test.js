const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { spawnSync } = require( 'node:child_process' );

const root = path.join( __dirname, '..', '..' );
const policyPath = path.join( root, 'inc', 'search.php' ).replaceAll( '\\', '/' );
const modulePath = path.join( root, 'assets', 'js', 'search-blocks.js' );
const markup = '<div class="wp-block-jetpack-search-results-list" data-wp-interactive="jetpack-search"><ul><template data-wp-each--result="state.results" data-wp-each-key="context.result.id"><li><a data-wp-bind--href="context.result.permalink">Result</a></li></template><template data-wp-each--piece="context.result.titlePieces"><span data-wp-text="context.piece.text"></span></template></ul></div>';

function phpPolicy( input = {} ) {
	const fixture = { plugin: true, beta: true, style: true, moduleApi: true, markup, ...input };
	const encoded = Buffer.from( JSON.stringify( fixture ) ).toString( 'base64' );
	const php = `
		define( 'ABSPATH', __DIR__ . '/' );
		$fixture = json_decode( base64_decode( '${ encoded }' ), true );
		$hooks = array(); $scripts = array(); $modules = array(); $state = array(); $inline = array(); $dequeued = array();
		if ( $fixture['plugin'] ) {
			eval( 'namespace Automattic\\Jetpack\\Search; class Search_Blocks { public static function is_block_template_overlay_enabled() { return $GLOBALS["fixture"]["beta"]; } }' );
		}
		function add_filter( $hook, $callback, $priority = 10, $accepted = 1 ) { $GLOBALS['hooks'][$hook][$priority][] = $callback; }
		function add_action( $hook, $callback, $priority = 10, $accepted = 1 ) { add_filter( $hook, $callback, $priority, $accepted ); }
		function apply_filters( $hook, $value, ...$args ) {
			$groups = $GLOBALS['hooks'][$hook] ?? array(); ksort( $groups );
			foreach ( $groups as $callbacks ) foreach ( $callbacks as $callback ) $value = $callback( $value, ...$args );
			return $value;
		}
		function wp_style_is( $handle, $status = 'enqueued' ) { return 'jetpack-search-block-overlay' === $handle && $GLOBALS['fixture']['style']; }
		function wp_script_is( $handle, $status = 'enqueued' ) { return 'jetpack-instant-search' === $handle && ! empty( $GLOBALS['fixture']['legacy'] ); }
		function wp_scripts() { static $scripts; if ( ! $scripts ) $scripts = (object) array( 'registered' => array( 'jetpack-instant-search' => (object) array( 'deps' => array( 'wp-i18n' ) ) ) ); return $scripts; }
		function wp_enqueue_script( $id, $src = '', $deps = array(), $version = false, $args = array() ) { $GLOBALS['scripts'][$id] = compact( 'src', 'deps', 'version', 'args' ); }
		function wp_add_inline_script( $id, $data, $position = 'after' ) { $GLOBALS['inline'][$id][] = compact( 'data', 'position' ); }
		if ( $fixture['moduleApi'] ) {
			function wp_dequeue_script_module( $id ) { $GLOBALS['dequeued'][] = $id; }
			function wp_register_script_module( $id, $src, $deps = array(), $version = false ) { $GLOBALS['modules'][$id] = compact( 'src', 'deps', 'version' ); }
			function wp_enqueue_script_module( $id, $src = '', $deps = array(), $version = false ) {
				if ( $src ) wp_register_script_module( $id, $src, $deps, $version );
				$GLOBALS['modules'][$id]['enqueued'] = true;
			}
		}
		function wp_interactivity_state( $namespace, $value = array() ) { $GLOBALS['state'][$namespace] = array_merge( $GLOBALS['state'][$namespace] ?? array(), $value ); return $GLOBALS['state'][$namespace]; }
		function get_stylesheet_directory() { return $GLOBALS['fixture']['themeRoot'] ?? '${ root.replaceAll( '\\', '/' ).replaceAll( "'", "\\'" ) }'; }
		function get_stylesheet_directory_uri() { return 'https://example.test/theme'; }
		function home_url( $path = '/' ) { return 'https://example.test' . $path; }
		function __( $text, $domain = '' ) { return $text; }
		function wp_json_encode( $value, $flags = 0 ) { return json_encode( $value, $flags ); }
		function is_admin() { return false; }
		require '${ root.replaceAll( '\\', '/' ).replaceAll( "'", "\\'" ) }/scripts/fixtures/search/html-tag-processor.php';
		require '${ policyPath.replaceAll( "'", "\\'" ) }';
		$has_enqueue = function_exists( 'hperkins_tokens_search_enqueue_assets' );
		if ( $has_enqueue ) hperkins_tokens_search_enqueue_assets();
		$rendered = apply_filters( 'render_block_jetpack-search/results-list', $fixture['markup'], array( 'blockName' => 'jetpack-search/results-list' ), null );
		echo json_encode( array( 'hasEnqueue' => $has_enqueue, 'scripts' => $scripts, 'modules' => $modules, 'state' => $state, 'rendered' => $rendered, 'inline' => $inline, 'dequeued' => $dequeued, 'legacyDeps' => wp_scripts()->registered['jetpack-instant-search']->deps ) );
	`;
	const result = spawnSync( process.env.HPERKINS_PHP_BIN || 'php', [ '-r', php ], { cwd: root, encoding: 'utf8' } );
	assert.equal( result.status, 0, result.stderr || result.error?.message );
	return JSON.parse( result.stdout );
}

function derivedState( initial, update, lifecycle = {} ) {
	assert( fs.existsSync( modulePath ), 'The beta Search script module is missing.' );
	const runner = `
		const fs = require('node:fs'); const vm = require('node:vm');
		const input = JSON.parse(fs.readFileSync(0,'utf8'));
		const state = JSON.parse(JSON.stringify(input.initial));
		const original = JSON.parse(JSON.stringify(state.results || []));
		const store = (name, extension = {}) => {
			if (name !== 'jetpack-search') throw new Error('Unexpected store: ' + name);
			if (extension.state) Object.defineProperties(state, Object.getOwnPropertyDescriptors(extension.state));
			return {state};
		};
		const document = new EventTarget(); document.readyState = input.lifecycle.readyState || 'loading';
		const navigation = {domContentLoadedEventStart:input.lifecycle.dclStart || 0};
		const performance = {getEntriesByType:()=>[navigation]};
		const imports = [];
		const context = vm.createContext({URL, URLSearchParams, console, document, performance, window:{document,performance,location:{href:'https://preview.test/',origin:'https://preview.test',protocol:'https:',hostname:'preview.test'},hpSearchConfig:{homeUrl:'https://preview.test/'}}});
		const api = new vm.SyntheticModule(['store'],function(){this.setExport('store',store);},{context});
		const plugin = new vm.SyntheticModule([],function(){},{context});
		const bootstrap = new vm.SyntheticModule([],function(){},{context});
		(async()=>{
			const module = new vm.SourceTextModule(fs.readFileSync(input.file,'utf8'),{context,identifier:input.file,importModuleDynamically:async(specifier)=>{
				if(specifier!=='jetpack-search/overlay-bootstrap')throw new Error('Unexpected dynamic import: '+specifier);
				imports.push({specifier,dclStart:navigation.domContentLoadedEventStart,readyState:document.readyState,getterReady:typeof Object.getOwnPropertyDescriptor(state,'hperkinsSearchResults')?.get==='function'});
				if(bootstrap.status==='unlinked')await bootstrap.link(()=>{});
				await bootstrap.evaluate();return bootstrap;
			}});
			await module.link(specifier=>{if(specifier==='@wordpress/interactivity')return api;if(specifier==='jetpack-search/store')return plugin;throw new Error('Unexpected import: '+specifier);});
			await module.evaluate();
			await new Promise(setImmediate);
			const before = imports.length;
			if(input.lifecycle.dispatchDCL){
				navigation.domContentLoadedEventStart=20;document.readyState='interactive';
				document.dispatchEvent(new Event('DOMContentLoaded'));
				await new Promise(setImmediate);
				document.dispatchEvent(new Event('DOMContentLoaded'));
				await new Promise(setImmediate);
			}
			const first={results:state.hperkinsSearchResults,state:state.hperkinsSearchState};
			const untouched=JSON.stringify(state.results || [])===JSON.stringify(original);
			if(input.update)Object.assign(state,input.update);
			process.stdout.write(JSON.stringify({first,untouched,next:{results:state.hperkinsSearchResults,state:state.hperkinsSearchState},bootstrap:{before,after:imports.length,imports}}));
		})().catch(error=>{console.error(error);process.exitCode=1;});
	`;
	const result = spawnSync( process.execPath, [ '--experimental-vm-modules', '-e', runner ], {
		cwd: root, encoding: 'utf8', input: JSON.stringify( { file: modulePath, initial, update, lifecycle } ),
	} );
	assert.equal( result.status, 0, result.stderr || result.error?.message );
	return JSON.parse( result.stdout );
}

test( 'beta enqueue uses actual renderer availability and public module dependencies', () => {
	const observed = phpPolicy();
	assert( observed.hasEnqueue, 'Search enqueue boundary is missing.' );
	const module = observed.modules[ 'hperkins-tokens/search-blocks' ];
	assert( module?.enqueued, 'Beta module was not enqueued.' );
	const ids = module.deps.map( ( dep ) => typeof dep === 'string' ? dep : dep.id );
	assert( ids.includes( '@wordpress/interactivity' ) );
	assert( ids.includes( 'jetpack-search/store' ) );
	assert( module.src.endsWith( '/assets/js/search-blocks.js' ) );
	assert( observed.scripts[ 'hperkins-search-enhance' ], 'Delegated search adapter must also load for beta.' );
} );

test( 'beta bootstrap stays registered as a dynamic dependency and is removed from the eager queue', () => {
	const observed = phpPolicy();
	assert.deepEqual( observed.dequeued, [ 'jetpack-search/overlay-bootstrap' ] );
	assert.deepEqual(
		observed.modules[ 'hperkins-tokens/search-blocks' ].deps.find( ( dep ) => dep.id === 'jetpack-search/overlay-bootstrap' ),
		{ id: 'jetpack-search/overlay-bootstrap', import: 'dynamic' }
	);
	for ( const fixture of [ { beta: false, legacy: true }, { plugin: false }, { style: false }, { moduleApi: false } ] ) {
		assert.deepEqual( phpPolicy( fixture ).dequeued, [], 'Do not take over bootstrap outside the active beta renderer.' );
	}
} );

test( 'missing theme module leaves the plugin bootstrap queue intact', () => {
	const os = require( 'node:os' );
	const temporary = fs.mkdtempSync( path.join( os.tmpdir(), 'hp-search-missing-module-' ) );
	try {
		fs.mkdirSync( path.join( temporary, 'assets/js' ), { recursive: true } );
		fs.writeFileSync( path.join( temporary, 'assets/js/search-enhance.js' ), '// Test adapter exists, beta module does not.\n' );
		const observed = phpPolicy( { themeRoot: temporary.replaceAll( '\\', '/' ) } );
		assert( observed.scripts[ 'hperkins-search-enhance' ], 'This case must reach the module availability check.' );
		assert.deepEqual( observed.dequeued, [] );
		assert.equal( observed.modules[ 'hperkins-tokens/search-blocks' ], undefined );
	} finally {
		assert.equal( path.dirname( path.resolve( temporary ) ), path.resolve( os.tmpdir() ) );
		assert( path.basename( temporary ).startsWith( 'hp-search-missing-module-' ) );
		fs.rmSync( temporary, { recursive: true, force: true } );
	}
} );

test( 'bootstrap waits for actual DOMContentLoaded even while the document is interactive', () => {
	for ( const readyState of [ 'loading', 'interactive' ] ) {
		const { bootstrap } = derivedState( { results: [], searchQuery: '', totalResults: 0 }, undefined, { readyState, dclStart: 0, dispatchDCL: true } );
		assert.equal( bootstrap.before, 0, 'Interactive readyState alone must not start overlay hydration.' );
		assert.equal( bootstrap.after, 1, 'Start the registered bootstrap exactly once after DOMContentLoaded.' );
		assert.equal( bootstrap.imports[ 0 ].dclStart, 20 );
		assert( bootstrap.imports[ 0 ].getterReady, 'The result getter must be registered before bootstrap starts.' );
	}
} );

test( 'bootstrap starts immediately when DOMContentLoaded already fired or the document is complete', () => {
	for ( const lifecycle of [ { readyState: 'interactive', dclStart: 12 }, { readyState: 'complete', dclStart: 0 } ] ) {
		const { bootstrap } = derivedState( { results: [], searchQuery: '', totalResults: 0 }, undefined, { ...lifecycle, dispatchDCL: true } );
		assert.equal( bootstrap.before, 1 );
		assert.equal( bootstrap.after, 1 );
		assert( bootstrap.imports[ 0 ].getterReady );
	}
} );

test( 'beta off, absent plugin/assets, and unavailable module API leave beta markup untouched', () => {
	for ( const fixture of [ { beta: false }, { plugin: false }, { style: false }, { moduleApi: false } ] ) {
		const observed = phpPolicy( fixture );
		assert.equal( observed.rendered, markup );
		assert.equal( observed.modules[ 'hperkins-tokens/search-blocks' ], undefined );
	}
} );

test( 'legacy search keeps its adapter dependency without loading the beta module', () => {
	const observed = phpPolicy( { beta: false, style: false, legacy: true } );
	assert( observed.scripts[ 'hperkins-search-enhance' ], 'Legacy adapter was dropped.' );
	assert( observed.legacyDeps.includes( 'hperkins-search-enhance' ) );
	assert.equal( observed.modules[ 'hperkins-tokens/search-blocks' ], undefined );
} );

test( 'result filter changes only the result iteration and seeds a safe pre-module state', () => {
	const observed = phpPolicy();
	assert.match( observed.rendered, /data-wp-each--result="state\.hperkinsSearchResults"/ );
	assert.match( observed.rendered, /data-wp-each-key="context\.result\.id"/ );
	assert.match( observed.rendered, /data-wp-each--piece="context\.result\.titlePieces"/ );
	assert.match( observed.rendered, /data-wp-bind--href="context\.result\.permalink"/ );
	assert.match( observed.rendered, /data-wp-bind--data-hp-search-state="state\.hperkinsSearchState"/ );
	assert.match( observed.rendered, /data-hp-search-state="loading"/ );
	assert.deepEqual( observed.state[ 'jetpack-search' ]?.hperkinsSearchResults, [] );
	assert.equal( phpPolicy( { markup: '<div>Unrelated results content</div>' } ).rendered, '<div>Unrelated results content</div>' );
} );

test( 'derived results repair malformed images and placeholder authors before binding without mutating plugin results', () => {
	const result = {
		id: '42', index: 2, title: 'AI Governance', permalink: '//hperkins.blog/work/flavor-agent/ai-governance/',
		imageUrl: 'https://i0.wp.com/wp-content/uploads/example.png?ssl=1&resize=600%2C600',
		imageBackgroundImage: 'url(old)', authorLabel: 'User 0', dateLabel: 'June 20, 2026',
		titlePieces: [ { text: 'AI', isHighlight: true } ], rating: 4.5, formattedPrice: '$50', railcar: { id: 'public-result' },
	};
	const observed = derivedState( { results: [ result ], searchQuery: 'AI', totalResults: 1 } );
	const image = 'https://i0.wp.com/hperkins.blog/wp-content/uploads/example.png?ssl=1&resize=600%2C600';
	assert.equal( observed.first.results.length, 1 );
	const { imageBackgroundImage, ...record } = observed.first.results[ 0 ];
	const { imageBackgroundImage: previousBackground, ...original } = result;
	assert.deepEqual( record, { ...original, imageUrl: image, authorLabel: '' } );
	assert.equal( imageBackgroundImage.replace( /^url\((["']?)(.*?)\1\)$/, '$2' ), image, 'The product background must use the same repaired image URL.' );
	assert( observed.untouched, 'Derived presentation must not mutate Jetpack results.' );
} );

test( 'derived results preserve real metadata and follow later result updates', () => {
	const valid = { id: 'a', permalink: '//other.example/story/', imageUrl: 'https://images.example/photo.webp?size=20', imageBackgroundImage: 'url(https://images.example/photo.webp?size=20)', authorLabel: 'Henry', title: 'A' };
	const next = { id: 'b', permalink: '//other.example/story/', imageUrl: '/wp-content/uploads/photo.png', imageBackgroundImage: '', authorLabel: '李明', title: 'B' };
	const observed = derivedState( { results: [ valid ], searchQuery: 'A', totalResults: 1 }, { results: [ next ] } );
	assert.deepEqual( observed.first.results, [ valid ] );
	assert.equal( observed.next.results[ 0 ].imageUrl, 'https://other.example/wp-content/uploads/photo.png' );
	assert.equal( observed.next.results[ 0 ].authorLabel, '李明' );
	assert.equal( observed.next.results[ 0 ].id, 'b' );
} );

test( 'derived state separates errors, loading, empty input, filtered empty results, and results', () => {
	for ( const [ state, expected ] of [
		[ { hasError: true, isLoading: true, searchQuery: '', totalResults: 0 }, 'error' ],
		[ { isLoading: true, searchQuery: 'pending', totalResults: 0 }, 'loading' ],
		[ { searchQuery: '  ', hasActiveFilters: false, totalResults: 24 }, 'empty' ],
		[ { searchQuery: '', hasActiveFilters: true, totalResults: 0 }, 'no-results' ],
		[ { searchQuery: 'missing', totalResults: 0 }, 'no-results' ],
		[ { searchQuery: 'found', totalResults: 2 }, 'results' ],
	] ) {
		assert.equal( derivedState( { results: [], ...state } ).first.state, expected );
	}
} );
