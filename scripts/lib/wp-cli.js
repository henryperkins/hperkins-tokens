const { execFileSync } = require( 'node:child_process' );
const fs = require( 'node:fs' );
const os = require( 'node:os' );
const path = require( 'node:path' );

function getWordPressPath( env = process.env ) {
	const wpPath = env.HPERKINS_WP_PATH?.trim();
	if ( ! wpPath ) {
		throw new Error(
			'HPERKINS_WP_PATH is required for database-backed verification. Point it at a local WordPress root.'
		);
	}

	return wpPath;
}

function resolveWpCliInvocation(
	args,
	{
		platform = process.platform,
		env = process.env,
		homeDir = os.homedir(),
	} = {}
) {
	if ( platform !== 'win32' ) {
		return {
			file: env.HPERKINS_WP_BIN || 'wp',
			args,
		};
	}

	const phar =
		env.HPERKINS_WP_CLI_PHAR ||
		env.WP_CLI_PHAR ||
		path.win32.join( homeDir, '.local', 'bin', 'wp-cli.phar' );

	return {
		file: env.HPERKINS_PHP_BIN || 'php',
		args: [ phar, ...args ],
		phar,
	};
}

function runWp( args, options = {}, context = {} ) {
	const invocation = resolveWpCliInvocation( args, context );
	if ( invocation.phar && ! fs.existsSync( invocation.phar ) ) {
		throw new Error(
			`WP-CLI PHAR not found at "${ invocation.phar }". Set HPERKINS_WP_CLI_PHAR to its absolute path.`
		);
	}

	return execFileSync( invocation.file, invocation.args, {
		encoding: 'utf8',
		...options,
		shell: false,
	} );
}

module.exports = {
	getWordPressPath,
	resolveWpCliInvocation,
	runWp,
};
