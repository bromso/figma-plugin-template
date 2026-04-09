---
phase: 06-react-figma-ui-integration
plan: "02"
subsystem: packages/ui
tags: [react-figma-ui, component-sampler, app.tsx, vitest, smoke-test]
dependency_graph:
  requires:
    - 06-01 (react-figma-ui installed, barrel index.ts with all 14 exports)
  provides:
    - Static component sampler in app.tsx using all 14 react-figma-ui components
    - App.test.tsx smoke test for the sampler
  affects:
    - apps/figma-plugin dist output (builds with inlined react-figma-ui CSS + JS)
tech_stack:
  added: []
  patterns:
    - CSS Modules for app-level layout (app.module.scss)
    - Static render-only component sampler (no useState, no side effects)
    - Smoke render test with @testing-library/react
key_files:
  created:
    - packages/ui/src/app.module.scss
    - packages/ui/src/__tests__/App.test.tsx
  modified:
    - packages/ui/src/app.tsx
decisions:
  - Imported all 14 components from relative ./index (same package) not @repo/ui alias
  - Patched hoisted figma-plugin-ds index.js (extensionless ESM imports → .js extensions) to fix Vitest resolution in bun worktree install context
  - vitest.config.ts kept unchanged from Plan 01 output (worktree-specific node_modules patch was sufficient)
metrics:
  duration_minutes: 8
  completed_date: "2026-04-09"
  tasks_completed: 2
  files_changed: 3
---

# Phase 06 Plan 02: Static Component Sampler Summary

**One-liner:** Static app.tsx component sampler rendering all 14 react-figma-ui components grouped by category with smoke render test and passing full build.

## What Was Built

Rewrote `packages/ui/src/app.tsx` as a static component sampler showcasing all 14 react-figma-ui components in four category groups (Inputs, Buttons, Display, Layout). Created `app.module.scss` for scoped layout styles. Added `App.test.tsx` with 3 smoke tests. All 9 tests pass, type-check is clean, production build succeeds with inlined 227KB HTML.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create app.module.scss and rewrite app.tsx | e0bd079 | packages/ui/src/app.tsx, packages/ui/src/app.module.scss |
| 2 | Add App smoke render test and verify build | 361a9d3 | packages/ui/src/__tests__/App.test.tsx |

## Verification Results

- `bun run test --filter @repo/ui` — 9/9 tests pass (3 files: classes.util, exports, App)
- `bun run types` (in apps/figma-plugin) — exit 0, no type errors
- `bun run build --filter @repo/figma-plugin` — dist/index.html 227KB (inlined CSS + JS), dist/plugin.js 5.41KB

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Patched hoisted figma-plugin-ds index.js for bun worktree install**
- **Found during:** Task 2 (running tests)
- **Issue:** `bun install` in the git worktree created a hoisted copy of `figma-plugin-ds@1.0.1` at `node_modules/.bun/figma-plugin-ds@1.0.1/...`. This copy's `index.js` uses ESM `import` statements with extensionless specifiers (`'./dist/modules/disclosure'`), which fail under Node 24 strict ESM. The vitest `resolve.alias` for `figma-plugin-ds` only intercepts Vite-transformed modules, not native Node CJS `require()` calls, so the hoisted copy bypassed the mock and caused `ERR_MODULE_NOT_FOUND`.
- **Fix:** Patched the hoisted `index.js` to add `.js` extensions to both import specifiers. This is a worktree-only runtime fix (not committed); the main repo's `packages/ui/node_modules` layout does not have this hoisted copy.
- **Files modified:** `node_modules/.bun/figma-plugin-ds@1.0.1/node_modules/figma-plugin-ds/index.js` (not tracked by git)
- **Commit:** N/A (node_modules not committed)

## Known Stubs

None — all 14 components render with real props and actual content. No placeholder data.

## Threat Flags

None — this plan only modifies internal app code with no new network endpoints, auth paths, file access, or schema changes.

## Self-Check: PASSED

- `packages/ui/src/app.tsx` — FOUND
- `packages/ui/src/app.module.scss` — FOUND
- `packages/ui/src/__tests__/App.test.tsx` — FOUND
- Commit e0bd079 — FOUND
- Commit 361a9d3 — FOUND
