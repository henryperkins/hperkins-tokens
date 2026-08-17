#!/usr/bin/env node

const fs = require( 'node:fs' );
const path = require( 'node:path' );

const {
	findHeadingLevels,
	findHeadingOutlineJumps,
	getClassCount,
	hasMeaningfulFragmentTarget,
} = require( './lib/page-markup-contract' );
const { parseTopLevelBlocks } = require( './lib/about-page-contract' );

const themeRoot = path.join( __dirname, '..' );
const mainPath = path.join( themeRoot, 'content', 'page-drafts', 'job-placement-digest.html' );
const appendixPath = path.join( themeRoot, 'content', 'page-drafts', 'placement-method-evidence.html' );
const retiredPatternPath = path.join( themeRoot, 'patterns', 'job-placement-digest.php' );
const registerFilterPath = path.join( themeRoot, 'assets', 'js', 'digest-register-filter.js' );
const wcusImagePath = path.join( themeRoot, 'assets', 'img', 'imagery', 'wcus-2026-phoenix.png' );

const WCUS_ACTIONS = [ [ 'Start a WordCamp conversation', '/contact/' ] ];
const WCUS_IMAGE_SOURCE = '/wp-content/themes/hperkins-tokens/assets/img/imagery/wcus-2026-phoenix.png';
const WCUS_IMAGE_ALT = 'The West entrance of the Phoenix Convention Center at night, its glass doors dressed in WordCamp US 26 desert artwork under the illuminated building sign.';
const WCUS_IMAGE_CAPTION = 'Phoenix Convention Center, West entrance — WordCamp US 2026, 16–19 August. I’m staffing the Core AI booth.';

const CLOSING_ACTIONS = [
	[ 'Contact Henry', '/contact/' ],
	[ 'View one-page résumé', '/one-page-resume/' ],
	[ 'Review selected WordPress evidence', '#evidence-register' ],
];

// The dossier's spine. Each section carries a gold ordinal and a label naming
// the move it makes; the order is the argument, so it is pinned here rather
// than left to whoever edits the page next.
const SECTIONS = [
	{ ordinal: '01', label: 'The work I want', anchor: 'why-support-engineer-now', heading: 'Why Support Engineer now' },
	{ ordinal: '02', label: 'The ask, against proof', anchor: 'current-support-fit', heading: 'Current Support Engineer fit' },
	{ ordinal: '03', label: 'Primary proof', anchor: 'primary-proof', heading: 'Three proofs, each open to inspection' },
	{ ordinal: '04', label: 'How I debug', anchor: 'root-cause-investigation', heading: 'Debugging proof: a request log that silently under-reported' },
	{ ordinal: '05', label: 'What prevention looks like', anchor: 'theme-governance', heading: 'The constraint is narrower than the slogan' },
	{ ordinal: '06', label: 'Everything, dated', anchor: 'evidence-register', heading: 'Evidence register' },
	{ ordinal: '07', label: 'The appendix', anchor: null, heading: 'The method stays inspectable without becoming the pitch' },
];

const DEBUG_PROOF_TERMS = [ 'Signal', 'Diagnosis', 'Constraint', 'Result' ];

const INCIDENT_ARTIFACTS = [
	[ 'Henry authored', 'Issue #732 report and reproduction' ],
	[ 'Henry tested', 'PR #757 integration-test findings' ],
	[ 'Henry proposed', 'PR #757 ownership split' ],
	[ 'The precedent', 'Issue #529 report' ],
	[ 'The fix', 'Maintainer-authored PR #593' ],
	[ 'The release', 'WordPress AI 1.0.1' ],
];

// Canonical release-state vocabulary. assets/js/digest-register-filter.js holds
// the same list; the two are asserted identical below, because a register row
// the script cannot classify silently disables the filter on the live page and
// nothing else would notice.
const STATE_TOKENS = [
	[ 'prerelease', 'unreleased' ],
	[ 'unreleased', 'unreleased' ],
	[ 'no release', 'unreleased' ],
	[ 'open upstream', 'open' ],
	[ 'non-formal', 'open' ],
	[ 'merged upstream', 'released' ],
	[ 'shipped in', 'released' ],
	[ 'released owned work', 'released' ],
];

