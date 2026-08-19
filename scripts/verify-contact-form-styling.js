#!/usr/bin/env node
/**
 * Dependency-free regression check for the /contact/ form controls.
 *
 * Launches Chrome through the DevTools Protocol and fails if the themed
 * hp-input wrapper loses to the parent theme's raw input rules, or if the
 * contact focus ring falls back to the weak translucent treatment.
 *
 * It also pins the page composition the Imladris Contact template asks for:
 * the contact container centred in the page spine and shared by the hero so
 * the route hangs on one left edge, the contact-only lead measure, the
 * gold-ringed confirmation card, the secondary "Compose another" button, and
 * the outline icon family shared with the footer.
 *
 * Two of those checks are deliberately not content with "it renders right
 * here". The column check replays core's own constrained-layout declaration
 * LAST and re-measures, because production's Page Optimize concatenates the
 * file-based sheets above WordPress's inline styles and inverts any
 * order-decided tie (README.md; verify-header.js does the same for
 * Assembler's focus-ring declaration). And the icon check compares the glyph
 * geometry in patterns/contact.php against parts/footer.html, since "one icon
 * family with the footer" is a claim about provenance that stroke widths alone
 * cannot prove.
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

// Same idea for the contact confirmation: read the copy out of the script that
// renders it instead of keeping a second, silently divergent copy here — no
// assertion below repeats a word of the panel's wording. The call is authored
// as single-quoted literals joined with the address the handler read off the
// form, so rebuild that shape by hand rather than eval'ing theme source.
function splitTopLevelArguments( source ) {
	const args = [];
	let current = '';
	let inString = false;
	for ( let index = 0; index < source.length; index++ ) {
		const character = source[ index ];
		if ( inString ) {
			if ( character === '\\' ) {
				current += character + source[ ++index ];
				continue;
			}
			if ( character === "'" ) {
				inString = false;
			}
			current += character;
			continue;
		}
		if ( character === "'" ) {
			inString = true;
			current += character;
			continue;
		}
		if ( character === ',' ) {
			args.push( current );
			current = '';
			continue;
		}
		current += character;
	}
	args.push( current );
	return args;
}

const JS_ESCAPES = { n: '\n', t: '\t', r: '\r', '0': '\0' };

function resolveCopyExpression( expression, constants ) {
	let resolved = '';
	let index = 0;
	while ( index < expression.length ) {
		if ( expression[ index ] === "'" ) {
			let cursor = index + 1;
			while ( cursor < expression.length && expression[ cursor ] !== "'" ) {
				if ( expression[ cursor ] === '\\' ) {
					// Decode the escape rather than dropping the backslash: an
					// unhandled \n would otherwise resolve to a literal "n" and
					// the comparison against the rendered text would fail with a
					// message that made no sense.
					resolved += JS_ESCAPES[ expression[ cursor + 1 ] ] ?? expression[ cursor + 1 ];
					cursor += 2;
					continue;
				}
				resolved += expression[ cursor++ ];
			}
			index = cursor + 1;
			continue;
		}
		const identifier = expression.slice( index ).match( /^[A-Za-z_$][\w$]*/ );
		if ( identifier ) {
			if ( ! ( identifier[0] in constants ) ) {
				throw new Error(
					`verify-contact-form-styling.js cannot resolve "${ identifier[0] }" in the contact confirmation copy; teach the extractor about it alongside the change to assets/js/form-enhance.js.`
				);
			}
			resolved += constants[ identifier[0] ];
			index += identifier[0].length;
			continue;
		}
		// Whitespace, the + joins, and line continuations carry no text.
		index++;
	}
	return resolved;
}

