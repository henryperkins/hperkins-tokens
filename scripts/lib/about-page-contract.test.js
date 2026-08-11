const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { normalizeContent } = require( './content-integrity' );

const {
	ABOUT_SECTION_WORD_CAPS,
	ABOUT_WORD_RANGE,
	EXPECTED_HEADINGS,
	assertNoForbiddenMarkup,
	countRenderedText,
	countVisibleWords,
	countWords,
	decodeCharacterReferences,
	extractExactText,
	extractVisibleText,
	parseTopLevelBlocks,
	removeAriaHiddenSubtrees,
	verifyAboutBody,
	verifyCssOwnership,
	verifyPatternAdapter,
} = require( './about-page-contract' );

const themeRoot = path.join( __dirname, '..', '..' );
const candidate = normalizeContent(
	fs.readFileSync(
		path.join( themeRoot, 'content', 'page-drafts', 'about.html' ),
		'utf8'
	)
);

// ---------------------------------------------------------------------------
// Extraction pipeline
// ---------------------------------------------------------------------------

test( 'rejects PHP, script, style, template, and hidden-attribute markup', () => {
	assert.throws( () => assertNoForbiddenMarkup( '<p><?php echo 1; ?></p>' ), /PHP/ );
	assert.throws( () => assertNoForbiddenMarkup( '<script>x()</script>' ), /script/ );
	assert.throws( () => assertNoForbiddenMarkup( '<style>p{}</style>' ), /style/ );
	assert.throws( () => assertNoForbiddenMarkup( '<template><p>x</p></template>' ), /template/ );
	assert.throws( () => assertNoForbiddenMarkup( '<p hidden>x</p>' ), /hidden/ );
	assert.throws( () => assertNoForbiddenMarkup( '<p hidden="hidden">x</p>' ), /hidden/ );
	assert.doesNotThrow( () => assertNoForbiddenMarkup( '<p class="hidden-none">x</p>' ) );
} );

test( 'removes aria-hidden subtrees, including nested elements, before counting', () => {
	assert.equal(
		extractVisibleText( '<p class="hp-tag"><span aria-hidden="true">#</span>WordPress</p>' ),
		'WordPress'
	);
	assert.equal(
		extractVisibleText( '<div><span aria-hidden="true">skip <b>me</b> fully</span>kept</div>' ),
		'kept'
	);
	assert.equal( countVisibleWords( '<p><span aria-hidden="true">ignored words</span>counted</p>' ), 1 );
} );

test( 'removes comments and tags while preserving text-node boundaries', () => {
	// "</p><p>" with no whitespace must never glue two words into one.
	assert.equal( countVisibleWords( '<p>alpha</p><p>beta</p>' ), 2 );
	assert.equal( countVisibleWords( '<li><a href="#a">Work</a></li><li><a href="#b">Contact</a></li>' ), 2 );
	assert.equal( countVisibleWords( '<!-- wp:paragraph --><p>one</p><!-- /wp:paragraph --><p>two</p>' ), 2 );
} );

test( 'decodes character references and fails on an unknown named reference', () => {
	assert.equal( extractVisibleText( '<p>A &amp; B &#8212; C &#x2014; D</p>' ), 'A & B — C — D' );
	assert.equal( extractVisibleText( '<p>r&eacute;sum&eacute;</p>' ), 'résumé' );
	assert.throws( () => decodeCharacterReferences( '&bogus;' ), /unknown named character reference/ );
	assert.throws( () => extractVisibleText( '<p>&fantasy;</p>' ), /unknown named character reference/ );
} );

test( 'normalizes to NFC, converts non-breaking spaces, and collapses whitespace', () => {
	// e + combining acute (NFD) must count the same as precomposed é.
	assert.equal( extractVisibleText( '<p>résumé</p>' ), 'résumé' );
	assert.equal( extractVisibleText( '<p>a&nbsp;b</p>' ), 'a b' );
	assert.equal( extractVisibleText( '<p>a b   c\n\nd</p>' ), 'a b c d' );
} );

