<?php
/**
 * Title: How hperkins.blog Was Built — build report
 * Slug: hperkins-tokens/how-this-was-built
 * Categories: hperkins
 * Description: The /how-this-was-built/ build report in the Imladris "parchment dossier" treatment — the making-of hperkins.blog end to end: the premise, the WordPress.com → DigitalOcean droplet platform move (forced by Flavor Agent), the two design systems (tokens-kit → Imladris), the theme.json source of truth, the content system, the verify-first build loop, the git-evidenced build, and the discipline. Layout CSS is scoped to .hp-buildreport in assets/imladris-pages.css.
 */
?>
<!-- wp:html -->
<article class="hp-buildreport">

  <p class="hp-buildreport__eyebrow">Build report &middot; hperkins.blog</p>
  <h1>How hperkins.blog was built</h1>
  <p class="hp-buildreport__standfirst">A portfolio built so the site is its own evidence: every load-bearing claim points at an artifact a stranger can check, the design system lives in one token layer, and the pipeline that ships it doubles as a work sample.</p>
  <hr class="hp-buildreport__rule">
  <div class="hp-buildreport__artifacts">
    <a class="hp-buildreport__artifact" href="https://github.com/henryperkins/hperkins-tokens">
      <span class="hp-buildreport__artifact-label">Source &middot; GitHub</span>
      <span class="hp-buildreport__artifact-val">henryperkins/hperkins-tokens</span>
    </a>
    <a class="hp-buildreport__artifact" href="/ai-enablement/">
      <span class="hp-buildreport__artifact-label">Written sample</span>
      <span class="hp-buildreport__artifact-val">&lsquo;Expose, Govern, Attest&rsquo;</span>
    </a>
  </div>
  <div class="hp-buildreport__meta">
    <span><b>System</b>&nbsp;&nbsp;Imladris design system</span>
    <span><b>Surface</b>&nbsp;&nbsp;Portfolio &amp; journal</span>
    <span><b>Origin</b>&nbsp;&nbsp;From-scratch brand, no prior assets</span>
  </div>

  <div class="hp-buildreport__lede">
    <p>This site is not a showcase wrapped around a r&eacute;sum&eacute;. It is built so that every load-bearing claim points at something a stranger can check &mdash; the proof bar renders state, never intent, and the site represents the work accurately at every point in time, not only on the day it is &lsquo;done&rsquo;.</p>
  </div>

  <section>
    <h2><span class="hp-buildreport__n">01</span> The premise &mdash; prove, don&rsquo;t describe</h2>
    <p>The structure was reverse-engineered from one job description &mdash; the WordPress VIP Solutions Engineer role &mdash; into five hiring criteria: build and demo a proof-of-concept, fluency in enterprise governance language, awareness of enterprise constraints, the motion of a sales cycle, and written communication treated as a first-class work sample. Every section of the site carries one of them.</p>
    <p>The information architecture mirrors a sales call. A landing strip answers the buyer&rsquo;s three questions; then <strong>Demo</strong>, <strong>AI&nbsp;Governance</strong>, <strong>Work</strong>, and <strong>About/Resume</strong> run the presentation, the discovery conversation, the references, and the close &mdash; four items, nothing competing for a twelve-second scan.</p>
  </section>

  <section>
    <h2><span class="hp-buildreport__n">02</span> The platform, chosen then outgrown</h2>
    <p>The hosting choice was an audit, not a default. WordPress.com Business sat at the intersection of near-zero maintenance, a real code-to-production path, and infrastructure that makes the same governance-first argument as the work it showcases &mdash; and the trade-off was stated plainly rather than hidden: Business is not VIP.</p>
    <p>Then the centerpiece forced a move. <strong>Flavor Agent</strong> &mdash; the governed-AI plugin the whole site exists to demonstrate &mdash; could not run under WordPress.com&rsquo;s plugin constraints. So the install was exported, imported onto a self-hosted <strong>DigitalOcean droplet</strong>, and development continued there. The work set the requirements for the infrastructure, not the other way around.</p>
  </section>

  <section>
    <h2><span class="hp-buildreport__n">03</span> Two design systems</h2>
    <p>The design language was built twice. The first &mdash; <code>@hperkins/tokens-kit</code>, an &lsquo;evidence ledger&rsquo; &mdash; was a React kit of fourteen components over a deliberately quiet neutral palette, where the only saturated colour was the three status hues. Its idiom was <em>compose components, don&rsquo;t author classes</em>: status shipped as a prop, never faked with markup, so a &lsquo;merged&rsquo; row was the same green and the same word everywhere it appeared.</p>
    <p>That system was then re-skinned into the current one &mdash; <strong>Imladris</strong> &mdash; a Rivendell-inspired parchment, evergreen, and mallorn-gold serif editorial system of nineteen components and six page templates. The shift traded a neutral proof-ledger for a literary register that frames <em>why</em> the work matters, while keeping the evidence layer intact underneath.</p>
    <div class="hp-buildreport__grid">
      <div class="hp-buildreport__spec">
        <h3>Palette</h3>
        <p class="hp-buildreport__spec-note">Warm neutrals over cool depths with a single accent &mdash; parchment pages, near-black evergreen ink, one precious mallorn-gold used sparingly so it stays precious.</p>
        <div class="hp-buildreport__swatches">
          <div class="hp-buildreport__sw" style="background:var(--wp--preset--color--parchment-50)"></div>
          <div class="hp-buildreport__sw" style="background:var(--wp--preset--color--green-700)"></div>
          <div class="hp-buildreport__sw" style="background:var(--wp--preset--color--river-500)"></div>
          <div class="hp-buildreport__sw" style="background:var(--wp--preset--color--gold-500)"></div>
          <div class="hp-buildreport__sw" style="background:var(--wp--preset--color--twilight-900)"></div>
        </div>
        <ul class="hp-buildreport__key">
          <li><span>Parchment</span><b>#FAF6EC</b></li>
          <li><span>Evergreen &mdash; primary</span><b>#2E4A3A</b></li>
          <li><span>Bruinen river &mdash; secondary</span><b>#3F6E89</b></li>
          <li><span>Mallorn gold &mdash; accent</span><b>#C29A44</b></li>
          <li><span>Twilight &mdash; night surface</span><b>#161D24</b></li>
        </ul>
      </div>
      <div class="hp-buildreport__spec">
        <h3>Typography</h3>
        <p class="hp-buildreport__spec-note">Serif-led, four self-hosted families with clear roles. Body reads at a book-like measure; labels are set as lapidary roman capitals.</p>
        <div class="hp-buildreport__type-row"><span style="font-family:var(--wp--preset--font-family--display);font-size:1.5rem;color:var(--wp--custom--text--strong)">Cormorant</span><span class="lbl">Display</span></div>
        <div class="hp-buildreport__type-row"><span style="font-family:var(--wp--preset--font-family--label);text-transform:uppercase;letter-spacing:.16em;font-size:.875rem;color:var(--wp--custom--text--strong)">Marcellus</span><span class="lbl">Labels &middot; nav</span></div>
        <div class="hp-buildreport__type-row"><span style="font-family:var(--wp--preset--font-family--body);font-size:1.0625rem;color:var(--wp--custom--text--strong)">EB Garamond &mdash; long-form reading</span><span class="lbl">Body</span></div>
        <div class="hp-buildreport__type-row"><span style="font-family:var(--wp--preset--font-family--mono);font-size:.875rem;color:var(--wp--custom--text--strong)">JetBrains Mono</span><span class="lbl">Data &middot; meta</span></div>
      </div>
    </div>
  </section>

  <section>
    <h2><span class="hp-buildreport__n">04</span> The theme &mdash; a design system in theme.json</h2>
    <p>The site runs on a custom block child theme &mdash; <strong>HPerkins Tokens</strong> &mdash; on Automattic&rsquo;s Assembler parent. Its premise is that the design system lives in <code>theme.json</code> as a small, named token vocabulary, and every component is a consequence of those tokens rather than a parallel set of hardcoded values.</p>
    <p>The colour contract is locked at the schema level: the stock swatches and every custom colour, gradient, and duotone picker are turned off, so to change a colour you edit <code>theme.json</code>, not a block. The four families are self-hosted, not pulled from a CDN. And the token layer round-trips 1:1 with the Imladris project kept in claude.ai/design, diffed on every pull &mdash; so a token &lsquo;refresh&rsquo; changes nothing, because nothing is left to drift.</p>
  </section>

  <section>
    <h2><span class="hp-buildreport__n">05</span> The content system &mdash; one template, proved three ways</h2>
    <p>Every Work entry follows one locked shape &mdash; Problem, Build, Outcome as a causal list, artifact buttons, and a close &mdash; and the published entries each end on the same line, <em>trust is structural</em>, proving it a different way: architecturally, iteratively, methodologically. Visual and non-visual work get different treatments by design &mdash; Evidence First for proof that lives in changelogs and review records; Proof&nbsp;+&nbsp;Product where a screenshot materially proves what shipped; Operational Story reserved for the Flavor Agent pair.</p>
    <p>The written work sample is the long-form essay <a href="/ai-enablement/">&lsquo;Expose, Govern, Attest&rsquo;</a>, which reads WordPress&rsquo;s AI stack as three nested rings of trust: Vilya, the Ring of Air, <em>exposes</em> a capability an agent can inspect; Narya, the Ring of Fire, <em>governs</em> use the owner can audit; and Nenya, the Ring of Water, <em>attests</em> provenance a stranger can verify.</p>
    <p>The essay states the honest part out loud: the rings sit at different maturities &mdash; governance has shipped primitives, exposure is shipped at its foundation with the agent-facing layer still in proposals, and attestation is still in-review pull requests. That is where WordPress core is, not where I wish it already were.</p>
  </section>

  <section>
    <h2><span class="hp-buildreport__n">06</span> The build loop &mdash; verify before you ship</h2>
    <p>The inner loop runs locally first, with render-verification before anything reaches the live site: a host-shim mu-plugin, <code>wp&nbsp;server</code>, and Playwright confirm that the tokens resolve, the page CSS loads, and the console is clean. The design system stays in sync through a scripted design-pull from the claude.ai/design project, which diffs the token CSS against <code>theme.json</code> and reports any drift. Verification is the gate, not an afterthought &mdash; the same standard the work itself is built to meet.</p>
  </section>

  <section>
    <h2><span class="hp-buildreport__n">07</span> What the git log shows</h2>
    <p>The current system&rsquo;s build is in the record. The theme repo carries the Imladris migration end to end &mdash; the re-skin from the first system to the parchment one &mdash; as thirty commits across two days, each a reviewable step, with the live site reflecting each as caches cleared. <a href="https://github.com/henryperkins/hperkins-tokens">The source is public</a>, so the claims here resolve to it.</p>
    <div class="hp-buildreport__stats">
      <div class="hp-buildreport__stat"><div class="num">30</div><div class="cap">Commits</div></div>
      <div class="hp-buildreport__stat"><div class="num">2</div><div class="cap">Days</div></div>
      <div class="hp-buildreport__stat"><div class="num">1</div><div class="cap">Author</div></div>
      <div class="hp-buildreport__stat"><div class="num">11k</div><div class="cap">Lines</div></div>
    </div>
  </section>

  <section>
    <h2><span class="hp-buildreport__n">08</span> The discipline &mdash; the medium is the argument</h2>
    <p>One rule runs under every other choice: a claim is only as good as the instrument that can check it, and the instrument should be one the author does not control &mdash; a changelog line, a maintainer&rsquo;s merge, a signed manifest, a deploy that either succeeded or didn&rsquo;t. That is why the site shipped in sequence rather than all at once, and why a stale claim gets corrected rather than defended.</p>
    <p>Because status lives in components and colour lives in tokens, a project added next month inherits the same rules: it shows its state three ways and links its artifacts, and an unfulfilled proof shows up as a visible gap rather than a quiet omission. The site does not claim the work is verifiable &mdash; it is built so that an unverifiable claim has nowhere to hide.</p>
  </section>

  <p class="hp-buildreport__colophon"><strong>Colophon</strong> &mdash; Custom block child theme (HPerkins Tokens) on Automattic&rsquo;s Assembler parent &middot; Imladris design system authored at the <code>theme.json</code> token level, mirrored 1:1 from a claude.ai/design project &middot; self-hosted on a DigitalOcean droplet &middot; verified locally with WordPress Studio, <code>wp&nbsp;server</code>, and Playwright.</p>

  <footer class="hp-buildreport__footer">
    <span>hperkins.blog &mdash; build report</span>
    <span class="hp-buildreport__epigraph">Et Eärello Endorenna utúlien.</span>
  </footer>

</article>
<!-- /wp:html -->
