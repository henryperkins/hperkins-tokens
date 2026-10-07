const assert = require( 'node:assert/strict' );
const { createHash } = require( 'node:crypto' );
const fs = require( 'node:fs' );
const os = require( 'node:os' );
const path = require( 'node:path' );
const test = require( 'node:test' );

const { crc32, openZip } = require( './zip-archive' );
const {
	compactText,
	externalHyperlinkSequence,
	findForbiddenResumeCopy,
	pdfAnnotationUriSequence,
	xmlAttributes,
	xmlText,
} = require( '../verify-placement-artifacts' );

const themeRoot = path.join( __dirname, '..', '..' );
const docxPath = path.join( themeRoot, 'assets', 'documents', 'henry-perkins-wordpress-support-engineer-resume.docx' );
const pdfPath = path.join( themeRoot, 'assets', 'documents', 'henry-perkins-wordpress-support-engineer-resume.pdf' );
const workbookPath = path.join( themeRoot, 'assets', 'documents', 'wordpress-job-market-screen-live-states.xlsx' );

const REQUIRED_RESUME_COPY = [
	'WORDCAMP US 2026 — Phoenix · Staffed the Core AI booth, walking maintainers and agency developers through AI provider tooling',
	'WordPress/ai PR #501',
	'WordPress/php-ai-client PR #263',
	'WordPress/ai-provider-for-openai PR #40',
	'Issue #529',
	'A maintainer’s fix, PR #593',
	'Issue #732',
	'Anubhav Anand’s proposed fix (PR #757, open)',
	'Directed and reviewed an AI-assisted',
	'Independent projects developed with AI assistance under my direction and review; public tagged releases.',
	'Flavor Agent — Creator',
	'v0.1.0',
	'Aug 26, 2026',
	'Provides validation, admin approval, audit records, and undo workflows for supported AI-proposed WordPress changes.',
	'AI Provider for Codex — Creator',
	'HPerkins Tokens — Creator',
	'WordPress block theme with token-based editor controls and verifier scripts for content, typography, and accessibility checks.',
];

const FORBIDDEN_RESUME_COPY = [
	'as of Jul 30, 2026',
	'54 commits ahead',
	'30 contracts',
	'35 contracts',
	'my PR #593',
	'my PR #757',
	'final v0.1.0',
	// Retired 2026-09-04 with the support-role résumé review.
	'Selected to staff the Core AI booth',
	'v0.1.0-rc.3',
	'post-RC3',
	'unreleased',
	'TARGET: SUPPORT ENGINEER',
	'OPEN UPSTREAM CODE',
	'RELEASED OWNED WORK',
	'PRERELEASE + ACTIVE',
	' — Author',
	'authored regression coverage',
	'authored model-aware',
	'safe undo',
	'editors choose only named design tokens',
	'Solo projects, built AI-assisted',
];

const REQUIRED_IMMUTABLE_URLS = [
	'https://github.com/WordPress/php-ai-client/pull/263',
	'https://github.com/WordPress/ai-provider-for-openai/pull/40',
	'https://github.com/WordPress/ai/pull/593',
	'https://github.com/WordPress/ai/releases/tag/1.0.1',
	'https://github.com/WordPress/ai/pull/757',
	'https://github.com/henryperkins/flavor-agent/releases/tag/v0.1.0',
	'https://github.com/henryperkins/ai-provider-for-codex/releases/tag/v2.1',
	'https://github.com/henryperkins/hperkins-tokens/releases/tag/v0.3.53',
];

function docxHyperlinkSequence( archive ) {
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
		const relationshipId = xmlAttributes( match[1] )[ 'r:id' ];
		if ( relationshipId && relationships.has( relationshipId ) ) {
			urls.push( relationships.get( relationshipId ) );
		}
	}
	return urls;
}

test( 'resume carries the approved current WCUS and evidence copy', () => {
	const archive = openZip( docxPath );
	const text = compactText( xmlText( archive.text( 'word/document.xml' ) ) );

	for ( const requiredCopy of REQUIRED_RESUME_COPY ) {
		assert.ok( text.includes( requiredCopy ), `resume is missing: ${ requiredCopy }` );
	}
	for ( const forbiddenCopy of FORBIDDEN_RESUME_COPY ) {
		assert.ok( ! text.includes( forbiddenCopy ), `resume retains forbidden copy: ${ forbiddenCopy }` );
	}
} );

