/**
 * Imladris — progressive enhancement for the contact + subscribe forms.
 *
 * No-JS fallback: both forms submit to their `mailto:` action, so the control
 * still works with scripting off. With JS we add inline email validation and
 * swap to a confirmation state (the interaction the Imladris Design System's
 * Contact/Subscribe components show), then hand off to the visitor's mail
 * client — the confirmation only ever states what actually happened.
 */
( function () {
	'use strict';

	var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	var MAILTO   = 'henry@hperkins.blog';

	function fieldWrap( input ) {
		return input.closest( '.hp-input' ) || input.parentElement;
	}

	function setError( input, message ) {
		var wrap = fieldWrap( input );
		if ( wrap ) {
			wrap.classList.add( 'has-error' );
			var helper = wrap.querySelector( '.hp-input__helper' );
			if ( ! helper ) {
				helper = document.createElement( 'span' );
				helper.className = 'hp-input__helper';
				helper.setAttribute( 'data-hp-error', '1' );
				wrap.appendChild( helper );
			}
			helper.textContent = message;
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

	// ---- Contact form -------------------------------------------------------
	var contact = document.querySelector( '.hp-contact-form' );
	if ( contact ) {
		contact.addEventListener( 'submit', function ( e ) {
			var email = contact.querySelector( 'input[type="email"]' );
			if ( email ) {
				clearError( email );
			}
			if ( email && ! EMAIL_RE.test( email.value.trim() ) ) {
				e.preventDefault();
				setError( email, 'Enter a valid email so I can reply.' );
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
			} );
			panel.appendChild( again );
			contact.replaceWith( panel );
		} );
	}

	// ---- Subscribe ----------------------------------------------------------
	var subForm = document.querySelector( '.hp-subscribe__form' );
	if ( subForm ) {
		subForm.addEventListener( 'submit', function ( e ) {
			var email = subForm.querySelector( 'input[type="email"]' );
			if ( email && ! EMAIL_RE.test( email.value.trim() ) ) {
				e.preventDefault();
				email.setAttribute( 'aria-invalid', 'true' );
				email.focus();
				return;
			}
			e.preventDefault();
			var addr = email ? email.value.trim() : '';
			go(
				'mailto:' + MAILTO +
				'?subject=' + encodeURIComponent( 'Subscribe to the dispatch' ) +
				'&body=' + encodeURIComponent( 'Please add ' + addr + ' to the fortnightly dispatch.' )
			);
			var panel = confirmPanel(
				'Almost there — confirm in your mail app.',
				'I just opened a short note to send. Reply to confirm and you are on the list for the fortnightly dispatch.',
				true
			);
			subForm.replaceWith( panel );
		} );
	}
} )();
