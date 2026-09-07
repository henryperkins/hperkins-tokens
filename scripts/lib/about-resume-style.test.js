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

test( 'About v3 hero is the letterhead: identity, channel pills, argument, actions', () => {
	assert.match( draft, /class="wp-block-group hp-about-resume hp-about-resume-v3"/ );
	assert.equal( ( draft.match( /<figure class="[^"\n]*\bhp-about-v3-hero__portrait\b/g ) || [] ).length, 1 );
	assert.match( draft, /src="\/wp-content\/uploads\/2026\/06\/henry-perkins\.png"/ );
	assert.match( draft, />Developer relations &amp; enablement<\/p>/ );
	assert.match( draft, /<h1[^>]*>Henry Perkins<\/h1>/ );
	assert.equal( ( draft.match( /class="wp-block-group hp-about-v3-hero__letterhead"/g ) || [] ).length, 1 );
	assert.equal( ( draft.match( /class="wp-block-group hp-about-v3-hero__aside"/g ) || [] ).length, 1 );
	assert.match( draft, /<p class="hp-about-v3-hero__contact"><a href="mailto:htperkins@gmail\.com" aria-label="Email htperkins@gmail\.com" title="htperkins@gmail\.com"><svg/ );
	assert.equal( ( draft.match( /<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">/g ) || [] ).length, 3 );
	// One action in the hero. The design retired "Get in touch" because the three
	// channel pills beside the name and the closing panel both already reach
	// Contact, so the résumé download is the single next step.
	assert.match(
		draft,
		/<div class="wp-block-buttons hp-action-rail hp-about-v3-hero__cta">\s*<!-- wp:button -->\s*<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="\/one-page-resume\/">Download résumé \(PDF\)<\/a><\/div>\s*<!-- \/wp:button -->\s*<\/div>/
	);
	assert.doesNotMatch( draft, />Get in touch</ );
	assert.equal( ( draft.match( /<!-- wp:button \{"className":"is-style-secondary"\} -->/g ) || [] ).length, 1 );
	assert.doesNotMatch( draft, /<!-- wp:button \{"className":"is-style-outline"\} -->/ );
	for ( const retired of [ 'hp-about-v3-hero__masthead', 'hp-about-v3-hero__links', 'hp-about-contact__email', 'hp-about-credential', 'hp-about-wcus', 'hp-about-impact-strip', 'hp-about-v3-impact', 'hp-about-print-control' ] ) {
		assert.doesNotMatch( draft, new RegExp( retired ), `${ retired } left with the letterhead` );
		assert.doesNotMatch( aboutV3Css, new RegExp( retired ), `${ retired } CSS left with the letterhead` );
	}
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-v3-hero__contact a\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;[^}]*border-radius:\s*var\(--wp--custom--radius--pill\);/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-v3-hero h1\s*\{[^}]*font:\s*var\(--wp--custom--type--h-1\);/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-v3-hero__positioning\s*\{[^}]*font:\s*var\(--wp--custom--type--lead\);[^}]*color:\s*var\(--wp--custom--text--strong\);/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-v3-hero__availability\s*\{[^}]*font:\s*var\(--wp--custom--type--ui\);[^}]*color:\s*var\(--wp--custom--text--body\);/s );
} );

