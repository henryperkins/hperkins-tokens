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

<!-- wp:group {"className":"hp-contact-grid","style":{"spacing":{"margin":{"top":"var:preset|spacing|8"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group hp-contact-grid" style="margin-top:var(--wp--preset--spacing--8)"><!-- wp:html -->
<form class="hp-contact-form" action="mailto:henry@hperkins.blog" method="post" enctype="text/plain">
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
		<textarea name="message" rows="6" placeholder="What are you trying to verify, govern, or ship?"></textarea>
		<span class="hp-contact-form__hint">No attachments needed &mdash; a link to the repo, PR, or page is more useful than a deck.</span>
	</label>
	<div class="hp-contact-form__actions">
		<button type="submit">Send message</button>
		<span class="hp-contact-form__hint">Or email directly &mdash; whichever you prefer.</span>
	</div>
</form>
<!-- /wp:html -->

<!-- wp:html -->
<div class="hp-contact-aside">
	<div>
		<p class="hp-label-caps" style="margin:0 0 var(--wp--preset--spacing--4)">Direct channels</p>
		<div class="hp-channels">
			<a href="mailto:henry@hperkins.blog"><span class="hp-channels__label">Email</span><span class="hp-channels__value">henry@hperkins.blog</span></a>
			<a href="https://github.com/henryperkins" rel="me noopener"><span class="hp-channels__label">GitHub</span><span class="hp-channels__value">github.com/henryperkins</span></a>
			<a href="https://www.linkedin.com/in/henryperkins" rel="me noopener"><span class="hp-channels__label">LinkedIn</span><span class="hp-channels__value">in/henryperkins</span></a>
		</div>
	</div>
	<aside class="hp-callout is-tone-note" role="note">
		<div class="hp-callout__icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" focusable="false"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>
		</div>
		<div class="hp-callout__body">
			<p class="hp-callout__title">What to include</p>
			<p>A line on the problem, a link to the artifact in question, and the outcome you need. I read everything; I answer fastest when there is something concrete to look at.</p>
		</div>
	</aside>
	<div class="hp-officehours">
		<p class="hp-label-caps hp-officehours__label">Office hours</p>
		<p>Based in the Central US timezone. Replies within two working days; governance and security reports are triaged first.</p>
	</div>
</div>
<!-- /wp:html --></div>
<!-- /wp:group -->

<!-- wp:pattern {"slug":"hperkins-tokens/imladris-subscribe"} /-->
