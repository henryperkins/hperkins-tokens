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
const marker = '/* About v2: resume-first evidence index.';
const aboutV2Css = css.slice( css.indexOf( marker ) );

function slugs( items ) {
	return new Set( ( items || [] ).map( ( item ) => item.slug ) );
}

function generatedFontPresetSlugs( items ) {
	return new Set(
		( items || [] ).map( ( item ) =>
			item.slug.replace( /^(\d+)(?=[a-z])/i, '$1-' ).toLowerCase()
		)
	);
}

test( 'About v2 CSS references only registered theme.json preset tokens', () => {
	assert.notEqual( css.indexOf( marker ), -1, 'About v2 CSS marker must exist.' );

	const registered = {
		color: slugs( theme.settings?.color?.palette ),
		'font-family': slugs( theme.settings?.typography?.fontFamilies ),
		'font-size': generatedFontPresetSlugs( theme.settings?.typography?.fontSizes ),
		spacing: slugs( theme.settings?.spacing?.spacingSizes ),
	};
	const missing = Array.from(
		aboutV2Css.matchAll( /var\(\s*--wp--preset--(color|font-family|font-size|spacing)--([a-z0-9-]+)/g )
	).map( ( match ) => `${ match[ 1 ] }:${ match[ 2 ] }` )
		.filter( ( reference ) => {
			const [ category, slug ] = reference.split( ':' );
			return ! registered[ category ].has( slug );
		} );

	assert.deepEqual( [ ...new Set( missing ) ].sort(), [] );
	assert.doesNotMatch( aboutV2Css, /var\(\s*--spacing\d+/ );
} );

test( 'About v2 impact cards do not reuse the accepted snapshot breakout class', () => {
	assert.doesNotMatch( draft, /class="[^"]*\shp-about-impact(?:\s|")/ );
	assert.equal(
		( draft.match( /class="[^"]*\bhp-about-v2-impact\b/g ) || [] ).length,
		3
	);
	assert.match( aboutV2Css, /\.hp-about-v2-impact\s*\{/ );
} );

test( 'About v2 identity follows the approved first-viewport handoff', () => {
	assert.match( draft, />Developer relations &amp; enablement<\/p>/ );
	assert.match(
		draft,
		/I ship WordPress AI work in public — merged core contributions, provider tooling other developers install, and the documentation that makes both usable\./
	);
	assert.match(
		draft,
		/Open to WordPress AI, developer-enablement, and support-engineering work — full-time or contract, remote or Chicago\./
	);
	assert.match( draft, /href="mailto:htperkins@gmail\.com">htperkins@gmail\.com<\/a>/ );
	assert.match( draft, />github\.com\/henryperkins<\/a>/ );
	assert.match( draft, />linkedin\.com\/in\/henryperkins<\/a>/ );
	assert.doesNotMatch( draft, /<p class="hp-about-kicker">About \/ Résumé<\/p>/ );
	assert.doesNotMatch( aboutV2Css, /100vw\s*-\s*\(2\s*\*/ );
	assert.match( aboutV2Css, /--hp-about-gutter:/ );
} );

test( 'About v2 visual hierarchy uses the handoff type ramp and governed shapes', () => {
	assert.doesNotMatch(
		aboutV2Css,
		/font-size:\s*clamp\(/,
		'About v2 must use the registered fluid type presets instead of local clamps.'
	);
	assert.doesNotMatch(
		aboutV2Css,
		/border-radius:\s*0\.\d+rem/,
		'About v2 radii must resolve through the registered radius tokens.'
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-v2-hero h1\s*\{[^}]*font-size:\s*var\(--wp--preset--font-size--4-xl\);[^}]*font-weight:\s*500;[^}]*line-height:\s*1\.05;[^}]*color:\s*var\(--wp--custom--text--strong\);/s
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-section h2\s*\{[^}]*font-size:\s*var\(--wp--preset--font-size--3-xl\);[^}]*font-weight:\s*500;[^}]*line-height:\s*1\.2;[^}]*color:\s*var\(--wp--custom--text--strong\);/s
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-resume \.hp-about-education > h3\s*\{[^}]*font-size:\s*var\(--wp--preset--font-size--lg\);/s
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-resume \.hp-about-contributions > \.hp-about-section__intro,\s*\.hp-about-resume \.hp-about-skills > \.hp-about-section__intro\s*\{[^}]*max-width:\s*var\(--wp--custom--measure--prose\);/s
	);
} );

