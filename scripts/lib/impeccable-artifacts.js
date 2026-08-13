const fs = require( 'node:fs' );
const path = require( 'node:path' );

const PRODUCT_SCHEMA_STAMP = '<!-- impeccable:product-schema 1 -->';
// The Impeccable detector reads typography.scale as the enumerated size ramp
// and treats every other typography key as a named role, so the two shapes
// have to stay distinguishable here as well.
const TYPOGRAPHY_SCALE_KEY = 'scale';
// Vendored proof artifacts carry their own captured palette and type. They are
// evidence the theme links to, not surfaces the design system governs.
const DETECTOR_IGNORED_PATHS = [ 'assets/artifacts/**' ];
const DESIGN_HEADINGS = [
	'Overview',
	'Colors',
	'Typography',
	'Layout',
	'Elevation & Depth',
	'Shapes',
	'Components',
	"Do's and Don'ts",
];
const DESIGN_KEYS = [
	'name',
	'description',
	'colors',
	'typography',
	'rounded',
	'spacing',
	'components',
];
const COMPONENT_PROPERTIES = new Set( [
	'backgroundColor',
	'textColor',
	'typography',
	'rounded',
	'padding',
	'size',
	'height',
	'width',
] );

function assert( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

function isRecord( value ) {
	return value !== null && typeof value === 'object' && ! Array.isArray( value );
}

function readFile( root, relative ) {
	const file = path.join( root, relative );
	assert( fs.existsSync( file ), `${ relative } is required.` );
	return fs.readFileSync( file, 'utf8' ).replace( /\r\n?/g, '\n' );
}

function readJson( root, relative ) {
	const source = readFile( root, relative );
	try {
		return JSON.parse( source );
	} catch ( error ) {
		throw new Error( `${ relative } is not valid JSON: ${ error.message }` );
	}
}

function sortedKeys( value ) {
	return Object.keys( value ).sort();
}

function assertExactKeys( value, expected, label ) {
	assert( isRecord( value ), `${ label } must be an object.` );
	const actual = sortedKeys( value );
	const wanted = [ ...expected ].sort();
	assert(
		JSON.stringify( actual ) === JSON.stringify( wanted ),
		`${ label } keys must be exactly: ${ wanted.join( ', ' ) }; found: ${ actual.join( ', ' ) || '(none)' }.`
	);
}

function parseScalar( source, lineNumber ) {
	if ( source.startsWith( '"' ) ) {
		try {
			return JSON.parse( source );
		} catch ( error ) {
			throw new Error( `DESIGN.md frontmatter line ${ lineNumber } has an invalid quoted value: ${ error.message }` );
		}
	}
	if ( /^(?:-?\d+(?:\.\d+)?|-?\.\d+)$/.test( source ) ) {
		return Number( source );
	}
	if ( source === 'true' ) {
		return true;
	}
	if ( source === 'false' ) {
		return false;
	}
	if ( source === 'null' ) {
		return null;
	}
	return source;
}

function parseFrontmatterMap( lines ) {
	const root = {};
	const stack = [ { indent: -2, value: root } ];

	for ( let index = 0; index < lines.length; index++ ) {
		const line = lines[ index ];
		if ( line.trim() === '' || line.trimStart().startsWith( '#' ) ) {
			continue;
		}
		assert( ! line.includes( '\t' ), `DESIGN.md frontmatter line ${ index + 2 } must use spaces, not tabs.` );
		const match = line.match( /^( *)(?:"((?:\\.|[^"\\])*)"|([A-Za-z0-9_-]+)):\s*(.*)$/ );
		assert( match, `DESIGN.md frontmatter line ${ index + 2 } is outside the supported map-and-scalar format.` );
		const indent = match[ 1 ].length;
		assert( indent % 2 === 0, `DESIGN.md frontmatter line ${ index + 2 } must use two-space indentation.` );
		while ( stack[ stack.length - 1 ].indent >= indent ) {
			stack.pop();
		}
		const parent = stack[ stack.length - 1 ];
		assert( parent, `DESIGN.md frontmatter line ${ index + 2 } has invalid indentation.` );
		assert(
			indent === parent.indent + 2,
			`DESIGN.md frontmatter line ${ index + 2 } skips an indentation level.`
		);
		const key = match[ 2 ] === undefined
			? match[ 3 ]
			: JSON.parse( `"${ match[ 2 ] }"` );
		assert(
			! Object.prototype.hasOwnProperty.call( parent.value, key ),
			`DESIGN.md frontmatter line ${ index + 2 } repeats ${ key }.`
		);
		const rawValue = match[ 4 ];
		if ( rawValue === '' ) {
			parent.value[ key ] = {};
			stack.push( { indent, value: parent.value[ key ] } );
		} else {
			parent.value[ key ] = parseScalar( rawValue, index + 2 );
		}
	}

	return root;
}

