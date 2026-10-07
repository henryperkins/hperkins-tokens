const assert = require( 'node:assert/strict' );
const { findHeadings, findLinks, parseTopLevelBlocks, extractExactText } = require( './about-page-contract' );

const RESEARCH_ANCHORS = [ 'resume-keyword-bank', 'what-i-optimize-for', 'screening-funnel', 'live-states', 'delisted-and-overturned' ];
const EXAMPLES = [
	[ 'root-cause-investigation', '01', 'Finding what the request log missed' ],
	[ 'upstream-documentation', '02', 'Documentation that made it upstream' ],
	[ 'codex-provider', '03', 'Tools I build and keep running' ],
];
const ARCHIVE_COPY_EDITS = [
	[ 'Job Placement Digest · research appendix', 'Archived placement research · July 2026' ],
	[ 'Method published 13 Jul 2026 · Ledger reconciled 21 Jul 2026', 'Method published 13 Jul 2026 · Ledger reconciled 21 Jul 2026 · No longer updated' ],
	[ 'This appendix holds the research that would slow the recruiter-facing case down: the full keyword ledger, the screen behind it, every row state, and the decisions I overturned. Posting status is a dated observation, not a promise that a vacancy is still open.', 'This archive keeps the research behind the Support Engineering page: the full keyword ledger, the screen behind it, every row state, and the decisions I overturned. I no longer update it, so each posting state is a July 2026 observation, not a promise that a vacancy is still open.' ],
	[ 'Back to the Job Placement Digest', '← Back to Support Engineering' ],
	[ 'Read the Job Placement Digest', 'Back to Support Engineering' ],
];

function verifyUniqueIds( markup ) {
	const ids = [ ...markup.matchAll( /\bid="([^"]+)"/g ) ].map( ( match ) => match[ 1 ] );
	assert.equal( new Set( ids ).size, ids.length, 'Anchor IDs are unique.' );
}

