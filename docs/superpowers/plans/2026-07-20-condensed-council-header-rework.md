# Condensed Council Header Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Rebuild the HPerkins Tokens masthead from the selected Header rework.dc.html reference: a genuinely centered 68px desktop shell, theme-owned Work and Writing disclosures, anchored search, a restrained Digest signal, and a flat mobile drawer that preserves every live destination.

**Architecture:** Keep the sticky WordPress template-part wrapper, but replace the core Navigation block's rendered UI with a server-rendered Council header shortcode in inc/council-header.php. The renderer reads menu post 237 as navigation data, adds a theme-owned Work evidence panel from current repository truth, and emits one semantic DOM contract. A single dependency-free controller owns the mutually exclusive closed/work/writing/search/drawer state; a focused CDP verifier proves geometry, interactions, accessibility, and responsive behavior.

**Tech Stack:** WordPress 6.6-7.1 block child theme, PHP 8.0+, Gutenberg block serialization, hand-authored CSS, vanilla deferred JavaScript, Node.js 22 built-ins, WP-CLI, and headless Chromium over the Chrome DevTools Protocol.

## Global Constraints

- Header rework.dc.html in header-rework-desktop-mobile.zip is the visual and interaction reference. Do not ship its DC runtime, design-system bundle, duplicate fonts, inline prototype styles, or exploration controls.
- The code-reviewed 2026-07-20 Phase 1 specification remains authoritative for repository safety, live route reachability, accessibility corrections, breakpoint coordination, and menu-237 recovery.
- Preserve the Automattic Assembler parent theme unchanged.
- Add no npm package, Composer package, build step, JavaScript framework, or custom Gutenberg block.
- Keep sticky positioning on header.wp-block-template-part. Keep .hp-site-header position: relative so the desktop surfaces and mobile drawer can anchor with top: 100%.
- Menu post 237 is DB-owned. Export and commit its current state before any mutation, back up the database immediately before the recut, and keep the exporter repeatable.
- Work evidence text and destinations come from current repository truth, not stale prototype copy. In particular, AI Provider for Codex is Shipped · v2.1, not v0.1.5.
- There is no published /writing/ route. The mobile drawer therefore exposes Work, Essays, AI Enablement, About, Job Placement Digest, Search, and Subscribe; it must not introduce a dead Writing link or hide AI Enablement.
- Contact leaves the header and remains reachable through a labelled /contact/ footer link.
- Desktop Work is a disclosure in the selected design, but /work/ must remain reachable from its panel and from the mobile drawer.
- Use the selected design's 15px navigation label and 62px mobile bar. Keep the repository's corrected gold-800 #6E531B for the 8px Digest cue because it clears contrast on gold-200.
- At 782px and above render the desktop composition. At 781px and below render the mobile composition. Test both sides of the boundary.
- Every interactive target is at least 44px effective size. Mobile navigation rows are at least 50px; mobile search is 46px; mobile Subscribe is 48px.
- Preserve current page bodies, templates, patterns, content snapshots, router scroll behavior, form behavior, and prominent-action behavior.
- Work against the local Studio site first. Before any DB mutation, prove HPERKINS_WP_PATH and HPERKINS_ORIGIN identify that site and export a database backup.
- Preserve the independently landed 0.3.49 digest release and advance style.css and readme.txt together from 0.3.49 to 0.3.50 after the header implementation is verified.
- Preserve unrelated workspace state. At the current checkpoint, readme.txt contains the user's intentional 0.3.48 stable-tag repair; stage it alone in Task 1.

---

## Reconciliation Decisions

The selected handoff strengthens and expands the earlier Phase 1 design. This plan adopts:

- the full desktop Work evidence panel;
- the 15px label register;
- the 278px anchored search panel;
- the 62px mobile bar and 20px by 18px drawer body;
- a theme-owned renderer rather than stretching core submenu markup into a mega-menu;
- one mutually exclusive UI controller rather than independent listeners;
- the precise 592px Work panel, 262px Writing panel, 26px active rule, 38px visible search disc, and 116px by 42px desktop Subscribe action.

This plan deliberately does not copy three stale or unsafe prototype details:

- The Work rows use the live Work index labels, URLs, and release state. The prototype's v0.1.5 is stale.
- The drawer uses Essays and AI Enablement rows instead of a dead /writing/ link.
- The Digest cue uses gold-800 #6E531B on gold-200, not text-accent #7A5C1E.

During execution, `b45e680` (`release: 0.3.49 — job placement digest accessibility and content fixes`) landed independently after Task 2. It is a required newer-runtime prerequisite. Preserve that release and use 0.3.50 for the Council header rather than reusing or overwriting 0.3.49.

Task 1 also proved that the Studio target is SQLite-backed at `wp-content/database/.ht.sqlite`; its MySQL-oriented `wp db export` command cannot succeed because `mysqldump` is unavailable. For every remaining DB gate, use PHP's online `SQLite3::backup()` API, retain the timestamped `.sqlite` file outside Git, reopen it read-only, and require `PRAGMA integrity_check = ok` plus the expected WordPress tables and target records before mutation.

## File Map

**Create**

- inc/council-header.php — menu-data adapter, current Work evidence model, safe fallback model, and semantic server renderer.
- assets/js/header-controller.js — the only controller for Work, Writing, search, and drawer state.
- scripts/lib/navigation-content-contract.js — post ID, snapshot path, portable URL normalization, and expected menu shape.
- scripts/lib/navigation-content-contract.test.js — Node unit coverage for normalization and shape constants.
- scripts/export-navigation-snapshot.js — repeatable menu-237 exporter.
- scripts/apply-council-navigation.js — hash-guarded, idempotent local/staging menu recut.
- scripts/verify-header.js — source contracts, eight-width rendered checks, interaction checks, and screenshots.
- content/nav-snapshots/nav-237.html — tracked, refreshable canonical snapshot of the navigation post.

**Modify**

- parts/header.html — retain the hp-site-header wrapper and render the Council shortcode.
- parts/footer.html — add the labelled Contact route.
- functions.php — load the renderer and replace the two legacy header scripts with header-controller.js.
- style.css — Council shell, menus, search, drawer, motion, and release version.
- theme.json — add gold-800 #6E531B.
- scripts/verify-content-ownership.js — snapshot parity and exact menu-237 shape.
- scripts/verify-typography.js — add the 782/960/1024/1280 overflow bands while retaining the 15px nav source contract.
- scripts/verify-content-ownership-docs.js — guard the new ownership, renderer, controller, and verifier documentation.
- CLAUDE.md — document the header architecture, menu contract, snapshot/export/apply commands, and verifier.
- docs/design-system/INDEX.md — supersede the old search guidance and record the selected 2a composition.
- readme.txt — 0.3.48 prerequisite commit, preserve the independent 0.3.49 digest release, then add the 0.3.50 stable tag and changelog.

**Delete after parity is proven**

- assets/js/header-search.js — superseded by header-controller.js.
- assets/js/nav-close-delight.js — its router-safe close behavior moves into header-controller.js.

**Live state**

- WordPress wp_navigation post 237.
- Local page 10 only for baseline repair: restore /work/ from its already-tracked 0.3.48 snapshot before feature verification.

**Explicitly unchanged**

- Parent Assembler files.
- assets/imladris-pages.css.
- Page-body snapshots other than the baseline restoration of local /work/.
- templates/, patterns/, forms, subscribe endpoint, router-scroll.js, and prominent-action components.
- header-rework-desktop-mobile.zip and 2a-final-design-review.zip; both remain reference inputs, not shipped theme assets.

---

