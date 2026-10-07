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

// Reviewed October cleanup only; these identities retain their July cells.
const RETAINED_MARKET_IDENTITIES = [
  [
    "Technical Account Manager, Newspack",
    "Automattic (Newspack)"
  ],
  [
    "Senior Web Engineer (Contract)",
    "Fueled (10up practice)"
  ],
  [
    "Senior WordPress Engineer (Freelance)",
    "XWP"
  ],
  [
    "Freelance Senior Web Engineer",
    "Human Made (Altis DXP)"
  ],
  [
    "Senior WordPress Engineer",
    "Syde"
  ],
  [
    "Solutions Engineer — Media, WordPress VIP",
    "Automattic (WordPress VIP)"
  ],
  [
    "Full Stack Web Engineer",
    "10up (Fueled)"
  ],
  [
    "Customer support role (anonymized)",
    "Target-ecosystem employer (anonymized)"
  ],
  [
    "Staff Web Engineer",
    "10up (Fueled)"
  ],
  [
    "Technical Support L1",
    "WP Engine"
  ]
];
const WORKBOOK_DOWNLOAD_COPY_EDIT = [
	'This is the sanitized public workbook’s ten retained market records after the 6 October 2026 availability cleanup.',
	'Download the <a href="/wp-content/themes/hperkins-tokens/assets/documents/wordpress-job-market-screen-live-states.xlsx?market-version=3a1f91995f5e">public market workbook (XLSX)</a> with ten retained records after the 6 October 2026 availability cleanup.',
];
const ARCHIVE_CLEANUP_COPY_EDITS = [
  [
    "<p class=\"hp-digest__dateline\">Method published 13 Jul 2026 · Ledger reconciled 21 Jul 2026 · No longer updated</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph {\"fontSize\":\"base\"} -->\n<p class=\"has-base-font-size\">This archive keeps the research behind the Support Engineering page: the full keyword ledger, the screen behind it, every row state, and the decisions I overturned. I no longer update it, so each posting state is a July 2026 observation, not a promise that a vacancy is still open.</p>",
    "<p class=\"hp-digest__dateline\">Method published 13 Jul 2026 · Historical ledger reconciled 21 Jul 2026 · Availability cleanup 6 October 2026</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph {\"fontSize\":\"base\"} -->\n<p class=\"has-base-font-size\">This archive keeps the research behind the Support Engineering page: the full keyword ledger, the remaining market-screen records, and the decisions I overturned. An availability check removed ten confirmed unavailable entries on 6 October 2026. The retained posting states, checked dates, and screen verdicts remain historical July observations, not current vacancy or qualification claims.</p>"
  ],
  [
    "<p>Market rows screened</p>\n<!-- /wp:paragraph --></dt>\n<!-- /wp:group -->\n\n<!-- wp:group {\"tagName\":\"dd\",\"className\":\"hp-placement-audit__value\",\"layout\":{\"type\":\"default\"}} -->\n<dd class=\"wp-block-group hp-placement-audit__value\"><!-- wp:paragraph {\"className\":\"hp-placement-audit__value\"} -->\n<p class=\"hp-placement-audit__value\">20</p>\n<!-- /wp:paragraph --></dd>\n<!-- /wp:group -->\n\n<!-- wp:group {\"tagName\":\"dd\",\"className\":\"hp-placement-audit__note\",\"layout\":{\"type\":\"default\"}} -->\n<dd class=\"wp-block-group hp-placement-audit__note\"><!-- wp:paragraph -->\n<p>Every row retained; delistings kept visible.</p>\n<!-- /wp:paragraph --></dd>\n<!-- /wp:group --></div>\n<!-- /wp:group -->\n\n<!-- wp:group {\"className\":\"hp-placement-audit__figure\",\"layout\":{\"type\":\"default\"}} -->\n<div class=\"wp-block-group hp-placement-audit__figure\"><!-- wp:group {\"tagName\":\"dt\",\"layout\":{\"type\":\"default\"}} -->\n<dt class=\"wp-block-group\"><!-- wp:paragraph -->\n<p>Rows failed by hand</p>\n<!-- /wp:paragraph --></dt>\n<!-- /wp:group -->\n\n<!-- wp:group {\"tagName\":\"dd\",\"className\":\"hp-placement-audit__value\",\"layout\":{\"type\":\"default\"}} -->\n<dd class=\"wp-block-group hp-placement-audit__value\"><!-- wp:paragraph {\"className\":\"hp-placement-audit__value\"} -->\n<p class=\"hp-placement-audit__value\">3</p>",
    "<p>Market rows retained</p>\n<!-- /wp:paragraph --></dt>\n<!-- /wp:group -->\n\n<!-- wp:group {\"tagName\":\"dd\",\"className\":\"hp-placement-audit__value\",\"layout\":{\"type\":\"default\"}} -->\n<dd class=\"wp-block-group hp-placement-audit__value\"><!-- wp:paragraph {\"className\":\"hp-placement-audit__value\"} -->\n<p class=\"hp-placement-audit__value\">10</p>\n<!-- /wp:paragraph --></dd>\n<!-- /wp:group -->\n\n<!-- wp:group {\"tagName\":\"dd\",\"className\":\"hp-placement-audit__note\",\"layout\":{\"type\":\"default\"}} -->\n<dd class=\"wp-block-group hp-placement-audit__note\"><!-- wp:paragraph -->\n<p>Ten confirmed unavailable entries removed in October.</p>\n<!-- /wp:paragraph --></dd>\n<!-- /wp:group --></div>\n<!-- /wp:group -->\n\n<!-- wp:group {\"className\":\"hp-placement-audit__figure\",\"layout\":{\"type\":\"default\"}} -->\n<div class=\"wp-block-group hp-placement-audit__figure\"><!-- wp:group {\"tagName\":\"dt\",\"layout\":{\"type\":\"default\"}} -->\n<dt class=\"wp-block-group\"><!-- wp:paragraph -->\n<p>Retained rows failed by hand</p>\n<!-- /wp:paragraph --></dt>\n<!-- /wp:group -->\n\n<!-- wp:group {\"tagName\":\"dd\",\"className\":\"hp-placement-audit__value\",\"layout\":{\"type\":\"default\"}} -->\n<dd class=\"wp-block-group hp-placement-audit__value\"><!-- wp:paragraph {\"className\":\"hp-placement-audit__value\"} -->\n<p class=\"hp-placement-audit__value\">2</p>"
  ],
  [
    "<p>This is the sanitized public workbook reconciled on 21 July 2026, 20 data rows. The six non-URL fields reproduce the workbook’s displayed values verbatim; a non-empty canonical URL is rendered as a safe link to that exact value, and an empty workbook cell remains empty. Delisted, replaced, paused, pending, and screened-out rows stay visible, carrying the date I last checked them wherever the workbook recorded one, and they are not presented as current opportunities.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph {\"className\":\"hp-market-note\"} -->\n<p class=\"hp-market-note\">Every count is a share of the same 20-row denominator — filter the screen to hold one state at a time.</p>",
    "<p>" + WORKBOOK_DOWNLOAD_COPY_EDIT[ 1 ] + " The six non-URL fields reproduce the workbook’s displayed values verbatim; a non-empty canonical URL is rendered as a safe link to that exact value, and an empty workbook cell remains empty. The table’s State, Last checked, and screening reasoning preserve the July research, including missing dates and unresolved original identities. They do not present these records as ten current opportunities.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph {\"className\":\"hp-market-note\"} -->\n<p class=\"hp-market-note\"><strong>6 October 2026 cleanup:</strong> Ten confirmed unavailable entries were removed. The ten retained records comprise two current named applications (Newspack and Syde), three future talent pools (Fueled, XWP, and Human Made), and five unresolved original listings. Syde’s current role page does not prove continuity with the historical requisition. The original July cell values remain intact; current availability, Q1–Q3 role fit, and candidate qualification are separate judgments.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph {\"className\":\"hp-market-note\"} -->\n<p class=\"hp-market-note\">Every filter count is a share of the same ten-row denominator and classifies the preserved July states — filter the screen to hold one historical state at a time.</p>"
  ],
  [
    "<p class=\"hp-market-date-summary\">Last checked distribution: 2026-07-21 — 1 row; 2026-07-20 — 10 rows; 2026-07-18 — 4 rows; not recorded — 5 rows.</p>",
    "<p class=\"hp-market-date-summary\">Historical Last checked distribution among the ten retained rows: 2026-07-20 — 4 rows; 2026-07-18 — 4 rows; not recorded — 2 rows. The 6 October cleanup did not overwrite these July date cells.</p>"
  ],
  [
    "<p>Five validated rows are now delisted, replaced, or dead, and one more is paused. They stay in the ledger with the date I last checked them, or with that date recorded as missing, because removal is part of the market evidence: a dated ledger should show when a good match stopped being actionable, and say so plainly where it cannot.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>Three rows failed on my judgment rather than the machine’s, and one of those the AI had passed. The employer’s brand matched my target ecosystem, so an employer-level association overrode row-level evidence about the customer. The failure was not missing data: the role text and the model’s own rationale both contained the consumer, single-site context that disqualified it. I overturned the result.</p>",
    "<p>The October cleanup removed ten entries whose original applications were confirmed unavailable. Five retained original listings remain unresolved because their posting URLs are missing, so their historical delisted, replaced, removed, or live labels do not establish present availability. They remain visible rather than being substituted with similarly named jobs or removed on an unverified assumption.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>In the original July screen, three rows failed on my judgment rather than the machine’s; two remain in the cleaned ledger, including the one the AI had passed. The employer’s brand matched my target ecosystem, so an employer-level association overrode row-level evidence about the customer. The failure was not missing data: the role text and the model’s own rationale both contained the consumer, single-site context that disqualified it. I overturned the result.</p>"
  ]
];

