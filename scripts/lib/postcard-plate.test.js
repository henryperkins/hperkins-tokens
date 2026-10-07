const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const path = require( 'node:path' );
const { spawnSync } = require( 'node:child_process' );

const root = path.join( __dirname, '..', '..' );
const filterPath = path.join( root, 'inc', 'postcards.php' ).replaceAll( '\\', '/' );
const PLATE = '<span class="hp-postcard__plate" aria-hidden="true"></span>';

// Runs inc/postcards.php under a minimal WordPress shim and passes each
// scenario's rendered markup and parsed block through the registered filter.
function renderScenarios( scenarios ) {
	const encoded = Buffer.from( JSON.stringify( scenarios ) ).toString( 'base64' );
	const phpPath = filterPath.replaceAll( '\\', '\\\\' ).replaceAll( "'", "\\'" );
	const php = `
		define( 'ABSPATH', __DIR__ . '/' );
		$GLOBALS['hooks'] = array();
		function add_filter( $hook, $callback, $priority = 10, $accepted_args = 1 ) {
			$GLOBALS['hooks'][] = array( $hook, $callback, $priority, $accepted_args );
		}
		require '${ phpPath }';
		$scenarios = json_decode( base64_decode( '${ encoded }' ), true );
		$output = array();
		foreach ( $scenarios as $scenario ) {
			$output[] = hperkins_tokens_postcard_plate( $scenario['content'], $scenario['block'] );
		}
		echo json_encode( array( 'hooks' => $GLOBALS['hooks'], 'output' => $output ) );
	`;
	const result = spawnSync( process.env.HPERKINS_PHP_BIN || 'php', [ '-r', php ], { cwd: root, encoding: 'utf8' } );
	assert.equal( result.status, 0, result.stderr || result.error?.message );
	return JSON.parse( result.stdout );
}

const media = ( className = 'hp-postcard__media' ) => ( {
	blockName: 'core/group',
	attrs: { className, layout: { type: 'default' } },
} );
const FIGURE = '<figure class="wp-block-post-featured-image"><img class="wp-post-image" src="/a.webp" alt=""></figure>';
const open = ( className = 'hp-postcard__media' ) =>
	`<div class="wp-block-group ${ className } is-layout-flow wp-block-group-is-layout-flow">`;

test( 'the filter is registered on the group block render with the parsed block', () => {
	const { hooks } = renderScenarios( [] );
	assert.deepEqual( hooks, [ [ 'render_block_core/group', 'hperkins_tokens_postcard_plate', 10, 2 ] ] );
} );

test( 'the plate is the media group\'s last child, after the featured image', () => {
	const { output } = renderScenarios( [
		{ content: `${ open() }${ FIGURE }</div>`, block: media() },
		{ content: `\n${ open() }${ FIGURE }</div>\n`, block: media() },
	] );
	assert.equal( output[ 0 ], `${ open() }${ FIGURE }${ PLATE }</div>` );
	assert.equal( output[ 1 ], `\n${ open() }${ FIGURE }${ PLATE }</div>\n` );
} );

test( 'a post with no featured image gets the plate as the only child', () => {
	const { output } = renderScenarios( [ { content: `${ open() }</div>`, block: media() } ] );
	assert.equal( output[ 0 ], `${ open() }${ PLATE }</div>` );
} );

test( 'the media class is matched as a whole class among others', () => {
	const { output } = renderScenarios( [
		{ content: `${ open( 'is-style-x hp-postcard__media' ) }</div>`, block: media( ' is-style-x  hp-postcard__media ' ) },
		{ content: `${ open( 'hp-postcard__media-wide' ) }</div>`, block: media( 'hp-postcard__media-wide' ) },
		{ content: `${ open( 'hp-postcard__body' ) }<p>Body</p></div>`, block: media( 'hp-postcard__body' ) },
		{ content: '<div class="wp-block-group"></div>', block: { blockName: 'core/group', attrs: {} } },
	] );
	assert.equal( output[ 0 ], `${ open( 'is-style-x hp-postcard__media' ) }${ PLATE }</div>` );
	assert.equal( output[ 1 ], `${ open( 'hp-postcard__media-wide' ) }</div>` );
	assert.equal( output[ 2 ], `${ open( 'hp-postcard__body' ) }<p>Body</p></div>` );
	assert.equal( output[ 3 ], '<div class="wp-block-group"></div>' );
} );

test( 'a card never takes a second plate', () => {
	const carried = `${ open() }${ FIGURE }<div class="wp-block-group hp-postcard__plate"></div></div>`;
	const { output } = renderScenarios( [
		{ content: carried, block: media() },
		{ content: `${ open() }${ PLATE }</div>`, block: media() },
	] );
	assert.equal( output[ 0 ], carried );
	assert.equal( output[ 1 ], `${ open() }${ PLATE }</div>` );
} );

test( 'the plate closes inside the group\'s own wrapper whatever its tag', () => {
	const section = '<section class="wp-block-group hp-postcard__media"><div class="inner"></div></section>';
	const { output } = renderScenarios( [
		{ content: section, block: media() },
		{ content: 'not markup', block: media() },
		{ content: '<div class="wp-block-group hp-postcard__media">', block: media() },
	] );
	assert.equal( output[ 0 ], `<section class="wp-block-group hp-postcard__media"><div class="inner"></div>${ PLATE }</section>` );
	assert.equal( output[ 1 ], 'not markup' );
	assert.equal( output[ 2 ], '<div class="wp-block-group hp-postcard__media">' );
} );
