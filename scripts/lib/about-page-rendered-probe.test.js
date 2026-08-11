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
	const source = fs.readFileSync(
		path.join( themeRoot, 'content', 'page-drafts', 'about.html' ),
		'utf8'
	);
	const changed = source
		.replace( 'WordPress / AI Implementation &amp; Enablement', 'Selected phase heading' )
		.replace( '>Get in touch<', '>Selected phase action<' );
	const expectations = deriveRenderedExpectations( changed, { label: 'changed About fixture' } );

	assert.equal( expectations.headings[ 0 ].text, 'Selected phase heading' );
	assert.equal( expectations.heroActionLabels[ 0 ], 'Selected phase action' );
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
