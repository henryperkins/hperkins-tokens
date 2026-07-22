#!/usr/bin/env node

const path = require( 'node:path' );

const { normalizeContent } = require( './content-integrity' );
const { escapePhpString } = require( './wp-cli' );

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
		key: 'placement-method-evidence',
		label: 'Placement Method and Evidence page',
		pagePath: 'placement-method-and-evidence',
		snapshotFile: 'placement-method-evidence.html',
		templateId: 'page-placement-method-and-evidence',
		templateFile: 'templates/page-placement-method-and-evidence.html',
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

function getTrackedPageTargetsPhp( { includeTemplate = false } = {} ) {
	return PAGE_CONTRACTS.filter( ( contract ) => contract.pagePath )
		.map( ( contract ) => {
			const entries = [
				`'key' => ${ escapePhpString( contract.key ) }`,
				`'path' => ${ escapePhpString( contract.pagePath ) }`,
			];

			if ( includeTemplate && contract.templateId ) {
				entries.push( `'template' => ${ escapePhpString( contract.templateId ) }` );
			}

			return `array( ${ entries.join( ', ' ) } )`;
		} )
		.join( ',\n\t\t\t' );
}

function getRetiredPageTargetsPhp() {
	return RETIRED_PAGE_PATHS.map( ( contract ) =>
		`array( 'key' => ${ escapePhpString( contract.key ) }, 'path' => ${ escapePhpString( contract.pagePath ) } )`
	).join( ',\n\t\t\t' );
}

function getPageRecord( state, contract ) {
	if ( contract.key === 'front-page' ) {
		return state.frontPage;
	}

	return state.pages[ contract.key ];
}

function selectPageContracts( keys = [] ) {
	if ( keys.length === 0 ) {
		return PAGE_CONTRACTS;
	}

	const selected = [];
	const seen = new Set();
	for ( const key of keys ) {
		if ( seen.has( key ) ) {
			throw new Error( `Duplicate page contract: ${ key }.` );
		}
		const contract = PAGE_CONTRACTS.find( ( candidate ) => candidate.key === key );
		if ( ! contract ) {
			throw new Error( `Unknown page contract: ${ key }.` );
		}
		seen.add( key );
		selected.push( contract );
	}

	return selected;
}

module.exports = {
	THEME_PATH,
	SNAPSHOT_DIR,
	PAGE_CONTRACTS,
	RETIRED_PAGE_PATHS,
	getPageRecord,
	getRetiredPageTargetsPhp,
	getTrackedPageTargetsPhp,
	normalizeContent,
	selectPageContracts,
};
