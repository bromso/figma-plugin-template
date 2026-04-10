---
phase: 10-vite-8-typescript-6-figma-typings
plan: "01"
subsystem: build-toolchain
tags: [vite, typescript, figma-typings, dependency-upgrade, rolldown]
dependency_graph:
  requires: []
  provides: [vite-8, typescript-6, figma-typings-1124, types-node-24]
  affects: [apps/figma-plugin]
tech_stack:
  added: []
  patterns: [rolldownOptions, explicit-types-array, per-workspace-typeRoots]
key_files:
  created:
    - apps/figma-plugin/postcss-url.d.ts
  modified:
    - apps/figma-plugin/package.json
    - apps/figma-plugin/vite.config.plugin.ts
    - apps/figma-plugin/vite.config.ui.ts
    - apps/figma-plugin/tsconfig.json
    - apps/figma-plugin/tsconfig.node.json
    - bun.lock
decisions:
  - "Added plugin-typings to types array: with TS6 explicit types default, @figma/plugin-typings globals require types: ['node', 'plugin-typings'] — typeRoots alone no longer auto-includes when types is explicit"
  - "Added ./node_modules/@types to typeRoots: Bun installs @types/node per-workspace, not at root, so typeRoots must include local path"
  - "Added postcss-url.d.ts ambient shim: postcss-url has no @types package and moduleResolution:bundler in tsconfig.node.json requires explicit declaration for implicit-any module"
metrics:
  duration_minutes: 3
  completed_date: "2026-04-09"
  tasks_completed: 3
  files_changed: 6
---

# Phase 10 Plan 01: Vite 8 + TypeScript 6 + Figma Typings Upgrade Summary

**One-liner:** Upgraded apps/figma-plugin to Vite 8.0.8 with rolldownOptions, TypeScript 6.0.2 with explicit types arrays, @figma/plugin-typings 1.124.0, @vitejs/plugin-react 6.0.1, and @types/node 24 — build and type-check pass clean.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Upgrade dependency versions in package.json and install | aa15df6 | apps/figma-plugin/package.json, bun.lock |
| 2 | Update Vite configs to use rolldownOptions | fad2ea6 | vite.config.plugin.ts, vite.config.ui.ts |
| 3 | Update tsconfigs for TypeScript 6 compatibility | 639eb6d | tsconfig.json, tsconfig.node.json, postcss-url.d.ts |

## Verification Results

- `bun run --filter @repo/figma-plugin build` — exits 0, produces dist/plugin.js, dist/index.html, dist/manifest.json
- `bun run --filter @repo/figma-plugin types` — exits 0, no type errors
- `bun run test` (from main repo) — 11/11 tests pass (2 common + 9 UI)
- Storybook Vite still at 6.4.2 (unaffected — per-workspace install)
- Vite 8 deprecation warnings: only `inlineDynamicImports` from vite-plugin-singlefile internals (not from our rolldownOptions change; pre-existing plugin behavior)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added ./node_modules/@types to typeRoots for @types/node resolution**
- **Found during:** Task 3
- **Issue:** `@types/node` is installed in `apps/figma-plugin/node_modules/@types/` by Bun (per-workspace), but the original `typeRoots` only listed `../../node_modules/@types` (root). TypeScript could not find `node` type reference.
- **Fix:** Added `"./node_modules/@types"` as second entry in `typeRoots` array.
- **Files modified:** apps/figma-plugin/tsconfig.json
- **Commit:** 639eb6d

**2. [Rule 1 - Bug] Added "plugin-typings" to types array for Figma globals**
- **Found during:** Task 3
- **Issue:** With TypeScript 6's new explicit `types` default, setting `"types": ["node"]` caused `typeRoots` auto-discovery to stop. The `@figma/plugin-typings` globals (`figma`, `MessageEventHandler`, `__html__`) were no longer loaded.
- **Fix:** Changed `"types": ["node"]` to `"types": ["node", "plugin-typings"]`. TypeScript finds `plugin-typings` via the `./node_modules/@figma` typeRoot entry.
- **Files modified:** apps/figma-plugin/tsconfig.json
- **Commit:** 639eb6d

**3. [Rule 2 - Missing type declaration] Added postcss-url.d.ts ambient module shim**
- **Found during:** Task 3 (tsconfig.node.json check)
- **Issue:** `postcss-url` has no `@types/postcss-url` package and ships no TypeScript declarations. With `"moduleResolution": "bundler"` in tsconfig.node.json, `import postcssUrl from "postcss-url"` in vite.config.ui.ts fails type-checking with TS7016.
- **Fix:** Created `apps/figma-plugin/postcss-url.d.ts` with `declare module "postcss-url"`.
- **Files modified:** apps/figma-plugin/postcss-url.d.ts (created)
- **Commit:** 639eb6d

## Known Stubs

None — all changes are dependency version bumps and configuration updates. No placeholder data.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes. The only security-relevant change is `bun.lock` update pinning new package hashes (T-10-01 mitigated per threat model).

## Self-Check: PASSED
