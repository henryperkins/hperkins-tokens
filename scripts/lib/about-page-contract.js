#!/usr/bin/env node

/**
 * The proof-first About page contract (2026-07-28 spec).
 *
 * Owns the reusable parsing, exact-content, outline, destination, ordering,
 * and deterministic word-count helpers shared by
 * scripts/verify-about-page-source.js and the rendered verifier. Everything
 * here is dependency-free; the normative word count runs the same
 * Intl.Segmenter algorithm the rendered verifier injects into Chrome.
 */

const RESUME_HREF = '/one-page-resume/';

const EXPECTED_WCUS_STATUS = {
	label: 'WordCamp US 2026 · Phoenix · Aug 16–19',
	copy: 'I’ll be there, and I’ve been selected to staff the Core AI booth.',
	action: { text: 'Start a conversation', href: '/contact/' },
};

const ABOUT_WORD_RANGE = { min: 850, max: 950 };

// Maximum visible words per content area (the spec's editorial budget).
const ABOUT_SECTION_WORD_CAPS = {
	hero: 70,
	signalsAndNav: 50,
	selectedWork: 225,
	coreAi: 210,
	capabilities: 120,
	experience: 190,
	skillsAndFoundations: 110,
	closing: 40,
};

const EXPECTED_HERO = {
	eyebrow: 'About · Henry Perkins',
	title: 'WordPress / AI Implementation & Enablement',
	strapline: 'For teams building stuff with tokens.',
	lead: 'I turn emerging AI capabilities into shipped, WordPress-shaped systems—and build workflows teams can own after handoff.',
	portraitAlt: 'Henry Perkins',
	actions: [
		{ text: 'Get in touch', href: '/contact/' },
		{ text: 'View résumé (PDF)', href: RESUME_HREF },
	],
};

const EXPECTED_SIGNALS = [
	{
		value: 'WordPress work dating to 2012',
		label: 'Support, delivery, and product work across the WordPress ecosystem.',
	},
	{
		value: '4 featured projects',
		label: 'One stable release, two live deployments, and one public release candidate.',
	},
	{
		value: '2 upstream outcomes',
		label: 'One contribution merged; one reported defect fixed upstream.',
	},
];

const EXPECTED_NAV_LABEL = 'On this page';
const EXPECTED_NAV_LINKS = [
	{ text: 'Work', href: '#selected-work' },
	{ text: 'Contributions', href: '#core-ai-contributions' },
	{ text: 'Capabilities', href: '#capabilities' },
	{ text: 'Experience', href: '#selected-experience' },
	{ text: 'Skills', href: '#skills-and-foundations' },
	{ text: 'Contact', href: '#contact' },
];

const EXPECTED_PROJECTS = [
	{
		title: 'Flavor Agent',
		status: 'Release candidate · v0.1.0-rc.3',
		impact: 'Builds governed WordPress AI actions around bounded operations, human review, server-side attribution, freshness checks, and drift-safe rollback before an agent changes live settings or content.',
		tags: [ 'WordPress', 'AI governance', 'Abilities API', 'MCP' ],
		actions: [
			{ text: 'View Flavor Agent case study', href: '/work/flavor-agent/' },
			{ text: 'View Flavor Agent release', href: 'https://github.com/henryperkins/flavor-agent/releases/tag/v0.1.0-rc.3' },
			{ text: 'View Flavor Agent source', href: 'https://github.com/henryperkins/flavor-agent' },
		],
	},
	{
		title: 'AI Provider for Codex',
		status: 'Released · stable v2.1',
		impact: 'Connects Codex text and image models to the WordPress AI Client through a local sidecar, per-user device login, and a read-only connector status screen inside WordPress.',
		tags: [ 'WordPress', 'PHP', 'AI Client', 'Codex' ],
		actions: [
			{ text: 'View AI Provider for Codex case study', href: '/work/ai-provider-for-codex/' },
			{ text: 'View AI Provider for Codex release', href: 'https://github.com/henryperkins/ai-provider-for-codex/releases/tag/v2.1' },
			{ text: 'View AI Provider for Codex source', href: 'https://github.com/henryperkins/ai-provider-for-codex' },
		],
	},
	{
		title: 'DJ Lee & Voices of Judah',
		status: 'Delivered · live site',
		impact: 'Carries a booking-first client site from discovery through launch and support, with one Cloudflare Worker serving the frontend and a validated booking API for inquiries.',
		tags: [ 'Cloudflare Workers', 'JavaScript', 'Booking API', 'Static site' ],
		actions: [
			{ text: 'View DJ Lee case study', href: '/work/dj-lee-voices-of-judah/' },
			{ text: 'Open DJ Lee live site', href: 'https://thevoicesofjudah.com' },
			{ text: 'View DJ Lee source', href: 'https://github.com/henryperkins/dj-judas-v2' },
		],
	},
	{
		title: 'Tableau',
		status: 'Deployed · live application',
		impact: 'Delivers multiple tarot spreads and LLM-generated reading narratives through a React interface backed by Cloudflare Workers, D1, KV, and R2 services in a live application.',
		tags: [ 'React', 'Cloudflare Workers', 'D1 / KV / R2', 'LLM' ],
		actions: [
			{ text: 'Open Tableau live application', href: 'https://tarot.lakefrontdev.com/' },
			{ text: 'View Tableau source', href: 'https://github.com/henryperkins/tarot' },
		],
	},
];

const EXPECTED_EVIDENCE = {
	kicker: 'Externally verified WordPress AI work',
	title: 'Core AI Contributions',
	summary: 'The strongest proof lives in records I do not control: merged upstream work, release notes, maintainer fixes, and open review threads.',
	rows: [
		{
			classes: [ 'is-status-merged', 'is-kind-docs' ],
			label: 'WordPress/ai PR #501 · authored and merged',
			links: [ { text: 'Experiment documentation merged upstream', href: 'https://github.com/WordPress/ai/pull/501' } ],
			meta: 'Authored the Content Resizing and Title Generation experiment documentation; merged May 18, 2026.',
		},
		{
			classes: [ 'is-status-merged', 'is-kind-issue' ],
			label: 'WordPress/ai issue #529 · report fixed by a maintainer',
			links: [
				{ text: 'Issue #529', href: 'https://github.com/WordPress/ai/issues/529' },
				{ text: 'Maintainer PR #593', href: 'https://github.com/WordPress/ai/pull/593' },
				{ text: 'WordPress AI 1.0.1', href: 'https://github.com/WordPress/ai/releases/tag/1.0.1' },
			],
			meta: 'Reported and reproduced the Guidelines content-type defect; a maintainer fixed it and WordPress AI 1.0.1 shipped it.',
		},
		{
			classes: [ 'is-status-review', 'is-kind-source' ],
			label: 'Open upstream code · PRs #263 and #40',
			links: [
				{ text: 'php-ai-client issue #262', href: 'https://github.com/WordPress/php-ai-client/issues/262' },
				{ text: 'php-ai-client PR #263', href: 'https://github.com/WordPress/php-ai-client/pull/263' },
				{ text: 'ai-provider-for-openai PR #40', href: 'https://github.com/WordPress/ai-provider-for-openai/pull/40' },
			],
			meta: 'Authored finite-vector validation and regression coverage in #263, and model-aware sampling compatibility with tests in #40; both remain open upstream.',
		},
		{
			classes: [ 'is-status-review', 'is-kind-review' ],
			label: 'WordPress/ai issue #732 · report, integration test, technical feedback',
			links: [
				{ text: 'Issue #732', href: 'https://github.com/WordPress/ai/issues/732' },
				{ text: 'PR #757 test result', href: 'https://github.com/WordPress/ai/pull/757#issuecomment-4980297831' },
				{ text: 'Ownership proposal', href: 'https://github.com/WordPress/ai/pull/757#issuecomment-4981567682' },
			],
			meta: 'Authored the report and reproduction. Anubhav Anand authored PR #757; Henry integration-tested it and supplied non-formal technical feedback.',
		},
	],
};

