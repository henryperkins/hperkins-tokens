<?php
/**
 * Title: Footer colophon
 * Slug: hperkins-tokens/footer-colophon
 * Categories: hperkins
 * Inserter: no
 * Description: Footer copyright line, tenure note, and the labelled footer routes.
 *
 * A pattern rather than markup in parts/footer.html purely so the copyright
 * year comes from the site's clock instead of a literal that silently goes
 * stale every January. wp_date() respects the site's timezone and locale, so
 * the year turns over when the site's own new year does, not UTC's.
 */

$hperkins_colophon_year = wp_date( 'Y' );
?>
<!-- wp:paragraph {"className":"hp-footer__colophon"} -->
<p class="hp-footer__colophon">&copy; <?php echo esc_html( $hperkins_colophon_year ); ?> Henry Perkins. Trust is structural. WordPress.org member since 2007 <span aria-hidden="true">&middot;</span> professional WordPress work since 2012. <a href="/how-this-was-built/">How this site was built &rarr;</a> <span aria-hidden="true">&middot;</span> <a href="/contact/">Contact</a> <span aria-hidden="true">&middot;</span> <a href="/privacy-policy/">Privacy</a></p>
<!-- /wp:paragraph -->
