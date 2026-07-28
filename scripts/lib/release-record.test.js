const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );

const { isBehindRelease, parseReleaseRecord, readReleaseRecord } = require( './release-record' );

const themeRoot = path.join( __dirname, '..', '..' );
const README = [
	'**Current release:** [v0.3.53](https://github.com/henryperkins/hperkins-tokens/releases/tag/v0.3.53)',
	'**Deployed commit:** [`43d9ef6`](https://github.com/henryperkins/hperkins-tokens/commit/43d9ef603a6715b23af0b4fdce6076010e4b824a)',
].join( '\n' );

test( 'reads the release and deployment record', () => {
	const record = parseReleaseRecord( README, 'Version: 0.3.54\n' );

	assert.equal( record.version, '0.3.53' );
	assert.equal( record.deployedCommit, '43d9ef603a6715b23af0b4fdce6076010e4b824a' );
	assert.equal( record.workingVersion, '0.3.54' );
} );

test( 'lets the working tree run ahead of the release but never behind it', () => {
	assert.equal( isBehindRelease( '0.3.54', '0.3.53' ), false );
	assert.equal( isBehindRelease( '0.3.53', '0.3.53' ), false );
	assert.equal( isBehindRelease( '0.4', '0.3.53' ), false );
	assert.equal( isBehindRelease( '0.3.52', '0.3.53' ), true );
	assert.equal( isBehindRelease( '0.2.99', '0.3.0' ), true );

	assert.throws(
		() => parseReleaseRecord( README, 'Version: 0.3.52\n' ),
		/behind the release README\.md declares/
	);
} );

test( 'rejects a record that disagrees with its own links', () => {
	assert.throws(
		() => parseReleaseRecord( README.replace( 'tag/v0.3.53', 'tag/v0.3.52' ), 'Version: 0.3.54\n' ),
		/current-release label and release-tag URL disagree/
	);
	assert.throws(
		() => parseReleaseRecord( README.replace( '`43d9ef6`', '`0000000`' ), 'Version: 0.3.54\n' ),
		/deployed-commit label and URL disagree/
	);
	assert.throws( () => parseReleaseRecord( '', 'Version: 0.3.54\n' ), /must declare the current release/ );
	assert.throws( () => parseReleaseRecord( README, '' ), /must declare the current theme Version/ );
} );

test( 'the checked-in record parses, and both public artifacts read it from here', () => {
	const record = readReleaseRecord( themeRoot );

	assert.match( record.version, /^\d+\.\d+\.\d+$/ );
	assert.match( record.deployedCommit, /^[0-9a-f]{40}$/ );

	for ( const verifier of [ 'verify-job-placement-digest-source.js', 'verify-placement-artifacts.js' ] ) {
		const source = fs.readFileSync( path.join( themeRoot, 'scripts', verifier ), 'utf8' );
		assert.match(
			source,
			/require\( '\.\/lib\/release-record' \)/,
			`${ verifier } must read the released version from the shared record, not from style.css.`
		);
	}
} );
