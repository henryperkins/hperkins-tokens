const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const test = require( 'node:test' );

const { openZip } = require( './zip-archive' );
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
