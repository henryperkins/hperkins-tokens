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

const WCUS_ACTIONS = [ [ 'Start a WordCamp conversation', '/contact/' ] ];

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

const REGISTER_ROWS = 12;
const REGISTER_GROUP_COUNTS = { released: 4, open: 4, unreleased: 4 };
const PRIMARY_PROOF_MARKER = 'Primary proof · card above';

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

function classifyState( text ) {
	const haystack = String( text || '' ).toLowerCase();
	for ( const [ token, state ] of STATE_TOKENS ) {
		if ( haystack.includes( token ) ) {
			return state;
		}
	}
	return null;
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

// The register's state vocabulary lives in two places by necessity — a Node
// verifier and a browser script that cannot share a module. Keep them equal.
function verifyRegisterFilterAgreement() {
	const script = readRequiredFile( registerFilterPath );
	const block = /var STATE_TOKENS = \[([\s\S]*?)\];/.exec( script );
	assert( block, 'assets/js/digest-register-filter.js must declare STATE_TOKENS.' );

	const scriptTokens = [ ...block[ 1 ].matchAll( /\[\s*'([^']+)'\s*,\s*'([^']+)'\s*\]/g ) ].map( ( match ) => [
		match[ 1 ],
		match[ 2 ],
	] );

	assert(
		JSON.stringify( scriptTokens ) === JSON.stringify( STATE_TOKENS ),
		'assets/js/digest-register-filter.js STATE_TOKENS must match this verifier\'s list, in order.'
	);
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
		assert( getClassCount( eventBlock.outer, 'hp-wcus-callout__copy' ) === 1 && getClassCount( eventBlock.outer, 'hp-wcus-callout__actions' ) === 1, 'The WordCamp aside must contain one copy column and one action column.' );
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
	verifyRegisterFilterAgreement();

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

	assert( hasMeaningfulFragmentTarget( markup, 'resume-keyword-bank' ), 'The resume-keyword-bank fragment must target the meaningful section, not an empty hidden node.' );
	assert( getClassCount( markup, 'hp-disclosure' ) === 3, 'The appendix must contain three disclosure components.' );
	assert( countTableRows( markup, 'hp-keyword-table' ) === 34, 'The appendix must contain all 34 keyword-ledger rows.' );
	assert( countTableRows( markup, 'hp-market-table' ) === 20, 'The appendix must contain all 20 reconciled market rows.' );

	for ( const required of [
		'What I optimize for in my next role',
		'I favor roles where technical and customer outcomes produce inspectable evidence—code, releases, live systems, documented incidents, or customer-facing artifacts—in addition to narrative reporting.',
		'A claim has to survive inspection by someone who isn’t me.',
		'The company name had answered a question about the customer. I overturned it.',
		'A screen you can’t watch working is a screen you take on faith.',
		'The AI passed one role because the employer’s brand matched my target ecosystem, even though the customer context did not satisfy my screen. Its own rationale contained the disqualifying evidence. I overturned the result.',
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

module.exports = { verifyMain, visibleWordCount, classifyState, STATE_TOKENS, SECTIONS };
