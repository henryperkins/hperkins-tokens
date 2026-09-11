( function ( wp ) {
	'use strict';

	var el = wp.element.createElement;
	var __ = wp.i18n.__;
	var NAME = 'hperkins-tokens/council-header';
	// The global was the component itself on older supported WordPress releases.
	var ServerSideRender = wp.serverSideRender.ServerSideRender || wp.serverSideRender.default || wp.serverSideRender;

	function createHeader() {
		return wp.blocks.createBlock( NAME );
	}

	function Edit( props ) {
		var previewRef = wp.element.useRef( null );
		var preview = wp.element.useState( 'closed' );
		var panel = preview[ 0 ];
		var setPanel = preview[ 1 ];
		var blockProps = wp.blockEditor.useBlockProps( {
			ref: previewRef,
			className: 'hp-council-editor',
			'data-preview-panel': panel,
		} );
		wp.element.useEffect( function () {
			var node = previewRef.current;
			if ( ! node ) { return; }
			var view = node.ownerDocument.defaultView;
			var sizeObserver = new view.ResizeObserver( measure );
			function measure() {
				var root = node.querySelector( '[data-hp-header-root]' );
				if ( ! root ) { node.style.minHeight = ''; return; }
				var bottom = root.getBoundingClientRect().bottom;
				root.querySelectorAll( '[data-hp-header-panel]' ).forEach( function ( surface ) {
					if ( surface.getClientRects().length ) {
						bottom = Math.max( bottom, surface.getBoundingClientRect().bottom );
					}
				} );
				node.style.minHeight = Math.ceil( bottom - node.getBoundingClientRect().top ) + 'px';
			}
			function observeContent() {
				sizeObserver.disconnect();
				node.querySelectorAll( '[data-hp-header-root], [data-hp-header-panel]' ).forEach( function ( item ) { sizeObserver.observe( item ); } );
				measure();
			}
			var contentObserver = new view.MutationObserver( observeContent );
			contentObserver.observe( node, { childList: true, subtree: true } );
			observeContent();
			return function () { sizeObserver.disconnect(); contentObserver.disconnect(); };
		}, [] );
		return el( wp.element.Fragment, null,
			el( wp.blockEditor.InspectorControls, null,
				el( wp.components.PanelBody, { title: __( 'Header preview', 'hperkins-tokens' ) },
					el( wp.components.SelectControl, {
						label: __( 'Show', 'hperkins-tokens' ),
						value: panel,
						onChange: setPanel,
						options: [
							{ label: __( 'Header', 'hperkins-tokens' ), value: 'closed' },
							{ label: __( 'Work panel', 'hperkins-tokens' ), value: 'work' },
							{ label: __( 'Writing panel', 'hperkins-tokens' ), value: 'writing' },
							{ label: __( 'Search panel', 'hperkins-tokens' ), value: 'search' },
							{ label: __( 'Mobile drawer', 'hperkins-tokens' ), value: 'drawer' },
						],
						help: __( 'Preview only. These choices are not saved.', 'hperkins-tokens' ),
						__nextHasNoMarginBottom: true,
					} ),
					el( 'p', null, __( 'Links come from Primary Navigation. The theme controls the header layout and Work evidence.', 'hperkins-tokens' ) ),
					el( 'p', null, __( 'Use the editor’s mobile preview to inspect the drawer.', 'hperkins-tokens' ) )
				)
			),
			el( 'div', blockProps,
				el( wp.components.Disabled, null,
					el( ServerSideRender, {
						block: NAME,
						attributes: Object.assign( {}, props.attributes, { previewPanel: panel, previewId: props.clientId } ),
						ErrorResponsePlaceholder: function () {
							return el( wp.components.Notice, { status: 'error', isDismissible: false }, __( 'The header preview could not load. Reload the editor to try again.', 'hperkins-tokens' ) );
						},
						EmptyResponsePlaceholder: function () {
							return el( wp.components.Notice, { status: 'warning', isDismissible: false }, __( 'The header preview is empty.', 'hperkins-tokens' ) );
						},
					} )
				)
			)
		);
	}

	wp.blocks.registerBlockType( NAME, {
		edit: Edit,
		save: function () { return null; },
		transforms: {
			from: [
				{
					type: 'block',
					blocks: [ 'core/shortcode' ],
					isMatch: function ( attributes ) {
						return typeof attributes.text === 'string' && attributes.text.trim() === '[hperkins_council_header]';
					},
					transform: createHeader,
				},
				{
					type: 'shortcode',
					tag: 'hperkins_council_header',
					isMatch: function ( attributes ) {
						return Object.keys( attributes.named || {} ).length === 0 && ( attributes.numeric || [] ).length === 0;
					},
					transform: createHeader,
				},
			],
		},
	} );
} )( window.wp );
