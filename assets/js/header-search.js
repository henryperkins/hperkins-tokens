/**
 * hperkins-tokens — Council masthead search: close the inline expanding field.
 *
 * The desktop header search is a core/search block in "button only" mode: core's
 * own view script expands the field (and focuses it) when the icon is clicked,
 * and that click toggle is the complete no-JS-needed affordance. This script only
 * ADDS the two niceties core leaves out — collapse on Escape and on an outside
 * click — by re-hiding the field the same way core's collapsed state does
 * (the `wp-block-search__searchfield-hidden` class), so we never accidentally
 * submit the form (which a synthetic button click in the open state would).
 *
 * Scoped to the header so the in-overlay nav search (button-inside) is untouched.
 * Degrades cleanly: with JS off, the icon still opens/closes the field on click.
 */
( function () {
	'use strict';

	var ROOT = '.hp-site-header .hp-site-search';
	var BTN = '.wp-block-search__button';
	var EXPANDABLE = 'wp-block-search__button-only';
	var HIDDEN = 'wp-block-search__searchfield-hidden';

	function openSearches() {
		var open = [];
		var nodes = document.querySelectorAll( ROOT );
		for ( var i = 0; i < nodes.length; i++ ) {
			var s = nodes[ i ];
			if (
				s.classList.contains( EXPANDABLE ) &&
				! s.classList.contains( HIDDEN )
			) {
				open.push( s );
			}
		}
		return open;
	}

	// Mirror core's collapsed state instead of clicking the toggle: an open-state
	// click submits the search, which is not what "dismiss" should do.
	function collapse( s, restoreFocus ) {
		s.classList.add( HIDDEN );
		var btn = s.querySelector( BTN );
		if ( btn ) {
			btn.setAttribute( 'aria-expanded', 'false' );
			if ( restoreFocus ) {
				btn.focus();
			}
		}
	}

	document.addEventListener( 'keydown', function ( event ) {
		if ( event.key !== 'Escape' && event.key !== 'Esc' ) {
			return;
		}
		var open = openSearches();
		for ( var i = 0; i < open.length; i++ ) {
			collapse( open[ i ], true );
		}
	} );

	document.addEventListener(
		'click',
		function ( event ) {
			var open = openSearches();
			if ( ! open.length ) {
				return;
			}
			for ( var i = 0; i < open.length; i++ ) {
				if ( ! open[ i ].contains( event.target ) ) {
					collapse( open[ i ], false );
				}
			}
		},
		// Capture so we see the click before any internal handler stops it.
		true
	);

	// Council masthead: the search row and the nav drawer never share the bar —
	// opening one closes the other, driven through core's own controls.

	// Search-icon tap while the drawer is open → ONLY dismiss the drawer. Handle
	// it in the CAPTURE phase and stop propagation so core's "open search" never
	// runs for this tap; otherwise the field opens, takes focus, then collapses
	// when the drawer-close steals focus — leaving a focused-but-hidden field
	// (a phantom mobile keyboard). When the drawer is closed, we bail and let
	// core open the search normally.
	document.addEventListener(
		'click',
		function ( event ) {
			if ( ! event.target || ! event.target.closest ) {
				return;
			}
			if ( ! event.target.closest( ROOT + ' ' + BTN ) ) {
				return;
			}
			var drawer = document.querySelector(
				'.hp-site-header .wp-block-navigation__responsive-container.is-menu-open'
			);
			if ( ! drawer ) {
				return;
			}
			event.preventDefault();
			event.stopImmediatePropagation();
			var navClose = drawer.querySelector(
				'.wp-block-navigation__responsive-container-close'
			);
			if ( navClose ) {
				navClose.click();
			}
		},
		true
	);

	// Hamburger tap while the search row is open → collapse the search (Escape is
	// core's own collapse path, so the search context updates cleanly).
	document.addEventListener( 'click', function ( event ) {
		if (
			! event.target ||
			! event.target.closest ||
			! event.target.closest(
				'.hp-site-header .wp-block-navigation__responsive-container-open'
			)
		) {
			return;
		}
		var forms = document.querySelectorAll( ROOT );
		for ( var i = 0; i < forms.length; i++ ) {
			if ( ! forms[ i ].classList.contains( HIDDEN ) ) {
				forms[ i ].dispatchEvent(
					new KeyboardEvent( 'keydown', { key: 'Escape', bubbles: true } )
				);
			}
		}
	} );
}() );
