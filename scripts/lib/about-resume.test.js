#!/usr/bin/env node

const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const test = require( 'node:test' );

const themeRoot = path.join( __dirname, '..', '..' );
const controllerPath = path.join( themeRoot, 'assets', 'js', 'about-resume.js' );
const draftPath = path.join( themeRoot, 'content', 'page-drafts', 'about.html' );

const rows = [
	{ key: 'docs', terms: [ 'Documentation', 'Developer enablement' ] },
	{ key: 'defect', terms: [ 'Escalation triage' ] },
	{ key: 'codex', terms: [ 'Plugin development', 'Provider integrations', 'Sidecar debugging', 'Request logging', 'Release packaging', 'PHPStan', 'Plugin Check', 'PHP', 'AI Client' ] },
	{ key: 'focus', terms: [ 'CSS cascade', 'Browser debugging', 'Release packaging', 'Git' ] },
	{ key: 'skills', terms: [ 'AI Client', 'Abilities API', 'MCP', 'Documentation', 'Developer enablement' ] },
	{ key: 'vectors', terms: [ 'PHP', 'Provider integrations', 'AI Client' ] },
	{ key: 'logging', terms: [ 'Request logging', 'Sidecar debugging', 'Provider integrations', 'Escalation triage', 'Code review' ] },
	{ key: 'consultant', terms: [ 'Plugin development', 'Gutenberg', 'REST API', 'WP-CLI', 'JavaScript', 'TypeScript', 'React', 'CSS cascade', 'WooCommerce', 'Cloudflare Workers', 'Prompt design', 'Provider integrations', 'AI workflow prototyping', 'Documentation', 'Release packaging', 'Git', 'GitHub Actions', 'Composer', 'Technical support' ] },
	{ key: 'shift', terms: [ 'Escalation triage' ] },
	{ key: 'happiness', terms: [ 'HTTP', 'DNS', 'Documentation', 'Escalation triage', 'Technical support' ] },
	{ key: 'community', terms: [ 'Developer enablement', 'Documentation', 'Customer onboarding' ] },
];

const groups = [
	{ legend: 'WordPress', items: [ 'Plugin development', 'Gutenberg', 'AI Client', 'Abilities API', 'REST API', 'WP-CLI' ] },
	{ legend: 'Languages & frontend', items: [ 'PHP', 'JavaScript', 'TypeScript', 'React', 'CSS cascade' ] },
	{ legend: 'Platform & delivery', items: [ 'Cloudflare Workers', 'WooCommerce', 'HTTP', 'DNS', 'Browser debugging' ] },
	{ legend: 'AI & integrations', items: [ 'Provider integrations', 'AI workflow prototyping', 'MCP', 'Prompt design', 'Request logging', 'Sidecar debugging' ] },
	{ legend: 'Workflow & enablement', items: [ 'Git', 'GitHub Actions', 'Code review', 'Release packaging', 'Plugin Check', 'PHPStan', 'Composer', 'Documentation', 'Developer enablement' ] },
	{ legend: 'Delivery & support', items: [ 'Technical support', 'Escalation triage', 'Customer onboarding' ] },
];

test( 'v3 Skills index derives literal counts and coverage from row evidence', () => {
	assert.equal( fs.existsSync( controllerPath ), true, 'assets/js/about-resume.js must exist.' );
	const { buildIndex } = require( controllerPath );
	const index = buildIndex( rows, groups );

	assert.equal( index.counts.Documentation, 5 );
	assert.equal( index.counts[ 'AI Client' ], 3 );
	assert.equal( index.counts[ 'Provider integrations' ], 4 );
	assert.equal( index.counts[ 'Technical support' ], 2 );
	assert.equal( index.groups[ 0 ].coverage, '6/6 backed above' );
	assert.equal( index.groups[ 4 ].coverage, '9/9 backed above' );
	assert.equal( index.groups[ 5 ].coverage, '3/3 backed above' );
} );

