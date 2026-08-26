/**
 * hperkins-tokens — state filters for the Job Placement Digest's evidence
 * register and for the Placement Method appendix's two ledgers.
 *
 * Each ledger is a complete, DB-owned table. This script narrows what is
 * *shown*; it never decides what exists. With no JavaScript the filter row is
 * never built and every row stays visible, which is the honest default — a
 * page must never depend on script to disclose evidence it claims to publish.
 *
 * State is derived from each row's own classifying cell rather than from a list
 * of row identities kept here, so the table stays the single source of truth and
 * a copy edit cannot silently mis-file a record. Classification is
 * all-or-nothing per ledger: if any row's text is not recognised, that
 * enhancement declines to mount and the ledger renders exactly as it does
 * without JS. A filter that is 10/11 correct is worse than no filter, because
 * the reader cannot tell which row was dropped.
 *
 * Order matters in every token list; the first match wins.
 *   Register — "Released owned work · prerelease" is unreleased, not released,
 *   so the prerelease test runs before the released one; likewise "Merged to
 *   owned main · unreleased" is unreleased while "Authored · merged upstream"
 *   is released.
 *   Market — a verdict of "Fail" outranks everything, "Pass — historical" has
 *   to be read before the bare "pass" that it contains, and the three
 *   needs-a-new-check verdicts are distinct sentences rather than one word.
 *
 * This site runs Gutenberg's full-page Interactivity Router: internal
 * navigations swap the <body> in place, discarding anything injected here.
 * Like router-scroll.js, pushState is wrapped (guarded against
 * double-wrapping, composing with the other wrappers). Back/Forward traversal
 * takes the separate popstate path. Both call the same settle routine, which
 * re-attempts the mount across the commit window because the router's render
 * order varies. mount() is idempotent, so the extra attempts are free and
 * whichever one lands after the swap wins.
 */
( function () {
	'use strict';

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

	var STANDING_TOKENS = [
		[ 'demonstrated', 'demonstrated' ],
		[ 'partial', 'partial' ],
		[ 'gap', 'gap' ]
	];

	var MARKET_TOKENS = [
		[ 'fail', 'failed' ],
		[ 'pass — historical', 'historical' ],
		[ 'needs verification', 'recheck' ],
		[ 'needs new screen', 'recheck' ],
		[ 'not screened', 'recheck' ],
		[ 'pass', 'live' ]
	];

	var LEDGERS = [
		{
			root: '.hp-evidence-ledger',
			figure: '.hp-evidence-table',
			// Artifact is the row header; State is the first data cell.
			cell: 'td',
			tokens: STATE_TOKENS,
			noun: 'records',
			allSuffix: ' · states verified 26 Aug 2026',
			label: 'Filter the evidence register by release state',
			filters: [
				{ key: 'all', label: 'All evidence' },
				{ key: 'released', label: 'Released' },
				{ key: 'open', label: 'Open upstream' },
				{ key: 'unreleased', label: 'Merged, unreleased' }
			]
		},
		{
			root: '.hp-resume-keyword-bank',
			figure: '.hp-keyword-table',
			// The standing word rides in the row header, beside the keyword.
			cell: 'th strong',
			tokens: STANDING_TOKENS,
			noun: 'terms',
			allSuffix: '',
			label: 'Filter the keyword ledger by standing',
			defaultState: 'demonstrated',
			filters: [
				{ key: 'demonstrated', label: 'Demonstrated' },
				{ key: 'partial', label: 'Partial' },
				{ key: 'gap', label: 'Gap' },
				{ key: 'all', label: 'All terms' }
			]
		},
		{
			root: '.hp-live-states',
			figure: '.hp-market-table',
			// Job title is the row header, so State is the fourth data cell.
			cell: 'td:nth-of-type(4)',
			tokens: MARKET_TOKENS,
			noun: 'rows',
			// No date claim here. Five of the twenty workbook rows have no Last
			// checked value, and the derived distribution below the table says so;
			// a status line asserting the opposite would be read aloud as fact.
			allSuffix: '',
			label: 'Filter the market screen by state',
			filters: [
				{ key: 'all', label: 'All rows' },
				{ key: 'live', label: 'Live passes' },
				{ key: 'historical', label: 'Historical' },
				{ key: 'recheck', label: 'Needs a new check' },
				{ key: 'failed', label: 'Screened out' }
			]
		}
	];

	function classify( text, tokens ) {
		var haystack = String( text || '' ).toLowerCase();
		for ( var i = 0; i < tokens.length; i++ ) {
			if ( haystack.indexOf( tokens[ i ][ 0 ] ) !== -1 ) {
				return tokens[ i ][ 1 ];
			}
		}
		return null;
	}

	function el( tag, className ) {
		var node = document.createElement( tag );
		if ( className ) {
			node.className = className;
		}
		return node;
	}

	function mountLedger( ledger ) {
		var root = document.querySelector( ledger.root );
		if ( ! root || root.querySelector( '.hp-evidence-filter' ) ) {
			return;
		}

		var figure = root.querySelector( ledger.figure );
		var table = figure && figure.querySelector( 'table' );
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
			var cell = rows[ i ].querySelector( ledger.cell );
			var group = cell ? classify( cell.textContent, ledger.tokens ) : null;
			if ( ! group ) {
				return;
			}
			groups.push( group );
		}

		var counts = { all: rows.length };
		ledger.filters.forEach( function ( filter ) {
			if ( filter.key !== 'all' ) {
				counts[ filter.key ] = 0;
			}
		} );
		rows.forEach( function ( row, index ) {
			var header = row.querySelector( 'th' );
			if ( header ) {
				header.setAttribute( 'data-state', groups[ index ] );
			}
			counts[ groups[ index ] ]++;
		} );

		var group = el( 'div', 'hp-evidence-filter' );
		group.setAttribute( 'role', 'group' );
		group.setAttribute( 'aria-label', ledger.label );

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

			var active = ledger.filters.filter( function ( filter ) {
				return filter.key === key;
			} )[ 0 ];

			status.textContent = key === 'all'
				? 'Showing all ' + counts.all + ' ' + ledger.noun + ledger.allSuffix
				: 'Showing ' + counts[ key ] + ' of ' + counts.all + ' ' + ledger.noun + ' · ' +
					active.label.toLowerCase();
		}

		ledger.filters.forEach( function ( filter ) {
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

		// The shared numbered spine nests each ledger figure inside its content
		// column. Insert beside the figure, never against the outer section root.
		// Keep the market scroll hint adjacent to its table by placing controls
		// before that hint when it is present.
		var container = figure.parentNode;
		if ( ! container ) {
			return;
		}
		var insertionPoint = figure.previousElementSibling &&
			figure.previousElementSibling.classList.contains( 'hp-market-scroll-hint' )
			? figure.previousElementSibling
			: figure;
		container.insertBefore( group, insertionPoint );
		container.insertBefore( status, insertionPoint );

		apply( ledger.defaultState || 'all' );
	}

	function mount() {
		LEDGERS.forEach( mountLedger );
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
			/* read-only in some sandboxes — the ledgers stay unfiltered. */
		}
	}

	wrapHistory( 'pushState' );
	window.addEventListener( 'popstate', settle );

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', mount );
	} else {
		mount();
	}
}() );