test( 'segments English words with Intl.Segmenter and counts only word-like segments', () => {
	assert.equal( countWords( 'résumé' ), 1 );
	assert.equal( countWords( 'systems—and' ), 2, 'em-dash-separated words count separately' );
	assert.equal( countWords( 'WordPress-shaped' ), 2, 'hyphenated compounds count both halves' );
	assert.equal( countWords( '· / — &' ), 0, 'punctuation alone never counts' );
	assert.equal( countWords( 'View résumé (PDF)' ), 3, 'action labels count' );
	assert.equal( countWords( '4 featured projects' ), 3, 'numerals are word-like' );
} );

test( 'exact-text extraction keeps punctuation attached across nested inline links', () => {
	assert.equal(
		extractExactText( '<p>in the <a href="/x.pdf"><strong>PDF résumé</strong></a>.</p>' ),
		'in the PDF résumé.'
	);
	// The word-count variant still counts the same words.
	assert.equal( countVisibleWords( '<p>in the <a href="/x.pdf">PDF résumé</a>.</p>' ), 4 );
} );

test( 'rendered text is counted by the same segmenter as the source', () => {
	// countRenderedText normalizes the browser's innerText the way
	// extractVisibleText normalizes source markup, so both reach one countWords
	// and a rendered/source comparison never spans two ICU builds.
	for ( const [ rendered, source ] of [
		[ 'View résumé (PDF)', '<p>View résumé (PDF)</p>' ],
		[ 'systems—and workflows', '<p>systems—and workflows</p>' ],
		[ 'Release candidate · v0.1.0-rc.3', '<p>Release candidate · v0.1.0-rc.3</p>' ],
		[ 'a b   c', '<p>a b   c</p>' ],
		[ 'two words', '<p>two&nbsp;words</p>' ],
		[ 'stacked\nlines', '<p>stacked<br>lines</p>' ],
	] ) {
		assert.equal( countRenderedText( rendered ), countVisibleWords( source ), rendered );
	}
} );

// Why the count may only ever run in one runtime: Node reads each of these as a
// single word-like segment and Chrome splits both, so counting in the page and
// comparing against a Node count reported 884 words on an 881-word body.
test( 'dotted tokens stay one word', () => {
	assert.equal( countRenderedText( 'WordPress.com' ), 1 );
	assert.equal( countWords( 'WordPress.com' ), 1 );
	assert.equal( countRenderedText( 'A.S., Business Administration' ), 3 );
} );

// ---------------------------------------------------------------------------
// Block parsing
// ---------------------------------------------------------------------------

test( 'parses top-level blocks with nested groups and JSON attributes', () => {
	const blocks = parseTopLevelBlocks( candidate );
	assert.equal( blocks.length, 10 );
	assert.equal( blocks[ 0 ].attrs.className, 'hp-about-hero' );
	assert.equal( blocks[ 2 ].name, 'group' );
	assert.equal( blocks[ 2 ].attrs.tagName, 'nav' );
	assert.equal( blocks[ 3 ].attrs.anchor, 'selected-work' );
	assert.equal( blocks[ 8 ].attrs.anchor, 'contact' );
	assert.equal( blocks[ 9 ].name, 'paragraph' );
} );

// ---------------------------------------------------------------------------
// The normative body contract
// ---------------------------------------------------------------------------

test( 'the reviewed candidate satisfies the complete About body contract', () => {
	const report = verifyAboutBody( candidate, { label: 'candidate' } );
	assert.ok(
		report.wordCount >= ABOUT_WORD_RANGE.min && report.wordCount <= ABOUT_WORD_RANGE.max,
		`total ${ report.wordCount } within ${ ABOUT_WORD_RANGE.min }–${ ABOUT_WORD_RANGE.max }`
	);
	for ( const [ section, cap ] of Object.entries( ABOUT_SECTION_WORD_CAPS ) ) {
		assert.ok( report.sectionCounts[ section ] <= cap, `${ section } ≤ ${ cap }` );
	}
} );

test( 'the expected heading inventory contains one H1 and 20 ordered headings', () => {
	assert.equal( EXPECTED_HEADINGS.length, 20 );
	assert.equal( EXPECTED_HEADINGS.filter( ( heading ) => heading.level === 1 ).length, 1 );
	assert.equal( EXPECTED_HEADINGS[ 6 ].text, 'Core AI Contributions' );
} );