test( 'About v3 proof timeline ships five open folds and a CSS-anchored reading pane', () => {
	assert.equal( ( draft.match( /class="wp-block-group hp-about-timeline__step"/g ) || [] ).length, 5 );
	assert.equal( ( draft.match( /<!-- wp:paragraph \{"className":"hp-about-timeline__label"\} -->/g ) || [] ).length, 5 );
	assert.equal( ( draft.match( /class="wp-block-group hp-about-timeline__fold-body"/g ) || [] ).length, 5 );
	assert.match( draft, />WordPress since 2012<\/span>[\s\S]*?>Credential · 2026<\/span>[\s\S]*?>1 merged upstream<\/span>[\s\S]*?>5 public projects<\/span>[\s\S]*?>In person · Aug 2026<\/span>/ );
	assert.match( draft, />Program showcase <span aria-hidden="true">↗<\/span><\/a>/ );
	assert.match( draft, /Staffed the Core AI booth at WordCamp US 2026 in Phoenix/ );
	assert.doesNotMatch( draft, /hp-about-timeline__panel|hp-about-timeline__step[^"]*\bis-(?:current|done|last)\b|<button/ );
	assert.match( controller, /button\.className = label\.className;/ );
	assert.match( controller, /'aria-label', TIMELINE_GROUP_LABEL/ );
	assert.match( controller, /TIMELINE_BOOT_DELAY = 60;/ );
	assert.match( controller, /TIMELINE_INTRO_WINDOW = 1800;/ );
	assert.match( controller, /TIMELINE_SWAP_DELAY = 160;/ );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-timeline__fold\s*\{[^}]*grid-template-rows:\s*1fr;/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3\.is-enhanced:not\(\.is-print-mode\) \.hp-about-timeline__step:not\(\.is-current\) \.hp-about-timeline__fold\s*\{[^}]*grid-template-rows:\s*0fr;/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3\.is-enhanced:not\(\.is-print-mode\) \.hp-about-timeline__step:not\(\.is-current\) \.hp-about-timeline__fold-body\s*\{[^}]*visibility:\s*hidden;/s );
	assert.match( aboutV3Css, /\.hp-about-timeline__step\.is-current \.hp-about-timeline__dot\s*\{[^}]*transform:\s*scale\(1\.35\);[^}]*0 0 0 4px var\(--wp--preset--color--gold-400\);/s );
	assert.match( aboutV3Css, /\.hp-about-timeline__panel\[data-at="0\/5"\]\s*\{[^}]*--hp-about-anchor:\s*10%;/s );
	assert.match( aboutV3Css, /\.hp-about-timeline__panel\[data-at="4\/5"\]\s*\{[^}]*--hp-about-anchor:\s*90%;/s );
	assert.match( aboutV3Css, /\.hp-about-timeline__steps\.is-intro \.hp-about-timeline__step:nth-child\(5\) :is\(\.hp-about-timeline__fill, \.hp-about-timeline__dot\)\s*\{[^}]*transition-delay:\s*960ms;/s );
	// The horizontal spine, the fold hiding, and the pane are gated on
	// enhancement: without JavaScript the pane never exists, so every width
	// keeps the stacked, open register.
	assert.match( aboutV3Css, /@media \(min-width: 782px\)\s*\{[\s\S]*?\.hp-about-resume-v3:where\(\.is-enhanced\) \.hp-about-timeline__steps\s*\{[^}]*grid-auto-flow:\s*column;[\s\S]*?\.hp-about-resume-v3:where\(\.is-enhanced\) \.hp-about-timeline__fold\s*\{[^}]*display:\s*none;[\s\S]*?\.hp-about-resume-v3:where\(\.is-enhanced\) \.hp-about-timeline__panel\s*\{[^}]*display:\s*block;/s );
	const timelineRules = aboutV3Css.match( /\.hp-about-resume-v3(?::where\(\.is-enhanced\))? \.hp-about-timeline__(?:fold|steps)\s*\{[^}]*\}/g ) || [];
	for ( const rule of timelineRules ) {
		if ( /display:\s*none|grid-auto-flow:\s*column/.test( rule ) ) {
			assert.match( rule, /:where\(\.is-enhanced\)/, `timeline rule must not hide folds or lay the spine out horizontally without enhancement: ${ rule.slice( 0, 80 ) }` );
		}
	}
	assert.match( aboutV3Css, /\.hp-about-resume-v3\.is-print-mode \.hp-about-timeline__fold\s*\{[^}]*display:\s*grid !important;/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3\.is-print-mode \.hp-about-timeline__panel\s*\{[^}]*display:\s*none !important;/s );
} );

