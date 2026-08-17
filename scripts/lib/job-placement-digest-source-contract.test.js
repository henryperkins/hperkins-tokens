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

const THEME_ROOT = path.join( __dirname, '..', '..' );
const DIGEST = fs.readFileSync(
	path.join( THEME_ROOT, 'content', 'page-drafts', 'job-placement-digest.html' ),
	'utf8'
).replace( /\r\n/g, '\n' );
const APPENDIX = fs.readFileSync(
	path.join( THEME_ROOT, 'content', 'page-drafts', 'placement-method-evidence.html' ),
	'utf8'
).replace( /\r\n/g, '\n' );
const CURRENT_PUBLICATION_DATELINE = 'Published 13 Jul 2026 · Last verified 11 Aug 2026';
const STALE_PUBLICATION_DATELINE = 'Published 13 Jul 2026 · Last verified 10 Aug 2026';

function replaceOnce( value, search, replacement ) {
	assert.notEqual( value.indexOf( search ), -1, `Mutation fixture is missing: ${ search }` );
	return value.replace( search, replacement );
}

function hasBlockClass( block, className ) {
	return ( block.attrs.className || '' ).split( /\s+/ ).includes( className );
}

function findBlock( value, className ) {
	return parseTopLevelBlocks( value ).find( ( block ) => hasBlockClass( block, className ) );
}

function removeEventBlock( value ) {
	const event = findBlock( value, 'hp-wcus-callout' );
	assert( event, 'Fixture must contain the top-level WordCamp block.' );
	return value.slice( 0, event.start ) + value.slice( event.end );
}

function moveEventBeforeHero( value ) {
	const event = findBlock( value, 'hp-wcus-callout' );
	const hero = findBlock( value, 'hp-digest__hero' );
	assert( event && hero && hero.end <= event.start, 'Fixture must put the hero before WordCamp.' );
	return value.slice( 0, hero.start ) + event.outer + '\n\n' +
		value.slice( hero.start, event.start ) + value.slice( event.end );
}

test( 'publishes the full dossier rather than a distilled brief', () => {
	const words = visibleWordCount( DIGEST );

	assert( words >= 850, `The dossier contains only ${ words } visible words; expected the full case.` );
	assert.doesNotThrow( () => verifyMain( DIGEST ) );
} );

test( 'opens on the H1 and orders hero, WordCamp aside, seven sections, closing invitation', () => {
	const blocks = parseTopLevelBlocks( DIGEST );

	assert.equal( blocks.length, 10 );
	assert( hasBlockClass( blocks[ 0 ], 'hp-digest__hero' ) );
	assert( hasBlockClass( blocks[ 1 ], 'hp-wcus-callout' ) );
	assert( hasBlockClass( blocks[ 9 ], 'hp-digest-cta' ) );
	assert( hasBlockClass( blocks[ 9 ], 'hp-action-panel' ) );
	assert( hasBlockClass( blocks[ 9 ], 'is-closing' ) );

	// Every anchored section keeps its fragment, in the argued order.
	const anchors = blocks.map( ( block ) => block.attrs.anchor ).filter( Boolean );
	assert.deepEqual( anchors, [
		'wordcamp-us-2026',
		'why-support-engineer-now',
		'current-support-fit',
		'primary-proof',
		'root-cause-investigation',
		'theme-governance',
		'evidence-register',
	] );
} );

test( 'numbers all seven sections and keeps the ordinals in step with their labels', () => {
	const kickers = [ ...DIGEST.matchAll( /<p class="hp-digest-kicker"><strong>(\d\d)<\/strong> · ([^<]+)<\/p>/g ) ];

	assert.equal( kickers.length, 7 );
	assert.deepEqual(
		kickers.map( ( kicker ) => [ kicker[ 1 ], kicker[ 2 ] ] ),
		SECTIONS.map( ( section ) => [ section.ordinal, section.label ] )
	);

	const mutant = replaceOnce( DIGEST, '<strong>04</strong> · How I debug', '<strong>05</strong> · How I debug' );
	assert.throws( () => verifyMain( mutant ), /Section 4 must read "04 · How I debug"/ );
} );

