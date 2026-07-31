# Stylesheet Coverage and Responsive Imagery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop shipping component CSS to pages that cannot render it, and give the two `<picture>` patterns responsive candidates sized from the layout rules.

**Architecture:** A shared Node library classifies every rule in `style.css` by whether its classes are reachable from a given page. That classification drives a one-time extraction of 223 rules into three component bundles, and it backs a permanent verifier so the split cannot silently regress. At runtime a new `inc/component-styles.php` resolves the request's real content — post body, template file, and the patterns that template names — and enqueues only the bundles whose class prefixes actually appear, failing open to all bundles when resolution is impossible.

**Tech Stack:** WordPress block child theme (parent: Assembler), PHP 8.2+, Node 22 with `node --test`, PHP GD for WebP generation. No new dependencies — the repository is deliberately dependency-free.

## Global Constraints

- Repository root: `C:\Users\htper\hperkins-tokens`. The Studio site at `C:\Users\htper\Studio\henry-perkins\wp-content\themes\hperkins-tokens` is a symlink to it; edit either path, they are the same files.
- **Pushing to `main` deploys this theme.** Work on a branch.
- No new runtime or build dependencies. Verifiers are plain `node`, no packages.
- All WP-CLI goes through `studio wp`, never bare `wp`.
- Theme version advances `0.3.56` → `0.3.57` in `style.css` `Version:` **and** `readme.txt` `Stable tag:`, with a matching `= 0.3.57 =` changelog entry. `scripts/verify-performance-assets.js` and the CI "Release version agreement" step both enforce this.
- Preserve rendered appearance at every viewport and device pixel ratio. This change is byte-for-byte invisible to a reader.
- Root font size is unmodified at 16px; `theme.json` `wideSize` is `72rem`, `contentSize` is `44rem`.
- Bundle class lists are **prefixes**, matched with `startsWith`, because live classes carry BEM suffixes (`hp-callout--warn`, `hp-evidence-row__item`).
- Every new verifier assertion must fail before the change that satisfies it lands.

---

## File Structure

**Create:**
- `scripts/lib/style-coverage.js` — rule parsing, class extraction, bundle mapping. Pure functions, no I/O.
- `scripts/lib/style-coverage.test.js` — `node --test` unit tests for the above.
- `inc/component-styles.php` — runtime content resolution and conditional enqueue.
- `assets/c/evidence.css`, `assets/c/interactive.css`, `assets/c/longform.css` — extracted bundles.
- `assets/img/wapuu-color-448.webp`
- `assets/img/imagery/rivendell-{second,third,fourth}-age-768.webp`

**Modify:**
- `style.css` — 223 rules removed; `Version:` bumped.
- `functions.php` — require the new module.
- `patterns/wapuu-home-hero.php` — `srcset`/`sizes` on the WebP source.
- `patterns/imladris-ring-card.php` — `srcset`/`sizes` on three WebP sources.
- `scripts/verify-performance-assets.js` — six new assertions.
- `readme.txt` — stable tag and changelog.
- `.github/workflows/verify.yml` — register the new unit test file.

---

### Task 0: Branch and baseline

Visual parity is the acceptance criterion for the whole plan, so the "before" evidence has to exist before anything changes.

**Files:** none modified.

**Interfaces:**
- Produces: branch `perf/component-styles-and-responsive-imagery`; baseline captures under `/c/Users/htper/AppData/Local/Temp/claude/baseline/`.

- [ ] **Step 1: Branch**

```bash
cd /c/Users/htper/hperkins-tokens
git checkout -b perf/component-styles-and-responsive-imagery
```

- [ ] **Step 2: Start the site and record its URL**

```bash
cd /c/Users/htper/Studio/henry-perkins
studio start --skip-browser
studio status
```

Record the URL — every later step's `curl` uses it. The port is assigned dynamically; never hardcode it.

- [ ] **Step 3: Capture the baseline**

For the front page and one page per bundle — `/`, `/work/`, `/about/`, `/ai-enablement/`, and the contact page — capture both a full-page screenshot at a 412-pixel-wide mobile viewport and at desktop width, into `/c/Users/htper/AppData/Local/Temp/claude/baseline/`. The `take_screenshot` tool from the Studio MCP server does both viewports in one call.

- [ ] **Step 4: Record the baseline transfer size**

```bash
cd /c/Users/htper/hperkins-tokens
node -e "
const {readFileSync}=require('fs');
const gz=s=>require('zlib').gzipSync(Buffer.from(s),{level:9}).length;
console.log('style.css gzip baseline:', (gz(readFileSync('style.css','utf8'))/1024).toFixed(1), 'KiB');
"
```

Expected: `26.2 KiB`. If it differs, the working tree is not at `0.3.56` and every byte figure in this plan needs re-deriving before continuing.

---

### Task 1: Style coverage library

The classification logic both the extraction and the permanent verifier depend on. Pure functions so it is unit-testable without a site.

**Files:**
- Create: `scripts/lib/style-coverage.js`
- Test: `scripts/lib/style-coverage.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `BUNDLES` — `{ evidence: string[], interactive: string[], longform: string[] }` of class prefixes.
  - `parseRules( css )` → `Array<{ prelude, body, start, end, atContext }>`, `start`/`end` being offsets into the original `css` string with comments intact.
  - `selectorClasses( prelude )` → `string[]` of distinct class names.
  - `normalizeSelectors( prelude )` → `string[]` of comma-split, whitespace-collapsed selectors.
  - `bundleFor( className )` → `'evidence' | 'interactive' | 'longform' | null`.
  - `classesInMarkup( sources )` → `Set<string>`, `sources` being an array of markup strings.

- [ ] **Step 1: Write the failing test**

Create `scripts/lib/style-coverage.test.js`:

```js
const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const {
	BUNDLES,
	parseRules,
	selectorClasses,
	normalizeSelectors,
	bundleFor,
	classesInMarkup,
} = require( './style-coverage' );

