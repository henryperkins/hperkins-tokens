# AGENTS.md

This repository keeps its agent guidance in two files, and this is not one of
them. Read them instead of this file:

- [`CLAUDE.md`](CLAUDE.md) — the single source of truth. What this repo is, the
  full command and verifier list, and the architecture notes that need several
  files to understand: `theme.json` as the token source, the two-sheet CSS
  split, the parent/child load-order surgery in `functions.php`, patterns and
  templates, the Condensed Council header, the design-system round-trip, and
  the ledger-row design invariant.
- [`docs/AGENTS.md`](docs/AGENTS.md) — repository guidelines: project
  structure, local WordPress and WP-CLI setup, the build-and-verification
  checklist, coding style, and commit/security rules.

This file is deliberately a pointer. An earlier copy here duplicated CLAUDE.md
wholesale and then drifted from it — it still described navigation as
`wp:navigation {"ref":237}` in `parts/header.html` and named
`nav-close-delight.js` and `header-search.js` as live enqueues long after the
Condensed Council header replaced all three. Duplicated guidance rots silently,
so keep this a pointer and edit `CLAUDE.md`.