test( 'About v2 identity preserves the approved portrait and metadata treatment', () => {
	assert.match(
		aboutV2Css,
		/\.hp-about-resume \.hp-about-v2-hero\s*\{[^}]*padding-block-start:\s*0;/s,
		'The page shell already supplies the first-viewport inset; the candidate hero must not double it.'
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-v2-hero__portrait\s*\{[^}]*border:\s*3px solid var\(--wp--preset--color--gold-400\);[^}]*box-shadow:\s*var\(--wp--custom--shadow--md\);/s
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-v2-hero \.hp-about-kicker\s*\{[^}]*font-family:\s*var\(--wp--preset--font-family--mono\);[^}]*font-size:\s*var\(--wp--preset--font-size--2-xs\);[^}]*letter-spacing:\s*0\.12em;/s
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-v2-hero__location\s*\{[^}]*font-family:\s*var\(--wp--preset--font-family--label\);[^}]*font-size:\s*var\(--wp--preset--font-size--sm\);[^}]*color:\s*var\(--wp--custom--text--accent\);/s
	);
} );

test( 'About v2 closing invitation composes the shared action panel without overriding it', () => {
	assert.match( draft, /class="wp-block-group hp-about-section hp-about-contact hp-action-panel is-closing"/ );
	assert.match( draft, /class="wp-block-buttons hp-action-rail"/ );
	assert.match( sharedCss, /\.hp-action-panel\.is-closing\s*\{[^}]*border-left:\s*var\(--hp-rule-entry\) solid var\(--hp-gold\);[^}]*background:\s*linear-gradient\(/s );
	const contactRule = aboutV2Css.match( /\.hp-about-contact\s*\{[^}]*\}/s );
	assert.ok( contactRule );
	assert.match( contactRule[ 0 ], /margin-bottom:\s*var\(--wp--preset--spacing--7\);/ );
	assert.doesNotMatch( contactRule[ 0 ], /(?:padding|border|background):/, 'Page CSS must not replace the shared closing-panel surface.' );
} );

test( 'About v2 copy control mirrors the approved compact metadata styling', () => {
	assert.match(
		aboutV2Css,
		/\.hp-about-action,\s*\.hp-about-copy\s*\{[^}]*min-height:\s*2\.75rem;[^}]*font-family:\s*var\(--wp--preset--font-family--mono\);/s,
		'The compact copy control must retain a 44px target and the handoff monospace face.'
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-v2-hero__actions \.hp-about-copy\s*\{[^}]*padding-block:\s*2px;[^}]*padding-inline:\s*var\(--wp--preset--spacing--2\);[^}]*border-color:\s*var\(--wp--custom--border--hair\);[^}]*border-radius:\s*var\(--wp--custom--radius--sm\);[^}]*font-size:\s*var\(--wp--preset--font-size--2-xs\);[^}]*font-weight:\s*400;[^}]*line-height:\s*1\.4;[^}]*letter-spacing:\s*0\.06em;[^}]*text-transform:\s*uppercase;[^}]*color:\s*var\(--wp--custom--text--faint\);[^}]*background:\s*var\(--wp--custom--surface--card\);/s
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-v2-hero__actions \.hp-about-copy:hover\s*\{[^}]*border-color:\s*var\(--wp--preset--color--gold-600\);[^}]*color:\s*var\(--wp--custom--text--strong\);[^}]*background:\s*var\(--wp--custom--surface--card\);/s
	);
} );

test( 'About v2 ledgers preserve fixed rule width and redundant status semantics', () => {
	assert.doesNotMatch( aboutV2Css, /border-left:\s*2px solid/ );
	assert.match(
		aboutV2Css,
		/\.hp-about-resume \.hp-about-contribution\s*\{[^}]*border:\s*1px solid var\(--wp--custom--border--hair\);[^}]*border-left:\s*var\(--hp-rule-entry\) solid var\(--wp--custom--status--done\);[^}]*background:\s*var\(--wp--custom--surface--card\);/s
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-resume \.hp-about-skills__controls\s*\{[^}]*border:\s*1px solid var\(--wp--custom--border--hair\);[^}]*border-left:\s*var\(--hp-rule-entry\) solid var\(--wp--custom--rule--gold\);[^}]*background:\s*var\(--wp--custom--surface--sunken\);/s
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-resume \.hp-about-contribution__status::before\s*\{[^}]*content:\s*"● ";/s
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-resume \.hp-about-contribution\.is-review \.hp-about-contribution__status::before\s*\{[^}]*content:\s*"○ ";/s
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-resume \.hp-about-contribution\.is-review\s*\{[^}]*border-left-color:\s*var\(--wp--custom--status--review\);/s
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-resume \.hp-about-contribution__links a\s*\{[^}]*font-size:\s*var\(--wp--preset--font-size--xs\);[^}]*color:\s*var\(--wp--preset--color--river-500\);/s
	);
	const dimmedRule = aboutV2Css.match( /\.hp-about-resume \.hp-about-contribution\.is-dimmed\s*\{[^}]*\}/s );
	assert.ok( dimmedRule );
	assert.doesNotMatch( dimmedRule[ 0 ], /background:/, 'Filtering changes row opacity, not row anatomy or surface.' );
} );

