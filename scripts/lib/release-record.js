#!/usr/bin/env node
/**
 * The theme's released-and-deployed record, read from README.md.
 *
 * Two public artifacts make a claim about a *shipped* theme version and link a
 * release tag that has to resolve: the recruiter digest's theme row and the
 * résumé's HPerkins Tokens entry. Checking either against style.css conflated
 * "the version I am developing" with "the version that is live", so every
 * in-flight bump demanded the artifact advertise a release nobody had cut —
 * precisely the unverifiable claim those verifiers exist to stop. README.md's
 * deployment record is the shared source instead, and it moves at release time.
 *
 * Both verifiers read it through this module so there is one parser for the
 * record rather than two regexes that can drift apart.
 */
const fs = require( 'node:fs' );
const path = require( 'node:path' );

const RELEASE_PATTERN =
	/\*\*Current release:\*\*\s+\[v(\d+\.\d+\.\d+)\]\(https:\/\/github\.com\/henryperkins\/hperkins-tokens\/releases\/tag\/v(\d+\.\d+\.\d+)\)/i;
const DEPLOYED_COMMIT_PATTERN =
	/\*\*Deployed commit:\*\*\s+\[`([0-9a-f]{7})`\]\(https:\/\/github\.com\/henryperkins\/hperkins-tokens\/commit\/([0-9a-f]{40})\)/i;
const WORKING_VERSION_PATTERN = /^Version:\s*(\S+)/m;

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function toParts( value ) {
	return value.split( '.' ).map( ( part ) => Number.parseInt( part, 10 ) || 0 );
}

/**
 * Whether a working version sorts before a released one.
 *
 * @param {string} workingVersion  style.css Version.
 * @param {string} releasedVersion README.md current release.
 * @return {boolean} True when the working tree is older than the record.
 */
function isBehindRelease( workingVersion, releasedVersion ) {
	const [ working, released ] = [ toParts( workingVersion ), toParts( releasedVersion ) ];

	for ( let index = 0; index < Math.max( working.length, released.length ); index++ ) {
		const left = working[ index ] || 0;
		const right = released[ index ] || 0;
		if ( left !== right ) {
			return left < right;
		}
	}

	return false;
}

/**
 * Parse the deployment record and reconcile it with the working version.
 *
 * @param {string} readme README.md contents.
 * @param {string} style  style.css contents.
 * @return {{version: string, deployedCommit: string, workingVersion: string}} The record.
 */
function parseReleaseRecord( readme, style ) {
	const releaseMatch = readme.match( RELEASE_PATTERN );
	assert( releaseMatch, 'README.md must declare the current release with a pinned release-tag URL.' );
	assert(
		releaseMatch[ 1 ] === releaseMatch[ 2 ],
		'README.md current-release label and release-tag URL disagree.'
	);

	const deployedMatch = readme.match( DEPLOYED_COMMIT_PATTERN );
	assert( deployedMatch, 'README.md must declare the deployed commit with a pinned 40-character URL.' );
	assert(
		deployedMatch[ 2 ].startsWith( deployedMatch[ 1 ] ),
		'README.md deployed-commit label and URL disagree.'
	);

	const workingMatch = style.match( WORKING_VERSION_PATTERN );
	assert( workingMatch, 'style.css must declare the current theme Version.' );

	// Development may run ahead of the last release, never behind it: a working
	// tree older than what README advertises as shipped means the deployment
	// record is describing code this checkout does not contain.
	assert(
		! isBehindRelease( workingMatch[ 1 ], releaseMatch[ 1 ] ),
		`style.css Version ${ workingMatch[ 1 ] } is behind the release README.md declares (v${ releaseMatch[ 1 ] }).`
	);

	return {
		version: releaseMatch[ 1 ],
		deployedCommit: deployedMatch[ 2 ].toLowerCase(),
		workingVersion: workingMatch[ 1 ],
	};
}

/**
 * Read the deployment record from a theme checkout.
 *
 * @param {string} themeRoot Absolute path to the theme root.
 * @return {{version: string, deployedCommit: string, workingVersion: string}} The record.
 */
function readReleaseRecord( themeRoot ) {
	return parseReleaseRecord(
		fs.readFileSync( path.join( themeRoot, 'README.md' ), 'utf8' ),
		fs.readFileSync( path.join( themeRoot, 'style.css' ), 'utf8' )
	);
}

module.exports = { isBehindRelease, parseReleaseRecord, readReleaseRecord };