test( 'keeps the labelled WordCamp aside after the H1 so it never precedes the outline', () => {
	const event = parseTopLevelBlocks( DIGEST )[ 1 ];

	assert.equal( event.name, 'group' );
	assert.equal( event.attrs.tagName, 'aside' );
	assert.equal( event.attrs.ariaLabel, 'I’ll be at WordCamp US.' );
	assert.equal( event.attrs.anchor, 'wordcamp-us-2026' );
	assert( hasBlockClass( event, 'hp-wcus-callout--event-first' ) );
	assert.match( event.outer, /<aside\b[^>]*aria-label="I’ll be at WordCamp US\."[^>]*>/ );
	assert.equal( [ ...event.outer.matchAll( /<!-- wp:button -->/g ) ].length, 1 );

	// The aside carries the event's own H2. Ahead of the hero it would open the
	// document on a second-level heading, which is why the order is pinned.
	assert.throws(
		() => verifyMain( moveEventBeforeHero( DIGEST ) ),
		/must begin its heading outline with H1/
	);
} );

test( 'ships the captioned documentary WordCamp photograph inside the event plate', () => {
	const event = parseTopLevelBlocks( DIGEST )[ 1 ];
	const imagery = path.join( THEME_ROOT, 'assets', 'img', 'imagery' );
	const asset = path.join( imagery, 'wcus-2026-phoenix.png' );
	const delivered = path.join( imagery, 'wcus-2026-phoenix.webp' );
	const candidate = path.join( imagery, 'wcus-2026-phoenix-768.webp' );

	assert( fs.existsSync( asset ), 'The supplied WordCamp documentary photograph must be tracked by the theme.' );
	const image = fs.readFileSync( asset );
	assert.equal( image.readUInt32BE( 16 ), 1448, 'The WordCamp photograph must keep its supplied intrinsic width.' );
	assert.equal( image.readUInt32BE( 20 ), 1086, 'The WordCamp photograph must keep its supplied intrinsic height.' );

	// The block references the WebP, so that is the file a reader downloads.
	assert( fs.existsSync( delivered ), 'The delivered WebP of the WordCamp photograph must be tracked by the theme.' );
	const webp = fs.readFileSync( delivered );
	assert.equal( webp.toString( 'ascii', 8, 12 ), 'WEBP', 'The delivered WordCamp photograph must be a WebP.' );
	assert.equal( webp.readUInt16LE( 26 ) & 0x3fff, 1448, 'The delivered WordCamp photograph must keep the full frame width.' );
	assert.equal( webp.readUInt16LE( 28 ) & 0x3fff, 1086, 'The delivered WordCamp photograph must keep the full frame height.' );
	assert.ok(
		webp.length * 10 <= image.length,
		'The delivered WordCamp photograph must stay at least ten times smaller than the archival PNG.'
	);

	// The srcset's small candidate is what a phone downloads. It keeps the 4:3
	// frame because the 16/9 crop is CSS (object-fit), not a re-encode.
	assert.ok( fs.existsSync( candidate ), 'The 768w WordCamp candidate must be tracked by the theme.' );
	const small = fs.readFileSync( candidate );
	assert.equal( small.toString( 'ascii', 8, 12 ), 'WEBP', 'The 768w WordCamp candidate must be a WebP.' );
	assert.equal( small.readUInt16LE( 26 ) & 0x3fff, 768, 'The 768w WordCamp candidate must be 768 wide.' );
	assert.equal( small.readUInt16LE( 28 ) & 0x3fff, 576, 'The 768w WordCamp candidate must keep the 4:3 frame.' );
	assert.ok(
		small.length * 2 <= webp.length,
		'The 768w WordCamp candidate must be at least half the full file to be worth serving.'
	);

	// The block stays a plain, editable wp:image. Its responsive candidates are
	// added at render time by inc/content-images.php, because core/image has no
	// srcset or sizes attribute to serialize them into.
	assert.match( event.outer, /<!-- wp:image \{[^\n]*"className":"hp-wcus-callout__figure"[^\n]*\} -->/ );
	assert.doesNotMatch( event.outer, /<!-- wp:html\b/ );
	assert.match(
		event.outer,
		/<img src="\/wp-content\/themes\/hperkins-tokens\/assets\/img\/imagery\/wcus-2026-phoenix\.webp" alt="The West entrance of the Phoenix Convention Center at night, its glass doors dressed in WordCamp US 26 desert artwork under the illuminated building sign\."\/>/
	);
	assert.match(
		event.outer,
		/<figcaption class="wp-element-caption">Phoenix Convention Center, West entrance — WordCamp US 2026, 16–19 August\. I’m staffing the Core AI booth\.<\/figcaption>/
	);
	assert(
		event.outer.indexOf( 'hp-wcus-callout__figure' ) < event.outer.indexOf( 'hp-wcus-callout__copy' ),
		'The photograph must remain the first object inside the event plate.'
	);

	const imageBlock = /<!-- wp:image \{[^\n]*"className":"hp-wcus-callout__figure"[^\n]*\} -->[\s\S]*?<!-- \/wp:image -->\n\n/.exec( DIGEST );
	assert( imageBlock, 'The mutation fixture must find the WordCamp image block.' );
	assert.throws(
		() => verifyMain( DIGEST.replace( imageBlock[ 0 ], '' ) ),
		/captioned documentary WordCamp photograph/
	);
} );