test( 'About v3 uses one native navigation and five unnamed section targets', () => {
	assert.equal( ( draft.match( /<!-- wp:group \{"tagName":"nav","ariaLabel":"In this résumé","className":"hp-about-nav"\} -->/g ) || [] ).length, 1 );
	assert.equal( ( draft.match( /<!-- wp:list-item -->/g ) || [] ).length, 5 );
	assert.match( draft, /href="#contributions"><span class="hp-about-nav__number">01<\/span> Contributions<\/a>/ );
	assert.match( draft, /href="#experience"><span class="hp-about-nav__number">02<\/span> Experience<\/a>/ );
	assert.match( draft, /href="#skills"><span class="hp-about-nav__number">03<\/span> Skills<\/a>/ );
	assert.match( draft, /href="#showcase"><span class="hp-about-nav__number">04<\/span> Showcase<\/a>/ );
	assert.match( draft, /href="#contact"><span class="hp-about-nav__number">05<\/span> Contact<\/a>/ );
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
	// A ledger row is an entry: the design names --rule-entry (3px) for it, and
	// the register frame takes --radius-register (radius-sm), not the card radius.
	assert.match( aboutV3Css, /border-inline-start:\s*var\(--hp-rule-entry\) solid/ );
	assert.match( aboutV3Css, /--hp-rule-entry:\s*3px/ );
	assert.doesNotMatch( aboutV3Css, /--hp-rule-evidence/ );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-ledger\s*\{[^}]*border-radius:\s*var\(--wp--custom--radius--sm\);/s );
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
	const eyebrowRule = aboutV3Css.match( /\.hp-about-resume-v3 \.hp-about-section__eyebrow\s*\{[^}]*\}/ );
	assert.ok( eyebrowRule );
	// The section eyebrow takes the hero kicker's Marcellus face at 13px/0.14em,
	// so the page has one eyebrow — but keeps gold-800: at 13px the design's
	// gold-700 is 3.7:1 on parchment, under the AA floor verify-typography.js
	// enforces.
	assert.match( eyebrowRule[ 0 ], /font-family:\s*var\(--wp--preset--font-family--label\);/ );
	assert.match( eyebrowRule[ 0 ], /font-size:\s*var\(--wp--preset--font-size--xs\);/ );
	assert.match( eyebrowRule[ 0 ], /letter-spacing:\s*0\.14em;/ );
	assert.doesNotMatch( eyebrowRule[ 0 ], /font-family:\s*var\(--wp--preset--font-family--mono\);/ );
	assert.match( eyebrowRule[ 0 ], /color:\s*var\(--wp--preset--color--gold-800\);/ );
	assert.doesNotMatch( eyebrowRule[ 0 ], /color:\s*var\(--wp--preset--color--gold-700\);/ );
	// The letterhead kicker takes the label face but keeps the AA gold: 12px
	// gold-700 on parchment is 3.7:1.
	const kickerRule = aboutV3Css.match( /\.hp-about-resume-v3 \.hp-about-kicker\s*\{[^}]*\}/ );
	assert.ok( kickerRule );
	assert.match( kickerRule[ 0 ], /font-family:\s*var\(--wp--preset--font-family--label\);/ );
	assert.match( kickerRule[ 0 ], /font-weight:\s*400;/ );
	assert.match( kickerRule[ 0 ], /letter-spacing:\s*var\(--wp--custom--tracking--caps\);/ );
	assert.match( kickerRule[ 0 ], /color:\s*var\(--wp--preset--color--gold-800\);/ );
	assert.doesNotMatch( kickerRule[ 0 ], /gold-700/ );
	// The contents card's label and the 01-05 numerals under it read as one
	// accent, as the design has them; text-accent is 5.8:1 on the card.
	assert.match(
		aboutV3Css,
		/\.hp-about-resume-v3 \.hp-about-nav__label\s*\{[^}]*color:\s*var\(--wp--custom--text--accent\);/s
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

test( 'About v3 responsive shell follows the mobile bar, masthead plate, and dedicated filter rail handoff', () => {
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
		aboutV3Css.indexOf( '@media (min-width: 782px)' ),
		aboutV3Css.indexOf( '@media (min-width: 64rem)' )
	);
	assert.doesNotMatch( aboutV3Css, /@media \(min-width: 40rem\)/ );
	assert.match( tabletCss, /\.hp-about-resume-v3 \.hp-about-v3-hero__letterhead\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto;/s );
	assert.match( tabletCss, /\.hp-about-resume-v3 \.hp-about-v3-hero__aside\s*\{[^}]*grid-column:\s*2;[^}]*grid-row:\s*1;[^}]*align-items:\s*flex-end;/s );
	assert.match( tabletCss, /\.hp-about-resume-v3 \.hp-about-v3-hero__argument\s*\{[^}]*grid-column:\s*1 \/ -1;[^}]*grid-row:\s*2;/s );
	assert.doesNotMatch( tabletCss, /\.hp-about-resume-v3 \.hp-about-showcase__grid/ );
	assert.doesNotMatch( tabletCss, /\.hp-about-resume-v3 \.hp-about-education__record/ );
	// Two cards to a row at every width, so the grid is a base rule now, not a
	// 64rem upgrade.
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-showcase__grid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/s );
	assert.doesNotMatch( desktopCss, /\.hp-about-resume-v3 \.hp-about-showcase__grid\s*\{[^}]*grid-template-columns:/s );
	assert.match( desktopCss, /\.hp-about-resume-v3 \.hp-about-education__record\s*\{[^}]*grid-template-columns:\s*11rem minmax\(0, 1fr\);/s );
	assert.doesNotMatch( desktopCss, /\.hp-about-resume-v3 \.hp-about-v3-layout\s*\{[^}]*padding-inline:/s );
	assert.doesNotMatch( aboutV3Css, /--hp-about-wide/ );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-experience\s*\{[^}]*width:\s*auto;[^}]*margin-inline:\s*0 !important;/s );
	assert.match( aboutV3Css, /\.hp-about-nav\s*\{[^}]*position:\s*sticky;[^}]*flex-wrap:\s*nowrap;[^}]*overflow-x:\s*auto;/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-nav\s*\{[^}]*margin:\s*0;[^}]*margin-inline:\s*calc\(-1 \* var\(--hp-about-gutter\)\);[^}]*border:\s*0;[^}]*border-radius:\s*0;[^}]*background:\s*color-mix\(in srgb, var\(--wp--custom--surface--page\) 92%, transparent\);[^}]*-webkit-backdrop-filter:\s*blur\(8px\);[^}]*backdrop-filter:\s*blur\(8px\);[^}]*border-block-end:\s*1px solid var\(--wp--custom--border--hair\);/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 a:focus-visible,[\s\S]*?\.hp-about-resume-v3 button:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--wp--preset--color--gold-700\);[^}]*outline-offset:\s*2px;/s );
	assert.match( aboutV3Css, /scroll-margin-top:\s*calc\(var\(--hp-about-header-height, 0px\) \+ 96px\)/ );
	assert.match( aboutV3Css, /@media \(min-width:\s*64rem\)\s*\{[\s\S]*?\.hp-about-resume-v3 \.hp-about-v3-layout\s*\{[^}]*grid-template-columns:\s*minmax\(13rem, 15rem\) minmax\(0, 1fr\);/s );
	// The ordinal now sits inside the pill's own anchor and is present at every
	// width, as the design's <i>01</i> is.
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-nav__number\s*\{[^}]*font-variant-numeric:\s*tabular-nums;[^}]*color:\s*var\(--wp--custom--text--accent\);/s );
	assert.doesNotMatch( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-nav__number\s*\{[^}]*display:\s*none;/s );
	assert.match( desktopCss, /\.hp-about-resume-v3 \.hp-about-v3-hero__letterhead\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1\.6fr\) minmax\(17rem, 0\.85fr\);/s );
	assert.match( desktopCss, /\.hp-about-resume-v3 \.hp-about-v3-hero__aside\s*\{[^}]*grid-row:\s*1 \/ span 2;[^}]*align-self:\s*stretch;[^}]*justify-content:\s*space-between;/s );
	assert.match( desktopCss, /\.hp-about-resume-v3 \.hp-about-v3-hero__argument\s*\{[^}]*align-self:\s*stretch;[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s );
	assert.match( desktopCss, /\.hp-about-resume-v3 \.hp-about-v3-hero__cta\s*\{[^}]*margin-block-start:\s*auto;[^}]*padding-block-start:\s*var\(--wp--preset--spacing--5\);/s );
	assert.match( desktopCss, /\.hp-about-resume-v3 \.hp-about-v3-hero__letterhead:has\(> \.hp-about-v3-hero__aside > \.hp-about-v3-hero__contents-host:empty\)\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto;/s );
	assert.match( desktopCss, /\.hp-about-resume-v3 \.hp-about-section\s*\{[^}]*scroll-margin-top:\s*calc\(var\(--hp-about-header-height, 0px\) \+ var\(--wp--preset--spacing--3\)\);/s );
	assert.match( desktopCss, /\.hp-about-resume-v3 \.hp-about-v3-hero__contents-host \.hp-about-nav\s*\{[^}]*position:\s*static;[^}]*overflow:\s*visible;[^}]*border:\s*1px solid var\(--wp--custom--border--hair\);[^}]*border-radius:\s*var\(--wp--custom--radius--lg\);/s );
	assert.match( desktopCss, /\.hp-about-resume-v3 \.hp-about-filter-rail\s*\{[^}]*position:\s*sticky;[^}]*top:\s*calc\(var\(--hp-about-header-height, 0px\) \+ var\(--wp--preset--spacing--5\)\);[^}]*max-height:\s*calc\(100vh - var\(--hp-about-header-height, 0px\) - var\(--wp--preset--spacing--8\)\);/s );
	assert.match( desktopCss, /\.hp-about-resume-v3 \.hp-about-filter-rail \.hp-about-rail__index-host\s*\{[^}]*overflow-y:\s*auto;/s );
} );

