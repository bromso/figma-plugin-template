---
phase: 03-build-pipeline-verification
plan: "01"
subsystem: build-pipeline
tags: [vite, vite6, sass, build, monorepo]
dependency_graph:
  requires: []
  provides:
    - working-build-pipeline
    - vite6-upgrade
  affects:
    - apps/figma-plugin/dist
tech_stack:
  added: []
  patterns:
    - "Sass custom importer for @ui/* alias resolution in @use/@forward directives"
    - "Vite 6 native ESM config loading"
key_files:
  created: []
  modified:
    - apps/figma-plugin/package.json
    - apps/figma-plugin/vite.config.ui.ts
    - bun.lock
decisions:
  - "Vite bumped to ^6.0.0 (not ^6.4.2) to remain semver-flexible while targeting v6"
  - "@vitejs/plugin-react kept at ^4.0.0 — v4.7.0 supports Vite 4-7; v6.x would require Vite 8"
  - "Sass findFileUrl importer used instead of loadPaths because @ui/* prefix cannot be stripped by loadPaths alone"
metrics:
  duration_minutes: 25
  completed_date: "2026-04-09"
  tasks_completed: 2
  files_modified: 3
---

# Phase 3 Plan 1: Build Pipeline Verification Summary

## One-Liner

Vite 5 to 6 upgrade unblocks ESM plugin loading, plus a Sass custom importer fixes `@ui/*` path alias resolution in SCSS `@use` directives.

## What Was Built

Two changes were needed to produce a working build pipeline:

1. **Vite 6 upgrade** (`apps/figma-plugin/package.json`): Changed `vite` from `^5.0.11` to `^6.0.0`. Vite 5 used a CJS config loader that could not `require()` the ESM-only `vite-plugin-react-rich-svg` package. Vite 6 uses native ESM config loading, resolving this. All other plugin versions unchanged.

2. **Sass `@ui/*` importer** (`apps/figma-plugin/vite.config.ui.ts`): Added a `findFileUrl` importer in `css.preprocessorOptions.scss.importers`. Vite's `resolve.alias` applies to JavaScript imports only — Sass `@use`/`@forward` directives bypass it entirely. The custom importer maps `@ui/*` to `packages/ui/src/*` using an absolute `file://` URL.

## Verification Results

| Check | Result |
|-------|--------|
| `bun install` exits 0, no peer dep errors | PASS |
| `bun run build` exits 0 | PASS |
| `dist/index.html` exists | PASS |
| `dist/plugin.js` exists | PASS |
| `dist/manifest.json` exists and valid JSON | PASS |
| No external `src=`/`href=` in `dist/index.html` | PASS (only inlined JS string literals) |
| `bun run dev` starts both `dev:ui-watch` and `dev:plugin-watch` | PASS |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1: Vite upgrade | `80b2245` | chore(03-01): upgrade Vite from v5 to v6 in figma-plugin app |
| Task 2: Build verification | `440a7ec` | fix(03-01): add Sass @ui alias importer to vite.config.ui.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Sass @ui path alias resolution failure**
- **Found during:** Task 2 (first build attempt)
- **Issue:** `bun run build` failed with `[sass] Can't find stylesheet to import` for `@use "@ui/styles/abstracts/variables"` in `packages/ui/src/styles/pages/_home.scss`. Vite's `resolve.alias` does not apply to Sass `@use`/`@forward` directives — they use Sass's own importer chain.
- **Fix:** Added a custom Sass `findFileUrl` importer in `vite.config.ui.ts` to resolve `@ui/*` aliases to absolute paths under `packages/ui/src/`.
- **Files modified:** `apps/figma-plugin/vite.config.ui.ts`
- **Commit:** `440a7ec`

The plan stated "The Vite configs themselves should not need changes — only the version bump should be required." This was incorrect — the Sass alias resolution was broken and required a config fix. The root cause was pre-existing: the `@ui` alias was never wired into Sass importers, and Vite 5 likely failed before reaching this point (due to the ESM load error), so it was never discovered.

## Known Stubs

None. All build outputs are fully wired and functional.

## Threat Flags

None. This was a build tooling change with no new network endpoints, auth paths, or external surface.

## Self-Check: PASSED

Files verified:
- FOUND: apps/figma-plugin/dist/index.html
- FOUND: apps/figma-plugin/dist/plugin.js
- FOUND: apps/figma-plugin/dist/manifest.json
- FOUND: apps/figma-plugin/vite.config.ui.ts

Commits verified:
- FOUND: 80b2245 (chore(03-01): upgrade Vite from v5 to v6)
- FOUND: 440a7ec (fix(03-01): add Sass @ui alias importer)
