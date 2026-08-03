# Prominent Action System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace unfinished prominent button groups with a reusable Imladris action rail, add the approved editorial panel to closing invitations, and prove the result in source, WordPress content, and rendered pages.

**Architecture:** Existing `core/buttons` blocks opt into `hp-action-rail`; existing closing groups additionally opt into `hp-action-panel is-closing`. Shared component CSS lives in `style.css`, while existing page-specific selectors continue to own hero and page typography. A dependency-free Node verifier first checks filesystem contracts, then uses the established Chrome DevTools Protocol pattern to check deployed WordPress routes and save visual proof.

**Tech Stack:** WordPress 7.0 block theme, PHP 8.0+, hand-authored block markup/PHP, CSS custom properties from `theme.json`, Node.js built-ins, WP-CLI, headless Chrome over CDP.

## Global Constraints

- Parent theme `assembler` must remain unchanged and active beside this child theme.
- Add no npm, Composer, JavaScript runtime, custom Gutenberg block, or `theme.json` token.
- Scope shared styling through `hp-action-rail` and `hp-action-panel is-closing`; never style all `core/buttons` groups by exclusion.
- Preserve header Subscribe, search, form submits, icon buttons, and `patterns/imladris-button.php` exactly.
- Use only existing Imladris variables for colors, surfaces, spacing, radii, shadows, easing, and typography.
- Keep the Digest copy and destinations exactly as approved in the design spec.
- At 600px and below, prominent actions stack and fill the rail; at 320px they must not overflow.
- Treat About, front page, Job Placement Digest, and Flavor Agent demo bodies as DB-owned content with tracked snapshots.
- Before any DB mutation, verify `HPERKINS_WP_PATH` and `HPERKINS_ORIGIN` point at the intended WordPress environment and export a database backup.
- Advance `style.css` and `readme.txt` from `0.3.41` to `0.3.42` in the same source commit.
- Preserve unrelated workspace state. Do not stage `.superpowers/` or ignored planning files.

---

## File Map

**Create**

- `scripts/verify-prominent-actions.js` — source contracts, rendered layout/accessibility checks, and temporary screenshots.

**Modify**

- `style.css` — shared action rail and closing-panel component CSS; remove the front-page CTA’s superseded bare rule/padding; bump the version.
- `patterns/wapuu-home-hero.php` — opt the live homepage hero buttons into the rail.
- `patterns/about-resume.php` — keep the About seed/reference copy aligned with its snapshot.
- `patterns/job-placement-digest.php` — replace the loose closing buttons with the approved panel and rail.
- `content/page-snapshots/about.html` — opt the DB-owned About hero into the rail.
- `content/page-snapshots/front-page.html` — apply the closing panel and rail to the existing invitation.
- `content/page-snapshots/job-placement-digest.html` — mirror the approved Digest close.
- `content/page-snapshots/work-flavor-agent-demo.html` — apply the panel and rail without changing its copy.
- `readme.txt` — stable tag and 0.3.42 changelog.
- `CLAUDE.md` — add the eleventh verifier and document component ownership.
- `docs/design-system/INDEX.md` — record the action system as a theme composition of the canonical Button primitive.
- `scripts/verify-content-ownership-docs.js` — guard the new documentation contract.

**Live state**

- WordPress `post_content` for the front page, About, Job Placement Digest, and Flavor Agent demo.

**Explicitly unchanged**

- `theme.json`, `assets/imladris-pages.css`, `parts/header.html`, `patterns/imladris-button.php`, form and navigation scripts.

---

### Task 1: Build the reusable source components and roll them through tracked markup

**Files:**

- Create: `scripts/verify-prominent-actions.js`
- Modify: `style.css:9,2188-2267,2950-3018`
- Modify: `patterns/wapuu-home-hero.php:55-64`
- Modify: `patterns/about-resume.php:46-54`
- Modify: `patterns/job-placement-digest.php:175-183`
- Modify: `content/page-snapshots/about.html:30-38`
- Modify: `content/page-snapshots/front-page.html:69-85`
- Modify: `content/page-snapshots/job-placement-digest.html:167-175`
- Modify: `content/page-snapshots/work-flavor-agent-demo.html:75-93`
- Modify: `readme.txt:6,279-281`

**Interfaces:**

- Consumes: existing `core/buttons` markup; `--hp-touch-min`, `--hp-rule-entry`, `--hp-gold`, and generated `--wp--custom--*` variables from `style.css`/`theme.json`.
- Produces: `.hp-action-rail` for every prominent button group and `.hp-action-panel.is-closing` for editorial closing groups.

- [ ] **Step 1: Write the failing source-contract verifier**

Create `scripts/verify-prominent-actions.js` with:

