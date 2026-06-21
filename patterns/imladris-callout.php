<?php
/**
 * Title: Imladris callout
 * Slug: hperkins-tokens/imladris-callout
 * Categories: hperkins
 * Description: Bordered governance note with a tone-coded left rule, icon, title, and readable body copy.
 */
?>
<!-- wp:html -->
<div class="hp-callout-stack">
	<aside class="hp-callout is-tone-note" role="note">
		<div class="hp-callout__icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" focusable="false"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>
		</div>
		<div class="hp-callout__body">
			<p class="hp-callout__title">From the charter</p>
			<p>Every model granted authority must be answerable to a body that can revoke it.</p>
		</div>
	</aside>
	<aside class="hp-callout is-tone-insight" role="note">
		<div class="hp-callout__icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" focusable="false"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z"/></svg>
		</div>
		<div class="hp-callout__body">
			<p class="hp-callout__title">Why it holds</p>
			<p>Exposure, governance, and attestation each hand a different reader an instrument they can check for themselves.</p>
		</div>
	</aside>
	<aside class="hp-callout is-tone-caution" role="note">
		<div class="hp-callout__icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" focusable="false"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>
		</div>
		<div class="hp-callout__body">
			<p class="hp-callout__title">Mind the boundary</p>
			<p>Governance stops at the site edge; once an artifact leaves, only attestation travels with it.</p>
		</div>
	</aside>
	<aside class="hp-callout is-tone-risk" role="note">
		<div class="hp-callout__icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" focusable="false"><path d="M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9L7.9 2Z"/><path d="M12 8v4M12 16h.01"/></svg>
		</div>
		<div class="hp-callout__body">
			<p class="hp-callout__title">Open risk</p>
			<p>A provider that bypasses the SDK transporter slips its calls past the request log.</p>
		</div>
	</aside>
</div>
<!-- /wp:html -->
