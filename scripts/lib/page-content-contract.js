#!/usr/bin/env node

const path = require( 'node:path' );

const THEME_PATH = path.resolve( __dirname, '..', '..' );
const SNAPSHOT_DIR = path.join( THEME_PATH, 'content', 'page-snapshots' );

const PAGE_CONTRACTS = [
	{
		key: 'front-page',
		label: 'front page',
		snapshotFile: 'front-page.html',
		templateId: 'front-page',
		templateFile: 'templates/front-page.html',
	},
	{
		key: 'about',
		label: 'about page',
		pagePath: 'about',
		snapshotFile: 'about.html',
		templateId: 'page-about',
		templateFile: 'templates/page-about.html',
	},
	{
		key: 'work',
		label: 'work page',
		pagePath: 'work',
		snapshotFile: 'work.html',
		templateId: 'page-work',
		templateFile: 'templates/page-work.html',
	},
	{
		key: 'ai-enablement',
		label: 'AI Enablement page',
		pagePath: 'ai-enablement',
		snapshotFile: 'ai-enablement.html',
		templateId: 'page-ai-enablement',
		templateFile: 'templates/page-ai-enablement.html',
	},
	{
		key: 'job-placement-digest',
		label: 'Job Placement Digest page',
		pagePath: 'job-placement-digest',
		snapshotFile: 'job-placement-digest.html',
		templateId: 'page-job-placement-digest',
		templateFile: 'templates/page-job-placement-digest.html',
	},
	{
		key: 'flavor-agent-demo',
		label: 'Flavor Agent demo page',
		pagePath: 'work/flavor-agent/demo',
		snapshotFile: 'work-flavor-agent-demo.html',
	},
];

const RETIRED_PAGE_PATHS = [
	{
		key: 'plato-artifacts',
		label: 'Plato Artifacts page',
		pagePath: 'plato-artifacts',
	},
];

function normalizeContent( value ) {
	return value.replace( /\r\n/g, '\n' ).trimEnd();
}

module.exports = {
	THEME_PATH,
	SNAPSHOT_DIR,
	PAGE_CONTRACTS,
	RETIRED_PAGE_PATHS,
	normalizeContent,
};
