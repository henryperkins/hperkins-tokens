<?php
/**
 * Title: Imladris inputs
 * Slug: hperkins-tokens/imladris-input
 * Categories: hperkins
 * Description: Labeled text fields on parchment with gold focus and helper/error text treatments.
 */
?>
<!-- wp:html -->
<div class="hp-input-stack">
	<label class="hp-input">
		<span class="hp-input__label">Email</span>
		<span class="hp-input__control"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="m22 6-10 7L2 6"/></svg><input type="email" placeholder="you@domain.com"></span>
		<span class="hp-input__helper">We never share your address.</span>
	</label>
	<label class="hp-input has-error">
		<span class="hp-input__label">Display name</span>
		<span class="hp-input__control"><input type="text" value="Elrond"></span>
		<span class="hp-input__helper">This name is already taken.</span>
	</label>
</div>
<!-- /wp:html -->