```js
#!/usr/bin/env node

const fs = require( 'node:fs' );
const path = require( 'node:path' );

const THEME_ROOT = path.join( __dirname, '..' );

const RAIL_FILES = [
	'patterns/wapuu-home-hero.php',
	'patterns/about-resume.php',
	'content/page-snapshots/about.html',
	'content/page-snapshots/front-page.html',
	'patterns/job-placement-digest.php',
	'content/page-snapshots/job-placement-digest.html',
	'content/page-snapshots/work-flavor-agent-demo.html',
];

const PANEL_FILES = [
	'content/page-snapshots/front-page.html',
	'patterns/job-placement-digest.php',
	'content/page-snapshots/job-placement-digest.html',
	'content/page-snapshots/work-flavor-agent-demo.html',
];

const EXCLUDED_FILES = [
	'parts/header.html',
	'patterns/imladris-button.php',
];

const DIGEST_COPY = [
	'A next step, stated plainly',
	'Bring me the problem behind the ticket.',
	'If you need WordPress systems thinking that can survive inspection, let’s compare notes.',
	'href="/contact/"',
	'href="/work/"',
];

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function read( relativePath ) {
	return fs.readFileSync( path.join( THEME_ROOT, relativePath ), 'utf8' );
}

function classLists( contents ) {
	return Array.from( contents.matchAll( /\bclass="([^"]*)"/g ), ( match ) =>
		match[1].trim().split( /\s+/ ).filter( Boolean )
	);
}

function hasClassSet( contents, expectedClasses ) {
	return classLists( contents ).some( ( classes ) =>
		expectedClasses.every( ( className ) => classes.includes( className ) )
	);
}

function verifySourceContracts() {
	const css = read( 'style.css' );
	for ( const expected of [
		'.hp-action-rail {',
		'.hp-action-panel.is-closing {',
		'min-block-size: var(--hp-touch-min);',
		'mask: url("assets/img/emblem.svg") center / contain no-repeat;',
	] ) {
		assert( css.includes( expected ), `style.css is missing expected contract: ${ expected }` );
	}

	for ( const file of RAIL_FILES ) {
		assert(
			hasClassSet( read( file ), [ 'wp-block-buttons', 'hp-action-rail' ] ),
			`${ file } is missing hp-action-rail on its core Buttons wrapper.`
		);
	}

	for ( const file of PANEL_FILES ) {
		assert(
			hasClassSet( read( file ), [ 'hp-action-panel', 'is-closing' ] ),
			`${ file } is missing hp-action-panel is-closing.`
		);
	}

	for ( const file of EXCLUDED_FILES ) {
		const contents = read( file );
		assert( ! contents.includes( 'hp-action-rail' ), `${ file } must remain outside hp-action-rail.` );
		assert( ! contents.includes( 'hp-action-panel' ), `${ file } must remain outside hp-action-panel.` );
	}

	for ( const file of [
		'patterns/job-placement-digest.php',
		'content/page-snapshots/job-placement-digest.html',
	] ) {
		const contents = read( file );
		for ( const expected of DIGEST_COPY ) {
			assert( contents.includes( expected ), `${ file } is missing approved Digest content: ${ expected }` );
		}
		assert(
			/<h2\b[^>]*>Bring me the problem behind the ticket\.<\/h2>/.test( contents ),
			`${ file } must render the approved Digest closing heading as h2.`
		);
	}

	assert( css.includes( 'Version: 0.3.42' ), 'style.css must declare Version 0.3.42.' );
	const readme = read( 'readme.txt' );
	assert( readme.includes( 'Stable tag: 0.3.42' ), 'readme.txt must declare Stable tag 0.3.42.' );
	assert( readme.includes( '= 0.3.42 =' ), 'readme.txt must contain the 0.3.42 changelog.' );

	console.log( 'prominent action source contracts verified' );
}

try {
	verifySourceContracts();
} catch ( error ) {
	console.error( error.message );
	process.exit( 1 );
}
```

- [ ] **Step 2: Run the source verifier and confirm the red state**

Run:

```bash
node scripts/verify-prominent-actions.js
```

Expected: exit 1 with `style.css is missing expected contract: .hp-action-rail {`. If an earlier partial implementation changes the first failure, the command must still fail on one of the missing rail, panel, copy, or version contracts.

- [ ] **Step 3: Add the shared action rail and closing-panel CSS**

Insert this block in `style.css` after the `core/button` variants and before `/* === Imladris primitive patterns === */`:

```css
/* === Prominent actions ===
	 The rail groups opted-in page actions without changing the core Button
	 primitive. Closing panels add editorial punctuation only where the page
	 is making a final invitation. */
.hp-action-rail {
	box-sizing: border-box;
	width: fit-content;
	max-width: 100%;
	gap: var(--wp--preset--spacing--1);
	align-items: stretch;
	padding: var(--wp--preset--spacing--1);
	border: 1px solid var(--wp--custom--border--hair);
	border-radius: var(--wp--custom--radius--lg);
	background: linear-gradient(
		135deg,
		var(--wp--custom--surface--sunken),
		var(--wp--custom--surface--card)
	);
	box-shadow: var(--wp--custom--shadow--sm);
}

.hp-action-rail .wp-block-button {
	margin: 0;
}

.hp-action-rail .wp-block-button__link {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-block-size: var(--hp-touch-min);
}

.hp-action-panel.is-closing {
	position: relative;
	isolation: isolate;
	overflow: hidden;
	padding: var(--wp--preset--spacing--5);
	border: 1px solid var(--wp--custom--border--hair);
	border-left: var(--hp-rule-entry) solid var(--hp-gold);
	border-radius: var(--wp--custom--radius--lg);
	background: linear-gradient(
		135deg,
		var(--wp--custom--surface--sunken),
		var(--wp--custom--surface--card)
	);
	box-shadow: var(--wp--custom--shadow--md);
}

.hp-action-panel.is-closing::after {
	content: "";
	position: absolute;
	z-index: 0;
	inset: var(--wp--preset--spacing--4) var(--wp--preset--spacing--4) auto auto;
	inline-size: var(--wp--preset--spacing--6);
	block-size: var(--wp--preset--spacing--6);
	background: var(--hp-gold);
	-webkit-mask: url("assets/img/emblem.svg") center / contain no-repeat;
	mask: url("assets/img/emblem.svg") center / contain no-repeat;
	opacity: 0.32;
	pointer-events: none;
}

.hp-action-panel.is-closing > * {
	position: relative;
	z-index: 1;
}

.hp-action-panel.is-closing > .hp-action-rail {
	margin-top: var(--wp--preset--spacing--5);
}

@media (max-width: 600px) {
	.hp-action-rail {
		width: 100%;
		flex-direction: column;
		align-items: stretch;
	}

	.hp-action-rail .wp-block-button,
	.hp-action-rail .wp-block-button__link {
		width: 100%;
	}

	.hp-action-panel.is-closing {
		padding: var(--wp--preset--spacing--4);
	}

	.hp-action-panel.is-closing::after {
		inset: var(--wp--preset--spacing--3) var(--wp--preset--spacing--3) auto auto;
		inline-size: var(--wp--preset--spacing--5);
		block-size: var(--wp--preset--spacing--5);
	}
}
```

