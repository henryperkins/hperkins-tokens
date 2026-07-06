/**
 * hperkins-tokens — native scroll parity for Interactivity Router navigations.
 *
 * This site runs Gutenberg's full-page Interactivity Router: internal link
 * clicks are intercepted and the <body> region is swapped in place. The router
 * pushes the new URL but never manages scroll, which breaks parity with what a
 * normal full load does in BOTH directions:
 *   - a #fragment URL is never scrolled to its target (both Subscribe pills
 *     land on /contact/#subscribe with the visitor stuck at the page top), and
 *   - a plain navigation from a scrolled page keeps the old scroll offset, so
 *     the next page opens mid-document.
 * This restores the native contract: hash → its target (smooth, as a reveal;
 * instant under prefers-reduced-motion; the [id] scroll-margin-top rule in
 * style.css keeps it clear of the sticky masthead) · changed path without a
 * hash, or with a hash that matches nothing — anchors can go stale — → top,
 * instantly, exactly like a full load.
 *
 * Hooking pushState scopes this to router navigations by construction: full
 * loads never run it (native behavior untouched), history traversal (popstate)
 * is left to the browser's own scroll restoration, and replaceState is skipped
 * because it fires for non-navigation URL bookkeeping. Same-path pushes with
 * no hash are also left alone for the same reason. Like nav-close-delight.js
 * (same wrap pattern), the scroll settles across the commit window — at push
 * time, next frame, and a tick later — because the router's render/pushState
 * order varies; both scroll calls are idempotent, so the post-swap attempt
 * wins.
 */
( function () {
	'use strict';

	function applyScroll( fromPath ) {
		var navigated = window.location.pathname !== fromPath;
		var hash = window.location.hash;

		if ( hash && hash.length > 1 ) {
			var target = null;
			try {
				target = document.getElementById( decodeURIComponent( hash.slice( 1 ) ) );
			} catch ( e ) {
				/* malformed percent-encoding — treat as a missing anchor */
			}
			if ( target ) {
				var reduce = !! ( window.matchMedia &&
					window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches );
				target.scrollIntoView( {
					behavior: reduce ? 'auto' : 'smooth',
					block: 'start',
				} );
				return;
			}
			// Missing anchor on a swapped-in page: fall through to the plain-
			// navigation top reset, matching what a full load of the URL does.
		}

		if ( navigated ) {
			window.scrollTo( 0, 0 );
		}
	}

	function settle( fromPath ) {
		var attempt = function () {
			applyScroll( fromPath );
		};
		attempt();
		if ( window.requestAnimationFrame ) {
			window.requestAnimationFrame( attempt );
		}
		window.setTimeout( attempt, 120 );
	}

	// Guarded against double-wrapping; the wrap composes with the
	// nav-close-delight.js wrapper (each calls through to the one before).
	function wrapHistory( method ) {
		var original = window.history[ method ];
		if ( typeof original !== 'function' || original.__hpRouterScroll ) {
			return;
		}
		var wrapped = function () {
			var fromPath = window.location.pathname;
			var result = original.apply( this, arguments );
			settle( fromPath );
			return result;
		};
		wrapped.__hpRouterScroll = true;
		try {
			window.history[ method ] = wrapped;
		} catch ( e ) {
			/* read-only in some sandboxes — scroll behavior stays native-only. */
		}
	}

	wrapHistory( 'pushState' );
}() );
