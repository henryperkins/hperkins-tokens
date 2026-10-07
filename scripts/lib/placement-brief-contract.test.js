const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const test = require( 'node:test' );
const { verifyPlacementBrief, verifyPlacementArchive, RESEARCH_ANCHORS } = require( './placement-brief-contract' );
const { matchesRouteLink } = require( '../verify-placement-brief' );
const root = path.join( __dirname, '../..' );
const source = fs.readFileSync( path.join( root, 'content/page-drafts/job-placement-digest.html' ), 'utf8' );
const archive = fs.readFileSync( path.join( root, 'content/page-drafts/placement-method-evidence.html' ), 'utf8' );
const acceptedArchive = fs.readFileSync( path.join( root, 'content/page-snapshots/placement-method-evidence.html' ), 'utf8' );

function mutate( value, before, after ) {
	assert( value.includes( before ), 'Missing mutation seam: ' + before );
	return value.replace( before, after );
}

test( 'the canonical archive keeps precisely the nine retained market identities and 34 keyword terms', () => {
	assert.deepEqual( verifyPlacementArchive( archive ).rows, [ 34, 9 ] );
	assert.throws( () => verifyPlacementArchive( mutate( archive, '<th scope="row">Technical Account Manager, Newspack</th>', '<th scope="row">Support Engineer, VIP</th>' ) ), /retained market identities/ );
	let tableIndex = 0;
	const reordered = archive.replace( /<tbody>([\s\S]*?)<\/tbody>/g, ( table, body ) => {
		if ( tableIndex++ !== 1 ) return table;
		return '<tbody>' + body.replace( /(<tr>[\s\S]*?<\/tr>)(\s*)(<tr>[\s\S]*?<\/tr>)/, '$3$2$1' ) + '</tbody>';
	} );
	assert.throws( () => verifyPlacementArchive( reordered ), /retained market identities/ );
} );

test( 'rendered route matching accepts WooCommerce queries and rejects different destinations', () => {
	const current = 'https://hperkins.blog/job-placement-digest/?v=0b3b97fa6688#codex-provider';
	for ( const href of [ '/placement-method-and-evidence/', '/placement-method-and-evidence/?v=0b3b97fa6688', 'https://hperkins.blog/placement-method-and-evidence/?v=0b3b97fa6688' ] ) {
		assert.equal( matchesRouteLink( href, current, '/placement-method-and-evidence/' ), true );
	}
	for ( const href of [ 'https://example.com/placement-method-and-evidence/', '//example.com/placement-method-and-evidence/', '/placement-method-and-evidence/other/', '/placement-method-and-evidence/#unexpected', 'javascript:alert(1)' ] ) {
		assert.equal( matchesRouteLink( href, current, '/placement-method-and-evidence/' ), false );
	}
	assert.equal( matchesRouteLink( '/placement-method-and-evidence/?v=1#resume-keyword-bank', current, '/placement-method-and-evidence/', '#resume-keyword-bank' ), true );
} );

test( 'Support Engineering has three equal examples, exact attribution and both action pairs', () => {
	assert.doesNotThrow( () => verifyPlacementBrief( source ) );
} );

test( 'the Digest reference keeps nine records and separates requested removal from availability', () => {
	assert.throws( () => verifyPlacementBrief( mutate( source, '9 remaining posting records', '10 remaining posting records' ) ), /archive reference/ );
	assert.throws( () => verifyPlacementBrief( mutate( source, 'Ten confirmed unavailable listings were removed on 6 October 2026; one further entry was removed from the blog at my request.', 'Eleven confirmed unavailable listings were removed on 6 October 2026.' ) ), /archive reference/ );
} );

test( 'the dated archive retains every record and anchor against the accepted mirror', () => {
	assert.doesNotThrow( () => verifyPlacementArchive( archive, acceptedArchive ) );
	assert.doesNotThrow( () => verifyPlacementArchive( archive, archive ), 'After explicit promotion the accepted archive remains a valid source.' );
} );

test( 'all examples belong to Selected work at the same heading level', () => {
	assert.throws( () => verifyPlacementBrief( source.replace( /<h3\b/, '<h4' ).replace( '</h3>', '</h4>' ) ), /Selected work/ );
} );

test( 'the disclosure stays closed and links the archive without copying its tables or anchors', () => {
	assert.throws( () => verifyPlacementBrief( source.replace( /<details\b/, '<details open' ) ), /closed/ );
	assert.throws( () => verifyPlacementBrief( mutate( source, 'href="/placement-method-and-evidence/"', 'href="/job-placement-digest/"' ) ), /archive/ );
	assert.throws( () => verifyPlacementBrief( source.replace( '</summary>', '</summary><table><tbody><tr><td>Record</td></tr></tbody></table>' ) ), /tables/ );
	assert.throws( () => verifyPlacementBrief( source.replace( '</summary>', '</summary><span id="live-states"></span>' ) ), /anchored descendants/ );
} );

