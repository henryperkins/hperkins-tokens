const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const os = require( 'node:os' );
const path = require( 'node:path' );

const {
	PAGE_CONTRACTS,
	buildApplyLocalDraftsPhp,
	prepareDraftPayloads,
	selectDeployedIntegrityContracts,
	selectDraftContracts,
	selectPageContracts,
} = require( './page-content-contract' );

test( 'selectPageContracts keeps the full historical export when no keys are supplied', () => {
	assert.deepEqual( selectPageContracts(), PAGE_CONTRACTS );
} );

test( 'selectPageContracts returns only explicitly requested page contracts', () => {
	assert.deepEqual(
		selectPageContracts( [ 'job-placement-digest', 'placement-method-evidence' ] ).map( ( contract ) => contract.key ),
		[ 'job-placement-digest', 'placement-method-evidence' ]
	);
} );

test( 'selectPageContracts rejects unknown and duplicate keys', () => {
	assert.throws( () => selectPageContracts( [ 'missing-page' ] ), /Unknown page contract/ );
	assert.throws(
		() => selectPageContracts( [ 'job-placement-digest', 'job-placement-digest' ] ),
		/Duplicate page contract/
	);
} );

test( 'the About contract carries explicit-only draft, adapter, and integrity metadata', () => {
	const about = PAGE_CONTRACTS.find( ( contract ) => contract.key === 'about' );
	assert.ok( about, 'about contract exists' );
	assert.equal( about.draft.file, 'content/page-drafts/about.html' );
	assert.equal( about.draft.applyByDefault, false );
	assert.equal( about.draft.updateExistingOnly, true );
	assert.equal( about.pattern.file, 'patterns/about-resume.php' );
	assert.equal( about.pattern.role, 'thin-snapshot-adapter' );
	assert.equal( about.deployedIntegrity, true );
} );

test( 'the recruiter drafts stay the default local selection', () => {
	for ( const key of [ 'job-placement-digest', 'placement-method-evidence' ] ) {
		const contract = PAGE_CONTRACTS.find( ( candidate ) => candidate.key === key );
		assert.equal( contract.draft.applyByDefault, true, `${ key } applies by default` );
		assert.equal( contract.draft.updateExistingOnly, false, `${ key } may still seed a missing page` );
	}
	assert.deepEqual(
		selectDraftContracts().map( ( contract ) => contract.key ),
		[ 'job-placement-digest', 'placement-method-evidence' ]
	);
} );

test( 'selectDraftContracts --page=about selects only About and never unions with defaults', () => {
	assert.deepEqual(
		selectDraftContracts( [ 'about' ] ).map( ( contract ) => contract.key ),
		[ 'about' ]
	);
} );

test( 'selectDraftContracts preserves the order of repeated distinct keys', () => {
	assert.deepEqual(
		selectDraftContracts( [ 'placement-method-evidence', 'about', 'job-placement-digest' ] ).map( ( contract ) => contract.key ),
		[ 'placement-method-evidence', 'about', 'job-placement-digest' ]
	);
} );

test( 'selectDraftContracts fails on empty, unknown, duplicate, malformed, and non-draft keys', () => {
	assert.throws( () => selectDraftContracts( [ '' ] ), /Empty --page selector/ );
	assert.throws( () => selectDraftContracts( [ 'missing-page' ] ), /Unknown page contract/ );
	assert.throws( () => selectDraftContracts( [ 'about', 'about' ] ), /Duplicate page contract/ );
	assert.throws( () => selectDraftContracts( [ 'About Page' ] ), /Malformed page selector/ );
	assert.throws( () => selectDraftContracts( [ '--drafts' ] ), /Malformed page selector/ );
	assert.throws( () => selectDraftContracts( [ 'work' ] ), /not a reviewable draft/ );
} );

