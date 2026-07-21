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
		node.setAttribute( 'data-hp-header-state', next );
		state = next;
		if ( next === 'closed' && restore && origin && document.contains( origin ) ) {
			origin.focus();
		}
		if ( next === 'closed' ) {
			origin = null;
		}
	}

	function toggle( next, trigger ) {
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
				applyState( 'closed' );
				node.classList.remove( 'is-hp-closing' );
				drawerLink.classList.remove( 'is-hp-chosen' );
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
				event.preventDefault();
				applyState( 'closed', { restoreFocus: true } );
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
		origin = trigger;
		applyState( next );
		var panel = panelFor( next );
		var first = panel ? panel.querySelector( 'a[href]' ) : null;
		if ( first ) {
			first.focus();
		}
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
		origin = triggerFor( next );
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
			if ( state === next ) {
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