test( 'About v2 desktop rail and skills index retain their 64rem layout', () => {
	const fidelityMarker = '/* About v2 reviewed handoff fidelity';
	const fidelityCss = aboutV2Css.slice( aboutV2Css.indexOf( fidelityMarker ) );

	assert.notEqual( fidelityCss.indexOf( fidelityMarker ), -1 );
	assert.match(
		fidelityCss,
		/@media \(min-width:\s*64rem\)\s*\{[\s\S]*?\.hp-about-resume \.hp-about-v2-layout\s*\{[^}]*grid-template-columns:\s*13rem minmax\(0, 1fr\);/s
	);
	assert.match(
		fidelityCss,
		/@media \(min-width:\s*64rem\)\s*\{[\s\S]*?\.hp-about-resume \.hp-about-rail\s*\{[^}]*display:\s*block;[^}]*overflow:\s*visible;/s
	);
	assert.match(
		fidelityCss,
		/@media \(min-width:\s*64rem\)\s*\{[\s\S]*?\.hp-about-resume \.hp-about-skill-group\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*11rem minmax\(0, 1fr\);/s
	);
} );

test( 'About v2 skill groups keep filter terms in a dedicated wrapping column', () => {
	assert.equal(
		( draft.match( /class="wp-block-group hp-about-skill-group__terms"/g ) || [] ).length,
		5,
		'Each skill group needs one term wrapper so its 11rem label column does not break chip wrapping.'
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-resume \.hp-about-skill-group__terms\s*\{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;/s
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-resume \.hp-about-skill-group > h3\s*\{[^}]*font-family:\s*var\(--wp--preset--font-family--mono\);[^}]*font-size:\s*var\(--wp--preset--font-size--xs\);[^}]*font-weight:\s*700;/s
	);
} );

test( 'About v2 skill controls expose the approved resting hover and active states', () => {
	const controlsRule = aboutV2Css.match( /\.hp-about-resume \.hp-about-skills__controls\s*\{[^}]*\}/s );
	assert.ok( controlsRule );
	assert.match(
		controlsRule[ 0 ],
		/display:\s*flex;[^}]*flex-wrap:\s*wrap;[^}]*align-items:\s*center;[^}]*gap:\s*var\(--wp--preset--spacing--2\) var\(--wp--preset--spacing--4\);/s
	);
	assert.doesNotMatch(
		controlsRule[ 0 ],
		/grid-template-columns:/,
		'The idle state must not reserve an empty grid track and gap for the hidden clear button.'
	);
	const readoutRule = aboutV2Css.match( /\.hp-about-resume \.hp-about-skills__readout\s*\{[^}]*\}/s );
	assert.ok( readoutRule );
	assert.match(
		readoutRule[ 0 ],
		/flex:\s*1 1 16rem;[^}]*min-width:\s*0;[^}]*font-size:\s*var\(--wp--preset--font-size--xs\);[^}]*line-height:\s*1\.7;/s
	);
	assert.doesNotMatch(
		readoutRule[ 0 ],
		/letter-spacing:/,
		'The idle Skills readout must preserve the handoff measure without added tracking.'
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-resume \.hp-about-skills__clear\s*\{[^}]*border:\s*1px solid var\(--wp--custom--border--hair\);[^}]*border-radius:\s*var\(--wp--custom--radius--md\);[^}]*background:\s*var\(--wp--custom--surface--card\);[^}]*font-family:\s*var\(--wp--preset--font-family--mono\);[^}]*font-size:\s*var\(--wp--preset--font-size--2-xs\);/s
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-resume \.hp-about-skills__clear:hover\s*\{[^}]*border-color:\s*var\(--wp--preset--color--gold-600\);[^}]*color:\s*var\(--wp--custom--text--strong\);/s
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-resume \.hp-about-skill-term__button\s*\{[^}]*background:\s*var\(--wp--custom--surface--card\);[^}]*border-color:\s*var\(--wp--custom--border--hair\);/s
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-resume \.hp-about-skill-term__button:hover\s*\{[^}]*background:\s*var\(--wp--custom--brand--subtle\);[^}]*border-color:\s*var\(--wp--preset--color--green-200\);[^}]*color:\s*var\(--wp--custom--text--link\);/s
	);
	assert.match(
		aboutV2Css,
		/\.hp-about-resume \.hp-about-skill-term__button\[aria-pressed="true"\]\s*\{[^}]*background:\s*var\(--wp--custom--brand--default\);[^}]*color:\s*var\(--wp--custom--text--inverse\);/s
	);
} );
