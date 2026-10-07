const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { spawnSync } = require( 'node:child_process' );

const root = path.join( __dirname, '..', '..' );
const read = ( file ) => fs.readFileSync( path.join( root, file ), 'utf8' );
const phpPath = ( file ) => path.join( root, file ).replaceAll( '\\', '/' ).replaceAll( "'", "\\'" );

// The REST request that froze production's home copy, and a later visitor.
const EDITOR = { nonce: 'cd4bd9d796', referer: '/wp-json/wp/v2/templates/lookup?slug=home&_locale=user' };
const VISITOR = { nonce: '4f0e1d2c3b', referer: '/essays/?v=0b3b97fa6688&utm_source=dispatch' };
const STATUSES = [ 'success', 'invalid-email', 'invalid-request', 'rate-limited', 'save-error' ];
const STATUS_LINE = /<p class="hp-subscribe__status"[^>]*>.*?<\/p>/gs;

// Runs inc/subscribe-form.php and the real pattern under a minimal WordPress
// shim. wp_nonce_field() prints core's markup from the scenario's request, so
// rendering the pattern in the editor's request yields exactly the copy a
// Site Editor save freezes. The Tag Processor is the shared minimal shim.
function run( scenarios ) {
	const encoded = Buffer.from( JSON.stringify( scenarios ) ).toString( 'base64' );
	const php = `
		define( 'ABSPATH', __DIR__ . '/' );
		$GLOBALS['hooks'] = array();
		function add_filter( $hook, $callback, $priority = 10, $accepted_args = 1 ) {
			$GLOBALS['hooks'][] = array( $hook, $callback, $priority, $accepted_args );
		}
		function sanitize_key( $key ) { return preg_replace( '/[^a-z0-9_\\-]/', '', strtolower( (string) $key ) ); }
		function wp_unslash( $value ) { return is_string( $value ) ? stripslashes( $value ) : $value; }
		function esc_attr( $text ) { return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' ); }
		function esc_html( $text ) { return htmlspecialchars( (string) $text, ENT_QUOTES, 'UTF-8' ); }
		function esc_url( $url ) { return str_replace( '&', '&#038;', (string) $url ); }
		function admin_url( $path = '' ) { return 'https://example.test/wp-admin/' . $path; }
		function wp_unique_id( $prefix = '' ) { static $id = 0; return $prefix . ++$id; }
		function hperkins_tokens_contact_email() { return 'htperkins@gmail.com'; }
		function wp_nonce_field( $action = -1, $name = '_wpnonce', $referer = true, $display = true ) {
			if ( 'hperkins_tokens_subscribe' !== $action ) {
				throw new Exception( 'Unexpected nonce action: ' . $action );
			}
			$field = '<input type="hidden" id="' . esc_attr( $name ) . '" name="' . esc_attr( $name ) . '" value="' . $GLOBALS['request']['nonce'] . '" />';
			if ( $referer ) {
				$field .= '<input type="hidden" name="_wp_http_referer" value="' . esc_url( $GLOBALS['request']['referer'] ) . '" />';
			}
			if ( $display ) {
				echo $field;
			}
			return $field;
		}
		require '${ phpPath( 'scripts/fixtures/search/html-tag-processor.php' ) }';
		require '${ phpPath( 'inc/subscribe-form.php' ) }';
		$output = array();
		foreach ( json_decode( base64_decode( '${ encoded }' ), true ) as $scenario ) {
			$GLOBALS['request'] = $scenario['request'];
			$_GET = $scenario['request']['get'];
			if ( 'pattern' === $scenario['op'] ) {
				ob_start();
				include '${ phpPath( 'patterns/imladris-subscribe.php' ) }';
				// A Custom HTML block renders the markup between its delimiters.
				$output[] = preg_replace( '#^<!-- wp:html -->|<!-- /wp:html -->\\s*$#', '', ob_get_clean() );
			} elseif ( 'filter' === $scenario['op'] ) {
				$output[] = hperkins_tokens_refresh_subscribe_form( $scenario['content'] );
			} elseif ( 'status' === $scenario['op'] ) {
				$output[] = hperkins_tokens_subscribe_status_markup();
			} else {
				$output[] = hperkins_tokens_subscribe_fresh_fields();
			}
		}
		echo json_encode( array( 'hooks' => $GLOBALS['hooks'], 'output' => $output ) );
	`;
	const result = spawnSync( process.env.HPERKINS_PHP_BIN || 'php', [ '-r', php ], { cwd: root, encoding: 'utf8' } );
	assert.equal( result.status, 0, result.stderr || result.stdout || result.error?.message );
	return JSON.parse( result.stdout );
}

