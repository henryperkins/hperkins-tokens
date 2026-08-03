# Focused WordPress Build Product Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce three selectable hero directions, then a coherent four-image upload-ready gallery and approved WooCommerce copy package for Focused WordPress Build.

**Architecture:** Keep production assets outside the theme repository because the live WooCommerce product and media library are database/upload owned. Generate each distinct bitmap with a separate built-in Image Gen call, use the accepted live-page capture only as brand/layout reference, pause for hero selection, then derive the three supporting images from the selected style reference. Preserve source PNGs, create 1200 × 1200 WebP derivatives, and document factual alt text in a manifest.

**Tech Stack:** Built-in Image Gen, Codex `view_image`, bundled Python `C:\Users\htper\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`, Pillow 12.2.0 with WebP support, Markdown copy/manifest files.

## Global Constraints

- Product name: `Focused WordPress Build`.
- Positioning line: `One clear goal. One complete theme or plugin. Built for your business.`
- Price: `$299`.
- Offer: one complete custom WordPress child theme or single-purpose plugin for one website and one primary business goal.
- Process: post-purchase 45-minute scoping conversation, customer-approved written brief, delivery within 10 business days, one revision round, and 14 days of bug-fix support.
- Scope protection: reduce scope, credit the $299 toward a larger quote, or issue a full refund before development begins.
- Four final gallery images, each exactly 1200 × 1200 pixels.
- Use parchment `#FAF6EC` / `#F5EFE1`, evergreen `#2E4A3A`, ink `#1B231D` / `#313B33`, muted gold `#C29A44`, and restrained river blue `#3F6E89`.
- No burned-in marketing copy, watermarks, fake testimonials, unsupported performance claims, generic puzzle pieces, floating technology logos, or illegible pseudo-interface text.
- Do not upload to WordPress, edit the product record, modify production media, or change theme runtime files.

---

## File Map

**Repository planning sources**

- Existing: `docs/superpowers/specs/2026-08-02-focused-wordpress-build-product-content-design.md` — approved source of truth.
- Create: `docs/superpowers/plans/2026-08-02-focused-wordpress-build-product-assets.md` — this execution plan.

**Non-repository deliverables**

- Create directory: `C:\Users\htper\.codex\visualizations\2026\08\03\019fc5ba-ee6e-7bf1-b541-a5f5dbc0bcc9\focused-wordpress-build-assets\`
- Create: `product-copy.md` — approved product name, positioning line, short description, and full description.
- Create: `hero-option-1-original.png`, `hero-option-2-original.png`, `hero-option-3-original.png` — hero candidates numbered only after they appear in the conversation.
- Create after selection: `focused-wordpress-build-01-hero-original.png`.
- Create: `focused-wordpress-build-02-scoping-original.png`.
- Create: `focused-wordpress-build-03-deliverable-original.png`.
- Create: `focused-wordpress-build-04-support-original.png`.
- Create: `focused-wordpress-build-01-hero.webp` through `focused-wordpress-build-04-support.webp` — upload-ready derivatives.
- Create: `asset-manifest.md` — filenames, dimensions, prompts, and result-specific alt text.

**Reference input**

- Read-only: `C:\Users\htper\.codex\visualizations\2026\08\03\019fc5ba-ee6e-7bf1-b541-a5f5dbc0bcc9\small-business-power-pack-audit\01-desktop-full.jpg`

---

### Task 1: Prepare The Copy And Deliverables Workspace

**Files:**

- Create: `C:\Users\htper\.codex\visualizations\2026\08\03\019fc5ba-ee6e-7bf1-b541-a5f5dbc0bcc9\focused-wordpress-build-assets\product-copy.md`

**Interfaces:**

- Consumes: approved offer and copy from the design spec.
- Produces: final copy package and stable directory used by every later task.

- [ ] **Step 1: Create the exact deliverables directory**

Run:

```powershell
New-Item -ItemType Directory -Force 'C:\Users\htper\.codex\visualizations\2026\08\03\019fc5ba-ee6e-7bf1-b541-a5f5dbc0bcc9\focused-wordpress-build-assets'
```

Expected: the command returns the exact directory and does not touch the theme repository.

- [ ] **Step 2: Create `product-copy.md` with the approved content**

Use `apply_patch` to write this exact content:

```markdown
# Focused WordPress Build

