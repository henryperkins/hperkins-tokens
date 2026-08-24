#!/usr/bin/env node

/**
 * Proof-first About source contract (2026-07-28 spec).
 *
 * With --drafts, validates the reviewed candidate
 * content/page-drafts/about.html. Without --drafts, validates the accepted
 * snapshot content/page-snapshots/about.html AND requires normalized
 * candidate ↔ snapshot parity — accepted mode passes only once the redesign
 * has been promoted and exported. Both modes also verify the explicit-only
 * draft selection rules, the thin pattern adapter, and exclusive About CSS
 * ownership in assets/imladris-pages.css.
 */

const fs = require( 'node:fs' );
const path = require( 'node:path' );

const { getSha256, normalizeContent } = require( './lib/content-integrity' );
const {
	PAGE_CONTRACTS,
	selectDraftContracts,
} = require( './lib/page-content-contract' );
const {
	verifyAboutBody,
	verifyAboutV2Body,
	verifyCssOwnership,
	verifyPatternAdapter,
} = require( './lib/about-page-contract' );

const themeRoot = path.join( __dirname, '..' );
const USE_DRAFTS = process.argv.includes( '--drafts' );

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function read( relative ) {
	return fs.readFileSync( path.join( themeRoot, relative ), 'utf8' );
}

function verifySelectedAboutBody( body, options ) {
	if ( ! body.includes( 'hp-about-resume' ) ) {
		return verifyAboutBody( body, options );
	}

	const report = verifyAboutV2Body( body, options );
	const visibleText = body
		.replace( /<!--[\s\S]*?-->/g, ' ' )
		.replace( /<[^>]+>/g, ' ' )
		.replace( /&[a-z0-9#]+;/gi, ' ' )
		.replace( /\s+/g, ' ' )
		.trim();

	return {
		...report,
		wordCount: visibleText ? visibleText.split( ' ' ).length : 0,
		sectionCounts: {
			contributions: report.contributionCount,
			experience: report.currentRoleCount + report.earlierRoleCount,
			skills: report.skillTermCount,
			showcase: ( body.match( /class="[^"]*\bhp-about-showcase-card\b/g ) || [] ).length,
			contact: 1,
		},
	};
}

function main() {
	// --- About draft metadata and explicit-only local selection ------------
	const about = PAGE_CONTRACTS.find( ( contract ) => contract.key === 'about' );
	assert( about, 'Page contracts must track About.' );
	assert(
		about.draft?.file === 'content/page-drafts/about.html' &&
			about.draft.applyByDefault === false &&
			about.draft.updateExistingOnly === true &&
			about.deployedIntegrity === true &&
			about.pattern?.file === 'patterns/about-resume.php' &&
			about.pattern.role === 'thin-snapshot-adapter',
		'The About contract must carry explicit-only draft, adapter, and deployed-integrity metadata.'
	);
	assert(
		selectDraftContracts().every( ( contract ) => contract.key !== 'about' ),
		'About must never be part of the default draft selection.'
	);
	assert(
		selectDraftContracts( [ 'about' ] ).map( ( contract ) => contract.key ).join( ',' ) === 'about',
		'--page=about must select only About.'
	);
	assert(
		selectDraftContracts().map( ( contract ) => contract.key ).join( ',' ) ===
			'job-placement-digest,placement-method-evidence',
		'The default draft selection must remain the two recruiter pages.'
	);

	// --- the selected body ---------------------------------------------------
	const selectedPath = USE_DRAFTS
		? 'content/page-drafts/about.html'
		: 'content/page-snapshots/about.html';
	const selected = read( selectedPath );
	const report = verifySelectedAboutBody( selected, { label: selectedPath } );
	console.log(
		`${ selectedPath }: ${ report.wordCount } visible words (${ Object.entries( report.sectionCounts )
			.map( ( [ section, count ] ) => `${ section } ${ count }` )
			.join( ', ' ) })`
	);

	// --- accepted mode: candidate ↔ snapshot parity ---------------------------
	if ( ! USE_DRAFTS ) {
		const candidate = normalizeContent( read( 'content/page-drafts/about.html' ) );
		const snapshot = normalizeContent( selected );
		assert(
			candidate === snapshot,
			[
				'Accepted mode requires candidate ↔ snapshot parity.',
				`candidate sha256: ${ getSha256( candidate ) }`,
				`snapshot  sha256: ${ getSha256( snapshot ) }`,
				'Complete guarded local application and the --expect-draft export first.',
			].join( '\n' )
		);
	}

	// --- thin pattern adapter -------------------------------------------------
	verifyPatternAdapter( read( 'patterns/about-resume.php' ) );

	// --- exclusive CSS ownership ------------------------------------------------
	verifyCssOwnership( read( 'style.css' ), read( 'assets/imladris-pages.css' ) );

	console.log(
		`About source contract verified against ${ USE_DRAFTS ? 'the reviewed candidate' : 'the accepted snapshot' }.`
	);
}

try {
	main();
} catch ( error ) {
	console.error( error.message );
	process.exit( 1 );
}