test( 'parseRules returns top-level rules with original offsets', () => {
	const css = '.a { color: red; }\n.b { color: blue; }';
	const rules = parseRules( css );
	assert.equal( rules.length, 2 );
	assert.equal( rules[ 0 ].prelude, '.a' );
	assert.equal( css.slice( rules[ 1 ].start, rules[ 1 ].end ), '.b { color: blue; }' );
} );

test( 'parseRules descends into @media and records the context', () => {
	const css = '@media (max-width: 781px) { .a { color: red; } }';
	const rules = parseRules( css );
	assert.equal( rules.length, 1 );
	assert.equal( rules[ 0 ].prelude, '.a' );
	assert.equal( rules[ 0 ].atContext, '@media (max-width: 781px)' );
} );

test( 'parseRules ignores braces inside comments', () => {
	const css = '/* .fake { } */\n.real { color: red; }';
	const rules = parseRules( css );
	assert.equal( rules.length, 1 );
	assert.equal( rules[ 0 ].prelude, '.real' );
} );

test( 'parseRules keeps at-rules without selectors out of the rule list', () => {
	const css = '@font-face { font-family: X; }\n.a { color: red; }';
	const rules = parseRules( css ).filter( ( r ) => ! r.prelude.startsWith( '@' ) );
	assert.equal( rules.length, 1 );
} );

test( 'selectorClasses extracts class names and skips pseudo-elements', () => {
	assert.deepEqual( selectorClasses( '.hp-card:hover .hp-card__title::before' ), [
		'hp-card',
		'hp-card__title',
	] );
	assert.deepEqual( selectorClasses( 'a[href]' ), [] );
} );

test( 'normalizeSelectors splits on commas and collapses whitespace', () => {
	assert.deepEqual( normalizeSelectors( '.a  .b,\n\t.c' ), [ '.a .b', '.c' ] );
} );

test( 'bundleFor matches on prefix so BEM suffixes resolve', () => {
	assert.equal( bundleFor( 'hp-callout' ), 'interactive' );
	assert.equal( bundleFor( 'hp-callout--warn' ), 'interactive' );
	assert.equal( bundleFor( 'hp-evidence-row__item' ), 'evidence' );
	assert.equal( bundleFor( 'hp-work-template' ), 'longform' );
	assert.equal( bundleFor( 'hp-wapuu-hero' ), null );
} );

test( 'every bundle prefix is unique across bundles', () => {
	const seen = new Map();
	for ( const [ name, prefixes ] of Object.entries( BUNDLES ) ) {
		for ( const prefix of prefixes ) {
			assert.equal( seen.has( prefix ), false, `${ prefix } is in two bundles` );
			seen.set( prefix, name );
		}
	}
} );

test( 'classesInMarkup reads class attributes and block JSON attributes', () => {
	const found = classesInMarkup( [
		'<div class="a b"></div>',
		'<!-- wp:group {"className":"c d"} -->',
	] );
	assert.deepEqual( [ ...found ].sort(), [ 'a', 'b', 'c', 'd' ] );
} );
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
cd /c/Users/htper/hperkins-tokens
node --test scripts/lib/style-coverage.test.js
```

Expected: FAIL — `Cannot find module './style-coverage'`.

- [ ] **Step 3: Write the implementation**

Create `scripts/lib/style-coverage.js`:

```js
'use strict';

/**
 * Class-name prefixes owned by each conditionally loaded bundle.
 * Matching is prefix-based because live classes carry BEM suffixes.
 * A prefix must never appear in more than one bundle; the unit test pins that.
 */
const BUNDLES = {
	evidence: [
		'hp-operational-story',
		'hp-evidence-row',
		'hp-evidence-board',
		'hp-product-hero',
		'hp-artifact',
		'hp-signal',
		'hp-shot',
		'hp-quote',
		'hp-spoke-nav',
		'hp-case-study-template',
		'hp-lead',
	],
	interactive: [
		'hp-disclosure',
		'hp-subscribe',
		'hp-input',
		'hp-icon-button',
		'hp-content-search',
		'hp-callout',
		'hp-badge',
		'hp-tag',
		'hp-avatar',
	],
	longform: [
		'wp-block-table',
		'hp-reader-hero',
		'hp-archive-hero',
		'hp-skill-group',
		'hp-work-template',
	],
};

/**
 * Split CSS into rules, descending through @media/@supports/@layer/@container
 * so nested rules are returned flat with their at-rule context attached.
 * Offsets index the ORIGINAL string, comments included, so callers can excise
 * a rule from the source file without reformatting the rest of it.
 */
