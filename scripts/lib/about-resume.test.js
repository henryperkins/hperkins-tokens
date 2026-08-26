#!/usr/bin/env node

const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const test = require( 'node:test' );

const themeRoot = path.join( __dirname, '..', '..' );
const controllerPath = path.join( themeRoot, 'assets', 'js', 'about-resume.js' );
const draftPath = path.join( themeRoot, 'content', 'page-drafts', 'about.html' );

const rows = [
	{ key: 'docs', terms: [ 'Documentation', 'Developer enablement' ] },
	{ key: 'defect', terms: [ 'Escalation triage' ] },
	{ key: 'codex', terms: [ 'Plugin development', 'Provider integrations', 'Sidecar debugging', 'Request logging', 'Release packaging', 'PHPStan', 'Plugin Check', 'PHP', 'AI Client' ] },
	{ key: 'focus', terms: [ 'CSS cascade', 'Browser debugging', 'Release packaging', 'Git' ] },
	{ key: 'skills', terms: [ 'AI Client', 'Abilities API', 'MCP', 'Documentation', 'Developer enablement' ] },
	{ key: 'vectors', terms: [ 'PHP', 'Provider integrations', 'AI Client' ] },
	{ key: 'logging', terms: [ 'Request logging', 'Sidecar debugging', 'Provider integrations', 'Escalation triage', 'Code review' ] },
	{ key: 'consultant', terms: [ 'Plugin development', 'Gutenberg', 'REST API', 'WP-CLI', 'JavaScript', 'TypeScript', 'React', 'CSS cascade', 'WooCommerce', 'Cloudflare Workers', 'Prompt design', 'Provider integrations', 'AI workflow prototyping', 'Documentation', 'Release packaging', 'Git', 'GitHub Actions', 'Composer', 'Technical support' ] },
	{ key: 'shift', terms: [ 'Escalation triage' ] },
	{ key: 'happiness', terms: [ 'HTTP', 'DNS', 'Documentation', 'Escalation triage', 'Technical support' ] },
	{ key: 'community', terms: [ 'Developer enablement', 'Documentation', 'Customer onboarding' ] },
];

const groups = [
	{ legend: 'WordPress', items: [ 'Plugin development', 'Gutenberg', 'AI Client', 'Abilities API', 'REST API', 'WP-CLI' ] },
	{ legend: 'Languages & frontend', items: [ 'PHP', 'JavaScript', 'TypeScript', 'React', 'CSS cascade' ] },
	{ legend: 'Platform & delivery', items: [ 'Cloudflare Workers', 'WooCommerce', 'HTTP', 'DNS', 'Browser debugging' ] },
	{ legend: 'AI & integrations', items: [ 'Provider integrations', 'AI workflow prototyping', 'MCP', 'Prompt design', 'Request logging', 'Sidecar debugging' ] },
	{ legend: 'Workflow & enablement', items: [ 'Git', 'GitHub Actions', 'Code review', 'Release packaging', 'Plugin Check', 'PHPStan', 'Composer', 'Documentation', 'Developer enablement' ] },
	{ legend: 'Delivery & support', items: [ 'Technical support', 'Escalation triage', 'Customer onboarding' ] },
];

test( 'v3 Skills index derives literal counts and coverage from row evidence', () => {
	assert.equal( fs.existsSync( controllerPath ), true, 'assets/js/about-resume.js must exist.' );
	const { buildIndex } = require( controllerPath );
	const index = buildIndex( rows, groups );

	assert.equal( index.counts.Documentation, 5 );
	assert.equal( index.counts[ 'AI Client' ], 3 );
	assert.equal( index.counts[ 'Provider integrations' ], 4 );
	assert.equal( index.counts[ 'Technical support' ], 2 );
	assert.equal( index.groups[ 0 ].coverage, '6/6 backed above' );
	assert.equal( index.groups[ 4 ].coverage, '9/9 backed above' );
	assert.equal( index.groups[ 5 ].coverage, '3/3 backed above' );
} );

test( 'v3 filter promotes exact matches while preserving both stable partitions', () => {
	const { partitionEvidenceRows } = require( controllerPath );
	const partition = partitionEvidenceRows( rows.slice( 0, 7 ), 'Documentation' );

	assert.deepEqual( partition.ordered.map( ( row ) => row.key ), [
		'docs', 'skills', 'defect', 'codex', 'focus', 'vectors', 'logging',
	] );
	assert.equal( partition.matchCount, 2 );
	assert.equal( partition.dividerIndex, 2 );
	assert.deepEqual(
		partitionEvidenceRows( rows.slice( 0, 7 ), null ).ordered.map( ( row ) => row.key ),
		rows.slice( 0, 7 ).map( ( row ) => row.key )
	);
} );

test( 'v3 filter dims and restores mounted rows without hiding them', () => {
	const { applyDimmedRows } = require( controllerPath );
	const states = new Map();
	const mountedRows = rows.slice( 0, 3 ).map( ( row ) => ( {
		terms: row.terms,
		getAttribute( name ) {
			return name === 'data-evidence-terms' ? row.terms.join( '|' ) : null;
		},
		classList: {
			toggle( name, enabled ) {
				states.set( row.key + ':' + name, enabled );
			},
		},
	} ) );

	applyDimmedRows( mountedRows, 'Documentation' );
	assert.equal( states.get( 'docs:is-dimmed' ), false );
	assert.equal( states.get( 'defect:is-dimmed' ), true );
	assert.equal( states.get( 'codex:is-dimmed' ), true );

	applyDimmedRows( mountedRows, null );
	assert.equal( states.get( 'docs:is-dimmed' ), false );
	assert.equal( states.get( 'defect:is-dimmed' ), false );
	assert.equal( states.get( 'codex:is-dimmed' ), false );
} );

