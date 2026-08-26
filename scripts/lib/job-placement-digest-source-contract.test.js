#!/usr/bin/env node

const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const test = require( 'node:test' );

const {
	verifyMain,
	verifyAppendix,
	visibleWordCount,
	classifyState,
	STATE_TOKENS,
	SECTIONS,
	APPENDIX_SECTIONS,
} = require( '../verify-job-placement-digest-source' );
const { parseTopLevelBlocks } = require( './about-page-contract' );
const { PLACEMENT_LEDGER_LABEL_CONTRACTS } = require( './job-placement-page-style-contracts' );
const { assertRuleDeclarations } = require( './style-coverage' );

const THEME_ROOT = path.join( __dirname, '..', '..' );
const DIGEST = fs.readFileSync(
	path.join( THEME_ROOT, 'content', 'page-drafts', 'job-placement-digest.html' ),
	'utf8'
).replace( /\r\n/g, '\n' );
const APPENDIX = fs.readFileSync(
	path.join( THEME_ROOT, 'content', 'page-drafts', 'placement-method-evidence.html' ),
	'utf8'
).replace( /\r\n/g, '\n' );
const FILTER_SCRIPT = fs.readFileSync(
	path.join( THEME_ROOT, 'assets', 'js', 'digest-register-filter.js' ),
	'utf8'
).replace( /\r\n/g, '\n' );
const PAGE_CSS = fs.readFileSync(
	path.join( THEME_ROOT, 'assets', 'imladris-pages.css' ),
	'utf8'
).replace( /\r\n/g, '\n' );
const CURRENT_PUBLICATION_DATELINE = 'Published 13 Jul 2026 · Last verified 26 Aug 2026';
const STALE_PUBLICATION_DATELINE = 'Published 13 Jul 2026 · Last verified 11 Aug 2026';

// This is the last complete event shape the transition verifier accepted. Keep
// it only as a negative fixture: adding the fully formed plate back to an
// otherwise valid dossier must fail the post-promotion, no-event contract.
const RETIRED_EVENT_PLATE = `<!-- wp:group {"tagName":"aside","ariaLabel":"I’ll be at WordCamp US.","align":"full","className":"hp-wcus-callout hp-wcus-callout--event-first hp-action-panel hp-placement-band hp-placement-band--event","layout":{"type":"default"},"anchor":"wordcamp-us-2026"} -->
<aside class="wp-block-group alignfull hp-wcus-callout hp-wcus-callout--event-first hp-action-panel hp-placement-band hp-placement-band--event" id="wordcamp-us-2026" aria-label="I’ll be at WordCamp US."><!-- wp:group {"className":"hp-placement-band__inner hp-wcus-callout__inner","layout":{"type":"default"}} -->
<div class="wp-block-group hp-placement-band__inner hp-wcus-callout__inner"><!-- wp:image {"sizeSlug":"full","linkDestination":"none","className":"hp-wcus-callout__figure"} -->
<figure class="wp-block-image size-full hp-wcus-callout__figure"><img src="/wp-content/themes/hperkins-tokens/assets/img/imagery/wcus-2026-phoenix.webp" alt="The West entrance of the Phoenix Convention Center at night, its glass doors dressed in WordCamp US 26 desert artwork under the illuminated building sign."/><figcaption class="wp-element-caption">Phoenix Convention Center, West entrance — WordCamp US 2026, 16–19 August. I’m staffing the Core AI booth.</figcaption></figure>
<!-- /wp:image -->

<!-- wp:group {"className":"hp-wcus-callout__copy","layout":{"type":"default"}} -->
<div class="wp-block-group hp-wcus-callout__copy"><!-- wp:heading {"className":"hp-wcus-callout__title"} -->
<h2 class="wp-block-heading hp-wcus-callout__title">I’ll be at WordCamp US.</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>I’ll be in Phoenix August 16–19, staffing the Core AI booth.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:buttons {"className":"hp-action-rail hp-wcus-callout__actions hp-digest__primary-actions","layout":{"type":"flex","flexWrap":"wrap"}} -->
<div class="wp-block-buttons hp-action-rail hp-wcus-callout__actions hp-digest__primary-actions"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="/contact/">Start a WordCamp conversation</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group --></aside>
<!-- /wp:group -->`;

