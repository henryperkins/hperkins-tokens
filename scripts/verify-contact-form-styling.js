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
const os = require( 'node:os' );
const path = require( 'node:path' );

const CHROME = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const ORIGIN = process.env.HPERKINS_ORIGIN || 'https://hperkins.blog';
const CONTACT_EMAIL = 'htperkins@gmail.com';
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

	function send( method, params = {}, sessionId ) {
		const id = nextId++;
		ws.send( JSON.stringify( { id, method, params, sessionId } ) );
		return new Promise( ( resolve, reject ) => pending.set( id, { resolve, reject } ) );
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
	const subscribeSubject = encodeURIComponent( 'Subscribe to the dispatch' );
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
		result.fallbacks.subscribeAction === `mailto:${ CONTACT_EMAIL }?subject=${ subscribeSubject }`,
		failures,
		`subscribe form fallback action is "${ result.fallbacks.subscribeAction || '(missing)' }", expected mailto:${ CONTACT_EMAIL }?subject=${ subscribeSubject }.`
	);
	failUnless(
		result.fallbacks.subscribeMethod.toLowerCase() === 'post',
		failures,
		`subscribe form fallback method is "${ result.fallbacks.subscribeMethod || '(missing)' }", expected post.`
	);
	failUnless(
		result.fallbacks.subscribeEnctype.toLowerCase() === 'text/plain',
		failures,
		`subscribe form fallback enctype is "${ result.fallbacks.subscribeEnctype || '(missing)' }", expected text/plain.`
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
	failUnless(
		result.focusedControl.outlineStyle === 'none' && result.focusedControl.borderColor === result.tokens.focus,
		failures,
		`hp-input wrapper focus state is border ${ result.focusedControl.borderColor } plus outline ${ result.focusedControl.outlineWidth } ${ result.focusedControl.outlineStyle } ${ result.focusedControl.outlineColor }, expected a single border in ${ result.tokens.focus }.`
	);
	failUnless(
		result.focusedTextarea.outlineStyle === 'none' && result.focusedTextarea.borderColor === result.tokens.focus,
		failures,
		`contact textarea focus state is border ${ result.focusedTextarea.borderColor } plus outline ${ result.focusedTextarea.outlineWidth } ${ result.focusedTextarea.outlineStyle } ${ result.focusedTextarea.outlineColor }, expected a single border in ${ result.tokens.focus }.`
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
