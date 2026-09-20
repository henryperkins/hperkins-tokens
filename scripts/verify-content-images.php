<?php
/** Run with WP-CLI eval-file against the explicitly selected local install. */

$checks = 0;
$verify_image = static function ( $condition, $message ) use ( &$checks ) {
	++$checks;
	if ( ! $condition ) {
		throw new RuntimeException( $message );
	}
};

// The loading policy is About-specific, including when image URLs carry a
// cache key. It must survive an existing width without duplicating attributes.
$GLOBALS['wp_query'] = new WP_Query();
$GLOBALS['wp_query']->is_page = true;
$GLOBALS['wp_query']->queried_object = (object) array( 'ID' => 6, 'post_name' => 'about', 'post_title' => 'About' );
$image = hperkins_tokens_add_content_image_candidates( '<img width="1024" height="953" src="/wp-content/themes/hperkins-tokens/assets/screenshots/flavor-agent-activity-log.webp?v=123" alt="Activity log">' );
$tag = new WP_HTML_Tag_Processor( $image );
$tag->next_tag( 'IMG' );
$verify_image( 'lazy' === $tag->get_attribute( 'loading' ), 'About showcase image must defer loading.' );
$verify_image( 1 === substr_count( $image, ' width=' ), 'Image width must not be duplicated.' );
$verify_image( 1 === substr_count( $image, ' height=' ), 'Image height must not be duplicated.' );
$verify_image( false !== strpos( $tag->get_attribute( 'src' ), '?v=' ), 'Fallback must use the same cache-busted asset URL as its candidates.' );

$portrait = hperkins_tokens_add_content_image_candidates( '<img src="/wp-content/uploads/2026/06/henry-perkins.png" alt="Henry Perkins">' );
$tag = new WP_HTML_Tag_Processor( $portrait );
$tag->next_tag( 'IMG' );
$verify_image( 'eager' === $tag->get_attribute( 'loading' ), 'Visible portrait must remain eager.' );
$verify_image( false !== strpos( $tag->get_attribute( 'src' ), 'henry-perkins-240.webp' ), 'Portrait must use the modern derivative.' );
$verify_image( false !== strpos( $tag->get_attribute( 'srcset' ), '120w' ), 'Portrait needs a small responsive candidate.' );

$upstream = '<img src="/assets/flavor-agent-activity-log.webp" srcset="/media/managed.webp 640w" sizes="80vw" width="640" height="600">';
$tag = new WP_HTML_Tag_Processor( hperkins_tokens_add_content_image_candidates( $upstream ) );
$tag->next_tag( 'IMG' );
$verify_image( '/media/managed.webp 640w' === $tag->get_attribute( 'srcset' ), 'Existing upstream srcset must survive.' );
$verify_image( '80vw' === $tag->get_attribute( 'sizes' ), 'Existing upstream sizes must survive.' );

$unknown = '<img src="/unrelated/portrait.png" width="80" alt="Another image">';
$verify_image( $unknown === hperkins_tokens_add_content_image_candidates( $unknown ), 'Unknown images must remain unchanged.' );
$GLOBALS['wp_query']->is_page = false;
$tag = new WP_HTML_Tag_Processor( hperkins_tokens_add_content_image_candidates( '<img src="/assets/flavor-agent-activity-log.webp" loading="eager">' ) );
$tag->next_tag( 'IMG' );
$verify_image( 'eager' === $tag->get_attribute( 'loading' ), 'Other routes retain core loading policy.' );
echo "Content image behavior: {$checks} checks passed.\n";
