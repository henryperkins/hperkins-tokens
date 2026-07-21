#!/usr/bin/env node

const fs = require( 'node:fs' );
const path = require( 'node:path' );

const ROOT = path.join( __dirname, '..' );
const SOURCE_ONLY = process.argv.includes( '--source-only' );

function read( file ) {
	return fs.readFileSync( path.join( ROOT, file ), 'utf8' );
}

function assertIncludes( file, needles ) {
	const value = read( file );
	for ( const needle of needles ) {
		if ( ! value.includes( needle ) ) {
			throw new Error( file + ' is missing: ' + needle );
		}
	}
}

function verifySource() {
	assertIncludes( 'parts/header.html', [ '[hperkins_council_header]' ] );
	assertIncludes( 'inc/council-header.php', [
		'hperkins_tokens_get_council_navigation_model',
		'hperkins_tokens_get_council_work_items',
		'hperkins_tokens_render_council_header',
		'data-hp-header-root',
		'data-hp-header-trigger="work"',
		'data-hp-header-panel="work"',
		'data-hp-header-hover="work"',
		'data-hp-header-trigger="writing"',
		'data-hp-header-panel="writing"',
		'data-hp-header-hover="writing"',
		'data-hp-header-trigger="search"',
		'data-hp-header-panel="search"',
		'data-hp-header-trigger="drawer"',
		'data-hp-header-panel="drawer"',
		"'label'  => 'Flavor Agent'",
		"'url'    => '/work/flavor-agent/'",
		"'status' => 'Release candidate · v0.1.0-rc.1'",
		"'label'  => 'WordPress AI Stack Contributions'",
		"'url'    => '/work/upstream-core-ai-stack/'",
		"'status' => 'Merged · upstream'",
		"'label'  => 'AI Provider for Codex'",
		"'url'    => '/work/ai-provider-for-codex/'",
		"'status' => 'Shipped · v2.1'",
		"'label'  => 'DJ Lee & Voices of Judah'",
		"'url'    => '/work/dj-lee-voices-of-judah/'",
		"'status' => 'Delivered · live site'",
		"'state'  => 'review'",
		"'state'  => 'done'",
		'is-state-review',
		'is-state-done',
	] );
	assertIncludes( 'style.css', [
		'--hp-header-h: 68px;',
		'--hp-header-h-compact: 62px;',
		'--hp-nav-gap: 28px;',
		'--hp-nav-label: var(--wp--preset--font-size--sm);',
		'.hp-council-work-panel',
		'.hp-council-writing-panel',
		'.hp-council-search-panel',
		'.hp-council-drawer',
	] );
	assertIncludes( 'parts/footer.html', [ '<a href="/contact/">Contact</a>' ] );
	assertIncludes( 'theme.json', [ '"slug": "gold-800"', '"color": "#6E531B"' ] );
	console.log( 'verified Council header source contract' );
}

verifySource();
if ( ! SOURCE_ONLY ) {
	throw new Error( 'Rendered checks are not implemented yet.' );
}