Replace:

```css
.hp-front-template__cta {
	box-sizing: border-box;
	padding: clamp(1.5rem, 1.15rem + 1.2vw, 2.25rem) 0 0;
	border-top: 1px solid var(--wp--custom--border--hair);
}
```

with:

```css
.hp-front-template__cta {
	box-sizing: border-box;
}
```

Delete the mobile-only `.hp-front-template__cta { padding-top: ... }` rule; retain the `.hp-front-template__cta-actions` alignment rule.

- [ ] **Step 4: Opt hero action groups into the shared rail**

In `patterns/wapuu-home-hero.php`, change both the block JSON and rendered class:

```html
<!-- wp:buttons {"className":"hp-wapuu-hero__cta hp-action-rail","layout":{"type":"flex","flexWrap":"wrap"}} -->
<div class="wp-block-buttons hp-wapuu-hero__cta hp-action-rail">
```

In `patterns/about-resume.php` and `content/page-snapshots/about.html`, use:

```html
<!-- wp:buttons {"className":"hp-about-hero__cta hp-action-rail","layout":{"type":"flex","flexWrap":"wrap"}} -->
<div class="wp-block-buttons hp-about-hero__cta hp-action-rail">
```

- [ ] **Step 5: Apply the closing composition to the front page and Flavor Agent demo**

In `content/page-snapshots/front-page.html`, change the section and action wrapper to:

```html
<!-- wp:group {"tagName":"section","align":"wide","className":"hp-front-template__cta hp-action-panel is-closing","style":{"spacing":{"margin":{"top":"var:preset|spacing|8"}}},"layout":{"type":"constrained","contentSize":"44rem"}} -->
<section class="wp-block-group alignwide hp-front-template__cta hp-action-panel is-closing" style="margin-top:var(--wp--preset--spacing--8)">
```

```html
<!-- wp:buttons {"className":"hp-front-template__cta-actions hp-action-rail"} -->
<div class="wp-block-buttons hp-front-template__cta-actions hp-action-rail">
```

In `content/page-snapshots/work-flavor-agent-demo.html`, change the existing 44rem closing group and buttons to:

```html
<!-- wp:group {"className":"hp-action-panel is-closing","style":{"spacing":{"margin":{"top":"var:preset|spacing|8"}}},"layout":{"type":"constrained","contentSize":"44rem"}} -->
<div class="wp-block-group hp-action-panel is-closing" style="margin-top:var(--wp--preset--spacing--8)">
```

```html
<!-- wp:buttons {"className":"hp-action-rail","layout":{"type":"flex","flexWrap":"wrap"}} -->
<div class="wp-block-buttons hp-action-rail">
```

Do not change either page’s existing copy or links.

- [ ] **Step 6: Replace the Digest’s loose buttons with the approved closing panel**

Replace the final `wp:buttons` block in both `patterns/job-placement-digest.php` and `content/page-snapshots/job-placement-digest.html` with:

```html
<!-- wp:group {"tagName":"section","className":"hp-action-panel is-closing hp-digest-cta","style":{"spacing":{"margin":{"top":"var:preset|spacing|8"}}},"layout":{"type":"constrained"}} -->
<section class="wp-block-group hp-action-panel is-closing hp-digest-cta" style="margin-top:var(--wp--preset--spacing--8)"><!-- wp:paragraph {"className":"hp-page-hero__eyebrow"} -->
<p class="hp-page-hero__eyebrow">A next step, stated plainly</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2} -->
<h2 class="wp-block-heading">Bring me the problem behind the ticket.</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>If you need WordPress systems thinking that can survive inspection, let’s compare notes.</p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"className":"hp-action-rail","layout":{"type":"flex","flexWrap":"wrap"}} -->
<div class="wp-block-buttons hp-action-rail"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="/contact/">Start a conversation</a></div>
<!-- /wp:button -->

<!-- wp:button {"className":"is-style-secondary"} -->
<div class="wp-block-button is-style-secondary"><a class="wp-block-button__link wp-element-button" href="/work/">See the work</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></section>
<!-- /wp:group -->
```

- [ ] **Step 7: Update release metadata**

Change `style.css` to `Version: 0.3.42` and `readme.txt` to `Stable tag: 0.3.42`. Insert immediately below `== Changelog ==`:

```text
= 0.3.42 =
* Prominent actions: added the opted-in hp-action-rail composition for the
  homepage and About heroes plus the front-page, Job Placement Digest, and
  Flavor Agent demo invitations. Compact header, form, icon, and specimen
  controls remain on the canonical Button primitive without the rail.
* Closing invitations: added the hp-action-panel is-closing parchment panel,
  fixed gold rule, Imladris emblem, and responsive full-width action stack.
  The Digest now ends with the approved "Bring me the problem behind the
  ticket" invitation instead of an uncontained button row.
* Accessibility: prominent actions keep the existing gold focus-visible
  treatment, guarantee 44px targets, and stack without horizontal overflow at
  600px and below.

```

- [ ] **Step 8: Run source verification and PHP syntax checks**

Run:

```bash
node scripts/verify-prominent-actions.js
```

Expected: `prominent action source contracts verified` and exit 0.

Run each:

```bash
php -l patterns/wapuu-home-hero.php
php -l patterns/about-resume.php
php -l patterns/job-placement-digest.php
```

Expected: `No syntax errors detected` for all three files.

Run `git diff --check`. Expected: exit 0 with no output.

- [ ] **Step 9: Commit the source implementation**

```bash
git add style.css readme.txt scripts/verify-prominent-actions.js patterns/wapuu-home-hero.php patterns/about-resume.php patterns/job-placement-digest.php content/page-snapshots/about.html content/page-snapshots/front-page.html content/page-snapshots/job-placement-digest.html content/page-snapshots/work-flavor-agent-demo.html
git commit -m "theme: add prominent action system"
```

