# Job Placement Digest Event Banner Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recompose the Job Placement Digest so the existing WordCamp invitation and its three recruiter actions lead the page, while preserving every approved claim, evidence row, Support Engineer argument, and content-ownership boundary.

**Architecture:** The reviewed candidate remains native Gutenberg markup in content/page-drafts/job-placement-digest.html, with a top-level complementary landmark followed by the existing H1 hero. Page-specific CSS in assets/imladris-pages.css owns the event-first grid, lower-page editorial layouts, and narrow evidence records; dependency-free Node contracts pin source order, CSS declarations, browser geometry, keyboard behavior, and the draft-versus-snapshot phase split. The accepted snapshot and production database remain untouched.

**Tech Stack:** WordPress block-theme markup, WordPress 6.8+ Group-block aria-label support, theme.json design tokens, CSS Grid/Flexbox, dependency-free Node.js tests, Chrome DevTools Protocol, WordPress Studio, and guarded WP-CLI helpers.

## Global Constraints

- Treat docs/superpowers/specs/2026-08-13-job-placement-digest-event-banner-layout-design.md as the approved product contract.
- Preserve the exact event dates, Core AI booth wording, role claims, evidence states, links, contribution attribution, section order, and all twelve evidence rows.
- Preserve one H1 and keep it as the first semantic heading. The visible event title is a paragraph, not an H2.
- Use a native core/group block with tagName "aside" and ariaLabel "I’ll be at WordCamp US."; WordPress core serializes that attribute as aria-label. The accessible name must exactly match the visible event title. Do not add a Custom HTML block or a render filter solely to obtain aria-labelledby.
- Keep visual, DOM, keyboard, and assistive-technology order identical. Do not use CSS order, duplicate mobile content, or hidden evidence.
- Reuse existing Imladris tokens and component styles. Do not change theme.json, style.css, navigation, footer, résumé artifacts, About, or unrelated pages.
- Add no WordCamp palette, logo, imagery, Phoenix decoration, gradient, animation, token, factual copy, or evidence claim.
- Keep the first content block aligned to the existing 72rem wide composition; do not add a full-bleed event surface.
- Keep the banner bounded and non-sticky; add no viewport-height treatment. Its existing parchment/gold surface is the only event container.
- Keep the event action order exact: Start a WordCamp conversation; View one-page résumé; Review selected WordPress evidence.
- Keep only the conversation action filled Evergreen. Keep résumé and evidence actions in the existing secondary style.
- Keep all actions at least 44px high, with visible Mallorn Gold focus treatment and wrapping labels.
- Use 64px desktop and 40px narrow spacing before major movements; use 32px desktop and 24px narrow spacing inside connected arguments; use 16px between peer controls, cards, and records.
- Verify 1440, 1024, 1023, 782, 781, 768, 600, 390, and 320 CSS-pixel widths, plus a 512 CSS-pixel desktop probe representing the reflow width of a 1024px browser at 200% zoom.
- At 1024x1000, require the complete event banner and complete Digest hero to fit, with Why Support Engineer now beginning no more than 64px below the fold.
- Keep every evidence-register row visible; add no disclosure, truncation, or default-hidden state.
- Preserve color-independent event/status text and the current reduced-motion behavior.
- Preserve the current print contract in style.css: .hp-action-rail and .hp-action-panel remain hidden in print. This layout changes screen composition only.
- If removal of the temporary event block requires a later CSS cleanup, delete only the now-unused hp-wcus-callout--event-first rules; the evergreen hero must already render naturally without those selectors.
- If a local apply has already occurred and the event block is then removed for the evergreen test, reapply the complete reviewed candidate before rendered acceptance; never leave the local review database in a mutation-fixture state.
- Keep content/page-snapshots/job-placement-digest.html unchanged. It remains the accepted production mirror until a separately authorized publication and parity export.
- A source edit, local database application, rendered local proof, Git commit, push, deployment, production publication, snapshot export, and public runtime proof are separate gates.
- Preserve the repository’s default accepted-snapshot/public verifier mode while adding candidate-only assertions behind --drafts.
- Before the first candidate markup or CSS edit, read C:\Users\htper\.agents\skills\impeccable\reference\craft-floor.md in full. This is required by the approved Impeccable workflow.
- Run the Impeccable layout detector exactly once after the final visual correction batch.
- Do not deploy, push, edit production, export the snapshot, or run a full-site synchronization in this plan.

---

## File Structure

| Path | Responsibility |
|---|---|
| content/page-drafts/job-placement-digest.html | Reviewed candidate: event-first source order, native aside, editorial prose wrappers, and closing-zone wrapper. |
| content/page-snapshots/job-placement-digest.html | Accepted production mirror; must remain byte-for-byte unchanged. |
| assets/imladris-pages.css | Digest-only event grid, hero rhythm, editorial splits, connected spacing, closing grid, phone padding, and evidence-record adaptation. |
| scripts/verify-job-placement-digest-source.js | Exact event-first source contract, optional event-removal contract, approved copy/evidence invariants, and native grouping checks. |
| scripts/lib/job-placement-digest-source-contract.test.js | Positive and mutation tests for the event landmark, top-level order, first heading, closing grouping, and safe event removal. |
| scripts/lib/job-placement-page-style-contracts.js | Shared declaration-aware contracts and exact responsive media contexts for the Digest. |
| scripts/lib/style-coverage.test.js | Mutation tests proving each required Digest layout declaration and breakpoint is enforced. |
| scripts/verify-job-placement-pages.js | Phase-aware source and rendered checks for landmark semantics, layout geometry, focus, fragments, zoom-equivalent reflow, and lower-page adaptation. |
| scripts/verify-prominent-actions.js | Shared action-system proof plus Digest-specific event rail declarations, 44px targets, focus rings, and captures. |
| scripts/lib/page-phase-contract.test.js | Pins draft/snapshot selection and ensures rendered probes query the new top-level landmark. |

## Shared Interfaces

The source contract keeps its existing required arguments and adds one optional mode:

~~~js
function verifyMain(
	markup,
	themeVersion,
	deployedCommit,
	{ requireEvent = true } = {}
) {
	// Throws on a contract violation; returns undefined on success.
}
~~~

The CSS contract module exports these exact names:

~~~js
const DIGEST_COMPACT_CONTEXT = '@media (min-width: 601px) and (max-width: 1023px)';
const DIGEST_WIDE_CONTEXT = '@media (min-width: 782px)';
const DIGEST_NARROW_CONTEXT = '@media (max-width: 781px)';
const DIGEST_PHONE_CONTEXT = '@media (max-width: 600px)';
const DIGEST_EDITORIAL_CONTEXT = '@media (min-width: 1024px)';
const DIGEST_STACK_CONTEXT = '@media (max-width: 359px)';

const DIGEST_OPENING_CONTRACTS = [];
const DIGEST_COMPACT_CONTRACTS = [];
const DIGEST_LOWER_CONTRACTS = [];
~~~

Each style contract retains the repository’s established shape:

~~~js
{
	selector: '.hp-wcus-callout',
	atContext: null,
	declarations: {
		display: 'grid',
	},
}
~~~

The rendered verifier uses this viewport shape:

~~~js
{
	name: 'desktop-1024',
	width: 1024,
	height: 1000,
	mobile: false,
	zoomPercent: null,
}
~~~

The zoom-equivalent entry is:

~~~js
{
	name: 'zoom-200-from-1024',
	width: 512,
	height: 500,
	mobile: false,
	zoomPercent: 200,
}
~~~

Chrome page-scale emulation does not change media-query topology. A 512 CSS-pixel desktop viewport is therefore the deterministic reflow proxy for a 1024px browser window at 200% zoom; it is reported explicitly as a proxy rather than as physical-device proof.

### Task 1: Establish event-first native block structure

**Files:**

- Read: docs/superpowers/specs/2026-08-13-job-placement-digest-event-banner-layout-design.md
- Modify: scripts/lib/job-placement-digest-source-contract.test.js
- Modify: scripts/verify-job-placement-digest-source.js
- Modify: content/page-drafts/job-placement-digest.html
- Verify unchanged: content/page-snapshots/job-placement-digest.html

**Interfaces:**

- Consumes: parseTopLevelBlocks(html) from scripts/lib/about-page-contract.js and the existing exact claim/evidence contracts.
- Produces: verifyMain(markup, themeVersion, deployedCommit, { requireEvent }) and the exact classes hp-wcus-callout--event-first, hp-wcus-callout__copy, hp-wcus-callout__title, hp-digest-editorial-split, hp-digest-section__body, and hp-digest-closing-zone.

- [ ] **Step 1: Create the execution branch and prove the baseline**

Stay in the user-selected current checkout by default. Create a worktree only if the user explicitly chooses isolation; if so, invoke superpowers:using-git-worktrees. In either case create branch codex/job-placement-digest-event-banner from the commit containing this plan, then run:

~~~powershell
git status --short --branch
git rev-parse HEAD
git log -1 --format=%H -- docs/superpowers/plans/2026-08-13-job-placement-digest-event-banner-layout.md
git diff --check
node --test scripts/lib/job-placement-digest-source-contract.test.js scripts/lib/style-coverage.test.js scripts/lib/page-phase-contract.test.js
node scripts/verify-job-placement-digest-source.js
node scripts/verify-job-placement-pages.js --source-only --drafts
node scripts/verify-prominent-actions.js --source-only --drafts
~~~

Expected: the HEAD and plan hashes match; the selected checkout is clean; every baseline command passes before edits.

- [ ] **Step 2: Replace the hero-containment mutation with event-first and removal mutations**

In scripts/lib/job-placement-digest-source-contract.test.js, import parseTopLevelBlocks and replace HERO_CLOSE, WCUS_BLOCK_START, containWcusPanel(), moveWcusPanelOutsideHero(), and the old “inside the Digest hero” test with:

~~~js
const { parseTopLevelBlocks } = require( './about-page-contract' );

function hasBlockClass( block, className ) {
	return ( block.attrs.className || '' ).split( /\s+/ ).includes( className );
}

function removeEventBlock( value ) {
	const blocks = parseTopLevelBlocks( value );
	const event = blocks.find( ( block ) => hasBlockClass( block, 'hp-wcus-callout' ) );
	assert( event, 'Fixture must contain the top-level WordCamp block.' );
	return value.slice( 0, event.start ) + value.slice( event.end );
}

function moveEventAfterHero( value ) {
	const blocks = parseTopLevelBlocks( value );
	const event = blocks.find( ( block ) => hasBlockClass( block, 'hp-wcus-callout' ) );
	const hero = blocks.find( ( block ) => hasBlockClass( block, 'hp-digest__hero' ) );
	assert( event && hero && event.end <= hero.start, 'Fixture must put WordCamp before the Digest hero.' );
	return (
		value.slice( 0, event.start ) +
		value.slice( event.end, hero.end ) +
		'\n\n' +
		event.outer +
		value.slice( hero.end )
	);
}

