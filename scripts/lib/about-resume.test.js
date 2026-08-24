#!/usr/bin/env node

const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const test = require( 'node:test' );

const themeRoot = path.join( __dirname, '..', '..' );
const controllerPath = path.join( themeRoot, 'assets', 'js', 'about-resume.js' );
const draftPath = path.join( themeRoot, 'content', 'page-drafts', 'about.html' );

const rows = [
	{ terms: [ 'Documentation', 'Developer enablement' ] },
	{ terms: [ 'Escalation triage' ] },
	{ terms: [ 'Plugin development', 'Provider integrations', 'Sidecar debugging', 'Request logging', 'Release packaging', 'PHPStan', 'Plugin Check', 'PHP', 'AI Client' ] },
	{ terms: [ 'CSS cascade', 'Browser debugging', 'Release packaging', 'Git' ] },
	{ terms: [ 'AI Client', 'Abilities API', 'MCP', 'Documentation', 'Developer enablement' ] },
	{ terms: [ 'PHP', 'Provider integrations', 'AI Client' ] },
	{ terms: [ 'Request logging', 'Sidecar debugging', 'Provider integrations', 'Escalation triage' ] },
	{ terms: [ 'Plugin development', 'Gutenberg', 'REST API', 'WP-CLI', 'JavaScript', 'TypeScript', 'React', 'CSS cascade', 'WooCommerce', 'Cloudflare Workers', 'Prompt design', 'Provider integrations', 'Documentation', 'Release packaging', 'Git', 'GitHub Actions', 'Composer' ] },
	{ terms: [ 'Escalation triage' ] },
	{ terms: [ 'HTTP', 'DNS', 'Documentation', 'Escalation triage', 'Browser debugging' ] },
	{ terms: [ 'Developer enablement', 'Documentation' ] },
];

const groups = [
	{ legend: 'WordPress', items: [ 'Plugin development', 'Gutenberg', 'AI Client', 'Abilities API', 'REST API', 'WP-CLI' ] },
	{ legend: 'Languages & frontend', items: [ 'PHP', 'JavaScript', 'TypeScript', 'React', 'CSS cascade' ] },
	{ legend: 'Platform & delivery', items: [ 'Cloudflare Workers', 'WooCommerce', 'HTTP', 'DNS', 'Browser debugging' ] },
	{ legend: 'AI & integrations', items: [ 'Provider integrations', 'MCP', 'Prompt design', 'Request logging', 'Sidecar debugging' ] },
	{ legend: 'Workflow & enablement', items: [ 'Git', 'GitHub Actions', 'Release packaging', 'Plugin Check', 'PHPStan', 'Composer', 'Documentation', 'Developer enablement', 'Escalation triage' ] },
];

test( 'Skills index derives literal counts and coverage from row evidence', () => {
	assert.equal( fs.existsSync( controllerPath ), true, 'assets/js/about-resume.js must exist.' );
	const { buildIndex } = require( controllerPath );
	const index = buildIndex( rows, groups );

	assert.equal( index.counts.Documentation, 5 );
	assert.equal( index.counts[ 'AI Client' ], 3 );
	assert.equal( index.counts[ 'Provider integrations' ], 4 );
	assert.equal( index.counts[ 'GitHub Actions' ], 1 );
	assert.equal( index.groups[ 0 ].coverage, '6/6 backed above' );
	assert.equal( index.groups[ 4 ].coverage, '9/9 backed above' );
} );

test( 'Skills filter dims only rows without the selected explicit term', () => {
	assert.equal( fs.existsSync( controllerPath ), true, 'assets/js/about-resume.js must exist.' );
	const { deriveDimmedRows } = require( controllerPath );
	assert.deepEqual(
		deriveDimmedRows( rows, 'Documentation' ),
		[ false, true, true, true, false, true, true, false, true, false, false ]
	);
	assert.deepEqual( deriveDimmedRows( rows, null ), Array( rows.length ).fill( false ) );
} );

test( 'Skills readout uses the approved idle, singular, and plural language', () => {
	assert.equal( fs.existsSync( controllerPath ), true, 'assets/js/about-resume.js must exist.' );
	const { formatReadout } = require( controllerPath );
	assert.equal(
		formatReadout( null, 0 ),
		'Pick a term to dim every contribution and role that does not mention it. Numbers count the rows above.'
	);
	assert.equal( formatReadout( 'Gutenberg', 1 ), 'Gutenberg — 1 row above matches; the rest are dimmed.' );
	assert.equal( formatReadout( 'Documentation', 5 ), 'Documentation — 5 rows above match; the rest are dimmed.' );
} );

test( 'A term nothing above backs is unbacked, not zero', () => {
	const { buildIndex, UNBACKED_COUNT } = require( controllerPath );

	// The design's whole premise: a keyword the record does not evidence has to
	// be visibly unbacked rather than quietly listed with a 0 beside it.
	assert.equal( UNBACKED_COUNT, '—' );

	const index = buildIndex( rows, [
		{ legend: 'Mixed', items: [ 'Documentation', 'Kubernetes' ] },
	] );

	assert.equal( index.counts.Documentation, 5 );
	assert.equal( index.counts.Kubernetes, undefined );
	assert.equal( index.groups[ 0 ].backed, 1 );
	assert.equal( index.groups[ 0 ].coverage, '1/2 backed above' );
} );

test( 'About v2 contract validates the real candidate structure and evidence map', () => {
	const { verifyAboutV2Body } = require( './about-page-contract' );
	assert.equal( typeof verifyAboutV2Body, 'function', 'about-page-contract must export verifyAboutV2Body().' );
	const report = verifyAboutV2Body( fs.readFileSync( draftPath, 'utf8' ), {
		label: 'content/page-drafts/about.html',
	} );

	assert.equal( report.contributionCount, 7 );
	assert.equal( report.currentRoleCount, 4 );
	assert.equal( report.earlierRoleCount, 3 );
	assert.equal( report.skillTermCount, 30 );
	assert.equal( report.counts.Documentation, 5 );
	assert.deepEqual( report.sectionOrder, [ 'contributions', 'experience', 'skills', 'showcase', 'contact' ] );
	assert.equal( report.actionRailCount, 1 );
	assert.equal( report.actionPanelCount, 1 );
	assert.deepEqual( report.closingActions, [
		{ href: '/contact/', text: 'Start a conversation' },
		{ href: '/one-page-resume/', text: 'Download résumé (PDF)' },
	] );
} );

test( 'About v2 contract rejects drift in either closing action', () => {
	const { verifyAboutV2Body } = require( './about-page-contract' );
	const source = fs.readFileSync( draftPath, 'utf8' );
	const approvedPanel = source;
	assert.doesNotThrow( () => verifyAboutV2Body( approvedPanel ) );

	for ( const [ from, to, message ] of [
		[ '/contact/', '/contact-me/', /closing action.*contact|\/contact\//i ],
		[ '/one-page-resume/', '/resume/', /closing action.*résumé|one-page-resume/i ],
		[ 'Download résumé (PDF)', 'View résumé', /closing action.*résumé|Download résumé/i ],
	] ) {
		const changed = approvedPanel.replace( from, to );
		assert.notEqual( changed, approvedPanel, `closing-action mutation ${ from } must apply` );
		assert.throws( () => verifyAboutV2Body( changed ), message );
	}
} );
