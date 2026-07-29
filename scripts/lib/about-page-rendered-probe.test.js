const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const { verifyCardHoverInertia } = require( '../verify-about-page-rendered' );

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