test( 'requires the native labelled WordCamp aside before the first-heading hero', () => {
	const blocks = parseTopLevelBlocks( DIGEST );
	const event = blocks[ 0 ];
	const hero = blocks[ 1 ];
	const why = blocks[ 2 ];

	assert.equal( event.name, 'group' );
	assert.equal( event.attrs.tagName, 'aside' );
	assert.equal( event.attrs.ariaLabel, 'I’ll be at WordCamp US.' );
	assert( hasBlockClass( event, 'hp-wcus-callout' ) );
	assert( hasBlockClass( event, 'hp-wcus-callout--event-first' ) );
	assert( hasBlockClass( hero, 'hp-digest__hero' ) );
	assert.equal( why.attrs.anchor, 'why-support-engineer-now' );
	assert.match( event.outer, /<aside\b[^>]*aria-label="I’ll be at WordCamp US\."[^>]*>/ );
	assert.match( event.outer, /<p class="hp-wcus-callout__title">I’ll be at WordCamp US\.<\/p>/ );
	assert.doesNotMatch( event.outer, /<h[1-6]\b/ );
	assert.doesNotMatch( hero.outer, /hp-wcus-callout/ );
	assert.doesNotThrow( () => verifyMain( DIGEST, THEME_VERSION, DEPLOYED_COMMIT ) );

	const reordered = moveEventAfterHero( DIGEST );
	assert.throws(
		() => verifyMain( reordered, THEME_VERSION, DEPLOYED_COMMIT ),
		/WordCamp aside must be the first top-level block/
	);
} );

test( 'keeps the evergreen Digest structurally valid when the event block is removed', () => {
	const evergreen = removeEventBlock( DIGEST );
	const blocks = parseTopLevelBlocks( evergreen );

	assert( hasBlockClass( blocks[ 0 ], 'hp-digest__hero' ) );
	assert.equal( blocks[ 1 ].attrs.anchor, 'why-support-engineer-now' );
	assert.doesNotMatch( evergreen, /hp-wcus-callout/ );
	assert.doesNotThrow(
		() => verifyMain(
			evergreen,
			THEME_VERSION,
			DEPLOYED_COMMIT,
			{ requireEvent: false }
		)
	);
} );

test( 'groups editorial prose and the final two-part close with native blocks', () => {
	assert.equal(
		[ ...DIGEST.matchAll( /"className":"hp-digest-section__body"/g ) ].length,
		2
	);
	assert.match( DIGEST, /"className":"hp-digest-section hp-support-now hp-digest-editorial-split"/ );
	assert.match( DIGEST, /"className":"hp-digest-section hp-theme-governance hp-digest-editorial-split"/ );
	assert.match( DIGEST, /"className":"hp-digest-closing-zone"/ );
} );

test( 'preserves the approved event action styles and excludes layout reordering', () => {
	const event = parseTopLevelBlocks( DIGEST ).find( ( block ) =>
		hasBlockClass( block, 'hp-wcus-callout--event-first' )
	);
	assert( event, 'Fixture must contain the event-first WordCamp block.' );
	assert.equal(
		[ ...event.outer.matchAll( /<!-- wp:button -->/g ) ].length,
		1
	);
	assert.equal(
		[ ...event.outer.matchAll( /<!-- wp:button \{"className":"is-style-secondary"\} -->/g ) ].length,
		2
	);
	assert.match(
		event.outer,
		/<!-- wp:button -->[\s\S]*?Start a WordCamp conversation[\s\S]*?<!-- \/wp:button -->/
	);

	const pagesCss = fs.readFileSync(
		path.join( THEME_ROOT, 'assets', 'imladris-pages.css' ),
		'utf8'
	);
	for ( const rule of pagesCss.matchAll( /\.hp-(?:wcus-callout|digest)[^{]*\{([^}]*)\}/g ) ) {
		assert.doesNotMatch( rule[ 1 ], /(?:^|;)\s*order\s*:/ );
	}
} );
~~~

- [ ] **Step 3: Run the new source tests and confirm the intended red state**

Run:

~~~powershell
node --test scripts/lib/job-placement-digest-source-contract.test.js
~~~

Expected: FAIL because the current first block is hp-digest__hero, the event block is a nested section with an H2, and hp-digest-closing-zone does not exist.

- [ ] **Step 4: Extend verifyMain with event-required and event-removed modes**

In scripts/verify-job-placement-digest-source.js, change the function signature to the exact verifyMain(markup, themeVersion, deployedCommit, { requireEvent = true } = {}) interface shown above. Preserve lines 195–212 and 248–334 as they are, apart from the résumé-count replacement shown after this block. Replace current lines 214–247 with:

~~~js
const topLevelBlocks = parseTopLevelBlocks( markup );
const hasBlockClass = ( block, className ) =>
	( block.attrs.className || '' ).split( /\s+/ ).includes( className );
const eventIndex = topLevelBlocks.findIndex( ( block ) => hasBlockClass( block, 'hp-wcus-callout' ) );
const heroIndex = topLevelBlocks.findIndex( ( block ) => hasBlockClass( block, 'hp-digest__hero' ) );
const whyIndex = topLevelBlocks.findIndex( ( block ) => block.attrs.anchor === 'why-support-engineer-now' );

assert( heroIndex !== -1, 'Main digest draft must contain a top-level .hp-digest__hero block.' );
assert( whyIndex !== -1, 'Main digest draft must contain #why-support-engineer-now.' );
assert(
	getClassCount( topLevelBlocks[ heroIndex ].outer, 'hp-wcus-callout' ) === 0,
	'The Digest hero must not contain the WordCamp aside.'
);
assert(
	getClassCount( topLevelBlocks[ heroIndex ].outer, 'hp-digest__primary-actions' ) === 0,
	'The Digest hero must not repeat event actions.'
);

if ( requireEvent ) {
	assert( eventIndex === 0, 'The WordCamp aside must be the first top-level block.' );
	assert( heroIndex === 1, 'The Digest hero must immediately follow the WordCamp aside.' );
	const eventBlock = topLevelBlocks[ eventIndex ];
	assert( eventBlock.name === 'group', 'The WordCamp aside must remain a native Group block.' );
	assert( eventBlock.attrs.tagName === 'aside', 'The WordCamp Group must serialize as an aside.' );
	assert(
		eventBlock.attrs.ariaLabel === 'I’ll be at WordCamp US.',
		'The WordCamp aside must have the approved accessible name.'
	);
	const wcusPanel = getScopedElementMatch( markup, 'aside', 'hp-wcus-callout' )[ 2 ];
	for ( const required of [
		'<p class="hp-page-hero__eyebrow">WORDCAMP US 2026 · PHOENIX</p>',
		'<p class="hp-wcus-callout__title">I’ll be at WordCamp US.</p>',
		'I’ll be in Phoenix August 16–19, and I’ve been selected to staff the Core AI booth. If you’re hiring for WordPress support engineering, working on WordPress AI, or carrying an interesting incident, come say hello.',
	] ) {
		assert( wcusPanel.includes( required ), 'The WordCamp aside is missing approved event copy.' );
	}
	assert(
		/<aside\b[^>]*aria-label="I’ll be at WordCamp US\."[^>]*>/.test( eventBlock.outer ),
		'The WordCamp Group markup must serialize the accessible name.'
	);
	assert( ! /<h[1-6]\b/i.test( wcusPanel ), 'The WordCamp aside must not introduce a heading before the H1.' );
	assert(
		JSON.stringify( extractLinks( wcusPanel ) ) === JSON.stringify( WCUS_ACTIONS ),
		'The WordCamp aside actions must match the approved ordered contract.'
	);
	assert(
		getClassCount( wcusPanel, 'hp-wcus-callout__copy' ) === 1 &&
			getClassCount( wcusPanel, 'hp-wcus-callout__actions' ) === 1,
		'The WordCamp aside must contain one copy column and one action column.'
	);
	assert(
		getClassCount( wcusPanel, 'hp-wcus-callout--event-first' ) === 1,
		'The candidate WordCamp aside must carry its event-first layout modifier.'
	);
} else {
	assert( eventIndex === -1, 'Event-removal mode requires the WordCamp block to be absent.' );
	assert( heroIndex === 0, 'After event removal, the Digest hero must become the first top-level block.' );
}

assert(
	whyIndex === heroIndex + 1,
	'Why Support Engineer now must immediately follow the Digest hero.'
);

if ( ! requireEvent ) {
	const openingClasses = [ 'hp-digest__hero', 'hp-support-now' ];
	assert(
		openingClasses.every( ( className ) => getClassCount( markup, className ) === 1 ),
		'Event removal must leave one complete hero followed by the role argument.'
	);
}

const closingZone = topLevelBlocks.find( ( block ) => hasBlockClass( block, 'hp-digest-closing-zone' ) );
assert( closingZone, 'Main digest draft must contain the final hp-digest-closing-zone Group.' );
assert(
	getClassCount( closingZone.outer, 'hp-method-link' ) === 1 &&
		getClassCount( closingZone.outer, 'hp-digest-cta' ) === 1,
	'The closing zone must contain exactly one method section and one final invitation.'
);
~~~

Replace the fixed résumé-link count with:

~~~js
	const expectedResumeLinks = requireEvent ? 2 : 1;
