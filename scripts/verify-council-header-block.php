<?php
/** Read-only integration assertions; run with WP-CLI eval-file on a local site. */
if ( ! defined( 'ABSPATH' ) ) {
	fwrite( STDERR, "Run through WP-CLI eval-file.\n" );
	exit( 1 );
}

$checks = 0;
$check  = static function ( $condition, $message ) use ( &$checks ) {
	if ( ! $condition ) {
		throw new RuntimeException( $message );
	}
	++$checks;
};
$block_name = 'hperkins-tokens/council-header';
$type       = WP_Block_Type_Registry::get_instance()->get_registered( $block_name );
$check( null !== $type, 'Council Header must be registered on the server.' );
$check( 3 === $type->api_version, 'Council Header must use Block API 3.' );
$check( $type->is_dynamic(), 'The block must render dynamically.' );
$check( ! empty( $type->editor_script_handles ) && ! empty( $type->editor_style_handles ), 'Editor assets must be registered.' );
$check( in_array( 'hperkins-council-editor-theme', $type->editor_style_handles, true ), 'The iframe preview must explicitly load the canonical theme stylesheet.' );

$_SERVER['REQUEST_URI'] = '/about/';
$public = do_blocks( '<!-- wp:hperkins-tokens/council-header /-->' );
$legacy = do_shortcode( '[hperkins_council_header]' );
$check( str_contains( $public, 'wp-block-hperkins-tokens-council-header' ), 'Block wrapper class is missing.' );
$check( 1 === substr_count( $public, 'data-hp-header-root' ), 'The block must produce one header.' );
$check( str_contains( $public, 'aria-current="page"' ), 'Public rendering must preserve current-page indication.' );
$check( str_contains( $legacy, 'data-hp-header-root' ), 'The old shortcode must still render.' );
$check( str_replace( ' wp-block-hperkins-tokens-council-header', '', $public ) === $legacy, 'Public block output must match the existing renderer apart from the native block class.' );
$unsafe = do_shortcode( '[hperkins_council_header wrapper_attributes="onmouseover=alert(1)" current_path="/essays/"]' );
$check( $unsafe === $legacy, 'Shortcode attributes must not become internal rendering options.' );
$forged = do_blocks( '<!-- wp:hperkins-tokens/council-header {"previewPanel":"work","previewId":"forged"} /-->' );
$check( $forged === $public, 'Saved preview attributes must not change public rendering.' );

define( 'REST_REQUEST', true );
$render_preview = static function ( $panel, $id ) use ( $block_name ) {
	return render_block( array(
		'blockName'    => $block_name,
		'attrs'        => array( 'previewPanel' => $panel, 'previewId' => $id ),
		'innerBlocks'  => array(),
		'innerHTML'    => '',
		'innerContent' => array(),
	) );
};
foreach ( array( 'closed', 'work', 'writing', 'search', 'drawer' ) as $panel ) {
	$html = $render_preview( $panel, 'first' );
	$check( ! str_contains( $html, 'aria-current="page"' ), 'Editor REST paths must not mark a current page.' );
	$tags       = new WP_HTML_Tag_Processor( $html );
	$visible    = array();
	$expanded   = array();
	$ids        = array();
	$references = array();
	while ( $tags->next_tag() ) {
		$surface = $tags->get_attribute( 'data-hp-header-panel' );
		if ( is_string( $surface ) && null === $tags->get_attribute( 'hidden' ) ) {
			$visible[] = $surface;
		}
		if ( 'true' === $tags->get_attribute( 'aria-expanded' ) ) {
			$expanded[] = $tags->get_attribute( 'data-hp-header-trigger' );
		}
		$id = $tags->get_attribute( 'id' );
		if ( is_string( $id ) ) {
			$ids[] = $id;
		}
		foreach ( array( 'for', 'aria-controls', 'aria-labelledby' ) as $attribute ) {
			$value = $tags->get_attribute( $attribute );
			if ( is_string( $value ) ) {
				$references = array_merge( $references, explode( ' ', $value ) );
			}
		}
	}
	$expected = 'closed' === $panel ? array() : array( $panel );
	$check( $expected === $visible && $expected === $expanded, 'Preview must open only the requested panel: ' . $panel );
	$check( count( $ids ) === count( array_unique( $ids ) ), 'Preview IDs must be unique.' );
	$check( ! array_diff( $references, $ids ), 'Every preview label/control must reference its own element.' );
	$check( str_contains( $html, 'hp-preview-first-hp-council-work-trigger' ), 'Preview IDs must be scoped to the editor instance.' );
}
$other = $render_preview( 'work', 'second' );
$check( ! str_contains( $other, 'hp-preview-first-' ), 'Separate previews must not share IDs.' );
echo "Verified {$checks} Council Header block integration assertions.\n";
