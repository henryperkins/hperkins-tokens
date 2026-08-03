# Focused WordPress Build Product Content Design

**Date:** 2026-08-02

**Status:** Approved in conversation; awaiting review of this written specification

**Surface:** WooCommerce product page currently published as “Small Business Power Pack”

## Goal

Replace the ambiguous “Small Business Power Pack” offer with a credible fixed-price service product. A small-business buyer should understand what the $299 purchase starts, what complete deliverable they can receive, how scope is controlled, when delivery happens, and what protection applies when the requested work is too large.

This work produces product-page copy and upload-ready gallery assets. It does not change the live WooCommerce product, checkout configuration, theme, database, or production media library.

## Product Decision

### Name

**Focused WordPress Build**

### Positioning line

**One clear goal. One complete theme or plugin. Built for your business.**

### Offer contract

The $299 purchase includes:

- One post-purchase 45-minute scoping conversation.
- One written build brief that the customer approves before development begins.
- One complete, installable custom WordPress child theme or single-purpose plugin for one website and one primary business goal.
- One installable ZIP plus setup and usage instructions.
- Testing against the WordPress environment named in the approved brief.
- One revision round.
- Delivery within 10 business days after brief approval.
- Fourteen days of bug-fix support after delivery.

Content migration, paid licenses, hosting, ongoing maintenance, and complex external integrations are excluded unless explicitly included in the approved brief.

If the original request cannot fit this focused package, the customer may reduce the scope, apply the $299 toward a larger quoted project, or receive a full refund before development begins.

## WooCommerce Copy

### Product name

Focused WordPress Build

### Short description

Turn one clear WordPress need into a complete, installable solution. Your $299 purchase includes a scoping conversation, an approved build brief, one custom child theme or single-purpose plugin, one revision round, and 14 days of bug-fix support.

### Full description

```markdown
## A custom WordPress build without an open-ended project

Focused WordPress Build is for small businesses that need one important WordPress improvement completed properly—without beginning a large, unpredictable development engagement.

Your purchase starts with a conversation. We will identify the business goal, choose a theme or plugin, and agree on a focused written brief before development begins.

### Choose your build

**Custom child theme**

A complete, installable child theme tailored to your existing WordPress website and the visual requirements in your approved brief.

**Single-purpose plugin**

A complete, installable plugin that adds one clearly defined workflow or capability to your WordPress website.

### How it works

1. Purchase the build and complete the short intake.
2. Meet with Henry for a 45-minute scoping conversation.
3. Review and approve your written build brief.
4. Receive your completed theme or plugin within 10 business days.
5. Request one revision round and receive 14 days of bug-fix support.

### What is included

- One custom WordPress child theme or single-purpose plugin.
- An installable ZIP file.
- Setup and usage instructions.
- Testing against your agreed WordPress environment.
- One revision round.
- Fourteen days of bug-fix support.

### Clear scope protection

If your original request cannot fit this focused package, you may reduce the scope, apply your $299 toward a larger quoted project, or receive a full refund before development begins.

Content migration, paid licenses, hosting, ongoing maintenance, and complex external integrations are not included unless they appear in the approved brief.
```

## Gallery Asset System

### Shared art direction

- Four square product-gallery images at 1200 × 1200 pixels.
- Editorial, credible, and grounded in real project artifacts rather than generic technology symbolism.
- Existing HPerkins visual language: parchment (`#FAF6EC`, `#F5EFE1`), evergreen (`#2E4A3A`), ink (`#1B231D`, `#313B33`), muted gold (`#C29A44`), and restrained river blue (`#3F6E89`).
- Soft natural or studio lighting, tactile paper and desk textures, and restrained contrast.
- No burned-in marketing copy, watermarks, fake testimonials, unsupported performance claims, generic puzzle pieces, floating technology logos, or illegible pseudo-interface text.
- Screens may show abstract, non-readable site and code structure, but must not imply a real client result that does not exist.

### Hero exploration

Generate exactly three independent hero directions, each using the current product-page screenshot as a layout and brand reference:

1. **Editorial Build Desk** — an intentional developer workspace with a browser preview, code editor, organized brief, and evidence of a focused custom build. This is the recommended direction.
2. **Before-and-After Transformation** — one visual composition contrasting an undifferentiated starting site with a refined, coherent result, without text labels or invented metrics.
3. **Finished Build Delivery** — a tangible delivery scene centered on an installable theme/plugin package, documentation, and a clean site preview.

The user selects one displayed hero direction before the remaining gallery assets are generated.

### Final four-image set

1. **Hero / build in progress** — communicates custom WordPress expertise and one focused outcome.
2. **Scoping / approved brief** — communicates the initial conversation, defined goal, and written agreement.
3. **Deliverable / installable package** — communicates the completed theme or plugin, ZIP delivery, documentation, and clean handoff.
4. **Confidence / revision and support** — communicates testing, one revision round, and 14 days of bug-fix support.

### Draft alt text

1. “Developer workspace with a WordPress site preview and code editor for a focused custom build.”
2. “Project brief and annotated layout used to define a focused WordPress build.”
3. “Installable theme or plugin package beside setup documentation and a website preview.”
4. “Testing checklist and revision notes for a completed WordPress build.”

Alt text must be revised after generation to describe the actual accepted images, not retained blindly from this draft.

## Asset Production And Handoff

- Use built-in Image Generation for the three hero directions and the selected supporting set.
- Attach the accepted live product-page screenshot as a visual reference for brand, surrounding layout, and expected square-gallery use.
- Inspect every result for subject accuracy, composition, unwanted text, watermarks, visual artifacts, and fit with the HPerkins palette.
- Save accepted project-bound assets outside the theme repository in the active visual-deliverables workspace, using stable descriptive filenames.
- Preserve an original high-quality image and provide an upload-ready WebP derivative where local tooling permits.
- Do not upload to WordPress or mutate the live product without separate authorization.

## Acceptance Criteria

- Product name, short description, and full description match the approved offer contract.
- Copy clearly states that scoping follows purchase and development follows brief approval.
- Copy includes the delivery window, revision allowance, support window, exclusions, and refund/credit protection.
- Three distinct hero options are visible and selectable before supporting assets are produced.
- The selected direction yields four visually coherent 1200 × 1200 gallery images.
- Images contain no accidental text, fake client evidence, watermarks, trademarks used as decoration, or unsupported claims.
- Every final image has accurate alt text based on the generated result.
- No production or repository-owned runtime content is changed as part of asset generation.