### Task 1: Restore a trustworthy 0.3.48 baseline

**Files:**

- Modify: readme.txt:6
- Live repair only: local WordPress page 10, /work/

**Interfaces:**

- Consumes: the user's current readme.txt stable-tag change and content/page-snapshots/work.html.
- Produces: a clean 0.3.48 release-sync commit and a local DB whose tracked page bodies pass ownership verification.

- [ ] **Step 1: Confirm the checkpoint and isolate the existing fix**

Run:

~~~powershell
git status --short --branch
git diff -- readme.txt
~~~

Expected: branch design/condensed-council-header-phase-1 and one change, Stable tag: 0.3.47 to Stable tag: 0.3.48. Do not stage any other path.

- [ ] **Step 2: Prove the stable-tag repair closes the known release failure**

Run:

~~~powershell
node scripts/verify-performance-assets.js
node scripts/verify-typography.js --source-only
node scripts/verify-prominent-actions.js --source-only
node scripts/verify-content-ownership-docs.js
node --test scripts/lib/wp-cli.test.js scripts/lib/site-url.test.js
~~~

Expected: all commands exit 0; the Node test run reports 21 passing tests.

- [ ] **Step 3: Commit only the existing prerequisite**

~~~powershell
git add readme.txt
git commit -m "fix: sync 0.3.48 stable tag"
~~~

Expected: one one-file commit. The design archives and ignored docs remain unstaged.

- [ ] **Step 4: Prove the selected local WordPress target**

~~~powershell
$env:HPERKINS_WP_PATH = Join-Path $env:USERPROFILE 'Studio/hperkins-tokens-dev'
$env:HPERKINS_WP_CLI_PHAR = Join-Path $env:USERPROFILE '.local/bin/wp-cli.phar'
$env:HPERKINS_ORIGIN = (& studio wp option get home --path $env:HPERKINS_WP_PATH).Trim()
$wpRoot = $env:HPERKINS_WP_PATH
$wpPhar = $env:HPERKINS_WP_CLI_PHAR
& php $wpPhar --path=$wpRoot core version
& php $wpPhar --path=$wpRoot theme list --status=active
& php $wpPhar --path=$wpRoot option get home
~~~

Expected: WordPress 7.1-beta2, hperkins-tokens active, and http://localhost:8882.

- [ ] **Step 5: Back up the local DB before repairing its stale Work body**

