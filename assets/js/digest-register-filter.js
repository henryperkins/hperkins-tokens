/**
 * hperkins-tokens — release-state filter for the Job Placement Digest's
 * evidence register.
 *
 * The register is a complete, DB-owned table of twelve dated records. This
 * script narrows what is *shown*; it never decides what exists. With no
 * JavaScript the filter row is never built and all twelve rows stay visible,
 * which is the honest default — the page must never depend on script to
 * disclose evidence it claims to publish.
 *
 * State is derived from each row's own State cell rather than from a list kept
 * here, so the table stays the single source of truth and a copy edit cannot
 * silently mis-file a record. Classification is all-or-nothing: if any row's
 * state text is not recognised, the enhancement declines to mount and the
 * register renders exactly as it does without JS. A filter that is 11/12
 * correct is worse than no filter, because the reader cannot tell which row
 * was dropped.
 *
 * Order matters in STATE_TOKENS. "Released owned work · prerelease" is
 * unreleased, not released, so the prerelease test has to run before the
 * released one; likewise "Merged to owned main · unreleased" is unreleased
 * while "Authored · merged upstream" is released.
 *
 * This site runs Gutenberg's full-page Interactivity Router: internal
 * navigations swap the <body> in place, discarding anything injected here.
 * Like router-scroll.js, pushState is wrapped (guarded against
 * double-wrapping, composing with the other wrappers) and the mount is
 * re-attempted across the commit window, because the router's render and
 * pushState order varies. mount() is idempotent, so the extra attempts are
 * free and whichever one lands after the swap wins.
 */
( function () {
	'use strict';

	var LEDGER = '.hp-evidence-ledger';
	var TABLE  = '.hp-evidence-table table';

	// Checked in order; first match wins. See the header note on ordering.
	var STATE_TOKENS = [
		[ 'prerelease', 'unreleased' ],
		[ 'unreleased', 'unreleased' ],
		[ 'no release', 'unreleased' ],
		[ 'open upstream', 'open' ],
		[ 'non-formal', 'open' ],
		[ 'merged upstream', 'released' ],
		[ 'shipped in', 'released' ],
		[ 'released owned work', 'released' ]
	];

	var FILTERS = [
		{ key: 'all', label: 'All evidence' },
		{ key: 'released', label: 'Released' },
		{ key: 'open', label: 'Open upstream' },
		{ key: 'unreleased', label: 'Merged, unreleased' }
	];

	function classify( text ) {
		var haystack = String( text || '' ).toLowerCase();
		for ( var i = 0; i < STATE_TOKENS.length; i++ ) {
			if ( haystack.indexOf( STATE_TOKENS[ i ][ 0 ] ) !== -1 ) {
				return STATE_TOKENS[ i ][ 1 ];
			}
		}
		return null;
	}

	function stateCellText( row ) {
		// Artifact is the row header; State is the first data cell.
		var cell = row.querySelector( 'td' );
		return cell ? cell.textContent : '';
	}

	function el( tag, className ) {
		var node = document.createElement( tag );
		if ( className ) {
			node.className = className;
		}
		return node;
	}

	function mount() {
		var ledger = document.querySelector( LEDGER );
		if ( ! ledger || ledger.querySelector( '.hp-evidence-filter' ) ) {
			return;
		}

		var table = ledger.querySelector( TABLE );
		if ( ! table ) {
			return;
		}

		var rows = Array.prototype.slice.call( table.querySelectorAll( 'tbody tr' ) );
		if ( ! rows.length ) {
			return;
		}

		// Fail closed: classify every row before touching the DOM.
		var groups = [];
		for ( var i = 0; i < rows.length; i++ ) {
			var group = classify( stateCellText( rows[ i ] ) );
			if ( ! group ) {
				return;
			}
			groups.push( group );
		}

		var counts = { all: rows.length, released: 0, open: 0, unreleased: 0 };
		rows.forEach( function ( row, index ) {
			var header = row.querySelector( 'th' );
			if ( header ) {
				header.setAttribute( 'data-state', groups[ index ] );
			}
			counts[ groups[ index ] ]++;
		} );

		var group = el( 'div', 'hp-evidence-filter' );
		group.setAttribute( 'role', 'group' );
		group.setAttribute( 'aria-label', 'Filter the evidence register by release state' );

		var status = el( 'p', 'hp-evidence-filter__status' );
		status.setAttribute( 'role', 'status' );
		status.setAttribute( 'aria-live', 'polite' );

		var buttons = [];

		function apply( key ) {
			rows.forEach( function ( row, index ) {
				var visible = key === 'all' || groups[ index ] === key;
				row.hidden = ! visible;
			} );

			buttons.forEach( function ( button ) {
				button.setAttribute( 'aria-pressed', button.dataset.state === key ? 'true' : 'false' );
			} );

			var active = FILTERS.filter( function ( filter ) {
				return filter.key === key;
			} )[ 0 ];

			status.textContent = key === 'all'
				? 'Showing all ' + counts.all + ' records · states verified 10 Aug 2026'
				: 'Showing ' + counts[ key ] + ' of ' + counts.all + ' records · ' +
					active.label.toLowerCase();
		}

		FILTERS.forEach( function ( filter ) {
			var button = el( 'button', 'hp-evidence-filter__button' );
			button.type = 'button';
			button.dataset.state = filter.key;
			button.setAttribute( 'aria-pressed', 'false' );
			button.appendChild( document.createTextNode( filter.label + ' ' ) );

			var count = el( 'span', 'hp-evidence-filter__count' );
			count.textContent = String( counts[ filter.key ] );
			button.appendChild( count );

			button.addEventListener( 'click', function () {
				apply( filter.key );
			} );

			buttons.push( button );
			group.appendChild( button );
		} );

		var figure = ledger.querySelector( '.hp-evidence-table' );
		ledger.insertBefore( group, figure );
		ledger.insertBefore( status, figure );

		apply( 'all' );
	}

	function settle() {
		mount();
		if ( window.requestAnimationFrame ) {
			window.requestAnimationFrame( mount );
		}
		window.setTimeout( mount, 120 );
	}

	function wrapHistory( method ) {
		var original = window.history[ method ];
		if ( typeof original !== 'function' || original.__hpRegisterFilter ) {
			return;
		}
		var wrapped = function () {
			var result = original.apply( this, arguments );
			settle();
			return result;
		};
		wrapped.__hpRegisterFilter = true;
		try {
			window.history[ method ] = wrapped;
		} catch ( e ) {
			/* read-only in some sandboxes — the register stays unfiltered. */
		}
	}

	wrapHistory( 'pushState' );

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', mount );
	} else {
		mount();
	}
}() );