const request = ( who, status ) => ( { ...who, get: status ? { hperkins_subscribe: status } : {} } );
const pattern = ( who, status ) => ( { op: 'pattern', request: request( who, status ) } );
const refresh = ( content, who, status ) => ( { op: 'filter', content, request: request( who, status ) } );
const statusLine = ( status ) => ( { op: 'status', request: request( VISITOR, status ) } );
const lines = ( html ) => html.match( STATUS_LINE ) || [];

// What the refresh should make of the frozen copy's two fields. The shim's
// set_attribute() escapes as esc_attr() does.
const withVisitorFields = ( frozen ) =>
	frozen
		.replace( `value="${ EDITOR.nonce }"`, `value="${ VISITOR.nonce }"` )
		.replace(
			'value="/wp-json/wp/v2/templates/lookup?slug=home&#038;_locale=user"',
			'value="/essays/?v=0b3b97fa6688&amp;utm_source=dispatch"'
		);

test( 'the refresh is registered on the Custom HTML block render', () => {
	const { hooks } = run( [] );
	assert.deepEqual( hooks, [ [ 'render_block_core/html', 'hperkins_tokens_refresh_subscribe_form', 10, 1 ] ] );
} );

test( 'the fresh fields are what wp_nonce_field() prints for this request', () => {
	const { output } = run( [ { op: 'fields', request: request( VISITOR ) } ] );
	assert.deepEqual( output[ 0 ], {
		hperkins_tokens_subscribe_nonce: VISITOR.nonce,
		_wp_http_referer: VISITOR.referer,
	} );
} );

test( 'a form the pattern rendered in this request passes through byte for byte', () => {
	const variants = [ undefined, ...STATUSES ];
	const live = run( variants.map( ( status ) => pattern( VISITOR, status ) ) ).output;
	const { output } = run( variants.map( ( status, index ) => refresh( live[ index ], VISITOR, status ) ) );
	variants.forEach( ( status, index ) => {
		assert.match( live[ index ], /hp-subscribe__form/ );
		assert.equal( output[ index ], live[ index ], `status ${ status || '(none)' }` );
	} );
} );

