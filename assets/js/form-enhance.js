/**
 * Imladris — progressive enhancement for the contact + subscribe forms.
 *
 * No-JS fallback: the contact form still submits to `mailto:` while the
 * newsletter form posts to WordPress over HTTPS. JS adds inline email
 * validation to both forms; the contact form swaps to a confirmation card,
 * then hands the composed draft to the visitor's mail client, and the card
 * keeps that draft within reach (open it again, or copy it) for the case where
 * no mail handler answers. The status the newsletter endpoint redirects back
 * with takes focus so it is announced.
 *
 * Every listener is delegated at the document level. This site runs the
 * full-page Interactivity Router: client navigations swap the entire <body>
 * without re-running scripts, so handlers bound to the form elements found at
 * initial load die on the first client-side navigation. Delegation keys off
 * the event target instead, covering whichever form is in the DOM right now.
 * `invalid` does not bubble, so that listener rides the capture phase.
 */
( function () {
	'use strict';

	var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	// Last resort only. The live address is read off the form's own action
	// attribute, which patterns/contact.php writes from the filterable
	// hperkins_tokens_contact_email(); a literal here would go stale the moment
	// a site filtered the address, leaving the markup right and the handoff wrong.
	var MAILTO_FALLBACK = 'htperkins@gmail.com';
	var CONTACT_EMAIL_ERROR = 'Enter a valid email so I can reply.';
	var SUBSCRIBE_EMAIL_ERROR = 'Enter a valid email to join the dispatch.';
	var DEFAULT_SUBJECT = 'Hello from hperkins.blog';
	// The copy control's state is a word, not a colour: the label says what
	// happened, and the status region says it again for a screen reader.
	var COPY_LABELS = {
		idle: 'Copy the draft',
		copied: 'Draft copied',
		failed: 'Copy blocked'
	};
	var COPY_RESET_MS = 3200;
	var nextId = 0;
	// Between a pointer press and its release. See the focusout listener.
	var pointerDown = false;
	var afterRelease = [];

	function uniqueId( prefix ) {
		nextId += 1;
		return prefix + '-' + nextId;
	}

	function isEmail( value ) {
		return EMAIL_RE.test( ( value || '' ).trim() );
	}

	function fieldWrap( input ) {
		return input.closest( '.hp-input' ) || input.parentElement;
	}

	// The contact panel's one polite status region. patterns/contact.php puts it
	// beside the form rather than inside it, so it outlives the swap to the
	// confirmation card: it carries the email error while the form shows and
	// the copy result once the card does. The subscribe plate sits outside the
	// panel and has none.
	function contactStatus( node ) {
		var panel = node && node.closest ? node.closest( '.hp-contact-panel' ) : null;
		return panel ? panel.querySelector( '.hp-contact-status' ) : null;
	}

	function announce( node, message ) {
		var status = contactStatus( node );
		if ( status ) {
			status.textContent = message;
		}
	}

	// Merge, don't clobber: keep any describedby the field already carried
	// (e.g. a persistent hint) and add or remove only the one id.
	function describe( input, id, add ) {
		var ids = ( input.getAttribute( 'aria-describedby' ) || '' )
			.split( /\s+/ )
			.filter( function ( existing ) {
				return existing && existing !== id;
			} );
		if ( add ) {
			ids.push( id );
		}
		if ( ids.length ) {
			input.setAttribute( 'aria-describedby', ids.join( ' ' ) );
		} else {
			input.removeAttribute( 'aria-describedby' );
		}
	}

	function setError( input, message, moveFocus ) {
		var wrap = fieldWrap( input );
		var status = contactStatus( input );
		if ( wrap ) {
			wrap.classList.add( 'has-error' );
			var helper = wrap.querySelector( '.hp-input__helper[data-hp-error]' );
			if ( ! helper ) {
				helper = document.createElement( 'span' );
				helper.className = 'hp-input__helper';
				helper.setAttribute( 'data-hp-error', '1' );
				wrap.appendChild( helper );
			}
			if ( ! helper.id ) {
				helper.id = 'hp-error-' + ( input.id || input.name || 'field' );
			}
			helper.textContent = message;
			// One announcement, not two. Inside the contact panel the status
			// region speaks and describes the field; elsewhere the helper
			// announces itself and is the description.
			if ( status && status.id ) {
				helper.removeAttribute( 'role' );
				status.textContent = message;
				describe( input, status.id, true );
			} else {
				helper.setAttribute( 'role', 'alert' );
				describe( input, helper.id, true );
			}
		}
		input.setAttribute( 'aria-invalid', 'true' );
		if ( moveFocus ) {
			// Dormant while both forms live in <body>: if either is ever inlined
			// into the header, this focus move closes whichever panel is open —
			// header-controller.js shuts a panel as soon as focus lands outside it.
			// A field inside the open panel is safe; one elsewhere in the header
			// (the bar, or a second panel) closes it.
			input.focus();
		}
	}

	function clearError( input ) {
		var wrap = fieldWrap( input );
		var status = contactStatus( input );
		if ( wrap ) {
			wrap.classList.remove( 'has-error' );
			var helper = wrap.querySelector( '.hp-input__helper[data-hp-error]' );
			if ( helper ) {
				describe( input, helper.id, false );
				helper.remove();
			}
		}
		if ( status && status.id ) {
			describe( input, status.id, false );
			status.textContent = '';
		}
		input.removeAttribute( 'aria-invalid' );
	}

	// One caller, one appearance. There used to be an `inverse` flag for a dark
	// subscribe plate, but the subscribe form is a real POST whose status the
	// pattern renders server-side, so nothing ever passed it — and style.css
	// carried a modifier no DOM node could wear. Both are retired.
	function confirmPanel( title, body ) {
		var panel = document.createElement( 'div' );
		panel.className = 'hp-form-confirm';
		// A region named by its own title, not a live region: it takes focus
		// when it replaces the form, and the focus move is what announces it.
		// The body is its description, so the sentence saying nothing was sent
		// is read with it.
		panel.setAttribute( 'role', 'region' );
		panel.setAttribute( 'tabindex', '-1' );

		var mark = document.createElement( 'span' );
		mark.className = 'hp-form-confirm__mark';
		mark.setAttribute( 'aria-hidden', 'true' );
		// Lucide's check written from its left tip, so the stroke style.css
		// animates draws tip → vertex → tip.
		mark.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="M4 12l5 5L20 6"/></svg>';
		panel.appendChild( mark );

		var heading = document.createElement( 'h2' );
		heading.className = 'hp-form-confirm__title';
		heading.id = uniqueId( 'hp-form-confirm-title' );
		heading.textContent = title;
		panel.appendChild( heading );

		var copy = document.createElement( 'p' );
		copy.className = 'hp-form-confirm__body';
		copy.id = uniqueId( 'hp-form-confirm-body' );
		copy.textContent = body;
		panel.appendChild( copy );

		panel.setAttribute( 'aria-labelledby', heading.id );
		panel.setAttribute( 'aria-describedby', copy.id );
		return panel;
	}

	// "No mail app opened?  Open the draft ↗  ·  Copy the draft". The glyph and
	// the separator are drawn but hidden from assistive tech, and the spaces
	// between items are real text so the line reads (and copies) as a sentence;
	// the flex gap does the visual spacing.
	function recoveryLine( draft ) {
		var line = document.createElement( 'p' );
		line.className = 'hp-form-confirm__recovery';
		var add = function ( node ) {
			if ( line.childNodes.length ) {
				line.appendChild( document.createTextNode( ' ' ) );
			}
			line.appendChild( node );
			return node;
		};

		var prompt = document.createElement( 'span' );
		prompt.textContent = 'No mail app opened?';
		add( prompt );

		var open = document.createElement( 'a' );
		open.className = 'hp-form-confirm__draft';
		open.href = draft.href;
		open.appendChild( document.createTextNode( 'Open the draft ' ) );
		var glyph = document.createElement( 'span' );
		glyph.setAttribute( 'aria-hidden', 'true' );
		glyph.textContent = '↗';
		open.appendChild( glyph );
		add( open );

		var separator = document.createElement( 'span' );
		separator.className = 'hp-form-confirm__separator';
		separator.setAttribute( 'aria-hidden', 'true' );
		separator.textContent = '·';
		add( separator );

		var copy = document.createElement( 'button' );
		copy.type = 'button';
		copy.className = 'hp-form-confirm__copy';
		copy.textContent = COPY_LABELS.idle;
		add( copy );

		return line;
	}

	// Copy the draft as plain text. The async clipboard needs a secure context
	// and the page's say-so; when it is missing or refuses, a transient
	// read-only textarea and execCommand('copy') try once more, and focus goes
	// back wherever it was.
	function copyDraft( draft, settle ) {
		var fallback = function () {
			var active = document.activeElement;
			var copied = false;
			var area = document.createElement( 'textarea' );
			area.value = draft.text;
			area.setAttribute( 'readonly', '' );
			area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
			document.body.appendChild( area );
			try {
				area.select();
				area.setSelectionRange( 0, area.value.length );
				copied = document.execCommand( 'copy' );
			} catch ( error ) {
				copied = false;
			} finally {
				area.remove();
			}
			if ( active && active.focus ) {
				active.focus();
			}
			settle( !! copied );
		};
		if ( navigator.clipboard && navigator.clipboard.writeText ) {
			navigator.clipboard.writeText( draft.text ).then( function () {
				settle( true );
			}, fallback );
		} else {
			fallback();
		}
	}

	function emailFieldContext( input ) {
		if ( ! input || ! input.matches || ! input.matches( 'input[type="email"]' ) || ! input.closest ) {
			return null;
		}
		if ( input.closest( '.hp-contact-form' ) ) {
			return 'contact';
		}
		if ( input.closest( '.hp-subscribe__form' ) ) {
			return 'subscribe';
		}
		return null;
	}

	// ---- Inline validation (both forms) --------------------------------------
	// `invalid` fires on the input and does not bubble; capture still sees it.
	// It fires for a submission attempt, so it may move focus to the field.
	document.addEventListener( 'invalid', function ( e ) {
		var context = emailFieldContext( e.target );
		if ( ! context ) {
			return;
		}
		e.preventDefault();
		setError( e.target, context === 'contact' ? CONTACT_EMAIL_ERROR : SUBSCRIBE_EMAIL_ERROR, true );
	}, true );

	// Late to accuse, early to forgive, on the contact form: a keystroke only
	// ever clears the email error, and only once the address is valid — one
	// still being corrected keeps it. The subscribe form, a single field beside
	// its own button, still clears on any keystroke.
	document.addEventListener( 'input', function ( e ) {
		var context = emailFieldContext( e.target );
		if ( ! context ) {
			return;
		}
		if ( 'subscribe' === context || isEmail( e.target.value ) ) {
			clearError( e.target );
		}
	} );

	function releasePointer() {
		pointerDown = false;
		var queued = afterRelease.splice( 0 );
		if ( queued.length ) {
			// After this release's click has been dispatched.
			window.setTimeout( function () {
				queued.forEach( function ( run ) {
					run();
				} );
			}, 0 );
		}
	}

	document.addEventListener( 'pointerdown', function () {
		pointerDown = true;
	}, true );
	document.addEventListener( 'pointerup', releasePointer, true );
	document.addEventListener( 'pointercancel', releasePointer, true );

	function accuseIfInvalid( input ) {
		var value = input.value.trim();
		if ( input.isConnected && value && ! isEmail( value ) ) {
			setError( input, CONTACT_EMAIL_ERROR, false );
		}
	}

	// The accusation proper: leaving a non-empty, invalid address shows the
	// error without pulling focus back to it. When a click caused the blur, it
	// waits for the click to land — the error line grows the row, and a button
	// that moves out from under a pressed pointer never receives its click.
	document.addEventListener( 'focusout', function ( e ) {
		var input = e.target;
		if ( 'contact' !== emailFieldContext( input ) ) {
			return;
		}
		if ( pointerDown ) {
			afterRelease.push( function () {
				accuseIfInvalid( input );
			} );
		} else {
			accuseIfInvalid( input );
		}
	} );

	// ---- Contact form ---------------------------------------------------------
	// PHP decides the address; this reads it back rather than repeating it.
	// Take only the address: a `mailto:` action may legitimately carry its own
	// query (`?subject=…`) or fragment, and appending our own `?subject=` after
	// one would build a malformed URL and print a bogus address in the card.
	// Anything that does not survive as a plausible address falls back rather
	// than shipping a broken handoff.
	function contactAddress( contact ) {
		var address = ( contact.getAttribute( 'action' ) || '' )
			.replace( /^mailto:/i, '' )
			.split( /[?#]/ )[0]
			.trim();
		return EMAIL_RE.test( address ) ? address : MAILTO_FALLBACK;
	}

	// The draft, composed once and written two ways: as the mailto the hand-off
	// opens (and the card's draft link keeps), and as plain text to copy.
	function composeDraft( contact ) {
		var get = function ( name ) {
			var field = contact.querySelector( '[name="' + name + '"]' );
			return field ? field.value.trim() : '';
		};
		var address = contactAddress( contact );
		var subject = get( 'subject' ) || DEFAULT_SUBJECT;
		var email = get( 'email' );
		var signature = [ get( 'name' ), email ? '<' + email + '>' : '' ].filter( Boolean ).join( ' ' );
		var body = [ get( 'message' ), signature ? '— ' + signature : '' ].filter( Boolean ).join( '\n\n' );
		// RFC 6068: line breaks in a mailto body travel as CRLF.
		var encode = function ( value ) {
			return encodeURIComponent( value.replace( /\r?\n/g, '\r\n' ) );
		};
		return {
			address: address,
			href: 'mailto:' + address + '?subject=' + encode( subject ) + ( body ? '&body=' + encode( body ) : '' ),
			text: 'To: ' + address + '\nSubject: ' + subject + ( body ? '\n\n' + body : '' )
		};
	}

	// Compose another means the same person is writing again: the name and a
	// valid email are kept, so the first field still owed is usually Subject.
	function firstOwedField( contact ) {
		var name = contact.querySelector( '[name="name"]' );
		var email = contact.querySelector( '[name="email"]' );
		if ( name && ! name.value.trim() ) {
			return name;
		}
		if ( email && ! isEmail( email.value ) ) {
			return email;
		}
		return contact.querySelector( '[name="subject"]' ) || name;
	}

	function handleContactSubmit( e, contact ) {
		e.preventDefault();
		var email = contact.querySelector( 'input[type="email"]' );
		if ( email && ! isEmail( email.value ) ) {
			setError( email, CONTACT_EMAIL_ERROR, true );
			return;
		}
		if ( email ) {
			clearError( email );
		}

		var draft = composeDraft( contact );
		var mailtoAddress = draft.address;
		// Says what this page did and did not do, and nothing more: the fields
		// never reach the site, so the confirmation is about the mail client.
		// No reply-time commitment — that would be a claim with nothing behind it.
		// What to do if no mail app opened is the recovery line's job.
		var panel = confirmPanel(
			'Message ready to send',
			'This composes a mail to ' + mailtoAddress + ' in your mail app; nothing was sent ' +
				'from this page.'
		);

		var copyTimer = 0;
		var recovery = recoveryLine( draft );
		var copyButton = recovery.querySelector( '.hp-form-confirm__copy' );
		copyButton.addEventListener( 'click', function () {
			copyDraft( draft, function ( copied ) {
				window.clearTimeout( copyTimer );
				copyButton.textContent = copied ? COPY_LABELS.copied : COPY_LABELS.failed;
				announce( panel, copied
					? 'Draft copied to the clipboard.'
					: 'The browser blocked the clipboard. Open the draft, or email ' + mailtoAddress + ' directly.' );
				copyTimer = window.setTimeout( function () {
					copyButton.textContent = COPY_LABELS.idle;
					announce( panel, '' );
				}, COPY_RESET_MS );
			} );
		} );
		panel.appendChild( recovery );

		var again = document.createElement( 'button' );
		again.type = 'button';
		again.className = 'hp-form-confirm__again';
		again.textContent = 'Compose another';
		again.addEventListener( 'click', function () {
			// The copy reset dies with the card, or it would later wipe whatever
			// the status region is saying by then.
			window.clearTimeout( copyTimer );
			announce( panel, '' );
			panel.replaceWith( contact );
			[ 'subject', 'message' ].forEach( function ( name ) {
				var field = contact.querySelector( '[name="' + name + '"]' );
				if ( field ) {
					field.value = '';
				}
			} );
			var owed = firstOwedField( contact );
			if ( owed ) {
				owed.focus();
			}
		} );
		panel.appendChild( again );

		contact.replaceWith( panel );
		panel.focus();

		// The hand-off the card reports, made only once the card is in place and
		// focused: with no mail handler the browser does nothing, and the card's
		// draft link and copy control are the way on.
		try {
			window.location.assign( draft.href );
		} catch ( error ) {
			// The card already covers it.
		}
	}

	// ---- Subscribe ------------------------------------------------------------
	function handleSubscribeSubmit( e, form ) {
		var email = form.querySelector( 'input[type="email"]' );
		if ( email ) {
			clearError( email );
		}
		if ( email && ! isEmail( email.value ) ) {
			e.preventDefault();
			setError( email, SUBSCRIBE_EMAIL_ERROR, true );
		}
		if ( email ) {
			email.value = email.value.trim();
		}
	}

	document.addEventListener( 'submit', function ( e ) {
		var form = e.target;
		if ( ! form || ! form.matches ) {
			return;
		}
		if ( form.matches( '.hp-contact-form' ) ) {
			handleContactSubmit( e, form );
		} else if ( form.matches( '.hp-subscribe__form' ) ) {
			handleSubscribeSubmit( e, form );
		}
	} );

	// ---- Subscribe result -----------------------------------------------------
	// The endpoint answers with a 303 to ?hperkins_subscribe=<status>#subscribe,
	// so the status paragraph is already in the markup at first paint. A live
	// region only announces what changes *after* it exists, and router-scroll.js
	// deliberately leaves initial-load hash targets alone rather than fight the
	// browser's own restoration — so the answer to the visitor's own submission
	// was neither announced nor reachable without hunting for it. Move focus to
	// it instead; the pattern gives it tabindex="-1" for exactly this. Scrolling
	// stays the browser's: it has already placed #subscribe.
	function focusSubscribeStatus() {
		var status = document.querySelector( '.hp-subscribe__status' );
		if ( ! status ) {
			return;
		}
		try {
			status.focus( { preventScroll: true } );
		} catch ( e ) {
			status.focus();
		}
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', focusSubscribeStatus );
	} else {
		focusSubscribeStatus();
	}
} )();