~~~powershell
$baselineBackup = Join-Path $env:TEMP ("hperkins-before-header-baseline-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.sql')
& php $wpPhar --path=$wpRoot db export $baselineBackup
~~~

Expected: Success: Exported to followed by the absolute backup path. Retain the path in the implementation log.

- [ ] **Step 6: Replace only the known stale Work body, guarded by its observed hash**

Run:

~~~powershell
& php $wpPhar --path=$wpRoot eval '
$page = get_page_by_path( "work", OBJECT, "page" );
if ( ! $page || 10 !== (int) $page->ID ) {
	throw new RuntimeException( "Expected /work/ to be page 10." );
}
$before = hash( "sha256", rtrim( (string) $page->post_content ) );
if ( "1df49516a6cb6e9cb0f9954918df9f4b8743f6f9e3901d87c5628491c179e33b" !== $before ) {
	throw new RuntimeException( "Refusing unexpected /work/ body: " . $before );
}
$snapshot = file_get_contents( get_stylesheet_directory() . "/content/page-snapshots/work.html" );
if ( false === $snapshot ) {
	throw new RuntimeException( "Unable to read the tracked Work snapshot." );
}
$result = wp_update_post(
	wp_slash(
		array(
			"ID" => $page->ID,
			"post_content" => rtrim( $snapshot ),
		)
	),
	true
);
if ( is_wp_error( $result ) ) {
	throw new RuntimeException( $result->get_error_message() );
}
echo hash( "sha256", rtrim( (string) get_post( $page->ID )->post_content ) );
'
~~~

Expected: 35e96c774123e65411f3ca77b57d491956902f16fd946754884e1cdb2adcbada.

- [ ] **Step 7: Establish the green content baseline**

~~~powershell
node scripts/verify-content-ownership.js
node scripts/verify-no-duplicate-pages.js
git status --short --branch
~~~

Expected: both verifiers exit 0. Git is clean because the repair changed only the local DB.

---

### Task 2: Make menu 237 recoverable and portable before editing it

**Files:**

- Create: scripts/lib/navigation-content-contract.test.js
- Create: scripts/lib/navigation-content-contract.js
- Create: scripts/export-navigation-snapshot.js
- Create: content/nav-snapshots/nav-237.html

**Interfaces:**

- Consumes: scripts/lib/wp-cli.js runWpEval() and WordPress post 237.
- Produces: NAVIGATION_POST_ID = 237, NAVIGATION_SNAPSHOT_PATH, normalizeNavigationContent(value, homeUrl), EXPECTED_COUNCIL_SHAPE, and a repeatable exporter.

- [ ] **Step 1: Write the failing normalization test**

Create scripts/lib/navigation-content-contract.test.js:

~~~js
#!/usr/bin/env node

const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const {
	NAVIGATION_POST_ID,
	EXPECTED_COUNCIL_SHAPE,
	normalizeNavigationContent,
} = require( './navigation-content-contract' );

test( 'navigation contract is pinned to post 237', () => {
	assert.equal( NAVIGATION_POST_ID, 237 );
	assert.deepEqual(
		EXPECTED_COUNCIL_SHAPE.map( ( item ) => item.key ),
		[ 'work', 'writing', 'about', 'search', 'subscribe' ]
	);
} );

test( 'normalization removes only the selected home origin', () => {
	const source = [
		'<!-- wp:navigation-link {"label":"Work","url":"http://localhost:8882/work/"} /-->',
		'<!-- wp:navigation-link {"label":"GitHub","url":"https://github.com/henryperkins"} /-->',
	].join( "\r\n" );
	assert.equal(
		normalizeNavigationContent( source, 'http://localhost:8882' ),
		[
			'<!-- wp:navigation-link {"label":"Work","url":"/work/"} /-->',
			'<!-- wp:navigation-link {"label":"GitHub","url":"https://github.com/henryperkins"} /-->',
		].join( "\n" )
	);
} );
~~~

- [ ] **Step 2: Run the unit test and confirm the red state**

Run:

~~~powershell
node --test scripts/lib/navigation-content-contract.test.js
~~~

Expected: FAIL because navigation-content-contract.js does not exist.

- [ ] **Step 3: Implement the shared navigation contract**

Create scripts/lib/navigation-content-contract.js:

~~~js
#!/usr/bin/env node

const path = require( 'node:path' );

const THEME_PATH = path.resolve( __dirname, '..', '..' );
const NAVIGATION_POST_ID = 237;
const NAVIGATION_SNAPSHOT_PATH = path.join(
	THEME_PATH,
	'content',
	'nav-snapshots',
	'nav-237.html'
);

const EXPECTED_COUNCIL_SHAPE = [
	{ key: 'work', blockName: 'core/navigation-link', label: 'Work', url: '/work/', className: 'hp-nav-work' },
	{ key: 'writing', blockName: 'core/navigation-submenu', label: 'Writing', className: 'hp-nav-writing' },
	{ key: 'about', blockName: 'core/navigation-link', label: 'About', url: '/about/' },
	{ key: 'search', blockName: 'core/search', className: 'hp-drawer-search' },
	{ key: 'subscribe', blockName: 'core/navigation-link', label: 'Subscribe', url: '/contact/#subscribe', className: 'hp-nav-subscribe' },
];

function normalizeNavigationContent( value, homeUrl ) {
	const normalized = String( value ).replace( /\r\n/g, '\n' ).trimEnd();
	const origin = new URL( homeUrl ).origin;
	return normalized.split( origin ).join( '' );
}

module.exports = {
	THEME_PATH,
	NAVIGATION_POST_ID,
	NAVIGATION_SNAPSHOT_PATH,
	EXPECTED_COUNCIL_SHAPE,
	normalizeNavigationContent,
};
~~~

- [ ] **Step 4: Run the unit test and confirm green**

Run:

~~~powershell
node --test scripts/lib/navigation-content-contract.test.js
~~~

Expected: 2 tests pass.

- [ ] **Step 5: Implement the repeatable snapshot exporter**

Create scripts/export-navigation-snapshot.js with this control flow:

~~~js
#!/usr/bin/env node

const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { runWpEval } = require( './lib/wp-cli' );
const {
	NAVIGATION_POST_ID,
	NAVIGATION_SNAPSHOT_PATH,
	normalizeNavigationContent,
} = require( './lib/navigation-content-contract' );

function getNavigationState() {
	return JSON.parse(
		runWpEval(
			'$post = get_post( ' + NAVIGATION_POST_ID + ' );' +
			'echo wp_json_encode( array(' +
				'"id" => $post ? (int) $post->ID : 0,' +
				'"type" => $post ? $post->post_type : null,' +
				'"status" => $post ? $post->post_status : null,' +
				'"content" => $post ? (string) $post->post_content : "",' +
				'"home" => home_url(),' +
			') );'
		)
	);
}

function main() {
	const state = getNavigationState();
	if ( state.id !== NAVIGATION_POST_ID || state.type !== 'wp_navigation' ) {
		throw new Error( 'Expected wp_navigation post 237.' );
	}
	fs.mkdirSync( path.dirname( NAVIGATION_SNAPSHOT_PATH ), { recursive: true } );
	const canonical = normalizeNavigationContent( state.content, state.home );
	fs.writeFileSync( NAVIGATION_SNAPSHOT_PATH, canonical + '\n', 'utf8' );
	console.log(
		'wrote ' + path.relative( process.cwd(), NAVIGATION_SNAPSHOT_PATH ) +
		' (' + state.id + ', ' + state.status + ')'
	);
}

try {
	main();
} catch ( error ) {
	console.error( error.message );
	process.exit( 1 );
}
~~~

- [ ] **Step 6: Export and inspect the pre-change snapshot**

~~~powershell
node scripts/export-navigation-snapshot.js
Get-Content content/nav-snapshots/nav-237.html
~~~

Expected: the portable snapshot contains Work, Essays, About, Contact, and hp-nav-subscribe with root-relative internal URLs. Its canonical SHA-256 is 29d2a38e38999cf3992b533133c30f03867804b2bc4e70de3a658f502a18242b.

- [ ] **Step 7: Commit the recovery point before any recut**

~~~powershell
git add scripts/lib/navigation-content-contract.js scripts/lib/navigation-content-contract.test.js scripts/export-navigation-snapshot.js content/nav-snapshots/nav-237.html
git commit -m "chore: track navigation 237 snapshot"
~~~

Expected: one commit containing the exporter, contract, tests, and old menu snapshot.

---

### Task 3: Build the theme-owned renderer and selected visual system

**Files:**

- Create: inc/council-header.php
- Create: scripts/verify-header.js
- Modify: functions.php
- Modify: parts/header.html
- Modify: parts/footer.html
- Modify: style.css
- Modify: theme.json
- Modify: scripts/verify-typography.js

**Interfaces:**

- Consumes: menu 237 block data, WordPress URL/site APIs, and current Work index facts.
- Produces: hperkins_tokens_get_council_navigation_model(): array, hperkins_tokens_get_council_work_items(): array, hperkins_tokens_render_council_header(): string, and the [hperkins_council_header] shortcode.

- [ ] **Step 1: Create a failing header source contract**

Create scripts/verify-header.js initially with source-only assertions:

~~~js
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
~~~

- [ ] **Step 2: Run the source verifier and confirm the red state**

~~~powershell
node scripts/verify-header.js --source-only
~~~

Expected: FAIL on the missing shortcode or renderer file.

- [ ] **Step 3: Add the renderer include and shortcode marker**

At functions.php:29 add:

~~~php
require_once get_stylesheet_directory() . '/inc/council-header.php';
~~~

In parts/header.html, preserve the outer hp-site-header group and replace its current inner contents with:

~~~html
<!-- wp:shortcode -->
[hperkins_council_header]
<!-- /wp:shortcode -->
~~~

Do not move sticky positioning from the template-part wrapper.

- [ ] **Step 4: Implement the exact current Work evidence model**

In inc/council-header.php define:

~~~php
function hperkins_tokens_get_council_work_items() {
	return array(
		array(
			'label'  => 'Flavor Agent',
			'url'    => '/work/flavor-agent/',
			'status' => 'Release candidate · v0.1.0-rc.1',
			'state'  => 'review',
		),
		array(
			'label'  => 'WordPress AI Stack Contributions',
			'url'    => '/work/upstream-core-ai-stack/',
			'status' => 'Merged · upstream',
			'state'  => 'done',
		),
		array(
			'label'  => 'AI Provider for Codex',
			'url'    => '/work/ai-provider-for-codex/',
			'status' => 'Shipped · v2.1',
			'state'  => 'done',
		),
		array(
			'label'  => 'DJ Lee & Voices of Judah',
			'url'    => '/work/dj-lee-voices-of-judah/',
			'status' => 'Delivered · live site',
			'state'  => 'done',
		),
	);
}
~~~

The verifier must assert these four labels, URLs, statuses, and state classes so future prototype staleness cannot overwrite current product truth.

- [ ] **Step 5: Implement the menu adapter with a safe reachable fallback**

In inc/council-header.php:

1. Read post 237 and require post_type wp_navigation.
2. Parse post_content with parse_blocks().
3. Locate items by explicit classes hp-nav-work, hp-nav-writing, hp-nav-ai, hp-nav-essays, hp-nav-digest, hp-drawer-search, and hp-nav-subscribe.
4. Normalize internal destinations with home_url() only at render time.
5. If the DB is missing or malformed, return this fallback model rather than a blank header:

~~~php
function hperkins_tokens_get_council_navigation_fallback() {
	return array(
		'work' => array( 'label' => 'Work', 'url' => '/work/' ),
		'writing' => array(
			'label' => 'Writing',
			'children' => array(
				array( 'key' => 'ai', 'label' => 'AI Enablement', 'url' => '/ai-enablement/' ),
				array( 'key' => 'essays', 'label' => 'Essays', 'url' => '/essays/' ),
				array( 'key' => 'digest', 'label' => 'Job Placement Digest', 'url' => '/job-placement-digest/' ),
			),
		),
		'about' => array( 'label' => 'About', 'url' => '/about/' ),
		'search' => array( 'label' => 'Search', 'placeholder' => 'Search the journal' ),
		'subscribe' => array( 'label' => 'Subscribe', 'url' => '/contact/#subscribe' ),
	);
}
~~~

Use esc_url(), esc_attr(), esc_html(), home_url(), and get_bloginfo( 'name' ) at output boundaries. The fallback is resilience only; verify-content-ownership.js still fails a malformed live menu.

- [ ] **Step 6: Render one semantic DOM contract**

hperkins_tokens_render_council_header() must output:

- a root with data-hp-header-root and .hp-council-header;
- a 68/62px .hp-council-header__bar;
- one home link wrapping the existing Council star SVG and site name;
- desktop Work and Writing button disclosures with aria-controls and aria-expanded=false, each inside its matching data-hp-header-hover wrapper;
- an aria-hidden sibling .hp-council-digest-cue after Writing, so the button's accessible name remains Writing;
- a Work panel containing the four evidence rows, Featured evidence, an Open the case study link to /work/flavor-agent/, and a View all work link to /work/;
- a Writing panel containing AI Enablement, Essays, and the full Job Placement Digest chip;
- a 44px search trigger containing a 38px visible disc, plus a real GET form with action home_url( '/' ), input name s, and an esc kbd;
- a 116px by 42px desktop Subscribe link;
- a 44px drawer trigger containing the selected 38px close/hamburger control;
- a flat drawer in this exact order: Work, Essays, AI Enablement, About, Job Placement Digest, Search form, Subscribe;
- a noscript fallback nav containing Work, Essays, AI Enablement, About, Job Placement Digest, Contact, and Subscribe.

Use the exact controller hooks:

~~~html
<button type="button" data-hp-header-trigger="work" aria-controls="hp-council-work-panel" aria-expanded="false">...</button>
<div id="hp-council-work-panel" data-hp-header-panel="work" hidden>...</div>

<button type="button" data-hp-header-trigger="writing" aria-controls="hp-council-writing-panel" aria-expanded="false">...</button>
<div id="hp-council-writing-panel" data-hp-header-panel="writing" hidden>...</div>

<button type="button" data-hp-header-trigger="search" aria-controls="hp-council-search-panel" aria-expanded="false">...</button>
<div id="hp-council-search-panel" data-hp-header-panel="search" hidden>...</div>

<button type="button" data-hp-header-trigger="drawer" aria-controls="hp-council-drawer" aria-expanded="false">...</button>
<div id="hp-council-drawer" data-hp-header-panel="drawer" hidden>...</div>
~~~

Do not add menu roles to ordinary site-navigation links; disclosure semantics plus lists and nav landmarks are sufficient and avoid an incomplete ARIA menubar implementation.

- [ ] **Step 7: Add the selected accessible palette token**

Insert before gold-700 in theme.json:

~~~json
{
  "slug": "gold-800",
  "color": "#6E531B",
  "name": "Gold 800"
},
~~~

Add in style.css :root:

~~~css
--hp-header-h: 68px;
--hp-header-h-compact: 62px;
--hp-header-pad: 24px;
--hp-nav-gap: 28px;
--hp-nav-label: var(--wp--preset--font-size--sm);
--hp-nav-rule-w: 26px;
--hp-gold-800: var(--wp--preset--color--gold-800);
~~~

- [ ] **Step 8: Replace the old header CSS with the selected desktop composition**

Keep .hp-site-header position: relative and header.wp-block-template-part sticky. Replace the current flex-centering, core-navigation drawer, inline-search, and duplicate Subscribe rules with a Council section whose essential declarations are:

~~~css
@media (min-width: 782px) {
	.hp-council-header__bar {
		box-sizing: border-box;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		align-items: center;
		gap: 0;
		min-height: var(--hp-header-h);
		padding-inline: var(--hp-header-pad);
	}

	.hp-council-brand {
		justify-self: start;
	}

	.hp-council-nav {
		justify-self: center;
	}

	.hp-council-actions {
		justify-self: end;
	}
}

.hp-council-brand {
	display: inline-flex;
	align-items: center;
	gap: 11px;
	min-width: 0;
	white-space: nowrap;
	text-decoration: none;
}

.hp-council-brand__star {
	inline-size: 22px;
	block-size: 22px;
	color: var(--wp--preset--color--green-700);
}

.hp-council-brand__name {
	font-family: var(--wp--preset--font-family--label);
	font-size: 18px;
	line-height: 1.1;
	letter-spacing: 0.17em;
	text-transform: uppercase;
	color: var(--wp--custom--text--strong);
}

.hp-council-nav__list {
	display: flex;
	align-items: center;
	gap: var(--hp-nav-gap);
	margin: 0;
	padding: 0;
	list-style: none;
}

.hp-council-nav__trigger,
.hp-council-nav__link {
	box-sizing: border-box;
	display: inline-flex;
	align-items: center;
	min-block-size: 40px;
	padding: 0;
	font-family: var(--wp--preset--font-family--label);
	font-size: var(--hp-nav-label);
	font-weight: var(--wp--custom--weight--regular);
	line-height: 1.2;
	letter-spacing: 0.065em;
	text-transform: uppercase;
	color: var(--wp--custom--text--body);
	background: transparent;
	border: 0;
	text-decoration: none;
}

.hp-council-nav__item.is-current .hp-council-nav__label::after,
.hp-council-nav__trigger:hover .hp-council-nav__label::after,
.hp-council-nav__link:hover .hp-council-nav__label::after {
	position: absolute;
	inset-inline-start: 50%;
	inset-block-end: -3px;
	inline-size: var(--hp-nav-rule-w);
	block-size: 1.5px;
	content: "";
	background: var(--wp--preset--color--gold-700);
	transform: translateX(-50%);
}

.hp-council-digest-cue {
	display: inline-flex;
	align-items: center;
	margin-inline-start: 2px;
	padding: 3px 5px;
	font-family: var(--wp--preset--font-family--mono);
	font-size: 8px;
	line-height: 1;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: var(--hp-gold-800);
	background: var(--wp--preset--color--gold-200);
	border-radius: var(--wp--custom--radius--xs);
	transform: translateY(-1px);
}
~~~

The Work panel is 592px wide with a 320px minimum ledger, a 224px evidence column, 8px radius, hairline border, parchment-50 surface, and shadow-lg. The Writing panel is 262px wide with 7px padding and 43px rows. Both sit top: calc(100% + 12px), animate from translateY(-6px), and remain within the viewport at 782px.

- [ ] **Step 9: Implement anchored search and action geometry**

Use:

~~~css
.hp-council-actions {
	position: relative;
	display: flex;
	align-items: center;
	gap: 8px;
}

.hp-council-search-trigger {
	display: grid;
	place-items: center;
	inline-size: var(--hp-touch-min);
	block-size: var(--hp-touch-min);
	padding: 0;
	color: var(--wp--preset--color--green-700);
	background: transparent;
	border: 0;
	border-radius: 50%;
}

.hp-council-search-trigger__disc {
	display: grid;
	place-items: center;
	inline-size: 38px;
	block-size: 38px;
	border-radius: 50%;
}

.hp-council-search-trigger:hover .hp-council-search-trigger__disc {
	background: var(--wp--preset--color--green-100);
}

.hp-council-subscribe {
	display: grid;
	place-items: center;
	inline-size: 116px;
	block-size: 42px;
	font-family: var(--wp--preset--font-family--label);
	font-size: var(--wp--preset--font-size--2-xs);
	letter-spacing: 0.1em;
	text-transform: uppercase;
	color: var(--wp--preset--color--parchment-50);
	background: var(--wp--preset--color--green-700);
	border-radius: var(--wp--custom--radius--md);
	box-shadow: var(--wp--custom--shadow--xs);
}

.hp-council-search-panel {
	position: absolute;
	z-index: 35;
	inset-block-start: calc(100% + 12px);
	inset-inline-end: 0;
	box-sizing: border-box;
	inline-size: min(278px, calc(100vw - 32px));
	padding: 10px;
	background: var(--wp--preset--color--parchment-50);
	border: 1px solid var(--wp--preset--color--gold-500);
	border-radius: var(--wp--custom--radius--md);
	box-shadow: var(--wp--custom--shadow--lg);
}
~~~

Remove the input outline: none rule. The real input must inherit the global 3px gold focus ring.

- [ ] **Step 10: Implement the selected mobile drawer without core accordion leftovers**

At max-width 781px:

- .hp-council-header__bar is 62px, flex, 16px horizontal padding.
- Brand star is 20px; name is 13px at 0.09em.
- Desktop nav, search action, and filled Subscribe are hidden.
- The drawer toggle is a 44px target around a 38px bordered control.
- .hp-council-drawer anchors top: 100%, spans left/right 0, and uses max-height: calc(100svh - var(--hp-header-h-compact)).
- The drawer body uses padding: 20px 18px and has a Sections legend.
- Link rows are 50px minimum; Digest is 52px; search is 46px; Subscribe is 48px and outlined.
- The root mobile list is explicitly display: flex; flex-direction: column; no core CSS is relied upon.
- No display: contents, nested submenu accordion, second brand row, or full-width search row beneath the closed bar remains.
- Reduced motion removes the translate/fade animation.

- [ ] **Step 11: Add Contact to the existing footer colophon**

In parts/footer.html, place this labelled route before Privacy:

~~~html
<span aria-hidden="true">&middot;</span> <a href="/contact/">Contact</a>
~~~

- [ ] **Step 12: Extend typography overflow coverage without shrinking the nav**

In scripts/verify-typography.js, set:

~~~js
const OVERFLOW_VIEWPORTS = [
	{ width: 320, height: 900 },
	{ width: 768, height: 1000 },
	{ width: 782, height: 1000 },
	{ width: 960, height: 1000 },
	{ width: 1024, height: 1000 },
	{ width: 1280, height: 1000 },
];
~~~

Keep the existing static requirement that the header navigation uses var(--wp--preset--font-size--sm). Update its selector/message from the retired core Navigation selector to .hp-council-nav.

- [ ] **Step 13: Verify source and PHP syntax**

~~~powershell
node scripts/verify-header.js --source-only
node scripts/verify-typography.js --source-only
Get-ChildItem -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }
~~~

