<?php
/**
 * Title: Contact — start a conversation
 * Slug: hperkins-tokens/contact
 * Categories: hperkins
 * Description: The /contact/ page in the Imladris register — an evidence-first brief, a message form (mailto fallback; wire a form plugin for live submission), direct channels as artifact-style cells, and the newsletter block.
 */

/*
 * The public address is hperkins_tokens_contact_email()'s to decide — it is
 * filterable, and imladris-subscribe.php already reads it. Repeating the
 * literal here meant a filtered site kept the old address on the one route
 * whose entire job is reaching the author. assets/js/form-enhance.js reads it
 * back off the form's action for the same reason.
 */
$hperkins_contact_email = hperkins_tokens_contact_email();
?>
<!-- wp:group {"tagName":"section","className":"hp-page-hero","layout":{"type":"default"}} -->
<section class="wp-block-group hp-page-hero"><!-- wp:paragraph {"className":"hp-page-hero__eyebrow"} -->
<p class="hp-page-hero__eyebrow">Contact</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1} -->
<h1 class="wp-block-heading">Start a conversation</h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"className":"hp-page-hero__lead"} -->
<p class="hp-page-hero__lead">For consulting on AI governance and WordPress engineering, a question about a write-up, or a collaboration. Tell me what you are trying to verify, govern, or ship &mdash; concrete beats general.</p>
<!-- /wp:paragraph --></section>
<!-- /wp:group -->

<!-- wp:group {"className":"hp-contact-panel","style":{"spacing":{"margin":{"top":"var:preset|spacing|9"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group hp-contact-panel" style="margin-top:var(--wp--preset--spacing--9)"><!-- wp:html -->
<p class="hp-contact-form__hint">This contact form opens your email app; the site does not receive or store the fields you enter here. Any email you send is handled by your email provider and mine.</p>
<form class="hp-contact-form" action="<?php echo esc_url( 'mailto:' . $hperkins_contact_email ); ?>" method="post" enctype="text/plain">
	<div class="hp-contact-form__row">
		<label class="hp-input">
			<span class="hp-input__label">Name</span>
			<span class="hp-input__control"><input type="text" name="name" placeholder="Your name"></span>
		</label>
		<label class="hp-input">
			<span class="hp-input__label">Email</span>
			<span class="hp-input__control"><input type="email" name="email" placeholder="you@example.com" required></span>
		</label>
	</div>
	<label class="hp-input">
		<span class="hp-input__label">Subject</span>
		<span class="hp-input__control"><input type="text" name="subject" placeholder="What this is about"></span>
	</label>
	<label class="hp-input">
		<span class="hp-input__label">Message</span>
		<textarea name="message" rows="6" placeholder="What are you trying to verify, govern, or ship?" aria-describedby="hp-contact-message-hint"></textarea>
	</label>
	<span id="hp-contact-message-hint" class="hp-contact-form__hint">No attachments needed &mdash; a link to the repo, PR, or page is more useful than a deck.</span>
	<div class="hp-contact-form__actions">
		<button type="submit">Send message</button>
		<span class="hp-contact-form__hint">Or email <a href="<?php echo esc_url( 'mailto:' . $hperkins_contact_email ); ?>"><?php echo esc_html( $hperkins_contact_email ); ?></a> directly &mdash; whichever you prefer.</span>
	</div>
</form>
<!-- /wp:html -->

<!-- wp:html -->
<div class="hp-contact-aside">
	<div>
		<p class="hp-label-caps" style="margin:0 0 var(--wp--preset--spacing--4)">Direct channels</p>
		<div class="hp-channels">
			<a href="https://github.com/henryperkins" rel="me noopener" aria-label="GitHub profile"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg></a>
			<a href="https://www.linkedin.com/in/henryperkins" rel="me noopener" aria-label="LinkedIn profile"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg></a>
			<a href="https://profiles.wordpress.org/htperkins/" rel="me noopener" aria-label="WordPress.org profile"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><path d="M6.5 8l2.2 8.5L12 10.5l3.3 6L17.5 8"/></svg></a>
		</div>
	</div>
</div>
<!-- /wp:html --></div>
<!-- /wp:group -->

<!-- wp:pattern {"slug":"hperkins-tokens/imladris-subscribe"} /-->
