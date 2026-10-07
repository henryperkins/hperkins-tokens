# One-page résumé refinement — 6 October 2026

The reviewed design is implemented in the managed
`support-engineering-v2/hperkins-tokens` worktree. Its theme-owned DOCX and PDF
are local candidates. The primary checkout, WordPress database and accepted
page snapshots are unchanged. No commit, push or deployment occurred.

## Result

- White paper, a 30pt letterhead, stronger employer/project names and dark
  right-aligned contact, status and date metadata.
- An 11pt body and 9.5pt supporting metadata. The 11.5pt first render needed
  two Letter pages; the final 11pt layout retains all prose on one page.
- Six font faces derived from existing theme WOFF2 assets are embedded in
  the editable DOCX and exported PDF. No global font installation is needed.
- Company-first experience, visible GitHub address, summary before WCUS,
  explicit contribution states and release metadata grouped with each project.
  Evidence attribution, historical dates and tagged release URLs remain intact.

## Publication link correction

The DJ Lee & Voices of Judah evidence link now points to the maintained
`https://hperkins.blog/work/dj-lee-voices-of-judah/` case study instead of
`https://thevoicesofjudah.com/`, which failed the pre-release DNS check.
A fresh request to the owned case study returned HTTP 200 and the expected
title and booking implementation evidence. Its URL is already used by the
Council header and Support Engineering page.

This changes exactly one hyperlink destination in the résumé. Its label and
all 3,757 normalized visible characters remain unchanged. The rebuilt Letter
and A4 artifacts retain the same one-page layouts, links, tags and font faces.

The editable source builder is `scripts/update-support-resume.py`; the font
adapter is `scripts/lib/resume-fonts.py`. Both read existing theme assets.
Native Word export remains in `scripts/export-support-resume.ps1` and now
accepts explicit alternate input/output paths for QA.

## Verification

- Canonical source inventory: **386/386 Node tests** pass, with no skips.
- Builder/parity regression tests: **21/21 Python tests** pass, including
  table traversal, metadata size boundaries, idempotence, semantic grouping
  of multiline links and actual embedded-font inspection.
- Strict final parity: **3,757 visible characters**, **17 ordered logical
  hyperlinks**, **one H1**, **four H2s**, **six embedded font faces** and
  **one page**. DOCX and PDF text match exactly after whitespace normalization.
  Independent duplicate destinations remain independent links.
- Final Letter is **612 × 792pt**. Visible text leaves **34.27pt** below the
  final line; its color and grayscale renders have no clipping, overlap or
  missing glyphs.
- A4 QA is **595.32 × 841.92pt**, one page, with **71.49pt** bottom clearance.
  Its text, links, tags and embedded fonts pass the same strict checks.
- Independent visual and parity review found no actionable issues.
- Artifact source, stable résumé-route source, content ownership,
  performance assets and whitespace checks pass.

Artifact hashes:

```text
bf20570dd4a3efc9501627a3bb1f7cfb7a1392c81ece4cfbcce839a2236a4b68  assets/documents/henry-perkins-wordpress-support-engineer-resume.docx
6f65e5643677c1d2386937f901968fbef3778b54710403a3b3cc773567985706  assets/documents/henry-perkins-wordpress-support-engineer-resume.pdf
4d72f7304d850481235ea3c10cef9644d447924003629186ada60378542bf141  output/resume-design-review/refined-a4.pdf
```

## Reproduction and limits

Use the selected Python interpreter with `python-docx`, `pdfplumber`, `pypdf`
and `fonttools[woff]`. This run used the bundled workspace Python, with the
additional font conversion packages installed only in ignored task-local
`.design-pull/resume-layout/deps` and selected with `PYTHONPATH`.

```powershell
python scripts/update-support-resume.py
./scripts/export-support-resume.ps1
python scripts/verify-placement-text-parity.py
python scripts/lib/update-support-resume.test.py
python scripts/lib/verify-placement-text-parity.test.py
node scripts/verify-placement-artifacts.js
node scripts/verify-resume-route.js --source-only
```

Native Word exported the editable source; bundled Poppler rendered every final
page. The packaged document renderer's raster stage also inspected the exact
matching Word PDF. Bundled LibreOffice is unavailable on this Windows runtime;
desktop LibreOffice was not used. Physical printing and other Word/office
renderers were not tested.

The initial bounded public HTTP check reached **14 of 15 distinct HTTPS
destinations**; its sole DNS failure was corrected as described above. The
individual original curl results remain in
`output/resume-design-review/http-links.json`. The replacement case-study
request is a focused check; it is not counted as a fresh full-destination gate.

This report records the pre-publication artifact verification. Publication
is authorized separately, and the final release records fresh public
route/PDF checks.