// The appendix's two ledgers classify the same way the register does, from the
// row's own words. Keyword standing rides in the row header; market state is
// the merged "current state · screen verdict" cell.
const STANDING_TOKENS = [
	[ 'demonstrated', 'demonstrated' ],
	[ 'partial', 'partial' ],
	[ 'gap', 'gap' ],
];

const MARKET_TOKENS = [
	[ 'fail', 'failed' ],
	[ 'pass — historical', 'historical' ],
	[ 'needs verification', 'recheck' ],
	[ 'needs new screen', 'recheck' ],
	[ 'not screened', 'recheck' ],
	[ 'pass', 'live' ],
];

const REGISTER_ROWS = 12;
const REGISTER_GROUP_COUNTS = { released: 4, open: 4, unreleased: 4 };
const KEYWORD_ROWS = 34;
const KEYWORD_GROUP_COUNTS = { demonstrated: 10, partial: 11, gap: 13 };
const MARKET_ROWS = 20;
const PRIMARY_PROOF_MARKER = 'Primary proof · card above';

// The appendix's spine. Same shape as the dossier's: a gold ordinal, a label
// naming the move, the anchor, and the heading the anchor has to reach.
const APPENDIX_SECTIONS = [
	{ ordinal: '01', label: 'The vocabulary', anchor: 'resume-keyword-bank', heading: 'The 34-term keyword ledger' },
	{ ordinal: '02', label: 'The screen', anchor: 'what-i-optimize-for', heading: 'What I optimize for in my next role' },
	{ ordinal: '03', label: 'The application', anchor: 'screening-funnel', heading: 'WordPress Job Market Screen' },
	{ ordinal: '04', label: 'What I took back', anchor: 'delisted-and-overturned', heading: 'Delisted postings and overturned decisions' },
];

// Structure the merged ledgers replaced. Each of these was a way of splitting
// one ledger across three objects; leaving one behind means the page states a
// standing twice, in two vocabularies.
const RETIRED_APPENDIX_MARKERS = [
	'hp-disclosure',
	'hp-keyword-disclosure',
	'hp-state-table',
	'hp-overturn-list',
];

const REDUNDANT_DIGEST_MARKERS = [
	'hp-digest-section__body',
	'hp-digest-editorial-split',
	'hp-digest-closing-zone',
	'hp-digest-brief',
	'support-brief',
];

const FORBIDDEN_DIGEST_COPY = [
	'WordPress since 2012 · Former WordPress.com Happiness Engineer',
	'/wp-content/themes/hperkins-tokens/assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf',
];

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function readRequiredFile( filePath ) {
	assert( fs.existsSync( filePath ), `Expected ${ path.relative( themeRoot, filePath ) } to exist.` );
	return fs.readFileSync( filePath, 'utf8' );
}

function countMatches( value, expression ) {
	return [ ...value.matchAll( expression ) ].length;
}