const EXPECTED_CAPABILITIES = {
	eyebrow: 'Capabilities',
	title: 'AI workflows, WordPress delivery, and durable handoffs',
	intro: 'Support, consulting, community, and operations taught me to turn ambiguous inputs into inspectable systems another person can maintain.',
	units: [
		{
			title: 'AI implementation and governed workflows',
			text: 'I connect models and APIs to bounded agent workflows, then add evaluation, review gates, attribution, and safe mutation paths before anything reaches a live system.',
		},
		{
			title: 'WordPress delivery and support',
			text: 'I carry WordPress work from discovery and troubleshooting through implementation, deployment, and post-launch support, keeping operational ownership visible before and after handoff.',
		},
		{
			title: 'Documentation and developer enablement',
			text: 'I write reusable guidance and onboarding paths that translate between users, support, product, and engineering, so another person can operate and improve the system confidently.',
		},
	],
};

const EXPECTED_EXPERIENCE = {
	eyebrow: 'Selected résumé',
	title: 'Selected Experience',
	footerText: 'Full chronology, including earlier roles, is in the PDF résumé.',
	footerLink: { text: 'PDF résumé', href: RESUME_HREF },
	entries: [
		{
			role: 'Independent Technology Consultant',
			dates: 'Oct 2022 – Present',
			org: 'Lakefront Digital · Greater Chicago Area, IL',
			bullets: [
				'Delivered the DJ Lee & Voices of Judah booking-first site from discovery through launch and post-launch support on one Cloudflare Worker.',
				'Maintains public WordPress work with versioned releases, source verification, deployment checks, and documentation that teams can own after handoff.',
			],
		},
		{
			role: 'Shift Supervisor',
			dates: 'Apr 2019 – Sep 2022',
			org: 'Starbucks · Greater Chicago Area, IL',
			bullets: [
				'Coordinated frontline teams through high-volume shifts, handled escalations, and coached repeatable routines that preserved service, safety, and workflow standards under pressure.',
			],
		},
		{
			role: 'Happiness Engineer',
			dates: 'Oct 2012 – Nov 2012',
			org: 'Automattic, Inc. (WordPress.com) · Remote',
			bullets: [
				'Resolved WordPress.com publishing, site configuration, billing, domain, and DNS issues while capturing reproducible details for product and engineering teams to inspect.',
				'Wrote clear troubleshooting that addressed root causes, reduced account and site-configuration confusion, and gave customers practical next steps they could follow.',
			],
		},
		{
			role: 'Developer Community Manager',
			dates: 'May 2012 – Oct 2012',
			org: 'PageLines, Inc. · Remote',
			bullets: [
				'Supported WordPress professionals through onboarding, tutorials, daily community work, and WordCamp representation while translating feedback into clearer product guidance for developers.',
			],
		},
	],
};

const EXPECTED_SKILL_GROUPS = [
	{
		legend: 'WordPress and web delivery',
		tags: [ 'WordPress', 'PHP', 'JavaScript', 'TypeScript', 'React', 'Cloudflare Workers' ],
	},
	{
		legend: 'AI and automation',
		tags: [ 'WordPress AI Client', 'Abilities API', 'MCP', 'OpenAI API integrations', 'Agent workflow prototyping', 'Prompt design' ],
	},
	{
		legend: 'Support and enablement',
		tags: [ 'Technical support', 'Escalation triage', 'Documentation', 'Customer onboarding', 'Developer enablement', 'Team coaching' ],
	},
	{
		legend: 'Tools and workflow',
		tags: [ 'Git', 'GitHub', 'REST APIs', 'Webhook configuration', 'Vite', 'Python · familiarity' ],
	},
];

const EXPECTED_AI_LEADERS = {
	sentence: 'Finalist in the first AI Leaders cohort, a University of Illinois Chicago and WordPress Foundation program supported by Automattic; view my portfolio on the program showcase.',
	link: { text: 'view my portfolio on the program showcase', href: 'https://aileaderswp.blog/' },
};

const EXPECTED_EDUCATION = [
	{ degree: 'A.S., Business Administration & Management', school: 'College of DuPage', period: '2013' },
	{ degree: 'Studies in Journalism & Mass Communications', school: 'Columbia College Chicago', period: '2007 – 2008' },
];

const EXPECTED_CLOSING = {
	anchor: 'contact',
	eyebrow: 'Work together',
	title: 'Build the handoff into the system.',
	body: 'If your team is shaping WordPress and AI systems that need to ship—and stay operable—let’s compare notes.',
	actions: [
		{ text: 'Start a conversation', href: '/contact/' },
		{ text: 'View résumé (PDF)', href: RESUME_HREF },
	],
};

// H1 plus the complete, ordered H2/H3 inventory with each heading's required
// top-level section (hero for the H1; fragment anchors for the rest).
const EXPECTED_HEADINGS = [
	{ level: 1, text: EXPECTED_HERO.title, section: 'hero' },
	{ level: 2, text: 'Selected Work', section: 'selected-work' },
	{ level: 3, text: 'Flavor Agent', section: 'selected-work' },
	{ level: 3, text: 'AI Provider for Codex', section: 'selected-work' },
	{ level: 3, text: 'DJ Lee & Voices of Judah', section: 'selected-work' },
	{ level: 3, text: 'Tableau', section: 'selected-work' },
	{ level: 2, text: 'Core AI Contributions', section: 'core-ai-contributions' },
	{ level: 2, text: EXPECTED_CAPABILITIES.title, section: 'capabilities' },
	{ level: 3, text: 'AI implementation and governed workflows', section: 'capabilities' },
	{ level: 3, text: 'WordPress delivery and support', section: 'capabilities' },
	{ level: 3, text: 'Documentation and developer enablement', section: 'capabilities' },
	{ level: 2, text: 'Selected Experience', section: 'selected-experience' },
	{ level: 3, text: 'Independent Technology Consultant', section: 'selected-experience' },
	{ level: 3, text: 'Shift Supervisor', section: 'selected-experience' },
	{ level: 3, text: 'Happiness Engineer', section: 'selected-experience' },
	{ level: 3, text: 'Developer Community Manager', section: 'selected-experience' },
	{ level: 2, text: 'Foundations', section: 'skills-and-foundations' },
	{ level: 3, text: 'AI Leaders', section: 'skills-and-foundations' },
	{ level: 3, text: 'Education', section: 'skills-and-foundations' },
	{ level: 2, text: EXPECTED_CLOSING.title, section: 'contact' },
];

// ---------------------------------------------------------------------------
// Text extraction (the deterministic word-count pipeline)
// ---------------------------------------------------------------------------

