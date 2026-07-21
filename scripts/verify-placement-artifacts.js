#!/usr/bin/env node
/**
 * Verifies the recruiter-facing public artifacts without third-party packages.
 *
 * Usage:
 *   node scripts/verify-placement-artifacts.js
 *   node scripts/verify-placement-artifacts.js --check-links
 */
const { createHash } = require( 'node:crypto' );
const { readFileSync, readdirSync } = require( 'node:fs' );
const { basename, join, relative } = require( 'node:path' );
const { inflateSync } = require( 'node:zlib' );

const { openZip } = require( './lib/zip-archive' );

const themeRoot = join( __dirname, '..' );
const artifactDir = join( themeRoot, 'assets', 'documents' );
const artifactNames = [
	'henry-perkins-wordpress-support-engineer-resume.docx',
	'henry-perkins-wordpress-support-engineer-resume.pdf',
	'wordpress-job-market-screen-live-states.xlsx',
];
const approvedColumns = [
	'Job title',
	'Company',
	'Canonical posting URL',
	'Last checked',
	'Current state',
	'Screen verdict',
	'Concise reasoning',
];
const supportPostingUrl = 'https://job-boards.greenhouse.io/automatticcareers/jobs/7875064';
const providerVersion = '2.1';

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function decodeXml( value ) {
	const named = {
		amp: '&',
		apos: "'",
		gt: '>',
		lt: '<',
		quot: '"',
	};
	return value.replace( /&(#x[\da-f]+|#\d+|amp|apos|gt|lt|quot);/gi, ( entity, body ) => {
		if ( body[0] === '#' ) {
			const hexadecimal = body[1].toLowerCase() === 'x';
			const codePoint = Number.parseInt( body.slice( hexadecimal ? 2 : 1 ), hexadecimal ? 16 : 10 );
			return Number.isInteger( codePoint ) ? String.fromCodePoint( codePoint ) : entity;
		}
		return named[ body.toLowerCase() ];
	} );
}

function xmlAttributes( source ) {
	const attributes = {};
	const pattern = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
	for ( const match of source.matchAll( pattern ) ) {
		attributes[ match[1] ] = decodeXml( match[2] === undefined ? match[3] : match[2] );
	}
	return attributes;
}

function xmlText( source ) {
	return decodeXml(
		source
			.replace( /<w:(?:br|cr)\b[^>]*\/?\s*>/gi, '\n' )
			.replace( /<w:tab\b[^>]*\/?\s*>/gi, '\t' )
			.replace( /<\/w:p\s*>/gi, '\n' )
			.replace( /<[^>]+>/g, '' )
	);
}

function compactText( value ) {
	return value.replace( /\s+/g, ' ' ).trim();
}

function sha256( path ) {
	return createHash( 'sha256' ).update( readFileSync( path ) ).digest( 'hex' );
}

function assertOrdered( haystack, needles, label ) {
	let previous = -1;
	for ( const needle of needles ) {
		const position = haystack.indexOf( needle );
		assert( position !== -1, `${ label } is missing: ${ needle }.` );
		assert( position > previous, `${ label } puts "${ needle }" out of the required evidence order.` );
		previous = position;
	}
}

function externalRelationships( archive ) {
	const urls = new Set();
	for ( const name of archive.list().filter( ( entry ) => entry.startsWith( 'word/' ) && entry.endsWith( '.rels' ) ) ) {
		const relationships = archive.text( name );
		for ( const match of relationships.matchAll( /<Relationship\b([^>]*?)(?:\/>|>)/g ) ) {
			const attributes = xmlAttributes( match[1] );
			if (
				attributes.TargetMode === 'External' &&
				/\/hyperlink$/.test( attributes.Type || '' )
			) {
				urls.add( attributes.Target );
			}
		}
	}
	return urls;
}

function currentThemeVersion() {
	const style = readFileSync( join( themeRoot, 'style.css' ), 'utf8' );
	const match = style.match( /^Version:\s*(\S+)/m );
	assert( match, 'style.css must declare the current theme Version.' );
	return match[1];
}