Expected: both source verifiers exit 0 and every PHP file reports no syntax errors.

- [ ] **Step 14: Commit the server-rendered visual shell**

~~~powershell
git add inc/council-header.php parts/header.html parts/footer.html functions.php style.css theme.json scripts/verify-header.js scripts/verify-typography.js
git commit -m "feat: build condensed Council header shell"
~~~

Expected: one source-only commit; the live menu is still unchanged and recoverable from the prior commit.

---

### Task 4: Restore the newer content baseline and recut menu 237 through guarded migrations

**Files:**

- Create: scripts/apply-council-navigation.js
- Modify: scripts/lib/navigation-content-contract.js
- Modify: scripts/lib/navigation-content-contract.test.js
- Modify: scripts/verify-content-ownership.js
- Modify: content/nav-snapshots/nav-237.html
- Read: content/page-snapshots/job-placement-digest.html
- Live mutation: page 9 (`job-placement-digest`) restored to the tracked 0.3.49 source contract
- Live mutation: wp_navigation post 237

**Interfaces:**

- Consumes: the canonical pre-change navigation SHA-256 29d2a38e..., the guarded page-9 before/after hashes, and runWpEval().
- Produces: the restored 0.3.49 Digest body, the approved navigation data tree, idempotent apply behavior, exact shape verification, and a post-change navigation snapshot.