function parseRules( css ) {
	const rules = [];
	let i = 0;

	function skipComment() {
		if ( ! css.startsWith( '/*', i ) ) {
			return false;
		}
		const close = css.indexOf( '*/', i + 2 );
		i = close === -1 ? css.length : close + 2;
		return true;
	}

	function walk( end, atContext ) {
		while ( i < end ) {
			if ( skipComment() ) {
				continue;
			}
			const start = i;
			while ( i < end && css[ i ] !== '{' && css[ i ] !== '}' ) {
				if ( skipComment() ) {
					continue;
				}
				i++;
			}
			if ( i >= end ) {
				return;
			}
			if ( css[ i ] === '}' ) {
				i++;
				return;
			}

			const prelude = css
				.slice( start, i )
				.replace( /\/\*[\s\S]*?\*\//g, '' )
				.trim();

			const open = i + 1;
			let depth = 1;
			let j = open;
			while ( j < end && depth > 0 ) {
				if ( css.startsWith( '/*', j ) ) {
					const close = css.indexOf( '*/', j + 2 );
					j = close === -1 ? end : close + 2;
					continue;
				}
				if ( css[ j ] === '{' ) {
					depth++;
				} else if ( css[ j ] === '}' ) {
					depth--;
				}
				j++;
			}

			if ( /^@(media|supports|layer|container)/i.test( prelude ) ) {
				i = open;
				walk( j - 1, prelude );
				i = j;
			} else {
				rules.push( {
					prelude,
					body: css.slice( open, j - 1 ),
					start,
					end: j,
					atContext: atContext || null,
				} );
				i = j;
			}
		}
	}

	walk( css.length, null );
	return rules;
}

/** Distinct class names in a selector. Pseudo-elements and attributes are not classes. */
function selectorClasses( prelude ) {
	return [ ...new Set( [ ...prelude.matchAll( /\.([a-zA-Z][\w-]*)/g ) ].map( ( m ) => m[ 1 ] ) ) ];
}

/** Comma-split selector list with runs of whitespace collapsed to one space. */
function normalizeSelectors( prelude ) {
	return prelude
		.split( ',' )
		.map( ( s ) => s.replace( /\s+/g, ' ' ).trim() )
		.filter( Boolean );
}

/** The bundle owning a class name, or null when the class stays in style.css. */
function bundleFor( className ) {
	for ( const [ name, prefixes ] of Object.entries( BUNDLES ) ) {
		if ( prefixes.some( ( prefix ) => className.startsWith( prefix ) ) ) {
			return name;
		}
	}
	return null;
}

/** Every class named by an HTML class attribute or a block comment's className. */
function classesInMarkup( sources ) {
	const found = new Set();
	for ( const source of sources ) {
		if ( ! source ) {
			continue;
		}
		for ( const m of source.matchAll( /class(?:Name)?=["']([^"']+)["']/g ) ) {
			m[ 1 ].split( /\s+/ ).forEach( ( c ) => c && found.add( c ) );
		}
		for ( const m of source.matchAll( /"className":"([^"]+)"/g ) ) {
			m[ 1 ].split( /\s+/ ).forEach( ( c ) => c && found.add( c ) );
		}
	}
	return found;
}

module.exports = {
	BUNDLES,
	parseRules,
	selectorClasses,
	normalizeSelectors,
	bundleFor,
	classesInMarkup,
};
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
node --test scripts/lib/style-coverage.test.js
```

Expected: PASS, 8 tests.

- [ ] **Step 5: Register the test in CI**

In `.github/workflows/verify.yml`, inside the `Script library unit tests` step, add `scripts/lib/style-coverage.test.js` to the `node --test` file list. Keep the list alphabetical — insert it after `scripts/lib/site-url.test.js`.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/style-coverage.js scripts/lib/style-coverage.test.js .github/workflows/verify.yml
git commit -m "Add style coverage library for bundle extraction"
```

---

### Task 2: Extract the bundles

The mechanical split. Driven by a throwaway script so it is deterministic and reproducible, but only its output is committed — afterwards all four sheets are hand-authored again.

**Files:**
- Create: `assets/c/evidence.css`, `assets/c/interactive.css`, `assets/c/longform.css`
- Modify: `style.css`

**Interfaces:**
- Consumes: `parseRules`, `selectorClasses`, `bundleFor`, `normalizeSelectors` from Task 1.
- Produces: three bundle files, and a `style.css` with those rules removed.

- [ ] **Step 1: Write the extraction script to a scratch path**

Write to `/c/Users/htper/AppData/Local/Temp/claude/extract-bundles.js` — **not** into the repository:

```js
const { readFileSync, writeFileSync, mkdirSync } = require( 'node:fs' );
const { join } = require( 'node:path' );
const {
	parseRules,
	selectorClasses,
	bundleFor,
	normalizeSelectors,
} = require( '/c/Users/htper/hperkins-tokens/scripts/lib/style-coverage' );

const THEME = '/c/Users/htper/hperkins-tokens';
const css = readFileSync( join( THEME, 'style.css' ), 'utf8' );
const rules = parseRules( css );

const buckets = { evidence: [], interactive: [], longform: [] };
const spans = [];

for ( const rule of rules ) {
	if ( rule.prelude.startsWith( '@' ) ) continue;
	const classes = selectorClasses( rule.prelude );
	if ( ! classes.length ) continue;

	const targets = [ ...new Set( classes.map( bundleFor ) ) ];
	// A rule leaves style.css only when EVERY class it names belongs to the
	// same single bundle. Mixed rules stay put; splitting them would change
	// what the retained sheet styles.
	if ( targets.length !== 1 || targets[ 0 ] === null ) continue;

	buckets[ targets[ 0 ] ].push( rule );
	spans.push( [ rule.start, rule.end ] );
}

// Collision guard: a selector must not survive in both places.
const extractedSelectors = new Map();
for ( const [ name, list ] of Object.entries( buckets ) ) {
	for ( const rule of list ) {
		for ( const sel of normalizeSelectors( rule.prelude ) ) {
			extractedSelectors.set( sel, name );
		}
	}
}
const retainedRules = rules.filter( ( r ) => ! spans.some( ( [ s ] ) => s === r.start ) );
const collisions = [];
for ( const rule of retainedRules ) {
	for ( const sel of normalizeSelectors( rule.prelude ) ) {
		if ( extractedSelectors.has( sel ) ) {
			collisions.push( `${ sel }  (retained + ${ extractedSelectors.get( sel ) })` );
		}
	}
}

console.log( 'rules extracted:', spans.length );
for ( const [ name, list ] of Object.entries( buckets ) ) {
	console.log( `  ${ name }: ${ list.length } rules` );
}
if ( collisions.length ) {
	console.log( '\nCASCADE COLLISIONS — resolve by hand before extracting:' );
	[ ...new Set( collisions ) ].forEach( ( c ) => console.log( '  ' + c ) );
	process.exit( 1 );
}

// Emit bundles, preserving each rule's at-rule context and original order.
mkdirSync( join( THEME, 'assets/c' ), { recursive: true } );
for ( const [ name, list ] of Object.entries( buckets ) ) {
	const byContext = new Map();
	for ( const rule of list ) {
		const key = rule.atContext || '';
		if ( ! byContext.has( key ) ) byContext.set( key, [] );
		byContext.get( key ).push( `${ rule.prelude } {${ rule.body }}` );
	}
	const parts = [
		`/**\n * ${ name } bundle — extracted from style.css.\n * Loaded by inc/component-styles.php only when the rendered content uses it.\n * Rule order matches the original sheet; do not reorder.\n */\n`,
	];
	for ( const [ context, blocks ] of byContext ) {
		parts.push( context ? `${ context } {\n${ blocks.join( '\n\n' ) }\n}` : blocks.join( '\n\n' ) );
	}
	writeFileSync( join( THEME, `assets/c/${ name }.css` ), parts.join( '\n\n' ) + '\n' );
}

// Excise from style.css, last span first so earlier offsets stay valid.
let retained = css;
for ( const [ s, e ] of spans.slice().sort( ( a, b ) => b[ 0 ] - a[ 0 ] ) ) {
	retained = retained.slice( 0, s ) + retained.slice( e );
}
writeFileSync( join( THEME, 'style.css' ), retained.replace( /\n{3,}/g, '\n\n' ) );
console.log( '\nwrote 3 bundles and rewrote style.css' );
```

- [ ] **Step 2: Run it and resolve any collisions it reports**

```bash
cd /c/Users/htper/hperkins-tokens
node /c/Users/htper/AppData/Local/Temp/claude/extract-bundles.js
```

If it exits 1 with a collision list, each named selector has rules in both the retained sheet and a bundle. Because bundles load after `style.css`, the bundle copy would now win where the retained copy used to. For each collision, merge the two rule bodies into the bundle copy in original order, delete the retained copy, and re-run. Do not proceed while collisions remain.

Expected on success: roughly 223 rules extracted across the three bundles.

- [ ] **Step 3: Confirm the extraction is byte-honest**

```bash
node -e "
const {readFileSync}=require('fs');
const gz=s=>require('zlib').gzipSync(Buffer.from(s),{level:9}).length;
const s=readFileSync('style.css','utf8');
console.log('style.css gzip:', (gz(s)/1024).toFixed(1), 'KiB');
"
```

Expected: **17.9 KiB**, down from 26.2 KiB. A materially different number means the bundle prefix lists in Task 1 do not match what was extracted — stop and reconcile before continuing.

- [ ] **Step 4: Confirm no rule was lost or duplicated**

```bash
node -e "
const {readFileSync}=require('fs');
const {parseRules}=require('./scripts/lib/style-coverage');
const n=p=>parseRules(readFileSync(p,'utf8')).length;
const total=n('style.css')+n('assets/c/evidence.css')+n('assets/c/interactive.css')+n('assets/c/longform.css');
console.log('rules now:', total, '(was 572)');
"
```

Expected: 572. The at-rule wrappers the emitter regenerates can shift this by a few; anything more than a handful means rules were dropped.

- [ ] **Step 5: Commit**

```bash
git add style.css assets/c/
git commit -m "Extract component bundles from style.css"
```

---

### Task 3: Runtime bundle resolution

Resolves what will actually render, then enqueues only the bundles that content needs. Fails open.

**Files:**
- Create: `inc/component-styles.php`
- Modify: `functions.php:32` (add the require)

**Interfaces:**
- Consumes: `assets/c/{evidence,interactive,longform}.css` from Task 2; the existing `hperkins-tokens` style handle registered in `functions.php`.
- Produces: `hperkins_tokens_component_bundles()` → `string[]` of bundle names to load; style handles `hperkins-c-evidence`, `hperkins-c-interactive`, `hperkins-c-longform`.

- [ ] **Step 1: Write the module**

Create `inc/component-styles.php`:

```php
<?php
/**
 * Conditional component stylesheets.
 *
 * style.css carries only what every route needs. Component CSS lives in
 * assets/c/*.css and loads when the content actually being rendered uses it.
 *
 * The gate is content, not page identity: these components come from patterns
 * an editor inserts into post content, so an is_page() allowlist would leave
 * them unstyled the first time someone used one somewhere new.
 *
 * @package hperkins-tokens
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class-name prefixes owned by each bundle.
 * Must stay in sync with BUNDLES in scripts/lib/style-coverage.js;
 * scripts/verify-performance-assets.js fails the build if they diverge.
 */
function hperkins_tokens_bundle_map() {
	return array(
		'evidence'    => array(
			'hp-operational-story',
			'hp-evidence-row',
			'hp-evidence-board',
			'hp-product-hero',
			'hp-artifact',
			'hp-signal',
			'hp-shot',
			'hp-quote',
			'hp-spoke-nav',
			'hp-case-study-template',
			'hp-lead',
		),
		'interactive' => array(
			'hp-disclosure',
			'hp-subscribe',
			'hp-input',
			'hp-icon-button',
			'hp-content-search',
			'hp-callout',
			'hp-badge',
			'hp-tag',
			'hp-avatar',
		),
		'longform'    => array(
			'wp-block-table',
			'hp-reader-hero',
			'hp-archive-hero',
			'hp-skill-group',
			'hp-work-template',
		),
	);
}

/**
 * Template slug for the current request, matching a file under templates/.
 *
 * @return string|null Slug, or null when the request cannot be classified.
 */
function hperkins_tokens_current_template_slug() {
	if ( is_front_page() ) {
		return 'front-page';
	}
	if ( is_home() ) {
		return 'home';
	}
	if ( is_404() ) {
		return '404';
	}
	if ( is_search() ) {
		return 'search';
	}
	if ( is_singular() ) {
		$assigned = get_page_template_slug();
		if ( $assigned ) {
			return preg_replace( '/\.html$/', '', $assigned );
		}
		return is_page() ? 'page' : 'single';
	}
	if ( is_archive() ) {
		return 'archive';
	}

	return null;
}

/**
 * Markup that will render for this request: post body, template file, and the
 * patterns that template names, expanded one level.
 *
 * @return string|null Concatenated markup, or null when it cannot be resolved.
 */
function hperkins_tokens_render_haystack() {
	$parts = array();

	$queried = get_queried_object();
	if ( $queried instanceof WP_Post ) {
		$parts[] = (string) $queried->post_content;
	}

	$slug = hperkins_tokens_current_template_slug();
	if ( null === $slug ) {
		return null;
	}

	$template = get_stylesheet_directory() . '/templates/' . $slug . '.html';
	if ( ! file_exists( $template ) ) {
		// A route the theme serves from the parent or from core. Cannot resolve
		// its markup here, so the caller falls open.
		return null;
	}

	$template_markup = (string) file_get_contents( $template );
	$parts[]         = $template_markup;

	// Expand <!-- wp:pattern {"slug":"hperkins-tokens/x"} /--> one level.
	if ( preg_match_all( '/wp:pattern\s*\{"slug":"hperkins-tokens\/([\w-]+)"/', $template_markup, $matches ) ) {
		foreach ( array_unique( $matches[1] ) as $pattern_slug ) {
			$pattern_file = get_stylesheet_directory() . '/patterns/' . $pattern_slug . '.php';
			if ( file_exists( $pattern_file ) ) {
				$parts[] = (string) file_get_contents( $pattern_file );
			}
		}
	}

	// Template parts are shared by every route, so their components must live in
	// style.css. Including them here would defeat the split; they are omitted
	// deliberately and verify-performance-assets.js pins that they use no
	// bundle-owned class.

	return implode( "\n", $parts );
}

/**
 * Bundles this request needs. Every bundle when content cannot be resolved.
 *
 * @return string[] Bundle names.
 */
function hperkins_tokens_component_bundles() {
	$map      = hperkins_tokens_bundle_map();
	$haystack = hperkins_tokens_render_haystack();

	if ( null === $haystack ) {
		return array_keys( $map );
	}

	$needed = array();
	foreach ( $map as $bundle => $prefixes ) {
		foreach ( $prefixes as $prefix ) {
			if ( false !== strpos( $haystack, $prefix ) ) {
				$needed[] = $bundle;
				break;
			}
		}
	}

	return $needed;
}

/**
 * Enqueue the resolved bundles after the main sheet so the cascade holds.
 */
function hperkins_tokens_enqueue_component_styles() {
	foreach ( hperkins_tokens_component_bundles() as $bundle ) {
		$relative = '/assets/c/' . $bundle . '.css';
		$file     = get_stylesheet_directory() . $relative;
		if ( ! file_exists( $file ) ) {
			continue;
		}
		wp_enqueue_style(
			'hperkins-c-' . $bundle,
			get_stylesheet_directory_uri() . $relative,
			array( 'hperkins-tokens' ),
			filemtime( $file )
		);
	}
}
// Priority 20 so the 'hperkins-tokens' dependency is registered first.
add_action( 'wp_enqueue_scripts', 'hperkins_tokens_enqueue_component_styles', 20 );

/**
 * The editor has no single resolvable route, so it gets every bundle.
 */
function hperkins_tokens_component_editor_styles() {
	foreach ( array_keys( hperkins_tokens_bundle_map() ) as $bundle ) {
		$relative = '/assets/c/' . $bundle . '.css';
		if ( file_exists( get_stylesheet_directory() . $relative ) ) {
			add_editor_style( get_stylesheet_directory_uri() . $relative );
		}
	}
}
add_action( 'after_setup_theme', 'hperkins_tokens_component_editor_styles', 20 );
```

- [ ] **Step 2: Wire it in**

In `functions.php`, after line 32 (`require_once … about-gravatar-heading.php`), add:

```php
require_once get_stylesheet_directory() . '/inc/component-styles.php';
```

- [ ] **Step 3: Lint**

```bash
php -l inc/component-styles.php && php -l functions.php
```

Expected: `No syntax errors detected` for both.

- [ ] **Step 4: Verify resolution against the running site**