function replaceOnce( value, search, replacement ) {
	assert.notEqual( value.indexOf( search ), -1, `Mutation fixture is missing: ${ search }` );
	return value.replace( search, replacement );
}

function removeClassEverywhere( value, className ) {
	const encoded = className.replaceAll( '--', '\\u002d\\u002d' );
	return value.replaceAll( ` ${ className }`, '' ).replaceAll( ` ${ encoded }`, '' );
}

function hasBlockClass( block, className ) {
	return ( block.attrs.className || '' ).split( /\s+/ ).includes( className );
}

function findBlock( value, className ) {
	return parseTopLevelBlocks( value ).find( ( block ) => hasBlockClass( block, className ) );
}

function insertAfterHero( value, block ) {
	const hero = findBlock( value, 'hp-digest__hero' );
	assert( hero, 'Fixture must contain the Digest hero.' );
	return `${ value.slice( 0, hero.end ) }\n\n${ block }${ value.slice( hero.end ) }`;
}

test( 'publishes the full dossier rather than a distilled brief', () => {
	const words = visibleWordCount( DIGEST );

	assert( words >= 850, `The dossier contains only ${ words } visible words; expected the full case.` );
	assert.doesNotThrow( () => verifyMain( DIGEST ) );
} );

test( 'opens on the H1 and orders hero, seven sections, closing invitation', () => {
	const blocks = parseTopLevelBlocks( DIGEST );

	assert.equal( blocks.length, 9 );
	assert( hasBlockClass( blocks[ 0 ], 'hp-digest__hero' ) );
	assert( hasBlockClass( blocks[ 8 ], 'hp-digest-cta' ) );
	assert( hasBlockClass( blocks[ 8 ], 'hp-action-panel' ) );
	assert( hasBlockClass( blocks[ 8 ], 'is-closing' ) );

	// The event plate used to hold the second slot and the only first-screen
	// action. Retiring it moved the rail into the hero rather than deleting it,
	// so the numbered argument now starts immediately after the hero.
	assert( hasBlockClass( blocks[ 1 ], 'hp-digest-section' ) );
	assert.equal( blocks[ 1 ].attrs.anchor, 'why-support-engineer-now' );
	assert.equal( [ ...blocks[ 0 ].outer.matchAll( /<div class="wp-block-buttons hp-action-rail">/g ) ].length, 1 );
	assert.match( blocks[ 0 ].outer, /href="\/contact\/">Start a conversation</ );

	// Every anchored section keeps its fragment, in the argued order.
	const anchors = blocks.map( ( block ) => block.attrs.anchor ).filter( Boolean );
	assert.deepEqual( anchors, [
		'why-support-engineer-now',
		'current-support-fit',
		'primary-proof',
		'root-cause-investigation',
		'theme-governance',
		'evidence-register',
		'appendix',
	] );
} );

test( 'numbers all seven sections and keeps the ordinals in step with their labels', () => {
	const numbers = [ ...DIGEST.matchAll( /<p class="hp-placement-part__number">(\d\d)<\/p>/g ) ];
	const kickers = [ ...DIGEST.matchAll( /<p class="hp-digest-kicker">([^<]+)<\/p>/g ) ];

	assert.equal( numbers.length, 7 );
	assert.equal( kickers.length, 7 );
	assert.deepEqual(
		numbers.map( ( number, index ) => [ number[ 1 ], kickers[ index ][ 1 ] ] ),
		SECTIONS.map( ( section ) => [ section.ordinal, section.label ] )
	);

	const mutant = replaceOnce( DIGEST, '<p class="hp-placement-part__number">04</p>', '<p class="hp-placement-part__number">05</p>' );
	assert.throws( () => verifyMain( mutant ), /Section 4 must use visual numeral 04/ );
} );