function verifyDocx( path, themeVersion ) {
	const archive = openZip( path );
	for ( const entry of [ 'docProps/app.xml', 'word/document.xml', 'word/_rels/document.xml.rels' ] ) {
		assert( archive.has( entry ), `${ basename( path ) } is missing ${ entry }.` );
	}

	const appProperties = archive.text( 'docProps/app.xml' );
	const pages = appProperties.match( /<Pages>(\d+)<\/Pages>/ );
	assert( pages && Number( pages[1] ) === 1, 'Résumé DOCX app properties must report exactly one page.' );

	const text = compactText( xmlText( archive.text( 'word/document.xml' ) ) );
	assert(
		text.startsWith( 'Henry Perkins — WordPress Support Engineer' ),
		'Résumé must begin with the approved WordPress Support Engineer heading.'
	);
	assert(
		text.includes( 'PHP · JavaScript · Gutenberg · REST/HTTP/DNS · Root-cause debugging · Customer communication' ),
		'Résumé is missing the approved technical-support header line.'
	);
	assertOrdered( text, [
		'WORDPRESS.COM SUPPORT',
		'NAMED CLIENT DELIVERY',
		'PRODUCTION ROOT-CAUSE DEBUGGING',
		'UPSTREAM WORDPRESS CONTRIBUTION RECORD',
		'TECHNICAL PROOF',
	], 'Résumé' );
	for ( const claim of [
		'Automattic — Happiness Engineer',
		'DJ Lee & Voices of Judah',
		'commit c5dc3a1',
		'WordPress/ai PR #501',
		'Issue #529',
		'Issue #732',
		'AI Provider for Codex — Author',
		'HPerkins Tokens — Author',
		'Released independently; not merged into WordPress/ai.',
	] ) {
		assert( text.includes( claim ), `Résumé is missing required evidence: ${ claim }.` );
	}

	const providerSection = text.slice(
		text.indexOf( 'AI Provider for Codex — Author' ),
		text.indexOf( 'HPerkins Tokens — Author' )
	);
	assert( providerSection.includes( `v${ providerVersion }` ), `Résumé must name AI Provider for Codex v${ providerVersion }.` );
	const providerTags = [ ...providerSection.matchAll( /\bv\d+\.\d+(?:\.\d+)?\b/g ) ].map( ( match ) => match[0] );
	assert(
		providerTags.every( ( version ) => version === `v${ providerVersion }` ),
		`Résumé contains a stale AI Provider for Codex version: ${ providerTags.join( ', ' ) }.`
	);

	const themeSection = text.slice(
		text.indexOf( 'HPerkins Tokens — Author' ),
		text.indexOf( 'SKILLS & CAREER CONTEXT' )
	);
	assert( themeSection.includes( `v${ themeVersion }` ), `Résumé must name current HPerkins Tokens v${ themeVersion }.` );

	const forbiddenClaims = [
		[ /\bSolutions Engineer\b/i, 'Solutions Engineer framing' ],
		[ /\bSupport first,? then\b/i, 'transitional Support framing' ],
		[ /\bclient engagements?\b/i, 'generic client-engagement claim' ],
		[ /\bclient projects?\b/i, 'generic client-project claim' ],
		[ /\bclients\b/i, 'plural client claim' ],
		[ /\benterprise[- ]scale\b/i, 'unsupported enterprise-scale claim' ],
		[ /\bv2\.0\b/i, 'stale provider version v2.0' ],
	];
	for ( const [ pattern, label ] of forbiddenClaims ) {
		assert( ! pattern.test( text ), `Résumé contains forbidden ${ label }.` );
	}

	const urls = externalRelationships( archive );
	assert( urls.size >= 12, `Résumé DOCX has only ${ urls.size } unique external links; expected the full evidence set.` );
	for ( const url of urls ) {
		assert( /^(?:https:\/\/|mailto:)/.test( url ), `Résumé link must use HTTPS or mailto: ${ url }.` );
	}
	for ( const requiredUrl of [
		'https://github.com/WordPress/ai/pull/501',
		'https://github.com/WordPress/ai/issues/529',
		'https://github.com/WordPress/ai/issues/732',
		`https://github.com/henryperkins/ai-provider-for-codex/releases/tag/v${ providerVersion }`,
		`https://github.com/henryperkins/hperkins-tokens/releases/tag/v${ themeVersion }`,
	] ) {
		assert( urls.has( requiredUrl ), `Résumé DOCX is missing required immutable/public link: ${ requiredUrl }.` );
	}

	return urls;
}

