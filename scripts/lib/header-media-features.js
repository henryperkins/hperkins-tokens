const DESKTOP_BREAKPOINT_QUERY = '(min-width: 782px)';
const FINE_POINTER_QUERY = `${ DESKTOP_BREAKPOINT_QUERY } and (hover: hover) and (pointer: fine)`;

function getHeaderMediaFeatures( { reducedMotion = false } = {} ) {
	return reducedMotion
		? [ { name: 'prefers-reduced-motion', value: 'reduce' } ]
		: [];
}

function getFinePointerOverrideSource( viewport ) {
	if ( viewport.width < 782 ) {
		return null;
	}

	// Blink's DevTools media-feature overrides do not include hover or pointer,
	// so Linux headless Chrome otherwise leaks its host's pointer-less state.
	// Override only the exact guard used by the production header controller,
	// while preserving the real width query as the viewport crosses 782px.
	return `(() => {
		const nativeMatchMedia = window.matchMedia.bind(window);
		const finePointerQuery = ${ JSON.stringify( FINE_POINTER_QUERY ) };
		const desktopBreakpointQuery = ${ JSON.stringify( DESKTOP_BREAKPOINT_QUERY ) };
		window.matchMedia = function (query) {
			const result = nativeMatchMedia(query);
			if (query !== finePointerQuery) {
				return result;
			}
			return new Proxy(result, {
				get(target, property) {
					if (property === 'matches') {
						return nativeMatchMedia(desktopBreakpointQuery).matches;
					}
					const value = Reflect.get(target, property, target);
					return typeof value === 'function' ? value.bind(target) : value;
				},
			});
		};
	})();`;
}

module.exports = {
	getFinePointerOverrideSource,
	getHeaderMediaFeatures,
};
