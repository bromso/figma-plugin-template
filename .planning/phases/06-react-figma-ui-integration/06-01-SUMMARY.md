---
phase: 06-react-figma-ui-integration
plan: "01"
subsystem: packages/ui
tags:
  - react-figma-ui
  - component-library
  - barrel-export
  - vitest
dependency_graph:
  requires: []
  provides:
    - "@repo/ui barrel with all 14 react-figma-ui components as named exports"
    - "figma-plugin-ds CSS side-effect import in index.ts"
    - "exports smoke test for all named exports"
  affects:
    - apps/figma-plugin (consumes @repo/ui)
tech_stack:
  added:
    - react-figma-ui@1.1.0 (packages/ui dependency)
    - figma-plugin-ds@1.0.1 (transitive; explicitly installed in packages/ui)
  patterns:
    - "Barrel with CSS side-effect import as first line"
    - "Aliased re-exports for mismatched library names (Onboarding as OnboardingTip, DisclosureTip as DisclosureItem, SelectMenu as Select)"
    - "Manual __mocks__/figma-plugin-ds.js for broken ESM package under Node 24"
key_files:
  created:
    - packages/ui/src/__tests__/exports.test.ts
    - packages/ui/__mocks__/figma-plugin-ds.js
    - packages/ui/src/test/figma-plugin-ds-stub.ts
  modified:
    - packages/ui/src/index.ts (full rewrite — CSS side-effect + 15 re-export lines)
    - packages/ui/package.json (added react-figma-ui and figma-plugin-ds dependencies)
    - packages/ui/vitest.config.ts (resolve.alias + server.deps.inline for figma-plugin-ds)
    - packages/ui/src/test/setup.ts (added vi.mock for figma-plugin-ds)
  deleted:
    - packages/ui/src/components/Button.tsx
    - packages/ui/src/components/Button.module.scss
    - packages/ui/src/styles/main.scss
    - packages/ui/src/styles/abstracts/_variables.scss
    - packages/ui/src/styles/base/_base.scss
    - packages/ui/src/styles/base/_fonts.scss
    - packages/ui/src/styles/base/_typography.scss
    - packages/ui/src/styles/pages/_home.scss
    - packages/ui/src/styles/vendors/_normalize.scss
    - packages/ui/src/__tests__/Button.test.tsx
decisions:
  - "Explicitly install figma-plugin-ds in packages/ui even though it is a transitive dependency of react-figma-ui — bun does not hoist it to project node_modules in this workspace configuration"
  - "Use __mocks__/figma-plugin-ds.js + vitest resolve.alias + server.deps.inline to work around figma-plugin-ds/index.js using ESM bare imports without .js extension, which fail under Node 24 strict ESM"
  - "Create extension-less symlinks (disclosure, selectMenu) in the bun local cache dist/modules/ directory so Node ESM can resolve them when the module is loaded via non-aliased path"
metrics:
  duration_seconds: 5267
  duration_human: "~88 minutes"
  completed_date: "2026-04-09"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 4
  files_deleted: 10
---

# Phase 6 Plan 01: react-figma-ui Barrel Install Summary

**One-liner:** Replaced custom Button with react-figma-ui barrel exporting all 14 Figma-native components with aliased names (OnboardingTip, DisclosureItem, Select) and figma-plugin-ds CSS side-effect import.

## What Was Built

The `packages/ui` package now re-exports all 14 react-figma-ui components as named exports from `@repo/ui`, with `figma-plugin-ds/dist/figma-plugin-ds.css` loaded as a side-effect import on the first line of `index.ts`. The old custom `Button.tsx`, `Button.module.scss`, and all SCSS demo partials (9 files) were deleted. The old `Button.test.tsx` was replaced with an exports smoke test that confirms all 14 components, `SelectMenuOption`, and the `classes` utility are defined.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install react-figma-ui and rewrite barrel with CSS + all 14 re-exports | 07aaa00 | packages/ui/package.json, packages/ui/src/index.ts, bun.lock |
| 2 | Delete old custom files and create exports smoke test | 43d17e6 | 18 files (10 deleted, 3 created, 5 modified) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] figma-plugin-ds not hoisted to project node_modules**

- **Found during:** Task 2 — first test run after creating exports.test.ts
- **Issue:** `bun add react-figma-ui` does not hoist `figma-plugin-ds` (a dependency of `react-figma-ui`) to the project-level `node_modules`. Vitest could not resolve `figma-plugin-ds/dist/figma-plugin-ds.css` from `packages/ui/src/index.ts`.
- **Fix:** Explicitly ran `bun add figma-plugin-ds` inside `packages/ui/` to install it as a direct dependency.
- **Files modified:** `packages/ui/package.json`, `bun.lock`
- **Commit:** 43d17e6

**2. [Rule 3 - Blocking] figma-plugin-ds/index.js uses ESM bare imports without .js extension — broken under Node 24 strict ESM**

- **Found during:** Task 2 — second test run after explicit figma-plugin-ds install
- **Issue:** `figma-plugin-ds/index.js` uses `import disclosure from './dist/modules/disclosure'` without a `.js` extension. Node 24 strict ESM requires explicit extensions. When `react-figma-ui`'s CJS bundle calls `require("figma-plugin-ds")`, Node's require-of-ESM path triggered and failed to resolve the bare import.
- **Fix (layered):**
  1. Added `packages/ui/__mocks__/figma-plugin-ds.js` manual mock stub
  2. Configured `vitest.config.ts` with `resolve.alias` (regex match on `figma-plugin-ds`) pointing to the stub, plus CSS subpath alias pointing to the real CSS file
  3. Added `server.deps.inline: ["react-figma-ui"]` so Vite transforms the CJS bundle and alias applies
  4. Added `vi.mock("figma-plugin-ds", ...)` in `setup.ts`
  5. Created extension-less symlinks (`disclosure`, `selectMenu`) in the bun project-local cache `node_modules/.bun/figma-plugin-ds@1.0.1/.../dist/modules/` so Node ESM can resolve them for any non-aliased load path
- **Files modified:** `packages/ui/vitest.config.ts`, `packages/ui/src/test/setup.ts`
- **Files created:** `packages/ui/__mocks__/figma-plugin-ds.js`, `packages/ui/src/test/figma-plugin-ds-stub.ts`
- **Commit:** 43d17e6

## Known Stubs

None — all 14 component exports are live re-exports from react-figma-ui with no placeholder values.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes. Two npm packages installed (react-figma-ui, figma-plugin-ds) as documented in the plan's threat model (T-06-01, T-06-02 both accepted).

## Verification Results

All plan verifications pass:

1. `bun run test` (packages/ui) — 2 test files, 6 tests, all green
2. `grep -c "from 'react-figma-ui'" packages/ui/src/index.ts` — returns 15
3. `test ! -d packages/ui/src/components && test ! -d packages/ui/src/styles` — both directories gone

## Self-Check: PASSED

- FOUND: packages/ui/src/index.ts
- FOUND: packages/ui/src/__tests__/exports.test.ts
- FOUND: packages/ui/__mocks__/figma-plugin-ds.js
- CONFIRMED DELETED: packages/ui/src/components/Button.tsx
- CONFIRMED DELETED: packages/ui/src/styles/
- FOUND commit: 07aaa00 (Task 1)
- FOUND commit: 43d17e6 (Task 2)
