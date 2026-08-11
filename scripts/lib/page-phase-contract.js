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

module.exports = { assertKnownOptions, selectAboutSource, selectDigestSource };