- [ ] **Step 1: Add failing menu ownership checks**

Extend verify-content-ownership.js so its WP-CLI state includes:

- post 237 ID/type/status/content/home;
- parse_blocks() output simplified to blockName, label, relative URL, className, and children;
- snapshot parity after normalizeNavigationContent().

Assert this exact top-level shape:

~~~text
work      core/navigation-link     Work       /work/                  hp-nav-work
writing   core/navigation-submenu  Writing                             hp-nav-writing
about     core/navigation-link     About      /about/
search    core/search                                                  hp-drawer-search
subscribe core/navigation-link     Subscribe  /contact/#subscribe     hp-nav-subscribe
~~~

Assert Writing children in this exact order:

~~~text
AI Enablement          /ai-enablement/          hp-nav-ai
Essays                 /essays/                 hp-nav-essays
Job Placement Digest   /job-placement-digest/   hp-nav-digest
~~~

- [ ] **Step 2: Run ownership verification and confirm the old menu fails**

~~~powershell
node scripts/verify-content-ownership.js
~~~

Expected: exit 1 because the old snapshot/tree still contains top-level Essays and Contact and lacks Writing, Search, and the required classes.

- [ ] **Step 3: Write the guarded migration**

Create scripts/apply-council-navigation.js. Set EXPECTED_BEFORE_SHA256 to:

~~~text
29d2a38e38999cf3992b533133c30f03867804b2bc4e70de3a658f502a18242b
~~~

Set NEW_CONTENT to these blocks joined with no blank text between top-level blocks:

~~~html
<!-- wp:navigation-link {"label":"Work","url":"/work/","kind":"custom","isTopLevelLink":true,"className":"hp-nav-work"} /-->
<!-- wp:navigation-submenu {"label":"Writing","kind":"custom","isTopLevelItem":true,"className":"hp-nav-writing"} -->
<!-- wp:navigation-link {"label":"AI Enablement","url":"/ai-enablement/","kind":"custom","className":"hp-nav-ai"} /-->
<!-- wp:navigation-link {"label":"Essays","url":"/essays/","kind":"custom","className":"hp-nav-essays"} /-->
<!-- wp:navigation-link {"label":"Job Placement Digest","url":"/job-placement-digest/","kind":"custom","className":"hp-nav-digest"} /-->
<!-- /wp:navigation-submenu -->
<!-- wp:navigation-link {"label":"About","url":"/about/","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:search {"label":"Search","showLabel":false,"placeholder":"Search the journal","buttonText":"Search","buttonPosition":"button-inside","buttonUseIcon":true,"className":"hp-drawer-search"} /-->
<!-- wp:navigation-link {"label":"Subscribe","url":"/contact/#subscribe","kind":"custom","isTopLevelLink":true,"className":"hp-nav-subscribe"} /-->
~~~

The script must:

1. fetch post 237 and home_url() with runWpEval();
2. canonicalize the live content before hashing;
3. exit 0 with navigation 237 already current when the live canonical content equals NEW_CONTENT;
4. refuse any hash other than EXPECTED_BEFORE_SHA256;
5. update with wp_update_post( wp_slash( ... ), true );
6. re-read and compare exact canonical content before reporting success.

- [ ] **Step 4: Unit-check the migration source before touching the DB**

Add assertions to navigation-content-contract.test.js that NEW_CONTENT, exported from apply-council-navigation.js, contains the exact top-level/child classes and no top-level Contact item. Export constants without auto-running main when require.main !== module.

Run:

~~~powershell
node --test scripts/lib/navigation-content-contract.test.js
~~~

Expected: all navigation tests pass.

- [ ] **Step 5: Back up the SQLite database immediately before either live-content mutation**

Create a timestamped `hperkins-before-council-nav-*.sqlite` path under `$env:TEMP`. Use PHP's `SQLite3::backup()` to copy `$wpRoot/wp-content/database/.ht.sqlite` online into that path. Reopen the backup read-only and require:

- `PRAGMA integrity_check` returns `ok`;
- `wp_posts` and `wp_options` exist;
- page 9 exists as the published `page` with slug `job-placement-digest`;
- the backup's canonical page-9 content hashes to `66594f4d59a55a7f424b378bb36113cb4cbe20356ab1298e1749290d61228fba`;
- post 237 exists as a published `wp_navigation` record;
- the backup's canonical post-237 content still hashes to `29d2a38e38999cf3992b533133c30f03867804b2bc4e70de3a658f502a18242b`.

Expected: a second verified SQLite backup retained outside the repository. Record its absolute path, byte size, file SHA-256, integrity result, page-9 content hash, and post-237 content hash separately from the baseline backup. Do not mutate either record if any check fails.

- [ ] **Step 6: Restore page 9 to the tracked 0.3.49 content contract**

Use a guarded WP-CLI eval script. It must:

1. resolve `job-placement-digest` and require post ID 9, type `page`, and status `publish`;
2. canonicalize the live body and refuse anything except before SHA-256 `66594f4d59a55a7f424b378bb36113cb4cbe20356ab1298e1749290d61228fba` or already-current SHA-256 `464642392ab98e977814f20522840d038606063ad416ea89dd6111c49b7e86b6`;
3. read `content/page-snapshots/job-placement-digest.html` from the active stylesheet directory and require its canonical SHA-256 to be `464642392ab98e977814f20522840d038606063ad416ea89dd6111c49b7e86b6`;
4. update only `post_content` via `wp_update_post( wp_slash( ... ), true )`;
5. re-read page 9 and require exact canonical parity with the tracked snapshot;
6. exit 0 without writing when page 9 is already current.

Expected: page 9 is restored to the newer 0.3.49 source snapshot without altering its ID, slug, type, status, title, or any other record. This is a local-runtime repair for the independently landed release, not a Council-header content change.

- [ ] **Step 7: Apply the new tree to the local site**

~~~powershell
node scripts/apply-council-navigation.js
~~~

Expected: updated navigation 237 followed by the new canonical SHA-256. A second run prints navigation 237 already current and exits 0.

- [ ] **Step 8: Refresh the tracked snapshot and prove exact parity**

~~~powershell
node scripts/export-navigation-snapshot.js
node scripts/verify-content-ownership.js
git diff -- content/nav-snapshots/nav-237.html
~~~

Expected: ownership verification passes for both the restored Digest page and navigation 237; the only tracked content diff replaces the old flat navigation snapshot with the approved data tree.

- [ ] **Step 9: Commit migration, verifier, and post-change snapshot**

~~~powershell
git add scripts/apply-council-navigation.js scripts/lib/navigation-content-contract.js scripts/lib/navigation-content-contract.test.js scripts/verify-content-ownership.js content/nav-snapshots/nav-237.html
git commit -m "feat: recut Council navigation data"
~~~

Expected: one commit. The two SQLite backups remain outside Git.

---

### Task 5: Replace competing listeners with one accessible header controller

**Files:**

- Create: assets/js/header-controller.js
- Modify: functions.php
- Modify: scripts/verify-header.js
- Modify: style.css
- Delete: assets/js/header-search.js
- Delete: assets/js/nav-close-delight.js

**Interfaces:**

- Consumes: data-hp-header-root, data-hp-header-trigger, and data-hp-header-panel.
- Produces: a single state in closed|work|writing|search|drawer and router-safe cleanup.

- [ ] **Step 1: Expand the rendered verifier before writing the controller**

Add these viewports to scripts/verify-header.js:

~~~js
const VIEWPORTS = [
	{ name: 'desktop-1440', width: 1440, height: 1000 },
	{ name: 'desktop-1280', width: 1280, height: 900 },
	{ name: 'desktop-1024', width: 1024, height: 900 },
	{ name: 'desktop-960', width: 960, height: 900 },
	{ name: 'desktop-edge', width: 782, height: 900 },
	{ name: 'mobile-edge', width: 781, height: 900 },
	{ name: 'mobile-390', width: 390, height: 844 },
	{ name: 'mobile-320', width: 320, height: 800 },
];
~~~

Use the existing dependency-free CDP client pattern from verify-prominent-actions.js. For every width assert no horizontal overflow. At desktop widths assert:

- the bar measures 68px, not 84px;
- nav center differs from viewport center by no more than 1px;
- visible nav labels compute to 15px;
- search target is at least 44px and its visible disc is 38px;
- Subscribe is 116px by 42px;
- opening Work does not move the nav center;
- Work panel is 592px where the viewport permits and contains four current evidence rows;
- Writing panel is 262px and contains the three expected destinations;
- search panel is 278px, right-anchored, and contains a focused search input;
- only one panel is unhidden at a time.

At mobile widths assert:

- the bar measures 62px;
- desktop nav/actions are hidden and the drawer trigger is at least 44px;
- the row labels are exactly Work, Essays, AI Enablement, About, Job Placement Digest, Search the journal, Subscribe;
- link rows are at least 50px, search is 46px, Subscribe is 48px;
- Digest computes to at least 12px in the real mobile link;
- no panel exceeds the viewport.

Interaction assertions:

- Enter/Space native button activation opens each surface.
- ArrowDown on Work/Writing opens and focuses the first link.
- Escape closes and restores focus to the originating trigger.
- outside click closes.
- opening Work, Writing, search, or drawer closes the previous surface.
- an internal drawer link begins the close without preventing navigation.
- pushState, replaceState, and popstate settle the state to closed.
- reduced-motion emulation yields no meaningful transform animation.
- focus-visible outlines are at least 3px and not none.
- Writing's accessible name is Writing, with no Digest token included.

- [ ] **Step 2: Run the live verifier and confirm the controller gap**

~~~powershell
node scripts/verify-header.js
~~~

Expected: exit 1 on interaction or missing header-controller.js checks. Static geometry may already pass.

- [ ] **Step 3: Implement the single state transition**

Create assets/js/header-controller.js around this contract:

~~~js
( function () {
	'use strict';

	var ROOT = '[data-hp-header-root]';
	var TRIGGER = '[data-hp-header-trigger]';
	var PANEL = '[data-hp-header-panel]';
	var STATES = [ 'closed', 'work', 'writing', 'search', 'drawer' ];
	var state = 'closed';
	var origin = null;
	var hoverTimer = 0;

	function root() {
		return document.querySelector( ROOT );
	}

	function triggerFor( next ) {
		var node = root();
		return node
			? node.querySelector( '[data-hp-header-trigger="' + next + '"]' )
			: null;
	}

	function panelFor( next ) {
		var node = root();
		return node
			? node.querySelector( '[data-hp-header-panel="' + next + '"]' )
			: null;
	}

	function applyState( next, options ) {
		var node = root();
		if ( ! node || STATES.indexOf( next ) === -1 ) {
			return;
		}
		var restore = options && options.restoreFocus;
		var triggers = node.querySelectorAll( TRIGGER );
		var panels = node.querySelectorAll( PANEL );
		for ( var i = 0; i < triggers.length; i++ ) {
			var key = triggers[ i ].getAttribute( 'data-hp-header-trigger' );
			triggers[ i ].setAttribute( 'aria-expanded', key === next ? 'true' : 'false' );
		}
		for ( var j = 0; j < panels.length; j++ ) {
			var panelKey = panels[ j ].getAttribute( 'data-hp-header-panel' );
			panels[ j ].hidden = panelKey !== next;
		}
		node.setAttribute( 'data-hp-header-state', next );
		state = next;
		if ( next === 'closed' && restore && origin && document.contains( origin ) ) {
			origin.focus();
		}
		if ( next === 'closed' ) {
			origin = null;
		}
	}

	function toggle( next, trigger ) {
		origin = trigger;
		applyState( state === next ? 'closed' : next );
		if ( next === 'search' && state === 'search' ) {
			var input = panelFor( 'search' ).querySelector( 'input[type="search"]' );
			if ( input ) {
				input.focus();
			}
		}
	}
~~~

Do not close the IIFE yet. Step 4 appends the event layer and closes it. Every
state change must go through applyState(); no handler may toggle hidden or
aria-expanded directly.

- [ ] **Step 4: Add the exact event layer and close the IIFE**

Append this before the final closure:

~~~js
	function reducedMotion() {
		return !! (
			window.matchMedia &&
			window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches
		);
	}

	function desktopPointer() {
		return !! (
			window.matchMedia &&
			window.matchMedia( '(min-width: 782px) and (hover: hover) and (pointer: fine)' ).matches
		);
	}

	function settle() {
		applyState( 'closed' );
		if ( window.requestAnimationFrame ) {
			window.requestAnimationFrame( function () {
				applyState( 'closed' );
			} );
		}
		window.setTimeout( function () {
			applyState( 'closed' );
		}, 60 );
	}

	function wrapHistory( method ) {
		var original = window.history[ method ];
		if ( typeof original !== 'function' || original.__hpCouncilHeader ) {
			return;
		}
		var wrapped = function () {
			var result = original.apply( this, arguments );
			settle();
			return result;
		};
		wrapped.__hpCouncilHeader = true;
		try {
			window.history[ method ] = wrapped;
		} catch ( error ) {
			// popstate and header-link click remain functional in read-only hosts.
		}
	}

	document.addEventListener( 'click', function ( event ) {
		var node = root();
		if ( ! node || ! event.target || ! event.target.closest ) {
			return;
		}

		var trigger = event.target.closest( TRIGGER );
		if ( trigger && node.contains( trigger ) ) {
			toggle( trigger.getAttribute( 'data-hp-header-trigger' ), trigger );
			return;
		}

		var drawerLink = event.target.closest(
			'[data-hp-header-panel="drawer"] a[href]'
		);
		if ( drawerLink && node.contains( drawerLink ) ) {
			if ( ! reducedMotion() ) {
				node.classList.add( 'is-hp-closing' );
				drawerLink.classList.add( 'is-hp-chosen' );
			}
			window.setTimeout( function () {
				applyState( 'closed' );
				node.classList.remove( 'is-hp-closing' );
				drawerLink.classList.remove( 'is-hp-chosen' );
			}, reducedMotion() ? 0 : 140 );
			return;
		}

		if ( state !== 'closed' && ! node.contains( event.target ) ) {
			applyState( 'closed' );
		}
	} );

	document.addEventListener( 'keydown', function ( event ) {
		if ( event.key === 'Escape' || event.key === 'Esc' ) {
			if ( state !== 'closed' ) {
				event.preventDefault();
				applyState( 'closed', { restoreFocus: true } );
			}
			return;
		}

		if ( event.key !== 'ArrowDown' || ! event.target.closest ) {
			return;
		}
		var trigger = event.target.closest( TRIGGER );
		if ( ! trigger ) {
			return;
		}
		var next = trigger.getAttribute( 'data-hp-header-trigger' );
		if ( next !== 'work' && next !== 'writing' ) {
			return;
		}
		event.preventDefault();
		origin = trigger;
		applyState( next );
		var first = panelFor( next ).querySelector( 'a[href]' );
		if ( first ) {
			first.focus();
		}
	} );

	document.addEventListener( 'pointerover', function ( event ) {
		if ( ! desktopPointer() || ! event.target.closest ) {
			return;
		}
		var group = event.target.closest( '[data-hp-header-hover]' );
		if ( ! group || ( event.relatedTarget && group.contains( event.relatedTarget ) ) ) {
			return;
		}
		window.clearTimeout( hoverTimer );
		var next = group.getAttribute( 'data-hp-header-hover' );
		origin = triggerFor( next );
		applyState( next );
	} );

	document.addEventListener( 'pointerout', function ( event ) {
		if ( ! desktopPointer() || ! event.target.closest ) {
			return;
		}
		var group = event.target.closest( '[data-hp-header-hover]' );
		if ( ! group || ( event.relatedTarget && group.contains( event.relatedTarget ) ) ) {
			return;
		}
		var next = group.getAttribute( 'data-hp-header-hover' );
		hoverTimer = window.setTimeout( function () {
			if ( state === next ) {
				applyState( 'closed' );
			}
		}, 120 );
	} );

	var boundary = window.matchMedia
		? window.matchMedia( '(min-width: 782px)' )
		: null;
	if ( boundary ) {
		if ( boundary.addEventListener ) {
			boundary.addEventListener( 'change', settle );
		} else if ( boundary.addListener ) {
			boundary.addListener( settle );
		}
	}

	wrapHistory( 'pushState' );
	wrapHistory( 'replaceState' );
	window.addEventListener( 'popstate', settle );
	window.addEventListener( 'pageshow', settle );
	applyState( 'closed' );
}() );
~~~

The Work and Writing wrappers emitted in Task 3 must carry
data-hp-header-hover="work" and data-hp-header-hover="writing" respectively,
with each panel inside its wrapper so crossing the 12px gap does not count as
leaving the disclosure.

- [ ] **Step 5: Replace the two old enqueues with one filemtime-versioned enqueue**

In functions.php remove the header-search and nav-close-delight enqueue blocks. Add:

~~~php
$header_controller_rel  = '/assets/js/header-controller.js';
$header_controller_file = get_stylesheet_directory() . $header_controller_rel;
if ( file_exists( $header_controller_file ) ) {
	wp_enqueue_script(
		'hperkins-header-controller',
		get_stylesheet_directory_uri() . $header_controller_rel,
		array(),
		filemtime( $header_controller_file ),
		array(
			'in_footer' => true,
			'strategy'  => 'defer',
		)
	);
}
~~~

Delete assets/js/header-search.js and assets/js/nav-close-delight.js only after the new controller covers their Escape, outside-click, phantom-focus avoidance, route-commit close, and reduced-motion behavior.

- [ ] **Step 6: Run the full header verifier**

~~~powershell
node scripts/verify-header.js
~~~

Expected: eight viewport summaries, interaction checks for Work/Writing/search/drawer, a temporary screenshot directory, and exit 0.

- [ ] **Step 7: Compare implementation screenshots to the selected source**

Open the verifier's desktop Work-open, desktop Writing-open, desktop search-open, mobile 390 open, and mobile 320 open PNGs beside:

~~~text
header-rework-desktop-mobile/project/design_handoff_council_masthead_header/approved-2a-condensed-council.png
~~~

Confirm the 68px calm bar, centred nav, 26px rule, cue scale, panel radii/shadows, evidence-column tint, 62px mobile bar, drawer padding, row rhythm, search field, and outlined mobile Subscribe. The intentional row/content differences are only the current Work data and reachable mobile IA recorded above.

- [ ] **Step 8: Commit controller parity**

~~~powershell
git add functions.php style.css scripts/verify-header.js assets/js/header-controller.js
git add -u assets/js/header-search.js assets/js/nav-close-delight.js
git commit -m "feat: coordinate Council header interactions"
~~~

Expected: one controller commit with both superseded scripts removed.

---

### Task 6: Lock documentation, release 0.3.50, and verify the whole theme

**Files:**

- Modify: scripts/verify-content-ownership-docs.js
- Modify: CLAUDE.md
- Modify: docs/design-system/INDEX.md
- Modify: readme.txt
- Modify: style.css:9

**Interfaces:**

- Consumes: the renderer, navigation contract, controller, snapshots, and verifier from Tasks 2-5.
- Produces: guarded repository guidance and complete release evidence for 0.3.50.

- [ ] **Step 1: Add failing documentation requirements**

Require these strings in scripts/verify-content-ownership-docs.js:

~~~text
readme.txt:
  content/nav-snapshots/nav-237.html
  scripts/export-navigation-snapshot.js
  scripts/apply-council-navigation.js
  header-controller.js
  verify-header.js

CLAUDE.md:
  [hperkins_council_header]
  inc/council-header.php
  content/nav-snapshots/nav-237.html
  closed|work|writing|search|drawer
  verify-header.js

docs/design-system/INDEX.md:
  Condensed Council
  Work evidence panel
  gold-800
  hp-drawer-search
  header-controller.js
~~~

- [ ] **Step 2: Run the docs verifier and confirm red**

~~~powershell
node scripts/verify-content-ownership-docs.js
~~~

Expected: exit 1 on missing Council header guidance.

- [ ] **Step 3: Update CLAUDE.md with the production contract**

Document:

- menu 237 is the renderer's DB data source, not directly rendered core Navigation markup;
- the exact IA/classes and mobile reachability exception;
- the tracked snapshot, exporter, and guarded apply command;
- inc/council-header.php owns server markup and current Work evidence data;
- header-controller.js owns the single state closed|work|writing|search|drawer and router cleanup;
- sticky remains on header.wp-block-template-part;
- verify-header.js owns source, geometry, behavior, focus, reduced-motion, and screenshot checks;
- filemtime cache busting now covers header-controller.js;
- Header rework.dc.html is a design reference only and its DC/DS files are not production dependencies.

Correct the dead .design-pull navigation-backup pointer to content/nav-snapshots/nav-237.html.

- [ ] **Step 4: Supersede the stale search guidance in the design-system index**

Revise the June 2026 passage that says never to re-add search to menu 237. Record:

- hp-drawer-search is menu data consumed into the inline mobile drawer form;
- desktop search remains theme-owned and anchored, so it never displaces the centred nav;
- gold-800 #6E531B is a theme-side accessible text delta for the gold-200 Digest cue;
- the Work panel is a desktop theme composition of the Work evidence system, while mobile Work remains a plain route;
- the selected design's visual constants and the intentional live-data/mobile-IA corrections.

- [ ] **Step 5: Bump the release and changelog together**

Set style.css Version and readme.txt Stable tag to 0.3.50. Add a changelog entry naming:

- the selected Condensed Council header;
- desktop Work/Writing disclosures and anchored search;
- flat reachable mobile drawer;
- tracked/verified menu 237;
- the single router-safe controller;
- eight-width accessibility and interaction verification.

- [ ] **Step 6: Run the docs verifier to green**

~~~powershell
node scripts/verify-content-ownership-docs.js
~~~

Expected: verified content-ownership docs contract and exit 0.

- [ ] **Step 7: Run all unit and source checks**

~~~powershell
node --test scripts/lib/navigation-content-contract.test.js scripts/lib/wp-cli.test.js scripts/lib/site-url.test.js
node scripts/verify-header.js --source-only
node scripts/verify-typography.js --source-only
node scripts/verify-prominent-actions.js --source-only
Get-ChildItem -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }
~~~