assert(
	countMatches( markup, /href=(['"])\/one-page-resume\/\1/g ) === expectedResumeLinks,
	'The candidate must expose the semantic résumé route in every present action group.'
);
~~~

In main(), keep verifying mainPath with the default requireEvent: true. Do not add snapshot verification here; scripts/verify-job-placement-pages.js remains the phase-aware draft/snapshot verifier.

- [ ] **Step 5: Load the Impeccable craft floor immediately before the first UI edit**

Run:

~~~powershell
Get-Content -Raw C:\Users\htper\.agents\skills\impeccable\reference\craft-floor.md
~~~

Expected: read the full file before changing candidate markup or CSS. Apply its craft floor without broadening the approved design.

- [ ] **Step 6: Move the exact WordCamp copy/actions before the hero in a native aside**

Replace the current nested WCUS Group with this top-level block before the unchanged hp-digest__hero Group:

~~~html
<!-- wp:group {"tagName":"aside","ariaLabel":"I’ll be at WordCamp US.","align":"wide","className":"hp-wcus-callout hp-wcus-callout--event-first hp-action-panel","layout":{"type":"default"}} -->
<aside class="wp-block-group alignwide hp-wcus-callout hp-wcus-callout--event-first hp-action-panel" aria-label="I’ll be at WordCamp US."><!-- wp:group {"className":"hp-wcus-callout__copy","layout":{"type":"default"}} -->
<div class="wp-block-group hp-wcus-callout__copy"><!-- wp:paragraph {"className":"hp-page-hero__eyebrow"} -->
<p class="hp-page-hero__eyebrow">WORDCAMP US 2026 · PHOENIX</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"hp-wcus-callout__title"} -->
<p class="hp-wcus-callout__title">I’ll be at WordCamp US.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>I’ll be in Phoenix August 16–19, and I’ve been selected to staff the Core AI booth. If you’re hiring for WordPress support engineering, working on WordPress AI, or carrying an interesting incident, come say hello.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:buttons {"className":"hp-action-rail hp-wcus-callout__actions hp-digest__primary-actions","layout":{"type":"flex","flexWrap":"wrap"}} -->
<div class="wp-block-buttons hp-action-rail hp-wcus-callout__actions hp-digest__primary-actions"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="/contact/">Start a WordCamp conversation</a></div>
<!-- /wp:button -->

<!-- wp:button {"className":"is-style-secondary"} -->
<div class="wp-block-button is-style-secondary"><a class="wp-block-button__link wp-element-button" href="/one-page-resume/">View one-page résumé</a></div>
<!-- /wp:button -->

<!-- wp:button {"className":"is-style-secondary"} -->
<div class="wp-block-button is-style-secondary"><a class="wp-block-button__link wp-element-button" href="#evidence-register">Review selected WordPress evidence</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></aside>
<!-- /wp:group -->
~~~

Close the existing hero immediately after hp-category-bar. Do not change its eyebrow, H1, support line, role statement, dateline, or chips.

- [ ] **Step 7: Add exact native layout wrappers without changing prose**

Add hp-digest-editorial-split to the Why and theme-governance outer className and HTML class. Insert the Group opener immediately after each section’s <!-- /wp:heading --> delimiter:

~~~html
<!-- wp:group {"className":"hp-digest-section__body","layout":{"type":"default"}} -->
<div class="wp-block-group hp-digest-section__body">
~~~

Insert the Group closer immediately before each outer </section>:

~~~html
</div>
<!-- /wp:group -->
~~~

Do not alter the paragraph blocks between those delimiters. This gives Why three unchanged paragraphs in its body and theme governance three unchanged paragraphs in its body.

The final source must contain exactly two hp-digest-section__body Groups. Insert this opener immediately before the hp-method-link block:

~~~html
<!-- wp:group {"align":"wide","className":"hp-digest-closing-zone","layout":{"type":"default"}} -->
<div class="wp-block-group alignwide hp-digest-closing-zone">
~~~

Insert this closer immediately after the hp-digest-cta block:

~~~html
</div>
<!-- /wp:group -->
~~~

On the two existing child blocks only:

- Remove align:"wide" and alignwide from hp-method-link.
- Remove the style.spacing.margin attribute and inline style from hp-digest-cta.
- Keep every child paragraph, heading, button, href, and button style unchanged.

- [ ] **Step 8: Prove source structure, removal safety, and snapshot isolation**

Run:

~~~powershell
node --test scripts/lib/job-placement-digest-source-contract.test.js
node scripts/verify-job-placement-digest-source.js
git diff --exit-code -- content/page-snapshots/job-placement-digest.html
git diff --check
~~~

Expected: all source tests pass; the exact copy/evidence verifier passes; the snapshot command emits no diff; whitespace verification passes.

- [ ] **Step 9: Commit the native source structure**

~~~powershell
git add content/page-drafts/job-placement-digest.html scripts/verify-job-placement-digest-source.js scripts/lib/job-placement-digest-source-contract.test.js
git commit -m "feat: lead Digest with WordCamp invitation"
~~~

Expected: one commit containing only the three allowlisted files.

### Task 2: Implement the event banner and compact hero layout

**Files:**

- Modify: scripts/lib/job-placement-page-style-contracts.js
- Modify: scripts/lib/style-coverage.test.js
- Modify: scripts/verify-prominent-actions.js
- Modify: assets/imladris-pages.css

**Interfaces:**

- Consumes: hp-wcus-callout__copy, hp-wcus-callout__title, and hp-digest__hero from Task 1.
- Produces: DIGEST_OPENING_CONTRACTS, DIGEST_COMPACT_CONTRACTS, and exact base/compact/narrow/phone declarations used by both source verifiers.

Task 2 deliberately keeps scripts/verify-job-placement-pages.js unchanged through the compatibility alias; Task 4 owns its phase-aware rewrite.

- [ ] **Step 1: Define failing opening-layout contracts**

Replace scripts/lib/job-placement-page-style-contracts.js with:

~~~js
const DIGEST_COMPACT_CONTEXT = '@media (min-width: 601px) and (max-width: 1023px)';
const DIGEST_WIDE_CONTEXT = '@media (min-width: 782px)';
const DIGEST_NARROW_CONTEXT = '@media (max-width: 781px)';
const DIGEST_PHONE_CONTEXT = '@media (max-width: 600px)';
const DIGEST_EDITORIAL_CONTEXT = '@media (min-width: 1024px)';
const DIGEST_STACK_CONTEXT = '@media (max-width: 359px)';

const DIGEST_OPENING_CONTRACTS = [
	{
		selector: '.hp-digest__hero.hp-page-hero',
		declarations: { 'margin-block-start': '0' },
	},
	{
		selector: '.hp-wcus-callout--event-first + .hp-digest__hero',
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--6)' },
	},
	{
		selector: '.hp-wcus-callout--event-first',
		declarations: {
			'box-sizing': 'border-box',
			display: 'grid',
			'grid-template-columns': 'minmax(0, 1fr)',
			'column-gap': '0',
			'row-gap': 'var(--wp--preset--spacing--5)',
			'align-items': 'stretch',
			'max-inline-size': 'var(--wp--style--global--wide-size, 72rem)',
			'margin-block-start': '0',
			padding: 'var(--wp--preset--spacing--6)',
			'border-inline-start': '0.25rem solid var(--wp--preset--color--gold-600)',
			background: 'var(--wp--custom--surface--raised)',
		},
	},
	{
		selector: '.hp-wcus-callout--event-first .hp-wcus-callout__actions',
		declarations: {
			display: 'grid',
			'grid-template-columns': 'minmax(0, 1fr)',
			gap: 'var(--wp--preset--spacing--4)',
			width: '100%',
			'align-self': 'stretch',
		},
	},
	{
		selector: '.hp-wcus-callout--event-first .hp-wcus-callout__title',
		declarations: {
			'max-inline-size': '18ch',
			margin: 'var(--wp--preset--spacing--4) 0 0',
			'font-family': 'var(--wp--preset--font-family--display)',
			'font-size': 'var(--wp--preset--font-size--2-xl)',
			'line-height': 'var(--wp--custom--leading--snug)',
		},
	},
	{
		selector: '.hp-wcus-callout--event-first',
		atContext: DIGEST_WIDE_CONTEXT,
		declarations: {
			'grid-template-columns': 'minmax(0, 1.35fr) minmax(16rem, 0.65fr)',
			'column-gap': 'var(--wp--preset--spacing--6)',
			'row-gap': '0',
		},
	},
];

const DIGEST_COMPACT_CONTRACTS = [
	{
		selector: '.hp-digest-template',
		atContext: DIGEST_COMPACT_CONTEXT,
		declarations: { 'padding-block-start': 'var(--wp--preset--spacing--5) !important' },
	},
	{
		selector: '.hp-digest__hero h1',
		atContext: DIGEST_COMPACT_CONTEXT,
		declarations: {
			'max-inline-size': 'none',
			'font-size': 'var(--wp--preset--font-size--3-xl)',
		},
	},
	{
		selector: '.hp-wcus-callout--event-first',
		atContext: DIGEST_COMPACT_CONTEXT,
		declarations: { padding: 'var(--wp--preset--spacing--5)' },
	},
	{
		selector: '.hp-wcus-callout--event-first',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: {
			'grid-template-columns': 'minmax(0, 1fr)',
			'column-gap': '0',
			'row-gap': 'var(--wp--preset--spacing--5)',
		},
	},
	{
		selector: '.hp-wcus-callout--event-first',
		atContext: DIGEST_PHONE_CONTEXT,
		declarations: {
			'row-gap': 'var(--wp--preset--spacing--4)',
			padding: 'var(--wp--preset--spacing--4)',
		},
	},
];

const DIGEST_LOWER_CONTRACTS = [];

// Remove in Task 4 after verify-job-placement-pages.js imports the new arrays.
const DIGEST_TABLET_CONTRACTS = DIGEST_COMPACT_CONTRACTS;

module.exports = {
	DIGEST_COMPACT_CONTEXT,
	DIGEST_COMPACT_CONTRACTS,
	DIGEST_EDITORIAL_CONTEXT,
	DIGEST_LOWER_CONTRACTS,
	DIGEST_NARROW_CONTEXT,
	DIGEST_OPENING_CONTRACTS,
	DIGEST_PHONE_CONTEXT,
	DIGEST_STACK_CONTEXT,
	DIGEST_TABLET_CONTRACTS,
	DIGEST_WIDE_CONTEXT,
};
~~~

Before replacing the module, inventory every importer. Use:

~~~powershell
rg -n "DIGEST_TABLET_CONTRACTS|job-placement-page-style-contracts" scripts
~~~

Expected: only scripts/lib/style-coverage.test.js and scripts/verify-job-placement-pages.js import the old name. Task 2 updates the unit test now. Preserve a compatibility alias for the rendered verifier until Task 4 replaces its import; do not leave another importer unaccounted for.

The compatibility alias shown in the complete replacement keeps every commit green until Task 4 removes it.

In scripts/lib/style-coverage.test.js, replace the old DIGEST_TABLET_CONTRACTS import and test with:

~~~js
const {
	DIGEST_COMPACT_CONTEXT,
	DIGEST_COMPACT_CONTRACTS,
	DIGEST_OPENING_CONTRACTS,
} = require( './job-placement-page-style-contracts' );

test( 'Digest opening uses the approved token-based event-first topology', () => {
	const contracts = [ ...DIGEST_OPENING_CONTRACTS, ...DIGEST_COMPACT_CONTRACTS ];
	const typographyContracts = contracts.filter( ( contract ) =>
		Object.values( contract.declarations ).some( ( value ) =>
			value.includes( '--wp--preset--font-size--' )
		)
	);
	assert.doesNotThrow( () => assertFontPresetReferencesResolve( typographyContracts, themeJson ) );

	for ( const contract of contracts ) {
		assert.doesNotThrow( () => assertRuleDeclarations( pagesCss, contract ) );
		for ( const [ property, expected ] of Object.entries( contract.declarations ) ) {
			const mutant = mutateDeclaration( pagesCss, contract, property, expected );
			assert.throws(
				() => assertRuleDeclarations( mutant, contract ),
				/Digest|hp-|padding|margin|font|grid|gap|width|align|border/
			);
		}
	}

	assert.equal(
		pagesCss.split( DIGEST_COMPACT_CONTEXT ).length - 1,
		1,
		'The compact band must have one exact source context.'
	);
	const wrongUpperBound = pagesCss.replace(
		DIGEST_COMPACT_CONTEXT,
		'@media (min-width: 601px) and (max-width: 1024px)'
	);
	assert.throws(
		() => assertRuleDeclarations( wrongUpperBound, DIGEST_COMPACT_CONTRACTS[ 0 ] ),
		/601px|1023px|hp-digest-template/
	);
} );
~~~

- [ ] **Step 2: Run the style test and confirm it fails on the three-column event rail**

Run:

~~~powershell
node --test scripts/lib/style-coverage.test.js
~~~

Expected: FAIL because hp-wcus-callout lacks the two-column grid, hp-wcus-callout__actions still has three columns, and the new responsive padding contracts are absent.

- [ ] **Step 3: Replace the existing Digest opening CSS**

In assets/imladris-pages.css, replace the Digest hero, WordCamp, and primary-action rules from .hp-digest__hero.hp-page-hero through .hp-digest__primary-actions .wp-block-button__link with:

~~~css
.hp-digest__hero.hp-page-hero {
  max-inline-size: var(--wp--style--global--wide-size, 72rem);
  margin-block-start: 0;
  border-bottom: 0;
  padding-bottom: 0;
}

.hp-wcus-callout--event-first + .hp-digest__hero {
  margin-block-start: var(--wp--preset--spacing--6);
}

.hp-digest-template {
  padding-block-start: var(--wp--preset--spacing--6) !important;
}

.hp-digest__hero h1,
.hp-method-hero h1 {
  max-inline-size: 28ch;
  margin-block: var(--wp--preset--spacing--4) 0;
}

.hp-digest__support-line {
  max-inline-size: var(--wp--custom--measure--prose);
  margin: var(--wp--preset--spacing--3) 0 0;
  font-family: var(--wp--preset--font-family--label);
  font-size: var(--wp--preset--font-size--sm);
  line-height: 1.5;
  color: var(--wp--custom--text--muted);
}

.hp-digest__current-role {
  max-inline-size: var(--wp--custom--measure--prose);
  margin: var(--wp--preset--spacing--4) 0 0;
  padding-inline-start: var(--wp--preset--spacing--4);
  line-height: var(--wp--custom--leading--relaxed);
  color: var(--wp--custom--text--strong);
  border-inline-start: 3px solid var(--wp--custom--rule--gold);
}

.hp-digest__dateline {
  margin: var(--wp--preset--spacing--3) 0 0;
  font-family: var(--wp--preset--font-family--mono);
  font-size: var(--wp--preset--font-size--xs);
  line-height: 1.45;
  color: var(--wp--custom--text--muted);
}

.hp-category-bar {
  margin-block: var(--wp--preset--spacing--3);
}

.hp-wcus-callout--event-first {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  column-gap: 0;
  row-gap: var(--wp--preset--spacing--5);
  align-items: stretch;
  max-inline-size: var(--wp--style--global--wide-size, 72rem);
  margin-block-start: 0;
  padding: var(--wp--preset--spacing--6);
  border-inline-start: 0.25rem solid var(--wp--preset--color--gold-600);
  background: var(--wp--custom--surface--raised);
}

.hp-wcus-callout--event-first .hp-wcus-callout__copy {
  min-inline-size: 0;
}

.hp-wcus-callout--event-first .hp-wcus-callout__title {
  max-inline-size: 18ch;
  margin: var(--wp--preset--spacing--4) 0 0;
  font-family: var(--wp--preset--font-family--display);
  font-size: var(--wp--preset--font-size--2-xl);
  line-height: var(--wp--custom--leading--snug);
  color: var(--wp--custom--text--strong);
}

.hp-wcus-callout--event-first .hp-wcus-callout__copy > p:last-child {
  max-inline-size: var(--wp--custom--measure--prose);
  margin: var(--wp--preset--spacing--4) 0 0;
  line-height: var(--wp--custom--leading--relaxed);
}

.hp-digest__primary-actions.hp-action-rail {
  display: grid;
  width: 100%;
  margin-block-start: 0;
}

.hp-wcus-callout--event-first .hp-wcus-callout__actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--wp--preset--spacing--4);
  width: 100%;
  align-self: stretch;
}