Expected: one commit containing the new verifier, shared CSS, tracked markup copies, and release metadata; `.superpowers/` remains unstaged.

---

### Task 2: Add rendered regression proof and deploy DB-owned content safely

**Files:**

- Modify: `scripts/verify-prominent-actions.js`
- Verify unchanged after export: `content/page-snapshots/about.html`, `content/page-snapshots/front-page.html`, `content/page-snapshots/job-placement-digest.html`, `content/page-snapshots/work-flavor-agent-demo.html`
- Mutate with backup: live WordPress `post_content` for four pages.

**Interfaces:**

- Consumes: `verifySourceContracts(): void`, `.hp-action-rail`, `.hp-action-panel.is-closing`, `HPERKINS_ORIGIN`, `CHROME_BIN`, and `HPERKINS_WP_PATH`.
- Produces: `verifyLiveContracts(): Promise<void>` and full-page PNG evidence under `HPERKINS_CAPTURE_DIR` or the operating-system temp directory.

- [ ] **Step 1: Expand the verifier to source-only and rendered modes**

Replace `scripts/verify-prominent-actions.js` with:

```js
#!/usr/bin/env node

const { spawn } = require( 'node:child_process' );
const fs = require( 'node:fs' );
const fsPromises = require( 'node:fs/promises' );
const os = require( 'node:os' );
const path = require( 'node:path' );

const THEME_ROOT = path.join( __dirname, '..' );
const CHROME = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const ORIGIN = process.env.HPERKINS_ORIGIN || 'https://hperkins.blog';
const SOURCE_ONLY = process.argv.includes( '--source-only' );
const CAPTURE_DIR = process.env.HPERKINS_CAPTURE_DIR ||
	path.join( os.tmpdir(), 'hperkins-prominent-actions' );

const RAIL_FILES = [
	'patterns/wapuu-home-hero.php',
	'patterns/about-resume.php',
	'content/page-snapshots/about.html',
	'content/page-snapshots/front-page.html',
	'patterns/job-placement-digest.php',
	'content/page-snapshots/job-placement-digest.html',
	'content/page-snapshots/work-flavor-agent-demo.html',
];

const PANEL_FILES = [
	'content/page-snapshots/front-page.html',
	'patterns/job-placement-digest.php',
	'content/page-snapshots/job-placement-digest.html',
	'content/page-snapshots/work-flavor-agent-demo.html',
];

const EXCLUDED_FILES = [
	'parts/header.html',
	'patterns/imladris-button.php',
];

const DIGEST_COPY = [
	'A next step, stated plainly',
	'Bring me the problem behind the ticket.',
	'If you need WordPress systems thinking that can survive inspection, let’s compare notes.',
	'href="/contact/"',
	'href="/work/"',
];

const LIVE_PAGES = [
	{ route: '/', railCount: 2, panelCount: 1 },
	{ route: '/about/', railCount: 1, panelCount: 0 },
	{ route: '/job-placement-digest/', railCount: 1, panelCount: 1, digest: true },
	{ route: '/work/flavor-agent/demo/', railCount: 1, panelCount: 1 },
];

const VIEWPORTS = [
	{ name: 'desktop', width: 1440, height: 1000, mobile: false },
	{ name: 'mobile-390', width: 390, height: 1000, mobile: true },
	{ name: 'mobile-320', width: 320, height: 1000, mobile: true },
];

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function read( relativePath ) {
	return fs.readFileSync( path.join( THEME_ROOT, relativePath ), 'utf8' );
}

function classLists( contents ) {
	return Array.from( contents.matchAll( /\bclass="([^"]*)"/g ), ( match ) =>
		match[1].trim().split( /\s+/ ).filter( Boolean )
	);
}

function hasClassSet( contents, expectedClasses ) {
	return classLists( contents ).some( ( classes ) =>
		expectedClasses.every( ( className ) => classes.includes( className ) )
	);
}

function verifySourceContracts() {
	const css = read( 'style.css' );
	for ( const expected of [
		'.hp-action-rail {',
		'.hp-action-panel.is-closing {',
		'min-block-size: var(--hp-touch-min);',
		'mask: url("assets/img/emblem.svg") center / contain no-repeat;',
		'.wp-block-button__link:focus-visible',
	] ) {
		assert( css.includes( expected ), `style.css is missing expected contract: ${ expected }` );
	}

	for ( const file of RAIL_FILES ) {
		assert(
			hasClassSet( read( file ), [ 'wp-block-buttons', 'hp-action-rail' ] ),
			`${ file } is missing hp-action-rail on its core Buttons wrapper.`
		);
	}

	for ( const file of PANEL_FILES ) {
		assert(
			hasClassSet( read( file ), [ 'hp-action-panel', 'is-closing' ] ),
			`${ file } is missing hp-action-panel is-closing.`
		);
	}

	for ( const file of EXCLUDED_FILES ) {
		const contents = read( file );
		assert( ! contents.includes( 'hp-action-rail' ), `${ file } must remain outside hp-action-rail.` );
		assert( ! contents.includes( 'hp-action-panel' ), `${ file } must remain outside hp-action-panel.` );
	}

	for ( const file of [
		'patterns/job-placement-digest.php',
		'content/page-snapshots/job-placement-digest.html',
	] ) {
		const contents = read( file );
		for ( const expected of DIGEST_COPY ) {
			assert( contents.includes( expected ), `${ file } is missing approved Digest content: ${ expected }` );
		}
		assert(
			/<h2\b[^>]*>Bring me the problem behind the ticket\.<\/h2>/.test( contents ),
			`${ file } must render the approved Digest closing heading as h2.`
		);
	}

	assert( css.includes( 'Version: 0.3.42' ), 'style.css must declare Version 0.3.42.' );
	const readme = read( 'readme.txt' );
	assert( readme.includes( 'Stable tag: 0.3.42' ), 'readme.txt must declare Stable tag 0.3.42.' );
	assert( readme.includes( '= 0.3.42 =' ), 'readme.txt must contain the 0.3.42 changelog.' );

	console.log( 'prominent action source contracts verified' );
}

function wait( ms ) {
	return new Promise( ( resolve ) => setTimeout( resolve, ms ) );
}

async function rmRetry( target ) {
	let lastError;
	for ( let attempt = 0; attempt < 8; attempt++ ) {
		try {
			await fsPromises.rm( target, { recursive: true, force: true } );
			return;
		} catch ( error ) {
			lastError = error;
			await wait( 250 );
		}
	}
	throw lastError;
}

async function waitForDevToolsUrl( chrome ) {
	let buffer = '';
	return new Promise( ( resolve, reject ) => {
		const timer = setTimeout(
			() => reject( new Error( 'Timed out waiting for Chrome DevTools URL.' ) ),
			10000
		);
		chrome.stderr.on( 'data', ( chunk ) => {
			buffer += chunk.toString();
			const match = buffer.match( /(ws:\/\/127\.0\.0\.1:\d+\/devtools\/browser\/[^\s]+)/ );
			if ( match ) {
				clearTimeout( timer );
				resolve( match[1] );
			}
		} );
		chrome.on( 'exit', ( code ) => {
			clearTimeout( timer );
			reject( new Error( `Chrome exited before DevTools was ready (code ${ code }).` ) );
		} );
	} );
}

function createCdpClient( wsUrl ) {
	const ws = new WebSocket( wsUrl );
	let nextId = 1;
	const pending = new Map();
	const listeners = new Map();

	ws.addEventListener( 'message', ( event ) => {
		const message = JSON.parse( event.data );
		if ( message.id && pending.has( message.id ) ) {
			const { resolve, reject } = pending.get( message.id );
			pending.delete( message.id );
			if ( message.error ) {
				reject( new Error( message.error.message ) );
			} else {
				resolve( message.result || {} );
			}
			return;
		}

		if ( message.method ) {
			const key = `${ message.sessionId || '' }:${ message.method }`;
			const callbacks = listeners.get( key ) || [];
			listeners.delete( key );
			callbacks.forEach( ( callback ) => callback( message.params || {} ) );
		}
	} );

	function send( method, params = {}, sessionId, timeout = 15000 ) {
		const id = nextId++;
		ws.send( JSON.stringify( { id, method, params, sessionId } ) );
		return new Promise( ( resolve, reject ) => {
			const timer = setTimeout( () => {
				pending.delete( id );
				reject( new Error( `Timed out waiting for ${ method } response.` ) );
			}, timeout );
			pending.set( id, {
				resolve: ( value ) => {
					clearTimeout( timer );
					resolve( value );
				},
				reject: ( error ) => {
					clearTimeout( timer );
					reject( error );
				},
			} );
		} );
	}

	function once( method, sessionId, timeout = 10000 ) {
		const key = `${ sessionId || '' }:${ method }`;
		return new Promise( ( resolve, reject ) => {
			const timer = setTimeout(
				() => reject( new Error( `Timed out waiting for ${ method }.` ) ),
				timeout
			);
			const callback = ( params ) => {
				clearTimeout( timer );
				resolve( params );
			};
			listeners.set( key, [ ...( listeners.get( key ) || [] ), callback ] );
		} );
	}

	return new Promise( ( resolve, reject ) => {
		ws.addEventListener( 'open', () => resolve( { send, once, close: () => ws.close() } ) );
		ws.addEventListener( 'error', reject );
	} );
}

function routeSlug( route ) {
	return route === '/'
		? 'home'
		: route.replace( /^\/|\/$/g, '' ).replace( /[^a-z0-9]+/gi, '-' );
}

async function inspectPage( cdp, page, viewport ) {
	const target = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
	const attached = await cdp.send( 'Target.attachToTarget', {
		targetId: target.targetId,
		flatten: true,
	} );
	const sessionId = attached.sessionId;

	try {
		await cdp.send( 'Page.enable', {}, sessionId );
		await cdp.send( 'Runtime.enable', {}, sessionId );
		await cdp.send( 'Emulation.setDeviceMetricsOverride', {
			width: viewport.width,
			height: viewport.height,
			deviceScaleFactor: 1,
			mobile: viewport.mobile,
		}, sessionId );

		const loaded = cdp.once( 'Page.loadEventFired', sessionId );
		const url = new URL( page.route, ORIGIN ).href;
		await cdp.send( 'Page.navigate', { url }, sessionId );
		await loaded;
		await cdp.send( 'Runtime.evaluate', {
			expression: 'document.fonts && document.fonts.ready',
			awaitPromise: true,
		}, sessionId );
		await wait( 300 );

		await cdp.send( 'Input.dispatchKeyEvent', {
			type: 'keyDown',
			key: 'Tab',
			code: 'Tab',
			windowsVirtualKeyCode: 9,
		}, sessionId );
		await cdp.send( 'Input.dispatchKeyEvent', {
			type: 'keyUp',
			key: 'Tab',
			code: 'Tab',
			windowsVirtualKeyCode: 9,
		}, sessionId );

		const expression = `(() => {
			const number = (value) => Number.parseFloat(value) || 0;
			const rect = (element) => {
				const value = element.getBoundingClientRect();
				return {
					left: value.left,
					top: value.top,
					right: value.right,
					bottom: value.bottom,
					width: value.width,
					height: value.height,
				};
			};

			const rails = Array.from(document.querySelectorAll('.hp-action-rail')).map((rail) => {
				const style = getComputedStyle(rail);
				return {
					rect: rect(rail),
					backgroundColor: style.backgroundColor,
					backgroundImage: style.backgroundImage,
					borderTopWidth: number(style.borderTopWidth),
					boxShadow: style.boxShadow,
					links: Array.from(rail.querySelectorAll('.wp-block-button__link')).map((link) => ({
						text: link.textContent.trim(),
						rect: rect(link),
					})),
				};
			});

			const panels = Array.from(document.querySelectorAll('.hp-action-panel.is-closing')).map((panel) => {
				const style = getComputedStyle(panel);
				return {
					rect: rect(panel),
					borderLeftWidth: number(style.borderLeftWidth),
					backgroundImage: style.backgroundImage,
					boxShadow: style.boxShadow,
				};
			});

			const focusTarget = document.querySelector('.hp-action-rail .wp-block-button__link');
			let focus = null;
			if (focusTarget) {
				focusTarget.focus();
				const style = getComputedStyle(focusTarget);
				focus = {
					matchesFocusVisible: focusTarget.matches(':focus-visible'),
					outlineStyle: style.outlineStyle,
					outlineWidth: number(style.outlineWidth),
				};
			}

			const digestHeading = document.querySelector('.hp-digest-cta h2');
			return {
				clientWidth: document.documentElement.clientWidth,
				scrollWidth: document.documentElement.scrollWidth,
				rails,
				panels,
				focus,
				compactLeakCount: document.querySelectorAll(
					'.hp-site-subscribe.hp-action-rail, .hp-site-subscribe.hp-action-panel'
				).length,
				digestHeading: digestHeading ? digestHeading.textContent.trim() : null,
			};
		})()`;

		const evaluated = await cdp.send( 'Runtime.evaluate', {
			expression,
			awaitPromise: true,
			returnByValue: true,
		}, sessionId );

		await fsPromises.mkdir( CAPTURE_DIR, { recursive: true } );
		const metrics = await cdp.send( 'Page.getLayoutMetrics', {}, sessionId );
		const contentSize = metrics.cssContentSize || metrics.contentSize;
		const capture = await cdp.send( 'Page.captureScreenshot', {
			format: 'png',
			fromSurface: true,
			captureBeyondViewport: true,
			clip: {
				x: 0,
				y: 0,
				width: viewport.width,
				height: Math.min(
					12000,
					Math.max( viewport.height, Math.ceil( contentSize.height ) )
				),
				scale: 1,
			},
		}, sessionId, 30000 );
		const capturePath = path.join(
			CAPTURE_DIR,
			`${ routeSlug( page.route ) }-${ viewport.name }.png`
		);
		await fsPromises.writeFile( capturePath, Buffer.from( capture.data, 'base64' ) );

		return {
			...evaluated.result.value,
			url,
			capturePath,
		};
	} finally {
		await cdp.send( 'Target.closeTarget', { targetId: target.targetId } );
	}
}

async function withChrome( callback ) {
	const userDataDir = await fsPromises.mkdtemp(
		path.join( os.tmpdir(), 'hp-prominent-actions-chrome-' )
	);
	const chrome = spawn( CHROME, [
		'--headless=new',
		'--disable-gpu',
		'--no-sandbox',
		'--remote-debugging-port=0',
		`--user-data-dir=${ userDataDir }`,
		'about:blank',
	], { stdio: [ 'ignore', 'ignore', 'pipe' ] } );

	try {
		const wsUrl = await waitForDevToolsUrl( chrome );
		const cdp = await createCdpClient( wsUrl );
		try {
			await callback( cdp );
		} finally {
			cdp.close();
		}
	} finally {
		if ( ! chrome.killed ) {
			chrome.kill( 'SIGTERM' );
			await new Promise( ( resolve ) => {
				const timer = setTimeout( resolve, 2000 );
				chrome.once( 'exit', () => {
					clearTimeout( timer );
					resolve();
				} );
			} );
		}
		await rmRetry( userDataDir );
	}
}

async function verifyLiveContracts() {
	await withChrome( async ( cdp ) => {
		for ( const page of LIVE_PAGES ) {
			for ( const viewport of VIEWPORTS ) {
				const result = await inspectPage( cdp, page, viewport );

				assert(
					result.scrollWidth <= result.clientWidth + 1,
					`${ result.url } overflows at ${ viewport.width }px: client=${ result.clientWidth }, scroll=${ result.scrollWidth }.`
				);
				assert(
					result.rails.length === page.railCount,
					`${ result.url } renders ${ result.rails.length } action rails at ${ viewport.width }px; expected ${ page.railCount }.`
				);
				assert(
					result.panels.length === page.panelCount,
					`${ result.url } renders ${ result.panels.length } closing panels at ${ viewport.width }px; expected ${ page.panelCount }.`
				);
				assert( result.compactLeakCount === 0, `${ result.url } applied the prominent system to header Subscribe.` );

				for ( const rail of result.rails ) {
					assert( rail.borderTopWidth >= 1, `${ result.url } action rail has no hairline border.` );
					assert(
						rail.backgroundImage !== 'none' || rail.backgroundColor !== 'rgba(0, 0, 0, 0)',
						`${ result.url } action rail has no owned surface.`
					);
					assert( rail.boxShadow !== 'none', `${ result.url } action rail has no shadow.` );
					assert( rail.links.length >= 1, `${ result.url } action rail contains no links.` );
					for ( const link of rail.links ) {
						assert(
							link.rect.height >= 44,
							`${ result.url } "${ link.text }" is ${ link.rect.height }px high; expected at least 44px.`
						);
					}

					if ( viewport.width <= 600 && rail.links.length > 1 ) {
						for ( let index = 0; index < rail.links.length; index++ ) {
							const link = rail.links[ index ];
							assert(
								link.rect.width >= rail.rect.width - 12,
								`${ result.url } "${ link.text }" does not fill its mobile action rail.`
							);
							if ( index > 0 ) {
								assert(
									link.rect.top >= rail.links[ index - 1 ].rect.bottom - 1,
									`${ result.url } action links do not stack at ${ viewport.width }px.`
								);
							}
						}
					}
				}

				for ( const panel of result.panels ) {
					assert( panel.borderLeftWidth >= 3, `${ result.url } closing panel lost its fixed gold rule.` );
					assert( panel.backgroundImage !== 'none', `${ result.url } closing panel lost its parchment surface.` );
					assert( panel.boxShadow !== 'none', `${ result.url } closing panel lost its owned shadow.` );
				}

				assert( result.focus, `${ result.url } exposes no focusable prominent action.` );
				assert(
					result.focus.matchesFocusVisible &&
					result.focus.outlineStyle !== 'none' &&
					result.focus.outlineWidth >= 3,
					`${ result.url } prominent action does not expose the 3px keyboard focus ring.`
				);

				if ( page.digest ) {
					assert(
						result.digestHeading === 'Bring me the problem behind the ticket.',
						`${ result.url } rendered the wrong Digest closing h2.`
					);
				}

				console.log(
					`checked ${ result.url } at ${ viewport.width }px: ${ result.rails.length } rail(s), ${ result.panels.length } panel(s), ${ result.capturePath }`
				);
			}
		}
	} );
}

async function main() {
	verifySourceContracts();
	if ( SOURCE_ONLY ) {
		return;
	}
	await verifyLiveContracts();
	console.log( `prominent action screenshots: ${ CAPTURE_DIR }` );
}

main().catch( ( error ) => {
	console.error( error.message );
	process.exit( 1 );
} );
```