test( 'resume uses the separate letterhead and readable record metadata', () => {
	const archive = openZip( docxPath );
	const text = compactText( xmlText( archive.text( 'word/document.xml' ) ) );
	assert.ok( text.startsWith( 'Henry Perkins WORDPRESS SUPPORT ENGINEER' ) );
	assert.ok( text.includes( 'github.com/henryperkins' ) );
	assert.ok( text.includes( 'Lakefront Digital — Independent Technology Consultant' ) );
	assert.ok( text.indexOf( 'WordPress support professional' ) < text.indexOf( 'WORDCAMP US 2026' ), 'The support summary must precede the event credential.' );
	assert.equal( ( text.match( /\bFIX SHIPPED\b/g ) || [] ).length, 1 );
	assert.equal( ( text.match( /\bOPEN\b/g ) || [] ).length, 2 );
	assert.equal( ( text.match( /\bMERGED\b/g ) || [] ).length, 2 );
	const flavorRecord = text.slice( text.indexOf( 'Flavor Agent — Creator' ), text.indexOf( 'AI Provider for Codex — Creator' ) );
	assert.ok( flavorRecord.includes( 'v0.1.0' ) && flavorRecord.includes( 'Aug 26, 2026' ), 'The release metadata must remain in the Flavor Agent record.' );
} );

test( 'forbidden numeric copy uses whole-number boundaries', () => {
	assert.equal( findForbiddenResumeCopy( '30 contracts' ), '30 contracts' );
	assert.equal( findForbiddenResumeCopy( '35 contracts' ), '35 contracts' );
	assert.equal( findForbiddenResumeCopy( '130 contracts and 235 contracts' ), null );
} );

test( 'DOCX external-link sequence skips anchor-only hyperlinks and rejects dangling relationships', () => {
	const archive = {
		text( name ) {
			if ( name === 'word/_rels/document.xml.rels' ) {
				return '<Relationships><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://example.test/" TargetMode="External"/></Relationships>';
			}
			return '<w:document><w:hyperlink w:anchor="section-one"/><w:hyperlink r:id="rId1"/></w:document>';
		},
	};
	assert.deepEqual( externalHyperlinkSequence( archive ), [ 'https://example.test/' ] );

	const dangling = {
		...archive,
		text( name ) {
			return name.endsWith( '.rels' ) ? '<Relationships/>' : '<w:document><w:hyperlink r:id="missing"/></w:document>';
		},
	};
	assert.throws( () => externalHyperlinkSequence( dangling ), /unresolved external hyperlink/i );
} );

test( 'DOCX and PDF expose the same ordered external hyperlinks including duplicates', () => {
	const archive = openZip( docxPath );
	const docxUrls = docxHyperlinkSequence( archive );
	const pdfUrls = pdfAnnotationUriSequence( fs.readFileSync( pdfPath ).toString( 'latin1' ) );

	for ( const requiredUrl of REQUIRED_IMMUTABLE_URLS ) {
		assert.ok( docxUrls.includes( requiredUrl ), `DOCX is missing ${ requiredUrl }` );
	}
	assert.deepEqual( pdfUrls, docxUrls );
} );

test( 'PDF link order follows each page Annots array rather than object serialization', () => {
	const source = `%PDF-1.4
1 0 obj
<</Subtype/Link/A<</S/URI/URI(https://example.test/serialized-first)>> >>
endobj
2 0 obj
<</Subtype/Link/A<</S/URI/URI(https://example.test/tab-first)>> >>
endobj
3 0 obj
<</Type/Page/Annots[2 0 R 1 0 R]>>
endobj
`;
	assert.deepEqual( pdfAnnotationUriSequence( source ), [
		'https://example.test/tab-first',
		'https://example.test/serialized-first',
	] );
} );