**Positioning line:** One clear goal. One complete theme or plugin. Built for your business.

## Short description

Turn one clear WordPress need into a complete, installable solution. Your $299 purchase includes a scoping conversation, an approved build brief, one custom child theme or single-purpose plugin, one revision round, and 14 days of bug-fix support.

## Full description

### A custom WordPress build without an open-ended project

Focused WordPress Build is for small businesses that need one important WordPress improvement completed properly—without beginning a large, unpredictable development engagement.

Your purchase starts with a conversation. We will identify the business goal, choose a theme or plugin, and agree on a focused written brief before development begins.

#### Choose your build

**Custom child theme**

A complete, installable child theme tailored to your existing WordPress website and the visual requirements in your approved brief.

**Single-purpose plugin**

A complete, installable plugin that adds one clearly defined workflow or capability to your WordPress website.

#### How it works

1. Purchase the build and complete the short intake.
2. Meet with Henry for a 45-minute scoping conversation.
3. Review and approve your written build brief.
4. Receive your completed theme or plugin within 10 business days.
5. Request one revision round and receive 14 days of bug-fix support.

#### What is included

- One custom WordPress child theme or single-purpose plugin.
- An installable ZIP file.
- Setup and usage instructions.
- Testing against your agreed WordPress environment.
- One revision round.
- Fourteen days of bug-fix support.

#### Clear scope protection

If your original request cannot fit this focused package, you may reduce the scope, apply your $299 toward a larger quoted project, or receive a full refund before development begins.

