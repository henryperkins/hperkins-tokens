/**
 * hperkins-tokens — the essay reader's enhancements (templates/single.html).
 *
 * The browser half of the 2026-09-28 essay-post hand-off. The page is complete
 * without this file: inc/reader.php renders each § mark as an ordinary
 * same-page link and an image-less hero's compass plate standing still. This
 * adds three things on top:
 *
 *   - A reading-progress hairline that tracks the essay itself, read at a line
 *     40% down the viewport. It is empty at the title and full at the last
 *     line of prose, whatever follows: the related cards, the subscribe plate,
 *     the footer, and the Jetpack sharing blocks the_content appends inside
 *     the prose are not reading.
 *   - The plate's quarter turn, spent over the hero's exit. Four-fold
 *     symmetric, the star lands on itself; under reduced motion it stays put.
 *   - § marks that also copy their absolute address. The click is never
 *     prevented, so the hash still updates and :target marks the heading, and
 *     the polite toast only reports a copy the clipboard confirmed.
 *
 * Enqueued on every route like about-resume.js, so it is already loaded when
 * the Interactivity Router swaps a post in. It declines unless the document
 * holds main.hp-reader, and it re-mounts after each router commit:
 * pushState/replaceState, popstate and pageshow each schedule a settle across
 * the commit window, the same wrap header-controller.js and router-scroll.js
 * use, because the router's render/push order varies.
 */