test( 'hero and closing each retain a Contact action and an explicitly labelled PDF action', () => {
	assert.throws( () => verifyPlacementBrief( mutate( source, 'href="/contact/"', 'href="/work/"' ) ), /Contact/ );
	assert.throws( () => verifyPlacementBrief( mutate( source, 'View the one-page résumé (PDF)', 'View the one-page résumé' ) ), /PDF/ );
} );

test( 'the numbered jump list points to all three real article targets in order', () => {
	assert.throws( () => verifyPlacementBrief( mutate( source, 'href="#upstream-documentation"', 'href="#codex-provider"' ) ), /jump list/ );
	assert.throws( () => verifyPlacementBrief( mutate( source, '<article ', '<section ' ) ), /three equal/ );
} );

test( 'the investigation ownership and its qualified test findings cannot be inflated', () => {
	for ( const [ before, after ] of [
		[ 'Reported and tested by me · fix by Anubhav Anand', 'Built by me' ],
		[ 'double-logged them', 'logged them correctly' ],
		[ 'still dropped failures', 'captured all failures' ],
	] ) assert.throws( () => verifyPlacementBrief( mutate( source, before, after ) ), /attribution/ );
} );

test( 'selected proof keeps the exact test comment, release notes and external arrows', () => {
	assert.throws( () => verifyPlacementBrief( mutate( source, '/pull/757#issuecomment-4980297831', '/pull/757' ) ), /selected evidence/ );
	assert.throws( () => verifyPlacementBrief( mutate( source, '/releases/tag/1.0.0', '/releases/tag/1.0.2' ) ), /selected evidence/ );
	assert.throws( () => verifyPlacementBrief( source.replace( /↗[\uFE0E\uFE0F]?/, '' ) ), /external artifact/ );
} );

test( 'one dateline records the current evidence date without duplicate status dates', () => {
	assert.throws( () => verifyPlacementBrief( source.replace( 'States checked', 'Statuses checked' ) ), /dateline/ );
	assert.throws( () => verifyPlacementBrief( source.replace( 'States checked', 'States checked States checked' ) ), /dateline/ );
	assert.throws( () => verifyPlacementBrief( source.replace( /datetime="\d{4}-\d{2}-\d{2}"/, 'datetime="2026-07-21"' ) ), /dateline/ );
} );

test( 'the archive keeps all five old targets and all 34 plus nine rows', () => {
	for ( const anchor of RESEARCH_ANCHORS ) {
		assert.throws( () => verifyPlacementArchive( mutate( archive, 'id="' + anchor + '"', 'id="lost"' ) ), /retains/ );
	}
	assert.throws( () => verifyPlacementArchive( archive.replace( /<tbody>([\s\S]*?)<tr>[\s\S]*?<\/tr>/, '<tbody>$1' ) ), /records/ );
} );

test( 'record parity catches changed standings, links and reasoning even with unchanged row counts', () => {
	assert.throws( () => verifyPlacementArchive( mutate( archive, 'SIEM / log analytics', 'SIEM / analytics' ), acceptedArchive ), /byte parity/ );
	assert.throws( () => verifyPlacementArchive( mutate( archive, 'https://fueled.com/careers/freelance-contract-senior-web-engineer/', 'https://example.com/' ), acceptedArchive ), /byte parity/ );
	for ( const [ before, after ] of [
		[ 'Live · Pass — manual review', 'Live · Pass' ],
		[ 'inspectable, migrated live news site.', 'reliable news site.' ],
		[ 'https://automattic.com/work-with-us/job/technical-account-manager-newspack/', 'https://example.com/newspack/' ],
	] ) assert.throws( () => verifyPlacementArchive( mutate( archive, before, after ), acceptedArchive ), /byte parity/ );
} );

test( 'the removal transition permits only reviewed cleanup copy and keeps layout ownership', () => {
	assert.throws( () => verifyPlacementArchive( mutate( archive, 'current availability, Q1–Q3 role fit, and candidate qualification are separate judgments.', 'Every retained applicant is qualified.' ), acceptedArchive ), /cleanup copy/ );
	assert.throws( () => verifyPlacementArchive( mutate( archive, 'alignwide hp-page-hero hp-method-hero', 'alignwide hp-page-hero hp-method-hero unexpected-layout' ), acceptedArchive ), /reviewed cleanup copy/ );
} );

test( 'the requested blog removal cannot become another availability finding or remove a different job', () => {
	assert.doesNotMatch( archive, /\bWP Engine\b/ );
	for ( const [ before, after ] of [
		[ 'Ten confirmed unavailable entries were removed. A further entry was removed from the blog at my request.', 'Eleven confirmed unavailable entries were removed.' ],
		[ 'and four unresolved original listings.', 'and five unresolved original listings.' ],
		[ '2026-07-20 — 3 rows', '2026-07-20 — 4 rows' ],
	] ) assert.throws( () => verifyPlacementArchive( mutate( archive, before, after ), acceptedArchive ), /cleanup copy/ );
	let tableIndex = 0;
	const differentRemovalBaseline = archive.replace( /<tbody>([\s\S]*?)<\/tbody>/g, ( table, body ) => tableIndex++ === 1 ? '<tbody>' + body + '<tr><th scope="row">Other original job</th><td>Other employer</td><td></td><td></td><td>Live · Pass</td><td>Other reasoning.</td></tr></tbody>' : table );
	assert.throws( () => verifyPlacementArchive( archive, differentRemovalBaseline ), /only additional removed record is the requested WP Engine row/ );
	assert.throws( () => verifyPlacementArchive( mutate( archive, '<th scope="row">Technical Account Manager, Newspack</th>', '<th scope="row">Technical Support L1</th>' ), acceptedArchive ), /retained market identities/ );
} );

