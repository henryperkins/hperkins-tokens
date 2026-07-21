( function () {
	'use strict';

	var ROOT = '[data-hp-header-root]';
	var TRIGGER = '[data-hp-header-trigger]';
	var PANEL = '[data-hp-header-panel]';
	var REGISTRY = '__hpCouncilHeaderController';
	var existing = window[ REGISTRY ];
	if ( existing && typeof existing.settle === 'function' ) {
		existing.settle();
		return;
	}
	var registry = {};
	window[ REGISTRY ] = registry;
	var STATES = [ 'closed', 'work', 'writing', 'search', 'drawer' ];
	var state = 'closed';
	var origin = null;
	var hoverTimer = 0;

	function root() {
		return document.querySelector( ROOT );
	}

	function triggerFor( next ) {
		var node = root();
		return node
			? node.querySelector( '[data-hp-header-trigger="' + next + '"]' )
			: null;
	}

	function panelFor( next ) {
		var node = root();
		return node
			? node.querySelector( '[data-hp-header-panel="' + next + '"]' )
			: null;
	}

	function applyState( next, options ) {
		var node = root();
		if ( ! node || STATES.indexOf( next ) === -1 ) {
			return;
		}
		var restore = options && options.restoreFocus;
		var triggers = node.querySelectorAll( TRIGGER );
		var panels = node.querySelectorAll( PANEL );
		for ( var i = 0; i < triggers.length; i++ ) {
			var key = triggers[ i ].getAttribute( 'data-hp-header-trigger' );
			triggers[ i ].setAttribute( 'aria-expanded', key === next ? 'true' : 'false' );
		}
		for ( var j = 0; j < panels.length; j++ ) {
			var panelKey = panels[ j ].getAttribute( 'data-hp-header-panel' );
			panels[ j ].hidden = panelKey !== next;
		}
		// Deliberately not a styling hook. Panel visibility is driven by
		// [hidden] and aria-expanded, so no CSS reads this; it is the state
		// probe scripts/verify-header.js asserts against. Removing it as dead
		// code blinds that suite to the closure's state — and trips its own
		// assertion that this line exists.
		node.setAttribute( 'data-hp-header-state', next );
		state = next;
		if ( next === 'closed' && restore && origin && document.contains( origin ) ) {
			origin.focus();
		}
		if ( next === 'closed' ) {
			origin = null;
		}
	}

	function focusIsInside() {
		var node = root();
		return !! ( node && document.activeElement && node.contains( document.activeElement ) );
	}

	function toggle( next, trigger ) {
		// A pending hover close targets whatever was open a moment ago; letting it
		// survive an explicit open would shut the panel the visitor just asked for.
		window.clearTimeout( hoverTimer );
		origin = trigger;
		applyState( state === next ? 'closed' : next );
		if ( next === 'search' && state === 'search' ) {
			var searchPanel = panelFor( 'search' );
			var input = searchPanel
				? searchPanel.querySelector( 'input[type="search"]' )
				: null;
			if ( input ) {
				input.focus();
			}
		}
	}

	function reducedMotion() {
		return !! (
			window.matchMedia &&
			window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches
		);
	}

	function desktopPointer() {
		return !! (
			window.matchMedia &&
			window.matchMedia( '(min-width: 782px) and (hover: hover) and (pointer: fine)' ).matches
		);
	}

	function settle() {
		window.clearTimeout( hoverTimer );
		// applyState() returns early when the router has detached the header, so
		// it cannot be relied on to clear the closure. Reset the state directly:
		// a stale 'drawer' here reads the next drawer click as a close and the
		// panel refuses to open.
		state = 'closed';
		origin = null;
		applyState( 'closed' );
		if ( window.requestAnimationFrame ) {
			window.requestAnimationFrame( function () {
				applyState( 'closed' );
			} );
		}
		window.setTimeout( function () {
			applyState( 'closed' );
		}, 60 );
	}
	registry.settle = settle;

	function wrapHistory( method ) {
		var original = window.history[ method ];
		if ( typeof original !== 'function' || original.__hpCouncilHeader ) {
			return;
		}
		var wrapped = function () {
			var result = original.apply( this, arguments );
			settle();
			return result;
		};
		wrapped.__hpCouncilHeader = true;
		try {
			window.history[ method ] = wrapped;
		} catch ( error ) {
			// popstate and header-link click remain functional in read-only hosts.
		}
	}

	document.addEventListener( 'click', function ( event ) {
		var node = root();
		if ( ! node || ! event.target || ! event.target.closest ) {
			return;
		}

		var trigger = event.target.closest( TRIGGER );
		if ( trigger && node.contains( trigger ) ) {
			toggle( trigger.getAttribute( 'data-hp-header-trigger' ), trigger );
			return;
		}

		var drawerLink = event.target.closest(
			'[data-hp-header-panel="drawer"] a[href]'
		);
		if ( drawerLink && node.contains( drawerLink ) ) {
			if (
				event.defaultPrevented ||
				event.button !== 0 ||
				event.metaKey ||
				event.ctrlKey ||
				event.shiftKey ||
				event.altKey ||
				drawerLink.target === '_blank' ||
				drawerLink.hasAttribute( 'download' )
			) {
				return;
			}
			if ( ! reducedMotion() ) {
				node.classList.add( 'is-hp-closing' );
				drawerLink.classList.add( 'is-hp-chosen' );
			}
			window.setTimeout( function () {
				// router-scroll.js focuses a hash target across the same commit
				// window; only rescue focus when it is still on the link we are
				// about to hide, so this never steals focus from that target.
				var active = document.activeElement;
				var stranded = ! active || active === document.body || drawerLink === active;
				applyState( 'closed' );
				node.classList.remove( 'is-hp-closing' );
				drawerLink.classList.remove( 'is-hp-chosen' );
				var drawerTrigger = stranded ? triggerFor( 'drawer' ) : null;
				if ( drawerTrigger ) {
					drawerTrigger.focus();
				}
			}, reducedMotion() ? 0 : 140 );
			return;
		}

		if ( state !== 'closed' && ! node.contains( event.target ) ) {
			applyState( 'closed' );
		}
	} );

	document.addEventListener( 'keydown', function ( event ) {
		if ( event.key === 'Escape' || event.key === 'Esc' ) {
			if ( state !== 'closed' ) {
				// A hover-opened panel records an origin the visitor never focused.
				// Restoring to it would rip focus out of wherever they actually
				// are, so only restore when focus is genuinely inside the header —
				// and only claim the key in that case.
				var inside = focusIsInside();
				if ( inside ) {
					event.preventDefault();
				}
				applyState( 'closed', { restoreFocus: inside } );
			}
			return;
		}

		if ( event.key !== 'ArrowDown' || ! event.target.closest ) {
			return;
		}
		var trigger = event.target.closest( TRIGGER );
		var node = root();
		if ( ! trigger || ! node || ! node.contains( trigger ) ) {
			return;
		}
		var next = trigger.getAttribute( 'data-hp-header-trigger' );
		if ( next !== 'work' && next !== 'writing' ) {
			return;
		}
		event.preventDefault();
		window.clearTimeout( hoverTimer );
		origin = trigger;
		applyState( next );
		var panel = panelFor( next );
		var first = panel ? panel.querySelector( 'a[href]' ) : null;
		if ( first ) {
			first.focus();
		}
	} );

	// Tabbing past the end of an open panel should close it, the way a
	// disclosure does — the drawer especially, which otherwise leaves the
	// visitor tabbing through a menu that is no longer where they are.
	document.addEventListener( 'focusin', function ( event ) {
		var node = root();
		if ( ! node || state === 'closed' ) {
			return;
		}
		var panel = panelFor( state );
		var trigger = triggerFor( state );
		if (
			( panel && panel.contains( event.target ) ) ||
			( trigger && trigger === event.target )
		) {
			return;
		}
		applyState( 'closed' );
	} );

	document.addEventListener( 'pointerover', function ( event ) {
		if ( ! desktopPointer() || ! event.target.closest ) {
			return;
		}
		var group = event.target.closest( '[data-hp-header-hover]' );
		var node = root();
		if (
			! group ||
			! node ||
			! node.contains( group ) ||
			( event.relatedTarget && group.contains( event.relatedTarget ) )
		) {
			return;
		}
		window.clearTimeout( hoverTimer );
		var next = group.getAttribute( 'data-hp-header-hover' );
		// Never overwrite an origin a keyboard visitor established; the pointer
		// is only passing through.
		if ( ! focusIsInside() ) {
			origin = triggerFor( next );
		}
		applyState( next );
	} );

	document.addEventListener( 'pointerout', function ( event ) {
		if ( ! desktopPointer() || ! event.target.closest ) {
			return;
		}
		var group = event.target.closest( '[data-hp-header-hover]' );
		var node = root();
		if (
			! group ||
			! node ||
			! node.contains( group ) ||
			( event.relatedTarget && group.contains( event.relatedTarget ) )
		) {
			return;
		}
		var next = group.getAttribute( 'data-hp-header-hover' );
		hoverTimer = window.setTimeout( function () {
			// Closing on pointer-out while focus sits inside the panel would
			// destroy it — the visitor tabbed in and the pointer merely drifted.
			if ( state === next && ! focusIsInside() ) {
				applyState( 'closed' );
			}
		}, 120 );
	} );

	var boundary = window.matchMedia
		? window.matchMedia( '(min-width: 782px)' )
		: null;
	if ( boundary ) {
		if ( boundary.addEventListener ) {
			boundary.addEventListener( 'change', settle );
		} else if ( boundary.addListener ) {
			boundary.addListener( settle );
		}
	}

	wrapHistory( 'pushState' );
	wrapHistory( 'replaceState' );
	window.addEventListener( 'popstate', settle );
	window.addEventListener( 'pageshow', settle );
	applyState( 'closed' );
}() );