function verifyPlacementBrief( markup ) {
	const blocks = parseTopLevelBlocks( markup );
	assert.equal( blocks.length, 1, 'The brief has one native root group.' );
	assert.equal( blocks[ 0 ].attrs.className, 'hp-placement-brief' );
	const details = markup.match( /<details\b([^>]*)>([\s\S]*?)<\/details>/ );
	assert( details && ! /\bopen\b/.test( details[ 1 ] ), 'Research starts in one closed native disclosure.' );
	assert.equal( ( markup.match( /<details\b/g ) || [] ).length, 1 );
	const summary = /<summary>([\s\S]*?)<\/summary>/.exec( details[ 2 ] );
	assert( summary && extractExactText( summary[ 1 ] ) === 'Archived placement research · July 2026', 'Research uses the dated archive summary.' );
	assert( findLinks( details[ 2 ] ).some( ( link ) => link.href === '/placement-method-and-evidence/' ), 'Research links to the full archive.' );
	assert( ! /<table\b/i.test( markup ), 'The brief holds no full research tables.' );
	assert( ! RESEARCH_ANCHORS.some( ( anchor ) => details[ 2 ].includes( 'id="' + anchor + '"' ) ), 'The Option A disclosure has no anchored descendants for full research sections.' );
	const visible = markup.replace( details[ 0 ], '' );
	const headings = findHeadings( visible, 'placement brief' );
	assert.deepEqual( headings.map( ( heading ) => heading.level ), [ 1, 2, 3, 3, 3, 2, 2 ], 'All three items belong to Selected work.' );
	assert.equal( headings[ 0 ].text, 'I investigate WordPress problems and show the work.' );
	assert.equal( headings[ 1 ].text, 'Selected work' );
	assert.equal( headings[ 5 ].text, 'How I work' );
	assert.match( headings[ 6 ].text, /Bring me the problem\s*behind the ticket\./ );
	verifyUniqueIds( markup );
	const articles = [ ...visible.matchAll( /<article\b([^>]*)>([\s\S]*?)<\/article>/g ) ];
	assert.equal( articles.length, 3, 'Selected work contains three equal article examples.' );
	EXAMPLES.forEach( ( [ anchor, number, title ], index ) => {
		const article = articles[ index ];
		assert( article[ 1 ].includes( 'hp-placement-brief__example' ) && article[ 1 ].includes( 'id="' + anchor + '"' ), 'Each equal example uses its real article target: ' + anchor );
		assert( article[ 2 ].includes( 'hp-placement-brief__example-body' ), 'Each example keeps its text body beside its numeral.' );
		assert.match( article[ 2 ], new RegExp( 'hp-placement-brief__number[^>]*>[\\s\\S]*?' + number + '[\\s\\S]*?</p>' ), 'Each example has its ordered numeral.' );
		assert.equal( headings[ index + 2 ].text, title );
		assert.equal( ( article[ 2 ].match( /<p\b[^>]*class="[^"]*\bhp-placement-brief__fact(?=\s|")/g ) || [] ).length, 2, 'Each example has Role and Status facts.' );
		const labels = [ ...article[ 2 ].matchAll( /<span class="hp-placement-brief__fact-label">([^<]+)<\/span>/g ) ].map( ( match ) => match[ 1 ] );
		assert.deepEqual( labels, [ 'Role', 'Status' ], 'Each example labels its ownership and current state.' );
		assert( article[ 2 ].includes( index === 0 ? 'hp-chip--review' : 'hp-chip--merged' ), 'Each example carries the reviewed status-chip state.' );
	} );
	const jumps = /<ol\b[^>]*class="[^"]*\bhp-placement-brief__jump-list\b[^"]*"[^>]*>([\s\S]*?)<\/ol>/.exec( visible );
	assert( jumps, 'Selected work contains one numbered jump list.' );
	assert.deepEqual( findLinks( jumps[ 1 ] ).map( ( link ) => link.href ), EXAMPLES.map( ( [ anchor ] ) => '#' + anchor ), 'The jump list reaches all three examples in order.' );
	EXAMPLES.forEach( ( [ , number, title ] ) => assert( extractExactText( jumps[ 1 ] ).includes( number ) && jumps[ 1 ].includes( title ), 'The jump list carries example numbers and titles.' ) );
	const links = findLinks( visible );
	assert.equal( links.filter( ( link ) => link.href === '/contact/' ).length, 2, 'Hero and closing each offer Contact.' );
	const resumes = links.filter( ( link ) => link.href === '/one-page-resume/' );
	assert.equal( resumes.length, 2, 'Hero and closing each offer the résumé.' );
	assert( resumes.every( ( link ) => link.text.includes( 'PDF' ) ), 'Both résumé links explicitly name the PDF.' );
	for ( const className of [ 'hero', 'closing' ] ) {
		const section = new RegExp( '<section\\b[^>]*class="[^"]*hp-placement-brief__' + className + '\\b[^"]*"[^>]*>([\\s\\S]*?)</section>' ).exec( visible );
		assert( section, 'The brief keeps its ' + className + ' section.' );
		for ( const href of [ '/contact/', '/one-page-resume/' ] ) {
			assert.equal( findLinks( section[ 1 ] ).filter( ( link ) => link.href === href ).length, 1, 'The ' + className + ' offers one Contact and one résumé action.' );
		}
	}
	for ( const link of links.filter( ( item ) => item.href.startsWith( 'https://github.com/' ) ) ) {
		assert( /↗[\uFE0E\uFE0F]?$/.test( link.text ), 'GitHub link names its external artifact: ' + link.text );
	}
	for ( const href of [ '/how-this-was-built/', '/work/dj-lee-voices-of-judah/', 'https://github.com/WordPress/ai/issues/732', 'https://github.com/WordPress/ai/pull/757#issuecomment-4980297831', 'https://github.com/WordPress/ai/pull/501', 'https://github.com/WordPress/ai/issues/529', 'https://github.com/WordPress/ai/pull/593', 'https://github.com/WordPress/ai/releases/tag/1.0.1', 'https://github.com/WordPress/ai/releases/tag/1.0.0', 'https://github.com/henryperkins/ai-provider-for-codex/releases/tag/v2.1' ] ) {
		assert( links.some( ( link ) => link.href === href ), 'Missing selected evidence: ' + href );
	}
	const text = extractExactText( visible );
	for ( const fact of [ 'Support Engineer', 'WordPress.com Happiness Engineer, 2012', 'Reported and tested by me · fix by Anubhav Anand', 'Fix in review', 'double-logged them', 'still dropped failures', 'eight files in PR #501', 'Built and maintained by me', 'local sidecar with ChatGPT-managed sign-in', 'I do not yet have a public enterprise-scale monitoring or incident record' ] ) {
		assert( text.includes( fact ), 'Missing scope or attribution: ' + fact );
	}
	assert.equal( ( text.match( /States checked/g ) || [] ).length, 1, 'The brief has exactly one status dateline.' );
	assert.match( visible, /States checked <time datetime="2026-10-06">6 October 2026<\/time>/, 'The dateline records the reviewed evidence date.' );
	assert.equal( ( markup.match( /<time\b/g ) || [] ).length, 1, 'The status dateline appears once.' );
	assert( ! /hp-digest-kicker|hp-placement-standing-tiles|hp-resume-keyword-bank|hp-live-states|hp-placement-brief__supporting/.test( markup ), 'The brief removes duplicate labels, filter controllers and the featured split.' );
	return { visibleText: text, headings, researchAnchors: RESEARCH_ANCHORS };
}

function verifyPlacementArchive( markup, acceptedMarkup ) {
	verifyUniqueIds( markup );
	for ( const anchor of RESEARCH_ANCHORS ) assert( markup.includes( 'id="' + anchor + '"' ), 'Archive retains #' + anchor + '.' );
	assert.equal( findHeadings( markup, 'placement archive' )[ 0 ].text, 'Placement Method and Evidence' );
	const tables = [ ...markup.matchAll( /<tbody>([\s\S]*?)<\/tbody>/g ) ].map( ( match ) => match[ 1 ] );
	assert.deepEqual( tables.map( ( table ) => ( table.match( /<tr>/g ) || [] ).length ), [ 34, 20 ], 'The archive retains all 34 keyword and 20 market records.' );
	for ( const [ , updated ] of ARCHIVE_COPY_EDITS ) assert( markup.includes( updated ), 'Missing dated archive copy: ' + updated );
	if ( acceptedMarkup !== undefined ) {
		const acceptedTables = [ ...acceptedMarkup.matchAll( /<tbody>([\s\S]*?)<\/tbody>/g ) ].map( ( match ) => match[ 1 ] );
		assert.deepEqual( tables, acceptedTables, 'Archive records retain byte parity with the accepted snapshot.' );
		let expected = acceptedMarkup;
		if ( ! acceptedMarkup.includes( 'Archived placement research · July 2026' ) ) {
			for ( const [ before, after ] of ARCHIVE_COPY_EDITS ) {
				assert( expected.includes( before ), 'Accepted archive is missing the guarded copy-edit baseline: ' + before );
				expected = expected.replace( before, after );
			}
		}
		assert.equal( markup, expected, 'Archive allows only the five reviewed copy edits against its accepted snapshot.' );
	}
	return { researchAnchors: RESEARCH_ANCHORS, rows: [ 34, 20 ] };
}

module.exports = { verifyPlacementBrief, verifyPlacementArchive, RESEARCH_ANCHORS, EXAMPLES };
