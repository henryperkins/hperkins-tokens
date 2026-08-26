const path = require( 'node:path' );

const themeRoot = path.join( __dirname, '..', '..' );

function assertKnownOptions( argv, knownOptions ) {
	for ( const option of argv ) {
		if ( ! knownOptions.includes( option ) ) {
			throw new Error( `Unknown option: ${ option }. Accepted: ${ knownOptions.join( ', ' ) }.` );
		}
	}
}

function selectDigestSource( argv = [] ) {
	const relative = argv.includes( '--drafts' )
		? 'content/page-drafts/job-placement-digest.html'
		: 'content/page-snapshots/job-placement-digest.html';
	return path.join( themeRoot, relative );
}

function selectAboutSource( { drafts = false, requireLocal = false } = {} ) {
	const relative = drafts || requireLocal
		? 'content/page-drafts/about.html'
		: 'content/page-snapshots/about.html';
	return path.join( themeRoot, relative );
}

function deriveAboutActionContract( body ) {
	const source = String( body || '' );
	if ( source.includes( 'hp-about-resume-v3' ) ) {
		return { phase: 'v3', railCount: 2, panelCount: 1 };
	}
	if ( source.includes( 'hp-about-resume' ) ) {
		return { phase: 'v2', railCount: 1, panelCount: 1 };
	}
	if ( source.includes( 'hp-about-nav' ) ) {
		return { phase: 'proof-first', railCount: 2, panelCount: 1 };
	}
	return { phase: 'legacy', railCount: 1, panelCount: 0 };
}

// The appendix has the same two phases as the Digest. Source-side contracts
// that compare the stylesheet against the page body have to read the candidate
// while a redesign is in review, or the reviewed body and the published mirror
// hold mutually incompatible shapes and neither can be made to pass.
function selectPlacementMethodSource( argv = [] ) {
	const relative = argv.includes( '--drafts' )
		? 'content/page-drafts/placement-method-evidence.html'
		: 'content/page-snapshots/placement-method-evidence.html';
	return path.join( themeRoot, relative );
}

module.exports = {
	assertKnownOptions,
	deriveAboutActionContract,
	selectAboutSource,
	selectDigestSource,
	selectPlacementMethodSource,
};
