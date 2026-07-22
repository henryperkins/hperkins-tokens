#!/usr/bin/env node

function escapeRegExp( value ) {
	return value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

function findHeadingLevels( markup ) {
	return [ ...markup.matchAll( /<h([1-6])\b[^>]*>/gi ) ].map( ( match ) => Number( match[ 1 ] ) );
}

function findHeadingOutlineJumps( levels ) {
	const jumps = [];

	for ( let index = 1; index < levels.length; index++ ) {
		if ( levels[ index ] > levels[ index - 1 ] + 1 ) {
			jumps.push( {
				from: levels[ index - 1 ],
				to: levels[ index ],
				index,
			} );
		}
	}

	return jumps;
}

function getClassCount( markup, className ) {
	let count = 0;

	for ( const match of markup.matchAll( /\bclass=(['"])(.*?)\1/gi ) ) {
		if ( match[ 2 ].split( /\s+/ ).includes( className ) ) {
			count++;
		}
	}

	return count;
}

function hasMeaningfulFragmentTarget( markup, id ) {
	const escapedId = escapeRegExp( id );
	const target = new RegExp(
		`<([a-z][a-z0-9:-]*)\\b([^>]*\\bid=(['"])${ escapedId }\\3[^>]*)>([\\s\\S]*?)<\\/\\1>`,
		'i'
	).exec( markup );

	if ( ! target || /\baria-hidden=(['"])true\1/i.test( target[ 2 ] ) ) {
		return false;
	}

	return target[ 4 ].replace( /<[^>]+>/g, '' ).trim().length > 0;
}

module.exports = {
	findHeadingLevels,
	findHeadingOutlineJumps,
	getClassCount,
	hasMeaningfulFragmentTarget,
};

