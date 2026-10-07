<?php
/**
 * Title: Imladris subscribe block
 * Slug: hperkins-tokens/imladris-subscribe
 * Categories: hperkins
 * Description: Twilight newsletter block with inline email field and secure handoff.
 */

// The status line for the handler's redirect. inc/subscribe-form.php owns the
// wording, and re-mints this line, the nonce and the referer in any copy a
// Site Editor save froze.
$subscribe_state   = hperkins_tokens_subscribe_status();
$subscribe_message = $subscribe_state['message'];
$subscribe_role    = $subscribe_state['role'];

// Per-render ids so a second mount on one page can't duplicate them; the
// #subscribe section anchor stays static — it is the site-wide hash target.
$subscribe_title_id = wp_unique_id( 'hp-subscribe-title-' );
$subscribe_email_id = wp_unique_id( 'hp-subscribe-email-' );
?>
<!-- wp:html -->
<section id="subscribe" class="hp-subscribe" aria-labelledby="<?php echo esc_attr( $subscribe_title_id ); ?>">
	<p class="hp-subscribe__kicker">The occasional dispatch</p>
	<h2 id="<?php echo esc_attr( $subscribe_title_id ); ?>" class="hp-subscribe__title">Join the council</h2>
	<p class="hp-subscribe__blurb">Essays on AI governance, oversight, and the long stewardship of power.</p>
	<form class="hp-subscribe__form" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
		<input type="hidden" name="action" value="hperkins_tokens_subscribe">
		<?php wp_nonce_field( 'hperkins_tokens_subscribe', 'hperkins_tokens_subscribe_nonce' ); ?>
		<label class="screen-reader-text" for="<?php echo esc_attr( $subscribe_email_id ); ?>">Email address</label>
		<input id="<?php echo esc_attr( $subscribe_email_id ); ?>" type="email" name="email" placeholder="you@domain.com" required>
		<button type="submit">Subscribe</button>
		<?php if ( $subscribe_message ) : ?>
			<p class="hp-subscribe__status" role="<?php echo esc_attr( $subscribe_role ); ?>" tabindex="-1"><?php echo esc_html( $subscribe_message ); ?></p>
		<?php endif; ?>
	</form>
</section>
<!-- /wp:html -->