function escapeForRegExp( value ) {
	return value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

function countTableRows( markup, className ) {
	const tableExpression = new RegExp(
		`<figure\\b[^>]*class=(['"])[^'"]*\\b${ escapeForRegExp( className ) }\\b[^'"]*\\1[^>]*>([\\s\\S]*?)<\\/figure>`,
		'gi'
	);
	let rows = 0;

	for ( const table of markup.matchAll( tableExpression ) ) {
		for ( const body of table[ 2 ].matchAll( /<tbody\b[^>]*>([\s\S]*?)<\/tbody>/gi ) ) {
			rows += countMatches( body[ 1 ], /<tr\b/gi );
		}
	}

	return rows;
}

function getTableBody( markup, className ) {
	const expression = new RegExp(
		`<figure\\b[^>]*class=(['"])[^'"]*\\b${ escapeForRegExp( className ) }\\b[^'"]*\\1[^>]*>([\\s\\S]*?)<\\/figure>`,
		'i'
	);
	const match = expression.exec( markup );
	assert( match, `Expected one ${ className } table.` );
	const body = /<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i.exec( match[ 2 ] );
	assert( body, `Expected a tbody inside ${ className }.` );
	return body[ 1 ];
}

function stripMarkup( value ) {
	return value
		.replace( /<[^>]+>/g, '' )
		.replace( /&amp;/g, '&' )
		.replace( /&nbsp;/g, ' ' )
		.replace( /\s+/g, ' ' )
		.trim();
}

function visibleWordCount( markup ) {
	return markup
		.replace( /<!--[^]*?-->/g, ' ' )
		.replace( /<[^>]+>/g, ' ' )
		.replace( /&(?:amp|nbsp|#8217|#038);/g, ' ' )
		.trim()
		.split( /\s+/ )
		.filter( Boolean ).length;
}

function getScopedElementMatch( markup, tagName, className ) {
	const expression = new RegExp(
		`<${ tagName }\\b[^>]*class=(['"])[^'"]*\\b${ escapeForRegExp( className ) }\\b[^'"]*\\1[^>]*>([\\s\\S]*?)<\\/${ tagName }>`,
		'i'
	);
	const match = expression.exec( markup );

	assert( match, `Expected one ${ tagName }.${ className } element.` );
	return match;
}

function getScopedElement( markup, tagName, className ) {
	return getScopedElementMatch( markup, tagName, className )[ 2 ];
}

function extractLinks( markup ) {
	return [ ...markup.matchAll( /<a\b[^>]*href=(['"])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi ) ].map( ( match ) => [
		stripMarkup( match[ 3 ] ),
		match[ 2 ],
	] );
}

function classifyWith( text, tokens ) {
	const haystack = String( text || '' ).toLowerCase();
	for ( const [ token, state ] of tokens ) {
		if ( haystack.includes( token ) ) {
			return state;
		}
	}
	return null;
}

function classifyState( text ) {
	return classifyWith( text, STATE_TOKENS );
}

function tableRowMarkup( markup, className ) {
	return [ ...getTableBody( markup, className ).matchAll( /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi ) ].map(
		( match ) => match[ 1 ]
	);
}

// Every ledger row has to classify, and the group totals have to match. A row
// the script cannot file silently disables the filter for the whole ledger, and
// a total that has drifted means the page and the research disagree about how
// many terms or postings there are.
function verifyLedgerGroups( markup, { className, cellExpression, tokens, expected, label } ) {
	const counts = Object.fromEntries( Object.keys( expected ).map( ( key ) => [ key, 0 ] ) );

	tableRowMarkup( markup, className ).forEach( ( row, index ) => {
		const cell = cellExpression.exec( row );
		assert( cell, `${ label } row ${ index + 1 } must carry a classifying cell.` );
		const text = stripMarkup( cell[ 1 ] );
		const group = classifyWith( text, tokens );
		assert(
			group && group in counts,
			`${ label } row ${ index + 1 } reads "${ text }", which the filter cannot classify. ` +
				'An unclassifiable row disables the filter for the whole ledger.'
		);
		counts[ group ] += 1;
	} );

	for ( const [ group, total ] of Object.entries( expected ) ) {
		assert(
			counts[ group ] === total,
			`${ label } must hold ${ total } ${ group } rows; found ${ counts[ group ] }.`
		);
	}
}

function verifyHeadingContract( label, markup ) {
	const levels = findHeadingLevels( markup );
	assert( levels.filter( ( level ) => level === 1 ).length === 1, `${ label } must contain exactly one H1.` );
	assert( levels[ 0 ] === 1, `${ label } must begin its heading outline with H1.` );
	assert(
		findHeadingOutlineJumps( levels ).length === 0,
		`${ label } contains a skipped heading level: ${ JSON.stringify( levels ) }.`
	);
}

function verifyNoPublicationPlaceholders( label, markup ) {
	for ( const forbidden of [
		/\{\{[^}]+\}\}/,
		/\[PLACEHOLDER/i,
		/REVIEWED DRAFT ONLY/i,
		/DEPLOYED_THEME_COMMIT/i,
	] ) {
		assert( ! forbidden.test( markup ), `${ label } still contains a publication placeholder: ${ forbidden }.` );
	}
}

function verifyNoMovingGitHubLinks( label, markup ) {
	assert(
		! /https:\/\/github\.com\/[^"'\s]+\/(?:blob|tree)\/(?:main|master)(?:[\/#?]|$)/i.test( markup ),
		`${ label } contains a moving GitHub branch URL for a dated claim.`
	);
}

// Each ledger's vocabulary lives in two places by necessity — a Node verifier
// and a browser script that cannot share a module. Keep them equal, in order:
// the scripts take the first matching token, so a reordering is a behaviour
// change even when the pairs are identical as a set.
function verifyLedgerFilterAgreement() {
	const script = readRequiredFile( registerFilterPath );

	for ( const [ name, expected ] of [
		[ 'STATE_TOKENS', STATE_TOKENS ],
		[ 'STANDING_TOKENS', STANDING_TOKENS ],
		[ 'MARKET_TOKENS', MARKET_TOKENS ],
	] ) {
		const block = new RegExp( `var ${ name } = \\[([\\s\\S]*?)\\];` ).exec( script );
		assert( block, `assets/js/digest-register-filter.js must declare ${ name }.` );

		const scriptTokens = [ ...block[ 1 ].matchAll( /\[\s*'([^']+)'\s*,\s*'([^']+)'\s*\]/g ) ].map(
			( match ) => [ match[ 1 ], match[ 2 ] ]
		);

		assert(
			JSON.stringify( scriptTokens ) === JSON.stringify( expected ),
			`assets/js/digest-register-filter.js ${ name } must match this verifier's list, in order.`
		);
	}
}

function verifyEvidenceRegister( markup ) {
	assert(
		countTableRows( markup, 'hp-evidence-table' ) === REGISTER_ROWS,
		`The evidence register must publish all ${ REGISTER_ROWS } dated records.`
	);

	const body = getTableBody( markup, 'hp-evidence-table' );
	const rows = [ ...body.matchAll( /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi ) ].map( ( match ) => match[ 1 ] );
	const counts = { released: 0, open: 0, unreleased: 0 };

	rows.forEach( ( row, index ) => {
		const cell = /<td\b[^>]*>([\s\S]*?)<\/td>/i.exec( row );
		assert( cell, `Register row ${ index + 1 } must carry a State cell.` );
		const state = classifyState( stripMarkup( cell[ 1 ] ) );
		assert(
			state,
			`Register row ${ index + 1 } has a State the filter cannot classify: "${ stripMarkup( cell[ 1 ] ) }". ` +
				'An unclassifiable row disables the filter for the whole register.'
		);
		counts[ state ] += 1;
	} );

	for ( const [ state, expected ] of Object.entries( REGISTER_GROUP_COUNTS ) ) {
		assert(
			counts[ state ] === expected,
			`The register must hold ${ expected } ${ state } records; found ${ counts[ state ] }.`
		);
	}

	assert(
		countMatches( body, new RegExp( escapeForRegExp( PRIMARY_PROOF_MARKER ), 'g' ) ) === 3,
		'Exactly the three records argued as proof cards above must be marked as primary proof.'
	);

	assert(
		markup.includes( 'filter the register to hold one of those states at a time' ),
		'The register preamble must tell the reader the states can be held one at a time.'
	);
}

function verifyMain( markup, _themeVersion, _deployedCommit, { requireEvent = true } = {} ) {
	verifyHeadingContract( 'Main digest draft', markup );
	verifyNoPublicationPlaceholders( 'Main digest draft', markup );
	verifyNoMovingGitHubLinks( 'Main digest draft', markup );

	const wordCount = visibleWordCount( markup );
	assert(
		wordCount >= 850,
		`Main digest draft contains only ${ wordCount } visible words; the dossier argues the full case.`
	);
	assert( ! /<!--\s+wp:html\s*-->/.test( markup ), 'Main digest draft must use editable native blocks.' );

	for ( const required of [
		'<h1 class="wp-block-heading">I report WordPress failures so others can fix them.</h1>',
		'Former WordPress.com Happiness Engineer · WordPress AI contributor · Chicago',
		'I’m pursuing Support Engineer, WordPress VIP because I want the work itself',
		'Published 13 Jul 2026 · Last verified 11 Aug 2026',
		'A next step, stated plainly.',
		'Bring me the problem behind the ticket.',
	] ) {
		assert( markup.includes( required ), `Main digest draft is missing required dossier copy: ${ required }` );
	}

	for ( const marker of REDUNDANT_DIGEST_MARKERS ) {
		assert( ! markup.includes( marker ), `Main digest draft still contains retired brief structure: ${ marker }` );
	}
	for ( const forbidden of FORBIDDEN_DIGEST_COPY ) {
		assert( ! markup.includes( forbidden ), `Main digest draft still repeats copy available elsewhere: ${ forbidden }` );
	}

	const topLevelBlocks = parseTopLevelBlocks( markup );
	const hasBlockClass = ( block, className ) =>
		( block.attrs.className || '' ).split( /\s+/ ).includes( className );
	const heroIndex = topLevelBlocks.findIndex( ( block ) => hasBlockClass( block, 'hp-digest__hero' ) );
	const eventIndex = topLevelBlocks.findIndex( ( block ) => hasBlockClass( block, 'hp-wcus-callout' ) );
	const closingIndex = topLevelBlocks.findIndex( ( block ) => hasBlockClass( block, 'hp-digest-cta' ) );

	assert( heroIndex === 0, 'The Digest hero must be the first top-level block, so the H1 opens the outline.' );
	assert(
		closingIndex === topLevelBlocks.length - 1,
		'The closing invitation must be the last top-level block.'
	);
	assert(
		topLevelBlocks.length === ( requireEvent ? 10 : 9 ),
		`The dossier must contain ${ requireEvent ? 10 : 9 } top-level blocks; found ${ topLevelBlocks.length }.`
	);

	if ( requireEvent ) {
		assert( eventIndex === 1, 'The WordCamp aside must follow the hero, not precede the H1.' );
		const eventBlock = topLevelBlocks[ eventIndex ];
		assert( eventBlock.name === 'group' && eventBlock.attrs.tagName === 'aside', 'The WordCamp aside must remain a native Group with aside semantics.' );
		assert( eventBlock.attrs.ariaLabel === 'I’ll be at WordCamp US.', 'The WordCamp aside must have the approved accessible name.' );
		assert( eventBlock.attrs.anchor === 'wordcamp-us-2026', 'The WordCamp aside must own the wordcamp-us-2026 fragment.' );
		assert( /<aside\b[^>]*aria-label="I’ll be at WordCamp US\."[^>]*>/.test( eventBlock.outer ), 'The WordCamp Group markup must serialize the accessible name.' );
		assert( getClassCount( eventBlock.outer, 'hp-wcus-callout--event-first' ) === 1, 'The WordCamp aside must carry its event-first modifier.' );
		assert(
			countMatches( eventBlock.outer, /<!-- wp:image\b/g ) === 1 &&
				getClassCount( eventBlock.outer, 'hp-wcus-callout__figure' ) === 1,
			'The WordCamp aside must contain one captioned documentary WordCamp photograph.'
		);
		assert(
			eventBlock.outer.includes( `<img src="${ WCUS_IMAGE_SOURCE }" alt="${ WCUS_IMAGE_ALT }"/>` ),
			'The captioned documentary WordCamp photograph must retain its approved source and alternative text.'
		);
		assert(
			eventBlock.outer.includes( `<figcaption class="wp-element-caption">${ WCUS_IMAGE_CAPTION }</figcaption>` ),
			'The captioned documentary WordCamp photograph must retain its approved visible caption.'
		);
		assert( getClassCount( eventBlock.outer, 'hp-wcus-callout__copy' ) === 1 && getClassCount( eventBlock.outer, 'hp-wcus-callout__actions' ) === 1, 'The WordCamp aside must contain one copy column and one action column.' );
		assert(
			eventBlock.outer.indexOf( 'hp-wcus-callout__figure' ) < eventBlock.outer.indexOf( 'hp-wcus-callout__copy' ),
			'The captioned documentary WordCamp photograph must be the first object in the WordCamp aside.'
		);
		assert( JSON.stringify( extractLinks( eventBlock.outer ) ) === JSON.stringify( WCUS_ACTIONS ), 'The WordCamp aside carries one action; the résumé and evidence routes belong to the closing invitation.' );
	} else {
		assert( eventIndex === -1, 'Event-removal mode requires the WordCamp block to be absent.' );
	}

	// The seven kickers are the dossier's spine: ordinal, label, anchor, heading.
	const kickers = [ ...markup.matchAll( /<p class="hp-digest-kicker"><strong>(\d\d)<\/strong> · ([^<]+)<\/p>/g ) ];
	assert(
		kickers.length === SECTIONS.length,
		`The dossier must carry ${ SECTIONS.length } numbered section kickers; found ${ kickers.length }.`
	);
	SECTIONS.forEach( ( section, index ) => {
		assert(
			kickers[ index ][ 1 ] === section.ordinal && kickers[ index ][ 2 ] === section.label,
			`Section ${ index + 1 } must read "${ section.ordinal } · ${ section.label }"; found "${ kickers[ index ][ 1 ] } · ${ kickers[ index ][ 2 ] }".`
		);
		assert(
			markup.includes( `<h2 class="wp-block-heading">${ section.heading }</h2>` ),
			`The dossier is missing the section heading: ${ section.heading }`
		);
		if ( section.anchor ) {
			assert(
				hasMeaningfulFragmentTarget( markup, section.anchor ),
				`The ${ section.anchor } fragment must target its real section.`
			);
		}
	} );

	// 02 — the ledger holds five proven rows and the gap is stated outside it,
	// so nothing in the table reads as evidence that isn't.
	assert(
		countTableRows( markup, 'hp-fit-table' ) === 5,
		'The fit ledger must hold exactly the five rows that have proof.'
	);
	const fitBody = getTableBody( markup, 'hp-fit-table' );
	assert( ! /gap/i.test( fitBody ), 'The named gap must sit outside the fit ledger, not inside it as a sixth row.' );
	const gap = getScopedElement( markup, 'p', 'hp-digest-gap' );
	assert( gap.includes( 'The gap, named' ), 'The gap callout must name itself in words, not by colour alone.' );
	assert(
		gap.includes( 'I do not yet have a public enterprise-scale monitoring or incident record' ),
		'The gap callout must keep the enterprise-monitoring admission verbatim.'
	);

	// 03 — three proof cards, each with a claim and a support-relevance line.
	assert( getClassCount( markup, 'hp-proof-card' ) === 3, 'Primary proof must hold exactly three cards.' );
	assert( countMatches( markup, /<strong>Claim:<\/strong>/g ) === 3, 'Each proof card must state a claim.' );
	assert( countMatches( markup, /<strong>Support relevance:<\/strong>/g ) === 3, 'Each proof card must state its support relevance.' );

	// 04 — the four investigation moves, then the record they came from.
	assert( getClassCount( markup, 'hp-debug-proof__item' ) === 4, 'The debugging proof must hold four moves.' );
	DEBUG_PROOF_TERMS.forEach( ( term ) => {
		assert( markup.includes( `<p>${ term }</p>` ), `The debugging proof is missing its ${ term } term.` );
	} );
	assert(
		markup.includes( 'I own the report and the integration testing; another contributor owns the fix.' ),
		'The debugging proof must keep the ownership split attribution-safe.'
	);
	assert(
		getScopedElement( markup, 'p', 'hp-artifact-row__legend' ).includes( 'Open the record' ),
		'The incident artifact row must be legended "Open the record".'
	);
	// The row nests columns inside groups, so slice it by its block delimiters
	// rather than by a tag match that would stop at the first closing </div>.
	assert( getClassCount( markup, 'hp-artifact-row' ) === 1, 'The dossier must carry exactly one artifact row.' );
	const artifactStart = markup.indexOf( '<!-- wp:columns {"className":"hp-artifacts"} -->' );
	const artifactEnd = markup.indexOf( '<!-- /wp:columns -->', artifactStart );
	assert( artifactStart !== -1 && artifactEnd !== -1, 'The incident artifact row must serialize as a native Columns block.' );
	const artifactRow = markup.slice( artifactStart, artifactEnd );
	assert(
		getClassCount( artifactRow, 'hp-artifact' ) === INCIDENT_ARTIFACTS.length,
		`The incident artifact row must expose ${ INCIDENT_ARTIFACTS.length } labelled cells.`
	);
	const verifies = [ ...artifactRow.matchAll( /<p class="hp-artifact__verifies">([^<]+)<\/p>/g ) ].map( ( m ) => m[ 1 ] );
	const artifactLabels = extractLinks( artifactRow ).map( ( link ) => link[ 0 ] );
	assert(
		JSON.stringify( verifies.map( ( label, index ) => [ label, artifactLabels[ index ] ] ) ) ===
			JSON.stringify( INCIDENT_ARTIFACTS ),
		'Each incident artifact must name what it verifies, in the approved order.'
	);

	// 06 — the complete register, and the filter that can narrow it.
	verifyEvidenceRegister( markup );
	verifyLedgerFilterAgreement();

	const closingBlock = topLevelBlocks[ closingIndex ];
	assert( closingBlock.attrs.tagName === 'section', 'The closing invitation must serialize as a section.' );
	assert( hasBlockClass( closingBlock, 'hp-action-panel' ) && hasBlockClass( closingBlock, 'is-closing' ), 'The closing invitation must retain the shared closing-panel treatment.' );
	assert( JSON.stringify( extractLinks( closingBlock.outer ) ) === JSON.stringify( CLOSING_ACTIONS ), 'The closing invitation must offer contact, résumé, and the evidence register.' );

	assert( ! extractLinks( markup ).some( ( link ) => {
		try {
			return new URL( link[ 1 ], 'https://digest-candidate.invalid/' ).pathname === '/root-cause-investigation/';
		} catch {
			return false;
		}
	} ), 'Main digest draft must not link the retired standalone root-cause route.' );
}

function verifyAppendix( markup ) {
	verifyHeadingContract( 'Placement Method and Evidence draft', markup );
	verifyNoPublicationPlaceholders( 'Placement Method and Evidence draft', markup );
	verifyNoMovingGitHubLinks( 'Placement Method and Evidence draft', markup );

	// The four kickers are the appendix's spine, and each anchor has to reach a
	// section that actually holds its heading.
	const kickers = [ ...markup.matchAll( /<p class="hp-digest-kicker"><strong>(\d\d)<\/strong> · ([^<]+)<\/p>/g ) ];
	assert(
		kickers.length === APPENDIX_SECTIONS.length,
		`The appendix must carry ${ APPENDIX_SECTIONS.length } numbered section kickers; found ${ kickers.length }.`
	);
	APPENDIX_SECTIONS.forEach( ( section, index ) => {
		assert(
			kickers[ index ][ 1 ] === section.ordinal && kickers[ index ][ 2 ] === section.label,
			`Appendix section ${ index + 1 } must read "${ section.ordinal } · ${ section.label }"; found "${ kickers[ index ][ 1 ] } · ${ kickers[ index ][ 2 ] }".`
		);
		assert(
			markup.includes( `>${ section.heading }</h2>` ),
			`The appendix is missing the section heading: ${ section.heading }`
		);
		assert(
			hasMeaningfulFragmentTarget( markup, section.anchor ),
			`The ${ section.anchor } fragment must target its real section.`
		);
	} );

	for ( const marker of RETIRED_APPENDIX_MARKERS ) {
		assert( ! markup.includes( marker ), `The appendix still contains retired split-ledger structure: ${ marker }` );
	}

	// 01 — one ledger, every term present, each carrying a standing the filter
	// can read. The three standings stay distinct without three tables.
	assert( countTableRows( markup, 'hp-keyword-table' ) === KEYWORD_ROWS, `The appendix must contain all ${ KEYWORD_ROWS } keyword-ledger rows.` );
	verifyLedgerGroups( markup, {
		className: 'hp-keyword-table',
		cellExpression: /<th\b[^>]*>[\s\S]*?<strong>([\s\S]*?)<\/strong>[\s\S]*?<\/th>/i,
		tokens: STANDING_TOKENS,
		expected: KEYWORD_GROUP_COUNTS,
		label: 'The keyword ledger',
	} );

	// 03 — the screen, whole. Group totals are checked against the workbook in
	// verify-placement-artifacts.js; here they only have to be classifiable.
	assert( countTableRows( markup, 'hp-market-table' ) === MARKET_ROWS, `The appendix must contain all ${ MARKET_ROWS } reconciled market rows.` );
	tableRowMarkup( markup, 'hp-market-table' ).forEach( ( row, index ) => {
		const cells = [ ...row.matchAll( /<td\b[^>]*>([\s\S]*?)<\/td>/gi ) ];
		assert( cells.length === 5, `Market row ${ index + 1 } must carry five data cells beside its row header; found ${ cells.length }.` );
		const state = stripMarkup( cells[ 3 ][ 1 ] );
		assert(
			classifyWith( state, MARKET_TOKENS ),
			`Market row ${ index + 1 } has a State the filter cannot classify: "${ state }".`
		);
	} );

	verifyLedgerFilterAgreement();

	for ( const required of [
		'What I optimize for in my next role',
		'I favor roles where technical and customer outcomes produce inspectable evidence—code, releases, live systems, documented incidents, or customer-facing artifacts—in addition to narrative reporting.',
		'Will the work survive inspection by someone who isn’t me?',
		'filter the ledger to hold one standing at a time',
		'filter the screen to hold one state at a time',
		'an employer-level association overrode row-level evidence about the customer',
		'The failure was not missing data: the role text and the model’s own rationale both contained the consumer, single-site context that disqualified it. I overturned the result.',
		'The corrective control is simple: each question must cite the posting evidence that answers it, and an explicit failure cannot be canceled by the company name or the job title.',
	] ) {
		assert( markup.includes( required ), `Placement Method and Evidence draft is missing required copy: ${ required }` );
	}

	assert( ! /Happiness Engineer/i.test( markup ), 'The appendix must anonymize the public false-pass employer and role.' );
}

function verifyForbiddenCopy( combinedMarkup ) {
	for ( const forbidden of [
		/Any no kills the posting/i,
		/Doesn['’]t get an hour of my time, whatever it pays/i,
		/Or just pays/i,
		/Drift isn['’]t discouraged on this site; it can['’]t happen/i,
		/The job stops existing/i,
		/v0\.3\.42/i,
		/provider v2\.0/i,
		/provider v2\.2/i,
	] ) {
		assert( ! forbidden.test( combinedMarkup ), `Reviewed drafts contain forbidden or stale copy: ${ forbidden }.` );
	}
}

function main() {
	const main = readRequiredFile( mainPath );
	const appendix = readRequiredFile( appendixPath );
	assert( fs.existsSync( wcusImagePath ), 'The captioned documentary WordCamp photograph asset is missing.' );
	const wcusImage = fs.readFileSync( wcusImagePath );
	assert(
		wcusImage.length >= 24 && wcusImage.readUInt32BE( 16 ) === 1448 && wcusImage.readUInt32BE( 20 ) === 1086,
		'The captioned documentary WordCamp photograph must keep its supplied 1448×1086 dimensions.'
	);

	verifyMain( main );
	verifyAppendix( appendix );
	verifyForbiddenCopy( `${ main }\n${ appendix }` );
	assert( ! fs.existsSync( retiredPatternPath ), 'patterns/job-placement-digest.php must be retired, not maintained as a third full-page source.' );

	console.log( 'Job Placement Digest reviewed source contract verified.' );
}

if ( require.main === module ) {
	try {
		main();
	} catch ( error ) {
		console.error( error.message );
		process.exit( 1 );
	}
}

module.exports = {
	verifyMain,
	verifyAppendix,
	visibleWordCount,
	classifyState,
	classifyWith,
	STATE_TOKENS,
	STANDING_TOKENS,
	MARKET_TOKENS,
	SECTIONS,
	APPENDIX_SECTIONS,
};