test( 'v3 filter promotes exact matches while preserving both stable partitions', () => {
	const { partitionEvidenceRows } = require( controllerPath );
	const partition = partitionEvidenceRows( rows.slice( 0, 7 ), 'Documentation' );

	assert.deepEqual( partition.ordered.map( ( row ) => row.key ), [
		'docs', 'skills', 'defect', 'codex', 'focus', 'vectors', 'logging',
	] );
	assert.equal( partition.matchCount, 2 );
	assert.equal( partition.dividerIndex, 2 );
	assert.deepEqual(
		partitionEvidenceRows( rows.slice( 0, 7 ), null ).ordered.map( ( row ) => row.key ),
		rows.slice( 0, 7 ).map( ( row ) => row.key )
	);
} );

test( 'v3 filter dims and restores mounted rows without hiding them', () => {
	const { applyDimmedRows } = require( controllerPath );
	const states = new Map();
	const mountedRows = rows.slice( 0, 3 ).map( ( row ) => ( {
		terms: row.terms,
		getAttribute( name ) {
			return name === 'data-evidence-terms' ? row.terms.join( '|' ) : null;
		},
		classList: {
			toggle( name, enabled ) {
				states.set( row.key + ':' + name, enabled );
			},
		},
	} ) );

	applyDimmedRows( mountedRows, 'Documentation' );
	assert.equal( states.get( 'docs:is-dimmed' ), false );
	assert.equal( states.get( 'defect:is-dimmed' ), true );
	assert.equal( states.get( 'codex:is-dimmed' ), true );

	applyDimmedRows( mountedRows, null );
	assert.equal( states.get( 'docs:is-dimmed' ), false );
	assert.equal( states.get( 'defect:is-dimmed' ), false );
	assert.equal( states.get( 'codex:is-dimmed' ), false );
} );

test( 'v3 Skills readout uses the approved idle, singular, and plural language', () => {
	const { formatReadout } = require( controllerPath );
	assert.equal(
		formatReadout( null, 0 ),
		'Pick a term to pull its evidence to the top. Nothing is hidden.'
	);
	assert.equal( formatReadout( 'Gutenberg', 1 ), 'Gutenberg — 1 row cites it, pulled to the top of each ledger.' );
	assert.equal( formatReadout( 'Documentation', 5 ), 'Documentation — 5 rows cite it, pulled to the top of each ledger.' );
} );

test( 'desktop Education promotes record headings without losing their content or attributes', () => {
	const { setEducationRecordHeadingLevels } = require( controllerPath );
	assert.equal( typeof setEducationRecordHeadingLevels, 'function' );

	const fakeDocument = {};
	fakeDocument.createElement = ( tagName ) => {
		const element = {
			tagName: tagName.toUpperCase(),
			ownerDocument: fakeDocument,
			attributes: [],
			childNodes: [],
			setAttribute( name, value ) {
				const existing = this.attributes.find( ( attribute ) => attribute.name === name );
				if ( existing ) {
					existing.value = value;
				} else {
					this.attributes.push( { name, value } );
				}
			},
			appendChild( child ) {
				if ( child.parentNode ) {
					const index = child.parentNode.childNodes.indexOf( child );
					child.parentNode.childNodes.splice( index, 1 );
				}
				this.childNodes.push( child );
				child.parentNode = this;
			},
			replaceWith( replacement ) {
				this.replacement = replacement;
			},
		};
		Object.defineProperty( element, 'firstChild', {
			get() {
				return this.childNodes[ 0 ] || null;
			},
		} );
		return element;
	};

	const heading = fakeDocument.createElement( 'h4' );
	heading.setAttribute( 'class', 'wp-block-heading' );
	heading.setAttribute( 'data-proof', 'degree' );
	heading.appendChild( { nodeType: 3, nodeValue: 'A.S., Business Administration & Management' } );
	const root = {
		querySelectorAll( selector ) {
			assert.equal( selector, '.hp-about-education__record h3, .hp-about-education__record h4' );
			return [ heading ];
		},
	};

	const replacements = setEducationRecordHeadingLevels( root, 3 );
	assert.equal( replacements.length, 1 );
	assert.equal( replacements[ 0 ].tagName, 'H3' );
	assert.deepEqual( replacements[ 0 ].attributes, [
		{ name: 'class', value: 'wp-block-heading' },
		{ name: 'data-proof', value: 'degree' },
	] );
	assert.equal( replacements[ 0 ].childNodes[ 0 ].nodeValue, 'A.S., Business Administration & Management' );
	assert.equal( heading.replacement, replacements[ 0 ] );
} );

