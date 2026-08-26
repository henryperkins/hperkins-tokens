#!/usr/bin/env node

const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const test = require( 'node:test' );

const themeRoot = path.join( __dirname, '..', '..' );
const theme = JSON.parse( fs.readFileSync( path.join( themeRoot, 'theme.json' ), 'utf8' ) );
const css = fs.readFileSync( path.join( themeRoot, 'assets', 'imladris-pages.css' ), 'utf8' );
const sharedCss = fs.readFileSync( path.join( themeRoot, 'style.css' ), 'utf8' );
const draft = fs.readFileSync( path.join( themeRoot, 'content', 'page-drafts', 'about.html' ), 'utf8' );
const template = fs.readFileSync( path.join( themeRoot, 'templates', 'page-about.html' ), 'utf8' );
const controller = fs.readFileSync( path.join( themeRoot, 'assets', 'js', 'about-resume.js' ), 'utf8' );
const marker = '/* About v3: evidence-first resume ledger.';
const markerOffset = css.indexOf( marker );
const aboutV3Css = markerOffset >= 0 ? css.slice( markerOffset ) : '';

function slugs( items ) {
	return new Set( ( items || [] ).map( ( item ) => item.slug ) );
}

function generatedFontPresetSlugs( items ) {
	return new Set(
		( items || [] ).map( ( item ) => item.slug.replace( /^(\d+)(?=[a-z])/i, '$1-' ).toLowerCase() )
	);
}