Expected: all tests pass, all source verifiers exit 0, and every PHP file has no syntax errors.

- [ ] **Step 8: Run the complete fourteen-verifier stack against the matching local site**

Run every command independently and require exit 0:

~~~powershell
node scripts/verify-ring-cards-mobile.js
node scripts/verify-contact-form-styling.js
node scripts/verify-homepage-hero-polish.js
node scripts/verify-prominent-actions.js
node scripts/verify-header.js
node scripts/verify-journal-polish.js
node scripts/verify-content-ownership.js
node scripts/verify-no-duplicate-pages.js
node scripts/verify-content-ownership-docs.js
node scripts/verify-performance-assets.js
node scripts/verify-typography.js
node scripts/verify-style-token-usage.js
node scripts/verify-design-system-specimen.js
node scripts/verify-subscribe-endpoint.js
~~~

Expected: fourteen exit-0 results. The subscribe verifier restores its mutable state; the header verifier reports eight widths and screenshots; content ownership reports page and navigation parity.

- [ ] **Step 9: Complete manual browser and assistive-technology checks**

On the local site verify:

- Chromium, Firefox, and Safari preserve the 781/782 boundary, frost, panel placement, and no overflow.
- Logged-in admin-bar mode does not offset the sticky header or drawer incorrectly.
- 200% zoom and 320px keep every route and close control reachable.
- Keyboard-only order is brand, Work, Writing, About, search, Subscribe on desktop and brand, drawer trigger, drawer rows on mobile.
- NVDA plus Chromium announces Writing, not Writing Digest, and announces each disclosure's expanded/collapsed state coherently.
- With JavaScript disabled, the noscript navigation preserves every primary destination and search.
- With prefers-reduced-motion enabled, menus and drawer appear without visible translation.

