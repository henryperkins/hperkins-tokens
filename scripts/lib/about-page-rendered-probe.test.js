const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { spawnSync } = require( 'node:child_process' );

const {
	buildInspectionExpression,
	deriveRenderedExpectations,
	navigateDocument,
	responsiveHeadingExpectations,
	usesWideResumeShowcaseLayout,
	verifyCardHoverInertia,
	verifyV3Interactions,
	verifyV3RouterRoundTrip,
} = require( '../verify-about-page-rendered' );

const themeRoot = path.join( __dirname, '..', '..' );
const acceptedSnapshotPath = path.join( themeRoot, 'content', 'page-snapshots', 'about.html' );
const draftPath = path.join( themeRoot, 'content', 'page-drafts', 'about.html' );

function browserException( description ) {
	const exception = {
		className: 'ReferenceError',
		description,
		subtype: 'error',
		type: 'object',
	};

	return {
		exceptionDetails: {
			columnNumber: 3,
			exception,
			exceptionId: 1,
			lineNumber: 2,
			text: 'Uncaught',
		},
		result: exception,
	};
}

test( 'reports a browser exception from the hover setup evaluation', async () => {
	const cdp = {
		async send( method ) {
			assert.equal( method, 'Runtime.evaluate' );
			return browserException( 'ReferenceError: impact lookup exploded' );
		},
	};

	await assert.rejects(
		() => verifyCardHoverInertia( cdp, 'session-1' ),
		/Hover probe setup threw:.*impact lookup exploded/
	);
} );

test( 'reports a browser exception from the post-hover evaluation', async () => {
	let evaluation = 0;
	const cdp = {
		async send( method ) {
			if ( method === 'Input.dispatchMouseEvent' ) {
				return {};
			}

			assert.equal( method, 'Runtime.evaluate' );
			evaluation++;
			if ( evaluation === 1 ) {
				return {
					result: {
						value: {
							snapshot: {
								background: 'rgb(255, 255, 255)|none',
								border: 'rgb(0, 0, 0)|1px',
								shadow: 'none',
								transform: 'none',
							},
							viewport: { height: 1000, width: 1440 },
							x: 500,
							y: 500,
						},
					},
				};
			}

			return browserException( 'ReferenceError: card style lookup exploded' );
		},
	};

	await assert.rejects(
		() => verifyCardHoverInertia( cdp, 'session-1' ),
		/Hover probe follow-up threw:.*card style lookup exploded/
	);
} );

test( 'document navigation reloads an equivalent current path instead of waiting on a same-document navigate', async () => {
	const calls = [];
	const cdp = {
		async once( method ) {
			calls.push( [ 'once', method ] );
			return {};
		},
		async send( method ) {
			calls.push( [ 'send', method ] );
			if (method === 'Runtime.evaluate') {
				return { result: { value: 'https://example.test/about/?v=cache' } };
			}
			return {};
		},
	};

	await navigateDocument( cdp, 'session-1', 'https://example.test/about/' );
	assert.deepEqual( calls.map( ( call ) => call[ 1 ] ), [
		'Runtime.evaluate',
		'Page.reload',
		'Runtime.evaluate',
	] );
} );

test( 'document navigation uses Page.navigate when the path changes', async () => {
	const methods = [];
	const cdp = {
		async once( method ) {
			methods.push( method );
			return {};
		},
		async send( method ) {
			methods.push( method );
			if (method === 'Runtime.evaluate') {
				return { result: { value: 'about:blank' } };
			}
			return {};
		},
	};

	await navigateDocument( cdp, 'session-1', 'https://example.test/about/' );
	assert.deepEqual( methods, [ 'Runtime.evaluate', 'Page.navigate', 'Runtime.evaluate' ] );
} );

test( 'derives rendered copy from the accepted About body', () => {
	const source = fs.readFileSync( acceptedSnapshotPath, 'utf8' );
	const expectations = deriveRenderedExpectations( source, { label: 'accepted About fixture' } );

	assert.equal( expectations.version, 'v3' );
	assert.equal( expectations.headings[ 0 ].text, 'Henry Perkins' );
	assert.deepEqual( expectations.heroActionLabels, [ 'Download résumé (PDF)', 'Get in touch' ] );
} );