// Named references the candidate may use. Anything else named fails loudly so
// a new entity is a decision, not silent drift. Decimal/hex always decode.
const NAMED_REFERENCES = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
	hellip: '…',
	mdash: '—',
	ndash: '–',
	middot: '·',
	rsquo: '’',
	lsquo: '‘',
	rdquo: '”',
	ldquo: '“',
	eacute: 'é',
};

const VOID_ELEMENTS = new Set( [
	'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
	'meta', 'param', 'source', 'track', 'wbr',
] );

function assertNoForbiddenMarkup( html, label = 'About body' ) {
	const forbidden = [
		{ pattern: /<\?php|<\?=/i, reason: 'PHP' },
		{ pattern: /<script\b/i, reason: 'a script element' },
		{ pattern: /<style\b/i, reason: 'a style element' },
		{ pattern: /<template\b/i, reason: 'a template element' },
		{ pattern: /<[a-z][^>]*\shidden(?=[\s>=/])/i, reason: 'the HTML hidden attribute' },
	];
	for ( const { pattern, reason } of forbidden ) {
		if ( pattern.test( html ) ) {
			throw new Error( `${ label } must not contain ${ reason }.` );
		}
	}
}

function stripComments( html ) {
	// Gutenberg block delimiters are HTML comments; both go. Replaced with a
	// space so adjacent text nodes keep their boundary.
	return html.replace( /<!--[\s\S]*?-->/g, ' ' );
}

// Remove every element subtree carrying aria-hidden="true" (decorative text
// such as the hp-tag "#" prefix). Stack-based so nesting and repeated tags
// cannot confuse it. Runs before tags are stripped.
function removeAriaHiddenSubtrees( html ) {
	const tokens = [ ...html.matchAll( /<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g ) ];
	const removals = [];
	let removeFrom = null;
	let depth = 0;

	for ( const token of tokens ) {
		const [ full, rawName, rawAttrs ] = token;
		const name = rawName.toLowerCase();
		const isClose = full.startsWith( '</' );
		const isSelfClosing = /\/>$/.test( full ) || VOID_ELEMENTS.has( name );

		if ( removeFrom === null ) {
			if ( ! isClose && /\saria-hidden=("true"|'true')/.test( ` ${ rawAttrs }` ) ) {
				if ( isSelfClosing ) {
					removals.push( [ token.index, token.index + full.length ] );
				} else {
					removeFrom = token.index;
					depth = 1;
				}
			}
			continue;
		}

		if ( isSelfClosing ) {
			continue;
		}
		if ( ! isClose ) {
			depth++;
		} else {
			depth--;
			if ( depth === 0 ) {
				removals.push( [ removeFrom, token.index + full.length ] );
				removeFrom = null;
			}
		}
	}

	if ( removeFrom !== null ) {
		throw new Error( 'Unbalanced aria-hidden element in About markup.' );
	}

	let output = '';
	let cursor = 0;
	for ( const [ start, end ] of removals ) {
		output += html.slice( cursor, start );
		cursor = end;
	}
	output += html.slice( cursor );
	return output;
}

function stripTags( html ) {
	// A space per removed tag preserves the boundary between adjacent text
	// nodes ("</p><p>" can never glue two words together).
	return html.replace( /<\/?[a-zA-Z][^>]*>/g, ' ' );
}

function decodeCharacterReferences( text, label = 'About body' ) {
	return text.replace( /&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, ( match, body ) => {
		if ( body[ 0 ] === '#' ) {
			const isHex = body[ 1 ] === 'x' || body[ 1 ] === 'X';
			const code = Number.parseInt( body.slice( isHex ? 2 : 1 ), isHex ? 16 : 10 );
			try {
				// String.fromCodePoint throws a bare RangeError past U+10FFFF;
				// keep the failure labelled with the offending reference.
				return String.fromCodePoint( code );
			} catch ( cause ) {
				throw new Error( `${ label } contains an undecodable numeric reference: ${ match }`, { cause } );
			}
		}
		if ( ! Object.hasOwn( NAMED_REFERENCES, body ) ) {
			throw new Error( `${ label } contains an unknown named character reference: ${ match }` );
		}
		return NAMED_REFERENCES[ body ];
	} );
}

function normalizeExtractedText( text ) {
	return text
		.normalize( 'NFC' )
		.replace( / /g, ' ' )
		.replace( /\s+/gu, ' ' )
		.trim();
}

function extractVisibleText( html, { label = 'About body' } = {} ) {
	assertNoForbiddenMarkup( html, label );
	const withoutComments = stripComments( html );
	const withoutHiddenSubtrees = removeAriaHiddenSubtrees( withoutComments );
	const withoutTags = stripTags( withoutHiddenSubtrees );
	const decoded = decodeCharacterReferences( withoutTags, label );
	return normalizeExtractedText( decoded );
}

// Exact-copy extraction for one leaf element: inline tags (<a>, <span>)
// vanish with no separator, exactly like the browser's textContent, so
// "in the <a>PDF résumé</a>." reads "in the PDF résumé." — no space before
// the period. Word counting must NOT use this (block boundaries would glue);
// exact-text comparison must not use the boundary-preserving variant
// (punctuation after an inline link would detach).
function extractExactText( html, { label = 'About body' } = {} ) {
	assertNoForbiddenMarkup( html, label );
	const withoutComments = stripComments( html );
	const withoutHiddenSubtrees = removeAriaHiddenSubtrees( withoutComments );
	const withoutTags = withoutHiddenSubtrees.replace( /<\/?[a-zA-Z][^>]*>/g, '' );
	const decoded = decodeCharacterReferences( withoutTags, label );
	return normalizeExtractedText( decoded );
}

function countWords( text ) {
	const segmenter = new Intl.Segmenter( 'en', { granularity: 'word' } );
	let count = 0;
	for ( const segment of segmenter.segment( text ) ) {
		if ( segment.isWordLike ) {
			count++;
		}
	}
	return count;
}

function countVisibleWords( html, options ) {
	return countWords( extractVisibleText( html, options ) );
}

// Counts the text the browser rendered. The rendered verifier ships the page's
// innerText back to Node and calls this, so exactly one Intl.Segmenter — this
// process's — ever segments the About page.
//
// Counting in both runtimes and comparing the two numbers was the earlier
// design, and it could not hold: pinning Node in CI leaves Chrome's ICU
// unpinned, and the two already disagree on this page. Node segments
// "WordPress.com" and "A.S." as one word-like segment each; Chrome splits both,
// so an unchanged, correct page reported 884 rendered against 881 source. The
// count is a content assertion, not a browser assertion — one segmenter is the
// only way it stays one.
function countRenderedText( text ) {
	return countWords( normalizeExtractedText( text ) );
}

// ---------------------------------------------------------------------------
// Block parsing
// ---------------------------------------------------------------------------

const BLOCK_DELIMITER =
	/<!--\s*(\/)?wp:([a-z][a-z0-9_/-]*)\s*(\{[\s\S]*?\})?\s*(\/)?-->/g;

function assertNoCoreHtmlBlocks( html, label = 'About body' ) {
	for ( const match of html.matchAll( BLOCK_DELIMITER ) ) {
		const [ , closing, name ] = match;
		if ( ! closing && name === 'html' ) {
			throw new Error( `${ label } must not contain core/html blocks, including nested blocks.` );
		}
	}
}

