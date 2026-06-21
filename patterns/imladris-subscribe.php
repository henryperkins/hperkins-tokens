<?php
/**
 * Title: Imladris subscribe block
 * Slug: hperkins-tokens/imladris-subscribe
 * Categories: hperkins
 * Description: Twilight newsletter block with inline email field and accent action.
 */
?>
<!-- wp:html -->
<section id="subscribe" class="hp-subscribe" aria-labelledby="hp-subscribe-title">
	<p class="hp-subscribe__kicker">The fortnightly dispatch</p>
	<h3 id="hp-subscribe-title" class="hp-subscribe__title">Join the council</h3>
	<p class="hp-subscribe__blurb">Essays on AI governance, oversight, and the long stewardship of power.</p>
	<form class="hp-subscribe__form" action="mailto:htperkins@gmail.com?subject=Subscribe%20to%20the%20dispatch" method="post" enctype="text/plain">
		<label class="screen-reader-text" for="hp-subscribe-email">Email address</label>
		<input id="hp-subscribe-email" type="email" name="email" placeholder="you@domain.com" required>
		<button type="submit">Subscribe</button>
	</form>
</section>
<!-- /wp:html -->
