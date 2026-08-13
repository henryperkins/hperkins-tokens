# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary users are WordPress support and engineering hiring teams evaluating Henry Perkins for hands-on technical roles. They need to understand his fit quickly, inspect the work behind each claim, and distinguish demonstrated experience from aspiration.

Secondary users are prospective clients and collaborators considering WordPress or AI implementation work, plus WordPress AI peers reading the technical essays, source records, and project evidence.

Henry is the product operator and author. He maintains the public site through WordPress and the HPerkins Tokens repository.

## Product Purpose

hperkins.blog is Henry Perkins's public portfolio, technical writing site, and evidence system. It shows how he diagnoses WordPress problems, builds and governs AI-enabled systems, ships work, documents root causes, and leaves maintainable handoffs.

The product succeeds when a visitor can evaluate a material claim without relying on unsupported self-description, understand the exact state and authorship of the work, and take an appropriate next step such as reviewing an artifact, reading a case study, making contact, or discussing a role or collaboration.

## Positioning

The site is a portfolio whose proof is part of the product. Load-bearing claims point to inspectable evidence such as releases, diffs, live surfaces, documented incidents, source records, or verified artifacts. State and authorship remain explicit: authored, reported, tested, maintainer-authored, open, merged, prerelease, released, deployed, and unreleased are not interchangeable.

HPerkins Tokens is the WordPress block child theme that implements the site. Its distinctive mechanism is structural governance: named design tokens constrain standard editor choices, tracked snapshots expose content drift, and source and rendered verifiers turn important presentation and accessibility decisions into testable contracts.

## Operating Context

Visitors use a responsive public website spanning selected work, technical writing, About and résumé material, recruiter-facing evidence, search, contact, and subscription surfaces. Evidence commonly leads outward to GitHub records, release artifacts, live projects, and documents that visitors can inspect independently.

The site runs on WordPress. The `assembler` parent theme is required, while this repository owns the HPerkins Tokens child theme, its Imladris implementation, templates, patterns, assets, tracked content mirrors, and verification scripts. WordPress core, the database, uploads, plugins, and parent theme live outside this repository.

Theme deployment and database-owned content publication are separate operations. Database page bodies remain canonical for the routes covered by the snapshot contract; repository snapshots are verified mirrors rather than a second authoring source. Local verification, Git publication, theme deployment, database writes, and public runtime evidence must remain separately reported states.

## Capabilities and Constraints

- The site presents portfolio work, case studies, essays, employment evidence, a stable résumé route, contact paths, search, and a newsletter subscription flow.
- HPerkins Tokens is a WordPress block child theme using `theme.json` version 3. It requires WordPress 6.6 or later, PHP 8.0 or later, and the Assembler parent theme; the repository currently records testing through WordPress 7.0.
- There is no package installation or asset build. Production theme code is hand-authored HTML, CSS, PHP, JavaScript, and `theme.json`; repository verifiers use dependency-free Node scripts and selected Python tooling for document checks.
- `theme.json` is the design-token source of truth. Standard editor controls do not permit arbitrary colors, gradients, duotones, font sizes, or spacing values.
- Database-owned bodies, tracked snapshots, theme-owned files, navigation data, document artifacts, and production overrides have explicit and different ownership rules. Future work must preserve those boundaries.
- The contact form opens the visitor's email application and does not submit or store the entered fields on the site. Newsletter requests use a separate bounded WordPress flow with validation, rate limiting, and registered privacy export and erasure behavior.
- Specific employers, role targets, event dates, release states, contribution states, and deployment claims are time-bound evidence. They must be freshly verified before being reused or changed.

## Brand Commitments

The public product is hperkins.blog and the personal identity is Henry Perkins. HPerkins Tokens is the theme implementation; Imladris is its established design-system identity.

“Trust is structural.” is a binding product statement. The voice is precise, evidence-first, candid about limitations, and concrete about ownership and state. It does not inflate an issue into a fix, another contributor's work into Henry's authorship, an open change into a release, or local verification into production proof.

Existing identity assets include `assets/img/wordmark.svg`, `assets/img/emblem.svg`, the HPerkins Wapuu artwork under `assets/wapuu/` and `assets/img/`, and the incumbent rendered reference at `screenshot.png`. This record does not redefine their visual treatment.

## Evidence on Hand

- Accepted public-content mirrors under `content/page-snapshots/`, including the About, Work, Job Placement Digest, Placement Method and Evidence, front-page, AI Enablement, and Flavor Agent demo bodies.
- Candidate content under `content/page-drafts/`, which remains distinct from accepted snapshots and published database bodies.
- The searchable, tagged one-page résumé and its editable source at `assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf` and `assets/documents/henry-perkins-wordpress-support-engineer-resume.docx`.
- Production and attribution records under `docs/audits/`, including the WCUS production proof and WordPress GitHub activity audit.
- Source, release, issue, pull-request, live-site, and demonstration links embedded in the tracked page content and portfolio artifacts.
- Repository verifiers under `scripts/` for content ownership, responsive rendering, accessibility behavior, typography, header interaction, artifacts, release claims, and deployment boundaries.

The repository does not establish customer testimonials, adoption metrics, revenue claims, or broad accessibility certification. Future work must not invent them.

## Product Principles

1. Put inspectable proof beside every material claim.
2. State authorship, maturity, and deployment status exactly.
3. Make governance and quality constraints structural and testable.
4. Preserve the boundary between authored source, reviewed candidate, accepted mirror, deployment, and live state.
5. Build the handoff into the system so another person can understand, operate, and verify the work.

## Accessibility & Inclusion

The product preserves the accessibility behaviors currently enforced by repository contracts: semantic heading order and a single H1, named landmarks and accessible labels, keyboard-operable navigation and disclosures, visible focus and focus restoration, reduced-motion behavior, 44px mobile controls where pinned, non-color status words, responsive containment without horizontal overflow at tested widths, and explicit typography floors with documented exceptions.

The résumé evidence also includes tagged, searchable PDF structure and link/text parity checks. These are verified product commitments, not a claim of comprehensive WCAG certification. No broader conformance level is asserted without separate evidence.