function unescapePdfString( source ) {
	let result = '';
	for ( let index = 0; index < source.length; index += 1 ) {
		if ( source[index] !== '\\' ) {
			result += source[index];
			continue;
		}
		index += 1;
		if ( index >= source.length ) {
			break;
		}
		const escaped = source[index];
		const replacements = { b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
		if ( replacements[escaped] !== undefined ) {
			result += replacements[escaped];
		} else if ( escaped === '\r' || escaped === '\n' ) {
			if ( escaped === '\r' && source[index + 1] === '\n' ) {
				index += 1;
			}
		} else if ( /[0-7]/.test( escaped ) ) {
			let octal = escaped;
			while ( octal.length < 3 && /[0-7]/.test( source[index + 1] || '' ) ) {
				octal += source[ ++index ];
			}
			result += String.fromCharCode( Number.parseInt( octal, 8 ) );
		} else {
			result += escaped;
		}
	}
	return result;
}

function pdfUris( source ) {
	const urls = new Set();
	const pattern = /\/URI\s*(?:\(((?:\\[\s\S]|[^\\)])*)\)|<([\da-f\s]+)>)/gi;
	for ( const match of source.matchAll( pattern ) ) {
		if ( match[1] !== undefined ) {
			urls.add( unescapePdfString( match[1] ) );
		} else {
			urls.add( Buffer.from( match[2].replace( /\s/g, '' ), 'hex' ).toString( 'utf8' ) );
		}
	}
	return urls;
}

function pdfTextOperatorCount( buffer, source ) {
	let operators = 0;
	let offset = 0;
	while ( ( offset = source.indexOf( 'stream', offset ) ) !== -1 ) {
		let dataOffset = offset + 6;
		if ( source.slice( dataOffset, dataOffset + 2 ) === '\r\n' ) {
			dataOffset += 2;
		} else if ( source[dataOffset] === '\r' || source[dataOffset] === '\n' ) {
			dataOffset += 1;
		} else {
			offset += 6;
			continue;
		}
		const endOffset = source.indexOf( 'endstream', dataOffset );
		if ( endOffset === -1 ) {
			break;
		}
		const dictionaryStart = source.lastIndexOf( '<<', offset );
		const dictionary = dictionaryStart === -1 ? '' : source.slice( dictionaryStart, offset );
		if ( /\/FlateDecode\b/.test( dictionary ) ) {
			let payloadEnd = endOffset;
			while ( payloadEnd > dataOffset && /[\r\n]/.test( source[payloadEnd - 1] ) ) {
				payloadEnd -= 1;
			}
			try {
				const contents = inflateSync( buffer.subarray( dataOffset, payloadEnd ) ).toString( 'latin1' );
				if ( /\bBT\b/.test( contents ) ) {
					operators += ( contents.match( /\b(?:Tj|TJ)\b/g ) || [] ).length;
				}
			} catch ( error ) {
				// Flate streams also hold fonts and maps. Only content streams need
				// to contribute text-showing operators, so continue past a stream
				// whose wrapper cannot be inferred safely from raw PDF bytes.
			}
		}
		offset = endOffset + 9;
	}
	return operators;
}

function setsEqual( left, right ) {
	return left.size === right.size && [ ...left ].every( ( item ) => right.has( item ) );
}