test( 'deployed-integrity selection covers About plus the two recruiter pages', () => {
	assert.deepEqual(
		selectDeployedIntegrityContracts().map( ( contract ) => contract.key ),
		[ 'about', 'job-placement-digest', 'placement-method-evidence' ]
	);
	assert.deepEqual(
		selectDeployedIntegrityContracts( [ 'about' ] ).map( ( contract ) => contract.key ),
		[ 'about' ]
	);
	assert.throws( () => selectDeployedIntegrityContracts( [ 'work' ] ), /not a deployed-integrity page/ );
	assert.throws( () => selectDeployedIntegrityContracts( [ 'about', 'about' ] ), /Duplicate page contract/ );
} );

test( 'a >40KB draft body never enters the generated WP-CLI arguments', () => {
	const themePath = fs.mkdtempSync( path.join( os.tmpdir(), 'hp-draft-args-' ) );
	try {
		fs.mkdirSync( path.join( themePath, 'content', 'page-drafts' ), { recursive: true } );
		const marker = 'HP_DRAFT_BODY_MARKER_';
		const body = `<!-- wp:paragraph -->\n<p>${ marker }${ 'x'.repeat( 41 * 1024 ) }</p>\n<!-- /wp:paragraph -->\n`;
		assert.ok( Buffer.byteLength( body ) > 40 * 1024, 'fixture body exceeds 40KB' );
		fs.writeFileSync( path.join( themePath, 'content', 'page-drafts', 'about.html' ), body );

		const about = PAGE_CONTRACTS.find( ( contract ) => contract.key === 'about' );
		const payloads = prepareDraftPayloads( [ about ], { themePath } );
		assert.equal( payloads.length, 1 );
		assert.equal( payloads[ 0 ].file, 'content/page-drafts/about.html' );
		assert.match( payloads[ 0 ].sha256, /^[0-9a-f]{64}$/ );
		assert.ok( payloads[ 0 ].bytes > 40 * 1024 );

		// The eval source is the WP-CLI argv element; it must carry the
		// relative path and expected hash but never the draft body itself.
		const phpSource = buildApplyLocalDraftsPhp( payloads );
		assert.ok( phpSource.includes( "'content/page-drafts/about.html'" ), 'php embeds the relative path' );
		assert.ok( phpSource.includes( payloads[ 0 ].sha256 ), 'php embeds the expected hash' );
		assert.ok( ! phpSource.includes( marker ), 'php must not embed the draft body' );
		assert.ok( Buffer.byteLength( phpSource ) < 20 * 1024, 'eval source stays bounded' );

		// About refuses creation: only an existing page may be updated, and
		// only its post_content.
		assert.match( phpSource, /update_existing_only/ );
		assert.match( phpSource, /Refusing to create a page/ );
		assert.match( phpSource, /wp_update_post\( array\(\s*'ID' => \$page->ID,\s*'post_content' => wp_slash\( \$content \),\s*\), true \)/ );
		assert.ok( ! /'post_title' => \$page/.test( phpSource ) );
	} finally {
		fs.rmSync( themePath, { recursive: true, force: true } );
	}
} );

test( 'prepareDraftPayloads rejects empty drafts and paths escaping the theme', () => {
	const themePath = fs.mkdtempSync( path.join( os.tmpdir(), 'hp-draft-guard-' ) );
	try {
		fs.mkdirSync( path.join( themePath, 'content', 'page-drafts' ), { recursive: true } );
		fs.writeFileSync( path.join( themePath, 'content', 'page-drafts', 'about.html' ), '   \n' );
		const about = PAGE_CONTRACTS.find( ( contract ) => contract.key === 'about' );
		assert.throws( () => prepareDraftPayloads( [ about ], { themePath } ), /Draft file is empty/ );

		const escaping = { ...about, draft: { ...about.draft, file: '../outside.html' } };
		assert.throws( () => prepareDraftPayloads( [ escaping ], { themePath } ), /escapes the theme root/ );
	} finally {
		fs.rmSync( themePath, { recursive: true, force: true } );
	}
} );