- [ ] **Step 10: Verify release state and workspace scope**

~~~powershell
& php $wpPhar --path=$wpRoot eval 'echo wp_get_theme()->get( "Version" );'
git diff --check
git status --short --branch
~~~

Expected: 0.3.50, no whitespace errors, and only the intended documentation/release files pending.

- [ ] **Step 11: Commit documentation and release metadata**

~~~powershell
git add CLAUDE.md docs/design-system/INDEX.md scripts/verify-content-ownership-docs.js readme.txt style.css
git commit -m "docs: release Council header 0.3.50"
~~~

- [ ] **Step 12: Re-run completion gates against committed HEAD**

~~~powershell
node --test scripts/lib/navigation-content-contract.test.js scripts/lib/wp-cli.test.js scripts/lib/site-url.test.js
node scripts/verify-header.js
node scripts/verify-content-ownership.js
node scripts/verify-content-ownership-docs.js
node scripts/verify-performance-assets.js
node scripts/verify-typography.js
git diff HEAD^ HEAD --check
git status --short --branch
~~~

Expected: every command exits 0 and the branch has no unstaged feature files.

Record both SQL backup paths, post 237's final hash, page 10's restored hash, all fourteen verifier results, the header screenshot directory, and the cross-browser/screen-reader observations in the final handoff. Do not call the redesign complete or live if DB parity, rendered interactions, or manual route reachability were skipped.

---

## Spec and Handoff Coverage Check

- Selected 68px 1fr/auto/1fr desktop shell: Task 3.
- Selected 15px nav, 28px gap, and 26px rule: Task 3.
- Selected full Work evidence panel with current data: Tasks 3 and 5.
- Selected Writing panel and Digest signal: Tasks 3 and 5.
- Selected 278px non-displacing search: Tasks 3 and 5.
- Selected 116px by 42px desktop Subscribe: Tasks 3 and 5.
- Selected 62px mobile bar, flat drawer, search, and outlined Subscribe: Tasks 3 and 5.
- Mobile route reachability correction: renderer contract and live verifier.
- Contact route preservation: Task 3.
- Menu 237 backup, refresh, exact shape, and safe recut: Tasks 2 and 4.
- Single state controller, Escape, ArrowDown, outside click, focus restoration, mutual exclusion, router cleanup, and reduced motion: Task 5.
- 320/781/782/960/1024/1280/1440 coverage and screenshots: Tasks 3 and 5.
- Admin bar, cross-browser, zoom, keyboard, and screen-reader checks: Task 6.
- Documentation reversal and gold-800 delta: Task 6.
- Release 0.3.50 and full-suite verification: Task 6.

## Execution Handoff

The plan is intentionally split at reviewable recovery, renderer, DB migration, interaction, and release boundaries. Execute Task 1 first; do not combine the pre-change navigation snapshot commit with the menu recut.
