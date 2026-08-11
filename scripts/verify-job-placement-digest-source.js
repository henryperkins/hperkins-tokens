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
const { readReleaseRecord } = require( './lib/release-record' );

const themeRoot = path.join( __dirname, '..' );
const mainPath = path.join( themeRoot, 'content', 'page-drafts', 'job-placement-digest.html' );
const appendixPath = path.join( themeRoot, 'content', 'page-drafts', 'placement-method-evidence.html' );
const retiredPatternPath = path.join( themeRoot, 'patterns', 'job-placement-digest.php' );

const WCUS_ACTIONS = [
	[ 'Start a WordCamp conversation', '/contact/' ],
	[ 'View one-page résumé', '/one-page-resume/' ],
	[ 'Review selected WordPress evidence', '#evidence-register' ],
];

const DEBUG_PROOF = [
	[ 'Signal', 'Codex provider generations never appeared in the WordPress AI request log.' ],
	[ 'Diagnosis', 'Logging decorated one SDK HTTP transporter.' ],
	[ 'Constraint', 'Lifecycle-hook capture restored the missing success rows in integration testing.' ],
	[ 'Result', 'Anubhav Anand authored PR #757.' ],
];

const ROOT_CAUSE_LINKS = [
	'https://github.com/WordPress/ai/issues/732',
	'https://github.com/WordPress/ai/pull/757#issuecomment-4980297831',
	'https://github.com/WordPress/ai/pull/757#issuecomment-4981567682',
	'https://github.com/WordPress/ai/issues/529',
	'https://github.com/WordPress/ai/pull/593',
	'https://github.com/WordPress/ai/releases/tag/1.0.1',
];

const EXPECTED_EVIDENCE_ROWS = [
	[ 'WordPress/ai PR #501', 'Authored · merged upstream', [ 'https://github.com/WordPress/ai/pull/501' ] ],
	[ 'WordPress/php-ai-client issue #262 and PR #263', 'Authored · open upstream', [ 'https://github.com/WordPress/php-ai-client/issues/262', 'https://github.com/WordPress/php-ai-client/pull/263' ] ],
	[ 'WordPress/ai-provider-for-openai PR #40', 'Authored · open upstream', [ 'https://github.com/WordPress/ai-provider-for-openai/pull/40' ] ],
	[ 'WordPress/ai issue #529', 'Reported · fixed upstream by another contributor', [ 'https://github.com/WordPress/ai/issues/529', 'https://github.com/WordPress/ai/pull/593', 'https://github.com/WordPress/ai/releases/tag/1.0.1' ] ],
	[ 'WordPress/ai issue #732 and PR #757', 'Reproduced · integration-tested · technical feedback (non-formal)', [ 'https://github.com/WordPress/ai/issues/732', 'https://github.com/WordPress/ai/pull/757', 'https://github.com/WordPress/ai/pull/757#issuecomment-4980297831', 'https://github.com/WordPress/ai/pull/757#issuecomment-4981567682' ] ],
	[ 'WordPress/ai PR #749 feedback', 'Reproduced · integration-tested · technical feedback (non-formal)', [ 'https://github.com/WordPress/ai/pull/749#issuecomment-5010134375' ] ],
	[ 'Flavor Agent v0.1.0-rc.3', 'Released owned work · prerelease', [ 'https://github.com/henryperkins/flavor-agent/releases/tag/v0.1.0-rc.3' ] ],
	[ 'Flavor Agent post-RC3 main', 'Merged to owned main · unreleased', [ 'https://github.com/henryperkins/flavor-agent/pull/53', 'https://github.com/henryperkins/flavor-agent/pull/61', 'https://github.com/henryperkins/flavor-agent/pull/74', 'https://github.com/henryperkins/flavor-agent/pull/76' ] ],
	[ 'AI Provider for Codex v2.1', 'Released owned work', [ 'https://github.com/henryperkins/ai-provider-for-codex/releases/tag/v2.1' ] ],
	[ 'HPerkins Tokens v0.3.53', 'Released owned work', [ 'https://github.com/henryperkins/hperkins-tokens/releases/tag/v0.3.53' ] ],
	[ 'HPerkins Tokens commerce work', 'Merged to owned main · unreleased', [ 'https://github.com/henryperkins/hperkins-tokens/commit/f82d52bf30e5576f73654e11af34bc638c28fc62', 'https://github.com/henryperkins/hperkins-tokens/commit/0bf1e2c6e3c0b9d9bac7e725d8561c7fff289ce2' ] ],
	[ 'roadmaptrac', 'Active evidence tooling · no release', [ 'https://github.com/henryperkins/roadmaptrac', 'https://github.com/henryperkins/roadmaptrac/commit/b101bca432825a34135c9b3d8a224031a1a7ad18' ] ],
];