function extractContactConfirmation( source ) {
	const call = source.match( /var panel = confirmPanel\(([\s\S]*?)\n\t*\);/ );
	if ( ! call ) {
		throw new Error(
			'assets/js/form-enhance.js no longer builds the contact confirmation with a `var panel = confirmPanel( … );` call; update the extractor in verify-contact-form-styling.js alongside it.'
		);
	}
	const args = splitTopLevelArguments( call[1] );
	if ( args.length !== 2 ) {
		throw new Error(
			`assets/js/form-enhance.js now passes ${ args.length } arguments to confirmPanel(); the extractor expects title and body. The retired third argument was an \`inverse\` flag for a dark variant nothing rendered.`
		);
	}
	// The handler reads the address off the form's action, which the pattern
	// writes from hperkins_tokens_contact_email(). Unfiltered, that is the
	// address the form-action assertion below already pins.
	const constants = { mailtoAddress: CONTACT_EMAIL };
	const label = source.match( /again\.textContent = '((?:[^'\\]|\\.)*)';/ );
	if ( ! label ) {
		throw new Error(
			'assets/js/form-enhance.js no longer assigns the reset button label with `again.textContent = \'…\';`; update the extractor in verify-contact-form-styling.js alongside it.'
		);
	}
	return {
		title: resolveCopyExpression( args[0], constants ),
		body: resolveCopyExpression( args[1], constants ),
		againLabel: label[1].replace( /\\(['\\])/g, '$1' ),
	};
}

const CONTACT_CONFIRMATION = extractContactConfirmation(
	readFileSync( path.join( __dirname, '..', 'assets/js/form-enhance.js' ), 'utf8' )
);

// theme.json owns the two accepted Contact dimensions. Reading them here — and
// asserting the rendered page resolves to them — is what makes the CSS
// declarations token references rather than literals that happen to agree.
const THEME_JSON = JSON.parse(
	readFileSync( path.join( __dirname, '..', 'theme.json' ), 'utf8' )
);
const CONTACT_CONTAINER = THEME_JSON.settings.custom.container.contact;
const CONTACT_LEAD_MEASURE = THEME_JSON.settings.custom.measure.contactLead;

const PAGES_CSS = readFileSync(
	path.join( __dirname, '..', 'assets/imladris-pages.css' ),
	'utf8'
);

/**
 * The declarations the Contact composition is allowed to be written as.
 *
 * Each entry is a rule that must exist verbatim. A literal creeping back in
 * (`max-inline-size: 600px`) would still render correctly and still pass every
 * measurement below, so the source is pinned separately from the geometry.
 *
 * The .hp-contact-template scope on the column rule is load-bearing, not
 * tidiness: unscoped, `.hp-contact-panel` only TIES core's constrained-layout
 * rule and wins on print order, which production inverts. The replay check in
 * inspectContactPage() proves the same thing from the rendered page.
 */
const REQUIRED_PAGE_RULES = [
	{
		label: 'the shared contact column, scoped so it outranks core on specificity',
		snippet: '.hp-contact-template .hp-page-hero,\n.hp-contact-template .hp-contact-panel {\n  max-inline-size: var(--wp--custom--container--contact);',
	},
	{
		label: 'the contact-only lead measure',
		snippet: '.hp-contact-template .hp-page-hero__lead {\n  max-width: var(--wp--custom--measure--contact-lead);',
	},
];

const FORBIDDEN_PAGE_LITERALS = [
	{ pattern: /max-inline-size:\s*600px/, name: 'max-inline-size: 600px' },
	{ pattern: /max-width:\s*54ch/, name: 'max-width: 54ch' },
];

// "One icon family with the footer" is a provenance claim: the GitHub and
// LinkedIn marks are meant to be the footer's own Lucide paths, not lookalikes.
// Stroke width and fill cannot tell those apart, so compare the geometry.
const FOOTER_PART = readFileSync(
	path.join( __dirname, '..', 'parts/footer.html' ),
	'utf8'
);
const CONTACT_PATTERN = readFileSync(
	path.join( __dirname, '..', 'patterns/contact.php' ),
	'utf8'
);

function extractGlyph( source, hrefFragment, file ) {
	const anchor = source.split( '<a ' ).find( ( chunk ) => chunk.includes( hrefFragment ) );
	if ( ! anchor ) {
		throw new Error( `${ file } no longer links ${ hrefFragment }; update verify-contact-form-styling.js alongside it.` );
	}
	const svg = anchor.match( /<svg[\s\S]*?<\/svg>/ );
	if ( ! svg ) {
		throw new Error( `the ${ hrefFragment } link in ${ file } carries no <svg>.` );
	}
	// Only the drawn geometry, in order — attribute order and sizing are the
	// stylesheet's business, not the family's.
	return ( svg[0].match( /<(?:path|rect|circle|polyline|line)\b[^>]*>/g ) || [] )
		.map( ( shape ) => shape.replace( /\s+/g, ' ' ) )
		.join( '' );
}

const SHARED_GLYPHS = [
	{ label: 'GitHub', hrefFragment: 'github.com' },
	{ label: 'LinkedIn', hrefFragment: 'linkedin.com' },
].map( ( glyph ) => ( {
	...glyph,
	footer: extractGlyph( FOOTER_PART, glyph.hrefFragment, 'parts/footer.html' ),
	contact: extractGlyph( CONTACT_PATTERN, glyph.hrefFragment, 'patterns/contact.php' ),
} ) );

const VIEWPORT = { width: 390, height: 1400, deviceScaleFactor: 1, mobile: false };
// The form column and the hero measures are narrower than the page spine, so
// they only bind on a viewport wider than they are: at 390px the panel would
// satisfy "600px wide, centred" by simply running out of room.
const DESKTOP_VIEWPORT = { width: 1280, height: 1400, deviceScaleFactor: 1, mobile: false };

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
	// Load wide, measure the page composition, then shrink to the mobile
	// viewport the input/focus contract has always been checked at. One page
	// load carries both: a second navigation is the slowest thing this script
	// can do, and the computed styles below depend on the viewport in force
	// when they are read, not the one the document happened to load at.
	await cdp.send( 'Emulation.setDeviceMetricsOverride', DESKTOP_VIEWPORT, sessionId );

	const loaded = cdp.once( 'Page.loadEventFired', sessionId );
	await cdp.send( 'Page.navigate', { url: new URL( '/contact/', ORIGIN ).href }, sessionId );
	await loaded;
	await cdp.send( 'Runtime.evaluate', { expression: 'document.fonts && document.fonts.ready', awaitPromise: true }, sessionId );
	await wait( 250 );

	const layoutExpression = `(() => {
		// ch is a font metric, so the expectation has to be measured in the same
		// font the rule applies to rather than hardcoded as pixels: the probe
		// inherits the element's own type, and an absolute box keeps flow
		// margins out of the measurement.
		const chUnit = (el) => {
			const probe = document.createElement('div');
			probe.style.position = 'absolute';
			probe.style.visibility = 'hidden';
			probe.style.inlineSize = '100ch';
			el.appendChild(probe);
			const unit = probe.getBoundingClientRect().width / 100;
			probe.remove();
			return unit;
		};
		const main = document.querySelector('main.hp-contact-template');
		const panel = document.querySelector('.hp-contact-panel');
		const hero = document.querySelector('.hp-page-hero');
		const lead = document.querySelector('.hp-page-hero__lead');
		if (!main || !panel || !hero || !lead) {
			throw new Error('contact layout probe could not find main.hp-contact-template, .hp-contact-panel, .hp-page-hero and .hp-page-hero__lead');
		}
		const mainStyle = getComputedStyle(main);
		const mainRect = main.getBoundingClientRect();
		const contentLeft = mainRect.left + parseFloat(mainStyle.paddingLeft);
		const contentRight = mainRect.right - parseFloat(mainStyle.paddingRight);
		const panelRect = panel.getBoundingClientRect();
		const heroRect = hero.getBoundingClientRect();
		const rootStyle = getComputedStyle(document.documentElement);
		const measured = {
			contentWidth: contentRight - contentLeft,
			containerToken: rootStyle.getPropertyValue('--wp--custom--container--contact').trim(),
			leadMeasureToken: rootStyle.getPropertyValue('--wp--custom--measure--contact-lead').trim(),
			panelMaxInlineSize: parseFloat(getComputedStyle(panel).maxInlineSize),
			panelWidth: panelRect.width,
			panelLeft: panelRect.left,
			panelLeftGap: panelRect.left - contentLeft,
			panelRightGap: contentRight - panelRect.right,
			heroMaxInlineSize: parseFloat(getComputedStyle(hero).maxInlineSize),
			heroWidth: heroRect.width,
			heroLeft: heroRect.left,
			leadMaxInlineSize: parseFloat(getComputedStyle(lead).maxInlineSize),
			leadCh: chUnit(lead),
		};

		// Production order, replayed. Page Optimize concatenates the file-based
		// sheets and hoists them above WordPress's inline styles, so anything the
		// theme wins only by printing later loses there. Re-emit core's own
		// constrained-layout declaration for this main, last, and re-measure: a
		// rule that beats core on specificity is unmoved, one that merely tied it
		// snaps back to the 44rem spine. verify-header.js replays Assembler's
		// focus-ring declaration for exactly the same reason.
		const container = Array.from(main.classList)
			.find((name) => name.startsWith('wp-container-core-group-is-layout-'));
		if (!container) {
			throw new Error('main.hp-contact-template carries no wp-container-core-group-is-layout-* class; the constrained-layout replay cannot be built.');
		}
		// Re-emit core's OWN rule text rather than a reconstruction of it: the
		// block sets contentSize on itself, so the width in that declaration is
		// not necessarily the global one, and a hand-built copy could replay a
		// rule production never serves.
		const coreRules = [];
		for (const sheet of Array.from(document.styleSheets)) {
			let rules;
			try { rules = Array.from(sheet.cssRules || []); } catch (e) { continue; }
			for (const rule of rules) {
				if (rule.selectorText && rule.selectorText.indexOf('.' + container + ' >') === 0) {
					coreRules.push(rule.cssText);
				}
			}
		}
		if (!coreRules.length) {
			throw new Error('could not find the constrained-layout rule core emits for .' + container + '; the production-order replay would silently pass.');
		}
		const replay = document.createElement('style');
		replay.textContent = coreRules.join('\\n');
		document.head.appendChild(replay);
		measured.replayed = {
			panelWidth: panel.getBoundingClientRect().width,
			heroWidth: hero.getBoundingClientRect().width,
		};
		replay.remove();

		return measured;
	})()`;

	const layoutEvaluated = await cdp.send( 'Runtime.evaluate', {
		expression: layoutExpression,
		awaitPromise: true,
		returnByValue: true,
	}, sessionId );
	if ( layoutEvaluated.exceptionDetails ) {
		throw new Error( `contact layout evaluation failed: ${ layoutEvaluated.exceptionDetails.exception?.description || layoutEvaluated.exceptionDetails.text }` );
	}

	await cdp.send( 'Emulation.setDeviceMetricsOverride', VIEWPORT, sessionId );
	await wait( 150 );

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
		const rawToken = (name) => rootStyle.getPropertyValue(name).trim();
		// font-size tokens are hand-authored clamp()s, so the only honest
		// expectation is what the browser resolves them to at this viewport.
		const sizeToken = (value) => {
			const probe = document.createElement('span');
			probe.style.fontSize = value;
			document.body.appendChild(probe);
			const resolved = getComputedStyle(probe).fontSize;
			probe.remove();
			return resolved;
		};
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
					ruleGold: colorToken('--wp--custom--rule--gold'),
					borderBrand: colorToken('--wp--custom--border--brand'),
					link: colorToken('--wp--custom--text--link'),
					pill: rawToken('--hp-radius-pill'),
					h3: sizeToken('var(--wp--preset--font-size--2-xl)'),
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
				const svg = link.querySelector('svg');
				const svgStyle = svg ? getComputedStyle(svg) : null;
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
					borderRadius: s.borderRadius,
					svgFill: svgStyle ? svgStyle.fill : '',
					svgStroke: svgStyle ? svgStyle.stroke : '',
					svgStrokeWidth: svgStyle ? parseFloat(svgStyle.strokeWidth) : null,
					// A filled silhouette hides inside an outline rule unless the
					// shapes are checked too: only the geometry decides. Walk the
					// whole subtree, not svg.children — the footer's own star mark
					// nests a filled circle inside a <g>, and a direct-child scan
					// would wave that shape straight through.
					filledShapes: svg
						? Array.from(svg.querySelectorAll('*')).filter((node) => {
							const fill = getComputedStyle(node).fill;
							return fill !== 'none' && fill !== 'rgba(0, 0, 0, 0)';
						}).length
						: 0,
				};
			});
			result.contactAside = {
				hasWhatToInclude: !! document.querySelector('.hp-contact-aside .hp-callout'),
				hasOfficeHours: !! document.querySelector('.hp-contact-aside .hp-officehours'),
			};
			// Last, because it replaces the form: a real valid submit is the only
			// way to measure the confirmation the shipped code actually builds
			// (a hand-injected stand-in would drift from confirmPanel()). It is
			// safe headless — handleContactSubmit assigns window.location.href a
			// mailto: URL, which Chrome has no protocol handler for and drops,
			// and the panel is built synchronously right after that assignment,
			// so these reads run in the same task regardless.
			emailInput.value = 'someone@example.com';
			form.querySelector('button[type="submit"]').click();
			const confirmPanel = document.querySelector('.hp-form-confirm');
			if (!confirmPanel) { throw new Error('a valid contact submit did not swap the form for .hp-form-confirm'); }
			const confirmStyle = getComputedStyle(confirmPanel);
			const mark = confirmPanel.querySelector('.hp-form-confirm__mark');
			const markSvg = mark && mark.querySelector('svg');
			const title = confirmPanel.querySelector('.hp-form-confirm__title');
			const body = confirmPanel.querySelector('.hp-form-confirm__body');
			const again = confirmPanel.querySelector('.hp-form-confirm__again');
			const againStyle = again && getComputedStyle(again);
			result.confirm = {
				// The retired --inverse modifier would show up here, as would any
				// other stray state class.
				classes: Array.from(confirmPanel.classList).sort().join(' '),
				// form-enhance.js focuses the panel, so this is the state a
				// keyboard visitor actually sees.
				hasFocus: document.activeElement === confirmPanel,
				focusVisible: confirmPanel.matches(':focus-visible'),
				outlineStyle: confirmStyle.outlineStyle,
				outlineWidth: confirmStyle.outlineWidth,
				outlineColor: confirmStyle.outlineColor,
				outlineOffset: confirmStyle.outlineOffset,
				borderTopColor: confirmStyle.borderTopColor,
				borderRightColor: confirmStyle.borderRightColor,
				borderBottomColor: confirmStyle.borderBottomColor,
				borderLeftColor: confirmStyle.borderLeftColor,
				borderTopWidth: confirmStyle.borderTopWidth,
				borderLeftWidth: confirmStyle.borderLeftWidth,
				title: title ? title.textContent.trim() : '',
				titleFontSize: title ? getComputedStyle(title).fontSize : '',
				body: body ? body.textContent.trim() : '',
				markWidth: mark ? Math.round(mark.getBoundingClientRect().width) : 0,
				markHeight: mark ? Math.round(mark.getBoundingClientRect().height) : 0,
				markSvgWidth: markSvg ? Math.round(markSvg.getBoundingClientRect().width) : 0,
				againLabel: again ? again.textContent.trim() : '',
				againHeight: again ? Math.round(again.getBoundingClientRect().height) : 0,
				againBoxShadow: againStyle ? againStyle.boxShadow : '',
				againColor: againStyle ? againStyle.color : '',
				againBorderTopWidth: againStyle ? againStyle.borderTopWidth : '',
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
	return { ...evaluated.result.value, layout: layoutEvaluated.result.value };
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
			statusTabIndex: statusNode() ? statusNode().getAttribute('tabindex') || '' : '',
			statusFocused: !! ( statusNode() && document.activeElement === statusNode() ),
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
	const wrongRadius = result.channels.filter( ( item ) => item.borderRadius !== result.tokens.pill );
	failUnless(
		wrongRadius.length === 0,
		failures,
		`direct channels ${ wrongRadius.map( ( item ) => `"${ item.label }" (${ item.borderRadius })` ).join( ', ' ) } do not use the pill radius ${ result.tokens.pill }; the system reads profile affordances as pills, like .hp-footer__social.`
	);
	const notOutlined = result.channels.filter(
		( item ) =>
			item.svgFill !== 'none' ||
			item.svgStroke === 'none' ||
			item.svgStrokeWidth !== 2 ||
			item.filledShapes > 0
	);
	failUnless(
		notOutlined.length === 0,
		failures,
		`direct channel glyphs ${ notOutlined.map( ( item ) => `"${ item.label }" (fill ${ item.svgFill }, stroke ${ item.svgStroke } at ${ item.svgStrokeWidth }, ${ item.filledShapes } filled shapes)` ).join( ', ' ) } are not outline marks; they must match the .hp-footer__social icon family.`
	);
	// Stroke geometry proves the marks are drawn as outlines; only this proves
	// they are the FOOTER'S outlines, which is what "one icon family" claims.
	const divergedGlyphs = SHARED_GLYPHS.filter( ( glyph ) => glyph.contact !== glyph.footer );
	failUnless(
		divergedGlyphs.length === 0,
		failures,
		divergedGlyphs
			.map(
				( glyph ) =>
					`the ${ glyph.label } mark in patterns/contact.php has drifted from parts/footer.html.\n    footer:  ${ glyph.footer }\n    contact: ${ glyph.contact }`
			)
			.join( '\n  ' )
	);

	const confirm = result.confirm;
	failUnless(
		confirm.classes === 'hp-form-confirm',
		failures,
		`the contact confirmation rendered as "${ confirm.classes }"; it takes the base class alone. The --inverse modifier was retired in 0.3.60 because nothing rendered it, so a state class reappearing here means a variant came back without its CSS.`
	);
	const confirmBorders = [
		confirm.borderTopColor,
		confirm.borderRightColor,
		confirm.borderBottomColor,
		confirm.borderLeftColor,
	];
	failUnless(
		confirmBorders.every( ( value ) => value === result.tokens.ruleGold ),
		failures,
		`confirmation card borders are ${ confirmBorders.join( ' / ' ) }, expected the rule--gold token ${ result.tokens.ruleGold } on all four sides.`
	);
	failUnless(
		confirm.borderTopWidth === '1px' && confirm.borderLeftWidth === '1px',
		failures,
		`confirmation card draws a ${ confirm.borderLeftWidth } left rule against a ${ confirm.borderTopWidth } top border; the template card is an even 1px ring, not a left-ruled plate.`
	);
	// form-enhance.js focuses the panel, so the ring is not hypothetical: without
	// a themed rule for [tabindex="-1"] containers, Chrome draws its own black
	// `outline: auto` at zero offset, directly over the gold ring above.
	failUnless(
		confirm.hasFocus && confirm.focusVisible,
		failures,
		`the confirmation panel did not take visible focus (focused: ${ confirm.hasFocus }, :focus-visible: ${ confirm.focusVisible }); the focus-ring assertion below would pass on a panel nobody can see.`
	);
	failUnless(
		confirm.outlineStyle === 'solid' &&
			confirm.outlineWidth === '3px' &&
			confirm.outlineColor === result.tokens.focus &&
			confirm.outlineOffset === '2px',
		failures,
		`the focused confirmation panel draws outline ${ confirm.outlineStyle } ${ confirm.outlineWidth } ${ confirm.outlineColor } at ${ confirm.outlineOffset }; expected the site's 3px solid ${ result.tokens.focus } ring at 2px offset. A UA "auto" outline here means the panel is not covered by a themed focus rule.`
	);
	failUnless(
		confirm.markWidth === 44 && confirm.markHeight === 44,
		failures,
		`confirmation mark is ${ confirm.markWidth }x${ confirm.markHeight }, expected the 44x44 medallion.`
	);
	failUnless(
		confirm.markSvgWidth === 22,
		failures,
		`the check glyph inside the confirmation medallion renders ${ confirm.markSvgWidth }px wide, expected 22px in the 44px mark.`
	);
	// Every copy expectation below comes from form-enhance.js. Nothing here
	// repeats the wording, so a deliberate copy edit needs one edit, not two —
	// and a panel that silently stops rendering what the code builds still fails.
	failUnless(
		confirm.title === CONTACT_CONFIRMATION.title,
		failures,
		`confirmation title renders "${ confirm.title }" but form-enhance.js builds "${ CONTACT_CONFIRMATION.title }".`
	);
	failUnless(
		confirm.titleFontSize === result.tokens.h3,
		failures,
		`confirmation title is set at ${ confirm.titleFontSize }, expected the display h3 step ${ result.tokens.h3 } that .hp-subscribe__title also uses.`
	);
	failUnless(
		confirm.body === CONTACT_CONFIRMATION.body,
		failures,
		`confirmation body renders "${ confirm.body }" but form-enhance.js builds "${ CONTACT_CONFIRMATION.body }".`
	);
	failUnless(
		confirm.body.includes( CONTACT_EMAIL ),
		failures,
		`confirmation body does not name ${ CONTACT_EMAIL }; the visitor has just lost the form that carried the address.`
	);
	// Not a wording check: the label has to be the one the code sets, and the
	// control has to be reachable at the touch floor.
	failUnless(
		confirm.againLabel === CONTACT_CONFIRMATION.againLabel && confirm.againHeight >= 44,
		failures,
		`the reset control renders "${ confirm.againLabel }" at ${ confirm.againHeight }px tall; form-enhance.js builds "${ CONTACT_CONFIRMATION.againLabel }" and the secondary button owes the 44px touch height.`
	);
	failUnless(
		confirm.againBoxShadow === `${ result.tokens.borderBrand } 0px 0px 0px 1px inset` &&
			confirm.againBorderTopWidth === '0px' &&
			confirm.againColor === result.tokens.link,
		failures,
		`"${ confirm.againLabel }" is box-shadow "${ confirm.againBoxShadow }" / border ${ confirm.againBorderTopWidth } / color ${ confirm.againColor }; expected the secondary button's 1px inset ${ result.tokens.borderBrand } ring, no border, and the ${ result.tokens.link } link colour.`
	);

	// ---- Page composition --------------------------------------------------
	const layout = result.layout;
	// theme.json is the normative owner of both dimensions; the source contract
	// keeps the declarations pointing at it, and the geometry below proves the
	// page resolves to the same numbers.
	failUnless(
		CONTACT_CONTAINER === '600px' && CONTACT_LEAD_MEASURE === '54ch',
		failures,
		`theme.json declares container.contact = ${ CONTACT_CONTAINER } and measure.contactLead = ${ CONTACT_LEAD_MEASURE }; the accepted Contact composition is a 600px column and a 54ch lead.`
	);
	failUnless(
		layout.containerToken === CONTACT_CONTAINER && layout.leadMeasureToken === CONTACT_LEAD_MEASURE,
		failures,
		`/contact/ serves --wp--custom--container--contact: "${ layout.containerToken }" and --wp--custom--measure--contact-lead: "${ layout.leadMeasureToken }", but theme.json declares "${ CONTACT_CONTAINER }" and "${ CONTACT_LEAD_MEASURE }". Flush the site's theme.json cache, or the page is running on stale tokens.`
	);
	for ( const rule of REQUIRED_PAGE_RULES ) {
		failUnless(
			PAGES_CSS.includes( rule.snippet ),
			failures,
			`assets/imladris-pages.css no longer declares ${ rule.label } as written; expected to find:\n    ${ rule.snippet.replace( /\n/g, '\n    ' ) }`
		);
	}
	for ( const literal of FORBIDDEN_PAGE_LITERALS ) {
		failUnless(
			! literal.pattern.test( PAGES_CSS ),
			failures,
			`assets/imladris-pages.css contains a literal "${ literal.name }". Both Contact dimensions are theme.json tokens; a literal renders identically and would pass every measurement in this file.`
		);
	}

	const containerWidth = Number.parseFloat( CONTACT_CONTAINER );
	failUnless(
		layout.contentWidth > containerWidth,
		failures,
		`the layout pass ran at a ${ Math.round( layout.contentWidth ) }px content measure; it must be wider than the ${ containerWidth }px form column or "centred" means nothing.`
	);
	failUnless(
		Math.abs( layout.panelMaxInlineSize - containerWidth ) < 0.5,
		failures,
		`.hp-contact-panel resolves to a ${ layout.panelMaxInlineSize }px measure, expected the ${ containerWidth }px contact container.`
	);
	failUnless(
		Math.abs( layout.panelWidth - containerWidth ) < 0.5 && Math.abs( layout.panelLeftGap - layout.panelRightGap ) <= 1,
		failures,
		`.hp-contact-panel renders ${ Math.round( layout.panelWidth ) }px wide with ${ Math.round( layout.panelLeftGap ) }px / ${ Math.round( layout.panelRightGap ) }px side gaps, expected a ${ containerWidth }px column centred in main.hp-contact-template.`
	);
	failUnless(
		Math.abs( layout.heroMaxInlineSize - containerWidth ) < 0.5 && Math.abs( layout.heroWidth - containerWidth ) < 0.5,
		failures,
		`.hp-page-hero resolves to a ${ layout.heroMaxInlineSize }px measure and renders ${ Math.round( layout.heroWidth ) }px wide, expected the same ${ containerWidth }px column as the message panel.`
	);
	// The one contract behind the shared column: core forces margin auto on
	// every direct child of this main, so two blocks align only by matching
	// width. A hero measure that drifts off the container steps the page inward.
	failUnless(
		Math.abs( layout.heroLeft - layout.panelLeft ) <= 0.5,
		failures,
		`.hp-page-hero starts at ${ Math.round( layout.heroLeft * 10 ) / 10 }px and .hp-contact-panel at ${ Math.round( layout.panelLeft * 10 ) / 10 }px; the hero and the message column must hang on one left edge.`
	);
	// The check a local run would otherwise never make. See the replay note in
	// inspectContactPage(): production hoists the file-based sheets above the
	// inline block-supports styles, so a rule that only ties core loses there.
	failUnless(
		Math.abs( layout.replayed.panelWidth - containerWidth ) < 0.5 &&
			Math.abs( layout.replayed.heroWidth - containerWidth ) < 0.5,
		failures,
		`with core's constrained-layout rule replayed last, .hp-contact-panel renders ${ Math.round( layout.replayed.panelWidth ) }px and .hp-page-hero ${ Math.round( layout.replayed.heroWidth ) }px, expected both to hold the ${ containerWidth }px container. A selector that only ties core wins locally on print order and loses under production's Page Optimize concatenation — scope it to .hp-contact-template so specificity decides.`
	);
	failUnless(
		Math.abs( layout.leadMaxInlineSize - Number.parseFloat( CONTACT_LEAD_MEASURE ) * layout.leadCh ) < 1,
		failures,
		`.hp-contact-template .hp-page-hero__lead resolves to ${ layout.leadMaxInlineSize }px against a ${ layout.leadCh }px ch, expected ${ CONTACT_LEAD_MEASURE } (${ Number.parseFloat( CONTACT_LEAD_MEASURE ) * layout.leadCh }px) rather than the shared 46ch narrow measure. \`ch\` resolves against the lead's own type, so this measure has to stay on the lead, not the hero box.`
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
	// The status is in the markup at first paint, so a live region announces
	// nothing: focus is what carries the answer to the visitor's own submission.
	failUnless(
		result.subscribeStatus.before.statusTabIndex === '-1' &&
			result.subscribeStatus.before.statusFocused,
		failures,
		`success subscribe status has tabindex="${ result.subscribeStatus.before.statusTabIndex }" and focused=${ result.subscribeStatus.before.statusFocused }; the redirected-to status must take focus.`
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
			result.subscribeInvalidStatus.before.statusAriaLive === '' &&
			result.subscribeInvalidStatus.before.statusTabIndex === '-1' &&
			result.subscribeInvalidStatus.before.statusFocused,
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
		console.log( 'checked contact form input, focus, invalid, confirmation, channel, and page-measure states (incl. production stylesheet order)' );
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