function verifyPdf( path, docxUrls ) {
	const buffer = readFileSync( path );
	const source = buffer.toString( 'latin1' );
	assert( source.startsWith( '%PDF-' ), 'Résumé PDF has no PDF header.' );

	const pageCounts = [];
	for ( const match of source.matchAll( /\/Type\s*\/Pages\b([\s\S]*?)endobj/g ) ) {
		const count = match[1].match( /\/Count\s+(\d+)/ );
		if ( count ) {
			pageCounts.push( Number( count[1] ) );
		}
	}
	assert( pageCounts.length > 0, 'Résumé PDF has no readable /Pages /Count entry.' );
	assert(
		pageCounts.every( ( count ) => count === 1 ),
		`Résumé PDF must contain one page; page-tree counts were ${ pageCounts.join( ', ' ) }.`
	);
	assert( ( source.match( /\/ToUnicode\b/g ) || [] ).length > 0, 'Résumé PDF fonts must include ToUnicode maps.' );
	assert(
		/\/Subtype\s*\/(?:Type0|TrueType)\b/.test( source ),
		'Résumé PDF must embed a searchable text font.'
	);
	const textOperators = pdfTextOperatorCount( buffer, source );
	assert(
		textOperators >= 20,
		`Résumé PDF exposes only ${ textOperators } text-showing operators; it may be flattened or unsearchable.`
	);

	const urls = pdfUris( source );
	assert( setsEqual( urls, docxUrls ), [
		'Résumé PDF and DOCX external-link sets differ.',
		`DOCX only: ${ [ ...docxUrls ].filter( ( url ) => ! urls.has( url ) ).join( ', ' ) || '<none>' }`,
		`PDF only: ${ [ ...urls ].filter( ( url ) => ! docxUrls.has( url ) ).join( ', ' ) || '<none>' }`,
	].join( ' ' ) );

	return urls;
}

function spreadsheetStrings( archive ) {
	if ( ! archive.has( 'xl/sharedStrings.xml' ) ) {
		return [];
	}
	const source = archive.text( 'xl/sharedStrings.xml' );
	return [ ...source.matchAll( /<si\b[^>]*>([\s\S]*?)<\/si>/g ) ].map( ( match ) =>
		decodeXml( [ ...match[1].matchAll( /<t\b[^>]*>([\s\S]*?)<\/t>/g ) ].map( ( text ) => text[1] ).join( '' ) )
	);
}

function columnIndex( reference ) {
	const letters = reference.match( /^[A-Z]+/i );
	assert( letters, `Spreadsheet cell has invalid reference: ${ reference }.` );
	let index = 0;
	for ( const letter of letters[0].toUpperCase() ) {
		index = index * 26 + letter.charCodeAt( 0 ) - 64;
	}
	return index - 1;
}

function worksheetRows( source, sharedStrings ) {
	const rows = [];
	for ( const rowMatch of source.matchAll( /<row\b([^>]*)>([\s\S]*?)<\/row>/g ) ) {
		const rowAttributes = xmlAttributes( rowMatch[1] );
		const rowNumber = Number( rowAttributes.r );
		assert( Number.isInteger( rowNumber ), 'Spreadsheet row is missing a numeric r attribute.' );
		const cells = new Map();
		for ( const cellMatch of rowMatch[2].matchAll( /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g ) ) {
			const attributes = xmlAttributes( cellMatch[1] );
			assert( attributes.r, `Spreadsheet row ${ rowNumber } contains an unaddressed cell.` );
			const index = columnIndex( attributes.r );
			assert( ! cells.has( index ), `Spreadsheet row ${ rowNumber } repeats column ${ index + 1 }.` );
			const body = cellMatch[2] || '';
			const valueMatch = body.match( /<v>([\s\S]*?)<\/v>/ );
			let value = valueMatch ? decodeXml( valueMatch[1] ) : '';
			if ( attributes.t === 's' && value !== '' ) {
				const sharedIndex = Number( value );
				assert( sharedStrings[sharedIndex] !== undefined, `Spreadsheet cell ${ attributes.r } has an invalid shared-string index.` );
				value = sharedStrings[sharedIndex];
			} else if ( attributes.t === 'inlineStr' ) {
				value = decodeXml( [ ...body.matchAll( /<t\b[^>]*>([\s\S]*?)<\/t>/g ) ].map( ( match ) => match[1] ).join( '' ) );
			}
			cells.set( index, value );
		}
		rows.push( { rowNumber, cells } );
	}
	return rows;
}

