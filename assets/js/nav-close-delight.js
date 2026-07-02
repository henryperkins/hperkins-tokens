/**
 * hperkins-tokens — close the mobile overlay nav with a crisp collapse when a
 * link is tapped, tied to the ACTUAL navigation commit (not a wall-clock guess).
 *
 * This site runs Gutenberg's full-page Interactivity Router (client-side
 * navigation): internal link taps are intercepted and the whole <body> region
 * is swapped in place, and the Navigation block's open state is PRESERVED across
 * that swap — so without this, the overlay stays open over the newly-loaded page.
 *
 * We do NOT navigate and do NOT preventDefault (the router, or a normal full page
 * load when the router is off, owns navigation). We:
 *   1. play the collapse + tap-echo animation on the still-open overlay, then
 *   2. close the overlay through the block's own close control the moment the
 *      navigation COMMITS — detected by hooking the History API (pushState /
 *      replaceState) and popstate, which the router drives on every client swap.
 *
 * Anchoring the teardown to the real navigation event removes the race the old
 * fixed-timeout schedule lost: a swap that landed after the last scheduled
 * attempt used to re-present an open overlay with nothing left to close it. The
 * post-collapse close below still runs for taps that fire no navigation event
 * (same-page links, in-page #hash) and for a router that is off. Degrades
 * cleanly: with the router off the link does a normal load and the menu resets.
 */
( function () {
	'use strict';

	var CONTAINER = '.wp-block-navigation__responsive-container';
	var LINK = '.wp-block-navigation__responsive-container-content a[href]';
	var CLOSE = '.wp-block-navigation__responsive-container-close';
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

	// Settle the overlay around a navigation commit: close now, then again on the
	// next frame and a tick later, to catch a region swap that re-presents the
	// open overlay immediately after the URL changes (the router's render vs.
	// pushState order varies). Cheap and idempotent — ensureClosed no-ops once the
	// overlay is closed.
	function settle() {
		ensureClosed();
		if ( window.requestAnimationFrame ) {
			window.requestAnimationFrame( ensureClosed );
		}
		window.setTimeout( ensureClosed, 60 );
	}

	// Hook the History API the Interactivity Router drives on every client
	// navigation, so the close is anchored to the real commit instead of a timer.
	// Guarded against double-wrapping; falls back to popstate where history is
	// read-only.
	function wrapHistory( method ) {
		var original = window.history[ method ];
		if ( typeof original !== 'function' || original.__hpNavClose ) {
			return;
		}
		var wrapped = function () {
			var result = original.apply( this, arguments );
			settle();
			return result;
		};
		wrapped.__hpNavClose = true;
		try {
			window.history[ method ] = wrapped;
		} catch ( e ) {
			/* read-only in some sandboxes — popstate still covers back/forward. */
		}
	}

	wrapHistory( 'pushState' );
	wrapHistory( 'replaceState' );
	window.addEventListener( 'popstate', settle );

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

		// Commit to closing. We do NOT preventDefault and do NOT navigate — the
		// history hooks above own the close the instant the router swap commits.
		closing = true;
		var reduce = reducedMotion();

		try {
			if ( ! reduce ) {
				container.classList.add( 'is-hp-closing' );
				link.classList.add( 'is-hp-chosen' );
			}
			// Post-collapse close: snappy for the common case, and the sole close
			// path for taps that fire no navigation event (same-page / #hash) or a
			// router that is off. The history hooks handle every client swap,
			// however slow, so this no longer has to out-guess the network.
			window.setTimeout( ensureClosed, reduce ? 0 : 140 );
		} catch ( e ) {
			ensureClosed(); // failure-safe: still close the overlay
		}

		// Backstop: re-arm the handler and guarantee the cosmetic classes are
		// gone even if the close already happened via a history hook.
		window.setTimeout( function () {
			closing = false;
			clearCosmetic();
		}, RESET_MS );
	}, false );
}() );