function parseTopLevelBlocks( html ) {
	const blocks = [];
	let open = null;
	let depth = 0;

	for ( const match of html.matchAll( BLOCK_DELIMITER ) ) {
		const [ full, closing, name, attrsRaw, selfClosing ] = match;

		if ( closing ) {
			depth--;
			if ( depth < 0 ) {
				throw new Error( `Unbalanced block closer near: ${ full }` );
			}
			if ( depth === 0 && open ) {
				blocks.push( {
					name: open.name,
					attrs: open.attrs,
					outer: html.slice( open.start, match.index + full.length ),
					start: open.start,
					end: match.index + full.length,
				} );
				open = null;
			}
			continue;
		}

		if ( selfClosing ) {
			if ( depth === 0 ) {
				blocks.push( {
					name,
					attrs: attrsRaw ? JSON.parse( attrsRaw ) : {},
					outer: full,
					start: match.index,
					end: match.index + full.length,
				} );
			}
			continue;
		}

		if ( depth === 0 ) {
			open = {
				name,
				attrs: attrsRaw ? JSON.parse( attrsRaw ) : {},
				start: match.index,
			};
		}
		depth++;
	}

	if ( depth !== 0 ) {
		throw new Error( 'Unbalanced block delimiters in About markup.' );
	}

	return blocks;
}

// Proves the parsed top-level blocks account for the whole body: everything
// before the first block, between consecutive blocks, and after the last one
// must be whitespace.
function assertBlockCoverage( html, blocks, label = 'About body' ) {
	let cursor = 0;
	const residue = [];
	for ( const block of blocks ) {
		const gap = html.slice( cursor, block.start );
		if ( gap.trim() !== '' ) {
			residue.push( gap.trim() );
		}
		cursor = block.end;
	}
	const tail = html.slice( cursor );
	if ( tail.trim() !== '' ) {
		residue.push( tail.trim() );
	}

	if ( residue.length ) {
		const sample = residue[ 0 ].replace( /\s+/g, ' ' ).slice( 0, 120 );
		throw new Error(
			`${ label } carries markup outside its top-level blocks (${ residue.length } run(s)); first: ${ sample }`
		);
	}
}

function findHeadings( html, label ) {
	return [ ...html.matchAll( /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi ) ].map( ( match ) => ( {
		level: Number( match[ 1 ] ),
		text: extractExactText( match[ 2 ], { label } ),
		raw: match[ 2 ],
	} ) );
}

function findLinks( html, label ) {
	return [ ...html.matchAll( /<a\b([^>]*)>([\s\S]*?)<\/a>/gi ) ].map( ( match ) => {
		const href = / href="([^"]*)"/.exec( ` ${ match[ 1 ] }` );
		return {
			href: href ? href[ 1 ] : null,
			text: extractExactText( match[ 2 ], { label } ),
		};
	} );
}

function findByClass( html, className, label ) {
	const pattern = new RegExp(
		`<([a-z][a-z0-9-]*)\\b[^>]*class="[^"]*(?<![\\w-])${ className.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) }(?![\\w-])[^"]*"[^>]*>([\\s\\S]*?)</\\1>`,
		'gi'
	);
	return [ ...html.matchAll( pattern ) ].map( ( match ) => ( {
		tag: match[ 1 ].toLowerCase(),
		inner: match[ 2 ],
		text: extractExactText( match[ 2 ], { label } ),
	} ) );
}

// findByClass is lazy, which is right for leaf elements (p, h*, span) but
// truncates containers whose children repeat the container's tag (a Buttons
// rail full of <div class="wp-block-button">). This variant balances the
// container's own tag name to find the real closer.
function findBalancedByClass( html, className, label ) {
	const escaped = className.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
	const openPattern = new RegExp(
		`<([a-z][a-z0-9-]*)\\b[^>]*class="[^"]*(?<![\\w-])${ escaped }(?![\\w-])[^"]*"[^>]*>`,
		'gi'
	);
	const results = [];

	for ( const open of html.matchAll( openPattern ) ) {
		const tag = open[ 1 ].toLowerCase();
		const tagPattern = new RegExp( `<${ tag }\\b[^>]*>|</${ tag }>`, 'gi' );
		tagPattern.lastIndex = open.index + open[ 0 ].length;
		let depth = 1;
		let inner = null;
		for ( let token = tagPattern.exec( html ); token; token = tagPattern.exec( html ) ) {
			depth += token[ 0 ].startsWith( '</' ) ? -1 : 1;
			if ( depth === 0 ) {
				inner = html.slice( open.index + open[ 0 ].length, token.index );
				break;
			}
		}
		if ( inner === null ) {
			throw new Error( `Unbalanced <${ tag } class~="${ className }"> element in About markup.` );
		}
		results.push( { tag, inner, text: extractExactText( inner, { label } ) } );
	}

	return results;
}

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function assertExact( actual, expected, what ) {
	assert(
		actual === expected,
		`${ what } must read exactly ${ JSON.stringify( expected ) }, got ${ JSON.stringify( actual ) }.`
	);
}

function findSectionBlock( blocks, anchor ) {
	const block = blocks.find( ( candidate ) => candidate.attrs?.anchor === anchor );
	assert( block, `About body is missing the section with anchor "${ anchor }".` );
	assert(
		block.attrs.tagName === 'section',
		`Section "${ anchor }" must be a core Group with tagName:"section".`
	);
	assert(
		new RegExp( `<section\\b[^>]*id="${ anchor }"` ).test( block.outer ),
		`Section "${ anchor }" markup must carry id="${ anchor }" on its section element.`
	);
	const openTag = /<section\b[^>]*>/.exec( block.outer )[ 0 ];
	assert(
		! /aria-label=|aria-labelledby=/.test( openTag ),
		`Section "${ anchor }" must not carry aria-label or aria-labelledby.`
	);
	return block;
}

/**
 * Run the complete normative source contract against one About body (the
 * reviewed candidate or the accepted snapshot). Returns the word-count
 * report; throws with a labelled message on the first violation.
 */