test( 'About v3 CSS references only registered design tokens', () => {
	assert.notEqual( markerOffset, -1, 'About v3 CSS marker must exist.' );
	const registered = {
		color: slugs( theme.settings?.color?.palette ),
		'font-family': slugs( theme.settings?.typography?.fontFamilies ),
		'font-size': generatedFontPresetSlugs( theme.settings?.typography?.fontSizes ),
		spacing: slugs( theme.settings?.spacing?.spacingSizes ),
	};
	const missing = Array.from(
		aboutV3Css.matchAll( /var\(\s*--wp--preset--(color|font-family|font-size|spacing)--([a-z0-9-]+)/g )
	).map( ( match ) => `${ match[ 1 ] }:${ match[ 2 ] }` )
		.filter( ( reference ) => {
			const [ category, slug ] = reference.split( ':' );
			return ! registered[ category ].has( slug );
		} );

	assert.deepEqual( [ ...new Set( missing ) ].sort(), [] );
	assert.doesNotMatch( aboutV3Css, /font-size:\s*clamp\(/ );
	assert.doesNotMatch( aboutV3Css, /border-radius:\s*0\.\d+rem/ );
} );

test( 'About v3 hero matches the selected identity, actions, credential, and event callout', () => {
	assert.match( draft, /class="wp-block-group hp-about-resume hp-about-resume-v3"/ );
	assert.equal( ( draft.match( /<figure class="[^"\n]*\bhp-about-v3-hero__portrait\b/g ) || [] ).length, 1 );
	assert.match( draft, /src="\/wp-content\/uploads\/2026\/06\/henry-perkins\.png"/ );
	assert.match( draft, />Developer relations &amp; enablement<\/p>/ );
	assert.match( draft, /<h1[^>]*>Henry Perkins<\/h1>/ );
	assert.match( draft, />Download résumé \(PDF\)<\/a>[\s\S]*?>Get in touch<\/a>/ );
	assert.equal( ( draft.match( /<!-- wp:button \{"className":"is-style-secondary"\} -->/g ) || [] ).length, 2 );
	assert.doesNotMatch( draft, /<!-- wp:button \{"className":"is-style-outline"\} -->/ );
	assert.match( draft, />Credential · 2026<\/p>[\s\S]*?<p class="hp-about-credential__title">AI Leaders Micro-Credential<\/p>/ );
	assert.match( draft, />Program showcase<\/a>/ );
	assert.match( draft, />In person · Aug 2026<\/p>/ );
	assert.match( draft, /Staffed the Core AI booth at WordCamp US 2026 in Phoenix/ );
} );

test( 'About v3 uses one native navigation and five unnamed section targets', () => {
	assert.equal( ( draft.match( /<!-- wp:group \{"tagName":"nav","ariaLabel":"On this page","className":"hp-about-nav"\} -->/g ) || [] ).length, 1 );
	assert.equal( ( draft.match( /<!-- wp:list-item -->/g ) || [] ).length, 5 );
	assert.match( draft, /href="#contributions">Contributions<\/a>/ );
	assert.match( draft, /href="#experience">Experience<\/a>/ );
	assert.match( draft, /href="#skills">Skills<\/a>/ );
	assert.match( draft, /href="#showcase">Showcase<\/a>/ );
	assert.match( draft, /href="#contact">Contact<\/a>/ );
	for ( const id of [ 'contributions', 'experience', 'skills', 'showcase', 'contact' ] ) {
		assert.match( draft, new RegExp( `<!-- wp:group \\{"tagName":"section","anchor":"${ id }"` ) );
	}
} );

test( 'About v3 keeps static ledger status while generating filter-only anatomy at runtime', () => {
	assert.match( draft, />Professional experience<\/p>[\s\S]*?<h2[^>]*>Experience<\/h2>/ );
	assert.equal( ( draft.match( /class="[^"\n]*\bhp-about-contribution\b/g ) || [] ).length, 7 );
	assert.equal( ( draft.match( /class="[^"\n]*\bhp-about-role\b[^"\n]*\bis-current\b/g ) || [] ).length, 4 );
	assert.equal( ( draft.match( /class="[^"\n]*\bhp-about-role\b[^"\n]*\bis-earlier\b/g ) || [] ).length, 3 );
	assert.equal( ( draft.match( /class="hp-about-status__glyph" aria-hidden="true">[●○]<\/span>/g ) || [] ).length, 7 );
	assert.doesNotMatch( draft, /\shidden(?:\s|=|>)/i );
	assert.doesNotMatch( draft, /hp-about-ledger__divider|hp-about-citation-chip/ );
	assert.match( controller, /function createLedgerDivider\(\)/ );
	assert.match( controller, /function createCitationChip\(\)/ );
	assert.match( controller, /ledger\.insertBefore\(createLedgerDivider\(\), ledger\.firstChild\)/ );
	assert.match( controller, /chipHost\.appendChild\(createCitationChip\(\)\)/ );
	assert.match( aboutV3Css, /border-inline-start:\s*var\(--hp-rule-evidence\) solid/ );
	assert.match( aboutV3Css, /--hp-rule-evidence:\s*5px/ );
} );

test( 'About v3 impact cells are full native links on the resilient handoff grid', () => {
	assert.equal( ( draft.match( /<!-- wp:paragraph \{"className":"hp-about-v3-impact"\} -->/g ) || [] ).length, 3 );
	assert.equal( ( draft.match( /<p class="hp-about-v3-impact"><a href="#[^"]+">/g ) || [] ).length, 3 );
	assert.match( aboutV3Css, /\.hp-about-impact-strip\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit, minmax\(14rem, 1fr\)\);/s );
	assert.match( aboutV3Css, /\.hp-about-v3-impact > a\s*\{[^}]*display:\s*flex;[^}]*min-height:\s*100%;/s );
} );

test( 'About v3 ships a static six-group, 34-term index before enhancement', () => {
	assert.equal( ( draft.match( /class="wp-block-group hp-about-skill-group"/g ) || [] ).length, 6 );
	assert.equal( ( draft.match( /class="hp-tag hp-about-skill-term hp-term--/g ) || [] ).length, 34 );
	assert.match( draft, /role="status" class="hp-about-skills__readout">Pick a term to pull its evidence to the top\. Nothing is hidden\.<\/p>/ );
	assert.match( controller, /replaceWith\( button \)|replaceChild\( button/ );
	assert.match( controller, /matchMedia\(\s*'\(min-width: 64rem\)'\s*\)/ );
	assert.match( controller, /appendChild\( skillIndex \)/ );
} );

test( 'About v3 keeps the enhanced Education outline sequential at every breakpoint', () => {
	assert.match( controller, /setEducationRecordHeadingLevels\(rootElement, usesRail \? 3 : 4\)/ );
	assert.match( controller, /setEducationRecordHeadingLevels\(rootElement, 4\)/ );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-education__record :is\(h3, h4\)/ );
} );

test( 'About v3 uses contrast-safe text accents on ivory surfaces', () => {
	const eyebrowRule = aboutV3Css.match(
		/\.hp-about-resume-v3 \.hp-about-kicker,[\s\S]*?\.hp-about-resume-v3 \.hp-about-wcus__label\s*\{[^}]*\}/
	);
	assert.ok( eyebrowRule );
	assert.match( eyebrowRule[ 0 ], /color:\s*var\(--wp--preset--color--gold-800\);/ );
	assert.doesNotMatch( eyebrowRule[ 0 ], /color:\s*var\(--wp--preset--color--gold-700\);/ );
	assert.match(
		aboutV3Css,
		/\.hp-about-resume-v3 \.hp-about-nav__label\s*\{[^}]*color:\s*var\(--wp--preset--color--gold-800\);/s
	);
	assert.match(
		aboutV3Css,
		/\.hp-about-resume-v3 \.hp-about-contribution\.is-done \.hp-about-contribution__status\s*\{[^}]*color:\s*var\(--wp--custom--on--done\);/s
	);
	assert.match(
		aboutV3Css,
		/\.hp-about-resume-v3 \.hp-about-contribution\.is-review \.hp-about-contribution__status\s*\{[^}]*color:\s*var\(--wp--custom--on--review\);/s
	);
} );

test( 'About v3 responsive shell follows the mobile bar and 64rem rail handoff', () => {
	assert.match( template, /About v3/ );
	assert.match( template, /"contentSize":"72rem"/ );
	assert.match( template, /<!-- wp:post-content \{"align":"full","layout":\{"type":"constrained","contentSize":"72rem"\}\} \/-->/ );
	assert.match( aboutV3Css, /\.hp-about-template__content:has\(\.hp-about-resume-v3\)\s*\{[^}]*padding-inline:\s*0;/s );
	assert.match( aboutV3Css, /\.hp-about-template__content:has\(\.hp-about-resume-v3\) > \.wp-block-post-content\s*\{[^}]*width:\s*100% !important;[^}]*max-width:\s*none !important;[^}]*margin-inline:\s*0 !important;/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3\s*\{[^}]*width:\s*100% !important;[^}]*max-width:\s*var\(--wp--custom--container--wide\) !important;[^}]*margin-inline:\s*auto !important;[^}]*padding-inline:\s*0 !important;/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-v3-hero\s*\{[^}]*padding-inline:\s*var\(--hp-about-gutter\);/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-v3-layout\s*\{[^}]*padding-inline:\s*var\(--hp-about-gutter\);/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-v3-main\s*\{[^}]*padding-inline:\s*0;/s );
	const rootRule = aboutV3Css.match( /\.hp-about-resume-v3\s*\{[^}]*\}/s );
	assert.ok( rootRule );
	assert.doesNotMatch( rootRule[ 0 ], /--hp-about-header-height/ );
	assert.match( aboutV3Css, /top:\s*var\(--hp-about-header-height, 0px\)/ );
	const desktopCss = aboutV3Css.slice(
		aboutV3Css.indexOf( '@media (min-width: 64rem)' ),
		aboutV3Css.indexOf( '@media (prefers-reduced-motion' )
	);
	const tabletCss = aboutV3Css.slice(
		aboutV3Css.indexOf( '@media (min-width: 40rem)' ),
		aboutV3Css.indexOf( '@media (min-width: 64rem)' )
	);
	assert.doesNotMatch( tabletCss, /\.hp-about-resume-v3 \.hp-about-showcase__grid/ );
	assert.doesNotMatch( tabletCss, /\.hp-about-resume-v3 \.hp-about-education__record/ );
	assert.match( desktopCss, /\.hp-about-resume-v3 \.hp-about-showcase__grid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/s );
	assert.match( desktopCss, /\.hp-about-resume-v3 \.hp-about-education__record\s*\{[^}]*grid-template-columns:\s*11rem minmax\(0, 1fr\);/s );
	assert.doesNotMatch( desktopCss, /\.hp-about-resume-v3 \.hp-about-v3-layout\s*\{[^}]*padding-inline:/s );
	assert.doesNotMatch( aboutV3Css, /--hp-about-wide/ );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-experience\s*\{[^}]*width:\s*auto;[^}]*margin-inline:\s*0 !important;/s );
	assert.match( aboutV3Css, /\.hp-about-nav\s*\{[^}]*position:\s*sticky;[^}]*flex-wrap:\s*nowrap;[^}]*overflow-x:\s*auto;/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-nav\s*\{[^}]*margin:\s*0;[^}]*margin-inline:\s*calc\(-1 \* var\(--hp-about-gutter\)\);[^}]*border:\s*0;[^}]*border-radius:\s*0;[^}]*background:\s*color-mix\(in srgb, var\(--wp--custom--surface--page\) 92%, transparent\);[^}]*-webkit-backdrop-filter:\s*blur\(8px\);[^}]*backdrop-filter:\s*blur\(8px\);[^}]*border-block-end:\s*1px solid var\(--wp--custom--border--hair\);/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 a:focus-visible,[\s\S]*?\.hp-about-resume-v3 button:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--wp--preset--color--gold-700\);[^}]*outline-offset:\s*2px;/s );
	assert.match( aboutV3Css, /scroll-margin-top:\s*calc\(var\(--hp-about-header-height, 0px\) \+ 96px\)/ );
	assert.match( aboutV3Css, /@media \(min-width:\s*64rem\)\s*\{[\s\S]*?\.hp-about-resume-v3 \.hp-about-v3-layout\s*\{[^}]*grid-template-columns:\s*minmax\(13rem, 15rem\) minmax\(0, 1fr\);/s );
	assert.match( aboutV3Css, /@media \(min-width:\s*64rem\)\s*\{[\s\S]*?\.hp-about-resume-v3 \.hp-about-nav\s*\{[^}]*position:\s*sticky;[^}]*overflow:\s*visible;/s );
} );

