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
const { readReleaseRecord } = require( './lib/release-record' );
// The market screen's state vocabulary is declared once, beside the register's,
// and asserted there against the browser script. Import it rather than keeping
// a third copy that can drift from both.
const { MARKET_TOKENS, classifyWith } = require( './verify-job-placement-digest-source' );

const themeRoot = join( __dirname, '..' );
const artifactDir = join( themeRoot, 'assets', 'documents' );
const appendixDraftPath = join( themeRoot, 'content', 'page-drafts', 'placement-method-evidence.html' );
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
const REQUIRED_RESUME_COPY = [
	'WORDCAMP US 2026 — Phoenix, Aug 16–19 · Selected to staff the Core AI booth',
	'WordPress/ai PR #501',
	'WordPress/php-ai-client PR #263',
	'WordPress/ai-provider-for-openai PR #40',
	'Issue #529',
	'maintainer authored PR #593',
	'Issue #732',
	'Anubhav Anand authored PR #757',
	'Flavor Agent',
	'v0.1.0-rc.3',
	'unreleased',
	'AI Provider for Codex',
	'HPerkins Tokens',
];
const FORBIDDEN_RESUME_COPY = [
	[ /as of Jul 30, 2026/, 'as of Jul 30, 2026' ],
	[ /54 commits ahead/, '54 commits ahead' ],
	[ /\b30 contracts\b/, '30 contracts' ],
	[ /\b35 contracts\b/, '35 contracts' ],
	[ /my PR #593/, 'my PR #593' ],
	[ /my PR #757/, 'my PR #757' ],
	[ /final v0\.1\.0/, 'final v0.1.0' ],
];

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

function findForbiddenResumeCopy( value ) {
	const match = FORBIDDEN_RESUME_COPY.find( ( [ pattern ] ) => pattern.test( value ) );
	return match ? match[ 1 ] : null;
}

function stripHtml( value ) {
	return compactText( decodeXml( value.replace( /<!--([\s\S]*?)-->/g, '' ).replace( /<[^>]+>/g, '' ) ) );
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

function externalHyperlinkSequence( archive ) {
	const relationships = new Map();
	const relationshipSource = archive.text( 'word/_rels/document.xml.rels' );
	for ( const match of relationshipSource.matchAll( /<Relationship\b([^>]*?)(?:\/>|>)/g ) ) {
		const attributes = xmlAttributes( match[1] );
		if ( attributes.TargetMode === 'External' && /\/hyperlink$/.test( attributes.Type || '' ) ) {
			relationships.set( attributes.Id, attributes.Target );
		}
	}

	const urls = [];
	for ( const match of archive.text( 'word/document.xml' ).matchAll( /<w:hyperlink\b([^>]*)>/g ) ) {
		const attributes = xmlAttributes( match[1] );
		const relationshipId = attributes[ 'r:id' ];
		if ( ! relationshipId && attributes[ 'w:anchor' ] ) {
			continue;
		}
		assert( relationshipId && relationships.has( relationshipId ), 'Résumé DOCX contains an unresolved external hyperlink.' );
		urls.push( relationships.get( relationshipId ) );
	}
	return urls;
}

function releasedThemeVersion() {
	// The résumé's HPerkins Tokens entry is a public claim about a SHIPPED
	// theme, and it links a release tag that --check-links actually fetches, so
	// it is checked against README.md's release record rather than style.css.
	// The working version may run ahead of the last release; demanding the
	// résumé name it would have the document advertise a tag nobody had cut.
	return readReleaseRecord( themeRoot ).version;
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
		'UPSTREAM WORDPRESS CONTRIBUTION RECORD',
		'TECHNICAL PROOF',
	], 'Résumé' );
	for ( const claim of [
		'Automattic — Happiness Engineer',
		'DJ Lee & Voices of Judah',
		...REQUIRED_RESUME_COPY,
	] ) {
		assert( text.includes( claim ), `Résumé is missing required evidence: ${ claim }.` );
	}
	const forbiddenCopy = findForbiddenResumeCopy( text );
	assert( ! forbiddenCopy, `Résumé contains forbidden stale copy: ${ forbiddenCopy }.` );

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
	assert( themeSection.includes( `v${ themeVersion }` ), `Résumé must name the released HPerkins Tokens v${ themeVersion }.` );

	const forbiddenClaims = [
		[ /\bSolutions Engineer\b/i, 'Solutions Engineer framing' ],
		[ /\bSupport first,? then\b/i, 'transitional Support framing' ],
		[ /\bclient engagements?\b/i, 'generic client-engagement claim' ],
		[ /\bclient projects?\b/i, 'generic client-project claim' ],
		[ /\bclients\b/i, 'plural client claim' ],
		[ /\benterprise[- ]scale\b/i, 'unsupported enterprise-scale claim' ],
		[ /\bv2\.0\b/i, 'stale provider version v2.0' ],
		// Defects found and fixed on my own property are not evidence: they cleared
		// nobody else's bar. Root-cause claims must rest on upstream reports.
		[ /PRODUCTION ROOT-CAUSE DEBUGGING/i, 'self-fixed theme regression section' ],
	];
	for ( const [ pattern, label ] of forbiddenClaims ) {
		assert( ! pattern.test( text ), `Résumé contains forbidden ${ label }.` );
	}

	const urls = externalHyperlinkSequence( archive );
	const uniqueUrls = new Set( urls );
	assert( uniqueUrls.size >= 12, `Résumé DOCX has only ${ uniqueUrls.size } unique external links; expected the full evidence set.` );
	for ( const url of urls ) {
		assert( /^(?:https:\/\/|mailto:)/.test( url ), `Résumé link must use HTTPS or mailto: ${ url }.` );
	}
	for ( const requiredUrl of [
		'https://github.com/WordPress/ai/pull/501',
		'https://github.com/WordPress/php-ai-client/pull/263',
		'https://github.com/WordPress/ai-provider-for-openai/pull/40',
		'https://github.com/WordPress/ai/issues/529',
		'https://github.com/WordPress/ai/pull/593',
		'https://github.com/WordPress/ai/releases/tag/1.0.1',
		'https://github.com/WordPress/ai/issues/732',
		'https://github.com/WordPress/ai/pull/757',
		'https://github.com/henryperkins/flavor-agent/releases/tag/v0.1.0-rc.3',
		`https://github.com/henryperkins/ai-provider-for-codex/releases/tag/v${ providerVersion }`,
		`https://github.com/henryperkins/hperkins-tokens/releases/tag/v${ themeVersion }`,
	] ) {
		assert( uniqueUrls.has( requiredUrl ), `Résumé DOCX is missing required immutable/public link: ${ requiredUrl }.` );
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

function pdfIndirectObjects( source ) {
	const objects = new Map();
	for ( const match of source.matchAll( /(?:^|[\r\n])(\d+)\s+(\d+)\s+obj\b([\s\S]*?)\bendobj\b/g ) ) {
		objects.set( `${ match[1] } ${ match[2] }`, match[3] );
	}
	return objects;
}

function pdfReferences( source ) {
	return [ ...source.matchAll( /(\d+)\s+(\d+)\s+R\b/g ) ].map( ( match ) => `${ match[1] } ${ match[2] }` );
}

function pdfArrayForKey( body, key, objects ) {
	const direct = body.match( new RegExp( `/${ key }\\s*\\[([\\s\\S]*?)\\]` ) );
	if ( direct ) {
		return direct[1];
	}
	const indirect = body.match( new RegExp( `/${ key }\\s+(\\d+)\\s+(\\d+)\\s+R\\b` ) );
	if ( ! indirect ) {
		return null;
	}
	const arrayObject = objects.get( `${ indirect[1] } ${ indirect[2] }` );
	if ( ! arrayObject ) {
		return null;
	}
	const array = arrayObject.match( /\[([\s\S]*?)\]/ );
	return array ? array[1] : null;
}

function pdfPageSequence( objects ) {
	const catalog = [ ...objects.values() ].find( ( body ) => /\/Type\s*\/Catalog\b/.test( body ) );
	const rootPages = catalog && catalog.match( /\/Pages\s+(\d+)\s+(\d+)\s+R\b/ );
	const pages = [];
	const visit = ( reference ) => {
		const body = objects.get( reference );
		if ( ! body ) {
			return;
		}
		if ( /\/Type\s*\/Page\b/.test( body ) ) {
			pages.push( reference );
			return;
		}
		const kids = pdfArrayForKey( body, 'Kids', objects );
		for ( const child of kids ? pdfReferences( kids ) : [] ) {
			visit( child );
		}
	};
	if ( rootPages ) {
		visit( `${ rootPages[1] } ${ rootPages[2] }` );
	}
	if ( pages.length === 0 ) {
		for ( const [ reference, body ] of objects ) {
			if ( /\/Type\s*\/Page\b/.test( body ) ) {
				pages.push( reference );
			}
		}
	}
	return pages;
}

function pdfUriFromAnnotation( body, objects ) {
	let actionBody = body;
	const actionReference = body.match( /\/A\s+(\d+)\s+(\d+)\s+R\b/ );
	if ( actionReference ) {
		actionBody = objects.get( `${ actionReference[1] } ${ actionReference[2] }` ) || '';
	}
	const uri = pdfUris( actionBody );
	return uri.size === 1 ? [ ...uri ][0] : null;
}

function pdfAnnotationUriSequence( source ) {
	const objects = pdfIndirectObjects( source );
	const urls = [];
	for ( const pageReference of pdfPageSequence( objects ) ) {
		const pageBody = objects.get( pageReference );
		const annots = pdfArrayForKey( pageBody, 'Annots', objects );
		for ( const annotationReference of annots ? pdfReferences( annots ) : [] ) {
			const annotationBody = objects.get( annotationReference );
			const url = annotationBody && pdfUriFromAnnotation( annotationBody, objects );
			if ( url ) {
				urls.push( url );
			}
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
	assert( /\/MarkInfo\b/.test( source ) && /\/Marked\s+true\b/.test( source ), 'Résumé PDF must declare marked content.' );
	assert( /\/StructTreeRoot\b/.test( source ), 'Résumé PDF must include a structure tree.' );
	assert( /\/H1\b/.test( source ), 'Résumé PDF must include an H1 structure tag.' );
	assert( ( source.match( /\/H2\b/g ) || [] ).length >= 4, 'Résumé PDF must include at least four H2 structure tags.' );

	const urls = pdfAnnotationUriSequence( source );
	assert(
		urls.length === docxUrls.length && urls.every( ( url, index ) => url === docxUrls[index] ),
		'Résumé PDF annotation URLs must exactly match DOCX hyperlink order, including duplicates.'
	);

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

function excelSerialToIsoDate( value ) {
	const serial = Number( value );
	assert( Number.isInteger( serial ) && serial > 0, `Spreadsheet Last checked value is not an Excel date serial: ${ value }.` );
	return new Date( Date.UTC( 1899, 11, 30 ) + serial * 86400000 ).toISOString().slice( 0, 10 );
}

function tableSourceByClass( appendixHtml, className ) {
	const escapedClass = className.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
	const figurePattern = new RegExp(
		`<figure\\b[^>]*class="[^"]*\\b${ escapedClass }\\b[^"]*"[^>]*>`,
		'i'
	);
	const figureMatch = figurePattern.exec( appendixHtml );
	assert( figureMatch, `Appendix is missing the ${ className } table.` );
	const tableStart = appendixHtml.indexOf( '<table', figureMatch.index + figureMatch[0].length );
	const tableEnd = appendixHtml.indexOf( '</table>', tableStart );
	assert( tableStart !== -1 && tableEnd !== -1, `Appendix ${ className } figure has no complete table.` );
	return appendixHtml.slice( tableStart, tableEnd + '</table>'.length );
}

function htmlTableRows( tableSource, urlColumn = -1 ) {
	const sections = [];
	for ( const sectionName of [ 'thead', 'tbody' ] ) {
		const section = tableSource.match( new RegExp( `<${ sectionName }\\b[^>]*>([\\s\\S]*?)<\\/${ sectionName }>`, 'i' ) );
		assert( section, `Appendix table is missing ${ sectionName }.` );
		sections.push( ...[ ...section[1].matchAll( /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi ) ].map( ( rowMatch ) => {
			const cells = [];
			for ( const cellMatch of rowMatch[1].matchAll( /<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi ) ) {
				const body = cellMatch[2];
				if ( cells.length === urlColumn ) {
					const link = body.match( /<a\b([^>]*)>/i );
					if ( link ) {
						const attributes = xmlAttributes( link[1] );
						assert( attributes.href, 'Appendix market-table link is missing href.' );
						cells.push( attributes.href );
						continue;
					}
				}
				cells.push( stripHtml( body ) );
			}
			return cells;
		} ) );
	}
	return sections;
}

function assertTableValues( expectedRows, actualRows, label, columns ) {
	assert(
		actualRows.length === expectedRows.length,
		`${ label } has ${ actualRows.length - 1 } data rows; workbook has ${ expectedRows.length - 1 }.`
	);
	for ( let rowIndex = 0; rowIndex < expectedRows.length; rowIndex += 1 ) {
		assert(
			actualRows[rowIndex].length === expectedRows[rowIndex].length,
			`${ label } row ${ rowIndex } has ${ actualRows[rowIndex].length } cells; expected ${ expectedRows[rowIndex].length }.`
		);
		for ( let columnIndex = 0; columnIndex < expectedRows[rowIndex].length; columnIndex += 1 ) {
			const expected = expectedRows[rowIndex][columnIndex];
			const actual = actualRows[rowIndex][columnIndex];
			assert(
				actual === expected,
				`${ label } row ${ rowIndex }, ${ columns[columnIndex] } differs. Workbook: "${ expected }"; appendix: "${ actual }".`
			);
		}
	}
}

// The published screen merges the workbook's Current state and Screen verdict
// into one State cell. The merge is presentation; the workbook stays the
// seven-column record, so parity projects the workbook onto what the page
// renders rather than the other way round.
const marketRenderedColumns = [ 'Job title', 'Company', 'Posting', 'Last checked', 'State', 'Reasoning' ];
const stateSeparator = ' · ';

function projectWorkbookRow( row ) {
	return [ row[0], row[1], row[2], row[3], `${ row[4] }${ stateSeparator }${ row[5] }`, row[6] ];
}

// The funnel that used to be a static seven-row table is now the market
// filter's chip counts. The derivation stays here: every workbook row must
// still fall in exactly one bucket, and the buckets still have to add up to the
// groups the filter offers. Deleting the table did not delete the check.
function funnelBuckets( workbookRows ) {
	const dataRows = workbookRows.slice( 1 );
	const buckets = [
		{
			label: 'Current live passes',
			group: 'live',
			matches: ( row ) => row[4] === 'Live' && [ 'Pass', 'Pass — manual review' ].includes( row[5] ),
		},
		{
			label: 'Verification unresolved',
			group: 'recheck',
			matches: ( row ) => [ 'Verification pending', 'Unverified' ].includes( row[4] ) && row[5] === 'Needs verification',
		},
		{
			label: 'Historical, not-current passes',
			group: 'historical',
			matches: ( row ) => row[5] === 'Pass — historical',
		},
		{
			label: 'Replaced postings',
			group: 'recheck',
			matches: ( row ) => row[4] === 'Replaced' && row[5] === 'Needs new screen',
		},
		{
			label: 'Expired before screening',
			group: 'recheck',
			matches: ( row ) => row[4].startsWith( 'Expired' ) && row[5] === 'Not screened — expired',
		},
		{
			label: 'Human failures',
			group: 'failed',
			matches: ( row ) => [ 'Fail', 'Fail — overturned' ].includes( row[5] ),
		},
	];
	const groups = { live: 0, historical: 0, recheck: 0, failed: 0 };
	for ( const row of dataRows ) {
		const matches = buckets.filter( ( bucket ) => bucket.matches( row ) );
		assert(
			matches.length === 1,
			`Workbook row "${ row[0] }" belongs to ${ matches.length } funnel buckets; expected exactly one. ` +
			`State/verdict: ${ JSON.stringify( [ row[4], row[5] ] ) }.`
		);
		groups[matches[0].group] += 1;
	}
	return groups;
}

// The rendered State cell is the only place the merge is visible, so it is the
// only honest input for the counts the page shows. Classifying it back into the
// same four groups proves the merge did not lose or move a row.
function renderedMarketGroups( marketRows ) {
	const groups = { live: 0, historical: 0, recheck: 0, failed: 0 };
	marketRows.slice( 1 ).forEach( ( row, index ) => {
		const group = classifyWith( row[4], MARKET_TOKENS );
		assert(
			group,
			`Appendix market row ${ index + 1 } has a State the filter cannot classify: "${ row[4] }".`
		);
		groups[group] += 1;
	} );
	return groups;
}

function lastCheckedSummary( workbookRows ) {
	const counts = new Map();
	let missing = 0;
	for ( const row of workbookRows.slice( 1 ) ) {
		if ( row[3] === '' ) {
			missing += 1;
			continue;
		}
		counts.set( row[3], ( counts.get( row[3] ) || 0 ) + 1 );
	}
	const dated = [ ...counts.entries() ]
		.sort( ( left, right ) => right[0].localeCompare( left[0] ) )
		.map( ( [ date, count ] ) => `${ date } — ${ count } ${ count === 1 ? 'row' : 'rows' }` );
	return `Last checked distribution: ${ [ ...dated, `not recorded — ${ missing } ${ missing === 1 ? 'row' : 'rows' }` ].join( '; ' ) }.`;
}

// The hero's three scope chips are counts, and a count on this page is a claim.
// The funnel table used to be the only derived number checked against the
// workbook; when it went, the chips became the page's most prominent unchecked
// arithmetic — and the first draft of them asserted every state was dated when
// five rows carry no date at all. Derive them here so a chip cannot drift from
// the ledger it summarizes.
function verifyAppendixScopeChips( workbookRows, appendixHtml, groups ) {
	const dataRows = workbookRows.slice( 1 );
	const dated = dataRows.filter( ( row ) => row[3] !== '' ).length;
	const overturned = dataRows.filter( ( row ) => row[5] === 'Fail — overturned' ).length;
	const keywordRows = htmlTableRows( tableSourceByClass( appendixHtml, 'hp-keyword-table' ) ).length - 1;

	const scopeMatch = /<div\b[^>]*class="[^"]*\bhp-method-scope\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec( appendixHtml );
	assert( scopeMatch, 'Appendix is missing the hero scope bar.' );
	const chips = [ ...scopeMatch[1].matchAll( /<p\b[^>]*class="[^"]*\bhp-chip\b[^"]*"[^>]*>([\s\S]*?)<\/p>/gi ) ]
		.map( ( match ) => stripHtml( match[1] ) );

	const expected = [
		`${ keywordRows } résumé terms audited against five postings`,
		`${ dataRows.length } market rows screened, ${ dated } with a dated check`,
		`${ groups.failed } rows failed by hand, ${ overturned } overturning an AI pass`,
	];

	assert(
		chips.length === expected.length,
		`Appendix hero states ${ chips.length } scope chips; expected ${ expected.length }.`
	);
	expected.forEach( ( text, index ) => {
		assert(
			chips[index] === text,
			`Appendix scope chip ${ index + 1 } differs. Derived: "${ text }"; appendix: "${ chips[index] }".`
		);
	} );
}

function verifyAppendixWorkbookParity( workbookRows, appendixHtml ) {
	assert(
		workbookRows.length > 1 && approvedColumns.every( ( column, index ) => workbookRows[0][index] === column ),
		'Workbook rows supplied to appendix parity must begin with the seven approved columns.'
	);
	const marketRows = htmlTableRows( tableSourceByClass( appendixHtml, 'hp-market-table' ), 2 );
	const expectedRows = [ marketRenderedColumns, ...workbookRows.slice( 1 ).map( projectWorkbookRow ) ];
	assertTableValues( expectedRows, marketRows, 'Appendix market table', marketRenderedColumns );

	const expectedGroups = funnelBuckets( workbookRows );
	const actualGroups = renderedMarketGroups( marketRows );
	for ( const [ group, expected ] of Object.entries( expectedGroups ) ) {
		assert(
			actualGroups[group] === expected,
			`Appendix market screen shows ${ actualGroups[group] } ${ group } rows; the workbook derives ${ expected }.`
		);
	}

	verifyAppendixScopeChips( workbookRows, appendixHtml, expectedGroups );

	const dateSummaryMatch = appendixHtml.match(
		/<p\b[^>]*class="[^"]*\bhp-market-date-summary\b[^"]*"[^>]*>([\s\S]*?)<\/p>/i
	);
	assert( dateSummaryMatch, 'Appendix is missing the derived last-checked summary.' );
	const expectedDateSummary = lastCheckedSummary( workbookRows );
	const actualDateSummary = stripHtml( dateSummaryMatch[1] );
	assert(
		actualDateSummary === expectedDateSummary,
		`Appendix Last checked summary differs. Workbook: "${ expectedDateSummary }"; appendix: "${ actualDateSummary }".`
	);
}

function verifyWorkbook( path ) {
	const archive = openZip( path );
	// OOXML permits either package-level shared strings or inline strings in
	// cells. Google Sheets currently exports this public workbook with inline
	// strings, which worksheetRows() already supports.
	for ( const entry of [ 'xl/workbook.xml', 'xl/worksheets/sheet1.xml' ] ) {
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
	const dimension = worksheetXml.match( /<dimension\b[^>]*\bref="([^"]+)"/ );
	assert( ! dimension || dimension[1] === 'A1:G21', `Public workbook used range must be exactly A1:G21 when declared; found ${ dimension ? dimension[1] : '<omitted>' }.` );
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
	if ( archive.has( 'xl/tables/table1.xml' ) ) {
		const tableXml = archive.text( 'xl/tables/table1.xml' );
		assert( /<table\b[^>]*\bref="A1:G21"/.test( tableXml ), 'Public workbook table must be exactly A1:G21.' );
		assert(
			approvedColumns.every( ( column ) => tableXml.includes( `name="${ column.replace( /&/g, '&amp;' ) }"` ) ),
			'Public workbook table metadata does not match the seven approved columns.'
		);
	}

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

	return values.map( ( row, rowIndex ) => row.map( ( value, columnIndex ) => {
		if ( rowIndex > 0 && columnIndex === 3 && value !== '' ) {
			if ( /^\d{4}-\d{2}-\d{2}$/.test( value ) ) {
				return value;
			}
			return excelSerialToIsoDate( value );
		}
		return value;
	} ) );
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
	const themeVersion = releasedThemeVersion();
	const docxUrls = verifyDocx( paths[ artifactNames[0] ], themeVersion );
	const pdfUrls = verifyPdf( paths[ artifactNames[1] ], docxUrls );
	const workbookRows = verifyWorkbook( paths[ artifactNames[2] ] );
	verifyAppendixWorkbookParity( workbookRows, readFileSync( appendixDraftPath, 'utf8' ) );
	if ( checkLinks ) {
		await verifyLinks( new Set( pdfUrls ) );
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

module.exports = {
	compactText,
	externalHyperlinkSequence,
	externalRelationships,
	findForbiddenResumeCopy,
	pdfAnnotationUriSequence,
	pdfUris,
	unescapePdfString,
	verifyAppendixWorkbookParity,
	verifyDocx,
	verifyLinks,
	verifyPdf,
	xmlAttributes,
	xmlText,
};
