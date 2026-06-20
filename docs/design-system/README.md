# Imladris Design System — vendored reference

This folder is a **reference copy** of the Imladris Design System as it exists in the
claude.ai/design project it was authored in. It is **not** live theme code — the design system's
runnable components are React, which a WordPress **block theme** cannot execute. The theme implements
the *designs* as native block templates and patterns; this folder documents where those designs came
from and how each piece maps into the theme.

- **Source project:** "Imladris Design System" — <https://claude.ai/design/p/89e0d236-6451-44a0-8280-e4b7917360ab>
- **Pulled:** 2026-06-20, read-only, via the `design-pull` skill.
- **Classification:** *pushed-hybrid* — the project carries real editable `.jsx` component source
  **and** a compiled `_ds_bundle.js` (global `window.ImladrisDesignSystem_89e0d2`). Its origin is
  this very theme, so the pull is a round-trip.

See **[INDEX.md](./INDEX.md)** for the full provenance, the DS-component → theme-pattern map, what was
implemented in this pull, and an honest account of what is vendored locally vs. what still lives only
in the project (and how to re-pull it).

The token layer was verified **1:1** against `theme.json` (zero drift); the faithful token mirror is
staged under `../../.design-pull/imladris-design-system/`.