function marketRows( body ) {
	return [ ...body.matchAll( /<tr>[\s\S]*?<\/tr>/g ) ].map( ( match ) => match[ 0 ] );
}

function marketIdentity( row ) {
	return [ ...row.matchAll( /<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/g ) ].slice( 0, 2 ).map( ( match ) => extractExactText( match[ 1 ] ) );
}

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
	markup = markup.replace( /\r\n?/g, '\n' );
	if ( acceptedMarkup !== undefined ) acceptedMarkup = acceptedMarkup.replace( /\r\n?/g, '\n' );
	verifyUniqueIds( markup );
	for ( const anchor of RESEARCH_ANCHORS ) assert( markup.includes( 'id="' + anchor + '"' ), 'Archive retains #' + anchor + '.' );
	assert.equal( findHeadings( markup, 'placement archive' )[ 0 ].text, 'Placement Method and Evidence' );
	const tables = [ ...markup.matchAll( /<tbody>([\s\S]*?)<\/tbody>/g ) ].map( ( match ) => match[ 1 ] );
	assert.deepEqual( tables.map( ( table ) => ( table.match( /<tr>/g ) || [] ).length ), [ 34, 10 ], 'The archive retains all 34 keyword and ten market records.' );
	assert.deepEqual( marketRows( tables[ 1 ] ).map( marketIdentity ), RETAINED_MARKET_IDENTITIES, 'The archive keeps the exact retained market identities in worksheet order.' );
	for ( const updated of [ ARCHIVE_COPY_EDITS[ 0 ][ 1 ], ...ARCHIVE_CLEANUP_COPY_EDITS.map( ( edit ) => edit[ 1 ] ) ] ) assert( markup.includes( updated ), 'Missing dated archive cleanup copy: ' + updated );
	if ( acceptedMarkup !== undefined ) {
		const acceptedTables = [ ...acceptedMarkup.matchAll( /<tbody>([\s\S]*?)<\/tbody>/g ) ].map( ( match ) => match[ 1 ] );
		assert.equal( tables[ 0 ], acceptedTables[ 0 ], 'Keyword records retain byte parity with the accepted snapshot.' );
		const retained = marketRows( acceptedTables[ 1 ] ).filter( ( row ) => RETAINED_MARKET_IDENTITIES.some( ( identity ) => JSON.stringify( identity ) === JSON.stringify( marketIdentity( row ) ) ) );
		assert.deepEqual( marketRows( tables[ 1 ] ), retained, 'Retained market records preserve byte parity and order with the accepted snapshot.' );
		let expected = acceptedMarkup;
		if ( ! acceptedMarkup.includes( 'Archived placement research · July 2026' ) ) {
			for ( const [ before, after ] of ARCHIVE_COPY_EDITS ) {
				assert( expected.includes( before ), 'Accepted archive is missing the guarded copy-edit baseline: ' + before );
				expected = expected.replace( before, after );
			}
		}
		if ( marketRows( acceptedTables[ 1 ] ).length === 20 ) {
			for ( const [ before, after ] of ARCHIVE_CLEANUP_COPY_EDITS ) {
				assert( expected.includes( before ), 'Accepted archive is missing the guarded cleanup baseline.' );
				expected = expected.replace( before, after );
			}
			let tableIndex = 0;
			expected = expected.replace( /<tbody>([\s\S]*?)<\/tbody>/g, ( table ) => tableIndex++ === 1 ? '<tbody>' + tables[ 1 ] + '</tbody>' : table );
		}
		if ( expected.includes( WORKBOOK_DOWNLOAD_COPY_EDIT[ 0 ] ) ) {
			expected = expected.replace( ...WORKBOOK_DOWNLOAD_COPY_EDIT );
		}
		assert.equal( markup, expected, 'Archive allows only the reviewed cleanup copy, ten unavailable-row removals and workbook download sentence against its accepted snapshot.' );
	}
	return { researchAnchors: RESEARCH_ANCHORS, rows: [ 34, 10 ] };
}

module.exports = { verifyPlacementBrief, verifyPlacementArchive, RESEARCH_ANCHORS, EXAMPLES };