Content migration, paid licenses, hosting, ongoing maintenance, and complex external integrations are not included unless they appear in the approved brief.
```

- [ ] **Step 3: Verify the copy contract**

Run:

```powershell
rg -n "Focused WordPress Build|\$299|45-minute|10 business days|one revision|14 days|full refund" 'C:\Users\htper\.codex\visualizations\2026\08\03\019fc5ba-ee6e-7bf1-b541-a5f5dbc0bcc9\focused-wordpress-build-assets\product-copy.md'
```

Expected: every required promise appears at least once; the file contains no references to `Small Business Power Pack`.

---

### Task 2: Generate The Editorial Build Desk Hero

**Files:**

- Create after display-order binding: `hero-option-N-original.png`.

**Interfaces:**

- Consumes: current product-page screenshot as Image 1, with the role `brand and surrounding-layout reference only`.
- Produces: one visible square hero candidate.

- [ ] **Step 1: Run one built-in Image Gen call with the reference attached**

Use this prompt:

```text
Use case: product-mockup
Asset type: square WooCommerce product-gallery hero, composed for a final 1200 x 1200 image
Input images: Image 1 is the current product-page screenshot; use it only for the parchment-and-evergreen editorial palette, restrained mood, and surrounding page context. Do not reproduce its existing puzzle-piece product art, checkout controls, header, footer, or page text.
Primary request: Create a credible editorial developer workspace showing one focused custom website build taking shape.
Scene/backdrop: warm parchment-toned desk with a refined, uncluttered small studio atmosphere.
Subject: one desktop display or laptop with a polished but non-readable website preview beside a code editor with abstract non-readable code structure; an organized approved project brief, pen, and a small set of purposeful working notes.
Style/medium: premium editorial product photography, photorealistic materials, believable professional workspace.
Composition/framing: square composition, clear central focal point, generous breathing room, strong silhouette at thumbnail size, no cropped essential objects.
Lighting/mood: soft natural window light, calm, trustworthy, crafted rather than corporate.
Color palette: parchment #FAF6EC and #F5EFE1, evergreen #2E4A3A, ink #1B231D and #313B33, muted gold #C29A44, restrained river blue #3F6E89.
Materials/textures: real paper grain, matte desk surface, subtle screen reflections, natural imperfections.
Constraints: no readable text, no logos or trademarks, no WordPress logo, no watermark, no people or faces, no marketing claims, no fake metrics, no device distortion, no generic puzzle pieces, no floating icons, no illegible pseudo-interface typography.
```

- [ ] **Step 2: Render the generated result once in the conversation**

Expected: exactly one generated image is visible for this direction.

- [ ] **Step 3: Inspect the result**

Use `view_image` on the generated local file. Reject and regenerate only if it contains readable nonsense text, a logo, a watermark, visibly broken hardware, cropped essential objects, or a palette/layout mismatch.

---

### Task 3: Generate The Before-And-After Hero

**Files:**

- Create after display-order binding: `hero-option-N-original.png`.

**Interfaces:**

- Consumes: the same current product-page screenshot as a brand/layout reference.
- Produces: one visible square hero candidate with a transformation-focused hierarchy.

- [ ] **Step 1: Run one independent built-in Image Gen call**

Use this prompt:

```text
Use case: ads-marketing
Asset type: square WooCommerce product-gallery hero, composed for a final 1200 x 1200 image
Input images: Image 1 is the current product-page screenshot; use it only for the parchment-and-evergreen editorial palette, restrained mood, and surrounding page context. Do not reproduce its existing puzzle-piece product art, checkout controls, header, footer, or page text.
Primary request: Show a believable visual transformation from an undifferentiated small-business website to a refined custom website, without using labels, arrows, claims, or metrics.
Scene/backdrop: a single editorial workspace with two aligned browser-preview surfaces or two stages of one design process.
Subject: the starting preview is visibly generic and loosely composed; the finished preview is cohesive, accessible-looking, and carefully branded, while remaining abstract enough that no client result or readable copy is invented.
Style/medium: premium editorial product photography blended with realistic screen mockup presentation; not glossy concept art.
Composition/framing: square, balanced transformation that reads immediately at thumbnail size, with the refined result as the dominant focal point.
Lighting/mood: soft studio light, honest, calm, confident.
Color palette: parchment #FAF6EC and #F5EFE1, evergreen #2E4A3A, ink #1B231D and #313B33, muted gold #C29A44, restrained river blue #3F6E89.
Constraints: no readable text, no before/after labels, no logos or trademarks, no WordPress logo, no watermark, no people or faces, no fake analytics, no performance claims, no generic puzzle pieces, no floating icons, no malformed browser hardware, no illegible pseudo-interface typography.
```

- [ ] **Step 2: Render the generated result once in the conversation**

Expected: exactly one additional generated image is visible.

- [ ] **Step 3: Inspect the result**

Use `view_image`; reject only for the explicit constraint failures named above.

---

### Task 4: Generate The Finished Build Delivery Hero

**Files:**

- Create after display-order binding: `hero-option-N-original.png`.

**Interfaces:**

- Consumes: the same current product-page screenshot as a brand/layout reference.
- Produces: one visible square hero candidate with a concrete-deliverable hierarchy.

- [ ] **Step 1: Run one independent built-in Image Gen call**

Use this prompt:

```text
Use case: product-mockup
Asset type: square WooCommerce product-gallery hero, composed for a final 1200 x 1200 image
Input images: Image 1 is the current product-page screenshot; use it only for the parchment-and-evergreen editorial palette, restrained mood, and surrounding page context. Do not reproduce its existing puzzle-piece product art, checkout controls, header, footer, or page text.
Primary request: Make a focused custom website build feel tangible and complete through a premium editorial delivery scene.
Scene/backdrop: warm parchment studio surface with a clean laptop or display, a simple archive/package symbol on screen, concise printed setup pages with no readable body text, and a polished abstract website preview.
Subject: the completed installable theme-or-plugin delivery, documentation, and clean handoff; the scene should communicate completion without pretending software is a retail box.
Style/medium: photorealistic editorial product photography, refined and practical.
Composition/framing: square flat-lay or slight three-quarter view, strong central arrangement, generous margins, legible silhouette at thumbnail size.
Lighting/mood: soft controlled studio lighting, trustworthy and finished.
Color palette: parchment #FAF6EC and #F5EFE1, evergreen #2E4A3A, ink #1B231D and #313B33, muted gold #C29A44, restrained river blue #3F6E89.
Constraints: no readable text, no retail packaging fantasy, no logos or trademarks, no WordPress logo, no watermark, no people or faces, no unsupported claims, no generic puzzle pieces, no floating technology icons, no malformed hardware, no illegible pseudo-interface typography.
```

- [ ] **Step 2: Render the generated result once in the conversation**

Expected: the third and final independent hero image is visible.

- [ ] **Step 3: Inspect the result**

Use `view_image`; reject only for the explicit constraint failures named above.

---

### Task 5: Bind Display Order And Pause For Selection

**Files:**

- Create: `hero-option-1-original.png`, `hero-option-2-original.png`, `hero-option-3-original.png`.

**Interfaces:**

- Consumes: the three visible Image Gen results in conversation display order.
- Produces: the sole authoritative option-to-file mapping and one selected style reference.

- [ ] **Step 1: Bind numbers only after all results are visible**

First visible generated image = Option 1, second = Option 2, third = Option 3. Ignore prompt order, planned direction order, completion timing, and tool-call order.

- [ ] **Step 2: Copy the corresponding generated files into the deliverables directory**

Use the exact stable filenames `hero-option-1-original.png`, `hero-option-2-original.png`, and `hero-option-3-original.png`.

- [ ] **Step 3: Ask for selection with the required message and stop**

Send only:

```text
Which option should I build: 1, 2, or 3? Or tell me what you'd like to refine or personalize first.
```

Expected: no supporting image generation begins until the user selects or refines one displayed option.

- [ ] **Step 4: Promote the selected source after the user chooses**

Copy the selected option byte-for-byte to `focused-wordpress-build-01-hero-original.png`. Preserve all three option files.

---

### Task 6: Generate The Three Supporting Gallery Images

**Files:**

- Create: `focused-wordpress-build-02-scoping-original.png`.
- Create: `focused-wordpress-build-03-deliverable-original.png`.
- Create: `focused-wordpress-build-04-support-original.png`.

**Interfaces:**

- Consumes: `focused-wordpress-build-01-hero-original.png` as the style reference.
- Produces: three distinct supporting assets that match the selected hero.

- [ ] **Step 1: Generate the scoping asset in its own Image Gen call**

Attach `focused-wordpress-build-01-hero-original.png` through `referenced_image_paths` as Image 1. Do not also pass `num_last_images_to_include`. Use this prompt:

```text
Use case: product-mockup
Asset type: supporting square WooCommerce product-gallery image, composed for a final 1200 x 1200 image
Input images: Image 1 is the selected hero. Match its medium, palette, lighting, camera treatment, material realism, contrast, and editorial restraint. Use it as a style reference, not as a layout to duplicate.
Primary request: Communicate the focused scoping conversation and customer-approved written build brief through concrete project artifacts.
Scene/backdrop: a tidy working surface or studio setting that belongs naturally beside the selected hero.
Subject: one organized project brief with abstract non-readable content blocks, an annotated website layout, a pen, and a clearly bounded single workstream; the composition should feel agreed, specific, and ready to build.
Style/medium: precisely match Image 1 while keeping this scene visually distinct from the hero.
Composition/framing: square composition, one dominant focal group, generous margins, strong silhouette at thumbnail size, no cropped essential objects.
Lighting/mood: calm, collaborative, trustworthy, and purposeful; match Image 1.
Color palette: preserve the selected hero palette, anchored by parchment #FAF6EC and #F5EFE1, evergreen #2E4A3A, ink #1B231D and #313B33, muted gold #C29A44, and restrained river blue #3F6E89.
Constraints: no readable text, people or hands, logos or trademarks, WordPress logo, watermarks, signatures, fake claims, metrics, generic puzzle pieces, floating icons, malformed paper, or illegible pseudo-interface typography.
```

- [ ] **Step 2: Inspect and save the scoping asset**

Use `view_image`, then save the accepted output as `focused-wordpress-build-02-scoping-original.png`.

- [ ] **Step 3: Generate the deliverable asset in its own Image Gen call**

Attach `focused-wordpress-build-01-hero-original.png` through `referenced_image_paths` as Image 1. Do not also pass `num_last_images_to_include`. Use this prompt:

```text
Use case: product-mockup
Asset type: supporting square WooCommerce product-gallery image, composed for a final 1200 x 1200 image
Input images: Image 1 is the selected hero. Match its medium, palette, lighting, camera treatment, material realism, contrast, and editorial restraint. Use it as a style reference, not as a layout to duplicate.
Primary request: Make the completed installable WordPress theme-or-plugin handoff feel concrete, useful, and finished.
Scene/backdrop: a clean studio surface or digital-workspace setting that belongs naturally beside the selected hero.
Subject: a simple archive or package symbol on a screen, concise setup documentation with abstract non-readable lines, and a polished abstract website preview; communicate a digital ZIP delivery without representing the software as a retail box.
Style/medium: precisely match Image 1 while keeping this scene visually distinct from the hero and scoping image.
Composition/framing: square composition, strong central arrangement, generous margins, clear hierarchy at thumbnail size, no cropped essential objects.
Lighting/mood: complete, practical, calm, and trustworthy; match Image 1.
Color palette: preserve the selected hero palette, anchored by parchment #FAF6EC and #F5EFE1, evergreen #2E4A3A, ink #1B231D and #313B33, muted gold #C29A44, and restrained river blue #3F6E89.
Constraints: no readable text, people or hands, retail packaging, logos or trademarks, WordPress logo, watermarks, signatures, fake claims, metrics, generic puzzle pieces, floating technology icons, malformed devices, or illegible pseudo-interface typography.
```

- [ ] **Step 4: Inspect and save the deliverable asset**

Use `view_image`, then save the accepted output as `focused-wordpress-build-03-deliverable-original.png`.

- [ ] **Step 5: Generate the support asset in its own Image Gen call**

Attach `focused-wordpress-build-01-hero-original.png` through `referenced_image_paths` as Image 1. Do not also pass `num_last_images_to_include`. Use this prompt:

```text
Use case: product-mockup
Asset type: supporting square WooCommerce product-gallery image, composed for a final 1200 x 1200 image
Input images: Image 1 is the selected hero. Match its medium, palette, lighting, camera treatment, material realism, contrast, and editorial restraint. Use it as a style reference, not as a layout to duplicate.
Primary request: Communicate tested delivery, one revision round, and calm post-delivery bug-fix support through credible project artifacts rather than marketing symbols.
Scene/backdrop: an orderly review surface or studio setting that belongs naturally beside the selected hero.
Subject: a realistic testing checklist with abstract non-readable rows, a small set of organized revision notes, and a clean website preview in a review state; the artifacts should imply careful follow-through without inventing messages, ratings, or client proof.
Style/medium: precisely match Image 1 while keeping this scene visually distinct from the other gallery images.
Composition/framing: square composition, cohesive focal group, generous breathing room, immediately legible purpose at thumbnail size, no cropped essential objects.
Lighting/mood: reassuring, methodical, responsive, and calm; match Image 1.
Color palette: preserve the selected hero palette, anchored by parchment #FAF6EC and #F5EFE1, evergreen #2E4A3A, ink #1B231D and #313B33, muted gold #C29A44, and restrained river blue #3F6E89.
Constraints: no readable text, people or hands, chat bubbles, ratings, testimonials, logos or trademarks, WordPress logo, watermarks, signatures, fake metrics or claims, generic puzzle pieces, floating icons, malformed devices, or illegible pseudo-interface typography.
```

- [ ] **Step 6: Inspect and save the support asset**

Use `view_image`, then save the accepted output as `focused-wordpress-build-04-support-original.png`.

---

### Task 7: Produce And Verify Upload-Ready WebP Files

**Files:**

- Create: `focused-wordpress-build-01-hero.webp`.
- Create: `focused-wordpress-build-02-scoping.webp`.
- Create: `focused-wordpress-build-03-deliverable.webp`.
- Create: `focused-wordpress-build-04-support.webp`.

**Interfaces:**

- Consumes: four accepted square original PNG files.
- Produces: four 1200 × 1200 WebP files at quality 88 with source aspect ratio preserved.

- [ ] **Step 1: Convert with bundled Pillow**

Run this exact PowerShell block:

```powershell
$assetPython = 'C:\Users\htper\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
@'
from pathlib import Path
from PIL import Image