test( 'PDF combines wrapped annotation rectangles only for one semantic Link owner', () => {
	const source = `%PDF-1.4
1 0 obj
<</Subtype/Link/StructParent 1/A<</S/URI/URI(https://example.test/)>>>>
endobj
2 0 obj
<</Subtype/Link/StructParent 2/A<</S/URI/URI(https://example.test/)>>>>
endobj
3 0 obj
<</Subtype/Link/StructParent 3/A<</S/URI/URI(https://example.test/)>>>>
endobj
4 0 obj
<</Type/Page/Annots[1 0 R 2 0 R 3 0 R]>>
endobj
5 0 obj
<</Type/Catalog/Pages 4 0 R/StructTreeRoot 6 0 R>>
endobj
6 0 obj
<</Type/StructTreeRoot/ParentTree 7 0 R>>
endobj
7 0 obj
<</Kids[10 0 R]>>
endobj
8 0 obj
<</Type/StructElem/S/Link>>
endobj
9 0 obj
<</Type/StructElem/S/Link>>
endobj
10 0 obj
<</Nums[1 8 0 R 2 8 0 R 3 9 0 R]>>
endobj
`;
	assert.deepEqual( pdfAnnotationUriSequence( source ), [ 'https://example.test/', 'https://example.test/' ] );
	assert.throws( () => pdfAnnotationUriSequence( source.replace( '/StructParent 2/A<</S/URI/URI(https://example.test/)', '/StructParent 2/A<</S/URI/URI(https://example.test/different)' ) ), /inconsistent destinations/ );
	assert.throws( () => pdfAnnotationUriSequence( source.replace( '/StructParent 3', '/StructParent 99' ) ), /unresolved Link structure parent/ );
} );

test( 'PDF is a tagged, searchable, one-page document with semantic headings', () => {
	const source = fs.readFileSync( pdfPath ).toString( 'latin1' );
	const pageCounts = [ ...source.matchAll( /\/Type\s*\/Pages\b([\s\S]*?)endobj/g ) ]
		.map( ( match ) => match[1].match( /\/Count\s+(\d+)/ ) )
		.filter( Boolean )
		.map( ( match ) => Number( match[1] ) );

	assert.ok( pageCounts.length > 0 );
	assert.ok( pageCounts.every( ( count ) => count === 1 ), `page counts: ${ pageCounts.join( ', ' ) }` );
	assert.match( source, /\/ToUnicode\b/ );
	assert.match( source, /\/MarkInfo\b/ );
	assert.match( source, /\/Marked\s+true\b/ );
	assert.match( source, /\/StructTreeRoot\b/ );
	assert.match( source, /\/H1\b/ );
	assert.ok( ( source.match( /\/H2\b/g ) || [] ).length >= 4 );
} );

test( 'public workbook accepts the nine blog records without restoring removed originals', () => {
	const { verifyWorkbook } = require( '../verify-placement-artifacts' );
	assert.equal( typeof verifyWorkbook, 'function', 'The public workbook contract must be callable independently of résumé and appendix checks.' );
	const rows = verifyWorkbook( workbookPath );
	assert.equal( rows.length, 10 );
	assert.deepEqual( rows.slice( 1 ).map( ( row ) => row.slice( 0, 2 ) ), [
		[ 'Technical Account Manager, Newspack', 'Automattic (Newspack)' ],
		[ 'Senior Web Engineer (Contract)', 'Fueled (10up practice)' ],
		[ 'Senior WordPress Engineer (Freelance)', 'XWP' ],
		[ 'Freelance Senior Web Engineer', 'Human Made (Altis DXP)' ],
		[ 'Senior WordPress Engineer', 'Syde' ],
		[ 'Solutions Engineer — Media, WordPress VIP', 'Automattic (WordPress VIP)' ],
		[ 'Full Stack Web Engineer', '10up (Fueled)' ],
		[ 'Customer support role (anonymized)', 'Target-ecosystem employer (anonymized)' ],
		[ 'Staff Web Engineer', '10up (Fueled)' ],
	] );
} );

