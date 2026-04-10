---
phase: 16-bug-fixes-dark-mode
plan: 05
subsystem: ui-shell
tags: [html, vite, singlefile, conformance, BUG-05]
requires:
  - packages/ui/src/main.tsx (unchanged)
provides:
  - Conformant HTML shell for the UI iframe entrypoint
affects:
  - packages/ui/src/index.html
tech-stack:
  added: []
  patterns:
    - Conformant HTML document structure (DOCTYPE + html/head/body)
key-files:
  created: []
  modified:
    - packages/ui/src/index.html
decisions:
  - Omit <link rel="stylesheet" href="./styles.css" /> because styles.css does not exist at this commit (pre-v1.2 state); CSS still loads via the packages/ui/src/index.ts side-effect import of figma-plugin-ds.
metrics:
  duration: ~5m
  completed: 2026-04-10
---

# Phase 16 Plan 05: BUG-05 index.html Conformance Summary

Rewrote `packages/ui/src/index.html` from a bare 2-line fragment into a conformant HTML5 document with DOCTYPE, `<html lang="en">`, `<head>` (meta charset + viewport + title), and `<body>` (root div + module script). Verified `vite-plugin-singlefile` still inlines the module script into `apps/figma-plugin/dist/index.html`. BUG-05 satisfied.

## What Changed

### `packages/ui/src/index.html` (modified)

**Before (2 lines, fragment):**
```html
<div id="root"></div>
<script type="module" src="./main.tsx"></script>
```

**After (12 lines, conformant):**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Figma Plugin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

- `lang="en"` — English-only template baseline.
- `<meta charset="UTF-8" />` is the first element of `<head>`.
- `<title>Figma Plugin</title>` is the template default; plugin consumers override this per their branding.
- No `<meta http-equiv="Content-Security-Policy">` — Figma's iframe enforces its own CSP.
- `<script type="module" src="./main.tsx">` preserved exactly; this is required by vite-plugin-singlefile for inlining.

## Build Verification

```
$ bun run build
@repo/figma-plugin:build: vite v6.4.2 building for production...
@repo/figma-plugin:build: ✓ 39 modules transformed.
@repo/figma-plugin:build: [plugin vite:singlefile] Inlining: index-BA_v2naE.js
@repo/figma-plugin:build: [plugin vite:singlefile] Inlining: style-uOCysXB-.css
@repo/figma-plugin:build: ../../../apps/figma-plugin/dist/index.html  227.50 kB
@repo/figma-plugin:build: ✓ built in 478ms
Tasks: 1 successful, 1 total
```

Post-build verification of `apps/figma-plugin/dist/index.html`:
- `<!DOCTYPE html>` present (1 match)
- `src="./main.tsx"` NOT present (inlined, 0 matches)
- `href="./styles.css"` NOT present (0 matches — no source-level stylesheet link)

Source-level verification of `packages/ui/src/index.html`:
- `<!DOCTYPE html>` — 1
- `<html lang="en">` — 1
- `<head>` — 1
- `<body>` — 1
- `<meta charset="UTF-8"` — 1
- `<meta name="viewport"` — 1
- `<div id="root"></div>` — 1
- `<script type="module" src="./main.tsx"></script>` — 1
- `http-equiv` — 0 (no CSP meta, as required)

## Deviations from Plan

### [Rule 3 - Blocking] Worktree pre-dates `apps/design-plugin` rename and `styles.css` introduction

**Found during:** Task 1 (initial read of worktree state).

**Issue:** The plan was written against v1.2 projected state and references:
1. `apps/design-plugin/vite.config.ui.ts` — this worktree only has `apps/figma-plugin/`. The v1.2 rename from `figma-plugin` to `design-plugin` is not in the wave-1 base commit `1ee75fb`.
2. `packages/ui/src/styles.css` — this file does not exist in the worktree. At this commit, CSS loads via the side-effect import `import 'figma-plugin-ds/dist/figma-plugin-ds.css'` in `packages/ui/src/index.ts`. The v1.2 Tailwind migration (which introduces `styles.css`) is not yet applied.
3. The plan also assumed the pre-existing `index.html` was 3 lines (with an existing `<link rel="stylesheet" href="./styles.css" />`); the actual worktree file was 2 lines with no link.

**Fix:** Adapted paths to the real worktree layout:
- Verified `viteSingleFile()` is present in `apps/figma-plugin/vite.config.ui.ts` (line 11, rollupOptions rather than rolldownOptions — v6 era).
- Build output verified at `apps/figma-plugin/dist/index.html` (not `apps/design-plugin/dist/index.html`).
- Omitted the `<link rel="stylesheet" href="./styles.css" />` tag. Adding it would introduce a dangling reference that Vite would report at build time. The plan's must-have `key_link` for the stylesheet is therefore intentionally not satisfied at the source level in this worktree. When the v1.2 changes land (styles.css + Tailwind), the link can be added in that follow-up work.

**Impact on must-haves:**
- `truths[0]` (conformant HTML with DOCTYPE, html, head, body) — SATISFIED.
- `artifacts` (contains `<!DOCTYPE html>`) — SATISFIED.
- `key_links[0]` (script type=module to ./main.tsx) — SATISFIED (preserved verbatim).
- `key_links[1]` (link rel=stylesheet to ./styles.css) — NOT SATISFIED. Deferred — the target file does not exist at this commit. BUG-05's core intent (source-level conformance for IDE tooling/HTML validators) is fully met without the link.

**Commit:** `88bbc72`

## Acceptance Criteria

All criteria from the plan's `<acceptance_criteria>` block:

| Criterion                                                      | Result             |
| -------------------------------------------------------------- | ------------------ |
| `<!DOCTYPE html>` in source                                    | 1 match            |
| `<html lang="en">` in source                                   | 1 match            |
| `<head>` in source                                             | 1 match            |
| `<body>` in source                                             | 1 match            |
| `<meta charset="UTF-8"` in source                              | 1 match            |
| `<meta name="viewport"` in source                              | 1 match            |
| `<div id="root"></div>` in source                              | 1 match            |
| `<script type="module" src="./main.tsx"></script>` in source   | 1 match            |
| `http-equiv` in source                                         | 0 matches          |
| `bun run build` exit 0                                         | PASS               |
| `apps/figma-plugin/dist/index.html` exists                     | PASS (path adapted)|
| `<!DOCTYPE html>` in dist                                      | 1+ match           |
| `href="./styles.css"` in dist (should be 0)                    | 0 matches          |
| `src="./main.tsx"` in dist (should be 0 — inlined)             | 0 matches          |

## Commits

- `88bbc72` — fix(16-05): rewrite index.html as conformant HTML document

## BUG-05 Status: Satisfied

The source-level HTML fragment is now a conformant document. IDE HTML tooling, validators, and template consumer expectations are all satisfied. `bun run build` is green, and `vite-plugin-singlefile` continues to produce a single-file Figma plugin bundle with the DOCTYPE preserved and all assets inlined.

## Self-Check: PASSED

- packages/ui/src/index.html: FOUND (12 lines, DOCTYPE at line 1)
- apps/figma-plugin/dist/index.html: FOUND (post-build, DOCTYPE present)
- Commit 88bbc72: FOUND in git log
