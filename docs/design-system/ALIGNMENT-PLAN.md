# Imladris DS ⇄ hperkins-tokens — alignment plan & ready-to-run prompt

> **Superseded route-ownership instructions (2026-07-21).** This document is a
> historical design-project sync plan and must not be executed verbatim. The
> WordPress database bodies for Job Placement Digest and Placement Method and
> Evidence are canonical; their files under `content/page-snapshots/` are
> automatically verified mirrors. The former
> `patterns/job-placement-digest.php` full-page seed is retired and must remain
> absent. A design-project sync may mirror the snapshots and slug templates, but
> must not recreate a third full-page copy.

> **Purpose.** Bring the canonical claude.ai/design **Imladris Design System** project into
> alignment with the source of truth it claims to mirror: the `hperkins-tokens` theme
> (this repo, GitHub `henryperkins/hperkins-tokens`) and the live surfaces on
> <https://hperkins.blog>. Authored 2026-07-15 on branch
> `claude/imladris-design-alignment-0dbjli`.
>
> **Direction.** This is a **design-*sync* (push)**, the opposite of a `design-pull`. Nothing
> in the *theme* changes. The work updates the *design project* so its embedded theme mirror,
> its version provenance, and its documentation match what actually shipped.
>
> **Target project.** "Imladris Design System" — UUID
> `b844cbab-6656-458c-91f4-81f1762117a5`
> (<https://claude.ai/design/p/b844cbab-6656-458c-91f4-81f1762117a5>),
> `PROJECT_TYPE_DESIGN_SYSTEM`, owner Henry Perkins, `canEdit: true`.
> Driven by the `DesignSync` MCP (auth via `/design-login`) together with the `/design-sync` skill.
>
> **Update (2026-07-18) — this plan was authored against theme v0.3.42 and has NOT run.**
> The theme has since shipped **0.3.43** (claim-accuracy copy pass), **0.3.44**, and **0.3.45**.
> Two of those touched `theme.json`: the self-hosted font families were given unique
> `HPerkins …` internal names (body at 0.3.44; display/label/mono at 0.3.45) to isolate them
> from WordPress.com's same-named remote faces — see the **2026-07-18** entry in
> [`INDEX.md`](./INDEX.md). So the "token layer unchanged since 0.3.39 / refresh is a no-op"
> premise below is **false as of 0.3.44**, and the target version throughout is now **v0.3.45**.
> Re-scope before executing: the mirror push must carry the current `theme.json`, and the
> `readme.md` version edits below (v0.3.42) become v0.3.45.
>
> **Update (2026-07-19) — target is now v0.3.46.** The typography pass changed `theme.json`
> again: the `2xl`–`5xl` presets became fluid `clamp()` values (mirrored in
> `custom.type.hero/h1/h2/h3`), `custom.text.faint` darkened to the ink-500 value,
> `styles.elements.h4` gained weight 600, and a `styles.elements.button` type role was added —
> see the **2026-07-19** entry in [`INDEX.md`](./INDEX.md). The DS `tokens/typography.css`
> still describes the fixed pixel scale, so the type-scale round-trip claim below is also
> stale now; the same two execution options (byte-mirror + recorded delta, or reflect into DS
> tokens) apply. `style.css`, `imladris-pages.css`, `patterns/wapuu-home-hero.php`, and the
> new `templates/archive.html`/`search.html`/`404.html` are additional mirror-set changes.

---

## 1. Why the project is out of alignment

The project was declared canonical on **2026-07-14 against `theme.json` v0.3.40** and mirrors the
theme under `_source/theme/`. The theme has since shipped **two releases** the mirror predates:

| Release | Commit | What landed | Touches the mirror? |
|---|---|---|---|
| **0.3.41** | `967bc15` | Job Placement Digest route: `patterns/job-placement-digest.php`, `content/page-snapshots/job-placement-digest.html`, `templates/page-job-placement-digest.html`, digest CSS in `imladris-pages.css`, `overflow-wrap:anywhere` on `.hp-artifact__link a` in `style.css` | **Yes** — new pattern + snapshot; `style.css` + `imladris-pages.css` edited |
| **0.3.42** | `f1d02ce` | Prominent action system: `.hp-action-rail` / `.hp-action-panel.is-closing` CSS in `style.css`; rail/panel markup into `patterns/wapuu-home-hero.php`, `patterns/about-resume.php`, `patterns/job-placement-digest.php` and snapshots `about.html`, `front-page.html`, `job-placement-digest.html`, `work-flavor-agent-demo.html` | **Yes** — `style.css` + several mirrored patterns/snapshots edited |

There was also an inter-release change between 0.3.40 and 0.3.41 — **`29a09d3` "Work index →
PortfolioPage design (leaner ledger)"** — touching `patterns/work-index.php`,
`content/page-snapshots/work.html`, and `imladris-pages.css`. Whether the mirror captured it is
uncertain, which is exactly why the plan **re-pushes the whole mirror file-set** rather than a
hand-computed minimal diff (overwriting an unchanged file is a harmless no-op).

### The token layer — palette/spacing/type SCALES still round-trip; the font FAMILY NAMES do not (0.3.44/0.3.45)

At authoring time `theme.json` had last changed at **0.3.39** (`136ee78`), so this section read
"the token layer is aligned — do not touch it." That is **no longer true**: 0.3.44 and 0.3.45
renamed every self-hosted font family to a unique `HPerkins …` internal name
(`settings.typography.fontFamilies[].fontFamily` and each `fontFace.fontFamily`). The palette,
spacing scale, radius/shadow/type-scale tokens are still unchanged and still round-trip 1:1, but
`_source/theme/theme.json` is now stale and the DS `tokens/typography.css` family declarations no
longer match the theme's internal names. Two correct options at execution time: (a) re-push the
current `_source/theme/theme.json` (byte-mirror — carries the rename verbatim) and leave the DS
`tokens/*.css` at their design-level names, recording the delta exactly as
[`INDEX.md` 2026-07-18](./INDEX.md) does; or (b) additionally reflect the `HPerkins …` names in
`tokens/typography.css` if the project wants byte-parity there too. Either way the token "refresh"
is **not** a no-op, and `readme.md`'s version string must read **v0.3.45**.

---

## 2. Exact drift inventory (project `_source/theme/` vs. current theme)

The mirror is a **curated subset** of the theme (it carries `style.css`, `theme.json`,
`imladris-pages.css` flattened, `parts/`, 20 `patterns/`, three blog `templates/`, four
`page-snapshots/`). Against the current tree:

**Stale (content changed since the mirror) — overwrite:**

- `_source/theme/style.css` — missing 0.3.41 `overflow-wrap` + all 0.3.42 action-rail/panel rules.
- `_source/theme/imladris-pages.css` — missing 0.3.41 digest section (and possibly the PortfolioPage work rework).
- `_source/theme/patterns/wapuu-home-hero.php` — missing the 0.3.42 `hp-action-rail`.
- `_source/theme/patterns/work-index.php` — PortfolioPage rework may be uncaptured.
- `_source/theme/content/page-snapshots/about.html` — missing the 0.3.42 About-hero rail.
- `_source/theme/content/page-snapshots/front-page.html` — missing the 0.3.42 closing panel.
- (All other mirrored files re-pushed as harmless no-ops for byte-exactness.)

**Missing route evidence — add only after live export and verification:**

- `_source/theme/content/page-snapshots/job-placement-digest.html` — verified
  mirror of the canonical WordPress database body.
- `_source/theme/content/page-snapshots/placement-method-evidence.html` —
  verified mirror of the canonical research-appendix database body.

Do not add `_source/theme/patterns/job-placement-digest.php`; that stale
full-page seed was retired on 2026-07-21.

**Provenance falsehoods in `readme.md` — edit:**

- Theme version stated as **v0.3.40** (two places) → **v0.3.42**.
- Live-surface list omits **`/job-placement-digest/`** and **`/contact/`**.
- `templates/` described as **"seven starting folders"** but the project already carries **eight** (it lists `digest`, added with 0.3.41 but never named in the prose).

---

## 3. The alignment work, in tiers

Do Tier 1 for a truthful, minimal alignment. Tiers 2–3 make the mirror and the live-surface
recreations faithful rather than merely truthful; each carries one decision (§4).

### Tier 1 — required (truthful provenance + shipped routes)

1. **Refresh the existing mirror file-set** from the current working tree (overwrite; §5 table A).
2. **Add the two verified database-body snapshots** to the mirror (§5 table B).
3. **Edit `readme.md`** — version 0.3.40 → 0.3.42, live surfaces, template count (§6).
4. **Re-verify the token round-trip as a no-op** (theme.json unchanged; §7).

### Tier 2 — recommended (complete the mirror; represent 0.3.42 in the DS)

1. **Complete the `_source/theme/` mirror** so it stops being a partial snapshot (§5 table C):
   the four content patterns it lacks (`about-resume`, `ai-enablement`, `contact`,
   `how-this-was-built`), the seven `page-*` template shells, the
   `work-flavor-agent-demo` snapshot, and `readme.txt` (the version/changelog source of record).
2. **Add a `guidelines/prominent-actions.card.html` specimen** documenting the 0.3.42
   composition (**decision B**, §4 + §8). This is a *guideline card for a composition over the
   Button primitive* — **not** a new component; the theme is explicit that prominent actions add
   "no new canonical design-system primitive."

### Tier 3 — optional (live-content fidelity)

1. **Verify the live surfaces match the DS recreations.** The project's
   `ui_kits/portfolio/{HomeView,WorkView,JournalView,DigestView}.jsx` and
   `design_handoff_imladris_design_system/templates/*.dc.html` are reference recreations of
   <https://hperkins.blog>. Every live route is now represented (Digest arrived with 0.3.41).
   The alignment check is behavioral, and this repo already owns the instruments — run them
   against the deployed site rather than eyeballing the React:
   - `node scripts/verify-content-ownership.js` — routes + snapshot parity (incl. the digest).
   - `node scripts/verify-prominent-actions.js` — the five rail contexts, three closing panels,
     44px targets, focus, mobile stacking, overflow, screenshots.
   - `node scripts/verify-journal-polish.js`, `verify-ring-cards-mobile.js`,
     `verify-homepage-hero-polish.js` — surface-level render parity.
   If a recreation is meant to *show* the new action rail/panel (Home hero, About hero, front-page
   close, Digest close, Flavor demo close), update that `.jsx`/`.dc.html` to reflect it. This layer
   is reference-only React for a block theme; keep the effort proportionate.

---

## 4. Decisions to confirm before executing

- **Decision A — mirror completeness.** Keep `_source/theme/` a curated subset (Tier 1 only), or
  complete it to a faithful full mirror (Tier 2 step 1)?
  **Recommendation: complete it.** A "reference mirror" that silently omits four live-route
  patterns and every `page-*` shell is a trap for the next reader; completeness is cheap here
  because every file already exists in the tree and uploads as-is.
- **Decision B — represent the prominent action system in the DS.** Add a
  `guidelines/prominent-actions.card.html` specimen (Tier 2 step 2), or leave the composition
  documented only theme-side (`docs/design-system/INDEX.md`, `readme.txt`)?
  **Recommendation: add the guideline card** and one cross-reference line in `readme.md`. It keeps
  the DS honest about what ships without violating the "not a new component" stance — a *guideline*
  card is the correct home for a documented composition, exactly like `motion-focus` and
  `settlement`. Author it from a sibling card (see §8) so it uses the project's real token vars and
  `@dsCard` chrome; **do not** add it to `components/`.

---

## 5. DesignSync write manifest (localPath → project path)

`finalize_plan` with `localDir` = the repo root (`<repo-root>` — the local `hperkins-tokens`
checkout), so every
`localPath` below is a real file in the tree that `write_files` uploads verbatim — **contents
never enter model context.** The mirror flattens `assets/imladris-pages.css` →
`_source/theme/imladris-pages.css`; `write_files` handles that because `localPath` and `path` are
independent. **No deletes** — the mirror only gains files.

### Table A — overwrite the existing mirror file-set (Tier 1)

| localPath (repo) | path (project) |
|---|---|
| `style.css` | `_source/theme/style.css` |
| `theme.json` | `_source/theme/theme.json` |
| `assets/imladris-pages.css` | `_source/theme/imladris-pages.css` |
| `parts/footer.html` | `_source/theme/parts/footer.html` |
| `parts/header.html` | `_source/theme/parts/header.html` |
| `templates/front-page.html` | `_source/theme/templates/front-page.html` |
| `templates/home.html` | `_source/theme/templates/home.html` |
| `templates/single.html` | `_source/theme/templates/single.html` |
| `content/page-snapshots/about.html` | `_source/theme/content/page-snapshots/about.html` |
| `content/page-snapshots/ai-enablement.html` | `_source/theme/content/page-snapshots/ai-enablement.html` |
| `content/page-snapshots/front-page.html` | `_source/theme/content/page-snapshots/front-page.html` |
| `content/page-snapshots/work.html` | `_source/theme/content/page-snapshots/work.html` |
| `patterns/artifact-row.php` | `_source/theme/patterns/artifact-row.php` |
| `patterns/case-study-lead.php` | `_source/theme/patterns/case-study-lead.php` |
| `patterns/evidence-first.php` | `_source/theme/patterns/evidence-first.php` |
| `patterns/imladris-avatar.php` | `_source/theme/patterns/imladris-avatar.php` |
| `patterns/imladris-badge.php` | `_source/theme/patterns/imladris-badge.php` |
| `patterns/imladris-button.php` | `_source/theme/patterns/imladris-button.php` |
| `patterns/imladris-callout.php` | `_source/theme/patterns/imladris-callout.php` |
| `patterns/imladris-icon-button.php` | `_source/theme/patterns/imladris-icon-button.php` |
| `patterns/imladris-input.php` | `_source/theme/patterns/imladris-input.php` |
| `patterns/imladris-pullquote.php` | `_source/theme/patterns/imladris-pullquote.php` |
| `patterns/imladris-ring-card.php` | `_source/theme/patterns/imladris-ring-card.php` |
| `patterns/imladris-subscribe.php` | `_source/theme/patterns/imladris-subscribe.php` |
| `patterns/imladris-tag.php` | `_source/theme/patterns/imladris-tag.php` |
| `patterns/operational-story.php` | `_source/theme/patterns/operational-story.php` |
| `patterns/proof-bar.php` | `_source/theme/patterns/proof-bar.php` |
| `patterns/proof-product.php` | `_source/theme/patterns/proof-product.php` |
| `patterns/quote-block.php` | `_source/theme/patterns/quote-block.php` |
| `patterns/wapuu-home-hero.php` | `_source/theme/patterns/wapuu-home-hero.php` |
| `patterns/work-entry.php` | `_source/theme/patterns/work-entry.php` |
| `patterns/work-index.php` | `_source/theme/patterns/work-index.php` |

### Table B — add verified route mirrors (Tier 1)

| localPath (repo) | path (project) |
|---|---|
| `content/page-snapshots/job-placement-digest.html` | `_source/theme/content/page-snapshots/job-placement-digest.html` |
| `content/page-snapshots/placement-method-evidence.html` | `_source/theme/content/page-snapshots/placement-method-evidence.html` |

### Table C — complete the mirror (Tier 2, decision A = "complete")

| localPath (repo) | path (project) |
|---|---|
| `patterns/about-resume.php` | `_source/theme/patterns/about-resume.php` |
| `patterns/ai-enablement.php` | `_source/theme/patterns/ai-enablement.php` |
| `patterns/contact.php` | `_source/theme/patterns/contact.php` |
| `patterns/how-this-was-built.php` | `_source/theme/patterns/how-this-was-built.php` |
| `templates/page-about.html` | `_source/theme/templates/page-about.html` |
| `templates/page-ai-enablement.html` | `_source/theme/templates/page-ai-enablement.html` |
| `templates/page-case-study.html` | `_source/theme/templates/page-case-study.html` |
| `templates/page-contact.html` | `_source/theme/templates/page-contact.html` |
| `templates/page-how-this-was-built.html` | `_source/theme/templates/page-how-this-was-built.html` |
| `templates/page-job-placement-digest.html` | `_source/theme/templates/page-job-placement-digest.html` |
| `templates/page-work.html` | `_source/theme/templates/page-work.html` |
| `content/page-snapshots/work-flavor-agent-demo.html` | `_source/theme/content/page-snapshots/work-flavor-agent-demo.html` |
| `readme.txt` | `_source/theme/readme.txt` |

### Table D — the prominent-actions guideline card (Tier 2, decision B only)

| localPath (repo) | path (project) |
|---|---|
| `docs/design-system/design-sync/guidelines/prominent-actions.card.html` | `guidelines/prominent-actions.card.html` |

> Tables A–C all match the single finalize glob **`_source/theme/**`**. Table D is a **single
> file** that matches the separate **`guidelines/prominent-actions.card.html`** finalize entry, and
> is written **only when decision B is taken** (§8 authors it in the repo at that localPath first).

---

## 6. `readme.md` edits (project root, exact)

Apply with `get_file readme.md` → four literal find/replace edits → `write_files` (inline `data`).
Each FIND string below is unique in the current `readme.md`:

```text
# Edit 1 — version in the "Theme source (canonical)" bullet
FIND:    "HPerkins Tokens" v0.3.40 on Automattic's Assembler parent
REPLACE: "HPerkins Tokens" v0.3.45 on Automattic's Assembler parent

# Edit 2 — version in the SETTLEMENT "canonical because…" sentence
FIND:    this project is canonical because its tokens round-trip `theme.json` v0.3.40
REPLACE: this project is canonical because its palette/spacing/type-scale tokens round-trip `theme.json` v0.3.45 (font family names diverge — see INDEX.md 2026-07-18)

# Edit 3 — live-surface list in "Sources"
FIND:    **Live site:** https://hperkins.blog (Home, /work/, /about/, /ai-enablement/, /how-this-was-built/)
REPLACE: **Live site:** https://hperkins.blog (Home, /work/, /about/, /ai-enablement/, /job-placement-digest/, /contact/, /how-this-was-built/)

# Edit 4 — template-folder count + list in "Index" (add `digest`, seven→eight)
FIND:    `templates/` — seven starting folders for consuming projects: `home`, `about`, `ai-enablement`, `contact`, `work` (case study), `work-index`, `portfolio-page`
REPLACE: `templates/` — eight starting folders for consuming projects: `home`, `about`, `ai-enablement`, `contact`, `digest`, `work` (case study), `work-index`, `portfolio-page`
```

If **decision B = add the card**, also append to the "Notes / honest gaps" list:

> - **Prominent actions (theme v0.3.42):** the live theme composes the Button primitive into an
>   opted-in `hp-action-rail`, and a closing `hp-action-panel is-closing`, for prominent page
>   actions. This is a documented composition over the canonical Button — not a new component. See
>   `guidelines/prominent-actions.card.html`.

---

## 7. Token round-trip re-verification (colors/spacing/effects no-op; typography changed)

1. `get_file tokens/colors.css` (and `effects.css`, `spacing.css`) and confirm values still equal
   the `theme.json` presets/custom tree. They will: the palette, spacing, radius, shadow, and
   type-*scale* tokens are unchanged since 0.3.39. **`typography.css` is the exception** — 0.3.44/0.3.45
   renamed the self-hosted `fontFamily` internal names to `HPerkins …`, so the theme's
   `theme.json` family declarations no longer match the DS family names (see the divergence note in §1
   and [`INDEX.md` 2026-07-18](./INDEX.md)); decide per §1 whether to mirror that into `tokens/typography.css`.
2. Theme-side, `node scripts/verify-style-token-usage.js` already proves every `var()` in
   `style.css` resolves against `theme.json`-generated variables — reference it as the standing guard.
3. Record the round-trip as **colors/spacing/effects verified 1:1 at v0.3.45, font family names
   diverged (recorded)** in the INDEX (§9). Do not edit any token file unless option (b) in §1 is chosen.

Confirmed values (for spot-checking, from `theme.json` at v0.3.45): `radius.lg 12px`,
`shadow.sm "0 1px 3px rgba(27,35,29,0.07), 0 1px 2px rgba(27,35,29,0.05)"`,
`shadow.md "0 4px 14px rgba(27,35,29,0.08), 0 2px 5px rgba(27,35,29,0.05)"`,
`surface.card #FAF6EC`, `surface.sunken #ECE4D2`, `border.hair #DED2B8`,
`rule.gold / gold-500 #C29A44`; theme aliases `--hp-rule-entry: 3px`, `--hp-touch-min: 44px`.

---

## 8. Spec for `guidelines/prominent-actions.card.html` (decision B)

Author it **from a sibling card as the template** — `get_file guidelines/motion-focus.card.html`
— so it inherits the project's real token variables and `@dsCard` card chrome. First line must be
the card marker, e.g.:

```html
<!-- @dsCard group="Components" name="Prominent actions" subtitle="Action rail + closing panel — a composition over Button" -->
```

Content it must specify, faithful to `style.css` (v0.3.42) and
`docs/superpowers/specs/2026-07-14-prominent-action-system-design.md`:

- **Opt-in, not global.** `hp-action-rail` on prominent `core/buttons`; `hp-action-panel is-closing`
  (a `core/group`) wraps eyebrow + heading + copy + a rail for *closing invitations only*.
- **Rail anatomy** — `width: fit-content; max-width: 100%`, `gap` & `padding` = `space-1`,
  `1px` `border-hair`, `radius.lg` (12px), `shadow.sm`, a 135° `surface.sunken → surface.card`
  gradient; button links get `min-block-size` = 44px. One-button groups stay intentional.
- **Panel anatomy** — `padding` = `space-5` (→ `space-4` ≤600px), `1px` `border-hair`, a fixed
  `border-left: var(--hp-rule-entry) (3px) solid gold` (preserves the fixed-anatomy invariant),
  `radius.lg`, `shadow.md`, the same gradient, and the `assets/img/emblem.svg` as a decorative
  gold CSS mask at `opacity 0.32` in the upper-right (absent from the a11y tree).
- **Responsive** — ≤600px the rail goes full-width and stacks; no overflow at 320px; no JS.
- **Excluded** (state explicitly): header Subscribe, nav, search, form submits, icon buttons, and
  the Button specimen keep the bare primitive.
- **Framing line:** "A composition of existing Imladris primitives — not a replacement for
  `core/button` and not a new canonical design-system primitive."

Write it to the repo at `docs/design-system/design-sync/guidelines/prominent-actions.card.html`
first (so it is reviewable and version-controlled), then `write_files` it to the project at
`guidelines/prominent-actions.card.html`.

---

## 9. Post-execution — keep the theme-side provenance truthful

After the push succeeds:

1. Spot-check via `get_file`: `_source/theme/style.css` has the intended release
   version; both route snapshots exist;
   `_source/theme/patterns/job-placement-digest.php` is absent; and `readme.md`
   shows the same release version.
2. Add a dated entry to `docs/design-system/INDEX.md` recording the sync (project mirror refreshed
   to v0.3.45, colors/spacing/effects round-trip re-verified 1:1 with the font-family-name
   divergence recorded, digest route + prominent-action composition now represented). Convert the
   "pending" note (added with this plan) into the completed record.
3. Bump nothing in the theme — **no `style.css`/`theme.json`/`Version` change**; this alignment is
   entirely project-side. This plan doc and the INDEX note are docs-only.

---

## 10. Ready-to-run prompt

Paste the block below into a session that has the **`DesignSync` MCP** connected (authenticate
first with `/design-login`) and, ideally, the **`/design-sync`** skill. It executes Tiers 1–2 with
both recommendations taken; trim Tables/steps to change the tier or reverse a decision.

```text
Align the canonical claude.ai/design "Imladris Design System" project
(UUID b844cbab-6656-458c-91f4-81f1762117a5) with the current hperkins-tokens theme
(this repo, v0.3.45) and https://hperkins.blog. This is a design-SYNC push — change only the
design project, never the theme. Follow docs/design-system/ALIGNMENT-PLAN.md.

1. DesignSync get_project b844cbab-6656-458c-91f4-81f1762117a5 — confirm type
   PROJECT_TYPE_DESIGN_SYSTEM and canEdit:true. Then list_files to confirm the _source/theme/
   layout before writing.
2. If adding the prominent-actions guideline card (decision B): get_file
   guidelines/motion-focus.card.html as a structural template, then author
   docs/design-system/design-sync/guidelines/prominent-actions.card.html per ALIGNMENT-PLAN §8
   (a composition over Button; NOT a components/ entry).
3. DesignSync finalize_plan:
     projectId: b844cbab-6656-458c-91f4-81f1762117a5
     localDir:  <repo root>
     writes:    ["_source/theme/**", "readme.md", "guidelines/prominent-actions.card.html"]
     deletes:   []
   (Drop the guidelines/ glob if decision B is "no".)
4. DesignSync write_files (planId from step 3) using the localPath→path pairs in
   ALIGNMENT-PLAN §5 Tables A, B, and C — plus the Table D row
   (docs/design-system/design-sync/guidelines/prominent-actions.card.html →
   guidelines/prominent-actions.card.html) when decision B is taken. Each file uploads verbatim
   from disk via localPath. Split into ≤256-file batches if needed (there are ~45).
5. get_file readme.md, apply the four string edits in ALIGNMENT-PLAN §6 (v0.3.40→v0.3.45 twice
   with the font-family-divergence qualifier on edit 2, live-surface list, seven→eight templates)
   plus the Notes/honest-gaps line if decision B, then write_files readme.md with the edited
   content as inline data.
6. Verify the colors/spacing/effects round-trip is still 1:1, but note theme.json DID change at
   0.3.44/0.3.45 (font family internal names → HPerkins …): the pushed _source/theme/theme.json
   carries that rename, and per ALIGNMENT-PLAN §1 decide whether to also mirror it into
   tokens/typography.css — spot-check tokens/colors.css against theme.json.
7. Spot-check via get_file that _source/theme/style.css has the intended release
   version, both route snapshots exist, and
   _source/theme/patterns/job-placement-digest.php remains absent.
8. Report exactly what was written/edited and the token-round-trip result. Do NOT modify any
   theme file. Afterward, record the completed sync in docs/design-system/INDEX.md.
```

---

### One-line summary

Push the intended release into the design project's `_source/theme/` mirror, add
the two verified route snapshots without recreating the retired digest pattern,
correct `readme.md`'s stale provenance, optionally document the
0.3.42 prominent-action composition as a guideline card — and change **nothing** in the theme.
Its palette/spacing/effects/type-scale tokens still round-trip the project 1:1; only the
self-hosted font *family names* diverged at 0.3.44/0.3.45 (recorded in INDEX.md, not a token
redefinition), so the `_source/theme/theme.json` byte-mirror carries them and the DS
`tokens/typography.css` decision is per §1.