function parseDesign( source ) {
	const lines = source.split( '\n' );
	assert( lines[ 0 ] === '---', 'DESIGN.md must begin with YAML frontmatter.' );
	const frontmatterEnd = lines.indexOf( '---', 1 );
	assert( frontmatterEnd > 1, 'DESIGN.md frontmatter must have a closing delimiter.' );
	const frontmatter = parseFrontmatterMap( lines.slice( 1, frontmatterEnd ) );
	const body = lines.slice( frontmatterEnd + 1 ).join( '\n' ).trim();
	return { frontmatter, body };
}

function collectReferences( value, location, references ) {
	if ( typeof value === 'string' ) {
		for ( const match of value.matchAll( /\{([^{}\s]+)\}/g ) ) {
			references.push( { location, tokenPath: match[ 1 ] } );
		}
		return;
	}
	if ( ! isRecord( value ) ) {
		return;
	}
	for ( const [ key, child ] of Object.entries( value ) ) {
		collectReferences( child, location ? `${ location }.${ key }` : key, references );
	}
}

function resolvePath( root, tokenPath ) {
	let current = root;
	for ( const segment of tokenPath.split( '.' ) ) {
		if ( ! isRecord( current ) || ! Object.prototype.hasOwnProperty.call( current, segment ) ) {
			return undefined;
		}
		current = current[ segment ];
	}
	return current;
}

function assertTokenReferences( frontmatter ) {
	const references = [];
	collectReferences( frontmatter, '', references );
	for ( const reference of references ) {
		assert(
			resolvePath( frontmatter, reference.tokenPath ) !== undefined,
			`DESIGN.md ${ reference.location } contains unresolved token reference {${ reference.tokenPath }}.`
		);
	}
}

function collectScalarStrings( value, strings ) {
	if ( typeof value === 'string' ) {
		strings.add( value.toLowerCase() );
		return;
	}
	if ( Array.isArray( value ) ) {
		for ( const child of value ) {
			collectScalarStrings( child, strings );
		}
		return;
	}
	if ( isRecord( value ) ) {
		for ( const child of Object.values( value ) ) {
			collectScalarStrings( child, strings );
		}
	}
}

function assertMapParity( actual, expected, label ) {
	assertExactKeys( actual, Object.keys( expected ), label );
	for ( const [ key, value ] of Object.entries( expected ) ) {
		assert( actual[ key ] === value, `${ label }.${ key } must equal ${ JSON.stringify( value ) }.` );
	}
}