function mutated( from, to ) {
	const output = candidate.replace( from, to );
	assert.notEqual( output, candidate, `fixture mutation ${ String( from ) } must apply` );
	return output;
}

test( 'fails when markup is added outside the top-level blocks', () => {
	// Content between blocks belongs to no section, so no word cap and no
	// heading inventory moves; only the coverage assertion sees it.
	const anchor = candidate.lastIndexOf( '<!-- wp:', candidate.indexOf( 'hp-signal-strip hp-about-impact' ) );
	const smuggled =
		candidate.slice( 0, anchor ) +
		'<div class="promo"><p>sponsored filler copy</p><a href="https://evil.example/">Sponsored link</a></div>\n' +
		candidate.slice( anchor );
	assert.throws( () => verifyAboutBody( smuggled ), /outside its top-level blocks/ );
} );

test( 'fails when the hero copy drifts', () => {
	assert.throws(
		() => verifyAboutBody( mutated( 'WordPress / AI Implementation &amp; Enablement', 'WordPress Engineer' ) ),
		/Hero H1|Heading 1|headings/
	);
	assert.throws(
		() => verifyAboutBody( mutated( 'For teams building stuff with tokens.', 'For teams.' ) ),
		/strapline/i
	);
} );

test( 'serializes the in-page navigation as editable native blocks', () => {
	const blocks = parseTopLevelBlocks( candidate );
	assert.equal(
		blocks.filter( ( block ) => block.name === 'html' ).length,
		0,
		'The candidate must not depend on a Studio-policy-incompatible Custom HTML block.'
	);
	assert.equal( blocks[ 2 ].name, 'group' );
	assert.equal( blocks[ 2 ].attrs.tagName, 'nav' );
	assert.equal( blocks[ 2 ].attrs.ariaLabel, 'On this page' );
	assert.match( blocks[ 2 ].outer, /<!-- wp:list \{"className":"hp-about-nav__list"\} -->/ );
} );

test( 'fails when any WordCamp US status fact or action drifts', () => {
	for ( const [ from, to ] of [
		[ 'WordCamp US 2026', 'WordCamp US 2027' ],
		[ 'Aug 16–19', 'Aug 17–19' ],
		[ 'Aug 16–19', 'Aug 16–20' ],
		[ 'selected to staff the Core AI booth', 'selected to support the Core AI booth' ],
		[ 'selected to staff the Core AI booth', 'selected to staff the AI booth' ],
		[ 'href="/contact/">Start a conversation', 'href="/events/">Start a conversation' ],
	] ) {
		assert.throws( () => verifyAboutBody( mutated( from, to ) ), /WordCamp|WCUS|event/i );
	}
} );

test( 'fails when the role-tag row returns', () => {
	assert.throws(
		() => verifyAboutBody(
			mutated(
				'<p class="hp-about-hero__strapline">',
				'<div class="hp-role-tags"></div><p class="hp-about-hero__strapline">'
			)
		),
		/role-tag/
	);
} );

test( 'fails when a proof signal is added or its copy drifts', () => {
	assert.throws(
		() => verifyAboutBody( mutated( '2 upstream outcomes', '3 upstream outcomes' ) ),
		/Signal 3 value/
	);
} );

test( 'fails when the navigation loses a link, reorders, or renames', () => {
	assert.throws(
		() => verifyAboutBody( mutated( '<li><a href="#contact">Contact</a></li>', '' ) ),
		/six links/
	);
	assert.throws(
		() => verifyAboutBody( mutated( '<a href="#selected-work">Work</a>', '<a href="#selected-work">Projects</a>' ) ),
		/Nav link 1 label/
	);
} );

test( 'fails when a fragment target section loses its id or gains an aria-label', () => {
	assert.throws(
		() => verifyAboutBody( mutated( 'id="capabilities"', 'id="capability-register"' ) ),
		/capabilities/
	);
	assert.throws(
		() => verifyAboutBody(
			mutated(
				'<section class="wp-block-group alignwide hp-about-work" id="selected-work">',
				'<section class="wp-block-group alignwide hp-about-work" id="selected-work" aria-label="Selected Work">'
			)
		),
		/aria-label/
	);
	assert.throws(
		() => verifyAboutBody(
			mutated(
				'<section id="contact" class="wp-block-group hp-about-closing hp-action-panel is-closing">',
				'<section id="contact" class="wp-block-group hp-about-closing hp-action-panel is-closing" aria-labelledby="contact-title">'
			)
		),
		/aria-label/
	);
} );