test( 'the nine-row cache recovery permits only the full-SHA link edit', () => {
	const short = '?market-version=93297bf33d5d"';
	const full = '?market-version=93297bf33d5d144c412ce1672169f203fec67a4208f76f20a52dc1fd33e3ef3b"';
	const preceding = archive.includes( full ) ? mutate( archive, full, short ) : archive;
	const updated = mutate( preceding, short, full );
	assert.doesNotThrow( () => verifyPlacementArchive( updated, preceding ) );
	assert.doesNotThrow( () => verifyPlacementArchive( updated, updated ) );
	assert.throws( () => verifyPlacementArchive( preceding, updated ), /cleanup copy/ );
	assert.throws( () => verifyPlacementArchive( mutate( updated, 'alignwide hp-page-hero hp-method-hero', 'alignwide hp-page-hero hp-method-hero altered' ), preceding ), /reviewed cleanup copy/ );
} );

test( 'the workbook download permits only its approved sentence and immutable cache key', () => {
	const before = 'Download the <a href="/wp-content/themes/hperkins-tokens/assets/documents/wordpress-job-market-screen-live-states.xlsx?market-version=3a1f91995f5e">public market workbook (XLSX)</a> with ten retained records after the 6 October 2026 availability cleanup.';
	const after = 'Download the <a href="/wp-content/themes/hperkins-tokens/assets/documents/wordpress-job-market-screen-live-states.xlsx?market-version=93297bf33d5d144c412ce1672169f203fec67a4208f76f20a52dc1fd33e3ef3b">public market workbook (XLSX)</a> with nine retained records after the 6 October 2026 availability cleanup.';
	const linked = archive;
	const preceding = acceptedArchive;
	assert( linked.includes( after ), 'The reviewed nine-row archive carries its new download key.' );
	assert.doesNotThrow( () => verifyPlacementArchive( linked, preceding ), 'Only the requested removal and count/copy/download updates change the accepted body.' );
	assert.doesNotThrow( () => verifyPlacementArchive( linked, linked ), 'The promoted linked archive remains valid.' );
	for ( const [ original, replacement ] of [
		[ after, before ],
		[ after, 'Download the public market workbook (XLSX) with nine retained records after the 6 October 2026 availability cleanup.' ],
		[ 'wordpress-job-market-screen-live-states.xlsx?market-version=93297bf33d5d144c412ce1672169f203fec67a4208f76f20a52dc1fd33e3ef3b', 'wordpress-job-market-screen.xlsx?market-version=93297bf33d5d144c412ce1672169f203fec67a4208f76f20a52dc1fd33e3ef3b' ],
		[ 'wordpress-job-market-screen-live-states.xlsx?market-version=93297bf33d5d144c412ce1672169f203fec67a4208f76f20a52dc1fd33e3ef3b', 'wordpress-job-market-screen-live-states.xlsx' ],
		[ '?market-version=93297bf33d5d144c412ce1672169f203fec67a4208f76f20a52dc1fd33e3ef3b', '?market-version=stale' ],
		[ '?market-version=93297bf33d5d144c412ce1672169f203fec67a4208f76f20a52dc1fd33e3ef3b', '?market-version=3a1f91995f5e' ],
		[ '?market-version=93297bf33d5d144c412ce1672169f203fec67a4208f76f20a52dc1fd33e3ef3b', '?v=93297bf33d5d144c412ce1672169f203fec67a4208f76f20a52dc1fd33e3ef3b' ],
		[ 'href="/wp-content/themes/hperkins-tokens/assets/documents/wordpress-job-market-screen-live-states.xlsx', 'href="https://example.com/wordpress-job-market-screen-live-states.xlsx' ],
	] ) assert.throws( () => verifyPlacementArchive( mutate( linked, original, replacement ), preceding ), /cleanup copy/ );
	assert.throws( () => verifyPlacementArchive( mutate( linked, 'alignwide hp-page-hero hp-method-hero', 'alignwide hp-page-hero hp-method-hero changed-layout' ), preceding ), /reviewed cleanup copy/ );
} );

test( 'Option A never loads the retired method redirect', () => {
	const functions = fs.readFileSync( path.join( root, 'functions.php' ), 'utf8' );
	assert.doesNotMatch( functions, /require(?:_once)?[^;]*placement-route\.php/ );
	assert( ! fs.existsSync( path.join( root, 'inc/placement-route.php' ) ) );
	assert( ! fs.existsSync( path.join( root, 'scripts/verify-placement-route.php' ) ) );
} );