// Repackage the real export after one controlled XML mutation, exercising the
// same ZIP/worksheet boundary as the public artifact without changing it.
function mutatedWorkbook( context, changeContents, changedEntry = 'xl/worksheets/sheet1.xml' ) {
	const archive = openZip( workbookPath );
	const localRecords = [];
	const centralRecords = [];
	let offset = 0;
	for ( const entry of archive.list() ) {
		const name = Buffer.from( entry );
		let contents = archive.read( entry );
		if ( entry === changedEntry ) {
			const before = contents.toString( 'utf8' );
			const after = changeContents( before );
			assert.ok( after !== before, 'The regression fixture must change the real workbook XML.' );
			contents = Buffer.from( after );
		}
		const checksum = crc32( contents );
		const local = Buffer.alloc( 30 + name.length );
		local.writeUInt32LE( 0x04034b50, 0 );
		local.writeUInt16LE( 20, 4 );
		local.writeUInt16LE( 0x0800, 6 );
		local.writeUInt32LE( checksum, 14 );
		local.writeUInt32LE( contents.length, 18 );
		local.writeUInt32LE( contents.length, 22 );
		local.writeUInt16LE( name.length, 26 );
		name.copy( local, 30 );
		localRecords.push( local, contents );
		const central = Buffer.alloc( 46 + name.length );
		central.writeUInt32LE( 0x02014b50, 0 );
		central.writeUInt16LE( 20, 4 );
		central.writeUInt16LE( 20, 6 );
		central.writeUInt16LE( 0x0800, 8 );
		central.writeUInt32LE( checksum, 16 );
		central.writeUInt32LE( contents.length, 20 );
		central.writeUInt32LE( contents.length, 24 );
		central.writeUInt16LE( name.length, 28 );
		central.writeUInt32LE( offset, 42 );
		name.copy( central, 46 );
		centralRecords.push( central );
		offset += local.length + contents.length;
	}
	const directory = Buffer.concat( centralRecords );
	const end = Buffer.alloc( 22 );
	end.writeUInt32LE( 0x06054b50, 0 );
	end.writeUInt16LE( centralRecords.length, 8 );
	end.writeUInt16LE( centralRecords.length, 10 );
	end.writeUInt32LE( directory.length, 12 );
	end.writeUInt32LE( offset, 16 );
	const temporaryDir = fs.mkdtempSync( path.join( os.tmpdir(), 'hperkins-workbook-contract-' ) );
	context.after( () => fs.rmSync( temporaryDir, { recursive: true, force: true } ) );
	const fixturePath = path.join( temporaryDir, 'mutated.xlsx' );
	fs.writeFileSync( fixturePath, Buffer.concat( [ ...localRecords, directory, end ] ) );
	return fixturePath;
}

test( 'public workbook rejects a stale 20-row used range', ( context ) => {
	const fixture = mutatedWorkbook( context, ( source ) => source.replace( /(<worksheet\b[^>]*>)/, '$1<dimension ref="A1:G21"/>' ) );
	assert.throws( () => require( '../verify-placement-artifacts' ).verifyWorkbook( fixture ), /used range must be exactly A1:G10/ );
} );

test( 'public workbook rejects a removed job restored without changing row count', ( context ) => {
	const fixture = mutatedWorkbook( context, ( source ) => source.replace( 'Technical Account Manager, Newspack', 'Support Engineer, VIP' ), 'xl/sharedStrings.xml' );
	assert.throws( () => require( '../verify-placement-artifacts' ).verifyWorkbook( fixture ), /must retain job identity and canonical URL/ );
} );

test( 'public workbook rejects restoring the WP Engine record removed at the user’s request', ( context ) => {
	const fixture = mutatedWorkbook( context, ( source ) => source
		.replace( 'Technical Account Manager, Newspack', 'Technical Support L1' )
		.replace( 'Automattic (Newspack)', 'WP Engine' ), 'xl/sharedStrings.xml' );
	assert.throws( () => require( '../verify-placement-artifacts' ).verifyWorkbook( fixture ), /must retain job identity and canonical URL/ );
} );

test( 'public workbook rejects a replacement URL promoted as the retained original', ( context ) => {
	const fixture = mutatedWorkbook( context, ( source ) => source.replace( 'https://syde.com/career/senior-wordpress-engineer/', 'https://syde.com/career/senior-wordpress-engineer-2/' ), 'xl/sharedStrings.xml' );
	assert.throws( () => require( '../verify-placement-artifacts' ).verifyWorkbook( fixture ), /must retain job identity and canonical URL/ );
} );