test( 'v3 heading expectations follow the reversible 64rem Education handoff', () => {
	const source = fs.readFileSync( acceptedSnapshotPath, 'utf8' );
	const expectations = deriveRenderedExpectations( source, { label: 'accepted About fixture' } );
	const degreeText = 'A.S., Business Administration & Management';
	const desktop = responsiveHeadingExpectations( expectations, 1440 );
	const mobile = responsiveHeadingExpectations( expectations, 768 );

	assert.equal( desktop.find( ( heading ) => heading.text === 'Education' && heading.level === 2 )?.text, 'Education' );
	assert.equal( desktop.find( ( heading ) => heading.text === degreeText )?.level, 3 );
	assert.equal( mobile.find( ( heading ) => heading.text === 'Skills index' && heading.level === 2 )?.text, 'Skills index' );
	assert.equal( mobile.find( ( heading ) => heading.text === degreeText )?.level, 4 );
} );

test( 'rejects a proof timeline that opts into the action-rail primitive', () => {
	const source = fs.readFileSync( draftPath, 'utf8' );
	const railed = source.replace(
		'<div class="wp-block-group hp-about-timeline">',
		'<div class="wp-block-group hp-about-timeline hp-action-rail">'
	);
	assert.notEqual( railed, source, 'rail mutation must apply' );
	assert.throws(
		() => deriveRenderedExpectations( railed, { label: 'railed timeline fixture' } ),
		/expected one hero and one closing action rail/i
	);
} );

test( 'derives the proof timeline and its collapsed-fold word budget from the selected draft', () => {
	const source = fs.readFileSync( draftPath, 'utf8' );
	const expectations = deriveRenderedExpectations( source, { label: 'About v3 draft' } );

	assert.deepEqual( expectations.timelineLabels, [
		'WordPress since 2012',
		'Credential · 2026',
		'1 merged upstream',
		'5 public projects',
		'In person · Aug 2026',
	] );
	assert.equal( expectations.timelineFoldWords.length, 5 );
	assert.ok( expectations.timelineFoldWords.every( ( count ) => count > 0 ) );
	const collapsed = expectations.timelineFoldWords.slice( 1 ).reduce( ( sum, count ) => sum + count, 0 );
	assert.equal( expectations.renderedWordCount, expectations.sourceWordCount - collapsed );
	assert.equal( expectations.narrowRenderedWordCount, expectations.narrowSourceWordCount - collapsed );
} );

test( 'requires the v3 hero contact action to use one core Button wrapper', () => {
	const source = fs.readFileSync( acceptedSnapshotPath, 'utf8' );
	const plainAnchor = source.replace(
		'<div class="wp-block-button is-style-secondary"><a class="wp-block-button__link wp-element-button" href="/contact/">Get in touch</a></div>',
		'<div class="not-a-button is-style-secondary"><a href="/contact/">Get in touch</a></div>'
	);
	assert.notEqual( plainAnchor, source, 'plain-anchor mutation must apply' );
	assert.throws(
		() => deriveRenderedExpectations( plainAnchor, { label: 'plain v3 hero action fixture' } ),
		/hero action|wp-block-button|core Button/i
	);
} );

test( 'derives the v3 rail, showcase, portrait, and action rails from the selected draft', () => {
	const source = fs.readFileSync( draftPath, 'utf8' );
	const expectations = deriveRenderedExpectations( source, { label: 'About v3 draft' } );

	assert.equal( expectations.version, 'v3' );
	assert.equal( expectations.navigationRevision, 'contents-plate' );
	assert.equal( expectations.navLabel, 'In this résumé' );
	assert.equal( expectations.narrowSourceWordCount, expectations.sourceWordCount - 3 );
	assert.deepEqual( expectations.fragments, [ 'contributions', 'experience', 'skills', 'showcase', 'contact' ] );
	assert.equal( expectations.projects.length, 5 );
	assert.equal( expectations.projects[ 0 ].title, 'Flavor Agent' );
	assert.equal( expectations.projects.at( -1 ).title, 'Tableau' );
	assert.equal( expectations.portraitAlt, 'Henry Perkins' );
	assert.deepEqual( expectations.heroActionLabels, [ 'Download résumé (PDF)', 'Get in touch' ] );
	assert.deepEqual( expectations.closingActionLabels, [ 'Start a conversation', 'Download résumé (PDF)' ] );
} );

test( 'the rendered v3 probe counts only the five native navigation-list links', () => {
	const expression = buildInspectionExpression( {
		fragments: [ 'contributions', 'experience', 'skills', 'showcase', 'contact' ],
		version: 'v3',
	} );

	assert.match(
		expression,
		/const linkRoot = isV2 \? nav : nav\.querySelector\('\.hp-about-nav__list'\);/
	);
	assert.match( expression, /Array\.from\(linkRoot\.querySelectorAll\('a'\)\)/ );
} );

