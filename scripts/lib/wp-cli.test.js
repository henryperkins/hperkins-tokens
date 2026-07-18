const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const os = require( 'node:os' );
const path = require( 'node:path' );

const {
	getWordPressPath,
	resolveWpCliInvocation,
	runWp,
	tryGetWordPressPath,
} = require( './wp-cli' );

test( 'requires an explicit WordPress path', () => {
	assert.throws(
		() => getWordPressPath( {} ),
		/HPERKINS_WP_PATH/
	);
	assert.throws(
		() => getWordPressPath( { HPERKINS_WP_PATH: '   ' } ),
		/HPERKINS_WP_PATH/
	);
} );

test( 'resolves the configured WordPress path', () => {
	assert.equal(
		getWordPressPath( { HPERKINS_WP_PATH: 'C:\\WordPress Sites\\theme-dev' } ),
		'C:\\WordPress Sites\\theme-dev'
	);
} );

test( 'tryGetWordPressPath returns null instead of throwing', () => {
	assert.equal( tryGetWordPressPath( {} ), null );
	assert.equal( tryGetWordPressPath( { HPERKINS_WP_PATH: '   ' } ), null );
	assert.equal(
		tryGetWordPressPath( { HPERKINS_WP_PATH: ' C:\\WordPress Sites\\theme-dev ' } ),
		'C:\\WordPress Sites\\theme-dev'
	);
} );

test( 'uses direct WP-CLI on non-Windows platforms', () => {
	assert.deepEqual(
		resolveWpCliInvocation( [ 'core', 'version' ], {
			platform: 'linux',
			env: {},
			homeDir: '/home/developer',
		} ),
		{
			file: 'wp',
			args: [ 'core', 'version' ],
		}
	);
} );

test( 'honors HPERKINS_WP_BIN on POSIX', () => {
	assert.deepEqual(
		resolveWpCliInvocation( [ 'core', 'version' ], {
			platform: 'linux',
			env: { HPERKINS_WP_BIN: '/opt/wp/bin/wp' },
			homeDir: '/home/developer',
		} ),
		{
			file: '/opt/wp/bin/wp',
			args: [ 'core', 'version' ],
		}
	);
} );

test( 'uses PHP and a PHAR on Windows without shell parsing', () => {
	assert.deepEqual(
		resolveWpCliInvocation( [ '--path=C:\\WordPress Sites\\theme-dev', 'core', 'version' ], {
			platform: 'win32',
			env: {
				HPERKINS_PHP_BIN: 'C:\\PHP 8.3\\php.exe',
				HPERKINS_WP_CLI_PHAR: 'C:\\Developer Tools\\wp-cli.phar',
			},
			homeDir: 'C:\\Users\\developer',
		} ),
		{
			file: 'C:\\PHP 8.3\\php.exe',
			args: [
				'C:\\Developer Tools\\wp-cli.phar',
				'--path=C:\\WordPress Sites\\theme-dev',
				'core',
				'version',
			],
			phar: 'C:\\Developer Tools\\wp-cli.phar',
		}
	);
} );

test( 'uses the per-user WP-CLI PHAR by default on Windows', () => {
	assert.deepEqual(
		resolveWpCliInvocation( [ '--info' ], {
			platform: 'win32',
			env: {},
			homeDir: 'C:\\Users\\developer',
		} ),
		{
			file: 'php',
			args: [ 'C:\\Users\\developer\\.local\\bin\\wp-cli.phar', '--info' ],
			phar: 'C:\\Users\\developer\\.local\\bin\\wp-cli.phar',
		}
	);
} );

test( 'prefers the project-specific PHAR override on Windows', () => {
	assert.equal(
		resolveWpCliInvocation( [ '--info' ], {
			platform: 'win32',
			env: {
				HPERKINS_WP_CLI_PHAR: 'C:\\project\\wp-cli.phar',
				WP_CLI_PHAR: 'C:\\generic\\wp-cli.phar',
			},
			homeDir: 'C:\\Users\\developer',
		} ).phar,
		'C:\\project\\wp-cli.phar'
	);

	// The bare WP_CLI_PHAR alias is not part of the documented config surface:
	// alone it must fall through to the per-user default.
	assert.equal(
		resolveWpCliInvocation( [ '--info' ], {
			platform: 'win32',
			env: { WP_CLI_PHAR: 'C:\\generic\\wp-cli.phar' },
			homeDir: 'C:\\Users\\developer',
		} ).phar,
		'C:\\Users\\developer\\.local\\bin\\wp-cli.phar'
	);
} );

