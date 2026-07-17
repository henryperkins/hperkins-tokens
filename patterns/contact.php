<?php
/**
 * Title: Contact — start a conversation
 * Slug: hperkins-tokens/contact
 * Categories: hperkins
 * Description: The /contact/ page in the Imladris register — an evidence-first brief, a message form (mailto fallback; wire a form plugin for live submission), direct channels as artifact-style cells, and the newsletter block.
 */
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

<!-- wp:group {"className":"hp-contact-panel","style":{"spacing":{"margin":{"top":"var:preset|spacing|8"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group hp-contact-panel" style="margin-top:var(--wp--preset--spacing--8)"><!-- wp:html -->
<p class="hp-contact-form__hint">This contact form opens your email app; the site does not receive or store the fields you enter here. Any email you send is handled by your email provider and mine.</p>
<form class="hp-contact-form" action="mailto:htperkins@gmail.com" method="post" enctype="text/plain">
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
		<span class="hp-contact-form__hint">Or email <a href="mailto:htperkins@gmail.com">htperkins@gmail.com</a> directly &mdash; whichever you prefer.</span>
	</div>
</form>
<!-- /wp:html -->

<!-- wp:html -->
<div class="hp-contact-aside">
	<div>
		<p class="hp-label-caps" style="margin:0 0 var(--wp--preset--spacing--4)">Direct channels</p>
		<div class="hp-channels">
			<a href="https://github.com/henryperkins" rel="me noopener" aria-label="GitHub profile"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3c3.5-.4 7-1.7 7-7.8 0-1.7-.6-3.2-1.6-4.4.2-.4.7-2-.2-4.3 0 0-1.3-.4-4.5 1.7A15.5 15.5 0 0 0 12 1.8c-1.3 0-2.6.2-3.8.5C5.1.2 3.8.6 3.8.6c-.9 2.3-.3 3.9-.2 4.3A6.2 6.2 0 0 0 2 9.2c0 6.1 3.5 7.4 7 7.8-.5.4-.9 1.2-1 2.3-1 .5-3.6 1.2-5.2-1.5 0 0-.9-1.7-2.8-1.8 0 0-1.8 0-.1 1.1 0 0 1.2.6 2.1 2.9 0 0 1.1 3.5 6 2.4V22"/></svg></a>
			<a href="https://www.linkedin.com/in/henryperkins" rel="me noopener" aria-label="LinkedIn profile"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg></a>
			<a href="https://profiles.wordpress.org/htperkins/" rel="me noopener" aria-label="WordPress.org profile"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><path d="M5.4 7h2.1l1.5 6.1L11.1 7h1.8l2.1 6.1L16.5 7h2.1l-2.7 10h-1.8L12 10.9 9.9 17H8.1z"/></svg></a>
		</div>
	</div>
</div>
<!-- /wp:html --></div>
<!-- /wp:group -->

<!-- wp:pattern {"slug":"hperkins-tokens/imladris-subscribe"} /-->
