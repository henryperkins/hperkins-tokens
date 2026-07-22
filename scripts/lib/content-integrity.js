#!/usr/bin/env node

const crypto = require( 'node:crypto' );

function normalizeContent( value ) {
	// Strip a leading UTF-8 BOM (U+FEFF) so a Windows-authored snapshot still
	// matches a BOM-less live body, then normalize line endings and trailing
	// whitespace. Matched by numeric code point to avoid a fragile literal.
	const withoutBom = value.charCodeAt( 0 ) === 0xfeff ? value.slice( 1 ) : value;
	return withoutBom.replace( /\r\n/g, '\n' ).trimEnd();
}

function getSha256( value ) {
	return crypto.createHash( 'sha256' ).update( value ).digest( 'hex' );
}

function createLineDiff(
	actual,
	expected,
	{ actualLabel = 'actual', expectedLabel = 'expected' } = {}
) {
	const actualLines = normalizeContent( actual ).split( '\n' );
	const expectedLines = normalizeContent( expected ).split( '\n' );
	const output = [ `--- ${ actualLabel }`, `+++ ${ expectedLabel }` ];
	const lineCount = Math.max( actualLines.length, expectedLines.length );

	for ( let index = 0; index < lineCount; index++ ) {
		const actualLine = actualLines[ index ];
		const expectedLine = expectedLines[ index ];

		if ( actualLine === expectedLine ) {
			continue;
		}

		output.push(
			`@@ line ${ index + 1 } @@`,
			`- ${ actualLine === undefined ? '<missing>' : actualLine }`,
			`+ ${ expectedLine === undefined ? '<missing>' : expectedLine }`
		);
	}

	return output.join( '\n' );
}

module.exports = {
	createLineDiff,
	getSha256,
	normalizeContent,
};