test( 'fails when Selected Work order, status, tags, or destinations drift', () => {
	assert.throws(
		() => verifyAboutBody( mutated( 'Release candidate · v0.1.0-rc.3', 'Stable · v1.0.0' ) ),
		/Project 1 status/
	);
	assert.throws(
		() => verifyAboutBody( mutated( '<p class="hp-project__tech">MCP</p>', '<p class="hp-project__tech">MCP Adapter</p>' ) ),
		/technology tags/
	);
	assert.throws(
		() => verifyAboutBody(
			mutated( 'href="https://github.com/henryperkins/tarot">View Tableau source', 'href="https://github.com/henryperkins/tarot-old">View Tableau source' )
		),
		/action 2 destination/
	);
} );

test( 'requires Tableau spelling in the project heading and meaningful action labels', () => {
	assert.throws(
		() => verifyAboutBody( mutated( 'Tableau', 'Tableu' ) ),
		/Project 4 title|Project 4 action|Heading/
	);
} );

test( 'fails when a project title becomes a link (whole-card affordance)', () => {
	assert.throws(
		() => verifyAboutBody(
			mutated(
				'<h3 class="wp-block-heading hp-work-card__title">Tableau</h3>',
				'<h3 class="wp-block-heading hp-work-card__title"><a href="https://tarot.lakefrontdev.com/">Tableau</a></h3>'
			)
		),
		/plain text|only its action links/
	);
} );

test( 'fails when HPerkins.com re-enters Selected Work', () => {
	assert.throws(
		() => verifyAboutBody( mutated( '<h3 class="wp-block-heading hp-work-card__title">Tableau</h3>', '<h3 class="wp-block-heading hp-work-card__title">HPerkins.com</h3>' ) ),
		/HPerkins\.com|Project 4 title|Heading/
	);
} );

test( 'fails when EvidenceBoard rows change copy, class, or composition', () => {
	assert.throws(
		() => verifyAboutBody( mutated( 'is-status-review is-kind-review', 'is-status-merged is-kind-review' ) ),
		/Evidence row 4/
	);
	assert.throws(
		() => verifyAboutBody( mutated( 'a maintainer fixed it', 'I fixed it' ) ),
		/Evidence row 2 meta/
	);
	assert.throws(
		() => verifyAboutBody( mutated( 'Anubhav Anand authored PR #757', 'my PR #757' ) ),
		/Evidence row 4 meta/
	);
} );

test( 'fails when any résumé action bypasses the semantic route', () => {
	assert.throws(
		() => verifyAboutBody( mutated( '/one-page-resume/', '/resume/' ) ),
		/résumé|resume|destination/i
	);
} );

test( 'fails when a capability unit gains a second paragraph', () => {
	assert.throws(
		() => verifyAboutBody(
			mutated(
				'<p class="hp-capability__text">I connect models and APIs to bounded agent workflows, then add evaluation, review gates, attribution, and safe mutation paths before anything reaches a live system.</p>\n<!-- /wp:paragraph -->',
				'<p class="hp-capability__text">I connect models and APIs to bounded agent workflows, then add evaluation, review gates, attribution, and safe mutation paths before anything reaches a live system.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph {"className":"hp-capability__text"} -->\n<p class="hp-capability__text">And a second paragraph.</p>\n<!-- /wp:paragraph -->'
			)
		),
		/one paragraph per unit/
	);
} );

test( 'fails when Experience regains the artifacts paragraph or Micro Center', () => {
	assert.throws(
		() => verifyAboutBody(
			mutated(
				'<p class="hp-work__footer">',
				'<p class="hp-exp__artifacts">Artifacts: x</p><p class="hp-work__footer">'
			)
		),
		/artifacts/
	);
	assert.throws(
		() => verifyAboutBody( mutated( 'PageLines, Inc.', 'Micro Center' ) ),
		/Micro Center|organization/
	);
} );

