---
phase: 02-package-extraction
plan: "01"
subsystem: infra
tags: [turborepo, bun, monorepo, workspace, typescript]

# Dependency graph
requires:
  - phase: 01-monorepo-scaffolding
    provides: root package.json with bun workspaces config, turbo.json pipeline, apps/ and packages/ directories with .gitkeep placeholders
provides:
  - packages/common workspace package with @repo/common name, JIT exports to TypeScript source, networkSides.ts barrel
  - packages/ui workspace package with @repo/ui name, JIT exports, workspace:* dep on @repo/common
  - apps/figma-plugin workspace package with @repo/figma-plugin name, all build/dev scripts, workspace:* deps on both packages
  - All three tsconfig.json files with moduleResolution: Bundler
  - Bun workspace symlinks in consuming packages node_modules/@repo/
affects: [02-02, 03-vite-migration, 04-tooling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - JIT workspace packages (exports point to TypeScript source, no per-package build step)
    - workspace:* protocol for internal cross-package dependencies
    - moduleResolution Bundler in all package tsconfig files
    - apps/ for runnable applications, packages/ for shared libraries

key-files:
  created:
    - packages/common/package.json
    - packages/common/tsconfig.json
    - packages/common/src/index.ts
    - packages/common/src/networkSides.ts
    - packages/ui/package.json
    - packages/ui/tsconfig.json
    - packages/ui/src/index.ts
    - apps/figma-plugin/package.json
    - apps/figma-plugin/tsconfig.json
    - apps/figma-plugin/tsconfig.node.json
  modified:
    - bun.lock

key-decisions:
  - "Bun places workspace symlinks in consuming packages node_modules/@repo/ (not root) — this is expected and correct for Bun workspace resolution"
  - "packages/ui/src/index.ts barrel created without moving UI source files — that is Plan 02's responsibility"

patterns-established:
  - "JIT packages: exports field points to ./src/index.ts — no build step needed for cross-package imports"
  - "All tsconfig.json files in packages use moduleResolution: Bundler; tsconfig.node.json in apps uses Node for Vite config files"
  - "Internal deps use workspace:* protocol — resolved to local symlinks by Bun"

requirements-completed: [MONO-01, MONO-03, MONO-04, MONO-05]

# Metrics
duration: 2min
completed: 2026-04-09
---

# Phase 02 Plan 01: Package Extraction — Workspace Package Setup Summary

**Three @repo/ workspace packages created with JIT TypeScript exports and bun workspace symlinks resolving correctly**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-09T09:05:19Z
- **Completed:** 2026-04-09T09:07:40Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Created all three workspace packages (packages/common, packages/ui, apps/figma-plugin) with correct package.json and tsconfig files
- packages/common fully populated with networkSides.ts (copied verbatim from src/common/) and barrel export
- packages/ui barrel export ready for file migration in Plan 02
- apps/figma-plugin has all build/dev/types scripts matching the original root package
- bun install succeeded with workspace symlinks placed in consuming packages' local node_modules/@repo/
- All tsconfig.json files use moduleResolution: Bundler; apps/figma-plugin/tsconfig.node.json uses Node for Vite config files

## Task Commits

Each task was committed atomically:

1. **Task 1: Create package.json and tsconfig files for all three packages** - `4467b94` (feat)
2. **Task 2: Populate packages/common source and create packages/ui barrel** - `a5bf4e8` (feat)

**Plan metadata:** (pending — docs commit)

## Files Created/Modified
- `packages/common/package.json` - @repo/common package with JIT exports to ./src/index.ts, monorepo-networker dependency
- `packages/common/tsconfig.json` - TypeScript config with moduleResolution: Bundler
- `packages/common/src/networkSides.ts` - Network side definitions copied from src/common/networkSides.ts
- `packages/common/src/index.ts` - Barrel export re-exporting all of networkSides
- `packages/ui/package.json` - @repo/ui package with workspace:* dep on @repo/common, React and type dependencies
- `packages/ui/tsconfig.json` - TypeScript config with jsx: react-jsx and moduleResolution: Bundler
- `packages/ui/src/index.ts` - Barrel export for Button and classes utility (stubs pointing to future-migrated paths)
- `apps/figma-plugin/package.json` - @repo/figma-plugin with all build/dev scripts and workspace:* deps
- `apps/figma-plugin/tsconfig.json` - TypeScript config with typeRoots for @figma, moduleResolution: Bundler
- `apps/figma-plugin/tsconfig.node.json` - Separate config for Vite config files using moduleResolution: Node
- `bun.lock` - Updated lockfile with workspace package entries

## Decisions Made
- Bun places workspace symlinks in consuming packages' local node_modules/@repo/ rather than root node_modules/@repo/. This is correct and expected for Bun workspace resolution — each consumer has its own symlinks.
- packages/ui/src/index.ts barrel was created without moving UI source files — that is Plan 02's explicit responsibility.

## Deviations from Plan

None — plan executed exactly as written. The workspace symlink location (consumer node_modules vs root node_modules) is a Bun implementation detail, not a deviation from plan intent.

## Known Stubs

- `packages/ui/src/index.ts` — exports `Button` from `./components/Button` and `classes` from `./utils/classes.util`, but those source files do not yet exist in packages/ui/src/. These stubs are intentional: Plan 02-02 will move the UI source files into packages/ui/src/. The barrel is pre-created as a valid package entry point placeholder.

## Issues Encountered
None — bun install completed with exit 0, workspace symlinks verified.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- All three workspace packages exist with correct package.json, tsconfig, and bun workspace resolution
- packages/common is fully populated — Plan 02 can immediately import from @repo/common
- packages/ui barrel exists and is ready for file migration
- apps/figma-plugin has all required scripts — ready to receive migrated Vite config and source files
- Blocker: packages/ui/src/index.ts barrel exports reference files that don't yet exist (resolved in Plan 02)

---
*Phase: 02-package-extraction*
*Completed: 2026-04-09*