test( 'About v3 citation filter animates order and repaints the cited row', () => {
	assert.match( controller, /460/ );
	assert.match( controller, /cubic-bezier\(\.22, \.61, \.36, 1\)/ );
	assert.match( controller, /prefers-reduced-motion:\s*reduce/ );
	assert.match( controller, /Not cited by/ );
	assert.match( aboutV3Css, /\.is-cited[^}]*color-mix\(in srgb, var\(--wp--preset--color--gold-100\) 7%/s );
	assert.match( aboutV3Css, /\.hp-about-citation-chip[^}]*transition-delay:\s*240ms/s );
	assert.match( aboutV3Css, /\.hp-about-index-row::after\s*\{[^}]*transform:\s*scaleX\(0\);/s );
	assert.match( aboutV3Css, /\.hp-about-index-row\.is-cited::after\s*\{[^}]*transform:\s*scaleX\(1\);[^}]*transition-delay:\s*140ms;/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 :is\(\.hp-about-contribution, \.hp-about-role\)\.is-dimmed\s*\{[^}]*opacity:\s*0\.34;/s );
} );

test( 'About v3 controller disposes route-scoped global state and observers', () => {
	assert.match( controller, /dispose:\s*dispose/ );
	assert.match( controller, /function resetStaleEnhancement\(rootElement\)/ );
	assert.match( controller, /resetStaleEnhancement\(rootElement\)/ );
	assert.match( controller, /\[data-hp-about-generated\].*\.hp-about-skills__clear.*\.hp-about-earlier__toggle.*\.hp-about-copy/s );
	assert.match( controller, /button\.hp-about-skill-term__button/ );
	assert.match( controller, /document\.documentElement\.classList\.remove\('has-about-v3'\)/ );
	assert.match( controller, /wideQuery\.removeEventListener\('change', moveSkillIndex\)/ );
	assert.match( controller, /window\.removeEventListener\('beforeprint', preparePrint\)/ );
	assert.match( controller, /window\.removeEventListener\('afterprint', finishPrint\)/ );
	assert.match( controller, /sectionObserver\.disconnect\(\)/ );
} );