.hp-digest__primary-actions .wp-block-button,
.hp-digest__primary-actions .wp-block-button__link {
  min-width: 0;
  width: 100%;
}

.hp-digest__primary-actions .wp-block-button__link {
  padding-inline: var(--wp--preset--spacing--3);
  text-align: center;
  overflow-wrap: anywhere;
}

@media (min-width: 782px) {
  .hp-wcus-callout--event-first {
    grid-template-columns: minmax(0, 1.35fr) minmax(16rem, 0.65fr);
    column-gap: var(--wp--preset--spacing--6);
    row-gap: 0;
  }
}
~~~

Delete the unused .hp-digest__primary-actions.hp-action-rail:not(.hp-wcus-callout__actions) rules at base, 960px, and 600px because the hero no longer owns a four-action rail.

- [ ] **Step 4: Replace the compact-band comment/rules and add exact narrow boundaries**

Replace the current 601px–1023px WordCamp rules and merge these declarations into the existing 781px and 600px media blocks:

~~~css
/* Compact laptops reduce shell and hero type without changing the event-first
   two-column topology above 781px. */
@media (min-width: 601px) and (max-width: 1023px) {
  .hp-digest-template {
    padding-block-start: var(--wp--preset--spacing--5) !important;
  }

  .hp-digest__hero h1 {
    max-inline-size: none;
    font-size: var(--wp--preset--font-size--3-xl);
  }

  .hp-wcus-callout--event-first {
    padding: var(--wp--preset--spacing--5);
  }
}

@media (max-width: 781px) {
  .hp-wcus-callout--event-first {
    grid-template-columns: minmax(0, 1fr);
    column-gap: 0;
    row-gap: var(--wp--preset--spacing--5);
  }
}

@media (max-width: 600px) {
  .hp-wcus-callout--event-first {
    row-gap: var(--wp--preset--spacing--4);
    padding: var(--wp--preset--spacing--4);
  }

  .hp-wcus-callout--event-first .hp-wcus-callout__title {
    max-inline-size: none;
  }
}
~~~

Keep exactly one DIGEST_COMPACT_CONTEXT occurrence. Preserve the existing narrow one-column hp-debug-proof__grid rule.

- [ ] **Step 5: Update the prominent-action source assertions**

In scripts/verify-prominent-actions.js, replace the two Digest-specific declaration assertions with:

~~~js
if ( USE_DRAFTS ) {
	assertRuleDeclarations( pageCss, {
		selector: '.hp-wcus-callout--event-first',
		declarations: {
			display: 'grid',
			'grid-template-columns': 'minmax(0, 1fr)',
			'column-gap': '0',
			'row-gap': 'var(--wp--preset--spacing--5)',
			padding: 'var(--wp--preset--spacing--6)',
			'border-inline-start': '0.25rem solid var(--wp--preset--color--gold-600)',
		},
	} );
	assertRuleDeclarations( pageCss, {
		selector: '.hp-wcus-callout--event-first .hp-wcus-callout__actions',
		declarations: {
			display: 'grid',
			'grid-template-columns': 'minmax(0, 1fr)',
			gap: 'var(--wp--preset--spacing--4)',
		},
	} );
	assertRuleDeclarations( pageCss, {
		selector: '.hp-wcus-callout--event-first',
		atContext: '@media (min-width: 782px)',
		declarations: {
			'grid-template-columns': 'minmax(0, 1.35fr) minmax(16rem, 0.65fr)',
			'column-gap': 'var(--wp--preset--spacing--6)',
			'row-gap': '0',
		},
	} );
} else {
	assertRuleDeclarations( pageCss, {
		selector: '.hp-wcus-callout',
		declarations: {
			padding: 'var(--wp--preset--spacing--6)',
			'border-inline-start': '0.25rem solid var(--wp--preset--color--gold-600)',
		},
	} );
}
~~~

The default branch deliberately validates only declarations shared by the accepted snapshot. It must not expect the unpublished draft’s outer grid or one-column rail.

- [ ] **Step 6: Prove the opening CSS contracts**

Run:

~~~powershell
node --test scripts/lib/style-coverage.test.js
node scripts/verify-prominent-actions.js --source-only --drafts
git diff --check
~~~

Expected: the declaration/mutation tests pass, the draft action source contract passes, verify-job-placement-pages.js still loads through the compatibility alias, and no whitespace errors remain.

- [ ] **Step 7: Commit the opening layout**

~~~powershell
git add assets/imladris-pages.css scripts/lib/job-placement-page-style-contracts.js scripts/lib/style-coverage.test.js scripts/verify-prominent-actions.js
git commit -m "style: compose Digest event-first opening"
~~~

Expected: one green commit containing only the four allowlisted files.

### Task 3: Implement lower-page hierarchy and narrow evidence records

**Files:**

- Modify: scripts/lib/job-placement-page-style-contracts.js
- Modify: scripts/lib/style-coverage.test.js
- Modify: assets/imladris-pages.css

**Interfaces:**

- Consumes: hp-digest-editorial-split, hp-digest-section__body, and hp-digest-closing-zone from Task 1.
- Produces: DIGEST_LOWER_CONTRACTS plus wide heading/prose and closing grids, connected spacing, 16px phone card padding, and label-free narrow evidence records.

- [ ] **Step 1: Add failing lower-layout contracts**

Replace the empty DIGEST_LOWER_CONTRACTS array with:

~~~js
const DIGEST_LOWER_CONTRACTS = [
	{
		selector: '.hp-fit-ledger',
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--6)' },
	},
	{
		selector: '.hp-incident-card',
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--6)' },
	},
	{
		selector: '.hp-evidence-ledger',
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--6)' },
	},
	{
		selector: '.hp-digest-closing-zone',
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--9)' },
	},
	{
		selector: '.hp-digest-editorial-split',
		atContext: DIGEST_EDITORIAL_CONTEXT,
		declarations: {
			display: 'grid',
			'grid-template-columns': 'minmax(12rem, 0.7fr) minmax(0, 1.3fr)',
			gap: 'var(--wp--preset--spacing--8)',
			'align-items': 'start',
		},
	},
	{
		selector: '.hp-digest-closing-zone',
		atContext: DIGEST_EDITORIAL_CONTEXT,
		declarations: {
			display: 'grid',
			'grid-template-columns': 'repeat(2, minmax(0, 1fr))',
			gap: 'var(--wp--preset--spacing--6)',
			'align-items': 'start',
		},
	},
	{
		selector: '.hp-digest-section',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--7)' },
	},
	{
		selector: '.hp-fit-ledger',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--5)' },
	},
	{
		selector: '.hp-incident-card',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--5)' },
	},
	{
		selector: '.hp-evidence-ledger',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--5)' },
	},
	{
		selector: '.hp-digest-closing-zone',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--7)' },
	},
	{
		selector: '.hp-digest-closing-zone > .hp-digest-cta',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: { 'margin-block-start': 'var(--wp--preset--spacing--5) !important' },
	},
	{
		selector: '.hp-proof-cards > .hp-proof-card.is-style-hperkins-proof-card',
		atContext: DIGEST_PHONE_CONTEXT,
		declarations: { padding: 'var(--wp--preset--spacing--4)' },
	},
	{
		selector: '.hp-incident-card',
		atContext: DIGEST_PHONE_CONTEXT,
		declarations: { padding: 'var(--wp--preset--spacing--4)' },
	},
	{
		selector: '.wp-block-table.hp-evidence-table tbody tr',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: {
			display: 'grid',
			'grid-template-columns': 'repeat(2, minmax(0, 1fr))',
			gap: 'var(--wp--preset--spacing--2) var(--wp--preset--spacing--4)',
		},
	},
	{
		selector: '.wp-block-table.hp-evidence-table tbody td:nth-of-type(1)',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: {
			'grid-column': '2',
			'margin-block-start': '0',
			'text-align': 'end',
		},
	},
	{
		selector: '.wp-block-table.hp-evidence-table tbody td:nth-of-type(2)',
		atContext: DIGEST_NARROW_CONTEXT,
		declarations: {
			'grid-column': '1 / -1',
			'margin-block-start': '0',
			'padding-block-start': 'var(--wp--preset--spacing--2)',
		},
	},
	{
		selector: '.wp-block-table.hp-evidence-table tbody tr',
		atContext: DIGEST_PHONE_CONTEXT,
		declarations: { padding: 'var(--wp--preset--spacing--4)' },
	},
	{
		selector: '.wp-block-table.hp-evidence-table tbody tr',
		atContext: DIGEST_STACK_CONTEXT,
		declarations: { 'grid-template-columns': 'minmax(0, 1fr)' },
	},
	{
		selector: '.wp-block-table.hp-evidence-table tbody td:nth-of-type(1)',
		atContext: DIGEST_STACK_CONTEXT,
		declarations: {
			'grid-column': '1',
			'margin-block-start': 'var(--wp--preset--spacing--2)',
			'text-align': 'start',
		},
	},
];
~~~