test( 'stays valid when the event block is retired after WordCamp', () => {
	const evergreen = removeEventBlock( DIGEST );
	const blocks = parseTopLevelBlocks( evergreen );

	assert.equal( blocks.length, 9 );
	assert( hasBlockClass( blocks[ 0 ], 'hp-digest__hero' ) );
	assert.doesNotMatch( evergreen, /hp-wcus-callout/ );
	assert.doesNotThrow( () => verifyMain( evergreen, undefined, undefined, { requireEvent: false } ) );
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

test( 'publishes all twelve register records, four in each release state', () => {
	const body = /hp-evidence-table[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/.exec( DIGEST );
	const rows = [ ...body[ 1 ].matchAll( /<tr>([\s\S]*?)<\/tr>/g ) ];
	assert.equal( rows.length, 12 );

	const counts = { released: 0, open: 0, unreleased: 0 };
	for ( const row of rows ) {
		const state = /<td[^>]*>([\s\S]*?)<\/td>/.exec( row[ 1 ] )[ 1 ].replace( /<[^>]+>/g, '' );
		const group = classifyState( state );
		assert( group, `Register state is unclassifiable: ${ state }` );
		counts[ group ] += 1;
	}
	assert.deepEqual( counts, { released: 4, open: 4, unreleased: 4 } );
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
	const marker = '<!-- wp:group {"tagName":"section","align":"wide","className":"hp-digest-section hp-fit-ledger"';
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

test( 'never reintroduces a moving branch URL or a publication placeholder', () => {
	assert.doesNotMatch( DIGEST, /https:\/\/github\.com\/[^"'\s]+\/(?:blob|tree)\/(?:main|master)(?:[/#?]|$)/ );

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

test( 'carries the four numbered kickers in order, each reaching its section', () => {
	APPENDIX_SECTIONS.forEach( ( section ) => {
		assert.match(
			APPENDIX,
			new RegExp( `<strong>${ section.ordinal }</strong> · ${ section.label }` ),
			`Appendix is missing the ${ section.ordinal } kicker.`
		);
	} );

	const mutant = replaceOnce( APPENDIX, '<strong>03</strong> · The application', '<strong>03</strong> · The screen again' );
	assert.throws( () => verifyAppendix( mutant ), /Appendix section 3 must read "03 · The application"/ );
} );

test( 'keeps every keyword term and its standing in one ledger', () => {
	const mutant = replaceOnce( APPENDIX, 'SIEM / log analytics <strong>Gap</strong>', 'SIEM / log analytics <strong>Unclear</strong>' );
	assert.throws( () => verifyAppendix( mutant ), /the filter cannot classify/ );

	const recount = replaceOnce( APPENDIX, 'Python <strong>Gap</strong>', 'Python <strong>Partial</strong>' );
	assert.throws( () => verifyAppendix( recount ), /must hold 11 partial rows; found 12/ );
} );

test( 'rejects a market State cell the filter cannot classify', () => {
	const mutant = replaceOnce( APPENDIX, '<td>Replaced · Needs new screen</td>', '<td>Replaced</td>' );
	assert.throws( () => verifyAppendix( mutant ), /has a State the filter cannot classify/ );
} );

test( 'refuses to bring back the three-disclosure split ledger', () => {
	const mutant = replaceOnce(
		APPENDIX,
		'<!-- wp:table {"hasFixedLayout":false,"className":"hp-keyword-table is-style-hperkins-ledger"} -->',
		'<!-- wp:details {"className":"hp-disclosure hp-keyword-disclosure"} -->\n<details class="wp-block-details hp-disclosure hp-keyword-disclosure"><summary>Demonstrated</summary></details>\n<!-- /wp:details -->\n\n<!-- wp:table {"hasFixedLayout":false,"className":"hp-keyword-table is-style-hperkins-ledger"} -->'
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