test( 'About v3 retains the exact reviewed contribution and showcase copy', () => {
	assert.match( draft, /integration-tested a contributor’s fix/ );
	assert.doesNotMatch( draft, /integration-tested another contributor’s fix/ );
	assert.match( draft, /server-side \/api\/booking endpoint/ );
} );

test( 'About v3 print restores the canonical record and removes navigation and closing furniture', () => {
	assert.match( controller, /beforeprint/ );
	assert.match( controller, /restoreCanonicalOrder/ );
	assert.match( aboutV3Css, /@media print\s*\{[\s\S]*?\.hp-about-resume \.hp-about-nav,[\s\S]*?\.hp-about-resume \.hp-about-showcase,[\s\S]*?\.hp-about-resume \.hp-about-contact/s );
	assert.match( aboutV3Css, /@media print\s*\{[\s\S]*?\.hp-about-resume \.hp-about-role\.is-earlier\s*\{[^}]*display:\s*block !important;/s );
} );

test( 'About v3 disclosure state beats WordPress block display rules', () => {
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-earlier\[hidden\]\s*\{[^}]*display:\s*none !important;/s );
} );

test( 'About v3 sections reset the legacy v2 divider and padding', () => {
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-section\s*\{[^}]*padding-block:\s*0;[^}]*border-top:\s*0;/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-index-row\s*\{[^}]*margin:\s*0;/s );
} );

