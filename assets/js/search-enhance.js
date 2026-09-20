( function () {
	'use strict';

	// Jetpack owns retrieval and dialog state. Keep this adapter delegated so it
	// survives both React renders and Interactivity Router header replacements.
	if ( window.__hpSearchEnhancement ) {
		return;
	}
	window.__hpSearchEnhancement = true;
	var config = window.hpSearchConfig || {};
	var strings = config.strings || {};
	var home = new URL( config.homeUrl || '/', window.location.href );
	var OVERLAY = '.jetpack-instant-search__overlay';
	var INPUT = '.jetpack-instant-search__box-input';
	var FILTER = '.jetpack-instant-search__search-results-filter-button';
	var PANEL = '.jetpack-instant-search__search-results-secondary';
	var MODAL = 'jetpack-instant-search__search-results-secondary--show-as-modal';
	var IMAGE = '.jetpack-instant-search__search-result-expanded__image, .jetpack-instant-search__search-result-product-img';
	var origin = null;
	var restoreOnClose = false;
	var focusAfterClear = false;
	var modalWasOpen = false;
	var scheduled = false;
	var imageAlts = new Map();
	var imageSources = new WeakMap();
	var RETURN_FOCUS = 'hp-search-return-focus';

	function returnTrigger() {
		var trigger = visible( origin ) ? origin : document.querySelector( '[data-hp-header-trigger="search"]' );
		return visible( trigger ) ? trigger : document.querySelector( '[data-hp-header-trigger="drawer"]' );
	}

	function forgetReturnFocus() {
		try {
			window.sessionStorage.removeItem( RETURN_FOCUS );
		} catch ( error ) {
			// Same-document focus restoration works even when storage is blocked.
		}
	}

	function requestReturnFocus() {
		restoreOnClose = true;
		var trigger = returnTrigger();
		if ( ! trigger ) {
			return;
		}
		// Closing a search that was present in the initial URL makes Jetpack
		// reload the page. Carry only this explicit close intent across that
		// same-tab reload; never record result clicks or the visitor's query.
		try {
			window.sessionStorage.setItem( RETURN_FOCUS, JSON.stringify( {
				trigger: trigger.getAttribute( 'data-hp-header-trigger' ),
				path: window.location.pathname,
				time: Date.now()
			} ) );
		} catch ( error ) {
			// Storage is optional; the ordinary close path still returns focus.
		}
	}

	try {
		var intent = JSON.parse( window.sessionStorage.getItem( RETURN_FOCUS ) );
		forgetReturnFocus();
		if ( intent && [ 'search', 'drawer' ].indexOf( intent.trigger ) !== -1 &&
			intent.path === window.location.pathname && ! new URLSearchParams( window.location.search ).has( 's' ) &&
			Date.now() - intent.time >= 0 && Date.now() - intent.time < 10000 ) {
			origin = document.querySelector( '[data-hp-header-trigger="' + intent.trigger + '"]' );
			restoreOnClose = true;
		}
	} catch ( error ) {
		forgetReturnFocus();
	}

	function visible( element ) {
		return !! ( element && element.isConnected && element.getClientRects().length &&
			window.getComputedStyle( element ).visibility !== 'hidden' );
	}

	function activeOverlay() {
		var overlay = document.querySelector( OVERLAY );
		return overlay && overlay.getAttribute( 'aria-hidden' ) !== 'true' &&
			! overlay.classList.contains( 'is-hidden' ) ? overlay : null;
	}

	function setAttribute( element, name, value ) {
		if ( element.getAttribute( name ) !== value ) {
			element.setAttribute( name, value );
		}
	}

	function text( key, fallback ) {
		return strings[ key ] || fallback;
	}

	function imageUrl( source ) {
		if ( typeof source !== 'string' || ! source ) {
			return null;
		}
		try {
			var url = new URL( source.charAt( 0 ) === '/' || /^https?:\/\//i.test( source )
				? source : 'https://' + source, home );
			return /^https?:$/.test( url.protocol ) ? url : null;
		} catch ( error ) {
			return null;
		}
	}

	if ( window.wp && window.wp.hooks ) {
		window.wp.hooks.addFilter( 'jetpack.instantSearch.searchResultImageUrl', 'hperkins-tokens/search', function ( source, result ) {
			var url = imageUrl( source );
			var permalink = result && result.fields && imageUrl( result.fields[ 'permalink.url.raw' ] );
			if ( permalink && typeof source === 'string' && /^\/(?!\/)/.test( source ) ) {
				// A local preview or multi-site index can contain another site's
				// images. Root-relative media belongs to the result's origin.
				url = new URL( source, permalink.origin );
			}
			if ( ! url ) {
				return source;
			}
			var alts = result && result.fields && result.fields[ 'image.alt_text' ];
			// The expanded card renders only the first indexed image. Its alt must
			// describe that image, rather than stringify every image in the post.
			imageAlts.set( url.host + url.pathname, Array.isArray( alts ) ? alts[ 0 ] || '' : alts || '' );
			if ( imageAlts.size > 200 ) {
				imageAlts.delete( imageAlts.keys().next().value );
			}
			// Jetpack adds the protocol itself, then sends this URL to Photon.
			return url.host + url.pathname + url.search;
		} );
	}

	function enhanceImage( img ) {
		var source = img.getAttribute( 'src' ) || '';
		var url = imageUrl( source );
		if ( ! url ) {
			return;
		}
		var photon = /^i[0-3]\.wp\.com$/i.test( url.hostname );
		// Repair already-mounted/cached cards as well as new hook-based renders.
		if ( photon && /^\/wp-content\/uploads\//.test( url.pathname ) ) {
			url.pathname = '/' + home.host + url.pathname;
		} else if ( url.hostname === 'wp-content' && /^\/uploads\//.test( url.pathname ) ) {
			url = new URL( '/wp-content' + url.pathname + url.search, home );
		}
		if ( source !== url.href ) {
			img.src = url.href;
			source = url.href;
		}
		if ( imageSources.get( img ) !== source ) {
			imageSources.set( img, source );
			img.removeAttribute( 'data-hp-search-image-failed' );
		}
		var key = photon ? url.pathname.slice( 1 ) : url.host + url.pathname;
		// The thumbnail link is decorative (aria-hidden, followed by the title
		// link). An unknown cached alt is safer empty than a concatenated array.
		setAttribute( img, 'alt', String( imageAlts.get( key ) || '' ) );
		if ( img.complete && img.naturalWidth === 0 ) {
			setAttribute( img, 'data-hp-search-image-failed', '' );
		}
	}

	function filterPanel( overlay ) {
		var panel = overlay.querySelector( PANEL );
		return panel && panel.classList.contains( MODAL ) && visible( panel ) ? panel : null;
	}

	function closeFilters( overlay ) {
		var trigger = overlay.querySelector( FILTER );
		if ( trigger ) {
			trigger.click();
			trigger.focus();
		}
	}

	function recovery( overlay, state ) {
		var primary = overlay.querySelector( '.jetpack-instant-search__search-results-primary' );
		if ( ! primary ) {
			return;
		}
		var node = primary.querySelector( '.hp-search-recovery' );
		if ( ! node ) {
			node = document.createElement( 'section' );
			node.className = 'hp-search-recovery';
			var heading = document.createElement( 'h2' );
			var description = document.createElement( 'p' );
			var links = document.createElement( 'nav' );
			links.setAttribute( 'aria-label', text( 'searchLabel', 'Search the site' ) );
			( config.recoveryLinks || [] ).forEach( function ( item ) {
				var link = document.createElement( 'a' );
				link.href = item.url;
				link.textContent = item.label;
				links.appendChild( link );
			} );
			node.append( heading, description, links );
			primary.appendChild( node );
		}
		var empty = state === 'empty';
		var show = empty || state === 'no-results';
		if ( node.hidden === show ) {
			node.hidden = ! show;
		}
		if ( show ) {
			var title = empty ? text( 'emptyTitle', 'Search the site' ) : text( 'noResultsTitle', 'No matching pages' );
			var advice = empty ? text( 'emptyText', 'Find projects, essays, and background.' ) : text( 'noResultsText', 'Try a broader term, or browse one of these sections.' );
			if ( node.firstChild.textContent !== title ) {
				node.firstChild.textContent = title;
				node.children[ 1 ].textContent = advice;
			}
		}
	}

	function enhance() {
		scheduled = false;
		var overlay = activeOverlay();
		if ( ! overlay ) {
			if ( restoreOnClose ) {
				var trigger = returnTrigger();
				if ( visible( trigger ) ) {
					trigger.focus();
				}
				forgetReturnFocus();
			}
			restoreOnClose = false;
			focusAfterClear = false;
			modalWasOpen = false;
			return;
		}
		setAttribute( overlay, 'aria-modal', 'true' );
		var input = overlay.querySelector( INPUT );
		if ( ! input ) {
			return;
		}
		setAttribute( input, 'aria-label', text( 'searchLabel', 'Search the site' ) );
		setAttribute( input, 'placeholder', text( 'searchLabel', 'Search the site' ) );
		var clear = overlay.querySelector( '.jetpack-instant-search__box input[type="button"]' );
		if ( clear ) {
			setAttribute( clear, 'aria-label', text( 'clearLabel', 'Clear search' ) );
		}
		overlay.querySelectorAll( '.jetpack-instant-search__box-gridicon svg' ).forEach( function ( icon ) {
			setAttribute( icon, 'aria-hidden', 'true' );
			setAttribute( icon, 'focusable', 'false' );
		} );
		overlay.querySelectorAll( IMAGE ).forEach( enhanceImage );
		var panel = overlay.querySelector( PANEL );
		if ( panel && ! panel.querySelector( '.hp-search-filter-close' ) ) {
			var close = document.createElement( 'button' );
			close.type = 'button';
			close.className = 'hp-search-filter-close';
			close.textContent = text( 'filterClose', 'Back to results' );
			panel.prepend( close );
		}
		var title = overlay.querySelector( '.jetpack-instant-search__search-results-title' );
		var noResults = window.wp && window.wp.i18n ? window.wp.i18n.__( 'No results found', 'jetpack-search-pkg' ) : 'No results found';
		var warning = overlay.querySelector( '.jetpack-instant-search__notice--warning' );
		var busy = overlay.querySelector( '[aria-busy="true"]' );
		var filtered = overlay.querySelector( '.jetpack-instant-search__search-filters input:checked' );
		var state = warning ? 'error' : ! input.value.trim() && ! filtered ? 'empty' :
			busy ? 'loading' : title && title.textContent.trim() === noResults ? 'no-results' : 'results';
		setAttribute( overlay, 'data-hp-search-state', state );
		recovery( overlay, state );
		var modal = filterPanel( overlay );
		if ( modal && ! modalWasOpen ) {
			modal.querySelector( '.hp-search-filter-close' ).focus();
		}
		modalWasOpen = !! modal;
		if ( focusAfterClear ) {
			input.focus();
			focusAfterClear = false;
		}
	}

	function schedule() {
		if ( ! scheduled ) {
			scheduled = true;
			window.requestAnimationFrame( enhance );
		}
	}

	document.addEventListener( 'focusin', function ( event ) {
		var input = event.target;
		if ( input.matches && input.matches( '[data-hp-header-root] input[type="search"]' ) ) {
			var key = input.closest( '[data-hp-header-panel="drawer"]' ) ? 'drawer' : 'search';
			origin = input.closest( '[data-hp-header-root]' ).querySelector( '[data-hp-header-trigger="' + key + '"]' );
		}
	}, true );
	document.addEventListener( 'input', schedule, true );
	document.addEventListener( 'change', schedule, true );
	document.addEventListener( 'click', function ( event ) {
		var overlay = activeOverlay();
		if ( ! overlay || ! event.target.closest ) {
			return;
		}
		if ( event.target.closest( '.hp-search-filter-close' ) ) {
			closeFilters( overlay );
		} else if ( event.target.closest( '.jetpack-instant-search__box input[type="button"]' ) ) {
			focusAfterClear = true;
		} else if ( event.target.closest( '.jetpack-instant-search__overlay-close, #jetpack-instant-search__overlay-focus-anchor' ) ) {
			requestReturnFocus();
		}
		schedule();
	}, true );
	document.addEventListener( 'keydown', function ( event ) {
		var overlay = activeOverlay();
		if ( ! overlay ) {
			return;
		}
		var panel = filterPanel( overlay );
		if ( event.key === 'Escape' ) {
			if ( panel ) {
				event.preventDefault();
				event.stopImmediatePropagation();
				closeFilters( overlay );
			} else {
				requestReturnFocus();
			}
			schedule();
		} else if ( event.key === 'Tab' && panel ) {
			var stops = Array.prototype.filter.call( panel.querySelectorAll( 'button, input, select, a[href], [tabindex="0"]' ), function ( element ) {
				return ! element.disabled && visible( element );
			} );
			var first = stops[ 0 ];
			var last = stops[ stops.length - 1 ];
			if ( first && ( ! panel.contains( event.target ) || event.shiftKey && event.target === first || ! event.shiftKey && event.target === last ) ) {
				event.preventDefault();
				event.stopImmediatePropagation();
				( event.shiftKey ? last : first ).focus();
			}
		}
	}, true );
	document.addEventListener( 'error', function ( event ) {
		if ( event.target.matches && event.target.matches( IMAGE ) ) {
			enhanceImage( event.target );
		}
	}, true );
	new MutationObserver( schedule ).observe( document.documentElement, {
		childList: true, subtree: true, characterData: true, attributes: true,
		attributeFilter: [ 'class', 'aria-hidden', 'aria-busy', 'src', 'alt' ]
	} );
	schedule();
} )();
