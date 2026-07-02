/**
 * Imladris — progressive enhancement for the contact + subscribe forms.
 *
 * No-JS fallback: the contact form still submits to `mailto:` while the
 * newsletter form posts to WordPress over HTTPS. JS adds inline email
 * validation to both forms; the contact form still swaps to a confirmation
 * state before handing off to the visitor's mail client.
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
	var MAILTO   = 'htperkins@gmail.com';
	var CONTACT_EMAIL_ERROR = 'Enter a valid email so I can reply.';
	var SUBSCRIBE_EMAIL_ERROR = 'Enter a valid email to join the dispatch.';

	function fieldWrap( input ) {
		return input.closest( '.hp-input' ) || input.parentElement;
	}

	function setError( input, message ) {
		var wrap = fieldWrap( input );
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
			helper.setAttribute( 'role', 'alert' );
			helper.textContent = message;
			input.setAttribute( 'aria-describedby', helper.id );
		}
		input.setAttribute( 'aria-invalid', 'true' );
		input.focus();
	}

	function clearError( input ) {
		var wrap = fieldWrap( input );
		if ( wrap ) {
			wrap.classList.remove( 'has-error' );
			var helper = wrap.querySelector( '.hp-input__helper[data-hp-error]' );
			if ( helper ) {
				helper.remove();
			}
		}
		input.removeAttribute( 'aria-invalid' );
		input.removeAttribute( 'aria-describedby' );
	}

	function confirmPanel( title, body, inverse ) {
		var panel = document.createElement( 'div' );
		panel.className = 'hp-form-confirm' + ( inverse ? ' hp-form-confirm--inverse' : '' );
		panel.setAttribute( 'role', 'status' );
		panel.setAttribute( 'aria-live', 'polite' );

		var mark = document.createElement( 'span' );
		mark.className = 'hp-form-confirm__mark';
		mark.setAttribute( 'aria-hidden', 'true' );
		mark.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="M20 6 9 17l-5-5"/></svg>';
		panel.appendChild( mark );

		var heading = document.createElement( 'p' );
		heading.className = 'hp-form-confirm__title';
		heading.textContent = title;
		panel.appendChild( heading );

		var copy = document.createElement( 'p' );
		copy.className = 'hp-form-confirm__body';
		copy.textContent = body;
		panel.appendChild( copy );

		return panel;
	}

	function go( href ) {
		// Open the visitor's mail client without leaving the page in a broken state.
		window.location.href = href;
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
	document.addEventListener( 'invalid', function ( e ) {
		var context = emailFieldContext( e.target );
		if ( ! context ) {
			return;
		}
		e.preventDefault();
		setError( e.target, context === 'contact' ? CONTACT_EMAIL_ERROR : SUBSCRIBE_EMAIL_ERROR );
	}, true );

	document.addEventListener( 'input', function ( e ) {
		if ( emailFieldContext( e.target ) ) {
			clearError( e.target );
		}
	} );

	// ---- Contact form ---------------------------------------------------------
	function handleContactSubmit( e, contact ) {
		var email = contact.querySelector( 'input[type="email"]' );
		if ( email ) {
			clearError( email );
		}
		if ( email && ! EMAIL_RE.test( email.value.trim() ) ) {
			e.preventDefault();
			setError( email, CONTACT_EMAIL_ERROR );
			return;
		}
		e.preventDefault();

		var get = function ( n ) {
			var el = contact.querySelector( '[name="' + n + '"]' );
			return el ? el.value.trim() : '';
		};
		var subject = get( 'subject' ) || 'Hello from hperkins.blog';
		var body    = get( 'message' );
		if ( get( 'name' ) ) {
			body += '\n\n— ' + get( 'name' );
		}
		go( 'mailto:' + MAILTO + '?subject=' + encodeURIComponent( subject ) + '&body=' + encodeURIComponent( body ) );

		var panel = confirmPanel(
			'Your message is ready in your mail app.',
			'If nothing opened, email ' + MAILTO + ' directly — whichever you prefer.',
			false
		);
		var again = document.createElement( 'button' );
		again.type = 'button';
		again.className = 'hp-form-confirm__again';
		again.textContent = 'Compose another';
		again.addEventListener( 'click', function () {
			panel.replaceWith( contact );
			contact.reset();
			var em = contact.querySelector( 'input[type="email"]' );
			if ( em ) {
				clearError( em );
			}
			var first = contact.querySelector( 'input, textarea, select' );
			if ( first ) {
				first.focus();
			}
		} );
		panel.appendChild( again );
		contact.replaceWith( panel );
		panel.setAttribute( 'tabindex', '-1' );
		panel.focus();
	}

	// ---- Subscribe ------------------------------------------------------------
	function handleSubscribeSubmit( e, form ) {
		var email = form.querySelector( 'input[type="email"]' );
		if ( email ) {
			clearError( email );
		}
		if ( email && ! EMAIL_RE.test( email.value.trim() ) ) {
			e.preventDefault();
			setError( email, SUBSCRIBE_EMAIL_ERROR );
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
} )();
