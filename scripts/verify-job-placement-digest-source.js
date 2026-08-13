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

const WCUS_ACTIONS = [
	[ 'Start a WordCamp conversation', '/contact/' ],
	[ 'View one-page résumé', '/one-page-resume/' ],
	[ 'Review selected work', '/work/' ],
];

const BRIEF_PROOF_LINKS = [
	[ 'WordPress/ai PR #501', 'https://github.com/WordPress/ai/pull/501' ],
	[ 'AI Provider for Codex v2.1', 'https://github.com/henryperkins/ai-provider-for-codex/releases/tag/v2.1' ],
	[ 'WordPress/ai issue #732', 'https://github.com/WordPress/ai/issues/732' ],
];

const CLOSING_ACTIONS = [
	[ 'Contact Henry', '/contact/' ],
	[ 'View one-page résumé', '/one-page-resume/' ],
];

const REDUNDANT_DIGEST_MARKERS = [
	'hp-digest-section__body',
	'hp-digest-editorial-split',
	'hp-fit-ledger',
	'hp-fit-table',
	'hp-primary-proof',
	'hp-proof-card',
	'hp-incident-card',
	'hp-debug-proof__grid',
	'hp-debug-proof__item',
	'hp-theme-governance',
	'hp-evidence-ledger',
	'hp-evidence-table',
	'hp-digest-closing-zone',
	'hp-method-link',
	'why-support-engineer-now',
	'current-support-fit',
	'primary-proof',
	'root-cause-investigation',
	'theme-governance',
	'evidence-register',
];