function verifyWorkbook( path ) {
	const archive = openZip( path );
	for ( const entry of [ 'xl/workbook.xml', 'xl/worksheets/sheet1.xml', 'xl/sharedStrings.xml', 'xl/tables/table1.xml' ] ) {
		assert( archive.has( entry ), `${ basename( path ) } is missing ${ entry }.` );
	}
	const worksheets = archive.list().filter( ( entry ) => /^xl\/worksheets\/sheet\d+\.xml$/.test( entry ) );
	assert( worksheets.length === 1 && worksheets[0] === 'xl/worksheets/sheet1.xml', 'Public workbook must contain exactly one worksheet.' );

	const workbookXml = archive.text( 'xl/workbook.xml' );
	const sheets = [ ...workbookXml.matchAll( /<sheet\b([^>]*?)(?:\/>|>)/g ) ].map( ( match ) => xmlAttributes( match[1] ) );
	assert( sheets.length === 1 && sheets[0].name === 'Live States', 'Public workbook must expose one Live States sheet.' );
	assert( ! /Validated 50/i.test( workbookXml ), 'Public workbook still names the retired Validated 50 sheet.' );

	const packageText = archive.list()
		.filter( ( entry ) => /\.xml$|\.rels$/.test( entry ) )
		.map( ( entry ) => archive.text( entry ) )
		.join( '\n' );
	assert(
		! /(?:[A-Z]:\\(?:Users|Documents and Settings)\\|\/Users\/[^/]+\/|\/home\/[^/]+\/)/i.test( packageText ),
		'Public workbook package leaks a local user or home-directory path.'
	);

	const sharedStrings = spreadsheetStrings( archive );
	const worksheetXml = archive.text( 'xl/worksheets/sheet1.xml' );
	assert( /<dimension\b[^>]*\bref="A1:G21"/.test( worksheetXml ), 'Public workbook used range must be exactly A1:G21.' );
	const rows = worksheetRows( worksheetXml, sharedStrings );
	assert( rows.length === 21, `Public workbook has ${ rows.length } rows; expected 21 including the header.` );
	for ( let index = 0; index < rows.length; index += 1 ) {
		const row = rows[index];
		assert( row.rowNumber === index + 1, `Public workbook skips or reorders row ${ index + 1 }.` );
		assert(
			row.cells.size === 7 && [ ...row.cells.keys() ].every( ( column ) => column >= 0 && column < 7 ),
			`Public workbook row ${ row.rowNumber } must contain exactly columns A:G.`
		);
	}
	const values = rows.map( ( row ) => Array.from( { length: 7 }, ( unused, column ) => row.cells.get( column ) || '' ) );
	assert(
		approvedColumns.every( ( column, index ) => values[0][index] === column ),
		`Public workbook columns must be exactly: ${ approvedColumns.join( ' | ' ) }.`
	);
	const tableXml = archive.text( 'xl/tables/table1.xml' );
	assert( /<table\b[^>]*\bref="A1:G21"/.test( tableXml ), 'Public workbook table must be exactly A1:G21.' );
	assert(
		approvedColumns.every( ( column ) => tableXml.includes( `name="${ column.replace( /&/g, '&amp;' ) }"` ) ),
		'Public workbook table metadata does not match the seven approved columns.'
	);

	const supportRow = values.find( ( row ) => row[0] === 'Support Engineer, VIP' );
	assert( supportRow, 'Public workbook is missing the Support Engineer, VIP row.' );
	assert( supportRow[2] === supportPostingUrl, `Support Engineer, VIP must use canonical URL ${ supportPostingUrl }.` );
	assert( supportRow[4] === 'Live' && supportRow[5] === 'Pass', 'Support Engineer, VIP must be visibly labeled Live and Pass.' );

	const privatePatterns = [
		[ /\bcitizenship\b/i, 'citizenship' ],
		[ /\bapplication (?:already )?in flight\b/i, 'application-in-flight status' ],
		[ /\bsalary (?:strategy|target|expectations?)\b/i, 'salary strategy' ],
		[ /\breferral\b/i, 'referral status' ],
		[ /\bcontact status\b/i, 'contact status' ],
		[ /\bpersonal application\b/i, 'personal application notes' ],
		[ /\binterview (?:progress|status|stage|notes?)\b/i, 'interview progress' ],
	];
	const searchableContent = `${ sharedStrings.join( '\n' ) }\n${ values.flat().join( '\n' ) }`;
	for ( const [ pattern, label ] of privatePatterns ) {
		assert( ! pattern.test( searchableContent ), `Public workbook contains private ${ label } data.` );
	}
}