test( 'fails when the six-bullet budget changes', () => {
	assert.throws(
		() => verifyAboutBody(
			mutated(
				'<li>Supported WordPress professionals through onboarding, tutorials, daily community work, and WordCamp representation while translating feedback into clearer product guidance for developers.</li>',
				'<li>Supported WordPress professionals through onboarding, tutorials, daily community work, and WordCamp representation while translating feedback into clearer product guidance for developers.</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>An extra seventh bullet.</li>'
			)
		),
		/six bullets/
	);
} );

test( 'fails when AI Leaders or education drifts', () => {
	assert.throws(
		() => verifyAboutBody( mutated( 'href="https://aileaderswp.blog/"', 'href="https://example.com/"' ) ),
		/AI Leaders link destination/
	);
	assert.throws(
		() => verifyAboutBody( mutated( 'College of DuPage', 'College of Lake County' ) ),
		/Education record 1 school/
	);
} );

test( 'fails when the closing invitation loses an action or reorders them', () => {
	assert.throws(
		() => verifyAboutBody( mutated(
			'<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="/contact/">Start a conversation</a></div>',
			'<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="/contact/">Contact Henry</a></div>'
		) ),
		/Closing action 1 label/
	);
} );

test( 'fails when a removed composition returns', () => {
	assert.throws(
		() => verifyAboutBody( candidate + '\n<!-- wp:heading -->\n<h2 class="wp-block-heading">Throughline</h2>\n<!-- /wp:heading -->\n' ),
		/Throughline|top-level composition/
	);
} );

test( 'fails when a content area exceeds its word budget', () => {
	// Padding an unpinned paragraph into the hero trips the hero cap (45),
	// the same section/range block that enforces the 850–950 page ceiling.
	const padding = Array.from( { length: 90 }, ( _, index ) => `pad${ index }` ).join( ' ' );
	assert.throws(
		() => verifyAboutBody(
			mutated(
				'<!-- wp:paragraph {"className":"hp-about-hero__lead"} -->',
				`<!-- wp:paragraph -->\n<p>${ padding }</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph {"className":"hp-about-hero__lead"} -->`
			)
		),
		/counts \d+ words; the cap is/
	);
} );

// ---------------------------------------------------------------------------
// Pattern adapter and CSS ownership
// ---------------------------------------------------------------------------

test( 'the thin pattern adapter satisfies its contract', () => {
	const source = fs.readFileSync( path.join( themeRoot, 'patterns', 'about-resume.php' ), 'utf8' );
	verifyPatternAdapter( source );
} );

test( 'the pattern adapter contract rejects page markup and draft reads', () => {
	const source = fs.readFileSync( path.join( themeRoot, 'patterns', 'about-resume.php' ), 'utf8' );
	assert.throws( () => verifyPatternAdapter( `${ source }\n// <h1 class="x">` ), /page markup/ );
	assert.throws(
		() => verifyPatternAdapter( source.replace( 'content/page-snapshots/about.html', 'content/page-drafts/about.html' ) ),
		/missing|draft/
	);
} );

test( 'the pattern adapter contract rejects direct-PDF replacement logic', () => {
	const source = fs.readFileSync( path.join( themeRoot, 'patterns', 'about-resume.php' ), 'utf8' );
	const directPdfReplacement = `${ source }\n$hperkins_about_resume_rel = 'assets/documents/resume.pdf';\nhperkins_tokens_asset_url( $hperkins_about_resume_rel );`;
	assert.throws( () => verifyPatternAdapter( directPdfReplacement ), /portrait-only|résumé|PDF/i );
} );

test( 'CSS ownership is exclusive to assets/imladris-pages.css', () => {
	const styleCss = fs.readFileSync( path.join( themeRoot, 'style.css' ), 'utf8' );
	const pagesCss = fs.readFileSync( path.join( themeRoot, 'assets', 'imladris-pages.css' ), 'utf8' );
	verifyCssOwnership( styleCss, pagesCss );
	assert.throws(
		() => verifyCssOwnership( `${ styleCss }\n.hp-about-template .x { color: red; }`, pagesCss ),
		/style\.css must contain no/
	);
	assert.throws(
		() => verifyCssOwnership( styleCss, `${ pagesCss }\n.hp-about-template .hp-work-card:hover { box-shadow: none; }` ),
		/no card-level hover/
	);
} );