Append this test in scripts/lib/style-coverage.test.js and import DIGEST_LOWER_CONTRACTS:

~~~js
test( 'Digest lower-page hierarchy and evidence records are declaration-pinned', () => {
	for ( const contract of DIGEST_LOWER_CONTRACTS ) {
		assert.doesNotThrow( () => assertRuleDeclarations( pagesCss, contract ) );
		for ( const [ property, expected ] of Object.entries( contract.declarations ) ) {
			const mutant = mutateDeclaration( pagesCss, contract, property, expected );
			assert.throws(
				() => assertRuleDeclarations( mutant, contract ),
				/Digest|hp-|margin|padding|grid|gap|align/
			);
		}
	}

	assert.doesNotMatch(
		pagesCss,
		/\.wp-block-table\.hp-evidence-table tbody td(?:\[[^\]]+\]|:[^{,\s]+)*::before/
	);
} );
~~~

- [ ] **Step 2: Run the lower-layout test and confirm the intended red state**

Run:

~~~powershell
node --test scripts/lib/style-coverage.test.js
~~~

Expected: FAIL because connected sections still inherit 64px, the wide editorial/closing grids are absent, proof-card phone padding is not 16px, and evidence records still render State and Direct evidence pseudo-labels.

- [ ] **Step 3: Add connected rhythm, editorial splits, and the closing zone**

After the existing .hp-digest-section and prose-measure rules in assets/imladris-pages.css, add:

~~~css
.hp-digest-section__body {
  min-inline-size: 0;
}

.hp-digest-section__body > :first-child {
  margin-block-start: 0;
}

.hp-digest-section__body > :last-child {
  margin-block-end: 0;
}

.hp-fit-ledger,
.hp-incident-card,
.hp-evidence-ledger {
  margin-block-start: var(--wp--preset--spacing--6);
}

.hp-digest-closing-zone {
  box-sizing: border-box;
  margin-block-start: var(--wp--preset--spacing--9);
  scroll-margin-block-start: calc(var(--hp-header-h-compact) + var(--wp--preset--spacing--4));
}

.hp-digest-closing-zone > :is(.hp-method-link, .hp-digest-cta) {
  min-inline-size: 0;
  margin: 0 !important;
}

@media (min-width: 1024px) {
  .hp-digest-editorial-split {
    display: grid;
    grid-template-columns: minmax(12rem, 0.7fr) minmax(0, 1.3fr);
    gap: var(--wp--preset--spacing--8);
    align-items: start;
  }

  .hp-digest-editorial-split > h2 {
    grid-column: 1;
    margin: 0;
  }

  .hp-digest-editorial-split > .hp-digest-section__body {
    grid-column: 2;
    grid-row: 1;
  }

  .hp-digest-closing-zone {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--wp--preset--spacing--6);
    align-items: start;
  }
}
~~~

Inside the existing 781px media block, add:

~~~css
  .hp-digest-section {
    margin-block-start: var(--wp--preset--spacing--7);
  }

  .hp-fit-ledger,
  .hp-incident-card,
  .hp-evidence-ledger {
    margin-block-start: var(--wp--preset--spacing--5);
  }

  .hp-digest-closing-zone {
    margin-block-start: var(--wp--preset--spacing--7);
  }

  .hp-digest-closing-zone > .hp-digest-cta {
    margin-block-start: var(--wp--preset--spacing--5) !important;
  }
~~~

Inside the existing 600px media block, add the higher-specificity proof-card selector to the 16px card-padding rule:

~~~css
  .hp-proof-cards > .hp-proof-card.is-style-hperkins-proof-card,
  .hp-incident-card,
  .hp-research-note,
  .wp-block-group.is-style-hperkins-incident-card,
  .wp-block-group.is-style-hperkins-research-note {
    padding: var(--wp--preset--spacing--4);
  }

  .wp-block-table.hp-evidence-table tbody tr {
    padding: var(--wp--preset--spacing--4);
  }
~~~

- [ ] **Step 4: Convert narrow evidence rows to compact metadata without visual labels**

In the existing 781px ledger block:

1. Remove .wp-block-table.hp-evidence-table tbody td::before from the shared pseudo-label selector.
2. Delete the two evidence-specific content rules for State and Direct evidence.
3. Remove the evidence state cell from the shared short-value label/value grid selector.
4. Add these rules after the shared cell reset:

~~~css
  .wp-block-table.hp-evidence-table tbody tr {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--wp--preset--spacing--2) var(--wp--preset--spacing--4);
  }

  .wp-block-table.hp-evidence-table tbody :is(th, td) {
    inline-size: auto;
  }

  .wp-block-table.hp-evidence-table tbody th {
    grid-column: 1;
  }

  .wp-block-table.hp-evidence-table tbody td:nth-of-type(1) {
    grid-column: 2;
    align-self: start;
    margin-block-start: 0;
    font-family: var(--wp--preset--font-family--mono);
    font-size: var(--wp--preset--font-size--xs);
    line-height: var(--wp--custom--leading--snug);
    text-align: end;
    color: var(--wp--custom--text--muted);
  }

  .wp-block-table.hp-evidence-table tbody td:nth-of-type(2) {
    grid-column: 1 / -1;
    margin-block-start: 0;
    padding-block-start: var(--wp--preset--spacing--2);
    border-block-start: 1px solid var(--wp--custom--border--hair);
  }
~~~

Inside the existing 359px media block, add:

~~~css
  .wp-block-table.hp-evidence-table tbody tr {
    grid-template-columns: minmax(0, 1fr);
  }

  .wp-block-table.hp-evidence-table tbody :is(th, td:nth-of-type(1), td:nth-of-type(2)) {
    grid-column: 1;
  }

  .wp-block-table.hp-evidence-table tbody td:nth-of-type(1) {
    margin-block-start: var(--wp--preset--spacing--2);
    text-align: start;
  }
~~~

Keep the evidence thead in the existing visually-hidden header group so column names remain in table semantics.

- [ ] **Step 5: Remove evidence from the repeated-label verifier**

Do not edit scripts/verify-job-placement-pages.js in this task; Task 4 owns that verifier atomically with its import/phase rewrite. Instead, the new style-coverage test already pins that the candidate CSS has no Digest evidence pseudo-label selector. Add this exact assertion to the same test after the DIGEST_LOWER_CONTRACTS loop:

~~~js
assert(
	!/\.wp-block-table\.hp-evidence-table tbody td(?:\[[^\]]+\]|:[^{,\s]+)*::before/.test( pageCss ),
	'The narrow Digest evidence register must not repeat State or Direct evidence labels in every row.'
);
~~~

- [ ] **Step 6: Prove lower-layout declarations and source containment**

Run:

~~~powershell
node --test scripts/lib/style-coverage.test.js
node scripts/verify-job-placement-digest-source.js
node scripts/verify-prominent-actions.js --source-only --drafts
git diff --check
~~~

Expected: all listed commands pass; all twelve evidence rows remain in the draft; no pseudo-label contract remains for the Digest evidence table.

- [ ] **Step 7: Commit the lower-page layout**

~~~powershell
git add assets/imladris-pages.css scripts/lib/job-placement-page-style-contracts.js scripts/lib/style-coverage.test.js
git commit -m "style: clarify Digest proof hierarchy"
~~~

Expected: one green commit containing only the three allowlisted files.

### Task 4: Extend phase-aware rendered acceptance

**Files:**

- Modify: scripts/verify-job-placement-pages.js
- Modify: scripts/lib/page-phase-contract.test.js
- Modify: scripts/verify-prominent-actions.js only if a rendered assertion needs to use the event rail’s one-column geometry already established in source.

**Interfaces:**

- Consumes: all source classes and DIGEST_OPENING_CONTRACTS, DIGEST_COMPACT_CONTRACTS, and DIGEST_LOWER_CONTRACTS.
- Produces: event-first source derivation, the complete viewport matrix, event/evidence fragment activation, and geometry objects consumed by assertPageMetrics().

- [ ] **Step 1: Write the failing phase/probe-shape unit test**

Replace the old hero-query test in scripts/lib/page-phase-contract.test.js with:

~~~js
test( 'rendered recruiter probes keep snapshot and event-first draft phases distinct', () => {
	const recruiter = fs.readFileSync(
		path.join( themeRoot, 'scripts', 'verify-job-placement-pages.js' ),
		'utf8'
	);
	assert.match( recruiter, /requireEventFirst: USE_DRAFTS/ );
	assert.match( recruiter, /if \( requireEventFirst \)/ );
	assert.match( recruiter, /document\.querySelector\('main \.hp-wcus-callout'\)/ );
	assert.match( recruiter, /primaryRail\.closest\('\.hp-wcus-callout'\)/ );
	assert.doesNotMatch( recruiter, /hero\?\.querySelector\('\.hp-wcus-callout'\)/ );
	assert.match( recruiter, /evidenceFragment/ );
	assert.match( recruiter, /zoom-200-from-1024/ );

	const prominent = fs.readFileSync(
		path.join( themeRoot, 'scripts', 'verify-prominent-actions.js' ),
		'utf8'
	);
	assert.match( prominent, /\.wp-block-buttons\.hp-action-rail/ );
	assert.match( prominent, /\.hp-action-rail:not\(\.wp-block-buttons\)/ );
} );
~~~