function assertThemeParity( frontmatter, theme ) {
	const themeStrings = new Set();
	collectScalarStrings( theme, themeStrings );
	for ( const [ name, value ] of Object.entries( frontmatter.colors ) ) {
		assert(
			themeStrings.has( String( value ).toLowerCase() ),
			`DESIGN.md colors.${ name } (${ value }) is not present in theme.json.`
		);
	}

	const fontSizes = theme.settings && theme.settings.typography && theme.settings.typography.fontSizes;
	assert( Array.isArray( fontSizes ), 'theme.json settings.typography.fontSizes must be an array.' );
	const themeScale = {};
	for ( const entry of fontSizes ) {
		assert(
			isRecord( entry ) && typeof entry.slug === 'string' && typeof entry.size === 'string',
			'theme.json font-size entries must provide string slug and size values.'
		);
		assert(
			! Object.prototype.hasOwnProperty.call( themeScale, entry.slug ),
			`theme.json repeats font-size slug ${ entry.slug }.`
		);
		themeScale[ entry.slug ] = entry.size;
	}
	assertMapParity( themeScale, frontmatter.typography[ TYPOGRAPHY_SCALE_KEY ], 'theme.json settings.typography.fontSizes' );

	const themeRadius = theme.settings && theme.settings.custom && theme.settings.custom.radius;
	assertMapParity( themeRadius, frontmatter.rounded, 'theme.json settings.custom.radius' );

	const spacingSizes = theme.settings && theme.settings.spacing && theme.settings.spacing.spacingSizes;
	assert( Array.isArray( spacingSizes ), 'theme.json settings.spacing.spacingSizes must be an array.' );
	const themeSpacing = {};
	for ( const entry of spacingSizes ) {
		assert(
			isRecord( entry ) && typeof entry.slug === 'string' && typeof entry.size === 'string',
			'theme.json spacing entries must provide string slug and size values.'
		);
		assert( ! Object.prototype.hasOwnProperty.call( themeSpacing, entry.slug ), `theme.json repeats spacing slug ${ entry.slug }.` );
		themeSpacing[ entry.slug ] = entry.size;
	}
	assertMapParity( themeSpacing, frontmatter.spacing, 'theme.json settings.spacing.spacingSizes' );
}