test( 'print view toolbar exposes separate print and exit actions', () => {
	const { createPrintViewToolbar } = require( controllerPath );
	assert.equal( typeof createPrintViewToolbar, 'function' );

	function createElement( tagName ) {
		return {
			tagName: tagName.toUpperCase(),
			children: [],
			attributes: {},
			listeners: {},
			appendChild( child ) {
				this.children.push( child );
				child.parentNode = this;
				return child;
			},
			setAttribute( name, value ) {
				this.attributes[ name ] = String( value );
			},
			addEventListener( type, listener ) {
				this.listeners[ type ] = listener;
			},
			click() {
				this.listeners.click();
			},
		};
	}

	const events = [];
	const toolbar = createPrintViewToolbar( { createElement }, {
		onPrint: () => events.push( 'print' ),
		onExit: () => events.push( 'exit' ),
	} );
	const [ message, printButton, exitButton ] = toolbar.children;

	assert.equal( toolbar.className, 'hp-about-print-view' );
	assert.equal( toolbar.attributes[ 'data-hp-about-generated' ], 'print-view' );
	assert.equal( toolbar.attributes.hidden, '' );
	assert.equal( message.textContent, 'Print view: every role expanded, showcase and navigation removed.' );
	assert.equal( printButton.type, 'button' );
	assert.equal( printButton.className, 'hp-about-print-view__print' );
	assert.equal( printButton.textContent, 'Print / Save PDF' );
	assert.equal( exitButton.type, 'button' );
	assert.equal( exitButton.className, 'hp-about-print-view__exit' );
	assert.equal( exitButton.textContent, 'Exit print view' );

	printButton.click();
	exitButton.click();
	assert.deepEqual( events, [ 'print', 'exit' ] );
} );

test( 'A term nothing above backs remains visibly unbacked and inert', () => {
	const { buildIndex, UNBACKED_COUNT } = require( controllerPath );
	assert.equal( UNBACKED_COUNT, '—' );

	const index = buildIndex( rows, [
		{ legend: 'Mixed', items: [ 'Documentation', 'Kubernetes' ] },
	] );

	assert.equal( index.counts.Documentation, 5 );
	assert.equal( index.counts.Kubernetes, undefined );
	assert.equal( index.groups[ 0 ].backed, 1 );
	assert.equal( index.groups[ 0 ].coverage, '1/2 backed above' );
} );

test( 'About v3 contract validates the real candidate and its evidence index', () => {
	const { verifyAboutV3Body } = require( './about-page-contract' );
	assert.equal( typeof verifyAboutV3Body, 'function', 'about-page-contract must export verifyAboutV3Body().' );
	const report = verifyAboutV3Body( fs.readFileSync( draftPath, 'utf8' ), {
		label: 'content/page-drafts/about.html',
	} );

	assert.equal( report.contributionCount, 7 );
	assert.equal( report.currentRoleCount, 4 );
	assert.equal( report.earlierRoleCount, 3 );
	assert.equal( report.skillTermCount, 34 );
	assert.equal( report.skillGroupCount, 6 );
	assert.equal( report.counts.Documentation, 5 );
	assert.equal( report.counts[ 'Technical support' ], 2 );
	assert.deepEqual( report.sectionOrder, [ 'contributions', 'experience', 'skills', 'showcase', 'contact' ] );
	assert.equal( report.actionRailCount, 2 );
	assert.equal( report.actionPanelCount, 1 );
	assert.equal( report.heroContentsHostCount, 1 );
	assert.equal( report.filterRailCount, 1 );
	assert.equal( report.filterHostInsideNavigation, false );
	assert.equal( report.navigationListTag, 'ol' );
	assert.equal( report.navigationLabel, 'In this résumé' );
	assert.equal( report.timelineStepCount, 5 );
	assert.deepEqual( report.timelineLabels, [
		'WordPress since 2012',
		'Credential · 2026',
		'1 merged upstream',
		'5 public projects',
		'In person · Aug 2026',
	] );
	assert.deepEqual( report.channelHrefs, [
		'mailto:htperkins@gmail.com',
		'https://github.com/henryperkins',
		'https://www.linkedin.com/in/henryperkins',
	] );
	assert.deepEqual( report.heroActions, [
		{ href: '/one-page-resume/', text: 'Download résumé (PDF)' },
		{ href: '/contact/', text: 'Get in touch' },
	] );
	assert.deepEqual( report.closingActions, [
		{ href: '/contact/', text: 'Start a conversation' },
		{ href: '/one-page-resume/', text: 'Download résumé (PDF)' },
	] );
	assert.match( fs.readFileSync( draftPath, 'utf8' ), /<h3 class="wp-block-heading">HPerkins Tokens<\/h3>[\s\S]*?Live · v0\.3\.60/ );
} );