test( 'public workbook still rejects private application notes after cleanup', ( context ) => {
	const fixture = mutatedWorkbook( context, ( source ) => source.replace( 'Q1 passes because the output', 'Interview status: Q1 passes because the output' ), 'xl/sharedStrings.xml' );
	assert.throws( () => require( '../verify-placement-artifacts' ).verifyWorkbook( fixture ), /private interview progress data/ );
} );

test( 'public workbook download link accepts the current native theme-owned hash URL', () => {
	const { verifyWorkbookDownloadLink } = require( '../verify-placement-artifacts' );
	assert.equal( typeof verifyWorkbookDownloadLink, 'function' );
	const digest = createHash( 'sha256' ).update( fs.readFileSync( workbookPath ) ).digest( 'hex' );
	const href = `/wp-content/themes/hperkins-tokens/assets/documents/wordpress-job-market-screen-live-states.xlsx?market-version=${ digest }`;
	const html = `<!-- <a href="${ href }">Comment only</a> --><p><a href="${ href }">Download XLSX</a></p>`;
	assert.doesNotThrow( () => verifyWorkbookDownloadLink( html, workbookPath ) );
} );

test( 'public workbook download link rejects stale hashes and external substitutions', () => {
	const { verifyWorkbookDownloadLink } = require( '../verify-placement-artifacts' );
	for ( const href of [
		'/wp-content/themes/hperkins-tokens/assets/documents/wordpress-job-market-screen-live-states.xlsx?market-version=000000000000',
		'https://example.test/wordpress-job-market-screen-live-states.xlsx?market-version=3a1f91995f5e',
		'/wp-content/themes/hperkins-tokens/assets/documents/wordpress-job-market-screen-live-states.xlsx?v=3a1f91995f5e',
	] ) {
		assert.throws( () => verifyWorkbookDownloadLink( `<a href="${ href }">XLSX</a>`, workbookPath ), /theme-owned URL with its current full SHA256/ );
	}
} );

test( 'public workbook download link rejects missing and duplicate native anchors', () => {
	const { verifyWorkbookDownloadLink } = require( '../verify-placement-artifacts' );
	const anchor = '<a href="/wp-content/themes/hperkins-tokens/assets/documents/wordpress-job-market-screen-live-states.xlsx?market-version=3a1f91995f5e">XLSX</a>';
	assert.throws( () => verifyWorkbookDownloadLink( '<p>Download XLSX</p>', workbookPath ), /exactly one native workbook download link/ );
	assert.throws( () => verifyWorkbookDownloadLink( anchor + anchor, workbookPath ), /exactly one native workbook download link/ );
} );

test( 'public workbook download link becomes stale when the artifact bytes change', ( context ) => {
	const { verifyWorkbookDownloadLink } = require( '../verify-placement-artifacts' );
	const digest = createHash( 'sha256' ).update( fs.readFileSync( workbookPath ) ).digest( 'hex' );
	const fixture = mutatedWorkbook( context, ( source ) => source.replace( 'Technical Account Manager, Newspack', 'Updated workbook fixture' ), 'xl/sharedStrings.xml' );
	const html = `<a href="/wp-content/themes/hperkins-tokens/assets/documents/wordpress-job-market-screen-live-states.xlsx?market-version=${ digest }">XLSX</a>`;
	assert.throws( () => verifyWorkbookDownloadLink( html, fixture ), /theme-owned URL with its current full SHA256/ );
} );

test( 'public workbook download link rejects the current shortened hash key', () => {
	const { verifyWorkbookDownloadLink } = require( '../verify-placement-artifacts' );
	const digest = createHash( 'sha256' ).update( fs.readFileSync( workbookPath ) ).digest( 'hex' );
	const html = `<a href="/wp-content/themes/hperkins-tokens/assets/documents/wordpress-job-market-screen-live-states.xlsx?market-version=${ digest.substring( 0, 12 ) }">XLSX</a>`;
	assert.throws( () => verifyWorkbookDownloadLink( html, workbookPath ), /theme-owned URL with its current full SHA256/ );
} );