test( 'uses a two-column masthead whose contents plate reaches all seven parts', () => {
	const hero = findBlock( DIGEST, 'hp-digest__hero' );
	assert( hasBlockClass( hero, 'hp-placement-masthead' ) );
	assert( hasBlockClass( hero, 'hp-placement-masthead--digest' ) );
	assert.match( hero.outer, /class="wp-block-group hp-placement-masthead__main"/ );
	assert.match( hero.outer, /<nav\b[^>]*class="wp-block-group hp-placement-contents"[^>]*aria-label="Contents of this digest"/ );
	assert.deepEqual(
		[ ...hero.outer.matchAll( /<a href="(#[^"]+)">/g ) ].map( ( match ) => match[ 1 ] ),
		[ '#why-support-engineer-now', '#current-support-fit', '#primary-proof', '#root-cause-investigation', '#theme-governance', '#evidence-register', '#appendix' ]
	);
	assert.equal( [ ...hero.outer.matchAll( /Published 13 Jul 2026 · Last verified 26 Aug 2026/g ) ].length, 1 );

	const mutant = replaceOnce( DIGEST, 'class="wp-block-group hp-placement-contents"', 'class="wp-block-group hp-placement-index"' );
	assert.throws( () => verifyMain( mutant ), /one labelled contents plate/ );
} );

test( 'the retired candidate carries no event copy and keeps its first-screen action', () => {
	assert.doesNotMatch( DIGEST, /hp-wcus-callout/ );
	assert.doesNotMatch( DIGEST, /WordCamp|WCUS|wordcamp-us-2026/ );
	assert.doesNotThrow( () => verifyMain( DIGEST ) );

	// Removing the aside must not be a way to drop the call to action: the hero
	// has to have picked it up.
	const hero = parseTopLevelBlocks( DIGEST )[ 0 ];
	assert.match( hero.outer, /wp-block-buttons hp-action-rail/ );
	assert.equal( [ ...hero.outer.matchAll( /<!-- wp:button -->/g ) ].length, 1 );
	assert.throws(
		() => verifyMain( replaceOnce( DIGEST, '<div class="wp-block-buttons hp-action-rail">', '<div class="wp-block-buttons">' ) ),
		/first-screen action rail/
	);
} );

test( 'rejects the fully formed retired event plate if it is reintroduced', () => {
	assert.throws(
		() => verifyMain( insertAfterHero( DIGEST, RETIRED_EVENT_PLATE ), undefined, undefined, { requireEvent: false } ),
		/must contain 9 top-level blocks|Event-removal mode requires the WordCamp block to be absent/
	);
} );