- [ ] **Step 2: Run the probe-shape test and confirm the intended red state**

Run:

~~~powershell
node --test scripts/lib/page-phase-contract.test.js
~~~

Expected: FAIL because the verifier still queries the WordCamp panel through the hero and has no candidate-only event-first branch, evidence fragment probe, or zoom-equivalent viewport.

- [ ] **Step 3: Make source expectation derivation phase-aware**

Update the style-contract import:

~~~js
const {
	DIGEST_COMPACT_CONTRACTS,
	DIGEST_LOWER_CONTRACTS,
	DIGEST_OPENING_CONTRACTS,
} = require( './lib/job-placement-page-style-contracts' );
~~~

Then delete the temporary DIGEST_TABLET_CONTRACTS alias and export from scripts/lib/job-placement-page-style-contracts.js. Run:

~~~powershell
rg -n "DIGEST_TABLET_CONTRACTS" scripts
~~~

Expected: zero matches before continuing.

Add:

~~~js
const USE_DRAFTS = ARGV.includes( '--drafts' );
~~~

Change the expectation function signature and call:

~~~js
function deriveDigestExpectations( html, { requireEventFirst = false } = {} ) {
	const headings = findHeadings( html, 'selected Digest body' );
	const h1 = headings.find( ( heading ) => heading.level === 1 );
	const actionRails = findWpBlocksByClass( html, 'buttons', 'hp-action-rail' );
	const primaryRail = findWpBlocksByClass( html, 'buttons', 'hp-digest__primary-actions' )[ 0 ];
	const eyebrow = /<p\b[^>]*class="[^"]*\bhp-page-hero__eyebrow\b[^"]*"[^>]*>([\s\S]*?)<\/p>/g;
	const eyebrows = [ ...html.matchAll( eyebrow ) ];
	const wcusActions = findWpBlocksByClass( html, 'buttons', 'hp-wcus-callout__actions' )[ 0 ] || null;
	const rootCauseSection = /<section\b[^>]*\bid="root-cause-investigation"[^>]*>([\s\S]*?)<\/section>/i.exec( html );
	const topLevelBlocks = parseTopLevelBlocks( html );
	const hasBlockClass = ( block, className ) =>
		( block.attrs.className || '' ).split( /\s+/ ).includes( className );

	assert( h1, 'Selected Digest body has no H1.' );
	assert( primaryRail, 'Selected Digest body has no primary action rail.' );
	assert( actionRails.length >= 2, 'Selected Digest body has no closing action rail.' );
	assert( eyebrows.length > 0, 'Selected Digest body has no closing eyebrow.' );

	// Insert the phase branch shown in the next code block here, then preserve
	// the current proofLabels derivation and return object with eventFirst added.
}

const DIGEST_EXPECTATIONS = deriveDigestExpectations(
	read( DIGEST_SOURCE ),
	{ requireEventFirst: USE_DRAFTS }
);
~~~

Inside deriveDigestExpectations(), replace the current hero-containment assertions with:

~~~js
const eventIndex = topLevelBlocks.findIndex( ( block ) => hasBlockClass( block, 'hp-wcus-callout' ) );
const heroIndex = topLevelBlocks.findIndex( ( block ) => hasBlockClass( block, 'hp-digest__hero' ) );
const whyIndex = topLevelBlocks.findIndex( ( block ) => block.attrs.anchor === 'why-support-engineer-now' );

if ( requireEventFirst ) {
	const event = topLevelBlocks[ eventIndex ];
	assert( eventIndex === 0, 'Selected Digest body must begin with the WordCamp aside.' );
	assert( heroIndex === 1, 'Selected Digest hero must immediately follow the WordCamp aside.' );
	assert( whyIndex === 2, 'Why Support Engineer now must immediately follow the Digest hero.' );
	assert( event.attrs.tagName === 'aside', 'Selected Digest WordCamp Group must serialize as an aside.' );
	assert(
		event.attrs.ariaLabel === 'I’ll be at WordCamp US.',
		'Selected Digest WordCamp aside has the wrong accessible name.'
	);
	assert(
		getClassCount( event.outer, 'hp-digest__primary-actions' ) === 1,
		'Selected Digest WordCamp aside must own the first-screen action rail.'
	);
	assert(
		getClassCount( topLevelBlocks[ heroIndex ].outer, 'hp-digest__primary-actions' ) === 0,
		'Selected Digest hero must not repeat event actions.'
	);
} else {
	assert( heroIndex !== -1, 'Accepted Digest snapshot must contain its current hero.' );
	assert(
		getClassCount( topLevelBlocks[ heroIndex ].outer, 'hp-wcus-callout' ) === 1 &&
			getClassCount( topLevelBlocks[ heroIndex ].outer, 'hp-digest__primary-actions' ) === 1,
		'Accepted Digest snapshot must retain its current hero-contained WordCamp panel.'
	);
	assert( whyIndex === heroIndex + 1, 'Accepted Digest snapshot has the wrong section order.' );
}
assert( wcusActions, 'Selected Digest WordCamp aside has no .hp-wcus-callout__actions.' );
assert( rootCauseSection, 'Selected Digest body has no #root-cause-investigation section.' );
~~~

Keep the surrounding h1, primaryRail, actionRails, eyebrow, exact action-copy, closing-copy, and proof-label derivation unchanged.

Add eventFirst: requireEventFirst to the returned expectation object:

~~~js
return {
	eventFirst: requireEventFirst,
	h1: h1.text,
	primaryActions: findLinks( primaryRail, 'selected Digest primary actions' ),
	closingActions: findLinks( actionRails.at( -1 ), 'selected Digest closing actions' ),
	closingEyebrow: extractExactText(
		eyebrows.at( -1 )[ 1 ],
		{ label: 'selected Digest closing eyebrow' }
	),
	closingHeading: headings.filter( ( heading ) => heading.level === 2 ).at( -1 ).text,
	wcusActions: findLinks( wcusActions, 'selected Digest WCUS actions' ),
	proofLabels,
};
~~~

This allows the same script to keep the accepted snapshot/public phase green while --drafts enforces the approved candidate.

Because scripts/verify-job-placement-pages.js source-only now enforces candidate-only CSS in --drafts mode, run that command immediately after completing the Task 4 source branch; it is the green proof that the temporary compatibility alias can be removed safely.

In verifySourceContracts(), replace the old direct WordCamp contracts and DIGEST_TABLET_CONTRACTS spread with:

~~~js
if ( DIGEST_EXPECTATIONS.eventFirst ) {
	for ( const contract of [
		...DIGEST_OPENING_CONTRACTS,
		...DIGEST_COMPACT_CONTRACTS,
		...DIGEST_LOWER_CONTRACTS,
	] ) {
		assertRuleDeclarations( pageCss, contract );
	}
} else {
	assertRuleDeclarations( pageCss, {
		selector: '.hp-wcus-callout',
		declarations: {
			padding: 'var(--wp--preset--spacing--6)',
			'border-inline-start': '0.25rem solid var(--wp--preset--color--gold-600)',
		},
	} );
}
~~~

Keep the accepted snapshot’s source semantics derived from its unchanged markup; do not make the default phase require hp-digest-editorial-split or hp-digest-closing-zone.

In verifyStackedLedgerLabels():

- Remove the evidence header read.
- Remove the two hp-evidence-table entries from the contract array.
- Update the function comment so it says the appendix ledgers repeat selected column labels, while the Digest evidence register keeps its visually hidden header and uses a title/state metadata row without pseudo-labels.
- Add this assertion after the contract loop:

~~~js
assert(
	!/\.wp-block-table\.hp-evidence-table tbody td(?:\[[^\]]+\]|:[^{,\s]+)*::before/.test( pageCss ),
	'The narrow Digest evidence register must not repeat State or Direct evidence labels in every row.'
);
~~~

This assertion is safe in both phases because it verifies CSS presentation, while the accepted snapshot’s table header remains in semantic markup and the live body is not mutated.

- [ ] **Step 4: Replace the viewport list with page-specific matrices**

Use:

~~~js
const DIGEST_VIEWPORTS = [
	{ name: 'desktop-1440', width: 1440, height: 1000, mobile: false },
	{ name: 'desktop-1024', width: 1024, height: 1000, mobile: false },
	{ name: 'compact-upper-1023', width: 1023, height: 1000, mobile: false },
	{ name: 'event-wide-782', width: 782, height: 1000, mobile: false },
	{ name: 'event-linear-781', width: 781, height: 1000, mobile: true },
	{ name: 'tablet-768', width: 768, height: 1000, mobile: true },
	{ name: 'phone-boundary-600', width: 600, height: 1000, mobile: true },
	{ name: 'mobile-390', width: 390, height: 1000, mobile: true },
	{ name: 'mobile-320', width: 320, height: 1000, mobile: true },
	{ name: 'zoom-200-from-1024', width: 512, height: 500, mobile: false, zoomPercent: 200 },
];

const APPENDIX_VIEWPORTS = [
	{ name: 'desktop-1440', width: 1440, height: 1000, mobile: false },
	{ name: 'desktop-1024', width: 1024, height: 1000, mobile: false },
	{ name: 'tablet-768', width: 768, height: 1000, mobile: true },
	{ name: 'mobile-390', width: 390, height: 1000, mobile: true },
	{ name: 'mobile-320', width: 320, height: 1000, mobile: true },
];

const PAGES = [
	{
		name: 'digest',
		route: '/job-placement-digest/',
		h1: DIGEST_EXPECTATIONS.h1,
		viewports: DIGEST_VIEWPORTS,
	},
	{
		name: 'appendix',
		route: '/placement-method-and-evidence/',
		h1: 'Placement Method and Evidence',
		viewports: APPENDIX_VIEWPORTS,
	},
];
~~~

Add viewports to each PAGES entry and change the nested loop to:

~~~js
for ( const page of PAGES ) {
	for ( const viewport of page.viewports ) {
		const result = await inspectPage( cdp, page, viewport );
		assertPageMetrics( result, page, viewport );
	}
}
~~~

In Emulation.setDeviceMetricsOverride use mobile: viewport.mobile, not a width-derived value.

- [ ] **Step 5: Return event, hierarchy, evidence, and focus-order geometry**

Inside the inspectPage() browser expression, query the event at top level rather than through the hero:

~~~js
const hero = document.querySelector('.hp-digest__hero');
const wcus = document.querySelector('main .hp-wcus-callout');
const wcusCopy = wcus?.querySelector('.hp-wcus-callout__copy');
const wcusActionsRoot = wcus?.querySelector('.hp-wcus-callout__actions');
const why = document.getElementById('why-support-engineer-now');
const editorialSplits = Array.from(document.querySelectorAll('.hp-digest-editorial-split'));
const proofCards = Array.from(document.querySelectorAll('.hp-proof-cards > .hp-proof-card'));
const debugProofItems = Array.from(document.querySelectorAll('#root-cause-investigation .hp-debug-proof__item'));
const closingZone = document.querySelector('.hp-digest-closing-zone');
const method = closingZone?.querySelector('.hp-method-link');
const closingPanel = closingZone?.querySelector('.hp-digest-cta');
const firstEvidenceRow = document.querySelector('.hp-evidence-table tbody tr');
const eventLinks = Array.from(wcusActionsRoot?.querySelectorAll('a') || []);
const focusables = Array.from(document.querySelectorAll('main a[href], main button:not([disabled]), main summary'))
	.filter(isVisible);