- [ ] **Step 2: Prove the rendered verifier detects the undeployed state**

Run `node scripts/verify-prominent-actions.js --source-only`. Expected: source contracts pass.

Then run:

```bash
HPERKINS_ORIGIN=https://hperkins.blog node scripts/verify-prominent-actions.js
```

Expected on the undeployed site: exit 1 with a rail or panel count mismatch, such as `/about/ renders 0 action rails ... expected 1`. If the target already contains the complete feature, preserve the output as evidence and skip only the DB write steps after confirming snapshot parity.

- [ ] **Step 3: Verify the WordPress target before mutation**

Run:

```bash
WP_PATH="${HPERKINS_WP_PATH:-/home/dev/hperkinsblog}"
wp --path="$WP_PATH" theme list --status=active
```

Expected: `hperkins-tokens` is active.

Run:

```bash
wp --path="$WP_PATH" eval 'echo realpath(get_stylesheet_directory());'
```

Expected: the printed path resolves to this implementation checkout. If it does not, do not mutate that database; deploy the source commit to the intended checkout or point `HPERKINS_WP_PATH` and `HPERKINS_ORIGIN` at a staging/local environment first.

- [ ] **Step 4: Back up the target database**

Run:

```bash
BACKUP="/tmp/hperkins-prominent-actions-$(date +%Y%m%d-%H%M%S).sql"
wp --path="$WP_PATH" db export "$BACKUP"
```

