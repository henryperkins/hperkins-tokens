<?php
/**
 * Isolated request/phase tests for the method-page redirect. No WordPress DB.
 */
$placement_case = array();
function is_admin() { global $placement_case; return $placement_case['admin'] ?? false; }
function wp_doing_ajax() { global $placement_case; return $placement_case['ajax'] ?? false; }
function sanitize_text_field( $text ) { return $text; }
function wp_unslash( $text ) { return $text; }
function wp_parse_url( $url, $component = -1 ) { return parse_url( $url, $component ); }
function home_url( $path ) { return 'https://example.test/site' . $path; }
function untrailingslashit( $value ) { return rtrim( $value, '/' ); }
function add_action() {}
function get_page_by_path() {
	global $placement_case;
	if ( ! empty( $placement_case['missing'] ) ) { return null; }
	return (object) array(
		'post_status' => $placement_case['status'] ?? 'publish',
		'post_content' => $placement_case['body'] ?? '<div class="wp-block-group hp-placement-brief">Reviewed body</div>',
	);
}
require __DIR__ . '/../inc/placement-route.php';
$cases = array(
	array( 'path' => '/site/placement-method-and-evidence/', 'target' => 'https://example.test/site/job-placement-digest/' ),
	array( 'path' => '/site/placement-method-and-evidence?ref=old', 'method' => 'HEAD', 'target' => 'https://example.test/site/job-placement-digest/' ),
	array( 'path' => '/site/placement-method-evidence/', 'target' => 'https://example.test/site/job-placement-digest/' ),
	array( 'path' => '/site/job-placement-digest/' ),
	array( 'path' => '/site/unrelated/' ),
	array( 'path' => '/site/placement-method-and-evidence/', 'method' => 'POST' ),
	array( 'path' => '/site/placement-method-and-evidence/', 'admin' => true ),
	array( 'path' => '/site/placement-method-and-evidence/', 'ajax' => true ),
	array( 'path' => '/site/placement-method-and-evidence/', 'missing' => true ),
	array( 'path' => '/site/placement-method-and-evidence/', 'status' => 'draft' ),
	array( 'path' => '/site/placement-method-and-evidence/', 'body' => '<div class="hp-digest__hero">Old published body</div>' ),
	array( 'path' => '/site/placement-method-and-evidence/', 'body' => '<p>A mention of hp-placement-brief is not a published candidate.</p>' ),
	array( 'path' => '/site/placement-method-and-evidence/', 'body' => '<div data-class="hp-placement-brief">Not the candidate class</div>' ),
	array( 'path' => '/site/placement-method-and-evidence/', 'body' => '<div class="hp-placement-brief-old">Not the candidate class</div>' ),
);
foreach ( $cases as $index => $placement_case ) {
	$_SERVER['REQUEST_URI'] = $placement_case['path'];
	$_SERVER['REQUEST_METHOD'] = $placement_case['method'] ?? 'GET';
	$actual = hperkins_tokens_placement_redirect_target();
	$expected = $placement_case['target'] ?? '';
	if ( $actual !== $expected || str_contains( $actual, '#' ) ) {
		fwrite( STDERR, 'Redirect case ' . $index . ' failed: ' . $actual . PHP_EOL );
		exit( 1 );
	}
}
echo count( $cases ) . " placement redirect cases passed.\n";