test( 'holds five proven fit rows and states the gap outside the ledger', () => {
	assert.match( DIGEST, /<p class="hp-digest-gap"><strong>The gap, named<\/strong>/ );

	const fitTable = /hp-fit-table[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/.exec( DIGEST );
	assert( fitTable, 'The fit ledger must be a native table.' );
	assert.equal( [ ...fitTable[ 1 ].matchAll( /<tr>/g ) ].length, 5 );
	assert.doesNotMatch( fitTable[ 1 ], /gap/i );

	const mutant = replaceOnce(
		DIGEST,
		'<p class="hp-digest-gap"><strong>The gap, named</strong>',
		'<p class="hp-digest-note"><strong>The gap, named</strong>'
	);
	assert.throws( () => verifyMain( mutant ), /Expected one p\.hp-digest-gap element/ );
} );

test( 'publishes eleven current register records in their verified release states', () => {
	const body = /hp-evidence-table[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/.exec( DIGEST );
	const rows = [ ...body[ 1 ].matchAll( /<tr>([\s\S]*?)<\/tr>/g ) ];
	assert.equal( rows.length, 11 );

	const counts = { released: 0, open: 0, unreleased: 0 };
	for ( const row of rows ) {
		const state = /<td[^>]*>([\s\S]*?)<\/td>/.exec( row[ 1 ] )[ 1 ].replace( /<[^>]+>/g, '' );
		const group = classifyState( state );
		assert( group, `Register state is unclassifiable: ${ state }` );
		counts[ group ] += 1;
	}
	assert.deepEqual( counts, { released: 6, open: 3, unreleased: 2 } );
} );

test( 'keeps the Digest core/table schema-safe and its phone labels CSS-backed', () => {
	const body = /hp-evidence-table[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/.exec( DIGEST )[ 1 ];
	const rows = [ ...body.matchAll( /<tr>([\s\S]*?)<\/tr>/g ) ];
	assert.equal( rows.length, 11 );
	for ( const row of rows ) {
		assert.deepEqual( [ ...row[ 1 ].matchAll( /<(th|td)\b/g ) ].map( ( match ) => match[ 1 ] ), [ 'th', 'td', 'td' ] );
		assert.doesNotMatch( row[ 1 ], /\bdata-label=/ );
	}
	for ( const contract of PLACEMENT_LEDGER_LABEL_CONTRACTS.filter( ( contract ) => contract.selector.includes( 'hp-evidence-table' ) ) ) {
		assert.doesNotThrow( () => assertRuleDeclarations( PAGE_CSS, contract ) );
	}
} );

test( 'refuses a register row the filter script could not classify', () => {
	const mutant = replaceOnce( DIGEST, '<td>Authored · merged upstream</td>', '<td>Somewhere in progress</td>' );

	assert.throws( () => verifyMain( mutant ), /State the filter cannot classify/ );
} );

test( 'keeps the filter script state vocabulary identical to the verifier', () => {
	const script = fs.readFileSync(
		path.join( THEME_ROOT, 'assets', 'js', 'digest-register-filter.js' ),
		'utf8'
	);
	const block = /var STATE_TOKENS = \[([\s\S]*?)\];/.exec( script );
	assert( block, 'The register filter script must declare STATE_TOKENS.' );

	const scriptTokens = [ ...block[ 1 ].matchAll( /\[\s*'([^']+)'\s*,\s*'([^']+)'\s*\]/g ) ]
		.map( ( match ) => [ match[ 1 ], match[ 2 ] ] );

	assert.deepEqual( scriptTokens, STATE_TOKENS );

	// Ordering is load-bearing: a prerelease is not a release, and a branch
	// merged to main is not a shipped one.
	assert.equal( classifyState( 'Released owned work · prerelease' ), 'unreleased' );
	assert.equal( classifyState( 'Merged to owned main · unreleased' ), 'unreleased' );
	assert.equal( classifyState( 'Authored · merged upstream' ), 'released' );
	assert.equal( classifyState( 'Released owned work' ), 'released' );
} );

test( 'remounts filters after both router pushes and browser history traversal', () => {
	const script = fs.readFileSync(
		path.join( THEME_ROOT, 'assets', 'js', 'digest-register-filter.js' ),
		'utf8'
	);

	assert.match( script, /wrapHistory\( 'pushState' \)/ );
	assert.match( script, /window\.addEventListener\( 'popstate', settle \)/ );
} );

test( 'marks exactly the three records that are argued as proof cards above', () => {
	assert.equal( [ ...DIGEST.matchAll( /Primary proof · card above/g ) ].length, 3 );

	const mutant = replaceOnce(
		DIGEST,
		'<th scope="row">roadmaptrac</th>',
		'<th scope="row">roadmaptrac <strong>Primary proof · card above</strong></th>'
	);
	assert.throws( () => verifyMain( mutant ), /three records argued as proof cards/ );
} );

test( 'names what each incident artifact verifies, in the approved order', () => {
	const mutant = replaceOnce(
		DIGEST,
		'<p class="hp-artifact__verifies">Henry tested</p>',
		'<p class="hp-artifact__verifies">Henry authored</p>'
	);

	assert.throws( () => verifyMain( mutant ), /name what it verifies, in the approved order/ );
} );

test( 'keeps the request-log ownership split attribution-safe', () => {
	const mutant = replaceOnce(
		DIGEST,
		'I own the report and the integration testing; another contributor owns the fix.',
		'I own the report, the integration testing, and the fix.'
	);

	assert.throws( () => verifyMain( mutant ), /ownership split attribution-safe/ );
} );

test( 'requires the current publication-verification date', () => {
	assert( DIGEST.includes( CURRENT_PUBLICATION_DATELINE ) );
	const staleDate = replaceOnce( DIGEST, CURRENT_PUBLICATION_DATELINE, STALE_PUBLICATION_DATELINE );

	assert.throws( () => verifyMain( staleDate ), /missing required dossier copy: Published/ );
} );

test( 'rejects reintroduced recruiter-brief structure', () => {
	const marker = '<!-- wp:group {"tagName":"section","align":"wide","className":"hp-digest-section hp-fit-ledger hp-placement-section';
	const mutant = replaceOnce(
		DIGEST,
		marker,
		'<!-- wp:group {"tagName":"section","className":"hp-digest-section hp-digest-brief","anchor":"support-brief"} -->\n<section class="wp-block-group hp-digest-section hp-digest-brief" id="support-brief"></section>\n<!-- /wp:group -->\n\n' + marker
	);

	assert.throws( () => verifyMain( mutant ), /retired brief structure: hp-digest-brief/ );
} );

test( 'keeps the closing invitation last and its three actions intact', () => {
	const blocks = parseTopLevelBlocks( DIGEST );
	const closing = blocks[ blocks.length - 1 ];

	assert.equal( closing.attrs.tagName, 'section' );
	assert.match( closing.outer, /Contact Henry[\s\S]*View one-page résumé[\s\S]*Review selected WordPress evidence/ );

	const mutant = replaceOnce( DIGEST, 'href="#evidence-register">Review selected WordPress evidence', 'href="/work/">Review selected work' );
	assert.throws( () => verifyMain( mutant ), /contact, résumé, and the evidence register/ );
} );

test( 'never reintroduces a moving branch URL, stale Flavor release, or publication placeholder', () => {
	assert.doesNotMatch( DIGEST, /https:\/\/github\.com\/[^"'\s]+\/(?:blob|tree)\/(?:main|master)(?:[/#?]|$)/ );
	assert.match( DIGEST, /flavor-agent\/releases\/tag\/v0\.1\.0">Inspect final release v0\.1\.0/ );
	assert.doesNotMatch( DIGEST, /v0\.1\.0-rc\.3|Flavor Agent post-RC3 main/ );

	const mutant = replaceOnce(
		DIGEST,
		'https://github.com/henryperkins/hperkins-tokens/blob/c5dc3a1e5dea0d6fd922f15542ee2b2a799f4a29/theme.json',
		'https://github.com/henryperkins/hperkins-tokens/blob/main/theme.json'
	);
	assert.throws( () => verifyMain( mutant ), /moving GitHub branch URL/ );
} );

/* --------------------------------------------------------------------------
   Placement Method and Evidence appendix.

   The redesign merged three standing-scoped keyword tables into one filterable
   ledger and merged the market screen's Current state and Screen verdict into
   one State cell. Both merges move a fact that used to be carried by structure
   into a word inside the row, so these mutations check that the word is what
   the contract now depends on.
   ----------------------------------------------------------------------- */

test( 'the accepted appendix candidate satisfies its own contract', () => {
	assert.doesNotThrow( () => verifyAppendix( APPENDIX ) );
} );

test( 'opens the Method appendix with a back-link and verifier-backed audit plate', () => {
	const hero = parseTopLevelBlocks( APPENDIX )[ 0 ];
	assert( hasBlockClass( hero, 'hp-method-hero' ) );
	assert( hasBlockClass( hero, 'hp-placement-masthead' ) );
	assert( hasBlockClass( hero, 'hp-placement-masthead--method' ) );
	assert.match( hero.outer, /class="wp-block-group hp-placement-audit"/ );
	assert.match( hero.outer, /href="\/job-placement-digest\/">Back to the Job Placement Digest<\/a>/ );
	assert.deepEqual(
		[ ...hero.outer.matchAll( /class="hp-placement-audit__value">(\d+)<\/p>/g ) ].map( ( match ) => Number( match[ 1 ] ) ),
		[ 34, 20, 3 ]
	);
	assert.match( hero.outer, /Every row retained; delistings kept visible\./ );
	assert.doesNotMatch( hero.outer, /Every state dated/i );
	assert.doesNotMatch( hero.outer, /hp-method-scope/ );
} );

test( 'carries the four numbered kickers in order, each reaching its section', () => {
	const numbers = [ ...APPENDIX.matchAll( /<p class="hp-placement-part__number">(\d\d)<\/p>/g ) ];
	const kickers = [ ...APPENDIX.matchAll( /<p class="hp-digest-kicker">([^<]+)<\/p>/g ) ];
	assert.deepEqual(
		numbers.map( ( number, index ) => [ number[ 1 ], kickers[ index ][ 1 ] ] ),
		APPENDIX_SECTIONS.map( ( section ) => [ section.ordinal, section.label ] )
	);

	const mutant = replaceOnce( APPENDIX, '<p class="hp-digest-kicker">The application</p>', '<p class="hp-digest-kicker">The screen again</p>' );
	assert.throws( () => verifyAppendix( mutant ), /Appendix section 3 must label the move "The application"/ );
} );

test( 'keeps every keyword term and its standing in one ledger', () => {
	const mutant = replaceOnce( APPENDIX, 'SIEM / log analytics <strong>Gap</strong>', 'SIEM / log analytics <strong>Unclear</strong>' );
	assert.throws( () => verifyAppendix( mutant ), /the filter cannot classify/ );

	const recount = replaceOnce( APPENDIX, 'Python <strong>Gap</strong>', 'Python <strong>Partial</strong>' );
	assert.throws( () => verifyAppendix( recount ), /must hold 11 partial rows; found 12/ );
} );

test( 'shows the 10 / 11 / 13 standing distribution in three teaching tiles', () => {
	assert.equal( [ ...APPENDIX.matchAll( /<div class="[^"]*\bhp-placement-standing-tile\b[^"]*">/g ) ].length, 3 );
	assert.deepEqual(
		[ ...APPENDIX.matchAll( /class="hp-placement-standing-tile__count">(\d+)<\/span>/g ) ].map( ( match ) => Number( match[ 1 ] ) ),
		[ 10, 11, 13 ]
	);
} );

test( 'keeps Method core/table cells schema-safe and phone labels CSS-backed', () => {
	for ( const [ className, labels, expectedRows ] of [
		[ 'hp-keyword-table', [ 'Keyword', 'Posting signal', 'Evidence boundary' ], 34 ],
		[ 'hp-market-table', [ 'Job title', 'Company', 'Posting', 'Last checked', 'State', 'Reasoning' ], 20 ],
	] ) {
		const body = new RegExp( `${ className }[\\s\\S]*?<tbody>([\\s\\S]*?)<\\/tbody>` ).exec( APPENDIX )[ 1 ];
		const rows = [ ...body.matchAll( /<tr>([\s\S]*?)<\/tr>/g ) ];
		assert.equal( rows.length, expectedRows );
		for ( const row of rows ) {
			assert.equal( [ ...row[ 1 ].matchAll( /<(?:th|td)\b/g ) ].length, labels.length );
			assert.doesNotMatch( row[ 1 ], /\bdata-label=/ );
		}
		for ( const contract of PLACEMENT_LEDGER_LABEL_CONTRACTS.filter( ( contract ) => contract.selector.includes( className ) ) ) {
			assert.doesNotThrow( () => assertRuleDeclarations( PAGE_CSS, contract ) );
		}
	}
} );

test( 'configures the keyword ledger demonstrated-first while keeping All terms last', () => {
	const ledger = /root: '\.hp-resume-keyword-bank',[\s\S]*?\n\s*\},\n\s*\{\n\s*root: '\.hp-live-states'/.exec( FILTER_SCRIPT );
	assert( ledger, 'The filter script must expose one keyword-ledger configuration.' );
	assert.match( ledger[ 0 ], /defaultState: 'demonstrated'/ );
	assert.deepEqual(
		[ ...ledger[ 0 ].matchAll( /\{ key: '([^']+)', label: '([^']+)' \}/g ) ].map( ( match ) => [ match[ 1 ], match[ 2 ] ] ),
		[ [ 'demonstrated', 'Demonstrated' ], [ 'partial', 'Partial' ], [ 'gap', 'Gap' ], [ 'all', 'All terms' ] ]
	);
	assert.match( FILTER_SCRIPT, /apply\( ledger\.defaultState \|\| 'all' \)/ );
} );

test( 'keeps the Method market screen in a band with a bounded scroll hint', () => {
	const market = findBlock( APPENDIX, 'hp-live-states' );
	assert( hasBlockClass( market, 'hp-placement-band' ) );
	assert( hasBlockClass( market, 'hp-placement-band--market' ) );
	assert.match( market.outer, /<p class="hp-market-scroll-hint">Scroll the register sideways for reasoning →<\/p>[\s\S]*?hp-market-table/ );
	assert.match( APPENDIX, /<aside class="wp-block-group hp-callout is-tone-insight">/ );
} );

test( 'rejects a market State cell the filter cannot classify', () => {
	const mutant = replaceOnce( APPENDIX, '<td>Replaced · Needs new screen</td>', '<td>Replaced</td>' );
	assert.throws( () => verifyAppendix( mutant ), /has a State the filter cannot classify/ );
} );

test( 'pins route modifiers, measures, full bands, and filter mount hooks', () => {
	for ( const [ source, className, verifier, message ] of [
		[ DIGEST, 'hp-placement-masthead--digest', verifyMain, /route-specific masthead/ ],
		[ DIGEST, 'hp-placement-section--text', verifyMain, /measure/ ],
		[ DIGEST, 'hp-evidence-ledger', verifyMain, /filter root class/ ],
		[ DIGEST, 'hp-placement-ledger', verifyMain, /shared hp-placement-ledger hook/ ],
		[ APPENDIX, 'hp-placement-masthead--method', verifyAppendix, /route-specific masthead/ ],
		[ APPENDIX, 'hp-resume-keyword-bank', verifyAppendix, /filter root class/ ],
		[ APPENDIX, 'hp-live-states', verifyAppendix, /filter root class/ ],
		[ APPENDIX, 'hp-placement-ledger', verifyAppendix, /shared hp-placement-ledger hook/ ],
	] ) {
		assert.throws( () => verifier( removeClassEverywhere( source, className ) ), message );
	}

	assert.throws(
		() => verifyMain( replaceOnce( DIGEST, '"align":"full","className":"hp-digest-section hp-evidence-ledger', '"align":"wide","className":"hp-digest-section hp-evidence-ledger' ) ),
		/alignfull/
	);
	assert.throws(
		() => verifyAppendix( replaceOnce( APPENDIX, '"align":"full","anchor":"screening-funnel"', '"align":"wide","anchor":"screening-funnel"' ) ),
		/alignfull/
	);
} );

test( 'refuses to bring back the three-disclosure split ledger', () => {
	const mutant = replaceOnce(
		APPENDIX,
		'<!-- wp:table {"hasFixedLayout":false,"className":"hp-keyword-table hp-placement-ledger is-style-hperkins-ledger"} -->',
		'<!-- wp:details {"className":"hp-disclosure hp-keyword-disclosure"} -->\n<details class="wp-block-details hp-disclosure hp-keyword-disclosure"><summary>Demonstrated</summary></details>\n<!-- /wp:details -->\n\n<!-- wp:table {"hasFixedLayout":false,"className":"hp-keyword-table hp-placement-ledger is-style-hperkins-ledger"} -->'
	);
	assert.throws( () => verifyAppendix( mutant ), /retired split-ledger structure: hp-disclosure/ );
} );

test( 'keeps the screen questions and the overturn admission verbatim', () => {
	const question = replaceOnce(
		APPENDIX,
		'Will the work survive inspection by someone who isn’t me?',
		'Will the work hold up?'
	);
	assert.throws( () => verifyAppendix( question ), /missing required copy: Will the work survive inspection/ );

	const admission = replaceOnce(
		APPENDIX,
		'an employer-level association overrode row-level evidence about the customer',
		'the model weighted the employer too heavily'
	);
	assert.throws( () => verifyAppendix( admission ), /missing required copy: an employer-level association/ );
} );

test( 'keeps the filter cue on both ledgers, so a reader knows the list can narrow', () => {
	const mutant = replaceOnce(
		APPENDIX,
		'filter the screen to hold one state at a time',
		'states are listed together'
	);
	assert.throws( () => verifyAppendix( mutant ), /missing required copy: filter the screen/ );
} );

test( 'keeps the appendix false-pass employer anonymous', () => {
	const mutant = replaceOnce( APPENDIX, 'Target-ecosystem employer (anonymized)', 'Happiness Engineer team' );
	assert.throws( () => verifyAppendix( mutant ), /must anonymize the public false-pass employer/ );
} );