Expected: `Success: Exported to` followed by the backup path. Keep that path in the task log until live verification passes.

- [ ] **Step 5: Import the four approved snapshots into their DB-owned pages**

Run:

```bash
wp --path="$WP_PATH" eval '
$root = get_stylesheet_directory() . "/content/page-snapshots/";
$targets = array(
	array(
		"label" => "front page",
		"id" => (int) get_option("page_on_front"),
		"file" => "front-page.html",
	),
	array(
		"label" => "About",
		"path" => "about",
		"file" => "about.html",
	),
	array(
		"label" => "Job Placement Digest",
		"path" => "job-placement-digest",
		"file" => "job-placement-digest.html",
	),
	array(
		"label" => "Flavor Agent demo",
		"path" => "work/flavor-agent/demo",
		"file" => "work-flavor-agent-demo.html",
	),
);

foreach ($targets as $target) {
	$page = ! empty($target["id"])
		? get_post($target["id"])
		: get_page_by_path($target["path"], OBJECT, "page");
	if (! $page) {
		throw new RuntimeException("Missing page: " . $target["label"]);
	}

	$content = file_get_contents($root . $target["file"]);
	if (false === $content) {
		throw new RuntimeException("Unreadable snapshot: " . $target["file"]);
	}

	$result = wp_update_post(
		wp_slash(
			array(
				"ID" => $page->ID,
				"post_content" => rtrim($content),
			)
		),
		true
	);
	if (is_wp_error($result)) {
		throw new RuntimeException($target["label"] . ": " . $result->get_error_message());
	}
	echo $target["label"] . ":" . $page->ID . PHP_EOL;
}
'
```