test( 'About v3 citation filter animates order and repaints the cited row', () => {
	assert.match( controller, /460/ );
	assert.match( controller, /cubic-bezier\(\.22, \.61, \.36, 1\)/ );
	assert.match( controller, /prefers-reduced-motion:\s*reduce/ );
	assert.match( controller, /Not cited by/ );
	assert.match( aboutV3Css, /\.is-cited[^}]*color-mix\(in srgb, var\(--wp--preset--color--gold-500\) 7%/s );
	assert.match( aboutV3Css, /\.hp-about-citation-chip[^}]*transition-delay:\s*240ms/s );
	// The underline spans the row and carries its delay on the base rule, so it
	// retracts in step with the way it drew.
	assert.match( aboutV3Css, /\.hp-about-index-row::after\s*\{[^}]*inset-inline:\s*0;[^}]*transform:\s*scaleX\(0\);[^}]*transition-delay:\s*140ms;/s );
	assert.match( aboutV3Css, /\.hp-about-index-row\.is-cited::after\s*\{[^}]*transform:\s*scaleX\(1\);/s );
	// Nothing is dimmed. The filter demotes: citing rows lead each ledger and the
	// rest follow at full opacity under a line that names the term.
	assert.doesNotMatch( aboutV3Css, /is-dimmed/ );
} );