```bash
cd /c/Users/htper/Studio/henry-perkins
studio start --skip-browser
studio status
```

Then confirm the front page pulls no bundle and a component page pulls the right one:

```bash
curl -s "$(studio status | grep -oE 'https?://[^ ]+' | head -1)/" | grep -c 'assets/c/'
```

Expected: `0` on the front page.

```bash
curl -s "$(studio status | grep -oE 'https?://[^ ]+' | head -1)/work/" | grep -o 'assets/c/[a-z]*\.css'
```

Expected: at least `assets/c/longform.css`.

- [ ] **Step 5: Commit**

```bash
git add inc/component-styles.php functions.php
git commit -m "Resolve component stylesheets from rendered content"
```

---

### Task 4: Verifier extensions

Six assertions so the split cannot regress, written before the images land so the image assertions fail first too.

**Files:**
- Modify: `scripts/verify-performance-assets.js`

**Interfaces:**
- Consumes: `BUNDLES`, `parseRules`, `selectorClasses`, `normalizeSelectors`, `classesInMarkup`, `bundleFor` from Task 1.
- Produces: nothing; a gate.

- [ ] **Step 1: Add the assertions**

Insert after the existing ring-card block, before the `functionsPhp` block, in `scripts/verify-performance-assets.js`:

```js
// --- Bundle split contracts ------------------------------------------------
const {
	BUNDLES,
	parseRules,
	selectorClasses,
	normalizeSelectors,
	classesInMarkup,
	bundleFor,
} = require( './lib/style-coverage' );

const bundleNames = Object.keys( BUNDLES );

// 1. PHP and JS bundle maps agree.
const componentPhp = readFileSync( join( themeRoot, 'inc/component-styles.php' ), 'utf8' );
for ( const [ name, prefixes ] of Object.entries( BUNDLES ) ) {
	assert(
		componentPhp.includes( `'${ name }'` ),
		`inc/component-styles.php is missing the "${ name }" bundle.`
	);
	for ( const prefix of prefixes ) {
		assert(
			componentPhp.includes( `'${ prefix }'` ),
			`inc/component-styles.php is missing the "${ prefix }" prefix from the ${ name } bundle.`
		);
	}
}

// 2. Every bundle file exists, and every file on disk is mapped.
for ( const name of bundleNames ) {
	assert(
		existsSync( join( themeRoot, `assets/c/${ name }.css` ) ),
		`assets/c/${ name }.css is missing.`
	);
}

// 3. No bundle-owned class is still styled by style.css.
for ( const rule of parseRules( styleCss ) ) {
	if ( rule.prelude.startsWith( '@' ) ) continue;
	const classes = selectorClasses( rule.prelude );
	if ( ! classes.length ) continue;
	const owned = [ ...new Set( classes.map( bundleFor ) ) ];
	assert(
		! ( owned.length === 1 && owned[ 0 ] !== null ),
		`style.css still styles bundle-owned classes in "${ rule.prelude }" (bundle: ${ owned[ 0 ] }).`
	);
}

// 4. No selector survives in both style.css and a bundle. Bundles load after
//    style.css, so a duplicated selector silently inverts which rule wins.
const retainedSelectors = new Set();
for ( const rule of parseRules( styleCss ) ) {
	normalizeSelectors( rule.prelude ).forEach( ( s ) => retainedSelectors.add( s ) );
}
for ( const name of bundleNames ) {
	const bundleCss = readFileSync( join( themeRoot, `assets/c/${ name }.css` ), 'utf8' );
	for ( const rule of parseRules( bundleCss ) ) {
		for ( const selector of normalizeSelectors( rule.prelude ) ) {
			assert(
				! retainedSelectors.has( selector ),
				`Selector "${ selector }" is in both style.css and assets/c/${ name }.css; the cascade order inverts.`
			);
		}
	}
}

// 5. The front page must resolve to zero bundles. Its template, the patterns it
//    names, the shared template parts, and its snapshot must use no bundle class.
const frontMarkup = [
	readFileSync( join( themeRoot, 'templates/front-page.html' ), 'utf8' ),
	readFileSync( join( themeRoot, 'parts/header.html' ), 'utf8' ),
	readFileSync( join( themeRoot, 'parts/footer.html' ), 'utf8' ),
	readFileSync( join( themeRoot, 'patterns/wapuu-home-hero.php' ), 'utf8' ),
	readFileSync( join( themeRoot, 'patterns/imladris-ring-card.php' ), 'utf8' ),
	frontPageSnapshot,
];
for ( const className of classesInMarkup( frontMarkup ) ) {
	const owner = bundleFor( className );
	assert(
		owner === null,
		`Front-page class "${ className }" belongs to the ${ owner } bundle, so the front page would load it.`
	);
}

// 6. Template parts are shared by every route, so nothing in them may be
//    bundle-owned — the resolver deliberately does not read them.
for ( const part of [ 'parts/header.html', 'parts/footer.html' ] ) {
	for ( const className of classesInMarkup( [ readFileSync( join( themeRoot, part ), 'utf8' ) ] ) ) {
		const owner = bundleFor( className );
		assert(
			owner === null,
			`${ part } uses "${ className }" from the ${ owner } bundle, but template parts render on every route.`
		);
	}
}
```

- [ ] **Step 2: Run it**

```bash
node scripts/verify-performance-assets.js
```

Expected: `verified performance asset contracts`. Any failure names the exact selector or class at fault — fix the split, not the assertion.

- [ ] **Step 3: Commit**

```bash
git add scripts/verify-performance-assets.js
git commit -m "Pin the component bundle split in the performance verifier"
```

