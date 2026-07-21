#!/usr/bin/env node

const crypto = require( 'node:crypto' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { runWpEval } = require( './lib/wp-cli' );

const {
	THEME_PATH,
	SNAPSHOT_DIR,
	PAGE_CONTRACTS,
	RETIRED_PAGE_PATHS,
	getPageRecord,
	getRetiredPageTargetsPhp,
	getTrackedPageTargetsPhp,
	normalizeContent,
} = require( './lib/page-content-contract' );
const {
	NAVIGATION_POST_ID,
	NAVIGATION_SNAPSHOT_PATH,
	EXPECTED_COUNCIL_SHAPE,
	normalizeNavigationContent,
} = require( './lib/navigation-content-contract' );

const EXPECTED_WRITING_CHILDREN = [
	{ blockName: 'core/navigation-link', label: 'AI Enablement', url: '/ai-enablement/', className: 'hp-nav-ai' },
	{ blockName: 'core/navigation-link', label: 'Essays', url: '/essays/', className: 'hp-nav-essays' },
	{ blockName: 'core/navigation-link', label: 'Job Placement Digest', url: '/job-placement-digest/', className: 'hp-nav-digest' },
];

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function readTemplate( relativePath ) {
	return fs.readFileSync( path.join( THEME_PATH, relativePath ), 'utf8' );
}

function getOwnershipState() {
	const trackedPageTargets = getTrackedPageTargetsPhp( { includeTemplate: true } );
	const retiredPageTargets = getRetiredPageTargetsPhp();

	return JSON.parse(
		runWpEval(`
			$result = array(
				'frontPageMode' => get_option( 'show_on_front' ),
				'frontPageId' => (int) get_option( 'page_on_front' ),
				'frontPage' => null,
				'pages' => array(),
				'retiredPages' => array(),
				'navigation' => null,
			);

			$navigation_post = get_post( ${ NAVIGATION_POST_ID } );
			$navigation_home = home_url();
			$navigation_home_parts = wp_parse_url( $navigation_home );
			$navigation_home_scheme = isset( $navigation_home_parts['scheme'] ) ? strtolower( $navigation_home_parts['scheme'] ) : '';
			$navigation_home_host = isset( $navigation_home_parts['host'] ) ? strtolower( $navigation_home_parts['host'] ) : '';
			$navigation_home_port = isset( $navigation_home_parts['port'] )
				? (int) $navigation_home_parts['port']
				: ( 'https' === $navigation_home_scheme ? 443 : ( 'http' === $navigation_home_scheme ? 80 : null ) );
			$navigation_relative_url = static function ( $url ) use ( $navigation_home_scheme, $navigation_home_host, $navigation_home_port ) {
				if ( ! is_string( $url ) || '' === $url ) {
					return null;
				}

				$parts = wp_parse_url( $url );
				if ( false === $parts ) {
					return $url;
				}

				if ( isset( $parts['host'] ) ) {
					$url_scheme = isset( $parts['scheme'] ) ? strtolower( $parts['scheme'] ) : '';
					$url_host = strtolower( $parts['host'] );
					$url_port = isset( $parts['port'] )
						? (int) $parts['port']
						: ( 'https' === $url_scheme ? 443 : ( 'http' === $url_scheme ? 80 : null ) );
					if ( $navigation_home_scheme !== $url_scheme || $navigation_home_host !== $url_host || $navigation_home_port !== $url_port ) {
						return $url;
					}
				} elseif ( isset( $parts['scheme'] ) ) {
					return $url;
				}

				$relative = isset( $parts['path'] ) ? $parts['path'] : '/';
				if ( isset( $parts['query'] ) ) {
					$relative .= '?' . $parts['query'];
				}
				if ( isset( $parts['fragment'] ) ) {
					$relative .= '#' . $parts['fragment'];
				}
				return $relative;
			};

			$simplify_navigation_blocks = static function ( $blocks ) use ( &$simplify_navigation_blocks, $navigation_relative_url ) {
				$items = array();
				foreach ( $blocks as $block ) {
					if ( empty( $block['blockName'] ) ) {
						continue;
					}

					$attrs = isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : array();
					$items[] = array(
						'blockName' => (string) $block['blockName'],
						'label' => isset( $attrs['label'] ) ? wp_strip_all_tags( (string) $attrs['label'] ) : null,
						'url' => isset( $attrs['url'] ) ? $navigation_relative_url( (string) $attrs['url'] ) : null,
						'className' => isset( $attrs['className'] ) ? (string) $attrs['className'] : null,
						'children' => $simplify_navigation_blocks( isset( $block['innerBlocks'] ) ? $block['innerBlocks'] : array() ),
					);
				}
				return $items;
			};

			$result['navigation'] = array(
				'id' => $navigation_post ? (int) $navigation_post->ID : 0,
				'type' => $navigation_post ? $navigation_post->post_type : null,
				'status' => $navigation_post ? $navigation_post->post_status : null,
				'content' => $navigation_post ? (string) $navigation_post->post_content : '',
				'home' => $navigation_home,
				'items' => $navigation_post ? $simplify_navigation_blocks( parse_blocks( $navigation_post->post_content ) ) : array(),
			);

			$front_page = get_post( $result['frontPageId'] );
			$front_template = get_block_template( 'hperkins-tokens//front-page', 'wp_template' );
			$result['frontPage'] = array(
				'id' => $front_page ? (int) $front_page->ID : 0,
				'slug' => $front_page ? $front_page->post_name : null,
				'content' => $front_page ? (string) $front_page->post_content : '',
				'contentLength' => $front_page ? strlen( $front_page->post_content ) : 0,
				'templateSource' => $front_template ? $front_template->source : null,
				'templateId' => $front_template ? $front_template->id : null,
			);

			foreach ( array(
				${ trackedPageTargets }
			) as $target ) {
				$page = get_page_by_path( $target['path'], OBJECT, 'page' );
				$template = ! empty( $target['template'] )
					? get_block_template( 'hperkins-tokens//' . $target['template'], 'wp_template' )
					: null;

				$result['pages'][ $target['key'] ] = array(
					'path' => $target['path'],
					'id' => $page ? (int) $page->ID : 0,
					'content' => $page ? (string) $page->post_content : '',
					'contentLength' => $page ? strlen( $page->post_content ) : 0,
					'templateSource' => $template ? $template->source : null,
					'templateId' => $template ? $template->id : null,
				);
			}

			foreach ( array(
				${ retiredPageTargets }
			) as $target ) {
				$page = get_page_by_path( $target['path'], OBJECT, 'page' );
				$result['retiredPages'][ $target['key'] ] = array(
					'path' => $target['path'],
					'id' => $page ? (int) $page->ID : 0,
					'status' => $page ? $page->post_status : null,
				);
			}

			echo wp_json_encode( $result );
		` )
	);
}

function getSha256( value ) {
	return crypto.createHash( 'sha256' ).update( value ).digest( 'hex' );
}

function verifySnapshot( contract, page ) {
	const snapshotPath = path.join( SNAPSHOT_DIR, contract.snapshotFile );
	assert(
		fs.existsSync( snapshotPath ),
		`Expected snapshot ${ path.relative( THEME_PATH, snapshotPath ) } for the ${ contract.label }. Run node scripts/export-page-snapshots.js.`
	);

	const snapshot = normalizeContent( fs.readFileSync( snapshotPath, 'utf8' ) );
	const liveContent = normalizeContent( page.content );

	assert(
		snapshot === liveContent,
		[
			`${ contract.label } no longer matches its versioned snapshot ${ path.relative( THEME_PATH, snapshotPath ) }.`,
			`live   sha256: ${ getSha256( liveContent ) }`,
			`stored sha256: ${ getSha256( snapshot ) }`,
			'If the DB body change is intentional, re-export with node scripts/export-page-snapshots.js.',
		].join( '\n' )
	);
}

function verifyTrackedMarkup( contract, page ) {
	const liveContent = normalizeContent( page.content );

	assert(
		! /<blockquote\b[^>]*>\s*<\/blockquote>/.test( liveContent ),
		`Expected the ${ contract.label } to avoid empty blockquote markup.`
	);

	if ( contract.key === 'front-page' ) {
		assert(
			! liveContent.includes( 'hp-wapuu-hero__figure' ) && ! liveContent.includes( 'hp-ring-card__figure' ),
			'Expected the front page DB body to avoid theme-owned hero/ring asset markup.'
		);
	}
}

function verifyPageOwnership( state, contract ) {
	const page = getPageRecord( state, contract );

	assert(
		page && page.id > 0,
		`Expected a live ${ contract.label } for ${ contract.templateId || contract.pagePath }.`
	);
	assert(
		page.contentLength > 0,
		`Expected the ${ contract.label } to keep visitor-facing body content in post_content.`
	);

	if ( contract.templateFile && contract.templateId ) {
		const template = readTemplate( contract.templateFile );

		assert(
			page.templateSource === 'theme',
			`Expected "${ contract.templateId }" to resolve from the theme, got ${ page.templateSource || 'none' }.`
		);
		assert(
			template.includes( '<!-- wp:post-content' ),
			`Expected ${ contract.templateFile } to render wp:post-content.`
		);
	}

	verifyTrackedMarkup( contract, page );
	verifySnapshot( contract, page );
}

function verifyNavigationItem( actual, expected, context ) {
	assert( actual, `Expected ${ context } to exist.` );
	for ( const field of [ 'blockName', 'label', 'url', 'className' ] ) {
		assert(
			actual[ field ] === expected[ field ],
			`Expected ${ context } ${ field }=${ JSON.stringify( expected[ field ] ) }, got ${ JSON.stringify( actual[ field ] ) }.`
		);
	}
}

function verifyNavigationOwnership( state ) {
	const navigation = state.navigation;
	assert( navigation && navigation.id === NAVIGATION_POST_ID, 'Expected navigation post 237 to exist.' );
	assert( navigation.type === 'wp_navigation', `Expected post 237 to be wp_navigation, got ${ navigation.type || 'none' }.` );
	assert( navigation.status === 'publish', `Expected navigation post 237 to be published, got ${ navigation.status || 'none' }.` );
	assert(
		navigation.items.length === EXPECTED_COUNCIL_SHAPE.length,
		`Expected navigation post 237 to contain ${ EXPECTED_COUNCIL_SHAPE.length } top-level Council items, got ${ navigation.items.length }.`
	);

	EXPECTED_COUNCIL_SHAPE.forEach( ( expected, index ) => {
		verifyNavigationItem( navigation.items[ index ], expected, `navigation item ${ index + 1 } (${ expected.key })` );
	} );

	const writing = navigation.items[ 1 ];
	assert(
		writing.children.length === EXPECTED_WRITING_CHILDREN.length,
		`Expected Writing to contain ${ EXPECTED_WRITING_CHILDREN.length } children, got ${ writing.children.length }.`
	);
	EXPECTED_WRITING_CHILDREN.forEach( ( expected, index ) => {
		const child = writing.children[ index ];
		verifyNavigationItem( child, expected, `Writing child ${ index + 1 } (${ expected.label })` );
		assert( child.children.length === 0, `Expected Writing child ${ index + 1 } (${ expected.label }) to have no children.` );
	} );

	for ( const [ index, item ] of navigation.items.entries() ) {
		if ( index !== 1 ) {
			assert( item.children.length === 0, `Expected navigation item ${ index + 1 } (${ item.label || item.blockName }) to have no children.` );
		}
	}

	assert(
		fs.existsSync( NAVIGATION_SNAPSHOT_PATH ),
		`Expected navigation snapshot ${ path.relative( THEME_PATH, NAVIGATION_SNAPSHOT_PATH ) }. Run node scripts/export-navigation-snapshot.js.`
	);
	const liveContent = normalizeNavigationContent( navigation.content, navigation.home );
	const snapshot = normalizeNavigationContent( fs.readFileSync( NAVIGATION_SNAPSHOT_PATH, 'utf8' ), navigation.home );
	assert(
		liveContent === snapshot,
		[
			`Navigation post 237 no longer matches ${ path.relative( THEME_PATH, NAVIGATION_SNAPSHOT_PATH ) }.`,
			`live   sha256: ${ getSha256( liveContent ) }`,
			`stored sha256: ${ getSha256( snapshot ) }`,
			'If the DB navigation change is intentional, re-export with node scripts/export-navigation-snapshot.js.',
		].join( '\n' )
	);
}

function main() {
	const state = getOwnershipState();

	assert(
		state.frontPageMode === 'page',
		`Expected show_on_front=page, got ${ state.frontPageMode || 'none' }.`
	);

	for ( const contract of RETIRED_PAGE_PATHS ) {
		const page = state.retiredPages[ contract.key ];
		assert(
			page && page.id === 0,
			`Expected the retired ${ contract.label } at "${ contract.pagePath }" to be absent, found post ${ page?.id || 'unknown' } (${ page?.status || 'unknown status' }).`
		);
	}

	verifyNavigationOwnership( state );

	for ( const contract of PAGE_CONTRACTS ) {
		verifyPageOwnership( state, contract );
	}

	console.log( 'Content ownership verified.' );
	console.log(
		PAGE_CONTRACTS.map( ( contract ) => {
			const page = getPageRecord( state, contract );
			return `${ contract.key }:${ page.templateSource }:${ page.contentLength }:${ getSha256( normalizeContent( page.content ) ).slice( 0, 12 ) }`;
		} ).join( '\n' )
	);
}

try {
	main();
} catch ( error ) {
	console.error( error.message );
	process.exit( 1 );
}