test( 'About v3 controller disposes route-scoped global state and observers', () => {
	assert.match( controller, /dispose:\s*dispose/ );
	assert.match( controller, /function resetStaleEnhancement\(rootElement\)/ );
	assert.match( controller, /resetStaleEnhancement\(rootElement\)/ );
	assert.match( controller, /\[data-hp-about-generated\].*\.hp-about-skills__clear.*\.hp-about-earlier__toggle/s );
	assert.doesNotMatch( controller, /hp-about-copy|hp-about-print-control|hp-about-contact__email/ );
	assert.match( controller, /button\.hp-about-skill-term__button/ );
	assert.match( controller, /button\.hp-about-timeline__label/ );
	assert.match( controller, /timelineSteps\.removeEventListener\('keydown', handleTimelineKey\)/ );
	assert.match( controller, /window\.clearTimeout\(timelineBootTimer\);[\s\S]*?window\.clearTimeout\(timelineIntroTimer\);[\s\S]*?window\.clearTimeout\(timelineSwapTimer\);/ );
	assert.match( controller, /document\.documentElement\.classList\.remove\('has-about-v3'\)/ );
	assert.match( controller, /wideQuery\.removeEventListener\('change', moveSkillIndex\)/ );
	assert.match( controller, /window\.removeEventListener\('beforeprint', prepareNativePrint\)/ );
	assert.match( controller, /window\.removeEventListener\('afterprint', finishNativePrint\)/ );
	assert.match( controller, /sectionObserver\.disconnect\(\)/ );
} );

