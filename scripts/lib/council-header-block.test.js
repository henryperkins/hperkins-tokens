const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const vm = require( 'node:vm' );

const root = path.join( __dirname, '..', '..' );
const editorPath = path.join( root, 'blocks/council-header/editor.js' );

function loadEditor() {
	assert.ok( fs.existsSync( editorPath ), 'Council Header editor implementation is missing.' );
	let settings;
	let state = 'closed';
	const element = ( type, props, ...children ) => ( { type, props: props || {}, children } );
	const wp = {
		blocks: {
			registerBlockType: ( name, value ) => { settings = { name, ...value }; },
			createBlock: ( name, attributes = {} ) => ( { name, attributes } ),
		},
		element: { createElement: element, Fragment: 'Fragment', useState: () => [ state, ( value ) => { state = value; } ], useRef: () => ( { current: null } ), useEffect: () => {} },
		blockEditor: { useBlockProps: ( props ) => props, InspectorControls: 'InspectorControls' },
		components: { PanelBody: 'PanelBody', SelectControl: 'SelectControl', Notice: 'Notice', Button: 'Button', Disabled: 'Disabled' },
		serverSideRender: 'ServerSideRender',
		i18n: { __: ( value ) => value },
	};
	vm.runInNewContext( fs.readFileSync( editorPath, 'utf8' ), { window: { wp }, wp } );
	return { settings, getState: () => state };
}

function nodes( tree ) {
	if ( ! tree || typeof tree !== 'object' ) return [];
	return [ tree, ...( tree.children || [] ).flatMap( ( child ) => Array.isArray( child ) ? child.flatMap( nodes ) : nodes( child ) ) ];
}

test( 'converts only a dedicated Council shortcode, preserving other shortcode content', () => {
	const { settings } = loadEditor();
	const fromBlock = settings.transforms.from.find( ( item ) => item.type === 'block' );
	assert.equal( settings.name, 'hperkins-tokens/council-header' );
	assert.equal( fromBlock.isMatch( { text: '\n[hperkins_council_header]\n' } ), true );
	for ( const text of [ '[gallery]', 'Before [hperkins_council_header]', '[hperkins_council_header] [gallery]', '[hperkins_council_header extra="1"]' ] ) {
		assert.equal( fromBlock.isMatch( { text } ), false, text );
	}
	assert.equal( fromBlock.transform().name, 'hperkins-tokens/council-header' );
	const fromShortcode = settings.transforms.from.find( ( item ) => item.type === 'shortcode' );
	assert.equal( fromShortcode.tag, 'hperkins_council_header' );
	assert.equal( fromShortcode.isMatch( { named: {}, numeric: [] } ), true );
	assert.equal( fromShortcode.isMatch( { named: { extra: '1' }, numeric: [] } ), false );
	assert.equal( settings.save(), null );
} );

test( 'preview choices remain editor state and never write saved attributes', () => {
	const { settings, getState } = loadEditor();
	const props = { clientId: 'one-block', attributes: { align: 'wide' }, setAttributes: () => assert.fail( 'Preview state must not be saved.' ) };
	let tree = settings.edit( props );
	const selector = nodes( tree ).find( ( node ) => node.type === 'SelectControl' );
	assert.ok( selector, 'The editor must expose a preview selector.' );
	assert.deepEqual( Array.from( selector.props.options, ( option ) => option.value ), [ 'closed', 'work', 'writing', 'search', 'drawer' ] );
	selector.props.onChange( 'writing' );
	assert.equal( getState(), 'writing' );
	tree = settings.edit( props );
	const preview = nodes( tree ).find( ( node ) => node.type === 'ServerSideRender' );
	assert.equal( preview.props.attributes.previewPanel, 'writing' );
	assert.equal( preview.props.attributes.previewId, 'one-block' );
	assert.equal( preview.props.block, settings.name );
	assert.ok( nodes( tree ).some( ( node ) => node.type === 'Disabled' ), 'Preview links and forms must be inert.' );
} );

test( 'the template uses the dynamic block and keeps the header shell', () => {
	const header = fs.readFileSync( path.join( root, 'parts/header.html' ), 'utf8' );
	assert.match( header, /<!-- wp:hperkins-tokens\/council-header \/-->/ );
	assert.match( header, /hp-site-header/ );
	assert.doesNotMatch( header, /wp:shortcode/ );
} );