async function verifyLink( url ) {
	if ( url.startsWith( 'mailto:' ) ) {
		assert( /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test( url ), `Invalid mailto link: ${ url }.` );
		return { url, status: 'mailto' };
	}
	const parsed = new URL( url );
	assert( parsed.protocol === 'https:', `Public résumé link must use HTTPS: ${ url }.` );
	const response = await fetch( parsed, {
		headers: {
			Accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8',
			Range: 'bytes=0-1023',
			'User-Agent': 'HPerkins-Tokens-Artifact-Verifier/1.0',
		},
		redirect: 'follow',
		signal: AbortSignal.timeout( 20000 ),
	} );
	const finalUrl = new URL( response.url );
	if ( response.body ) {
		await response.body.cancel();
	}
	assert( response.ok, `Public link returned HTTP ${ response.status }: ${ url }.` );
	assert( finalUrl.protocol === 'https:', `Public link downgraded from HTTPS: ${ url } -> ${ finalUrl.href}.` );
	if ( parsed.pathname !== '/' ) {
		assert(
			finalUrl.pathname !== '/',
			`Dated/evidence link redirected to a generic homepage: ${ url } -> ${ finalUrl.href}.`
		);
	}
	return { url, status: response.status, finalUrl: finalUrl.href };
}

async function verifyLinks( urls, inspect = verifyLink, log = console.log ) {
	const pending = [ ...urls ];
	const results = [];
	let hasFailures = false;
	const workers = Array.from( { length: Math.min( 4, pending.length ) }, async () => {
		while ( pending.length > 0 ) {
			const url = pending.shift();
			try {
				results.push( await inspect( url ) );
			} catch ( error ) {
				hasFailures = true;
				results.push( { url, status: 'failed', error: error.message } );
			}
		}
	} );
	await Promise.all( workers );
	for ( const result of results.sort( ( left, right ) => left.url.localeCompare( right.url ) ) ) {
		if ( result.status === 'failed' ) {
			log( `link failed: ${ result.url } - ${ result.error }` );
		} else {
			log( `link ${ result.status }: ${ result.url }${ result.finalUrl && result.finalUrl !== result.url ? ` -> ${ result.finalUrl }` : '' }` );
		}
	}
	if ( hasFailures ) {
		throw new Error( 'One or more links failed verification.' );
	}
}

async function main() {
	const args = process.argv.slice( 2 );
	for ( const arg of args ) {
		assert( arg === '--check-links', `Unknown option: ${ arg }.` );
	}
	const checkLinks = args.includes( '--check-links' );

	const directoryEntries = readdirSync( artifactDir, { withFileTypes: true } );
	const actualNames = directoryEntries.map( ( entry ) => entry.name ).sort();
	assert(
		actualNames.length === artifactNames.length &&
			artifactNames.every( ( name ) => actualNames.includes( name ) ) &&
			directoryEntries.every( ( entry ) => entry.isFile() ),
		`assets/documents must contain exactly: ${ artifactNames.join( ', ' ) }. Found: ${ actualNames.join( ', ' ) || '<empty>' }.`
	);

	const paths = Object.fromEntries( artifactNames.map( ( name ) => [ name, join( artifactDir, name ) ] ) );
	const themeVersion = currentThemeVersion();
	const docxUrls = verifyDocx( paths[ artifactNames[0] ], themeVersion );
	const pdfUrls = verifyPdf( paths[ artifactNames[1] ], docxUrls );
	verifyWorkbook( paths[ artifactNames[2] ] );
	if ( checkLinks ) {
		await verifyLinks( pdfUrls );
	}

	console.log( 'verified placement artifact contracts' );
	for ( const name of artifactNames ) {
		console.log( `sha256 ${ sha256( paths[name] ) }  ${ relative( themeRoot, paths[name] ).replace( /\\/g, '/' ) }` );
	}
}

if ( require.main === module ) {
	main().catch( ( error ) => {
		console.error( `placement artifact verification failed: ${ error.message }` );
		process.exitCode = 1;
	} );
}

module.exports = { verifyLinks };