const FORBIDDEN_DIGEST_COPY = [
	'Read the root-cause investigation',
	'Two merged pull requests · one open pull request',
	'54 commits ahead of RC3',
	'30 contracts',
	'35 contracts',
	'as of Jul 30, 2026',
	'<h3 class="wp-block-heading">Symptom</h3>',
	'<h3 class="wp-block-heading">Root cause</h3>',
	'<h3 class="wp-block-heading">Why the fix is not one line</h3>',
	'<h3 class="wp-block-heading">Impact</h3>',
	'<h3 class="wp-block-heading">What happened next</h3>',
	'<h3 class="wp-block-heading">Whether the reports get acted on</h3>',
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

function extractDefinitionPairs( markup ) {
	return [ ...markup.matchAll( /<div\b[^>]*class=(['"])[^'"]*\bhp-debug-proof__item\b[^'"]*\1[^>]*>([\s\S]*?)<\/div>/gi ) ].map( ( match ) => {
		const term = /<dt\b[^>]*>([\s\S]*?)<\/dt>/i.exec( match[ 2 ] );
		const definition = /<dd\b[^>]*>([\s\S]*?)<\/dd>/i.exec( match[ 2 ] );

		return [
			term ? stripMarkup( term[ 1 ] ) : '',
			definition ? stripMarkup( definition[ 1 ] ) : '',
		];
	} );
}

function extractEvidenceRows( markup ) {
	const table = getScopedElement( markup, 'figure', 'hp-evidence-table' );
	const body = /<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i.exec( table );

	assert( body, 'Main digest evidence register must contain a tbody.' );
	return [ ...body[ 1 ].matchAll( /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi ) ].map( ( row ) => {
		const cells = [ ...row[ 1 ].matchAll( /<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi ) ].map( ( cell ) => cell[ 1 ] );
		assert( cells.length === 3, 'Each evidence-register row must contain exactly three cells.' );
		return [
			stripMarkup( cells[ 0 ] ),
			stripMarkup( cells[ 1 ] ),
			extractLinks( cells[ 2 ] ).map( ( link ) => link[ 1 ] ),
			stripMarkup( cells[ 2 ] ),
		];
	} );
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

function verifyMain( markup, themeVersion, deployedCommit ) {
	verifyHeadingContract( 'Main digest draft', markup );
	verifyNoPublicationPlaceholders( 'Main digest draft', markup );
	verifyNoMovingGitHubLinks( 'Main digest draft', markup );

	for ( const required of [
		'<h1 class="wp-block-heading">I debug WordPress systems, document root causes, and turn recurring failures into constraints.</h1>',
		'WordPress since 2012 · Former WordPress.com Happiness Engineer · Open-source WordPress AI contributor · Chicago',
		'I’m pursuing Support Engineer, WordPress VIP because I want the work itself: complex WordPress troubleshooting, clear customer communication, technical documentation, and prevention of repeat incidents.',
		'Why Support Engineer now',
		'Enterprise monitoring and scale',
		'I do not yet have a public enterprise-scale monitoring or incident record.',
		'Within the standard block-editor controls this theme governs',
		'A recurring class of palette-review work moves from manual enforcement into the authoring system.',
		'A next step, stated plainly.',
		'Bring me the problem behind the ticket.',
	] ) {
		assert( markup.includes( required ), `Main digest draft is missing required copy: ${ required }` );
	}

	const topLevelBlocks = parseTopLevelBlocks( markup );
	const hasBlockClass = ( block, className ) =>
		( block.attrs.className || '' ).split( /\s+/ ).includes( className );
	const heroIndex = topLevelBlocks.findIndex( ( block ) => hasBlockClass( block, 'hp-digest__hero' ) );
	assert( heroIndex !== -1, 'Main digest draft must contain a top-level .hp-digest__hero block.' );
	const hero = topLevelBlocks[ heroIndex ].outer;
	assert(
		getClassCount( hero, 'hp-wcus-callout' ) === 1 &&
			getClassCount( hero, 'hp-digest__primary-actions' ) === 1,
		'The WCUS panel and its recruiter actions must be contained by the Digest hero.'
	);
	const wcusPanelMatch = getScopedElementMatch( markup, 'section', 'hp-wcus-callout' );
	const wcusPanel = wcusPanelMatch[ 2 ];
	for ( const required of [
		'<p class="hp-page-hero__eyebrow">WORDCAMP US 2026 · PHOENIX</p>',
		'<h2 class="wp-block-heading">I’ll be at WordCamp US.</h2>',
		'I’ll be in Phoenix August 16–19, and I’ve been selected to staff the Core AI booth. If you’re hiring for WordPress support engineering, working on WordPress AI, or carrying an interesting incident, come say hello.',
	] ) {
		assert( wcusPanel.includes( required ), `The WCUS panel is missing exact event copy: ${ required }` );
	}
	assert(
		JSON.stringify( extractLinks( wcusPanel ) ) === JSON.stringify( WCUS_ACTIONS ),
		`The WCUS panel actions must match the approved ordered contract: ${ JSON.stringify( WCUS_ACTIONS ) }.`
	);
	assert(
		JSON.stringify( extractLinks( hero ) ) === JSON.stringify( WCUS_ACTIONS ),
		'The Digest hero must expose only the approved WCUS recruiter actions.'
	);
	const whyIndex = topLevelBlocks.findIndex( ( block ) => block.attrs.anchor === 'why-support-engineer-now' );
	assert( whyIndex !== -1, 'Main digest draft must contain #why-support-engineer-now.' );
	assert(
		whyIndex === heroIndex + 1,
		'Why Support Engineer now must immediately follow the hero-contained WCUS panel.'
	);
	assert(
		markup.includes( 'Published 13 Jul 2026 · Last verified 11 Aug 2026' ),
		'Main digest draft must use the approved publication-verification date.'
	);

	assert( countMatches( markup, /id=(['"])root-cause-investigation\1/g ) === 1, 'Main digest must contain exactly one #root-cause-investigation target.' );
	const investigation = getScopedElement( markup, 'section', 'hp-incident-card' );
	assert(
		investigation.includes( '<p class="hp-chip is-status-review has-mono-font-family has-xs-font-size">Issue #732 open · PR #757 by another contributor open</p>' ),
		'The root-cause investigation must preserve the exact issue and authorship status.'
	);
	assert(
		investigation.includes( '<h2 class="wp-block-heading">Debugging proof: a request log that silently under-reported</h2>' ),
		'The root-cause investigation must use the approved proof heading.'
	);
	assert( countMatches( investigation, /<h2\b/gi ) === 1, 'The root-cause investigation must contain exactly one H2.' );
	assert( countMatches( investigation, /<h3\b/gi ) === 0, 'The compact root-cause proof must not contain H3 headings.' );
	assert( ! /<!--\s+wp:html\s*-->/.test( investigation ), 'The proof must not use a Studio-policy-incompatible core/html block.' );
	assert(
		/<!-- wp:group \{[^\n]*"tagName":"dl"[^\n]*"className":"hp-debug-proof__grid"[^\n]*\} -->[\s\S]*<dl\b[^>]*\bhp-debug-proof__grid\b[^>]*>[\s\S]*<\/dl>[\s\S]*<!-- \/wp:group -->/.test( investigation ),
		'The proof definition list must be serialized as a native Group block.'
	);
	assert(
		countMatches( investigation, /<!-- wp:group \{[^\n]*"className":"hp-debug-proof__item"[^\n]*\} -->/g ) === DEBUG_PROOF.length,
		'The compact root-cause proof must contain four native Group items.'
	);
	const proofPairs = extractDefinitionPairs( investigation );
	assert( proofPairs.length === DEBUG_PROOF.length, 'The compact root-cause proof must contain exactly four definition items.' );
	for ( let index = 0; index < DEBUG_PROOF.length; index++ ) {
		assert( proofPairs[ index ][ 0 ] === DEBUG_PROOF[ index ][ 0 ], `Proof term ${ index + 1 } must be ${ DEBUG_PROOF[ index ][ 0 ] }.` );
		assert(
			proofPairs[ index ][ 1 ].includes( DEBUG_PROOF[ index ][ 1 ].replace( /\.$/, '' ) ),
			`${ DEBUG_PROOF[ index ][ 0 ] } proof is missing approved copy.`
		);
	}
	assert(
		JSON.stringify( extractLinks( investigation ).map( ( link ) => link[ 1 ] ) ) === JSON.stringify( ROOT_CAUSE_LINKS ),
		'The compact root-cause proof must expose exactly the six approved permalinks in order.'
	);

	assert( getClassCount( markup, 'hp-proof-card' ) === 3, 'Main digest draft must contain exactly three primary proof cards.' );

	const evidenceRows = extractEvidenceRows( markup );
	assert(
		JSON.stringify( evidenceRows.map( ( row ) => row.slice( 0, 3 ) ) ) === JSON.stringify( EXPECTED_EVIDENCE_ROWS ),
		'The evidence register must match the approved twelve-row artifact, state, and permalink contract.'
	);
	for ( const [ artifact, required ] of [
		[ 'WordPress/php-ai-client issue #262 and PR #263', 'finite-vector validation and regression coverage' ],
		[ 'WordPress/ai-provider-for-openai PR #40', 'model-aware sampling compatibility and tests' ],
		[ 'Flavor Agent post-RC3 main', 'governed apply/undo, schema hardening, and canonical target authorization' ],
	] ) {
		const row = evidenceRows.find( ( candidate ) => candidate[ 0 ] === artifact );
		assert(
			row && row[ 3 ].includes( required ),
			`Evidence context for ${ artifact } is missing required copy: ${ required }`
		);
	}
	assert(
		markup.includes( `https://github.com/henryperkins/hperkins-tokens/releases/tag/v${ themeVersion }` ),
		`Main digest must link the current HPerkins Tokens v${ themeVersion } release.`
	);
	assert(
		markup.includes( `https://github.com/henryperkins/hperkins-tokens/commit/${ deployedCommit }` ),
		`Main digest must link the deployed commit declared in README.md (${ deployedCommit.slice( 0, 7 ) }).`
	);
	assert( ! /profiles\.wordpress\.org/i.test( markup ), 'The evidence register must use immutable contribution evidence.' );
	assert( countMatches( markup, /href=(['"])\/one-page-resume\/\1/g ) === 2, 'The candidate must expose the semantic résumé route in the WCUS and closing actions.' );
	assert(
		! extractLinks( markup ).some( ( link ) => {
			try {
				return new URL( link[ 1 ], 'https://digest-candidate.invalid/' ).pathname === '/root-cause-investigation/';
			} catch {
				return false;
			}
		} ),
		'Main digest draft must not link the retired standalone root-cause route.'
	);

	for ( const forbidden of FORBIDDEN_DIGEST_COPY ) {
		assert( ! markup.includes( forbidden ), `Main digest draft contains forbidden or stale copy: ${ forbidden }` );
	}
}

function verifyAppendix( markup ) {
	verifyHeadingContract( 'Placement Method and Evidence draft', markup );
	verifyNoPublicationPlaceholders( 'Placement Method and Evidence draft', markup );
	verifyNoMovingGitHubLinks( 'Placement Method and Evidence draft', markup );

	assert(
		hasMeaningfulFragmentTarget( markup, 'resume-keyword-bank' ),
		'The resume-keyword-bank fragment must target the meaningful section, not an empty hidden node.'
	);
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

	// The digest's theme row is a public claim about what is RELEASED and
	// DEPLOYED ("Shipped · deployed theme commit verified …"), and it links a
	// release tag that has to exist. So it is checked against README.md's
	// deployment record — the same source the deployed commit comes from —
	// rather than style.css. Reading it from style.css conflated "the version I
	// am developing" with "the version that is live": every in-flight version
	// bump then demanded the digest advertise a release tag that had not been
	// cut, which is precisely the unverifiable claim this file exists to stop.
	// The bump still forces a digest update, just at release time, when the
	// deployment record below is what moves.
	const release = readReleaseRecord( themeRoot );

	verifyMain( main, release.version, release.deployedCommit );
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

module.exports = { verifyMain };