test( 'v3 Skills readout uses the approved idle, singular, and plural language', () => {
	const { formatReadout } = require( controllerPath );
	assert.equal(
		formatReadout( null, 0 ),
		'Pick a term to pull its evidence to the top. Nothing is hidden.'
	);
	assert.equal( formatReadout( 'Gutenberg', 1 ), 'Gutenberg — 1 row cites it, pulled to the top of each ledger.' );
	assert.equal( formatReadout( 'Documentation', 5 ), 'Documentation — 5 rows cite it, pulled to the top of each ledger.' );
} );

test( 'A term nothing above backs remains visibly unbacked and inert', () => {
	const { buildIndex, UNBACKED_COUNT } = require( controllerPath );
	assert.equal( UNBACKED_COUNT, '—' );

	const index = buildIndex( rows, [
		{ legend: 'Mixed', items: [ 'Documentation', 'Kubernetes' ] },
	] );

	assert.equal( index.counts.Documentation, 5 );
	assert.equal( index.counts.Kubernetes, undefined );
	assert.equal( index.groups[ 0 ].backed, 1 );
	assert.equal( index.groups[ 0 ].coverage, '1/2 backed above' );
} );

test( 'About v3 contract validates the real candidate and its evidence index', () => {
	const { verifyAboutV3Body } = require( './about-page-contract' );
	assert.equal( typeof verifyAboutV3Body, 'function', 'about-page-contract must export verifyAboutV3Body().' );
	const report = verifyAboutV3Body( fs.readFileSync( draftPath, 'utf8' ), {
		label: 'content/page-drafts/about.html',
	} );

	assert.equal( report.contributionCount, 7 );
	assert.equal( report.currentRoleCount, 4 );
	assert.equal( report.earlierRoleCount, 3 );
	assert.equal( report.skillTermCount, 34 );
	assert.equal( report.skillGroupCount, 6 );
	assert.equal( report.counts.Documentation, 5 );
	assert.equal( report.counts[ 'Technical support' ], 2 );
	assert.deepEqual( report.sectionOrder, [ 'contributions', 'experience', 'skills', 'showcase', 'contact' ] );
	assert.equal( report.actionRailCount, 2 );
	assert.equal( report.actionPanelCount, 1 );
	assert.deepEqual( report.heroActions, [
		{ href: '/one-page-resume/', text: 'Download résumé (PDF)' },
		{ href: '/contact/', text: 'Get in touch' },
	] );
	assert.deepEqual( report.closingActions, [
		{ href: '/contact/', text: 'Start a conversation' },
		{ href: '/one-page-resume/', text: 'Download résumé (PDF)' },
	] );
	assert.match( fs.readFileSync( draftPath, 'utf8' ), /class="hp-about-print-control"><a href="\/one-page-resume\/">Print<\/a>/ );
	assert.match( fs.readFileSync( draftPath, 'utf8' ), /<h3 class="wp-block-heading">HPerkins Tokens<\/h3>[\s\S]*?Live · v0\.3\.60/ );
} );

test( 'About v3 rejects block className JSON that WordPress would reserialize', () => {
	const { verifyAboutV3Body } = require( './about-page-contract' );
	const source = fs.readFileSync( draftPath, 'utf8' );
	const canonical = source.replace(
		/"className":"([^"]*)"/g,
		( match, className ) => `"className":"${ className.replace( /--/g, '\\u002d\\u002d' ) }"`
	);
	const nonCanonical = canonical.replace( '\\u002d\\u002d', '--' );

	assert.notEqual( nonCanonical, canonical, 'fixture mutation must restore one raw double hyphen' );
	assert.doesNotThrow( () => verifyAboutV3Body( canonical ) );
	assert.throws(
		() => verifyAboutV3Body( nonCanonical ),
		/WordPress-safe block className JSON/i
	);
} );

test( 'About v3 contract rejects stale filtering language and altered hero actions', () => {
	const { verifyAboutV3Body } = require( './about-page-contract' );
	const source = fs.readFileSync( draftPath, 'utf8' );
	assert.doesNotThrow( () => verifyAboutV3Body( source ) );

	for ( const [ from, to, message ] of [
		[ 'Nothing is hidden.', 'The rest are dimmed.', /Nothing is hidden|readout/i ],
		[ '/one-page-resume/', '/resume/', /hero action|one-page-resume/i ],
		[ 'Get in touch', 'Contact me', /hero action|Get in touch/i ],
	] ) {
		const changed = source.replace( from, to );
		assert.notEqual( changed, source, `v3 mutation ${ from } must apply` );
		assert.throws( () => verifyAboutV3Body( changed ), message );
	}

	assert.throws(
		() => verifyAboutV3Body( source.replace(
			'<section id="contributions" class="wp-block-group hp-about-section hp-about-contributions">',
			'<section id="contributions" class="wp-block-group hp-about-section hp-about-contributions" hidden>'
		) ),
		/authored v3 markup.*hidden/i
	);
	assert.throws(
		() => verifyAboutV3Body( source.replace( '<div class="wp-block-group hp-about-ledger hp-about-ledger--contributions">', '<div class="wp-block-group hp-about-ledger hp-about-ledger--contributions"><div class="hp-about-ledger__divider"></div>' ) ),
		/filter dividers.*generated/i
	);
} );
