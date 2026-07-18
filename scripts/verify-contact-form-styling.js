#!/usr/bin/env node
/**
 * Dependency-free regression check for the /contact/ form controls.
 *
 * Launches Chrome through the DevTools Protocol and fails if the themed
 * hp-input wrapper loses to the parent theme's raw input rules, or if the
 * contact focus ring falls back to the weak translucent treatment.
 */
const { spawn } = require( 'node:child_process' );
const fs = require( 'node:fs/promises' );
const { readFileSync } = require( 'node:fs' );
const os = require( 'node:os' );
const path = require( 'node:path' );

const { getOrigin } = require( './lib/site-url' );

const CHROME = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const ORIGIN = getOrigin();
const CONTACT_EMAIL = 'htperkins@gmail.com';
const SUBSCRIBE_ACTION = new URL( '/wp-admin/admin-post.php', ORIGIN ).href;

// Derive the expected status copy from the subscribe pattern itself so this
// verifier can never drift from the strings the pattern actually renders.
function extractSubscribeMessage( source, status ) {
	const match = source.match( new RegExp(
		String.raw`'${ status }'\s*===\s*\$subscribe_status\s*\)\s*\{\s*\$subscribe_message\s*=\s*'((?:[^'\\]|\\.)*)';`
	) );
	if ( ! match ) {
		throw new Error(
			`patterns/imladris-subscribe.php no longer assigns $subscribe_message for the "${ status }" status; update the extractor in verify-contact-form-styling.js alongside the pattern.`
		);
	}
	return match[1].replace( /\\(['\\])/g, '$1' );
}

const subscribePatternSource = readFileSync(
	path.join( __dirname, '..', 'patterns/imladris-subscribe.php' ),
	'utf8'
);
const SUBSCRIBE_RECEIVED = extractSubscribeMessage( subscribePatternSource, 'success' );
const SUBSCRIBE_EMAIL_ERROR = extractSubscribeMessage( subscribePatternSource, 'invalid-email' );
const VIEWPORT = { width: 390, height: 1400, deviceScaleFactor: 1, mobile: false };

function wait( ms ) {
	return new Promise( ( resolve ) => setTimeout( resolve, ms ) );
}

async function rmRetry( target ) {
	let lastError;
	for ( let attempt = 0; attempt < 8; attempt++ ) {
		try {
			await fs.rm( target, { recursive: true, force: true } );
			return;
		} catch ( error ) {
			lastError = error;
			await wait( 250 );
		}
	}
	throw lastError;
}

async function waitForDevToolsUrl( chrome ) {
	let buffer = '';
	return new Promise( ( resolve, reject ) => {
		const timer = setTimeout( () => reject( new Error( 'Timed out waiting for Chrome DevTools URL.' ) ), 10000 );
		chrome.stderr.on( 'data', ( chunk ) => {
			buffer += chunk.toString();
			const match = buffer.match( /(ws:\/\/127\.0\.0\.1:\d+\/devtools\/browser\/[^\s]+)/ );
			if ( match ) {
				clearTimeout( timer );
				resolve( match[1] );
			}
		} );
		chrome.on( 'exit', ( code ) => {
			clearTimeout( timer );
			reject( new Error( `Chrome exited before DevTools was ready (code ${ code }).` ) );
		} );
	} );
}

function createCdpClient( wsUrl ) {
	const ws = new WebSocket( wsUrl );
	let nextId = 1;
	const pending = new Map();
	const listeners = new Map();

	ws.addEventListener( 'message', ( event ) => {
		const message = JSON.parse( event.data );
		if ( message.id && pending.has( message.id ) ) {
			const { resolve, reject } = pending.get( message.id );
			pending.delete( message.id );
			if ( message.error ) {
				reject( new Error( message.error.message ) );
			} else {
				resolve( message.result || {} );
			}
			return;
		}

		if ( message.method ) {
			const key = `${ message.sessionId || '' }:${ message.method }`;
			const callbacks = listeners.get( key ) || [];
			listeners.delete( key );
			callbacks.forEach( ( callback ) => callback( message.params || {} ) );
		}
	} );

	function send( method, params = {}, sessionId, timeout = 15000 ) {
		const id = nextId++;
		ws.send( JSON.stringify( { id, method, params, sessionId } ) );
		return new Promise( ( resolve, reject ) => {
			// A dropped CDP response must fail the run, not hang it forever.
			const timer = setTimeout( () => {
				pending.delete( id );
				reject( new Error( `Timed out waiting for ${ method } response.` ) );
			}, timeout );
			pending.set( id, {
				resolve: ( value ) => {
					clearTimeout( timer );
					resolve( value );
				},
				reject: ( error ) => {
					clearTimeout( timer );
					reject( error );
				},
			} );
		} );
	}

	function once( method, sessionId, timeout = 10000 ) {
		const key = `${ sessionId || '' }:${ method }`;
		return new Promise( ( resolve, reject ) => {
			const timer = setTimeout( () => reject( new Error( `Timed out waiting for ${ method }.` ) ), timeout );
			const callback = ( params ) => {
				clearTimeout( timer );
				resolve( params );
			};
			listeners.set( key, [ ...( listeners.get( key ) || [] ), callback ] );
		} );
	}

	return new Promise( ( resolve, reject ) => {
		ws.addEventListener( 'open', () => resolve( { send, once, close: () => ws.close() } ) );
		ws.addEventListener( 'error', reject );
	} );
}

async function inspectContactPage( cdp ) {
	const target = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
	const attached = await cdp.send( 'Target.attachToTarget', {
		targetId: target.targetId,
		flatten: true,
	} );
	const sessionId = attached.sessionId;

	await cdp.send( 'Page.enable', {}, sessionId );
	await cdp.send( 'Runtime.enable', {}, sessionId );
	await cdp.send( 'Emulation.setDeviceMetricsOverride', VIEWPORT, sessionId );

	const loaded = cdp.once( 'Page.loadEventFired', sessionId );
	await cdp.send( 'Page.navigate', { url: new URL( '/contact/', ORIGIN ).href }, sessionId );
	await loaded;
	await cdp.send( 'Runtime.evaluate', { expression: 'document.fonts && document.fonts.ready', awaitPromise: true }, sessionId );
	await wait( 250 );

	const expression = `(() => {
		const rootStyle = getComputedStyle(document.documentElement);
		const color = (value) => {
			const probe = document.createElement('span');
			probe.style.color = value;
			document.body.appendChild(probe);
			const normalized = getComputedStyle(probe).color;
			probe.remove();
			return normalized;
		};
		const colorToken = (name) => color(rootStyle.getPropertyValue(name).trim());
		const styles = (el) => {
			const s = getComputedStyle(el);
			return {
				borderTopWidth: s.borderTopWidth,
				borderStyle: s.borderStyle,
				borderColor: s.borderColor,
				outlineStyle: s.outlineStyle,
				outlineWidth: s.outlineWidth,
				outlineColor: s.outlineColor,
				outlineOffset: s.outlineOffset,
				boxShadow: s.boxShadow,
				paddingLeft: s.paddingLeft,
				paddingRight: s.paddingRight,
				minHeight: s.minHeight,
				color: s.color,
			};
		};
		const form = document.querySelector('.hp-contact-form');
		if (!form) { throw new Error('.hp-contact-form not found on /contact/'); }
		const subscribeForm = document.querySelector('.hp-subscribe__form');
		const nameInput = form.querySelector('input[name="name"]');
		const nameControl = nameInput.closest('.hp-input__control');
		const emailInput = form.querySelector('input[name="email"]');
		const emailControl = emailInput.closest('.hp-input__control');
			const textarea = form.querySelector('textarea[name="message"]');
			const result = {
				tokens: {
					strong: colorToken('--wp--custom--text--strong'),
					faint: colorToken('--wp--custom--text--faint'),
					focus: colorToken('--wp--preset--color--gold-700'),
					danger: colorToken('--wp--custom--feedback--danger'),
				},
				fallbacks: {
					contactAction: form.getAttribute('action') || '',
					contactMethod: form.getAttribute('method') || '',
					contactEnctype: form.getAttribute('enctype') || '',
					subscribeAction: subscribeForm ? subscribeForm.getAttribute('action') || '' : '',
					subscribeMethod: subscribeForm ? subscribeForm.getAttribute('method') || '' : '',
					subscribeEnctype: subscribeForm ? subscribeForm.getAttribute('enctype') || '' : '',
					subscribeRequestAction: subscribeForm ? ( subscribeForm.querySelector('[name="action"]')?.value || '' ) : '',
					subscribeNonce: subscribeForm ? ( subscribeForm.querySelector('[name="hperkins_tokens_subscribe_nonce"]')?.value || '' ) : '',
				},
				normalInput: styles(nameInput),
				normalControl: styles(nameControl),
			};
			nameInput.focus();
			result.focusedInput = styles(nameInput);
			result.focusedControl = styles(nameControl);
			textarea.focus();
			result.focusedTextarea = styles(textarea);
			emailInput.value = 'not-an-email';
			form.querySelector('button[type="submit"]').click();
			result.invalidInput = styles(emailInput);
			result.invalidControl = styles(emailControl);
			result.invalidActiveName = document.activeElement && document.activeElement.name;
			result.invalidInline = {
				hasErrorClass: !! emailInput.closest('.hp-input.has-error'),
				ariaInvalid: emailInput.getAttribute('aria-invalid') || '',
				helperText: (emailInput.closest('.hp-input')?.querySelector('.hp-input__helper')?.textContent || '').trim(),
				stillForm: !! document.querySelector('.hp-contact-form'),
			};
			result.channels = Array.from(document.querySelectorAll('.hp-channels a')).map((link) => {
				const s = getComputedStyle(link);
				const r = link.getBoundingClientRect();
				return {
					href: link.href,
					label: link.getAttribute('aria-label') || '',
					text: link.textContent.trim().replace(/\\s+/g, ' '),
					svgCount: link.querySelectorAll('svg').length,
					width: Math.round(r.width),
					height: Math.round(r.height),
					display: s.display,
					alignItems: s.alignItems,
					justifyContent: s.justifyContent,
				};
			});
			result.contactAside = {
				hasWhatToInclude: !! document.querySelector('.hp-contact-aside .hp-callout'),
				hasOfficeHours: !! document.querySelector('.hp-contact-aside .hp-officehours'),
			};
			return result;
			})()`;

	const evaluated = await cdp.send( 'Runtime.evaluate', {
		expression,
		awaitPromise: true,
		returnByValue: true,
	}, sessionId );
	if ( evaluated.exceptionDetails ) {
		throw new Error( `contact page evaluation failed: ${ evaluated.exceptionDetails.exception?.description || evaluated.exceptionDetails.text }` );
	}

	await cdp.send( 'Target.closeTarget', { targetId: target.targetId } );
	return evaluated.result.value;
}

async function inspectSubscribeStatusPage( cdp, status ) {
	const target = await cdp.send( 'Target.createTarget', { url: 'about:blank' } );
	const attached = await cdp.send( 'Target.attachToTarget', {
		targetId: target.targetId,
		flatten: true,
	} );
	const sessionId = attached.sessionId;

	await cdp.send( 'Page.enable', {}, sessionId );
	await cdp.send( 'Runtime.enable', {}, sessionId );
	await cdp.send( 'Emulation.setDeviceMetricsOverride', VIEWPORT, sessionId );

	const url = new URL( '/contact/', ORIGIN );
	url.searchParams.set( 'hperkins_subscribe', status );
	const loaded = cdp.once( 'Page.loadEventFired', sessionId );
	await cdp.send( 'Page.navigate', { url: url.href }, sessionId );
	await loaded;
	await cdp.send( 'Runtime.evaluate', { expression: 'document.fonts && document.fonts.ready', awaitPromise: true }, sessionId );
	await wait( 250 );

	const expression = `(() => {
		const form = document.querySelector('.hp-subscribe__form');
		const input = form && form.querySelector('input[type="email"]');
		const statusNode = () => form && form.querySelector('.hp-subscribe__status');
		const errorNode = () => form && form.querySelector('.hp-input__helper[data-hp-error]');
		const snap = () => ({
			statusText: statusNode() ? statusNode().textContent.trim() : '',
			statusClass: statusNode() ? statusNode().className : '',
			statusRole: statusNode() ? statusNode().getAttribute('role') || '' : '',
			statusAriaLive: statusNode() ? statusNode().getAttribute('aria-live') || '' : '',
			errorText: errorNode() ? errorNode().textContent.trim() : '',
			errorClass: errorNode() ? errorNode().className : '',
			hasErrorClass: form ? form.classList.contains('has-error') : false,
			ariaInvalid: input ? input.getAttribute('aria-invalid') || '' : '',
			describedBy: input ? input.getAttribute('aria-describedby') || '' : '',
			legacyHelperCount: form ? form.querySelectorAll('.hp-input__helper:not([data-hp-error])').length : 0,
		});
		const before = snap();
		input.value = 'not-an-email';
		const canceled = ! form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		const afterInvalid = snap();
		input.value = 'valid@example.com';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		const afterInput = snap();
		return { canceled, before, afterInvalid, afterInput };
	})()`;

	const evaluated = await cdp.send( 'Runtime.evaluate', {
		expression,
		awaitPromise: true,
		returnByValue: true,
	}, sessionId );

	await cdp.send( 'Target.closeTarget', { targetId: target.targetId } );
	return evaluated.result.value;
}

function failUnless( condition, failures, message ) {
	if ( ! condition ) {
		failures.push( message );
	}
}

function validate( result ) {
	const failures = [];
	failUnless(
		result.fallbacks.contactAction === `mailto:${ CONTACT_EMAIL }`,
		failures,
		`contact form fallback action is "${ result.fallbacks.contactAction || '(missing)' }", expected mailto:${ CONTACT_EMAIL }.`
	);
	failUnless(
		result.fallbacks.contactMethod.toLowerCase() === 'post',
		failures,
		`contact form fallback method is "${ result.fallbacks.contactMethod || '(missing)' }", expected post.`
	);
	failUnless(
		result.fallbacks.contactEnctype.toLowerCase() === 'text/plain',
		failures,
		`contact form fallback enctype is "${ result.fallbacks.contactEnctype || '(missing)' }", expected text/plain.`
	);
	failUnless(
		result.fallbacks.subscribeAction === SUBSCRIBE_ACTION,
		failures,
		`subscribe form action is "${ result.fallbacks.subscribeAction || '(missing)' }", expected ${ SUBSCRIBE_ACTION }.`
	);
	failUnless(
		result.fallbacks.subscribeMethod.toLowerCase() === 'post',
		failures,
		`subscribe form method is "${ result.fallbacks.subscribeMethod || '(missing)' }", expected post.`
	);
	failUnless(
		'' === result.fallbacks.subscribeEnctype,
		failures,
		`subscribe form enctype is "${ result.fallbacks.subscribeEnctype || '(missing)' }", expected no explicit enctype.`
	);
	failUnless(
		result.fallbacks.subscribeRequestAction === 'hperkins_tokens_subscribe',
		failures,
		`subscribe request action is "${ result.fallbacks.subscribeRequestAction || '(missing)' }", expected hperkins_tokens_subscribe.`
	);
	failUnless(
		result.fallbacks.subscribeNonce.length > 0,
		failures,
		'subscribe form is missing the public nonce field.'
	);
	failUnless(
		result.normalInput.borderTopWidth === '0px' && result.normalInput.borderStyle === 'none',
		failures,
		`raw text inputs still draw an inner border (${ result.normalInput.borderTopWidth } ${ result.normalInput.borderStyle }).`
	);
	failUnless(
		result.normalInput.paddingLeft === '0px' && result.normalInput.paddingRight === '0px',
		failures,
		`raw text inputs still keep parent-theme horizontal padding (${ result.normalInput.paddingLeft } / ${ result.normalInput.paddingRight }).`
	);
	failUnless(
		result.normalInput.color === result.tokens.strong,
		failures,
		`raw text inputs use ${ result.normalInput.color } instead of the strong text token ${ result.tokens.strong }.`
	);
	failUnless(
		result.focusedInput.outlineStyle === 'none' && result.focusedInput.outlineWidth === '0px',
		failures,
		`focused raw input still draws its own outline (${ result.focusedInput.outlineWidth } ${ result.focusedInput.outlineStyle }).`
	);
	// 0.3.34 intentionally added the offset outline ring on focus (a11y): the
	// contract is gold-700 border PLUS the 2px gold-700 outline, not a lone border.
	failUnless(
		result.focusedControl.borderColor === result.tokens.focus &&
			result.focusedControl.outlineStyle === 'solid' &&
			result.focusedControl.outlineWidth === '2px' &&
			result.focusedControl.outlineColor === result.tokens.focus,
		failures,
		`hp-input wrapper focus state is border ${ result.focusedControl.borderColor } plus outline ${ result.focusedControl.outlineWidth } ${ result.focusedControl.outlineStyle } ${ result.focusedControl.outlineColor }, expected the gold-700 border plus a 2px solid gold-700 outline ring.`
	);
	failUnless(
		result.focusedTextarea.borderColor === result.tokens.focus &&
			result.focusedTextarea.outlineStyle === 'solid' &&
			result.focusedTextarea.outlineWidth === '2px' &&
			result.focusedTextarea.outlineColor === result.tokens.focus,
		failures,
		`contact textarea focus state is border ${ result.focusedTextarea.borderColor } plus outline ${ result.focusedTextarea.outlineWidth } ${ result.focusedTextarea.outlineStyle } ${ result.focusedTextarea.outlineColor }, expected the gold-700 border plus a 2px solid gold-700 outline ring.`
	);
	failUnless(
		result.invalidActiveName === 'email',
		failures,
		`invalid email did not receive focus (active field: ${ result.invalidActiveName || 'none' }).`
	);
	failUnless(
		result.invalidInline.hasErrorClass &&
			result.invalidInline.ariaInvalid === 'true' &&
			result.invalidInline.helperText === 'Enter a valid email so I can reply.' &&
			result.invalidInline.stillForm,
		failures,
		`real invalid click did not render the inline contact error (class=${ result.invalidInline.hasErrorClass }, aria=${ result.invalidInline.ariaInvalid || 'none' }, helper="${ result.invalidInline.helperText }", stillForm=${ result.invalidInline.stillForm }).`
	);
	failUnless(
		result.invalidControl.borderColor === result.tokens.danger,
		failures,
		`invalid hp-input wrapper border is ${ result.invalidControl.borderColor }, expected danger token ${ result.tokens.danger }.`
	);
	failUnless(
		result.invalidInput.borderTopWidth === '0px' && result.invalidInput.outlineStyle === 'none',
		failures,
		`invalid raw email input still has inner border/outline (${ result.invalidInput.borderTopWidth }, ${ result.invalidInput.outlineStyle }).`
	);
	failUnless(
		result.channels.length === 3,
		failures,
		`direct channels render ${ result.channels.length } links, expected 3 icon profile links.`
	);
	const expectedLinks = [
		{ label: 'GitHub profile', href: 'https://github.com/henryperkins' },
		{ label: 'LinkedIn profile', href: 'https://www.linkedin.com/in/henryperkins' },
		{ label: 'WordPress.org profile', href: 'https://profiles.wordpress.org/htperkins/' },
	];
	for ( const expected of expectedLinks ) {
		const channel = result.channels.find( ( item ) => item.label === expected.label );
		failUnless(
			!! channel,
			failures,
			`direct channels are missing aria-label "${ expected.label }".`
		);
		if ( channel ) {
			failUnless(
				channel.href === expected.href,
				failures,
				`"${ expected.label }" links to ${ channel.href }, expected ${ expected.href }.`
			);
			failUnless(
				channel.text === '',
				failures,
				`"${ expected.label }" still exposes visible text "${ channel.text }" instead of icon-only markup.`
			);
			failUnless(
				channel.svgCount === 1,
				failures,
				`"${ expected.label }" renders ${ channel.svgCount } SVGs, expected one icon.`
			);
			failUnless(
				channel.width >= 44 && channel.height >= 44,
				failures,
				`"${ expected.label }" touch target is ${ channel.width }x${ channel.height }, expected at least 44x44.`
			);
		}
	}
	failUnless(
		result.channels.every( ( item ) => ! item.href.startsWith( 'mailto:' ) ),
		failures,
		'direct channels still include an email link; the form already preserves the email path.'
	);
	failUnless(
		! result.contactAside.hasWhatToInclude,
		failures,
		'contact aside still renders the redundant "What to include" callout.'
	);
	failUnless(
		! result.contactAside.hasOfficeHours,
		failures,
		'contact aside still renders the redundant "Office hours" block.'
	);
	failUnless(
		result.subscribeStatus.before.statusText === SUBSCRIBE_RECEIVED &&
			! result.subscribeStatus.before.statusText.toLowerCase().includes( 'already' ),
		failures,
			`success subscribe status exposes "${ result.subscribeStatus.before.statusText }" instead of the generic received message.`
	);
	failUnless(
		result.subscribeStatus.before.statusClass === 'hp-subscribe__status' &&
			result.subscribeStatus.before.statusRole === 'status' &&
			result.subscribeStatus.before.statusAriaLive === '',
		failures,
			`success subscribe status has class="${ result.subscribeStatus.before.statusClass }", role="${ result.subscribeStatus.before.statusRole }", aria-live="${ result.subscribeStatus.before.statusAriaLive }"; expected hp-subscribe__status + role=status with no explicit aria-live.`
	);
	failUnless(
		result.subscribeStatus.canceled &&
			result.subscribeStatus.afterInvalid.statusText === SUBSCRIBE_RECEIVED &&
			result.subscribeStatus.afterInvalid.errorText === SUBSCRIBE_EMAIL_ERROR &&
			result.subscribeStatus.afterInvalid.hasErrorClass &&
			result.subscribeStatus.afterInvalid.ariaInvalid === 'true' &&
			result.subscribeStatus.afterInvalid.describedBy,
		failures,
		`subscribe invalid submit did not keep the server status separate from the JS error (${ JSON.stringify( result.subscribeStatus.afterInvalid ) }).`
	);
	failUnless(
		result.subscribeStatus.afterInput.statusText === SUBSCRIBE_RECEIVED &&
			result.subscribeStatus.afterInput.errorText === '' &&
			! result.subscribeStatus.afterInput.hasErrorClass &&
			result.subscribeStatus.afterInput.ariaInvalid === '' &&
			result.subscribeStatus.afterInput.describedBy === '',
		failures,
		`subscribe input did not clear only the JS error while preserving the server status (${ JSON.stringify( result.subscribeStatus.afterInput ) }).`
	);
	failUnless(
		result.subscribeInvalidStatus.before.statusText === SUBSCRIBE_EMAIL_ERROR &&
			result.subscribeInvalidStatus.before.statusClass === 'hp-subscribe__status' &&
			result.subscribeInvalidStatus.before.statusRole === 'alert' &&
			result.subscribeInvalidStatus.before.statusAriaLive === '',
		failures,
		`invalid subscribe status has ${ JSON.stringify( result.subscribeInvalidStatus.before ) }, expected hp-subscribe__status + role=alert with no explicit aria-live.`
	);
	return failures;
}

async function main() {
	const userDataDir = await fs.mkdtemp( path.join( os.tmpdir(), 'hp-contact-form-chrome-' ) );
	const chrome = spawn( CHROME, [
		'--headless=new',
		'--disable-gpu',
		'--no-sandbox',
		'--remote-debugging-port=0',
		`--user-data-dir=${ userDataDir }`,
		'about:blank',
	], { stdio: [ 'ignore', 'ignore', 'pipe' ] } );

	try {
		const wsUrl = await waitForDevToolsUrl( chrome );
		const cdp = await createCdpClient( wsUrl );
		const result = await inspectContactPage( cdp );
			result.subscribeStatus = await inspectSubscribeStatusPage( cdp, 'success' );
		result.subscribeInvalidStatus = await inspectSubscribeStatusPage( cdp, 'invalid-email' );
		cdp.close();

		const failures = validate( result );
		if ( failures.length ) {
			throw new Error( failures.join( '\n' ) );
		}
		console.log( 'checked contact form input, focus, and invalid states' );
	} finally {
		if ( ! chrome.killed ) {
			chrome.kill( 'SIGTERM' );
			await new Promise( ( resolve ) => {
				const timer = setTimeout( resolve, 2000 );
				chrome.once( 'exit', () => {
					clearTimeout( timer );
					resolve();
				} );
			} );
		}
		await rmRetry( userDataDir );
	}
}

main().catch( ( error ) => {
	console.error( error.message );
	process.exit( 1 );
} );
