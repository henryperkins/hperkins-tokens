const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const os = require( 'node:os' );
const path = require( 'node:path' );
const { spawnSync } = require( 'node:child_process' );

const themeRoot = path.join( __dirname, '..', '..' );
const hookPath = path.join( themeRoot, 'inc', 'about-gravatar-heading.php' );
const prefix = '<h3 class="screen-reader-text">Profile details</h3>';
const targetMarkup = [
	'\n',
	'<div class="gravatar-block hp-about-gravatar-card wp-block-gravatar-block"',
	' data-attrs="{&quot;layout&quot;:&quot;default&quot;}"></div>',
	'\n',
].join( '' );

function serializePhpSingleQuotedLiteral( value ) {
	return `'${ value
		.replaceAll( '\\', '\\\\' )
		.replaceAll( "'", "\\'" ) }'`;
}

function exerciseHook( phpHookPath = hookPath ) {
	if ( ! fs.existsSync( phpHookPath ) ) {
		return {
			error: 'The PHP theme-boundary implementation is missing.',
		};
	}

	const normalizedHookPath = phpHookPath.replaceAll( '\\', '/' );
	const harness = `
		define( 'ABSPATH', __DIR__ . '/' );
		$registered = array();
		$translations = array();
		function add_filter( $hook, $callback, $priority, $accepted_args ) {
			global $registered;
			$registered[] = array( $hook, $callback, $priority, $accepted_args );
		}
		function esc_html__( $text, $domain ) {
			global $translations;
			$translations[] = array( $text, $domain );
			return $text;
		}
		require ${ serializePhpSingleQuotedLiteral( normalizedHookPath ) };
		$markup = base64_decode( '${ Buffer.from( targetMarkup ).toString( 'base64' ) }' );
		$target = array(
			'blockName' => 'gravatar/block',
			'attrs' => array( 'className' => 'before hp-about-gravatar-card after' ),
		);
		$other_gravatar = array(
			'blockName' => 'gravatar/block',
			'attrs' => array( 'className' => 'another-card' ),
		);
		$similar_class = array(
			'blockName' => 'gravatar/block',
			'attrs' => array( 'className' => 'hp-about-gravatar-cardish' ),
		);
		$other_block = array(
			'blockName' => 'core/group',
			'attrs' => array( 'className' => 'hp-about-gravatar-card' ),
		);
		echo json_encode( array(
			'registered' => $registered,
			'target' => hperkins_tokens_render_about_gravatar_heading( $markup, $target ),
			'translations' => $translations,
			'otherGravatar' => hperkins_tokens_render_about_gravatar_heading( $markup, $other_gravatar ),
			'similarClass' => hperkins_tokens_render_about_gravatar_heading( $markup, $similar_class ),
			'otherBlock' => hperkins_tokens_render_about_gravatar_heading( $markup, $other_block ),
		) );
	`;
	const result = spawnSync( 'php', [ '-r', harness ], {
		cwd: themeRoot,
		encoding: 'utf8',
	} );

	if ( result.status !== 0 ) {
		return {
			error: result.stderr || `PHP exited with status ${ result.status }.`,
		};
	}

	return JSON.parse( result.stdout );
}

const observed = exerciseHook();

test( 'loads the real hook when its PHP path contains a single quote', () => {
	const quotedDirectory = fs.mkdtempSync(
		path.join( os.tmpdir(), "hperkins-about-'" )
	);
	const quotedHookPath = path.join(
		quotedDirectory,
		'about-gravatar-heading.php'
	);

	try {
		fs.copyFileSync( hookPath, quotedHookPath );

		const quotedObserved = exerciseHook( quotedHookPath );

		assert.equal(
			quotedObserved.error,
			undefined,
			quotedObserved.error
		);
		assert.equal( quotedObserved.target, prefix + targetMarkup );
	} finally {
		fs.rmSync( quotedDirectory, { recursive: true, force: true } );
	}
} );

test( 'registers the transformation only on the Gravatar block render hook', () => {
	assert.equal( observed.error, undefined, observed.error );
	assert.deepEqual( observed.registered, [
		[
			'render_block_gravatar/block',
			'hperkins_tokens_render_about_gravatar_heading',
			10,
			2,
		],
	] );
} );

test( 'localizes the hidden heading with the exact text and theme domain', () => {
	assert.equal( observed.error, undefined, observed.error );
	assert.deepEqual( observed.translations, [
		[ 'Profile details', 'hperkins-tokens' ],
	] );
} );

test( 'prefixes exactly one accessible H3 and preserves every byte of target markup after it', () => {
	assert.equal( observed.error, undefined, observed.error );
	assert.equal( observed.target, prefix + targetMarkup );
	assert.equal( observed.target.slice( prefix.length ), targetMarkup );
	assert.equal( observed.target.split( prefix ).length - 1, 1 );
} );

test( 'leaves every block outside the exact target Gravatar class byte-for-byte unchanged', () => {
	assert.equal( observed.error, undefined, observed.error );
	assert.equal( observed.otherGravatar, targetMarkup );
	assert.equal( observed.similarClass, targetMarkup );
	assert.equal( observed.otherBlock, targetMarkup );
} );