test( 'About v3 contract rejects loss of the desktop contents host or filter landmark', () => {
	const { verifyAboutV3Body } = require( './about-page-contract' );
	const source = fs.readFileSync( draftPath, 'utf8' );
	assert.doesNotThrow( () => verifyAboutV3Body( source ) );

	const withoutContentsHost = source.replaceAll(
		'hp-about-v3-hero__contents-host',
		'hp-about-v3-hero__contents-missing'
	);
	assert.notEqual( withoutContentsHost, source, 'contents-host mutation must apply' );
	assert.throws( () => verifyAboutV3Body( withoutContentsHost ), /contents host/i );

	const withoutFilterLandmark = source.replace(
		'"tagName":"aside","ariaLabel":"Filter the record","className":"hp-about-filter-rail"',
		'"className":"hp-about-filter-rail"'
	);
	assert.notEqual( withoutFilterLandmark, source, 'filter-landmark mutation must apply' );
	assert.throws( () => verifyAboutV3Body( withoutFilterLandmark ), /filter.*aside|filter.*landmark/i );
} );

test( 'About v3 contract pins the letterhead and the authored proof timeline', () => {
	const { verifyAboutV3Body } = require( './about-page-contract' );
	const source = fs.readFileSync( draftPath, 'utf8' );
	assert.doesNotThrow( () => verifyAboutV3Body( source ) );

	for ( const [ from, to, message ] of [
		// A state class in the body would pre-empt the sweep the enhancer paints.
		[ '<div class="wp-block-group hp-about-timeline__step">', '<div class="wp-block-group hp-about-timeline__step is-current">', /state classes/ ],
		// The reading pane is generated: shipping it would double the current claim.
		[ '<div class="wp-block-group hp-about-timeline__steps">', '<div class="wp-block-group hp-about-timeline__panel"></div><div class="wp-block-group hp-about-timeline__steps">', /reading pane.*generated/ ],
		// The one row with nothing to open must say so, not point elsewhere.
		[ '<span class="hp-about-timeline__gap"><span aria-hidden="true">—</span><span class="hp-about-timeline__sr">No artifact to open</span></span>', '<a href="#contact">Contact</a>', /gap contract/ ],
		// Destinations cross-reference the contents card's numbering.
		[ '>01 Contributions <span', '>See contributions <span', /destination drifted/ ],
		// The pills keep their names and their order: email, GitHub, LinkedIn.
		[ 'rel="me" aria-label="GitHub profile"', 'rel="me" aria-label="GitHub"', /accessible names drifted/ ],
		[ 'href="https://github.com/henryperkins" rel="me" aria-label="GitHub profile"', 'href="https://gitlab.com/henryperkins" rel="me" aria-label="GitHub profile"', /GitHub, and LinkedIn in that order|unrecognised/ ],
		// The retired plates and address row must not return beside the timeline.
		[ '<div class="wp-block-group hp-about-timeline">', '<p class="hp-about-credential__eyebrow">Credential · 2026</p><div class="wp-block-group hp-about-timeline">', /retired hero anatomy/ ],
	] ) {
		const changed = source.replace( from, to );
		assert.notEqual( changed, source, `v3 mutation ${ from } must apply` );
		assert.throws( () => verifyAboutV3Body( changed ), message );
	}
} );

