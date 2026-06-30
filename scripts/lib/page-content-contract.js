#!/usr/bin/env node

const path = require( 'node:path' );

const WP_PATH = '/home/dev/hperkinsblog';
const THEME_PATH = `${ WP_PATH }/wp-content/themes/hperkins-tokens`;
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
		key: 'flavor-agent-demo',
		label: 'Flavor Agent demo page',
		pagePath: 'work/flavor-agent/demo',
		snapshotFile: 'work-flavor-agent-demo.html',
	},
];

function normalizeContent( value ) {
	return value.replace( /\r\n/g, '\n' ).trimEnd();
}

module.exports = {
	WP_PATH,
	THEME_PATH,
	SNAPSHOT_DIR,
	PAGE_CONTRACTS,
	normalizeContent,
};
