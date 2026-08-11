#!/usr/bin/env node

const fs = require( 'node:fs' );
const path = require( 'node:path' );

const { PAGE_CONTRACTS } = require( './lib/page-content-contract' );

const themeRoot = path.join( __dirname, '..' );

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

const checks = [
	{
		file: 'readme.txt',
		include: [
			'content/page-snapshots/front-page.html',
			'content/page-snapshots/about.html',
			'content/page-snapshots/work.html',
			'content/page-snapshots/ai-enablement.html',
			'content/page-snapshots/job-placement-digest.html',
			'content/page-snapshots/placement-method-evidence.html',
			'content/page-snapshots/work-flavor-agent-demo.html',
			'theme-owned Wapuu',
			'hp-action-rail',
			'hp-action-panel',
			'content/nav-snapshots/nav-237.html',
			'scripts/export-navigation-snapshot.js',
			'scripts/apply-council-navigation.js',
			'header-controller.js',
			'verify-header.js',
			// About proof-first ownership model (Phase A): one candidate, an
			// export-only snapshot, a thin pattern adapter, and page-layout CSS
			// in the pages sheet.
			'one human-authored candidate at `content/page-drafts/about.html`',
			'thin inserter adapter that reads the',
			'--confirm-local --page=about',
			'--expect-draft',
			'assets/imladris-pages.css',
		],
		exclude: [
			/then appends the Three Rings \(Vilya \/ Narya \/ Nenya\) framework section\./,
			/renders the\s+"ai-enablement" pattern/i,
			/wraps the "work-index" pattern/i,
			// Retired: about-resume presented as one more reusable full-page
			// seed. It is a thin adapter over the accepted snapshot now.
			/filesystem patterns \(`about-resume`/,
		],
	},
	{
		file: 'CLAUDE.md',
		include: [
			'content/page-snapshots/',
			'content/page-snapshots/job-placement-digest.html',
			'content/page-snapshots/placement-method-evidence.html',
			'content/page-snapshots/work-flavor-agent-demo.html',
			'theme-owned `wapuu-home-hero` pattern',
			'verify-prominent-actions.js',
			'hp-action-rail',
			'[hperkins_council_header]',
			'inc/council-header.php',
			'content/nav-snapshots/nav-237.html',
			'closed|work|writing|search|drawer',
			'verify-header.js',
			// About proof-first ownership model (Phase A).
			'content/page-drafts/about.html',
			'thin adapter over the accepted snapshot',
			'--page=about',
			'verify-about-page-source.js',
			'verify-about-page-rendered.js',
			'.hp-about-template` selector anymore',
		],
		exclude: [
			/page-ai-enablement\.html is a \*\*shadow template\*\*/i,
			// Retired: about-resume listed among the reusable full-page seeds.
			/`\/about\/`, `\/work\/`, and `\/ai-enablement\/` content patterns/,
			// Retired: the pages-sheet scope list without About — the About
			// page layer lives in assets/imladris-pages.css now.
			/design system \(ai-enablement essay, contact, work index, job-placement digest\)/,
		],
	},
	{
		file: 'docs/design-system/INDEX.md',
		include: [
			'content/page-snapshots/ai-enablement.html',
			'content/page-snapshots/work.html',
			'content/page-snapshots/job-placement-digest.html',
			'content/page-snapshots/placement-method-evidence.html',
			'content/page-snapshots/work-flavor-agent-demo.html',
			'hybrid mode: theme-owned Wapuu hero + Three Rings shell',
			'`hp-action-rail`',
			'`hp-action-panel is-closing`',
			'Condensed Council',
			'Work evidence panel',
			'gold-800',
			'hp-drawer-search',
			'header-controller.js',
			// About proof-first ownership model (Phase A): the candidate is
			// mapped but never presented as deployed.
			'content/page-drafts/about.html',
			'thin accepted-snapshot adapter',
			'About page layer in `assets/imladris-pages.css`',
			'not the deployed body until it passes review and controlled promotion',
		],
		exclude: [
			/\*\*Shadow template\*\* over live page 175/i,
			/appended to live \*\*Work\*\* page 13/i,
			/\*\*add\*\* `job-placement-digest\.php`/i,
			// Retired: the two-artifact About row without the candidate,
			// adapter, and page-layout CSS mapping.
			/\| `templates\/about` \| `content\/page-snapshots\/about\.html`, `templates\/page-about\.html` \|/,
		],
	},
	{
		file: 'docs/design-system/ALIGNMENT-PLAN.md',
		include: [
			'Superseded route-ownership instructions (2026-07-21)',
			'content/page-snapshots/job-placement-digest.html',
			'content/page-snapshots/placement-method-evidence.html',
			'must not recreate a third full-page copy',
		],
		exclude: [
			/\*\*Add the two Job Placement Digest files\*\*/i,
			/\| `patterns\/job-placement-digest\.php` \| `_source\/theme\/patterns\/job-placement-digest\.php` \|/i,
			/job-placement-digest\.php now exists/i,
		],
	},
];

const staleAboutAdapterClaim = /about-resume[\s\S]{0,500}substitutes[\s\S]{0,160}portrait\s+and\s+r[\u00e9e]sum[\u00e9e]\s+asset URLs?/i;

const portfolioDocumentSections = {
	'CLAUDE.md': {
		heading: '### WCUS portfolio ownership and phase gate',
		nextHeading: /^#{1,3}\s+/m,
	},
	'readme.txt': {
		heading: '= WCUS portfolio route, adapter, and publication phases =',
		nextHeading: /^= .+ =\s*$/m,
	},
	'docs/design-system/INDEX.md': {
		heading: '### WCUS portfolio route, adapter, and publication phases',
		nextHeading: /^#{1,3}\s+/m,
	},
};

const portfolioOperatorCommands = [
	'node scripts/verify-resume-route.js --source-only',
	'node scripts/verify-resume-route.js',
	'node scripts/verify-job-placement-pages.js --source-only --drafts',
	'node scripts/verify-prominent-actions.js --source-only --drafts',
	'node scripts/verify-about-page-source.js --drafts',
	'node scripts/verify-about-page-rendered.js --require-local --drafts',
	'node scripts/verify-placement-artifacts.js --check-links',
];

const retirementSourceGateCommands = [
	'Get-ChildItem -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName; if ($LASTEXITCODE -ne 0) { throw "PHP lint failed: $($_.FullName)" } }',
	'node --test scripts/lib/about-page-contract.test.js scripts/lib/about-page-rendered-probe.test.js scripts/lib/about-gravatar-heading.test.js scripts/lib/content-integrity.test.js scripts/lib/content-ownership-docs.test.js scripts/lib/event-copy-retirement-runbook.test.js scripts/lib/job-placement-metadata-contract.test.js scripts/lib/market-screen-parity.test.js scripts/lib/navigation-content-contract.test.js scripts/lib/page-content-contract.test.js scripts/lib/page-markup-contract.test.js scripts/lib/page-phase-contract.test.js scripts/lib/placement-artifact-contract.test.js scripts/lib/placement-artifact-links.test.js scripts/lib/production-gates-workflow.test.js scripts/lib/release-record.test.js scripts/lib/resume-route-contract.test.js scripts/lib/site-url.test.js scripts/lib/style-coverage.test.js scripts/lib/wp-cli.test.js scripts/lib/zip-archive.test.js',
	'node scripts/verify-placement-artifacts.js',
	'node scripts/verify-header.js --source-only',
	'node scripts/verify-typography.js --source-only',
	'node scripts/verify-journal-templates.js',
	'node scripts/verify-performance-assets.js',
	'node scripts/verify-job-placement-digest-source.js',
	'node scripts/verify-about-page-source.js --drafts',
	'node scripts/verify-job-placement-pages.js --source-only --drafts',
	'node scripts/verify-prominent-actions.js --source-only --drafts',
	'node scripts/verify-resume-route.js --source-only',
	'node scripts/verify-deployed-content-ownership.js --source-only',
	'node scripts/verify-content-ownership-docs.js',
	'node scripts/verify-style-token-usage.js',
	'git diff --check',
];

const retirementPublicVerificationCommands = [
	'node scripts/verify-resume-route.js',
	'node scripts/verify-deployed-content-ownership.js --drafts --page=job-placement-digest --page=about',
	'node scripts/verify-job-placement-pages.js --drafts',
	'node scripts/verify-about-page-rendered.js --drafts',
	'node scripts/verify-prominent-actions.js --drafts',
	'node scripts/verify-job-placement-digest-metadata.js',
	'node scripts/verify-placement-artifacts.js --check-links',
	'node scripts/verify-typography.js',
];

function sectionAfterHeading( contents, heading, nextHeading, file ) {
	const start = contents.indexOf( heading );
	assert( start !== -1, `${ file } is missing its required operating section: ${ heading }` );
	const bodyStart = start + heading.length;
	const remainder = contents.slice( bodyStart );
	const next = remainder.search( nextHeading );
	return next === -1 ? remainder : remainder.slice( 0, next );
}

function powerShellCommands( section ) {
	const commands = [];
	for ( const block of section.matchAll( /```powershell\s*([\s\S]*?)```/gi ) ) {
		commands.push( ...block[1]
			.split( /\r?\n/ )
			.map( ( line ) => line.trim() )
			.filter( ( line ) => line.startsWith( 'node ' ) ) );
	}
	return commands;
}

function powerShellLines( section ) {
	const lines = [];
	for ( const block of section.matchAll( /```powershell\s*([\s\S]*?)```/gi ) ) {
		lines.push( ...block[1]
			.split( /\r?\n/ )
			.map( ( line ) => line.trim() )
			.filter( Boolean ) );
	}
	return lines;
}

function assertMatches( value, pattern, message ) {
	assert( pattern.test( value ), message );
}

function assertOrderedPatterns( value, patterns, message ) {
	let offset = 0;
	for ( const pattern of patterns ) {
		const match = pattern.exec( value.slice( offset ) );
		assert( match, message );
		offset += match.index + match[0].length;
	}
}

function sentences( contents ) {
	return contents.replace( /\r?\n/g, ' ' ).match( /[^.!?]+[.!?]+/g ) || [];
}

function assertNoPortfolioContradictions( contents, file ) {
	assert(
		! staleAboutAdapterClaim.test( contents ),
		`${ file } still says the About adapter substitutes portrait and resume asset URLs.`
	);

	for ( const sentence of sentences( contents ) ) {
		if (
			/(?:about-resume|About adapter|the adapter)/i.test( sentence )
			&& /(?:rewrite|replace|substitut)/i.test( sentence )
			&& /r[\u00e9e]sum[\u00e9e]/i.test( sentence )
			&& ! /(?:does not|do not|never|portrait-only|only (?:the|its|one|exactly))/i.test( sentence )
		) {
			throw new Error( `${ file } contains contradictory About adapter guidance: ${ sentence.trim() }` );
		}

		if (
			/theme deploy/i.test( sentence )
			&& /(?:write|update)/i.test( sentence )
			&& /(?:production|database-owned|database bodies)/i.test( sentence )
			&& ! /(?:does not|do not|never|separate)/i.test( sentence )
		) {
			throw new Error( `${ file } contains contradictory theme deploy guidance: ${ sentence.trim() }` );
		}

		if (
			/snapshot/i.test( sentence )
			&& /(?:refresh|promote|change|write)/i.test( sentence )
			&& /before[\s\S]*(?:publish|production)/i.test( sentence )
			&& ! /(?:do not|not changed|must not|never)/i.test( sentence )
		) {
			throw new Error( `${ file } reverses the snapshot publication order: ${ sentence.trim() }` );
		}
	}
}

function verifyPortfolioOwnershipDocuments( documents ) {
	for ( const [ file, specification ] of Object.entries( portfolioDocumentSections ) ) {
		const contents = documents[ file ];
		assert( typeof contents === 'string', `${ file } was not supplied to the portfolio ownership verifier.` );
		const section = sectionAfterHeading( contents, specification.heading, specification.nextHeading, file );
		assertNoPortfolioContradictions( contents, file );

		assertMatches(
			section,
			/\/one-page-resume\/[\s\S]{0,100}stable visible-link destination/i,
			`${ file } portfolio section does not define the stable visible resume route.`
		);
		assertMatches(
			section,
			/final PDF[\s\S]{0,100}theme-owned artifact[\s\S]{0,100}verified directly/i,
			`${ file } portfolio section does not keep the final PDF under direct theme-artifact verification.`
		);
		assertMatches(
			section,
			/about-resume[\s\S]{0,100}substitutes only the portrait URL/i,
			`${ file } portfolio section does not define the portrait-only About adapter.`
		);
		assertMatches(
			section,
			/(?:adapter|about-resume)[\s\S]{0,500}(?:does not|never)[\s\S]{0,80}(?:rewrite|replace|substitute)[\s\S]{0,80}r[\u00e9e]sum[\u00e9e]/i,
			`${ file } portfolio section does not state that the adapter leaves resume links unchanged.`
		);
		assertMatches(
			section,
			/Digest and About database bodies[\s\S]{0,80}canonical/i,
			`${ file } portfolio section does not define canonical Digest and About database bodies.`
		);
		assertMatches(
			section,
			/drafts[\s\S]{0,40}candidates/i,
			`${ file } portfolio section does not define drafts as candidates.`
		);
		assertMatches(
			section,
			/snapshots[\s\S]{0,60}accepted mirrors/i,
			`${ file } portfolio section does not define snapshots as accepted mirrors.`
		);

		const commands = powerShellCommands( section );
		assert(
			commands.length === portfolioOperatorCommands.length
			&& commands.every( ( command, index ) => command === portfolioOperatorCommands[ index ] ),
			`${ file } portfolio section has an incomplete, reordered, or incorrectly flagged command list.`
		);

		assertOrderedPatterns( section, [
			/accepted\s+snapshots/i,
			/\bbefore\b/i,
			/\b(?:published|publication|production write)\b/i,
			/freshly (?:re-)?read/i,
			/\b(?:equal|equality)\b/i,
		], `${ file } portfolio section does not keep snapshot promotion after approval, publication, fresh read, and equality proof.` );
		assertMatches(
			section,
			/Production page\/footer writes[\s\S]{0,80}separate[\s\S]{0,50}theme deploy/i,
			`${ file } portfolio section does not separate production page/footer writes from theme deployment.`
		);
		assertMatches(
			section,
			/deploy[\s\S]{0,500}(?:does not write|writes remain a separate phase)/i,
			`${ file } portfolio section does not operationalize the separate deployment and production-write phases.`
		);
	}
}

function verifyRetirementRunbook( contents ) {
	assertMatches(
		contents,
		/run it only after\s+August 20, 2026[\s\S]{0,80}no earlier than August 21/i,
		'Retirement runbook must remain a manual review after August 20.'
	);
	assertMatches(
		contents,
		/WordCamp US programming is August\s+16[\u2013-]19[\s\S]{0,100}August 20[\s\S]{0,100}not a conference\s+day/i,
		'Retirement runbook must distinguish August 16-19 programming from the August 20 travel boundary.'
	);
	assertMatches(
		contents,
		/Do not add cron, scheduled code, or any date-driven content mutation\./i,
		'Retirement runbook must prohibit automated date-driven mutation.'
	);

	const sourceGate = sectionAfterHeading(
		contents,
		'## Complete source gate',
		/^##\s+/m,
		'docs/runbooks/2026-08-20-wcus-event-copy-retirement.md'
	);
	const sourceCommands = powerShellLines( sourceGate );
	assert(
		sourceCommands.length === retirementSourceGateCommands.length
		&& sourceCommands.every( ( command, index ) => command === retirementSourceGateCommands[ index ] ),
		'Retirement runbook complete source gate is missing, reordered, or incorrectly flagged.'
	);
	assertMatches(
		sourceGate,
		/must pass before[\s\S]{0,80}(?:publication approval|seeking publication approval)/i,
		'Retirement runbook must require the complete source gate before publication approval.'
	);

	const publicationGates = sectionAfterHeading(
		contents,
		'## Publication gates',
		/^##\s+/m,
		'docs/runbooks/2026-08-20-wcus-event-copy-retirement.md'
	);
	const publicCommands = powerShellLines( publicationGates );
	assert(
		publicCommands.length === retirementPublicVerificationCommands.length
		&& publicCommands.every( ( command, index ) => command === retirementPublicVerificationCommands[ index ] ),
		'Retirement runbook public verification command list is missing, reordered, or incorrectly flagged.'
	);
	assertMatches(
		publicationGates,
		/(?:does not|do not|does neither)[\s\S]{0,100}authorize[\s\S]{0,120}(?:write|deploy|publication)/i,
		'Retirement runbook must not turn verification instructions into write or deployment authorization.'
	);
}

function main() {
	const portfolioDocuments = Object.fromEntries( Object.keys( portfolioDocumentSections ).map( ( file ) => [
		file,
		fs.readFileSync( path.join( themeRoot, file ), 'utf8' ),
	] ) );
	verifyPortfolioOwnershipDocuments( portfolioDocuments );
	verifyRetirementRunbook( fs.readFileSync(
		path.join( themeRoot, 'docs', 'runbooks', '2026-08-20-wcus-event-copy-retirement.md' ),
		'utf8'
	) );

	for ( const check of checks ) {
		const filePath = path.join( themeRoot, check.file );
		const contents = fs.readFileSync( filePath, 'utf8' );

		for ( const expected of check.include ) {
			assert( contents.includes( expected ), `${ check.file } is missing expected content-contract note: ${ expected }` );
		}

		for ( const forbidden of check.exclude ) {
			assert( ! forbidden.test( contents ), `${ check.file } still documents the retired page-ownership contract: ${ forbidden }` );
		}
	}

	const readmeCurrentContract = fs.readFileSync( path.join( themeRoot, 'readme.txt' ), 'utf8' )
		.split( '== Changelog ==' )[ 0 ];
	assert(
		! /plato[- ]artifacts/i.test( readmeCurrentContract ),
		'readme.txt still advertises the retired Plato Artifacts page in its current theme contract.'
	);
	assert(
		! readmeCurrentContract.includes( '`job-placement-digest`) remain reusable seeds/reference copies' ),
		'readme.txt still presents the retired Job Placement Digest pattern as a maintained page copy.'
	);

	const appendixContract = PAGE_CONTRACTS.find( ( contract ) => contract.key === 'placement-method-evidence' );
	assert( appendixContract, 'Page ownership contracts do not track Placement Method and Evidence.' );
	assert(
		appendixContract.pagePath === 'placement-method-and-evidence' &&
		appendixContract.snapshotFile === 'placement-method-evidence.html' &&
		appendixContract.templateFile === 'templates/page-placement-method-and-evidence.html',
		'Placement Method and Evidence must use the database-body, snapshot, and slug-template contract.'
	);

	const retiredDigestPattern = path.join( themeRoot, 'patterns', 'job-placement-digest.php' );
	assert(
		! fs.existsSync( retiredDigestPattern ),
		'patterns/job-placement-digest.php must be retired instead of maintained as a third full-page copy.'
	);

	console.log( 'verified content-ownership docs contract' );
}

if ( require.main === module ) {
	main();
}

module.exports = {
	verifyPortfolioOwnershipDocuments,
	verifyRetirementRunbook,
};