Expected: four `label:id` lines and no error.

- [ ] **Step 6: Prove snapshot parity after the import**

Run `node scripts/export-page-snapshots.js`. Expected: all tracked pages are written.

Run `git diff --exit-code -- content/page-snapshots`. Expected: exit 0 with no output.

Run `node scripts/verify-content-ownership.js`. Expected: `Content ownership verified.` followed by hashes for every tracked page.

- [ ] **Step 7: Run the full rendered verifier and inspect its screenshots**

Run:

```bash
HPERKINS_ORIGIN=https://hperkins.blog node scripts/verify-prominent-actions.js
```

Expected: twelve `checked` lines covering four routes at 1440, 390, and 320px, followed by the temporary screenshot directory and exit 0.

Open the reported PNGs and confirm:

- homepage hero rail and front-page closing panel both render;
- About hero remains unboxed and gains only the rail;
- Digest and Flavor Agent demo panels have parchment surfaces, gold rules, and emblems;
- buttons stack at 390 and 320px without clipping;
- compact header Subscribe remains unchanged.

- [ ] **Step 8: Commit the rendered verifier**

```bash
git add scripts/verify-prominent-actions.js
git commit -m "test: verify prominent actions live"
```

Expected: one verifier-only commit. DB updates and temporary screenshots remain outside Git.

---

### Task 3: Lock documentation and run the release verification stack

**Files:**

- Modify: `scripts/verify-content-ownership-docs.js`
- Modify: `CLAUDE.md:21-38,60-65`
- Modify: `docs/design-system/INDEX.md`

