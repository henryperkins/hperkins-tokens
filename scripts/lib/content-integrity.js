#!/usr/bin/env node

const crypto = require( 'node:crypto' );

function normalizeContent( value ) {
	return value.replace( /\r\n/g, '\n' ).trimEnd();
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