root = Path(r"C:\Users\htper\.codex\visualizations\2026\08\03\019fc5ba-ee6e-7bf1-b541-a5f5dbc0bcc9\focused-wordpress-build-assets")
stems = [
    "focused-wordpress-build-01-hero",
    "focused-wordpress-build-02-scoping",
    "focused-wordpress-build-03-deliverable",
    "focused-wordpress-build-04-support",
]
for stem in stems:
    source = root / f"{stem}-original.png"
    target = root / f"{stem}.webp"
    with Image.open(source) as image:
        if image.width != image.height:
            raise SystemExit(f"not square: {source.name} is {image.size}")
        prepared = image.convert("RGB").resize((1200, 1200), Image.Resampling.LANCZOS)
        prepared.save(target, "WEBP", quality=88, method=6)
        print(f"wrote {target.name}")
'@ | & $assetPython -
```

Expected: four `wrote ...webp` lines and no `not square` error.

- [ ] **Step 2: Verify dimensions and decodeability**

Run:

```powershell
$assetPython = 'C:\Users\htper\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
@'
from pathlib import Path
from PIL import Image

root = Path(r"C:\Users\htper\.codex\visualizations\2026\08\03\019fc5ba-ee6e-7bf1-b541-a5f5dbc0bcc9\focused-wordpress-build-assets")
files = sorted(root.glob("focused-wordpress-build-0*.webp"))
assert len(files) == 4, [path.name for path in files]
for path in files:
    with Image.open(path) as image:
        image.verify()
    with Image.open(path) as image:
        assert image.size == (1200, 1200), (path.name, image.size)
        print(path.name, image.size, path.stat().st_size)
