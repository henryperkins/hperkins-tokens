<?php
/** Dependencies for the hand-authored, build-free editor script. */
return array(
	'dependencies' => array( 'wp-blocks', 'wp-block-editor', 'wp-components', 'wp-element', 'wp-i18n', 'wp-server-side-render' ),
	'version'      => filemtime( __DIR__ . '/editor.js' ),
);
