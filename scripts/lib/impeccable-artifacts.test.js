const fs = require( 'node:fs' );
const os = require( 'node:os' );
const path = require( 'node:path' );
const { spawnSync } = require( 'node:child_process' );
const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );

const { verifyImpeccableArtifacts } = require( './impeccable-artifacts' );

const themeRoot = path.join( __dirname, '..', '..' );
const fixtureFiles = [
	'PRODUCT.md',
	'DESIGN.md',
	'theme.json',
	'.impeccable/design.json',
	'.impeccable/config.json',
];

function createFixture( t ) {
	const root = fs.mkdtempSync( path.join( os.tmpdir(), 'hperkins-impeccable-' ) );
	fs.mkdirSync( path.join( root, '.impeccable' ) );
	for ( const file of fixtureFiles ) {
		fs.copyFileSync( path.join( themeRoot, file ), path.join( root, file ) );
	}
	t.after( () => fs.rmSync( root, { recursive: true, force: true } ) );
	return root;
}

function replaceOnce( source, search, replacement ) {
	const changed = source.replace( search, replacement );
	assert.notEqual( changed, source, `Fixture mutation must replace ${ search }.` );
	return changed;
}

function mutateJson( root, relative, mutate ) {
	const file = path.join( root, relative );
	const value = JSON.parse( fs.readFileSync( file, 'utf8' ) );
	mutate( value );
	fs.writeFileSync( file, `${ JSON.stringify( value, null, 2 ) }\n` );
}

test( 'accepts the checked-in Impeccable contract', () => {
	assert.deepEqual( verifyImpeccableArtifacts( themeRoot ), {
		colors: 29,
		typography: 11,
		typographyScale: 11,
		componentTokens: 18,
		previews: 10,
	} );
} );

test( 'reports the checked-in contract through the CLI', () => {
	const result = spawnSync(
		process.execPath,
		[ path.join( themeRoot, 'scripts', 'verify-impeccable-artifacts.js' ) ],
		{ cwd: themeRoot, encoding: 'utf8' }
	);
	assert.equal( result.status, 0, result.stderr );
	assert.match(
		result.stdout,
		/verified Impeccable artifacts: 29 colors, 11 typography roles, 11 type-scale steps, 18 component tokens, 10 previews/
	);
} );

test( 'rejects a malformed shorthand token reference', ( t ) => {
	const root = createFixture( t );
	const designFile = path.join( root, 'DESIGN.md' );
	const design = fs.readFileSync( designFile, 'utf8' );
	fs.writeFileSync(
		designFile,
		replaceOnce( design, '{colors.primary}', '{primary}' )
	);
	assert.throws(
		() => verifyImpeccableArtifacts( root ),
		/unresolved token reference \{primary\}/i
	);
} );

test( 'rejects a missing PRODUCT schema stamp', ( t ) => {
	const root = createFixture( t );
	const productFile = path.join( root, 'PRODUCT.md' );
	const product = fs.readFileSync( productFile, 'utf8' );
	fs.writeFileSync(
		productFile,
		replaceOnce( product, '<!-- impeccable:product-schema 1 -->', '<!-- product-schema 1 -->' )
	);
	assert.throws(
		() => verifyImpeccableArtifacts( root ),
		/PRODUCT\.md must include.*impeccable:product-schema 1/i
	);
} );

test( 'rejects DESIGN heading drift', ( t ) => {
	const root = createFixture( t );
	const designFile = path.join( root, 'DESIGN.md' );
	const design = fs.readFileSync( designFile, 'utf8' );
	fs.writeFileSync( designFile, replaceOnce( design, '## Shapes', '## Shape Language' ) );
	assert.throws(
		() => verifyImpeccableArtifacts( root ),
		/DESIGN\.md H2 headings must be exactly/i
	);
} );

test( 'rejects a DESIGN color missing from theme.json', ( t ) => {
	const root = createFixture( t );
	const themeFile = path.join( root, 'theme.json' );
	const theme = fs.readFileSync( themeFile, 'utf8' );
	const changed = theme.replaceAll( '#2E4A3A', '#010203' );
	assert.notEqual( changed, theme, 'Fixture mutation must replace the primary color.' );
	fs.writeFileSync( themeFile, changed );
	assert.throws(
		() => verifyImpeccableArtifacts( root ),
		/DESIGN\.md colors\.primary.*is not present in theme\.json/i
	);
} );

test( 'rejects hook configuration without PHP template coverage', ( t ) => {
	const root = createFixture( t );
	mutateJson( root, '.impeccable/config.json', ( config ) => {
		config.detector.extensions = [];
	} );
	assert.throws(
		() => verifyImpeccableArtifacts( root ),
		/detector\.extensions must scan \.php files with the html engine/i
	);
} );

test( 'rejects an unscoped component preview class', ( t ) => {
	const root = createFixture( t );
	mutateJson( root, '.impeccable/design.json', ( sidecar ) => {
		sidecar.components[ 0 ].html = replaceOnce(
			sidecar.components[ 0 ].html,
			'ds-button-primary',
			'button-primary'
		);
	} );
	assert.throws(
		() => verifyImpeccableArtifacts( root ),
		/uses unscoped class button-primary/i
	);
} );

test( 'rejects narrative drift between DESIGN.md and the generated sidecar', ( t ) => {
	const root = createFixture( t );
	mutateJson( root, '.impeccable/design.json', ( sidecar ) => {
		sidecar.narrative.northStar = 'A Different Direction';
	} );
	assert.throws(
		() => verifyImpeccableArtifacts( root ),
		/narrative\.northStar must match DESIGN\.md/i
	);
} );

test( 'rejects a type-scale step that drifts from theme.json', ( t ) => {
	const root = createFixture( t );
	mutateJson( root, 'theme.json', ( theme ) => {
		const step = theme.settings.typography.fontSizes.find( ( entry ) => entry.slug === 'lg' );
		step.size = '1.5rem';
	} );
	assert.throws(
		() => verifyImpeccableArtifacts( root ),
		/settings\.typography\.fontSizes\.lg must equal "1\.375rem"/i
	);
} );

test( 'rejects a theme.json type-scale step missing from DESIGN.md', ( t ) => {
	const root = createFixture( t );
	mutateJson( root, 'theme.json', ( theme ) => {
		theme.settings.typography.fontSizes.push( { slug: '6xl', size: '6rem', name: '6XL' } );
	} );
	assert.throws(
		() => verifyImpeccableArtifacts( root ),
		/settings\.typography\.fontSizes keys must be exactly/i
	);
} );

test( 'rejects a bare size value smuggled in beside the typography roles', ( t ) => {
	const root = createFixture( t );
	const designFile = path.join( root, 'DESIGN.md' );
	const design = fs.readFileSync( designFile, 'utf8' );
	fs.writeFileSync(
		designFile,
		replaceOnce( design, '  scale:\n', '  caption: "0.75rem"\n  scale:\n' )
	);
	assert.throws(
		() => verifyImpeccableArtifacts( root ),
		/typography\.caption must be a role map/i
	);
} );

test( 'rejects detector configuration that scans vendored artifacts', ( t ) => {
	const root = createFixture( t );
	mutateJson( root, '.impeccable/config.json', ( config ) => {
		config.detector.ignoreFiles = [];
	} );
	assert.throws(
		() => verifyImpeccableArtifacts( root ),
		/ignoreFiles must keep assets\/artifacts\/\*\* out of the design scan/i
	);
} );