'@ | & $assetPython -
```

Expected: four filenames, each followed by `(1200, 1200)` and a positive byte count.

- [ ] **Step 3: Visually inspect every WebP**

Open each file with `view_image`. Reject any conversion that introduces visible blur, clipping, banding, or color shift.

---

### Task 8: Write The Result-Specific Manifest And Hand Off

**Files:**

- Create: `asset-manifest.md`.

**Interfaces:**

- Consumes: four inspected WebP files, the exact prompts used, and the actual visible content of each result.
- Produces: upload guidance and accurate alt text without changing WordPress.

- [ ] **Step 1: Write `asset-manifest.md` with `apply_patch`**

Include, for each numbered asset: source PNG filename, WebP filename, `1200 × 1200`, final prompt, a one-sentence factual visual description, and alt text that describes the accepted image. Begin from these approved drafts, but revise any noun or action that does not appear in the actual result:

1. `Developer workspace with a website preview and code editor for a focused custom build.`
2. `Project brief and annotated layout used to define a focused WordPress build.`
3. `Installable theme or plugin package beside setup documentation and a website preview.`
4. `Testing checklist and revision notes for a completed WordPress build.`

- [ ] **Step 2: Verify the deliverables directory**

Run:

```powershell
Get-ChildItem -LiteralPath 'C:\Users\htper\.codex\visualizations\2026\08\03\019fc5ba-ee6e-7bf1-b541-a5f5dbc0bcc9\focused-wordpress-build-assets' -File | Sort-Object Name | Select-Object Name,Length
```

Expected: `product-copy.md`, `asset-manifest.md`, three hero option originals, four final originals, and four final WebP files are present with nonzero lengths.

- [ ] **Step 3: Final content verification**

Confirm that the copy package contains every offer-contract phrase, each manifest alt describes its actual image, and no asset contains readable nonsense text, a watermark, a logo, a fake testimonial, a fake metric, or an unsupported claim.

- [ ] **Step 4: Handoff without publication**

Return clickable paths to the four WebP files, `product-copy.md`, and `asset-manifest.md`. State explicitly that no WordPress product, database record, checkout setting, or production media was changed.