function verifyAboutBody( html, { label = 'About body' } = {} ) {
	assertNoForbiddenMarkup( html, label );
	assertNoCoreHtmlBlocks( html, label );

	const blocks = parseTopLevelBlocks( html );

	// --- top-level composition ------------------------------------------------
	const shape = blocks.map( ( block ) => block.attrs?.anchor || block.attrs?.className || block.name );
	const expectedShape = [
		'hp-about-hero',
		'hp-signal-strip hp-about-impact',
		'hp-about-nav',
		'selected-work',
		'core-ai-contributions',
		'capabilities',
		'selected-experience',
		'skills-and-foundations',
		'contact',
		'paragraph',
	];
	assert(
		shape.length === expectedShape.length && expectedShape.every( ( entry, index ) => shape[ index ] === entry ),
		`${ label } top-level composition must be [${ expectedShape.join( ', ' ) }], got [${ shape.join( ', ' ) }].`
	);

	// The shape check reads only what sits inside block delimiters, so on its
	// own it says nothing about markup between or around the blocks. Without
	// this, a stray <div> — extra copy, an unreviewed outbound link — passes
	// the entire contract: no section owns it, so no cap moves and no heading
	// inventory changes. Require the body to be its blocks plus whitespace.
	assertBlockCoverage( html, blocks, label );

	const [ hero, signals, navBlock ] = blocks;

	// --- hero -------------------------------------------------------------
	const heroEyebrows = findByClass( hero.outer, 'hp-about-hero__kicker', label );
	assert( heroEyebrows.length === 1, 'Hero must contain exactly one kicker.' );
	assertExact( heroEyebrows[ 0 ].text, EXPECTED_HERO.eyebrow, 'Hero eyebrow' );

	const heroHeadings = findHeadings( hero.outer, label );
	assert( heroHeadings.length === 1 && heroHeadings[ 0 ].level === 1, 'Hero must contain exactly the page H1.' );
	assertExact( heroHeadings[ 0 ].text, EXPECTED_HERO.title, 'Hero H1' );

	const straplines = findByClass( hero.outer, 'hp-about-hero__strapline', label );
	assert( straplines.length === 1, 'Hero must contain exactly one strapline.' );
	assertExact( straplines[ 0 ].text, EXPECTED_HERO.strapline, 'Hero strapline' );

	const leads = findByClass( hero.outer, 'hp-about-hero__lead', label );
	assert( leads.length === 1, 'Hero must contain exactly one lead.' );
	assertExact( leads[ 0 ].text, EXPECTED_HERO.lead, 'Hero lead' );

	assert( ! hero.outer.includes( 'hp-role-tags' ), 'The hero role-tag row is removed by the redesign.' );

	const heroRails = findBalancedByClass( hero.outer, 'hp-action-rail', label );
	assert( heroRails.length === 1, 'Hero must contain exactly one action rail.' );
	const heroActions = findLinks( heroRails[ 0 ].inner, label );
	assert( heroActions.length === 2, 'Hero rail must contain exactly two actions.' );
	EXPECTED_HERO.actions.forEach( ( expected, index ) => {
		assertExact( heroActions[ index ].text, expected.text, `Hero action ${ index + 1 } label` );
		assertExact( heroActions[ index ].href, expected.href, `Hero action ${ index + 1 } destination` );
	} );

	const heroCopy = findBalancedByClass( hero.outer, 'hp-about-hero__copy', label );
	assert( heroCopy.length === 1, 'Hero must contain exactly one copy group.' );
	const wcusGroups = findBalancedByClass( heroCopy[ 0 ].inner, 'hp-about-wcus', label );
	assert( wcusGroups.length === 1, 'Hero copy must contain exactly one WordCamp US status group.' );
	assert( ! wcusGroups[ 0 ].inner.includes( 'hp-action-rail' ), 'The WordCamp US action must stay outside hp-action-rail.' );
	const wcusLabel = findByClass( wcusGroups[ 0 ].inner, 'hp-about-wcus__label', label );
	assert( wcusLabel.length === 1, 'WordCamp US status must contain one label.' );
	assertExact( wcusLabel[ 0 ].text, EXPECTED_WCUS_STATUS.label, 'WordCamp US event label' );
	const wcusCopy = findByClass( wcusGroups[ 0 ].inner, 'hp-about-wcus__copy', label );
	assert( wcusCopy.length === 1, 'WordCamp US status must contain one copy paragraph.' );
	assertExact( wcusCopy[ 0 ].text, EXPECTED_WCUS_STATUS.copy, 'WordCamp US event copy' );
	const wcusActions = findLinks( wcusGroups[ 0 ].inner, label );
	assert( wcusActions.length === 1, 'WordCamp US status must contain exactly one action.' );
	assertExact( wcusActions[ 0 ].text, EXPECTED_WCUS_STATUS.action.text, 'WordCamp US event action label' );
	assertExact( wcusActions[ 0 ].href, EXPECTED_WCUS_STATUS.action.href, 'WordCamp US event action destination' );
	assert(
		heroCopy[ 0 ].inner.indexOf( 'hp-about-wcus' ) > heroCopy[ 0 ].inner.indexOf( 'hp-about-hero__cta' ),
		'WordCamp US status must follow the hero action rail.'
	);

	const portrait = /<img\b[^>]*alt="([^"]*)"[^>]*>/.exec( hero.outer );
	assert( portrait, 'Hero must retain the portrait image.' );
	assertExact( portrait[ 1 ], EXPECTED_HERO.portraitAlt, 'Portrait alternative text' );

	// --- proof signals ------------------------------------------------------
	const values = findByClass( signals.outer, 'hp-signal__value', label );
	const labels = findByClass( signals.outer, 'hp-signal__label', label );
	assert(
		values.length === 3 && labels.length === 3,
		`Proof signals must contain exactly three cells, got ${ values.length } values / ${ labels.length } labels.`
	);
	EXPECTED_SIGNALS.forEach( ( expected, index ) => {
		assertExact( values[ index ].text, expected.value, `Signal ${ index + 1 } value` );
		assertExact( labels[ index ].text, expected.label, `Signal ${ index + 1 } label` );
	} );

	// --- on-this-page navigation --------------------------------------------
	assert( navBlock.name === 'group', 'The page navigation must be one native core Group block.' );
	assertExact( navBlock.attrs.tagName, 'nav', 'Navigation Group tag name' );
	assertExact( navBlock.attrs.ariaLabel, 'On this page', 'Navigation Group aria label' );
	assert(
		( navBlock.attrs.className || '' ).split( /\s+/ ).includes( 'hp-about-nav' ),
		'The navigation Group must retain the hp-about-nav contract class.'
	);
	const navRoots = [ ...navBlock.outer.matchAll( /<nav\b[^>]*>/g ) ];
	assert( navRoots.length === 1, 'The navigation block must contain exactly one nav root.' );
	assert(
		/aria-label="On this page"/.test( navRoots[ 0 ][ 0 ] ),
		'The nav landmark must be labelled "On this page".'
	);
	const navInner = /<nav\b[^>]*>([\s\S]*)<\/nav>/.exec( navBlock.outer );
	assert( navInner, 'The nav root must close inside the block.' );
	const navLabel = findByClass( navBlock.outer, 'hp-about-nav__label', label );
	assert( navLabel.length === 1, 'The nav must contain one visible label.' );
	assertExact( navLabel[ 0 ].text, EXPECTED_NAV_LABEL, 'Nav label' );
	assert( ! /<h[1-6]\b/.test( navBlock.outer ), 'The nav label must not be a heading.' );
	const navLists = [ ...navBlock.outer.matchAll( /<ul\b[^>]*>/g ) ];
	assert( navLists.length === 1, 'The nav must contain exactly one list.' );
	assert(
		/<!-- wp:list \{"className":"hp-about-nav__list"\} -->/.test( navBlock.outer ),
		'The nav links must be serialized in one native core List block.'
	);
	assert(
		[ ...navBlock.outer.matchAll( /<!-- wp:list-item -->/g ) ].length === 6,
		'The nav must contain exactly six native List Item blocks.'
	);
	const navLinks = findLinks( navInner[ 1 ], label );
	assert( navLinks.length === 6, `The nav must contain exactly six links, got ${ navLinks.length }.` );
	EXPECTED_NAV_LINKS.forEach( ( expected, index ) => {
		assertExact( navLinks[ index ].text, expected.text, `Nav link ${ index + 1 } label` );
		assertExact( navLinks[ index ].href, expected.href, `Nav link ${ index + 1 } fragment` );
	} );
	const fragmentIds = EXPECTED_NAV_LINKS.map( ( link ) => link.href.slice( 1 ) );
	assert( new Set( fragmentIds ).size === 6, 'Fragment identifiers must be unique.' );

	// --- section ordering + targets -----------------------------------------
	for ( const anchor of fragmentIds ) {
		findSectionBlock( blocks, anchor );
	}
	const order = blocks.map( ( block ) => block.attrs?.anchor ).filter( Boolean );
	assert(
		order.join( ',' ) === fragmentIds.join( ',' ),
		`Sections must appear in the approved order ${ fragmentIds.join( ', ' ) }, got ${ order.join( ', ' ) }.`
	);

	// --- selected work -------------------------------------------------------
	const work = findSectionBlock( blocks, 'selected-work' );
	const workEyebrow = findByClass( work.outer, 'hp-eyebrow', label );
	assert( workEyebrow.length >= 1, 'Selected Work must open with its eyebrow.' );
	assertExact( workEyebrow[ 0 ].text, 'Public proof', 'Selected Work eyebrow' );

	const workCards = findByClass( work.outer, 'hp-work-card', label ).filter( ( entry ) => entry.tag === 'div' );
	const workCardBlocks = [ ...work.outer.matchAll( /<!-- wp:column \{"className":"hp-work-card"\} -->([\s\S]*?)<!-- \/wp:column -->/g ) ];
	assert(
		workCardBlocks.length === 4,
		`Selected Work must contain exactly four project cards, got ${ workCardBlocks.length }.`
	);
	assert( workCards.length === 4, 'Every project card must render as a hp-work-card column.' );

	EXPECTED_PROJECTS.forEach( ( project, index ) => {
		const card = workCardBlocks[ index ][ 1 ];
		const cardLabel = `${ label } project ${ project.title }`;

		const titles = findHeadings( card, label );
		assert(
			titles.length === 1 && titles[ 0 ].level === 3,
			`${ project.title } card must contain exactly one H3 title.`
		);
		assertExact( titles[ 0 ].text, project.title, `Project ${ index + 1 } title` );
		assert(
			! /<a\b/.test( titles[ 0 ].raw ),
			`${ project.title } H3 must be plain text, not a link.`
		);

		const status = findByClass( card, 'hp-work-card__status', label );
		assert( status.length === 1, `${ cardLabel } must carry one status line.` );
		assertExact( status[ 0 ].text, project.status, `Project ${ index + 1 } status` );

		const impact = findByClass( card, 'hp-work-card__impact', label );
		assert( impact.length === 1, `${ cardLabel } must carry one impact paragraph.` );
		assertExact( impact[ 0 ].text, project.impact, `Project ${ index + 1 } impact` );

		const tags = findByClass( card, 'hp-project__tech', label ).map( ( tag ) => tag.text );
		assert(
			tags.join( '|' ) === project.tags.join( '|' ),
			`Project ${ index + 1 } technology tags must be [${ project.tags.join( '; ' ) }], got [${ tags.join( '; ' ) }].`
		);

		const actionsGroups = findByClass( card, 'hp-work-card__actions', label );
		assert( actionsGroups.length === 1, `${ cardLabel } must carry one actions row.` );
		const actions = findLinks( actionsGroups[ 0 ].inner, label );
		assert(
			actions.length === project.actions.length,
			`Project ${ index + 1 } must expose ${ project.actions.length } actions, got ${ actions.length }.`
		);
		project.actions.forEach( ( expected, actionIndex ) => {
			assertExact( actions[ actionIndex ].text, expected.text, `Project ${ index + 1 } action ${ actionIndex + 1 } label` );
			assertExact( actions[ actionIndex ].href, expected.href, `Project ${ index + 1 } action ${ actionIndex + 1 } destination` );
		} );

		const cardLinks = findLinks( card, label );
		assert(
			cardLinks.length === project.actions.length,
			`${ cardLabel } must contain only its action links (no whole-card or title anchor).`
		);
		assert(
			! /target="/.test( card ),
			`${ cardLabel } actions must stay in the same browsing context.`
		);
	} );

	assert( ! /HPerkins\.com/i.test( work.outer ), 'HPerkins.com must not occupy a Selected Work position.' );

	// --- core AI contributions ------------------------------------------------
	const coreAi = findSectionBlock( blocks, 'core-ai-contributions' );
	const kicker = findByClass( coreAi.outer, 'hp-evidence-board__kicker', label );
	assert( kicker.length === 1, 'EvidenceBoard must keep its kicker.' );
	assertExact( kicker[ 0 ].text, EXPECTED_EVIDENCE.kicker, 'EvidenceBoard kicker' );
	const summary = findByClass( coreAi.outer, 'hp-evidence-board__summary', label );
	assert( summary.length === 1, 'EvidenceBoard must keep its summary.' );
	assertExact( summary[ 0 ].text, EXPECTED_EVIDENCE.summary, 'EvidenceBoard summary' );

	const rowBlocks = [ ...coreAi.outer.matchAll( /<!-- wp:group \{"className":"hp-evidence-row ([^"]*)"[\s\S]*?-->([\s\S]*?<!-- \/wp:group -->)/g ) ];
	assert( rowBlocks.length === 4, `Core AI Contributions must keep exactly four evidence rows, got ${ rowBlocks.length }.` );
	EXPECTED_EVIDENCE.rows.forEach( ( expected, index ) => {
		const [ , classes, rowHtml ] = rowBlocks[ index ];
		assert(
			expected.classes.every( ( className ) => classes.split( /\s+/ ).includes( className ) ),
			`Evidence row ${ index + 1 } must carry ${ expected.classes.join( ' ' ) }, got "${ classes }".`
		);
		const rowLabel = findByClass( rowHtml, 'hp-evidence-row__label', label );
		assertExact( rowLabel[ 0 ]?.text, expected.label, `Evidence row ${ index + 1 } label` );
		const rowLinks = findLinks( rowHtml, label );
		assert(
			rowLinks.length === expected.links.length,
			`Evidence row ${ index + 1 } must contain ${ expected.links.length } link(s), got ${ rowLinks.length }.`
		);
		expected.links.forEach( ( expectedLink, linkIndex ) => {
			assertExact( rowLinks[ linkIndex ].text, expectedLink.text, `Evidence row ${ index + 1 } link ${ linkIndex + 1 } text` );
			assertExact( rowLinks[ linkIndex ].href, expectedLink.href, `Evidence row ${ index + 1 } link ${ linkIndex + 1 } destination` );
		} );
		const meta = findByClass( rowHtml, 'hp-evidence-row__meta', label );
		assertExact( meta[ 0 ]?.text, expected.meta, `Evidence row ${ index + 1 } meta` );
		assert(
			! /aria-hidden/.test( rowHtml ),
			`Evidence row ${ index + 1 } status text must stay in the accessible name (no aria-hidden).`
		);
	} );

	// --- capabilities ---------------------------------------------------------
	const capabilities = findSectionBlock( blocks, 'capabilities' );
	const capEyebrow = findByClass( capabilities.outer, 'hp-eyebrow', label );
	assertExact( capEyebrow[ 0 ]?.text, EXPECTED_CAPABILITIES.eyebrow, 'Capabilities eyebrow' );
	const capIntro = findByClass( capabilities.outer, 'hp-about-capabilities__intro', label );
	assert( capIntro.length === 1, 'Capabilities must carry exactly one introduction.' );
	assertExact( capIntro[ 0 ].text, EXPECTED_CAPABILITIES.intro, 'Capabilities introduction' );
	const capTexts = findByClass( capabilities.outer, 'hp-capability__text', label );
	assert(
		capTexts.length === 3,
		`Capabilities must carry exactly one paragraph per unit (three total), got ${ capTexts.length }.`
	);
	EXPECTED_CAPABILITIES.units.forEach( ( unit, index ) => {
		assertExact( capTexts[ index ].text, unit.text, `Capability ${ index + 1 } paragraph` );
	} );

	// --- selected experience ----------------------------------------------------
	const experience = findSectionBlock( blocks, 'selected-experience' );
	const expEyebrow = findByClass( experience.outer, 'hp-eyebrow', label );
	assertExact( expEyebrow[ 0 ]?.text, EXPECTED_EXPERIENCE.eyebrow, 'Experience eyebrow' );
	assert(
		! experience.outer.includes( 'hp-exp__artifacts' ),
		'The repeated Experience artifacts paragraph is removed by the redesign.'
	);
	assert( ! /Micro Center/.test( html ), 'The Micro Center entry moves out of the page.' );

	const roles = findByClass( experience.outer, 'hp-exp__role', label );
	const dates = findByClass( experience.outer, 'hp-exp__dates', label );
	const orgs = findByClass( experience.outer, 'hp-exp__org', label );
	assert( roles.length === 4, `Selected Experience must retain four roles, got ${ roles.length }.` );
	assert( dates.length === 4, `Selected Experience must carry four date lines, got ${ dates.length }.` );
	assert( orgs.length === 4, `Selected Experience must carry four organization lines, got ${ orgs.length }.` );
	EXPECTED_EXPERIENCE.entries.forEach( ( entry, index ) => {
		assertExact( roles[ index ].text, entry.role, `Experience role ${ index + 1 }` );
		assertExact( dates[ index ].text, entry.dates, `Experience dates ${ index + 1 }` );
		assertExact( orgs[ index ].text, entry.org, `Experience organization ${ index + 1 }` );
	} );
	const bullets = [ ...experience.outer.matchAll( /<li>([\s\S]*?)<\/li>/g ) ].map( ( match ) =>
		extractExactText( match[ 1 ], { label } )
	);
	const expectedBullets = EXPECTED_EXPERIENCE.entries.flatMap( ( entry ) => entry.bullets );
	assert(
		bullets.length === 6,
		`Selected Experience must carry exactly six bullets, got ${ bullets.length }.`
	);
	expectedBullets.forEach( ( expected, index ) => {
		assertExact( bullets[ index ], expected, `Experience bullet ${ index + 1 }` );
	} );

	const footer = findByClass( experience.outer, 'hp-work__footer', label );
	assert( footer.length === 1, 'Selected Experience must end with its footer.' );
	assertExact( footer[ 0 ].text, EXPECTED_EXPERIENCE.footerText, 'Experience footer' );
	const footerLinks = findLinks( footer[ 0 ].inner, label );
	assert( footerLinks.length === 1, 'The Experience footer must contain one résumé link.' );
	assertExact( footerLinks[ 0 ].text, EXPECTED_EXPERIENCE.footerLink.text, 'Experience footer link text' );
	assertExact( footerLinks[ 0 ].href, EXPECTED_EXPERIENCE.footerLink.href, 'Experience footer link destination' );

	// --- skills and foundations --------------------------------------------------
	const foundations = findSectionBlock( blocks, 'skills-and-foundations' );
	const foundationColumns = [ ...foundations.outer.matchAll( /<!-- wp:column(?: \{[^\n]*\})? -->([\s\S]*?)<!-- \/wp:column -->/g ) ];
	assert( foundationColumns.length === 1, `Foundations must contain exactly one column, got ${ foundationColumns.length }.` );
	const foundationColumn = foundationColumns[ 0 ][ 1 ];
	const foundationHeadings = findHeadings( foundationColumn, label );
	assert(
		foundationHeadings.map( ( heading ) => `${ heading.level }:${ heading.text }` ).join( '|' ) === '3:AI Leaders|3:Education',
		'The Foundations column must contain H3 AI Leaders followed by H3 Education.'
	);
	const note = findByClass( foundationColumn, 'hp-about-foundations__note', label );
	assert( note.length === 1, 'AI Leaders must be one sentence.' );
	assertExact( note[ 0 ].text, EXPECTED_AI_LEADERS.sentence, 'AI Leaders sentence' );
	const noteLinks = findLinks( note[ 0 ].inner, label );
	assert( noteLinks.length === 1, 'The AI Leaders sentence must contain one showcase link.' );
	assertExact( noteLinks[ 0 ].text, EXPECTED_AI_LEADERS.link.text, 'AI Leaders link text' );
	assertExact( noteLinks[ 0 ].href, EXPECTED_AI_LEADERS.link.href, 'AI Leaders link destination' );

	const degrees = findByClass( foundationColumn, 'hp-edu-card__degree', label );
	const schools = findByClass( foundationColumn, 'hp-edu-card__school', label );
	const periods = findByClass( foundationColumn, 'hp-edu-card__period', label );
	assert( degrees.length === 2, `Education must contain exactly two records, got ${ degrees.length }.` );
	// Without this the loop below dereferences undefined and the verifier
	// reports a TypeError instead of the labelled failure it exists to give.
	assert(
		schools.length === 2 && periods.length === 2,
		`Education must carry two school and period lines, got ${ schools.length } / ${ periods.length }.`
	);
	EXPECTED_EDUCATION.forEach( ( record, index ) => {
		assertExact( degrees[ index ].text, record.degree, `Education record ${ index + 1 } degree` );
		assertExact( schools[ index ].text, record.school, `Education record ${ index + 1 } school` );
		assertExact( periods[ index ].text, record.period, `Education record ${ index + 1 } period` );
	} );

	// --- closing invitation ---------------------------------------------------
	const closing = findSectionBlock( blocks, 'contact' );
	assert(
		/hp-action-panel is-closing/.test( closing.outer ),
		'The closing invitation must reuse the shared hp-action-panel is-closing composition.'
	);
	const closingEyebrow = findByClass( closing.outer, 'hp-eyebrow', label );
	assertExact( closingEyebrow[ 0 ]?.text, EXPECTED_CLOSING.eyebrow, 'Closing eyebrow' );
	const closingBody = [ ...closing.outer.matchAll( /<!-- wp:paragraph -->\s*<p>([\s\S]*?)<\/p>/g ) ];
	assert( closingBody.length === 1, 'The closing invitation must carry exactly one body paragraph.' );
	assertExact(
		extractExactText( closingBody[ 0 ][ 1 ], { label } ),
		EXPECTED_CLOSING.body,
		'Closing body'
	);
	const closingRails = findBalancedByClass( closing.outer, 'hp-action-rail', label );
	assert( closingRails.length === 1, 'The closing invitation must carry one action rail.' );
	const closingActions = findLinks( closingRails[ 0 ].inner, label );
	assert( closingActions.length === 2, 'The closing rail must contain exactly two actions.' );
	EXPECTED_CLOSING.actions.forEach( ( expected, index ) => {
		assertExact( closingActions[ index ].text, expected.text, `Closing action ${ index + 1 } label` );
		assertExact( closingActions[ index ].href, expected.href, `Closing action ${ index + 1 } destination` );
	} );
	assert( findBalancedByClass( html, 'hp-action-rail', label ).length === 2, 'About body must contain exactly two prominent-action rails.' );

	// --- heading inventory (complete, ordered, one H1, correct ancestry) -------
	const allHeadings = findHeadings( html, label );
	assert(
		allHeadings.length === EXPECTED_HEADINGS.length,
		`${ label } must contain exactly ${ EXPECTED_HEADINGS.length } headings, got ${ allHeadings.length }.`
	);
	assert(
		allHeadings.filter( ( heading ) => heading.level === 1 ).length === 1,
		`${ label } must contain exactly one H1.`
	);
	EXPECTED_HEADINGS.forEach( ( expected, index ) => {
		assert(
			allHeadings[ index ].level === expected.level && allHeadings[ index ].text === expected.text,
			`Heading ${ index + 1 } must be H${ expected.level } ${ JSON.stringify( expected.text ) }, got H${ allHeadings[ index ].level } ${ JSON.stringify( allHeadings[ index ].text ) }.`
		);
	} );
	for ( const anchor of fragmentIds ) {
		const section = findSectionBlock( blocks, anchor );
		const sectionHeadings = findHeadings( section.outer, label );
		const expectedForSection = EXPECTED_HEADINGS.filter( ( heading ) => heading.section === anchor );
		assert(
			sectionHeadings.length === expectedForSection.length,
			`Section "${ anchor }" must contain ${ expectedForSection.length } headings, got ${ sectionHeadings.length }.`
		);
		assert(
			sectionHeadings[ 0 ].level === 2,
			`Section "${ anchor }" must open with its H2 as the first heading.`
		);
	}

	// --- removed compositions ---------------------------------------------------
	for ( const retired of [
		'AI all day. Everything else too.',
		'Throughline',
		'hp-role-tags',
		'AI Leaders, first cohort',
		'hp-quote',
		'I combine support habits',
	] ) {
		assert( ! html.includes( retired ), `${ label } must not retain the removed composition: ${ retired }` );
	}

	// --- deterministic word count ----------------------------------------------
	const sectionCounts = {
		hero: countVisibleWords( hero.outer, { label } ),
		signalsAndNav: countVisibleWords( signals.outer, { label } ) + countVisibleWords( navBlock.outer, { label } ),
		selectedWork: countVisibleWords( work.outer, { label } ),
		coreAi: countVisibleWords( coreAi.outer, { label } ),
		capabilities: countVisibleWords( capabilities.outer, { label } ),
		experience: countVisibleWords( experience.outer, { label } ),
		skillsAndFoundations: countVisibleWords( foundations.outer, { label } ),
		closing: countVisibleWords( closing.outer, { label } ),
	};
	const wordCount = countVisibleWords( html, { label } );

	for ( const [ section, cap ] of Object.entries( ABOUT_SECTION_WORD_CAPS ) ) {
		assert(
			sectionCounts[ section ] <= cap,
			`${ label } ${ section } counts ${ sectionCounts[ section ] } words; the cap is ${ cap }.`
		);
	}
	assert(
		wordCount >= ABOUT_WORD_RANGE.min && wordCount <= ABOUT_WORD_RANGE.max,
		`${ label } counts ${ wordCount } visible words; the inclusive target is ${ ABOUT_WORD_RANGE.min }–${ ABOUT_WORD_RANGE.max }.`
	);

	return { wordCount, sectionCounts };
}

