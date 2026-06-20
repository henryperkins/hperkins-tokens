/**
 * hperkins-tokens — close the mobile overlay nav with a crisp collapse when a
 * link is tapped.
 *
 * This site runs Gutenberg's full-page Interactivity Router (client-side
 * navigation): internal link taps are intercepted and the page is swapped in
 * place, and the Navigation block's open state is PRESERVED across that swap —
 * so without this, the overlay stays open over the newly-loaded page.
 *
 * We therefore do NOT navigate and do NOT preventDefault (the router, or a
 * normal full page load when the router is off, owns navigation). We only:
 *   1. play the collapse + tap-echo animation on the still-open overlay, then
 *   2. close the overlay through the block's own close control, so core tears
 *      down its state (is-menu-open / has-modal-open / focus) and the *closed*
 *      state carries across the router swap.
 * The JS realm survives the SPA swap, so the scheduled close attempts below
 * also catch a swap that lands before the animation finishes. Degrades cleanly
 * if the router is off: the link does a normal load and the menu resets anyway.
 */
( function () {
	'use strict';

	var CONTAINER = '.wp-block-navigation__responsive-container';
	var LINK = '.wp-block-navigation__responsive-container-content a[href]';
	var CLOSE = '.wp-block-navigation__responsive-container-close';
	// Close attempts (ms): the first lands after the collapse; the rest catch a
	// fast SPA swap that re-presents an open overlay on the new page.
	var SCHEDULE_MOTION = [ 140, 220, 360, 560 ];
	var SCHEDULE_REDUCED = [ 0, 120, 260, 460 ];
	var RESET_MS = 700;
	var closing = false;

	function reducedMotion() {
		return !! ( window.matchMedia &&
			window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches );
	}

	// Drop the cosmetic collapse classes wherever they linger. The router
	// preserves the nav container across a swap, so a class left on it would
	// otherwise replay the collapse on a *re-opened* menu (the selector needs
	// .is-menu-open AND .is-hp-closing) — leaving it invisible until reset.
	function clearCosmetic() {
		var nodes = document.querySelectorAll( '.is-hp-closing, .is-hp-chosen' );
		for ( var i = 0; i < nodes.length; i++ ) {
			nodes[ i ].classList.remove( 'is-hp-closing', 'is-hp-chosen' );
		}
	}

	// Close any open overlay via the block's own close control so core runs its
	// real teardown and the closed state persists across a router swap. Once the
	// overlay is confirmed closed, strip the cosmetic classes — only then, so the
	// collapse is never snapped back to full opacity while the panel is visible.
	function ensureClosed() {
		var open = document.querySelector( CONTAINER + '.is-menu-open' );
		if ( ! open ) {
			clearCosmetic();
			return;
		}
		var btn = open.querySelector( CLOSE ) || document.querySelector( CLOSE );
		if ( btn ) {
			btn.click();
		}
	}

	document.addEventListener( 'click', function ( event ) {
		if ( closing || event.button !== 0 ) {
			return;
		}
		if ( event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ) {
			return; // let modified clicks (new tab/window) behave normally
		}

		var target = event.target;
		var link = target && target.closest ? target.closest( LINK ) : null;
		if ( ! link || link.target === '_blank' ) {
			return;
		}

		var container = link.closest( CONTAINER );
		if ( ! container || ! container.classList.contains( 'is-menu-open' ) ) {
			return; // only act when the mobile overlay is actually open
		}

		// Commit to closing. We do NOT preventDefault and do NOT navigate.
		closing = true;
		var reduce = reducedMotion();

		try {
			if ( ! reduce ) {
				container.classList.add( 'is-hp-closing' );
				link.classList.add( 'is-hp-chosen' );
			}
			( reduce ? SCHEDULE_REDUCED : SCHEDULE_MOTION ).forEach( function ( ms ) {
				window.setTimeout( ensureClosed, ms );
			} );
		} catch ( e ) {
			ensureClosed(); // failure-safe: still close the overlay
		}

		// Backstop: re-arm the handler and guarantee the cosmetic classes are
		// gone even if every scheduled ensureClosed found the menu still open.
		window.setTimeout( function () {
			closing = false;
			clearCosmetic();
		}, RESET_MS );
	}, false );
}() );