test( 'About v3 retains the exact reviewed contribution and showcase copy', () => {
	assert.match( draft, /integration-tested a contributor’s fix/ );
	assert.doesNotMatch( draft, /integration-tested another contributor’s fix/ );
	assert.match( draft, /server-side \/api\/booking endpoint/ );
} );

test( 'About v3 print view separates preparation, native printing, and exit restoration', () => {
	assert.match( controller, /function createPrintViewToolbar\(/ );
	assert.match( controller, /function enterPrintView\(/ );
	assert.match( controller, /function exitPrintView\(/ );
	assert.match( controller, /window\.print\(\)/ );
	assert.match( controller, /restoreCanonicalOrder/ );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 :is\(\.hp-about-print-view__print, \.hp-about-print-view__exit\)\s*\{[^}]*min-height:\s*44px;[^}]*font-family:\s*var\(--wp--preset--font-family--label\);[^}]*font-size:\s*var\(--wp--preset--font-size--base\);/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3\.is-print-mode :is\(\.hp-about-nav, \.hp-about-filter-rail, \.hp-about-showcase, \.hp-about-contact, \.hp-about-v3-hero__cta\)\s*\{[^}]*display:\s*none !important;/s );
	assert.match( aboutV3Css, /\.hp-about-resume-v3\.is-print-mode \.hp-about-print-view\s*\{[^}]*display:\s*flex;/s );
	assert.match( aboutV3Css, /html\.has-about-v3-print-view :is\(\.hp-site-header, \.hp-footer\)\s*\{[^}]*display:\s*none !important;/s );
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
	// Section 02 keeps the register frame and the shared row anatomy; its state
	// changes the rule's colour and nothing else.
	assert.doesNotMatch( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-ledger--experience\s*\{/ );
	assert.match( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-ledger--experience \.hp-about-role\.is-current\s*\{\s*border-inline-start-color:\s*var\(--wp--custom--status--done\);\s*\}/s );
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
	// Full-width targets on the phone, content-width pills above: the rail's own
	// `width: fit-content` governs, and nowrap plus min-width only keeps the two
	// labels on one line through the 601-637px band.
	const closingRail = aboutV3Css.match(
		/@media \(min-width: 601px\)\s*\{[\s\S]*?\.hp-about-resume-v3 \.hp-about-contact > \.hp-action-rail\s*\{[^}]*\}/s
	);
	assert.ok( closingRail );
	assert.match( closingRail[ 0 ], /flex-wrap:\s*nowrap;/ );
	assert.doesNotMatch( closingRail[ 0 ], /width:\s*100%;/ );
	assert.doesNotMatch( aboutV3Css, /\.hp-about-resume-v3 \.hp-about-contact > \.hp-action-rail \.wp-block-button\s*\{[^}]*flex:\s*1 1 0;/s );
} );