test( 'the rendered v3 probe restores responsive Skills copy before counting words', () => {
	const expression = buildInspectionExpression( {
		fragments: [ 'contributions', 'experience', 'skills', 'showcase', 'contact' ],
		version: 'v3',
	} );

	assert.match( expression, /skillsEyebrow\.textContent = 'Capabilities'/ );
	assert.match(
		expression,
		/skillsIntro\.textContent = 'Every term is a filter into the record above\./
	);
} );

test( 'the rendered v3 probe includes every generated control in its focus pass', () => {
	const expression = buildInspectionExpression( {
		fragments: [ 'contributions', 'experience', 'skills', 'showcase', 'contact' ],
		version: 'v3',
	} );

	for ( const selector of [
		'.hp-about-v3-hero__contact a',
		'button.hp-about-timeline__label',
		'.hp-about-timeline__fold-body a',
		'.hp-about-skill-term__button',
		'.hp-about-earlier__toggle',
	] ) {
		assert.match( expression, new RegExp( selector.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) ) );
	}
	assert.match( expression, /outlineOffset/ );
} );

test( 'v3 showcase stays stacked until the 64rem layout handoff', () => {
	assert.equal( usesWideResumeShowcaseLayout( 'v3', 1023 ), false );
	assert.equal( usesWideResumeShowcaseLayout( 'v3', 1024 ), true );
	assert.equal( usesWideResumeShowcaseLayout( 'v2', 639 ), false );
	assert.equal( usesWideResumeShowcaseLayout( 'v2', 640 ), true );
} );

test( 'exports the real-browser v3 interaction regression', () => {
	assert.equal( typeof verifyV3Interactions, 'function' );
} );

test( 'the v3 router regression drives a trusted away/back flow and pins one remount', () => {
	assert.equal( typeof verifyV3RouterRoundTrip, 'function' );
	const source = verifyV3RouterRoundTrip.toString();

	assert.match( source, /Input\.dispatchMouseEvent/ );
	assert.match( source, /history\.back\(\)/ );
	assert.match( source, /\.hp-about-skills__controls/ );
	assert.match( source, /dividers:\s*2/ );
	assert.match( source, /chips:\s*11/ );
} );

test( 'the v3 round trip accepts a clean full-navigation fallback when no router is present', async () => {
	const cdp = {
		async send( method, payload = {} ) {
			if ( method === 'Input.dispatchMouseEvent' ) {
				return {};
			}
			if ( method !== 'Runtime.evaluate' ) {
				throw new Error( `Unexpected CDP method: ${ method }` );
			}

			const expression = payload.expression || '';
			if ( expression.includes( 'window.__hpAboutRouterProbe =' ) ) {
				return { result: { value: {
					error: '', initialPath: '/about/', routerAvailable: false,
					stepButtons: 5, timelinePanels: 1, x: 24, y: 24,
				} } };
			}
			if ( expression.includes( "document.querySelector('.hp-about-resume-v3.is-enhanced')" ) ) {
				return { result: { value: {
					chips: 11, clearButtons: 1, controlSets: 1, dividers: 2,
					earlierToggles: 1, hasGlobalClass: true, hasSentinel: false,
					headerOffset: '72px', roots: 1, stepButtons: 5, timelinePanels: 1,
				} } };
			}
			if ( expression.includes( 'stepButtons:' ) ) {
				return { result: { value: {
					controlSets: 0, earlierToggles: 0, hasGlobalClass: false,
					hasSentinel: false, headerOffset: '', path: '/', roots: 0,
					stepButtons: 0, timelinePanels: 0,
				} } };
			}
			if ( expression.includes( 'history.back()' ) ) {
				return { result: { value: true } };
			}
			throw new Error( `Unexpected Runtime.evaluate expression: ${ expression }` );
		},
	};

	await assert.doesNotReject( () => verifyV3RouterRoundTrip( cdp, 'session-1' ) );
} );

test( 'runs selected-body and CSS contracts in source-only mode without an origin', () => {
	const result = spawnSync(
		process.execPath,
		[ 'scripts/verify-about-page-rendered.js', '--source-only', '--drafts' ],
		{
			cwd: themeRoot,
			encoding: 'utf8',
			env: { ...process.env, HPERKINS_ORIGIN: '' },
		}
	);

	assert.equal( result.status, 0, result.stderr );
	assert.match( result.stdout, /About rendered-page source contracts verified\./ );
} );
