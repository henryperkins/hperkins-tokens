const assert = require( 'node:assert/strict' );
const { findHeadings, findLinks, parseTopLevelBlocks, extractExactText } = require( './about-page-contract' );

const RESEARCH_ANCHORS = [ 'resume-keyword-bank', 'what-i-optimize-for', 'screening-funnel', 'live-states', 'delisted-and-overturned' ];

function verifyPlacementBrief( markup ) {
	const blocks = parseTopLevelBlocks( markup );
	assert.equal( blocks.length, 1, 'The brief has one native root group.' );
	assert.equal( blocks[ 0 ].attrs.className, 'hp-placement-brief' );
	const details = markup.match( /<details\b([^>]*)>([\s\S]*?)<\/details>/ );
	assert( details && ! /\bopen\b/.test( details[ 1 ] ), 'Research starts in one closed native disclosure.' );
	assert.equal( ( markup.match( /<details\b/g ) || [] ).length, 1 );
	assert( details[ 2 ].includes( '<summary>Placement research, July 2026</summary>' ) );
	for ( const anchor of RESEARCH_ANCHORS ) {
		assert( details[ 2 ].includes( `id="${ anchor }"` ), `Research retains #${ anchor }.` );
	}
	const visible = markup.replace( details[ 0 ], '' );
	const headings = findHeadings( visible, 'placement brief' );
	assert.deepEqual( headings.map( ( h ) => h.level ), [ 1, 2, 3, 3, 3, 2, 2 ], 'All three items belong to Selected work.' );
	assert.equal( headings[ 1 ].text, 'Selected work' );
	assert.equal( headings[ 5 ].text, 'How I work' );
	assert.match( headings[ 6 ].text, /Bring me the problem\s*behind the ticket\./ );
	const ids = [ ...markup.matchAll( /\bid="([^"]+)"/g ) ].map( ( m ) => m[ 1 ] );
	assert.equal( new Set( ids ).size, ids.length, 'Anchor IDs are unique.' );
	const links = findLinks( visible );
	assert.equal( links.filter( ( l ) => l.href === '/contact/' ).length, 1 );
	assert.equal( links.filter( ( l ) => l.href === '/one-page-resume/' ).length, 1 );
	assert( links.find( ( l ) => l.href === '/one-page-resume/' ).text.includes( 'PDF' ) );
	const hero = visible.split( 'id="current-support-fit"' )[ 0 ];
	assert( ! hero.includes( 'href="/contact/"' ), 'The hero offers only the résumé.' );
	for ( const link of links.filter( ( l ) => l.href.startsWith( 'https://github.com/' ) ) ) {
		assert( link.text.endsWith( '↗' ), `GitHub link names its external artifact: ${ link.text }` );
	}
	for ( const href of [ '/how-this-was-built/', 'https://github.com/WordPress/ai/issues/732', 'https://github.com/WordPress/ai/pull/757', 'https://github.com/WordPress/ai/pull/501', 'https://github.com/WordPress/ai/issues/529', 'https://github.com/WordPress/ai/pull/593', 'https://github.com/WordPress/ai/releases/tag/1.0.1', 'https://github.com/henryperkins/ai-provider-for-codex/releases/tag/v2.1' ] ) {
		assert( links.some( ( l ) => l.href === href ), `Missing selected evidence: ${ href }` );
	}
	const text = extractExactText( visible );
	for ( const fact of [ 'Support Engineer', 'WordPress.com Happiness Engineer, 2012', 'Anubhav Anand wrote the fix', 'which is still open', 'the report and the testing are mine', 'double-logged successes', 'still dropped failures', 'eight files revised through maintainer review', 'I built and released AI Provider for Codex v2.1', 'local sidecar with ChatGPT-managed authentication', 'HPerkins Tokens', 'I do not yet have a public enterprise-scale monitoring or incident record' ] ) {
		assert( text.includes( fact ), `Missing scope or attribution: ${ fact }` );
	}
	assert.equal( ( text.match( /States checked/g ) || [] ).length, 1 );
	assert.match( visible, /States checked <time datetime="\d{4}-\d{2}-\d{2}">/ );
	assert( ! /hp-digest-kicker|hp-placement-standing-tiles|hp-resume-keyword-bank|hp-live-states/.test( markup ), 'The brief removes duplicate labels and filter controllers.' );
	const tables = [ ...details[ 2 ].matchAll( /<tbody>([\s\S]*?)<\/tbody>/g ) ];
	assert.deepEqual( tables.map( ( m ) => ( m[ 1 ].match( /<tr>/g ) || [] ).length ), [ 34, 20 ], 'The complete research records survive consolidation.' );
	return { visibleText: text, headings, researchAnchors: RESEARCH_ANCHORS };
}

module.exports = { verifyPlacementBrief, RESEARCH_ANCHORS };