test( 'About v3 experience restores the handoff role order and typography', () => {
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-role\.is-current\s*\{[^}]*display:\s*block;/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-ledger--experience\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-ledger--experience \.hp-about-role\.is-current\s*\{[^}]*border-inline-start:\s*3px solid var\(--wp--custom--border--brand\);[^}]*background:\s*transparent;/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-role__org\s*\{[^}]*font-family:\s*var\(--wp--preset--font-family--label\);[^}]*color:\s*var\(--wp--custom--text--accent\);/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-role__meta\s*\{[^}]*font-family:\s*var\(--wp--preset--font-family--mono\);[^}]*color:\s*var\(--wp--custom--text--faint\);/s );
} );

test( 'About v3 artifact links keep a 44px touch target in both axes', () => {
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-showcase-card__link a\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/s );
	const cardRule = aboutV3Css.match( /\.hp-about-resume-v3 \.hp-about-showcase-card\s*\{[^}]*\}/s );
	assert.ok( cardRule );
	assert.doesNotMatch( cardRule[ 0 ], /height:\s*100%/ );
	assert.match( cardRule[ 0 ], /min-height:\s*0;/ );
	const gridRule = aboutV3Css.match( /\.hp-about-resume-v3 \.hp-about-showcase__grid\s*\{[^}]*\}/s );
	assert.ok( gridRule );
	assert.match( gridRule[ 0 ], /border:\s*0;/ );
	assert.match( gridRule[ 0 ], /background:\s*transparent;/ );
} );

test( 'About v3 closing invitation composes the shared action-panel primitive', () => {
	assert.match( draft, /class="wp-block-group hp-about-section hp-about-contact hp-action-panel is-closing"/ );
	assert.match( draft, /Build the handoff into the system\./ );
	assert.match( sharedCss, /\.hp-action-panel\.is-closing\s*\{[^}]*border-left:\s*var\(--hp-rule-entry\) solid var\(--hp-gold\);/s );
	const contactRule = aboutV3Css.match( /\.hp-about-resume-v3 \.hp-about-contact\s*\{[^}]*\}/s );
	assert.ok( contactRule );
	assert.doesNotMatch( contactRule[ 0 ], /(?:padding|border|background):/ );
	assert.match(
		aboutV3Css,
		/@media \(min-width: 601px\)\s*\{[\s\S]*?\.hp-about-resume-v3 \.hp-about-contact > \.hp-action-rail\s*\{[^}]*width:\s*100%;[^}]*flex-wrap:\s*nowrap;[\s\S]*?\.hp-about-resume-v3 \.hp-about-contact > \.hp-action-rail \.wp-block-button\s*\{[^}]*flex:\s*1 1 0;[^}]*min-width:\s*0;[\s\S]*?\.hp-about-resume-v3 \.hp-about-contact > \.hp-action-rail \.wp-block-button__link\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;/s
	);
} );