( function () {
	'use strict';

	var REGISTRY = '__hpReaderController';
	var existing = window[ REGISTRY ];
	if ( existing && typeof existing.settle === 'function' ) {
		existing.settle();
		return;
	}
	var registry = {};
	window[ REGISTRY ] = registry;

	var ROOT = 'main.hp-reader';
	// Blocks that plugins append inside the prose which are not the essay.
	var NOT_ESSAY = '.sharedaddy, .jp-relatedposts, script, style, template';
	var READING_LINE = 0.4;
	var TOAST_MS = 1800;
	var COPIED = 'Link to this section copied';

	var mounted = null;
	var frame = 0;
	var still = window.matchMedia
		? window.matchMedia( '(prefers-reduced-motion: reduce)' )
		: null;

	function clamp( value ) {
		return Math.min( 1, Math.max( 0, value ) );
	}

	function canCopy() {
		return !! ( navigator.clipboard && typeof navigator.clipboard.writeText === 'function' );
	}

	// The address to share: the page's canonical URL with the section's hash.
	// location.href would carry whatever the visit picked up — the ?v= that
	// WooCommerce's geolocation redirect adds to every URL here, a campaign
	// tag, a subscribe status. The canonical is used only while it names this
	// path, because a router swap may leave the previous page's in <head>.
	function sectionAddress( link ) {
		var base = window.location.href;
		var canonical = document.querySelector( 'link[rel="canonical"][href]' );
		if ( canonical ) {
			try {
				var address = new URL( canonical.getAttribute( 'href' ), base );
				if ( address.origin === window.location.origin && address.pathname === window.location.pathname ) {
					base = address.href;
				}
			} catch ( error ) {
				// Unparseable canonical: keep the location.
			}
		}
		return new URL( link.getAttribute( 'href' ), base ).href;
	}

	// The essay on screen: from the top of the prose to the bottom of its last
	// reading block.
	function essaySpan( prose ) {
		var box = prose.getBoundingClientRect();
		var bottom = box.bottom;
		for ( var node = prose.lastElementChild; node; node = node.previousElementSibling ) {
			if ( ! node.matches( NOT_ESSAY ) ) {
				bottom = node.getBoundingClientRect().bottom;
				break;
			}
		}
		return { top: box.top, height: Math.max( 1, bottom - box.top ) };
	}

	// Every read comes before either write, so a frame lays out once.
	function paint() {
		frame = 0;
		var state = mounted;
		if ( ! state ) {
			return;
		}
		var read = null;
		var turn = null;
		if ( state.fill && state.prose ) {
			var span = essaySpan( state.prose );
			read = clamp( ( window.innerHeight * READING_LINE - span.top ) / span.height );
		}
		if ( state.plate && state.hero ) {
			var scrolled = window.scrollY || window.pageYOffset || 0;
			turn = still && still.matches
				? 0
				: clamp( scrolled / Math.max( 1, state.hero.offsetHeight ) ) * 90;
		}
		if ( read !== null ) {
			state.fill.style.transform = 'scaleX(' + read + ')';
		}
		if ( turn !== null ) {
			state.plate.style.setProperty( '--hp-reader-turn', turn + 'deg' );
		}
	}

	function schedule() {
		if ( frame || ! mounted ) {
			return;
		}
		if ( window.requestAnimationFrame ) {
			frame = window.requestAnimationFrame( paint );
		} else {
			paint();
		}
	}

	function mount( root ) {
		var hero = root.querySelector( '.hp-reader-hero' );
		var state = {
			root: root,
			prose: root.querySelector( '.hp-prose' ),
			hero: hero,
			plate: hero ? hero.querySelector( '.hp-reader-hero__plate' ) : null,
			bar: null,
			fill: null,
			toast: null,
			timer: 0,
			observer: null,
		};

		if ( state.prose ) {
			state.bar = document.createElement( 'div' );
			state.bar.className = 'hp-reader-progress';
			state.bar.setAttribute( 'aria-hidden', 'true' );
			state.fill = document.createElement( 'span' );
			state.bar.appendChild( state.fill );
			document.body.appendChild( state.bar );

			// Images and late fonts move the essay's end without a scroll.
			if ( typeof window.ResizeObserver === 'function' ) {
				state.observer = new window.ResizeObserver( schedule );
				state.observer.observe( state.prose );
			}
		}

		var links = root.querySelectorAll( '.hp-sec__link' );
		if ( links.length ) {
			// In the document before anything is said into it, so a screen
			// reader is already listening when a copy is reported.
			state.toast = document.createElement( 'div' );
			state.toast.className = 'hp-toast';
			state.toast.setAttribute( 'aria-live', 'polite' );
			document.body.appendChild( state.toast );

			// The server labels each mark for what it does without JavaScript.
			// Promise a copy only where the browser can make one.
			if ( canCopy() ) {
				for ( var i = 0; i < links.length; i++ ) {
					var heading = links[ i ].nextElementSibling;
					var text = heading ? heading.textContent.replace( /\s+/g, ' ' ).trim() : '';
					if ( text ) {
						links[ i ].setAttribute( 'aria-label', 'Copy a link to the section ' + text );
					}
				}
			}
		}

		return state;
	}

	function dispose( state ) {
		window.clearTimeout( state.timer );
		if ( state.observer ) {
			state.observer.disconnect();
		}
		[ state.bar, state.toast ].forEach( function ( node ) {
			if ( node && node.parentNode ) {
				node.parentNode.removeChild( node );
			}
		} );
	}

	function settle() {
		var root = document.querySelector( ROOT );
		if ( mounted && mounted.root === root ) {
			schedule();
			return;
		}
		if ( mounted ) {
			dispose( mounted );
			mounted = null;
		}
		if ( root ) {
			mounted = mount( root );
			schedule();
		}
	}

	function scheduleSettle() {
		settle();
		if ( window.requestAnimationFrame ) {
			window.requestAnimationFrame( settle );
		}
		window.setTimeout( settle, 120 );
	}
	registry.settle = scheduleSettle;

	// Empty the region, then speak into it a frame later: a second copy is a new
	// message, not the same unchanged text a screen reader would skip. Only the
	// latest copy survives, and its 1.8s starts over.
	function announce( state ) {
		window.clearTimeout( state.timer );
		state.toast.textContent = '';
		var show = function () {
			if ( mounted !== state ) {
				return;
			}
			window.clearTimeout( state.timer );
			state.toast.textContent = '';
			var message = document.createElement( 'p' );
			message.textContent = COPIED;
			state.toast.appendChild( message );
			state.timer = window.setTimeout( function () {
				state.toast.textContent = '';
			}, TOAST_MS );
		};
		if ( window.requestAnimationFrame ) {
			window.requestAnimationFrame( show );
		} else {
			show();
		}
	}

	document.addEventListener( 'click', function ( event ) {
		var state = mounted;
		var link = event.target && event.target.closest
			? event.target.closest( '.hp-sec__link' )
			: null;
		if (
			! state ||
			! state.toast ||
			! link ||
			! state.root.contains( link ) ||
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey ||
			! canCopy()
		) {
			return;
		}
		// Deliberately not prevented: the hash still updates, and that is what
		// marks the heading through :target.
		var url;
		try {
			url = sectionAddress( link );
		} catch ( error ) {
			return;
		}
		navigator.clipboard.writeText( url ).then( function () {
			if ( mounted === state ) {
				announce( state );
			}
		}, function () {
			// Refused or unavailable: say nothing rather than claim a copy.
		} );
	} );

	window.addEventListener( 'scroll', schedule, { passive: true } );
	window.addEventListener( 'resize', schedule, { passive: true } );
	window.addEventListener( 'load', schedule );
	if ( still ) {
		if ( still.addEventListener ) {
			still.addEventListener( 'change', schedule );
		} else if ( still.addListener ) {
			still.addListener( schedule );
		}
	}
	if ( document.fonts && document.fonts.ready ) {
		document.fonts.ready.then( schedule, function () {} );
	}

	function wrapHistory( method ) {
		var original = window.history[ method ];
		if ( typeof original !== 'function' || original.__hpReader ) {
			return;
		}
		var wrapped = function () {
			var result = original.apply( this, arguments );
			scheduleSettle();
			return result;
		};
		wrapped.__hpReader = true;
		try {
			window.history[ method ] = wrapped;
		} catch ( error ) {
			// Read-only history in some hosts: popstate and pageshow still settle.
		}
	}

	wrapHistory( 'pushState' );
	wrapHistory( 'replaceState' );
	window.addEventListener( 'popstate', scheduleSettle );
	window.addEventListener( 'pageshow', scheduleSettle );

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', settle, { once: true } );
	} else {
		settle();
	}
}() );
