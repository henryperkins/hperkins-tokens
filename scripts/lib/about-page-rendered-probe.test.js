const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { spawnSync } = require( 'node:child_process' );

const {
	deriveRenderedExpectations,
	verifyCardHoverInertia,
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

test( 'derives rendered copy from the selected About body', () => {
	const source = fs.readFileSync( acceptedSnapshotPath, 'utf8' );
	const changed = source
		.replace( 'WordPress / AI Implementation &amp; Enablement', 'Selected phase heading' )
		.replace( '>Get in touch<', '>Selected phase action<' );
	const expectations = deriveRenderedExpectations( changed, { label: 'changed About fixture' } );

	assert.equal( expectations.headings[ 0 ].text, 'Selected phase heading' );
	assert.equal( expectations.heroActionLabels[ 0 ], 'Selected phase action' );
} );

test( 'rejects a WCUS callout nested inside an action rail', () => {
	const source = fs.readFileSync( acceptedSnapshotPath, 'utf8' );
	const nested = source
		.replace(
			'<div class="wp-block-group hp-about-wcus">',
			'<div class="hp-action-rail"><div class="wp-block-group hp-about-wcus">'
		)
		.replace(
			'<!-- /wp:buttons --></div>\n<!-- /wp:group -->',
			'<!-- /wp:buttons --></div>\n<!-- /wp:group --></div>'
		);
	assert.notEqual( nested, source, 'ancestor mutation must apply' );
	assert.throws(
		() => deriveRenderedExpectations( nested, { label: 'nested WCUS fixture' } ),
		/outside.*hp-action-rail|ancestor/i
	);
} );

test( 'requires the WCUS action link to use one core Button wrapper', () => {
	const source = fs.readFileSync( acceptedSnapshotPath, 'utf8' );
	const plainAnchor = source.replace(
		'<div class="wp-block-button is-style-secondary"><a class="wp-block-button__link wp-element-button" href="/contact/">Start a conversation</a></div>',
		'<div class="not-a-button is-style-secondary"><a href="/contact/">Start a conversation</a></div>'
	);
	assert.notEqual( plainAnchor, source, 'plain-anchor mutation must apply' );
	assert.throws(
		() => deriveRenderedExpectations( plainAnchor, { label: 'plain WCUS action fixture' } ),
		/exactly one.*wp-block-button|core Button/i
	);
} );

test( 'derives the v2 rail, showcase, portrait, and closing actions from the selected draft', () => {
	const source = fs.readFileSync( draftPath, 'utf8' );
	const expectations = deriveRenderedExpectations( source, { label: 'About v2 draft' } );

	assert.equal( expectations.version, 'v2' );
	assert.equal( expectations.navLabel, 'About page sections' );
	assert.deepEqual( expectations.fragments, [ 'contributions', 'experience', 'skills', 'showcase', 'contact' ] );
	assert.equal( expectations.projects.length, 5 );
	assert.equal( expectations.projects[ 0 ].title, 'Flavor Agent' );
	assert.equal( expectations.projects.at( -1 ).title, 'Tableau' );
	assert.equal( expectations.portraitAlt, 'Henry Perkins' );
	assert.deepEqual( expectations.heroActionLabels, [] );
	assert.deepEqual( expectations.closingActionLabels, [ 'Start a conversation', 'Download résumé (PDF)' ] );
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