**Interfaces:**

- Consumes: the shipped `hp-action-rail` and `hp-action-panel is-closing` contracts plus `scripts/verify-prominent-actions.js`.
- Produces: a guarded documentation record and final release evidence for 0.3.42.

- [ ] **Step 1: Add failing documentation assertions**

In `scripts/verify-content-ownership-docs.js`, replace the three `include` arrays with the following exact arrays; leave their current `exclude` arrays unchanged:

```js
// readme.txt
include: [
	'content/page-snapshots/front-page.html',
	'content/page-snapshots/about.html',
	'content/page-snapshots/work.html',
	'content/page-snapshots/ai-enablement.html',
	'content/page-snapshots/job-placement-digest.html',
	'content/page-snapshots/work-flavor-agent-demo.html',
	'theme-owned Wapuu',
	'hp-action-rail',
	'hp-action-panel',
],
```

```js
// CLAUDE.md
include: [
	'content/page-snapshots/',
	'content/page-snapshots/job-placement-digest.html',
	'content/page-snapshots/work-flavor-agent-demo.html',
	'theme-owned `wapuu-home-hero` pattern',
	'verify-prominent-actions.js',
	'hp-action-rail',
],
```

```js
// docs/design-system/INDEX.md
include: [
	'content/page-snapshots/ai-enablement.html',
	'content/page-snapshots/work.html',
	'content/page-snapshots/job-placement-digest.html',
	'content/page-snapshots/work-flavor-agent-demo.html',
	'hybrid mode: theme-owned Wapuu hero + Three Rings shell',
	'`hp-action-rail`',
	'`hp-action-panel is-closing`',
],
```

- [ ] **Step 2: Run the docs verifier and confirm the red state**

Run:

```bash
node scripts/verify-content-ownership-docs.js
```

Expected: exit 1 because `CLAUDE.md` or `docs/design-system/INDEX.md` does not yet document the new action contract.

- [ ] **Step 3: Update repository guidance**

In `CLAUDE.md`, change `all ten` to `all eleven` and add under `# Chrome + live site:`:

```text
node scripts/verify-prominent-actions.js        # /, /about/, /job-placement-digest/, and Flavor Agent demo: rail/panel counts, 44px targets, focus, mobile stacking, overflow, screenshots
```

Add this paragraph at the end of the CSS ownership section:

```markdown
Prominent page actions compose the canonical Button primitive through
`.hp-action-rail`; final invitations add `.hp-action-panel.is-closing`.
Both are shared components in `style.css`. Page selectors may own surrounding
typography and layout, but compact header, form, icon, and specimen controls
must not opt into either class.
```

- [ ] **Step 4: Record the design-system composition**

Append to `docs/design-system/INDEX.md`:

```markdown
## 2026-07-14 — prominent action composition (`core/button` → action rail)

Version 0.3.42 adds a theme-side composition around the canonical Button
primitive. `hp-action-rail` groups prominent page actions on an owned parchment
surface without changing primary/secondary button anatomy;
`hp-action-panel is-closing` adds the stronger gold-rule invitation panel only
to page endings. The homepage and About heroes use the rail without the panel;
the front page, Job Placement Digest, and Flavor Agent demo use both. Header
Subscribe, forms, icon buttons, and the Button specimen remain primitive-only.

This is a recorded theme composition, not a new token or canonical DS
component. `scripts/verify-prominent-actions.js` guards source opt-in,
compact-control exclusions, rendered counts, 44px targets, focus visibility,
mobile stacking, overflow, and desktop/mobile screenshots.
```

- [ ] **Step 5: Run the documentation verifier**

Run `node scripts/verify-content-ownership-docs.js`.

Expected: `verified content-ownership docs contract` and exit 0.

- [ ] **Step 6: Run PHP lint and all eleven theme verifiers**

Run:

```bash
find . -name '*.php' -print0 | xargs -0 -n1 php -l
```

Expected: every file reports `No syntax errors detected`.

Run each command independently and require exit 0:

```bash
node scripts/verify-ring-cards-mobile.js
node scripts/verify-contact-form-styling.js
node scripts/verify-homepage-hero-polish.js
node scripts/verify-prominent-actions.js
node scripts/verify-journal-polish.js
node scripts/verify-content-ownership.js
node scripts/verify-content-ownership-docs.js
node scripts/verify-performance-assets.js
node scripts/verify-style-token-usage.js
node scripts/verify-design-system-specimen.js
node scripts/verify-subscribe-endpoint.js
```

Expected: all eleven exit 0. The subscribe verifier must report that its mutable runtime checks restored options/transients; the prominent-action verifier must report twelve rendered checks and its screenshot directory.

- [ ] **Step 7: Verify release state and diff cleanliness**

Run:

```bash
wp --path="$WP_PATH" eval 'echo wp_get_theme()->get("Version");'
```

Expected: `0.3.42`.

Run `git diff --check`. Expected: exit 0 with no output.

Run `git status --short`. Expected: only the documentation files and docs verifier are unstaged before the commit; `.superpowers/` may remain untracked and must not be staged.

- [ ] **Step 8: Commit documentation**

```bash
git add CLAUDE.md docs/design-system/INDEX.md scripts/verify-content-ownership-docs.js
git commit -m "docs: record prominent action system"
```

Expected: one documentation-contract commit.

- [ ] **Step 9: Re-run completion verification against committed HEAD**

Run each command:

```bash
node scripts/verify-prominent-actions.js --source-only
node scripts/verify-content-ownership-docs.js
git diff HEAD^ HEAD --check
git status --short --branch
```

Expected: both verifiers exit 0; the last commit has no whitespace errors; Git reports only the known untracked `.superpowers/` companion directory and no unstaged feature files.

Record the database backup path, the four imported page IDs, the eleven verifier results, and the screenshot directory in the final handoff. Do not claim the redesign is live if the rendered verifier or content-ownership verifier was skipped.