/**
 * The thin pattern-adapter contract: patterns/about-resume.php reads the
 * accepted snapshot, substitutes only the known portrait URL, fails closed,
 * and carries no page markup of its own.
 */
function verifyPatternAdapter( source ) {
	for ( const required of [
		"get_theme_file_path( 'content/page-snapshots/about.html' )",
		// The portrait matcher tolerates an absolute host and an existing ?v=,
		// so the adapter's output survives a database round trip.
		'(?:https?://[^"/]+)?',
		'(?:\\?v=\\d+)?',
		'/wp-content/uploads/2026/06/henry-perkins.png',
		'1 !== $hperkins_about_portrait_found',
		'1 !== $hperkins_about_portrait_count',
	] ) {
		assert( source.includes( required ), `patterns/about-resume.php adapter is missing: ${ required }` );
	}
	assert(
		( source.match( /\breturn;/g ) || [] ).length >= 2,
		'The adapter must fail closed on a missing snapshot and on a substitution-count mismatch.'
	);
	assert(
		! source.includes( 'content/page-drafts/' ),
		'The adapter must never read the work-in-progress draft.'
	);
	for ( const forbidden of [
		'$hperkins_about_resume_',
		'assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf',
		'hperkins_tokens_asset_url',
	] ) {
		assert( ! source.includes( forbidden ), `The portrait-only adapter must contain no résumé or PDF replacement logic (${ forbidden }).` );
	}
	for ( const forbidden of [ '<h1', 'hp-evidence-row', 'hp-work-card', 'hp-capability', 'hp-exp__role', 'hp-edu-card' ] ) {
		assert(
			! source.includes( forbidden ),
			`patterns/about-resume.php must not carry page markup (${ forbidden }).`
		);
	}
}