const contentRoot = document.querySelector('main .wp-block-post-content') || document.querySelector('main');
~~~

Define rect() beside round():

~~~js
const rect = (element) => {
	if (!element) {
		return null;
	}
	const bounds = element.getBoundingClientRect();
	return {
		left: round(bounds.left),
		right: round(bounds.right),
		top: round(bounds.top),
		bottom: round(bounds.bottom),
		width: round(bounds.width),
		height: round(bounds.height),
	};
};
~~~

Return these exact structures alongside the existing metrics:

~~~js
eventLandmark: wcus ? {
	tagName: wcus.tagName,
	ariaLabel: wcus.getAttribute('aria-label'),
	title: wcus.querySelector('.hp-wcus-callout__title')?.textContent.trim() || null,
	beforeH1: !!(wcus.compareDocumentPosition(document.querySelector('h1')) & Node.DOCUMENT_POSITION_FOLLOWING),
} : null,
mainOpening: Array.from(contentRoot?.children || [])
	.filter(isVisible)
	.slice(0, 3)
	.map((element) => {
		if (element.matches('.hp-wcus-callout')) return 'event';
		if (element.matches('.hp-digest__hero')) return 'hero';
		if (element.matches('#why-support-engineer-now')) return 'why';
		return element.className || element.tagName;
	}),
primaryActions: primaryRail ? {
	inHero: !!primaryRail.closest('.hp-digest__hero'),
	inEvent: !!primaryRail.closest('.hp-wcus-callout'),
	top: round(primaryRect.top),
	bottom: round(primaryRect.bottom),
	actions: actions(primaryRail),
	focusIndexes: eventLinks.map((link) => focusables.indexOf(link)),
} : null,
wcus: wcusActionsRoot ? {
	callout: rect(wcus),
	copy: rect(wcusCopy),
	rail: rect(wcusActionsRoot),
	actions: actions(wcusActionsRoot),
} : null,
opening: {
	hero: rect(hero),
	why: rect(why),
},
editorialSplits: editorialSplits.map((section) => ({
	heading: rect(section.querySelector(':scope > h2')),
	body: rect(section.querySelector(':scope > .hp-digest-section__body')),
})),
proofCards: proofCards.map((card) => rect(card)),
debugProofItems: debugProofItems.map((item) => ({
	label: item.querySelector('dt')?.textContent.trim() || '',
	...rect(item),
})),
closingZone: closingZone ? {
	method: rect(method),
	panel: rect(closingPanel),
} : null,
evidenceRecord: firstEvidenceRow ? {
	title: rect(firstEvidenceRow.querySelector('th')),
	state: rect(firstEvidenceRow.querySelector('td:nth-of-type(1)')),
	directEvidence: rect(firstEvidenceRow.querySelector('td:nth-of-type(2)')),
} : null,
~~~

wp:post-content may render an extra wrapper in one environment and direct children in another, so contentRoot uses the exact post-content-or-main fallback before asserting the first three content blocks.

- [ ] **Step 6: Assert the candidate’s event-first opening at every topology**

Wrap the candidate-only opening, lower-layout, evidence-fragment, and zoom assertions in:

~~~js
if ( DIGEST_EXPECTATIONS.eventFirst ) {
	// Candidate-only assertions shown below.
}
~~~

Keep the existing accepted-snapshot/public assertions in an else branch, using primaryActions.inHero and the current three-horizontal-action geometry, so node scripts/verify-job-placement-pages.js --source-only continues to validate the unchanged production mirror. Replace the candidate branch’s old inHero and three-horizontal-action assertions with:

~~~js
assert( result.eventLandmark, context + ' is missing the WordCamp complementary landmark.' );
assert( result.eventLandmark.tagName === 'ASIDE', context + ' does not render WordCamp as an aside.' );
assert(
	result.eventLandmark.ariaLabel === 'I’ll be at WordCamp US.',
	context + ' renders the wrong WordCamp accessible name.'
);
assert(
	result.eventLandmark.title === result.eventLandmark.ariaLabel,
	context + ' does not keep the visible event title and accessible name identical.'
);
assert( result.eventLandmark.beforeH1, context + ' does not put the WordCamp landmark before the H1.' );
assert(
	result.mainOpening.join( '|' ) === 'event|hero|why',
	context + ' does not keep event, hero, and role argument in one visual/source order.'
);
assert( result.primaryActions.inEvent, context + ' first-screen actions are outside the WordCamp landmark.' );
assert( result.primaryActions.top >= -1, context + ' first-screen actions begin above the viewport.' );
if ( viewport.width >= 768 ) {
	assert(
		result.primaryActions.bottom <= viewport.height + 1,
		context + ' first-screen actions do not clear the fixed verification fold.'
	);
}
assert(
	result.primaryActions.focusIndexes.join( '|' ) === '0|1|2',
	context + ' changes the first three keyboard stops from the approved event action order.'
);

for ( let index = 1; index < result.wcus.actions.length; index++ ) {
	assert(
		result.wcus.actions[ index ].top >= result.wcus.actions[ index - 1 ].bottom - 1,
		context + ' does not keep the event action rail vertical.'
	);
}

if ( viewport.width >= 782 ) {
	assert(
		result.wcus.copy.right <= result.wcus.rail.left + 2,
		context + ' does not render event copy left of the action rail.'
	);
} else {
	assert(
		result.wcus.rail.top >= result.wcus.copy.bottom - 1,
		context + ' does not stack event actions after event copy.'
	);
	for ( const action of result.wcus.actions ) {
		assert(
			action.width >= result.wcus.rail.width - 12,
			context + ' contains an event action that does not fill its row.'
		);
	}
}

if ( viewport.width === 1024 && ! viewport.zoomPercent ) {
	assert(
		result.opening.hero.bottom <= viewport.height + 1,
		context + ' does not keep the complete role proposition in the first 1000px.'
	);
	assert(
		result.opening.why.top <= viewport.height + 64,
		context + ' does not begin Why Support Engineer now near the 1024x1000 fold.'
	);
}

if ( viewport.zoomPercent === 200 ) {
	assert(
		result.wcus.rail.top >= result.wcus.copy.bottom - 1,
		context + ' keeps compressed columns in the 200% zoom-equivalent reflow.'
	);
	assert(
		result.scrollWidth <= result.clientWidth + 1,
		context + ' overflows in the 200% zoom-equivalent reflow.'
	);
}
~~~

- [ ] **Step 7: Assert lower-page geometry**

Add:

~~~js
if ( viewport.width >= 1024 ) {
	for ( const split of result.editorialSplits ) {
		assert( split.heading.right <= split.body.left + 2, context + ' loses an editorial heading rail.' );
	}
	assert( result.proofCards.length === 3, context + ' does not render three proof cards.' );
	assert(
		result.proofCards.every( ( card ) => Math.abs( card.top - result.proofCards[ 0 ].top ) <= 2 ),
		context + ' does not keep the proof cards in one row.'
	);
	for ( let index = 1; index < result.proofCards.length; index++ ) {
		const gap = result.proofCards[ index ].left - result.proofCards[ index - 1 ].right;
		assert(
			Math.abs( gap - 16 ) <= 2,
			context + ' does not keep a 16px gap between proof cards.'
		);
	}
	assert(
		result.closingZone.method.right <= result.closingZone.panel.left + 2,
		context + ' does not render the method and invitation as a two-column close.'
	);
	assert(
		Math.abs( result.debugProofItems[ 0 ].top - result.debugProofItems[ 1 ].top ) <= 2 &&
			Math.abs( result.debugProofItems[ 2 ].top - result.debugProofItems[ 3 ].top ) <= 2 &&
			result.debugProofItems[ 2 ].top >= result.debugProofItems[ 0 ].bottom - 1,
		context + ' does not keep Signal, Diagnosis, Constraint, and Result in a 2x2 grid.'
	);
} else {
	for ( const split of result.editorialSplits ) {
		assert(
			split.body.top >= split.heading.bottom - 1,
			context + ' does not return an editorial split to semantic linear order.'
		);
	}
	assert(
		result.closingZone.panel.top >= result.closingZone.method.bottom - 1,
		context + ' does not stack the final invitation after the method.'
	);
}

if ( viewport.width === 390 ) {
	assert(
		Math.abs( result.evidenceRecord.title.top - result.evidenceRecord.state.top ) <= 24,
		context + ' does not keep title and state in one compact evidence metadata row.'
	);
	assert(
		result.evidenceRecord.directEvidence.top >=
			Math.min( result.evidenceRecord.title.bottom, result.evidenceRecord.state.bottom ) - 1,
		context + ' does not place direct evidence after title and state.'
	);
}

if ( viewport.width === 320 ) {
	assert(
		result.evidenceRecord.state.top >= result.evidenceRecord.title.bottom - 1 &&
			result.evidenceRecord.directEvidence.top >= result.evidenceRecord.state.bottom - 1,
		context + ' does not stack title, state, and direct evidence at 320px.'
	);
}
~~~

- [ ] **Step 8: Exercise the evidence action through keyboard activation**

Inside if ( DIGEST_EXPECTATIONS.eventFirst ), after the existing root-cause fragment probe, reset the hash, focus .hp-wcus-callout__actions a[href="#evidence-register"], activate Enter with pressKey(), wait 100ms, and return:

~~~js
const outlineBeforeEvidence = await evaluate(
	cdp,
	sessionId,
	"Array.from(document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6')).map((heading) => heading.tagName + '|' + heading.textContent.trim().replace(/\\s+/g, ' ')).join('\\n')"
);
metrics.evidenceFragment = await evaluate( cdp, sessionId, '(() => {' +
	"const target = document.getElementById('evidence-register');" +
	"const header = document.querySelector('header.wp-block-template-part');" +
	'return {' +
		'hash: location.hash,' +
		'focused: document.activeElement === target,' +
		"tabindex: target?.getAttribute('tabindex') || null," +
		'targetTop: target?.getBoundingClientRect().top ?? null,' +
		'headerBottom: header?.getBoundingClientRect().bottom ?? null,' +
	'};' +
'})()' );
const outlineAfterEvidence = await evaluate(
	cdp,
	sessionId,
	"Array.from(document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6')).map((heading) => heading.tagName + '|' + heading.textContent.trim().replace(/\\s+/g, ' ')).join('\\n')"
);
metrics.evidenceFragment.headingOutlineUnchanged =
	outlineBeforeEvidence === outlineAfterEvidence;
~~~

Use these assertions:

~~~js
assert( result.evidenceFragment.hash === '#evidence-register', context + ' did not activate the evidence fragment.' );
assert( result.evidenceFragment.focused, context + ' did not focus the evidence register.' );
assert( result.evidenceFragment.tabindex === '-1', context + ' made evidence fragment focus persistent.' );
assert( result.evidenceFragment.headingOutlineUnchanged, context + ' changed the heading outline during evidence focus.' );
assert(
	result.evidenceFragment.targetTop >= result.evidenceFragment.headerBottom - 1 &&
		result.evidenceFragment.targetTop < viewport.height,
	context + ' did not scroll the evidence register clear of the sticky header.'
);
~~~

- [ ] **Step 9: Run phase-aware source acceptance and preserve the rendered mutation gate**

Run:

~~~powershell
node --test scripts/lib/page-phase-contract.test.js scripts/lib/style-coverage.test.js
node scripts/verify-job-placement-pages.js --source-only
node scripts/verify-job-placement-pages.js --source-only --drafts
node scripts/verify-prominent-actions.js --source-only
node scripts/verify-prominent-actions.js --source-only --drafts
~~~

Expected: the unit and both snapshot/draft source-only commands pass. Do not run rendered draft acceptance yet: Task 5 owns the explicit matched-local mutation gate and the first valid browser proof of the candidate.

- [ ] **Step 10: Commit the rendered contract**

~~~powershell
git add scripts/verify-job-placement-pages.js scripts/lib/page-phase-contract.test.js scripts/lib/job-placement-page-style-contracts.js
git commit -m "test: verify Digest event-first layout"
~~~

Expected: the three allowlisted files include removal of the temporary style-contract compatibility alias; source-only acceptance remains green; rendered candidate acceptance is intentionally deferred until Task 5 applies the candidate locally. Do not modify scripts/verify-prominent-actions.js here unless a new failing test demonstrates a missing rendered behavior not already covered by its Task 2 source branch.

### Task 5: Apply only to the matching local site and complete bounded visual proof

**Files:**

- Read and mutate local WordPress post_content through: scripts/apply-local-page-drafts.js
- Capture ignored local artifacts under: .cache/job-placement-digest-event-banner/
- Potentially modify after one inspection batch: content/page-drafts/job-placement-digest.html, assets/imladris-pages.css, and focused verifier files only.
- Verify unchanged: content/page-snapshots/job-placement-digest.html

**Interfaces:**

- Consumes: the reviewed candidate and all source/rendered contracts from Tasks 1–4.
- Produces: matched-local database proof, full responsive acceptance, one bounded screenshot review, one detector report, and a clean scoped diff.

- [ ] **Step 1: Configure and prove the local site identity without writing**

Run:

~~~powershell
$env:HPERKINS_WP_PATH = Join-Path $env:USERPROFILE 'Studio\hperkins-tokens-dev'
$env:HPERKINS_WP_CLI_PHAR = "$env:USERPROFILE\.local\bin\wp-cli.phar"
$env:HPERKINS_ORIGIN = (& studio wp option get home --path $env:HPERKINS_WP_PATH).Trim()
studio wp core version --path $env:HPERKINS_WP_PATH
studio wp theme list --path $env:HPERKINS_WP_PATH
studio wp option get home --path $env:HPERKINS_WP_PATH
Write-Output $env:HPERKINS_ORIGIN
~~~

Expected: the two printed URLs match exactly, the path is C:\Users\htper\Studio\hperkins-tokens-dev, hperkins-tokens is active, and the origin is local rather than hperkins.blog.

- [ ] **Step 2: Pause at the local-database mutation gate**

Report the matched HPERKINS_WP_PATH and HPERKINS_ORIGIN and obtain explicit confirmation to apply only the job-placement-digest candidate. Do not infer this local mutation from approval of the design, plan, source edits, or Git commits.

- [ ] **Step 3: Apply only the Digest candidate after confirmation**

Run:

~~~powershell
node scripts/apply-local-page-drafts.js --confirm-local --page=job-placement-digest
~~~

Expected: the guarded script reports one local Digest page update. It must not update About or any production URL.

- [ ] **Step 4: Run the full rendered matrix and prominent-action proof**

Run:

~~~powershell
$env:HPERKINS_CAPTURE_DIR = Join-Path (Get-Location) '.cache\job-placement-digest-event-banner'
node scripts/verify-job-placement-pages.js --drafts
node scripts/verify-prominent-actions.js --drafts
~~~

Expected:

- 1440 and 1024 render event copy left and a vertical action rail right.
- 782 remains two-column; 781, 768, 600, 390, 320, and the 200% zoom-equivalent probe are linear.
- The 1024 hero ends within 1000px and Why Support Engineer now begins by 1064px.
- One H1 remains the first heading; the labelled ASIDE precedes it.
- All action targets are at least 44px; event focus order is 0, 1, 2.
- The evidence action focuses #evidence-register with sticky-header clearance.
- Wide editorial splits, three proof cards, the 2x2 debugging grid, and two-column close hold.
- At 390 evidence title/state share a compact metadata row; at 320 title/state/evidence stack.
- Every tested width has no document overflow and reduced motion remains clean.

- [ ] **Step 5: Add a focused browser-font-size stress probe**

In inspectPage(), after normal candidate metrics and before reduced-motion emulation, run this only for the 1024px Digest candidate:

~~~js
if (
	page.name === 'digest' &&
	DIGEST_EXPECTATIONS.eventFirst &&
	viewport.width === 1024 &&
	! viewport.zoomPercent
) {
	await evaluate( cdp, sessionId, "document.documentElement.style.fontSize = '200%'" );
	await wait( 50 );
	metrics.textResize200 = await evaluate( cdp, sessionId, '(() => {' +
		'const root = document.documentElement;' +
		"const actions = Array.from(document.querySelectorAll('.hp-wcus-callout__actions .wp-block-button__link'));" +
		'return {' +
			'clientWidth: root.clientWidth,' +
			'scrollWidth: Math.max(root.scrollWidth, document.body.scrollWidth),' +
			'actionsContained: actions.every((link) => {' +
				'const box = link.getBoundingClientRect();' +
				'const range = document.createRange();' +
				'range.selectNodeContents(link);' +
				'return Array.from(range.getClientRects()).every((rect) => rect.left >= box.left - 1 && rect.right <= box.right + 1);' +
			'}),' +
		'};' +
	'})()' );
}
~~~

Assert:

~~~js
if ( result.textResize200 ) {
	assert(
		result.textResize200.scrollWidth <= result.textResize200.clientWidth + 1,
		context + ' overflows when root text is resized to 200%.'
	);
	assert(
		result.textResize200.actionsContained,
		context + ' clips an event action when root text is resized to 200%.'
	);
}
~~~

This supplements the 512 CSS-pixel browser-zoom reflow proxy with a stricter 200% text-resize containment stress.

- [ ] **Step 6: Rerun rendered acceptance with the text-resize probe**

Run:

~~~powershell
node scripts/verify-job-placement-pages.js --drafts
~~~

Expected: the full matrix still passes, including the 1024px 200% root-text containment probe.

- [ ] **Step 7: Perform one combined desktop/mobile visual inspection**

verify-job-placement-pages.js does not capture images; verify-prominent-actions.js does. Inspect these generated full-page captures as one review batch:

~~~text
.cache/job-placement-digest-event-banner/job-placement-digest-desktop.png
.cache/job-placement-digest-event-banner/job-placement-digest-mobile-390.png
~~~

Check the opening hierarchy, banner-to-hero rhythm, event rail wrapping, proof-card density, debugging grid, evidence records, and closing balance. Record all material corrections before editing.

- [ ] **Step 8: Apply one correction batch and at most one confirmation inspection**

If the inspection found a material issue, use apply_patch for one grouped source/CSS correction, rerun:

~~~powershell
node --test scripts/lib/job-placement-digest-source-contract.test.js scripts/lib/style-coverage.test.js scripts/lib/page-phase-contract.test.js
node scripts/verify-job-placement-digest-source.js
node scripts/verify-job-placement-pages.js --source-only --drafts
node scripts/verify-prominent-actions.js --source-only --drafts
node scripts/apply-local-page-drafts.js --confirm-local --page=job-placement-digest
node scripts/verify-job-placement-pages.js --drafts
node scripts/verify-prominent-actions.js --drafts
~~~

Inspect the same two screenshots once more. Do not begin a third visual cycle. If no material issue was found in Step 7, skip this correction step without changing source.

- [ ] **Step 9: Run the Impeccable layout detector exactly once**

Run:

~~~powershell
node C:\Users\htper\.agents\skills\impeccable\scripts\detect.mjs --json --scope layout content/page-drafts/job-placement-digest.html assets/imladris-pages.css
~~~

Expected: zero unexplained layout findings. If the detector reports a real issue, correct the scoped source and rerun the focused Node checks; do not run the detector a second time. Document any advisory intentionally preserved by the approved design.

- [ ] **Step 10: Run final focused verification and prove publication boundaries**

Run:

~~~powershell
node --test scripts/lib/job-placement-digest-source-contract.test.js scripts/lib/style-coverage.test.js scripts/lib/page-phase-contract.test.js
node scripts/verify-job-placement-digest-source.js
node scripts/verify-job-placement-pages.js --source-only --drafts
node scripts/verify-prominent-actions.js --source-only --drafts
node scripts/verify-job-placement-pages.js --drafts
node scripts/verify-prominent-actions.js --drafts
git diff --exit-code -- content/page-snapshots/job-placement-digest.html
git diff --check
git status --short --branch
~~~

Expected: every focused check passes; the snapshot has no diff; only explicitly scoped implementation files are changed or the tree is clean after commits. No command in this task pushes, deploys, publishes, or exports a snapshot.

- [ ] **Step 11: Commit only visual-proof corrections, if any**

If Step 8 or Step 9 changed tracked source:

~~~powershell
git add content/page-drafts/job-placement-digest.html assets/imladris-pages.css scripts/verify-job-placement-digest-source.js scripts/verify-job-placement-pages.js scripts/verify-prominent-actions.js scripts/lib/job-placement-digest-source-contract.test.js scripts/lib/job-placement-page-style-contracts.js scripts/lib/style-coverage.test.js scripts/lib/page-phase-contract.test.js
git diff --cached --name-only
git commit -m "fix: harden Digest responsive layout"
~~~

Before committing, remove every unchanged path from the staging command so the staged-name list contains only files actually corrected in the bounded review. If no tracked source changed after Task 4, do not create an empty commit.

## Execution Handoff

Plan execution ends with a locally verified candidate branch. It does not include push, deployment, production publication, snapshot promotion, or public-runtime proof.

Two execution options:

1. **Subagent-Driven (recommended)** — use superpowers:subagent-driven-development, dispatch a fresh implementation agent per task, and run specification and code-quality review between tasks.
2. **Inline Execution** — use superpowers:executing-plans in this task, execute in batches, and stop at the documented review and local-mutation checkpoints.
