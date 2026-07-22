#!/usr/bin/env node

const fs = require( 'node:fs' );
const path = require( 'node:path' );

const {
	findHeadingLevels,
	findHeadingOutlineJumps,
	getClassCount,
	hasMeaningfulFragmentTarget,
} = require( './lib/page-markup-contract' );

const themeRoot = path.join( __dirname, '..' );
const mainPath = path.join( themeRoot, 'content', 'page-drafts', 'job-placement-digest.html' );
const appendixPath = path.join( themeRoot, 'content', 'page-drafts', 'placement-method-evidence.html' );
const retiredPatternPath = path.join( themeRoot, 'patterns', 'job-placement-digest.php' );
const stylePath = path.join( themeRoot, 'style.css' );
const readmePath = path.join( themeRoot, 'README.md' );

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
		'Published 13 Jul 2026 · Last verified 21 Jul 2026',
		'Why Support Engineer now',
		'Enterprise monitoring and scale',
		'I do not yet have a public enterprise-scale monitoring or incident record.',
		'Keyboard focus rings appeared locally but disappeared after deployment.',
		'Within the standard block-editor controls this theme governs',
		'A recurring class of palette-review work moves from manual enforcement into the authoring system.',
		'A next step, stated plainly.',
		'Bring me the problem behind the ticket.',
	] ) {
		assert( markup.includes( required ), `Main digest draft is missing required copy: ${ required }` );
	}

	for ( const action of [
		'View one-page résumé',
		'Review GitHub evidence',
		'Read the production debugging case',
		'Contact Henry',
	] ) {
		assert( markup.includes( action ), `Main digest draft is missing first-screen action: ${ action }` );
	}

	assert( getClassCount( markup, 'hp-proof-card' ) === 3, 'Main digest draft must contain exactly three primary proof cards.' );

	for ( const artifact of [
		'One-page Support Engineer résumé',
		'WordPress contribution record',
		'WordPress/ai PR #501',
		'WordPress/ai issue #529',
		'WordPress/ai issue #732',
		'AI Provider for Codex v2.1',
		`HPerkins Tokens v${ themeVersion }`,
		'Flavor Agent v0.1.0-rc.3',
		'Flavor Agent v0.1.0-rc.1 contracts',
		'30 contracts · tagged 22 Jun 2026',
		'Flavor Agent current contracts',
		'35 contracts on current branch · verified 21 Jul 2026',
		'WordPress Job Market Screen — Live States',
		'Placement Method and Evidence',
	] ) {
		assert( markup.includes( artifact ), `Main digest evidence register is missing: ${ artifact }` );
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
	const style = readRequiredFile( stylePath );
	const readme = readRequiredFile( readmePath );
	const versionMatch = style.match( /^Version:\s*(\S+)/m );
	assert( versionMatch, 'style.css must declare the current theme Version.' );
	const themeVersion = versionMatch[ 1 ];
	const deployedCommitMatch = readme.match(
		/\*\*Deployed commit:\*\*\s+\[`([0-9a-f]{7})`\]\(https:\/\/github\.com\/henryperkins\/hperkins-tokens\/commit\/([0-9a-f]{40})\)/i
	);
	assert( deployedCommitMatch, 'README.md must declare the deployed commit with a pinned 40-character URL.' );
	assert(
		deployedCommitMatch[ 2 ].startsWith( deployedCommitMatch[ 1 ] ),
		'README.md deployed-commit label and URL disagree.'
	);

	verifyMain( main, themeVersion, deployedCommitMatch[ 2 ].toLowerCase() );
	verifyAppendix( appendix );
	verifyForbiddenCopy( `${ main }\n${ appendix }` );
	assert( ! fs.existsSync( retiredPatternPath ), 'patterns/job-placement-digest.php must be retired, not maintained as a third full-page source.' );

	console.log( 'Job Placement Digest reviewed source contract verified.' );
}

try {
	main();
} catch ( error ) {
	console.error( error.message );
	process.exit( 1 );
}