test( 'reports a missing Windows PHAR before launching PHP', () => {
	assert.throws(
		() => runWp( [ '--info' ], {}, {
			platform: 'win32',
			env: {
				HPERKINS_WP_PATH: 'C:\\WordPress Sites\\theme-dev',
				HPERKINS_WP_CLI_PHAR: 'C:\\missing\\wp-cli.phar',
			},
			homeDir: 'C:\\Users\\developer',
		} ),
		/WP-CLI PHAR not found/
	);
} );

test( 'skips the PHAR existence check on POSIX', () => {
	assert.throws(
		() => runWp( [ '--path=/srv/wp', '--info' ], {}, {
			platform: 'linux',
			env: {
				HPERKINS_WP_CLI_PHAR: '/missing/wp-cli.phar',
				HPERKINS_WP_BIN: 'hp-missing-wp-binary',
			},
			homeDir: '/home/developer',
		} ),
		( error ) => ! /WP-CLI PHAR not found/.test( error.message )
	);
} );

test( 'injects the configured --path only when the caller omits it', ( t ) => {
	const fixtureDir = fs.mkdtempSync( path.join( os.tmpdir(), 'hperkins-wp-cli-' ) );
	t.after( () => fs.rmSync( fixtureDir, { recursive: true, force: true } ) );

	const fakePhar = path.join( fixtureDir, 'fake wp-cli.js' );
	fs.writeFileSync(
		fakePhar,
		"process.stdout.write( JSON.stringify( process.argv.slice( 2 ) ) );\n"
	);
	const context = {
		platform: 'win32',
		env: {
			HPERKINS_PHP_BIN: process.execPath,
			HPERKINS_WP_CLI_PHAR: fakePhar,
			HPERKINS_WP_PATH: 'C:\\WordPress Sites\\theme-dev',
		},
		homeDir: fixtureDir,
	};

	const explicitArgs = [ '--path=C:\\Other Site', 'core', 'version' ];
	assert.deepEqual( JSON.parse( runWp( explicitArgs, {}, context ) ), explicitArgs );

	assert.deepEqual(
		JSON.parse( runWp( [ 'core', 'version' ], {}, context ) ),
		[ '--path=C:\\WordPress Sites\\theme-dev', 'core', 'version' ]
	);

	assert.throws(
		() => runWp( [ 'core', 'version' ], {}, { ...context, env: { HPERKINS_PHP_BIN: process.execPath, HPERKINS_WP_CLI_PHAR: fakePhar } } ),
		/HPERKINS_WP_PATH/
	);
} );

test( 'keeps Windows arguments intact and disables shell parsing', ( t ) => {
	const fixtureDir = fs.mkdtempSync( path.join( os.tmpdir(), 'hperkins-wp-cli-' ) );
	t.after( () => fs.rmSync( fixtureDir, { recursive: true, force: true } ) );

	const fakePhar = path.join( fixtureDir, 'fake wp-cli.js' );
	fs.writeFileSync(
		fakePhar,
		"process.stdout.write( JSON.stringify( process.argv.slice( 2 ) ) );\n"
	);

	const wpArgs = [
		'--path=C:\\WordPress Sites\\theme-dev',
		'eval',
		'echo "safe & intact";',
	];
	const output = runWp( wpArgs, { shell: true }, {
		platform: 'win32',
		env: {
			HPERKINS_PHP_BIN: process.execPath,
			HPERKINS_WP_CLI_PHAR: fakePhar,
		},
		homeDir: fixtureDir,
	} );

	assert.deepEqual( JSON.parse( output ), wpArgs );
} );
