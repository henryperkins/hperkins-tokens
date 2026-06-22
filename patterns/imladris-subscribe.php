<?php
/**
 * Title: Imladris subscribe block
 * Slug: hperkins-tokens/imladris-subscribe
 * Categories: hperkins
 * Description: Twilight newsletter block with inline email field and secure handoff.
 */

$subscribe_status  = isset( $_GET['hperkins_subscribe'] ) ? sanitize_key( wp_unslash( $_GET['hperkins_subscribe'] ) ) : '';
$subscribe_message = '';
$subscribe_role    = 'status';

if ( 'success' === $subscribe_status ) {
	$subscribe_message = 'Request received. I will review the address and add it to the fortnightly dispatch shortly.';
} elseif ( 'invalid-email' === $subscribe_status ) {
	$subscribe_message = 'Enter a valid email to join the dispatch.';
	$subscribe_role    = 'alert';
} elseif ( 'invalid-request' === $subscribe_status ) {
	$subscribe_message = 'Refresh the page and try again so the request can be verified.';
	$subscribe_role    = 'alert';
} elseif ( 'rate-limited' === $subscribe_status ) {
	$subscribe_message = 'Too many attempts just now. Wait a few minutes and try again.';
	$subscribe_role    = 'alert';
} elseif ( 'save-error' === $subscribe_status ) {
	$subscribe_message = 'Something went wrong recording the request. Email htperkins@gmail.com directly and I will add you manually.';
	$subscribe_role    = 'alert';
}
?>
<!-- wp:html -->
<section id="subscribe" class="hp-subscribe" aria-labelledby="hp-subscribe-title">
	<p class="hp-subscribe__kicker">The fortnightly dispatch</p>
	<h3 id="hp-subscribe-title" class="hp-subscribe__title">Join the council</h3>
	<p class="hp-subscribe__blurb">Essays on AI governance, oversight, and the long stewardship of power.</p>
	<form class="hp-subscribe__form" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
		<input type="hidden" name="action" value="hperkins_tokens_subscribe">
		<?php wp_nonce_field( 'hperkins_tokens_subscribe', 'hperkins_tokens_subscribe_nonce' ); ?>
		<label class="screen-reader-text" for="hp-subscribe-email">Email address</label>
		<input id="hp-subscribe-email" type="email" name="email" placeholder="you@domain.com" required>
		<button type="submit">Subscribe</button>
		<?php if ( $subscribe_message ) : ?>
			<p class="hp-subscribe__status" role="<?php echo esc_attr( $subscribe_role ); ?>"><?php echo esc_html( $subscribe_message ); ?></p>
		<?php endif; ?>
	</form>
</section>
<!-- /wp:html -->