const FORBIDDEN_DIGEST_COPY = [
	'WordPress since 2012 · Former WordPress.com Happiness Engineer',
	'Why Support Engineer now',
	'Current Support Engineer fit',
	'Three proofs, each open to inspection',
	'Debugging proof: a request log that silently under-reported',
	'The constraint is narrower than the slogan',
	'Evidence register',
	'The method stays inspectable without becoming the pitch',
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

function countTableRows( markup, className ) {
	const escapedClass = className.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
	const tableExpression = new RegExp(
		`<figure\\b[^>]*class=(['"])[^'"]*\\b${ escapedClass }\\b[^'"]*\\1[^>]*>([\\s\\S]*?)<\\/figure>`,
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
	const escapedClass = className.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
	const expression = new RegExp(
		`<${ tagName }\\b[^>]*class=(['"])[^'"]*\\b${ escapedClass }\\b[^'"]*\\1[^>]*>([\\s\\S]*?)<\\/${ tagName }>`,
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

function verifyMain( markup, _themeVersion, _deployedCommit, { requireEvent = true } = {} ) {
	verifyHeadingContract( 'Main digest draft', markup );
	verifyNoPublicationPlaceholders( 'Main digest draft', markup );
	verifyNoMovingGitHubLinks( 'Main digest draft', markup );

	const wordCount = visibleWordCount( markup );
	assert( wordCount <= 425, `Main digest draft contains ${ wordCount } visible words; the recruiter brief budget is 425.` );
	assert( ! /<(?:table|figure)\b/i.test( markup ), 'Main digest draft must not repeat table or ledger content available elsewhere.' );
	assert( ! /<!--\s+wp:html\s*-->/.test( markup ), 'Main digest draft must use editable native blocks.' );

	for ( const required of [
		'<h1 class="wp-block-heading">I debug WordPress systems, document root causes, and turn recurring failures into constraints.</h1>',
		'I’m pursuing Support Engineer, WordPress VIP: complex WordPress troubleshooting, clear customer communication, and prevention of repeat incidents.',
		'Published 13 Jul 2026 · Last verified 11 Aug 2026',
		'What I bring to support',
		'How I work',
		'Proof you can inspect',
		'One honest gap:',
		'I do not claim public enterprise-scale monitoring experience.',
		'A next step, stated plainly.',
		'Bring me the problem behind the ticket.',
	] ) {
		assert( markup.includes( required ), `Main digest draft is missing required brief copy: ${ required }` );
	}

	for ( const marker of REDUNDANT_DIGEST_MARKERS ) {
		assert( ! markup.includes( marker ), `Main digest draft still contains removed long-form structure: ${ marker }` );
	}
	for ( const forbidden of FORBIDDEN_DIGEST_COPY ) {
		assert( ! markup.includes( forbidden ), `Main digest draft still repeats copy available elsewhere: ${ forbidden }` );
	}

	const topLevelBlocks = parseTopLevelBlocks( markup );
	const hasBlockClass = ( block, className ) =>
		( block.attrs.className || '' ).split( /\s+/ ).includes( className );
	const eventIndex = topLevelBlocks.findIndex( ( block ) => hasBlockClass( block, 'hp-wcus-callout' ) );
	const heroIndex = topLevelBlocks.findIndex( ( block ) => hasBlockClass( block, 'hp-digest__hero' ) );
	const briefIndex = topLevelBlocks.findIndex( ( block ) => block.attrs.anchor === 'support-brief' );
	const closingIndex = topLevelBlocks.findIndex( ( block ) => hasBlockClass( block, 'hp-digest-cta' ) );

	assert( heroIndex !== -1, 'Main digest draft must contain a top-level .hp-digest__hero block.' );
	assert( briefIndex !== -1, 'Main digest draft must contain one #support-brief section.' );
	assert( closingIndex !== -1, 'Main digest draft must contain one top-level .hp-digest-cta section.' );
	assert( getClassCount( topLevelBlocks[ heroIndex ].outer, 'hp-wcus-callout' ) === 0, 'The Digest hero must not contain the WordCamp aside.' );
	assert( getClassCount( topLevelBlocks[ heroIndex ].outer, 'hp-digest__primary-actions' ) === 0, 'The Digest hero must not repeat event actions.' );

	if ( requireEvent ) {
		assert( topLevelBlocks.length === 4, `The recruiter brief must contain four top-level blocks; found ${ topLevelBlocks.length }.` );
		assert( eventIndex === 0, 'The WordCamp aside must be the first top-level block.' );
		assert( heroIndex === 1 && briefIndex === 2 && closingIndex === 3, 'The recruiter brief must order event, hero, support brief, then closing invitation.' );
		const eventBlock = topLevelBlocks[ eventIndex ];
		assert( eventBlock.name === 'group' && eventBlock.attrs.tagName === 'aside', 'The WordCamp aside must remain a native Group with aside semantics.' );
		assert( eventBlock.attrs.ariaLabel === 'I’ll be at WordCamp US.', 'The WordCamp aside must have the approved accessible name.' );
		assert( /<aside\b[^>]*aria-label="I’ll be at WordCamp US\."[^>]*>/.test( eventBlock.outer ), 'The WordCamp Group markup must serialize the accessible name.' );
		assert( ! /<h[1-6]\b/i.test( eventBlock.outer ), 'The WordCamp aside must not introduce a heading before the H1.' );
		assert( getClassCount( eventBlock.outer, 'hp-wcus-callout--event-first' ) === 1, 'The candidate WordCamp aside must carry its event-first modifier.' );
		assert( getClassCount( eventBlock.outer, 'hp-wcus-callout__copy' ) === 1 && getClassCount( eventBlock.outer, 'hp-wcus-callout__actions' ) === 1, 'The WordCamp aside must contain one copy column and one action column.' );
		assert( JSON.stringify( extractLinks( eventBlock.outer ) ) === JSON.stringify( WCUS_ACTIONS ), 'The WordCamp aside actions must match the approved ordered contract.' );
	} else {
		assert( topLevelBlocks.length === 3, `Event-removal mode must leave three top-level blocks; found ${ topLevelBlocks.length }.` );
		assert( eventIndex === -1, 'Event-removal mode requires the WordCamp block to be absent.' );
		assert( heroIndex === 0 && briefIndex === 1 && closingIndex === 2, 'Event removal must leave hero, support brief, then closing invitation.' );
	}

	const briefBlock = topLevelBlocks[ briefIndex ];
	assert( briefBlock.name === 'group' && briefBlock.attrs.tagName === 'section', 'The support brief must remain a native Group with section semantics.' );
	assert( getClassCount( briefBlock.outer, 'hp-digest-brief' ) === 1, 'The support brief must own one hp-digest-brief class.' );
	assert( getClassCount( briefBlock.outer, 'wp-block-column' ) === 2, 'The support brief must contain exactly two native columns.' );
	const fitList = getScopedElement( briefBlock.outer, 'ul', 'hp-digest-brief__list' );
	const proofList = getScopedElement( briefBlock.outer, 'ul', 'hp-digest-brief__proofs' );
	assert( countMatches( fitList, /<li\b/gi ) === 3, 'The support brief must contain exactly three working-style points.' );
	assert( extractLinks( fitList ).length === 0, 'The working-style list must remain scan-first prose, not a link directory.' );
	assert( countMatches( proofList, /<li\b/gi ) === 3, 'The support brief must contain exactly three selected proofs.' );
	assert( JSON.stringify( extractLinks( proofList ) ) === JSON.stringify( BRIEF_PROOF_LINKS ), 'The selected proofs must expose exactly three canonical links in order.' );
	for ( const required of [
		'documentation I authored, refined through review, and merged upstream.',
		'a stable WordPress AI provider release',
		'a request-log blind spot I reported and reproduced, then integration-tested against another contributor’s proposed fix.',
	] ) {
		assert( proofList.includes( required ), `Selected proof is missing attribution-safe context: ${ required }` );
	}

	const closingBlock = topLevelBlocks[ closingIndex ];
	assert( closingBlock.attrs.tagName === 'section', 'The closing invitation must serialize as a section.' );
	assert( hasBlockClass( closingBlock, 'hp-action-panel' ) && hasBlockClass( closingBlock, 'is-closing' ), 'The closing invitation must retain the shared closing-panel treatment.' );
	assert( JSON.stringify( extractLinks( closingBlock.outer ) ) === JSON.stringify( CLOSING_ACTIONS ), 'The closing invitation must contain only contact and résumé actions.' );

	const expectedLinks = [ ...( requireEvent ? WCUS_ACTIONS : [] ), ...BRIEF_PROOF_LINKS, ...CLOSING_ACTIONS ];
	assert( JSON.stringify( extractLinks( markup ) ) === JSON.stringify( expectedLinks ), 'The recruiter brief must expose only the approved decision-ready links in order.' );
	assert( extractLinks( markup ).length <= 8, 'The recruiter brief must expose at most eight links.' );
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

module.exports = { verifyMain, visibleWordCount };
