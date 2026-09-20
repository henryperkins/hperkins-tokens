import { store } from '@wordpress/interactivity';
import 'jetpack-search/store';

// Extend the public store; never replace Jetpack's query/actions or mutate the
// indexed result records. The theme's render filter opts only the result loop
// into these getters, leaving product fields and all other bindings intact.
const { state } = store( 'jetpack-search', {
	state: {
		get hperkinsSearchResults() {
			return state.results.map( ( result ) => {
				const imageUrl = repairImageUrl( result.imageUrl, result.permalink );
				return {
					...result,
					imageUrl,
					imageBackgroundImage: imageUrl === result.imageUrl ? result.imageBackgroundImage :
						imageUrl ? 'url(' + JSON.stringify( imageUrl ) + ')' : '',
					authorLabel: /^User\s+0$/i.test( ( result.authorLabel || '' ).trim() ) ? '' : result.authorLabel
				};
			} );
		},
		get hperkinsSearchState() {
			if ( state.hasError ) {
				return 'error';
			}
			if ( state.isLoading ) {
				return 'loading';
			}
			if ( ! state.searchQuery.trim() && ! state.hasActiveFilters ) {
				return 'empty';
			}
			return state.totalResults === 0 ? 'no-results' : 'results';
		}
	}
} );

// Jetpack clones the inert overlay template before awaiting its hydration
// chunk. Starting it before DOMContentLoaded lets WordPress discover the same
// regions and hydrate them twice, which can empty result and filter loops.
// Keep that template inert until the core's initial scan has taken its snapshot.
// "interactive" alone is too early: deferred modules can still be loading.
function startOverlay() {
	return import( 'jetpack-search/overlay-bootstrap' );
}
if ( document.readyState === 'complete' ||
	window.performance.getEntriesByType( 'navigation' ).some( ( entry ) => entry.domContentLoadedEventStart > 0 ) ) {
	startOverlay();
} else {
	document.addEventListener( 'DOMContentLoaded', startOverlay, { once: true } );
}

function repairImageUrl( source, permalink ) {
	if ( ! source ) {
		return source;
	}
	try {
		const home = new URL( window.hpSearchConfig?.homeUrl || '/', window.location.href );
		const resultUrl = new URL( permalink || home.href, home );
		const base = /^https?:$/.test( resultUrl.protocol ) ? resultUrl : home;
		let url = new URL( source, base.origin );
		if ( /^i[0-3]\.wp\.com$/i.test( url.hostname ) && /^\/wp-content\//.test( url.pathname ) ) {
			url.pathname = '/' + base.host + url.pathname;
		} else if ( url.hostname === 'wp-content' && /^\/(uploads|themes|plugins)\//.test( url.pathname ) ) {
			url = new URL( '/wp-content' + url.pathname + url.search, base.origin );
		} else if ( ! /^\/(?!\/)/.test( source ) ) {
			return source;
		}
		return url.href;
	} catch ( error ) {
		// A malformed unrelated URL is Jetpack's concern; do not invent a host.
		return source;
	}
}