/**
 * Exclusive CSS ownership: no .hp-about-template selector in style.css, and
 * the required About selectors present in assets/imladris-pages.css.
 */
function verifyCssOwnership( styleCss, pagesCss ) {
	assert(
		! styleCss.includes( '.hp-about-template' ),
		'style.css must contain no .hp-about-template selector (About CSS lives in assets/imladris-pages.css).'
	);
	for ( const selector of [
		'.hp-about-template .hp-about-hero__strapline',
		'.hp-about-template .hp-about-nav',
		'.hp-about-template .hp-about-work-grid.wp-block-columns',
		'.hp-about-template .hp-work-card',
		'.hp-about-template .hp-about-capabilities__intro',
		'.hp-about-template .hp-about-foundations-grid.wp-block-columns',
		'.hp-about-template .hp-about-closing',
		'grid-template-columns: 2fr 1fr;',
	] ) {
		assert(
			pagesCss.includes( selector ),
			`assets/imladris-pages.css is missing the About selector: ${ selector }`
		);
	}
	// Card-level hover only: a compound selector on the card element itself
	// (.hp-work-card:hover, .hp-work-card.is-x:hover). Hover on descendants
	// (.hp-work-card__actions a:hover) belongs to the action links and stays.
	assert(
		! /\.hp-work-card(?![\w-])[^\s{,:]*:hover/.test( pagesCss ),
		'Project cards must gain no card-level hover state; hover belongs to the action links.'
	);
}

module.exports = {
	ABOUT_SECTION_WORD_CAPS,
	ABOUT_WORD_RANGE,
	EXPECTED_AI_LEADERS,
	EXPECTED_CAPABILITIES,
	EXPECTED_CLOSING,
	EXPECTED_EDUCATION,
	EXPECTED_EVIDENCE,
	EXPECTED_EXPERIENCE,
	EXPECTED_HEADINGS,
	EXPECTED_HERO,
	EXPECTED_NAV_LABEL,
	EXPECTED_NAV_LINKS,
	EXPECTED_PROJECTS,
	EXPECTED_SIGNALS,
	EXPECTED_SKILL_GROUPS,
	EXPECTED_WCUS_STATUS,
	RESUME_HREF,
	assertNoForbiddenMarkup,
	countRenderedText,
	countVisibleWords,
	countWords,
	decodeCharacterReferences,
	extractExactText,
	extractVisibleText,
	findHeadings,
	findLinks,
	parseTopLevelBlocks,
	removeAriaHiddenSubtrees,
	verifyAboutBody,
	verifyCssOwnership,
	verifyPatternAdapter,
};