test( 'the proof stepper wraps on arrow keys and jumps on Home and End', () => {
	const { nextTimelineStep, timelineAnchor } = require( controllerPath );
	assert.equal( nextTimelineStep( 'ArrowRight', 0, 5 ), 1 );
	assert.equal( nextTimelineStep( 'ArrowDown', 4, 5 ), 0, 'ArrowDown wraps forward from the last step' );
	assert.equal( nextTimelineStep( 'ArrowLeft', 0, 5 ), 4, 'ArrowLeft wraps back from the first step' );
	assert.equal( nextTimelineStep( 'ArrowUp', 2, 5 ), 1 );
	assert.equal( nextTimelineStep( 'Home', 3, 5 ), 0 );
	assert.equal( nextTimelineStep( 'End', 0, 5 ), 4 );
	assert.equal( nextTimelineStep( 'Enter', 2, 5 ), null, 'other keys are not the stepper\'s' );
	assert.equal( nextTimelineStep( 'ArrowRight', -1, 5 ), null, 'focus outside the steps is ignored' );
	assert.equal( nextTimelineStep( 'ArrowRight', 0, 0 ), null );
	assert.equal( timelineAnchor( 0, 5 ), '0/5' );
	assert.equal( timelineAnchor( 3, 4 ), '3/4' );
} );

test( 'About v3 rejects block className JSON that WordPress would reserialize', () => {
	const { verifyAboutV3Body } = require( './about-page-contract' );
	const source = fs.readFileSync( draftPath, 'utf8' );
	const canonical = source.replace(
		/"className":"([^"]*)"/g,
		( match, className ) => `"className":"${ className.replace( /--/g, '\\u002d\\u002d' ) }"`
	);
	const nonCanonical = canonical.replace( '\\u002d\\u002d', '--' );

	assert.notEqual( nonCanonical, canonical, 'fixture mutation must restore one raw double hyphen' );
	assert.doesNotThrow( () => verifyAboutV3Body( canonical ) );
	assert.throws(
		() => verifyAboutV3Body( nonCanonical ),
		/WordPress-safe block className JSON/i
	);
} );

test( 'About v3 contract rejects stale filtering language and altered hero actions', () => {
	const { verifyAboutV3Body } = require( './about-page-contract' );
	const source = fs.readFileSync( draftPath, 'utf8' );
	assert.doesNotThrow( () => verifyAboutV3Body( source ) );

	for ( const [ from, to, message ] of [
		[ 'Nothing is hidden.', 'The rest are dimmed.', /Nothing is hidden|readout/i ],
		[ '/one-page-resume/', '/resume/', /hero action|one-page-resume/i ],
		[ 'Get in touch', 'Contact me', /hero action|Get in touch/i ],
	] ) {
		const changed = source.replace( from, to );
		assert.notEqual( changed, source, `v3 mutation ${ from } must apply` );
		assert.throws( () => verifyAboutV3Body( changed ), message );
	}

	assert.throws(
		() => verifyAboutV3Body( source.replace(
			'<section id="contributions" class="wp-block-group hp-about-section hp-about-contributions">',
			'<section id="contributions" class="wp-block-group hp-about-section hp-about-contributions" hidden>'
		) ),
		/authored v3 markup.*hidden/i
	);
	assert.throws(
		() => verifyAboutV3Body( source.replace( '<div class="wp-block-group hp-about-ledger hp-about-ledger--contributions">', '<div class="wp-block-group hp-about-ledger hp-about-ledger--contributions"><div class="hp-about-ledger__divider"></div>' ) ),
		/filter dividers.*generated/i
	);
} );
