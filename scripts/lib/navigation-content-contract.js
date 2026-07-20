#!/usr/bin/env node

const path = require( 'node:path' );

const THEME_PATH = path.resolve( __dirname, '..', '..' );
const NAVIGATION_POST_ID = 237;
const NAVIGATION_SNAPSHOT_PATH = path.join(
	THEME_PATH,
	'content',
	'nav-snapshots',
	'nav-237.html'
);

const EXPECTED_COUNCIL_SHAPE = [
	{ key: 'work', blockName: 'core/navigation-link', label: 'Work', url: '/work/', className: 'hp-nav-work' },
	{ key: 'writing', blockName: 'core/navigation-submenu', label: 'Writing', className: 'hp-nav-writing' },
	{ key: 'about', blockName: 'core/navigation-link', label: 'About', url: '/about/' },
	{ key: 'search', blockName: 'core/search', className: 'hp-drawer-search' },
	{ key: 'subscribe', blockName: 'core/navigation-link', label: 'Subscribe', url: '/contact/#subscribe', className: 'hp-nav-subscribe' },
];

function normalizeNavigationContent( value, homeUrl ) {
	const normalized = String( value ).replace( /\r\n/g, '\n' ).trimEnd();
	const origin = new URL( homeUrl ).origin;
	return normalized.replace( /<!--\s+wp:[\s\S]*?-->/g, ( blockComment ) =>
		blockComment.replace(
			/("url"\s*:\s*)("(?:\\.|[^"\\])*")/g,
			( match, prefix, encodedValue ) => {
				let url;
				try {
					url = new URL( JSON.parse( encodedValue ) );
				} catch {
					return match;
				}

				if ( url.origin !== origin ) {
					return match;
				}

				return prefix + JSON.stringify( url.pathname + url.search + url.hash );
			}
		)
	);
}

module.exports = {
	THEME_PATH,
	NAVIGATION_POST_ID,
	NAVIGATION_SNAPSHOT_PATH,
	EXPECTED_COUNCIL_SHAPE,
	normalizeNavigationContent,
};