---

### Task 5: Responsive image candidates

**Files:**
- Create: `assets/img/wapuu-color-448.webp`, `assets/img/imagery/rivendell-{second,third,fourth}-age-768.webp`
- Modify: `patterns/wapuu-home-hero.php`, `patterns/imladris-ring-card.php`, `scripts/verify-performance-assets.js`

**Interfaces:**
- Consumes: `hperkins_tokens_asset_url()` from `functions.php:41`.
- Produces: `$hperkins_wapuu_webp_448_url` in the hero pattern; a `webp768` key on each entry of `$hperkins_ring_assets` in the ring pattern.

- [ ] **Step 1: Add the failing verifier assertions first**

Append to `scripts/verify-performance-assets.js`, before the release-sync block:

```js
// --- Responsive candidates -------------------------------------------------
const responsiveVariants = {
	'assets/img/wapuu-color-448.webp': 30000,
	'assets/img/imagery/rivendell-second-age-768.webp': 90000,
	'assets/img/imagery/rivendell-third-age-768.webp': 90000,
	'assets/img/imagery/rivendell-fourth-age-768.webp': 90000,
};
for ( const [ relativePath, maxBytes ] of Object.entries( responsiveVariants ) ) {
	assertFileSmallerThan( relativePath, maxBytes );
}

assert(
	heroPattern.includes( 'wapuu-color-448.webp' ) &&
		/srcset="[^"]*448w[^"]*640w/.test( heroPattern ),
	'Wapuu hero WebP source needs a 448w/640w srcset.'
);
assert(
	heroPattern.includes( 'sizes="(max-width: 781px) 13rem, 27.5rem"' ),
	'Wapuu hero sizes must match .hp-wapuu-hero__figure (13rem mobile, 27.5rem desktop).'
);
assert(
	( ringPattern.match( /srcset="[^"]*768w[^"]*1100w/g ) || [] ).length >= 3,
	'All three ring-card WebP sources need a 768w/1100w srcset.'
);
assert(
	( ringPattern.match( /sizes="\(max-width: 920px\) 92vw, 23rem"/g ) || [] ).length >= 3,
	'Ring-card sizes must match .hp-ring-grid (single column under 920px, ~23rem per column above).'
);
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
node scripts/verify-performance-assets.js
```

Expected: FAIL — `assets/img/wapuu-color-448.webp is missing.`

- [ ] **Step 3: Generate the variants**

Write to `/c/Users/htper/AppData/Local/Temp/claude/make-variants.php` and run it from the theme root:

```php
<?php
$variants = array(
	array( 'assets/img/wapuu-color.png', 'assets/img/wapuu-color-448.webp', 448 ),
	array( 'assets/img/imagery/rivendell-second-age.png', 'assets/img/imagery/rivendell-second-age-768.webp', 768 ),
	array( 'assets/img/imagery/rivendell-third-age.png', 'assets/img/imagery/rivendell-third-age-768.webp', 768 ),
	array( 'assets/img/imagery/rivendell-fourth-age.png', 'assets/img/imagery/rivendell-fourth-age-768.webp', 768 ),
);

foreach ( $variants as list( $src_path, $out_path, $target_w ) ) {
	$src = imagecreatefrompng( $src_path );
	imagepalettetotruecolor( $src );

	$sw = imagesx( $src );
	$sh = imagesy( $src );
	$th = (int) round( $sh * $target_w / $sw );

	$dst = imagecreatetruecolor( $target_w, $th );
	imagealphablending( $dst, false );
	imagesavealpha( $dst, true );
	imagefill( $dst, 0, 0, imagecolorallocatealpha( $dst, 0, 0, 0, 127 ) );
	imagecopyresampled( $dst, $src, 0, 0, 0, 0, $target_w, $th, $sw, $sh );
	imagewebp( $dst, $out_path, 82 );

	printf( "%s -> %dx%d, %d bytes\n", $out_path, $target_w, $th, filesize( $out_path ) );
}
```

```bash
cd /c/Users/htper/hperkins-tokens
php /c/Users/htper/AppData/Local/Temp/claude/make-variants.php
```

Expected: `wapuu-color-448.webp -> 448x477`, and three `rivendell-*-768.webp -> 768x432`. If any file exceeds the budget in Step 1, lower the `imagewebp` quality from 82 toward 75 and re-run; do not raise the budget.

- [ ] **Step 4: Add the hero srcset**

In `patterns/wapuu-home-hero.php`, after the `$hperkins_wapuu_webp_url` assignment (line 11), add:

```php
$hperkins_wapuu_webp_448_url = esc_url( hperkins_tokens_asset_url( 'assets/img/wapuu-color-448.webp' ) );
```

Then replace the `<source>` element in the `hp-wapuu-hero__figure` figure with:

```php
<source srcset="<?php echo $hperkins_wapuu_webp_448_url; ?> 448w, <?php echo $hperkins_wapuu_webp_url; ?> 640w" sizes="(max-width: 781px) 13rem, 27.5rem" type="image/webp" />
```

Leave the `<img>` untouched — it keeps `width="962" height="1024" fetchpriority="high" decoding="async"` and no `loading` attribute.

- [ ] **Step 5: Add the ring-card srcset**

In `patterns/imladris-ring-card.php`, add a `webp768` filename to each entry of the source array — for example `'webp768' => 'imagery/rivendell-second-age-768.webp'` alongside the existing `png` and `webp` keys — then extend the loop body to resolve it:

```php
$hperkins_ring_assets[ $hperkins_ring_key ] = array(
	'png'     => esc_url( hperkins_tokens_asset_url( 'assets/img/' . $hperkins_ring_file_name['png'] ) ),
	'webp'    => esc_url( hperkins_tokens_asset_url( 'assets/img/' . $hperkins_ring_file_name['webp'] ) ),
	'webp768' => esc_url( hperkins_tokens_asset_url( 'assets/img/' . $hperkins_ring_file_name['webp768'] ) ),
);
```

Then for each of the three figures, replace the `<source>` with this shape, substituting `air`, `fire`, and `water` in turn:

```php
<source srcset="<?php echo $hperkins_ring_assets['air']['webp768']; ?> 768w, <?php echo $hperkins_ring_assets['air']['webp']; ?> 1100w" sizes="(max-width: 920px) 92vw, 23rem" type="image/webp" />
```

Leave all three `<img>` elements untouched — they keep `width="1672" height="941" loading="lazy" decoding="async"`.

- [ ] **Step 6: Run the verifier and lint**

```bash
php -l patterns/wapuu-home-hero.php && php -l patterns/imladris-ring-card.php
node scripts/verify-performance-assets.js
```

Expected: `No syntax errors detected` twice, then `verified performance asset contracts`.

- [ ] **Step 7: Confirm the rendered srcset is well-formed**

```bash
cd /c/Users/htper/Studio/henry-perkins
curl -s "$(studio status | grep -oE 'https?://[^ ]+' | head -1)/" | grep -o '<source[^>]*>' | head -4
```

Expected: each `srcset` lists two comma-separated candidates with `w` descriptors, and each URL carries a numeric `?v=` argument. A non-numeric `?v=` would introduce a comma and break parsing — if so, stop and report it.

- [ ] **Step 8: Commit**

```bash
git add assets/img/wapuu-color-448.webp assets/img/imagery/rivendell-*-768.webp \
        patterns/wapuu-home-hero.php patterns/imladris-ring-card.php \
        scripts/verify-performance-assets.js
git commit -m "Add responsive WebP candidates to the hero and ring cards"
```

---

### Task 6: Release

**Files:**
- Modify: `style.css` (header), `readme.txt`

- [ ] **Step 1: Bump the version**

In `style.css`, change `Version: 0.3.56` to `Version: 0.3.57`. In `readme.txt`, change `Stable tag: 0.3.56` to `Stable tag: 0.3.57` and add above the `= 0.3.56 =` entry:

```
= 0.3.57 =
* Split component CSS out of style.css into conditionally loaded bundles under assets/c/, resolved from the content each request actually renders. Front-page stylesheet transfer drops from 26.2 KiB to 17.9 KiB.
* Added 448w and 768w WebP candidates with srcset/sizes to the Wapuu hero and Three Rings cards, sized from the layout rules rather than from measured display size.
```

- [ ] **Step 2: Run the full local gate**

```bash
cd /c/Users/htper/hperkins-tokens
node --test scripts/lib/*.test.js
git ls-files '*.php' | while read -r f; do php -l "$f" > /dev/null || echo "SYNTAX: $f"; done
node scripts/verify-performance-assets.js
node scripts/verify-placement-artifacts.js
node scripts/verify-header.js --source-only
node scripts/verify-typography.js --source-only
node scripts/verify-journal-templates.js
node scripts/verify-style-token-usage.js
git diff --check
```

Expected: every command exits 0 with no output from `git diff --check`.

- [ ] **Step 3: Confirm visual parity**

Re-capture the same five routes at the same two viewports as Task 0 Step 3, and compare each against its baseline in `/c/Users/htper/AppData/Local/Temp/claude/baseline/`. Any visual difference is a cascade-order defect from Task 2, not an acceptable side effect — resolve it there rather than patching a bundle.

Also confirm the win landed end to end:

```bash
cd /c/Users/htper/Studio/henry-perkins
site="$(studio status | grep -oE 'https?://[^ ]+' | head -1)"
curl -s "$site/" | grep -c 'assets/c/'
curl -s --compressed -o /dev/null -w '%{size_download}\n' "$site/wp-content/themes/hperkins-tokens/style.css"
```

Expected: `0` bundles on the front page, and a compressed `style.css` around 18,300 bytes against roughly 26,900 before.

- [ ] **Step 4: Commit**

```bash
git add style.css readme.txt
git commit -m "Release 0.3.57: conditional component styles and responsive imagery"
```

- [ ] **Step 5: Push the branch and open a PR**

```bash
git push -u origin perf/component-styles-and-responsive-imagery
gh pr create \
  --title "Conditional component styles and responsive imagery" \
  --body "Implements docs/superpowers/specs/2026-07-30-css-coverage-and-responsive-imagery-design.md

Front-page stylesheet transfer: 26.2 KiB to 17.9 KiB gzip.
Adds 448w and 768w WebP candidates sized from the layout rules."
```

Do **not** push to `main` directly — that deploys the theme. Merge only after CI is green.

---

## Post-merge, administrator-owned

These are the report's two largest items and no part of this plan addresses them. Report them as outstanding:

- **262 KB unused JavaScript.** Two `gtag.js` tags (`G-XJN6VX0BFM`, `GT-NM8WG45J`) load alongside the `GTM-W43HM55V` container. Consolidating both GA properties into the single GTM container removes roughly 193 KB.
- **47 KB legacy polyfills.** Three Jetpack Search bundles and `stats.wp.com/w.js`. Update Jetpack, or disable Jetpack Search if the instant-search experience is unused.
