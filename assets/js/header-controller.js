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
	// How the open panel opened: 'hover' | 'click' | 'key', or null when closed.
	// Only a hover opening closes when the pointer leaves; a click pins it.
	var openedBy = null;
	var hoverTimer = 0;
	// The drawer's closing fold while it runs: { node, link, restore, timer }.
	var fold = null;
	var liftFrame = 0;

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
		openedBy = next === 'closed' ? null : ( options && options.by ) || 'click';
	}

	// Every opening — click, ArrowDown, hover, "/" — comes through here. A
	// pending hover close targets whatever was open a moment ago, and a folding
	// drawer is about to hide itself; letting either survive an explicit open
	// would shut the panel the visitor just asked for.
	function open( next, by ) {
		window.clearTimeout( hoverTimer );
		cancelFold();
		applyState( next, { by: by } );
	}

	function cancelFold() {
		if ( ! fold ) {
			return;
		}
		window.clearTimeout( fold.timer );
		fold.node.classList.remove( 'is-hp-closing' );
		if ( fold.link ) {
			fold.link.classList.remove( 'is-hp-chosen' );
		}
		fold = null;
	}

	// The drawer folds shut on every close — the collapse a chosen link always
	// ran — and hides only once the fold ends. A chosen link also echoes.
	function closeDrawer( options ) {
		var node = root();
		var drawer = panelFor( 'drawer' );
		// Already folding: a second close changes nothing.
		if ( fold || ! node || ! drawer ) {
			return;
		}
		var link = options && options.link;
		var delay = 0;
		if ( ! reducedMotion() ) {
			node.classList.add( 'is-hp-closing' );
			if ( link ) {
				link.classList.add( 'is-hp-chosen' );
			}
			// Computed CSS durations are seconds. Read the closing animation after
			// its class is applied so the hide timer follows the theme token.
			delay = ( parseFloat( window.getComputedStyle( drawer ).animationDuration ) || 0 ) * 1000;
		}
		fold = { node: node, link: link, restore: !! ( options && options.restore ), timer: 0 };
		if ( delay > 0 ) {
			fold.timer = window.setTimeout( finishFold, delay );
		} else {
			finishFold();
		}
	}

	function finishFold() {
		var current = fold;
		fold = null;
		if ( ! current ) {
			return;
		}
		var drawer = panelFor( 'drawer' );
		var active = document.activeElement;
		var lost = ! active || active === document.body;
		var inside = !! ( drawer && active && drawer.contains( active ) );
		applyState( 'closed' );
		current.node.classList.remove( 'is-hp-closing' );
		if ( current.link ) {
			current.link.classList.remove( 'is-hp-chosen' );
		}
		// router-scroll.js focuses a hash target across the same commit window,
		// so a chosen link rescues focus only when it is still on the link we
		// just hid — never stealing it from that target. Escape from inside hands
		// focus to the trigger; any other close leaves focus where it is.
		var rescue = current.link
			? lost || current.link === active
			: current.restore && ( lost || inside );
		var drawerTrigger = rescue ? triggerFor( 'drawer' ) : null;
		if ( drawerTrigger ) {
			drawerTrigger.focus();
		}
	}

	function close() {
		if ( state === 'drawer' ) {
			closeDrawer();
			return;
		}
		applyState( 'closed' );
	}

	// Escape. Focus inside the open panel returns to that panel's trigger —
	// whichever panel is open now, however the visitor got there. Focus
	// anywhere else stays where they put it, and the key is claimed only when
	// this surface owns focus.
	function dismiss( event ) {
		if ( state === 'closed' ) {
			return;
		}
		var panel = panelFor( state );
		var trigger = triggerFor( state );
		var active = document.activeElement;
		var inPanel = !! ( panel && active && panel.contains( active ) );
		if ( inPanel || ( trigger && active === trigger ) ) {
			event.preventDefault();
		}
		if ( state === 'drawer' ) {
			// The fold hands focus to the trigger once it ends.
			closeDrawer( { restore: inPanel } );
			return;
		}
		applyState( 'closed' );
		if ( inPanel && trigger ) {
			trigger.focus();
		}
	}

	function searchField( next ) {
		var panel = panelFor( next );
		return panel ? panel.querySelector( 'input[type="search"]' ) : null;
	}

	function toggle( next ) {
		// The drawer stays open until its fold finishes. A toggle during that
		// fold reverses it through open(), clearing the timer and chosen link.
		if ( state !== next || ( next === 'drawer' && fold ) ) {
			open( next, 'click' );
			var input = next === 'search' ? searchField( 'search' ) : null;
			if ( input ) {
				input.focus();
			}
			return;
		}
		// The pointer opened this panel on its way to the trigger, so the click
		// that follows pins it rather than shutting it.
		if ( openedBy === 'hover' ) {
			openedBy = 'click';
			return;
		}
		close();
	}

	// Anything already taking text keeps its "/", and so does a modal dialog
	// such as the Jetpack search overlay: pulling focus to the header would
	// strand it behind the overlay.
	function keepsSlash( node ) {
		if ( ! node || ! node.tagName ) {
			return false;
		}
		return !! (
			node.isContentEditable ||
			/^(INPUT|TEXTAREA|SELECT)$/.test( node.tagName ) ||
			( node.closest && node.closest( '[aria-modal="true"], dialog[open]' ) )
		);
	}

	// "/" opens search, as the search trigger's aria-keyshortcuts declares. A
	// phone has no search button, so there it opens the drawer and its field.
	function searchShortcut( event ) {
		if (
			event.metaKey ||
			event.ctrlKey ||
			event.altKey ||
			event.defaultPrevented ||
			event.isComposing ||
			keepsSlash( event.target )
		) {
			return;
		}
		var next = window.matchMedia && ! window.matchMedia( '(min-width: 782px)' ).matches
			? 'drawer'
			: 'search';
		var input = searchField( next );
		if ( ! input ) {
			return;
		}
		event.preventDefault();
		// Already open, this only refocuses the field — but it still cancels a
		// fold in flight, which would otherwise hide the drawer around the focus.
		open( next, 'key' );
		input.focus();
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

	// The masthead lifts once content scrolls under it: its hairline gives way
	// to a shadow. The window is the scroller — router-scroll.js resets it with
	// window.scrollTo — so a frame-throttled passive listener is enough.
	function syncLift() {
		liftFrame = 0;
		var node = root();
		var shell = node && node.closest ? node.closest( '.hp-site-header' ) : null;
		if ( shell ) {
			shell.classList.toggle( 'is-hp-lifted', ( window.scrollY || window.pageYOffset || 0 ) > 0 );
		}
	}

	function settle() {
		window.clearTimeout( hoverTimer );
		cancelFold();
		// applyState() returns early when the router has detached the header, so
		// it cannot be relied on to clear the closure. Reset the state directly:
		// a stale 'drawer' here reads the next drawer click as a close and the
		// panel refuses to open.
		state = 'closed';
		openedBy = null;
		settleHeader();
		if ( window.requestAnimationFrame ) {
			window.requestAnimationFrame( settleHeader );
		}
		window.setTimeout( settleHeader, 60 );
	}
	registry.settle = settle;

	// The router swaps in a fresh, unlifted header, so each pass re-applies the
	// lift along with the closed state.
	function settleHeader() {
		applyState( 'closed' );
		syncLift();
	}

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
			toggle( trigger.getAttribute( 'data-hp-header-trigger' ) );
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
			closeDrawer( { link: drawerLink } );
			return;
		}

		if ( state !== 'closed' && ! node.contains( event.target ) ) {
			close();
		}
	} );

	document.addEventListener( 'keydown', function ( event ) {
		if ( event.key === 'Escape' || event.key === 'Esc' ) {
			dismiss( event );
			return;
		}

		if ( event.key === '/' ) {
			searchShortcut( event );
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
		open( next, 'key' );
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
		close();
	} );

	// Hover is a mouse affordance. A touch or pen press fires pointerover just
	// before its click, and a panel opened there would be shut again by that
	// click — on a touch-screen laptop, whose trackpad satisfies
	// desktopPointer(), Work and Writing would seem to do nothing.
	function mouseHover( event ) {
		return event.pointerType === 'mouse' && desktopPointer() && !! event.target.closest;
	}

	document.addEventListener( 'pointerover', function ( event ) {
		if ( ! mouseHover( event ) ) {
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
		// Re-entering an open panel must not demote a click or key opening to a
		// hover one, which the pointer's next exit would close; and search and
		// the drawer are explicit modes a passing pointer never replaces.
		if ( state === next || state === 'search' || state === 'drawer' ) {
			return;
		}
		// A pointer passing by never takes a panel out from under keyboard focus:
		// hiding it would take the focused link with it and drop focus to <body>.
		var current = state === 'closed' ? null : panelFor( state );
		if ( current && current.contains( document.activeElement ) ) {
			return;
		}
		open( next, 'hover' );
	} );

	document.addEventListener( 'pointerout', function ( event ) {
		if ( ! mouseHover( event ) ) {
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
		window.clearTimeout( hoverTimer );
		hoverTimer = window.setTimeout( function () {
			// Only the pointer's own opening closes on leave; a click or a key
			// pinned the rest. Closing while focus sits inside the panel would
			// destroy it — the visitor tabbed in and the pointer merely drifted.
			// Focus anywhere else in the header does not hold the panel open.
			var panel = panelFor( next );
			if ( state === next && openedBy === 'hover' && ! ( panel && panel.contains( document.activeElement ) ) ) {
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

	window.addEventListener( 'scroll', function () {
		if ( liftFrame ) {
			return;
		}
		if ( window.requestAnimationFrame ) {
			liftFrame = window.requestAnimationFrame( syncLift );
		} else {
			syncLift();
		}
	}, { passive: true } );

	wrapHistory( 'pushState' );
	wrapHistory( 'replaceState' );
	window.addEventListener( 'popstate', settle );
	window.addEventListener( 'pageshow', settle );
	applyState( 'closed' );
	// A reload can restore a scrolled page before this runs.
	syncLift();
}() );