test( 'a frozen copy takes this request\'s nonce and referer and keeps everything else', () => {
	const [ frozen ] = run( [ pattern( EDITOR ) ] ).output;
	assert.match( frozen, /value="cd4bd9d796"/ );
	assert.match( frozen, /templates\/lookup\?slug=home&#038;_locale=user/ );

	const { output } = run( [ refresh( frozen, VISITOR ) ] );
	assert.equal( output[ 0 ], withVisitorFields( frozen ) );
	assert.notEqual( output[ 0 ], frozen );
	assert.deepEqual( lines( output[ 0 ] ), [] );
} );

test( 'a frozen copy gains the status line the pattern prints for this request', () => {
	const [ frozen ] = run( [ pattern( EDITOR ) ] ).output;
	const live = run( STATUSES.map( ( status ) => pattern( VISITOR, status ) ) ).output;
	const { output } = run( STATUSES.map( ( status ) => refresh( frozen, VISITOR, status ) ) );

	STATUSES.forEach( ( status, index ) => {
		const [ expected ] = lines( live[ index ] );
		assert.ok( expected, `the pattern prints a line for ${ status }` );
		assert.deepEqual( lines( output[ index ] ), [ expected ], status );
		// After the button, closing the form, as the pattern places it.
		const html = output[ index ];
		assert.ok( html.indexOf( '</button>' ) < html.indexOf( expected ), status );
		assert.equal( html.indexOf( expected ) + expected.length + 2, html.indexOf( '</form>' ), status );
	} );

	assert.equal(
		output[ 0 ],
		withVisitorFields( frozen ).replace( '</form>', `${ lines( live[ 0 ] )[ 0 ] }\n\t</form>` )
	);
} );

test( 'a status line frozen into a copy is replaced, never shown stale or twice', () => {
	const [ frozenWithLine ] = run( [ pattern( EDITOR, 'success' ) ] ).output;
	assert.equal( lines( frozenWithLine ).length, 1 );

	const [ invalidEmail ] = run( [ statusLine( 'invalid-email' ) ] ).output;
	const { output } = run( [ refresh( frozenWithLine, VISITOR ), refresh( frozenWithLine, VISITOR, 'invalid-email' ) ] );
	assert.deepEqual( lines( output[ 0 ] ), [] );
	assert.deepEqual( lines( output[ 1 ] ), [ invalidEmail ] );
} );

test( 'markup outside a subscribe form is left alone', () => {
	const [ frozen ] = run( [ pattern( EDITOR ) ] ).output;
	const plain = '\n<p>Plain Custom HTML</p>\n';
	const unclassed =
		'<form class="hp-other-form" method="post">' +
		'<input type="hidden" id="hperkins_tokens_subscribe_nonce" name="hperkins_tokens_subscribe_nonce" value="cd4bd9d796" />' +
		'<input type="hidden" name="_wp_http_referer" value="/other/" /></form>';
	const neighbour = '<form class="hp-other-form" method="post"><input type="hidden" name="_wp_http_referer" value="/other/" /></form>';
	// Past the subscribe form's closing tag, outside any form.
	const stray = '<div><input type="hidden" name="_wp_http_referer" value="/outside/" /></div>';

	const { output } = run( [
		refresh( plain, VISITOR ),
		refresh( unclassed, VISITOR ),
		refresh( frozen + neighbour, VISITOR ),
		refresh( neighbour + frozen, VISITOR ),
		refresh( frozen + stray, VISITOR ),
	] );
	assert.equal( output[ 0 ], plain );
	assert.equal( output[ 1 ], unclassed );
	assert.equal( output[ 2 ], withVisitorFields( frozen ) + neighbour );
	assert.equal( output[ 3 ], neighbour + withVisitorFields( frozen ) );
	assert.equal( output[ 4 ], withVisitorFields( frozen ) + stray );
} );

test( 'the status wording has one source, and an unknown status has none', () => {
	const { output } = run( [ ...STATUSES.map( statusLine ), statusLine( 'SUCCESS' ), statusLine( 'bogus' ), statusLine() ] );
	const roles = output.slice( 0, STATUSES.length ).map( ( line ) => line.match( /role="([a-z]+)"/ )?.[ 1 ] );
	assert.deepEqual( roles, [ 'status', 'alert', 'alert', 'alert', 'alert' ] );
	assert.match( output[ 4 ], /Email htperkins@gmail\.com directly/ );
	assert.equal( output[ 5 ], output[ 0 ], 'the status is read through sanitize_key()' );
	assert.equal( output[ 6 ], '' );
	assert.equal( output[ 7 ], '' );

	const patternSource = read( 'patterns/imladris-subscribe.php' );
	assert.match( patternSource, /\$subscribe_state\s*=\s*hperkins_tokens_subscribe_status\(\);/ );
	assert.doesNotMatch( patternSource, /===\s*\$subscribe_status/, 'the pattern must not keep its own status branches' );
} );

test( 'the nonce action and field agree across the pattern, the refresh and the handler', () => {
	const functions = read( 'functions.php' );
	assert.match(
		read( 'patterns/imladris-subscribe.php' ),
		/wp_nonce_field\(\s*'hperkins_tokens_subscribe',\s*'hperkins_tokens_subscribe_nonce'\s*\)/
	);
	assert.match(
		read( 'inc/subscribe-form.php' ),
		/wp_nonce_field\(\s*'hperkins_tokens_subscribe',\s*'hperkins_tokens_subscribe_nonce',\s*true,\s*false\s*\)/
	);
	assert.match( functions, /\$_POST\['hperkins_tokens_subscribe_nonce'\]/ );
	assert.match( functions, /wp_verify_nonce\(\s*\$nonce,\s*'hperkins_tokens_subscribe'\s*\)/ );
	assert.match( functions, /require_once get_stylesheet_directory\(\) \. '\/inc\/subscribe-form\.php';/ );
} );
