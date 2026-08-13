#!/usr/bin/env node

const path = require( 'node:path' );

const { verifyImpeccableArtifacts } = require( './lib/impeccable-artifacts' );

function repositoryRoot( args ) {
	if ( args.length === 0 ) {
		return path.join( __dirname, '..' );
	}
	if ( args.length === 1 && args[ 0 ].startsWith( '--root=' ) ) {
		const root = args[ 0 ].slice( '--root='.length );
		if ( root !== '' ) {
			return path.resolve( root );
		}
	}
	if ( args.length === 2 && args[ 0 ] === '--root' && args[ 1 ] !== '' ) {
		return path.resolve( args[ 1 ] );
	}
	throw new Error( 'Usage: node scripts/verify-impeccable-artifacts.js [--root <repository>]' );
}

function main() {
	const summary = verifyImpeccableArtifacts( repositoryRoot( process.argv.slice( 2 ) ) );
	console.log(
		`verified Impeccable artifacts: ${ summary.colors } colors, ` +
		`${ summary.typography } typography roles, ` +
		`${ summary.typographyScale } type-scale steps, ` +
		`${ summary.componentTokens } component tokens, ${ summary.previews } previews`
	);
}

try {
	main();
} catch ( error ) {
	console.error( error.message );
	process.exitCode = 1;
}