function markdownNarrative( body ) {
	const northStarMatch = body.match( /^\*\*Creative North Star: "([^"]+)"\*\*$/m );
	assert( northStarMatch, 'DESIGN.md Overview must declare a Creative North Star.' );
	const keyMarker = '**Key Characteristics:**';
	const keyMarkerIndex = body.indexOf( keyMarker, northStarMatch.index + northStarMatch[ 0 ].length );
	assert( keyMarkerIndex !== -1, 'DESIGN.md Overview must declare Key Characteristics.' );
	const overview = body
		.slice( northStarMatch.index + northStarMatch[ 0 ].length, keyMarkerIndex )
		.trim();
	const colorsIndex = body.indexOf( '\n## Colors', keyMarkerIndex );
	assert( colorsIndex !== -1, 'DESIGN.md must place Colors after the Overview.' );
	const keyCharacteristics = body
		.slice( keyMarkerIndex + keyMarker.length, colorsIndex )
		.split( '\n' )
		.map( ( line ) => line.trim() )
		.filter( ( line ) => line.startsWith( '- ' ) )
		.map( ( line ) => line.slice( 2 ) );

	const rules = [];
	for ( const match of body.matchAll( /^\*\*([^*\n]+ Rule)\.\*\*\s+(.+)$/gm ) ) {
		rules.push( { name: match[ 1 ], body: match[ 2 ] } );
	}

	const dos = [];
	const donts = [];
	for ( const match of body.matchAll( /^-\s+\*\*(Do|Don't)\*\*\s+(.+)$/gm ) ) {
		const item = `${ match[ 1 ] } ${ match[ 2 ] }`;
		if ( match[ 1 ] === 'Do' ) {
			dos.push( item );
		} else {
			donts.push( item );
		}
	}

	return {
		northStar: northStarMatch[ 1 ],
		overview,
		keyCharacteristics,
		rules,
		dos,
		donts,
	};
}

function assertArrayParity( actual, expected, label ) {
	assert( Array.isArray( actual ), `${ label } must be an array.` );
	assert(
		JSON.stringify( actual ) === JSON.stringify( expected ),
		`${ label } must match DESIGN.md exactly.`
	);
}

function assertNarrativeParity( body, narrative ) {
	assert( isRecord( narrative ), '.impeccable/design.json narrative must be an object.' );
	const expected = markdownNarrative( body );
	assert( narrative.northStar === expected.northStar, '.impeccable/design.json narrative.northStar must match DESIGN.md.' );
	assert( narrative.overview === expected.overview, '.impeccable/design.json narrative.overview must match DESIGN.md.' );
	assertArrayParity( narrative.keyCharacteristics, expected.keyCharacteristics, '.impeccable/design.json narrative.keyCharacteristics' );
	const rules = Array.isArray( narrative.rules )
		? narrative.rules.map( ( rule ) => ( { name: rule.name, body: rule.body } ) )
		: narrative.rules;
	assertArrayParity( rules, expected.rules, '.impeccable/design.json narrative.rules' );
	assertArrayParity( narrative.dos, expected.dos, '.impeccable/design.json narrative.dos' );
	assertArrayParity( narrative.donts, expected.donts, '.impeccable/design.json narrative.donts' );
}

function extractHtmlClasses( html ) {
	const classes = [];
	for ( const match of html.matchAll( /\bclass\s*=\s*(["'])(.*?)\1/gs ) ) {
		classes.push( ...match[ 2 ].split( /\s+/ ).filter( Boolean ) );
	}
	return classes;
}

function extractCssClasses( css ) {
	return [ ...css.matchAll( /\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g ) ].map( ( match ) => match[ 1 ] );
}

function assertBalancedCss( css, componentName ) {
	let depth = 0;
	for ( const character of css ) {
		if ( character === '{' ) {
			depth++;
		} else if ( character === '}' ) {
			depth--;
			assert( depth >= 0, `.impeccable/design.json component ${ componentName } has an unmatched CSS closing brace.` );
		}
	}
	assert( depth === 0, `.impeccable/design.json component ${ componentName } has unbalanced CSS braces.` );
}

function assertPreviewComponents( previews, designComponents ) {
	assert( Array.isArray( previews ), '.impeccable/design.json components must be an array.' );
	assert( previews.length >= 5 && previews.length <= 10, '.impeccable/design.json must provide between 5 and 10 component previews.' );
	const names = new Set();
	for ( const preview of previews ) {
		assert( isRecord( preview ), '.impeccable/design.json component previews must be objects.' );
		assert( typeof preview.name === 'string' && preview.name.trim() !== '', 'Every sidecar component preview needs a name.' );
		assert( ! names.has( preview.name ), `.impeccable/design.json repeats component preview name ${ preview.name }.` );
		names.add( preview.name );
		assert(
			typeof preview.refersTo === 'string' && Object.prototype.hasOwnProperty.call( designComponents, preview.refersTo ),
			`.impeccable/design.json component ${ preview.name } refers to unknown DESIGN.md component ${ preview.refersTo }.`
		);
		assert( typeof preview.html === 'string' && preview.html.trim() !== '', `.impeccable/design.json component ${ preview.name } needs HTML.` );
		assert( typeof preview.css === 'string' && preview.css.trim() !== '', `.impeccable/design.json component ${ preview.name } needs CSS.` );
		assert( ! /<img\b/i.test( preview.html ), `.impeccable/design.json component ${ preview.name } must not embed an image.` );
		assert( ! /https?:\/\//i.test( preview.html ), `.impeccable/design.json component ${ preview.name } must not use an external URL.` );
		const classes = [ ...extractHtmlClasses( preview.html ), ...extractCssClasses( preview.css ) ];
		assert( classes.length > 0, `.impeccable/design.json component ${ preview.name } must use scoped classes.` );
		for ( const className of classes ) {
			assert(
				className.startsWith( 'ds-' ),
				`.impeccable/design.json component ${ preview.name } uses unscoped class ${ className }; use the ds- prefix.`
			);
		}
		assertBalancedCss( preview.css, preview.name );
		if ( [ 'button', 'input', 'nav' ].includes( preview.kind ) ) {
			assert(
				/:focus-(?:visible|within)\b/.test( preview.css ),
				`.impeccable/design.json ${ preview.kind } component ${ preview.name } needs an explicit focus-visible or focus-within style.`
			);
		}
	}
}

function assertSidecar( sidecar, frontmatter, body ) {
	assert( isRecord( sidecar ), '.impeccable/design.json must contain an object.' );
	assert( sidecar.schemaVersion === 2, '.impeccable/design.json schemaVersion must be 2.' );
	assert(
		typeof sidecar.generatedAt === 'string' && ! Number.isNaN( Date.parse( sidecar.generatedAt ) ),
		'.impeccable/design.json generatedAt must be a valid timestamp.'
	);
	assert(
		sidecar.title === `Design System: ${ frontmatter.name }`,
		'.impeccable/design.json title must match the DESIGN.md name.'
	);
	assert( isRecord( sidecar.extensions ), '.impeccable/design.json extensions must be an object.' );
	const colorMeta = sidecar.extensions.colorMeta;
	assertExactKeys( colorMeta, Object.keys( frontmatter.colors ), '.impeccable/design.json extensions.colorMeta' );
	for ( const [ name, color ] of Object.entries( frontmatter.colors ) ) {
		const metadata = colorMeta[ name ];
		assert( isRecord( metadata ), `.impeccable/design.json color metadata ${ name } must be an object.` );
		assert( metadata.canonical === color, `.impeccable/design.json color metadata ${ name } must use canonical value ${ color }.` );
		assert(
			Array.isArray( metadata.tonalRamp ) && metadata.tonalRamp.length === 8,
			`.impeccable/design.json color metadata ${ name } must provide an eight-step tonalRamp.`
		);
	}
	const typographyMeta = sidecar.extensions.typographyMeta;
	assert( isRecord( typographyMeta ) && Object.keys( typographyMeta ).length > 0, '.impeccable/design.json extensions.typographyMeta must be a non-empty object.' );
	for ( const name of Object.keys( typographyMeta ) ) {
		assert(
			Object.prototype.hasOwnProperty.call( frontmatter.typography, name ),
			`.impeccable/design.json typography metadata ${ name } has no DESIGN.md typography token.`
		);
	}
	for ( const key of [ 'shadows', 'motion', 'breakpoints' ] ) {
		assert(
			Array.isArray( sidecar.extensions[ key ] ) && sidecar.extensions[ key ].length > 0,
			`.impeccable/design.json extensions.${ key } must be a non-empty array.`
		);
	}
	assertPreviewComponents( sidecar.components, frontmatter.components );
	assertNarrativeParity( body, sidecar.narrative );
}

function assertDesignStructure( frontmatter, body ) {
	assertExactKeys( frontmatter, DESIGN_KEYS, 'DESIGN.md frontmatter' );
	assert( typeof frontmatter.name === 'string' && frontmatter.name.trim() !== '', 'DESIGN.md name must be a non-empty string.' );
	assert( typeof frontmatter.description === 'string' && frontmatter.description.trim() !== '', 'DESIGN.md description must be a non-empty string.' );
	for ( const key of [ 'colors', 'typography', 'rounded', 'spacing', 'components' ] ) {
		assert( isRecord( frontmatter[ key ] ) && Object.keys( frontmatter[ key ] ).length > 0, `DESIGN.md ${ key } must be a non-empty map.` );
	}
	const scale = frontmatter.typography[ TYPOGRAPHY_SCALE_KEY ];
	assert(
		isRecord( scale ) && Object.keys( scale ).length > 0,
		`DESIGN.md typography.${ TYPOGRAPHY_SCALE_KEY } must mirror the theme.json font-size ramp.`
	);
	for ( const [ step, size ] of Object.entries( scale ) ) {
		assert(
			typeof size === 'string' && size.trim() !== '',
			`DESIGN.md typography.${ TYPOGRAPHY_SCALE_KEY }.${ step } must be a non-empty size string.`
		);
	}
	for ( const [ name, role ] of Object.entries( frontmatter.typography ) ) {
		if ( name === TYPOGRAPHY_SCALE_KEY ) {
			continue;
		}
		assert(
			isRecord( role ),
			`DESIGN.md typography.${ name } must be a role map; only ${ TYPOGRAPHY_SCALE_KEY } carries bare size values.`
		);
	}
	const headings = [ ...body.matchAll( /^## (.+)$/gm ) ].map( ( match ) => match[ 1 ] );
	assert(
		JSON.stringify( headings ) === JSON.stringify( DESIGN_HEADINGS ),
		`DESIGN.md H2 headings must be exactly: ${ DESIGN_HEADINGS.join( ' -> ' ) }.`
	);
	assert( body.includes( `# Design System: ${ frontmatter.name }` ), 'DESIGN.md title must match its frontmatter name.' );
	for ( const [ name, component ] of Object.entries( frontmatter.components ) ) {
		assert( isRecord( component ), `DESIGN.md components.${ name } must be a map.` );
		for ( const property of Object.keys( component ) ) {
			assert(
				COMPONENT_PROPERTIES.has( property ),
				`DESIGN.md components.${ name } uses unsupported property ${ property }.`
			);
		}
	}
	assertTokenReferences( frontmatter );
}

function assertHookConfiguration( config ) {
	assert( isRecord( config.hook ) && config.hook.enabled === true, '.impeccable/config.json must enable the design hook.' );
	const extensions = config.detector && config.detector.extensions;
	assert( Array.isArray( extensions ), '.impeccable/config.json must declare detector.extensions.' );
	assert(
		extensions.some( ( extension ) => extension && extension.ext === '.php' && extension.engine === 'html' ),
		'.impeccable/config.json detector.extensions must scan .php files with the html engine.'
	);
	const ignoreFiles = config.detector && config.detector.ignoreFiles;
	assert( Array.isArray( ignoreFiles ), '.impeccable/config.json must declare detector.ignoreFiles.' );
	for ( const pattern of DETECTOR_IGNORED_PATHS ) {
		assert(
			ignoreFiles.includes( pattern ),
			`.impeccable/config.json detector.ignoreFiles must keep ${ pattern } out of the design scan.`
		);
	}
}

function verifyImpeccableArtifacts( root ) {
	assert( typeof root === 'string' && root.trim() !== '', 'A repository root is required.' );
	const product = readFile( root, 'PRODUCT.md' );
	assert( product.includes( PRODUCT_SCHEMA_STAMP ), `PRODUCT.md must include ${ PRODUCT_SCHEMA_STAMP }.` );
	const { frontmatter, body } = parseDesign( readFile( root, 'DESIGN.md' ) );
	assertDesignStructure( frontmatter, body );
	assertThemeParity( frontmatter, readJson( root, 'theme.json' ) );
	const sidecar = readJson( root, '.impeccable/design.json' );
	assertSidecar( sidecar, frontmatter, body );
	assertHookConfiguration( readJson( root, '.impeccable/config.json' ) );

	return {
		colors: Object.keys( frontmatter.colors ).length,
		typography: Object.keys( frontmatter.typography ).filter(
			( name ) => name !== TYPOGRAPHY_SCALE_KEY
		).length,
		typographyScale: Object.keys( frontmatter.typography[ TYPOGRAPHY_SCALE_KEY ] ).length,
		componentTokens: Object.keys( frontmatter.components ).length,
		previews: sidecar.components.length,
	};
}

module.exports = {
	verifyImpeccableArtifacts,
};
